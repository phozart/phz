/**
 * Tests for Attention Faceted State Machine (7A-D)
 *
 * Covers all state transitions: toggle, clear, acknowledge, sort, pagination,
 * and getVisibleItems with combined filters.
 */
import {
  initialAttentionFacetedState,
  toggleFacetValue,
  clearFacet,
  clearAllFilters,
  acknowledgeItem,
  acknowledgeAllVisible,
  setAttentionSort,
  loadMore,
  getVisibleItems,
} from '@phozart/phz-shared/coordination';
import type { AttentionFacetedState } from '@phozart/phz-shared/coordination';
import type { FilterableAttentionItem } from '@phozart/phz-shared/types';

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

function sampleItems(): FilterableAttentionItem[] {
  return [
    makeItem({ id: 'c1', priority: 'critical', source: 'alert', timestamp: 300 }),
    makeItem({ id: 'w1', priority: 'warning', source: 'system', timestamp: 200 }),
    makeItem({ id: 'i1', priority: 'info', source: 'external', timestamp: 100 }),
    makeItem({ id: 'c2', priority: 'critical', source: 'stale', timestamp: 400 }),
    makeItem({ id: 'w2', priority: 'warning', source: 'alert', timestamp: 500 }),
  ];
}

// ========================================================================
// initialAttentionFacetedState
// ========================================================================

describe('initialAttentionFacetedState', () => {
  it('creates state with all items', () => {
    const items = sampleItems();
    const state = initialAttentionFacetedState(items);
    expect(state.allItems).toBe(items);
    expect(state.allItems).toHaveLength(5);
  });

  it('defaults to acknowledged=false filter', () => {
    const state = initialAttentionFacetedState(sampleItems());
    expect(state.filters.acknowledged).toBe(false);
  });

  it('defaults to priority-time sort', () => {
    const state = initialAttentionFacetedState(sampleItems());
    expect(state.sortOrder).toBe('priority-time');
  });

  it('computes facets on initialization', () => {
    const state = initialAttentionFacetedState(sampleItems());
    expect(state.facets.length).toBeGreaterThanOrEqual(2);
    expect(state.facets.find(f => f.field === 'priority')).toBeDefined();
    expect(state.facets.find(f => f.field === 'source')).toBeDefined();
  });

  it('defaults visibleCount to 20', () => {
    const state = initialAttentionFacetedState(sampleItems());
    expect(state.visibleCount).toBe(20);
  });

  it('handles empty items', () => {
    const state = initialAttentionFacetedState([]);
    expect(state.allItems).toHaveLength(0);
    expect(state.facets.length).toBeGreaterThanOrEqual(2);
  });
});

// ========================================================================
// toggleFacetValue
// ========================================================================

describe('toggleFacetValue', () => {
  it('adds a priority filter value when toggled on', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = toggleFacetValue(state, 'priority', 'critical');
    expect(next.filters.priority).toEqual(['critical']);
  });

  it('removes a priority filter value when toggled off', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    state = toggleFacetValue(state, 'priority', 'critical');
    expect(state.filters.priority).toBeUndefined();
  });

  it('supports multiple selected values', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    state = toggleFacetValue(state, 'priority', 'warning');
    expect(state.filters.priority).toEqual(['critical', 'warning']);
  });

  it('toggles source facet values', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'source', 'alert');
    expect(state.filters.source).toEqual(['alert']);
  });

  it('toggles artifactId facet values', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'artifactId', 'dash-1');
    expect(state.filters.artifactId).toEqual(['dash-1']);
  });

  it('recomputes facets after toggle', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = toggleFacetValue(state, 'priority', 'critical');
    // Facets should be recomputed (source counts may change via cross-facet counting)
    expect(next.facets).not.toBe(state.facets);
  });
});

// ========================================================================
// clearFacet
// ========================================================================

describe('clearFacet', () => {
  it('clears priority filter', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    state = clearFacet(state, 'priority');
    expect(state.filters.priority).toBeUndefined();
  });

  it('clears source filter', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'source', 'alert');
    state = clearFacet(state, 'source');
    expect(state.filters.source).toBeUndefined();
  });

  it('clears artifactId filter', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'artifactId', 'dash-1');
    state = clearFacet(state, 'artifactId');
    expect(state.filters.artifactId).toBeUndefined();
  });

  it('recomputes facets after clear', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    const next = clearFacet(state, 'priority');
    expect(next.facets).not.toBe(state.facets);
  });
});

// ========================================================================
// clearAllFilters
// ========================================================================

