/**
 * @phozart/shared — Attention Faceted Filtering Types (7A-D)
 *
 * Types and pure functions for faceted filtering of attention items.
 * Supports multi-facet AND/OR filtering with cross-facet counting.
 *
 * Pure functions only — no side effects, no DOM.
 */
export type AttentionPriority = 'critical' | 'warning' | 'info';
export type AttentionSource = 'alert' | 'system' | 'external' | 'stale' | 'review' | 'broken-query';
/** A single value within a facet, with its count and optional color. */
export interface AttentionFacetValue {
    value: string;
    count: number;
    color?: string;
}
/** A facet grouping with label, values, and multi-select mode. */
export interface AttentionFacet {
    field: string;
    label: string;
    values: AttentionFacetValue[];
    multiSelect: boolean;
}
/** Active filter selections across all facets. */
export interface AttentionFilterState {
    priority?: AttentionPriority[];
    source?: AttentionSource[];
    artifactId?: string[];
    acknowledged?: boolean;
    dateRange?: {
        from: number;
        to: number;
    };
}
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
/**
 * Filter attention items using AND across facets, OR within a facet.
 * Empty/undefined filter values are not applied.
 * The `acknowledged` field defaults to `false` (hide acknowledged items)
 * when not explicitly set.
 */
export declare function filterAttentionItems(items: FilterableAttentionItem[], filters: AttentionFilterState): FilterableAttentionItem[];
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
export declare function computeAttentionFacets(items: FilterableAttentionItem[], currentFilters: AttentionFilterState): AttentionFacet[];
//# sourceMappingURL=attention-filter.d.ts.map