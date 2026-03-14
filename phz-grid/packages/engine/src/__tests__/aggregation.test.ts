import { describe, it, expect } from 'vitest';
import { computeAggregation, computeAggregations, computeGroupAggregations } from '../aggregation.js';
import type { AggregationConfig, RowGroup } from '@phozart/core';

const rows = [
  { name: 'Alice', sales: 100, region: 'North' },
  { name: 'Bob', sales: 200, region: 'South' },
  { name: 'Charlie', sales: 150, region: 'North' },
  { name: 'Diana', sales: 300, region: 'South' },
  { name: 'Eve', sales: 250, region: 'North' },
];

describe('computeAggregation', () => {
  it('computes sum', () => {
    expect(computeAggregation(rows, 'sales', 'sum')).toBe(1000);
  });

  it('computes avg', () => {
    expect(computeAggregation(rows, 'sales', 'avg')).toBe(200);
  });

  it('computes min', () => {
    expect(computeAggregation(rows, 'sales', 'min')).toBe(100);
  });

  it('computes max', () => {
    expect(computeAggregation(rows, 'sales', 'max')).toBe(300);
  });

  it('computes count', () => {
    expect(computeAggregation(rows, 'sales', 'count')).toBe(5);
  });

  it('computes first', () => {
    expect(computeAggregation(rows, 'name', 'first')).toBe('Alice');
  });

  it('computes last', () => {
    expect(computeAggregation(rows, 'name', 'last')).toBe('Eve');
  });

  it('returns null for empty array', () => {
    expect(computeAggregation([], 'sales', 'sum')).toBe(null);
  });

  it('returns null for non-numeric sum', () => {
    expect(computeAggregation(rows, 'name', 'sum')).toBe(null);
  });

  it('handles null values — filters them out', () => {
    const data = [{ v: 10 }, { v: null }, { v: 20 }];
    expect(computeAggregation(data, 'v', 'sum')).toBe(30);
    expect(computeAggregation(data, 'v', 'count')).toBe(2);
  });

  it('handles large arrays without stack overflow (200K elements)', () => {
    const largeRows: Record<string, unknown>[] = [];
    for (let i = 0; i < 200_000; i++) {
      largeRows.push({ value: i });
    }
    expect(computeAggregation(largeRows, 'value', 'min')).toBe(0);
    expect(computeAggregation(largeRows, 'value', 'max')).toBe(199_999);
    expect(computeAggregation(largeRows, 'value', 'sum')).toBe(19_999_900_000);
    expect(computeAggregation(largeRows, 'value', 'avg')).toBeCloseTo(99_999.5);
    expect(computeAggregation(largeRows, 'value', 'count')).toBe(200_000);
  });

  // --- New aggregation functions ---

  it('computes countDistinct', () => {
    expect(computeAggregation(rows, 'region', 'countDistinct')).toBe(2);
    expect(computeAggregation(rows, 'name', 'countDistinct')).toBe(5);
  });

  it('computes median — odd count', () => {
    // sales: [100, 200, 150, 300, 250] → sorted: [100, 150, 200, 250, 300] → median: 200
    expect(computeAggregation(rows, 'sales', 'median')).toBe(200);
  });

  it('computes median — even count', () => {
    const data = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 40 }];
    // sorted: [10, 20, 30, 40] → median: (20+30)/2 = 25
    expect(computeAggregation(data, 'v', 'median')).toBe(25);
  });

  it('computes median — single value', () => {
    expect(computeAggregation([{ v: 42 }], 'v', 'median')).toBe(42);
  });

  it('computes stddev (population)', () => {
    const data = [{ v: 2 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 5 }, { v: 5 }, { v: 7 }, { v: 9 }];
    // mean = 5, variance = 4, stddev = 2
    expect(computeAggregation(data, 'v', 'stddev')).toBe(2);
  });

  it('computes variance (population)', () => {
    const data = [{ v: 2 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 5 }, { v: 5 }, { v: 7 }, { v: 9 }];
    // mean = 5, variance = 4
    expect(computeAggregation(data, 'v', 'variance')).toBe(4);
  });

  it('returns null for countDistinct on empty array', () => {
    expect(computeAggregation([], 'v', 'countDistinct')).toBeNull();
  });

  it('returns null for median on non-numeric data', () => {
    expect(computeAggregation(rows, 'name', 'median')).toBeNull();
  });

  it('returns null for stddev on empty array', () => {
    expect(computeAggregation([], 'v', 'stddev')).toBeNull();
  });

  it('returns null for variance on empty array', () => {
    expect(computeAggregation([], 'v', 'variance')).toBeNull();
  });

  it('stddev of single value is 0', () => {
    expect(computeAggregation([{ v: 5 }], 'v', 'stddev')).toBe(0);
  });

  it('variance of single value is 0', () => {
    expect(computeAggregation([{ v: 5 }], 'v', 'variance')).toBe(0);
  });
});

describe('computeAggregations', () => {
  it('computes multiple aggregations for multiple fields', () => {
    const config: AggregationConfig = {
      fields: [
        { field: 'sales', functions: ['sum', 'avg', 'count'] },
      ],
    };
    const result = computeAggregations(rows, config);
    expect(result.fieldResults.sales.sum).toBe(1000);
    expect(result.fieldResults.sales.avg).toBe(200);
    expect(result.fieldResults.sales.count).toBe(5);
  });
});

describe('computeGroupAggregations', () => {
  it('computes aggregations per group', () => {
    const groups: RowGroup[] = [
      {
        key: 'North',
        field: 'region',
        value: 'North',
        rows: rows.filter(r => r.region === 'North') as any,
        depth: 0,
        isExpanded: true,
      },
      {
        key: 'South',
        field: 'region',
        value: 'South',
        rows: rows.filter(r => r.region === 'South') as any,
        depth: 0,
        isExpanded: true,
      },
    ];
    const config: AggregationConfig = {
      fields: [{ field: 'sales', functions: ['sum'] }],
    };
    const result = computeGroupAggregations(groups, config);
    expect(result[0].aggregations?.sales_sum).toBe(500);
    expect(result[1].aggregations?.sales_sum).toBe(500);
  });
});
