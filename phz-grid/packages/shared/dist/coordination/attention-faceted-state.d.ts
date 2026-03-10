/**
 * @phozart/phz-shared — Faceted Attention View State (7A-D)
 *
 * Headless state machine for the faceted attention sidebar.
 * Manages filter selections, acknowledgment, sort order, and pagination.
 *
 * Pure functions on immutable state — no side effects, no DOM.
 */
import type { AttentionFacet, AttentionFilterState, FilterableAttentionItem } from '../types/attention-filter.js';
export type AttentionSortOrder = 'priority-time' | 'time-only';
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
/**
 * Create the initial faceted attention state from a list of items.
 * Defaults to hiding acknowledged items and sorting by priority then time.
 */
export declare function initialAttentionFacetedState(items: FilterableAttentionItem[]): AttentionFacetedState;
/**
 * Toggle a value within a facet's filter selection.
 * If the value is already selected, it is removed; otherwise it is added.
 */
export declare function toggleFacetValue(state: AttentionFacetedState, facetField: string, value: string): AttentionFacetedState;
/**
 * Clear all selected values for a single facet.
 */
export declare function clearFacet(state: AttentionFacetedState, facetField: string): AttentionFacetedState;
/**
 * Reset all facet filters to their defaults.
 * Keeps `acknowledged: false` to continue hiding acknowledged items.
 */
export declare function clearAllFilters(state: AttentionFacetedState): AttentionFacetedState;
/**
 * Mark a single item as acknowledged.
 * Returns the updated state with recomputed facets.
 */
export declare function acknowledgeItem(state: AttentionFacetedState, itemId: string): AttentionFacetedState;
/**
 * Mark all currently visible (filtered) items as acknowledged.
 */
export declare function acknowledgeAllVisible(state: AttentionFacetedState): AttentionFacetedState;
/**
 * Change the sort order for visible items.
 */
export declare function setAttentionSort(state: AttentionFacetedState, sortOrder: AttentionSortOrder): AttentionFacetedState;
/**
 * Increase the visible item count by `pageSize` for pagination.
 */
export declare function loadMore(state: AttentionFacetedState, pageSize: number): AttentionFacetedState;
/**
 * Get the currently visible items by applying filters, sort, and pagination.
 */
export declare function getVisibleItems(state: AttentionFacetedState): FilterableAttentionItem[];
//# sourceMappingURL=attention-faceted-state.d.ts.map