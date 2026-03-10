/**
 * @phozart/phz-widgets — Scatter Chart + Heatmap Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  computeNiceScale,
  scalePoint,
  computeBubbleRadius,
  buildAccessibleDescription,
  type ScatterDataPoint,
} from '../components/phz-scatter-chart.js';
import {
  hexToRGB,
  interpolateColor,
  computeHeatmapCells,
  buildHeatmapAccessibleDescription,
  type HeatmapDatum,
} from '../components/phz-heatmap.js';

describe('computeNiceScale', () => {
  it('produces nice tick values', () => {
    const scale = computeNiceScale(0, 100);
    expect(scale.min).toBeLessThanOrEqual(0);
    expect(scale.max).toBeGreaterThanOrEqual(100);
    expect(scale.ticks.length).toBeGreaterThan(0);
    // All ticks should be evenly spaced
    for (let i = 1; i < scale.ticks.length; i++) {
      expect(scale.ticks[i]).toBeGreaterThan(scale.ticks[i - 1]);
    }
  });

  it('handles zero range (min === max)', () => {
    const scale = computeNiceScale(50, 50);
    expect(scale.min).toBeLessThan(50);
    expect(scale.max).toBeGreaterThan(50);
  });

  it('handles negative ranges', () => {
    const scale = computeNiceScale(-100, -10);
    expect(scale.min).toBeLessThanOrEqual(-100);
    expect(scale.max).toBeGreaterThanOrEqual(-10);
  });
});

describe('scalePoint', () => {
  it('scales data point to pixel coordinates', () => {
    const xScale = computeNiceScale(0, 100);
    const yScale = computeNiceScale(0, 100);
    const point: ScatterDataPoint = { x: 50, y: 50 };
    const { px, py } = scalePoint(point, xScale, yScale);
    expect(Number.isFinite(px)).toBe(true);
    expect(Number.isFinite(py)).toBe(true);
    expect(px).toBeGreaterThan(0);
    expect(py).toBeGreaterThan(0);
  });
});

describe('computeBubbleRadius', () => {
  it('returns minR when size is undefined', () => {
    expect(computeBubbleRadius(undefined, [1, 2, 3])).toBe(4);
  });

  it('returns midpoint for uniform sizes', () => {
    expect(computeBubbleRadius(5, [5, 5, 5])).toBe((4 + 24) / 2);
  });

  it('scales between minR and maxR', () => {
    expect(computeBubbleRadius(0, [0, 10])).toBe(4); // min
    expect(computeBubbleRadius(10, [0, 10])).toBe(24); // max
    expect(computeBubbleRadius(5, [0, 10])).toBe(14); // mid
  });

  it('returns minR for empty allSizes', () => {
    expect(computeBubbleRadius(5, [])).toBe(4);
  });
});

describe('buildAccessibleDescription', () => {
  it('describes points with labels', () => {
    const data: ScatterDataPoint[] = [
      { x: 10, y: 20, label: 'Alpha' },
      { x: 30, y: 40, size: 5 },
    ];
    const desc = buildAccessibleDescription(data);
    expect(desc).toContain('Alpha: x=10, y=20');
    expect(desc).toContain('Point 2: x=30, y=40, size 5');
  });
});

// --- Heatmap ---

describe('hexToRGB', () => {
  it('parses hex color with #', () => {
    expect(hexToRGB('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses hex color without #', () => {
    expect(hexToRGB('00FF00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses lowercase hex', () => {
    expect(hexToRGB('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });
});

describe('interpolateColor', () => {
  it('returns start color at 0', () => {
    const color = interpolateColor(0, ['#FFFFFF', '#000000']);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  it('returns end color at 1', () => {
    const color = interpolateColor(1, ['#FFFFFF', '#000000']);
    expect(color).toBe('rgb(0, 0, 0)');
  });

  it('returns midpoint at 0.5', () => {
    const color = interpolateColor(0.5, ['#000000', '#FFFFFF']);
    expect(color).toContain('128');
  });

  it('clamps below 0', () => {
    const color = interpolateColor(-0.5, ['#FFFFFF', '#000000']);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  it('clamps above 1', () => {
    const color = interpolateColor(1.5, ['#FFFFFF', '#000000']);
    expect(color).toBe('rgb(0, 0, 0)');
  });
});

describe('computeHeatmapCells', () => {
  it('computes cells with correct normalization', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 0 },
      { row: 'A', col: 'Y', value: 100 },
      { row: 'B', col: 'X', value: 50 },
    ];
    const result = computeHeatmapCells(data);
    expect(result.rows).toEqual(['A', 'B']);
    expect(result.cols).toEqual(['X', 'Y']);
    expect(result.cells).toHaveLength(3);

    const minCell = result.cells.find(c => c.value === 0);
    expect(minCell?.normalizedValue).toBe(0);
    const maxCell = result.cells.find(c => c.value === 100);
    expect(maxCell?.normalizedValue).toBe(1);
  });

  it('returns empty for empty data', () => {
    const result = computeHeatmapCells([]);
    expect(result.cells).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.cols).toEqual([]);
  });
});

describe('buildHeatmapAccessibleDescription', () => {
  it('builds row-by-row description', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 10 },
      { row: 'A', col: 'Y', value: 20 },
    ];
    const desc = buildHeatmapAccessibleDescription(data, ['A'], ['X', 'Y']);
    expect(desc).toContain('A: X: 10, Y: 20');
  });

  it('shows N/A for missing cells', () => {
    const data: HeatmapDatum[] = [
      { row: 'A', col: 'X', value: 10 },
    ];
    const desc = buildHeatmapAccessibleDescription(data, ['A'], ['X', 'Y']);
    expect(desc).toContain('Y: N/A');
  });
});
