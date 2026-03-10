/**
 * @phozart/phz-viewer — Attention Dropdown State
 *
 * Headless state for the attention items dropdown (alerts,
 * notifications, action items). Pure functions on immutable state.
 */

import type { AttentionItem } from '@phozart/phz-shared/adapters';

// ========================================================================
// AttentionDropdownState
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createAttentionDropdownState(
  overrides?: Partial<AttentionDropdownState>,
): AttentionDropdownState {
  const items = overrides?.items ?? [];
  return {
    items,
    open: overrides?.open ?? false,
    loading: overrides?.loading ?? false,
    unreadCount: overrides?.unreadCount ?? items.filter(i => !i.read).length,
    typeFilter: overrides?.typeFilter ?? null,
    totalCount: overrides?.totalCount ?? items.length,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Set attention items from the adapter response.
 */
export function setAttentionItems(
  state: AttentionDropdownState,
  items: AttentionItem[],
  totalCount: number,
): AttentionDropdownState {
  return {
    ...state,
    items,
    totalCount,
    unreadCount: items.filter(i => !i.read).length,
    loading: false,
  };
}

/**
 * Toggle the dropdown open/closed.
 */
export function toggleAttentionDropdown(
  state: AttentionDropdownState,
): AttentionDropdownState {
  return { ...state, open: !state.open };
}

/**
 * Open the dropdown.
 */
export function openAttentionDropdown(
  state: AttentionDropdownState,
): AttentionDropdownState {
  return { ...state, open: true };
}

/**
 * Close the dropdown.
 */
export function closeAttentionDropdown(
  state: AttentionDropdownState,
): AttentionDropdownState {
  return { ...state, open: false };
}

/**
 * Mark specific items as read.
 */
export function markItemsAsRead(
  state: AttentionDropdownState,
  itemIds: string[],
): AttentionDropdownState {
  const idSet = new Set(itemIds);
  const items = state.items.map(i =>
    idSet.has(i.id) ? { ...i, read: true } : i,
  );
  return {
    ...state,
    items,
    unreadCount: items.filter(i => !i.read).length,
  };
}

/**
 * Mark all items as read.
 */
export function markAllAsRead(
  state: AttentionDropdownState,
): AttentionDropdownState {
  return {
    ...state,
    items: state.items.map(i => ({ ...i, read: true })),
    unreadCount: 0,
  };
}

/**
 * Dismiss (remove) an item.
 */
export function dismissItem(
  state: AttentionDropdownState,
  itemId: string,
): AttentionDropdownState {
  const items = state.items.filter(i => i.id !== itemId);
  return {
    ...state,
    items,
    unreadCount: items.filter(i => !i.read).length,
    totalCount: Math.max(0, state.totalCount - 1),
  };
}

/**
 * Set a type filter.
 */
export function setAttentionTypeFilter(
  state: AttentionDropdownState,
  typeFilter: AttentionItem['type'] | null,
): AttentionDropdownState {
  return { ...state, typeFilter };
}

/**
 * Get items filtered by the current type filter.
 */
export function getFilteredItems(state: AttentionDropdownState): AttentionItem[] {
  if (!state.typeFilter) return state.items;
  return state.items.filter(i => i.type === state.typeFilter);
}
