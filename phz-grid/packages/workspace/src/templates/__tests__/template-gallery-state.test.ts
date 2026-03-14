import { describe, it, expect } from 'vitest';
import type { TemplateDefinition } from '../../types.js';
import {
  createTemplateGalleryState,
  setSearchQuery,
  selectCategory,
  selectTemplate,
  toggleFavorite,
  getFilteredTemplates,
  getGroupedTemplates,
  type TemplateGalleryState,
} from '../template-gallery-state.js';

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockTemplates = [
  { id: 't1', name: 'KPI Overview', category: 'overview', tags: ['kpi', 'metrics'] },
  { id: 't2', name: 'Time Series', category: 'analytics', tags: ['time', 'chart'] },
  { id: 't3', name: 'Tabular Report', category: 'reports', tags: ['table', 'data'] },
  { id: 't4', name: 'Scorecard', category: 'overview', tags: ['score', 'kpi'] },
] as TemplateDefinition[];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TemplateGalleryState', () => {
  // =========================================================================
  // Initialization
  // =========================================================================
  describe('createTemplateGalleryState', () => {
    it('initializes with templates and extracts unique categories', () => {
      const state = createTemplateGalleryState(mockTemplates);
      expect(state.templates).toEqual(mockTemplates);
      expect(state.categories).toEqual(['overview', 'analytics', 'reports']);
    });

    it('sets empty searchQuery and null selectedCategory', () => {
      const state = createTemplateGalleryState(mockTemplates);
      expect(state.searchQuery).toBe('');
      expect(state.selectedCategory).toBeNull();
    });

    it('initializes empty favoriteIds Set', () => {
      const state = createTemplateGalleryState(mockTemplates);
      expect(state.favoriteIds).toBeInstanceOf(Set);
      expect(state.favoriteIds.size).toBe(0);
    });
  });

  // =========================================================================
  // Search
  // =========================================================================
  describe('setSearchQuery', () => {
    it('updates searchQuery', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = setSearchQuery(state, 'kpi');
      expect(state.searchQuery).toBe('kpi');
    });
  });

  // =========================================================================
  // Category Selection
  // =========================================================================
  describe('selectCategory', () => {
    it('sets selectedCategory', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = selectCategory(state, 'analytics');
      expect(state.selectedCategory).toBe('analytics');
    });

    it('clears category filter with null (show all)', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = selectCategory(state, 'analytics');
      state = selectCategory(state, null);
      expect(state.selectedCategory).toBeNull();
    });
  });

  // =========================================================================
  // Template Selection
  // =========================================================================
  describe('selectTemplate', () => {
    it('sets selectedTemplateId', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = selectTemplate(state, 't1');
      expect(state.selectedTemplateId).toBe('t1');
    });

    it('clears selection with null', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = selectTemplate(state, 't1');
      state = selectTemplate(state, null);
      expect(state.selectedTemplateId).toBeNull();
    });
  });

  // =========================================================================
  // Favorites
  // =========================================================================
  describe('toggleFavorite', () => {
    it('adds templateId to favoriteIds', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = toggleFavorite(state, 't1');
      expect(state.favoriteIds.has('t1')).toBe(true);
    });

    it('removes templateId if already favorited (toggle)', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = toggleFavorite(state, 't1');
      expect(state.favoriteIds.has('t1')).toBe(true);
      state = toggleFavorite(state, 't1');
      expect(state.favoriteIds.has('t1')).toBe(false);
    });
  });

  // =========================================================================
  // Filtered Templates
  // =========================================================================
  describe('getFilteredTemplates', () => {
    it('returns all when no filters', () => {
      const state = createTemplateGalleryState(mockTemplates);
      const result = getFilteredTemplates(state);
      expect(result).toHaveLength(4);
    });

    it('filters by searchQuery (case-insensitive, matches name)', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = setSearchQuery(state, 'kpi');
      const result = getFilteredTemplates(state);
      // Matches "KPI Overview" (name) and "Scorecard" (tag 'kpi')
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id).sort()).toEqual(['t1', 't4']);
    });

    it('filters by searchQuery matching tags', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = setSearchQuery(state, 'chart');
      const result = getFilteredTemplates(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t2');
    });

    it('filters by selectedCategory', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = selectCategory(state, 'overview');
      const result = getFilteredTemplates(state);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.category === 'overview')).toBe(true);
    });

    it('combines search + category filters', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = setSearchQuery(state, 'kpi');
      state = selectCategory(state, 'overview');
      const result = getFilteredTemplates(state);
      // "KPI Overview" matches search (name) + category,
      // "Scorecard" matches search (tag 'kpi') + category
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id).sort()).toEqual(['t1', 't4']);
    });
  });

  // =========================================================================
  // Grouped Templates
  // =========================================================================
  describe('getGroupedTemplates', () => {
    it('groups by category', () => {
      const state = createTemplateGalleryState(mockTemplates);
      const grouped = getGroupedTemplates(state);
      expect(grouped).toBeInstanceOf(Map);
      expect(grouped.get('overview')).toHaveLength(2);
      expect(grouped.get('analytics')).toHaveLength(1);
      expect(grouped.get('reports')).toHaveLength(1);
    });

    it('only includes filtered templates', () => {
      let state = createTemplateGalleryState(mockTemplates);
      state = setSearchQuery(state, 'kpi');
      const grouped = getGroupedTemplates(state);
      // Only 'overview' category has kpi-matching templates
      expect(grouped.has('overview')).toBe(true);
      expect(grouped.has('analytics')).toBe(false);
      expect(grouped.has('reports')).toBe(false);
      expect(grouped.get('overview')).toHaveLength(2);
    });
  });

  // =========================================================================
  // Immutability
  // =========================================================================
  describe('immutability', () => {
    it('all functions return new state objects', () => {
      const original = createTemplateGalleryState(mockTemplates);

      const afterSearch = setSearchQuery(original, 'test');
      expect(afterSearch).not.toBe(original);
      expect(original.searchQuery).toBe('');

      const afterCategory = selectCategory(original, 'overview');
      expect(afterCategory).not.toBe(original);
      expect(original.selectedCategory).toBeNull();

      const afterSelect = selectTemplate(original, 't1');
      expect(afterSelect).not.toBe(original);
      expect(original.selectedTemplateId).toBeNull();

      const afterFavorite = toggleFavorite(original, 't1');
      expect(afterFavorite).not.toBe(original);
      expect(original.favoriteIds.size).toBe(0);
    });
  });
});
