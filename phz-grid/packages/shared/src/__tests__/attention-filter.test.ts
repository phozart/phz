/**
 * Tests for Attention Faceted Filtering (7A-D)
 *
 * Covers filterAttentionItems and computeAttentionFacets with facet logic,
 * cross-facet counting, artifact threshold, and edge cases.
 */
import {
  filterAttentionItems,
  computeAttentionFacets,
} from '@phozart/shared/types';
import type {
  AttentionFilterState,
  FilterableAttentionItem,
  AttentionPriority,
  AttentionSource,
} from '@phozart/shared/types';

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

function makeItems(count: number, template: Partial<FilterableAttentionItem> = {}): FilterableAttentionItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem({ ...template, id: `item-${i}` }),
  );
}

// ========================================================================
// filterAttentionItems
// ========================================================================

describe('filterAttentionItems', () => {
  // --- Priority facet ---

  it('filters by single priority', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical' }),
      makeItem({ id: '2', priority: 'warning' }),
      makeItem({ id: '3', priority: 'info' }),
    ];
    const result = filterAttentionItems(items, { priority: ['critical'], acknowledged: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by multiple priorities (OR within)', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical' }),
      makeItem({ id: '2', priority: 'warning' }),
      makeItem({ id: '3', priority: 'info' }),
    ];
    const result = filterAttentionItems(items, { priority: ['critical', 'warning'], acknowledged: false });
    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual(['1', '2']);
  });

  it('returns all items when priority filter is empty array', () => {
    const items = makeItems(3);
    const result = filterAttentionItems(items, { priority: [], acknowledged: false });
    expect(result).toHaveLength(3);
  });

  it('returns all items when priority filter is undefined', () => {
    const items = makeItems(3);
    const result = filterAttentionItems(items, { acknowledged: false });
    expect(result).toHaveLength(3);
  });

  // --- Source facet ---

  it('filters by single source', () => {
    const items = [
      makeItem({ id: '1', source: 'alert' }),
      makeItem({ id: '2', source: 'system' }),
      makeItem({ id: '3', source: 'external' }),
    ];
    const result = filterAttentionItems(items, { source: ['alert'], acknowledged: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by multiple sources (OR within)', () => {
    const items = [
      makeItem({ id: '1', source: 'alert' }),
      makeItem({ id: '2', source: 'stale' }),
      makeItem({ id: '3', source: 'review' }),
      makeItem({ id: '4', source: 'broken-query' }),
    ];
    const result = filterAttentionItems(items, { source: ['stale', 'review'], acknowledged: false });
    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual(['2', '3']);
  });

  // --- Artifact facet ---

  it('filters by artifact ID', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'dash-1' }),
      makeItem({ id: '2', artifactId: 'dash-2' }),
      makeItem({ id: '3', artifactId: 'dash-1' }),
    ];
    const result = filterAttentionItems(items, { artifactId: ['dash-1'], acknowledged: false });
    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual(['1', '3']);
  });

  it('excludes items with no artifactId when artifact filter is active', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'dash-1' }),
      makeItem({ id: '2' }), // no artifactId
    ];
    const result = filterAttentionItems(items, { artifactId: ['dash-1'], acknowledged: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  // --- Acknowledged facet ---

  it('defaults to hiding acknowledged items', () => {
    const items = [
      makeItem({ id: '1', acknowledged: false }),
      makeItem({ id: '2', acknowledged: true }),
    ];
    const result = filterAttentionItems(items, {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('shows only acknowledged items when acknowledged=true', () => {
    const items = [
      makeItem({ id: '1', acknowledged: false }),
      makeItem({ id: '2', acknowledged: true }),
    ];
    const result = filterAttentionItems(items, { acknowledged: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('shows only unacknowledged when acknowledged=false explicitly', () => {
    const items = [
      makeItem({ id: '1', acknowledged: false }),
      makeItem({ id: '2', acknowledged: true }),
    ];
    const result = filterAttentionItems(items, { acknowledged: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  // --- Date range ---

  it('filters by date range', () => {
    const items = [
      makeItem({ id: '1', timestamp: 100 }),
      makeItem({ id: '2', timestamp: 200 }),
      makeItem({ id: '3', timestamp: 300 }),
    ];
    const result = filterAttentionItems(items, {
      dateRange: { from: 150, to: 250 },
      acknowledged: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('includes items at the boundary of date range', () => {
    const items = [
      makeItem({ id: '1', timestamp: 100 }),
      makeItem({ id: '2', timestamp: 200 }),
    ];
    const result = filterAttentionItems(items, {
      dateRange: { from: 100, to: 200 },
      acknowledged: false,
    });
    expect(result).toHaveLength(2);
  });

  // --- Combined facets (AND across) ---

  it('applies AND across priority and source facets', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', source: 'alert' }),
      makeItem({ id: '2', priority: 'critical', source: 'system' }),
      makeItem({ id: '3', priority: 'info', source: 'alert' }),
    ];
    const result = filterAttentionItems(items, {
      priority: ['critical'],
      source: ['alert'],
      acknowledged: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('applies AND across priority, source, and artifact', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', source: 'alert', artifactId: 'dash-1' }),
      makeItem({ id: '2', priority: 'critical', source: 'alert', artifactId: 'dash-2' }),
      makeItem({ id: '3', priority: 'warning', source: 'alert', artifactId: 'dash-1' }),
    ];
    const result = filterAttentionItems(items, {
      priority: ['critical'],
      source: ['alert'],
      artifactId: ['dash-1'],
      acknowledged: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('applies AND across all facets including date range', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', source: 'alert', timestamp: 500 }),
      makeItem({ id: '2', priority: 'critical', source: 'alert', timestamp: 100 }),
    ];
    const result = filterAttentionItems(items, {
      priority: ['critical'],
      source: ['alert'],
      dateRange: { from: 200, to: 600 },
      acknowledged: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  // --- Edge cases ---

  it('returns empty array for empty items', () => {
    const result = filterAttentionItems([], { acknowledged: false });
    expect(result).toEqual([]);
  });

  it('returns empty array when all items are filtered out', () => {
    const items = makeItems(3, { priority: 'info' });
    const result = filterAttentionItems(items, { priority: ['critical'], acknowledged: false });
    expect(result).toEqual([]);
  });

  it('handles no filters (only acknowledged default)', () => {
    const items = makeItems(5);
    const result = filterAttentionItems(items, {});
    expect(result).toHaveLength(5);
  });

  it('does not mutate the input items array', () => {
    const items = [makeItem({ id: '1', priority: 'critical' })];
    const original = [...items];
    filterAttentionItems(items, { priority: ['info'], acknowledged: false });
    expect(items).toEqual(original);
  });

  it('does not mutate the filter state', () => {
    const filters: AttentionFilterState = { priority: ['critical'] };
    const original = { ...filters, priority: [...(filters.priority ?? [])] };
    filterAttentionItems(makeItems(3), filters);
    expect(filters).toEqual(original);
  });
});

// ========================================================================
// computeAttentionFacets
// ========================================================================

describe('computeAttentionFacets', () => {
  // --- Priority facet ---

  it('always returns a priority facet', () => {
    const items = [makeItem({ id: '1', priority: 'critical' })];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const priorityFacet = facets.find(f => f.field === 'priority');
    expect(priorityFacet).toBeDefined();
    expect(priorityFacet!.label).toBe('Priority');
    expect(priorityFacet!.multiSelect).toBe(true);
  });

  it('computes correct priority counts', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical' }),
      makeItem({ id: '2', priority: 'critical' }),
      makeItem({ id: '3', priority: 'warning' }),
      makeItem({ id: '4', priority: 'info' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const priorityFacet = facets.find(f => f.field === 'priority')!;
    const counts = Object.fromEntries(priorityFacet.values.map(v => [v.value, v.count]));
    expect(counts.critical).toBe(2);
    expect(counts.warning).toBe(1);
    expect(counts.info).toBe(1);
  });

  it('priority facet values have semantic colors', () => {
    const items = [makeItem({ id: '1', priority: 'critical' })];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const priorityFacet = facets.find(f => f.field === 'priority')!;
    const criticalValue = priorityFacet.values.find(v => v.value === 'critical');
    expect(criticalValue?.color).toBe('#EF4444');
    const warningValue = priorityFacet.values.find(v => v.value === 'warning');
    expect(warningValue?.color).toBe('#F59E0B');
    const infoValue = priorityFacet.values.find(v => v.value === 'info');
    expect(infoValue?.color).toBe('#6B7280');
  });

  // --- Source facet ---

  it('always returns a source facet', () => {
    const items = [makeItem({ id: '1', source: 'alert' })];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const sourceFacet = facets.find(f => f.field === 'source');
    expect(sourceFacet).toBeDefined();
    expect(sourceFacet!.label).toBe('Source');
  });

  it('computes correct source counts', () => {
    const items = [
      makeItem({ id: '1', source: 'alert' }),
      makeItem({ id: '2', source: 'alert' }),
      makeItem({ id: '3', source: 'system' }),
      makeItem({ id: '4', source: 'stale' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const sourceFacet = facets.find(f => f.field === 'source')!;
    const counts = Object.fromEntries(sourceFacet.values.map(v => [v.value, v.count]));
    expect(counts.alert).toBe(2);
    expect(counts.system).toBe(1);
    expect(counts.stale).toBe(1);
  });

  it('only includes source values with count > 0', () => {
    const items = [makeItem({ id: '1', source: 'alert' })];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const sourceFacet = facets.find(f => f.field === 'source')!;
    expect(sourceFacet.values).toHaveLength(1);
    expect(sourceFacet.values[0].value).toBe('alert');
  });

  // --- Artifact facet ---

  it('does not include artifact facet when <= 3 distinct artifacts', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'a1' }),
      makeItem({ id: '2', artifactId: 'a2' }),
      makeItem({ id: '3', artifactId: 'a3' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const artifactFacet = facets.find(f => f.field === 'artifactId');
    expect(artifactFacet).toBeUndefined();
  });

  it('includes artifact facet when > 3 distinct artifacts', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'a1', artifactName: 'Dashboard 1' }),
      makeItem({ id: '2', artifactId: 'a2', artifactName: 'Dashboard 2' }),
      makeItem({ id: '3', artifactId: 'a3', artifactName: 'Dashboard 3' }),
      makeItem({ id: '4', artifactId: 'a4', artifactName: 'Dashboard 4' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const artifactFacet = facets.find(f => f.field === 'artifactId');
    expect(artifactFacet).toBeDefined();
    expect(artifactFacet!.values).toHaveLength(4);
  });

  it('artifact facet uses artifactName when available', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'a1', artifactName: 'Dashboard 1' }),
      makeItem({ id: '2', artifactId: 'a2', artifactName: 'Dashboard 2' }),
      makeItem({ id: '3', artifactId: 'a3', artifactName: 'Dashboard 3' }),
      makeItem({ id: '4', artifactId: 'a4', artifactName: 'Dashboard 4' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const artifactFacet = facets.find(f => f.field === 'artifactId')!;
    // Values use the artifact ID as the value key
    expect(artifactFacet.values.find(v => v.value === 'a1')).toBeDefined();
  });

  it('artifact facet counts items per artifact', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'a1' }),
      makeItem({ id: '2', artifactId: 'a1' }),
      makeItem({ id: '3', artifactId: 'a2' }),
      makeItem({ id: '4', artifactId: 'a3' }),
      makeItem({ id: '5', artifactId: 'a4' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    const artifactFacet = facets.find(f => f.field === 'artifactId')!;
    const a1 = artifactFacet.values.find(v => v.value === 'a1');
    expect(a1?.count).toBe(2);
  });

  // --- Cross-facet counting ---

  it('priority counts reflect items passing source filter', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', source: 'alert' }),
      makeItem({ id: '2', priority: 'critical', source: 'system' }),
      makeItem({ id: '3', priority: 'warning', source: 'alert' }),
    ];
    const facets = computeAttentionFacets(items, {
      source: ['alert'],
      acknowledged: false,
    });
    const priorityFacet = facets.find(f => f.field === 'priority')!;
    const counts = Object.fromEntries(priorityFacet.values.map(v => [v.value, v.count]));
    // Cross-facet: priority counts exclude source filter => should reflect items filtered by source
    expect(counts.critical).toBe(1); // only the alert one
    expect(counts.warning).toBe(1);
  });

  it('source counts reflect items passing priority filter', () => {
    const items = [
      makeItem({ id: '1', priority: 'critical', source: 'alert' }),
      makeItem({ id: '2', priority: 'critical', source: 'system' }),
      makeItem({ id: '3', priority: 'warning', source: 'alert' }),
    ];
    const facets = computeAttentionFacets(items, {
      priority: ['critical'],
      acknowledged: false,
    });
    const sourceFacet = facets.find(f => f.field === 'source')!;
    const counts = Object.fromEntries(sourceFacet.values.map(v => [v.value, v.count]));
    expect(counts.alert).toBe(1); // only the critical alert
    expect(counts.system).toBe(1); // the critical system one
  });

  // --- Edge cases ---

  it('handles empty items array', () => {
    const facets = computeAttentionFacets([], { acknowledged: false });
    expect(facets).toHaveLength(2); // priority and source always present
    const priorityFacet = facets.find(f => f.field === 'priority')!;
    expect(priorityFacet.values.every(v => v.count === 0)).toBe(true);
  });

  it('handles no filters', () => {
    const items = makeItems(5, { priority: 'warning', source: 'system' });
    const facets = computeAttentionFacets(items, { acknowledged: false });
    expect(facets.length).toBeGreaterThanOrEqual(2);
  });

  it('handles all items acknowledged with acknowledged=false filter', () => {
    const items = makeItems(3, { acknowledged: true });
    const facets = computeAttentionFacets(items, { acknowledged: false });
    // Priority counts should be 0 since all items are acknowledged and excluded
    const priorityFacet = facets.find(f => f.field === 'priority')!;
    expect(priorityFacet.values.every(v => v.count === 0)).toBe(true);
  });

  it('facet order is priority, source, then artifact (when present)', () => {
    const items = [
      makeItem({ id: '1', artifactId: 'a1' }),
      makeItem({ id: '2', artifactId: 'a2' }),
      makeItem({ id: '3', artifactId: 'a3' }),
      makeItem({ id: '4', artifactId: 'a4' }),
    ];
    const facets = computeAttentionFacets(items, { acknowledged: false });
    expect(facets[0].field).toBe('priority');
    expect(facets[1].field).toBe('source');
    expect(facets[2].field).toBe('artifactId');
  });
});
