/**
 * Tests for catalog-state.ts — Catalog Screen State
 */
import { describe, it, expect } from 'vitest';
import {
  createCatalogState,
  applyFilters,
  setSearchQuery,
  setTypeFilter,
  setCatalogSort,
  setCatalogPage,
  setCatalogArtifacts,
  toggleFavorite,
  toggleViewMode,
  getCurrentPage,
  getTotalPages,
  addRecentItem,
  getRecentArtifacts,
  loadPersistedFavorites,
  loadPersistedRecents,
} from '../screens/catalog-state.js';
import type { VisibilityMeta } from '@phozart/shared/artifacts';

const makeArtifact = (id: string, name: string, type: string, visibility = 'published'): VisibilityMeta => ({
  id,
  type: type as any,
  name,
  visibility: visibility as any,
  ownerId: 'user-1',
});

const sampleArtifacts: VisibilityMeta[] = [
  makeArtifact('d1', 'Sales Dashboard', 'dashboard'),
  makeArtifact('d2', 'Revenue Dashboard', 'dashboard'),
  makeArtifact('r1', 'Monthly Report', 'report'),
  makeArtifact('r2', 'Annual Summary', 'report'),
  makeArtifact('g1', 'Product Grid', 'grid-definition'),
];

describe('catalog-state', () => {
  describe('createCatalogState', () => {
    it('creates empty default state', () => {
      const state = createCatalogState();
      expect(state.artifacts).toEqual([]);
      expect(state.filteredArtifacts).toEqual([]);
      expect(state.searchQuery).toBe('');
      expect(state.typeFilter).toBeNull();
      expect(state.sort).toEqual({ field: 'name', direction: 'asc' });
      expect(state.page).toBe(0);
      expect(state.pageSize).toBe(20);
      expect(state.viewMode).toBe('grid');
    });

    it('accepts initial artifacts', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      expect(state.artifacts).toHaveLength(5);
      expect(state.filteredArtifacts).toHaveLength(5);
    });
  });

  describe('setSearchQuery', () => {
    it('filters by name', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const filtered = setSearchQuery(state, 'dashboard');
      expect(filtered.filteredArtifacts).toHaveLength(2);
      expect(filtered.filteredArtifacts.every(a => a.name.toLowerCase().includes('dashboard'))).toBe(true);
    });

    it('filters by description', () => {
      const artifacts = [
        { ...makeArtifact('d1', 'Sales', 'dashboard'), description: 'quarterly sales data' },
      ];
      const state = createCatalogState({ artifacts });
      const filtered = setSearchQuery(state, 'quarterly');
      expect(filtered.filteredArtifacts).toHaveLength(1);
    });

    it('is case-insensitive', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const filtered = setSearchQuery(state, 'DASHBOARD');
      expect(filtered.filteredArtifacts).toHaveLength(2);
    });

    it('returns all artifacts on empty search', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const filtered = setSearchQuery(state, '');
      expect(filtered.filteredArtifacts).toHaveLength(5);
    });

    it('resets page to 0', () => {
      let state = createCatalogState({ artifacts: sampleArtifacts });
      state = { ...state, page: 2 };
      const filtered = setSearchQuery(state, 'dashboard');
      expect(filtered.page).toBe(0);
    });
  });

  describe('setTypeFilter', () => {
    it('filters by artifact type', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const filtered = setTypeFilter(state, 'dashboard');
      expect(filtered.filteredArtifacts).toHaveLength(2);
      expect(filtered.filteredArtifacts.every(a => a.type === 'dashboard')).toBe(true);
    });

    it('shows all when null', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const filtered = setTypeFilter(state, null);
      expect(filtered.filteredArtifacts).toHaveLength(5);
    });
  });

  describe('setCatalogSort', () => {
    it('sorts by name ascending', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const sorted = setCatalogSort(state, { field: 'name', direction: 'asc' });
      expect(sorted.filteredArtifacts[0].name).toBe('Annual Summary');
    });

    it('sorts by name descending', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const sorted = setCatalogSort(state, { field: 'name', direction: 'desc' });
      expect(sorted.filteredArtifacts[0].name).toBe('Sales Dashboard');
    });

    it('sorts by type', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const sorted = setCatalogSort(state, { field: 'type', direction: 'asc' });
      expect(sorted.filteredArtifacts[0].type).toBe('dashboard');
    });
  });

  describe('combined search + type filter', () => {
    it('applies both search and type filter', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      let filtered = setTypeFilter(state, 'dashboard');
      filtered = setSearchQuery(filtered, 'revenue');
      expect(filtered.filteredArtifacts).toHaveLength(1);
      expect(filtered.filteredArtifacts[0].name).toBe('Revenue Dashboard');
    });
  });

  describe('setCatalogPage', () => {
    it('sets page within bounds', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts, pageSize: 2 });
      const filtered = applyFilters(state);
      const paged = setCatalogPage(filtered, 1);
      expect(paged.page).toBe(1);
    });

    it('clamps to max page', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts, pageSize: 2 });
      const filtered = applyFilters(state);
      const paged = setCatalogPage(filtered, 99);
      expect(paged.page).toBe(2); // 5 items / 2 per page = 3 pages (0-2)
    });

    it('clamps to 0 for negative values', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const paged = setCatalogPage(state, -5);
      expect(paged.page).toBe(0);
    });
  });

  describe('setCatalogArtifacts', () => {
    it('sets artifacts and recomputes filters', () => {
      let state = createCatalogState();
      state = setSearchQuery(state, 'dashboard');
      state = setCatalogArtifacts(state, sampleArtifacts);
      expect(state.filteredArtifacts).toHaveLength(2);
      expect(state.loading).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('adds artifact to favorites', () => {
      const state = createCatalogState();
      const toggled = toggleFavorite(state, 'd1');
      expect(toggled.favoriteIds.has('d1')).toBe(true);
    });

    it('removes artifact from favorites', () => {
      const state = createCatalogState({ favoriteIds: new Set(['d1']) });
      const toggled = toggleFavorite(state, 'd1');
      expect(toggled.favoriteIds.has('d1')).toBe(false);
    });
  });

  describe('toggleViewMode', () => {
    it('toggles between grid and list', () => {
      let state = createCatalogState();
      expect(state.viewMode).toBe('grid');
      state = toggleViewMode(state);
      expect(state.viewMode).toBe('list');
      state = toggleViewMode(state);
      expect(state.viewMode).toBe('grid');
    });
  });

  describe('getCurrentPage / getTotalPages', () => {
    it('returns correct page of results', () => {
      const state = createCatalogState({
        artifacts: sampleArtifacts,
        filteredArtifacts: sampleArtifacts,
        totalCount: 5,
        pageSize: 2,
        page: 0,
      });
      expect(getCurrentPage(state)).toHaveLength(2);
      expect(getTotalPages(state)).toBe(3);
    });

    it('returns last page correctly', () => {
      const state = createCatalogState({
        artifacts: sampleArtifacts,
        filteredArtifacts: sampleArtifacts,
        totalCount: 5,
        pageSize: 2,
        page: 2,
      });
      expect(getCurrentPage(state)).toHaveLength(1);
    });

    it('returns 1 for empty results', () => {
      const state = createCatalogState();
      expect(getTotalPages(state)).toBe(1);
    });
  });

  describe('recent items', () => {
    it('creates state with empty recentItems by default', () => {
      const state = createCatalogState();
      expect(state.recentItems).toEqual([]);
    });

    it('addRecentItem adds artifact to recents', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      const updated = addRecentItem(state, 'd1');
      expect(updated.recentItems).toHaveLength(1);
      expect(updated.recentItems[0].id).toBe('d1');
      expect(typeof updated.recentItems[0].timestamp).toBe('number');
    });

    it('addRecentItem moves existing item to front (most recent)', () => {
      let state = createCatalogState({ artifacts: sampleArtifacts });
      state = addRecentItem(state, 'd1');
      state = addRecentItem(state, 'r1');
      state = addRecentItem(state, 'd1'); // re-add d1
      expect(state.recentItems).toHaveLength(2);
      expect(state.recentItems[0].id).toBe('d1');
      expect(state.recentItems[1].id).toBe('r1');
    });

    it('addRecentItem caps at 10 items (oldest removed)', () => {
      let state = createCatalogState();
      for (let i = 0; i < 12; i++) {
        state = addRecentItem(state, `item-${i}`);
      }
      expect(state.recentItems).toHaveLength(10);
      // Most recent should be first
      expect(state.recentItems[0].id).toBe('item-11');
      // Oldest surviving should be item-2 (items 0 and 1 evicted)
      expect(state.recentItems[9].id).toBe('item-2');
    });

    it('getRecentArtifacts returns matching artifacts from the artifacts array', () => {
      let state = createCatalogState({ artifacts: sampleArtifacts });
      state = addRecentItem(state, 'r1');
      state = addRecentItem(state, 'd1');
      const recents = getRecentArtifacts(state);
      expect(recents).toHaveLength(2);
      expect(recents[0].id).toBe('d1'); // most recent first
      expect(recents[1].id).toBe('r1');
    });

    it('getRecentArtifacts returns empty array if no recents', () => {
      const state = createCatalogState({ artifacts: sampleArtifacts });
      expect(getRecentArtifacts(state)).toEqual([]);
    });

    it('getRecentArtifacts skips IDs not found in artifacts', () => {
      let state = createCatalogState({ artifacts: sampleArtifacts });
      state = addRecentItem(state, 'd1');
      state = addRecentItem(state, 'nonexistent');
      const recents = getRecentArtifacts(state);
      expect(recents).toHaveLength(1);
      expect(recents[0].id).toBe('d1');
    });
  });

  describe('persistence helpers', () => {
    it('loadPersistedFavorites sets favoriteIds from array', () => {
      const state = createCatalogState();
      const updated = loadPersistedFavorites(state, ['d1', 'r1', 'g1']);
      expect(updated.favoriteIds).toEqual(new Set(['d1', 'r1', 'g1']));
    });

    it('loadPersistedFavorites replaces existing favorites', () => {
      const state = createCatalogState({ favoriteIds: new Set(['old-1']) });
      const updated = loadPersistedFavorites(state, ['d1']);
      expect(updated.favoriteIds.has('old-1')).toBe(false);
      expect(updated.favoriteIds.has('d1')).toBe(true);
    });

    it('loadPersistedRecents sets recentItems from array', () => {
      const items = [
        { id: 'd1', timestamp: 1000 },
        { id: 'r1', timestamp: 900 },
      ];
      const state = createCatalogState();
      const updated = loadPersistedRecents(state, items);
      expect(updated.recentItems).toEqual(items);
    });

    it('loadPersistedRecents caps at 10 items', () => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        id: `item-${i}`,
        timestamp: 1000 - i,
      }));
      const state = createCatalogState();
      const updated = loadPersistedRecents(state, items);
      expect(updated.recentItems).toHaveLength(10);
      expect(updated.recentItems[0].id).toBe('item-0');
      expect(updated.recentItems[9].id).toBe('item-9');
    });
  });
});
