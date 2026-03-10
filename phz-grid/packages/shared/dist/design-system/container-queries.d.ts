/**
 * Container Query Widget Adaptations
 *
 * Extracted from @phozart/phz-workspace styles (S.3).
 * Pure helper functions that return CSS class names based on container width.
 * Widgets use these to adapt their layout at various breakpoints.
 */
/**
 * Get the KPI card layout class for a given container width.
 *
 * - `> 280px`: full layout (icon + value + sparkline + delta)
 * - `200-280px`: compact (value + delta, no sparkline)
 * - `< 200px`: minimal (value only)
 */
export declare function getKPICardClass(width: number): string;
/**
 * Get the chart layout class for a given container width.
 *
 * - `> 400px`: full (legend + axis labels + annotations)
 * - `280-400px`: no legend
 * - `160-279px`: no labels (axis hidden)
 * - `< 160px`: single value (sparkline-like fallback)
 */
export declare function getChartClass(width: number): string;
/**
 * Get the table layout class for a given container width.
 *
 * - `> 600px`: show all columns
 * - `400-600px`: hide low-priority columns
 * - `300-399px`: hide medium + low-priority columns
 * - `< 300px`: card layout (stacked rows)
 */
export declare function getTableClass(width: number): string;
/**
 * Get the filter bar layout class for a given container width.
 *
 * - `> 600px`: single row
 * - `400-600px`: two-column grid
 * - `< 400px`: vertical stack
 */
export declare function getFilterBarClass(width: number): string;
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
export declare function getVisibleColumns(columns: PriorityColumn[], width: number): string[];
/**
 * Get the decision tree layout class for a given container width.
 *
 * - `> 500px`: full (icon + label + description + status)
 * - `300-500px`: compact (label + status, no description)
 * - `< 300px`: minimal (label only, no toggle icons)
 */
export declare function getDecisionTreeClass(width: number): string;
/**
 * Get the container box layout class for a given container width.
 * Container boxes are wrappers that may contain nested widgets,
 * so their breakpoints affect inner layout (padding, header size).
 *
 * - `> 600px`: full (header + large padding)
 * - `400-600px`: medium (header + compact padding)
 * - `< 400px`: small (minimal padding, smaller header text)
 */
export declare function getContainerBoxClass(width: number): string;
/**
 * Determine whether child widgets inside a container box
 * should use a single-column layout based on container width.
 *
 * @param width - Container width in pixels
 * @param childCount - Number of child widgets
 * @returns true if children should be stacked vertically
 */
export declare function shouldStackContainerChildren(width: number, childCount: number): boolean;
/**
 * Get the rich text layout class for a given container width.
 *
 * - `> 500px`: full (normal font size, generous line height)
 * - `300-500px`: compact (smaller font, tighter line height)
 * - `< 300px`: minimal (smallest readable size)
 */
export declare function getRichTextClass(width: number): string;
//# sourceMappingURL=container-queries.d.ts.map