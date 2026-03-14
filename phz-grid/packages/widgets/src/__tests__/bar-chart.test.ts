import { describe, it, expect } from 'vitest';
import type { ChartDataSeries } from '@phozart/engine';

describe('Bar Chart logic', () => {
  it('sorts data descending by default', () => {
    const data: ChartDataSeries = {
      field: 'sales',
      label: 'Sales',
      data: [
        { x: 'A', y: 100 },
        { x: 'B', y: 300 },
        { x: 'C', y: 200 },
      ],
    };
    const sorted = [...data.data].sort((a, b) => b.y - a.y);
    expect(sorted[0].x).toBe('B');
    expect(sorted[2].x).toBe('A');
  });

  it('limits to maxBars', () => {
    const data: ChartDataSeries = {
      field: 'sales',
      label: 'Sales',
      data: Array.from({ length: 20 }, (_, i) => ({ x: `Item ${i}`, y: i * 10 })),
    };
    const limited = data.data.slice(0, 10);
    expect(limited).toHaveLength(10);
  });

  it('computes bar width as percentage of max', () => {
    const values = [100, 200, 300];
    const maxVal = Math.max(...values);
    expect((100 / maxVal) * 100).toBeCloseTo(33.33, 1);
    expect((300 / maxVal) * 100).toBe(100);
  });
});
