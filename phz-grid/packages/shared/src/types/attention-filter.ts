/**
 * @phozart/shared — Attention Faceted Filtering Types (7A-D)
 *
 * Types and pure functions for faceted filtering of attention items.
 * Supports multi-facet AND/OR filtering with cross-facet counting.
 *
 * Pure functions only — no side effects, no DOM.
 */

// ========================================================================
// AttentionPriority and AttentionSource
// ========================================================================

export type AttentionPriority = 'critical' | 'warning' | 'info';

export type AttentionSource =
  | 'alert'
  | 'system'
  | 'external'
  | 'stale'
  | 'review'
  | 'broken-query';

// ========================================================================
// AttentionFacetValue
// ========================================================================

/** A single value within a facet, with its count and optional color. */
export interface AttentionFacetValue {
  value: string;
  count: number;
  color?: string;
}

// ========================================================================
// AttentionFacet
// ========================================================================

/** A facet grouping with label, values, and multi-select mode. */
export interface AttentionFacet {
  field: string;
  label: string;
  values: AttentionFacetValue[];
  multiSelect: boolean;
}

// ========================================================================
// AttentionFilterState
// ========================================================================

/** Active filter selections across all facets. */
export interface AttentionFilterState {
  priority?: AttentionPriority[];
  source?: AttentionSource[];
  artifactId?: string[];
  acknowledged?: boolean;
  dateRange?: { from: number; to: number };
}

// ========================================================================
// FilterableAttentionItem
// ========================================================================

/** A normalized attention item suitable for faceted filtering. */
export interface FilterableAttentionItem {
  id: string;
  priority: AttentionPriority;
  source: AttentionSource;
  artifactId?: string;
  artifactName?: string;
  acknowledged: boolean;
  timestamp: number;
  title: string;
  description?: string;
  actionTarget?: string;
}

// ========================================================================
// Priority color mapping (semantic tokens)
// ========================================================================

const PRIORITY_COLORS: Record<AttentionPriority, string> = {
  critical: '#EF4444', // semantic.error
  warning: '#F59E0B',  // semantic.warning
  info: '#6B7280',     // semantic.neutral
};

// ========================================================================
// filterAttentionItems
// ========================================================================

/**
 * Filter attention items using AND across facets, OR within a facet.
 * Empty/undefined filter values are not applied.
 * The `acknowledged` field defaults to `false` (hide acknowledged items)
 * when not explicitly set.
 */
export function filterAttentionItems(
  items: FilterableAttentionItem[],
  filters: AttentionFilterState,
): FilterableAttentionItem[] {
  return items.filter(item => {
    // Priority facet: OR within
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(item.priority)) return false;
    }

    // Source facet: OR within
    if (filters.source && filters.source.length > 0) {
      if (!filters.source.includes(item.source)) return false;
    }

    // Artifact facet: OR within
    if (filters.artifactId && filters.artifactId.length > 0) {
      if (!item.artifactId || !filters.artifactId.includes(item.artifactId)) return false;
    }

    // Acknowledged: defaults to false (hide acknowledged)
    const ack = filters.acknowledged ?? false;
    if (item.acknowledged !== ack) return false;

    // Date range
    if (filters.dateRange) {
      if (item.timestamp < filters.dateRange.from || item.timestamp > filters.dateRange.to) {
        return false;
      }
    }

    return true;
  });
}

// ========================================================================
// computeAttentionFacets (internal helpers)
// ========================================================================

/**
 * Apply all filters EXCEPT the one for the given field.
 * This enables cross-facet counting: each facet's counts reflect items
 * that pass all OTHER facet filters.
 */
function filterExcludingFacet(
  items: FilterableAttentionItem[],
  filters: AttentionFilterState,
  excludeField: string,
): FilterableAttentionItem[] {
  const adjusted: AttentionFilterState = { ...filters };

  if (excludeField === 'priority') {
    adjusted.priority = undefined;
  } else if (excludeField === 'source') {
    adjusted.source = undefined;
  } else if (excludeField === 'artifactId') {
    adjusted.artifactId = undefined;
  }

  return filterAttentionItems(items, adjusted);
}

// ========================================================================
// computeAttentionFacets
// ========================================================================

/**
 * Compute facets for the attention item list with cross-facet counting.
 *
 * Returns:
 * - Priority facet (always): critical, warning, info with semantic colors
 * - Source facet (always): counts per source type
 * - Artifact facet (only when > 3 distinct artifacts)
 *
 * Cross-facet counting: each facet's value counts reflect items that
 * pass all OTHER active facet filters, giving users accurate feedback
 * on what each selection will produce.
 */
export function computeAttentionFacets(
  items: FilterableAttentionItem[],
  currentFilters: AttentionFilterState,
): AttentionFacet[] {
  const facets: AttentionFacet[] = [];

  // --- Priority facet (always present) ---
  const priorityItems = filterExcludingFacet(items, currentFilters, 'priority');
  const priorityValues: AttentionPriority[] = ['critical', 'warning', 'info'];
  const priorityFacetValues: AttentionFacetValue[] = priorityValues.map(p => ({
    value: p,
    count: priorityItems.filter(i => i.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));

  facets.push({
    field: 'priority',
    label: 'Priority',
    values: priorityFacetValues,
    multiSelect: true,
  });

  // --- Source facet (always present) ---
  const sourceItems = filterExcludingFacet(items, currentFilters, 'source');
  const allSources: AttentionSource[] = [
    'alert',
    'system',
    'external',
    'stale',
    'review',
    'broken-query',
  ];
  const sourceFacetValues: AttentionFacetValue[] = allSources
    .map(s => ({
      value: s,
      count: sourceItems.filter(i => i.source === s).length,
    }))
    .filter(v => v.count > 0);

  facets.push({
    field: 'source',
    label: 'Source',
    values: sourceFacetValues,
    multiSelect: true,
  });

  // --- Artifact facet (only when > 3 distinct artifacts) ---
  const artifactItems = filterExcludingFacet(items, currentFilters, 'artifactId');
  const artifactMap = new Map<string, { name: string; count: number }>();

  for (const item of artifactItems) {
    if (!item.artifactId) continue;
    const existing = artifactMap.get(item.artifactId);
    if (existing) {
      existing.count += 1;
    } else {
      artifactMap.set(item.artifactId, {
        name: item.artifactName ?? item.artifactId,
        count: 1,
      });
    }
  }

  if (artifactMap.size > 3) {
    const artifactFacetValues: AttentionFacetValue[] = Array.from(
      artifactMap.entries(),
    ).map(([id, { name, count }]) => ({
      value: id,
      count,
    }));

    // Sort by count descending, then by name
    artifactFacetValues.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    facets.push({
      field: 'artifactId',
      label: 'Artifact',
      values: artifactFacetValues,
      multiSelect: true,
    });
  }

  return facets;
}
