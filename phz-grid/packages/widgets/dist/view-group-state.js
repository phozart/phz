/**
 * @phozart/widgets — View Group State
 *
 * Headless state machine for widget view groups.
 * Manages active group, active view, and switching mode resolution.
 */
/**
 * Create initial view group state.
 * Selects the first group and its default view automatically.
 */
export function createViewGroupState(groups) {
    if (groups.length === 0) {
        return {
            groups,
            activeGroupId: null,
            activeViewId: null,
            switchingMode: 'auto',
        };
    }
    const firstGroup = groups[0];
    return {
        groups,
        activeGroupId: firstGroup.id,
        activeViewId: firstGroup.defaultViewId,
        switchingMode: firstGroup.switchingMode,
    };
}
/**
 * Switch to a different group by ID.
 * Activates the group's default view. No-op if the group ID is not found.
 */
export function switchGroup(state, groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group)
        return state;
    return {
        ...state,
        activeGroupId: group.id,
        activeViewId: group.defaultViewId,
        switchingMode: group.switchingMode,
    };
}
/**
 * Switch to a specific view within the active group.
 * No-op if the view is not found in the active group.
 */
export function switchView(state, viewId) {
    const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
    if (!activeGroup)
        return state;
    const view = activeGroup.views.find(v => v.id === viewId);
    if (!view)
        return state;
    return { ...state, activeViewId: viewId };
}
/**
 * Get the currently active view, or null if no group/view is selected.
 */
export function getActiveView(state) {
    const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
    if (!activeGroup)
        return null;
    return activeGroup.views.find(v => v.id === state.activeViewId) ?? null;
}
/**
 * Get the currently active group, or null if none is selected.
 */
export function getActiveGroup(state) {
    return state.groups.find(g => g.id === state.activeGroupId) ?? null;
}
/**
 * Get all view IDs across all groups.
 */
export function getAllViewIds(state) {
    return state.groups.flatMap(g => g.views.map(v => v.id));
}
/**
 * Find which group contains a given view ID.
 */
export function findGroupForView(state, viewId) {
    return state.groups.find(g => g.views.some(v => v.id === viewId)) ?? null;
}
//# sourceMappingURL=view-group-state.js.map