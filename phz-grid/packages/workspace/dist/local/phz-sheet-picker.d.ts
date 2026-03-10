/**
 * W.3b — Sheet Picker (Enhanced)
 *
 * Extends the basic sheet selection from upload-preview with
 * table naming (filename_sheetname), multi-select toggle, and
 * name sanitization for SQL-safe identifiers.
 */
export interface SheetInfo {
    name: string;
    rowCount: number;
    headers: string[];
}
export interface SheetPickerState {
    sheets: SheetInfo[];
    selectedSheets: string[];
    fileName: string;
    getTableNames(): string[];
    toggleSheet(sheetName: string): SheetPickerState;
    getSheetInfo(sheetName: string): SheetInfo | undefined;
}
export declare function createSheetPicker(sheets: SheetInfo[], fileName: string): SheetPickerState;
//# sourceMappingURL=phz-sheet-picker.d.ts.map