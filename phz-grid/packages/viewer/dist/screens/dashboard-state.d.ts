/**
 * @phozart/viewer — Dashboard View State
 *
 * Headless state machine for viewing a dashboard. Manages active
 * dashboard metadata, widget positions, cross-filter state,
 * and widget-level loading/error tracking.
 */
import type { FilterContextManager, CrossFilterEntry } from '@phozart/shared/coordination';
import type { WidgetPosition } from '@phozart/shared/types';
export interface DashboardWidgetView {
    id: string;
    type: string;
    title: string;
    position: WidgetPosition;
    config: Record<string, unknown>;
    loading: boolean;
    error: string | null;
}
export interface DashboardViewState {
    /** ID of the dashboard being viewed. */
    dashboardId: string | null;
    /** Dashboard title. */
    title: string;
    /** Dashboard description. */
    description: string;
    /** Ordered list of widgets in the dashboard. */
    widgets: DashboardWidgetView[];
    /** Cross-filter state across widgets. */
    crossFilters: CrossFilterEntry[];
    /** Reference to the dashboard-level filter context. */
    filterContext: FilterContextManager | null;
    /** Whether the dashboard is currently loading. */
    loading: boolean;
    /** Whether the dashboard is in fullscreen mode. */
    fullscreen: boolean;
    /** ID of the widget currently expanded (null if none). */
    expandedWidgetId: string | null;
    /** Last refresh timestamp. */
    lastRefreshed: number | null;
}
export declare function createDashboardViewState(overrides?: Partial<DashboardViewState>): DashboardViewState;
/**
 * Load a dashboard by setting its metadata and widgets.
 */
export declare function loadDashboard(state: DashboardViewState, dashboard: {
    id: string;
    title: string;
    description?: string;
    widgets: DashboardWidgetView[];
}): DashboardViewState;
/**
 * Set loading state for a specific widget.
 */
export declare function setWidgetLoading(state: DashboardViewState, widgetId: string, loading: boolean): DashboardViewState;
/**
 * Set error state for a specific widget.
 */
export declare function setWidgetError(state: DashboardViewState, widgetId: string, error: string | null): DashboardViewState;
/**
 * Apply a cross-filter from one widget to the dashboard.
 */
export declare function applyCrossFilter(state: DashboardViewState, entry: CrossFilterEntry): DashboardViewState;
/**
 * Clear a cross-filter from a specific widget.
 */
export declare function clearCrossFilter(state: DashboardViewState, widgetId: string): DashboardViewState;
/**
 * Clear all cross-filters.
 */
export declare function clearAllCrossFilters(state: DashboardViewState): DashboardViewState;
/**
 * Toggle fullscreen mode.
 */
export declare function toggleFullscreen(state: DashboardViewState): DashboardViewState;
/**
 * Expand or collapse a single widget.
 * Passing the same widgetId again collapses it.
 */
export declare function toggleWidgetExpanded(state: DashboardViewState, widgetId: string): DashboardViewState;
/**
 * Refresh the dashboard (set loading and update timestamp).
 */
export declare function refreshDashboard(state: DashboardViewState): DashboardViewState;
//# sourceMappingURL=dashboard-state.d.ts.map