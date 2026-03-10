import { describe, it, expect } from 'vitest';

/**
 * Line Chart — pure logic tests (no DOM).
 * Tests scale computation, point positioning, multi-series, and axis labels.
 */

interface DataPoint {
  x: number | string;
  y: number;
}

interface Series {
  label: string;
  points: DataPoint[];
  color?: string;
}

interface ScaleResult {
  min: number;
  max: number;
  ticks: number[];
}

// --- Scale computation ---

function computeNiceScale(min: number, max: number, targetTicks: number = 5): ScaleResult {
  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
    return computeNiceScale(min - padding, max + padding, targetTicks);
  }

  const range = max - min;
  const roughStep = range / (targetTicks - 1);

  // Find a nice step size (1, 2, 5, 10, 20, 50, ...)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * 1e10) / 1e10); // avoid floating-point drift
  }

  return { min: niceMin, max: niceMax, ticks };
}

// --- Point positioning ---

interface ChartDimensions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

function computePointPositions(
  points: DataPoint[],
  yScale: ScaleResult,
  dims: ChartDimensions,
): { px: number; py: number; x: number | string; y: number }[] {
  const chartW = dims.width - dims.padding.left - dims.padding.right;
  const chartH = dims.height - dims.padding.top - dims.padding.bottom;
  const yRange = yScale.max - yScale.min || 1;

  return points.map((p, i) => ({
    px: dims.padding.left + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2),
    py: dims.padding.top + chartH - ((p.y - yScale.min) / yRange) * chartH,
    x: p.x,
    y: p.y,
  }));
}

// --- Axis label formatting ---

function formatTimeLabel(value: number | string): string {
  if (typeof value === 'string') return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function generateXLabels(
  points: { x: number | string }[],
  maxLabels: number = 6,
): { index: number; label: string }[] {
  if (points.length === 0) return [];
  const step = Math.max(1, Math.floor(points.length / maxLabels));
  const labels: { index: number; label: string }[] = [];
  for (let i = 0; i < points.length; i += step) {
    labels.push({ index: i, label: String(points[i].x) });
  }
  // Always include the last point
  const lastIdx = points.length - 1;
  if (labels[labels.length - 1]?.index !== lastIdx) {
    labels.push({ index: lastIdx, label: String(points[lastIdx].x) });
  }
  return labels;
}

// --- Multi-series color assignment ---

const LINE_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function assignSeriesColors(series: Series[]): string[] {
  return series.map((s, i) => s.color ?? LINE_PALETTE[i % LINE_PALETTE.length]);
}

// ============ TESTS ============

describe('Line Chart — computeNiceScale', () => {
  it('computes nice scale for typical data range', () => {
    const scale = computeNiceScale(3, 97);
    expect(scale.min).toBeLessThanOrEqual(3);
    expect(scale.max).toBeGreaterThanOrEqual(97);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
    // Ticks should be evenly spaced
    const step = scale.ticks[1] - scale.ticks[0];
    for (let i = 2; i < scale.ticks.length; i++) {
      expect(scale.ticks[i] - scale.ticks[i - 1]).toBeCloseTo(step, 5);
    }
  });

  it('handles equal min and max', () => {
    const scale = computeNiceScale(50, 50);
    expect(scale.min).toBeLessThan(50);
    expect(scale.max).toBeGreaterThan(50);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(2);
  });

  it('handles zero range', () => {
    const scale = computeNiceScale(0, 0);
    expect(scale.min).toBeLessThan(0);
    expect(scale.max).toBeGreaterThan(0);
  });

  it('handles negative values', () => {
    const scale = computeNiceScale(-100, -20);
    expect(scale.min).toBeLessThanOrEqual(-100);
    expect(scale.max).toBeGreaterThanOrEqual(-20);
  });

  it('produces round tick values', () => {
    const scale = computeNiceScale(0, 100);
    for (const tick of scale.ticks) {
      // All ticks should be round numbers
      expect(tick % 1).toBe(0);
    }
  });
});

describe('Line Chart — computePointPositions', () => {
  const dims: ChartDimensions = {
    width: 400,
    height: 200,
    padding: { top: 20, right: 20, bottom: 40, left: 50 },
  };

  it('positions first point at left edge', () => {
    const points: DataPoint[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ];
    const scale = computeNiceScale(10, 30);
    const positioned = computePointPositions(points, scale, dims);
    expect(positioned[0].px).toBe(dims.padding.left);
  });

  it('positions last point at right edge', () => {
    const points: DataPoint[] = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ];
    const scale = computeNiceScale(10, 30);
    const positioned = computePointPositions(points, scale, dims);
    const chartW = dims.width - dims.padding.left - dims.padding.right;
    expect(positioned[2].px).toBe(dims.padding.left + chartW);
  });

  it('positions max value at top', () => {
    const points: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 100 },
    ];
    const scale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const positioned = computePointPositions(points, scale, dims);
    expect(positioned[1].py).toBe(dims.padding.top);
  });

  it('positions min value at bottom', () => {
    const points: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 100 },
    ];
    const scale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const positioned = computePointPositions(points, scale, dims);
    const chartH = dims.height - dims.padding.top - dims.padding.bottom;
    expect(positioned[0].py).toBe(dims.padding.top + chartH);
  });

  it('centers single point horizontally', () => {
    const points: DataPoint[] = [{ x: 0, y: 50 }];
    const scale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const positioned = computePointPositions(points, scale, dims);
    const chartW = dims.width - dims.padding.left - dims.padding.right;
    expect(positioned[0].px).toBe(dims.padding.left + chartW / 2);
  });
});

