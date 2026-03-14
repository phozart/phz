/**
 * Responsive Viewport Breakpoints
 *
 * Extracted from @phozart/workspace styles (S.2).
 * Pure functions for viewport breakpoint detection and responsive class
 * generation. No DOM dependency — usable in Node tests.
 */
/**
 * Role that determines the shell variant and capability set.
 * - `admin`: full access to all sections (CONTENT, DATA, GOVERN)
 * - `author`: can create/edit content but cannot govern
 */
export type WorkspaceRole = 'admin' | 'author';
/**
 * @deprecated The 'viewer' role was removed in v15 (A-2.11).
 * Use application-layer access control for read-only experiences.
 * This type is kept only for migration compatibility and will be removed in v16.
 */
export type LegacyWorkspaceRole = 'admin' | 'author' | 'viewer';
export declare const BREAKPOINT_VALUES: {
    readonly mobile: 768;
    readonly tablet: 1024;
    readonly laptop: 1280;
};
export type ViewportBreakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';
/**
 * Determine the viewport breakpoint for a given pixel width.
 *
 * @param width - Viewport width in pixels
 * @returns The corresponding breakpoint name
 */
export declare function getViewportBreakpoint(width: number): ViewportBreakpoint;
export interface BreakpointClasses {
    sidebar: string;
    header: string;
    content: string;
    hamburger?: string;
    bottomBar?: string;
}
/**
 * Get CSS class names for shell layout elements at a given breakpoint.
 *
 * @param breakpoint - The current viewport breakpoint
 * @returns An object with class names for each shell region
 */
export declare function getBreakpointClasses(breakpoint: ViewportBreakpoint): BreakpointClasses;
export interface BottomTabItem {
    id: string;
    label: string;
    icon: string;
    section?: string;
}
/**
 * Get bottom tab items filtered by workspace role.
 * Admin sees all tabs; Author loses GOVERN.
 *
 * The deprecated 'viewer' role is still accepted at runtime for backward
 * compatibility and returns a minimal set (catalog + dashboards).
 *
 * @param role - The current workspace role
 * @returns Filtered array of tab items
 */
export declare function getBottomTabItems(role: WorkspaceRole | LegacyWorkspaceRole): BottomTabItem[];
//# sourceMappingURL=responsive.d.ts.map