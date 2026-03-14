import { describe, it, expect } from 'vitest';
import {
  applyChartDefaults,
  validateChartSpec,
  CHART_SPEC_DEFAULTS,
} from '../chart-spec.js';
import type { ChartSpec } from '../chart-spec.js';

function makeMinimalSpec(overrides?: Partial<ChartSpec>): ChartSpec {
  return {
    data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }] },
    series: [{
      type: 'bar',
      x: { field: 'x', type: 'nominal' },
      y: { field: 'y', type: 'quantitative' },
    }],
    ...overrides,
  };
}

describe('ChartSpec — applyChartDefaults', () => {
  it('applies default xAxis when not specified', () => {
    const spec = makeMinimalSpec();
    const result = applyChartDefaults(spec);
    expect(result.xAxis?.show).toBe(true);
    expect(result.xAxis?.gridLines).toBe(false);
  });

  it('applies default yAxis with gridLines=true', () => {
    const spec = makeMinimalSpec();
    const result = applyChartDefaults(spec);
    expect(result.yAxis?.show).toBe(true);
    expect(result.yAxis?.gridLines).toBe(true);
  });

  it('preserves user-provided axis config', () => {
    const spec = makeMinimalSpec({ xAxis: { show: false, gridLines: true } });
    const result = applyChartDefaults(spec);
    expect(result.xAxis?.show).toBe(false);
    expect(result.xAxis?.gridLines).toBe(true);
  });

  it('applies default legend config', () => {
    const spec = makeMinimalSpec();
    const result = applyChartDefaults(spec);
    expect(result.legend?.show).toBe(true);
    expect(result.legend?.position).toBe('top');
    expect(result.legend?.interactive).toBe(true);
  });

  it('applies default tooltip with WCAG persistent=true', () => {
    const spec = makeMinimalSpec();
    const result = applyChartDefaults(spec);
    expect(result.tooltip?.enabled).toBe(true);
    expect(result.tooltip?.persistent).toBe(true);
    expect(result.tooltip?.mode).toBe('hover');
  });

  it('applies default appearance', () => {
    const spec = makeMinimalSpec();
    const result = applyChartDefaults(spec);
    expect(result.appearance?.palette).toBe('phz-default');
    expect(result.appearance?.renderer).toBe('svg');
    expect(result.appearance?.animated).toBe(true);
  });

  it('preserves user palette override', () => {
    const spec = makeMinimalSpec({ appearance: { palette: 'ocean' } });
    const result = applyChartDefaults(spec);
    expect(result.appearance?.palette).toBe('ocean');
  });

  it('does not mutate the original spec', () => {
    const spec = makeMinimalSpec();
    const original = JSON.parse(JSON.stringify(spec));
    applyChartDefaults(spec);
    expect(spec).toEqual(original);
  });
});

describe('ChartSpec — validateChartSpec', () => {
  it('returns no errors for valid spec', () => {
    const errors = validateChartSpec(makeMinimalSpec());
    expect(errors).toEqual([]);
  });

  it('requires data', () => {
    const errors = validateChartSpec({ series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }] } as any);
    expect(errors).toContain('ChartSpec.data is required');
  });

  it('requires data.values to be array', () => {
    const errors = validateChartSpec({ data: { values: 'not-array' }, series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }] } as any);
    expect(errors).toContain('ChartSpec.data.values must be an array');
  });

  it('requires at least one series', () => {
    const errors = validateChartSpec({ data: { values: [] }, series: [] });
    expect(errors).toContain('ChartSpec.series must contain at least one series');
  });

  it('validates series x.field is required', () => {
    const errors = validateChartSpec({
      data: { values: [] },
      series: [{ type: 'bar', x: { type: 'nominal' } as any, y: { field: 'y', type: 'quantitative' } }],
    });
    expect(errors.some(e => e.includes('x.field is required'))).toBe(true);
  });

  it('validates series y.field is required', () => {
    const errors = validateChartSpec({
      data: { values: [] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { type: 'quantitative' } as any }],
    });
    expect(errors.some(e => e.includes('y.field is required'))).toBe(true);
  });

  it('validates series type', () => {
    const errors = validateChartSpec({
      data: { values: [] },
      series: [{ type: 'bubble' as any, x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    });
    expect(errors.some(e => e.includes('must be bar, line, area, or point'))).toBe(true);
  });

  it('validates all series independently', () => {
    const errors = validateChartSpec({
      data: { values: [] },
      series: [
        { type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } },
        { type: 'invalid' as any, x: { field: 'x', type: 'nominal' }, y: { type: 'quantitative' } as any },
      ],
    });
    expect(errors.length).toBe(2); // invalid type + missing y.field
  });
});

describe('ChartSpec — CHART_SPEC_DEFAULTS', () => {
  it('has all expected keys', () => {
    expect(CHART_SPEC_DEFAULTS.xAxis).toBeDefined();
    expect(CHART_SPEC_DEFAULTS.yAxis).toBeDefined();
    expect(CHART_SPEC_DEFAULTS.legend).toBeDefined();
    expect(CHART_SPEC_DEFAULTS.tooltip).toBeDefined();
    expect(CHART_SPEC_DEFAULTS.appearance).toBeDefined();
  });
});

describe('ChartSpec — type system', () => {
  it('supports multi-series spec', () => {
    const spec: ChartSpec = {
      data: { values: [{ month: 'Jan', revenue: 100, cost: 60 }] },
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' }, stack: true },
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'cost', type: 'quantitative' }, stack: true },
      ],
    };
    expect(validateChartSpec(spec)).toEqual([]);
  });

  it('supports mixed bar+line spec', () => {
    const spec: ChartSpec = {
      data: { values: [{ month: 'Jan', revenue: 100, target: 90 }] },
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' } },
        { type: 'line', x: { field: 'month', type: 'nominal' }, y: { field: 'target', type: 'quantitative' }, line: { curve: 'monotone', strokeDash: [4, 2] } },
      ],
    };
    expect(validateChartSpec(spec)).toEqual([]);
  });

  it('supports annotation specs', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
      annotations: [
        { type: 'reference-line', axis: 'y', value: 50, label: 'Average', dashStyle: 'dashed' },
        { type: 'threshold-band', axis: 'y', min: 0, max: 20, fillColor: 'red', fillOpacity: 0.1 },
        { type: 'target-line', axis: 'y', value: 80, label: 'Target' },
        { type: 'text', x: 'A', y: 15, text: 'Note', anchor: 'start' },
      ],
    };
    expect(validateChartSpec(spec)).toEqual([]);
  });
});
