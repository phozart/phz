/**
 * @phozart/engine — Attention System (C-2.12)
 *
 * State management for the attention panel (notifications, alerts,
 * action items). Consumes AttentionItem from @phozart/shared.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { AttentionItem } from '@phozart/shared/adapters';
export interface AttentionSystemState {
    items: AttentionItem[];
    unreadCount: number;
    lastFetchedAt: number | null;
    fetchIntervalMs: number;
    categories: string[];
}
/**
 * Create a fresh AttentionSystemState.
 */
export declare function createAttentionSystemState(overrides?: Partial<AttentionSystemState>): AttentionSystemState;
/**
 * Add attention items to the state. Deduplicates by ID.
 * New items are merged; existing items are updated.
 */
export declare function addItems(state: AttentionSystemState, newItems: AttentionItem[]): AttentionSystemState;
/**
 * Mark specific items as read by their IDs.
 */
export declare function markRead(state: AttentionSystemState, itemIds: string[]): AttentionSystemState;
/**
 * Mark all items as read.
 */
export declare function markAllRead(state: AttentionSystemState): AttentionSystemState;
/**
 * Dismiss (remove) an item by ID.
 */
export declare function dismissItem(state: AttentionSystemState, itemId: string): AttentionSystemState;
/**
 * Filter items by category (type). Returns all items if category is null.
 */
export declare function filterByCategory(state: AttentionSystemState, category: string | null): AttentionItem[];
/**
 * Get only unread items.
 */
export declare function getUnreadItems(state: AttentionSystemState): AttentionItem[];
/**
 * Get items by severity.
 */
export declare function filterBySeverity(state: AttentionSystemState, severity: AttentionItem['severity']): AttentionItem[];
//# sourceMappingURL=attention-system.d.ts.map