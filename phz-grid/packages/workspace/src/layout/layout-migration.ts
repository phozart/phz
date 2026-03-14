/**
 * @phozart/workspace — Layout Migration (K.2)
 *
 * Migrates legacy absolute-position grid layouts to the
 * composable LayoutNode tree format (AutoGridLayout).
 */

import type { AutoGridLayout, WidgetSlot } from '../schema/config-layers.js';

export interface AbsoluteWidget {
  widgetId: string;
  row: number;
  col: number;
  colSpan: number;
  rowSpan: number;
}

export function migrateAbsoluteToAutoGrid(widgets: AbsoluteWidget[]): AutoGridLayout {
  const sorted = [...widgets].sort((a, b) => a.row - b.row || a.col - b.col);

  const children: WidgetSlot[] = sorted.map(w => ({
    kind: 'widget' as const,
    widgetId: w.widgetId,
    weight: w.colSpan,
    minHeight: w.rowSpan * 100,
  }));

  return {
    kind: 'auto-grid',
    minItemWidth: 200,
    gap: 16,
    children,
  };
}
