/**
 * @phozart/engine — Expression Validator
 *
 * Static validation of ExpressionNode trees.
 * Checks reference resolution, type compatibility, and arity.
 */
// --- Arity table ---
const FUNCTION_ARITY = {
    ABS: { min: 1, max: 1 },
    ROUND: { min: 1, max: 2 },
    FLOOR: { min: 1, max: 1 },
    CEIL: { min: 1, max: 1 },
    SQRT: { min: 1, max: 1 },
    POWER: { min: 2, max: 2 },
    MOD: { min: 2, max: 2 },
    LOG: { min: 1, max: 2 },
    EXP: { min: 1, max: 1 },
    UPPER: { min: 1, max: 1 },
    LOWER: { min: 1, max: 1 },
    TRIM: { min: 1, max: 1 },
    LEN: { min: 1, max: 1 },
    SUBSTR: { min: 2, max: 3 },
    CONCAT: { min: 1, max: 99 },
    LEFT: { min: 2, max: 2 },
    RIGHT: { min: 2, max: 2 },
    REPLACE: { min: 3, max: 3 },
    REPEAT: { min: 2, max: 2 },
    YEAR: { min: 1, max: 1 },
    MONTH: { min: 1, max: 1 },
    DAY: { min: 1, max: 1 },
    DATE_DIFF: { min: 3, max: 3 },
    DATE_ADD: { min: 3, max: 3 },
    FORMAT_DATE: { min: 2, max: 2 },
    STDDEV: { min: 1, max: 99 },
    VARIANCE: { min: 1, max: 99 },
    PERCENTILE: { min: 2, max: 99 },
    RANK: { min: 1, max: 99 },
    DENSE_RANK: { min: 1, max: 99 },
    LAG: { min: 2, max: 3 },
    LEAD: { min: 2, max: 3 },
    RUNNING_SUM: { min: 1, max: 99 },
    NTILE: { min: 2, max: 2 },
    COALESCE: { min: 1, max: 99 },
    IF: { min: 3, max: 3 },
    CLAMP: { min: 3, max: 3 },
};
// --- Validator ---
export function validateExpression(node, context, level) {
    const errors = [];
    validate(node, context, level, errors);
    return errors;
}
function validate(node, ctx, level, errors) {
    switch (node.kind) {
        case 'field_ref':
            if (!ctx.fields.includes(node.fieldName)) {
                errors.push({ message: `Unknown field: "${node.fieldName}"`, pos: node.pos });
            }
            if (level === 'metric') {
                errors.push({ message: `Field references are not allowed in metric-level expressions`, pos: node.pos });
            }
            break;
        case 'param_ref':
            if (!ctx.parameters.includes(node.parameterId)) {
                errors.push({ message: `Unknown parameter: "${node.parameterId}"`, pos: node.pos });
            }
            break;
        case 'metric_ref':
            if (!ctx.metrics.includes(node.metricId)) {
                errors.push({ message: `Unknown metric: "${node.metricId}"`, pos: node.pos });
            }
            if (level === 'row') {
                errors.push({ message: `Metric references are not allowed in row-level expressions`, pos: node.pos });
            }
            break;
        case 'calc_ref':
            if (!ctx.calculatedFields.includes(node.calculatedFieldId)) {
                errors.push({ message: `Unknown calculated field: "${node.calculatedFieldId}"`, pos: node.pos });
            }
            if (level === 'metric') {
                errors.push({ message: `Calculated field references are not allowed in metric-level expressions`, pos: node.pos });
            }
            break;
        case 'literal':
            break;
        case 'unary_op':
            validate(node.operand, ctx, level, errors);
            break;
        case 'binary_op':
            validate(node.left, ctx, level, errors);
            validate(node.right, ctx, level, errors);
            break;
        case 'conditional':
            validate(node.condition, ctx, level, errors);
            validate(node.thenBranch, ctx, level, errors);
            validate(node.elseBranch, ctx, level, errors);
            break;
        case 'function_call': {
            const arity = FUNCTION_ARITY[node.functionName];
            if (!arity) {
                errors.push({ message: `Unknown function: "${node.functionName}"`, pos: node.pos });
            }
            else {
                if (node.args.length < arity.min) {
                    errors.push({
                        message: `${node.functionName} requires at least ${arity.min} argument(s), got ${node.args.length}`,
                        pos: node.pos,
                    });
                }
                if (node.args.length > arity.max) {
                    errors.push({
                        message: `${node.functionName} accepts at most ${arity.max} argument(s), got ${node.args.length}`,
                        pos: node.pos,
                    });
                }
            }
            for (const arg of node.args) {
                validate(arg, ctx, level, errors);
            }
            break;
        }
        case 'null_check':
            validate(node.operand, ctx, level, errors);
            break;
    }
}
//# sourceMappingURL=expression-validator.js.map