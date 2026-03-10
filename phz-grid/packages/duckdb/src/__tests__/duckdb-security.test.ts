/**
 * @phozart/phz-duckdb — Security Tests (Sprint 1.1 + 1.2)
 *
 * TDD RED: Tests for SQL statement allowlist, load option injection,
 * and positional parameter binding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDuckDBDataSource } from '../duckdb-data-source.js';
import type { DuckDBDataSource, AsyncDuckDBConnection, ArrowTable } from '../types.js';

/**
 * Helper: create a data source with a mocked connection so we can call
 * query / executeSQL without a real DuckDB instance.
 */
function createConnectedDataSource(): {
  ds: DuckDBDataSource;
  mockQuery: ReturnType<typeof vi.fn>;
  mockSend: ReturnType<typeof vi.fn>;
} {
  const mockQuery = vi.fn(async () => ({
    toArray: () => [],
    numRows: 0,
    schema: { fields: [] },
  }));
  const mockSend = vi.fn(async () => ({
    async *[Symbol.asyncIterator]() {},
  }));

  const ds = createDuckDBDataSource({});

  // Reach into the instance to set connected state and mock connection.
  // The class is private, so we use Object.assign on the instance.
  const impl = ds as unknown as Record<string, unknown>;
  impl['connected'] = true;
  impl['connection'] = {
    query: mockQuery,
    send: mockSend,
    close: vi.fn(),
    cancelSent: vi.fn(),
  } satisfies AsyncDuckDBConnection;
  impl['db'] = {} as unknown; // non-null so getDatabase() works

  return { ds, mockQuery, mockSend };
}

// ─── Task 1: executeSQL statement allowlist ──────────────────────────

describe('executeSQL security', () => {
  let ds: DuckDBDataSource;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ ds, mockQuery } = createConnectedDataSource());
  });

  describe('rejects dangerous statements', () => {
    const dangerous = [
      { name: 'DROP TABLE', sql: 'DROP TABLE users' },
      { name: 'DROP TABLE (lower)', sql: 'drop table users' },
      { name: 'DELETE FROM', sql: 'DELETE FROM users WHERE 1=1' },
      { name: 'INSERT INTO', sql: 'INSERT INTO users VALUES (1)' },
      { name: 'UPDATE', sql: 'UPDATE users SET name = "hacked"' },
      { name: 'CREATE TABLE', sql: 'CREATE TABLE pwned (id INT)' },
      { name: 'ALTER TABLE', sql: 'ALTER TABLE users ADD COLUMN pwn INT' },
      { name: 'COPY TO', sql: "COPY users TO '/tmp/dump.csv'" },
      { name: 'ATTACH', sql: "ATTACH 'evil.db'" },
      { name: 'DETACH', sql: 'DETACH db2' },
      { name: 'TRUNCATE', sql: 'TRUNCATE TABLE users' },
      { name: 'GRANT', sql: 'GRANT ALL ON users TO hacker' },
      { name: 'PRAGMA (write)', sql: 'PRAGMA enable_object_cache' },
      { name: 'SET', sql: "SET memory_limit = '100GB'" },
      { name: 'INSTALL', sql: 'INSTALL httpfs' },
      { name: 'LOAD', sql: 'LOAD httpfs' },
    ];

    for (const { name, sql } of dangerous) {
      it(`should reject ${name} statements`, async () => {
        await expect(ds.executeSQL(sql)).rejects.toThrow();
        expect(mockQuery).not.toHaveBeenCalled();
      });
    }
  });

  describe('allows safe read-only statements', () => {
    const safe = [
      { name: 'SELECT', sql: 'SELECT * FROM users' },
      { name: 'SELECT (lower)', sql: 'select * from users' },
      { name: 'SELECT with leading space', sql: '  SELECT 1' },
      { name: 'WITH ... SELECT', sql: 'WITH cte AS (SELECT 1) SELECT * FROM cte' },
      { name: 'EXPLAIN', sql: 'EXPLAIN SELECT * FROM users' },
      { name: 'DESCRIBE', sql: 'DESCRIBE users' },
      { name: 'SHOW', sql: 'SHOW TABLES' },
    ];

    for (const { name, sql } of safe) {
      it(`should allow ${name} statements`, async () => {
        await ds.executeSQL(sql);
        expect(mockQuery).toHaveBeenCalledWith(sql);
      });
    }
  });
});

