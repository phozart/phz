/**
 * @phozart/phz-widgets — Container Box State
 *
 * Headless state machine for the container box widget.
 * Manages collapse state and child widget membership.
 */
import type { ContainerBoxConfig } from '@phozart/phz-shared/types';
/** Immutable state for a container box widget. */
export interface ContainerBoxState {
    config: ContainerBoxConfig;
    childWidgetIds: string[];
    collapsed: boolean;
}
/**
 * Create initial container box state from a configuration.
 * Starts in the expanded (non-collapsed) state with no children.
 */
export declare function createContainerBoxState(config: ContainerBoxConfig): ContainerBoxState;
/**
 * Create container box state with default configuration plus overrides.
 */
export declare function createDefaultContainerBoxState(overrides?: Partial<ContainerBoxConfig>): ContainerBoxState;
/**
 * Toggle the collapsed/expanded state of the container.
 */
export declare function toggleContainerCollapse(state: ContainerBoxState): ContainerBoxState;
/**
 * Add a child widget by ID. No-op if already present.
 */
export declare function addChildWidget(state: ContainerBoxState, widgetId: string): ContainerBoxState;
/**
 * Remove a child widget by ID. No-op if not present.
 */
export declare function removeChildWidget(state: ContainerBoxState, widgetId: string): ContainerBoxState;
/**
 * Reorder children by moving a widget from one index to another.
 */
export declare function reorderChildWidget(state: ContainerBoxState, widgetId: string, targetIndex: number): ContainerBoxState;
/**
 * Update the container box configuration.
 */
export declare function updateContainerConfig(state: ContainerBoxState, updates: Partial<ContainerBoxConfig>): ContainerBoxState;
//# sourceMappingURL=container-box-state.d.ts.map