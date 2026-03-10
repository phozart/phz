import { describe, it, expect } from 'vitest';
import {
  initialEditorCriteriaState,
  toggleCriteria,
  setCriteriaConfig,
  addCriteriaFilter,
  removeCriteriaFilter,
  clearCriteriaFilters,
  type CriteriaFilterEntry,
  type EditorCriteriaState,
} from '../editor-criteria-state.js';

function makeFilter(id: string, field: string): CriteriaFilterEntry {
  return { id, field, operator: 'equals', value: 'test', label: `Filter ${field}` };
}

describe('EditorCriteriaState', () => {
  describe('initialEditorCriteriaState', () => {
    it('starts with criteria hidden', () => {
      const s = initialEditorCriteriaState();
      expect(s.criteriaVisible).toBe(false);
    });

    it('starts with default config', () => {
      const s = initialEditorCriteriaState();
      expect(s.criteriaConfig).toEqual({
        position: 'top',
        collapsible: true,
        showActiveCount: true,
      });
    });

    it('starts with empty active filters', () => {
      const s = initialEditorCriteriaState();
      expect(s.activeFilters).toEqual([]);
    });
  });

  describe('toggleCriteria', () => {
    it('toggles visibility from false to true', () => {
      const s = toggleCriteria(initialEditorCriteriaState());
      expect(s.criteriaVisible).toBe(true);
    });

    it('toggles visibility from true back to false', () => {
      let s = toggleCriteria(initialEditorCriteriaState());
      s = toggleCriteria(s);
      expect(s.criteriaVisible).toBe(false);
    });

    it('does not mutate original state', () => {
      const original = initialEditorCriteriaState();
      toggleCriteria(original);
      expect(original.criteriaVisible).toBe(false);
    });
  });

  describe('setCriteriaConfig', () => {
    it('updates position', () => {
      const s = setCriteriaConfig(initialEditorCriteriaState(), { position: 'left' });
      expect(s.criteriaConfig.position).toBe('left');
    });

    it('preserves other config values when updating one', () => {
      const s = setCriteriaConfig(initialEditorCriteriaState(), { position: 'left' });
      expect(s.criteriaConfig.collapsible).toBe(true);
      expect(s.criteriaConfig.showActiveCount).toBe(true);
    });

    it('updates multiple config values', () => {
      const s = setCriteriaConfig(initialEditorCriteriaState(), {
        collapsible: false,
        showActiveCount: false,
      });
      expect(s.criteriaConfig.collapsible).toBe(false);
      expect(s.criteriaConfig.showActiveCount).toBe(false);
    });
  });

  describe('addCriteriaFilter', () => {
    it('adds a new filter', () => {
      const s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'region'));
      expect(s.activeFilters).toHaveLength(1);
      expect(s.activeFilters[0].id).toBe('f-1');
    });

    it('replaces existing filter with same id', () => {
      let s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'region'));
      const updated: CriteriaFilterEntry = { ...makeFilter('f-1', 'region'), value: 'updated' };
      s = addCriteriaFilter(s, updated);
      expect(s.activeFilters).toHaveLength(1);
      expect(s.activeFilters[0].value).toBe('updated');
    });

    it('allows multiple filters with different ids', () => {
      let s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'region'));
      s = addCriteriaFilter(s, makeFilter('f-2', 'revenue'));
      expect(s.activeFilters).toHaveLength(2);
    });

    it('does not mutate original state', () => {
      const original = initialEditorCriteriaState();
      addCriteriaFilter(original, makeFilter('f-1', 'x'));
      expect(original.activeFilters).toHaveLength(0);
    });
  });

  describe('removeCriteriaFilter', () => {
    it('removes a filter by id', () => {
      let s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'region'));
      s = addCriteriaFilter(s, makeFilter('f-2', 'revenue'));
      s = removeCriteriaFilter(s, 'f-1');
      expect(s.activeFilters).toHaveLength(1);
      expect(s.activeFilters[0].id).toBe('f-2');
    });

    it('returns state unchanged if id not found', () => {
      const s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'x'));
      const s2 = removeCriteriaFilter(s, 'nonexistent');
      expect(s2.activeFilters).toHaveLength(1);
    });
  });

  describe('clearCriteriaFilters', () => {
    it('removes all filters', () => {
      let s = addCriteriaFilter(initialEditorCriteriaState(), makeFilter('f-1', 'a'));
      s = addCriteriaFilter(s, makeFilter('f-2', 'b'));
      s = clearCriteriaFilters(s);
      expect(s.activeFilters).toEqual([]);
    });

    it('is a no-op on empty filters', () => {
      const s = clearCriteriaFilters(initialEditorCriteriaState());
      expect(s.activeFilters).toEqual([]);
    });
  });
});
