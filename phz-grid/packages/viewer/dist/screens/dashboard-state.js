/**
 * @phozart/viewer — Dashboard View State
 *
 * Headless state machine for viewing a dashboard. Manages active
 * dashboard metadata, widget positions, cross-filter state,
 * and widget-level loading/error tracking.
 */
// ========================================================================
// Factory
// ========================================================================
export function createDashboardViewState(overrides) {
    return {
        dashboardId: overrides?.dashboardId ?? null,
        title: overrides?.title ?? '',
        description: overrides?.description ?? '',
        widgets: overrides?.widgets ?? [],
        crossFilters: overrides?.crossFilters ?? [],
        filterContext: overrides?.filterContext ?? null,
        loading: overrides?.loading ?? false,
        fullscreen: overrides?.fullscreen ?? false,
        expandedWidgetId: overrides?.expandedWidgetId ?? null,
        lastRefreshed: overrides?.lastRefreshed ?? null,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Load a dashboard by setting its metadata and widgets.
 */
export function loadDashboard(state, dashboard) {
    return {
        ...state,
        dashboardId: dashboard.id,
        title: dashboard.title,
        description: dashboard.description ?? '',
        widgets: dashboard.widgets,
        loading: false,
        crossFilters: [],
        expandedWidgetId: null,
        lastRefreshed: Date.now(),
    };
}
/**
 * Set loading state for a specific widget.
 */
export function setWidgetLoading(state, widgetId, loading) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId ? { ...w, loading, error: loading ? null : w.error } : w),
    };
}
/**
 * Set error state for a specific widget.
 */
export function setWidgetError(state, widgetId, error) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId ? { ...w, error, loading: false } : w),
    };
}
/**
 * Apply a cross-filter from one widget to the dashboard.
 */
export function applyCrossFilter(state, entry) {
    const crossFilters = state.crossFilters.filter(cf => cf.sourceWidgetId !== entry.sourceWidgetId);
    crossFilters.push(entry);
    return { ...state, crossFilters };
}
/**
 * Clear a cross-filter from a specific widget.
 */
export function clearCrossFilter(state, widgetId) {
    return {
        ...state,
        crossFilters: state.crossFilters.filter(cf => cf.sourceWidgetId !== widgetId),
    };
}
/**
 * Clear all cross-filters.
 */
export function clearAllCrossFilters(state) {
    return { ...state, crossFilters: [] };
}
/**
 * Toggle fullscreen mode.
 */
export function toggleFullscreen(state) {
    return { ...state, fullscreen: !state.fullscreen };
}
/**
 * Expand or collapse a single widget.
 * Passing the same widgetId again collapses it.
 */
export function toggleWidgetExpanded(state, widgetId) {
    return {
        ...state,
        expandedWidgetId: state.expandedWidgetId === widgetId ? null : widgetId,
    };
}
/**
 * Refresh the dashboard (set loading and update timestamp).
 */
export function refreshDashboard(state) {
    return {
        ...state,
        loading: true,
        widgets: state.widgets.map(w => ({ ...w, loading: true, error: null })),
    };
}
//# sourceMappingURL=dashboard-state.js.map