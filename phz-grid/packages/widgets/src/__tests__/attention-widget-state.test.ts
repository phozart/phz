/**
 * Tests for Attention Widget State (7A-D)
 *
 * Covers priority summary, top items, total count, container variants,
 * and edge cases (no items, all acknowledged).
 */
import {
  initialAttentionWidgetState,
  computePrioritySummary,
  getTopItems,
  getTotalCount,
  getContainerVariant,
} from '../attention-widget-state.js';
import type { FilterableAttentionItem } from '@phozart/shared/types';

// ========================================================================
// Test data factory
// ========================================================================

function makeItem(overrides: Partial<FilterableAttentionItem> = {}): FilterableAttentionItem {
  return {
    id: overrides.id ?? 'item-1',
    priority: overrides.priority ?? 'info',
    source: overrides.source ?? 'system',
    artifactId: overrides.artifactId,
    artifactName: overrides.artifactName,
    acknowledged: overrides.acknowledged ?? false,
    timestamp: overrides.timestamp ?? 1000,
    title: overrides.title ?? 'Test item',
    description: overrides.description,
    actionTarget: overrides.actionTarget,
  };
}

// ========================================================================
// initialAttentionWidgetState
// ========================================================================

describe('initialAttentionWidgetState', () => {
  it('creates state with items and default maxItems', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })];
    const state = initialAttentionWidgetState(items);
    expect(state.items).toBe(items);
    expect(state.maxItems).toBe(5);
  });

  it('accepts custom maxItems', () => {
    const state = initialAttentionWidgetState([], 10);
    expect(state.maxItems).toBe(10);
  });

  it('handles empty items', () => {
    const state = initialAttentionWidgetState([]);
    expect(state.items).toHaveLength(0);
  });
});

// ========================================================================
// computePrioritySummary
// ========================================================================

describe('computePrioritySummary', () => {
  it('counts unacknowledged items by priority', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical' }),
      makeItem({ id: '2', priority: 'critical' }),
      makeItem({ id: '3', priority: 'warning' }),
      makeItem({ id: '4', priority: 'info' }),
      makeItem({ id: '5', priority: 'info' }),
      makeItem({ id: '6', priority: 'info' }),
    ];
    const state = initialAttentionWidgetState(items);
    const summary = computePrioritySummary(state);
    expect(summary.critical).toBe(2);
    expect(summary.warning).toBe(1);
    expect(summary.info).toBe(3);
  });

  it('excludes acknowledged items from counts', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', acknowledged: false }),
      makeItem({ id: '2', priority: 'critical', acknowledged: true }),
      makeItem({ id: '3', priority: 'warning', acknowledged: true }),
    ];
    const state = initialAttentionWidgetState(items);
    const summary = computePrioritySummary(state);
    expect(summary.critical).toBe(1);
    expect(summary.warning).toBe(0);
  });

  it('returns all zeros for empty items', () => {
    const state = initialAttentionWidgetState([]);
    const summary = computePrioritySummary(state);
    expect(summary.critical).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.info).toBe(0);
  });

  it('returns all zeros when all items are acknowledged', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', acknowledged: true }),
      makeItem({ id: '2', priority: 'warning', acknowledged: true }),
    ];
    const state = initialAttentionWidgetState(items);
    const summary = computePrioritySummary(state);
    expect(summary.critical).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.info).toBe(0);
  });
});

// ========================================================================
// getTopItems
// ========================================================================

