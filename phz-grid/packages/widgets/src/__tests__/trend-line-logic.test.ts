/**
 * @phozart/widgets -- Trend Line Pure Logic Tests
 *
 * Tests for the chartPoints getter on PhzTrendLine.
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

import { PhzTrendLine } from '../components/phz-trend-line.js';

function makeTrend(overrides: Partial<PhzTrendLine> = {}): PhzTrendLine {
  const t = new PhzTrendLine();
  Object.assign(t, overrides);
  return t;
}

describe('PhzTrendLine — chartPoints', () => {
  it('returns empty array when no data', () => {
    const t = makeTrend();
    expect((t as any).chartPoints).toEqual([]);
  });

  it('returns empty array when data has empty data array', () => {
    const t = makeTrend({
      data: { field: 'metric', label: 'Test', data: [] },
    });
    expect((t as any).chartPoints).toEqual([]);
  });

  it('returns points for single data point', () => {
    const t = makeTrend({
      data: { field: 'metric', label: 'Test', data: [{ x: 'Jan', y: 100, label: 'Jan' }] },
    });
    const points = (t as any).chartPoints;
    expect(points).toHaveLength(1);
    expect(points[0].label).toBe('Jan');
    expect(points[0].value).toBe(100);
  });

  it('returns points with correct x positions spread across chart width', () => {
    const t = makeTrend({
      data: {
        field: 'metric',
        label: 'Test',
        data: [
          { x: 'Jan', y: 10 },
          { x: 'Feb', y: 20 },
          { x: 'Mar', y: 30 },
        ],
      },
    });
    const points = (t as any).chartPoints;
    expect(points).toHaveLength(3);
    // First point x should be at left padding
    expect(points[0].x).toBe(10); // padding.left = 10
    // Last point x should be at right edge - right padding
    expect(points[2].x).toBe(380); // 400 - 20 = 380
  });

  it('respects the periods property to limit data', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x: `M${i}`,
      y: i * 10,
    }));
    const t = makeTrend({
      periods: 5,
      data: { field: 'metric', label: 'Test', data },
    });
    const points = (t as any).chartPoints;
    expect(points).toHaveLength(5);
    // Should take the last 5 items
    expect(points[0].value).toBe(150); // index 15
    expect(points[4].value).toBe(190); // index 19
  });

  it('uses label from data or falls back to x', () => {
    const t = makeTrend({
      data: {
        field: 'metric',
        label: 'Test',
        data: [
          { x: 'Jan', y: 10, label: 'January' },
          { x: 'Feb', y: 20 },
        ],
      },
    });
    const points = (t as any).chartPoints;
    expect(points[0].label).toBe('January');
    expect(points[1].label).toBe('Feb');
  });

  it('accounts for target in y-scale', () => {
    const t = makeTrend({
      target: 200,
      data: {
        field: 'metric',
        label: 'Test',
        data: [
          { x: 'Jan', y: 50 },
          { x: 'Feb', y: 100 },
        ],
      },
    });
    const points = (t as any).chartPoints;
    // With target=200, the maxVal should be 200 not 100
    // So the y values should be scaled accordingly
    expect(points).toHaveLength(2);
    // The point at y=50 should be lower (higher y pixel) than y=100
    expect(points[0].y).toBeGreaterThan(points[1].y);
  });
});

describe('PhzTrendLine — default properties', () => {
  it('has correct defaults', () => {
    const t = new PhzTrendLine();
    expect(t.periods).toBe(12);
    expect(t.lineColor).toBe('');
    expect(t.targetColor).toBe('');
    expect(t.loading).toBe(false);
    expect(t.error).toBeNull();
  });
});
