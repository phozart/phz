/**
 * Tests for attention-state.ts — Attention Dropdown State
 */
import { describe, it, expect } from 'vitest';
import {
  createAttentionDropdownState,
  setAttentionItems,
  toggleAttentionDropdown,
  openAttentionDropdown,
  closeAttentionDropdown,
  markItemsAsRead,
  markAllAsRead,
  dismissItem,
  setAttentionTypeFilter,
  getFilteredItems,
} from '../screens/attention-state.js';
import type { AttentionItem } from '@phozart/shared/adapters';

const makeItem = (id: string, type: AttentionItem['type'], read: boolean): AttentionItem => ({
  id,
  type,
  severity: 'info',
  title: `Item ${id}`,
  message: `Message for ${id}`,
  timestamp: Date.now(),
  read,
});

const sampleItems: AttentionItem[] = [
  makeItem('a1', 'alert', false),
  makeItem('a2', 'notification', false),
  makeItem('a3', 'action', true),
  makeItem('a4', 'info', false),
];

describe('attention-state', () => {
  describe('createAttentionDropdownState', () => {
    it('creates default state', () => {
      const state = createAttentionDropdownState();
      expect(state.items).toEqual([]);
      expect(state.open).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.unreadCount).toBe(0);
      expect(state.typeFilter).toBeNull();
    });

    it('computes unread count from items', () => {
      const state = createAttentionDropdownState({ items: sampleItems });
      expect(state.unreadCount).toBe(3);
    });
  });

  describe('setAttentionItems', () => {
    it('sets items and computes unread count', () => {
      let state = createAttentionDropdownState({ loading: true });
      state = setAttentionItems(state, sampleItems, 10);
      expect(state.items).toHaveLength(4);
      expect(state.totalCount).toBe(10);
      expect(state.unreadCount).toBe(3);
      expect(state.loading).toBe(false);
    });
  });

  describe('toggleAttentionDropdown', () => {
    it('toggles open state', () => {
      let state = createAttentionDropdownState();
      state = toggleAttentionDropdown(state);
      expect(state.open).toBe(true);
      state = toggleAttentionDropdown(state);
      expect(state.open).toBe(false);
    });
  });

  describe('openAttentionDropdown / closeAttentionDropdown', () => {
    it('opens and closes', () => {
      let state = createAttentionDropdownState();
      state = openAttentionDropdown(state);
      expect(state.open).toBe(true);
      state = closeAttentionDropdown(state);
      expect(state.open).toBe(false);
    });
  });

  describe('markItemsAsRead', () => {
    it('marks specific items as read', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = markItemsAsRead(state, ['a1', 'a2']);
      expect(state.items.find(i => i.id === 'a1')!.read).toBe(true);
      expect(state.items.find(i => i.id === 'a2')!.read).toBe(true);
      expect(state.items.find(i => i.id === 'a4')!.read).toBe(false);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all items as read', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = markAllAsRead(state);
      expect(state.items.every(i => i.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('dismissItem', () => {
    it('removes item from list', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = dismissItem(state, 'a1');
      expect(state.items).toHaveLength(3);
      expect(state.items.find(i => i.id === 'a1')).toBeUndefined();
      expect(state.totalCount).toBe(3);
    });

    it('updates unread count after dismiss', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = dismissItem(state, 'a1');
      expect(state.unreadCount).toBe(2); // a2 and a4 are unread
    });
  });

  describe('setAttentionTypeFilter / getFilteredItems', () => {
    it('filters by type', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = setAttentionTypeFilter(state, 'alert');
      const filtered = getFilteredItems(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('alert');
    });

    it('returns all items when filter is null', () => {
      const state = createAttentionDropdownState({ items: sampleItems });
      expect(getFilteredItems(state)).toHaveLength(4);
    });

    it('returns empty for type with no items', () => {
      let state = createAttentionDropdownState({ items: sampleItems });
      state = setAttentionTypeFilter(state, 'notification');
      const filtered = getFilteredItems(state);
      expect(filtered).toHaveLength(1);
    });
  });
});
