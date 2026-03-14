/**
 * Tests for Subscriptions Tab State (C-2.06)
 */
import { describe, it, expect } from 'vitest';
import {
  createSubscriptionsTabState,
  setSubscriptions,
  setActiveTab,
  setSearchQuery,
  setCreateDialogOpen,
  getFilteredSubscriptions,
  countByStatus,
} from '../coordination/subscriptions-tab-state.js';
import type { Subscription } from '@phozart/shared/types';

// --- Test helpers ---

function makeSub(overrides?: Partial<Subscription>): Subscription {
  const now = Date.now();
  return {
    id: `sub_${Math.random().toString(36).slice(2, 8)}`,
    artifactId: 'report_1',
    userId: 'user_1',
    frequency: 'daily',
    format: 'pdf',
    recipients: ['user@example.com'],
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('createSubscriptionsTabState', () => {
  it('creates default state', () => {
    const state = createSubscriptionsTabState();
    expect(state.subscriptions).toEqual([]);
    expect(state.activeTab).toBe('active');
    expect(state.searchQuery).toBe('');
    expect(state.createDialogOpen).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createSubscriptionsTabState({ activeTab: 'all' });
    expect(state.activeTab).toBe('all');
  });
});

describe('setSubscriptions', () => {
  it('replaces the subscriptions list', () => {
    const state = createSubscriptionsTabState();
    const subs = [makeSub({ id: 's1' }), makeSub({ id: 's2' })];
    const next = setSubscriptions(state, subs);
    expect(next.subscriptions).toHaveLength(2);
  });
});

describe('setActiveTab', () => {
  it('switches tab', () => {
    const state = createSubscriptionsTabState();
    const next = setActiveTab(state, 'paused');
    expect(next.activeTab).toBe('paused');
  });
});

describe('setSearchQuery', () => {
  it('updates search query', () => {
    const state = createSubscriptionsTabState();
    const next = setSearchQuery(state, 'report');
    expect(next.searchQuery).toBe('report');
  });
});

describe('setCreateDialogOpen', () => {
  it('opens the dialog', () => {
    const state = createSubscriptionsTabState();
    const next = setCreateDialogOpen(state, true);
    expect(next.createDialogOpen).toBe(true);
  });

  it('closes the dialog', () => {
    const state = createSubscriptionsTabState({ createDialogOpen: true });
    const next = setCreateDialogOpen(state, false);
    expect(next.createDialogOpen).toBe(false);
  });
});

describe('getFilteredSubscriptions', () => {
  it('returns all when tab is "all"', () => {
    const subs = [
      makeSub({ id: 's1', enabled: true }),
      makeSub({ id: 's2', enabled: false }),
    ];
    const state = createSubscriptionsTabState({ subscriptions: subs, activeTab: 'all' });
    expect(getFilteredSubscriptions(state)).toHaveLength(2);
  });

  it('filters to active only', () => {
    const subs = [
      makeSub({ id: 's1', enabled: true }),
      makeSub({ id: 's2', enabled: false }),
    ];
    const state = createSubscriptionsTabState({ subscriptions: subs, activeTab: 'active' });
    const filtered = getFilteredSubscriptions(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('s1');
  });

  it('filters to paused only', () => {
    const subs = [
      makeSub({ id: 's1', enabled: true }),
      makeSub({ id: 's2', enabled: false }),
    ];
    const state = createSubscriptionsTabState({ subscriptions: subs, activeTab: 'paused' });
    const filtered = getFilteredSubscriptions(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('s2');
  });

  it('applies search query on artifactId', () => {
    const subs = [
      makeSub({ id: 's1', artifactId: 'sales-report' }),
      makeSub({ id: 's2', artifactId: 'inventory-dashboard' }),
    ];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'all',
      searchQuery: 'sales',
    });
    const filtered = getFilteredSubscriptions(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].artifactId).toBe('sales-report');
  });

  it('applies search query on id', () => {
    const subs = [
      makeSub({ id: 'sub_abc' }),
      makeSub({ id: 'sub_xyz' }),
    ];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'all',
      searchQuery: 'abc',
    });
    expect(getFilteredSubscriptions(state)).toHaveLength(1);
  });

  it('applies search query on frequency', () => {
    const subs = [
      makeSub({ id: 's1', frequency: 'daily' }),
      makeSub({ id: 's2', frequency: 'weekly' }),
    ];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'all',
      searchQuery: 'weekly',
    });
    expect(getFilteredSubscriptions(state)).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    const subs = [makeSub({ id: 's1', artifactId: 'Sales-Report' })];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'all',
      searchQuery: 'SALES',
    });
    expect(getFilteredSubscriptions(state)).toHaveLength(1);
  });

  it('ignores whitespace-only search query', () => {
    const subs = [makeSub(), makeSub()];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'all',
      searchQuery: '   ',
    });
    expect(getFilteredSubscriptions(state)).toHaveLength(2);
  });

  it('combines tab filter and search', () => {
    const subs = [
      makeSub({ id: 's1', enabled: true, artifactId: 'sales' }),
      makeSub({ id: 's2', enabled: false, artifactId: 'sales' }),
      makeSub({ id: 's3', enabled: true, artifactId: 'inventory' }),
    ];
    const state = createSubscriptionsTabState({
      subscriptions: subs,
      activeTab: 'active',
      searchQuery: 'sales',
    });
    const filtered = getFilteredSubscriptions(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('s1');
  });
});

describe('countByStatus', () => {
  it('counts active and paused subscriptions', () => {
    const subs = [
      makeSub({ enabled: true }),
      makeSub({ enabled: true }),
      makeSub({ enabled: false }),
    ];
    const state = createSubscriptionsTabState({ subscriptions: subs });
    const counts = countByStatus(state);
    expect(counts.active).toBe(2);
    expect(counts.paused).toBe(1);
    expect(counts.total).toBe(3);
  });

  it('returns zeros for empty state', () => {
    const state = createSubscriptionsTabState();
    const counts = countByStatus(state);
    expect(counts.active).toBe(0);
    expect(counts.paused).toBe(0);
    expect(counts.total).toBe(0);
  });
});
