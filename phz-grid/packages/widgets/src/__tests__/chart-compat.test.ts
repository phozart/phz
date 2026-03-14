import { describe, it, expect } from 'vitest';
import { convertBarChartPropsToSpec } from '../chart/bar-chart-compat.js';
import { convertLineChartPropsToSpec } from '../chart/line-chart-compat.js';
import type { ChartDataSeries } from '@phozart/engine';
import type { MultiSeriesDataPoint } from '../components/phz-bar-chart.js';
import type { LineChartSeries } from '../components/phz-line-chart.js';

// ========================================================================
// Bar Chart Compat
// ========================================================================

describe('Chart Compat — convertBarChartPropsToSpec', () => {
  it('converts simple bar chart', () => {
    const data: ChartDataSeries = {
      field: 'sales',
      label: 'Sales by Region',
      data: [
        { x: 'West', y: 300 },
        { x: 'East', y: 200 },
        { x: 'North', y: 100 },
      ],
    };

    const spec = convertBarChartPropsToSpec({
      data,
      mode: 'simple',
      rankOrder: 'desc',
      maxBars: 10,
      colors: [],
    });

    expect(spec).not.toBeNull();
    expect(spec!.series).toHaveLength(1);
    expect(spec!.series[0].type).toBe('bar');
    expect(spec!.series[0].bar?.orientation).toBe('horizontal');
    expect(spec!.data.values).toHaveLength(3);
    expect(spec!.title).toBe('Sales by Region');
  });

  it('applies rank order and maxBars', () => {
    const data: ChartDataSeries = {
      field: 'sales',
      label: 'Sales',
      data: Array.from({ length: 20 }, (_, i) => ({ x: `Item${i}`, y: i * 10 })),
    };

    const spec = convertBarChartPropsToSpec({
      data,
      mode: 'simple',
      rankOrder: 'desc',
      maxBars: 5,
      colors: [],
    });

    expect(spec!.data.values).toHaveLength(5);
    // First item should have highest value (desc)
    expect(spec!.data.values[0].y).toBe(190);
  });

  it('converts stacked multi-series bar chart', () => {
    const multiSeriesData: MultiSeriesDataPoint[] = [
      { label: 'Q1', values: { Revenue: 100, Cost: 60 } },
      { label: 'Q2', values: { Revenue: 200, Cost: 80 } },
    ];

    const spec = convertBarChartPropsToSpec({
      multiSeriesData,
      mode: 'stacked',
      seriesNames: ['Revenue', 'Cost'],
      chartTitle: 'Quarterly Performance',
      rankOrder: 'desc',
      maxBars: 10,
      colors: ['#FF0000', '#0000FF'],
    });

    expect(spec).not.toBeNull();
    expect(spec!.series).toHaveLength(2);
    expect(spec!.series[0].name).toBe('Revenue');
    expect(spec!.series[1].name).toBe('Cost');
    expect(spec!.series[0].stack).toBe(true);
    expect(spec!.title).toBe('Quarterly Performance');
    expect(spec!.appearance?.colors).toEqual(['#FF0000', '#0000FF']);
  });

  it('converts grouped multi-series bar chart', () => {
    const multiSeriesData: MultiSeriesDataPoint[] = [
      { label: 'Q1', values: { Revenue: 100, Cost: 60 } },
    ];

    const spec = convertBarChartPropsToSpec({
      multiSeriesData,
      mode: 'grouped',
      rankOrder: 'desc',
      maxBars: 10,
      colors: [],
    });

    expect(spec).not.toBeNull();
    expect(spec!.series).toHaveLength(2);
    expect(spec!.series[0].stack).toBeUndefined();
  });

  it('returns null for empty data', () => {
    const spec = convertBarChartPropsToSpec({
      mode: 'simple',
      rankOrder: 'desc',
      maxBars: 10,
      colors: [],
    });
    expect(spec).toBeNull();
  });

  it('infers series names from data when not provided', () => {
    const multiSeriesData: MultiSeriesDataPoint[] = [
      { label: 'Q1', values: { Alpha: 100, Beta: 200 } },
    ];

    const spec = convertBarChartPropsToSpec({
      multiSeriesData,
      mode: 'stacked',
      rankOrder: 'desc',
      maxBars: 10,
      colors: [],
    });

    expect(spec!.series.map(s => s.name)).toEqual(['Alpha', 'Beta']);
  });
});

