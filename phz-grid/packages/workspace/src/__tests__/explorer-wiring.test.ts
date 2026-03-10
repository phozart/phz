/**
 * Tests for Phase 4: Interactive Aggregation (Explorer)
 *
 * Task 4.1: Explorer drop zones → DataQuery → live preview
 * Task 4.2: Aggregation picker on measure fields
 * Task 4.3: Explorer preview with live data
 * Task 4.4: "Save as Report" / "Add to Dashboard" from explorer
 * Task 4.5: Drill-through from dashboard widget → explorer
 */

import { describe, it, expect, vi } from 'vitest';
import {
  exploreQueryToDataQuery,
  fetchExplorerPreview,
  saveExplorerAsReport,
  saveExplorerAsDashboardWidget,
  buildDrillThroughQuery,
} from '../coordination/explorer-wiring.js';
import type { ExploreQuery } from '@phozart/phz-engine';

describe('explorer-wiring', () => {
  const sampleExplore: ExploreQuery = {
    dimensions: [{ field: 'region' }, { field: 'product' }],
    measures: [{ field: 'revenue', aggregation: 'sum' }, { field: 'qty', aggregation: 'count' }],
    filters: [{ field: 'year', operator: 'eq', value: 2026 }],
    sort: [{ field: 'revenue', direction: 'desc' }],
    limit: 10,
  };

  // =====================================================================
  // Task 4.1: Explorer → DataQuery
  // =====================================================================
  describe('exploreQueryToDataQuery', () => {
    it('converts ExploreQuery to DataQuery for DataAdapter', () => {
      const result = exploreQueryToDataQuery(sampleExplore, 'sales-db');

      expect(result.source).toBe('sales-db');
      expect(result.fields).toEqual(['region', 'product', 'revenue', 'qty']);
      expect(result.groupBy).toEqual(['region', 'product']);
      expect(result.aggregations).toEqual([
        { field: 'revenue', function: 'sum' },
        { field: 'qty', function: 'count' },
      ]);
      expect(result.filters).toEqual([
        { field: 'year', operator: 'equals', value: 2026 },
      ]);
      expect(result.sort).toEqual([{ field: 'revenue', direction: 'desc' }]);
      expect(result.limit).toBe(10);
    });

    it('handles empty explore query', () => {
      const result = exploreQueryToDataQuery({
        dimensions: [], measures: [], filters: [],
      }, 'db');

      expect(result.source).toBe('db');
      expect(result.fields).toEqual([]);
      expect(result.groupBy).toBeUndefined();
    });
  });

  // =====================================================================
  // Task 4.3: Explorer preview with live data
  // =====================================================================
  describe('fetchExplorerPreview', () => {
    it('fetches preview data from DataAdapter', async () => {
      const adapter = {
        execute: vi.fn().mockResolvedValue({
          columns: [{ name: 'region', dataType: 'string' }, { name: 'revenue', dataType: 'number' }],
          rows: [['US', 5000]],
          metadata: { totalRows: 1, truncated: false, queryTimeMs: 12 },
        }),
      };

      const result = await fetchExplorerPreview(adapter as any, sampleExplore, 'sales');

      expect(adapter.execute).toHaveBeenCalledTimes(1);
      expect(result.rows).toHaveLength(1);
      expect(result.totalRows).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('returns error on adapter failure', async () => {
      const adapter = {
        execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };

      const result = await fetchExplorerPreview(adapter as any, sampleExplore, 'sales');

      expect(result.error).toBe('Connection lost');
      expect(result.rows).toEqual([]);
    });
  });

  // =====================================================================
  // Task 4.4: Save as Report / Add to Dashboard
  // =====================================================================
  describe('saveExplorerAsReport', () => {
    it('converts explorer query to report and saves via adapter', async () => {
      const adapter = { saveReport: vi.fn().mockResolvedValue(undefined) };

      const result = await saveExplorerAsReport(
        adapter as any, sampleExplore, 'sales', 'Q1 Revenue by Region',
      );

      expect(adapter.saveReport).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Q1 Revenue by Region');
      expect(result.type).toBe('report');
      expect(result.columns).toContain('region');
      expect(result.columns).toContain('revenue');
    });
  });

  describe('saveExplorerAsDashboardWidget', () => {
    it('converts explorer query to dashboard widget', () => {
      const widget = saveExplorerAsDashboardWidget(
        sampleExplore, 'bar-chart', 'dash-1',
      );

      expect(widget.widgetType).toBe('bar-chart');
      expect(widget.dashboardId).toBe('dash-1');
      expect(widget.dataConfig.dimensions).toEqual(['region', 'product']);
      expect(widget.dataConfig.measures).toHaveLength(2);
    });
  });

  // =====================================================================
  // Task 4.5: Drill-through from widget → explorer
  // =====================================================================
  describe('buildDrillThroughQuery', () => {
    it('creates an explorer query from widget context', () => {
      const result = buildDrillThroughQuery({
        sourceWidgetType: 'bar-chart',
        dimension: 'region',
        dimensionValue: 'US',
        measures: ['revenue', 'qty'],
      });

      expect(result.dimensions).toEqual([{ field: 'region' }]);
      expect(result.filters).toEqual([
        { field: 'region', operator: 'eq', value: 'US' },
      ]);
      expect(result.measures).toEqual([
        { field: 'revenue', aggregation: 'sum' },
        { field: 'qty', aggregation: 'sum' },
      ]);
    });

    it('uses default aggregation "sum" for drill-through measures', () => {
      const result = buildDrillThroughQuery({
        sourceWidgetType: 'kpi-card',
        dimension: undefined,
        dimensionValue: undefined,
        measures: ['total_sales'],
      });

      expect(result.dimensions).toEqual([]);
      expect(result.filters).toEqual([]);
      expect(result.measures[0].aggregation).toBe('sum');
    });
  });
});
