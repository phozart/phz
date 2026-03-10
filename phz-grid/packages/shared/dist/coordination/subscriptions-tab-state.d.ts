/**
 * @phozart/phz-shared — Subscriptions Tab State (C-2.06)
 *
 * UI state for the subscriptions management tab. Tracks active/paused
 * subscriptions, search, and dialog state.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { Subscription } from '../types/subscription.js';
export type SubscriptionTabFilter = 'active' | 'paused' | 'all';
export interface SubscriptionsTabState {
    subscriptions: Subscription[];
    activeTab: SubscriptionTabFilter;
    searchQuery: string;
    createDialogOpen: boolean;
}
/**
 * Create a fresh SubscriptionsTabState.
 */
export declare function createSubscriptionsTabState(overrides?: Partial<SubscriptionsTabState>): SubscriptionsTabState;
/**
 * Set the subscriptions list (full replacement).
 */
export declare function setSubscriptions(state: SubscriptionsTabState, subscriptions: Subscription[]): SubscriptionsTabState;
/**
 * Switch the active tab filter.
 */
export declare function setActiveTab(state: SubscriptionsTabState, tab: SubscriptionTabFilter): SubscriptionsTabState;
/**
 * Update the search query.
 */
export declare function setSearchQuery(state: SubscriptionsTabState, query: string): SubscriptionsTabState;
/**
 * Open or close the create dialog.
 */
export declare function setCreateDialogOpen(state: SubscriptionsTabState, open: boolean): SubscriptionsTabState;
/**
 * Get filtered and searched subscriptions based on current tab and query.
 */
export declare function getFilteredSubscriptions(state: SubscriptionsTabState): Subscription[];
/**
 * Count subscriptions by enabled/disabled status.
 */
export declare function countByStatus(state: SubscriptionsTabState): {
    active: number;
    paused: number;
    total: number;
};
//# sourceMappingURL=subscriptions-tab-state.d.ts.map