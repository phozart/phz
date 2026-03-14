import { describe, it, expect } from 'vitest';
import {
  applyTransforms,
  applyFilter,
  applySort,
  applyAggregate,
  applyStack,
  applyTimeUnit,
  applyBin,
  applyNormalize,
  applyCalculate,
} from '../chart-transforms.js';
import type { DataTransform } from '../chart-spec.js';

// ========================================================================
// applyFilter
// ========================================================================

describe('Chart Transforms — applyFilter', () => {
  const rows = [
    { name: 'Alice', age: 30, dept: 'eng' },
    { name: 'Bob', age: 25, dept: 'sales' },
    { name: 'Carol', age: 35, dept: 'eng' },
    { name: 'Dave', age: 28, dept: 'sales' },
  ];

  it('filters with eq operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'dept', operator: 'eq', value: 'eng' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.dept === 'eng')).toBe(true);
  });

  it('filters with neq operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'dept', operator: 'neq', value: 'eng' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.dept === 'sales')).toBe(true);
  });

  it('filters with gt operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'gt', value: 28 });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Carol']);
  });

  it('filters with gte operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'gte', value: 28 });
    expect(result).toHaveLength(3);
  });

  it('filters with lt operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'lt', value: 28 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
  });

  it('filters with lte operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'lte', value: 28 });
    expect(result).toHaveLength(2);
  });

  it('filters with in operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'name', operator: 'in', value: ['Alice', 'Carol'] });
    expect(result).toHaveLength(2);
  });

  it('filters with not_in operator', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'name', operator: 'not_in', value: ['Alice', 'Carol'] });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Bob', 'Dave']);
  });

  it('returns empty for no matches', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'gt', value: 100 });
    expect(result).toHaveLength(0);
  });

  it('returns all for universal match', () => {
    const result = applyFilter(rows, { type: 'filter', field: 'age', operator: 'gt', value: 0 });
    expect(result).toHaveLength(4);
  });
});

// ========================================================================
// applySort
// ========================================================================