// ========================================================================
// Line Chart Compat
// ========================================================================

describe('Chart Compat — convertLineChartPropsToSpec', () => {
  it('converts single-series line chart', () => {
    const data: LineChartSeries[] = [{
      label: 'Revenue',
      points: [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 200 },
        { x: 'Mar', y: 150 },
      ],
    }];

    const spec = convertLineChartPropsToSpec({
      data,
      showGrid: true,
      showAxis: true,
      showLegend: true,
      xAxisType: 'category',
      title: 'Revenue Trend',
    });

    expect(spec).not.toBeNull();
    expect(spec!.series).toHaveLength(1);
    expect(spec!.series[0].type).toBe('line');
    expect(spec!.series[0].name).toBe('Revenue');
    expect(spec!.data.values).toHaveLength(3);
    expect(spec!.title).toBe('Revenue Trend');
  });

  it('converts multi-series line chart', () => {
    const data: LineChartSeries[] = [
      { label: 'Revenue', points: [{ x: 'Jan', y: 100 }, { x: 'Feb', y: 200 }], color: '#FF0000' },
      { label: 'Cost', points: [{ x: 'Jan', y: 60 }, { x: 'Feb', y: 80 }] },
    ];

    const spec = convertLineChartPropsToSpec({
      data,
      showGrid: true,
      showAxis: true,
      showLegend: true,
      xAxisType: 'category',
      title: '',
    });

    expect(spec!.series).toHaveLength(2);
    expect(spec!.series[0].color).toBe('#FF0000');
    // Each row should have both series values
    expect(spec!.data.values[0]).toEqual({ x: 'Jan', Revenue: 100, Cost: 60 });
  });

  it('maps xAxisType to field type', () => {
    const data: LineChartSeries[] = [{
      label: 'Temp',
      points: [{ x: 1, y: 20 }, { x: 2, y: 22 }],
    }];

    const timeSpc = convertLineChartPropsToSpec({
      data, showGrid: true, showAxis: true, showLegend: true, xAxisType: 'time', title: '',
    });
    expect(timeSpc!.series[0].x.type).toBe('temporal');

    const linearSpec = convertLineChartPropsToSpec({
      data, showGrid: true, showAxis: true, showLegend: true, xAxisType: 'linear', title: '',
    });
    expect(linearSpec!.series[0].x.type).toBe('quantitative');

    const catSpec = convertLineChartPropsToSpec({
      data, showGrid: true, showAxis: true, showLegend: true, xAxisType: 'category', title: '',
    });
    expect(catSpec!.series[0].x.type).toBe('nominal');
  });

  it('preserves axis/grid/legend visibility', () => {
    const data: LineChartSeries[] = [{
      label: 'A', points: [{ x: 'X', y: 1 }],
    }];

    const spec = convertLineChartPropsToSpec({
      data, showGrid: false, showAxis: false, showLegend: false, xAxisType: 'category', title: '',
    });

    expect(spec!.xAxis?.show).toBe(false);
    expect(spec!.yAxis?.show).toBe(false);
    expect(spec!.yAxis?.gridLines).toBe(false);
    expect(spec!.legend?.show).toBe(false);
  });

  it('returns null for empty data', () => {
    expect(convertLineChartPropsToSpec({
      data: [], showGrid: true, showAxis: true, showLegend: true, xAxisType: 'category', title: '',
    })).toBeNull();
  });

  it('returns null for data with empty points', () => {
    expect(convertLineChartPropsToSpec({
      data: [{ label: 'A', points: [] }], showGrid: true, showAxis: true, showLegend: true, xAxisType: 'category', title: '',
    })).toBeNull();
  });
});
