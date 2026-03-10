/**
 * @phozart/phz-editor — Dashboard View State (B-2.05)
 *
 * Read-only dashboard view state for the editor context.
 * Same visual as the viewer shell, but with the editor chrome
 * (toolbar actions like "Edit", "Share", "Subscribe").
 */
import type { DashboardWidget } from '@phozart/phz-shared/types';
import type { ArtifactVisibility } from '@phozart/phz-shared/artifacts';
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
    gridLayout: {
        columns: number;
        rows: number;
        gap: number;
    };
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
export declare function createDashboardViewState(dashboardId: string, overrides?: Partial<DashboardViewState>): DashboardViewState;
/**
 * Set dashboard data from a loaded artifact.
 */
export declare function setDashboardData(state: DashboardViewState, data: {
    title: string;
    description?: string;
    widgets: DashboardWidget[];
    gridLayout?: {
        columns: number;
        rows: number;
        gap: number;
    };
    visibility: ArtifactVisibility;
    ownerId: string;
}): DashboardViewState;
/**
 * Set the edit/share permissions for the current viewer.
 */
export declare function setPermissions(state: DashboardViewState, permissions: {
    canEdit: boolean;
    canShare: boolean;
}): DashboardViewState;
/**
 * Expand a widget to fullscreen.
 */
export declare function expandWidget(state: DashboardViewState, widgetId: string): DashboardViewState;
/**
 * Collapse the expanded widget.
 */
export declare function collapseWidget(state: DashboardViewState): DashboardViewState;
/**
 * Set loading state.
 */
export declare function setDashboardViewLoading(state: DashboardViewState, loading: boolean): DashboardViewState;
/**
 * Set error state.
 */
export declare function setDashboardViewError(state: DashboardViewState, error: unknown): DashboardViewState;
//# sourceMappingURL=dashboard-view-state.d.ts.map