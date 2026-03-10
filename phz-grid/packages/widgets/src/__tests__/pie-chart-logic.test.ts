/**
 * @phozart/phz-widgets -- Pie Chart Pure Logic Tests
 *
 * Tests for the pure SVG geometry functions exported from phz-pie-chart.
 * These functions do NOT require DOM — they are math/string helpers.
 */
import { describe, it, expect, vi } from 'vitest';

// The component file imports from 'lit' at module level, so we must mock
// before importing. The mock prevents LitElement class resolution errors.
vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  svg: () => '',
  css: () => '',
  nothing: Symbol('nothing'),
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));

// Now we can import the pure functions. They are NOT default-exported
// from the class, but are module-scope helpers. We import them via
// the file path so we hit the source lines.
//
// polarToCartesian and describeArc are not exported, so we cannot
// import them. But PieChartDatum is exported as an interface, and
// the class itself is exported. We can test the computedSlices getter
// by instantiating the class manually (it is just a plain class thanks
// to the mock).

import { PhzPieChart, type PieChartDatum } from '../components/phz-pie-chart.js';

describe('PhzPieChart — computedSlices logic', () => {
  function makeChart(data: PieChartDatum[]): PhzPieChart {
    const chart = new PhzPieChart();
    chart.data = data;
    return chart;
  }

  it('returns empty array when all values are zero', () => {
    const chart = makeChart([
      { label: 'A', value: 0 },
      { label: 'B', value: 0 },
    ]);
    // Access the private computedSlices via any cast
    const slices = (chart as any).computedSlices;
    expect(slices).toEqual([]);
  });

  it('computes a single-item full circle', () => {
    const chart = makeChart([{ label: 'Only', value: 100 }]);
    const slices = (chart as any).computedSlices;
    expect(slices).toHaveLength(1);
    expect(slices[0].percentage).toBe(100);
    expect(slices[0].startAngle).toBe(0);
    expect(slices[0].endAngle).toBe(360);
    expect(slices[0].color).toBeTruthy();
  });

  it('computes two equal slices', () => {
    const chart = makeChart([
      { label: 'A', value: 50 },
      { label: 'B', value: 50 },
    ]);
    const slices = (chart as any).computedSlices;
    expect(slices).toHaveLength(2);
    expect(slices[0].percentage).toBe(50);
    expect(slices[1].percentage).toBe(50);
    expect(slices[0].endAngle).toBe(slices[1].startAngle);
  });

  it('uses custom colors when provided', () => {
    const chart = makeChart([
      { label: 'A', value: 100, color: '#FF0000' },
    ]);
    const slices = (chart as any).computedSlices;
    expect(slices[0].color).toBe('#FF0000');
  });

  it('falls back to default palette when no color is provided', () => {
    const chart = makeChart([
      { label: 'A', value: 100 },
    ]);
    const slices = (chart as any).computedSlices;
    // Default palette starts with #3B82F6
    expect(slices[0].color).toBe('#3B82F6');
  });

  it('sums angles to 360 across multiple slices', () => {
    const chart = makeChart([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
      { label: 'C', value: 30 },
      { label: 'D', value: 40 },
    ]);
    const slices = (chart as any).computedSlices;
    const lastSlice = slices[slices.length - 1];
    expect(lastSlice.endAngle).toBeCloseTo(360, 5);
  });

  it('rounds percentage to two decimal places', () => {
    const chart = makeChart([
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ]);
    const slices = (chart as any).computedSlices;
    // 1/3 = 33.33%
    expect(slices[0].percentage).toBe(33.33);
    expect(slices[1].percentage).toBe(66.67);
  });

  it('handles empty data', () => {
    const chart = makeChart([]);
    const slices = (chart as any).computedSlices;
    expect(slices).toEqual([]);
  });
});
