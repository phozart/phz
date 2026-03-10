/**
 * @phozart/phz-workspace — Navigation Controller (L.3)
 *
 * Pure functions for workspace navigation state management.
 * Coordinates panel navigation with breadcrumb history.
 */
import { createNavigationStack, pushCrumb, popTo, } from './shell-utils.js';
export function createNavigationState(navItems, initialPanel) {
    const panelId = initialPanel ?? navItems[0]?.id ?? '';
    const item = navItems.find(n => n.id === panelId);
    const label = item?.label ?? panelId;
    return {
        activePanel: panelId,
        breadcrumbs: createNavigationStack([{ id: panelId, label, panelId }]),
        navItems,
    };
}
export function canNavigateTo(state, target) {
    return state.navItems.some(n => n.id === target.panelId);
}
export function navigateTo(state, target) {
    const navItem = state.navItems.find(n => n.id === target.panelId);
    const label = target.label ?? navItem?.label ?? target.panelId;
    const crumb = {
        id: target.artifactId ?? target.panelId,
        label,
        panelId: target.panelId,
        metadata: target.metadata,
    };
    return {
        ...state,
        activePanel: target.panelId,
        breadcrumbs: pushCrumb(state.breadcrumbs, crumb),
    };
}
export function goBack(state) {
    const { breadcrumbs } = state;
    if (breadcrumbs.currentIndex <= 0)
        return state;
    const newBreadcrumbs = popTo(breadcrumbs, breadcrumbs.currentIndex - 1);
    const entry = newBreadcrumbs.entries[newBreadcrumbs.currentIndex];
    return {
        ...state,
        activePanel: entry.panelId,
        breadcrumbs: newBreadcrumbs,
    };
}
export function goForward(state) {
    const { breadcrumbs } = state;
    if (breadcrumbs.currentIndex >= breadcrumbs.entries.length - 1)
        return state;
    const newBreadcrumbs = popTo(breadcrumbs, breadcrumbs.currentIndex + 1);
    const entry = newBreadcrumbs.entries[newBreadcrumbs.currentIndex];
    return {
        ...state,
        activePanel: entry.panelId,
        breadcrumbs: newBreadcrumbs,
    };
}
//# sourceMappingURL=navigation-controller.js.map