describe('Chart Transforms — applySort', () => {
  const rows = [
    { name: 'Carol', val: 30 },
    { name: 'Alice', val: 10 },
    { name: 'Bob', val: 20 },
  ];

  it('sorts ascending by number', () => {
    const result = applySort(rows, { type: 'sort', field: 'val', order: 'asc' });
    expect(result.map(r => r.val)).toEqual([10, 20, 30]);
  });

  it('sorts descending by number', () => {
    const result = applySort(rows, { type: 'sort', field: 'val', order: 'desc' });
    expect(result.map(r => r.val)).toEqual([30, 20, 10]);
  });

  it('sorts ascending by string', () => {
    const result = applySort(rows, { type: 'sort', field: 'name', order: 'asc' });
    expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('does not mutate original array', () => {
    const original = [...rows];
    applySort(rows, { type: 'sort', field: 'val', order: 'asc' });
    expect(rows).toEqual(original);
  });

  it('handles null values (sorts to end)', () => {
    const data = [{ v: 2 }, { v: null }, { v: 1 }];
    const result = applySort(data, { type: 'sort', field: 'v', order: 'asc' });
    expect(result.map(r => r.v)).toEqual([1, 2, null]);
  });
});

// ========================================================================
// applyAggregate
// ========================================================================

describe('Chart Transforms — applyAggregate', () => {
  const rows = [
    { dept: 'eng', revenue: 100 },
    { dept: 'eng', revenue: 200 },
    { dept: 'sales', revenue: 150 },
    { dept: 'sales', revenue: 50 },
  ];

  it('computes sum aggregate', () => {
    const result = applyAggregate(rows, {
      type: 'aggregate',
      groupBy: ['dept'],
      ops: [{ field: 'revenue', op: 'sum', as: 'totalRevenue' }],
    });
    expect(result).toHaveLength(2);
    const eng = result.find(r => r.dept === 'eng');
    expect(eng?.totalRevenue).toBe(300);
    const sales = result.find(r => r.dept === 'sales');
    expect(sales?.totalRevenue).toBe(200);
  });

  it('computes count aggregate', () => {
    const result = applyAggregate(rows, {
      type: 'aggregate',
      groupBy: ['dept'],
      ops: [{ field: 'revenue', op: 'count', as: 'count' }],
    });
    expect(result.find(r => r.dept === 'eng')?.count).toBe(2);
  });

  it('computes mean aggregate', () => {
    const result = applyAggregate(rows, {
      type: 'aggregate',
      groupBy: ['dept'],
      ops: [{ field: 'revenue', op: 'mean', as: 'avgRevenue' }],
    });
    expect(result.find(r => r.dept === 'eng')?.avgRevenue).toBe(150);
    expect(result.find(r => r.dept === 'sales')?.avgRevenue).toBe(100);
  });

  it('computes min/max aggregate', () => {
    const result = applyAggregate(rows, {
      type: 'aggregate',
      groupBy: ['dept'],
      ops: [
        { field: 'revenue', op: 'min', as: 'minRev' },
        { field: 'revenue', op: 'max', as: 'maxRev' },
      ],
    });
    const eng = result.find(r => r.dept === 'eng');
    expect(eng?.minRev).toBe(100);
    expect(eng?.maxRev).toBe(200);
  });

  it('computes median aggregate', () => {
    const data = [
      { g: 'a', v: 1 }, { g: 'a', v: 3 }, { g: 'a', v: 5 },
    ];
    const result = applyAggregate(data, {
      type: 'aggregate',
      groupBy: ['g'],
      ops: [{ field: 'v', op: 'median', as: 'med' }],
    });
    expect(result[0].med).toBe(3);
  });

  it('computes distinct aggregate', () => {
    const data = [
      { g: 'a', v: 'x' }, { g: 'a', v: 'y' }, { g: 'a', v: 'x' },
    ];
    const result = applyAggregate(data, {
      type: 'aggregate',
      groupBy: ['g'],
      ops: [{ field: 'v', op: 'distinct', as: 'uniq' }],
    });
    expect(result[0].uniq).toBe(2);
  });

  it('handles empty group', () => {
    const result = applyAggregate([], {
      type: 'aggregate',
      groupBy: ['dept'],
      ops: [{ field: 'revenue', op: 'sum', as: 'total' }],
    });
    expect(result).toHaveLength(0);
  });

  it('supports multiple groupBy fields', () => {
    const data = [
      { dept: 'eng', quarter: 'Q1', rev: 100 },
      { dept: 'eng', quarter: 'Q1', rev: 200 },
      { dept: 'eng', quarter: 'Q2', rev: 150 },
    ];
    const result = applyAggregate(data, {
      type: 'aggregate',
      groupBy: ['dept', 'quarter'],
      ops: [{ field: 'rev', op: 'sum', as: 'total' }],
    });
    expect(result).toHaveLength(2);
    expect(result.find(r => r.quarter === 'Q1')?.total).toBe(300);
    expect(result.find(r => r.quarter === 'Q2')?.total).toBe(150);
  });
});

// ========================================================================
// applyStack
// ========================================================================

describe('Chart Transforms — applyStack', () => {
  it('stacks values by group', () => {
    const rows = [
      { month: 'Jan', series: 'A', value: 10 },
      { month: 'Jan', series: 'B', value: 20 },
      { month: 'Feb', series: 'A', value: 15 },
      { month: 'Feb', series: 'B', value: 25 },
    ];
    const result = applyStack(rows, {
      type: 'stack',
      field: 'value',
      groupBy: ['month'],
      as: ['y0', 'y1'],
    });

    const janRows = result.filter(r => r.month === 'Jan');
    expect(janRows[0].y0).toBe(0);
    expect(janRows[0].y1).toBe(10);
    expect(janRows[1].y0).toBe(10);
    expect(janRows[1].y1).toBe(30);
  });

  it('respects sort within group', () => {
    const rows = [
      { month: 'Jan', series: 'B', value: 20 },
      { month: 'Jan', series: 'A', value: 10 },
    ];
    const result = applyStack(rows, {
      type: 'stack',
      field: 'value',
      groupBy: ['month'],
      sort: { field: 'value', order: 'asc' },
      as: ['y0', 'y1'],
    });

    expect(result[0].series).toBe('A');
    expect(result[0].y0).toBe(0);
    expect(result[0].y1).toBe(10);
    expect(result[1].series).toBe('B');
    expect(result[1].y0).toBe(10);
    expect(result[1].y1).toBe(30);
  });

  it('handles empty input', () => {
    const result = applyStack([], {
      type: 'stack',
      field: 'value',
      groupBy: ['month'],
      as: ['y0', 'y1'],
    });
    expect(result).toHaveLength(0);
  });
});

// ========================================================================
// applyTimeUnit
// ========================================================================

describe('Chart Transforms — applyTimeUnit', () => {
  it('truncates to year', () => {
    const rows = [{ date: '2025-06-15' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'year', as: 'year' });
    expect(result[0].year).toBe('2025');
  });

  it('truncates to quarter', () => {
    const rows = [{ date: '2025-08-15' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'quarter', as: 'q' });
    expect(result[0].q).toBe('2025-Q3');
  });

  it('truncates to month', () => {
    const rows = [{ date: '2025-03-15' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'month', as: 'm' });
    expect(result[0].m).toBe('2025-03');
  });

  it('truncates to day', () => {
    const rows = [{ date: '2025-03-15T14:30:00Z' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'day', as: 'd' });
    expect(result[0].d).toBe('2025-03-15');
  });

  it('handles yearmonth', () => {
    const rows = [{ date: '2025-11-20' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'yearmonth', as: 'ym' });
    expect(result[0].ym).toBe('2025-11');
  });

  it('handles non-date values gracefully', () => {
    const rows = [{ date: 'not-a-date' }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'year', as: 'y' });
    expect(result[0].y).toBe('not-a-date');
  });

  it('handles numeric timestamps', () => {
    const ts = new Date('2025-06-15').getTime();
    const rows = [{ date: ts }];
    const result = applyTimeUnit(rows, { type: 'timeUnit', field: 'date', timeUnit: 'year', as: 'y' });
    expect(result[0].y).toBe('2025');
  });
});

// ========================================================================
// applyBin
// ========================================================================

describe('Chart Transforms — applyBin', () => {
  it('bins numeric values', () => {
    const rows = [{ v: 5 }, { v: 15 }, { v: 25 }, { v: 35 }, { v: 45 }];
    const result = applyBin(rows, { type: 'bin', field: 'v', maxBins: 5, as: 'bin' });
    expect(result.every(r => typeof r.bin === 'string')).toBe(true);
    expect(result[0].bin).not.toBe(result[4].bin);
  });

  it('handles non-numeric values as null', () => {
    const rows = [{ v: 'hello' }];
    const result = applyBin(rows, { type: 'bin', field: 'v', as: 'bin' });
    expect(result[0].bin).toBeNull();
  });

  it('handles empty data', () => {
    const rows = [{ v: null }];
    const result = applyBin(rows as any, { type: 'bin', field: 'v', as: 'bin' });
    expect(result[0].bin).toBeNull();
  });
});

// ========================================================================
// applyNormalize
// ========================================================================

describe('Chart Transforms — applyNormalize', () => {
  it('normalizes values within group to sum to 1', () => {
    const rows = [
      { g: 'a', v: 25 },
      { g: 'a', v: 75 },
      { g: 'b', v: 50 },
      { g: 'b', v: 50 },
    ];
    const result = applyNormalize(rows, {
      type: 'normalize',
      field: 'v',
      groupBy: ['g'],
      as: 'norm',
    });
    expect(result[0].norm).toBe(0.25);
    expect(result[1].norm).toBe(0.75);
    expect(result[2].norm).toBe(0.5);
    expect(result[3].norm).toBe(0.5);
  });

  it('handles zero total', () => {
    const rows = [{ g: 'a', v: 0 }, { g: 'a', v: 0 }];
    const result = applyNormalize(rows, {
      type: 'normalize',
      field: 'v',
      groupBy: ['g'],
      as: 'norm',
    });
    expect(result.every(r => r.norm === 0)).toBe(true);
  });
});

// ========================================================================
// applyCalculate
// ========================================================================

describe('Chart Transforms — applyCalculate', () => {
  it('computes simple arithmetic expression', () => {
    const rows = [{ revenue: 100, cost: 60 }];
    const result = applyCalculate(rows, {
      type: 'calculate',
      as: 'profit',
      expr: 'datum.revenue - datum.cost',
    });
    expect(result[0].profit).toBe(40);
  });

  it('handles division', () => {
    const rows = [{ revenue: 200, count: 4 }];
    const result = applyCalculate(rows, {
      type: 'calculate',
      as: 'avg',
      expr: 'datum.revenue / datum.count',
    });
    expect(result[0].avg).toBe(50);
  });

  it('returns null for unsafe expressions', () => {
    const rows = [{ v: 10 }];
    const result = applyCalculate(rows, {
      type: 'calculate',
      as: 'hacked',
      expr: 'process.exit(1)',
    });
    expect(result[0].hacked).toBeNull();
  });
});

// ========================================================================
// Pipeline Composition
// ========================================================================

describe('Chart Transforms — applyTransforms (pipeline)', () => {
  it('chains filter → sort → aggregate', () => {
    const rows = [
      { dept: 'eng', revenue: 100 },
      { dept: 'eng', revenue: 200 },
      { dept: 'sales', revenue: 150 },
      { dept: 'sales', revenue: 50 },
      { dept: 'hr', revenue: 80 },
    ];

    const transforms: DataTransform[] = [
      { type: 'filter', field: 'dept', operator: 'neq', value: 'hr' },
      { type: 'aggregate', groupBy: ['dept'], ops: [{ field: 'revenue', op: 'sum', as: 'total' }] },
      { type: 'sort', field: 'total', order: 'desc' },
    ];

    const result = applyTransforms(rows, transforms);
    expect(result).toHaveLength(2);
    expect(result[0].dept).toBe('eng');
    expect(result[0].total).toBe(300);
    expect(result[1].dept).toBe('sales');
    expect(result[1].total).toBe(200);
  });

  it('handles empty transform list', () => {
    const rows = [{ x: 1 }];
    expect(applyTransforms(rows, [])).toEqual(rows);
  });

  it('handles empty data', () => {
    const transforms: DataTransform[] = [
      { type: 'filter', field: 'x', operator: 'gt', value: 0 },
    ];
    expect(applyTransforms([], transforms)).toEqual([]);
  });
});
