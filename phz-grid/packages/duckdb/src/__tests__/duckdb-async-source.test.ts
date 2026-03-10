/**
 * @phozart/phz-duckdb — DuckDB AsyncDataSource Tests
 *
 * Tests for the DuckDBAsyncSource adapter that implements AsyncDataSource
 * from @phozart/phz-core, converting DataFetchRequest into DuckDB SQL queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuckDBAsyncSource } from '../duckdb-async-source.js';
import type { DuckDBDataSource } from '../types.js';
import type { DataFetchRequest } from '@phozart/phz-core';

function createMockDataSource(
  dataResult: unknown[] = [],
  countResult: number = 0,
): DuckDBDataSource {
  return {
    initialize: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    loadFile: vi.fn(),
    loadMultipleFiles: vi.fn(),
    getSchema: vi.fn(),
    getTables: vi.fn(async () => ['test_table']),
    getTableInfo: vi.fn(),
    query: vi.fn(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return {
          data: [{ total: countResult }],
          schema: [],
          rowCount: 1,
          executionTime: 1,
          fromCache: false,
        };
      }
      return {
        data: dataResult,
        schema: [],
        rowCount: dataResult.length,
        executionTime: 5,
        fromCache: false,
      };
    }),
    queryStream: vi.fn(),
    executeSQL: vi.fn(),
    cancelQuery: vi.fn(),
    onProgress: vi.fn(() => () => {}),
    toArrowTable: vi.fn(),
    fromArrowTable: vi.fn(),
    getDatabase: vi.fn(),
    terminateWorker: vi.fn(),
    attachToGrid: vi.fn(),
    detachFromGrid: vi.fn(),
  } as unknown as DuckDBDataSource;
}

describe('DuckDBAsyncSource', () => {
  let ds: DuckDBDataSource;
  let source: DuckDBAsyncSource;

  beforeEach(() => {
    ds = createMockDataSource(
      [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
      42,
    );
    source = new DuckDBAsyncSource(ds, 'users');
  });

  describe('type', () => {
    it('has type "async"', () => {
      expect(source.type).toBe('async');
    });
  });

  describe('fetch — basic offset/limit', () => {
    it('generates SQL with LIMIT and OFFSET', async () => {
      await source.fetch({ offset: 10, limit: 25 });

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql).toBeDefined();
      expect(dataSql![0]).toContain('LIMIT ?');
      expect(dataSql![0]).toContain('OFFSET ?');
      expect(dataSql![1]).toContain(25);
      expect(dataSql![1]).toContain(10);
    });

    it('returns data and totalCount', async () => {
      const result = await source.fetch({ offset: 0, limit: 50 });
      expect(result.data).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(result.totalCount).toBe(42);
    });
  });

  describe('fetch — with sort', () => {
    it('generates ORDER BY clause from sort', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 100,
        sort: [{ field: 'name', direction: 'asc' }],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('ORDER BY "name" ASC');
    });

    it('handles multi-column sort', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 100,
        sort: [
          { field: 'category', direction: 'desc' },
          { field: 'price', direction: 'asc' },
        ],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('ORDER BY "category" DESC, "price" ASC');
    });
  });

  describe('fetch — with filter', () => {
    it('generates WHERE clause from filter', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 100,
        filter: [{ field: 'status', operator: 'equals', value: 'active' }],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('WHERE "status" = ?');
      expect(dataSql![1]).toContain('active');
    });

    it('applies same filters to count query', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 100,
        filter: [{ field: 'age', operator: 'greaterThan', value: 18 }],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const countSql = calls.find(
        (c: unknown[]) => (c[0] as string).includes('COUNT(*)'),
      );
      expect(countSql![0]).toContain('WHERE "age" > ?');
      expect(countSql![1]).toContain(18);
    });

    it('handles multiple filters', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 50,
        filter: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'score', operator: 'greaterThan', value: 80 },
        ],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('WHERE "status" = ? AND "score" > ?');
    });
  });

  describe('fetch — combined sort + filter + pagination', () => {
    it('generates correct combined query', async () => {
      const request: DataFetchRequest = {
        offset: 20,
        limit: 10,
        sort: [{ field: 'price', direction: 'desc' }],
        filter: [{ field: 'active', operator: 'equals', value: true }],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('WHERE "active" = ?');
      expect(dataSql![0]).toContain('ORDER BY "price" DESC');
      expect(dataSql![0]).toContain('LIMIT ? OFFSET ?');
    });
  });

  describe('fetch — empty result', () => {
    it('returns empty data with totalCount 0', async () => {
      const emptyDs = createMockDataSource([], 0);
      const emptySource = new DuckDBAsyncSource(emptyDs, 'empty_table');

      const result = await emptySource.fetch({ offset: 0, limit: 100 });
      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('fetch — parameterization safety', () => {
    it('never interpolates filter values into SQL', async () => {
      const request: DataFetchRequest = {
        offset: 0,
        limit: 10,
        filter: [
          { field: 'name', operator: 'equals', value: "Robert'; DROP TABLE users;--" },
        ],
      };
      await source.fetch(request);

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      for (const call of calls) {
        const sql = call[0] as string;
        expect(sql).not.toContain('Robert');
        expect(sql).not.toContain('DROP');
      }
    });
  });

  describe('fetch — runs data and count in parallel', () => {
    it('calls query exactly twice (data + count)', async () => {
      await source.fetch({ offset: 0, limit: 100 });
      expect(ds.query).toHaveBeenCalledTimes(2);
    });
  });
});
