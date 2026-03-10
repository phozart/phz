/**
 * @phozart/phz-viewer — Report View State
 *
 * Headless state machine for viewing a report or grid definition.
 * Manages pagination, sort, column visibility, and export options.
 */
// ========================================================================
// Factory
// ========================================================================
export function createReportViewState(overrides) {
    return {
        reportId: overrides?.reportId ?? null,
        title: overrides?.title ?? '',
        description: overrides?.description ?? '',
        columns: overrides?.columns ?? [],
        sort: overrides?.sort ?? null,
        page: overrides?.page ?? 0,
        pageSize: overrides?.pageSize ?? 50,
        totalRows: overrides?.totalRows ?? 0,
        loading: overrides?.loading ?? false,
        exportFormats: overrides?.exportFormats ?? ['csv', 'xlsx'],
        exporting: overrides?.exporting ?? false,
        searchQuery: overrides?.searchQuery ?? '',
        rows: overrides?.rows ?? [],
        lastRefreshed: overrides?.lastRefreshed ?? null,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Load report metadata (columns, title, etc.).
 */
export function loadReport(state, report) {
    return {
        ...state,
        reportId: report.id,
        title: report.title,
        description: report.description ?? '',
        columns: report.columns,
        exportFormats: report.exportFormats ?? state.exportFormats,
        loading: false,
        page: 0,
        sort: null,
        searchQuery: '',
        lastRefreshed: Date.now(),
    };
}
/**
 * Set report data (rows + total count).
 */
export function setReportData(state, rows, totalRows) {
    return {
        ...state,
        rows,
        totalRows,
        loading: false,
        lastRefreshed: Date.now(),
    };
}
/**
 * Set sort configuration.
 */
export function setReportSort(state, sort) {
    return { ...state, sort, page: 0, loading: true };
}
/**
 * Toggle sort on a field. Cycles: asc -> desc -> none.
 */
export function toggleReportSort(state, field) {
    if (state.sort?.field !== field) {
        return setReportSort(state, { field, direction: 'asc' });
    }
    if (state.sort.direction === 'asc') {
        return setReportSort(state, { field, direction: 'desc' });
    }
    return setReportSort(state, null);
}
/**
 * Set the current page (0-based). Clamps to valid range.
 */
export function setReportPage(state, page) {
    const maxPage = Math.max(0, Math.ceil(state.totalRows / state.pageSize) - 1);
    return { ...state, page: Math.max(0, Math.min(page, maxPage)), loading: true };
}
/**
 * Set the page size and reset to first page.
 */
export function setReportPageSize(state, pageSize) {
    return { ...state, pageSize: Math.max(1, pageSize), page: 0, loading: true };
}
/**
 * Set search query.
 */
export function setReportSearch(state, searchQuery) {
    return { ...state, searchQuery, page: 0, loading: true };
}
/**
 * Toggle column visibility.
 */
export function toggleColumnVisibility(state, field) {
    return {
        ...state,
        columns: state.columns.map(c => c.field === field ? { ...c, visible: !c.visible } : c),
    };
}
/**
 * Set exporting state.
 */
export function setExporting(state, exporting) {
    return { ...state, exporting };
}
/**
 * Get total number of pages.
 */
export function getReportTotalPages(state) {
    return Math.max(1, Math.ceil(state.totalRows / state.pageSize));
}
/**
 * Get visible columns.
 */
export function getVisibleColumns(state) {
    return state.columns.filter(c => c.visible);
}
//# sourceMappingURL=report-state.js.map