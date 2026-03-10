/**
 * @phozart/phz-engine — Expression Validator
 *
 * Static validation of ExpressionNode trees.
 * Checks reference resolution, type compatibility, and arity.
 */
import type { ExpressionNode } from './expression-types.js';
export interface ExpressionError {
    message: string;
    pos?: {
        start: number;
        end: number;
    };
}
export interface ExpressionValidationContext {
    fields: string[];
    parameters: string[];
    calculatedFields: string[];
    metrics: string[];
}
export declare function validateExpression(node: ExpressionNode, context: ExpressionValidationContext, level: 'row' | 'metric'): ExpressionError[];
//# sourceMappingURL=expression-validator.d.ts.map