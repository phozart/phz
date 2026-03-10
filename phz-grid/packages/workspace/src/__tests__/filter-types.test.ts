import { describe, it, expect } from 'vitest';
import type {
  FilterOperator,
  FilterValue,
  CrossFilterEntry,
  FilterContextState,
  FilterUIType,
  DashboardFilterDef,
  FilterDependency,
  DashboardFilterBarConfig,
} from '../types.js';

describe('Filter types', () => {
  describe('FilterOperator', () => {
    it('covers all operator values', () => {
      const operators: FilterOperator[] = [
        'equals', 'notEquals', 'contains', 'notContains',
        'startsWith', 'endsWith',
        'greaterThan', 'greaterThanOrEqual',
        'lessThan', 'lessThanOrEqual',
        'between', 'notBetween',
        'in', 'notIn',
        'isNull', 'isNotNull',
        'before', 'after',
        'lastN', 'thisperiod', 'previousperiod',
      ];
      expect(operators).toHaveLength(21);
    });
  });

  describe('FilterValue', () => {
    it('creates a string equality filter', () => {
      const fv: FilterValue = {
        filterId: 'f1',
        field: 'status',
        operator: 'equals',
        value: 'active',
        label: 'Status: active',
      };
      expect(fv.operator).toBe('equals');
      expect(fv.value).toBe('active');
    });

    it('creates a between filter', () => {
      const fv: FilterValue = {
        filterId: 'f2',
        field: 'amount',
        operator: 'between',
        value: [100, 500],
        label: 'Amount 100-500',
      };
      expect(fv.operator).toBe('between');
      expect(fv.value).toEqual([100, 500]);
    });

    it('creates an "in" filter with multiple values', () => {
      const fv: FilterValue = {
        filterId: 'f3',
        field: 'region',
        operator: 'in',
        value: ['US', 'EU', 'APAC'],
        label: 'Region: US, EU, APAC',
      };
      expect(fv.operator).toBe('in');
    });

    it('creates a null-check filter', () => {
      const fv: FilterValue = {
        filterId: 'f4',
        field: 'email',
        operator: 'isNull',
        value: null,
        label: 'Email is empty',
      };
      expect(fv.operator).toBe('isNull');
    });

    it('creates a date filter', () => {
      const fv: FilterValue = {
        filterId: 'f5',
        field: 'created_at',
        operator: 'after',
        value: '2025-01-01',
        label: 'After Jan 2025',
      };
      expect(fv.operator).toBe('after');
    });
  });

  describe('CrossFilterEntry', () => {
    it('creates a cross-filter entry', () => {
      const entry: CrossFilterEntry = {
        sourceWidgetId: 'chart-1',
        field: 'region',
        value: 'US',
        timestamp: Date.now(),
      };
      expect(entry.sourceWidgetId).toBe('chart-1');
      expect(entry.field).toBe('region');
    });
  });

  describe('FilterContextState', () => {
    it('creates a filter context with maps', () => {
      const state: FilterContextState = {
        values: new Map([
          ['f1', {
            filterId: 'f1',
            field: 'status',
            operator: 'equals',
            value: 'active',
            label: 'Status: active',
          }],
        ]),
        activeFilterIds: new Set(['f1']),
        crossFilters: [],
        lastUpdated: Date.now(),
        source: 'user',
      };
      expect(state.values.size).toBe(1);
      expect(state.activeFilterIds.has('f1')).toBe(true);
      expect(state.source).toBe('user');
    });

    it('supports all source types', () => {
      const sources: FilterContextState['source'][] = ['user', 'preset', 'url', 'default'];
      expect(sources).toHaveLength(4);
    });
  });

  describe('FilterUIType', () => {
    it('covers all UI types', () => {
      const types: FilterUIType[] = [
        'select', 'multi-select', 'chip-select', 'tree-select',
        'date-range', 'date-preset', 'numeric-range',
        'search', 'boolean-toggle', 'field-presence',
      ];
      expect(types).toHaveLength(10);
    });
  });

  describe('DashboardFilterDef', () => {
    it('creates a required filter definition', () => {
      const def: DashboardFilterDef = {
        id: 'filter-region',
        field: 'region',
        dataSourceId: 'sales',
        label: 'Region',
        filterType: 'multi-select',
        required: true,
        appliesTo: ['chart-1', 'table-1'],
      };
      expect(def.required).toBe(true);
      expect(def.appliesTo).toHaveLength(2);
    });

    it('creates a filter with default value', () => {
      const def: DashboardFilterDef = {
        id: 'filter-year',
        field: 'year',
        dataSourceId: 'sales',
        label: 'Year',
        filterType: 'select',
        defaultValue: 2025,
        required: false,
        appliesTo: ['*'],
      };
      expect(def.defaultValue).toBe(2025);
    });
  });

  describe('FilterDependency', () => {
    it('creates a data-driven dependency', () => {
      const dep: FilterDependency = {
        parentFilterId: 'country',
        childFilterId: 'city',
        constraintType: 'data-driven',
      };
      expect(dep.constraintType).toBe('data-driven');
    });

    it('creates an explicit-mapping dependency', () => {
      const dep: FilterDependency = {
        parentFilterId: 'dept',
        childFilterId: 'team',
        constraintType: 'explicit-mapping',
      };
      expect(dep.constraintType).toBe('explicit-mapping');
    });
  });

  describe('DashboardFilterBarConfig', () => {
    it('creates a complete filter bar config', () => {
      const config: DashboardFilterBarConfig = {
        filters: [
          {
            id: 'f1',
            field: 'region',
            dataSourceId: 'sales',
            label: 'Region',
            filterType: 'chip-select',
            required: false,
            appliesTo: ['*'],
          },
        ],
        position: 'top',
        collapsible: true,
        defaultCollapsed: false,
        showActiveFilterCount: true,
        showPresetPicker: true,
        defaultPresetId: 'preset-q4',
        dependencies: [
          {
            parentFilterId: 'country',
            childFilterId: 'city',
            constraintType: 'data-driven',
          },
        ],
      };
      expect(config.filters).toHaveLength(1);
      expect(config.position).toBe('top');
      expect(config.showPresetPicker).toBe(true);
      expect(config.dependencies).toHaveLength(1);
    });

    it('supports left position', () => {
      const config: DashboardFilterBarConfig = {
        filters: [],
        position: 'left',
        collapsible: false,
        defaultCollapsed: false,
        showActiveFilterCount: false,
        showPresetPicker: false,
        dependencies: [],
      };
      expect(config.position).toBe('left');
    });
  });
});
