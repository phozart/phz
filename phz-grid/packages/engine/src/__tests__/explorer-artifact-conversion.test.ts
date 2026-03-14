/**
 * Tests for explore-to-artifact conversion and explorer-dashboard integration
 * from the workspace explore module.
 *
 * Covers exploreToReport, exploreToDashboardWidget, promoteFilterToDashboard,
 * and buildDrillThroughPrePopulation.
 */
import {
  exploreToReport,
  exploreToDashboardWidget,
  promoteFilterToDashboard,
  buildDrillThroughPrePopulation,
} from '@phozart/workspace/explore';

import type { ExploreQuery } from '@phozart/workspace/explore';

function makeExploreQuery(overrides?: Partial<ExploreQuery>): ExploreQuery {
  return {
    dimensions: [{ field: 'region' }, { field: 'year' }],
    measures: [
      { field: 'revenue', aggregation: 'sum', alias: 'Total Revenue' },
      { field: 'orders', aggregation: 'count' },
    ],
    filters: [
      { field: 'status', operator: 'eq', value: 'active' },
    ],
    sort: [{ field: 'revenue', direction: 'desc' }],
    limit: 1000,
    ...overrides,
  };
}

// ========================================================================
// exploreToReport
// ========================================================================

describe('exploreToReport', () => {
  it('creates a report artifact with correct structure', () => {
    const query = makeExploreQuery();
    const report = exploreToReport(query, 'Sales Report', 'sales_db');

    expect(report.type).toBe('report');
    expect(report.name).toBe('Sales Report');
    expect(report.dataSource).toBe('sales_db');
  });

  it('generates a unique id with report prefix', () => {
    const report = exploreToReport(makeExploreQuery(), 'R1', 'ds');
    expect(report.id).toMatch(/^report_/);
  });

  it('maps dimensions to columns and groupBy', () => {
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    expect(report.columns).toContain('region');
    expect(report.columns).toContain('year');
    expect(report.groupBy).toEqual(['region', 'year']);
  });

  it('includes measure fields in columns', () => {
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    expect(report.columns).toContain('revenue');
    expect(report.columns).toContain('orders');
  });

  it('maps measures to aggregations', () => {
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    expect(report.aggregations).toHaveLength(2);
    expect(report.aggregations[0]).toEqual({ field: 'revenue', function: 'sum', alias: 'Total Revenue' });
    expect(report.aggregations[1]).toEqual({ field: 'orders', function: 'count', alias: undefined });
  });

  it('maps filters', () => {
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    expect(report.filters).toHaveLength(1);
    expect(report.filters[0]).toEqual({ field: 'status', operator: 'eq', value: 'active' });
  });

  it('carries through sort and limit', () => {
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    expect(report.sort).toEqual([{ field: 'revenue', direction: 'desc' }]);
    expect(report.limit).toBe(1000);
  });

  it('sets createdAt timestamp', () => {
    const before = Date.now();
    const report = exploreToReport(makeExploreQuery(), 'R', 'ds');
    const after = Date.now();
    expect(report.createdAt).toBeGreaterThanOrEqual(before);
    expect(report.createdAt).toBeLessThanOrEqual(after);
  });

  it('handles empty dimensions and measures', () => {
    const query: ExploreQuery = {
      dimensions: [],
      measures: [],
      filters: [],
    };
    const report = exploreToReport(query, 'Empty', 'ds');
    expect(report.columns).toEqual([]);
    expect(report.groupBy).toEqual([]);
    expect(report.aggregations).toEqual([]);
  });

  it('handles query without sort and limit', () => {
    const query: ExploreQuery = {
      dimensions: [{ field: 'x' }],
      measures: [{ field: 'y', aggregation: 'count' }],
      filters: [],
    };
    const report = exploreToReport(query, 'R', 'ds');
    expect(report.sort).toBeUndefined();
    expect(report.limit).toBeUndefined();
  });

  it('generates unique IDs across calls', () => {
    const r1 = exploreToReport(makeExploreQuery(), 'R1', 'ds');
    const r2 = exploreToReport(makeExploreQuery(), 'R2', 'ds');
    expect(r1.id).not.toBe(r2.id);
  });
});

// ========================================================================
// exploreToDashboardWidget
// ========================================================================

describe('exploreToDashboardWidget', () => {
  it('creates a widget artifact with correct structure', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    expect(widget.widgetType).toBe('bar');
    expect(widget.id).toMatch(/^widget_/);
  });

  it('maps dimensions to dataConfig.dimensions', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    expect(widget.dataConfig.dimensions).toEqual(['region', 'year']);
  });

  it('maps measures to dataConfig.measures', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    expect(widget.dataConfig.measures).toHaveLength(2);
    expect(widget.dataConfig.measures[0]).toEqual({
      field: 'revenue',
      aggregation: 'sum',
      alias: 'Total Revenue',
    });
  });

  it('maps filters', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'line');
    expect(widget.dataConfig.filters).toHaveLength(1);
    expect(widget.dataConfig.filters[0]).toEqual({
      field: 'status',
      operator: 'eq',
      value: 'active',
    });
  });

  it('sets default position', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    expect(widget.position).toEqual({ row: 0, col: 0, rowSpan: 2, colSpan: 3 });
  });

  it('passes dashboardId when provided', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar', 'dash-1');
    expect(widget.dashboardId).toBe('dash-1');
  });

  it('dashboardId is undefined when not provided', () => {
    const widget = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    expect(widget.dashboardId).toBeUndefined();
  });

  it('generates unique IDs', () => {
    const w1 = exploreToDashboardWidget(makeExploreQuery(), 'bar');
    const w2 = exploreToDashboardWidget(makeExploreQuery(), 'line');
    expect(w1.id).not.toBe(w2.id);
  });
});

