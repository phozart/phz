/**
 * @phozart/workspace — Report Editor State
 *
 * Pure functions for configuring a report (a configured <phz-grid>).
 * Manages columns, filters, sorting, grouping, conditional formatting, and density.
 */
export function initialReportEditorState(name, dataSourceId) {
    return {
        name, dataSourceId,
        columns: [], filters: [], sorting: [], grouping: [], formatting: [], additionalSources: [],
        density: 'comfortable',
        configPanelTab: 'columns',
    };
}
export function addColumn(state, field, label) {
    if (state.columns.some(c => c.field === field))
        return state; // no duplicates
    const col = { field, label: label ?? field, visible: true };
    return { ...state, columns: [...state.columns, col] };
}
export function removeColumn(state, field) {
    return { ...state, columns: state.columns.filter(c => c.field !== field) };
}
export function reorderColumns(state, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= state.columns.length || toIndex < 0 || toIndex >= state.columns.length)
        return state;
    const cols = [...state.columns];
    const [moved] = cols.splice(fromIndex, 1);
    cols.splice(toIndex, 0, moved);
    return { ...state, columns: cols };
}
export function updateColumn(state, field, updates) {
    return {
        ...state,
        columns: state.columns.map(c => c.field === field ? { ...c, ...updates, field: c.field } : c),
    };
}
export function toggleColumnVisibility(state, field) {
    return updateColumn(state, field, { visible: !state.columns.find(c => c.field === field)?.visible });
}
export function pinColumn(state, field, side) {
    return updateColumn(state, field, { pinned: side });
}
export function addFilter(state, filter) {
    // Replace existing filter for same filterId if present
    const filters = state.filters.filter(f => f.filterId !== filter.filterId);
    return { ...state, filters: [...filters, filter] };
}
export function removeFilter(state, filterId) {
    return { ...state, filters: state.filters.filter(f => f.filterId !== filterId) };
}
export function setSorting(state, sorting) {
    return { ...state, sorting };
}
export function setGrouping(state, fields) {
    return { ...state, grouping: fields };
}
export function addConditionalFormat(state, rule) {
    return { ...state, formatting: [...state.formatting, rule] };
}
export function removeConditionalFormat(state, ruleId) {
    return { ...state, formatting: state.formatting.filter(r => r.id !== ruleId) };
}
export function setDensity(state, density) {
    return { ...state, density };
}
export function setConfigPanelTab(state, tab) {
    return { ...state, configPanelTab: tab };
}
export function selectColumn(state, field) {
    return { ...state, selectedColumnField: field };
}
export function toGridConfig(state) {
    return {
        columns: state.columns.map(c => ({
            field: c.field,
            headerName: c.label,
            width: c.width,
            hide: !c.visible ? true : undefined,
            pinned: c.pinned,
        })),
        filters: state.filters,
        sorting: state.sorting,
        grouping: state.grouping,
        density: state.density,
    };
}
// ========================================================================
// Multi-source report functions
// ========================================================================
let reportSourceCounter = 0;
export function addReportSource(state, dataSourceId, alias, joinKeys, joinType = 'inner') {
    reportSourceCounter++;
    const slotId = `rpt_src_${Date.now()}_${reportSourceCounter}`;
    const source = { slotId, dataSourceId, alias, joinKeys, joinType };
    return { ...state, additionalSources: [...state.additionalSources, source] };
}
export function removeReportSource(state, slotId) {
    return { ...state, additionalSources: state.additionalSources.filter(s => s.slotId !== slotId) };
}
export function updateReportSource(state, slotId, updates) {
    return {
        ...state,
        additionalSources: state.additionalSources.map(s => s.slotId === slotId ? { ...s, ...updates, slotId } : s),
    };
}
/**
 * Reset the report source counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetReportSourceCounter() {
    reportSourceCounter = 0;
}
//# sourceMappingURL=report-editor-state.js.map