describe('getTopItems', () => {
  it('returns top N unacknowledged items sorted by priority then time', () => {
    const items = [
      makeItem({ id: 'i1', priority: 'info', timestamp: 500 }),
      makeItem({ id: 'c1', priority: 'critical', timestamp: 300 }),
      makeItem({ id: 'w1', priority: 'warning', timestamp: 400 }),
      makeItem({ id: 'c2', priority: 'critical', timestamp: 100 }),
    ];
    const state = initialAttentionWidgetState(items);
    const top = getTopItems(state, 2);
    expect(top).toHaveLength(2);
    expect(top[0].id).toBe('c1'); // critical, ts=300
    expect(top[1].id).toBe('c2'); // critical, ts=100
  });

  it('excludes acknowledged items', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', acknowledged: true }),
      makeItem({ id: '2', priority: 'warning', acknowledged: false }),
    ];
    const state = initialAttentionWidgetState(items);
    const top = getTopItems(state, 5);
    expect(top).toHaveLength(1);
    expect(top[0].id).toBe('2');
  });

  it('returns fewer than N when not enough items', () => {
    const items = [makeItem({ id: '1', priority: 'info' })];
    const state = initialAttentionWidgetState(items);
    const top = getTopItems(state, 5);
    expect(top).toHaveLength(1);
  });

  it('returns empty array when no items', () => {
    const state = initialAttentionWidgetState([]);
    const top = getTopItems(state, 5);
    expect(top).toEqual([]);
  });

  it('returns empty array when all acknowledged', () => {
    const items = [
      makeItem({ id: '1', acknowledged: true }),
      makeItem({ id: '2', acknowledged: true }),
    ];
    const state = initialAttentionWidgetState(items);
    const top = getTopItems(state, 5);
    expect(top).toEqual([]);
  });

  it('sorts by timestamp descending within same priority', () => {
    const items = [
      makeItem({ id: 'w1', priority: 'warning', timestamp: 100 }),
      makeItem({ id: 'w2', priority: 'warning', timestamp: 300 }),
      makeItem({ id: 'w3', priority: 'warning', timestamp: 200 }),
    ];
    const state = initialAttentionWidgetState(items);
    const top = getTopItems(state, 3);
    expect(top[0].id).toBe('w2'); // newest
    expect(top[1].id).toBe('w3');
    expect(top[2].id).toBe('w1'); // oldest
  });
});

// ========================================================================
// getTotalCount
// ========================================================================

describe('getTotalCount', () => {
  it('counts unacknowledged items', () => {
    const items = [
      makeItem({ id: '1', acknowledged: false }),
      makeItem({ id: '2', acknowledged: true }),
      makeItem({ id: '3', acknowledged: false }),
    ];
    const state = initialAttentionWidgetState(items);
    expect(getTotalCount(state)).toBe(2);
  });

  it('returns 0 for empty items', () => {
    const state = initialAttentionWidgetState([]);
    expect(getTotalCount(state)).toBe(0);
  });

  it('returns 0 when all acknowledged', () => {
    const items = [
      makeItem({ id: '1', acknowledged: true }),
      makeItem({ id: '2', acknowledged: true }),
    ];
    const state = initialAttentionWidgetState(items);
    expect(getTotalCount(state)).toBe(0);
  });
});

// ========================================================================
// getContainerVariant
// ========================================================================

describe('getContainerVariant', () => {
  it('returns full for width > 280', () => {
    expect(getContainerVariant(281)).toBe('full');
    expect(getContainerVariant(500)).toBe('full');
    expect(getContainerVariant(1000)).toBe('full');
  });

  it('returns compact for width 200-280', () => {
    expect(getContainerVariant(200)).toBe('compact');
    expect(getContainerVariant(240)).toBe('compact');
    expect(getContainerVariant(280)).toBe('compact');
  });

  it('returns minimal for width < 200', () => {
    expect(getContainerVariant(199)).toBe('minimal');
    expect(getContainerVariant(100)).toBe('minimal');
    expect(getContainerVariant(0)).toBe('minimal');
  });

  it('handles boundary at 280', () => {
    expect(getContainerVariant(280)).toBe('compact');
    expect(getContainerVariant(281)).toBe('full');
  });

  it('handles boundary at 200', () => {
    expect(getContainerVariant(199)).toBe('minimal');
    expect(getContainerVariant(200)).toBe('compact');
  });
});
