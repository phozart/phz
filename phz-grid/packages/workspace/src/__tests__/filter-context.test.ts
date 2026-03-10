import { describe, it, expect, vi } from 'vitest';
import { createFilterContext } from '../filters/filter-context.js';
import type { FilterValue, CrossFilterEntry, DashboardFilterDef } from '../types.js';

function makeFilter(id: string, field: string, value: unknown): FilterValue {
  return {
    filterId: id,
    field,
    operator: 'equals',
    value,
    label: `${field}: ${value}`,
  };
}

describe('FilterContext (O.1)', () => {
  describe('createFilterContext', () => {
    it('creates a context with empty initial state', () => {
      const ctx = createFilterContext();
      const state = ctx.getState();
      expect(state.values.size).toBe(0);
      expect(state.activeFilterIds.size).toBe(0);
      expect(state.crossFilters).toEqual([]);
      expect(state.source).toBe('default');
    });
  });

  describe('setFilter', () => {
    it('sets a single filter value', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      const state = ctx.getState();
      expect(state.values.size).toBe(1);
      expect(state.values.get('f1')?.value).toBe('US');
      expect(state.activeFilterIds.has('f1')).toBe(true);
      expect(state.source).toBe('user');
    });

    it('overwrites existing filter with same id', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.setFilter(makeFilter('f1', 'region', 'EU'));
      expect(ctx.getState().values.get('f1')?.value).toBe('EU');
      expect(ctx.getState().values.size).toBe(1);
    });

    it('sets multiple filters independently', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.setFilter(makeFilter('f2', 'status', 'active'));
      expect(ctx.getState().values.size).toBe(2);
      expect(ctx.getState().activeFilterIds.size).toBe(2);
    });

    it('updates lastUpdated timestamp', () => {
      const ctx = createFilterContext();
      const before = Date.now();
      ctx.setFilter(makeFilter('f1', 'x', 1));
      const state = ctx.getState();
      expect(state.lastUpdated).toBeGreaterThanOrEqual(before);
    });
  });

  describe('clearFilter', () => {
    it('removes a specific filter', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.setFilter(makeFilter('f2', 'status', 'active'));
      ctx.clearFilter('f1');
      expect(ctx.getState().values.size).toBe(1);
      expect(ctx.getState().values.has('f1')).toBe(false);
      expect(ctx.getState().activeFilterIds.has('f1')).toBe(false);
    });

    it('does nothing for non-existent filter', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.clearFilter('nonexistent');
      expect(ctx.getState().values.size).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('removes all filters', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.setFilter(makeFilter('f2', 'status', 'active'));
      ctx.clearAll();
      expect(ctx.getState().values.size).toBe(0);
      expect(ctx.getState().activeFilterIds.size).toBe(0);
    });

    it('clears cross-filters too', () => {
      const ctx = createFilterContext();
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: Date.now(),
      });
      ctx.clearAll();
      expect(ctx.getState().crossFilters).toEqual([]);
    });
  });

  describe('applyCrossFilter', () => {
    it('adds a cross-filter entry', () => {
      const ctx = createFilterContext();
      const entry: CrossFilterEntry = {
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: Date.now(),
      };
      ctx.applyCrossFilter(entry);
      expect(ctx.getState().crossFilters).toHaveLength(1);
      expect(ctx.getState().crossFilters[0].sourceWidgetId).toBe('chart-1');
    });

    it('replaces cross-filter from same widget', () => {
      const ctx = createFilterContext();
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: 1,
      });
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'EU',
        timestamp: 2,
      });
      expect(ctx.getState().crossFilters).toHaveLength(1);
      expect(ctx.getState().crossFilters[0].value).toBe('EU');
    });

    it('keeps cross-filters from different widgets', () => {
      const ctx = createFilterContext();
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: 1,
      });
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-2',
        field: 'product',
        value: 'Widget',
        timestamp: 2,
      });
      expect(ctx.getState().crossFilters).toHaveLength(2);
    });
  });

  describe('clearCrossFilter', () => {
    it('removes cross-filter by widget ID', () => {
      const ctx = createFilterContext();
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: 1,
      });
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-2',
        field: 'product',
        value: 'X',
        timestamp: 2,
      });
      ctx.clearCrossFilter('chart-1');
      expect(ctx.getState().crossFilters).toHaveLength(1);
      expect(ctx.getState().crossFilters[0].sourceWidgetId).toBe('chart-2');
    });
  });

  describe('resolveFilters', () => {
    it('returns all active filters when no widgetId', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.setFilter(makeFilter('f2', 'status', 'active'));
      const resolved = ctx.resolveFilters();
      expect(resolved).toHaveLength(2);
    });

    it('includes cross-filters in resolved output', () => {
      const ctx = createFilterContext();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'product',
        value: 'Widget',
        timestamp: Date.now(),
      });
      const resolved = ctx.resolveFilters();
      expect(resolved).toHaveLength(2);
    });

    it('excludes cross-filters originating from the requesting widget', () => {
      const ctx = createFilterContext();
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: Date.now(),
      });
      // chart-1 should not receive its own cross-filter
      const resolved = ctx.resolveFilters('chart-1');
      expect(resolved).toHaveLength(0);

      // chart-2 should receive it
      const resolved2 = ctx.resolveFilters('chart-2');
      expect(resolved2).toHaveLength(1);
    });

    it('merges dashboard-level default filters', () => {
      const defaults: DashboardFilterDef[] = [{
        id: 'df1',
        field: 'year',
        dataSourceId: 'sales',
        label: 'Year',
        filterType: 'select',
        defaultValue: 2025,
        required: false,
        appliesTo: ['*'],
      }];
      const ctx = createFilterContext({ dashboardFilters: defaults });
      const resolved = ctx.resolveFilters();
      // Default filter should be present when no user filter overrides it
      expect(resolved.some(f => f.field === 'year')).toBe(true);
    });

    it('user filter overrides dashboard default for same field', () => {
      const defaults: DashboardFilterDef[] = [{
        id: 'df1',
        field: 'year',
        dataSourceId: 'sales',
        label: 'Year',
        filterType: 'select',
        defaultValue: 2025,
        required: false,
        appliesTo: ['*'],
      }];
      const ctx = createFilterContext({ dashboardFilters: defaults });
      ctx.setFilter(makeFilter('user-year', 'year', 2026));
      const resolved = ctx.resolveFilters();
      const yearFilter = resolved.find(f => f.field === 'year');
      expect(yearFilter?.value).toBe(2026);
    });
  });

  describe('subscribe', () => {
    it('calls subscriber when filter changes', () => {
      const ctx = createFilterContext();
      const listener = vi.fn();
      ctx.subscribe(listener);
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('calls subscriber on clearFilter', () => {
      const ctx = createFilterContext();
      const listener = vi.fn();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.subscribe(listener);
      ctx.clearFilter('f1');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('calls subscriber on clearAll', () => {
      const ctx = createFilterContext();
      const listener = vi.fn();
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      ctx.subscribe(listener);
      ctx.clearAll();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('calls subscriber on cross-filter changes', () => {
      const ctx = createFilterContext();
      const listener = vi.fn();
      ctx.subscribe(listener);
      ctx.applyCrossFilter({
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: Date.now(),
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns unsubscribe function', () => {
      const ctx = createFilterContext();
      const listener = vi.fn();
      const unsub = ctx.subscribe(listener);
      ctx.setFilter(makeFilter('f1', 'region', 'US'));
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
      ctx.setFilter(makeFilter('f2', 'status', 'active'));
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });
  });

  describe('setSource', () => {
    it('changes the filter source', () => {
      const ctx = createFilterContext();
      ctx.setSource('preset');
      ctx.setFilter(makeFilter('f1', 'x', 1));
      expect(ctx.getState().source).toBe('preset');
    });
  });
});
