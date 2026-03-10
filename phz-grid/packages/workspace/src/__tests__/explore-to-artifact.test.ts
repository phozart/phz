/**
 * explore-to-artifact.test.ts — P.4: Convert ExploreQuery to Report/Dashboard artifacts
 */
import { describe, it, expect } from 'vitest';
import {
  exploreToReport,
  exploreToDashboardWidget,
} from '../explore/explore-to-artifact.js';
import type { ExploreQuery } from '../explore-types.js';

function makeExplore(overrides: Partial<ExploreQuery> = {}): ExploreQuery {
  return {
    dimensions: [],
    measures: [],
    filters: [],
    ...overrides,
  };
}

describe('exploreToReport (P.4)', () => {
  it('creates a ReportArtifact with name and source', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });

    const report = exploreToReport(explore, 'Sales by Region', 'orders');
    expect(report.name).toBe('Sales by Region');
    expect(report.dataSource).toBe('orders');
    expect(report.type).toBe('report');
  });

  it('maps dimensions to groupBy columns', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'region' }, { field: 'year' }],
      measures: [{ field: 'revenue', aggregation: 'sum' }],
    });

    const report = exploreToReport(explore, 'Revenue', 'sales');
    expect(report.groupBy).toEqual(['region', 'year']);
  });

  it('maps measures to aggregation specs', () => {
    const explore = makeExplore({
      measures: [
        { field: 'revenue', aggregation: 'sum', alias: 'Total Revenue' },
        { field: 'orders', aggregation: 'count' },
      ],
    });

    const report = exploreToReport(explore, 'KPI', 'data');
    expect(report.aggregations).toHaveLength(2);
    expect(report.aggregations[0]).toEqual({
      field: 'revenue',
      function: 'sum',
      alias: 'Total Revenue',
    });
    expect(report.aggregations[1]).toEqual({
      field: 'orders',
      function: 'count',
      alias: undefined,
    });
  });

  it('maps filters to report filters', () => {
    const explore = makeExplore({
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    });

    const report = exploreToReport(explore, 'Active', 'data');
    expect(report.filters).toHaveLength(1);
    expect(report.filters[0]).toEqual({
      field: 'status',
      operator: 'eq',
      value: 'active',
    });
  });

  it('preserves sort and limit', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'name' }],
      measures: [{ field: 'score', aggregation: 'avg' }],
      sort: [{ field: 'score', direction: 'desc' }],
      limit: 10,
    });

    const report = exploreToReport(explore, 'Top 10', 'data');
    expect(report.sort).toEqual([{ field: 'score', direction: 'desc' }]);
    expect(report.limit).toBe(10);
  });

  it('generates a unique id', () => {
    const explore = makeExplore();
    const r1 = exploreToReport(explore, 'A', 'src');
    const r2 = exploreToReport(explore, 'B', 'src');
    expect(r1.id).toBeTruthy();
    expect(r2.id).toBeTruthy();
    expect(r1.id).not.toBe(r2.id);
  });

  it('includes all dimension and measure fields in columns', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });

    const report = exploreToReport(explore, 'R', 'src');
    expect(report.columns).toEqual(['region', 'sales']);
  });
});

describe('exploreToDashboardWidget (P.4)', () => {
  it('creates a widget config with widgetType', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });

    const widget = exploreToDashboardWidget(explore, 'bar-chart');
    expect(widget.widgetType).toBe('bar-chart');
    expect(widget.id).toBeTruthy();
  });

  it('maps dimensions and measures to widget data config', () => {
    const explore = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'revenue', aggregation: 'sum' }],
    });

    const widget = exploreToDashboardWidget(explore, 'bar-chart');
    expect(widget.dataConfig.dimensions).toEqual(['region']);
    expect(widget.dataConfig.measures).toEqual([
      { field: 'revenue', aggregation: 'sum', alias: undefined },
    ]);
  });

  it('includes filters in widget data config', () => {
    const explore = makeExplore({
      filters: [{ field: 'year', operator: 'eq', value: 2025 }],
    });

    const widget = exploreToDashboardWidget(explore, 'kpi-card');
    expect(widget.dataConfig.filters).toHaveLength(1);
  });

  it('accepts optional dashboardId', () => {
    const explore = makeExplore();
    const widget = exploreToDashboardWidget(explore, 'line-chart', 'dash-1');
    expect(widget.dashboardId).toBe('dash-1');
  });

  it('sets default position', () => {
    const explore = makeExplore();
    const widget = exploreToDashboardWidget(explore, 'pie-chart');
    expect(widget.position).toEqual({ row: 0, col: 0, rowSpan: 2, colSpan: 3 });
  });
});