describe('Line Chart — generateXLabels', () => {
  it('generates labels for small dataset', () => {
    const points = [{ x: 'Jan' }, { x: 'Feb' }, { x: 'Mar' }];
    const labels = generateXLabels(points);
    expect(labels).toHaveLength(3);
    expect(labels[0].label).toBe('Jan');
    expect(labels[2].label).toBe('Mar');
  });

  it('limits labels for large dataset', () => {
    const points = Array.from({ length: 30 }, (_, i) => ({ x: `D${i}` }));
    const labels = generateXLabels(points, 6);
    expect(labels.length).toBeLessThanOrEqual(8); // 6 + possibly last point
    expect(labels[labels.length - 1].label).toBe('D29'); // always includes last
  });

  it('returns empty for empty data', () => {
    expect(generateXLabels([])).toEqual([]);
  });

  it('always includes the last point', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ x: `P${i}` }));
    const labels = generateXLabels(points, 3);
    expect(labels[labels.length - 1].index).toBe(9);
  });
});

describe('Line Chart — assignSeriesColors', () => {
  it('uses series-provided color', () => {
    const series: Series[] = [
      { label: 'A', points: [], color: '#FF0000' },
      { label: 'B', points: [] },
    ];
    const colors = assignSeriesColors(series);
    expect(colors[0]).toBe('#FF0000');
    expect(colors[1]).toBe(LINE_PALETTE[1]);
  });

  it('cycles palette for many series', () => {
    const series: Series[] = Array.from({ length: 12 }, (_, i) => ({
      label: `S${i}`,
      points: [],
    }));
    const colors = assignSeriesColors(series);
    expect(colors[10]).toBe(LINE_PALETTE[0]);
    expect(colors[11]).toBe(LINE_PALETTE[1]);
  });
});

describe('Line Chart — multi-series Y scale', () => {
  it('computes scale across all series', () => {
    const allSeries: Series[] = [
      { label: 'A', points: [{ x: 0, y: 10 }, { x: 1, y: 50 }] },
      { label: 'B', points: [{ x: 0, y: 5 }, { x: 1, y: 80 }] },
    ];
    const allYValues = allSeries.flatMap(s => s.points.map(p => p.y));
    const min = Math.min(...allYValues);
    const max = Math.max(...allYValues);
    expect(min).toBe(5);
    expect(max).toBe(80);
    const scale = computeNiceScale(min, max);
    expect(scale.min).toBeLessThanOrEqual(5);
    expect(scale.max).toBeGreaterThanOrEqual(80);
  });
});

describe('Line Chart — formatTimeLabel', () => {
  it('formats timestamp to short date', () => {
    const ts = new Date('2025-03-15').getTime();
    const label = formatTimeLabel(ts);
    expect(label).toContain('Mar');
    expect(label).toContain('15');
  });

  it('passes through string labels', () => {
    expect(formatTimeLabel('Q1 2025')).toBe('Q1 2025');
  });

  it('handles invalid numbers', () => {
    expect(formatTimeLabel(NaN)).toBe('NaN');
  });
});
