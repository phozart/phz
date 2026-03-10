/**
 * @phozart/phz-widgets — View Group State
 *
 * Headless state machine for widget view groups.
 * Manages active group, active view, and switching mode resolution.
 */
import type { WidgetViewGroup, WidgetView, ViewSwitchingMode } from '@phozart/phz-shared/types';
/** Immutable state for widget view group management. */
export interface ViewGroupState {
    groups: WidgetViewGroup[];
    activeGroupId: string | null;
    activeViewId: string | null;
    switchingMode: ViewSwitchingMode;
}
/**
 * Create initial view group state.
 * Selects the first group and its default view automatically.
 */
export declare function createViewGroupState(groups: WidgetViewGroup[]): ViewGroupState;
/**
 * Switch to a different group by ID.
 * Activates the group's default view. No-op if the group ID is not found.
 */
export declare function switchGroup(state: ViewGroupState, groupId: string): ViewGroupState;
/**
 * Switch to a specific view within the active group.
 * No-op if the view is not found in the active group.
 */
export declare function switchView(state: ViewGroupState, viewId: string): ViewGroupState;
/**
 * Get the currently active view, or null if no group/view is selected.
 */
export declare function getActiveView(state: ViewGroupState): WidgetView | null;
/**
 * Get the currently active group, or null if none is selected.
 */
export declare function getActiveGroup(state: ViewGroupState): WidgetViewGroup | null;
/**
 * Get all view IDs across all groups.
 */
export declare function getAllViewIds(state: ViewGroupState): string[];
/**
 * Find which group contains a given view ID.
 */
export declare function findGroupForView(state: ViewGroupState, viewId: string): WidgetViewGroup | null;
//# sourceMappingURL=view-group-state.d.ts.map