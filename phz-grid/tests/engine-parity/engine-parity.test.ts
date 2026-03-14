/**
 * Engine Parity Conformance Tests
 *
 * Verifies that all three QueryBackend implementations (JS, DuckDB, Server)
 * produce identical results for the same queries. This is the guarantee
 * that lets consumers swap execution engines transparently.
 *
 * Each backend is configured with the same dataset and queried identically.
 * DuckDB and Server backends use mocks that mirror real SQL/API execution
 * but run entirely in-memory for deterministic testing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LocalQuery, LocalQueryResult, QueryBackend, QueryBackendCapabilities } from '@phozart/core';
import { createJSArrayQueryBackend } from '@phozart/core';
import { createDuckDBQueryBackend } from '@phozart/duckdb';
import { createServerQueryBackend } from '@phozart/shared/coordination';

// ========================================================================
// Shared test dataset
// ========================================================================

const testData = [
  { name: 'Alice', age: 30, department: 'Engineering' },
  { name: 'Bob', age: 25, department: 'Marketing' },
  { name: 'Charlie', age: 35, department: 'Engineering' },
  { name: 'Diana', age: 28, department: 'Sales' },
  { name: 'Eve', age: 32, department: 'Marketing' },
];

const columns = [
  { field: 'name', header: 'Name', type: 'string' as const },
  { field: 'age', header: 'Age', type: 'number' as const },
  { field: 'department', header: 'Dept', type: 'string' as const },
];

// ========================================================================
// Mock DuckDB SQL executor (in-memory JS that mimics SQL semantics)
// ========================================================================

function createMockDuckDBExecutor(data: Record<string, unknown>[]) {
  return async function executeSQL(sql: string): Promise<Record<string, unknown>[]> {
    // Parse COUNT queries
    if (sql.includes('COUNT(*)')) {
      let filtered = data;
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
      if (whereMatch) {
        filtered = applyWhereClause(data, whereMatch[1]);
      }
      return [{ cnt: filtered.length }];
    }

    // Parse SELECT queries
    let result = [...data];

    // Apply WHERE
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
    if (whereMatch) {
      result = applyWhereClause(result, whereMatch[1]);
    }

    // Apply ORDER BY
    const orderMatch = sql.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|\s+OFFSET|\s*$)/i);
    if (orderMatch) {
      result = applyOrderBy(result, orderMatch[1]);
    }

    // Apply LIMIT/OFFSET
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
    const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
    if (offset > 0) result = result.slice(offset);
    if (limitMatch) result = result.slice(0, parseInt(limitMatch[1]));

    // Apply field selection
    const fieldsMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (fieldsMatch && fieldsMatch[1] !== '*') {
      const fields = fieldsMatch[1].split(',').map(f =>
        f.trim().replace(/"/g, '')
      );
      result = result.map(row => {
        const out: Record<string, unknown> = {};
        for (const field of fields) {
          out[field] = row[field];
        }
        return out;
      });
    }

    return result;
  };
}

function applyWhereClause(data: Record<string, unknown>[], clause: string): Record<string, unknown>[] {
  const conditions = clause.split(/\s+AND\s+/i);
  return data.filter(row => {
    return conditions.every(cond => {
      // Handle string equality: "field" = 'value'
      const eqMatch = cond.match(/"(\w+)"\s*=\s*'([^']*)'/);
      if (eqMatch) return row[eqMatch[1]] === eqMatch[2];

      // Handle numeric comparisons: "field" > value
      const numGtMatch = cond.match(/"(\w+)"\s*>\s*(\d+)/);
      if (numGtMatch) return Number(row[numGtMatch[1]]) > Number(numGtMatch[2]);

      const numGteMatch = cond.match(/"(\w+)"\s*>=\s*(\d+)/);
      if (numGteMatch) return Number(row[numGteMatch[1]]) >= Number(numGteMatch[2]);

      const numLtMatch = cond.match(/"(\w+)"\s*<\s*(\d+)/);
      if (numLtMatch) return Number(row[numLtMatch[1]]) < Number(numLtMatch[2]);

      const numLteMatch = cond.match(/"(\w+)"\s*<=\s*(\d+)/);
      if (numLteMatch) return Number(row[numLteMatch[1]]) <= Number(numLteMatch[2]);

      // Handle LIKE: "field" LIKE '%value%'
      const likeMatch = cond.match(/"(\w+)"\s+LIKE\s+'%([^']*)%'/i);
      if (likeMatch) return String(row[likeMatch[1]]).includes(likeMatch[2]);

      return true;
    });
  });
}

function applyOrderBy(data: Record<string, unknown>[], clause: string): Record<string, unknown>[] {
  const parts = clause.split(',').map(p => p.trim());
  const sorted = [...data];

  for (const part of parts.reverse()) {
    const match = part.match(/"(\w+)"\s+(ASC|DESC)/i);
    if (!match) continue;
    const field = match[1];
    const dir = match[2].toUpperCase() === 'ASC' ? 1 : -1;
    sorted.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av < bv ? -1 : 1) * dir;
    });
  }

  return sorted;
}

// ========================================================================
// Mock Server DataAdapter
// ========================================================================

function createMockServerAdapter(data: Record<string, unknown>[]) {
  return {
    async execute(query: any) {
      let result = [...data];

      // Apply filters
      if (query.filters?.length > 0) {
        for (const f of query.filters) {
          result = result.filter(row => {
            const val = row[f.field];
            switch (f.operator) {
              case 'equals': return val === f.value;
              case 'greaterThan': return Number(val) > Number(f.value);
              case 'lessThan': return Number(val) < Number(f.value);
              case 'contains': return String(val).includes(String(f.value));
              default: return true;
            }
          });
        }
      }

      // Apply sort
      if (query.sort?.length > 0) {
        for (const s of [...query.sort].reverse()) {
          const dir = s.direction === 'asc' ? 1 : -1;
          result.sort((a, b) => {
            const av = a[s.field];
            const bv = b[s.field];
            if (av === bv) return 0;
            if (av === null || av === undefined) return 1;
            if (bv === null || bv === undefined) return -1;
            return (av < bv ? -1 : 1) * dir;
          });
        }
      }

      const totalRows = data.length;

      // Apply offset/limit
      const offset = query.offset ?? 0;
      if (offset > 0) result = result.slice(offset);
      if (query.limit) result = result.slice(0, query.limit);

      // Apply field selection
      if (query.fields?.length > 0) {
        result = result.map((row: Record<string, unknown>) => {
          const out: Record<string, unknown> = {};
          for (const field of query.fields) {
            out[field] = row[field];
          }
          return out;
        });
      }

      return { rows: result, metadata: { totalRows } };
    },
    async getSchema() { return { columns: [] }; },
    async listDataSources() { return []; },
  };
}

// ========================================================================
// Create all three backends
// ========================================================================

function createBackends() {
  const jsBackend = createJSArrayQueryBackend(testData, columns);

  const duckDbBackend = createDuckDBQueryBackend({
    tableName: 'test_table',
    executeSQL: createMockDuckDBExecutor(testData as Record<string, unknown>[]),
  });

  const serverBackend = createServerQueryBackend({
    adapter: createMockServerAdapter(testData as Record<string, unknown>[]) as any,
    sourceId: 'test-source',
  });

  return { jsBackend, duckDbBackend, serverBackend };
}

// ========================================================================
// Helper to compare results across engines (ignoring engine-specific fields)
// ========================================================================

function assertRowsParity(
  jsResult: LocalQueryResult,
  duckResult: LocalQueryResult,
  serverResult: LocalQueryResult,
) {
  // Row data should be identical across all three
  expect(jsResult.rows).toEqual(duckResult.rows);
  expect(jsResult.rows).toEqual(serverResult.rows);

  // Row counts should match
  expect(jsResult.filteredCount).toBe(duckResult.filteredCount);
  expect(jsResult.totalCount).toBe(duckResult.totalCount);
}

// ========================================================================
// Conformance tests
// ========================================================================

describe('Engine Parity — cross-backend conformance', () => {
  it('unfiltered unsorted query returns same rows', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = { filters: [], sort: [], groupBy: [] };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    expect(jsResult.rows).toHaveLength(5);
    expect(duckResult.rows).toHaveLength(5);
    expect(serverResult.rows).toHaveLength(5);
    expect(jsResult.totalCount).toBe(5);
    expect(duckResult.totalCount).toBe(5);
  });

  it('sorted by age ascending returns same order', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'age', direction: 'asc' }],
      groupBy: [],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    // All should be: Bob(25), Diana(28), Alice(30), Eve(32), Charlie(35)
    expect(jsNames).toEqual(['Bob', 'Diana', 'Alice', 'Eve', 'Charlie']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('sorted by age descending returns same order', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'age', direction: 'desc' }],
      groupBy: [],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    expect(jsNames).toEqual(['Charlie', 'Eve', 'Alice', 'Diana', 'Bob']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('equality filter returns same rows', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [{ field: 'department', operator: 'equals', value: 'Engineering' }],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    expect(jsNames).toEqual(['Alice', 'Charlie']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('numeric greater-than filter returns same rows', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [{ field: 'age', operator: 'greaterThan', value: 30 }],
      sort: [{ field: 'age', direction: 'asc' }],
      groupBy: [],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    // age > 30: Eve(32), Charlie(35)
    expect(jsNames).toEqual(['Eve', 'Charlie']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('pagination with limit returns same subset', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
      limit: 3,
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    // First 3 alphabetically: Alice, Bob, Charlie
    expect(jsNames).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('pagination with offset+limit returns same page', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
      offset: 2,
      limit: 2,
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    // Skip 2, take 2: Charlie, Diana
    expect(jsNames).toEqual(['Charlie', 'Diana']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('field selection returns same projected columns', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
      fields: ['name', 'age'],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    // All rows should have only name and age
    for (const result of [jsResult, duckResult, serverResult]) {
      for (const row of result.rows) {
        expect(Object.keys(row).sort()).toEqual(['age', 'name']);
      }
    }

    // Same values
    expect(jsResult.rows).toEqual(duckResult.rows);
    expect(jsResult.rows).toEqual(serverResult.rows);
  });

  it('filter + sort + limit combined returns same results', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [{ field: 'age', operator: 'greaterThan', value: 25 }],
      sort: [{ field: 'age', direction: 'desc' }],
      groupBy: [],
      limit: 2,
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    const jsNames = jsResult.rows.map(r => r.name);
    const duckNames = duckResult.rows.map(r => r.name);
    const serverNames = serverResult.rows.map(r => r.name);

    // age > 25 sorted desc: Charlie(35), Eve(32), Alice(30), Diana(28) → take 2: Charlie, Eve
    expect(jsNames).toEqual(['Charlie', 'Eve']);
    expect(duckNames).toEqual(jsNames);
    expect(serverNames).toEqual(jsNames);
  });

  it('execution engine labels differ but data matches', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = { filters: [], sort: [], groupBy: [] };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    expect(jsResult.executionEngine).toBe('js-compute');
    expect(duckResult.executionEngine).toBe('duckdb-wasm');
    expect(serverResult.executionEngine).toBe('server');

    // All should have non-negative execution time
    expect(jsResult.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(duckResult.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(serverResult.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('capabilities correctly reflect engine abilities', () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();

    const jsCaps = jsBackend.getCapabilities();
    const duckCaps = duckDbBackend.getCapabilities();
    const serverCaps = serverBackend.getCapabilities();

    // All support filter, sort, pagination
    expect(jsCaps.filter).toBe(true);
    expect(duckCaps.filter).toBe(true);
    expect(serverCaps.filter).toBe(true);
    expect(jsCaps.sort).toBe(true);
    expect(duckCaps.sort).toBe(true);
    expect(serverCaps.sort).toBe(true);
    expect(jsCaps.pagination).toBe(true);
    expect(duckCaps.pagination).toBe(true);
    expect(serverCaps.pagination).toBe(true);

    // DuckDB supports aggregate, JS and server don't
    expect(duckCaps.aggregate).toBe(true);
    expect(jsCaps.aggregate).toBe(false);
    expect(serverCaps.aggregate).toBe(false);
  });

  it('empty result from filter returns same across engines', async () => {
    const { jsBackend, duckDbBackend, serverBackend } = createBackends();
    const query: LocalQuery = {
      filters: [{ field: 'department', operator: 'equals', value: 'NonExistent' }],
      sort: [],
      groupBy: [],
    };

    const [jsResult, duckResult, serverResult] = await Promise.all([
      jsBackend.execute(query),
      duckDbBackend.execute(query),
      serverBackend.execute(query),
    ]);

    expect(jsResult.rows).toHaveLength(0);
    expect(duckResult.rows).toHaveLength(0);
    expect(serverResult.rows).toHaveLength(0);
    expect(jsResult.filteredCount).toBe(0);
    expect(duckResult.filteredCount).toBe(0);
  });
});
