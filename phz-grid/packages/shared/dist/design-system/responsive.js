/**
 * Responsive Viewport Breakpoints
 *
 * Extracted from @phozart/phz-workspace styles (S.2).
 * Pure functions for viewport breakpoint detection and responsive class
 * generation. No DOM dependency — usable in Node tests.
 */
// ========================================================================
// Breakpoint Values
// ========================================================================
export const BREAKPOINT_VALUES = {
    mobile: 768,
    tablet: 1024,
    laptop: 1280,
};
/**
 * Determine the viewport breakpoint for a given pixel width.
 *
 * @param width - Viewport width in pixels
 * @returns The corresponding breakpoint name
 */
export function getViewportBreakpoint(width) {
    if (width < BREAKPOINT_VALUES.mobile)
        return 'mobile';
    if (width < BREAKPOINT_VALUES.tablet)
        return 'tablet';
    if (width <= BREAKPOINT_VALUES.laptop)
        return 'laptop';
    return 'desktop';
}
/**
 * Get CSS class names for shell layout elements at a given breakpoint.
 *
 * @param breakpoint - The current viewport breakpoint
 * @returns An object with class names for each shell region
 */
export function getBreakpointClasses(breakpoint) {
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
const ALL_BOTTOM_TABS = [
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
export function getBottomTabItems(role) {
    switch (role) {
        case 'admin':
            return [...ALL_BOTTOM_TABS];
        case 'author':
            return ALL_BOTTOM_TABS.filter(t => t.section !== 'GOVERN');
        case 'viewer':
            return ALL_BOTTOM_TABS.filter(t => t.id === 'catalog' || t.id === 'dashboards');
    }
}
//# sourceMappingURL=responsive.js.map