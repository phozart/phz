/**
 * Pure utility functions for WorkspaceShell — navigation and panel resolution.
 */
export interface NavItem {
    id: string;
    label: string;
    icon: string;
}
export declare const DEFAULT_NAV_ITEMS: NavItem[];
/**
 * Resolve the active panel from a nav item ID.
 * Returns the first item if activeId is empty.
 */
export declare function resolveActivePanel(activeId: string, items: NavItem[]): NavItem | undefined;
export interface BreadcrumbEntry {
    id: string;
    label: string;
    panelId: string;
    metadata?: Record<string, unknown>;
}
export interface NavigationStack {
    entries: BreadcrumbEntry[];
    currentIndex: number;
}
export declare function createNavigationStack(initial?: BreadcrumbEntry[]): NavigationStack;
export declare function pushCrumb(stack: NavigationStack, entry: BreadcrumbEntry): NavigationStack;
export declare function popTo(stack: NavigationStack, index: number): NavigationStack;
//# sourceMappingURL=shell-utils.d.ts.map