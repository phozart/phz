import { describe, it, expect } from 'vitest';
import {
  initialWideReportState,
  addColumnGroup,
  removeColumnGroup,
  toggleGroupCollapsed,
  assignColumnToGroup,
  getColumnsInGroup,
  getUngroupedColumns,
  setFrozenLeft,
  setFrozenRight,
  getFrozenLeftColumns,
  getFrozenRightColumns,
  getScrollableColumns,
  setColumnSearch,
  getFilteredColumns,
  getVisibleColumns,
  startColumnDrag,
  hoverColumnTarget,
  dropColumn,
  cancelColumnDrag,
  addWideColumn,
  removeWideColumn,
  updateWideColumn,
  toggleWideColumnVisibility,
  type WideColumnConfig,
  type ColumnGroup,
} from '../authoring/wide-report-state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const columns: WideColumnConfig[] = [
  { field: 'id', label: 'ID', width: 60, visible: true },
  { field: 'name', label: 'Name', width: 200, visible: true },
  { field: 'email', label: 'Email', width: 250, visible: true },
  { field: 'phone', label: 'Phone', width: 150, visible: true },
  { field: 'city', label: 'City', width: 150, visible: true },
  { field: 'state', label: 'State', width: 100, visible: true },
  { field: 'zip', label: 'Zip', width: 80, visible: false },
];

