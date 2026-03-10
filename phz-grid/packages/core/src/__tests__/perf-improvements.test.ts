/**
 * Sprint 2.4 — Performance Improvement Tests
 *
 * Perf 1: Column lookup uses Map instead of .find() in filter/sort
 * Perf 2: Grouped row model is cached
 * Perf 3: Anomaly detection uses Map for lookups
 */

import { describe, it, expect } from 'vitest';
import { createGrid } from '../create-grid.js';
import { filterRows, sortRows, buildCoreRowModel, parseData } from '../row-model.js';
import type { ColumnDefinition } from '../types/column.js';
import type { FilterState, SortState } from '../types/state.js';

describe('Perf 1: Column lookup Map in filter/sort', () => {
  const columns: ColumnDefinition[] = [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
    { field: 'score', header: 'Score', type: 'number' },
  ];

  const data = parseData([
    { name: 'Alice', age: 30, score: 95 },
    { name: 'Bob', age: 25, score: 80 },
    { name: 'Charlie', age: 35, score: 70 },
  ]);

  it('filterRows produces correct results (using Map internally)', () => {
    const model = buildCoreRowModel(data);
    const filterState: FilterState = {
      filters: [{ field: 'age', operator: 'greaterThan', value: 28 }],
      presets: {},
    };
    const result = filterRows(model, filterState, columns);
    expect(result.rowCount).toBe(2);
    const names = result.rows.map(r => r['name']);
    expect(names).toContain('Alice');
    expect(names).toContain('Charlie');
    expect(names).not.toContain('Bob');
  });

  it('sortRows produces correct results (using Map internally)', () => {
    const model = buildCoreRowModel(data);
    const sortState: SortState = {
      columns: [{ field: 'score', direction: 'desc' }],
    };
    const result = sortRows(model, sortState, columns);
    expect(result.rows[0]['name']).toBe('Alice');
    expect(result.rows[1]['name']).toBe('Bob');
    expect(result.rows[2]['name']).toBe('Charlie');
  });

  it('filterRows with valueGetter works via Map', () => {
    const customCols: ColumnDefinition[] = [
      {
        field: 'fullName',
        header: 'Full Name',
        type: 'string',
        valueGetter: (row) => String(row['name']).toUpperCase(),
      },
    ];
    const model = buildCoreRowModel(data);
    const filterState: FilterState = {
      filters: [{ field: 'fullName', operator: 'contains', value: 'ALI' }],
      presets: {},
    };
    const result = filterRows(model, filterState, customCols);
    expect(result.rowCount).toBe(1);
  });
});

describe('Perf 2: Grouped model cache', () => {
  it('getGroupedRowModel returns same reference when state unchanged', () => {
    const grid = createGrid({
      columns: [
        { field: 'dept', header: 'Department', type: 'string' },
        { field: 'name', header: 'Name', type: 'string' },
      ],
      data: [
        { dept: 'Eng', name: 'Alice' },
        { dept: 'Sales', name: 'Bob' },
        { dept: 'Eng', name: 'Charlie' },
      ],
    });

    grid.groupBy('dept');

    const result1 = grid.getGroupedRowModel();
    const result2 = grid.getGroupedRowModel();
    expect(result1).toBe(result2); // Same reference = cached
  });

  it('grouped model cache is invalidated on data change', () => {
    const grid = createGrid({
      columns: [
        { field: 'dept', header: 'Department', type: 'string' },
        { field: 'name', header: 'Name', type: 'string' },
      ],
      data: [
        { dept: 'Eng', name: 'Alice' },
        { dept: 'Sales', name: 'Bob' },
      ],
    });

    grid.groupBy('dept');
    const result1 = grid.getGroupedRowModel();

    grid.setData([
      { dept: 'Eng', name: 'Alice' },
      { dept: 'Sales', name: 'Bob' },
      { dept: 'Eng', name: 'Dave' },
    ]);

    const result2 = grid.getGroupedRowModel();
    expect(result2).not.toBe(result1); // Different after invalidation
  });

  it('grouped model cache is invalidated on sort change', () => {
    const grid = createGrid({
      columns: [
        { field: 'dept', header: 'Department', type: 'string' },
        { field: 'name', header: 'Name', type: 'string' },
      ],
      data: [
        { dept: 'Eng', name: 'Charlie' },
        { dept: 'Eng', name: 'Alice' },
      ],
    });

    grid.groupBy('dept');
    const result1 = grid.getGroupedRowModel();

    grid.sort('name', 'asc');
    const result2 = grid.getGroupedRowModel();
    expect(result2).not.toBe(result1);
  });
});
