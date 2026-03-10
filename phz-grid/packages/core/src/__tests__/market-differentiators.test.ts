/**
 * TDD RED — Market Differentiators (Item 6.12)
 *
 * Tests for:
 * - DIFF-2: Auto-configure mode (data → inferSchema → columns)
 * - DIFF-9: Data quality metrics aggregation
 * - DIFF-1/5: DuckDB + AI integration wiring verification
 */
import { describe, it, expect } from 'vitest';
import { createGrid } from '../create-grid.js';
import { computeDataQualityMetrics, type DataQualityMetrics } from '../data-quality.js';

// --- DIFF-2: Auto-configure mode ---

describe('DIFF-2: Auto-configure createGrid', () => {
  it('creates grid with only data (auto-infers columns)', () => {
    const grid = createGrid({
      data: [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false },
      ],
    });
    const columns = grid.getAccessibleColumns();
    expect(columns.length).toBeGreaterThanOrEqual(2);
    expect(columns.find(c => c.field === 'name')).toBeDefined();
    expect(columns.find(c => c.field === 'age')).toBeDefined();
  });

  it('auto-inferred columns have correct types', () => {
    const grid = createGrid({
      data: [
        { name: 'Alice', age: 30, active: true, joined: '2024-01-15' },
        { name: 'Bob', age: 25, active: false, joined: '2024-02-20' },
      ],
    });
    const columns = grid.getAccessibleColumns();
    const ageCol = columns.find(c => c.field === 'age');
    const activeCol = columns.find(c => c.field === 'active');
    expect(ageCol?.type).toBe('number');
    expect(activeCol?.type).toBe('boolean');
  });

  it('explicit columns override auto-inference', () => {
    const grid = createGrid({
      data: [{ name: 'Alice', age: 30 }],
      columns: [{ field: 'name', header: 'Full Name' }],
    });
    const columns = grid.getAccessibleColumns();
    expect(columns).toHaveLength(1);
    expect(columns[0].header).toBe('Full Name');
  });
});

// --- DIFF-9: Data Quality Metrics ---

describe('DIFF-9: Data Quality Metrics', () => {
  it('computes completeness score', () => {
    const data = [
      { name: 'Alice', age: 30, email: 'a@b.c' },
      { name: 'Bob', age: null, email: null },
      { name: null, age: 25, email: 'c@d.e' },
    ];
    const metrics = computeDataQualityMetrics(data, ['name', 'age', 'email']);
    // 6 non-null out of 9 total cells = ~66.7% (3 nulls: age=null, email=null, name=null)
    expect(metrics.completeness).toBeCloseTo(6 / 9, 2);
  });

  it('counts missing values per field', () => {
    const data = [
      { name: 'Alice', age: null },
      { name: null, age: null },
      { name: 'Charlie', age: 25 },
    ];
    const metrics = computeDataQualityMetrics(data, ['name', 'age']);
    expect(metrics.missingByField['name']).toBe(1);
    expect(metrics.missingByField['age']).toBe(2);
  });

  it('computes total row and field counts', () => {
    const data = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const metrics = computeDataQualityMetrics(data, ['a', 'b']);
    expect(metrics.totalRows).toBe(2);
    expect(metrics.totalFields).toBe(2);
  });

  it('detects duplicate rows', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const metrics = computeDataQualityMetrics(data, ['name', 'age']);
    expect(metrics.duplicateRows).toBe(1);
  });

  it('returns health grade based on completeness', () => {
    const perfect = computeDataQualityMetrics(
      [{ a: 1 }, { a: 2 }],
      ['a'],
    );
    expect(perfect.healthGrade).toBe('A');

    const poor = computeDataQualityMetrics(
      [{ a: null }, { a: null }, { a: null }, { a: 1 }],
      ['a'],
    );
    // 1 out of 4 = 25% completeness
    expect(['D', 'F']).toContain(poor.healthGrade);
  });

  it('handles empty data', () => {
    const metrics = computeDataQualityMetrics([], ['a', 'b']);
    expect(metrics.totalRows).toBe(0);
    expect(metrics.completeness).toBe(1); // No data = fully complete (vacuously true)
    expect(metrics.healthGrade).toBe('A');
  });
});
