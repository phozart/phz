/**
 * @phozart/editor — Explorer State (B-2.10)
 *
 * State machine for the editor explorer screen. Extends the engine
 * explorer with save-to-artifact capability, allowing users to
 * promote ad-hoc queries into saved reports or dashboard widgets.
 */
// ========================================================================
// Factory
// ========================================================================
export function createExplorerState(dataSourceId, overrides) {
    return {
        query: { dimensions: [], measures: [], filters: [] },
        dataSourceId: dataSourceId ?? '',
        availableFields: [],
        suggestedChartType: null,
        previewData: null,
        resultRowCount: 0,
        executing: false,
        saveDialogOpen: false,
        saveTarget: null,
        loading: false,
        error: null,
        ...overrides,
    };
}
// ========================================================================
// Query building operations
// ========================================================================
/**
 * Add a dimension to the explore query.
 */
export function addDimension(state, field) {
    return {
        ...state,
        query: {
            ...state.query,
            dimensions: [...state.query.dimensions, field],
        },
        previewData: null, // Invalidate preview on query change
    };
}
/**
 * Remove a dimension from the explore query.
 */
export function removeDimension(state, field) {
    return {
        ...state,
        query: {
            ...state.query,
            dimensions: state.query.dimensions.filter(d => d.field !== field),
        },
        previewData: null,
    };
}
/**
 * Add a measure to the explore query.
 */
export function addMeasure(state, measure) {
    return {
        ...state,
        query: {
            ...state.query,
            measures: [...state.query.measures, measure],
        },
        previewData: null,
    };
}
/**
 * Remove a measure from the explore query.
 */
export function removeMeasure(state, field) {
    return {
        ...state,
        query: {
            ...state.query,
            measures: state.query.measures.filter(m => m.field !== field),
        },
        previewData: null,
    };
}
/**
 * Add a filter to the explore query.
 */
export function addExplorerFilter(state, filter) {
    return {
        ...state,
        query: {
            ...state.query,
            filters: [...state.query.filters, filter],
        },
        previewData: null,
    };
}
/**
 * Remove a filter from the explore query by index.
 */
export function removeExplorerFilter(state, index) {
    const filters = [...state.query.filters];
    filters.splice(index, 1);
    return {
        ...state,
        query: { ...state.query, filters },
        previewData: null,
    };
}
/**
 * Set the sort on the explore query.
 */
export function setExplorerSort(state, sort) {
    return {
        ...state,
        query: { ...state.query, sort },
        previewData: null,
    };
}
/**
 * Set the row limit on the explore query.
 */
export function setExplorerLimit(state, limit) {
    return {
        ...state,
        query: { ...state.query, limit },
        previewData: null,
    };
}
// ========================================================================
// Query execution
// ========================================================================
/**
 * Mark the explorer as executing a query.
 */
export function setExplorerExecuting(state, executing) {
    return { ...state, executing };
}
/**
 * Set the preview results from a query execution.
 */
export function setExplorerResults(state, data, rowCount) {
    return {
        ...state,
        previewData: data,
        resultRowCount: rowCount,
        executing: false,
        error: null,
    };
}
/**
 * Set a suggested chart type.
 */
export function setSuggestedChartType(state, chartType) {
    return { ...state, suggestedChartType: chartType };
}
// ========================================================================
// Save-to-artifact flow
// ========================================================================
/**
 * Open the save dialog with a target type.
 */
export function openSaveDialog(state, targetType, name, artifactId) {
    return {
        ...state,
        saveDialogOpen: true,
        saveTarget: {
            type: targetType,
            name: name ?? '',
            artifactId,
        },
    };
}
/**
 * Update the save target.
 */
export function updateSaveTarget(state, updates) {
    if (!state.saveTarget)
        return state;
    return {
        ...state,
        saveTarget: { ...state.saveTarget, ...updates },
    };
}
/**
 * Close the save dialog.
 */
export function closeSaveDialog(state) {
    return { ...state, saveDialogOpen: false, saveTarget: null };
}
// ========================================================================
// Data source
// ========================================================================
/**
 * Set the data source ID and available fields.
 */
export function setExplorerDataSource(state, dataSourceId, fields) {
    return {
        ...state,
        dataSourceId,
        availableFields: fields,
        // Reset query when switching data sources
        query: { dimensions: [], measures: [], filters: [] },
        previewData: null,
        resultRowCount: 0,
        suggestedChartType: null,
    };
}
/**
 * Set explorer error state.
 */
export function setExplorerError(state, error) {
    return { ...state, error, executing: false, loading: false };
}
//# sourceMappingURL=explorer-state.js.map