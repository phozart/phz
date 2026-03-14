/**
 * @phozart/viewer — Attention Dropdown State
 *
 * Headless state for the attention items dropdown (alerts,
 * notifications, action items). Pure functions on immutable state.
 */
import type { AttentionItem } from '@phozart/shared/adapters';
export interface AttentionDropdownState {
    /** All attention items. */
    items: AttentionItem[];
    /** Whether the dropdown is currently open. */
    open: boolean;
    /** Whether items are being loaded. */
    loading: boolean;
    /** Count of unread items. */
    unreadCount: number;
    /** Active type filter (null = show all). */
    typeFilter: AttentionItem['type'] | null;
    /** Total items on server (may be > items.length if paginated). */
    totalCount: number;
}
export declare function createAttentionDropdownState(overrides?: Partial<AttentionDropdownState>): AttentionDropdownState;
/**
 * Set attention items from the adapter response.
 */
export declare function setAttentionItems(state: AttentionDropdownState, items: AttentionItem[], totalCount: number): AttentionDropdownState;
/**
 * Toggle the dropdown open/closed.
 */
export declare function toggleAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState;
/**
 * Open the dropdown.
 */
export declare function openAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState;
/**
 * Close the dropdown.
 */
export declare function closeAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState;
/**
 * Mark specific items as read.
 */
export declare function markItemsAsRead(state: AttentionDropdownState, itemIds: string[]): AttentionDropdownState;
/**
 * Mark all items as read.
 */
export declare function markAllAsRead(state: AttentionDropdownState): AttentionDropdownState;
/**
 * Dismiss (remove) an item.
 */
export declare function dismissItem(state: AttentionDropdownState, itemId: string): AttentionDropdownState;
/**
 * Set a type filter.
 */
export declare function setAttentionTypeFilter(state: AttentionDropdownState, typeFilter: AttentionItem['type'] | null): AttentionDropdownState;
/**
 * Get items filtered by the current type filter.
 */
export declare function getFilteredItems(state: AttentionDropdownState): AttentionItem[];
//# sourceMappingURL=attention-state.d.ts.map