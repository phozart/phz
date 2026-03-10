import { describe, it, expect } from 'vitest';
import { migrateAbsoluteToAutoGrid } from '../layout/layout-migration.js';
import type { AutoGridLayout } from '../schema/config-layers.js';

interface AbsoluteWidget {
  widgetId: string;
  row: number;
  col: number;
  colSpan: number;
  rowSpan: number;
}

describe('LayoutMigration', () => {
  describe('migrateAbsoluteToAutoGrid', () => {
    it('converts empty list to empty AutoGridLayout', () => {
      const result = migrateAbsoluteToAutoGrid([]);
      expect(result.kind).toBe('auto-grid');
      expect(result.children).toEqual([]);
    });

    it('converts single widget', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'w1', row: 0, col: 0, colSpan: 4, rowSpan: 2 },
      ];
      const result = migrateAbsoluteToAutoGrid(widgets);
      expect(result.kind).toBe('auto-grid');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].kind).toBe('widget');
      expect(result.children[0].widgetId).toBe('w1');
    });

    it('sorts by row then col', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'w3', row: 1, col: 0, colSpan: 1, rowSpan: 1 },
        { widgetId: 'w1', row: 0, col: 0, colSpan: 1, rowSpan: 1 },
        { widgetId: 'w2', row: 0, col: 1, colSpan: 1, rowSpan: 1 },
      ];
      const result = migrateAbsoluteToAutoGrid(widgets);
      expect(result.children.map(c => c.widgetId)).toEqual(['w1', 'w2', 'w3']);
    });

    it('computes weight from colSpan ratio', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'w1', row: 0, col: 0, colSpan: 6, rowSpan: 1 },
        { widgetId: 'w2', row: 0, col: 6, colSpan: 6, rowSpan: 1 },
      ];
      const result = migrateAbsoluteToAutoGrid(widgets);
      // Both have equal colSpan, so equal weight
      expect(result.children[0].weight).toBe(result.children[1].weight);
    });

    it('computes minHeight from rowSpan', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'w1', row: 0, col: 0, colSpan: 1, rowSpan: 3 },
      ];
      const result = migrateAbsoluteToAutoGrid(widgets);
      expect(result.children[0].minHeight).toBeGreaterThan(0);
    });

    it('does not mutate original array', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'w2', row: 1, col: 0, colSpan: 1, rowSpan: 1 },
        { widgetId: 'w1', row: 0, col: 0, colSpan: 1, rowSpan: 1 },
      ];
      const original = [...widgets];
      migrateAbsoluteToAutoGrid(widgets);
      expect(widgets).toEqual(original);
    });

    it('sets reasonable defaults for gap and minItemWidth', () => {
      const result = migrateAbsoluteToAutoGrid([
        { widgetId: 'w1', row: 0, col: 0, colSpan: 1, rowSpan: 1 },
      ]);
      expect(result.gap).toBeGreaterThan(0);
      expect(result.minItemWidth).toBeGreaterThan(0);
    });

    it('handles unequal colSpans with proportional weights', () => {
      const widgets: AbsoluteWidget[] = [
        { widgetId: 'wide', row: 0, col: 0, colSpan: 8, rowSpan: 1 },
        { widgetId: 'narrow', row: 0, col: 8, colSpan: 4, rowSpan: 1 },
      ];
      const result = migrateAbsoluteToAutoGrid(widgets);
      const wideWeight = result.children[0].weight ?? 1;
      const narrowWeight = result.children[1].weight ?? 1;
      expect(wideWeight).toBeGreaterThan(narrowWeight);
    });
  });
});
