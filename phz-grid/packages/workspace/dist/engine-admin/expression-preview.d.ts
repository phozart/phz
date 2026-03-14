/**
 * @phozart/engine-admin — Expression Preview Logic
 *
 * Pure functions for evaluating expressions against sample data,
 * inferring result types, and building validation warnings.
 * Used by the expression builder's preview panel.
 */
import type { ExpressionNode } from '@phozart/engine';
export interface EvalResult {
    value: unknown;
    error: string | null;
}
export type InferredType = 'number' | 'string' | 'boolean' | 'null' | 'mixed';
export interface ValidationWarning {
    type: 'unknown_field' | 'unknown_param' | 'unknown_metric' | 'unknown_calc_field';
    message: string;
    ref: string;
}
export interface ValidationContext {
    availableFields?: string[];
    availableParams?: string[];
    availableMetrics?: string[];
    availableCalcFields?: string[];
}
export declare function evaluateSampleRows(expression: ExpressionNode, sampleData: Record<string, unknown>[], params?: Record<string, unknown>): EvalResult[];
export declare function inferResultType(results: EvalResult[]): InferredType;
export declare function buildValidationWarnings(expression: ExpressionNode, context: ValidationContext): ValidationWarning[];
export declare function formatEvalError(error: {
    message: string;
    pos?: number;
}): string;
//# sourceMappingURL=expression-preview.d.ts.map