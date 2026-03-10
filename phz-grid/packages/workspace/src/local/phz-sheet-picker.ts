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

function sanitizeName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9_]/g, '_') // replace non-alphanumeric
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_|_$/g, ''); // trim leading/trailing underscores
}

function buildState(
  sheets: SheetInfo[],
  fileName: string,
  selectedSheets: string[],
): SheetPickerState {
  const baseName = sanitizeName(fileName);

  return {
    sheets,
    selectedSheets: [...selectedSheets],
    fileName,

    getTableNames(): string[] {
      return sheets.map(s => `${baseName}_${sanitizeName(s.name)}`);
    },

    toggleSheet(sheetName: string): SheetPickerState {
      const exists = selectedSheets.includes(sheetName);
      const newSelected = exists
        ? selectedSheets.filter(s => s !== sheetName)
        : [...selectedSheets, sheetName];
      return buildState(sheets, fileName, newSelected);
    },

    getSheetInfo(sheetName: string): SheetInfo | undefined {
      return sheets.find(s => s.name === sheetName);
    },
  };
}

export function createSheetPicker(
  sheets: SheetInfo[],
  fileName: string,
): SheetPickerState {
  // Default: select first sheet
  const defaultSelected = sheets.length > 0 ? [sheets[0].name] : [];
  return buildState(sheets, fileName, defaultSelected);
}
