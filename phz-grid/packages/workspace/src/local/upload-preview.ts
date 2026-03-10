/**
 * W.3 — Upload Preview + Sheet Picker
 *
 * Preview state for uploaded data, column type inference,
 * type override, and Excel sheet selection.
 */

// ========================================================================
// Preview State
// ========================================================================

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

export function createPreviewState(): PreviewState {
  return {
    rows: [],
    columns: [],
    columnTypes: [],
    maxPreviewRows: 20,
    loading: false,
  };
}

// ========================================================================
// Type Inference
// ========================================================================

const DATE_PATTERN = /^\d{4}[-/]\d{2}[-/]\d{2}/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const BOOLEAN_VALUES = new Set(['true', 'false', '0', '1', 'yes', 'no']);

function inferSingleType(values: string[]): 'string' | 'number' | 'date' | 'boolean' {
  if (values.length === 0) return 'string';

  const nonEmpty = values.filter(v => v !== '');
  if (nonEmpty.length === 0) return 'string';

  // Check boolean
  if (nonEmpty.every(v => BOOLEAN_VALUES.has(v.toLowerCase()))) return 'boolean';

  // Check number
  if (nonEmpty.every(v => NUMBER_PATTERN.test(v.trim()))) return 'number';

  // Check date
  if (nonEmpty.every(v => DATE_PATTERN.test(v.trim()))) return 'date';

  return 'string';
}

export function inferColumnTypes(
  rows: string[][],
  columnNames: string[],
): ColumnTypeInfo[] {
  return columnNames.map((name, colIdx) => {
    const values = rows.map(row => row[colIdx] ?? '');
    return {
      name,
      inferredType: inferSingleType(values),
      overridden: false,
    };
  });
}

export function applyTypeOverride(
  types: ColumnTypeInfo[],
  columnName: string,
  newType: ColumnTypeInfo['inferredType'],
): ColumnTypeInfo[] {
  return types.map(t =>
    t.name === columnName
      ? { ...t, inferredType: newType, overridden: true }
      : t,
  );
}

// ========================================================================
// Sheet Picker
// ========================================================================

export interface SheetInfo {
  index: number;
  name: string;
  selected: boolean;
}

export function createSheetList(sheetNames: string[]): SheetInfo[] {
  return sheetNames.map((name, index) => ({
    index,
    name,
    selected: index === 0,
  }));
}

export function selectSheet(sheets: SheetInfo[], sheetIndex: number): SheetInfo[] {
  return sheets.map(s => ({
    ...s,
    selected: s.index === sheetIndex,
  }));
}
