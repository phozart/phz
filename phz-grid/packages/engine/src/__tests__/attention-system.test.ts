/**
 * Tests for Attention System (C-2.12)
 */
import { describe, it, expect } from 'vitest';
import {
  createAttentionSystemState,
  addItems,
  markRead,
  markAllRead,
  dismissItem,
  filterByCategory,
  getUnreadItems,
  filterBySeverity,
} from '../attention/attention-system.js';
import type { AttentionItem } from '@phozart/shared/adapters';

// --- Test helpers ---

function makeItem(overrides?: Partial<AttentionItem>): AttentionItem {
  return {
    id: `item_${Math.random().toString(36).slice(2, 8)}`,
    type: 'notification',
    severity: 'info',
    title: 'Test Item',
    message: 'Test message',
    timestamp: Date.now(),
    read: false,
    ...overrides,
  };
}

describe('createAttentionSystemState', () => {
  it('creates default state', () => {
    const state = createAttentionSystemState();
    expect(state.items).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.lastFetchedAt).toBeNull();
    expect(state.fetchIntervalMs).toBe(60_000);
    expect(state.categories).toEqual([]);
  });

  it('accepts overrides and computes unread count', () => {
    const items = [makeItem({ read: false }), makeItem({ read: true })];
    const state = createAttentionSystemState({ items });
    expect(state.unreadCount).toBe(1);
  });
});

describe('addItems', () => {
  it('adds items and sorts by timestamp descending', () => {
    const state = createAttentionSystemState();
    const items = [
      makeItem({ id: 'i1', timestamp: 1000 }),
      makeItem({ id: 'i2', timestamp: 2000 }),
    ];
    const next = addItems(state, items);
    expect(next.items).toHaveLength(2);
    expect(next.items[0].id).toBe('i2'); // newest first
    expect(next.items[1].id).toBe('i1');
  });

  it('deduplicates by ID', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [makeItem({ id: 'i1', message: 'v1' })]);
    state = addItems(state, [makeItem({ id: 'i1', message: 'v2' })]);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].message).toBe('v2');
  });

  it('updates unread count', () => {
    const state = createAttentionSystemState();
    const items = [
      makeItem({ read: false }),
      makeItem({ read: true }),
      makeItem({ read: false }),
    ];
    const next = addItems(state, items);
    expect(next.unreadCount).toBe(2);
  });

  it('extracts categories from item types', () => {
    const state = createAttentionSystemState();
    const items = [
      makeItem({ type: 'alert' }),
      makeItem({ type: 'notification' }),
      makeItem({ type: 'alert' }),
    ];
    const next = addItems(state, items);
    expect(next.categories).toEqual(['alert', 'notification']);
  });

  it('sets lastFetchedAt', () => {
    const state = createAttentionSystemState();
    const next = addItems(state, [makeItem()]);
    expect(next.lastFetchedAt).toBeGreaterThan(0);
  });
});

describe('markRead', () => {
  it('marks specific items as read', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ id: 'i1', read: false }),
      makeItem({ id: 'i2', read: false }),
    ]);
    state = markRead(state, ['i1']);
    const i1 = state.items.find(i => i.id === 'i1');
    const i2 = state.items.find(i => i.id === 'i2');
    expect(i1!.read).toBe(true);
    expect(i2!.read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('handles marking already-read items', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [makeItem({ id: 'i1', read: true })]);
    state = markRead(state, ['i1']);
    expect(state.unreadCount).toBe(0);
  });

  it('handles marking nonexistent IDs gracefully', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [makeItem({ id: 'i1', read: false })]);
    state = markRead(state, ['nonexistent']);
    expect(state.unreadCount).toBe(1);
  });
});

describe('markAllRead', () => {
  it('marks all items as read', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ read: false }),
      makeItem({ read: false }),
      makeItem({ read: true }),
    ]);
    state = markAllRead(state);
    expect(state.unreadCount).toBe(0);
    expect(state.items.every(i => i.read)).toBe(true);
  });
});

describe('dismissItem', () => {
  it('removes an item', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ id: 'i1' }),
      makeItem({ id: 'i2' }),
    ]);
    state = dismissItem(state, 'i1');
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('i2');
  });

  it('updates unread count when unread item is dismissed', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ id: 'i1', read: false }),
      makeItem({ id: 'i2', read: false }),
    ]);
    state = dismissItem(state, 'i1');
    expect(state.unreadCount).toBe(1);
  });

  it('recalculates categories after dismiss', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ id: 'i1', type: 'alert' }),
      makeItem({ id: 'i2', type: 'notification' }),
    ]);
    state = dismissItem(state, 'i1');
    expect(state.categories).toEqual(['notification']);
  });
});

describe('filterByCategory', () => {
  it('returns all items when category is null', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ type: 'alert' }),
      makeItem({ type: 'notification' }),
    ]);
    expect(filterByCategory(state, null)).toHaveLength(2);
  });

  it('filters by category', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ type: 'alert' }),
      makeItem({ type: 'notification' }),
      makeItem({ type: 'alert' }),
    ]);
    const alerts = filterByCategory(state, 'alert');
    expect(alerts).toHaveLength(2);
    expect(alerts.every(i => i.type === 'alert')).toBe(true);
  });

  it('returns empty array for unknown category', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [makeItem({ type: 'alert' })]);
    expect(filterByCategory(state, 'unknown')).toEqual([]);
  });
});

describe('getUnreadItems', () => {
  it('returns only unread items', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ id: 'i1', read: false }),
      makeItem({ id: 'i2', read: true }),
      makeItem({ id: 'i3', read: false }),
    ]);
    const unread = getUnreadItems(state);
    expect(unread).toHaveLength(2);
    expect(unread.every(i => !i.read)).toBe(true);
  });
});

describe('filterBySeverity', () => {
  it('filters items by severity', () => {
    let state = createAttentionSystemState();
    state = addItems(state, [
      makeItem({ severity: 'info' }),
      makeItem({ severity: 'warning' }),
      makeItem({ severity: 'critical' }),
    ]);
    expect(filterBySeverity(state, 'critical')).toHaveLength(1);
    expect(filterBySeverity(state, 'info')).toHaveLength(1);
    expect(filterBySeverity(state, 'warning')).toHaveLength(1);
  });
});