const groups: ColumnGroup[] = [
  { id: 'contact', label: 'Contact Info', collapsed: false },
  { id: 'location', label: 'Location', collapsed: false },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialWideReportState', () => {
  it('creates empty state', () => {
    const state = initialWideReportState();
    expect(state.columns).toHaveLength(0);
    expect(state.frozenLeftCount).toBe(0);
    expect(state.frozenRightCount).toBe(0);
    expect(state.columnSearch).toBe('');
  });

  it('accepts initial columns and groups', () => {
    const state = initialWideReportState(columns, groups);
    expect(state.columns).toHaveLength(7);
    expect(state.groups).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Column groups
// ---------------------------------------------------------------------------

describe('column groups', () => {
  it('adds a group', () => {
    let state = initialWideReportState(columns);
    state = addColumnGroup(state, { id: 'g1', label: 'Group 1', collapsed: false });
    expect(state.groups).toHaveLength(1);
  });

  it('does not add duplicate group', () => {
    let state = initialWideReportState(columns, groups);
    state = addColumnGroup(state, groups[0]);
    expect(state.groups).toHaveLength(2);
  });

  it('removes a group and unassigns columns', () => {
    let state = initialWideReportState(columns, groups);
    state = assignColumnToGroup(state, 'email', 'contact');
    state = removeColumnGroup(state, 'contact');
    expect(state.groups).toHaveLength(1);
    expect(state.columns.find(c => c.field === 'email')?.groupId).toBeUndefined();
  });

  it('toggles group collapsed', () => {
    let state = initialWideReportState(columns, groups);
    state = toggleGroupCollapsed(state, 'contact');
    expect(state.groups.find(g => g.id === 'contact')?.collapsed).toBe(true);
  });

  it('assigns columns to groups', () => {
    let state = initialWideReportState(columns, groups);
    state = assignColumnToGroup(state, 'email', 'contact');
    state = assignColumnToGroup(state, 'phone', 'contact');
    expect(getColumnsInGroup(state, 'contact')).toHaveLength(2);
  });

  it('getUngroupedColumns works', () => {
    let state = initialWideReportState(columns, groups);
    state = assignColumnToGroup(state, 'email', 'contact');
    expect(getUngroupedColumns(state)).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Frozen columns
// ---------------------------------------------------------------------------

describe('frozen columns', () => {
  it('freezes left columns', () => {
    let state = initialWideReportState(columns);
    state = setFrozenLeft(state, 2);
    expect(state.frozenLeftCount).toBe(2);
    expect(getFrozenLeftColumns(state)).toHaveLength(2);
    expect(getFrozenLeftColumns(state)[0].field).toBe('id');
  });

  it('freezes right columns', () => {
    let state = initialWideReportState(columns);
    state = setFrozenRight(state, 1);
    expect(getFrozenRightColumns(state)).toHaveLength(1);
    expect(getFrozenRightColumns(state)[0].field).toBe('zip');
  });

  it('getScrollableColumns excludes frozen', () => {
    let state = initialWideReportState(columns);
    state = setFrozenLeft(state, 1);
    state = setFrozenRight(state, 1);
    const scrollable = getScrollableColumns(state);
    expect(scrollable).toHaveLength(5);
    expect(scrollable[0].field).toBe('name');
  });

  it('clamps frozen count', () => {
    let state = initialWideReportState(columns);
    state = setFrozenLeft(state, -1);
    expect(state.frozenLeftCount).toBe(0);
    state = setFrozenLeft(state, 100);
    expect(state.frozenLeftCount).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Column search
// ---------------------------------------------------------------------------

describe('column search', () => {
  it('filters by field name', () => {
    let state = initialWideReportState(columns);
    state = setColumnSearch(state, 'email');
    expect(getFilteredColumns(state)).toHaveLength(1);
  });

  it('filters by label', () => {
    let state = initialWideReportState(columns);
    state = setColumnSearch(state, 'Phone');
    expect(getFilteredColumns(state)).toHaveLength(1);
  });

  it('returns all when search is empty', () => {
    const state = initialWideReportState(columns);
    expect(getFilteredColumns(state)).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// Visible columns (group collapse)
// ---------------------------------------------------------------------------

describe('getVisibleColumns', () => {
  it('hides columns in collapsed groups', () => {
    let state = initialWideReportState(columns, groups);
    state = assignColumnToGroup(state, 'email', 'contact');
    state = assignColumnToGroup(state, 'phone', 'contact');
    state = toggleGroupCollapsed(state, 'contact');
    const visible = getVisibleColumns(state);
    expect(visible.some(c => c.field === 'email')).toBe(false);
    expect(visible.some(c => c.field === 'phone')).toBe(false);
  });

  it('hides columns with visible=false', () => {
    const visible = getVisibleColumns(initialWideReportState(columns));
    expect(visible.some(c => c.field === 'zip')).toBe(false);
    expect(visible).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Drag-and-drop reorder
// ---------------------------------------------------------------------------

describe('drag-and-drop', () => {
  it('reorders columns', () => {
    let state = initialWideReportState(columns);
    state = startColumnDrag(state, 0);
    state = hoverColumnTarget(state, 2);
    state = dropColumn(state);
    expect(state.columns[0].field).toBe('name');
    expect(state.columns[1].field).toBe('email');
    expect(state.columns[2].field).toBe('id');
  });

  it('cancels drag', () => {
    let state = initialWideReportState(columns);
    state = startColumnDrag(state, 0);
    state = cancelColumnDrag(state);
    expect(state.dragSourceIndex).toBeUndefined();
    expect(state.dragTargetIndex).toBeUndefined();
  });

  it('handles invalid indices gracefully', () => {
    let state = initialWideReportState(columns);
    state = startColumnDrag(state, -1);
    expect(state.dragSourceIndex).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Column CRUD
// ---------------------------------------------------------------------------

describe('column CRUD', () => {
  it('adds a column', () => {
    let state = initialWideReportState();
    state = addWideColumn(state, { field: 'new', label: 'New', width: 100, visible: true });
    expect(state.columns).toHaveLength(1);
  });

  it('does not add duplicate', () => {
    let state = initialWideReportState(columns);
    state = addWideColumn(state, columns[0]);
    expect(state.columns).toHaveLength(7);
  });

  it('removes a column', () => {
    let state = initialWideReportState(columns);
    state = removeWideColumn(state, 'email');
    expect(state.columns).toHaveLength(6);
  });

  it('updates a column', () => {
    let state = initialWideReportState(columns);
    state = updateWideColumn(state, 'name', { width: 300 });
    expect(state.columns.find(c => c.field === 'name')?.width).toBe(300);
  });

  it('toggles column visibility', () => {
    let state = initialWideReportState(columns);
    state = toggleWideColumnVisibility(state, 'zip');
    expect(state.columns.find(c => c.field === 'zip')?.visible).toBe(true);
  });
});
