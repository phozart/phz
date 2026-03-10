import { describe, it, expect } from 'vitest';
import { splitPinnedColumns, computePinnedOffsets, getPinnedStyle } from '../utils/column-pinning.js';
import type { ColumnDefinition } from '@phozart/phz-core';

function col(field: string, frozen?: 'left' | 'right' | null, width?: number): ColumnDefinition {
  return { field, header: field, frozen, width, hidden: false } as ColumnDefinition;
}

describe('Column Pinning Integration', () => {
  it('end-to-end: split, compute offsets, generate styles', () => {
    const columns = [
      col('id', 'left', 60),
      col('name', 'left', 200),
      col('email', null, 300),
      col('role', null, 150),
      col('actions', 'right', 80),
    ];

    const pinned = splitPinnedColumns(columns);
    expect(pinned.hasPinned).toBe(true);
    expect(pinned.left.map(c => c.field)).toEqual(['id', 'name']);
    expect(pinned.scrollable.map(c => c.field)).toEqual(['email', 'role']);
    expect(pinned.right.map(c => c.field)).toEqual(['actions']);

    const leftOffsets = computePinnedOffsets(pinned.left, 'left');
    expect(leftOffsets).toEqual([0, 60]);

    const rightOffsets = computePinnedOffsets(pinned.right, 'right');
    expect(rightOffsets).toEqual([0]);

    // Verify generated styles
    expect(getPinnedStyle(pinned.left[0], leftOffsets[0], 'left'))
      .toBe('position:sticky;left:0px;z-index:2;');
    expect(getPinnedStyle(pinned.left[1], leftOffsets[1], 'left'))
      .toBe('position:sticky;left:60px;z-index:2;');
    expect(getPinnedStyle(pinned.right[0], rightOffsets[0], 'right'))
      .toBe('position:sticky;right:0px;z-index:2;');
  });

  it('hidden frozen columns are excluded from offset computation', () => {
    const columns = [
      { field: 'hidden-col', header: 'Hidden', frozen: 'left' as const, width: 100, hidden: true } as ColumnDefinition,
      col('visible', 'left', 120),
      col('data', null, 200),
    ];

    const pinned = splitPinnedColumns(columns);
    expect(pinned.left).toHaveLength(1);
    expect(pinned.left[0].field).toBe('visible');

    const leftOffsets = computePinnedOffsets(pinned.left, 'left');
    expect(leftOffsets).toEqual([0]);
    expect(getPinnedStyle(pinned.left[0], leftOffsets[0], 'left'))
      .toBe('position:sticky;left:0px;z-index:2;');
  });

  it('multiple right-pinned columns stack from the right edge', () => {
    const columns = [
      col('data', null, 400),
      col('status', 'right', 100),
      col('actions', 'right', 80),
    ];

    const pinned = splitPinnedColumns(columns);
    const rightOffsets = computePinnedOffsets(pinned.right, 'right');
    // actions (80px) is rightmost, status (100px) is left of actions
    expect(rightOffsets).toEqual([80, 0]);
    expect(getPinnedStyle(pinned.right[0], rightOffsets[0], 'right'))
      .toBe('position:sticky;right:80px;z-index:2;');
    expect(getPinnedStyle(pinned.right[1], rightOffsets[1], 'right'))
      .toBe('position:sticky;right:0px;z-index:2;');
  });

  it('no frozen columns produces no pinning', () => {
    const columns = [col('a', null, 100), col('b', null, 200)];
    const pinned = splitPinnedColumns(columns);
    expect(pinned.hasPinned).toBe(false);
    expect(computePinnedOffsets(pinned.left, 'left')).toEqual([]);
    expect(computePinnedOffsets(pinned.right, 'right')).toEqual([]);
  });
});
