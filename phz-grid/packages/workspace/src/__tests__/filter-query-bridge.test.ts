/**
 * Tests for Task 2.1: Filter-to-Query Bridge
 *
 * Converts FilterValue[] from FilterContextManager into DataQueryFilter[]
 * for DataAdapter.execute(). Handles operator mapping, temporal operators,
 * cross-filters, and multi-source field mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  filterValuesToQueryFilters,
  mapFilterOperator,
  resolveTemporalFilter,
  injectFiltersIntoQuery,
} from '../filters/filter-query-bridge.js';
import type { FilterValue } from '@phozart/shared';

describe('filter-query-bridge', () => {
  describe('mapFilterOperator', () => {
    it('maps identical operators directly', () => {
      expect(mapFilterOperator('equals')).toBe('equals');
      expect(mapFilterOperator('notEquals')).toBe('notEquals');
      expect(mapFilterOperator('contains')).toBe('contains');
      expect(mapFilterOperator('in')).toBe('in');
      expect(mapFilterOperator('between')).toBe('between');
      expect(mapFilterOperator('isNull')).toBe('isNull');
    });

    it('maps "before" to "lessThan"', () => {
      expect(mapFilterOperator('before')).toBe('lessThan');
    });

    it('maps "after" to "greaterThan"', () => {
      expect(mapFilterOperator('after')).toBe('greaterThan');
    });

    it('returns undefined for temporal operators (need special handling)', () => {
      expect(mapFilterOperator('lastN')).toBeUndefined();
      expect(mapFilterOperator('thisperiod')).toBeUndefined();
      expect(mapFilterOperator('previousperiod')).toBeUndefined();
    });
  });

  describe('resolveTemporalFilter', () => {
    it('converts "lastN" to a between filter with date range', () => {
      const now = new Date('2026-03-09T12:00:00Z');
      const result = resolveTemporalFilter('created_at', 'lastN', { n: 7, unit: 'days' }, now);

      expect(result).toBeDefined();
      expect(result!.field).toBe('created_at');
      expect(result!.operator).toBe('between');
      expect(Array.isArray(result!.value)).toBe(true);
      const [start, end] = result!.value as [string, string];
      expect(new Date(start).getTime()).toBeLessThan(now.getTime());
      expect(new Date(end).getTime()).toBe(now.getTime());
    });

    it('converts "thisperiod" with unit "month" to current month range', () => {
      const now = new Date('2026-03-09T12:00:00Z');
      const result = resolveTemporalFilter('date', 'thisperiod', { unit: 'month' }, now);

      expect(result).toBeDefined();
      expect(result!.operator).toBe('between');
      const [start] = result!.value as [string, string];
      // Should start at beginning of March 2026
      expect(new Date(start).getMonth()).toBe(2); // March = 2
      expect(new Date(start).getDate()).toBe(1);
    });

    it('returns undefined for unknown temporal operator', () => {
      const now = new Date();
      const result = resolveTemporalFilter('date', 'equals' as any, {}, now);
      expect(result).toBeUndefined();
    });
  });

  describe('filterValuesToQueryFilters', () => {
    it('converts simple FilterValue[] to DataQueryFilter[]', () => {
      const filters: FilterValue[] = [
        { filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: 'Region: US' },
        { filterId: 'f2', field: 'revenue', operator: 'greaterThan', value: 1000, label: 'Revenue > 1000' },
      ];

      const result = filterValuesToQueryFilters(filters);

      expect(result).toEqual([
        { field: 'region', operator: 'equals', value: 'US' },
        { field: 'revenue', operator: 'greaterThan', value: 1000 },
      ]);
    });

    it('converts "before"/"after" operators', () => {
      const filters: FilterValue[] = [
        { filterId: 'f1', field: 'date', operator: 'before', value: '2026-01-01', label: 'Before 2026' },
      ];

      const result = filterValuesToQueryFilters(filters);

      expect(result).toEqual([
        { field: 'date', operator: 'lessThan', value: '2026-01-01' },
      ]);
    });

    it('handles temporal operators by resolving to date ranges', () => {
      const filters: FilterValue[] = [
        { filterId: 'f1', field: 'created_at', operator: 'lastN', value: { n: 30, unit: 'days' }, label: 'Last 30 days' },
      ];

      const result = filterValuesToQueryFilters(filters);

      expect(result.length).toBe(1);
      expect(result[0].operator).toBe('between');
      expect(result[0].field).toBe('created_at');
    });

    it('skips filters with null/undefined values (except isNull/isNotNull)', () => {
      const filters: FilterValue[] = [
        { filterId: 'f1', field: 'region', operator: 'equals', value: null, label: 'No value' },
        { filterId: 'f2', field: 'name', operator: 'isNull', value: null, label: 'Name is null' },
      ];

      const result = filterValuesToQueryFilters(filters);

      expect(result).toEqual([
        { field: 'name', operator: 'isNull', value: null },
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(filterValuesToQueryFilters([])).toEqual([]);
    });
  });

  describe('injectFiltersIntoQuery', () => {
    it('adds filters to a query that has no existing filters', () => {
      const query = { source: 'sales', fields: ['region', 'revenue'] };
      const filters = [{ field: 'region', operator: 'equals' as const, value: 'US' }];

      const result = injectFiltersIntoQuery(query, filters);

      expect(result.filters).toEqual(filters);
      expect(result.source).toBe('sales');
      expect(result.fields).toEqual(['region', 'revenue']);
    });

    it('merges with existing query filters', () => {
      const query = {
        source: 'sales',
        fields: ['region'],
        filters: [{ field: 'year', operator: 'equals' as const, value: 2026 }],
      };
      const newFilters = [{ field: 'region', operator: 'equals' as const, value: 'US' }];

      const result = injectFiltersIntoQuery(query, newFilters);

      expect(result.filters).toHaveLength(2);
      expect(result.filters![0]).toEqual({ field: 'year', operator: 'equals', value: 2026 });
      expect(result.filters![1]).toEqual({ field: 'region', operator: 'equals', value: 'US' });
    });

    it('does not mutate the original query', () => {
      const query = { source: 'sales', fields: ['x'] };
      const result = injectFiltersIntoQuery(query, [{ field: 'a', operator: 'equals' as const, value: 1 }]);

      expect(query.filters).toBeUndefined();
      expect(result).not.toBe(query);
    });

    it('returns unmodified query when no filters to add', () => {
      const query = { source: 'sales', fields: ['x'] };
      const result = injectFiltersIntoQuery(query, []);

      expect(result).toEqual(query);
    });
  });
});
