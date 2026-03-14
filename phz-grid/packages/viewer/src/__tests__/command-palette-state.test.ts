/**
 * Tests for command-palette-state.ts — Command Palette State
 */
import { describe, it, expect } from 'vitest';
import {
  createCommandPaletteState,
  openPalette,
  closePalette,
  togglePalette,
  setQuery,
  selectNext,
  selectPrevious,
  executeSelected,
  getFilteredCommands,
} from '../screens/command-palette-state.js';
import type { CommandItem } from '../screens/command-palette-state.js';

const makeItem = (
  id: string,
  label: string,
  category: CommandItem['category'],
  opts?: Partial<CommandItem>,
): CommandItem => ({
  id,
  label,
  category,
  ...opts,
});

const sampleItems: CommandItem[] = [
  makeItem('nav-catalog', 'Go to Catalog', 'navigation', {
    description: 'Browse all artifacts',
    keywords: ['home', 'browse'],
  }),
  makeItem('nav-explore', 'Go to Explorer', 'navigation', {
    description: 'Visual query builder',
    keywords: ['query', 'sql'],
  }),
  makeItem('art-sales', 'Sales Dashboard', 'artifact', {
    description: 'Monthly sales overview',
  }),
  makeItem('art-revenue', 'Revenue Report', 'artifact', {
    description: 'Quarterly revenue breakdown',
    keywords: ['finance', 'money'],
  }),
  makeItem('act-export', 'Export to CSV', 'action', {
    description: 'Download current view as CSV',
    keywords: ['download'],
  }),
  makeItem('act-refresh', 'Refresh Data', 'action', {
    description: 'Reload all data sources',
    keywords: ['reload'],
  }),
];

