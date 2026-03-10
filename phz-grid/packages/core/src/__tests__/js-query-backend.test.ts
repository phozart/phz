import { describe, it, expect } from 'vitest';
import { createJSArrayQueryBackend } from '../js-query-backend.js';
import type { LocalQuery } from '../types/query-backend.js';

const SAMPLE_DATA = [
  { name: 'Alice', age: 30, department: 'Engineering' },
  { name: 'Bob', age: 25, department: 'Sales' },
  { name: 'Charlie', age: 35, department: 'Engineering' },
  { name: 'Diana', age: 28, department: 'Marketing' },
  { name: 'Eve', age: 32, department: 'Sales' },
];

const COLUMNS = [
  { field: 'name', type: 'string' as const, sortable: true, filterable: true },
  { field: 'age', type: 'number' as const, sortable: true, filterable: true },
  { field: 'department', type: 'string' as const, sortable: true, filterable: true },
];

describe('createJSArrayQueryBackend', () => {
  it('returns all rows for empty query', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.filteredCount).toBe(5);
    expect(result.executionEngine).toBe('js-compute');
  });

  it('filters rows by equals operator', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [{ field: 'department', operator: 'equals', value: 'Engineering' }],
      sort: [],
      groupBy: [],
    };
    const result = await backend.execute(query);
    expect(result.filteredCount).toBe(2);
    expect(result.rows.every(r => r.department === 'Engineering')).toBe(true);
    expect(result.totalCount).toBe(5);
  });

  it('sorts rows ascending', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'age', direction: 'asc' }],
      groupBy: [],
    };
    const result = await backend.execute(query);
    expect(result.rows[0].age).toBe(25);
    expect(result.rows[4].age).toBe(35);
  });

  it('sorts rows descending', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'desc' }],
      groupBy: [],
    };
    const result = await backend.execute(query);
    expect(result.rows[0].name).toBe('Eve');
    expect(result.rows[4].name).toBe('Alice');
  });

  it('applies pagination with offset and limit', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
      offset: 1,
      limit: 2,
    };
    const result = await backend.execute(query);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Bob');
    expect(result.rows[1].name).toBe('Charlie');
    expect(result.totalCount).toBe(5);
    expect(result.filteredCount).toBe(5);
  });

  it('applies field selection', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      fields: ['name', 'age'],
    };
    const result = await backend.execute(query);
    expect(result.rows[0]).toHaveProperty('name');
    expect(result.rows[0]).toHaveProperty('age');
    expect(result.rows[0]).not.toHaveProperty('department');
  });

  it('combines filter and sort', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const query: LocalQuery = {
      filters: [{ field: 'department', operator: 'equals', value: 'Sales' }],
      sort: [{ field: 'age', direction: 'asc' }],
      groupBy: [],
    };
    const result = await backend.execute(query);
    expect(result.filteredCount).toBe(2);
    expect(result.rows[0].name).toBe('Bob');
    expect(result.rows[1].name).toBe('Eve');
  });

  it('reports capabilities correctly', () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const caps = backend.getCapabilities();
    expect(caps.filter).toBe(true);
    expect(caps.sort).toBe(true);
    expect(caps.group).toBe(true);
    expect(caps.aggregate).toBe(false);
    expect(caps.pagination).toBe(true);
  });

  it('strips __id from output rows', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    for (const row of result.rows) {
      expect(row).not.toHaveProperty('__id');
    }
  });

  it('includes execution time', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(typeof result.executionTimeMs).toBe('number');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('destroy clears internal data', async () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    backend.destroy!();
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('handles empty data array', async () => {
    const backend = createJSArrayQueryBackend([], COLUMNS);
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.filteredCount).toBe(0);
  });
});
