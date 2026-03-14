/**
 * Performance Benchmarks for phozart
 *
 * Measures grid operations at different data scales.
 * Run: npx vitest run tests/benchmarks/
 *
 * These are NOT time-sensitive assertions (they pass regardless of speed).
 * They measure and report performance for tracking over time.
 */
import { describe, it, expect } from 'vitest';
import { createGrid, buildCoreRowModel, filterRows, sortRows } from '@phozart/core';
import type { ColumnDefinition } from '@phozart/core';
import { computeAggregations } from '@phozart/engine';

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

const REGIONS = ['EMEA', 'APAC', 'AMER', 'LATAM', 'MEA'];
const PRODUCTS = ['Widget A', 'Widget B', 'Widget C', 'Widget D', 'Widget E'];
const REPS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];

function generateRows(count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i + 1,
      region: REGIONS[i % REGIONS.length],
      product: PRODUCTS[i % PRODUCTS.length],
      revenue: Math.round(Math.random() * 100000),
      units: Math.round(Math.random() * 500),
      date: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      rep: REPS[i % REPS.length],
      active: i % 3 !== 0,
    });
  }
  return rows;
}

const COLUMNS: ColumnDefinition[] = [
  { field: 'id', header: 'ID', type: 'number' },
  { field: 'region', header: 'Region', type: 'string' },
  { field: 'product', header: 'Product', type: 'string' },
  { field: 'revenue', header: 'Revenue', type: 'number' },
  { field: 'units', header: 'Units', type: 'number' },
  { field: 'date', header: 'Date', type: 'date' },
  { field: 'rep', header: 'Rep', type: 'string' },
  { field: 'active', header: 'Active', type: 'boolean' },
];

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------

function measure(label: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;
  console.log(`  [BENCH] ${label}: ${elapsed.toFixed(2)}ms`);
  return elapsed;
}

// ---------------------------------------------------------------------------
// Grid Creation Benchmarks
// ---------------------------------------------------------------------------

describe('Performance: Grid Creation', () => {
  it('1K rows', () => {
    const data = generateRows(1_000);
    const ms = measure('createGrid(1K rows)', () => {
      const grid = createGrid({ data, columns: COLUMNS });
      grid.destroy();
    });
    expect(ms).toBeLessThan(5000); // generous — just ensures it completes
  });

  it('10K rows', () => {
    const data = generateRows(10_000);
    const ms = measure('createGrid(10K rows)', () => {
      const grid = createGrid({ data, columns: COLUMNS });
      grid.destroy();
    });
    expect(ms).toBeLessThan(5000);
  });

  it('100K rows', () => {
    const data = generateRows(100_000);
    const ms = measure('createGrid(100K rows)', () => {
      const grid = createGrid({ data, columns: COLUMNS });
      grid.destroy();
    });
    expect(ms).toBeLessThan(10000);
  });
});

// ---------------------------------------------------------------------------
// Sort Benchmarks
// ---------------------------------------------------------------------------

describe('Performance: Sort', () => {
  it('sort 10K rows', () => {
    const data = generateRows(10_000);
    const grid = createGrid({ data, columns: COLUMNS });

    const ms = measure('sort(10K, revenue desc)', () => {
      grid.sort('revenue', 'desc');
    });

    const sorted = grid.getSortedRowModel().rows;
    expect(sorted[0].revenue >= sorted[sorted.length - 1].revenue).toBe(true);
    expect(ms).toBeLessThan(5000);
    grid.destroy();
  });

  it('sort 100K rows', () => {
    const data = generateRows(100_000);
    const grid = createGrid({ data, columns: COLUMNS });

    const ms = measure('sort(100K, revenue desc)', () => {
      grid.sort('revenue', 'desc');
    });

    expect(ms).toBeLessThan(10000);
    grid.destroy();
  });

  it('multi-sort 10K rows', () => {
    const data = generateRows(10_000);
    const grid = createGrid({ data, columns: COLUMNS });

    const ms = measure('multiSort(10K, region+revenue)', () => {
      grid.multiSort([
        { field: 'region', direction: 'asc' },
        { field: 'revenue', direction: 'desc' },
      ]);
    });

    expect(ms).toBeLessThan(5000);
    grid.destroy();
  });
});

// ---------------------------------------------------------------------------
// Filter Benchmarks
// ---------------------------------------------------------------------------

describe('Performance: Filter', () => {
  it('filter 10K rows by equals', () => {
    const data = generateRows(10_000);
    const grid = createGrid({ data, columns: COLUMNS });

    const ms = measure('filter(10K, region=EMEA)', () => {
      grid.addFilter('region', 'equals', 'EMEA');
    });

    const filtered = grid.getFilteredRowModel().rows;
    expect(filtered.length).toBe(2000); // 10K / 5 regions
    expect(ms).toBeLessThan(5000);
    grid.destroy();
  });

  it('filter 100K rows by equals', () => {
    const data = generateRows(100_000);
    const grid = createGrid({ data, columns: COLUMNS });

    const ms = measure('filter(100K, region=EMEA)', () => {
      grid.addFilter('region', 'equals', 'EMEA');
    });

    const filtered = grid.getFilteredRowModel().rows;
    expect(filtered.length).toBe(20000);
    expect(ms).toBeLessThan(10000);
    grid.destroy();
  });
});

// ---------------------------------------------------------------------------
// Aggregation Benchmarks (Engine)
// ---------------------------------------------------------------------------

describe('Performance: Engine Aggregation', () => {
  it('aggregate 10K rows (sum/avg/min/max)', () => {
    const data = generateRows(10_000);

    const ms = measure('computeAggregations(10K, 4 fns x 2 fields)', () => {
      computeAggregations(data, {
        fields: [
          { field: 'revenue', functions: ['sum', 'avg', 'min', 'max'] },
          { field: 'units', functions: ['sum', 'avg', 'min', 'max'] },
        ],
      });
    });

    expect(ms).toBeLessThan(5000);
  });

  it('aggregate 100K rows (sum/avg/min/max)', () => {
    const data = generateRows(100_000);

    const ms = measure('computeAggregations(100K, 4 fns x 2 fields)', () => {
      computeAggregations(data, {
        fields: [
          { field: 'revenue', functions: ['sum', 'avg', 'min', 'max'] },
          { field: 'units', functions: ['sum', 'avg', 'min', 'max'] },
        ],
      });
    });

    expect(ms).toBeLessThan(10000);
  });
});

// ---------------------------------------------------------------------------
// Combined Pipeline Benchmark
// ---------------------------------------------------------------------------

describe('Performance: Full Pipeline', () => {
  it('create + sort + filter + aggregate 10K rows', () => {
    const data = generateRows(10_000);

    const totalMs = measure('full pipeline(10K)', () => {
      const grid = createGrid({ data, columns: COLUMNS });
      grid.sort('revenue', 'desc');
      grid.addFilter('region', 'equals', 'EMEA');

      const filtered = grid.getFilteredRowModel().rows as Record<string, unknown>[];
      computeAggregations(filtered, {
        fields: [{ field: 'revenue', functions: ['sum', 'avg'] }],
      });

      grid.destroy();
    });

    expect(totalMs).toBeLessThan(5000);
  });
});
