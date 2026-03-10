/**
 * @phozart/phz-widgets — Expandable Widget State
 *
 * Headless state machine for expandable/collapsible widget behavior.
 * Pure functions that manage expansion toggling and animation tracking.
 */
import { createDefaultExpandableConfig } from '@phozart/phz-shared/types';
/**
 * Create initial expandable widget state from a configuration.
 * The expanded state defaults to `config.defaultExpanded`.
 */
export function createExpandableWidgetState(config) {
    return {
        config,
        expanded: config.defaultExpanded,
        animating: false,
    };
}
/**
 * Create expandable widget state with default config plus overrides.
 */
export function createDefaultExpandableWidgetState(overrides) {
    return createExpandableWidgetState(createDefaultExpandableConfig(overrides));
}
/**
 * Toggle the expanded state.
 * If the widget is not expandable, this is a no-op.
 * Sets `animating` to true so the component can run a CSS transition.
 */
export function toggleExpand(state) {
    if (!state.config.expandable)
        return state;
    return { ...state, expanded: !state.expanded, animating: true };
}
/**
 * Explicitly set the expanded state.
 * If the widget is not expandable, this is a no-op.
 */
export function setExpanded(state, expanded) {
    if (!state.config.expandable)
        return state;
    if (state.expanded === expanded)
        return state;
    return { ...state, expanded, animating: true };
}
/**
 * Mark the animation as complete.
 * Call this from the component's `transitionend` handler.
 */
export function finishAnimation(state) {
    if (!state.animating)
        return state;
    return { ...state, animating: false };
}
/**
 * Check whether the widget should display the expand/collapse toggle.
 */
export function shouldShowToggle(state) {
    return state.config.expandable && state.config.showToggle;
}
/**
 * Get the max height constraint for the collapsed state.
 * Returns `undefined` if no constraint is set (0 means auto).
 */
export function getCollapsedMaxHeight(state) {
    if (state.expanded)
        return undefined;
    return state.config.collapsedMaxHeight > 0
        ? state.config.collapsedMaxHeight
        : undefined;
}
//# sourceMappingURL=expandable-widget-state.js.map