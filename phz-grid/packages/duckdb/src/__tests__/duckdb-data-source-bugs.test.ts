/**
 * @phozart/duckdb — Data Source Bug Fix Tests
 *
 * Tests for P0 bug fixes in duckdb-data-source.ts:
 * - Task #7: .arrow/.ipc files should use Arrow format, not CSV
 * - Task #8: fromArrowTable() should batch INSERT, not row-by-row
 * - Task #9: query() params should use prepared statements, not string interpolation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDuckDBDataSource } from '../duckdb-data-source.js';
import type { DuckDBDataSource, ArrowTable, AsyncDuckDBConnection } from '../types.js';

/**
 * Helper: create a data source with mocked internals so we can test
 * loadFile, fromArrowTable, and query without real DuckDB-WASM.
 */
interface QueryCall {
  sql: string;
  params?: unknown[];
}

function createMockedDataSource() {
  const queries: string[] = [];
  const queryCalls: QueryCall[] = [];
  const mockConnection: AsyncDuckDBConnection = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      queries.push(sql);
      queryCalls.push({ sql, params });
      return {
        toArray: () => [],
        numRows: 0,
        schema: { fields: [] },
      };
    }),
    send: vi.fn(),
    close: vi.fn(),
    cancelSent: vi.fn(),
  };

  const mockDb = {
    open: vi.fn(),
    connect: vi.fn(async () => mockConnection),
    registerFileBuffer: vi.fn(),
    registerFileURL: vi.fn(),
    terminate: vi.fn(),
  };

  const ds = createDuckDBDataSource({});

  // Inject mocked internals via any-cast (private fields)
  const impl = ds as any;
  impl.db = mockDb;
  impl.connection = mockConnection;
  impl.connected = true;

  return { ds, queries, queryCalls, mockConnection, mockDb };
}

