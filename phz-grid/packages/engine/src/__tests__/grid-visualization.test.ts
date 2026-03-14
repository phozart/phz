import { describe, it, expect } from 'vitest';
import {
  suggestChartFromData,
  gridDataToChart,
  pivotToChart,
  createQuickDashboard,
} from '../grid-visualization.js';
import type { PivotResult } from '../pivot.js';

// --- Test data ---

const salesByRegion = [
  { region: 'North', sales: 100, costs: 80 },
  { region: 'North', sales: 150, costs: 90 },
  { region: 'South', sales: 200, costs: 100 },
  { region: 'South', sales: 250, costs: 120 },
  { region: 'East', sales: 180, costs: 95 },
];

const salesByMonth = [
  { order_date: '2025-01', revenue: 1000 },
  { order_date: '2025-02', revenue: 1500 },
  { order_date: '2025-03', revenue: 2000 },
  { order_date: '2025-04', revenue: 1800 },
  { order_date: '2025-05', revenue: 2200 },
  { order_date: '2025-06', revenue: 2500 },
  { order_date: '2025-07', revenue: 2100 },
  { order_date: '2025-08', revenue: 2800 },
  { order_date: '2025-09', revenue: 2600 },
];

const statusData = [
  { status: 'Active', count: 50 },
  { status: 'Inactive', count: 20 },
  { status: 'Pending', count: 10 },
];

// --- suggestChartFromData ---

