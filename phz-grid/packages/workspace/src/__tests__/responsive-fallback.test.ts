/**
 * Responsive Fallback (Phase 4C) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  freeformToMobileLayout,
  generateMobileLayoutCSS,
  shouldUseMobileLayout,
} from '../authoring/responsive-fallback.js';
import type { FreeformGridConfig, WidgetPlacement } from '../authoring/freeform-grid-state.js';

const gridConfig: FreeformGridConfig = {
  columns: 48,
  rows: 36,
  gapPx: 4,
  cellSizePx: 20,
  snapToGrid: true,
};

describe('freeformToMobileLayout', () => {
  it('sorts widgets by row then col', () => {
    const widgets: WidgetPlacement[] = [
      { id: 'b', col: 10, row: 2, colSpan: 4, rowSpan: 2 },
      { id: 'a', col: 0, row: 0, colSpan: 4, rowSpan: 2 },
      { id: 'c', col: 5, row: 2, colSpan: 4, rowSpan: 2 },
    ];

    const entries = freeformToMobileLayout(widgets, gridConfig);
    expect(entries.map(e => e.widgetId)).toEqual(['a', 'c', 'b']);
  });

  it('assigns sequential order starting from 0', () => {
    const widgets: WidgetPlacement[] = [
      { id: 'x', col: 0, row: 0, colSpan: 2, rowSpan: 2 },
      { id: 'y', col: 5, row: 3, colSpan: 2, rowSpan: 2 },
    ];

    const entries = freeformToMobileLayout(widgets, gridConfig);
    expect(entries[0].order).toBe(0);
    expect(entries[1].order).toBe(1);
  });

  it('calculates minHeight from rowSpan * (cellSizePx + gapPx)', () => {
    const widgets: WidgetPlacement[] = [
      { id: 'w1', col: 0, row: 0, colSpan: 4, rowSpan: 3 },
    ];

    const entries = freeformToMobileLayout(widgets, gridConfig);
    // rowSpan(3) * (cellSizePx(20) + gapPx(4)) = 3 * 24 = 72
    expect(entries[0].minHeight).toBe(72);
  });

  it('handles empty widgets array', () => {
    const entries = freeformToMobileLayout([], gridConfig);
    expect(entries).toEqual([]);
  });

  it('does not mutate the original widgets array', () => {
    const widgets: WidgetPlacement[] = [
      { id: 'b', col: 10, row: 2, colSpan: 4, rowSpan: 2 },
      { id: 'a', col: 0, row: 0, colSpan: 4, rowSpan: 2 },
    ];
    const originalOrder = widgets.map(w => w.id);
    freeformToMobileLayout(widgets, gridConfig);
    expect(widgets.map(w => w.id)).toEqual(originalOrder);
  });
});

describe('generateMobileLayoutCSS', () => {
  it('includes flex-direction column', () => {
    const css = generateMobileLayoutCSS([]);
    expect(css).toContain('flex-direction: column');
  });

  it('includes order for each widget', () => {
    const entries = [
      { widgetId: 'w1', order: 0, minHeight: 48 },
      { widgetId: 'w2', order: 1, minHeight: 96 },
    ];
    const css = generateMobileLayoutCSS(entries);
    expect(css).toContain('order: 0');
    expect(css).toContain('order: 1');
  });

  it('includes minHeight for each widget', () => {
    const entries = [
      { widgetId: 'w1', order: 0, minHeight: 72 },
    ];
    const css = generateMobileLayoutCSS(entries);
    expect(css).toContain('min-height: 72px');
  });

  it('includes data-widget-id selectors', () => {
    const entries = [
      { widgetId: 'abc', order: 0, minHeight: 48 },
    ];
    const css = generateMobileLayoutCSS(entries);
    expect(css).toContain('[data-widget-id="abc"]');
  });

  it('unsets grid-column and grid-row', () => {
    const entries = [
      { widgetId: 'w1', order: 0, minHeight: 48 },
    ];
    const css = generateMobileLayoutCSS(entries);
    expect(css).toContain('grid-column: unset');
    expect(css).toContain('grid-row: unset');
  });
});

describe('shouldUseMobileLayout', () => {
  it('returns true below default breakpoint (768)', () => {
    expect(shouldUseMobileLayout(767)).toBe(true);
  });

  it('returns false at or above default breakpoint (768)', () => {
    expect(shouldUseMobileLayout(768)).toBe(false);
    expect(shouldUseMobileLayout(1024)).toBe(false);
  });

  it('uses custom breakpoint', () => {
    expect(shouldUseMobileLayout(500, 480)).toBe(false);
    expect(shouldUseMobileLayout(479, 480)).toBe(true);
  });
});
