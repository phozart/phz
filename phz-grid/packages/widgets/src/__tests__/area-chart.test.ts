import { describe, it, expect } from 'vitest';
import {
  scalePoints,
  buildLinePath,
  buildAreaPath,
  computeStackedData,
  computeYBounds,
} from '../components/phz-area-chart.js';
import type { AreaDataPoint, AreaSeries, ScaledPoint, AreaChartPadding } from '../components/phz-area-chart.js';

describe('Area Chart — Scale & position', () => {
  const padding: AreaChartPadding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 400;
  const height = 200;

  it('scales points to SVG coordinates', () => {
    const data: AreaDataPoint[] = [
      { x: 'Jan', y: 0 },
      { x: 'Feb', y: 50 },
      { x: 'Mar', y: 100 },
    ];
    const points = scalePoints(data, 0, 100, width, height, padding);

    expect(points).toHaveLength(3);
    expect(points[0].sx).toBe(40);
    expect(points[0].sy).toBe(170);
    expect(points[2].sx).toBe(380);
    expect(points[2].sy).toBe(20);
    expect(points[1].sx).toBe(210);
    expect(points[1].sy).toBe(95);
  });

  it('handles single data point', () => {
    const data: AreaDataPoint[] = [{ x: 'Only', y: 50 }];
    const points = scalePoints(data, 0, 100, width, height, padding);
    expect(points).toHaveLength(1);
    expect(points[0].sx).toBe(40);
  });
});

describe('Area Chart — Path generation', () => {
  it('builds line path from scaled points', () => {
    const points: ScaledPoint[] = [
      { sx: 10, sy: 100, x: 'A', y: 0 },
      { sx: 50, sy: 80, x: 'B', y: 20 },
      { sx: 90, sy: 60, x: 'C', y: 40 },
    ];
    const path = buildLinePath(points);
    expect(path).toBe('M10,100 L50,80 L90,60');
  });

  it('builds closed area path with baseline', () => {
    const points: ScaledPoint[] = [
      { sx: 10, sy: 80, x: 'A', y: 20 },
      { sx: 50, sy: 60, x: 'B', y: 40 },
    ];
    const path = buildAreaPath(points, 100);
    expect(path).toBe('M10,80 L50,60 L50,100 L10,100 Z');
  });

  it('returns empty string for empty points', () => {
    expect(buildAreaPath([], 100)).toBe('');
  });
});

describe('Area Chart — Stacking', () => {
  const series: AreaSeries[] = [
    { name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
    { name: 'B', data: [{ x: 1, y: 5 }, { x: 2, y: 15 }] },
    { name: 'C', data: [{ x: 1, y: 3 }, { x: 2, y: 7 }] },
  ];

  it('cumulatively stacks series values', () => {
    const stacked = computeStackedData(series);
    expect(stacked).toHaveLength(3);
    expect(stacked[0].data[0].y).toBe(10);
    expect(stacked[0].data[1].y).toBe(20);
    expect(stacked[1].data[0].y).toBe(15);
    expect(stacked[1].data[1].y).toBe(35);
    expect(stacked[2].data[0].y).toBe(18);
    expect(stacked[2].data[1].y).toBe(42);
  });

  it('handles empty series array', () => {
    expect(computeStackedData([])).toEqual([]);
  });
});

describe('Area Chart — Y bounds', () => {
  it('computes min/max across all series', () => {
    const series: AreaSeries[] = [
      { name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 50 }] },
      { name: 'B', data: [{ x: 1, y: -5 }, { x: 2, y: 30 }] },
    ];
    const bounds = computeYBounds(series);
    expect(bounds.min).toBe(-5);
    expect(bounds.max).toBe(50);
  });

  it('floors min at zero for all-positive data', () => {
    const series: AreaSeries[] = [
      { name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 50 }] },
    ];
    const bounds = computeYBounds(series);
    expect(bounds.min).toBe(0);
  });
});
