/**
 * @phozart/engine-admin — Expression Preview Logic
 *
 * Pure functions for evaluating expressions against sample data,
 * inferring result types, and building validation warnings.
 * Used by the expression builder's preview panel.
 */
import { evaluateRowExpression } from '@phozart/engine';
// --- Sample Data Evaluation ---
export function evaluateSampleRows(expression, sampleData, params = {}) {
    return sampleData.map(row => {
        try {
            const ctx = {
                row,
                params,
                calculatedValues: {},
            };
            const value = evaluateRowExpression(expression, ctx);
            return { value, error: null };
        }
        catch (e) {
            return { value: null, error: e instanceof Error ? e.message : String(e) };
        }
    });
}
// --- Type Inference ---
export function inferResultType(results) {
    let seenType = null;
    for (const r of results) {
        if (r.error !== null)
            continue;
        if (r.value === null || r.value === undefined)
            continue;
        const t = typeof r.value;
        if (seenType === null) {
            seenType = t;
        }
        else if (seenType !== t) {
            return 'mixed';
        }
    }
    if (seenType === null)
        return 'null';
    if (seenType === 'number' || seenType === 'string' || seenType === 'boolean') {
        return seenType;
    }
    return 'mixed';
}
// --- Validation Warnings ---
export function buildValidationWarnings(expression, context) {
    const warnings = [];
    walkExpression(expression, context, warnings);
    return warnings;
}
function walkExpression(node, ctx, warnings) {
    switch (node.kind) {
        case 'field_ref':
            if (ctx.availableFields && !ctx.availableFields.includes(node.fieldName)) {
                warnings.push({
                    type: 'unknown_field',
                    message: `Unknown field: "${node.fieldName}"`,
                    ref: node.fieldName,
                });
            }
            break;
        case 'param_ref':
            if (ctx.availableParams && !ctx.availableParams.includes(node.parameterId)) {
                warnings.push({
                    type: 'unknown_param',
                    message: `Unknown parameter: "${node.parameterId}"`,
                    ref: node.parameterId,
                });
            }
            break;
        case 'metric_ref':
            if (ctx.availableMetrics && !ctx.availableMetrics.includes(node.metricId)) {
                warnings.push({
                    type: 'unknown_metric',
                    message: `Unknown metric: "${node.metricId}"`,
                    ref: node.metricId,
                });
            }
            break;
        case 'calc_ref':
            if (ctx.availableCalcFields && !ctx.availableCalcFields.includes(node.calculatedFieldId)) {
                warnings.push({
                    type: 'unknown_calc_field',
                    message: `Unknown calculated field: "${node.calculatedFieldId}"`,
                    ref: node.calculatedFieldId,
                });
            }
            break;
        case 'unary_op':
            walkExpression(node.operand, ctx, warnings);
            break;
        case 'binary_op':
            walkExpression(node.left, ctx, warnings);
            walkExpression(node.right, ctx, warnings);
            break;
        case 'conditional':
            walkExpression(node.condition, ctx, warnings);
            walkExpression(node.thenBranch, ctx, warnings);
            walkExpression(node.elseBranch, ctx, warnings);
            break;
        case 'function_call':
            for (const arg of node.args) {
                walkExpression(arg, ctx, warnings);
            }
            break;
        case 'null_check':
            walkExpression(node.operand, ctx, warnings);
            break;
        case 'literal':
            break;
    }
}
// --- Error Formatting ---
export function formatEvalError(error) {
    if (error.pos !== undefined) {
        return `${error.message} (at position ${error.pos})`;
    }
    return error.message;
}
//# sourceMappingURL=expression-preview.js.map