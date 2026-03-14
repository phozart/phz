/**
 * @phozart/widgets -- Line Chart Pure Logic Tests
 *
 * Tests for the pure functions used by PhzLineChart.
 * The component module exports interfaces and has module-scope helpers.
 * We mock Lit to bypass DOM requirements, then test the class's logic.
 */
import { describe, it, expect, vi } from 'vitest';

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

import { PhzLineChart, type LineChartSeries, type LineChartPoint } from '../components/phz-line-chart.js';

function makeChart(data: LineChartSeries[]): PhzLineChart {
  const chart = new PhzLineChart();
  chart.data = data;
  return chart;
}

const SERIES_A: LineChartSeries = {
  label: 'Revenue',
  points: [
    { x: 'Jan', y: 100 },
    { x: 'Feb', y: 200 },
    { x: 'Mar', y: 150 },
  ],
};

const SERIES_B: LineChartSeries = {
  label: 'Expenses',
  points: [
    { x: 'Jan', y: 80 },
    { x: 'Feb', y: 120 },
    { x: 'Mar', y: 90 },
  ],
};

describe('PhzLineChart — visibleSeries', () => {
  it('returns all series when none are hidden', () => {
    const chart = makeChart([SERIES_A, SERIES_B]);
    const visible = (chart as any).visibleSeries;
    expect(visible).toHaveLength(2);
  });

  it('excludes hidden series', () => {
    const chart = makeChart([SERIES_A, SERIES_B]);
    (chart as any).hiddenSeries = new Set(['Revenue']);
    const visible = (chart as any).visibleSeries;
    expect(visible).toHaveLength(1);
    expect(visible[0].label).toBe('Expenses');
  });
});

describe('PhzLineChart — yScale', () => {
  it('produces nice scale from data values', () => {
    const chart = makeChart([SERIES_A]);
    const scale = (chart as any).yScale;
    expect(scale.min).toBeLessThanOrEqual(100);
    expect(scale.max).toBeGreaterThanOrEqual(200);
    expect(scale.ticks.length).toBeGreaterThan(0);
    for (let i = 1; i < scale.ticks.length; i++) {
      expect(scale.ticks[i]).toBeGreaterThan(scale.ticks[i - 1]);
    }
  });

  it('returns default scale for empty data', () => {
    const chart = makeChart([]);
    const scale = (chart as any).yScale;
    expect(scale.min).toBe(0);
    expect(scale.max).toBe(1);
  });

  it('considers only visible series', () => {
    const chart = makeChart([SERIES_A, {
      label: 'Outlier',
      points: [{ x: 'Jan', y: 10000 }],
    }]);
    (chart as any).hiddenSeries = new Set(['Outlier']);
    const scale = (chart as any).yScale;
    // Without outlier, max should be <=300 or so
    expect(scale.max).toBeLessThan(1000);
  });
});

describe('PhzLineChart — seriesColor', () => {
  it('uses the series custom color when provided', () => {
    const chart = makeChart([{ ...SERIES_A, color: '#FF0000' }]);
    const color = (chart as any).seriesColor(0);
    expect(color).toBe('#FF0000');
  });

  it('falls back to palette color when no custom color', () => {
    const chart = makeChart([SERIES_A]);
    const color = (chart as any).seriesColor(0);
    expect(color).toBe('#3B82F6'); // LINE_PALETTE[0]
  });

  it('wraps around palette for many series', () => {
    const chart = makeChart([SERIES_A]);
    const color0 = (chart as any).seriesColor(0);
    const color10 = (chart as any).seriesColor(10);
    // Palette length is 10, so index 10 wraps to 0
    expect(color10).toBe(color0);
  });
});

describe('PhzLineChart — toggleSeries', () => {
  it('adds a series to hidden set', () => {
    const chart = makeChart([SERIES_A, SERIES_B]);
    (chart as any).hiddenSeries = new Set<string>();
    (chart as any).toggleSeries('Revenue');
    expect((chart as any).hiddenSeries.has('Revenue')).toBe(true);
  });

  it('removes a series from hidden set if already hidden', () => {
    const chart = makeChart([SERIES_A, SERIES_B]);
    (chart as any).hiddenSeries = new Set(['Revenue']);
    (chart as any).toggleSeries('Revenue');
    expect((chart as any).hiddenSeries.has('Revenue')).toBe(false);
  });
});

describe('PhzLineChart — buildAccessibleTable', () => {
  it('generates a text summary of all series', () => {
    const chart = makeChart([SERIES_A]);
    const summary = (chart as any).buildAccessibleTable();
    expect(summary).toContain('Revenue');
    expect(summary).toContain('Jan=100');
    expect(summary).toContain('Feb=200');
    expect(summary).toContain('Mar=150');
  });

  it('includes multiple series separated by periods', () => {
    const chart = makeChart([SERIES_A, SERIES_B]);
    const summary = (chart as any).buildAccessibleTable();
    expect(summary).toContain('Revenue');
    expect(summary).toContain('Expenses');
    expect(summary).toContain('. ');
  });
});
