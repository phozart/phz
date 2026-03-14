/**
 * @phozart/engine — Expression Compiler
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
        // New math
        case 'SQRT':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                if (v === null || v < 0)
                    return null;
                return Math.sqrt(v);
            };
        case 'POWER':
            return (ctx) => {
                const base = toNumber(argFns[0](ctx));
                const exp = toNumber(argFns[1](ctx));
                if (base === null || exp === null)
                    return null;
                return Math.pow(base, exp);
            };
        case 'MOD':
            return (ctx) => {
                const a = toNumber(argFns[0](ctx));
                const b = toNumber(argFns[1](ctx));
                if (a === null || b === null || b === 0)
                    return null;
                return a % b;
            };
        case 'LOG':
            return (ctx) => {
                if (argFns.length === 1) {
                    const v = toNumber(argFns[0](ctx));
                    if (v === null || v <= 0)
                        return null;
                    return Math.log(v);
                }
                const base = toNumber(argFns[0](ctx));
                const val = toNumber(argFns[1](ctx));
                if (base === null || val === null || base <= 0 || val <= 0 || base === 1)
                    return null;
                return Math.log(val) / Math.log(base);
            };
        case 'EXP':
            return (ctx) => {
                const v = toNumber(argFns[0](ctx));
                if (v === null)
                    return null;
                return Math.exp(v);
            };
        // New string
        case 'LEFT':
            return (ctx) => {
                const s = argFns[0](ctx);
                if (s === null || s === undefined)
                    return null;
                const n = toNumber(argFns[1](ctx));
                if (n === null)
                    return null;
                return String(s).substring(0, n);
            };
        case 'RIGHT':
            return (ctx) => {
                const s = argFns[0](ctx);
                if (s === null || s === undefined)
                    return null;
                const n = toNumber(argFns[1](ctx));
                if (n === null)
                    return null;
                return String(s).slice(-n);
            };
        case 'REPLACE':
            return (ctx) => {
                const s = argFns[0](ctx);
                if (s === null || s === undefined)
                    return null;
                const search = argFns[1](ctx);
                const replacement = argFns[2](ctx);
                if (search === null || search === undefined)
                    return null;
                return String(s).replaceAll(String(search), String(replacement ?? ''));
            };
        case 'REPEAT':
            return (ctx) => {
                const s = argFns[0](ctx);
                if (s === null || s === undefined)
                    return null;
                const n = toNumber(argFns[1](ctx));
                if (n === null || n < 0)
                    return null;
                return String(s).repeat(n);
            };
        // New date
        case 'DATE_DIFF':
            return (ctx) => {
                const unit = argFns[0](ctx);
                const start = toDate(argFns[1](ctx));
                const end = toDate(argFns[2](ctx));
                if (!unit || !start || !end)
                    return null;
                const diffMs = end.getTime() - start.getTime();
                const unitStr = String(unit).toLowerCase();
                switch (unitStr) {
                    case 'day': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    case 'hour': return Math.floor(diffMs / (1000 * 60 * 60));
                    case 'minute': return Math.floor(diffMs / (1000 * 60));
                    case 'month': return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                    case 'year': return end.getFullYear() - start.getFullYear();
                    default: return null;
                }
            };
        case 'DATE_ADD':
            return (ctx) => {
                const unit = argFns[0](ctx);
                const amount = toNumber(argFns[1](ctx));
                const date = toDate(argFns[2](ctx));
                if (!unit || amount === null || !date)
                    return null;
                const result = new Date(date.getTime());
                const unitStr = String(unit).toLowerCase();
                switch (unitStr) {
                    case 'day':
                        result.setDate(result.getDate() + amount);
                        break;
                    case 'month':
                        result.setMonth(result.getMonth() + amount);
                        break;
                    case 'year':
                        result.setFullYear(result.getFullYear() + amount);
                        break;
                    case 'hour':
                        result.setHours(result.getHours() + amount);
                        break;
                    case 'minute':
                        result.setMinutes(result.getMinutes() + amount);
                        break;
                    default: return null;
                }
                return result;
            };
        case 'FORMAT_DATE':
            return (ctx) => {
                const fmt = argFns[0](ctx);
                const date = toDate(argFns[1](ctx));
                if (!fmt || !date)
                    return null;
                let result = String(fmt);
                result = result.replace('YYYY', String(date.getFullYear()));
                result = result.replace('MM', String(date.getMonth() + 1).padStart(2, '0'));
                result = result.replace('DD', String(date.getDate()).padStart(2, '0'));
                result = result.replace('HH', String(date.getHours()).padStart(2, '0'));
                result = result.replace('mm', String(date.getMinutes()).padStart(2, '0'));
                result = result.replace('ss', String(date.getSeconds()).padStart(2, '0'));
                return result;
            };
        // Statistical (row-level returns null — these are aggregate functions)
        case 'STDDEV':
        case 'VARIANCE':
        case 'PERCENTILE':
            return () => null;
        // Window — RANK: compare value against population
        case 'RANK':
            return (ctx) => {
                if (argFns.length < 2)
                    return null;
                const val = toNumber(argFns[0](ctx));
                if (val === null)
                    return null;
                const population = argFns.slice(1).map(fn => toNumber(fn(ctx))).filter((v) => v !== null);
                const sorted = [...population].sort((a, b) => b - a);
                const idx = sorted.indexOf(val);
                return idx === -1 ? null : idx + 1;
            };
        case 'DENSE_RANK':
            return (ctx) => {
                if (argFns.length < 2)
                    return null;
                const val = toNumber(argFns[0](ctx));
                if (val === null)
                    return null;
                const population = argFns.slice(1).map(fn => toNumber(fn(ctx))).filter((v) => v !== null);
                const unique = [...new Set(population)].sort((a, b) => b - a);
                const idx = unique.indexOf(val);
                return idx === -1 ? null : idx + 1;
            };
        case 'LAG':
            return (ctx) => {
                const arr = argFns[0](ctx);
                const offset = toNumber(argFns[1](ctx));
                const defaultVal = argFns[2] ? argFns[2](ctx) : null;
                if (!Array.isArray(arr) || offset === null)
                    return defaultVal;
                const idx = arr.length - 1 - offset;
                return idx >= 0 && idx < arr.length ? arr[idx] : defaultVal;
            };
        case 'LEAD':
            return (ctx) => {
                const arr = argFns[0](ctx);
                const offset = toNumber(argFns[1](ctx));
                const defaultVal = argFns[2] ? argFns[2](ctx) : null;
                if (!Array.isArray(arr) || offset === null)
                    return defaultVal;
                const idx = arr.length - 1 + offset;
                return idx >= 0 && idx < arr.length ? arr[idx] : defaultVal;
            };
        case 'RUNNING_SUM':
            return (ctx) => {
                let sum = 0;
                for (const fn of argFns) {
                    const v = toNumber(fn(ctx));
                    if (v !== null)
                        sum += v;
                }
                return sum;
            };
        case 'NTILE':
            return (ctx) => {
                const n = toNumber(argFns[0](ctx));
                const val = toNumber(argFns[1](ctx));
                if (n === null || val === null || n <= 0)
                    return null;
                // NTILE returns which bucket (1-based) the value falls into
                // Assuming value is 0-1 normalized (like a percentile)
                const bucket = Math.ceil(val * n);
                return Math.max(1, Math.min(n, bucket));
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
        // New math
        case 'SQRT': return (ctx) => { const v = toNumber(argFns[0](ctx)); if (v === null || v < 0)
            return null; return Math.sqrt(v); };
        case 'POWER': return (ctx) => { const b = toNumber(argFns[0](ctx)); const e = toNumber(argFns[1](ctx)); if (b === null || e === null)
            return null; return Math.pow(b, e); };
        case 'MOD': return (ctx) => { const a = toNumber(argFns[0](ctx)); const b = toNumber(argFns[1](ctx)); if (a === null || b === null || b === 0)
            return null; return a % b; };
        case 'LOG': return (ctx) => { if (argFns.length === 1) {
            const v = toNumber(argFns[0](ctx));
            if (v === null || v <= 0)
                return null;
            return Math.log(v);
        } const base = toNumber(argFns[0](ctx)); const val = toNumber(argFns[1](ctx)); if (base === null || val === null || base <= 0 || val <= 0 || base === 1)
            return null; return Math.log(val) / Math.log(base); };
        case 'EXP': return (ctx) => { const v = toNumber(argFns[0](ctx)); if (v === null)
            return null; return Math.exp(v); };
        // New string
        case 'LEFT': return (ctx) => { const s = argFns[0](ctx); if (s === null || s === undefined)
            return null; const n = toNumber(argFns[1](ctx)); if (n === null)
            return null; return String(s).substring(0, n); };
        case 'RIGHT': return (ctx) => { const s = argFns[0](ctx); if (s === null || s === undefined)
            return null; const n = toNumber(argFns[1](ctx)); if (n === null)
            return null; return String(s).slice(-n); };
        case 'REPLACE': return (ctx) => { const s = argFns[0](ctx); if (s === null || s === undefined)
            return null; const search = argFns[1](ctx); const repl = argFns[2](ctx); if (search === null || search === undefined)
            return null; return String(s).replaceAll(String(search), String(repl ?? '')); };
        case 'REPEAT': return (ctx) => { const s = argFns[0](ctx); if (s === null || s === undefined)
            return null; const n = toNumber(argFns[1](ctx)); if (n === null || n < 0)
            return null; return String(s).repeat(n); };
        // New date
        case 'DATE_DIFF': return (ctx) => { const unit = argFns[0](ctx); const start = toDate(argFns[1](ctx)); const end = toDate(argFns[2](ctx)); if (!unit || !start || !end)
            return null; const ms = end.getTime() - start.getTime(); const u = String(unit).toLowerCase(); switch (u) {
            case 'day': return Math.floor(ms / 86400000);
            case 'hour': return Math.floor(ms / 3600000);
            case 'minute': return Math.floor(ms / 60000);
            case 'month': return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            case 'year': return end.getFullYear() - start.getFullYear();
            default: return null;
        } };
        case 'DATE_ADD': return (ctx) => { const unit = argFns[0](ctx); const amount = toNumber(argFns[1](ctx)); const date = toDate(argFns[2](ctx)); if (!unit || amount === null || !date)
            return null; const r = new Date(date.getTime()); const u = String(unit).toLowerCase(); switch (u) {
            case 'day':
                r.setDate(r.getDate() + amount);
                break;
            case 'month':
                r.setMonth(r.getMonth() + amount);
                break;
            case 'year':
                r.setFullYear(r.getFullYear() + amount);
                break;
            case 'hour':
                r.setHours(r.getHours() + amount);
                break;
            case 'minute':
                r.setMinutes(r.getMinutes() + amount);
                break;
            default: return null;
        } return r; };
        case 'FORMAT_DATE': return (ctx) => { const fmt = argFns[0](ctx); const date = toDate(argFns[1](ctx)); if (!fmt || !date)
            return null; let r = String(fmt); r = r.replace('YYYY', String(date.getFullYear())); r = r.replace('MM', String(date.getMonth() + 1).padStart(2, '0')); r = r.replace('DD', String(date.getDate()).padStart(2, '0')); r = r.replace('HH', String(date.getHours()).padStart(2, '0')); r = r.replace('mm', String(date.getMinutes()).padStart(2, '0')); r = r.replace('ss', String(date.getSeconds()).padStart(2, '0')); return r; };
        // Statistical (metric-level returns null — aggregate)
        case 'STDDEV': return () => null;
        case 'VARIANCE': return () => null;
        case 'PERCENTILE': return () => null;
        // Window
        case 'RANK': return (ctx) => { if (argFns.length < 2)
            return null; const val = toNumber(argFns[0](ctx)); if (val === null)
            return null; const pop = argFns.slice(1).map(fn => toNumber(fn(ctx))).filter((v) => v !== null); const sorted = [...pop].sort((a, b) => b - a); const idx = sorted.indexOf(val); return idx === -1 ? null : idx + 1; };
        case 'DENSE_RANK': return (ctx) => { if (argFns.length < 2)
            return null; const val = toNumber(argFns[0](ctx)); if (val === null)
            return null; const pop = argFns.slice(1).map(fn => toNumber(fn(ctx))).filter((v) => v !== null); const unique = [...new Set(pop)].sort((a, b) => b - a); const idx = unique.indexOf(val); return idx === -1 ? null : idx + 1; };
        case 'LAG': return (ctx) => { const arr = argFns[0](ctx); const offset = toNumber(argFns[1](ctx)); const def = argFns[2] ? argFns[2](ctx) : null; if (!Array.isArray(arr) || offset === null)
            return def; const idx = arr.length - 1 - offset; return idx >= 0 && idx < arr.length ? arr[idx] : def; };
        case 'LEAD': return (ctx) => { const arr = argFns[0](ctx); const offset = toNumber(argFns[1](ctx)); const def = argFns[2] ? argFns[2](ctx) : null; if (!Array.isArray(arr) || offset === null)
            return def; const idx = arr.length - 1 + offset; return idx >= 0 && idx < arr.length ? arr[idx] : def; };
        case 'RUNNING_SUM': return (ctx) => { let sum = 0; for (const fn of argFns) {
            const v = toNumber(fn(ctx));
            if (v !== null)
                sum += v;
        } return sum; };
        case 'NTILE': return (ctx) => { const n = toNumber(argFns[0](ctx)); const val = toNumber(argFns[1](ctx)); if (n === null || val === null || n <= 0)
            return null; const bucket = Math.ceil(val * n); return Math.max(1, Math.min(n, bucket)); };
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