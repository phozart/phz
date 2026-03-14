/**
 * @phozart/shared — FilterValueMatchRule (A-1.09)
 *
 * Rules for matching and validating filter values, with support for
 * expression-based value transformations (UPPER, LOWER, TRIM, LEFT,
 * RIGHT, SUBSTRING, REPLACE).
 */
export type MatchOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'greaterThan' | 'lessThan' | 'between' | 'isNull' | 'isNotNull';
export type ExpressionFunction = 'UPPER' | 'LOWER' | 'TRIM' | 'LEFT' | 'RIGHT' | 'SUBSTRING' | 'REPLACE';
export interface FilterValueMatchRule {
    field: string;
    operator: MatchOperator;
    value: unknown;
    caseSensitive?: boolean;
    /**
     * Optional expression to apply to the actual value before matching.
     * Format: "FUNCTION_NAME" or "FUNCTION_NAME(arg1, arg2, ...)"
     * Supported: UPPER, LOWER, TRIM, LEFT(n), RIGHT(n),
     * SUBSTRING(start, length), REPLACE(search, replacement).
     */
    expression?: string;
}
/**
 * Apply a string transformation expression to a value.
 * Returns the transformed value, or the original value if the
 * expression is not applicable (e.g., non-string input).
 *
 * Supported expressions:
 * - UPPER — convert to uppercase
 * - LOWER — convert to lowercase
 * - TRIM — remove leading/trailing whitespace
 * - LEFT(n) — take first n characters
 * - RIGHT(n) — take last n characters
 * - SUBSTRING(start, length) — extract substring (0-based start)
 * - REPLACE(search, replacement) — replace all occurrences
 */
export declare function applyExpression(value: unknown, expression: string): unknown;
/**
 * Evaluate a FilterValueMatchRule against an actual value.
 * If the rule has an expression, it is applied to the actual value
 * before comparison.
 */
export declare function evaluateMatchRule(rule: FilterValueMatchRule, actual: unknown): boolean;
//# sourceMappingURL=filter-value-match-rule.d.ts.map