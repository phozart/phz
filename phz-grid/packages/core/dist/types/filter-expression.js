/**
 * @phozart/phz-core — Unified Filter Algebra (Item 6.9)
 *
 * Canonical FilterExpression AST supporting recursive AND/OR/NOT composition.
 * Replaces the flat FilterState.filters array with a composable algebra.
 */
/**
 * Type guard: is this a FilterAtom (leaf) or FilterExpression (branch)?
 */
export function isFilterAtom(node) {
    return 'field' in node && 'operator' in node;
}
//# sourceMappingURL=filter-expression.js.map