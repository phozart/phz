/**
 * @phozart/phz-widgets — Expandable Widget State
 *
 * Headless state machine for expandable/collapsible widget behavior.
 * Pure functions that manage expansion toggling and animation tracking.
 */
import type { ExpandableWidgetConfig } from '@phozart/phz-shared/types';
/** Immutable state for an expandable widget. */
export interface ExpandableWidgetState {
    config: ExpandableWidgetConfig;
    expanded: boolean;
    animating: boolean;
}
/**
 * Create initial expandable widget state from a configuration.
 * The expanded state defaults to `config.defaultExpanded`.
 */
export declare function createExpandableWidgetState(config: ExpandableWidgetConfig): ExpandableWidgetState;
/**
 * Create expandable widget state with default config plus overrides.
 */
export declare function createDefaultExpandableWidgetState(overrides?: Partial<ExpandableWidgetConfig>): ExpandableWidgetState;
/**
 * Toggle the expanded state.
 * If the widget is not expandable, this is a no-op.
 * Sets `animating` to true so the component can run a CSS transition.
 */
export declare function toggleExpand(state: ExpandableWidgetState): ExpandableWidgetState;
/**
 * Explicitly set the expanded state.
 * If the widget is not expandable, this is a no-op.
 */
export declare function setExpanded(state: ExpandableWidgetState, expanded: boolean): ExpandableWidgetState;
/**
 * Mark the animation as complete.
 * Call this from the component's `transitionend` handler.
 */
export declare function finishAnimation(state: ExpandableWidgetState): ExpandableWidgetState;
/**
 * Check whether the widget should display the expand/collapse toggle.
 */
export declare function shouldShowToggle(state: ExpandableWidgetState): boolean;
/**
 * Get the max height constraint for the collapsed state.
 * Returns `undefined` if no constraint is set (0 means auto).
 */
export declare function getCollapsedMaxHeight(state: ExpandableWidgetState): number | undefined;
//# sourceMappingURL=expandable-widget-state.d.ts.map