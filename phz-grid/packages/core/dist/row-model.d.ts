/**
 * @phozart/core — Row Model Pipeline
 *
 * Implements the data processing pipeline:
 *   Raw Data → Parse → Filter → Sort → Group → Flatten → Virtualize
 *
 * Each stage caches its result and only recomputes when invalidated.
 */
import type { RowId, RowData } from './types/row.js';
import type { ColumnDefinition } from './types/column.js';
import type { SortState, FilterState, GroupingState, VirtualizationState } from './types/state.js';
import type { CoreRowModel, FilteredRowModel, SortedRowModel, GroupedRowModel, FlattenedRowModel, VirtualizedRowModel } from './types/row-model.js';
export declare function parseData(rawData: unknown[], rowIdField?: string): RowData[];
export declare function buildRowMap(rows: RowData[]): Map<RowId, RowData>;
export declare function buildCoreRowModel<TData = any>(rows: RowData<TData>[]): CoreRowModel<TData>;
export declare function filterRows<TData = any>(model: CoreRowModel<TData>, filterState: FilterState, columns: ColumnDefinition<TData>[]): FilteredRowModel<TData>;
export declare function sortRows<TData = any>(model: CoreRowModel<TData>, sortState: SortState, columns: ColumnDefinition<TData>[]): SortedRowModel<TData>;
export declare function groupRows<TData = any>(model: CoreRowModel<TData>, groupingState: GroupingState): GroupedRowModel<TData>;
export declare function flattenRows<TData = any>(model: GroupedRowModel<TData>): FlattenedRowModel<TData>;
export declare function virtualizeRows<TData = any>(model: CoreRowModel<TData>, virtualization: VirtualizationState, scrollTop: number, viewportHeight: number): VirtualizedRowModel<TData>;
//# sourceMappingURL=row-model.d.ts.map