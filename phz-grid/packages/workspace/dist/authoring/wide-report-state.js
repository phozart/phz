/**
 * @phozart/workspace — Wide Report Editor State (B-3.03)
 *
 * Pure functions for managing reports with 30+ columns.
 * Supports column groups, horizontal scroll with frozen columns,
 * column search/filter in the configurator, and drag-and-drop reorder.
 */
// ========================================================================
// Factory
// ========================================================================
export function initialWideReportState(columns = [], groups = []) {
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
export function addColumnGroup(state, group) {
    if (state.groups.some(g => g.id === group.id))
        return state;
    return { ...state, groups: [...state.groups, group] };
}
export function removeColumnGroup(state, groupId) {
    return {
        ...state,
        groups: state.groups.filter(g => g.id !== groupId),
        columns: state.columns.map(c => c.groupId === groupId ? { ...c, groupId: undefined } : c),
    };
}
export function toggleGroupCollapsed(state, groupId) {
    return {
        ...state,
        groups: state.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g),
    };
}
export function assignColumnToGroup(state, field, groupId) {
    return {
        ...state,
        columns: state.columns.map(c => c.field === field ? { ...c, groupId } : c),
    };
}
export function getColumnsInGroup(state, groupId) {
    return state.columns.filter(c => c.groupId === groupId);
}
export function getUngroupedColumns(state) {
    return state.columns.filter(c => !c.groupId);
}
// ========================================================================
// Frozen columns
// ========================================================================
export function setFrozenLeft(state, count) {
    return {
        ...state,
        frozenLeftCount: Math.max(0, Math.min(count, state.columns.length)),
    };
}
export function setFrozenRight(state, count) {
    return {
        ...state,
        frozenRightCount: Math.max(0, Math.min(count, state.columns.length)),
    };
}
export function getFrozenLeftColumns(state) {
    return state.columns.slice(0, state.frozenLeftCount);
}
export function getFrozenRightColumns(state) {
    if (state.frozenRightCount === 0)
        return [];
    return state.columns.slice(-state.frozenRightCount);
}
export function getScrollableColumns(state) {
    const end = state.frozenRightCount > 0
        ? state.columns.length - state.frozenRightCount
        : state.columns.length;
    return state.columns.slice(state.frozenLeftCount, end);
}
// ========================================================================
// Column search / filter
// ========================================================================
export function setColumnSearch(state, search) {
    return { ...state, columnSearch: search };
}
export function getFilteredColumns(state) {
    if (!state.columnSearch)
        return state.columns;
    const q = state.columnSearch.toLowerCase();
    return state.columns.filter(c => c.field.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q));
}
// ========================================================================
// Visible columns (accounting for group collapse)
// ========================================================================
export function getVisibleColumns(state) {
    const collapsedGroups = new Set(state.groups.filter(g => g.collapsed).map(g => g.id));
    return state.columns.filter(c => {
        if (!c.visible)
            return false;
        if (c.groupId && collapsedGroups.has(c.groupId))
            return false;
        return true;
    });
}
// ========================================================================
// Drag-and-drop reorder
// ========================================================================
export function startColumnDrag(state, fromIndex) {
    if (fromIndex < 0 || fromIndex >= state.columns.length)
        return state;
    return { ...state, dragSourceIndex: fromIndex, dragTargetIndex: undefined };
}
export function hoverColumnTarget(state, targetIndex) {
    return { ...state, dragTargetIndex: targetIndex };
}
export function dropColumn(state) {
    if (state.dragSourceIndex === undefined ||
        state.dragTargetIndex === undefined) {
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
export function cancelColumnDrag(state) {
    return { ...state, dragSourceIndex: undefined, dragTargetIndex: undefined };
}
// ========================================================================
// Column add / remove
// ========================================================================
export function addWideColumn(state, column) {
    if (state.columns.some(c => c.field === column.field))
        return state;
    return { ...state, columns: [...state.columns, column] };
}
export function removeWideColumn(state, field) {
    return { ...state, columns: state.columns.filter(c => c.field !== field) };
}
export function updateWideColumn(state, field, updates) {
    return {
        ...state,
        columns: state.columns.map(c => c.field === field ? { ...c, ...updates, field: c.field } : c),
    };
}
export function toggleWideColumnVisibility(state, field) {
    const col = state.columns.find(c => c.field === field);
    if (!col)
        return state;
    return updateWideColumn(state, field, { visible: !col.visible });
}
//# sourceMappingURL=wide-report-state.js.map