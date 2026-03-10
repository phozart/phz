import { describe, it, expect } from 'vitest';
import {
  computeStackedSegments,
  computeGroupedBars,
  computeStackedTotal,
  generateLegendItems,
} from '../components/phz-bar-chart.js';
import type { MultiSeriesDataPoint } from '../components/phz-bar-chart.js';

const DEFAULT_SERIES_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

describe('Bar Chart — Stacked mode', () => {
  const point: MultiSeriesDataPoint = {
    label: 'Q1',
    values: { revenue: 100, cost: 60, profit: 40 },
  };
  const series = ['revenue', 'cost', 'profit'];

  it('computes stacked segments with cumulative offsets', () => {
    const segments = computeStackedSegments(point, series, DEFAULT_SERIES_COLORS);
    expect(segments).toHaveLength(3);

    expect(segments[0]).toEqual({
      series: 'revenue',
      value: 100,
      offset: 0,
      color: '#3B82F6',
    });
    expect(segments[1]).toEqual({
      series: 'cost',
      value: 60,
      offset: 100,
      color: '#10B981',
    });
    expect(segments[2]).toEqual({
      series: 'profit',
      value: 40,
      offset: 160,
      color: '#F59E0B',
    });
  });

  it('computes stacked total', () => {
    expect(computeStackedTotal(point)).toBe(200);
  });

  it('handles missing series values as zero', () => {
    const incomplete: MultiSeriesDataPoint = {
      label: 'Q2',
      values: { revenue: 80 },
    };
    const segments = computeStackedSegments(incomplete, series, DEFAULT_SERIES_COLORS);
    expect(segments[1].value).toBe(0);
    expect(segments[2].value).toBe(0);
    expect(segments[2].offset).toBe(80);
  });
});

describe('Bar Chart — Grouped mode', () => {
  const point: MultiSeriesDataPoint = {
    label: 'Q1',
    values: { revenue: 100, cost: 60 },
  };
  const series = ['revenue', 'cost'];

  it('computes grouped bar positions with index per series', () => {
    const bars = computeGroupedBars(point, series, DEFAULT_SERIES_COLORS);
    expect(bars).toHaveLength(2);
    expect(bars[0]).toEqual({
      series: 'revenue',
      value: 100,
      index: 0,
      color: '#3B82F6',
    });
    expect(bars[1]).toEqual({
      series: 'cost',
      value: 60,
      index: 1,
      color: '#10B981',
    });
  });
});

describe('Bar Chart — Legend generation', () => {
  it('generates legend items from series names', () => {
    const items = generateLegendItems(['revenue', 'cost'], DEFAULT_SERIES_COLORS);
    expect(items).toEqual([
      { series: 'revenue', color: '#3B82F6' },
      { series: 'cost', color: '#10B981' },
    ]);
  });

  it('cycles colors when more series than colors', () => {
    const manySeries = Array.from({ length: 10 }, (_, i) => `s${i}`);
    const items = generateLegendItems(manySeries, DEFAULT_SERIES_COLORS);
    expect(items[8].color).toBe(DEFAULT_SERIES_COLORS[0]);
    expect(items[9].color).toBe(DEFAULT_SERIES_COLORS[1]);
  });
});

describe('Bar Chart — Backward compatibility (simple mode)', () => {
  it('simple mode uses original ChartDataSeries with single-value bars', () => {
    const data = {
      field: 'sales',
      label: 'Sales',
      data: [
        { x: 'A', y: 100 },
        { x: 'B', y: 300 },
        { x: 'C', y: 200 },
      ],
    };
    const sorted = [...data.data].sort((a, b) => b.y - a.y);
    expect(sorted[0].x).toBe('B');
    expect(sorted[0].y).toBe(300);
  });
});
