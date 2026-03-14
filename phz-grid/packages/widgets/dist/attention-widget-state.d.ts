/**
 * @phozart/widgets — Attention Widget State (7A-D)
 *
 * Compact attention summary state for dashboard widgets.
 * Supports priority summary, top items, and responsive container variants.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { FilterableAttentionItem } from '@phozart/shared/types';
export interface AttentionWidgetState {
    /** All items provided to the widget. */
    items: FilterableAttentionItem[];
    /** Maximum number of top items to display. */
    maxItems: number;
}
export interface PrioritySummary {
    critical: number;
    warning: number;
    info: number;
}
export type AttentionContainerVariant = 'full' | 'compact' | 'minimal';
/**
 * Create initial widget state from attention items.
 *
 * @param items - All attention items to summarize.
 * @param maxItems - Maximum number of top items to show. Defaults to 5.
 */
export declare function initialAttentionWidgetState(items: FilterableAttentionItem[], maxItems?: number): AttentionWidgetState;
/**
 * Count unacknowledged items by priority level.
 */
export declare function computePrioritySummary(state: AttentionWidgetState): PrioritySummary;
/**
 * Get the top N unacknowledged items sorted by priority then timestamp.
 */
export declare function getTopItems(state: AttentionWidgetState, n: number): FilterableAttentionItem[];
/**
 * Get the total count of unacknowledged items.
 */
export declare function getTotalCount(state: AttentionWidgetState): number;
/**
 * Determine the container variant based on available width.
 *
 * - `> 280px`: 'full' (priority bar + top items + "View all")
 * - `200-280px`: 'compact' (priority counts + "View all")
 * - `< 200px`: 'minimal' (badge count only)
 */
export declare function getContainerVariant(containerWidth: number): AttentionContainerVariant;
//# sourceMappingURL=attention-widget-state.d.ts.map