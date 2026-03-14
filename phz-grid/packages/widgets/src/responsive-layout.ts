/**
 * @phozart/widgets — Responsive Layout Utilities
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
  widgets: Array<{ id: string; colSpan: number }>;
  containerWidth: number;
  breakpoints?: Record<string, BreakpointConfig>;
}

export interface ResponsiveLayoutResult {
  breakpoint: string;
  columns: number;
  widgets: Array<{ id: string; colSpan: number }>;
}

export const DEFAULT_BREAKPOINTS: Record<string, BreakpointConfig> = {
  xs: { columns: 1, minWidth: 0 },
  sm: { columns: 2, minWidth: 576 },
  md: { columns: 6, minWidth: 768 },
  lg: { columns: 12, minWidth: 992 },
  xl: { columns: 12, minWidth: 1200 },
};

/**
 * Resolve the active breakpoint name for a given container width.
 * Returns the name of the highest breakpoint whose minWidth <= containerWidth.
 */
export function resolveBreakpoint(
  containerWidth: number,
  breakpoints: Record<string, BreakpointConfig> = DEFAULT_BREAKPOINTS,
): string {
  const sorted = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b.minWidth - a.minWidth);

  for (const [name, config] of sorted) {
    if (containerWidth >= config.minWidth) {
      return name;
    }
  }

  // Fallback to the smallest breakpoint
  return sorted[sorted.length - 1][0];
}

/**
 * Compute the number of grid columns for a given container width.
 */
export function computeResponsiveColumns(
  containerWidth: number,
  breakpoints: Record<string, BreakpointConfig> = DEFAULT_BREAKPOINTS,
): number {
  const bp = resolveBreakpoint(containerWidth, breakpoints);
  return breakpoints[bp].columns;
}

/**
 * Clamp a colSpan to the available columns. Minimum is 1.
 */
export function clampColSpan(colSpan: number, availableColumns: number): number {
  return Math.max(1, Math.min(colSpan, availableColumns));
}

/**
 * Compute responsive layout: resolve breakpoint, clamp widget colSpans.
 */
export function computeResponsiveLayout(input: ResponsiveLayoutInput): ResponsiveLayoutResult {
  const breakpoints = input.breakpoints ?? DEFAULT_BREAKPOINTS;
  const bp = resolveBreakpoint(input.containerWidth, breakpoints);
  const columns = breakpoints[bp].columns;

  return {
    breakpoint: bp,
    columns,
    widgets: input.widgets.map(w => ({
      id: w.id,
      colSpan: clampColSpan(w.colSpan, columns),
    })),
  };
}

/**
 * Generate CSS container query rules for responsive dashboard grids.
 * The base rule (smallest breakpoint) has no @container wrapper.
 * Each subsequent breakpoint wraps in @container (min-width: ...).
 */
export function generateContainerQueryCSS(
  breakpoints: Record<string, BreakpointConfig> = DEFAULT_BREAKPOINTS,
): string {
  const sorted = Object.entries(breakpoints)
    .sort(([, a], [, b]) => a.minWidth - b.minWidth);

  const rules: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const [, config] = sorted[i];
    const gridRule = `grid-template-columns: repeat(${config.columns}, 1fr);`;

    if (i === 0) {
      // Base rule — no container query
      rules.push(`.dashboard { ${gridRule} }`);
    } else {
      rules.push(
        `@container (min-width: ${config.minWidth}px) { .dashboard { ${gridRule} } }`,
      );
    }
  }

  return rules.join('\n');
}