describe('command-palette-state', () => {
  describe('createCommandPaletteState', () => {
    it('creates empty default state', () => {
      const state = createCommandPaletteState();
      expect(state.open).toBe(false);
      expect(state.query).toBe('');
      expect(state.selectedIndex).toBe(0);
      expect(state.items).toEqual([]);
      expect(state.filteredItems).toEqual([]);
    });

    it('accepts initial items', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      expect(state.items).toHaveLength(6);
      expect(state.filteredItems).toHaveLength(6);
    });

    it('accepts partial overrides', () => {
      const state = createCommandPaletteState({
        open: true,
        query: 'test',
        selectedIndex: 2,
      });
      expect(state.open).toBe(true);
      expect(state.query).toBe('test');
      expect(state.selectedIndex).toBe(2);
    });
  });

  describe('openPalette', () => {
    it('sets open to true', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const opened = openPalette(state);
      expect(opened.open).toBe(true);
    });

    it('resets query to empty', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        query: 'old query',
      });
      const opened = openPalette(state);
      expect(opened.query).toBe('');
    });

    it('resets selectedIndex to 0', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        selectedIndex: 3,
      });
      const opened = openPalette(state);
      expect(opened.selectedIndex).toBe(0);
    });

    it('recomputes filteredItems to show all items', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        query: 'export',
        filteredItems: [sampleItems[4]],
      });
      const opened = openPalette(state);
      expect(opened.filteredItems).toHaveLength(6);
    });
  });

  describe('closePalette', () => {
    it('sets open to false', () => {
      const state = createCommandPaletteState({ open: true, items: sampleItems });
      const closed = closePalette(state);
      expect(closed.open).toBe(false);
    });
  });

  describe('togglePalette', () => {
    it('opens when closed', () => {
      const state = createCommandPaletteState({ open: false, items: sampleItems });
      const toggled = togglePalette(state);
      expect(toggled.open).toBe(true);
    });

    it('closes when open', () => {
      const state = createCommandPaletteState({ open: true, items: sampleItems });
      const toggled = togglePalette(state);
      expect(toggled.open).toBe(false);
    });

    it('resets query and selectedIndex when opening', () => {
      const state = createCommandPaletteState({
        open: false,
        items: sampleItems,
        query: 'stale',
        selectedIndex: 3,
      });
      const toggled = togglePalette(state);
      expect(toggled.query).toBe('');
      expect(toggled.selectedIndex).toBe(0);
    });
  });

  describe('setQuery', () => {
    it('updates query string', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'export');
      expect(updated.query).toBe('export');
    });

    it('filters items by label match', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'Sales');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('art-sales');
    });

    it('filters items by description match', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'quarterly');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('art-revenue');
    });

    it('filters items by keywords match', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'download');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('act-export');
    });

    it('is case-insensitive', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'DASHBOARD');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('art-sales');
    });

    it('returns all items on empty query', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, '');
      expect(updated.filteredItems).toHaveLength(6);
    });

    it('resets selectedIndex to 0', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        selectedIndex: 3,
      });
      const updated = setQuery(state, 'export');
      expect(updated.selectedIndex).toBe(0);
    });

    it('returns empty filteredItems when no match', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const updated = setQuery(state, 'zzzznonexistent');
      expect(updated.filteredItems).toHaveLength(0);
    });
  });

  describe('selectNext', () => {
    it('increments selectedIndex', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 0,
      });
      const next = selectNext(state);
      expect(next.selectedIndex).toBe(1);
    });

    it('wraps around at end', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 5, // last index (6 items)
      });
      const next = selectNext(state);
      expect(next.selectedIndex).toBe(0);
    });

    it('stays at 0 when filteredItems is empty', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: [],
        selectedIndex: 0,
      });
      const next = selectNext(state);
      expect(next.selectedIndex).toBe(0);
    });
  });

  describe('selectPrevious', () => {
    it('decrements selectedIndex', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 3,
      });
      const prev = selectPrevious(state);
      expect(prev.selectedIndex).toBe(2);
    });

    it('wraps around at beginning', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 0,
      });
      const prev = selectPrevious(state);
      expect(prev.selectedIndex).toBe(5); // last index (6 items)
    });

    it('stays at 0 when filteredItems is empty', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: [],
        selectedIndex: 0,
      });
      const prev = selectPrevious(state);
      expect(prev.selectedIndex).toBe(0);
    });
  });

  describe('executeSelected', () => {
    it('returns the selected item', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 2,
      });
      const item = executeSelected(state);
      expect(item).toEqual(sampleItems[2]);
    });

    it('returns null when filteredItems is empty', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: [],
        selectedIndex: 0,
      });
      const item = executeSelected(state);
      expect(item).toBeNull();
    });

    it('returns null when selectedIndex is out of bounds', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 99,
      });
      const item = executeSelected(state);
      expect(item).toBeNull();
    });
  });

  describe('getFilteredCommands', () => {
    it('returns filtered items grouped by category', () => {
      const state = createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
      });
      const grouped = getFilteredCommands(state);
      expect(grouped.navigation).toHaveLength(2);
      expect(grouped.artifact).toHaveLength(2);
      expect(grouped.action).toHaveLength(2);
    });

    it('returns empty groups for unmatched categories', () => {
      const navOnly = sampleItems.filter(i => i.category === 'navigation');
      const state = createCommandPaletteState({
        items: navOnly,
        filteredItems: navOnly,
      });
      const grouped = getFilteredCommands(state);
      expect(grouped.navigation).toHaveLength(2);
      expect(grouped.artifact).toHaveLength(0);
      expect(grouped.action).toHaveLength(0);
    });

    it('returns all empty groups when filteredItems is empty', () => {
      const state = createCommandPaletteState();
      const grouped = getFilteredCommands(state);
      expect(grouped.navigation).toHaveLength(0);
      expect(grouped.artifact).toHaveLength(0);
      expect(grouped.action).toHaveLength(0);
    });
  });

  describe('items with matching keywords included even if label does not match', () => {
    it('includes item when keyword matches but label does not', () => {
      const items: CommandItem[] = [
        makeItem('nav-catalog', 'Go to Catalog', 'navigation', {
          keywords: ['home', 'browse'],
        }),
      ];
      const state = createCommandPaletteState({ items });
      const updated = setQuery(state, 'home');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('nav-catalog');
    });

    it('includes item when partial keyword matches', () => {
      const items: CommandItem[] = [
        makeItem('act-export', 'Export to CSV', 'action', {
          keywords: ['download'],
        }),
      ];
      const state = createCommandPaletteState({ items });
      const updated = setQuery(state, 'down');
      expect(updated.filteredItems).toHaveLength(1);
      expect(updated.filteredItems[0].id).toBe('act-export');
    });
  });

  describe('immutability', () => {
    it('returns new state objects from every function', () => {
      const state = createCommandPaletteState({ items: sampleItems });
      const opened = openPalette(state);
      const closed = closePalette(state);
      const toggled = togglePalette(state);
      const queried = setQuery(state, 'test');
      const next = selectNext(createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
      }));
      const prev = selectPrevious(createCommandPaletteState({
        items: sampleItems,
        filteredItems: sampleItems,
        selectedIndex: 3,
      }));

      expect(opened).not.toBe(state);
      expect(closed).not.toBe(state);
      expect(toggled).not.toBe(state);
      expect(queried).not.toBe(state);
      expect(next).not.toBe(state);
      expect(prev).not.toBe(state);
    });
  });
});
