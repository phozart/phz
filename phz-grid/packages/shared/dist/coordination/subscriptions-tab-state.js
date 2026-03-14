/**
 * @phozart/shared — Subscriptions Tab State (C-2.06)
 *
 * UI state for the subscriptions management tab. Tracks active/paused
 * subscriptions, search, and dialog state.
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a fresh SubscriptionsTabState.
 */
export function createSubscriptionsTabState(overrides) {
    return {
        subscriptions: [],
        activeTab: 'active',
        searchQuery: '',
        createDialogOpen: false,
        ...overrides,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Set the subscriptions list (full replacement).
 */
export function setSubscriptions(state, subscriptions) {
    return { ...state, subscriptions };
}
/**
 * Switch the active tab filter.
 */
export function setActiveTab(state, tab) {
    return { ...state, activeTab: tab };
}
/**
 * Update the search query.
 */
export function setSearchQuery(state, query) {
    return { ...state, searchQuery: query };
}
/**
 * Open or close the create dialog.
 */
export function setCreateDialogOpen(state, open) {
    return { ...state, createDialogOpen: open };
}
// ========================================================================
// Selectors
// ========================================================================
/**
 * Get filtered and searched subscriptions based on current tab and query.
 */
export function getFilteredSubscriptions(state) {
    let subs = state.subscriptions;
    // Apply tab filter
    switch (state.activeTab) {
        case 'active':
            subs = subs.filter(s => s.enabled);
            break;
        case 'paused':
            subs = subs.filter(s => !s.enabled);
            break;
        // 'all' — no filter
    }
    // Apply search query
    if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase().trim();
        subs = subs.filter(s => s.artifactId.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.frequency.toLowerCase().includes(q));
    }
    return subs;
}
/**
 * Count subscriptions by enabled/disabled status.
 */
export function countByStatus(state) {
    const active = state.subscriptions.filter(s => s.enabled).length;
    const paused = state.subscriptions.filter(s => !s.enabled).length;
    return { active, paused, total: state.subscriptions.length };
}
//# sourceMappingURL=subscriptions-tab-state.js.map