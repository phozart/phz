import { describe, it, expect } from 'vitest';
import { resolveChartData } from '../chart/chart-resolve.js';
import { computeChartLayout } from '../chart/chart-layout.js';
import { getPatternFill, CHART_PATTERNS } from '../chart/chart-patterns.js';
import type { ChartSpec } from '@phozart/engine';

/**
 * SVG Renderer tests — focused on the pure-function outputs since we can't
 * render Lit templates in a Node environment. We verify the data flow that
 * feeds into the SVG renderer produces correct structures.
 */

function resolveAndLayout(spec: ChartSpec, width = 500, height = 300) {
  const resolved = resolveChartData(spec, width - 75, height - 65);
  return { resolved, layout: computeChartLayout(resolved, spec, width, height) };
}

describe('SVG Renderer — mark generation', () => {
  it('generates bar marks for bar chart', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };
    const { layout } = resolveAndLayout(spec);
    const bars = layout.marks.filter(m => m.kind === 'bar');
    expect(bars).toHaveLength(2);
    expect(bars[0].color).toBeTruthy();
  });

  it('generates line path + point marks', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }, { x: 'C', y: 15 }] },
      series: [{ type: 'line', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };
    const { layout } = resolveAndLayout(spec);
    const lines = layout.marks.filter(m => m.kind === 'line');
    const points = layout.marks.filter(m => m.kind === 'point');
    expect(lines).toHaveLength(1);
    expect(lines[0].path).toMatch(/^M/);
    expect(points).toHaveLength(3);
  });

  it('generates area + line + points for area chart', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }] },
      series: [{ type: 'area', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };
    const { layout } = resolveAndLayout(spec);
    expect(layout.marks.filter(m => m.kind === 'area')).toHaveLength(1);
    expect(layout.marks.filter(m => m.kind === 'line')).toHaveLength(1);
    expect(layout.marks.filter(m => m.kind === 'point')).toHaveLength(2);
  });

  it('generates scatter points', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      series: [{ type: 'point', x: { field: 'x', type: 'quantitative' }, y: { field: 'y', type: 'quantitative' } }],
    };
    const { layout } = resolveAndLayout(spec);
    const points = layout.marks.filter(m => m.kind === 'point');
    expect(points).toHaveLength(2);
  });

  it('generates mixed bar + line marks', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', revenue: 100, target: 80 }] },
      series: [
        { type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'revenue', type: 'quantitative' } },
        { type: 'line', x: { field: 'x', type: 'nominal' }, y: { field: 'target', type: 'quantitative' } },
      ],
    };
    const { layout } = resolveAndLayout(spec);
    expect(layout.marks.some(m => m.kind === 'bar')).toBe(true);
    expect(layout.marks.some(m => m.kind === 'line')).toBe(true);
  });
});

describe('SVG Renderer — axis rendering', () => {
  it('generates x and y axis ticks', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 20 }] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
    };
    const { layout } = resolveAndLayout(spec);
    expect(layout.xAxis.ticks.length).toBeGreaterThan(0);
    expect(layout.yAxis.ticks.length).toBeGreaterThan(0);
  });

  it('respects show: false for axes', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
      xAxis: { show: false },
      yAxis: { show: false },
    };
    const { layout } = resolveAndLayout(spec);
    expect(layout.xAxis.show).toBe(false);
    expect(layout.yAxis.show).toBe(false);
  });
});

describe('SVG Renderer — annotations', () => {
  it('positions reference line correctly', () => {
    const spec: ChartSpec = {
      data: { values: [{ x: 'A', y: 10 }, { x: 'B', y: 30 }] },
      series: [{ type: 'bar', x: { field: 'x', type: 'nominal' }, y: { field: 'y', type: 'quantitative' } }],
      annotations: [{ type: 'reference-line', axis: 'y', value: 20, label: 'Avg' }],
    };
    const { layout } = resolveAndLayout(spec);
    const ann = layout.annotations[0];
    expect(ann.type).toBe('reference-line');
    expect(ann.y1).toBeDefined();
    // Line should span full width
    expect(ann.x2! - ann.x1!).toBeGreaterThan(0);
  });
});

describe('Chart Patterns — getPatternFill', () => {
  it('returns color when no patternId', () => {
    expect(getPatternFill(undefined, '#3B82F6')).toBe('#3B82F6');
  });

  it('returns url() reference when patternId provided', () => {
    const fill = getPatternFill('diagonal-stripe', '#3B82F6');
    expect(fill).toMatch(/^url\(#phz-pat-/);
  });

  it('has expected number of patterns', () => {
    expect(CHART_PATTERNS.length).toBe(8);
  });

  it('all patterns have unique IDs', () => {
    const ids = CHART_PATTERNS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
