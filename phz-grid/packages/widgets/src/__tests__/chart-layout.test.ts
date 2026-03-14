import { describe, it, expect } from 'vitest';
import { computeChartLayout } from '../chart/chart-layout.js';
import { resolveChartData } from '../chart/chart-resolve.js';
import type { ChartSpec } from '@phozart/engine';

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

function resolveAndLayout(spec: ChartSpec, width = 500, height = 300) {
  const resolved = resolveChartData(spec, width - 75, height - 65);
  return computeChartLayout(resolved, spec, width, height);
}

// ========================================================================
// Dimensions
// ========================================================================

describe('Chart Layout — dimensions', () => {
  it('computes chart dimensions with default padding', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.dimensions.width).toBe(500);
    expect(layout.dimensions.height).toBe(300);
    expect(layout.dimensions.padding.top).toBeGreaterThan(0);
    expect(layout.dimensions.padding.bottom).toBeGreaterThan(0);
    expect(layout.dimensions.padding.left).toBeGreaterThan(0);
    expect(layout.dimensions.padding.right).toBeGreaterThan(0);
  });

  it('computes positive plot area', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.dimensions.plotWidth).toBeGreaterThan(0);
    expect(layout.dimensions.plotHeight).toBeGreaterThan(0);
  });
});

// ========================================================================
// Bar Marks
// ========================================================================

describe('Chart Layout — bar marks', () => {
  it('generates bar marks for each data point', () => {
    const layout = resolveAndLayout(makeSpec());
    const bars = layout.marks.filter(m => m.kind === 'bar');
    expect(bars).toHaveLength(3);
  });

  it('bar marks have valid geometry', () => {
    const layout = resolveAndLayout(makeSpec());
    const bars = layout.marks.filter(m => m.kind === 'bar');

    for (const bar of bars) {
      expect(bar.width).toBeGreaterThan(0);
      expect(bar.height).toBeGreaterThan(0);
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('taller bar for larger value', () => {
    const layout = resolveAndLayout(makeSpec());
    const bars = layout.marks.filter(m => m.kind === 'bar');
    const janBar = bars.find(b => b.kind === 'bar' && b.label === 'Jan')!;
    const febBar = bars.find(b => b.kind === 'bar' && b.label === 'Feb')!;
    expect(febBar.height).toBeGreaterThan(janBar.height);
  });

  it('bars carry data context', () => {
    const layout = resolveAndLayout(makeSpec());
    const bars = layout.marks.filter(m => m.kind === 'bar');
    expect(bars[0].label).toBe('Jan');
    expect(bars[0].value).toBe(100);
    expect(bars[0].datum).toEqual({ month: 'Jan', revenue: 100 });
  });
});

// ========================================================================
// Line Marks
// ========================================================================

describe('Chart Layout — line marks', () => {
  it('generates line path and point marks', () => {
    const spec: ChartSpec = {
      data: {
        values: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 15 },
        ],
      },
      series: [{
        type: 'line',
        x: { field: 'x', type: 'nominal' },
        y: { field: 'y', type: 'quantitative' },
      }],
    };

    const layout = resolveAndLayout(spec);
    const lines = layout.marks.filter(m => m.kind === 'line');
    const points = layout.marks.filter(m => m.kind === 'point');

    expect(lines).toHaveLength(1);
    expect(lines[0].path).toContain('M');
    expect(points).toHaveLength(3);
  });

  it('line points carry data context', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }] },
      series: [{ type: 'line', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };

    const layout = resolveAndLayout(spec);
    const points = layout.marks.filter(m => m.kind === 'point');
    expect(points[0].label).toBe('A');
    expect(points[0].value).toBe(10);
  });
});

// ========================================================================
// Area Marks
// ========================================================================

describe('Chart Layout — area marks', () => {
  it('generates area fill + line + points', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }] },
      series: [{ type: 'area', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };

    const layout = resolveAndLayout(spec);
    const areas = layout.marks.filter(m => m.kind === 'area');
    const lines = layout.marks.filter(m => m.kind === 'line');
    const points = layout.marks.filter(m => m.kind === 'point');

    expect(areas).toHaveLength(1);
    expect(areas[0].path).toContain('Z'); // Closed path
    expect(lines).toHaveLength(1);
    expect(points).toHaveLength(2);
  });
});

// ========================================================================
// Point Marks
// ========================================================================

describe('Chart Layout — point marks', () => {
  it('generates point marks for scatter', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      series: [{ type: 'point', x: { field: 'x', type: 'quantitative' }, y: { field: 'y', type: 'quantitative' } }],
    };

    const layout = resolveAndLayout(spec);
    const points = layout.marks.filter(m => m.kind === 'point');
    expect(points).toHaveLength(2);
    expect(points[0].cx).toBeDefined();
    expect(points[0].cy).toBeDefined();
    expect(points[0].r).toBeGreaterThan(0);
  });
});

