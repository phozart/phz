/**
 * @phozart/workspace — Wide Report Editor State (B-3.03)
 *
 * Pure functions for managing reports with 30+ columns.
 * Supports column groups, horizontal scroll with frozen columns,
 * column search/filter in the configurator, and drag-and-drop reorder.
 */

// ========================================================================
// Types
// ========================================================================

export interface WideColumnConfig {
  field: string;
  label: string;
  width: number;
  visible: boolean;
  pinned?: 'left' | 'right';
  groupId?: string;
  format?: string;
  aggregation?: string;
}

export interface ColumnGroup {
  id: string;
  label: string;
  collapsed: boolean;
}

export interface WideReportState {
  columns: WideColumnConfig[];
  groups: ColumnGroup[];
  frozenLeftCount: number;
  frozenRightCount: number;
  columnSearch: string;
  selectedColumnField?: string;
  dragSourceIndex?: number;
  dragTargetIndex?: number;
}

// ========================================================================
// Factory
// ========================================================================

export function initialWideReportState(
  columns: WideColumnConfig[] = [],
  groups: ColumnGroup[] = [],
): WideReportState {
  return {
    columns,
    groups,
    frozenLeftCount: 0,
    frozenRightCount: 0,
    columnSearch: '',
  };
}

// ========================================================================
// Column groups
// ========================================================================

export function addColumnGroup(
  state: WideReportState,
  group: ColumnGroup,
): WideReportState {
  if (state.groups.some(g => g.id === group.id)) return state;
  return { ...state, groups: [...state.groups, group] };
}

export function removeColumnGroup(
  state: WideReportState,
  groupId: string,
): WideReportState {
  return {
    ...state,
    groups: state.groups.filter(g => g.id !== groupId),
    columns: state.columns.map(c =>
      c.groupId === groupId ? { ...c, groupId: undefined } : c,
    ),
  };
}

export function toggleGroupCollapsed(
  state: WideReportState,
  groupId: string,
): WideReportState {
  return {
    ...state,
    groups: state.groups.map(g =>
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g,
    ),
  };
}

export function assignColumnToGroup(
  state: WideReportState,
  field: string,
  groupId: string | undefined,
): WideReportState {
  return {
    ...state,
    columns: state.columns.map(c =>
      c.field === field ? { ...c, groupId } : c,
    ),
  };
}

export function getColumnsInGroup(
  state: WideReportState,
  groupId: string,
): WideColumnConfig[] {
  return state.columns.filter(c => c.groupId === groupId);
}

export function getUngroupedColumns(state: WideReportState): WideColumnConfig[] {
  return state.columns.filter(c => !c.groupId);
}

// ========================================================================
// Frozen columns
// ========================================================================

export function setFrozenLeft(
  state: WideReportState,
  count: number,
): WideReportState {
  return {
    ...state,
    frozenLeftCount: Math.max(0, Math.min(count, state.columns.length)),
  };
}

export function setFrozenRight(
  state: WideReportState,
  count: number,
): WideReportState {
  return {
    ...state,
    frozenRightCount: Math.max(0, Math.min(count, state.columns.length)),
  };
}

export function getFrozenLeftColumns(state: WideReportState): WideColumnConfig[] {
  return state.columns.slice(0, state.frozenLeftCount);
}

export function getFrozenRightColumns(state: WideReportState): WideColumnConfig[] {
  if (state.frozenRightCount === 0) return [];
  return state.columns.slice(-state.frozenRightCount);
}

export function getScrollableColumns(state: WideReportState): WideColumnConfig[] {
  const end = state.frozenRightCount > 0
    ? state.columns.length - state.frozenRightCount
    : state.columns.length;
  return state.columns.slice(state.frozenLeftCount, end);
}

// ========================================================================
// Column search / filter
// ========================================================================

export function setColumnSearch(
  state: WideReportState,
  search: string,
): WideReportState {
  return { ...state, columnSearch: search };
}

export function getFilteredColumns(state: WideReportState): WideColumnConfig[] {
  if (!state.columnSearch) return state.columns;
  const q = state.columnSearch.toLowerCase();
  return state.columns.filter(
    c =>
      c.field.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q),
  );
}

// ========================================================================
// Visible columns (accounting for group collapse)
// ========================================================================

export function getVisibleColumns(state: WideReportState): WideColumnConfig[] {
  const collapsedGroups = new Set(
    state.groups.filter(g => g.collapsed).map(g => g.id),
  );

  return state.columns.filter(c => {
    if (!c.visible) return false;
    if (c.groupId && collapsedGroups.has(c.groupId)) return false;
    return true;
  });
}

// ========================================================================
// Drag-and-drop reorder
// ========================================================================

export function startColumnDrag(
  state: WideReportState,
  fromIndex: number,
): WideReportState {
  if (fromIndex < 0 || fromIndex >= state.columns.length) return state;
  return { ...state, dragSourceIndex: fromIndex, dragTargetIndex: undefined };
}

export function hoverColumnTarget(
  state: WideReportState,
  targetIndex: number,
): WideReportState {
  return { ...state, dragTargetIndex: targetIndex };
}

export function dropColumn(state: WideReportState): WideReportState {
  if (
    state.dragSourceIndex === undefined ||
    state.dragTargetIndex === undefined
  ) {
    return { ...state, dragSourceIndex: undefined, dragTargetIndex: undefined };
  }

  const from = state.dragSourceIndex;
  const to = state.dragTargetIndex;

  if (from === to || from < 0 || to < 0 || from >= state.columns.length || to >= state.columns.length) {
    return { ...state, dragSourceIndex: undefined, dragTargetIndex: undefined };
  }

  const cols = [...state.columns];
  const [moved] = cols.splice(from, 1);
  cols.splice(to, 0, moved);

  return {
    ...state,
    columns: cols,
    dragSourceIndex: undefined,
    dragTargetIndex: undefined,
  };
}

export function cancelColumnDrag(state: WideReportState): WideReportState {
  return { ...state, dragSourceIndex: undefined, dragTargetIndex: undefined };
}

// ========================================================================
// Column add / remove
// ========================================================================

export function addWideColumn(
  state: WideReportState,
  column: WideColumnConfig,
): WideReportState {
  if (state.columns.some(c => c.field === column.field)) return state;
  return { ...state, columns: [...state.columns, column] };
}

export function removeWideColumn(
  state: WideReportState,
  field: string,
): WideReportState {
  return { ...state, columns: state.columns.filter(c => c.field !== field) };
}

export function updateWideColumn(
  state: WideReportState,
  field: string,
  updates: Partial<WideColumnConfig>,
): WideReportState {
  return {
    ...state,
    columns: state.columns.map(c =>
      c.field === field ? { ...c, ...updates, field: c.field } : c,
    ),
  };
}

export function toggleWideColumnVisibility(
  state: WideReportState,
  field: string,
): WideReportState {
  const col = state.columns.find(c => c.field === field);
  if (!col) return state;
  return updateWideColumn(state, field, { visible: !col.visible });
}
