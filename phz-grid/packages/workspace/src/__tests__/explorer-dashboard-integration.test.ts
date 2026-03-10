/**
 * explorer-dashboard-integration.test.ts — P.6: Explorer ↔ Dashboard integration
 */
import { describe, it, expect } from 'vitest';
import {
  promoteFilterToDashboard,
  buildDrillThroughPrePopulation,
} from '../explore/explorer-dashboard-integration.js';
import type { ExploreFilterSlot } from '../explore-types.js';

describe('promoteFilterToDashboard (P.6)', () => {
  it('converts explore filter to DashboardFilterDef', () => {
    const filter: ExploreFilterSlot = {
      field: 'region',
      operator: 'eq',
      value: 'US',
    };

    const def = promoteFilterToDashboard(filter, 'src-1');
    expect(def.field).toBe('region');
    expect(def.dataSourceId).toBe('src-1');
    expect(def.label).toBe('region');
    expect(def.defaultValue).toBe('US');
    expect(def.required).toBe(false);
    expect(def.appliesTo).toEqual([]);
    expect(def.id).toBeTruthy();
  });

  it('sets filterType based on operator', () => {
    const eqFilter: ExploreFilterSlot = {
      field: 'status',
      operator: 'eq',
      value: 'active',
    };
    expect(promoteFilterToDashboard(eqFilter, 'src-1').filterType).toBe('select');

    const inFilter: ExploreFilterSlot = {
      field: 'region',
      operator: 'in',
      value: ['US', 'EU'],
    };
    expect(promoteFilterToDashboard(inFilter, 'src-1').filterType).toBe('multi-select');

    const betweenFilter: ExploreFilterSlot = {
      field: 'revenue',
      operator: 'between',
      value: [100, 500],
    };
    expect(promoteFilterToDashboard(betweenFilter, 'src-1').filterType).toBe('numeric-range');

    const gtFilter: ExploreFilterSlot = {
      field: 'revenue',
      operator: 'gt',
      value: 100,
    };
    expect(promoteFilterToDashboard(gtFilter, 'src-1').filterType).toBe('numeric-range');
  });

  it('accepts optional appliesTo widget IDs', () => {
    const filter: ExploreFilterSlot = {
      field: 'region',
      operator: 'eq',
      value: 'US',
    };
    const def = promoteFilterToDashboard(filter, 'src-1', ['widget-1', 'widget-2']);
    expect(def.appliesTo).toEqual(['widget-1', 'widget-2']);
  });
});

describe('buildDrillThroughPrePopulation (P.6)', () => {
  it('creates filter values from dimension values for drill-through', () => {
    const dimensionValues = {
      region: 'US',
      year: 2025,
    };

    const filters = buildDrillThroughPrePopulation(dimensionValues);
    expect(filters).toHaveLength(2);
    expect(filters.find(f => f.field === 'region')).toEqual({
      filterId: 'drill_region',
      field: 'region',
      operator: 'equals',
      value: 'US',
      label: 'Drill: region = US',
    });
    expect(filters.find(f => f.field === 'year')).toEqual({
      filterId: 'drill_year',
      field: 'year',
      operator: 'equals',
      value: 2025,
      label: 'Drill: year = 2025',
    });
  });

  it('returns empty array for empty dimension values', () => {
    const filters = buildDrillThroughPrePopulation({});
    expect(filters).toEqual([]);
  });

  it('handles null values with isNull operator', () => {
    const filters = buildDrillThroughPrePopulation({ region: null });
    expect(filters).toHaveLength(1);
    expect(filters[0].operator).toBe('isNull');
    expect(filters[0].value).toBeNull();
  });
});
