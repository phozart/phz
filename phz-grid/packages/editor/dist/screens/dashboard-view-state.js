/**
 * @phozart/phz-editor — Dashboard View State (B-2.05)
 *
 * Read-only dashboard view state for the editor context.
 * Same visual as the viewer shell, but with the editor chrome
 * (toolbar actions like "Edit", "Share", "Subscribe").
 */
// ========================================================================
// Factory
// ========================================================================
export function createDashboardViewState(dashboardId, overrides) {
    return {
        dashboardId,
        title: '',
        description: '',
        widgets: [],
        gridLayout: { columns: 12, rows: 8, gap: 16 },
        visibility: 'personal',
        ownerId: '',
        canEdit: false,
        canShare: false,
        loading: false,
        error: null,
        expandedWidgetId: null,
        ...overrides,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Set dashboard data from a loaded artifact.
 */
export function setDashboardData(state, data) {
    return {
        ...state,
        title: data.title,
        description: data.description ?? '',
        widgets: data.widgets,
        gridLayout: data.gridLayout ?? state.gridLayout,
        visibility: data.visibility,
        ownerId: data.ownerId,
        loading: false,
        error: null,
    };
}
/**
 * Set the edit/share permissions for the current viewer.
 */
export function setPermissions(state, permissions) {
    return { ...state, ...permissions };
}
/**
 * Expand a widget to fullscreen.
 */
export function expandWidget(state, widgetId) {
    return { ...state, expandedWidgetId: widgetId };
}
/**
 * Collapse the expanded widget.
 */
export function collapseWidget(state) {
    return { ...state, expandedWidgetId: null };
}
/**
 * Set loading state.
 */
export function setDashboardViewLoading(state, loading) {
    return { ...state, loading, error: loading ? null : state.error };
}
/**
 * Set error state.
 */
export function setDashboardViewError(state, error) {
    return { ...state, error, loading: false };
}
//# sourceMappingURL=dashboard-view-state.js.map