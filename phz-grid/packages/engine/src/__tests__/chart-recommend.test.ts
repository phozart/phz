import { describe, it, expect } from 'vitest';
import { recommendChartSpec } from '../chart-recommend.js';

describe('Chart Recommend — recommendChartSpec', () => {
  it('recommends bar chart for categorical + numeric data', () => {
    const data = [
      { region: 'West', revenue: 300 },
      { region: 'East', revenue: 200 },
      { region: 'North', revenue: 150 },
    ];

    const result = recommendChartSpec(data);
    expect(result.series).toBeDefined();
    expect(result.series!.length).toBeGreaterThan(0);
    expect(result.series![0].type).toBe('bar');
    expect(result.series![0].x.field).toBe('region');
    expect(result.series![0].y.field).toBe('revenue');
  });

  it('recommends line chart for temporal + numeric data', () => {
    const data = [
      { date: '2025-01-01', revenue: 100 },
      { date: '2025-02-01', revenue: 200 },
      { date: '2025-03-01', revenue: 150 },
    ];

    const result = recommendChartSpec(data);
    expect(result.series![0].type).toBe('line');
    expect(result.series![0].x.field).toBe('date');
  });

  it('recommends scatter for two numeric fields', () => {
    const data = [
      { height: 170, weight: 70 },
      { height: 180, weight: 80 },
      { height: 160, weight: 60 },
    ];

    const result = recommendChartSpec(data);
    expect(result.series![0].type).toBe('point');
  });

  it('limits series count to maxSeries', () => {
    const data = [
      { cat: 'A', a: 1, b: 2, c: 3, d: 4 },
    ];

    const result = recommendChartSpec(data, { maxSeries: 2 });
    expect(result.series!.length).toBeLessThanOrEqual(2);
  });

  it('uses preferredType override', () => {
    const data = [
      { month: 'Jan', revenue: 100 },
      { month: 'Feb', revenue: 200 },
    ];

    const result = recommendChartSpec(data, { preferredType: 'area' });
    expect(result.series![0].type).toBe('area');
  });

  it('suggests average annotation for high-variance data', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      x: `Item${i}`,
      value: i === 5 ? 1000 : 10, // One extreme outlier
    }));

    const result = recommendChartSpec(data, { suggestAnnotations: true });
    const annotations = result.annotations ?? [];
    const avgAnnotation = annotations.find(a => a.type === 'reference-line');
    expect(avgAnnotation).toBeDefined();
    expect(avgAnnotation!.label).toContain('Avg');
  });

  it('skips annotations when suggestAnnotations is false', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      x: `Item${i}`,
      value: i === 5 ? 1000 : 10,
    }));

    const result = recommendChartSpec(data, { suggestAnnotations: false });
    expect(result.annotations).toBeUndefined();
  });

  it('handles empty data', () => {
    const result = recommendChartSpec([]);
    expect(result.series).toEqual([]);
  });

  it('handles data with no numeric fields', () => {
    const data = [
      { name: 'Alice', role: 'Engineer' },
      { name: 'Bob', role: 'Designer' },
    ];

    const result = recommendChartSpec(data);
    expect(result.series).toEqual([]);
  });

  it('uses explicit xField and yFields', () => {
    const data = [
      { month: 'Jan', revenue: 100, cost: 60, headcount: 10 },
    ];

    const result = recommendChartSpec(data, {
      xField: 'month',
      yFields: ['revenue', 'cost'],
    });

    expect(result.series).toHaveLength(2);
    expect(result.series![0].y.field).toBe('revenue');
    expect(result.series![1].y.field).toBe('cost');
  });

  it('detects temporal fields by name pattern', () => {
    const data = [
      { created_at: '2025-01-01', count: 5 },
      { created_at: '2025-02-01', count: 10 },
    ];

    const result = recommendChartSpec(data);
    expect(result.series![0].x.field).toBe('created_at');
    expect(result.series![0].type).toBe('line');
  });

  it('sets axis labels from field names', () => {
    const data = [{ category: 'A', sales: 100 }];
    const result = recommendChartSpec(data);
    expect(result.xAxis?.label).toBe('category');
    expect(result.yAxis?.label).toBe('sales');
  });
});
