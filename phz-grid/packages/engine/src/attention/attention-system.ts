/**
 * @phozart/phz-engine — Attention System (C-2.12)
 *
 * State management for the attention panel (notifications, alerts,
 * action items). Consumes AttentionItem from @phozart/phz-shared.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type { AttentionItem } from '@phozart/phz-shared/adapters';

// Note: AttentionItem is defined in @phozart/phz-shared/adapters.
// Not re-exported here to avoid duplicate export collisions.

// ========================================================================
// AttentionSystemState
// ========================================================================

export interface AttentionSystemState {
  items: AttentionItem[];
  unreadCount: number;
  lastFetchedAt: number | null;
  fetchIntervalMs: number;
  categories: string[];
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a fresh AttentionSystemState.
 */
export function createAttentionSystemState(
  overrides?: Partial<AttentionSystemState>,
): AttentionSystemState {
  const state: AttentionSystemState = {
    items: [],
    unreadCount: 0,
    lastFetchedAt: null,
    fetchIntervalMs: 60_000,
    categories: [],
    ...overrides,
  };
  // Recompute unread count from items
  state.unreadCount = state.items.filter(i => !i.read).length;
  return state;
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Add attention items to the state. Deduplicates by ID.
 * New items are merged; existing items are updated.
 */
export function addItems(
  state: AttentionSystemState,
  newItems: AttentionItem[],
): AttentionSystemState {
  const existingMap = new Map(state.items.map(i => [i.id, i]));

  for (const item of newItems) {
    existingMap.set(item.id, item);
  }

  const items = Array.from(existingMap.values());
  // Sort by timestamp descending (newest first)
  items.sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = items.filter(i => !i.read).length;

  // Extract unique categories from item types
  const categorySet = new Set(items.map(i => i.type));
  const categories = Array.from(categorySet).sort();

  return {
    ...state,
    items,
    unreadCount,
    categories,
    lastFetchedAt: Date.now(),
  };
}

/**
 * Mark specific items as read by their IDs.
 */
export function markRead(
  state: AttentionSystemState,
  itemIds: string[],
): AttentionSystemState {
  const idSet = new Set(itemIds);
  const items = state.items.map(i =>
    idSet.has(i.id) ? { ...i, read: true } : i,
  );
  const unreadCount = items.filter(i => !i.read).length;

  return { ...state, items, unreadCount };
}

/**
 * Mark all items as read.
 */
export function markAllRead(
  state: AttentionSystemState,
): AttentionSystemState {
  const items = state.items.map(i => ({ ...i, read: true }));
  return { ...state, items, unreadCount: 0 };
}

/**
 * Dismiss (remove) an item by ID.
 */
export function dismissItem(
  state: AttentionSystemState,
  itemId: string,
): AttentionSystemState {
  const items = state.items.filter(i => i.id !== itemId);
  const unreadCount = items.filter(i => !i.read).length;

  // Recalculate categories
  const categorySet = new Set(items.map(i => i.type));
  const categories = Array.from(categorySet).sort();

  return { ...state, items, unreadCount, categories };
}

// ========================================================================
// Selectors
// ========================================================================

/**
 * Filter items by category (type). Returns all items if category is null.
 */
export function filterByCategory(
  state: AttentionSystemState,
  category: string | null,
): AttentionItem[] {
  if (category == null) return state.items;
  return state.items.filter(i => i.type === category);
}

/**
 * Get only unread items.
 */
export function getUnreadItems(state: AttentionSystemState): AttentionItem[] {
  return state.items.filter(i => !i.read);
}

/**
 * Get items by severity.
 */
export function filterBySeverity(
  state: AttentionSystemState,
  severity: AttentionItem['severity'],
): AttentionItem[] {
  return state.items.filter(i => i.severity === severity);
}
