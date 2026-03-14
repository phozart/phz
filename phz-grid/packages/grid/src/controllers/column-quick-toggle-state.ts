/** @phozart/grid — Column Quick Toggle State (UX-022) */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface QuickColumnInput {
  field: string;
  label: string;
  visible?: boolean;
  frozen?: 'left' | 'right' | null;
}

export interface QuickColumnEntry {
  field: string;
  label: string;
  visible: boolean;
  frozen: 'left' | 'right' | null;
}

export interface ColumnQuickToggleState {
  open: boolean;
  columns: QuickColumnEntry[];
  searchQuery: string;
  lastToggledField: string | null;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                           */
/* ------------------------------------------------------------------ */

export function createColumnQuickToggleState(
  columns: QuickColumnInput[],
): ColumnQuickToggleState {
  return {
    open: false,
    columns: columns.map((col) => ({
      field: col.field,
      label: col.label,
      visible: col.visible ?? true,
      frozen: col.frozen ?? null,
    })),
    searchQuery: '',
    lastToggledField: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Open / Close / Toggle                                             */
/* ------------------------------------------------------------------ */

export function openQuickToggle(
  state: ColumnQuickToggleState,
): ColumnQuickToggleState {
  if (state.open) return state;
  return { ...state, open: true };
}

export function closeQuickToggle(
  state: ColumnQuickToggleState,
): ColumnQuickToggleState {
  if (!state.open) return state;
  return { ...state, open: false, searchQuery: '' };
}

export function toggleQuickToggle(
  state: ColumnQuickToggleState,
): ColumnQuickToggleState {
  return state.open ? closeQuickToggle(state) : openQuickToggle(state);
}

/* ------------------------------------------------------------------ */
/*  Column Visibility                                                 */
/* ------------------------------------------------------------------ */

export function toggleColumnVisible(
  state: ColumnQuickToggleState,
  field: string,
): ColumnQuickToggleState {
  const idx = state.columns.findIndex((c) => c.field === field);
  if (idx === -1) return state;

  const updatedColumns = state.columns.map((c, i) =>
    i === idx ? { ...c, visible: !c.visible } : c,
  );

  return {
    ...state,
    columns: updatedColumns,
    lastToggledField: field,
  };
}

export function showAllColumns(
  state: ColumnQuickToggleState,
): ColumnQuickToggleState {
  if (state.columns.every((c) => c.visible)) return state;

  return {
    ...state,
    columns: state.columns.map((c) => (c.visible ? c : { ...c, visible: true })),
    lastToggledField: null,
  };
}

export function hideAllColumns(
  state: ColumnQuickToggleState,
): ColumnQuickToggleState {
  if (state.columns.every((c) => !c.visible)) return state;

  return {
    ...state,
    columns: state.columns.map((c) => (c.visible ? { ...c, visible: false } : c)),
    lastToggledField: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Search                                                            */
/* ------------------------------------------------------------------ */

export function setQuickToggleSearch(
  state: ColumnQuickToggleState,
  query: string,
): ColumnQuickToggleState {
  if (state.searchQuery === query) return state;
  return { ...state, searchQuery: query };
}

/* ------------------------------------------------------------------ */
/*  Derived / Selectors                                               */
/* ------------------------------------------------------------------ */

export function getFilteredColumns(
  state: ColumnQuickToggleState,
): QuickColumnEntry[] {
  if (!state.searchQuery) return state.columns;

  const q = state.searchQuery.toLowerCase();
  return state.columns.filter(
    (c) =>
      c.field.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q),
  );
}

export function getVisibleCount(state: ColumnQuickToggleState): number {
  return state.columns.filter((c) => c.visible).length;
}

export function getHiddenCount(state: ColumnQuickToggleState): number {
  return state.columns.filter((c) => !c.visible).length;
}
