/**
 * Dashboard DnD Reorder Logic (L.13) — Tests
 */
import { describe, it, expect } from 'vitest';
import { moveWidget, insertBefore, updateWeight } from '../layout/reorder-utils.js';

interface TestWidget { id: string; weight?: number }

describe('Reorder Utils (L.13)', () => {
  describe('moveWidget', () => {
    it('moves an item forward', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = moveWidget(widgets, 0, 2);
      expect(result.map(w => w.id)).toEqual(['b', 'c', 'a']);
    });

    it('moves an item backward', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = moveWidget(widgets, 2, 0);
      expect(result.map(w => w.id)).toEqual(['c', 'a', 'b']);
    });

    it('no-op when from === to', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }];
      const result = moveWidget(widgets, 1, 1);
      expect(result.map(w => w.id)).toEqual(['a', 'b']);
    });

    it('is immutable', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const original = [...widgets];
      moveWidget(widgets, 0, 2);
      expect(widgets).toEqual(original);
    });

    it('handles single element', () => {
      const widgets: TestWidget[] = [{ id: 'a' }];
      const result = moveWidget(widgets, 0, 0);
      expect(result).toEqual([{ id: 'a' }]);
    });
  });

  describe('insertBefore', () => {
    it('inserts widget before target', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = insertBefore(widgets, 'c', 'a');
      expect(result.map(w => w.id)).toEqual(['c', 'a', 'b']);
    });

    it('returns unchanged array if widgetId not found', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }];
      const result = insertBefore(widgets, 'z', 'a');
      expect(result.map(w => w.id)).toEqual(['a', 'b']);
    });

    it('returns unchanged array if beforeId not found', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }];
      const result = insertBefore(widgets, 'a', 'z');
      expect(result.map(w => w.id)).toEqual(['a', 'b']);
    });

    it('is immutable', () => {
      const widgets: TestWidget[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const original = [...widgets];
      insertBefore(widgets, 'c', 'a');
      expect(widgets).toEqual(original);
    });
  });

  describe('updateWeight', () => {
    it('updates the weight of a matching widget', () => {
      const widgets: TestWidget[] = [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 },
      ];
      const result = updateWeight(widgets, 'b', 5);
      expect(result.find(w => w.id === 'b')!.weight).toBe(5);
    });

    it('does not modify other widgets', () => {
      const widgets: TestWidget[] = [
        { id: 'a', weight: 1 },
        { id: 'b', weight: 2 },
      ];
      const result = updateWeight(widgets, 'b', 5);
      expect(result.find(w => w.id === 'a')!.weight).toBe(1);
    });

    it('is immutable', () => {
      const widgets: TestWidget[] = [{ id: 'a', weight: 1 }];
      const result = updateWeight(widgets, 'a', 10);
      expect(widgets[0].weight).toBe(1);
      expect(result[0].weight).toBe(10);
    });

    it('returns unchanged array if widget not found', () => {
      const widgets: TestWidget[] = [{ id: 'a', weight: 1 }];
      const result = updateWeight(widgets, 'z', 10);
      expect(result).toEqual(widgets);
    });
  });
});
