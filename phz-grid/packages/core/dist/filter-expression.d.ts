/**
 * @phozart/phz-core — Filter Expression Evaluator (Item 6.9)
 *
 * Evaluates a FilterExpression AST against a row of data.
 * Also provides backward-compat helpers to convert legacy FilterState.filters
 * into the new expression format.
 */
import type { FilterExpression } from './types/filter-expression.js';
import type { FilterOperator } from './types/state.js';
import type { ColumnDefinition } from './types/column.js';
import type { CoreRowModel, FilteredRowModel } from './types/row-model.js';
/**
 * Evaluate a FilterExpression tree against a single row.
 */
export declare function evaluateFilterExpression(row: Record<string, unknown>, expr: FilterExpression): boolean;
/**
 * Convert legacy flat filter array to a FilterExpression (AND of atoms).
 */
export declare function normalizeFiltersToExpression(filters: Array<{
    field: string;
    operator: FilterOperator;
    value: unknown;
}>): FilterExpression;
/**
 * Filter rows using a FilterExpression AST.
 * Supports valueGetter from column definitions.
 */
export declare function filterRowsWithExpression<TData = any>(model: CoreRowModel<TData>, expr: FilterExpression, columns: ColumnDefinition<TData>[]): FilteredRowModel<TData>;
//# sourceMappingURL=filter-expression.d.ts.map