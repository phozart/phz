/**
 * @phozart/shared — Subscriptions Tab State (C-2.06)
 *
 * UI state for the subscriptions management tab. Tracks active/paused
 * subscriptions, search, and dialog state.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type { Subscription } from '../types/subscription.js';

// Note: Subscription is defined in ../types/subscription.js.
// Not re-exported here to avoid duplicate export collisions.

// ========================================================================
// SubscriptionsTabState
// ========================================================================

export type SubscriptionTabFilter = 'active' | 'paused' | 'all';

export interface SubscriptionsTabState {
  subscriptions: Subscription[];
  activeTab: SubscriptionTabFilter;
  searchQuery: string;
  createDialogOpen: boolean;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a fresh SubscriptionsTabState.
 */
export function createSubscriptionsTabState(
  overrides?: Partial<SubscriptionsTabState>,
): SubscriptionsTabState {
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
export function setSubscriptions(
  state: SubscriptionsTabState,
  subscriptions: Subscription[],
): SubscriptionsTabState {
  return { ...state, subscriptions };
}

/**
 * Switch the active tab filter.
 */
export function setActiveTab(
  state: SubscriptionsTabState,
  tab: SubscriptionTabFilter,
): SubscriptionsTabState {
  return { ...state, activeTab: tab };
}

/**
 * Update the search query.
 */
export function setSearchQuery(
  state: SubscriptionsTabState,
  query: string,
): SubscriptionsTabState {
  return { ...state, searchQuery: query };
}

/**
 * Open or close the create dialog.
 */
export function setCreateDialogOpen(
  state: SubscriptionsTabState,
  open: boolean,
): SubscriptionsTabState {
  return { ...state, createDialogOpen: open };
}

// ========================================================================
// Selectors
// ========================================================================

/**
 * Get filtered and searched subscriptions based on current tab and query.
 */
export function getFilteredSubscriptions(
  state: SubscriptionsTabState,
): Subscription[] {
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
    subs = subs.filter(s =>
      s.artifactId.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.frequency.toLowerCase().includes(q),
    );
  }

  return subs;
}

/**
 * Count subscriptions by enabled/disabled status.
 */
export function countByStatus(
  state: SubscriptionsTabState,
): { active: number; paused: number; total: number } {
  const active = state.subscriptions.filter(s => s.enabled).length;
  const paused = state.subscriptions.filter(s => !s.enabled).length;
  return { active, paused, total: state.subscriptions.length };
}
