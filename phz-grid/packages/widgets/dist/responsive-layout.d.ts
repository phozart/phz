/**
 * @phozart/phz-widgets — Responsive Layout Utilities
 *
 * Pure functions for responsive breakpoint resolution, column computation,
 * colSpan clamping, and CSS container query generation.
 * No DOM dependencies — used by PhzDashboard for responsive behavior.
 */
export interface BreakpointConfig {
    columns: number;
    minWidth: number;
}
export interface ResponsiveLayoutInput {
    widgets: Array<{
        id: string;
        colSpan: number;
    }>;
    containerWidth: number;
    breakpoints?: Record<string, BreakpointConfig>;
}
export interface ResponsiveLayoutResult {
    breakpoint: string;
    columns: number;
    widgets: Array<{
        id: string;
        colSpan: number;
    }>;
}
export declare const DEFAULT_BREAKPOINTS: Record<string, BreakpointConfig>;
/**
 * Resolve the active breakpoint name for a given container width.
 * Returns the name of the highest breakpoint whose minWidth <= containerWidth.
 */
export declare function resolveBreakpoint(containerWidth: number, breakpoints?: Record<string, BreakpointConfig>): string;
/**
 * Compute the number of grid columns for a given container width.
 */
export declare function computeResponsiveColumns(containerWidth: number, breakpoints?: Record<string, BreakpointConfig>): number;
/**
 * Clamp a colSpan to the available columns. Minimum is 1.
 */
export declare function clampColSpan(colSpan: number, availableColumns: number): number;
/**
 * Compute responsive layout: resolve breakpoint, clamp widget colSpans.
 */
export declare function computeResponsiveLayout(input: ResponsiveLayoutInput): ResponsiveLayoutResult;
/**
 * Generate CSS container query rules for responsive dashboard grids.
 * The base rule (smallest breakpoint) has no @container wrapper.
 * Each subsequent breakpoint wraps in @container (min-width: ...).
 */
export declare function generateContainerQueryCSS(breakpoints?: Record<string, BreakpointConfig>): string;
//# sourceMappingURL=responsive-layout.d.ts.map