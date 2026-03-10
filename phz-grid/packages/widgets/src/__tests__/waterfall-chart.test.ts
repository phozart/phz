import { describe, it, expect } from 'vitest';

/**
 * Waterfall Chart — pure logic tests (no DOM).
 * Tests running total, bar positions, and accessible descriptions.
 */

// --- Types ---

interface WaterfallDatum {
  label: string;
  value: number;
  type: 'increase' | 'decrease' | 'total';
}

interface WaterfallBar {
  label: string;
  value: number;
  type: 'increase' | 'decrease' | 'total';
  start: number;
  end: number;
  color: string;
}

// --- Pure functions under test ---

const WATERFALL_COLORS = {
  increase: '#10B981',
  decrease: '#EF4444',
  total: '#3B82F6',
};

function computeWaterfallBars(
  data: WaterfallDatum[],
  colors: Record<string, string> = WATERFALL_COLORS,
): WaterfallBar[] {
  let runningTotal = 0;
  return data.map(d => {
    let start: number;
    let end: number;

    if (d.type === 'total') {
      start = 0;
      end = runningTotal;
    } else if (d.type === 'increase') {
      start = runningTotal;
      end = runningTotal + d.value;
      runningTotal = end;
    } else {
      start = runningTotal;
      end = runningTotal - d.value;
      runningTotal = end;
    }

    return {
      label: d.label,
      value: d.value,
      type: d.type,
      start,
      end,
      color: colors[d.type] ?? WATERFALL_COLORS[d.type],
    };
  });
}

function computeWaterfallBounds(bars: WaterfallBar[]): { min: number; max: number } {
  if (bars.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const bar of bars) {
    const lo = Math.min(bar.start, bar.end);
    const hi = Math.max(bar.start, bar.end);
    if (lo < min) min = lo;
    if (hi > max) max = hi;
  }
  return { min, max };
}

function buildWaterfallAccessibleDescription(bars: WaterfallBar[]): string {
  return bars.map(b => {
    if (b.type === 'total') {
      return `${b.label}: total ${b.end.toLocaleString()}`;
    }
    const sign = b.type === 'increase' ? '+' : '-';
    return `${b.label}: ${sign}${b.value.toLocaleString()}, running total ${b.end.toLocaleString()}`;
  }).join('; ');
}


// ============ TESTS ============

describe('Waterfall Chart — computeWaterfallBars', () => {
  it('computes running totals for increases', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 100, type: 'increase' },
      { label: 'Services', value: 50, type: 'increase' },
    ]);
    expect(bars[0].start).toBe(0);
    expect(bars[0].end).toBe(100);
    expect(bars[1].start).toBe(100);
    expect(bars[1].end).toBe(150);
  });

  it('computes running totals for decreases', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 200, type: 'increase' },
      { label: 'Costs', value: 80, type: 'decrease' },
    ]);
    expect(bars[1].start).toBe(200);
    expect(bars[1].end).toBe(120);
  });

  it('handles total type correctly', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 200, type: 'increase' },
      { label: 'Costs', value: 80, type: 'decrease' },
      { label: 'Net', value: 0, type: 'total' },
    ]);
    const total = bars[2];
    expect(total.start).toBe(0);
    expect(total.end).toBe(120); // running total at that point
  });

  it('assigns correct colors', () => {
    const bars = computeWaterfallBars([
      { label: 'Up', value: 10, type: 'increase' },
      { label: 'Down', value: 5, type: 'decrease' },
      { label: 'Total', value: 0, type: 'total' },
    ]);
    expect(bars[0].color).toBe('#10B981');
    expect(bars[1].color).toBe('#EF4444');
    expect(bars[2].color).toBe('#3B82F6');
  });

  it('handles empty data', () => {
    expect(computeWaterfallBars([])).toEqual([]);
  });

  it('supports custom colors', () => {
    const bars = computeWaterfallBars(
      [{ label: 'A', value: 10, type: 'increase' }],
      { increase: '#00FF00', decrease: '#FF0000', total: '#0000FF' },
    );
    expect(bars[0].color).toBe('#00FF00');
  });

  it('handles negative running total', () => {
    const bars = computeWaterfallBars([
      { label: 'Loss', value: 50, type: 'decrease' },
    ]);
    expect(bars[0].start).toBe(0);
    expect(bars[0].end).toBe(-50);
  });
});

describe('Waterfall Chart — computeWaterfallBounds', () => {
  it('finds min and max across all bars', () => {
    const bars = computeWaterfallBars([
      { label: 'A', value: 100, type: 'increase' },
      { label: 'B', value: 30, type: 'decrease' },
      { label: 'C', value: 0, type: 'total' },
    ]);
    const bounds = computeWaterfallBounds(bars);
    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(100);
  });

  it('handles negative values', () => {
    const bars = computeWaterfallBars([
      { label: 'Loss', value: 50, type: 'decrease' },
    ]);
    const bounds = computeWaterfallBounds(bars);
    expect(bounds.min).toBe(-50);
    expect(bounds.max).toBe(0);
  });

  it('returns zero for empty', () => {
    expect(computeWaterfallBounds([])).toEqual({ min: 0, max: 0 });
  });
});

describe('Waterfall Chart — buildWaterfallAccessibleDescription', () => {
  it('describes increases and decreases with running total', () => {
    const bars = computeWaterfallBars([
      { label: 'Revenue', value: 200, type: 'increase' },
      { label: 'Costs', value: 80, type: 'decrease' },
      { label: 'Net', value: 0, type: 'total' },
    ]);
    const desc = buildWaterfallAccessibleDescription(bars);
    expect(desc).toContain('Revenue: +200');
    expect(desc).toContain('Costs: -80');
    expect(desc).toContain('Net: total 120');
  });

  it('handles empty', () => {
    expect(buildWaterfallAccessibleDescription([])).toBe('');
  });
});
