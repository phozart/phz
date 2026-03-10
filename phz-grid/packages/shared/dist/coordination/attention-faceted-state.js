/**
 * @phozart/phz-shared — Faceted Attention View State (7A-D)
 *
 * Headless state machine for the faceted attention sidebar.
 * Manages filter selections, acknowledgment, sort order, and pagination.
 *
 * Pure functions on immutable state — no side effects, no DOM.
 */
import { computeAttentionFacets, filterAttentionItems, } from '../types/attention-filter.js';
// ========================================================================
// Priority ordering for sort
// ========================================================================
const PRIORITY_RANK = {
    critical: 0,
    warning: 1,
    info: 2,
};
// ========================================================================
// Internal helpers
// ========================================================================
function recomputeFacets(state) {
    return computeAttentionFacets(state.allItems, state.filters);
}
function sortItems(items, order) {
    const sorted = [...items];
    if (order === 'priority-time') {
        sorted.sort((a, b) => {
            const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            if (pDiff !== 0)
                return pDiff;
            return b.timestamp - a.timestamp; // newest first within same priority
        });
    }
    else {
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
export function initialAttentionFacetedState(items) {
    const filters = { acknowledged: false };
    const state = {
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
export function toggleFacetValue(state, facetField, value) {
    const filters = { ...state.filters };
    if (facetField === 'priority') {
        const current = filters.priority ? [...filters.priority] : [];
        const idx = current.indexOf(value);
        if (idx >= 0) {
            current.splice(idx, 1);
        }
        else {
            current.push(value);
        }
        filters.priority = current.length > 0 ? current : undefined;
    }
    else if (facetField === 'source') {
        const current = filters.source ? [...filters.source] : [];
        const idx = current.indexOf(value);
        if (idx >= 0) {
            current.splice(idx, 1);
        }
        else {
            current.push(value);
        }
        filters.source = current.length > 0 ? current : undefined;
    }
    else if (facetField === 'artifactId') {
        const current = filters.artifactId ? [...filters.artifactId] : [];
        const idx = current.indexOf(value);
        if (idx >= 0) {
            current.splice(idx, 1);
        }
        else {
            current.push(value);
        }
        filters.artifactId = current.length > 0 ? current : undefined;
    }
    const newState = { ...state, filters };
    newState.facets = recomputeFacets(newState);
    return newState;
}
// ========================================================================
// clearFacet
// ========================================================================
/**
 * Clear all selected values for a single facet.
 */
export function clearFacet(state, facetField) {
    const filters = { ...state.filters };
    if (facetField === 'priority') {
        filters.priority = undefined;
    }
    else if (facetField === 'source') {
        filters.source = undefined;
    }
    else if (facetField === 'artifactId') {
        filters.artifactId = undefined;
    }
    const newState = { ...state, filters };
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
export function clearAllFilters(state) {
    const filters = { acknowledged: false };
    const newState = { ...state, filters };
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
export function acknowledgeItem(state, itemId) {
    const allItems = state.allItems.map(i => i.id === itemId ? { ...i, acknowledged: true } : i);
    const newState = { ...state, allItems };
    newState.facets = recomputeFacets(newState);
    return newState;
}
// ========================================================================
// acknowledgeAllVisible
// ========================================================================
/**
 * Mark all currently visible (filtered) items as acknowledged.
 */
export function acknowledgeAllVisible(state) {
    const visible = getVisibleItems(state);
    const visibleIds = new Set(visible.map(i => i.id));
    const allItems = state.allItems.map(i => visibleIds.has(i.id) ? { ...i, acknowledged: true } : i);
    const newState = { ...state, allItems };
    newState.facets = recomputeFacets(newState);
    return newState;
}
// ========================================================================
// setSort
// ========================================================================
/**
 * Change the sort order for visible items.
 */
export function setAttentionSort(state, sortOrder) {
    return { ...state, sortOrder };
}
// ========================================================================
// loadMore
// ========================================================================
/**
 * Increase the visible item count by `pageSize` for pagination.
 */
export function loadMore(state, pageSize) {
    return { ...state, visibleCount: state.visibleCount + pageSize };
}
// ========================================================================
// getVisibleItems
// ========================================================================
/**
 * Get the currently visible items by applying filters, sort, and pagination.
 */
export function getVisibleItems(state) {
    const filtered = filterAttentionItems(state.allItems, state.filters);
    const sorted = sortItems(filtered, state.sortOrder);
    return sorted.slice(0, state.visibleCount);
}
//# sourceMappingURL=attention-faceted-state.js.map