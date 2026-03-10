/**
 * @phozart/phz-widgets — Container Box State
 *
 * Headless state machine for the container box widget.
 * Manages collapse state and child widget membership.
 */
import { createDefaultContainerBoxConfig } from '@phozart/phz-shared/types';
/**
 * Create initial container box state from a configuration.
 * Starts in the expanded (non-collapsed) state with no children.
 */
export function createContainerBoxState(config) {
    return {
        config,
        childWidgetIds: [],
        collapsed: false,
    };
}
/**
 * Create container box state with default configuration plus overrides.
 */
export function createDefaultContainerBoxState(overrides) {
    return createContainerBoxState(createDefaultContainerBoxConfig(overrides));
}
/**
 * Toggle the collapsed/expanded state of the container.
 */
export function toggleContainerCollapse(state) {
    return { ...state, collapsed: !state.collapsed };
}
/**
 * Add a child widget by ID. No-op if already present.
 */
export function addChildWidget(state, widgetId) {
    if (state.childWidgetIds.includes(widgetId))
        return state;
    return { ...state, childWidgetIds: [...state.childWidgetIds, widgetId] };
}
/**
 * Remove a child widget by ID. No-op if not present.
 */
export function removeChildWidget(state, widgetId) {
    const filtered = state.childWidgetIds.filter(id => id !== widgetId);
    if (filtered.length === state.childWidgetIds.length)
        return state;
    return { ...state, childWidgetIds: filtered };
}
/**
 * Reorder children by moving a widget from one index to another.
 */
export function reorderChildWidget(state, widgetId, targetIndex) {
    const currentIndex = state.childWidgetIds.indexOf(widgetId);
    if (currentIndex === -1)
        return state;
    const next = [...state.childWidgetIds];
    next.splice(currentIndex, 1);
    const clampedTarget = Math.max(0, Math.min(targetIndex, next.length));
    next.splice(clampedTarget, 0, widgetId);
    return { ...state, childWidgetIds: next };
}
/**
 * Update the container box configuration.
 */
export function updateContainerConfig(state, updates) {
    return { ...state, config: { ...state.config, ...updates } };
}
//# sourceMappingURL=container-box-state.js.map