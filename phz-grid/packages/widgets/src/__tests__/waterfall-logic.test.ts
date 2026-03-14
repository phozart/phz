/**
 * @phozart/widgets — Waterfall Chart Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  computeWaterfallBars,
  computeWaterfallBounds,
  buildWaterfallAccessibleDescription,
  WATERFALL_COLORS,
  type WaterfallDatum,
} from '../components/phz-waterfall-chart.js';

describe('computeWaterfallBars', () => {
  it('computes increase bars with running total', () => {
    const data: WaterfallDatum[] = [
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Growth', value: 50, type: 'increase' },
    ];
    const bars = computeWaterfallBars(data);
    expect(bars[0].start).toBe(0);
    expect(bars[0].end).toBe(100);
    expect(bars[1].start).toBe(100);
    expect(bars[1].end).toBe(150);
  });

  it('computes decrease bars', () => {
    const data: WaterfallDatum[] = [
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Cost', value: 30, type: 'decrease' },
    ];
    const bars = computeWaterfallBars(data);
    expect(bars[1].start).toBe(100);
    expect(bars[1].end).toBe(70);
  });

  it('computes total bars from 0 to running total', () => {
    const data: WaterfallDatum[] = [
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Cost', value: 30, type: 'decrease' },
      { label: 'Net', value: 0, type: 'total' },
    ];
    const bars = computeWaterfallBars(data);
    expect(bars[2].start).toBe(0);
    expect(bars[2].end).toBe(70); // 100 - 30
  });

  it('assigns correct colors', () => {
    const data: WaterfallDatum[] = [
      { label: 'A', value: 50, type: 'increase' },
      { label: 'B', value: 20, type: 'decrease' },
      { label: 'C', value: 0, type: 'total' },
    ];
    const bars = computeWaterfallBars(data);
    expect(bars[0].color).toBe(WATERFALL_COLORS.increase);
    expect(bars[1].color).toBe(WATERFALL_COLORS.decrease);
    expect(bars[2].color).toBe(WATERFALL_COLORS.total);
  });

  it('handles empty data', () => {
    expect(computeWaterfallBars([])).toEqual([]);
  });
});

describe('computeWaterfallBounds', () => {
  it('returns min and max across all bars', () => {
    const bars = computeWaterfallBars([
      { label: 'A', value: 100, type: 'increase' },
      { label: 'B', value: 150, type: 'decrease' },
    ]);
    const bounds = computeWaterfallBounds(bars);
    expect(bounds.min).toBeLessThanOrEqual(0);
    expect(bounds.max).toBeGreaterThanOrEqual(100);
  });

  it('returns zero bounds for empty bars', () => {
    expect(computeWaterfallBounds([])).toEqual({ min: 0, max: 0 });
  });
});

describe('buildWaterfallAccessibleDescription', () => {
  it('describes increase bars with sign', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 100, type: 'increase' },
    ]);
    const desc = buildWaterfallAccessibleDescription(bars);
    expect(desc).toContain('Revenue');
    expect(desc).toContain('+');
    expect(desc).toContain('100');
  });

  it('describes decrease bars with minus sign', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Cost', value: 30, type: 'decrease' },
    ]);
    const desc = buildWaterfallAccessibleDescription(bars);
    expect(desc).toContain('-');
    expect(desc).toContain('30');
  });

  it('describes total bars', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Net', value: 0, type: 'total' },
    ]);
    const desc = buildWaterfallAccessibleDescription(bars);
    expect(desc).toContain('Net: total');
  });
});
