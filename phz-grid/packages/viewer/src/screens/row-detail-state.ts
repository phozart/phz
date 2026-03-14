/** @phozart/workspace — Row Detail Expansion State (UX-020)
 *
 * Pure-function state machine for expanding a single row into a
 * field-by-field detail view. Supports search filtering within
 * the detail, pinning important fields to the top, keyboard
 * navigation between rows, and a scroll-to-field hint for the
 * component layer.
 */

// ========================================================================
// Types
// ========================================================================

export interface RowDetailField {
  field: string;
  label: string;
  value: unknown;
  type?: string; // column type for formatting hints
}

export interface RowDetailState {
  expandedRowIndex: number | null;
  fields: RowDetailField[];
  searchQuery: string;
  pinnedFields: ReadonlySet<string>;
  scrollToField: string | null;
}

export interface RowDetailColumnInput {
  field: string;
  label: string;
  type?: string;
}

// ========================================================================
// Factory
// ========================================================================

/** Create a default collapsed RowDetailState. */
export function createRowDetailState(): RowDetailState {
  return {
    expandedRowIndex: null,
    fields: [],
    searchQuery: '',
    pinnedFields: new Set(),
    scrollToField: null,
  };
}

// ========================================================================
// Helpers
// ========================================================================

/**
 * Convert a 2-D array row + column metadata into field/value pairs.
 * Maps `columns[i]` to `row[i]` for each index. If row is shorter
 * than columns, value is undefined. If columns is shorter, extra
 * row values are ignored.
 */
export function rowToDetailFields(
  row: unknown[],
  columns: RowDetailColumnInput[],
): RowDetailField[] {
  return columns.map((col, i) => ({
    field: col.field,
    label: col.label,
    value: row[i],
    type: col.type,
  }));
}

// ========================================================================
// Expand / Collapse / Toggle
// ========================================================================

/** Expand a row: set index, compute fields, clear search and scrollToField. Preserves pinnedFields. */
export function expandRowDetail(
  state: RowDetailState,
  rowIndex: number,
  row: unknown[],
  columns: RowDetailColumnInput[],
): RowDetailState {
  return {
    ...state,
    expandedRowIndex: rowIndex,
    fields: rowToDetailFields(row, columns),
    searchQuery: '',
    scrollToField: null,
  };
}

/** Collapse the detail view. No-op (same ref) if already collapsed. Preserves pinnedFields. */
export function collapseRowDetail(state: RowDetailState): RowDetailState {
  if (state.expandedRowIndex === null) return state;
  return {
    ...state,
    expandedRowIndex: null,
    fields: [],
    searchQuery: '',
    scrollToField: null,
  };
}

/**
 * Toggle: if `rowIndex` matches the currently expanded row, collapse.
 * Otherwise expand the given row.
 */
export function toggleRowDetail(
  state: RowDetailState,
  rowIndex: number,
  row: unknown[],
  columns: RowDetailColumnInput[],
): RowDetailState {
  if (state.expandedRowIndex === rowIndex) {
    return collapseRowDetail(state);
  }
  return expandRowDetail(state, rowIndex, row, columns);
}

// ========================================================================
// Row Navigation
// ========================================================================

/** Navigate to the next row. No-op if collapsed or at the last row. */
export function navigateToNextRow(
  state: RowDetailState,
  rows: unknown[][],
  columns: RowDetailColumnInput[],
): RowDetailState {
  if (state.expandedRowIndex === null) return state;
  if (state.expandedRowIndex >= rows.length - 1) return state;
  const nextIndex = state.expandedRowIndex + 1;
  return expandRowDetail(state, nextIndex, rows[nextIndex], columns);
}

/** Navigate to the previous row. No-op if collapsed or at row 0. */
export function navigateToPrevRow(
  state: RowDetailState,
  rows: unknown[][],
  columns: RowDetailColumnInput[],
): RowDetailState {
  if (state.expandedRowIndex === null) return state;
  if (state.expandedRowIndex <= 0) return state;
  const prevIndex = state.expandedRowIndex - 1;
  return expandRowDetail(state, prevIndex, rows[prevIndex], columns);
}

// ========================================================================
// Search
// ========================================================================

/** Set the search query for filtering fields in the detail view. No-op if collapsed or same value. */
export function setDetailSearch(
  state: RowDetailState,
  query: string,
): RowDetailState {
  if (state.expandedRowIndex === null) return state;
  if (state.searchQuery === query) return state;
  return { ...state, searchQuery: query };
}

// ========================================================================
// Pinning
// ========================================================================

/** Toggle a field in the pinned set. Works regardless of expanded state. */
export function togglePinnedField(
  state: RowDetailState,
  field: string,
): RowDetailState {
  const next = new Set(state.pinnedFields);
  if (next.has(field)) {
    next.delete(field);
  } else {
    next.add(field);
  }
  return { ...state, pinnedFields: next };
}

/** Clear all pinned fields. No-op (same ref) if already empty. */
export function clearPinnedFields(state: RowDetailState): RowDetailState {
  if (state.pinnedFields.size === 0) return state;
  return { ...state, pinnedFields: new Set() };
}

// ========================================================================
// Derived / Selectors
// ========================================================================

/**
 * Return fields filtered by searchQuery (case-insensitive match on field or label).
 * Pinned fields come first (in their original order), then unpinned fields.
 */
export function getVisibleDetailFields(state: RowDetailState): RowDetailField[] {
  const { fields, searchQuery, pinnedFields } = state;

  // Filter by search query
  let filtered = fields;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = fields.filter(
      (f) =>
        f.field.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q),
    );
  }

  // Partition into pinned and unpinned, preserving original order
  const pinned: RowDetailField[] = [];
  const unpinned: RowDetailField[] = [];
  for (const f of filtered) {
    if (pinnedFields.has(f.field)) {
      pinned.push(f);
    } else {
      unpinned.push(f);
    }
  }

  return [...pinned, ...unpinned];
}

/** Check if a specific row is the currently expanded one. */
export function isRowExpanded(
  state: RowDetailState,
  rowIndex: number,
): boolean {
  return state.expandedRowIndex === rowIndex;
}

/** Get the currently expanded row index (or null). */
export function getExpandedRowIndex(state: RowDetailState): number | null {
  return state.expandedRowIndex;
}

/** Set a scroll-to-field hint for the component layer. No-op if collapsed or same value. */
export function scrollToDetailField(
  state: RowDetailState,
  field: string,
): RowDetailState {
  if (state.expandedRowIndex === null) return state;
  if (state.scrollToField === field) return state;
  return { ...state, scrollToField: field };
}
