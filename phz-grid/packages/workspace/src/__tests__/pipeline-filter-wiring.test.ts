/**
 * Tests for Task 2.2: Dashboard filter bar → FilterContextManager → widget refresh
 *
 * Verifies that DashboardDataPipeline uses FilterContextManager to inject
 * filters into DataAdapter.execute() calls and re-executes on filter changes.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildFilteredPipelineQuery,
  createFilterAwarePipeline,
} from '../coordination/pipeline-filter-wiring.js';
import { createFilterContext } from '@phozart/phz-shared';
import type { DataQuery, DataResult } from '../data-adapter.js';

describe('pipeline-filter-wiring', () => {
  describe('buildFilteredPipelineQuery', () => {
    it('injects resolved filters into a base query', () => {
      const baseQuery: DataQuery = {
        source: 'sales',
        fields: ['region', 'revenue'],
      };

      const filterContext = createFilterContext();
      filterContext.setFilter({
        filterId: 'f1',
        field: 'region',
        operator: 'equals',
        value: 'US',
        label: 'Region: US',
      });

      const result = buildFilteredPipelineQuery(baseQuery, filterContext);

      expect(result.filters).toEqual([
        { field: 'region', operator: 'equals', value: 'US' },
      ]);
      expect(result.source).toBe('sales');
      expect(result.fields).toEqual(['region', 'revenue']);
    });

    it('returns unmodified query when no filters are set', () => {
      const baseQuery: DataQuery = {
        source: 'sales',
        fields: ['revenue'],
      };

      const filterContext = createFilterContext();
      const result = buildFilteredPipelineQuery(baseQuery, filterContext);

      expect(result).toEqual(baseQuery);
    });

    it('resolves filters for specific data source when field mappings exist', () => {
      const baseQuery: DataQuery = {
        source: 'inventory',
        fields: ['stock'],
      };

      const filterContext = createFilterContext({
        fieldMappings: [
          {
            canonicalField: 'region',
            sources: [
              { dataSourceId: 'sales', field: 'sales_region' },
              { dataSourceId: 'inventory', field: 'warehouse_region' },
            ],
          },
        ],
      });

      filterContext.setFilter({
        filterId: 'f1',
        field: 'region',
        operator: 'equals',
        value: 'US',
        label: 'Region: US',
      });

      const result = buildFilteredPipelineQuery(baseQuery, filterContext);

      // Should resolve "region" → "warehouse_region" for the inventory source
      expect(result.filters).toEqual([
        { field: 'warehouse_region', operator: 'equals', value: 'US' },
      ]);
    });
  });

  describe('createFilterAwarePipeline', () => {
    function mockDataAdapter(): { execute: ReturnType<typeof vi.fn> } {
      return {
        execute: vi.fn().mockResolvedValue({
          columns: ['id'],
          rows: [{ id: 1 }],
          totalRows: 1,
        } as DataResult),
      };
    }

    it('injects filters into both preload and full-load queries', async () => {
      const adapter = mockDataAdapter();
      const filterContext = createFilterContext();

      filterContext.setFilter({
        filterId: 'f1',
        field: 'region',
        operator: 'equals',
        value: 'EU',
        label: 'Region: EU',
      });

      const pipeline = createFilterAwarePipeline(
        {
          preload: { query: { source: 'sales', fields: ['region'] }, usePersonalView: false },
          fullLoad: { query: { source: 'sales', fields: ['region', 'revenue'] }, maxRows: 5000, applyCurrentFilters: true },
        },
        adapter as any,
        filterContext,
      );

      await pipeline.start();

      // Both queries should include the region filter
      expect(adapter.execute).toHaveBeenCalledTimes(2);

      const preloadQuery = adapter.execute.mock.calls[0][0] as DataQuery;
      expect(preloadQuery.filters).toEqual([
        { field: 'region', operator: 'equals', value: 'EU' },
      ]);

      const fullQuery = adapter.execute.mock.calls[1][0] as DataQuery;
      expect(fullQuery.filters).toEqual([
        { field: 'region', operator: 'equals', value: 'EU' },
      ]);
    });

    it('re-executes queries when filter context changes', async () => {
      const adapter = mockDataAdapter();
      const filterContext = createFilterContext();

      const pipeline = createFilterAwarePipeline(
        {
          preload: { query: { source: 'sales', fields: ['x'] }, usePersonalView: false },
          fullLoad: { query: { source: 'sales', fields: ['x'] }, maxRows: 100, applyCurrentFilters: true },
        },
        adapter as any,
        filterContext,
      );

      await pipeline.start();
      expect(adapter.execute).toHaveBeenCalledTimes(2);

      // Change filter → should trigger invalidation
      filterContext.setFilter({
        filterId: 'f1',
        field: 'status',
        operator: 'in',
        value: ['active', 'pending'],
        label: 'Status',
      });

      // Give the debounced dispatch time to fire
      await new Promise(r => setTimeout(r, 200));

      // Should have re-executed (2 initial + 2 re-execute = 4)
      expect(adapter.execute).toHaveBeenCalledTimes(4);

      // New queries should include the status filter
      const lastQuery = adapter.execute.mock.calls[3][0] as DataQuery;
      expect(lastQuery.filters).toEqual([
        { field: 'status', operator: 'in', value: ['active', 'pending'] },
      ]);
    });

    it('cleans up filter subscription on destroy', async () => {
      const adapter = mockDataAdapter();
      const filterContext = createFilterContext();

      const pipeline = createFilterAwarePipeline(
        {
          preload: { query: { source: 's', fields: [] }, usePersonalView: false },
          fullLoad: { query: { source: 's', fields: [] }, maxRows: 10, applyCurrentFilters: true },
        },
        adapter as any,
        filterContext,
      );

      await pipeline.start();
      pipeline.destroy();

      // Changing filter after destroy should NOT trigger re-execute
      filterContext.setFilter({
        filterId: 'f1',
        field: 'x',
        operator: 'equals',
        value: 1,
        label: 'x',
      });

      await new Promise(r => setTimeout(r, 200));

      // Only the initial 2 calls
      expect(adapter.execute).toHaveBeenCalledTimes(2);
    });
  });
});
