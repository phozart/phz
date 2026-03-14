/**
 * @phozart/core — Unified Filter Algebra (Item 6.9)
 *
 * Canonical FilterExpression AST supporting recursive AND/OR/NOT composition.
 * Replaces the flat FilterState.filters array with a composable algebra.
 */
import type { FilterOperator } from './state.js';
/**
 * A single filter condition (leaf node).
 */
export interface FilterAtom {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
/**
 * Boolean logic for composing filter conditions.
 * - 'and': all conditions must match
 * - 'or': any condition can match
 * - 'not': inverts the result of the first condition
 */
export type FilterLogicOperator = 'and' | 'or' | 'not';
/**
 * A composable filter expression — either a leaf (FilterAtom) or a branch
 * (FilterExpression containing nested atoms/expressions).
 */
export interface FilterExpression {
    logic: FilterLogicOperator;
    conditions: Array<FilterAtom | FilterExpression>;
}
/**
 * Type guard: is this a FilterAtom (leaf) or FilterExpression (branch)?
 */
export declare function isFilterAtom(node: FilterAtom | FilterExpression): node is FilterAtom;
//# sourceMappingURL=filter-expression.d.ts.map