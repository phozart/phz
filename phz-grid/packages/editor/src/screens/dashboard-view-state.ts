/**
 * @phozart/phz-editor — Dashboard View State (B-2.05)
 *
 * Read-only dashboard view state for the editor context.
 * Same visual as the viewer shell, but with the editor chrome
 * (toolbar actions like "Edit", "Share", "Subscribe").
 */

import type { DashboardWidget } from '@phozart/phz-shared/types';
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';

// ========================================================================
// DashboardViewState
// ========================================================================

export interface DashboardViewState {
  /** The dashboard artifact ID. */
  dashboardId: string;
  /** Dashboard title. */
  title: string;
  /** Dashboard description. */
  description: string;
  /** Widgets on the dashboard (read-only). */
  widgets: DashboardWidget[];
  /** Grid layout (read-only). */
  gridLayout: { columns: number; rows: number; gap: number };
  /** The dashboard's current visibility. */
  visibility: ArtifactVisibility;
  /** Owner of the dashboard. */
  ownerId: string;
  /** Whether the current viewer can edit this dashboard. */
  canEdit: boolean;
  /** Whether the current viewer can share this dashboard. */
  canShare: boolean;
  /** Whether the dashboard is loading. */
  loading: boolean;
  /** Error state. */
  error: unknown;
  /** Currently expanded widget (fullscreen mode). */
  expandedWidgetId: string | null;
}

// ========================================================================
// Factory
// ========================================================================

export function createDashboardViewState(
  dashboardId: string,
  overrides?: Partial<DashboardViewState>,
): DashboardViewState {
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
export function setDashboardData(
  state: DashboardViewState,
  data: {
    title: string;
    description?: string;
    widgets: DashboardWidget[];
    gridLayout?: { columns: number; rows: number; gap: number };
    visibility: ArtifactVisibility;
    ownerId: string;
  },
): DashboardViewState {
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
export function setPermissions(
  state: DashboardViewState,
  permissions: { canEdit: boolean; canShare: boolean },
): DashboardViewState {
  return { ...state, ...permissions };
}

/**
 * Expand a widget to fullscreen.
 */
export function expandWidget(
  state: DashboardViewState,
  widgetId: string,
): DashboardViewState {
  return { ...state, expandedWidgetId: widgetId };
}

/**
 * Collapse the expanded widget.
 */
export function collapseWidget(state: DashboardViewState): DashboardViewState {
  return { ...state, expandedWidgetId: null };
}

/**
 * Set loading state.
 */
export function setDashboardViewLoading(
  state: DashboardViewState,
  loading: boolean,
): DashboardViewState {
  return { ...state, loading, error: loading ? null : state.error };
}

/**
 * Set error state.
 */
export function setDashboardViewError(
  state: DashboardViewState,
  error: unknown,
): DashboardViewState {
  return { ...state, error, loading: false };
}
