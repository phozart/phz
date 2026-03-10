/**
 * @phozart/phz-engine — Expression Compiler
 *
 * Compiles ExpressionNode ASTs into JS closure functions for fast evaluation.
 * Compiled functions avoid tree traversal overhead, yielding 5-10x speedup
 * for row-level evaluation over large datasets.
 *
 * Maintains identical SQL-style null propagation semantics as the tree-walk evaluator.
 */
// --- Helpers (shared with evaluator, inlined for closure performance) ---
function toNumber(val) {
    if (val === null || val === undefined)
        return null;
    if (typeof val === 'number')
        return isNaN(val) ? null : val;
    if (typeof val === 'string') {
        const n = Number(val);
        return isNaN(n) ? null : n;
    }
    if (typeof val === 'boolean')
        return val ? 1 : 0;
    return null;
}
function toBool(val) {
    if (val === null || val === undefined)
        return false;
    if (typeof val === 'boolean')
        return val;
    if (typeof val === 'number')
        return val !== 0;
    if (typeof val === 'string')
        return val.length > 0;
    return true;
}
function toDate(val) {
    if (val === null || val === undefined)
        return null;
    if (val instanceof Date)
        return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
// --- Depth limit ---
const MAX_AST_DEPTH = 100;
function checkDepth(depth) {
    if (depth > MAX_AST_DEPTH) {
        throw new Error(`Expression AST exceeds maximum depth of ${MAX_AST_DEPTH}. ` +
            `Simplify the expression or break it into calculated fields.`);
    }
}
// --- Compiler: Row-level ---
function compileNode(node, depth = 0) {
    checkDepth(depth);
    switch (node.kind) {
        case 'literal': {
            const v = node.value;
            return () => v;
        }
        case 'field_ref': {
            const name = node.fieldName;
            return (ctx) => ctx.row[name] ?? null;
        }
        case 'param_ref': {
            const id = node.parameterId;
            return (ctx) => ctx.params[id] ?? null;
        }
        case 'metric_ref': {
            // metric_ref in row context always returns null
            return () => null;
        }
        case 'calc_ref': {
            const id = node.calculatedFieldId;
            return (ctx) => ctx.calculatedValues[id] ?? null;
        }
        case 'unary_op': {
            const operandFn = compileNode(node.operand, depth + 1);
            if (node.operator === 'negate') {
                return (ctx) => {
                    const operand = operandFn(ctx);
                    if (operand === null)
                        return null;
                    return typeof operand === 'number' ? -operand : null;
                };
            }
            // 'not'
            return (ctx) => !toBool(operandFn(ctx));
        }
        case 'binary_op':
            return compileBinaryOp(node.operator, node.left, node.right, depth + 1);
        case 'conditional': {
            const condFn = compileNode(node.condition, depth + 1);
            const thenFn = compileNode(node.thenBranch, depth + 1);
            const elseFn = compileNode(node.elseBranch, depth + 1);
            return (ctx) => toBool(condFn(ctx)) ? thenFn(ctx) : elseFn(ctx);
        }
        case 'function_call':
            return compileFunction(node.functionName, node.args, depth + 1);
        case 'null_check': {
            const operandFn = compileNode(node.operand, depth + 1);
            const isNull = node.isNull;
            return (ctx) => {
                const val = operandFn(ctx);
                const isNullVal = val === null || val === undefined;
                return isNull ? isNullVal : !isNullVal;
            };
        }
        default:
            return () => null;
    }
}
// --- Binary Op Compiler ---
function compileBinaryOp(op, leftNode, rightNode, depth = 0) {
    const leftFn = compileNode(leftNode, depth);
    const rightFn = compileNode(rightNode, depth);
    if (op === 'and') {
        return (ctx) => {
            const left = leftFn(ctx);
            if (!toBool(left))
                return false;
            return toBool(rightFn(ctx));
        };
    }
    if (op === 'or') {
        return (ctx) => {
            const left = leftFn(ctx);
            if (toBool(left))
                return true;
            return toBool(rightFn(ctx));
        };
    }
    if (op === 'concat') {
        return (ctx) => {
            const left = leftFn(ctx);
            const right = rightFn(ctx);
            if (left === null || right === null)
                return null;
            return String(left) + String(right);
        };
    }
    if (op === 'eq') {
        return (ctx) => {
            const left = leftFn(ctx);
            const right = rightFn(ctx);
            return left === right;
        };
    }
    if (op === 'neq') {
        return (ctx) => {
            const left = leftFn(ctx);
            const right = rightFn(ctx);
            return left !== right;
        };
    }
    // Arithmetic + remaining comparisons: null propagation
    return (ctx) => {
        const left = leftFn(ctx);
        const right = rightFn(ctx);
        if (left === null || right === null)
            return null;
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        switch (op) {
            case '+':
                return leftNum !== null && rightNum !== null ? leftNum + rightNum : null;
            case '-':
                return leftNum !== null && rightNum !== null ? leftNum - rightNum : null;
            case '*':
                return leftNum !== null && rightNum !== null ? leftNum * rightNum : null;
            case '/':
                if (leftNum !== null && rightNum !== null) {
                    return rightNum === 0 ? null : leftNum / rightNum;
                }
                return null;
            case '%':
                if (leftNum !== null && rightNum !== null) {
                    return rightNum === 0 ? null : leftNum % rightNum;
                }
                return null;
            case '^':
                return leftNum !== null && rightNum !== null ? Math.pow(leftNum, rightNum) : null;
            case 'gt':
                return leftNum !== null && rightNum !== null ? leftNum > rightNum : null;
            case 'gte':
                return leftNum !== null && rightNum !== null ? leftNum >= rightNum : null;
            case 'lt':
                return leftNum !== null && rightNum !== null ? leftNum < rightNum : null;
            case 'lte':
                return leftNum !== null && rightNum !== null ? leftNum <= rightNum : null;
            default:
                return null;
        }
    };
}
// --- Function Compiler ---
function compileFunction(name, argNodes, depth = 0) {
    const argFns = argNodes.map(a => compileNode(a, depth));
    switch (name) {
        case 'ABS':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                return v !== null ? Math.abs(v) : null;
            };
        case 'ROUND':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                const decimals = argFns[1] ? toNumber(argFns[1](ctx)) ?? 0 : 0;
                if (v === null)
                    return null;
                const factor = Math.pow(10, decimals);
                return Math.round(v * factor) / factor;
            };
        case 'FLOOR':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                return v !== null ? Math.floor(v) : null;
            };
        case 'CEIL':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                return v !== null ? Math.ceil(v) : null;
            };
        case 'UPPER':
            return (ctx) => {
                const a = argFns[0](ctx);
                return a !== null && a !== undefined ? String(a).toUpperCase() : null;
            };
        case 'LOWER':
            return (ctx) => {
                const a = argFns[0](ctx);
                return a !== null && a !== undefined ? String(a).toLowerCase() : null;
            };
        case 'TRIM':
            return (ctx) => {
                const a = argFns[0](ctx);
                return a !== null && a !== undefined ? String(a).trim() : null;
            };
        case 'LEN':
            return (ctx) => {
                const a = argFns[0](ctx);
                return a !== null && a !== undefined ? String(a).length : null;
            };
        case 'SUBSTR':
            return (ctx) => {
                const a = argFns[0](ctx);
                if (a === null || a === undefined)
                    return null;
                const str = String(a);
                const start = toNumber(argFns[1](ctx)) ?? 0;
                const len = argFns[2] ? toNumber(argFns[2](ctx)) : null;
                return len !== null ? str.substring(start, start + len) : str.substring(start);
            };
        case 'CONCAT':
            return (ctx) => argFns.map(fn => {
                const a = fn(ctx);
                return a !== null && a !== undefined ? String(a) : '';
            }).join('');
        case 'YEAR':
            return (ctx) => {
                const d = toDate(argFns[0](ctx));
                return d ? d.getFullYear() : null;
            };
        case 'MONTH':
            return (ctx) => {
                const d = toDate(argFns[0](ctx));
                return d ? d.getMonth() + 1 : null;
            };
        case 'DAY':
            return (ctx) => {
                const d = toDate(argFns[0](ctx));
                return d ? d.getDate() : null;
            };
        case 'COALESCE':
            return (ctx) => {
                for (const fn of argFns) {
                    const a = fn(ctx);
                    if (a !== null && a !== undefined)
                        return a;
                }
                return null;
            };
        case 'IF':
            return (ctx) => toBool(argFns[0](ctx)) ? argFns[1](ctx) : (argFns[2] ? argFns[2](ctx) : null);
        case 'CLAMP':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                const min = toNumber(argFns[1](ctx));
                const max = toNumber(argFns[2](ctx));
                if (v === null || min === null || max === null)
                    return null;
                return Math.max(min, Math.min(max, v));
            };
        default:
            return () => null;
    }
}
// --- Metric-level Compiler ---
function compileMetricNode(node, depth = 0) {
    checkDepth(depth);
    switch (node.kind) {
        case 'literal': {
            const v = node.value;
            return () => v;
        }
        case 'field_ref':
            return () => null;
        case 'param_ref': {
            const id = node.parameterId;
            return (ctx) => ctx.params[id] ?? null;
        }
        case 'metric_ref': {
            const id = node.metricId;
            return (ctx) => ctx.metricValues[id] ?? null;
        }
        case 'calc_ref':
            return () => null;
        case 'unary_op': {
            const operandFn = compileMetricNode(node.operand, depth + 1);
            if (node.operator === 'negate') {
                return (ctx) => {
                    const operand = operandFn(ctx);
                    if (operand === null)
                        return null;
                    return typeof operand === 'number' ? -operand : null;
                };
            }
            return (ctx) => !toBool(operandFn(ctx));
        }
        case 'binary_op':
            return compileMetricBinaryOp(node.operator, node.left, node.right, depth + 1);
        case 'conditional': {
            const condFn = compileMetricNode(node.condition, depth + 1);
            const thenFn = compileMetricNode(node.thenBranch, depth + 1);
            const elseFn = compileMetricNode(node.elseBranch, depth + 1);
            return (ctx) => toBool(condFn(ctx)) ? thenFn(ctx) : elseFn(ctx);
        }
        case 'function_call':
            return compileMetricFunction(node.functionName, node.args, depth + 1);
        case 'null_check': {
            const operandFn = compileMetricNode(node.operand, depth + 1);
            const isNull = node.isNull;
            return (ctx) => {
                const val = operandFn(ctx);
                const isNullVal = val === null || val === undefined;
                return isNull ? isNullVal : !isNullVal;
            };
        }
        default:
            return () => null;
    }
}
function compileMetricBinaryOp(op, leftNode, rightNode, depth = 0) {
    const leftFn = compileMetricNode(leftNode, depth);
    const rightFn = compileMetricNode(rightNode, depth);
    if (op === 'and') {
        return (ctx) => {
            if (!toBool(leftFn(ctx)))
                return false;
            return toBool(rightFn(ctx));
        };
    }
    if (op === 'or') {
        return (ctx) => {
            if (toBool(leftFn(ctx)))
                return true;
            return toBool(rightFn(ctx));
        };
    }
    if (op === 'concat') {
        return (ctx) => {
            const left = leftFn(ctx);
            const right = rightFn(ctx);
            if (left === null || right === null)
                return null;
            return String(left) + String(right);
        };
    }
    if (op === 'eq') {
        return (ctx) => leftFn(ctx) === rightFn(ctx);
    }
    if (op === 'neq') {
        return (ctx) => leftFn(ctx) !== rightFn(ctx);
    }
    return (ctx) => {
        const left = leftFn(ctx);
        const right = rightFn(ctx);
        if (left === null || right === null)
            return null;
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        switch (op) {
            case '+': return leftNum !== null && rightNum !== null ? leftNum + rightNum : null;
            case '-': return leftNum !== null && rightNum !== null ? leftNum - rightNum : null;
            case '*': return leftNum !== null && rightNum !== null ? leftNum * rightNum : null;
            case '/':
                if (leftNum !== null && rightNum !== null)
                    return rightNum === 0 ? null : leftNum / rightNum;
                return null;
            case '%':
                if (leftNum !== null && rightNum !== null)
                    return rightNum === 0 ? null : leftNum % rightNum;
                return null;
            case '^': return leftNum !== null && rightNum !== null ? Math.pow(leftNum, rightNum) : null;
            case 'gt': return leftNum !== null && rightNum !== null ? leftNum > rightNum : null;
            case 'gte': return leftNum !== null && rightNum !== null ? leftNum >= rightNum : null;
            case 'lt': return leftNum !== null && rightNum !== null ? leftNum < rightNum : null;
            case 'lte': return leftNum !== null && rightNum !== null ? leftNum <= rightNum : null;
            default: return null;
        }
    };
}
function compileMetricFunction(name, argNodes, depth = 0) {
    const argFns = argNodes.map(a => compileMetricNode(a, depth));
    switch (name) {
        case 'ABS': return (ctx) => { const v = toNumber(argFns[0](ctx)); return v !== null ? Math.abs(v) : null; };
        case 'ROUND': return (ctx) => { const v = toNumber(argFns[0](ctx)); const d = argFns[1] ? toNumber(argFns[1](ctx)) ?? 0 : 0; if (v === null)
            return null; const f = Math.pow(10, d); return Math.round(v * f) / f; };
        case 'FLOOR': return (ctx) => { const v = toNumber(argFns[0](ctx)); return v !== null ? Math.floor(v) : null; };
        case 'CEIL': return (ctx) => { const v = toNumber(argFns[0](ctx)); return v !== null ? Math.ceil(v) : null; };
        case 'UPPER': return (ctx) => { const a = argFns[0](ctx); return a !== null && a !== undefined ? String(a).toUpperCase() : null; };
        case 'LOWER': return (ctx) => { const a = argFns[0](ctx); return a !== null && a !== undefined ? String(a).toLowerCase() : null; };
        case 'TRIM': return (ctx) => { const a = argFns[0](ctx); return a !== null && a !== undefined ? String(a).trim() : null; };
        case 'LEN': return (ctx) => { const a = argFns[0](ctx); return a !== null && a !== undefined ? String(a).length : null; };
        case 'SUBSTR': return (ctx) => { const a = argFns[0](ctx); if (a === null || a === undefined)
            return null; const s = String(a); const st = toNumber(argFns[1](ctx)) ?? 0; const l = argFns[2] ? toNumber(argFns[2](ctx)) : null; return l !== null ? s.substring(st, st + l) : s.substring(st); };
        case 'CONCAT': return (ctx) => argFns.map(fn => { const a = fn(ctx); return a !== null && a !== undefined ? String(a) : ''; }).join('');
        case 'YEAR': return (ctx) => { const d = toDate(argFns[0](ctx)); return d ? d.getFullYear() : null; };
        case 'MONTH': return (ctx) => { const d = toDate(argFns[0](ctx)); return d ? d.getMonth() + 1 : null; };
        case 'DAY': return (ctx) => { const d = toDate(argFns[0](ctx)); return d ? d.getDate() : null; };
        case 'COALESCE': return (ctx) => { for (const fn of argFns) {
            const a = fn(ctx);
            if (a !== null && a !== undefined)
                return a;
        } return null; };
        case 'IF': return (ctx) => toBool(argFns[0](ctx)) ? argFns[1](ctx) : (argFns[2] ? argFns[2](ctx) : null);
        case 'CLAMP': return (ctx) => { const v = toNumber(argFns[0](ctx)); const mn = toNumber(argFns[1](ctx)); const mx = toNumber(argFns[2](ctx)); if (v === null || mn === null || mx === null)
            return null; return Math.max(mn, Math.min(mx, v)); };
        default: return () => null;
    }
}
// --- Public API ---
/**
 * Compile a row-level expression AST into a reusable closure.
 * The returned function evaluates the expression without tree traversal.
 */
export function compileRowExpression(ast) {
    return compileNode(ast);
}
/**
 * Compile a metric-level expression AST into a reusable closure.
 * The returned function coerces the result to number | null.
 */
export function compileMetricExpression(ast) {
    const fn = compileMetricNode(ast);
    return (ctx) => {
        const result = fn(ctx);
        if (result === null || result === undefined)
            return null;
        if (typeof result === 'number')
            return result;
        if (typeof result === 'string') {
            const n = Number(result);
            return isNaN(n) ? null : n;
        }
        return null;
    };
}
//# sourceMappingURL=expression-compiler.js.map