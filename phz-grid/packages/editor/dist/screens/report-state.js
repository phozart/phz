/**
 * @phozart/editor — Report Editing State (B-2.09)
 *
 * State machine for the report editing screen. Supports report
 * configuration (columns, filters, sorting), preview mode,
 * and save/publish actions.
 */
// ========================================================================
// Factory
// ========================================================================
export function createReportEditState(reportId, overrides) {
    return {
        reportId,
        title: '',
        description: '',
        dataSourceId: '',
        columns: [],
        filters: [],
        sorts: [],
        rowLimit: 0,
        previewMode: false,
        previewData: null,
        previewRowCount: 0,
        visibility: 'personal',
        dirty: false,
        loading: false,
        error: null,
        ...overrides,
    };
}
// ========================================================================
// Column operations
// ========================================================================
/**
 * Add a column to the report.
 */
export function addReportColumn(state, column) {
    return {
        ...state,
        columns: [...state.columns, column],
        dirty: true,
    };
}
/**
 * Remove a column by field name.
 */
export function removeReportColumn(state, field) {
    return {
        ...state,
        columns: state.columns.filter(c => c.field !== field),
        dirty: true,
    };
}
/**
 * Update a column's configuration.
 */
export function updateReportColumn(state, field, updates) {
    return {
        ...state,
        columns: state.columns.map(c => c.field === field ? { ...c, ...updates } : c),
        dirty: true,
    };
}
/**
 * Reorder columns by providing the new field order.
 */
export function reorderReportColumns(state, fieldOrder) {
    const columnMap = new Map(state.columns.map(c => [c.field, c]));
    const reordered = fieldOrder
        .map(field => columnMap.get(field))
        .filter((c) => c !== undefined);
    return { ...state, columns: reordered, dirty: true };
}
// ========================================================================
// Filter operations
// ========================================================================
/**
 * Add a filter to the report.
 */
export function addReportFilter(state, filter) {
    return {
        ...state,
        filters: [...state.filters, filter],
        dirty: true,
    };
}
/**
 * Remove a filter by index.
 */
export function removeReportFilter(state, index) {
    const filters = [...state.filters];
    filters.splice(index, 1);
    return { ...state, filters, dirty: true };
}
/**
 * Update a filter at a given index.
 */
export function updateReportFilter(state, index, updates) {
    const filters = state.filters.map((f, i) => i === index ? { ...f, ...updates } : f);
    return { ...state, filters, dirty: true };
}
// ========================================================================
// Sort operations
// ========================================================================
/**
 * Set the sort configuration.
 */
export function setReportSorts(state, sorts) {
    return { ...state, sorts, dirty: true };
}
// ========================================================================
// Preview mode
// ========================================================================
/**
 * Toggle preview mode.
 */
export function toggleReportPreview(state) {
    return { ...state, previewMode: !state.previewMode };
}
/**
 * Set preview data.
 */
export function setReportPreviewData(state, data, rowCount) {
    return { ...state, previewData: data, previewRowCount: rowCount, previewMode: true };
}
/**
 * Clear preview data.
 */
export function clearReportPreview(state) {
    return { ...state, previewData: null, previewRowCount: 0, previewMode: false };
}
// ========================================================================
// Metadata
// ========================================================================
/**
 * Set report title.
 */
export function setReportTitle(state, title) {
    return { ...state, title, dirty: true };
}
/**
 * Set report description.
 */
export function setReportDescription(state, description) {
    return { ...state, description, dirty: true };
}
/**
 * Set the data source.
 */
export function setReportDataSource(state, dataSourceId) {
    return { ...state, dataSourceId, dirty: true };
}
/**
 * Mark the report as saved.
 */
export function markReportSaved(state) {
    return { ...state, dirty: false };
}
/**
 * Set loading state.
 */
export function setReportLoading(state, loading) {
    return { ...state, loading, error: loading ? null : state.error };
}
/**
 * Set error state.
 */
export function setReportError(state, error) {
    return { ...state, error, loading: false };
}
//# sourceMappingURL=report-state.js.map