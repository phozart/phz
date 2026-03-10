import { describe, it, expect, vi } from 'vitest';
import { createDuckDBQueryBackend } from '../duckdb-query-backend.js';
import type { LocalQuery } from '@phozart/phz-core';

const SAMPLE_DATA = [
  { name: 'Alice', age: 30, dept: 'Eng' },
  { name: 'Bob', age: 25, dept: 'Sales' },
  { name: 'Charlie', age: 35, dept: 'Eng' },
];

function createMockExecuteSQL() {
  return vi.fn(async (sql: string) => {
    if (sql.includes('COUNT(*)')) {
      return [{ cnt: SAMPLE_DATA.length }];
    }
    return [...SAMPLE_DATA];
  });
}

describe('createDuckDBQueryBackend', () => {
  it('executes basic query', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toEqual(SAMPLE_DATA);
    expect(result.executionEngine).toBe('duckdb-wasm');
    expect(result.totalCount).toBe(3);
    expect(result.filteredCount).toBe(3);
  });

  it('builds WHERE clause for filters', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const query: LocalQuery = {
      filters: [{ field: 'dept', operator: 'equals', value: 'Eng' }],
      sort: [],
      groupBy: [],
    };
    await backend.execute(query);

    const dataCalls = executeSQL.mock.calls.filter(
      c => !c[0].includes('COUNT(*)')
    );
    expect(dataCalls[0][0]).toContain('WHERE');
    expect(dataCalls[0][0]).toContain("'Eng'");
  });

  it('builds ORDER BY clause for sorts', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'age', direction: 'asc' }],
      groupBy: [],
    };
    await backend.execute(query);

    const dataCalls = executeSQL.mock.calls.filter(
      c => !c[0].includes('COUNT(*)')
    );
    expect(dataCalls[0][0]).toContain('ORDER BY');
    expect(dataCalls[0][0]).toContain('ASC');
  });

  it('builds LIMIT/OFFSET for pagination', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      offset: 10,
      limit: 25,
    };
    await backend.execute(query);

    const dataCalls = executeSQL.mock.calls.filter(
      c => !c[0].includes('COUNT(*)')
    );
    expect(dataCalls[0][0]).toContain('LIMIT 25');
    expect(dataCalls[0][0]).toContain('OFFSET 10');
  });

  it('selects specific fields', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      fields: ['name', 'age'],
    };
    await backend.execute(query);

    const dataCalls = executeSQL.mock.calls.filter(
      c => !c[0].includes('COUNT(*)')
    );
    expect(dataCalls[0][0]).toMatch(/SELECT\s+"name",\s*"age"/);
  });

  it('reports full capabilities', () => {
    const backend = createDuckDBQueryBackend({
      tableName: 't',
      executeSQL: async () => [],
    });
    const caps = backend.getCapabilities();
    expect(caps.filter).toBe(true);
    expect(caps.sort).toBe(true);
    expect(caps.group).toBe(true);
    expect(caps.aggregate).toBe(true);
    expect(caps.pagination).toBe(true);
  });

  it('includes execution time', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(typeof result.executionTimeMs).toBe('number');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('handles contains operator', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'name', operator: 'contains', value: 'li' }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain("LIKE '%li%'");
  });

  it('handles startsWith operator', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'name', operator: 'startsWith', value: 'Al' }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain("LIKE 'Al%'");
  });

  it('handles endsWith operator', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'name', operator: 'endsWith', value: 'ce' }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain("LIKE '%ce'");
  });

  it('handles null value filters', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'dept', operator: 'equals', value: null }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain('IS NULL');
  });

  it('handles null value with notEquals operator', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'dept', operator: 'notEquals', value: null }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain('IS NOT NULL');
  });

  it('handles numeric value filters', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'age', operator: 'greaterThan', value: 30 }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain('> 30');
  });

  it('sanitizes table name in generated SQL', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'my_table',
      executeSQL,
    });

    await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(executeSQL.mock.calls[0][0]).toContain('"my_table"');
  });

  it('escapes single quotes in string values', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [{ field: 'name', operator: 'equals', value: "O'Brien" }],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain("O''Brien");
  });

  it('handles multiple filters with AND', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [
        { field: 'dept', operator: 'equals', value: 'Eng' },
        { field: 'age', operator: 'greaterThan', value: 25 },
      ],
      sort: [],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain(' AND ');
  });

  it('handles multiple sort fields', async () => {
    const executeSQL = createMockExecuteSQL();
    const backend = createDuckDBQueryBackend({
      tableName: 'test_table',
      executeSQL,
    });

    await backend.execute({
      filters: [],
      sort: [
        { field: 'dept', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ],
      groupBy: [],
    });

    const dataCalls = executeSQL.mock.calls.filter(c => !c[0].includes('COUNT(*)'));
    expect(dataCalls[0][0]).toContain('"dept" ASC');
    expect(dataCalls[0][0]).toContain('"age" DESC');
  });

  it('returns a fresh capabilities object each call', () => {
    const backend = createDuckDBQueryBackend({
      tableName: 't',
      executeSQL: async () => [],
    });
    const caps1 = backend.getCapabilities();
    const caps2 = backend.getCapabilities();
    expect(caps1).not.toBe(caps2);
    expect(caps1).toEqual(caps2);
  });
});
