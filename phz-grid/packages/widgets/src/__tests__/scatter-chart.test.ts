import { describe, it, expect } from 'vitest';

/**
 * Scatter / Bubble Chart — pure logic tests (no DOM).
 * Tests data scaling, bubble sizing, axis computation, and accessible descriptions.
 */

// --- Types ---

interface ScatterDataPoint {
  x: number;
  y: number;
  size?: number;
  color?: string;
  label?: string;
}

interface ScaleResult {
  min: number;
  max: number;
  ticks: number[];
}

// --- Pure functions under test ---

function computeNiceScale(min: number, max: number, targetTicks: number = 5): ScaleResult {
  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
    return computeNiceScale(min - padding, max + padding, targetTicks);
  }
  const range = max - min;
  const roughStep = range / (targetTicks - 1);
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
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return { min: niceMin, max: niceMax, ticks };
}

function scalePoint(
  point: ScatterDataPoint,
  xScale: ScaleResult,
  yScale: ScaleResult,
  chartWidth: number,
  chartHeight: number,
  padding: { top: number; right: number; bottom: number; left: number },
): { px: number; py: number } {
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const xRange = xScale.max - xScale.min || 1;
  const yRange = yScale.max - yScale.min || 1;
  return {
    px: padding.left + ((point.x - xScale.min) / xRange) * plotW,
    py: padding.top + plotH - ((point.y - yScale.min) / yRange) * plotH,
  };
}

function computeBubbleRadius(
  size: number | undefined,
  allSizes: number[],
  minR: number = 4,
  maxR: number = 24,
): number {
  if (size === undefined || allSizes.length === 0) return minR;
  const sMin = Math.min(...allSizes);
  const sMax = Math.max(...allSizes);
  if (sMin === sMax) return (minR + maxR) / 2;
  const normalized = (size - sMin) / (sMax - sMin);
  return minR + normalized * (maxR - minR);
}

function buildAccessibleDescription(data: ScatterDataPoint[]): string {
  return data.map((p, i) => {
    const label = p.label ?? `Point ${i + 1}`;
    const sizeStr = p.size !== undefined ? `, size ${p.size}` : '';
    return `${label}: x=${p.x}, y=${p.y}${sizeStr}`;
  }).join('; ');
}


// ============ TESTS ============

describe('Scatter Chart — computeNiceScale', () => {
  it('produces scale encompassing data range', () => {
    const scale = computeNiceScale(2, 98);
    expect(scale.min).toBeLessThanOrEqual(2);
    expect(scale.max).toBeGreaterThanOrEqual(98);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
  });

  it('handles equal min and max', () => {
    const scale = computeNiceScale(50, 50);
    expect(scale.min).toBeLessThan(50);
    expect(scale.max).toBeGreaterThan(50);
  });

  it('handles negative range', () => {
    const scale = computeNiceScale(-80, -10);
    expect(scale.min).toBeLessThanOrEqual(-80);
    expect(scale.max).toBeGreaterThanOrEqual(-10);
  });
});

describe('Scatter Chart — scalePoint', () => {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 400;
  const height = 300;

  it('maps min x/max y to top-left of plot area', () => {
    const xScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const yScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const { px, py } = scalePoint({ x: 0, y: 100 }, xScale, yScale, width, height, padding);
    expect(px).toBe(padding.left);
    expect(py).toBe(padding.top);
  });

  it('maps max x/min y to bottom-right of plot area', () => {
    const xScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const yScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const { px, py } = scalePoint({ x: 100, y: 0 }, xScale, yScale, width, height, padding);
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    expect(px).toBe(padding.left + plotW);
    expect(py).toBe(padding.top + plotH);
  });

  it('maps center point to middle of plot area', () => {
    const xScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const yScale = { min: 0, max: 100, ticks: [0, 50, 100] };
    const { px, py } = scalePoint({ x: 50, y: 50 }, xScale, yScale, width, height, padding);
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    expect(px).toBeCloseTo(padding.left + plotW / 2);
    expect(py).toBeCloseTo(padding.top + plotH / 2);
  });
});

describe('Scatter Chart — computeBubbleRadius', () => {
  it('returns minR for undefined size', () => {
    expect(computeBubbleRadius(undefined, [1, 2, 3])).toBe(4);
  });

  it('returns minR for minimum size value', () => {
    expect(computeBubbleRadius(1, [1, 5, 10])).toBe(4);
  });

  it('returns maxR for maximum size value', () => {
    expect(computeBubbleRadius(10, [1, 5, 10])).toBe(24);
  });

  it('returns midpoint when all sizes are equal', () => {
    expect(computeBubbleRadius(5, [5, 5, 5])).toBe(14);
  });

  it('returns minR for empty sizes array', () => {
    expect(computeBubbleRadius(5, [])).toBe(4);
  });

  it('scales linearly between min and max radius', () => {
    const r = computeBubbleRadius(5, [0, 10]);
    expect(r).toBeCloseTo(14); // midpoint of 4..24
  });
});

describe('Scatter Chart — buildAccessibleDescription', () => {
  it('describes points with labels', () => {
    const desc = buildAccessibleDescription([
      { x: 10, y: 20, label: 'Alpha' },
      { x: 30, y: 40, label: 'Beta' },
    ]);
    expect(desc).toBe('Alpha: x=10, y=20; Beta: x=30, y=40');
  });

  it('uses default labels when none provided', () => {
    const desc = buildAccessibleDescription([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
    expect(desc).toContain('Point 1');
    expect(desc).toContain('Point 2');
  });

  it('includes size when present', () => {
    const desc = buildAccessibleDescription([
      { x: 10, y: 20, size: 50, label: 'Big' },
    ]);
    expect(desc).toBe('Big: x=10, y=20, size 50');
  });

  it('handles empty data', () => {
    expect(buildAccessibleDescription([])).toBe('');
  });
});
