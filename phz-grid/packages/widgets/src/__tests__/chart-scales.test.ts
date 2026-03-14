import { describe, it, expect } from 'vitest';
import {
  computeNiceScale,
  computeBandScale,
  computeTimeScale,
  responsiveTickCount,
} from '../chart/chart-scales.js';

// ========================================================================
// computeNiceScale
// ========================================================================

describe('Chart Scales — computeNiceScale', () => {
  it('computes nice scale for typical range', () => {
    const scale = computeNiceScale(3, 97);
    expect(scale.min).toBeLessThanOrEqual(3);
    expect(scale.max).toBeGreaterThanOrEqual(97);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
    expect(scale.step).toBeGreaterThan(0);
  });

  it('produces evenly spaced ticks', () => {
    const scale = computeNiceScale(0, 100);
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
      expect(tick % 1).toBe(0);
    }
  });

  it('respects targetTicks parameter', () => {
    const scale3 = computeNiceScale(0, 100, 3);
    const scale10 = computeNiceScale(0, 100, 10);
    expect(scale3.ticks.length).toBeLessThanOrEqual(scale10.ticks.length);
  });

  it('returns step property', () => {
    const scale = computeNiceScale(0, 50);
    expect(scale.step).toBeGreaterThan(0);
    expect(scale.step).toBeLessThanOrEqual(50);
  });

  it('handles very small ranges', () => {
    const scale = computeNiceScale(0.001, 0.009);
    expect(scale.min).toBeLessThanOrEqual(0.001);
    expect(scale.max).toBeGreaterThanOrEqual(0.009);
  });

  it('handles large ranges', () => {
    const scale = computeNiceScale(0, 1_000_000);
    expect(scale.min).toBe(0);
    expect(scale.max).toBeGreaterThanOrEqual(1_000_000);
  });
});

// ========================================================================
// computeBandScale
// ========================================================================

describe('Chart Scales — computeBandScale', () => {
  it('creates positions for categories', () => {
    const result = computeBandScale(['A', 'B', 'C'], 0, 300);
    expect(result.domain).toEqual(['A', 'B', 'C']);
    expect(result.positions.size).toBe(3);
    expect(result.bandwidth).toBeGreaterThan(0);
  });

  it('positions are within range', () => {
    const result = computeBandScale(['A', 'B', 'C'], 50, 250);
    for (const [, pos] of result.positions) {
      expect(pos).toBeGreaterThanOrEqual(50);
      expect(pos).toBeLessThanOrEqual(250);
    }
  });

  it('positions are ordered left to right', () => {
    const result = computeBandScale(['A', 'B', 'C'], 0, 300);
    expect(result.positions.get('A')!).toBeLessThan(result.positions.get('B')!);
    expect(result.positions.get('B')!).toBeLessThan(result.positions.get('C')!);
  });

  it('handles single category', () => {
    const result = computeBandScale(['Only'], 0, 200);
    expect(result.positions.size).toBe(1);
    const pos = result.positions.get('Only')!;
    expect(pos).toBeGreaterThan(0);
    expect(pos).toBeLessThan(200);
  });

  it('handles empty categories', () => {
    const result = computeBandScale([], 0, 300);
    expect(result.positions.size).toBe(0);
    expect(result.bandwidth).toBe(0);
    expect(result.domain).toEqual([]);
  });

  it('bandwidth decreases with more categories', () => {
    const few = computeBandScale(['A', 'B'], 0, 300);
    const many = computeBandScale(['A', 'B', 'C', 'D', 'E', 'F'], 0, 300);
    expect(many.bandwidth).toBeLessThan(few.bandwidth);
  });
});

// ========================================================================
// computeTimeScale
// ========================================================================

describe('Chart Scales — computeTimeScale', () => {
  it('creates time scale from timestamps', () => {
    const now = Date.now();
    const timestamps = [now - 86400000 * 7, now - 86400000 * 3, now];
    const result = computeTimeScale(timestamps, 0, 500);

    expect(result.min).toBeLessThanOrEqual(timestamps[0]);
    expect(result.max).toBeGreaterThanOrEqual(timestamps[2]);
    expect(result.ticks.length).toBeGreaterThanOrEqual(1);
    expect(typeof result.scale).toBe('function');
  });

  it('scale maps min to rangeStart', () => {
    const timestamps = [1000, 2000, 3000];
    const result = computeTimeScale(timestamps, 50, 450);
    expect(result.scale(1000)).toBe(50);
  });

  it('scale maps max to rangeEnd', () => {
    const timestamps = [1000, 2000, 3000];
    const result = computeTimeScale(timestamps, 50, 450);
    expect(result.scale(3000)).toBe(450);
  });

  it('scale interpolates mid-values', () => {
    const timestamps = [1000, 2000, 3000];
    const result = computeTimeScale(timestamps, 0, 400);
    const midPos = result.scale(2000);
    expect(midPos).toBeCloseTo(200, 0);
  });

  it('handles empty timestamps', () => {
    const result = computeTimeScale([], 0, 500);
    expect(result.ticks.length).toBeGreaterThanOrEqual(1);
    expect(typeof result.scale).toBe('function');
  });

  it('generates reasonable tick count', () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 30 }, (_, i) => now - 86400000 * (30 - i));
    const result = computeTimeScale(timestamps, 0, 600);
    expect(result.ticks.length).toBeLessThanOrEqual(13);
    expect(result.ticks.length).toBeGreaterThanOrEqual(2);
  });
});

// ========================================================================
// responsiveTickCount
// ========================================================================

describe('Chart Scales — responsiveTickCount', () => {
  it('returns at least 2 ticks', () => {
    expect(responsiveTickCount(50)).toBeGreaterThanOrEqual(2);
  });

  it('more ticks for wider charts', () => {
    expect(responsiveTickCount(800)).toBeGreaterThan(responsiveTickCount(200));
  });

  it('uses minPxPerTick parameter', () => {
    const wide = responsiveTickCount(400, 40); // 10 ticks
    const narrow = responsiveTickCount(400, 100); // 4 ticks
    expect(wide).toBeGreaterThan(narrow);
  });
});
