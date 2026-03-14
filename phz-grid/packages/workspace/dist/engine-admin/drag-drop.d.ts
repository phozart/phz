/**
 * @phozart/engine-admin — Drag-and-Drop Layout Utilities
 *
 * Pure functions for widget repositioning logic.
 * No DOM dependencies — used by PhzDashboardBuilder for drag-drop operations.
 */
import type { WidgetPlacement } from '@phozart/engine';
export interface LayoutChangeDetail {
    positions: Array<{
        widgetId: string;
        row: number;
        col: number;
        rowSpan: number;
        colSpan: number;
    }>;
}
/**
 * Swap the positions of two widgets in the layout.
 * Returns a new array; does not mutate the input.
 */
export declare function swapWidgetPositions(widgets: WidgetPlacement[], sourceId: string, targetId: string): WidgetPlacement[];
/**
 * Move a widget to a specific grid position (row, col).
 * Preserves rowSpan and colSpan. Returns a new array.
 */
export declare function moveWidgetToPosition(widgets: WidgetPlacement[], widgetId: string, target: {
    row: number;
    col: number;
}): WidgetPlacement[];
/**
 * Recalculate grid positions for all widgets based on their array order
 * and the number of layout columns. Assigns sequential row/col coordinates.
 */
export declare function recalculateGridPositions(widgets: WidgetPlacement[], layoutColumns: number): WidgetPlacement[];
/**
 * Build a layout-change event detail payload from current widget positions.
 */
export declare function buildLayoutChangeDetail(widgets: WidgetPlacement[]): LayoutChangeDetail;
//# sourceMappingURL=drag-drop.d.ts.map