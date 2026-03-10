/**
 * @phozart/phz-workspace — Responsive Fallback (Canvas Phase 4C)
 *
 * Converts freeform canvas positions to a single-column mobile stack
 * sorted by visual position (top→bottom, left→right).
 * Viewer shell applies this on narrow viewports.
 */

import type { FreeformGridConfig, WidgetPlacement } from './freeform-grid-state.js';

export interface MobileLayoutEntry {
  widgetId: string;
  order: number;
  minHeight: number;
}

/**
 * Convert freeform widget placements to a mobile-friendly single-column layout.
 * Sorts widgets by their visual position (top→bottom, then left→right)
 * and assigns sequential order values.
 */
export function freeformToMobileLayout(
  widgets: WidgetPlacement[],
  gridConfig: FreeformGridConfig,
): MobileLayoutEntry[] {
  // Sort by row first, then by column for left-to-right ordering within same row
  const sorted = [...widgets].sort((a, b) => a.row - b.row || a.col - b.col);

  return sorted.map((w, index) => ({
    widgetId: w.id,
    order: index,
    minHeight: w.rowSpan * (gridConfig.cellSizePx + gridConfig.gapPx),
  }));
}

/**
 * Generate CSS for mobile single-column layout.
 * Returns CSS that stacks all widgets vertically with the computed order.
 */
export function generateMobileLayoutCSS(entries: MobileLayoutEntry[]): string {
  const rules: string[] = [
    '.phz-freeform-grid.phz-mobile-layout {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 12px;',
    '}',
  ];

  for (const entry of entries) {
    rules.push(`[data-widget-id="${entry.widgetId}"] {`);
    rules.push(`  order: ${entry.order};`);
    rules.push(`  min-height: ${entry.minHeight}px;`);
    rules.push(`  grid-column: unset;`);
    rules.push(`  grid-row: unset;`);
    rules.push('}');
  }

  return rules.join('\n');
}

/**
 * Determine if the current viewport should use mobile layout.
 */
export function shouldUseMobileLayout(viewportWidth: number, breakpoint: number = 768): boolean {
  return viewportWidth < breakpoint;
}
