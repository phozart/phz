import { describe, it, expect } from 'vitest';
import { splitPinnedColumns, computePinnedOffsets, type PinnedColumnGroup } from '../utils/column-pinning.js';
import type { ColumnDefinition } from '@phozart/phz-core';

function col(field: string, frozen?: 'left' | 'right' | null, width?: number): ColumnDefinition {
  return { field, header: field, frozen, width, hidden: false } as ColumnDefinition;
}

describe('Column Pinning', () => {
  describe('splitPinnedColumns', () => {
    it('splits columns into left, scrollable, right groups', () => {
      const cols = [
        col('id', 'left'),
        col('name', null),
        col('age', null),
        col('actions', 'right'),
      ];
      const result = splitPinnedColumns(cols);

      expect(result.left.map(c => c.field)).toEqual(['id']);
      expect(result.scrollable.map(c => c.field)).toEqual(['name', 'age']);
      expect(result.right.map(c => c.field)).toEqual(['actions']);
    });

    it('preserves order within groups', () => {
      const cols = [
        col('a', 'left'),
        col('b', 'left'),
        col('c', null),
        col('d', 'right'),
        col('e', 'right'),
      ];
      const result = splitPinnedColumns(cols);

      expect(result.left.map(c => c.field)).toEqual(['a', 'b']);
      expect(result.right.map(c => c.field)).toEqual(['d', 'e']);
    });

    it('handles all columns unfrozen', () => {
      const cols = [col('a'), col('b'), col('c')];
      const result = splitPinnedColumns(cols);

      expect(result.left).toEqual([]);
      expect(result.scrollable).toHaveLength(3);
      expect(result.right).toEqual([]);
      expect(result.hasPinned).toBe(false);
    });

    it('skips hidden columns', () => {
      const cols = [
        { field: 'x', frozen: 'left' as const, hidden: true } as ColumnDefinition,
        col('a', 'left'),
        col('b'),
      ];
      const result = splitPinnedColumns(cols);

      expect(result.left).toHaveLength(1);
      expect(result.left[0].field).toBe('a');
    });

    it('reports hasPinned correctly', () => {
      expect(splitPinnedColumns([col('a', 'left'), col('b')]).hasPinned).toBe(true);
      expect(splitPinnedColumns([col('a'), col('b', 'right')]).hasPinned).toBe(true);
      expect(splitPinnedColumns([col('a'), col('b')]).hasPinned).toBe(false);
    });
  });

  describe('computePinnedOffsets', () => {
    it('computes sticky left offsets', () => {
      const cols = [col('a', 'left', 100), col('b', 'left', 120)];
      const offsets = computePinnedOffsets(cols, 'left');

      expect(offsets).toEqual([0, 100]);
    });

    it('computes sticky right offsets', () => {
      const cols = [col('c', 'right', 80), col('d', 'right', 60)];
      const offsets = computePinnedOffsets(cols, 'right');

      // Right offsets go from right: last column is 0px, second-to-last is 60px
      expect(offsets).toEqual([60, 0]);
    });

    it('uses default width when none specified', () => {
      const cols = [col('a', 'left'), col('b', 'left')];
      const offsets = computePinnedOffsets(cols, 'left');

      // Default width is 150
      expect(offsets).toEqual([0, 150]);
    });

    it('handles empty array', () => {
      expect(computePinnedOffsets([], 'left')).toEqual([]);
      expect(computePinnedOffsets([], 'right')).toEqual([]);
    });
  });
});
