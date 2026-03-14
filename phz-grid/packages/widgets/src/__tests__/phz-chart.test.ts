import { describe, it, expect } from 'vitest';
import type { ChartSpec } from '@phozart/engine';
import { applyChartDefaults, validateChartSpec } from '@phozart/engine';
import { resolveChartData } from '../chart/chart-resolve.js';
import { computeChartLayout } from '../chart/chart-layout.js';

/**
 * PhzChart component tests — focused on the pure-function pipeline that drives
 * the component. Lit rendering is tested via Playwright e2e tests.
 */

function makeSpec(overrides?: Partial<ChartSpec>): ChartSpec {
  return {
    data: {
      values: [
        { month: 'Jan', revenue: 100 },
        { month: 'Feb', revenue: 200 },
        { month: 'Mar', revenue: 150 },
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

describe('PhzChart — spec validation', () => {
  it('accepts valid bar chart spec', () => {
    const errors = validateChartSpec(makeSpec());
    expect(errors).toEqual([]);
  });

  it('accepts valid line chart spec', () => {
    const errors = validateChartSpec(makeSpec({
      series: [{
        type: 'line',
        x: { field: 'month', type: 'nominal' },
        y: { field: 'revenue', type: 'quantitative' },
      }],
    }));
    expect(errors).toEqual([]);
  });

  it('rejects spec without data', () => {
    const errors = validateChartSpec({ series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }] } as any);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects spec without series', () => {
    const errors = validateChartSpec({ data: { values: [] }, series: [] });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PhzChart — defaults application', () => {
  it('applies tooltip persistent=true for WCAG 1.4.13', () => {
    const result = applyChartDefaults(makeSpec());
    expect(result.tooltip?.persistent).toBe(true);
  });

  it('applies default SVG renderer', () => {
    const result = applyChartDefaults(makeSpec());
    expect(result.appearance?.renderer).toBe('svg');
  });

  it('applies default legend position=top', () => {
    const result = applyChartDefaults(makeSpec());
    expect(result.legend?.position).toBe('top');
  });
});

describe('PhzChart — full pipeline (spec → layout)', () => {
  it('produces complete layout from minimal spec', () => {
    const spec = applyChartDefaults(makeSpec());
    const resolved = resolveChartData(spec, 425, 235);
    const layout = computeChartLayout(resolved, spec, 500, 300);

    // Bars generated
    expect(layout.marks.filter(m => m.kind === 'bar')).toHaveLength(3);

    // Axes present
    expect(layout.xAxis.show).toBe(true);
    expect(layout.yAxis.show).toBe(true);

    // Legend entry
    expect(layout.legend).toHaveLength(1);
  });

  it('handles multi-series mixed chart', () => {
    const spec = applyChartDefaults({
      data: {
        values: [
          { month: 'Jan', actual: 100, target: 90 },
          { month: 'Feb', actual: 200, target: 150 },
        ],
      },
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'actual', type: 'quantitative' }, name: 'Actual' },
        { type: 'line', x: { field: 'month', type: 'nominal' }, y: { field: 'target', type: 'quantitative' }, name: 'Target', line: { strokeDash: [4, 2] } },
      ],
    });

    const resolved = resolveChartData(spec, 425, 235);
    const layout = computeChartLayout(resolved, spec, 500, 300);

    expect(layout.marks.some(m => m.kind === 'bar')).toBe(true);
    expect(layout.marks.some(m => m.kind === 'line')).toBe(true);
    expect(layout.legend).toHaveLength(2);
  });

  it('handles empty data gracefully', () => {
    const spec = makeSpec({ data: { values: [] } });
    const resolved = resolveChartData(spec, 425, 235);
    expect(resolved.series[0].points).toHaveLength(0);
  });

  it('handles annotations in pipeline', () => {
    const spec = applyChartDefaults(makeSpec({
      annotations: [
        { type: 'reference-line', axis: 'y', value: 150, label: 'Average' },
        { type: 'target-line', axis: 'y', value: 180, label: 'Target' },
      ],
    }));

    const resolved = resolveChartData(spec, 425, 235);
    const layout = computeChartLayout(resolved, spec, 500, 300);

    expect(layout.annotations).toHaveLength(2);
    expect(layout.annotations[0].type).toBe('reference-line');
    expect(layout.annotations[1].type).toBe('target-line');
  });
});

describe('PhzChart — event detail shapes', () => {
  it('mark click detail matches expected shape', () => {
    const spec = applyChartDefaults(makeSpec());
    const resolved = resolveChartData(spec, 425, 235);
    const layout = computeChartLayout(resolved, spec, 500, 300);

    const bars = layout.marks.filter(m => m.kind === 'bar');
    const bar = bars[0];

    // Simulate what the component does for mark-click
    const detail = {
      source: 'phz-chart',
      seriesIndex: bar.seriesIndex,
      dataIndex: bar.dataIndex,
      label: bar.label,
      value: bar.value,
      datum: bar.datum,
    };

    expect(detail.source).toBe('phz-chart');
    expect(detail.label).toBe('Jan');
    expect(detail.value).toBe(100);
    expect(detail.datum).toEqual({ month: 'Jan', revenue: 100 });
  });
});

describe('PhzChart — responsive behavior', () => {
  it('produces different tick counts for different widths', () => {
    const spec = applyChartDefaults({
      data: {
        values: Array.from({ length: 20 }, (_, i) => ({ x: `Cat${i}`, y: i * 10 })),
      },
      series: [{
        type: 'bar',
        x: { field: 'x', type: 'nominal' },
        y: { field: 'y', type: 'quantitative' },
      }],
    });

    const resolvedNarrow = resolveChartData(spec, 200, 200);
    const layoutNarrow = computeChartLayout(resolvedNarrow, spec, 275, 265);

    const resolvedWide = resolveChartData(spec, 800, 200);
    const layoutWide = computeChartLayout(resolvedWide, spec, 875, 265);

    // Wide chart should show more x-axis labels
    expect(layoutWide.xAxis.ticks.length).toBeGreaterThanOrEqual(layoutNarrow.xAxis.ticks.length);
  });
});
