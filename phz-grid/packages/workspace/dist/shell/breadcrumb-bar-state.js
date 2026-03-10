/**
 * @phozart/phz-workspace — Breadcrumb Bar State
 *
 * Pure functions wrapping NavigationStack from shell-utils.ts.
 * Adds maxVisible truncation and collapsed breadcrumb computation.
 */
import { createNavigationStack, pushCrumb, popTo, } from './shell-utils.js';
export function initialBreadcrumbBarState(maxVisible = 5) {
    return {
        stack: createNavigationStack(),
        maxVisible,
    };
}
export function pushBreadcrumb(state, entry) {
    return { ...state, stack: pushCrumb(state.stack, entry) };
}
export function popToBreadcrumb(state, index) {
    return { ...state, stack: popTo(state.stack, index) };
}
/**
 * Get the visible breadcrumbs up to currentIndex.
 */
export function getBreadcrumbs(state) {
    if (state.stack.currentIndex < 0)
        return [];
    return state.stack.entries.slice(0, state.stack.currentIndex + 1);
}
/**
 * When there are more breadcrumbs than maxVisible, returns an object
 * with `collapsed` (hidden breadcrumbs) and `visible` (shown breadcrumbs).
 * The first and last breadcrumbs are always visible; middle items collapse.
 */
export function getCollapsedBreadcrumbs(state) {
    const all = getBreadcrumbs(state);
    if (all.length <= state.maxVisible) {
        return { collapsed: [], visible: all };
    }
    // Always show first + last (maxVisible - 2) items from the end
    const tailCount = state.maxVisible - 1;
    const first = all[0];
    const tail = all.slice(all.length - tailCount);
    const collapsed = all.slice(1, all.length - tailCount);
    return {
        collapsed,
        visible: [first, ...tail],
    };
}
//# sourceMappingURL=breadcrumb-bar-state.js.map