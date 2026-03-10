/**
 * @phozart/phz-engine-admin — Drag-and-Drop Layout Utilities
 *
 * Pure functions for widget repositioning logic.
 * No DOM dependencies — used by PhzDashboardBuilder for drag-drop operations.
 */

import type { WidgetPlacement } from '@phozart/phz-engine';

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
export function swapWidgetPositions(
  widgets: WidgetPlacement[],
  sourceId: string,
  targetId: string,
): WidgetPlacement[] {
  const sourceIdx = widgets.findIndex(w => (w.id as string) === sourceId);
  const targetIdx = widgets.findIndex(w => (w.id as string) === targetId);

  if (sourceIdx === -1 || targetIdx === -1) return widgets;

  return widgets.map((w, i) => {
    if (i === sourceIdx) {
      return { ...w, position: { ...widgets[targetIdx].position } };
    }
    if (i === targetIdx) {
      return { ...w, position: { ...widgets[sourceIdx].position } };
    }
    return w;
  });
}

/**
 * Move a widget to a specific grid position (row, col).
 * Preserves rowSpan and colSpan. Returns a new array.
 */
export function moveWidgetToPosition(
  widgets: WidgetPlacement[],
  widgetId: string,
  target: { row: number; col: number },
): WidgetPlacement[] {
  const idx = widgets.findIndex(w => (w.id as string) === widgetId);
  if (idx === -1) return widgets;

  return widgets.map((w, i) => {
    if (i !== idx) return w;
    return {
      ...w,
      position: { ...w.position, row: target.row, col: target.col },
    };
  });
}

/**
 * Recalculate grid positions for all widgets based on their array order
 * and the number of layout columns. Assigns sequential row/col coordinates.
 */
export function recalculateGridPositions(
  widgets: WidgetPlacement[],
  layoutColumns: number,
): WidgetPlacement[] {
  return widgets.map((w, i) => ({
    ...w,
    position: {
      ...w.position,
      row: Math.floor(i / layoutColumns),
      col: i % layoutColumns,
    },
  }));
}

/**
 * Build a layout-change event detail payload from current widget positions.
 */
export function buildLayoutChangeDetail(widgets: WidgetPlacement[]): LayoutChangeDetail {
  return {
    positions: widgets.map(w => ({
      widgetId: w.id as string,
      row: w.position.row,
      col: w.position.col,
      rowSpan: w.position.rowSpan,
      colSpan: w.position.colSpan,
    })),
  };
}
