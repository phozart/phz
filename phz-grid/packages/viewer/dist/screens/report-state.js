/**
 * @phozart/viewer — Report View State
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
        sortColumns: overrides?.sortColumns ?? [],
        page: overrides?.page ?? 0,
        pageSize: overrides?.pageSize ?? 50,
        totalRows: overrides?.totalRows ?? 0,
        loading: overrides?.loading ?? false,
        exportFormats: overrides?.exportFormats ?? ['csv', 'xlsx'],
        exporting: overrides?.exporting ?? false,
        searchQuery: overrides?.searchQuery ?? '',
        rows: overrides?.rows ?? [],
        lastRefreshed: overrides?.lastRefreshed ?? null,
        hoveredColumn: overrides?.hoveredColumn ?? null,
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
        sortColumns: [],
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
 * Set sort configuration (backward compatible — wraps single sort into array).
 */
export function setReportSort(state, sort) {
    return { ...state, sortColumns: sort ? [sort] : [], page: 0, loading: true };
}
/**
 * Toggle sort on a field. Cycles: asc -> desc -> remove.
 * When addToMulti is false (default), replaces the entire sort array (single-sort).
 * When addToMulti is true, appends/toggles within the multi-sort array.
 */
export function toggleReportSort(state, field, addToMulti = false) {
    if (!addToMulti) {
        // Single sort behavior (backward compatible)
        const existing = state.sortColumns.find(s => s.field === field);
        if (!existing) {
            return { ...state, sortColumns: [{ field, direction: 'asc' }], page: 0, loading: true };
        }
        if (existing.direction === 'asc') {
            return { ...state, sortColumns: [{ field, direction: 'desc' }], page: 0, loading: true };
        }
        return { ...state, sortColumns: [], page: 0, loading: true };
    }
    // Multi-sort behavior
    const idx = state.sortColumns.findIndex(s => s.field === field);
    if (idx === -1) {
        return { ...state, sortColumns: [...state.sortColumns, { field, direction: 'asc' }], page: 0, loading: true };
    }
    if (state.sortColumns[idx].direction === 'asc') {
        const updated = [...state.sortColumns];
        updated[idx] = { field, direction: 'desc' };
        return { ...state, sortColumns: updated, page: 0, loading: true };
    }
    // Remove from multi-sort
    return { ...state, sortColumns: state.sortColumns.filter(s => s.field !== field), page: 0, loading: true };
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
/**
 * Add a column to the multi-sort array.
 * If field already sorted, updates direction.
 */
export function addSortColumn(state, field, direction) {
    const existing = state.sortColumns.findIndex(s => s.field === field);
    if (existing >= 0) {
        const updated = [...state.sortColumns];
        updated[existing] = { field, direction };
        return { ...state, sortColumns: updated, page: 0, loading: true };
    }
    return { ...state, sortColumns: [...state.sortColumns, { field, direction }], page: 0, loading: true };
}
/**
 * Remove a column from the multi-sort array.
 */
export function removeSortColumn(state, field) {
    const filtered = state.sortColumns.filter(s => s.field !== field);
    if (filtered.length === state.sortColumns.length)
        return state;
    return { ...state, sortColumns: filtered, page: 0, loading: true };
}
/**
 * Clear all sort columns.
 */
export function clearAllSorts(state) {
    return { ...state, sortColumns: [], page: 0, loading: true };
}
/**
 * Get the sort priority index for a field (-1 if not sorted).
 */
export function getSortIndex(state, field) {
    return state.sortColumns.findIndex(s => s.field === field);
}
/**
 * Set the currently hovered column header field.
 * Pass `null` to clear the hover state.
 */
export function setHoveredColumn(state, field) {
    return { ...state, hoveredColumn: field };
}
/**
 * Compute the list of contextual actions available for a column header.
 *
 * Actions are determined by the column's type and the current sort state:
 * - **Universal**: sort-asc, sort-desc, clear-sort, filter, hide, pin-left, pin-right
 * - **String / Date**: group
 * - **Number**: aggregate
 *
 * Sort actions reflect the current sort state via `active`. The `clear-sort`
 * action is always present but only `enabled` when the column is actively sorted.
 */
export function computeHeaderActions(state, field, columnType) {
    const currentSort = state.sortColumns.find(s => s.field === field);
    const isSorted = currentSort != null;
    const actions = [
        {
            type: 'sort-asc',
            label: 'Sort Ascending',
            icon: 'arrow-up',
            enabled: true,
            active: currentSort?.direction === 'asc',
        },
        {
            type: 'sort-desc',
            label: 'Sort Descending',
            icon: 'arrow-down',
            enabled: true,
            active: currentSort?.direction === 'desc',
        },
        {
            type: 'clear-sort',
            label: 'Clear Sort',
            icon: 'x-circle',
            enabled: isSorted,
            active: false,
        },
        {
            type: 'filter',
            label: 'Filter',
            icon: 'filter',
            enabled: true,
            active: false,
        },
    ];
    // Type-specific actions
    if (columnType === 'string' || columnType === 'date') {
        actions.push({
            type: 'group',
            label: 'Group',
            icon: 'layers',
            enabled: true,
            active: false,
        });
    }
    if (columnType === 'number') {
        actions.push({
            type: 'aggregate',
            label: 'Aggregate',
            icon: 'sigma',
            enabled: true,
            active: false,
        });
    }
    // Column management actions (universal)
    actions.push({
        type: 'hide',
        label: 'Hide Column',
        icon: 'eye-off',
        enabled: true,
        active: false,
    }, {
        type: 'pin-left',
        label: 'Pin Left',
        icon: 'pin-left',
        enabled: true,
        active: false,
    }, {
        type: 'pin-right',
        label: 'Pin Right',
        icon: 'pin-right',
        enabled: true,
        active: false,
    });
    return actions;
}
//# sourceMappingURL=report-state.js.map