describe('clearAllFilters', () => {
  it('resets all facet filters', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    state = toggleFacetValue(state, 'source', 'alert');
    state = clearAllFilters(state);
    expect(state.filters.priority).toBeUndefined();
    expect(state.filters.source).toBeUndefined();
  });

  it('keeps acknowledged=false default', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    state = clearAllFilters(state);
    expect(state.filters.acknowledged).toBe(false);
  });
});

// ========================================================================
// acknowledgeItem
// ========================================================================

describe('acknowledgeItem', () => {
  it('marks a single item as acknowledged', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = acknowledgeItem(state, 'c1');
    const item = next.allItems.find(i => i.id === 'c1');
    expect(item?.acknowledged).toBe(true);
  });

  it('does not affect other items', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = acknowledgeItem(state, 'c1');
    const others = next.allItems.filter(i => i.id !== 'c1');
    expect(others.every(i => !i.acknowledged)).toBe(true);
  });

  it('recomputes facets after acknowledge', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = acknowledgeItem(state, 'c1');
    expect(next.facets).not.toBe(state.facets);
  });
});

// ========================================================================
// acknowledgeAllVisible
// ========================================================================

describe('acknowledgeAllVisible', () => {
  it('acknowledges all currently visible items', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = acknowledgeAllVisible(state);
    // With default filter (acknowledged=false), all visible items get acknowledged
    const visible = getVisibleItems(next);
    expect(visible).toHaveLength(0); // all now acknowledged, filter hides them
  });

  it('only acknowledges items matching current filters', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    const next = acknowledgeAllVisible(state);
    // Only critical items should be acknowledged
    const criticalItems = next.allItems.filter(i => i.priority === 'critical');
    expect(criticalItems.every(i => i.acknowledged)).toBe(true);
    const nonCritical = next.allItems.filter(i => i.priority !== 'critical');
    expect(nonCritical.every(i => !i.acknowledged)).toBe(true);
  });
});

// ========================================================================
// setSort
// ========================================================================

describe('setSort', () => {
  it('changes sort order to time-only', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = setAttentionSort(state, 'time-only');
    expect(next.sortOrder).toBe('time-only');
  });

  it('changes sort order to priority-time', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = setAttentionSort(state, 'time-only');
    state = setAttentionSort(state, 'priority-time');
    expect(state.sortOrder).toBe('priority-time');
  });
});

// ========================================================================
// loadMore
// ========================================================================

describe('loadMore', () => {
  it('increases visibleCount by pageSize', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const next = loadMore(state, 10);
    expect(next.visibleCount).toBe(30);
  });

  it('supports multiple loadMore calls', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = loadMore(state, 10);
    state = loadMore(state, 10);
    expect(state.visibleCount).toBe(40);
  });
});

// ========================================================================
// getVisibleItems
// ========================================================================

describe('getVisibleItems', () => {
  it('returns items sorted by priority then time with default sort', () => {
    const state = initialAttentionFacetedState(sampleItems());
    const visible = getVisibleItems(state);
    // Critical items first (c2 ts=400, c1 ts=300), then warning (w2 ts=500, w1 ts=200), then info
    expect(visible[0].id).toBe('c2');
    expect(visible[1].id).toBe('c1');
    expect(visible[2].id).toBe('w2');
    expect(visible[3].id).toBe('w1');
    expect(visible[4].id).toBe('i1');
  });

  it('returns items sorted by time-only when sort is time-only', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = setAttentionSort(state, 'time-only');
    const visible = getVisibleItems(state);
    // Newest first: w2(500), c2(400), c1(300), w1(200), i1(100)
    expect(visible[0].id).toBe('w2');
    expect(visible[1].id).toBe('c2');
    expect(visible[2].id).toBe('c1');
    expect(visible[3].id).toBe('w1');
    expect(visible[4].id).toBe('i1');
  });

  it('applies filter before pagination', () => {
    const items = Array.from({ length: 30 }, (_, i) =>
      makeItem({ id: `item-${i}`, timestamp: i }),
    );
    let state = initialAttentionFacetedState(items);
    // Default visibleCount is 20
    const visible = getVisibleItems(state);
    expect(visible).toHaveLength(20);
  });

  it('applies combined filters', () => {
    let state = initialAttentionFacetedState(sampleItems());
    state = toggleFacetValue(state, 'priority', 'critical');
    const visible = getVisibleItems(state);
    expect(visible).toHaveLength(2);
    expect(visible.every(i => i.priority === 'critical')).toBe(true);
  });

  it('returns empty when all items are acknowledged', () => {
    const items = sampleItems().map(i => ({ ...i, acknowledged: true }));
    const state = initialAttentionFacetedState(items);
    const visible = getVisibleItems(state);
    expect(visible).toHaveLength(0);
  });
});
