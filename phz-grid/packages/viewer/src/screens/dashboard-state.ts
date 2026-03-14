/**
 * @phozart/viewer — Dashboard View State
 *
 * Headless state machine for viewing a dashboard. Manages active
 * dashboard metadata, widget positions, cross-filter state,
 * and widget-level loading/error tracking.
 */

import type { FilterContextManager, CrossFilterEntry } from '@phozart/shared/coordination';
import type { WidgetPosition } from '@phozart/shared/types';

// ========================================================================
// Dashboard widget metadata (read-only view)
// ========================================================================

export interface DashboardWidgetView {
  id: string;
  type: string;
  title: string;
  position: WidgetPosition;
  config: Record<string, unknown>;
  loading: boolean;
  error: string | null;
}

// ========================================================================
// DashboardViewState
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createDashboardViewState(
  overrides?: Partial<DashboardViewState>,
): DashboardViewState {
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
export function loadDashboard(
  state: DashboardViewState,
  dashboard: {
    id: string;
    title: string;
    description?: string;
    widgets: DashboardWidgetView[];
  },
): DashboardViewState {
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
export function setWidgetLoading(
  state: DashboardViewState,
  widgetId: string,
  loading: boolean,
): DashboardViewState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, loading, error: loading ? null : w.error } : w,
    ),
  };
}

/**
 * Set error state for a specific widget.
 */
export function setWidgetError(
  state: DashboardViewState,
  widgetId: string,
  error: string | null,
): DashboardViewState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, error, loading: false } : w,
    ),
  };
}

/**
 * Apply a cross-filter from one widget to the dashboard.
 */
export function applyCrossFilter(
  state: DashboardViewState,
  entry: CrossFilterEntry,
): DashboardViewState {
  const crossFilters = state.crossFilters.filter(
    cf => cf.sourceWidgetId !== entry.sourceWidgetId,
  );
  crossFilters.push(entry);

  return { ...state, crossFilters };
}

/**
 * Clear a cross-filter from a specific widget.
 */
export function clearCrossFilter(
  state: DashboardViewState,
  widgetId: string,
): DashboardViewState {
  return {
    ...state,
    crossFilters: state.crossFilters.filter(
      cf => cf.sourceWidgetId !== widgetId,
    ),
  };
}

/**
 * Clear all cross-filters.
 */
export function clearAllCrossFilters(
  state: DashboardViewState,
): DashboardViewState {
  return { ...state, crossFilters: [] };
}

/**
 * Toggle fullscreen mode.
 */
export function toggleFullscreen(
  state: DashboardViewState,
): DashboardViewState {
  return { ...state, fullscreen: !state.fullscreen };
}

/**
 * Expand or collapse a single widget.
 * Passing the same widgetId again collapses it.
 */
export function toggleWidgetExpanded(
  state: DashboardViewState,
  widgetId: string,
): DashboardViewState {
  return {
    ...state,
    expandedWidgetId: state.expandedWidgetId === widgetId ? null : widgetId,
  };
}

/**
 * Refresh the dashboard (set loading and update timestamp).
 */
export function refreshDashboard(
  state: DashboardViewState,
): DashboardViewState {
  return {
    ...state,
    loading: true,
    widgets: state.widgets.map(w => ({ ...w, loading: true, error: null })),
  };
}
