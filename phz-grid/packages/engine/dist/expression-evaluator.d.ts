/**
 * @phozart/engine — Expression Evaluator
 *
 * Synchronous tree-walk evaluator for ExpressionNode ASTs.
 * Two contexts: row-level (for calculated fields) and metric-level (for composite metrics).
 */
import type { ExpressionNode } from './expression-types.js';
export interface RowExpressionContext {
    row: Record<string, unknown>;
    params: Record<string, unknown>;
    calculatedValues: Record<string, unknown>;
}
export interface MetricExpressionContext {
    metricValues: Record<string, number | null>;
    params: Record<string, unknown>;
}
export declare function evaluateRowExpression(node: ExpressionNode, ctx: RowExpressionContext): unknown;
export declare function evaluateMetricExpression(node: ExpressionNode, ctx: MetricExpressionContext): number | null;
//# sourceMappingURL=expression-evaluator.d.ts.map