// ========================================================================
// promoteFilterToDashboard
// ========================================================================

describe('promoteFilterToDashboard', () => {
  it('creates a DashboardFilterDef from an explore filter', () => {
    const filter = { field: 'region', operator: 'eq' as const, value: 'US' };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.field).toBe('region');
    expect(def.dataSourceId).toBe('ds1');
    expect(def.label).toBe('region');
    expect(def.defaultValue).toBe('US');
    expect(def.required).toBe(false);
    expect(def.appliesTo).toEqual([]);
  });

  it('generates a unique id with promoted prefix', () => {
    const filter = { field: 'x', operator: 'eq' as const, value: 1 };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.id).toMatch(/^promoted_/);
  });

  it('infers multi-select filterType for "in" operator', () => {
    const filter = { field: 'x', operator: 'in' as const, value: ['a', 'b'] };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.filterType).toBe('multi-select');
  });

  it('infers multi-select filterType for "not_in" operator', () => {
    const filter = { field: 'x', operator: 'not_in' as const, value: ['a'] };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.filterType).toBe('multi-select');
  });

  it('infers numeric-range filterType for numeric operators', () => {
    for (const op of ['gt', 'gte', 'lt', 'lte', 'between'] as const) {
      const filter = { field: 'amount', operator: op, value: 100 };
      const def = promoteFilterToDashboard(filter, 'ds1');
      expect(def.filterType).toBe('numeric-range');
    }
  });

  it('infers select filterType for equality operators', () => {
    const filter = { field: 'status', operator: 'eq' as const, value: 'active' };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.filterType).toBe('select');
  });

  it('infers select filterType for contains operator', () => {
    const filter = { field: 'name', operator: 'contains' as const, value: 'test' };
    const def = promoteFilterToDashboard(filter, 'ds1');
    expect(def.filterType).toBe('select');
  });

  it('passes appliesTo array', () => {
    const filter = { field: 'x', operator: 'eq' as const, value: 1 };
    const def = promoteFilterToDashboard(filter, 'ds1', ['w1', 'w2']);
    expect(def.appliesTo).toEqual(['w1', 'w2']);
  });
});

// ========================================================================
// buildDrillThroughPrePopulation
// ========================================================================

describe('buildDrillThroughPrePopulation', () => {
  it('creates equals filters for non-null values', () => {
    const filters = buildDrillThroughPrePopulation({ region: 'US', year: 2026 });
    expect(filters).toHaveLength(2);

    const regionFilter = filters.find(f => f.field === 'region')!;
    expect(regionFilter.operator).toBe('equals');
    expect(regionFilter.value).toBe('US');
    expect(regionFilter.filterId).toBe('drill_region');
    expect(regionFilter.label).toBe('Drill: region = US');

    const yearFilter = filters.find(f => f.field === 'year')!;
    expect(yearFilter.operator).toBe('equals');
    expect(yearFilter.value).toBe(2026);
  });

  it('creates isNull filters for null values', () => {
    const filters = buildDrillThroughPrePopulation({ status: null });
    expect(filters).toHaveLength(1);
    expect(filters[0].operator).toBe('isNull');
    expect(filters[0].value).toBeNull();
    expect(filters[0].label).toBe('Drill: status is null');
  });

  it('creates isNull filters for undefined values', () => {
    const filters = buildDrillThroughPrePopulation({ status: undefined });
    expect(filters).toHaveLength(1);
    expect(filters[0].operator).toBe('isNull');
    expect(filters[0].value).toBeNull();
  });

  it('handles empty dimension values', () => {
    const filters = buildDrillThroughPrePopulation({});
    expect(filters).toEqual([]);
  });

  it('handles mixed null and non-null values', () => {
    const filters = buildDrillThroughPrePopulation({
      region: 'US',
      status: null,
      count: 42,
    });
    expect(filters).toHaveLength(3);
    expect(filters.filter(f => f.operator === 'equals')).toHaveLength(2);
    expect(filters.filter(f => f.operator === 'isNull')).toHaveLength(1);
  });

  it('uses drill_ prefix for filterIds', () => {
    const filters = buildDrillThroughPrePopulation({ x: 1, y: 2 });
    expect(filters.every(f => f.filterId.startsWith('drill_'))).toBe(true);
  });
});
