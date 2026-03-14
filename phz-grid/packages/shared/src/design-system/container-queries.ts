/**
 * Container Query Widget Adaptations
 *
 * Extracted from @phozart/workspace styles (S.3).
 * Pure helper functions that return CSS class names based on container width.
 * Widgets use these to adapt their layout at various breakpoints.
 */

// ========================================================================
// KPI Card Breakpoints
// ========================================================================

/**
 * Get the KPI card layout class for a given container width.
 *
 * - `> 280px`: full layout (icon + value + sparkline + delta)
 * - `200-280px`: compact (value + delta, no sparkline)
 * - `< 200px`: minimal (value only)
 */
export function getKPICardClass(width: number): string {
  if (width > 280) return 'kpi--full';
  if (width >= 200) return 'kpi--compact';
  return 'kpi--minimal';
}

// ========================================================================
// Chart Breakpoints
// ========================================================================

/**
 * Get the chart layout class for a given container width.
 *
 * - `> 400px`: full (legend + axis labels + annotations)
 * - `280-400px`: no legend
 * - `160-279px`: no labels (axis hidden)
 * - `< 160px`: single value (sparkline-like fallback)
 */
export function getChartClass(width: number): string {
  if (width > 400) return 'chart--full';
  if (width >= 280) return 'chart--no-legend';
  if (width >= 160) return 'chart--no-labels';
  return 'chart--single-value';
}

// ========================================================================
// Table Breakpoints
// ========================================================================

/**
 * Get the table layout class for a given container width.
 *
 * - `> 600px`: show all columns
 * - `400-600px`: hide low-priority columns
 * - `300-399px`: hide medium + low-priority columns
 * - `< 300px`: card layout (stacked rows)
 */
export function getTableClass(width: number): string {
  if (width > 600) return 'table--all';
  if (width >= 400) return 'table--hide-low';
  if (width >= 300) return 'table--hide-medium';
  return 'table--card';
}

// ========================================================================
// Filter Bar Breakpoints
// ========================================================================

/**
 * Get the filter bar layout class for a given container width.
 *
 * - `> 600px`: single row
 * - `400-600px`: two-column grid
 * - `< 400px`: vertical stack
 */
export function getFilterBarClass(width: number): string {
  if (width > 600) return 'filter-bar--row';
  if (width >= 400) return 'filter-bar--two-col';
  return 'filter-bar--vertical';
}

// ========================================================================
// Column Visibility by Priority
// ========================================================================

export type ColumnPriority = 'high' | 'medium' | 'low';

export interface PriorityColumn {
  name: string;
  priority: ColumnPriority;
}

/**
 * Filter columns to visible set based on container width and column priority.
 *
 * @param columns - All columns with their priority level
 * @param width - Container width in pixels
 * @returns Names of columns that should be visible
 */
export function getVisibleColumns(columns: PriorityColumn[], width: number): string[] {
  if (width > 600) {
    return columns.map(c => c.name);
  }
  if (width >= 400) {
    return columns.filter(c => c.priority !== 'low').map(c => c.name);
  }
  // 300-399: only high priority
  return columns.filter(c => c.priority === 'high').map(c => c.name);
}

// ========================================================================
// Decision Tree Breakpoints
// ========================================================================

/**
 * Get the decision tree layout class for a given container width.
 *
 * - `> 500px`: full (icon + label + description + status)
 * - `300-500px`: compact (label + status, no description)
 * - `< 300px`: minimal (label only, no toggle icons)
 */
export function getDecisionTreeClass(width: number): string {
  if (width > 500) return 'tree--full';
  if (width >= 300) return 'tree--compact';
  return 'tree--minimal';
}

// ========================================================================
// Container Box Breakpoints
// ========================================================================

/**
 * Get the container box layout class for a given container width.
 * Container boxes are wrappers that may contain nested widgets,
 * so their breakpoints affect inner layout (padding, header size).
 *
 * - `> 600px`: full (header + large padding)
 * - `400-600px`: medium (header + compact padding)
 * - `< 400px`: small (minimal padding, smaller header text)
 */
export function getContainerBoxClass(width: number): string {
  if (width > 600) return 'container--full';
  if (width >= 400) return 'container--medium';
  return 'container--small';
}

/**
 * Determine whether child widgets inside a container box
 * should use a single-column layout based on container width.
 *
 * @param width - Container width in pixels
 * @param childCount - Number of child widgets
 * @returns true if children should be stacked vertically
 */
export function shouldStackContainerChildren(width: number, childCount: number): boolean {
  if (width < 400) return true;
  if (width < 600 && childCount > 2) return true;
  return false;
}

// ========================================================================
// Rich Text Breakpoints
// ========================================================================

/**
 * Get the rich text layout class for a given container width.
 *
 * - `> 500px`: full (normal font size, generous line height)
 * - `300-500px`: compact (smaller font, tighter line height)
 * - `< 300px`: minimal (smallest readable size)
 */
export function getRichTextClass(width: number): string {
  if (width > 500) return 'rich-text--full';
  if (width >= 300) return 'rich-text--compact';
  return 'rich-text--minimal';
}
