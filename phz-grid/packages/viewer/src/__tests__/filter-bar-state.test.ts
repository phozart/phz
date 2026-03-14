/**
 * Tests for filter-bar-state.ts — Filter Bar State
 */
import { describe, it, expect } from 'vitest';
import {
  createFilterBarState,
  setFilterDefs,
  openFilter,
  closeFilter,
  setFilterValue,
  clearFilterValue,
  clearAllFilters,
  setPresets,
  applyPreset,
  toggleFilterBarCollapsed,
  getActiveFilterCount,
  hasFilterValue,
} from '../screens/filter-bar-state.js';
import type { DashboardFilterDef, FilterValue } from '@phozart/shared/coordination';

const sampleFilters: DashboardFilterDef[] = [
  { id: 'f1', field: 'region', dataSourceId: 'ds1', label: 'Region', filterType: 'select', required: false, appliesTo: ['w1'] },
  { id: 'f2', field: 'date', dataSourceId: 'ds1', label: 'Date Range', filterType: 'date-range', required: false, appliesTo: ['w1', 'w2'] },
];

const makeFilterValue = (filterId: string, field: string, value: unknown): FilterValue => ({
  filterId,
  field,
  operator: 'equals',
  value,
  label: `${field}: ${value}`,
});

describe('filter-bar-state', () => {
  describe('createFilterBarState', () => {
    it('creates default state', () => {
      const state = createFilterBarState();
      expect(state.filters).toEqual([]);
      expect(state.activeFilterId).toBeNull();
      expect(state.presets).toEqual([]);
      expect(state.activePresetId).toBeNull();
      expect(state.currentValues).toEqual({});
      expect(state.collapsed).toBe(false);
    });
  });

  describe('setFilterDefs', () => {
    it('sets filter definitions', () => {
      const state = setFilterDefs(createFilterBarState(), sampleFilters);
      expect(state.filters).toHaveLength(2);
    });
  });

  describe('openFilter / closeFilter', () => {
    it('opens a filter', () => {
      const state = openFilter(createFilterBarState(), 'f1');
      expect(state.activeFilterId).toBe('f1');
    });

    it('closes a filter', () => {
      let state = openFilter(createFilterBarState(), 'f1');
      state = closeFilter(state);
      expect(state.activeFilterId).toBeNull();
    });
  });

  describe('setFilterValue', () => {
    it('sets a filter value', () => {
      const value = makeFilterValue('f1', 'region', 'East');
      const state = setFilterValue(createFilterBarState(), value);
      expect(state.currentValues['f1']).toEqual(value);
    });

    it('clears active preset when setting a value', () => {
      let state = createFilterBarState({ activePresetId: 'preset-1' });
      state = setFilterValue(state, makeFilterValue('f1', 'region', 'East'));
      expect(state.activePresetId).toBeNull();
    });
  });

  describe('clearFilterValue', () => {
    it('clears a specific filter value', () => {
      let state = createFilterBarState();
      state = setFilterValue(state, makeFilterValue('f1', 'region', 'East'));
      state = setFilterValue(state, makeFilterValue('f2', 'date', '2026'));
      state = clearFilterValue(state, 'f1');
      expect(state.currentValues['f1']).toBeUndefined();
      expect(state.currentValues['f2']).toBeDefined();
    });
  });

  describe('clearAllFilters', () => {
    it('clears all filter values', () => {
      let state = createFilterBarState();
      state = setFilterValue(state, makeFilterValue('f1', 'region', 'East'));
      state = setFilterValue(state, makeFilterValue('f2', 'date', '2026'));
      state = clearAllFilters(state);
      expect(state.currentValues).toEqual({});
      expect(state.activePresetId).toBeNull();
    });
  });

  describe('setPresets', () => {
    it('sets presets and clears loading', () => {
      const presets = [
        { filterId: 'f1', field: 'region', operator: 'equals', value: 'West' },
      ];
      let state = createFilterBarState({ loadingPresets: true });
      state = setPresets(state, presets);
      expect(state.presets).toHaveLength(1);
      expect(state.loadingPresets).toBe(false);
    });
  });

  describe('applyPreset', () => {
    it('applies preset values and sets active preset ID', () => {
      const presetValues = [
        { filterId: 'f1', field: 'region', operator: 'equals', value: 'East', label: 'East' },
        { filterId: 'f2', field: 'date', operator: 'equals', value: '2026-01', label: '2026-01' },
      ];
      const state = applyPreset(createFilterBarState(), 'preset-1', presetValues);
      expect(state.activePresetId).toBe('preset-1');
      expect(Object.keys(state.currentValues)).toHaveLength(2);
      expect(state.currentValues['f1'].value).toBe('East');
      expect(state.currentValues['f2'].value).toBe('2026-01');
    });
  });

  describe('toggleFilterBarCollapsed', () => {
    it('toggles collapsed state', () => {
      let state = createFilterBarState();
      state = toggleFilterBarCollapsed(state);
      expect(state.collapsed).toBe(true);
      state = toggleFilterBarCollapsed(state);
      expect(state.collapsed).toBe(false);
    });
  });

  describe('getActiveFilterCount', () => {
    it('returns count of active filters', () => {
      let state = createFilterBarState();
      expect(getActiveFilterCount(state)).toBe(0);

      state = setFilterValue(state, makeFilterValue('f1', 'region', 'East'));
      expect(getActiveFilterCount(state)).toBe(1);

      state = setFilterValue(state, makeFilterValue('f2', 'date', '2026'));
      expect(getActiveFilterCount(state)).toBe(2);
    });
  });

  describe('hasFilterValue', () => {
    it('checks if a filter has a value', () => {
      let state = createFilterBarState();
      expect(hasFilterValue(state, 'f1')).toBe(false);

      state = setFilterValue(state, makeFilterValue('f1', 'region', 'East'));
      expect(hasFilterValue(state, 'f1')).toBe(true);
      expect(hasFilterValue(state, 'f2')).toBe(false);
    });
  });
});
