/**
 * @phozart/phz-core — Row Model Pipeline Types
 */
import type { RowId, RowData } from './row.js';
export interface RowModelPipeline<TData = any> {
    getCoreRowModel(): CoreRowModel<TData>;
    getFilteredRowModel(): FilteredRowModel<TData>;
    getSortedRowModel(): SortedRowModel<TData>;
    getGroupedRowModel(): GroupedRowModel<TData>;
    getFlattenedRowModel(): FlattenedRowModel<TData>;
    getVirtualizedRowModel(): VirtualizedRowModel<TData>;
}
export interface CoreRowModel<TData = any> {
    rows: RowData<TData>[];
    rowsById: Map<RowId, RowData<TData>>;
    flatRows: RowData<TData>[];
    rowCount: number;
}
export interface FilteredRowModel<TData = any> extends CoreRowModel<TData> {
    filteredRowIds: Set<RowId>;
}
export interface SortedRowModel<TData = any> extends CoreRowModel<TData> {
    sortedRowIds: RowId[];
}
export interface GroupedRowModel<TData = any> extends CoreRowModel<TData> {
    groups: RowGroup<TData>[];
}
export interface RowGroup<TData = any> {
    key: string;
    field: string;
    value: unknown;
    rows: RowData<TData>[];
    subGroups?: RowGroup<TData>[];
    aggregations?: Record<string, unknown>;
    depth: number;
    isExpanded: boolean;
}
export interface FlattenedRowModel<TData = any> extends CoreRowModel<TData> {
    flatRows: RowData<TData>[];
}
export interface VirtualizedRowModel<TData = any> extends CoreRowModel<TData> {
    visibleRows: RowData<TData>[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetTop: number;
}
export interface RowModelStage<TInput, TOutput> {
    execute(input: TInput): TOutput;
    invalidate(): void;
}
//# sourceMappingURL=row-model.d.ts.map