// ─────────────────────────────────────────────────────────────────────
// Task #7: .arrow/.ipc CSV fallback
// ─────────────────────────────────────────────────────────────────────
describe('Task #7: .arrow/.ipc file loading', () => {
  it('should NOT use read_csv for .arrow files', async () => {
    const { ds, queries, mockDb } = createMockedDataSource();
    await ds.loadFile('data.arrow', { tableName: 'test_arrow' });
    const createSql = queries[0];
    expect(createSql).not.toContain('read_csv');
  });

  it('should NOT use read_csv for .ipc files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.ipc', { tableName: 'test_ipc' });
    const createSql = queries[0];
    expect(createSql).not.toContain('read_csv');
  });

  it('should use a valid Arrow/IPC reader for .arrow files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.arrow', { tableName: 'test_arrow' });
    const createSql = queries[0];
    // DuckDB uses read_parquet for Arrow IPC files, or we can use
    // a scan function. The key point: NOT csv.
    // DuckDB >= 0.9 supports: FROM 'file.arrow' or read_ipc('file.arrow')
    // We expect the SQL to reference an Arrow-compatible reader
    expect(createSql).toMatch(/read_(?:arrow_ipc|ipc|arrow)/i);
  });

  it('should use a valid Arrow/IPC reader for .ipc files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.ipc', { tableName: 'test_ipc' });
    const createSql = queries[0];
    expect(createSql).toMatch(/read_(?:arrow_ipc|ipc|arrow)/i);
  });

  it('should still use csv for .csv files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.csv', { tableName: 'test_csv' });
    expect(queries[0]).toContain('read_csv');
  });

  it('should still use parquet for .parquet files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.parquet', { tableName: 'test_parquet' });
    expect(queries[0]).toContain('read_parquet');
  });

  it('should still use json for .json files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.json', { tableName: 'test_json' });
    expect(queries[0]).toContain('read_json');
  });

  it('should respect explicit format override for arrow files', async () => {
    const { ds, queries } = createMockedDataSource();
    await ds.loadFile('data.arrow', { tableName: 'test', format: 'csv' });
    expect(queries[0]).toContain('read_csv');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task #8: fromArrowTable() row-by-row INSERT
// ─────────────────────────────────────────────────────────────────────
describe('Task #8: fromArrowTable() batch INSERT', () => {
  function makeArrowTable(rows: Array<Record<string, unknown>>): ArrowTable {
    return {
      toArray: () => rows,
      numRows: rows.length,
      schema: {
        fields: rows.length > 0
          ? Object.keys(rows[0]).map(name => ({ name, type: 'VARCHAR', nullable: true }))
          : [],
      },
    };
  }

  it('should not issue one INSERT per row for multi-row tables', async () => {
    const { ds, queries } = createMockedDataSource();
    const rows = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `row_${i}`,
    }));
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'batch_test');

    // Count INSERT statements — should be far fewer than 100
    const insertCount = queries.filter(q => q.includes('INSERT INTO')).length;
    expect(insertCount).toBeLessThan(rows.length);
  });

  it('should load all rows correctly via batch INSERT', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'people');

    // All values should appear in the params array, not SQL string
    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    expect(insertCalls.length).toBeGreaterThan(0);
    const allParams = insertCalls.flatMap(c => c.params ?? []);
    expect(allParams).toContain(1);
    expect(allParams).toContain('Alice');
    expect(allParams).toContain(2);
    expect(allParams).toContain('Bob');
    expect(allParams).toContain(3);
    expect(allParams).toContain('Charlie');
  });

  it('should handle empty Arrow table gracefully', async () => {
    const { ds, queries } = createMockedDataSource();
    const table = makeArrowTable([]);

    await ds.fromArrowTable(table, 'empty_table');

    // Should create table but not INSERT
    const insertCount = queries.filter(q => q.includes('INSERT INTO')).length;
    expect(insertCount).toBe(0);
  });

  it('should handle NULL values in batch INSERT', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [
      { id: 1, name: null },
      { id: 2, name: 'Bob' },
    ];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'nulls_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    const allParams = insertCalls.flatMap(c => c.params ?? []);
    expect(allParams).toContain(null);
    expect(allParams).toContain('Bob');
  });

  it('should pass single quotes through params without manual escaping', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [
      { id: 1, name: "O'Brien" },
    ];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'escape_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    const allParams = insertCalls.flatMap(c => c.params ?? []);
    // With parameterized queries, values are passed as-is (no manual escaping)
    expect(allParams).toContain("O'Brien");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task #9a: fromArrowTable fallback — parameterized INSERT
// ─────────────────────────────────────────────────────────────────────
describe('Task #9a: fromArrowTable fallback uses parameterized queries', () => {
  function makeArrowTable(rows: Array<Record<string, unknown>>): ArrowTable {
    return {
      toArray: () => rows,
      numRows: rows.length,
      schema: {
        fields: rows.length > 0
          ? Object.keys(rows[0]).map(name => ({ name, type: 'VARCHAR', nullable: true }))
          : [],
      },
    };
  }

  it('fromArrowTable fallback uses ? placeholders not literal values', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [{ id: 1, name: 'Alice' }];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'param_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0].sql).toContain('?');
    expect(insertCalls[0].sql).not.toContain('Alice');
    expect(insertCalls[0].sql).not.toContain("'1'");
  });

  it('fromArrowTable fallback passes values as params array', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'params_array_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0].params).toBeDefined();
    expect(insertCalls[0].params).toEqual([1, 'Alice', 2, 'Bob']);
  });

  it('fromArrowTable SQL does not contain raw user values', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const malicious = "'; DROP TABLE users; --";
    const rows = [{ id: 1, name: malicious }];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'injection_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    // SQL should only contain placeholders, not the malicious string
    expect(insertCalls[0].sql).not.toContain('DROP');
    expect(insertCalls[0].sql).not.toContain(malicious);
    // But the value should be in the params
    expect(insertCalls[0].params).toContain(malicious);
  });

  it('fromArrowTable fallback converts undefined to null in params', async () => {
    const { ds, queryCalls } = createMockedDataSource();
    const rows = [{ id: 1, name: undefined }];
    const table = makeArrowTable(rows);

    await ds.fromArrowTable(table, 'undef_test');

    const insertCalls = queryCalls.filter(q => q.sql.includes('INSERT INTO'));
    expect(insertCalls[0].params).toEqual([1, null]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task #9: SQL injection prevention via positional parameter binding
// ─────────────────────────────────────────────────────────────────────
describe('Task #9: SQL injection prevention in query params', () => {
  it('should pass params directly to DuckDB (no string interpolation)', async () => {
    const { ds, mockConnection } = createMockedDataSource();
    const maliciousInput = "'; DROP TABLE users; --";

    await ds.query('SELECT * FROM t WHERE name = ?', [maliciousInput]);

    // SQL should NOT be modified — params are passed separately
    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE name = ?',
      [maliciousInput],
    );
  });

  it('should pass string params positionally', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t WHERE name = ?', ['Alice']);

    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE name = ?',
      ['Alice'],
    );
  });

  it('should pass numeric params positionally', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t WHERE id = ?', [42]);

    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE id = ?',
      [42],
    );
  });

  it('should pass boolean params positionally', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t WHERE active = ?', [true]);

    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE active = ?',
      [true],
    );
  });

  it('should pass null params positionally', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t WHERE name = ?', [null]);

    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE name = ?',
      [null],
    );
  });

  it('should pass multiple params positionally', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t WHERE id = ? AND name = ?', [42, 'Alice']);

    expect(mockConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE id = ? AND name = ?',
      [42, 'Alice'],
    );
  });

  it('should not pass params arg when no params provided', async () => {
    const { ds, mockConnection } = createMockedDataSource();

    await ds.query('SELECT * FROM t');

    expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM t');
  });
});
