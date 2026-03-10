import { describe, it, expect } from 'vitest';
import { inferColumns, detectColumnType, formatFieldAsHeader } from '../infer-columns.js';
import { createGrid } from '../create-grid.js';
import type { ColumnDefinition } from '../types/column.js';

// ─── formatFieldAsHeader ───────────────────────────────────────────

describe('formatFieldAsHeader', () => {
  it('converts camelCase to title case', () => {
    expect(formatFieldAsHeader('firstName')).toBe('First Name');
  });

  it('converts snake_case to title case', () => {
    expect(formatFieldAsHeader('first_name')).toBe('First Name');
  });

  it('handles single character', () => {
    expect(formatFieldAsHeader('x')).toBe('X');
  });

  it('handles empty string', () => {
    expect(formatFieldAsHeader('')).toBe('');
  });

  it('handles consecutive caps (e.g. totalRevenueUSD)', () => {
    expect(formatFieldAsHeader('totalRevenueUSD')).toBe('Total Revenue USD');
  });
});

// ─── detectColumnType ──────────────────────────────────────────────

describe('detectColumnType', () => {
  it('detects all strings', () => {
    expect(detectColumnType(['hello', 'world', 'foo'])).toBe('string');
  });

  it('detects all numbers', () => {
    expect(detectColumnType([1, 2, 3.5, -7])).toBe('number');
  });

  it('detects all booleans', () => {
    expect(detectColumnType([true, false, true])).toBe('boolean');
  });

  it('detects ISO date strings', () => {
    expect(detectColumnType(['2024-01-15', '2024-06-30', '2023-12-25'])).toBe('date');
  });

  it('detects Date objects', () => {
    expect(detectColumnType([new Date(), new Date('2024-01-01')])).toBe('date');
  });

  it('falls back to string for mixed types', () => {
    expect(detectColumnType([1, 'hello', true])).toBe('string');
  });

  it('returns string for all nulls/undefined', () => {
    expect(detectColumnType([null, undefined, null])).toBe('string');
  });

  it('detects number with nulls mixed in', () => {
    expect(detectColumnType([1, null, 3, undefined, 5])).toBe('number');
  });
});

// ─── inferColumns ──────────────────────────────────────────────────

describe('inferColumns', () => {
  it('returns empty array for empty data', () => {
    expect(inferColumns([])).toEqual([]);
  });

  it('returns empty array for non-object data', () => {
    expect(inferColumns([1, 2, 3] as any)).toEqual([]);
  });

  it('infers all four column types', () => {
    const data = [
      { name: 'Alice', age: 30, active: true, joined: '2024-01-15' },
      { name: 'Bob', age: 25, active: false, joined: '2024-06-30' },
    ];
    const cols = inferColumns(data);
    expect(cols).toHaveLength(4);

    const byField = Object.fromEntries(cols.map(c => [c.field, c]));
    expect(byField.name.type).toBe('string');
    expect(byField.age.type).toBe('number');
    expect(byField.active.type).toBe('boolean');
    expect(byField.joined.type).toBe('date');
  });

  it('filters out internal fields (__id, _private)', () => {
    const data = [{ __id: '1', _internal: 'x', name: 'Alice' }];
    const cols = inferColumns(data);
    expect(cols).toHaveLength(1);
    expect(cols[0].field).toBe('name');
  });

  it('respects custom sampleSize', () => {
    // 2 rows number, 1 row string — sample only 2 should give number
    const data = [
      { val: 1 },
      { val: 2 },
      { val: 'three' },
    ];
    const cols = inferColumns(data, { sampleSize: 2 });
    expect(cols[0].type).toBe('number');
  });

  it('preserves column order from data keys', () => {
    const data = [{ z: 1, a: 2, m: 3 }];
    const cols = inferColumns(data);
    expect(cols.map(c => c.field)).toEqual(['z', 'a', 'm']);
  });

  it('sets sortable and filterable to true', () => {
    const data = [{ x: 1 }];
    const cols = inferColumns(data);
    expect(cols[0].sortable).toBe(true);
    expect(cols[0].filterable).toBe(true);
  });
});

// ─── createGrid integration ────────────────────────────────────────

describe('createGrid with auto-inference', () => {
  it('works without explicit columns', () => {
    const grid = createGrid({
      data: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    });
    expect(grid.getData()).toHaveLength(2);
    // State should have column info
    const state = grid.getState();
    expect(state.columns.order).toContain('name');
    expect(state.columns.order).toContain('age');
  });

  it('sort works on inferred columns', () => {
    const grid = createGrid({
      data: [
        { name: 'Charlie', age: 35 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    });
    grid.sort('age', 'asc');
    const sorted = grid.getSortedRowModel();
    expect(sorted.rows[0].age).toBe(25);
    expect(sorted.rows[2].age).toBe(35);
  });

  it('CSV export works on inferred columns', () => {
    const grid = createGrid({
      data: [
        { name: 'Alice', age: 30 },
      ],
    });
    const csv = grid.exportCsv();
    expect(csv).toContain('Name');
    expect(csv).toContain('Age');
    expect(csv).toContain('Alice');
    expect(csv).toContain('30');
  });

  it('autoColumns: false suppresses inference', () => {
    const grid = createGrid({
      data: [{ name: 'Alice', age: 30 }],
      autoColumns: false,
    });
    const state = grid.getState();
    expect(state.columns.order).toEqual([]);
  });
});
