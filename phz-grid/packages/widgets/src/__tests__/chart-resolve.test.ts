import { describe, it, expect } from 'vitest';
import { resolveChartData } from '../chart/chart-resolve.js';
import type { ChartSpec } from '@phozart/engine';

function makeSpec(overrides?: Partial<ChartSpec>): ChartSpec {
  return {
    data: {
      values: [
        { month: 'Jan', revenue: 100, cost: 60 },
        { month: 'Feb', revenue: 200, cost: 80 },
        { month: 'Mar', revenue: 150, cost: 70 },
      ],
    },
    series: [{
      type: 'bar',
      x: { field: 'month', type: 'nominal' },
      y: { field: 'revenue', type: 'quantitative' },
    }],
    ...overrides,
  };
}

// ========================================================================
// Single Series
// ========================================================================

describe('Chart Resolve — single series', () => {
  it('resolves a simple bar chart', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);

    expect(resolved.series).toHaveLength(1);
    expect(resolved.series[0].type).toBe('bar');
    expect(resolved.series[0].points).toHaveLength(3);
    expect(resolved.series[0].color).toBeTruthy();
    expect(resolved.series[0].name).toBe('revenue');
  });

  it('extracts correct data point values', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    const points = resolved.series[0].points;

    expect(points[0].x).toBe('Jan');
    expect(points[0].y).toBe(100);
    expect(points[1].x).toBe('Feb');
    expect(points[1].y).toBe(200);
  });

  it('preserves original datum on each point', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    expect(resolved.series[0].points[0].datum).toEqual({
      month: 'Jan', revenue: 100, cost: 60,
    });
  });

  it('computes band x-scale for nominal data', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    expect(resolved.xScale.type).toBe('band');
    expect(resolved.xScale.band?.domain).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('computes y-scale including zero for bar charts', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    expect(resolved.yScale.min).toBeLessThanOrEqual(0);
    expect(resolved.yScale.max).toBeGreaterThanOrEqual(200);
  });

  it('returns axis titles', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    expect(resolved.xTitle).toBe('month');
    expect(resolved.yTitle).toBe('revenue');
  });
});

// ========================================================================
// Multi-Series
// ========================================================================

describe('Chart Resolve — multi-series', () => {
  it('resolves multiple series', () => {
    const spec = makeSpec({
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' } },
        { type: 'line', x: { field: 'month', type: 'nominal' }, y: { field: 'cost', type: 'quantitative' } },
      ],
    });

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.series).toHaveLength(2);
    expect(resolved.series[0].type).toBe('bar');
    expect(resolved.series[1].type).toBe('line');
  });

  it('assigns different colors to each series', () => {
    const spec = makeSpec({
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' } },
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'cost', type: 'quantitative' } },
      ],
    });

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.series[0].color).not.toBe(resolved.series[1].color);
  });

  it('uses custom series color', () => {
    const spec = makeSpec({
      series: [{
        type: 'bar',
        x: { field: 'month', type: 'nominal' },
        y: { field: 'revenue', type: 'quantitative' },
        color: '#FF0000',
      }],
    });

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.series[0].color).toBe('#FF0000');
  });
});

// ========================================================================
// Stacking
// ========================================================================

describe('Chart Resolve — stacking', () => {
  it('computes stacked y values', () => {
    const spec: ChartSpec = {
      data: {
        values: [
          { month: 'Jan', revenue: 100 },
          { month: 'Jan', cost: 60 },
          { month: 'Feb', revenue: 200 },
          { month: 'Feb', cost: 80 },
        ],
      },
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' }, stack: true },
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'cost', type: 'quantitative' }, stack: true },
      ],
    };

    const resolved = resolveChartData(spec, 400, 300);

    // First stacked series should start from 0
    const firstSeries = resolved.series[0];
    expect(firstSeries.points[0].y0).toBe(0); // First series starts from baseline 0

    // Second stacked series should build on top of first
    const secondSeries = resolved.series[1];
    expect(secondSeries.points.length).toBeGreaterThan(0);
  });
});

// ========================================================================
// Color Assignment
// ========================================================================

describe('Chart Resolve — color assignment', () => {
  it('uses palette colors', () => {
    const spec = makeSpec({ appearance: { palette: 'phz-default' } });
    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.colors).toHaveLength(1);
    expect(resolved.colors[0]).toBe('#3B82F6'); // First phz-default color
  });

  it('uses custom colors array', () => {
    const spec = makeSpec({ appearance: { colors: ['#111', '#222', '#333'] } });
    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.colors[0]).toBe('#111');
  });

  it('assigns pattern IDs when patternFill is true', () => {
    const spec = makeSpec({
      series: [{
        type: 'bar',
        x: { field: 'month', type: 'nominal' },
        y: { field: 'revenue', type: 'quantitative' },
        patternFill: true,
      }],
    });

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.series[0].patternId).toBeDefined();
  });
});

// ========================================================================
// Transforms Integration
// ========================================================================

describe('Chart Resolve — transforms', () => {
  it('applies transforms before resolution', () => {
    const spec: ChartSpec = {
      data: {
        values: [
          { month: 'Jan', revenue: 100 },
          { month: 'Feb', revenue: 200 },
          { month: 'Mar', revenue: 150 },
        ],
      },
      transforms: [
        { type: 'sort', field: 'revenue', order: 'desc' },
      ],
      series: [{
        type: 'bar',
        x: { field: 'month', type: 'nominal' },
        y: { field: 'revenue', type: 'quantitative' },
      }],
    };

    const resolved = resolveChartData(spec, 400, 300);
    // Data should be sorted by revenue descending
    expect(resolved.series[0].points[0].y).toBe(200);
    expect(resolved.series[0].points[1].y).toBe(150);
    expect(resolved.series[0].points[2].y).toBe(100);
  });
});

// ========================================================================
// X-Scale Type Inference
// ========================================================================

describe('Chart Resolve — x-scale type inference', () => {
  it('uses band scale for nominal data', () => {
    const resolved = resolveChartData(makeSpec(), 400, 300);
    expect(resolved.xScale.type).toBe('band');
  });

  it('uses linear scale for quantitative data', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      series: [{
        type: 'point',
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      }],
    };

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.xScale.type).toBe('linear');
  });

  it('uses time scale for temporal data', () => {
    const spec: ChartSpec = {
      data: { values: [
        { date: '2025-01-01', y: 10 },
        { date: '2025-02-01', y: 20 },
      ] },
      series: [{
        type: 'line',
        x: { field: 'date', type: 'temporal' },
        y: { field: 'y', type: 'quantitative' },
      }],
    };

    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.xScale.type).toBe('time');
  });
});

// ========================================================================
// Axis Overrides
// ========================================================================

describe('Chart Resolve — axis overrides', () => {
  it('applies custom yAxis label as title', () => {
    const spec = makeSpec({ yAxis: { label: 'Revenue ($)' } });
    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.yTitle).toBe('Revenue ($)');
  });

  it('applies custom xAxis label as title', () => {
    const spec = makeSpec({ xAxis: { label: 'Month' } });
    const resolved = resolveChartData(spec, 400, 300);
    expect(resolved.xTitle).toBe('Month');
  });
});
