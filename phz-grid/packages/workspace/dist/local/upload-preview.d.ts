/**
 * W.3 — Upload Preview + Sheet Picker
 *
 * Preview state for uploaded data, column type inference,
 * type override, and Excel sheet selection.
 */
export interface ColumnTypeInfo {
    name: string;
    inferredType: 'string' | 'number' | 'date' | 'boolean';
    overridden: boolean;
}
export interface PreviewState {
    rows: string[][];
    columns: string[];
    columnTypes: ColumnTypeInfo[];
    maxPreviewRows: number;
    loading: boolean;
}
export declare function createPreviewState(): PreviewState;
export declare function inferColumnTypes(rows: string[][], columnNames: string[]): ColumnTypeInfo[];
export declare function applyTypeOverride(types: ColumnTypeInfo[], columnName: string, newType: ColumnTypeInfo['inferredType']): ColumnTypeInfo[];
export interface SheetInfo {
    index: number;
    name: string;
    selected: boolean;
}
export declare function createSheetList(sheetNames: string[]): SheetInfo[];
export declare function selectSheet(sheets: SheetInfo[], sheetIndex: number): SheetInfo[];
//# sourceMappingURL=upload-preview.d.ts.map