// ========================================================================
// Axis Layout
// ========================================================================

describe('Chart Layout — axes', () => {
  it('generates x-axis ticks for band scale', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.xAxis.show).toBe(true);
    expect(layout.xAxis.ticks.length).toBeGreaterThanOrEqual(1);
    expect(layout.xAxis.ticks[0].label).toBe('Jan');
  });

  it('generates y-axis ticks', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.yAxis.show).toBe(true);
    expect(layout.yAxis.ticks.length).toBeGreaterThanOrEqual(2);
    expect(layout.yAxis.gridLines).toBe(true);
  });

  it('hides axis when show=false', () => {
    const spec = makeSpec({ xAxis: { show: false }, yAxis: { show: false } });
    const layout = resolveAndLayout(spec);
    expect(layout.xAxis.show).toBe(false);
    expect(layout.yAxis.show).toBe(false);
  });

  it('y-axis ticks have valid positions', () => {
    const layout = resolveAndLayout(makeSpec());
    for (const tick of layout.yAxis.ticks) {
      expect(tick.position).toBeGreaterThanOrEqual(0);
      expect(tick.position).toBeLessThanOrEqual(layout.dimensions.height);
    }
  });
});

// ========================================================================
// Legend
// ========================================================================

describe('Chart Layout — legend', () => {
  it('generates legend entries', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.legend).toHaveLength(1);
    expect(layout.legend[0].name).toBe('revenue');
    expect(layout.legend[0].color).toBeTruthy();
  });

  it('generates entry per series', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', a: 10, b: 20 }] },
      series: [
        { type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'a', type: 'quantitative' } },
        { type: 'line', x: { field: 'x', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
      ],
    };

    const layout = resolveAndLayout(spec);
    expect(layout.legend).toHaveLength(2);
  });
});

// ========================================================================
// Annotations
// ========================================================================

describe('Chart Layout — annotations', () => {
  it('computes reference line position', () => {
    const spec = makeSpec({
      annotations: [{
        type: 'reference-line',
        axis: 'y',
        value: 150,
        label: 'Average',
      }],
    });

    const layout = resolveAndLayout(spec);
    expect(layout.annotations).toHaveLength(1);
    expect(layout.annotations[0].type).toBe('reference-line');
    expect(layout.annotations[0].x1).toBeDefined();
    expect(layout.annotations[0].y1).toBeDefined();
    expect(layout.annotations[0].x2).toBeDefined();
    expect(layout.annotations[0].y2).toBeDefined();
    expect(layout.annotations[0].label).toBe('Average');
  });

  it('computes threshold band', () => {
    const spec = makeSpec({
      annotations: [{
        type: 'threshold-band',
        axis: 'y',
        min: 100,
        max: 200,
        fillColor: 'rgba(255,0,0,0.1)',
      }],
    });

    const layout = resolveAndLayout(spec);
    expect(layout.annotations[0].type).toBe('threshold-band');
    expect(layout.annotations[0].height).toBeGreaterThan(0);
  });

  it('computes target line', () => {
    const spec = makeSpec({
      annotations: [{
        type: 'target-line',
        axis: 'y',
        value: 180,
        label: 'Target',
      }],
    });

    const layout = resolveAndLayout(spec);
    expect(layout.annotations[0].type).toBe('target-line');
    expect(layout.annotations[0].label).toBe('Target');
  });

  it('handles empty annotations', () => {
    const layout = resolveAndLayout(makeSpec());
    expect(layout.annotations).toEqual([]);
  });
});

// ========================================================================
// Mixed Chart Types
// ========================================================================

describe('Chart Layout — mixed types', () => {
  it('renders bar + line together', () => {
    const spec: ChartSpec = {
      data: { values: [
        { month: 'Jan', revenue: 100, target: 90 },
        { month: 'Feb', revenue: 200, target: 150 },
      ] },
      series: [
        { type: 'bar', x: { field: 'month', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' } },
        { type: 'line', x: { field: 'month', type: 'nominal' }, y: { field: 'target', type: 'quantitative' }, line: { strokeDash: [4, 2] } },
      ],
    };

    const layout = resolveAndLayout(spec);
    const bars = layout.marks.filter(m => m.kind === 'bar');
    const lines = layout.marks.filter(m => m.kind === 'line');

    expect(bars.length).toBeGreaterThan(0);
    expect(lines.length).toBeGreaterThan(0);
  });
});
