/**
 * @phozart/phz-engine — Formula Parser
 *
 * Recursive descent parser for formula text → ExpressionNode AST.
 * Also provides a formatter: ExpressionNode → formula text.
 *
 * Reference syntax:
 *   [field_name]  — dataset field
 *   $param_name   — parameter
 *   @metric_name  — metric reference
 *   ~calc_name    — calculated field reference
 *
 * Operator precedence (lowest to highest):
 *   OR → AND → equality (==, !=) → comparison (>, >=, <, <=) →
 *   addition (+, -) → multiplication (*, /, %) → power (^) → unary (-, NOT)
 *
 * Functions: FUNC_NAME(arg1, arg2, ...)
 * Null checks: [field] IS NULL, [field] IS NOT NULL
 * Conditionals: IF(cond, then, else)
 */
import type { ExpressionNode } from './expression-types.js';
export interface ParseResult {
    node: ExpressionNode | null;
    errors: Array<{
        message: string;
        pos: number;
    }>;
}
export declare function parseFormula(text: string): ParseResult;
export declare function formatFormula(node: ExpressionNode): string;
//# sourceMappingURL=formula-parser.d.ts.map