/**
 * @phozart/workspace — Breadcrumb Bar State
 *
 * Pure functions wrapping NavigationStack from shell-utils.ts.
 * Adds maxVisible truncation and collapsed breadcrumb computation.
 */
import { type BreadcrumbEntry, type NavigationStack } from './shell-utils.js';
export interface BreadcrumbBarState {
    stack: NavigationStack;
    maxVisible: number;
}
export declare function initialBreadcrumbBarState(maxVisible?: number): BreadcrumbBarState;
export declare function pushBreadcrumb(state: BreadcrumbBarState, entry: BreadcrumbEntry): BreadcrumbBarState;
export declare function popToBreadcrumb(state: BreadcrumbBarState, index: number): BreadcrumbBarState;
/**
 * Get the visible breadcrumbs up to currentIndex.
 */
export declare function getBreadcrumbs(state: BreadcrumbBarState): BreadcrumbEntry[];
/**
 * When there are more breadcrumbs than maxVisible, returns an object
 * with `collapsed` (hidden breadcrumbs) and `visible` (shown breadcrumbs).
 * The first and last breadcrumbs are always visible; middle items collapse.
 */
export declare function getCollapsedBreadcrumbs(state: BreadcrumbBarState): {
    collapsed: BreadcrumbEntry[];
    visible: BreadcrumbEntry[];
};
//# sourceMappingURL=breadcrumb-bar-state.d.ts.map