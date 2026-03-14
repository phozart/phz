/**
 * @phozart/viewer — Explorer Screen State
 *
 * Thin wrapper around @phozart/engine/explorer DataExplorer.
 * Adds viewer-specific concerns: data source selection, preview
 * rendering mode, and chart type tracking.
 */
// ========================================================================
// Factory
// ========================================================================
export function createExplorerScreenState(overrides) {
    return {
        dataSources: overrides?.dataSources ?? [],
        selectedSourceId: overrides?.selectedSourceId ?? null,
        fields: overrides?.fields ?? [],
        explorer: overrides?.explorer ?? null,
        previewMode: overrides?.previewMode ?? 'table',
        suggestedChartType: overrides?.suggestedChartType ?? null,
        loadingDataSources: overrides?.loadingDataSources ?? false,
        loadingFields: overrides?.loadingFields ?? false,
        loadingPreview: overrides?.loadingPreview ?? false,
        fieldSearchQuery: overrides?.fieldSearchQuery ?? '',
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Set the available data sources.
 */
export function setDataSources(state, dataSources) {
    return { ...state, dataSources, loadingDataSources: false };
}
/**
 * Select a data source and clear any prior field state.
 */
export function selectDataSource(state, sourceId) {
    return {
        ...state,
        selectedSourceId: sourceId,
        fields: [],
        loadingFields: true,
        suggestedChartType: null,
        fieldSearchQuery: '',
    };
}
/**
 * Set fields after loading schema for the selected source.
 * Also initialises the data explorer with the new fields.
 */
export function setFields(state, fields) {
    // If we have a DataExplorer reference, set its data source
    if (state.explorer && state.selectedSourceId) {
        state.explorer.setDataSource(state.selectedSourceId, fields);
    }
    return {
        ...state,
        fields,
        loadingFields: false,
    };
}
/**
 * Set the DataExplorer reference.
 */
export function setExplorer(state, explorer) {
    return { ...state, explorer };
}
/**
 * Set the preview rendering mode.
 */
export function setPreviewMode(state, previewMode) {
    return { ...state, previewMode };
}
/**
 * Update the suggested chart type from the engine.
 */
export function setSuggestedChartType(state, suggestedChartType) {
    return { ...state, suggestedChartType };
}
/**
 * Set the field search query for the palette filter.
 */
export function setFieldSearch(state, fieldSearchQuery) {
    return { ...state, fieldSearchQuery };
}
/**
 * Get the current explorer state snapshot (from the engine).
 */
export function getExplorerSnapshot(state) {
    return state.explorer?.getState() ?? null;
}
/**
 * Filter fields by the current search query.
 */
export function getFilteredFields(state) {
    if (!state.fieldSearchQuery.trim()) {
        return state.fields;
    }
    const q = state.fieldSearchQuery.toLowerCase().trim();
    return state.fields.filter(f => f.name.toLowerCase().includes(q));
}
//# sourceMappingURL=explorer-state.js.map