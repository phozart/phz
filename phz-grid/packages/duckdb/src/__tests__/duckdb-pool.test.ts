import { describe, it, expect } from 'vitest';
import { createDuckDBPool } from '../duckdb-pool.js';

describe('createDuckDBPool', () => {
  it('starts uninitialized with zero refs', () => {
    const pool = createDuckDBPool();
    expect(pool.getRefCount()).toBe(0);
    expect(pool.isInitialized()).toBe(false);
  });

  it('initializes on first acquire', () => {
    const pool = createDuckDBPool();
    pool.acquire();
    expect(pool.getRefCount()).toBe(1);
    expect(pool.isInitialized()).toBe(true);
  });

  it('increments ref count on acquire', () => {
    const pool = createDuckDBPool();
    pool.acquire();
    pool.acquire();
    pool.acquire();
    expect(pool.getRefCount()).toBe(3);
  });

  it('decrements ref count on release', () => {
    const pool = createDuckDBPool();
    pool.acquire();
    pool.acquire();
    pool.release();
    expect(pool.getRefCount()).toBe(1);
    expect(pool.isInitialized()).toBe(true);
  });

  it('destroys on last release', () => {
    const pool = createDuckDBPool();
    pool.acquire();
    pool.release();
    expect(pool.getRefCount()).toBe(0);
    expect(pool.isInitialized()).toBe(false);
  });

  it('does not go below zero refs', () => {
    const pool = createDuckDBPool();
    pool.release();
    pool.release();
    expect(pool.getRefCount()).toBe(0);
  });

  it('ingests JSON data into a table', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    const data = [{ a: 1 }, { a: 2 }, { a: 3 }];
    await pool.ingestJSON('test_table', data);

    const tables = pool.listTables();
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('test_table');
    expect(tables[0].rowCount).toBe(3);
    expect(tables[0].createdAt).toBeGreaterThan(0);

    pool.release();
  });

  it('ingests Arrow buffer (placeholder)', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    await pool.ingestArrow('arrow_table', new ArrayBuffer(0));
    const tables = pool.listTables();
    expect(tables).toHaveLength(1);
    expect(tables[0].name).toBe('arrow_table');

    pool.release();
  });

  it('drops a table', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    await pool.ingestJSON('t1', [{ x: 1 }]);
    await pool.ingestJSON('t2', [{ x: 2 }]);
    expect(pool.listTables()).toHaveLength(2);

    pool.dropTable('t1');
    expect(pool.listTables()).toHaveLength(1);
    expect(pool.listTables()[0].name).toBe('t2');

    pool.release();
  });

  it('queries data from tables', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    await pool.ingestJSON('users', [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);

    const rows = await pool.query('SELECT * FROM users');
    expect(rows).toHaveLength(2);

    const countResult = await pool.query('SELECT COUNT(*) as cnt FROM users');
    expect(countResult[0].cnt).toBe(2);

    pool.release();
  });

  it('clears all tables on last release', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    await pool.ingestJSON('t1', [{ x: 1 }]);
    await pool.ingestJSON('t2', [{ x: 2 }]);
    expect(pool.listTables()).toHaveLength(2);

    pool.release();
    expect(pool.listTables()).toHaveLength(0);
  });

  it('returns empty for unknown table query', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    const rows = await pool.query('SELECT * FROM nonexistent');
    expect(rows).toEqual([]);

    pool.release();
  });

  it('returns empty for query with no FROM clause', async () => {
    const pool = createDuckDBPool();
    pool.acquire();

    const rows = await pool.query('SELECT 1');
    expect(rows).toEqual([]);

    pool.release();
  });

  it('can re-acquire after full release', async () => {
    const pool = createDuckDBPool();
    pool.acquire();
    await pool.ingestJSON('t1', [{ x: 1 }]);
    pool.release();
    expect(pool.isInitialized()).toBe(false);

    pool.acquire();
    expect(pool.isInitialized()).toBe(true);
    expect(pool.listTables()).toHaveLength(0);
    pool.release();
  });
});
