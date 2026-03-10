/**
 * @phozart/phz-core — Row Types
 */
export type RowId = string | number;
export interface RowData<TData = any> {
    __id: RowId;
    [key: string]: unknown;
}
export interface RowMetadata {
    index: number;
    depth: number;
    isGroupRow: boolean;
    isExpanded: boolean;
    parentId: RowId | null;
    childCount: number;
}
export interface RowValidationError {
    rowId: RowId;
    field: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface RowModelState<TData = any> {
    rows: RowData<TData>[];
    rowsById: Map<RowId, RowData<TData>>;
    rowCount: number;
}
//# sourceMappingURL=row.d.ts.map