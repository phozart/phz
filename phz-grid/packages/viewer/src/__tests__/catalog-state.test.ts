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
} from '../screens/catalog-state.js';
import type { VisibilityMeta } from '@phozart/phz-shared/artifacts';

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
});
