/**
 * Tests for keyboard-help-state.ts — Keyboard Shortcuts Help State (UX-023)
 */
import { describe, it, expect } from 'vitest';
import {
  createKeyboardHelpState,
  openKeyboardHelp,
  closeKeyboardHelp,
  toggleKeyboardHelp,
  setHelpSearch,
  setHelpCategory,
  getFilteredShortcuts,
  getShortcutsByCategory,
  DEFAULT_HELP_SHORTCUTS,
} from '../screens/keyboard-help-state.js';
import type {
  HelpShortcutEntry,
  HelpShortcutCategory,
  KeyboardHelpState,
} from '../screens/keyboard-help-state.js';

describe('keyboard-help-state', () => {
  // ========================================================================
  // DEFAULT_HELP_SHORTCUTS catalog
  // ========================================================================

  describe('DEFAULT_HELP_SHORTCUTS', () => {
    it('contains 18 entries total', () => {
      expect(DEFAULT_HELP_SHORTCUTS).toHaveLength(18);
    });

    it('has 7 navigation shortcuts', () => {
      const nav = DEFAULT_HELP_SHORTCUTS.filter(s => s.category === 'navigation');
      expect(nav).toHaveLength(7);
    });

    it('has 3 editing shortcuts', () => {
      const editing = DEFAULT_HELP_SHORTCUTS.filter(s => s.category === 'editing');
      expect(editing).toHaveLength(3);
    });

    it('has 3 selection shortcuts', () => {
      const selection = DEFAULT_HELP_SHORTCUTS.filter(s => s.category === 'selection');
      expect(selection).toHaveLength(3);
    });

    it('has 2 clipboard shortcuts', () => {
      const clipboard = DEFAULT_HELP_SHORTCUTS.filter(s => s.category === 'clipboard');
      expect(clipboard).toHaveLength(2);
    });

    it('has 3 general shortcuts', () => {
      const general = DEFAULT_HELP_SHORTCUTS.filter(s => s.category === 'general');
      expect(general).toHaveLength(3);
    });

    it('includes Arrow Up in navigation', () => {
      const entry = DEFAULT_HELP_SHORTCUTS.find(s => s.keys === 'Arrow Up');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('navigation');
      expect(entry!.label).toBe('Move up one row');
    });

    it('includes Ctrl+C in clipboard', () => {
      const entry = DEFAULT_HELP_SHORTCUTS.find(s => s.keys === 'Ctrl+C');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('clipboard');
      expect(entry!.label).toBe('Copy selection');
    });

    it('includes ? in general', () => {
      const entry = DEFAULT_HELP_SHORTCUTS.find(s => s.keys === '?');
      expect(entry).toBeDefined();
      expect(entry!.category).toBe('general');
      expect(entry!.label).toBe('Show keyboard shortcuts');
    });

    it('every entry has keys, label, and category', () => {
      for (const entry of DEFAULT_HELP_SHORTCUTS) {
        expect(entry.keys).toBeTruthy();
        expect(entry.label).toBeTruthy();
        expect(entry.category).toBeTruthy();
      }
    });
  });

  // ========================================================================
  // createKeyboardHelpState
  // ========================================================================

  describe('createKeyboardHelpState', () => {
    it('creates default state with default shortcuts', () => {
      const state = createKeyboardHelpState();
      expect(state.open).toBe(false);
      expect(state.searchQuery).toBe('');
      expect(state.activeCategory).toBeNull();
      expect(state.shortcuts).toBe(DEFAULT_HELP_SHORTCUTS);
    });

    it('accepts custom shortcuts', () => {
      const custom: HelpShortcutEntry[] = [
        { keys: 'Ctrl+X', label: 'Custom action', category: 'general' },
      ];
      const state = createKeyboardHelpState(custom);
      expect(state.shortcuts).toBe(custom);
      expect(state.shortcuts).toHaveLength(1);
    });

    it('uses default shortcuts when no argument provided', () => {
      const state = createKeyboardHelpState();
      expect(state.shortcuts).toHaveLength(18);
    });
  });

  // ========================================================================
  // openKeyboardHelp
  // ========================================================================

  describe('openKeyboardHelp', () => {
    it('sets open to true', () => {
      const state = createKeyboardHelpState();
      const opened = openKeyboardHelp(state);
      expect(opened.open).toBe(true);
    });

    it('returns new state object', () => {
      const state = createKeyboardHelpState();
      const opened = openKeyboardHelp(state);
      expect(opened).not.toBe(state);
    });

    it('is no-op if already open (returns same reference)', () => {
      const state = createKeyboardHelpState();
      const opened = openKeyboardHelp(state);
      const openedAgain = openKeyboardHelp(opened);
      expect(openedAgain).toBe(opened);
    });

    it('preserves other state fields', () => {
      const state = createKeyboardHelpState();
      const withCategory = setHelpCategory(state, 'editing');
      const opened = openKeyboardHelp(withCategory);
      expect(opened.activeCategory).toBe('editing');
      expect(opened.shortcuts).toBe(DEFAULT_HELP_SHORTCUTS);
    });
  });

  // ========================================================================
  // closeKeyboardHelp
  // ========================================================================

  describe('closeKeyboardHelp', () => {
    it('sets open to false', () => {
      const state = openKeyboardHelp(createKeyboardHelpState());
      const closed = closeKeyboardHelp(state);
      expect(closed.open).toBe(false);
    });

    it('clears searchQuery', () => {
      let state = createKeyboardHelpState();
      state = openKeyboardHelp(state);
      state = setHelpSearch(state, 'arrow');
      const closed = closeKeyboardHelp(state);
      expect(closed.searchQuery).toBe('');
    });

    it('clears activeCategory', () => {
      let state = createKeyboardHelpState();
      state = openKeyboardHelp(state);
      state = setHelpCategory(state, 'navigation');
      const closed = closeKeyboardHelp(state);
      expect(closed.activeCategory).toBeNull();
    });

    it('returns new state object', () => {
      const state = openKeyboardHelp(createKeyboardHelpState());
      const closed = closeKeyboardHelp(state);
      expect(closed).not.toBe(state);
    });

    it('is no-op if already closed (returns same reference)', () => {
      const state = createKeyboardHelpState();
      const closedAgain = closeKeyboardHelp(state);
      expect(closedAgain).toBe(state);
    });
  });

  // ========================================================================
  // toggleKeyboardHelp
  // ========================================================================

  describe('toggleKeyboardHelp', () => {
    it('opens when closed', () => {
      const state = createKeyboardHelpState();
      const toggled = toggleKeyboardHelp(state);
      expect(toggled.open).toBe(true);
    });

    it('closes when open', () => {
      const state = openKeyboardHelp(createKeyboardHelpState());
      const toggled = toggleKeyboardHelp(state);
      expect(toggled.open).toBe(false);
    });

    it('clears search and category when closing', () => {
      let state = createKeyboardHelpState();
      state = openKeyboardHelp(state);
      state = setHelpSearch(state, 'ctrl');
      state = setHelpCategory(state, 'editing');
      const toggled = toggleKeyboardHelp(state);
      expect(toggled.searchQuery).toBe('');
      expect(toggled.activeCategory).toBeNull();
    });
  });

  // ========================================================================
  // setHelpSearch
  // ========================================================================

  describe('setHelpSearch', () => {
    it('sets searchQuery', () => {
      const state = createKeyboardHelpState();
      const updated = setHelpSearch(state, 'arrow');
      expect(updated.searchQuery).toBe('arrow');
    });

    it('returns new state object', () => {
      const state = createKeyboardHelpState();
      const updated = setHelpSearch(state, 'arrow');
      expect(updated).not.toBe(state);
    });

    it('is no-op if same value (returns same reference)', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'arrow');
      const again = setHelpSearch(state, 'arrow');
      expect(again).toBe(state);
    });

    it('can clear search by setting empty string', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'arrow');
      const cleared = setHelpSearch(state, '');
      expect(cleared.searchQuery).toBe('');
    });
  });

  // ========================================================================
  // setHelpCategory
  // ========================================================================

  describe('setHelpCategory', () => {
    it('sets activeCategory', () => {
      const state = createKeyboardHelpState();
      const updated = setHelpCategory(state, 'navigation');
      expect(updated.activeCategory).toBe('navigation');
    });

    it('accepts null to show all', () => {
      const state = setHelpCategory(createKeyboardHelpState(), 'editing');
      const updated = setHelpCategory(state, null);
      expect(updated.activeCategory).toBeNull();
    });

    it('returns new state object', () => {
      const state = createKeyboardHelpState();
      const updated = setHelpCategory(state, 'clipboard');
      expect(updated).not.toBe(state);
    });

    it('is no-op if same value (returns same reference)', () => {
      const state = setHelpCategory(createKeyboardHelpState(), 'editing');
      const again = setHelpCategory(state, 'editing');
      expect(again).toBe(state);
    });

    it('is no-op if null when already null (returns same reference)', () => {
      const state = createKeyboardHelpState();
      const again = setHelpCategory(state, null);
      expect(again).toBe(state);
    });

    it('accepts all valid categories', () => {
      const categories: HelpShortcutCategory[] = [
        'navigation', 'editing', 'selection', 'clipboard', 'general',
      ];
      for (const cat of categories) {
        const state = setHelpCategory(createKeyboardHelpState(), cat);
        expect(state.activeCategory).toBe(cat);
      }
    });
  });

  // ========================================================================
  // getFilteredShortcuts
  // ========================================================================

  describe('getFilteredShortcuts', () => {
    it('returns all shortcuts when no filters active', () => {
      const state = createKeyboardHelpState();
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(18);
    });

    it('filters by activeCategory', () => {
      const state = setHelpCategory(createKeyboardHelpState(), 'navigation');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(7);
      expect(filtered.every(s => s.category === 'navigation')).toBe(true);
    });

    it('filters by searchQuery on keys (case-insensitive)', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'ctrl+c');
      const filtered = getFilteredShortcuts(state);
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered.some(s => s.keys === 'Ctrl+C')).toBe(true);
    });

    it('filters by searchQuery on label (case-insensitive)', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'undo');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].keys).toBe('Ctrl+Z');
    });

    it('filters by searchQuery on description (case-insensitive)', () => {
      const custom: HelpShortcutEntry[] = [
        { keys: 'Ctrl+D', label: 'Delete', category: 'editing', description: 'Remove selected row permanently' },
        { keys: 'Ctrl+S', label: 'Save', category: 'editing', description: 'Save current changes' },
      ];
      const state = setHelpSearch(createKeyboardHelpState(custom), 'permanently');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].keys).toBe('Ctrl+D');
    });

    it('applies both category AND search filters', () => {
      let state = createKeyboardHelpState();
      state = setHelpCategory(state, 'navigation');
      state = setHelpSearch(state, 'arrow up');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].keys).toBe('Arrow Up');
    });

    it('returns empty array when no matches', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'zzzznonexistent');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(0);
    });

    it('returns empty when category filter excludes all and search also active', () => {
      let state = createKeyboardHelpState();
      state = setHelpCategory(state, 'clipboard');
      state = setHelpSearch(state, 'arrow');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(0);
    });

    it('search matches partial strings', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'arr');
      const filtered = getFilteredShortcuts(state);
      // Should match Arrow Up, Arrow Down, Arrow Left, Arrow Right, Shift+Arrow
      expect(filtered.length).toBeGreaterThanOrEqual(4);
    });

    it('handles category filter with clipboard', () => {
      const state = setHelpCategory(createKeyboardHelpState(), 'clipboard');
      const filtered = getFilteredShortcuts(state);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(s => s.category === 'clipboard')).toBe(true);
    });
  });

  // ========================================================================
  // getShortcutsByCategory
  // ========================================================================

  describe('getShortcutsByCategory', () => {
    it('groups all shortcuts by category when no filters', () => {
      const state = createKeyboardHelpState();
      const grouped = getShortcutsByCategory(state);
      expect(grouped.navigation).toHaveLength(7);
      expect(grouped.editing).toHaveLength(3);
      expect(grouped.selection).toHaveLength(3);
      expect(grouped.clipboard).toHaveLength(2);
      expect(grouped.general).toHaveLength(3);
    });

    it('always returns all 5 category keys', () => {
      const state = createKeyboardHelpState();
      const grouped = getShortcutsByCategory(state);
      expect(Object.keys(grouped)).toHaveLength(5);
      expect(grouped).toHaveProperty('navigation');
      expect(grouped).toHaveProperty('editing');
      expect(grouped).toHaveProperty('selection');
      expect(grouped).toHaveProperty('clipboard');
      expect(grouped).toHaveProperty('general');
    });

    it('returns empty arrays for categories with no matches', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'zzzznonexistent');
      const grouped = getShortcutsByCategory(state);
      expect(grouped.navigation).toHaveLength(0);
      expect(grouped.editing).toHaveLength(0);
      expect(grouped.selection).toHaveLength(0);
      expect(grouped.clipboard).toHaveLength(0);
      expect(grouped.general).toHaveLength(0);
    });

    it('respects category filter', () => {
      const state = setHelpCategory(createKeyboardHelpState(), 'editing');
      const grouped = getShortcutsByCategory(state);
      expect(grouped.editing).toHaveLength(3);
      expect(grouped.navigation).toHaveLength(0);
      expect(grouped.selection).toHaveLength(0);
      expect(grouped.clipboard).toHaveLength(0);
      expect(grouped.general).toHaveLength(0);
    });

    it('respects search filter', () => {
      const state = setHelpSearch(createKeyboardHelpState(), 'undo');
      const grouped = getShortcutsByCategory(state);
      expect(grouped.general).toHaveLength(1);
      expect(grouped.general[0].keys).toBe('Ctrl+Z');
      expect(grouped.navigation).toHaveLength(0);
      expect(grouped.editing).toHaveLength(0);
      expect(grouped.selection).toHaveLength(0);
      expect(grouped.clipboard).toHaveLength(0);
    });

    it('uses filtered shortcuts (both category and search)', () => {
      let state = createKeyboardHelpState();
      state = setHelpCategory(state, 'navigation');
      state = setHelpSearch(state, 'arrow');
      const grouped = getShortcutsByCategory(state);
      // Arrow Up, Arrow Down, Arrow Left, Arrow Right — 4 navigation shortcuts
      expect(grouped.navigation).toHaveLength(4);
      expect(grouped.editing).toHaveLength(0);
    });
  });

  // ========================================================================
  // Immutability / same-reference patterns
  // ========================================================================

  describe('immutability', () => {
    it('original state is never mutated by any function', () => {
      const state = createKeyboardHelpState();
      const snapshot = { ...state };

      openKeyboardHelp(state);
      expect(state).toEqual(snapshot);

      closeKeyboardHelp(state);
      expect(state).toEqual(snapshot);

      toggleKeyboardHelp(state);
      expect(state).toEqual(snapshot);

      setHelpSearch(state, 'test');
      expect(state).toEqual(snapshot);

      setHelpCategory(state, 'editing');
      expect(state).toEqual(snapshot);
    });

    it('returns new objects for actual state changes', () => {
      const state = createKeyboardHelpState();
      const opened = openKeyboardHelp(state);
      expect(opened).not.toBe(state);

      const closed = closeKeyboardHelp(opened);
      expect(closed).not.toBe(opened);

      const searched = setHelpSearch(state, 'test');
      expect(searched).not.toBe(state);

      const categorized = setHelpCategory(state, 'editing');
      expect(categorized).not.toBe(state);
    });
  });
});
