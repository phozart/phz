/**
 * @phozart/phz-widgets — Area Chart Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  scalePoints,
  buildLinePath,
  buildAreaPath,
  computeStackedData,
  computeYBounds,
  type AreaDataPoint,
  type AreaSeries,
  type AreaChartPadding,
} from '../components/phz-area-chart.js';

const padding: AreaChartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

describe('scalePoints', () => {
  it('scales data points to SVG coordinates', () => {
    const data: AreaDataPoint[] = [
      { x: 'Jan', y: 0 },
      { x: 'Feb', y: 50 },
      { x: 'Mar', y: 100 },
    ];
    const points = scalePoints(data, 0, 100, 400, 200, padding);
    expect(points).toHaveLength(3);

    // First point at left edge
    expect(points[0].sx).toBe(padding.left);
    // Last point at right edge
    expect(points[2].sx).toBe(400 - padding.right);

    // y=0 should be at bottom (padding.top + chartH)
    const chartH = 200 - padding.top - padding.bottom;
    expect(points[0].sy).toBe(padding.top + chartH);

    // y=100 should be at top
    expect(points[2].sy).toBe(padding.top);

    // y=50 should be in middle
    expect(points[1].sy).toBeCloseTo(padding.top + chartH / 2, 1);
  });

  it('handles single data point', () => {
    const data: AreaDataPoint[] = [{ x: 'A', y: 50 }];
    const points = scalePoints(data, 0, 100, 400, 200, padding);
    expect(points).toHaveLength(1);
    expect(points[0].sx).toBe(padding.left);
  });

  it('handles uniform y values (range=0)', () => {
    const data: AreaDataPoint[] = [
      { x: 'A', y: 50 },
      { x: 'B', y: 50 },
    ];
    const points = scalePoints(data, 50, 50, 400, 200, padding);
    // range=0 → uses fallback of 1
    expect(points).toHaveLength(2);
    // Points should not be NaN
    expect(Number.isFinite(points[0].sy)).toBe(true);
  });

  it('preserves original x and y values', () => {
    const data: AreaDataPoint[] = [{ x: 'Jan', y: 42 }];
    const points = scalePoints(data, 0, 100, 400, 200, padding);
    expect(points[0].x).toBe('Jan');
    expect(points[0].y).toBe(42);
  });
});

describe('buildLinePath', () => {
  it('builds SVG path from scaled points', () => {
    const points = [
      { sx: 40, sy: 170, x: 'A', y: 0 },
      { sx: 200, sy: 95, x: 'B', y: 50 },
      { sx: 380, sy: 20, x: 'C', y: 100 },
    ];
    const path = buildLinePath(points);
    expect(path).toContain('M40,170');
    expect(path).toContain('L200,95');
    expect(path).toContain('L380,20');
  });

  it('handles single point', () => {
    const path = buildLinePath([{ sx: 40, sy: 100, x: 'A', y: 50 }]);
    expect(path).toBe('M40,100');
  });

  it('handles empty array', () => {
    const path = buildLinePath([]);
    expect(path).toBe('');
  });
});

describe('buildAreaPath', () => {
  it('builds closed SVG area path', () => {
    const points = [
      { sx: 40, sy: 100, x: 'A', y: 50 },
      { sx: 200, sy: 50, x: 'B', y: 75 },
      { sx: 380, sy: 20, x: 'C', y: 100 },
    ];
    const path = buildAreaPath(points, 170);
    expect(path).toContain('M40,100');
    expect(path).toContain('L380,20');
    expect(path).toContain('L380,170'); // bottom-right
    expect(path).toContain('L40,170'); // bottom-left
    expect(path).toContain('Z'); // close path
  });

  it('returns empty string for empty points', () => {
    expect(buildAreaPath([], 170)).toBe('');
  });
});

describe('computeStackedData', () => {
  it('accumulates y values across series', () => {
    const series: AreaSeries[] = [
      { name: 'A', data: [{ x: 'Jan', y: 10 }, { x: 'Feb', y: 20 }] },
      { name: 'B', data: [{ x: 'Jan', y: 5 }, { x: 'Feb', y: 15 }] },
    ];
    const stacked = computeStackedData(series);
    expect(stacked).toHaveLength(2);
    // First series unchanged
    expect(stacked[0].data[0].y).toBe(10);
    expect(stacked[0].data[1].y).toBe(20);
    // Second series accumulated
    expect(stacked[1].data[0].y).toBe(15); // 10 + 5
    expect(stacked[1].data[1].y).toBe(35); // 20 + 15
  });

  it('handles empty series', () => {
    expect(computeStackedData([])).toEqual([]);
  });

  it('preserves series names and colors', () => {
    const series: AreaSeries[] = [
      { name: 'Revenue', data: [{ x: 'Q1', y: 100 }], color: '#f00' },
    ];
    const stacked = computeStackedData(series);
    expect(stacked[0].name).toBe('Revenue');
    expect(stacked[0].color).toBe('#f00');
  });
});

describe('computeYBounds', () => {
  it('computes min and max across all series', () => {
    const series: AreaSeries[] = [
      { name: 'A', data: [{ x: 'Jan', y: 10 }, { x: 'Feb', y: 50 }] },
      { name: 'B', data: [{ x: 'Jan', y: -5 }, { x: 'Feb', y: 30 }] },
    ];
    const bounds = computeYBounds(series);
    expect(bounds.min).toBe(-5);
    expect(bounds.max).toBe(50);
  });

  it('uses 0 as default min', () => {
    const series: AreaSeries[] = [
      { name: 'A', data: [{ x: 'Jan', y: 10 }, { x: 'Feb', y: 50 }] },
    ];
    const bounds = computeYBounds(series);
    expect(bounds.min).toBe(0);
  });

  it('uses 1 as default max for empty data', () => {
    const bounds = computeYBounds([]);
    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(1);
  });
});