// ─── Task 1: buildLoadOptions delimiter / compression injection ──────

describe('buildLoadOptions security', () => {
  let ds: DuckDBDataSource;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ ds, mockQuery } = createConnectedDataSource());
  });

  // We test loadFile indirectly since buildLoadOptions is private.
  // loadFile calls connection.query with the built SQL including load options.
  // We register a fake file buffer to avoid the File API.

  it('should reject multi-character delimiter', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { delimiter: '||' });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).not.toContain('delim=');
  });

  it('should reject delimiter containing SQL injection', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { delimiter: "'; DROP TABLE users; --" });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).not.toContain('delim=');
  });

  it('should accept valid single-char delimiter', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { delimiter: '|' });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).toContain("delim='|'");
  });

  it('should accept valid tab delimiter', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { delimiter: '\t' });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).toContain('delim=');
  });

  it('should reject unknown compression value', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { compression: "gzip'; DROP TABLE x; --" as any });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).not.toContain('compression=');
    expect(sql).not.toContain('DROP TABLE');
  });

  it('should accept valid compression values', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { compression: 'gzip' });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).toContain("compression='gzip'");
  });

  it('should not include compression for auto value', async () => {
    const impl = ds as unknown as Record<string, unknown>;
    impl['db'] = { registerFileBuffer: vi.fn(), registerFileURL: vi.fn() };

    await ds.loadFile('/data/test.csv', { compression: 'auto' });

    const sql = mockQuery.mock.calls[0]?.[0] as string;
    expect(sql).not.toContain('compression=');
  });
});

// ─── Task 2: Positional parameter binding ────────────────────────────

describe('parameter binding', () => {
  let ds: DuckDBDataSource;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ ds, mockQuery } = createConnectedDataSource());
  });

  it('should pass positional params array to connection.query', async () => {
    const params = ['hello', 42];
    await ds.query('SELECT * FROM t WHERE name = ? AND id = ?', params);

    // connection.query should receive the SQL and params array
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE name = ? AND id = ?',
      params,
    );
  });

  it('should pass SQL unmodified when positional params used', async () => {
    await ds.query('SELECT * FROM t WHERE col = ?', ['value']);
    const sql = mockQuery.mock.calls[0][0] as string;
    // SQL should contain the ? placeholder, not the interpolated value
    expect(sql).toBe('SELECT * FROM t WHERE col = ?');
    expect(sql).not.toContain('value');
  });

  it('should handle params with $ characters safely', async () => {
    await ds.query('SELECT * FROM t WHERE col = ?', ['price$100']);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE col = ?',
      ['price$100'],
    );
  });

  it('should handle params with single quotes safely', async () => {
    await ds.query('SELECT * FROM t WHERE col = ?', ["O'Brien"]);
    // With positional binding, the value is passed directly — no escaping needed
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE col = ?',
      ["O'Brien"],
    );
  });

  it('should handle null and undefined params', async () => {
    await ds.query('SELECT * FROM t WHERE a = ? AND b = ?', [null, undefined]);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE a = ? AND b = ?',
      [null, undefined],
    );
  });

  it('should work with no params', async () => {
    await ds.query('SELECT * FROM t');
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM t');
  });

  it('should work with empty params array (treated as no params)', async () => {
    await ds.query('SELECT * FROM t', []);
    // Empty array is equivalent to no params — SQL passed directly
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM t');
  });
});

// ─── Task 2: queryStream positional params ───────────────────────────

describe('queryStream parameter binding', () => {
  let ds: DuckDBDataSource;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ ds, mockSend } = createConnectedDataSource());
  });

  it('should pass positional params array to connection.send', async () => {
    const params = ['test'];
    // Consume the async iterator
    for await (const _chunk of ds.queryStream('SELECT * FROM t WHERE name = ?', params)) {
      // no-op
    }
    expect(mockSend).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE name = ?',
      params,
    );
  });

  it('should work with no params', async () => {
    for await (const _chunk of ds.queryStream('SELECT * FROM t')) {
      // no-op
    }
    expect(mockSend).toHaveBeenCalledWith('SELECT * FROM t');
  });
});
