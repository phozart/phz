/**
 * Responsive Viewport Breakpoints
 *
 * Extracted from @phozart/phz-workspace styles (S.2).
 * Pure functions for viewport breakpoint detection and responsive class
 * generation. No DOM dependency — usable in Node tests.
 */

// ========================================================================
// WorkspaceRole (shared canonical definition)
// ========================================================================

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

// ========================================================================
// Breakpoint Values
// ========================================================================

export const BREAKPOINT_VALUES = {
  mobile: 768,
  tablet: 1024,
  laptop: 1280,
} as const;

// ========================================================================
// Breakpoint Detection
// ========================================================================

export type ViewportBreakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

/**
 * Determine the viewport breakpoint for a given pixel width.
 *
 * @param width - Viewport width in pixels
 * @returns The corresponding breakpoint name
 */
export function getViewportBreakpoint(width: number): ViewportBreakpoint {
  if (width < BREAKPOINT_VALUES.mobile) return 'mobile';
  if (width < BREAKPOINT_VALUES.tablet) return 'tablet';
  if (width <= BREAKPOINT_VALUES.laptop) return 'laptop';
  return 'desktop';
}

// ========================================================================
// Breakpoint Classes
// ========================================================================

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
export function getBreakpointClasses(breakpoint: ViewportBreakpoint): BreakpointClasses {
  switch (breakpoint) {
    case 'desktop':
      return {
        sidebar: 'sidebar--full',
        header: 'header--full',
        content: 'content--full',
      };
    case 'laptop':
      return {
        sidebar: 'sidebar--icon-only',
        header: 'header--full',
        content: 'content--full',
      };
    case 'tablet':
      return {
        sidebar: 'sidebar--overlay',
        header: 'header--full',
        content: 'content--full',
        hamburger: 'hamburger--visible',
      };
    case 'mobile':
      return {
        sidebar: 'sidebar--hidden',
        header: 'header--compact',
        content: 'content--full',
        bottomBar: 'bottom-bar--visible',
      };
  }
}

// ========================================================================
// Bottom Tab Bar (Mobile)
// ========================================================================

export interface BottomTabItem {
  id: string;
  label: string;
  icon: string;
  section?: string;
}

const ALL_BOTTOM_TABS: BottomTabItem[] = [
  { id: 'catalog', label: 'Catalog', icon: 'catalog', section: 'CONTENT' },
  { id: 'explore', label: 'Explore', icon: 'explore', section: 'CONTENT' },
  { id: 'dashboards', label: 'Dashboards', icon: 'dashboard', section: 'CONTENT' },
  { id: 'data', label: 'Data', icon: 'data', section: 'DATA' },
  { id: 'govern', label: 'Govern', icon: 'govern', section: 'GOVERN' },
];

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
export function getBottomTabItems(role: WorkspaceRole | LegacyWorkspaceRole): BottomTabItem[] {
  switch (role) {
    case 'admin':
      return [...ALL_BOTTOM_TABS];
    case 'author':
      return ALL_BOTTOM_TABS.filter(t => t.section !== 'GOVERN');
    case 'viewer':
      return ALL_BOTTOM_TABS.filter(t => t.id === 'catalog' || t.id === 'dashboards');
  }
}
