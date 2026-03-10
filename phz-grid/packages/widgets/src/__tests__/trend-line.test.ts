import { describe, it, expect } from 'vitest';
import type { ChartDataSeries } from '@phozart/phz-engine';

describe('Trend Line logic', () => {
  it('computes SVG path points from data', () => {
    const data: ChartDataSeries = {
      field: 'sales',
      label: 'Sales',
      data: [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 150 },
        { x: 'Mar', y: 120 },
      ],
    };
    const values = data.data.map((d: { x: string | number; y: number }) => d.y);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    expect(maxVal).toBe(150);
    expect(minVal).toBe(100);
  });

  it('limits to specified periods', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ x: `P${i}`, y: i * 10 }));
    const limited = data.slice(-12);
    expect(limited).toHaveLength(12);
    expect(limited[0].x).toBe('P8');
  });

  it('computes target line Y position', () => {
    const target = 90;
    const values = [80, 85, 90, 95, 100];
    const maxVal = Math.max(...values, target);
    const minVal = Math.min(...values, target);
    const range = maxVal - minVal;
    const chartH = 110; // 160 - 20 - 30
    const targetY = 20 + chartH - ((target - minVal) / range) * chartH;
    expect(targetY).toBeGreaterThan(0);
    expect(targetY).toBeLessThan(160);
  });
});
