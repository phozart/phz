/**
 * W.3b — Sheet Picker (Enhanced)
 *
 * Extends the basic sheet selection from upload-preview with
 * table naming (filename_sheetname), multi-select toggle, and
 * name sanitization for SQL-safe identifiers.
 */
function sanitizeName(name) {
    return name
        .replace(/\.[^.]+$/, '') // strip extension
        .replace(/[^a-zA-Z0-9_]/g, '_') // replace non-alphanumeric
        .replace(/_+/g, '_') // collapse multiple underscores
        .replace(/^_|_$/g, ''); // trim leading/trailing underscores
}
function buildState(sheets, fileName, selectedSheets) {
    const baseName = sanitizeName(fileName);
    return {
        sheets,
        selectedSheets: [...selectedSheets],
        fileName,
        getTableNames() {
            return sheets.map(s => `${baseName}_${sanitizeName(s.name)}`);
        },
        toggleSheet(sheetName) {
            const exists = selectedSheets.includes(sheetName);
            const newSelected = exists
                ? selectedSheets.filter(s => s !== sheetName)
                : [...selectedSheets, sheetName];
            return buildState(sheets, fileName, newSelected);
        },
        getSheetInfo(sheetName) {
            return sheets.find(s => s.name === sheetName);
        },
    };
}
export function createSheetPicker(sheets, fileName) {
    // Default: select first sheet
    const defaultSelected = sheets.length > 0 ? [sheets[0].name] : [];
    return buildState(sheets, fileName, defaultSelected);
}
//# sourceMappingURL=phz-sheet-picker.js.map