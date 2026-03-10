/**
 * Tests for Phase 3: Visualizations with Live Data
 *
 * Task 3.1: Widget data subscription to DashboardDataPipeline
 * Task 3.2: Widget resolver calls DataAdapter.execute() with widget's query
 * Task 3.3: KPI/metric uses real DataAdapter data (not synthetic)
 * Task 3.4: Chart auto-refresh on filter/data changes
 * Task 3.5: Loading/error states per widget during data fetch
 * Task 3.6: Empty state rendering when no data matches
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildWidgetQuery,
  fetchWidgetData,
  resolveWidgetLoadingState,
  resolveKPIWithRealData,
  type WidgetLoadingState,
} from '../coordination/widget-data-wiring.js';
import type { DataQuery, DataResult } from '../data-adapter.js';

describe('widget-data-wiring', () => {
  // =====================================================================
  // Task 3.2: Build DataQuery from widget data config
  // =====================================================================
  describe('buildWidgetQuery', () => {
    it('builds a query from widget dimensions and measures', () => {
      const result = buildWidgetQuery({
        dataSourceId: 'sales',
        dimensions: [{ field: 'region' }, { field: 'product' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
      });

      expect(result.source).toBe('sales');
      expect(result.fields).toContain('region');
      expect(result.fields).toContain('product');
      expect(result.fields).toContain('revenue');
      expect(result.groupBy).toEqual(['region', 'product']);
      expect(result.aggregations).toEqual([
        { field: 'revenue', function: 'sum' },
      ]);
    });

    it('handles empty dimensions (KPI-style — measures only)', () => {
      const result = buildWidgetQuery({
        dataSourceId: 'metrics',
        dimensions: [],
        measures: [{ field: 'total_sales', aggregation: 'sum' }],
      });

      expect(result.source).toBe('metrics');
      expect(result.fields).toEqual(['total_sales']);
      expect(result.groupBy).toBeUndefined();
      expect(result.aggregations).toEqual([
        { field: 'total_sales', function: 'sum' },
      ]);
    });

    it('includes widget-level filters when provided', () => {
      const result = buildWidgetQuery({
        dataSourceId: 'sales',
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
        filters: [{ field: 'year', operator: 'equals', value: 2026 }],
      });

      expect(result.filters).toEqual([
        { field: 'year', operator: 'equals', value: 2026 },
      ]);
    });
  });

  // =====================================================================
  // Task 3.1 + 3.2: Fetch widget data via DataAdapter
  // =====================================================================
  describe('fetchWidgetData', () => {
    it('calls DataAdapter.execute() with the built query', async () => {
      const mockResult: DataResult = {
        columns: [{ name: 'region', dataType: 'string' }, { name: 'revenue', dataType: 'number' }],
        rows: [['US', 1000]],
        metadata: { totalRows: 1, truncated: false, queryTimeMs: 5 },
      };

      const adapter = { execute: vi.fn().mockResolvedValue(mockResult) };

      const result = await fetchWidgetData(adapter as any, {
        dataSourceId: 'sales',
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
      });

      expect(adapter.execute).toHaveBeenCalledTimes(1);
      expect(result.rows).toEqual([['US', 1000]]);
      expect(result.totalRows).toBe(1);
    });

    it('returns error result on adapter failure', async () => {
      const adapter = { execute: vi.fn().mockRejectedValue(new Error('DB timeout')) };

      const result = await fetchWidgetData(adapter as any, {
        dataSourceId: 'sales',
        dimensions: [],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
      });

      expect(result.error).toBe('DB timeout');
      expect(result.rows).toEqual([]);
    });
  });

  // =====================================================================
  // Task 3.5: Loading/error/empty states
  // =====================================================================
  describe('resolveWidgetLoadingState', () => {
    it('returns "loading" when fetch is in progress', () => {
      const state = resolveWidgetLoadingState({ loading: true });
      expect(state.status).toBe('loading');
    });

    it('returns "error" when there is an error', () => {
      const state = resolveWidgetLoadingState({ loading: false, error: 'Failed' });
      expect(state.status).toBe('error');
      expect(state.errorMessage).toBe('Failed');
    });

    it('returns "empty" when data has 0 rows', () => {
      const state = resolveWidgetLoadingState({
        loading: false,
        data: { columns: [], rows: [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 } },
      });
      expect(state.status).toBe('empty');
    });

    it('returns "ready" when data has rows', () => {
      const state = resolveWidgetLoadingState({
        loading: false,
        data: {
          columns: [{ name: 'x', dataType: 'number' }],
          rows: [[1]],
          metadata: { totalRows: 1, truncated: false, queryTimeMs: 1 },
        },
      });
      expect(state.status).toBe('ready');
    });
  });

  // =====================================================================
  // Task 3.3: KPI with real data (not synthetic)
  // =====================================================================
  describe('resolveKPIWithRealData', () => {
    it('computes KPI value from DataAdapter result', () => {
      const kpiResult = resolveKPIWithRealData(
        { currentValue: 150000, previousValue: 120000, target: 200000, unit: 'currency' },
      );

      expect(kpiResult.value).toBe(150000);
      expect(kpiResult.previousValue).toBe(120000);
      expect(kpiResult.target).toBe(200000);
      // Delta = (150000 - 120000) / 120000 = 0.25 (25%)
      expect(kpiResult.deltaPercent).toBeCloseTo(0.25, 2);
      expect(kpiResult.deltaDirection).toBe('up');
    });

    it('handles missing previous value gracefully', () => {
      const kpiResult = resolveKPIWithRealData(
        { currentValue: 100, previousValue: undefined, target: 200, unit: 'number' },
      );

      expect(kpiResult.value).toBe(100);
      expect(kpiResult.previousValue).toBeUndefined();
      expect(kpiResult.deltaPercent).toBeUndefined();
      expect(kpiResult.deltaDirection).toBeUndefined();
    });

    it('detects downward trend', () => {
      const kpiResult = resolveKPIWithRealData(
        { currentValue: 80, previousValue: 100, target: 150, unit: 'number' },
      );

      expect(kpiResult.deltaDirection).toBe('down');
      expect(kpiResult.deltaPercent).toBeCloseTo(-0.2, 2);
    });

    it('detects flat trend when values are equal', () => {
      const kpiResult = resolveKPIWithRealData(
        { currentValue: 100, previousValue: 100, target: 100, unit: 'number' },
      );

      expect(kpiResult.deltaDirection).toBe('flat');
      expect(kpiResult.deltaPercent).toBe(0);
    });
  });
});
