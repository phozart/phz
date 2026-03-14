/**
 * @phozart/widgets — Bar Chart Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  computeStackedSegments,
  computeGroupedBars,
  computeStackedTotal,
  generateLegendItems,
  type MultiSeriesDataPoint,
} from '../components/phz-bar-chart.js';

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

describe('computeStackedSegments', () => {
  it('computes segments with correct offsets', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { sales: 100, support: 50, marketing: 30 },
    };
    const segments = computeStackedSegments(point, ['sales', 'support', 'marketing'], colors);
    expect(segments).toHaveLength(3);

    expect(segments[0].series).toBe('sales');
    expect(segments[0].value).toBe(100);
    expect(segments[0].offset).toBe(0);

    expect(segments[1].series).toBe('support');
    expect(segments[1].value).toBe(50);
    expect(segments[1].offset).toBe(100);

    expect(segments[2].series).toBe('marketing');
    expect(segments[2].value).toBe(30);
    expect(segments[2].offset).toBe(150);
  });

  it('handles missing series values (defaults to 0)', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { sales: 100 },
    };
    const segments = computeStackedSegments(point, ['sales', 'missing'], colors);
    expect(segments[1].value).toBe(0);
    expect(segments[1].offset).toBe(100);
  });

  it('assigns colors cyclically', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { a: 1, b: 2, c: 3, d: 4, e: 5 },
    };
    const segments = computeStackedSegments(point, ['a', 'b', 'c', 'd', 'e'], colors);
    // 5th series wraps to colors[0]
    expect(segments[4].color).toBe(colors[0]);
  });
});

describe('computeGroupedBars', () => {
  it('computes grouped bars with correct indices', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { sales: 100, support: 50 },
    };
    const bars = computeGroupedBars(point, ['sales', 'support'], colors);
    expect(bars).toHaveLength(2);
    expect(bars[0].series).toBe('sales');
    expect(bars[0].value).toBe(100);
    expect(bars[0].index).toBe(0);
    expect(bars[1].index).toBe(1);
  });

  it('defaults missing values to 0', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { sales: 100 },
    };
    const bars = computeGroupedBars(point, ['sales', 'missing'], colors);
    expect(bars[1].value).toBe(0);
  });
});

describe('computeStackedTotal', () => {
  it('sums all values', () => {
    const point: MultiSeriesDataPoint = {
      label: 'Q1',
      values: { a: 10, b: 20, c: 30 },
    };
    expect(computeStackedTotal(point)).toBe(60);
  });

  it('returns 0 for empty values', () => {
    const point: MultiSeriesDataPoint = { label: 'Q1', values: {} };
    expect(computeStackedTotal(point)).toBe(0);
  });
});

describe('generateLegendItems', () => {
  it('generates items with series name and color', () => {
    const items = generateLegendItems(['Sales', 'Marketing'], colors);
    expect(items).toHaveLength(2);
    expect(items[0].series).toBe('Sales');
    expect(items[0].color).toBe(colors[0]);
    expect(items[1].series).toBe('Marketing');
    expect(items[1].color).toBe(colors[1]);
  });

  it('cycles colors for more series than colors', () => {
    const items = generateLegendItems(['A', 'B', 'C', 'D', 'E'], colors);
    expect(items[4].color).toBe(colors[0]); // wraps
  });

  it('handles empty series list', () => {
    expect(generateLegendItems([], colors)).toEqual([]);
  });
});
