/**
 * @phozart/engine — Attention System (C-2.12)
 *
 * State management for the attention panel (notifications, alerts,
 * action items). Consumes AttentionItem from @phozart/shared.
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a fresh AttentionSystemState.
 */
export function createAttentionSystemState(overrides) {
    const state = {
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
export function addItems(state, newItems) {
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
export function markRead(state, itemIds) {
    const idSet = new Set(itemIds);
    const items = state.items.map(i => idSet.has(i.id) ? { ...i, read: true } : i);
    const unreadCount = items.filter(i => !i.read).length;
    return { ...state, items, unreadCount };
}
/**
 * Mark all items as read.
 */
export function markAllRead(state) {
    const items = state.items.map(i => ({ ...i, read: true }));
    return { ...state, items, unreadCount: 0 };
}
/**
 * Dismiss (remove) an item by ID.
 */
export function dismissItem(state, itemId) {
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
export function filterByCategory(state, category) {
    if (category == null)
        return state.items;
    return state.items.filter(i => i.type === category);
}
/**
 * Get only unread items.
 */
export function getUnreadItems(state) {
    return state.items.filter(i => !i.read);
}
/**
 * Get items by severity.
 */
export function filterBySeverity(state, severity) {
    return state.items.filter(i => i.severity === severity);
}
//# sourceMappingURL=attention-system.js.map