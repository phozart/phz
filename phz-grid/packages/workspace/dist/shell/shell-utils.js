/**
 * Pure utility functions for WorkspaceShell — navigation and panel resolution.
 */
export const DEFAULT_NAV_ITEMS = [
    { id: 'catalog', label: 'Catalog', icon: 'catalog' },
    { id: 'explore', label: 'Explore', icon: 'explore' },
    { id: 'dashboards', label: 'Dashboards', icon: 'dashboard' },
    { id: 'reports', label: 'Reports', icon: 'report' },
    { id: 'data-sources', label: 'Data Sources', icon: 'data' },
    { id: 'alerts', label: 'Alerts', icon: 'alert' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];
/**
 * Resolve the active panel from a nav item ID.
 * Returns the first item if activeId is empty.
 */
export function resolveActivePanel(activeId, items) {
    if (!activeId && items.length > 0)
        return items[0];
    return items.find(item => item.id === activeId);
}
export function createNavigationStack(initial) {
    const entries = initial ? [...initial] : [];
    return {
        entries,
        currentIndex: entries.length > 0 ? entries.length - 1 : -1,
    };
}
export function pushCrumb(stack, entry) {
    const current = stack.currentIndex >= 0 ? stack.entries[stack.currentIndex] : undefined;
    if (current && current.id === entry.id)
        return { ...stack };
    const truncated = stack.entries.slice(0, stack.currentIndex + 1);
    const entries = [...truncated, entry];
    return {
        entries,
        currentIndex: entries.length - 1,
    };
}
export function popTo(stack, index) {
    if (stack.entries.length === 0)
        return { ...stack };
    const clamped = Math.max(0, Math.min(index, stack.entries.length - 1));
    return {
        entries: [...stack.entries],
        currentIndex: clamped,
    };
}
//# sourceMappingURL=shell-utils.js.map