describe('suggestChartFromData', () => {
  it('suggests kpi when no dimensions are provided', () => {
    const result = suggestChartFromData(salesByRegion, [], ['sales']);
    expect(result.chartType).toBe('kpi');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.encoding.y).toBe('sales');
  });

  it('suggests line for date-like dimension with 1 measure', () => {
    // With >= 8 distinct values, it should pick line over pie
    const result = suggestChartFromData(salesByMonth, ['order_date'], ['revenue']);
    expect(result.chartType).toBe('line');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.encoding.x).toBe('order_date');
  });

  it('suggests bar for categorical dimension with 1 measure and >= 8 values', () => {
    // Build data with 10 distinct categories to avoid pie
    const data = Array.from({ length: 10 }, (_, i) => ({
      category: `cat-${i}`,
      value: (i + 1) * 10,
    }));
    const result = suggestChartFromData(data, ['category'], ['value']);
    expect(result.chartType).toBe('bar');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('suggests pie for 1 dimension + 1 measure with few distinct values', () => {
    const result = suggestChartFromData(statusData, ['status'], ['count']);
    expect(result.chartType).toBe('pie');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('suggests grouped-bar for 1 categorical dimension + 2 measures', () => {
    // Need >= 8 distinct values to avoid pie path (pie only checks 1-measure case)
    const data = Array.from({ length: 10 }, (_, i) => ({
      region: `region-${i}`,
      sales: (i + 1) * 100,
      costs: (i + 1) * 50,
    }));
    const result = suggestChartFromData(data, ['region'], ['sales', 'costs']);
    expect(result.chartType).toBe('grouped-bar');
  });

  it('suggests multi-line for date dimension + 2 measures', () => {
    const result = suggestChartFromData(salesByMonth, ['order_date'], ['revenue', 'costs']);
    expect(result.chartType).toBe('multi-line');
  });

  it('suggests stacked-bar for 2 dimensions + 1 measure', () => {
    const result = suggestChartFromData(salesByRegion, ['region', 'status'], ['sales']);
    expect(result.chartType).toBe('stacked-bar');
  });

  it('suggests table for 3+ dimensions', () => {
    const result = suggestChartFromData(salesByRegion, ['region', 'status', 'year'], ['sales']);
    expect(result.chartType).toBe('table');
  });

  it('returns a valid SuggestedVisualization shape', () => {
    const result = suggestChartFromData(salesByRegion, ['region'], ['sales']);
    expect(result).toHaveProperty('chartType');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('encoding');
    expect(result).toHaveProperty('reason');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

// --- gridDataToChart ---

describe('gridDataToChart', () => {
  it('produces valid series with correct aggregation', () => {
    const result = gridDataToChart(salesByRegion, {
      dimension: 'region',
      measures: [{ field: 'sales', aggregation: 'sum' }],
      chartType: 'bar', // override: without this, 3 distinct regions triggers pie suggestion
    });

    expect(result.series.length).toBe(1);
    expect(result.series[0].field).toBe('sales');

    // Check aggregated values
    const northPoint = result.series[0].data.find(d => d.x === 'North');
    expect(northPoint?.y).toBe(250); // 100 + 150

    const southPoint = result.series[0].data.find(d => d.x === 'South');
    expect(southPoint?.y).toBe(450); // 200 + 250
  });

  it('supports multiple measures', () => {
    const result = gridDataToChart(salesByRegion, {
      dimension: 'region',
      measures: [
        { field: 'sales', aggregation: 'sum' },
        { field: 'costs', aggregation: 'sum' },
      ],
      chartType: 'grouped-bar',
    });

    expect(result.series.length).toBe(2);
    expect(result.series[0].field).toBe('sales');
    expect(result.series[1].field).toBe('costs');
  });

  it('uses explicit chartType override', () => {
    const result = gridDataToChart(salesByRegion, {
      dimension: 'region',
      measures: [{ field: 'sales', aggregation: 'sum' }],
      chartType: 'line',
    });

    expect(result.chartType).toBe('line');
  });

  it('produces pie slices when chart type is pie', () => {
    const result = gridDataToChart(statusData, {
      dimension: 'status',
      measures: [{ field: 'count', aggregation: 'sum' }],
      chartType: 'pie',
    });

    expect(result.chartType).toBe('pie');
    expect(result.pieSlices).toBeDefined();
    expect(result.pieSlices!.length).toBe(3);

    const totalPct = result.pieSlices!.reduce((sum, s) => sum + s.percentage, 0);
    expect(totalPct).toBeCloseTo(100);
  });

  it('returns empty series for empty data', () => {
    const result = gridDataToChart([], {
      dimension: 'region',
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });

    expect(result.series).toHaveLength(0);
  });

  it('includes a title in the result', () => {
    const result = gridDataToChart(salesByRegion, {
      dimension: 'region',
      measures: [{ field: 'sales', aggregation: 'sum' }],
      chartType: 'bar',
    });

    expect(result.title).toBeDefined();
    expect(result.title).toContain('sales');
    expect(result.title).toContain('region');
  });

  it('uses avg aggregation correctly', () => {
    const result = gridDataToChart(salesByRegion, {
      dimension: 'region',
      measures: [{ field: 'sales', aggregation: 'avg' }],
      chartType: 'bar', // override: without this, 3 distinct regions triggers pie suggestion
    });

    const northPoint = result.series[0].data.find(d => d.x === 'North');
    expect(northPoint?.y).toBe(125); // avg(100, 150)
  });
});

// --- pivotToChart ---

describe('pivotToChart', () => {
  const multiRowPivot: PivotResult = {
    rowHeaders: [['North'], ['South'], ['East']],
    columnHeaders: [['Q1'], ['Q2']],
    cells: [
      [100, 200],
      [150, 250],
      [180, 220],
    ],
    grandTotals: [430, 670],
    rowTotals: [300, 400, 400],
    subtotals: [],
  };

  const singleRowPivot: PivotResult = {
    rowHeaders: [['2025']],
    columnHeaders: [['North'], ['South'], ['East']],
    cells: [[300, 400, 200]],
    grandTotals: [300, 400, 200],
    rowTotals: [900],
    subtotals: [],
  };

  it('converts multi-row pivot to bar chart', () => {
    const result = pivotToChart(multiRowPivot);

    expect(result.chartType).toBe('bar');
    expect(result.series).toHaveLength(2); // Q1 and Q2

    // Verify series labels come from column headers
    expect(result.series[0].label).toBe('Q1');
    expect(result.series[1].label).toBe('Q2');

    // Verify data points use row headers as x-axis
    expect(result.series[0].data[0]).toEqual({ x: 'North', y: 100 });
    expect(result.series[0].data[1]).toEqual({ x: 'South', y: 150 });
    expect(result.series[1].data[2]).toEqual({ x: 'East', y: 220 });
  });

  it('converts single-row pivot to pie chart', () => {
    const result = pivotToChart(singleRowPivot);

    expect(result.chartType).toBe('pie');
    expect(result.pieSlices).toBeDefined();
    expect(result.pieSlices!.length).toBe(3);

    // Sorted by value descending
    expect(result.pieSlices![0].category).toBe('South');
    expect(result.pieSlices![0].value).toBe(400);
  });

  it('returns empty series for empty pivot', () => {
    const emptyPivot: PivotResult = {
      rowHeaders: [],
      columnHeaders: [],
      cells: [],
      grandTotals: [],
      rowTotals: [],
      subtotals: [],
    };

    const result = pivotToChart(emptyPivot);
    expect(result.series).toHaveLength(0);
  });

  it('handles multi-level row headers by joining them', () => {
    const pivot: PivotResult = {
      rowHeaders: [['North', 'US'], ['South', 'MX']],
      columnHeaders: [['Q1']],
      cells: [[100], [200]],
      grandTotals: [300],
      rowTotals: [100, 200],
      subtotals: [],
    };

    const result = pivotToChart(pivot);
    expect(result.series[0].data[0].x).toBe('North / US');
    expect(result.series[0].data[1].x).toBe('South / MX');
  });

  it('treats non-numeric cells as zero', () => {
    const pivot: PivotResult = {
      rowHeaders: [['A'], ['B']],
      columnHeaders: [['X']],
      cells: [['not-a-number'], [null]],
      grandTotals: [0],
      rowTotals: [0, 0],
      subtotals: [],
    };

    const result = pivotToChart(pivot);
    expect(result.series[0].data[0].y).toBe(0);
    expect(result.series[0].data[1].y).toBe(0);
  });
});

// --- createQuickDashboard ---

describe('createQuickDashboard', () => {
  it('creates a valid EnhancedDashboardConfig', () => {
    const config = createQuickDashboard([
      { field: 'region', role: 'dimension' },
      { field: 'sales', role: 'measure', aggregation: 'sum' },
    ]);

    expect(config.version).toBe(2);
    expect(config.name).toBe('Quick Dashboard');
    expect(config.widgets.length).toBeGreaterThan(0);
    expect(config.placements.length).toBe(config.widgets.length);
  });

  it('uses custom name and columns', () => {
    const config = createQuickDashboard(
      [{ field: 'revenue', role: 'measure', aggregation: 'sum' }],
      { name: 'Revenue Dashboard', columns: 4 },
    );

    expect(config.name).toBe('Revenue Dashboard');
    expect(config.layout.columns).toBe(4);
  });

  it('creates KPI widgets for measures with no dimensions', () => {
    const config = createQuickDashboard([
      { field: 'revenue', role: 'measure', aggregation: 'sum' },
      { field: 'costs', role: 'measure', aggregation: 'sum' },
    ]);

    // Should have 2 KPI widgets
    expect(config.widgets.length).toBe(2);
    expect(config.widgets.every(w => w.type === 'kpi-card')).toBe(true);
  });

  it('creates chart widgets for dimension + measure combos', () => {
    const config = createQuickDashboard([
      { field: 'region', role: 'dimension' },
      { field: 'sales', role: 'measure', aggregation: 'sum' },
      { field: 'costs', role: 'measure', aggregation: 'avg' },
    ]);

    // 2 chart widgets (region x sales, region x costs) + 2 KPI widgets
    const chartWidgets = config.widgets.filter(w => w.type === 'bar-chart' || w.type === 'trend-line');
    const kpiWidgets = config.widgets.filter(w => w.type === 'kpi-card');

    expect(chartWidgets.length).toBe(2);
    expect(kpiWidgets.length).toBe(2);
  });

  it('creates trend-line for date-like dimensions', () => {
    const config = createQuickDashboard([
      { field: 'order_date', role: 'dimension' },
      { field: 'revenue', role: 'measure', aggregation: 'sum' },
    ]);

    const chartWidgets = config.widgets.filter(w => w.type === 'trend-line');
    expect(chartWidgets.length).toBe(1);
  });

  it('creates bar-chart for categorical dimensions', () => {
    const config = createQuickDashboard([
      { field: 'region', role: 'dimension' },
      { field: 'revenue', role: 'measure', aggregation: 'sum' },
    ]);

    const chartWidgets = config.widgets.filter(w => w.type === 'bar-chart');
    expect(chartWidgets.length).toBe(1);
  });

  it('assigns valid widget IDs and placement info', () => {
    const config = createQuickDashboard([
      { field: 'region', role: 'dimension' },
      { field: 'sales', role: 'measure', aggregation: 'sum' },
    ]);

    for (const widget of config.widgets) {
      expect(widget.id).toBeTruthy();
      const placement = config.placements.find(p => p.widgetId === widget.id);
      expect(placement).toBeDefined();
      expect(placement!.colSpan).toBeGreaterThanOrEqual(1);
    }
  });

  it('sets chart bindings with correct field keys', () => {
    const config = createQuickDashboard([
      { field: 'region', role: 'dimension' },
      { field: 'sales', role: 'measure', aggregation: 'sum' },
    ]);

    const chartWidget = config.widgets.find(w => w.type === 'bar-chart');
    expect(chartWidget).toBeDefined();

    const bindings = chartWidget!.data.bindings;
    expect(bindings.type).toBe('chart');
    if (bindings.type === 'chart') {
      expect(bindings.category.fieldKey).toBe('region');
      expect(bindings.values[0].fieldKey).toBe('sales');
      expect(bindings.values[0].aggregation).toBe('sum');
    }
  });
});
