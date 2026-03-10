/**
 * @phozart/phz-shared — Faceted Attention View State (7A-D)
 *
 * Headless state machine for the faceted attention sidebar.
 * Manages filter selections, acknowledgment, sort order, and pagination.
 *
 * Pure functions on immutable state — no side effects, no DOM.
 */

import type {
  AttentionFacet,
  AttentionFilterState,
  AttentionPriority,
  AttentionSource,
  FilterableAttentionItem,
} from '../types/attention-filter.js';
import {
  computeAttentionFacets,
  filterAttentionItems,
} from '../types/attention-filter.js';

// ========================================================================
// Sort order
// ========================================================================

export type AttentionSortOrder = 'priority-time' | 'time-only';

// ========================================================================
// AttentionFacetedState
// ========================================================================

export interface AttentionFacetedState {
  /** All attention items (unfiltered source). */
  allItems: FilterableAttentionItem[];
  /** Current filter selections. */
  filters: AttentionFilterState;
  /** Computed facets based on current items and filters. */
  facets: AttentionFacet[];
  /** Current sort order. */
  sortOrder: AttentionSortOrder;
  /** Number of items currently visible (pagination). */
  visibleCount: number;
}

// ========================================================================
// Priority ordering for sort
// ========================================================================

const PRIORITY_RANK: Record<AttentionPriority, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ========================================================================
// Internal helpers
// ========================================================================

function recomputeFacets(
  state: AttentionFacetedState,
): AttentionFacet[] {
  return computeAttentionFacets(state.allItems, state.filters);
}

function sortItems(
  items: FilterableAttentionItem[],
  order: AttentionSortOrder,
): FilterableAttentionItem[] {
  const sorted = [...items];
  if (order === 'priority-time') {
    sorted.sort((a, b) => {
      const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.timestamp - a.timestamp; // newest first within same priority
    });
  } else {
    sorted.sort((a, b) => b.timestamp - a.timestamp);
  }
  return sorted;
}

// ========================================================================
// initialAttentionFacetedState
// ========================================================================

/**
 * Create the initial faceted attention state from a list of items.
 * Defaults to hiding acknowledged items and sorting by priority then time.
 */
export function initialAttentionFacetedState(
  items: FilterableAttentionItem[],
): AttentionFacetedState {
  const filters: AttentionFilterState = { acknowledged: false };
  const state: AttentionFacetedState = {
    allItems: items,
    filters,
    facets: [],
    sortOrder: 'priority-time',
    visibleCount: 20,
  };
  state.facets = recomputeFacets(state);
  return state;
}

// ========================================================================
// toggleFacetValue
// ========================================================================

/**
 * Toggle a value within a facet's filter selection.
 * If the value is already selected, it is removed; otherwise it is added.
 */
export function toggleFacetValue(
  state: AttentionFacetedState,
  facetField: string,
  value: string,
): AttentionFacetedState {
  const filters = { ...state.filters };

  if (facetField === 'priority') {
    const current = filters.priority ? [...filters.priority] : [];
    const idx = current.indexOf(value as AttentionPriority);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value as AttentionPriority);
    }
    filters.priority = current.length > 0 ? current : undefined;
  } else if (facetField === 'source') {
    const current = filters.source ? [...filters.source] : [];
    const idx = current.indexOf(value as AttentionSource);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value as AttentionSource);
    }
    filters.source = current.length > 0 ? current : undefined;
  } else if (facetField === 'artifactId') {
    const current = filters.artifactId ? [...filters.artifactId] : [];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    filters.artifactId = current.length > 0 ? current : undefined;
  }

  const newState: AttentionFacetedState = { ...state, filters };
  newState.facets = recomputeFacets(newState);
  return newState;
}

// ========================================================================
// clearFacet
// ========================================================================

/**
 * Clear all selected values for a single facet.
 */
export function clearFacet(
  state: AttentionFacetedState,
  facetField: string,
): AttentionFacetedState {
  const filters = { ...state.filters };

  if (facetField === 'priority') {
    filters.priority = undefined;
  } else if (facetField === 'source') {
    filters.source = undefined;
  } else if (facetField === 'artifactId') {
    filters.artifactId = undefined;
  }

  const newState: AttentionFacetedState = { ...state, filters };
  newState.facets = recomputeFacets(newState);
  return newState;
}

// ========================================================================
// clearAllFilters
// ========================================================================

/**
 * Reset all facet filters to their defaults.
 * Keeps `acknowledged: false` to continue hiding acknowledged items.
 */
export function clearAllFilters(
  state: AttentionFacetedState,
): AttentionFacetedState {
  const filters: AttentionFilterState = { acknowledged: false };
  const newState: AttentionFacetedState = { ...state, filters };
  newState.facets = recomputeFacets(newState);
  return newState;
}

// ========================================================================
// acknowledgeItem
// ========================================================================

/**
 * Mark a single item as acknowledged.
 * Returns the updated state with recomputed facets.
 */
export function acknowledgeItem(
  state: AttentionFacetedState,
  itemId: string,
): AttentionFacetedState {
  const allItems = state.allItems.map(i =>
    i.id === itemId ? { ...i, acknowledged: true } : i,
  );
  const newState: AttentionFacetedState = { ...state, allItems };
  newState.facets = recomputeFacets(newState);
  return newState;
}

// ========================================================================
// acknowledgeAllVisible
// ========================================================================

/**
 * Mark all currently visible (filtered) items as acknowledged.
 */
export function acknowledgeAllVisible(
  state: AttentionFacetedState,
): AttentionFacetedState {
  const visible = getVisibleItems(state);
  const visibleIds = new Set(visible.map(i => i.id));
  const allItems = state.allItems.map(i =>
    visibleIds.has(i.id) ? { ...i, acknowledged: true } : i,
  );
  const newState: AttentionFacetedState = { ...state, allItems };
  newState.facets = recomputeFacets(newState);
  return newState;
}

// ========================================================================
// setSort
// ========================================================================

/**
 * Change the sort order for visible items.
 */
export function setAttentionSort(
  state: AttentionFacetedState,
  sortOrder: AttentionSortOrder,
): AttentionFacetedState {
  return { ...state, sortOrder };
}

// ========================================================================
// loadMore
// ========================================================================

/**
 * Increase the visible item count by `pageSize` for pagination.
 */
export function loadMore(
  state: AttentionFacetedState,
  pageSize: number,
): AttentionFacetedState {
  return { ...state, visibleCount: state.visibleCount + pageSize };
}

// ========================================================================
// getVisibleItems
// ========================================================================

/**
 * Get the currently visible items by applying filters, sort, and pagination.
 */
export function getVisibleItems(
  state: AttentionFacetedState,
): FilterableAttentionItem[] {
  const filtered = filterAttentionItems(state.allItems, state.filters);
  const sorted = sortItems(filtered, state.sortOrder);
  return sorted.slice(0, state.visibleCount);
}
