import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuckDBNativeAdapter, buildQuerySQL } from '../adapters/duckdb-native-adapter.js';
import type { DuckDBBinding } from '../adapters/duckdb-native-adapter.js';
import type { DataQuery } from '@phozart/workspace';

function createMockDB(data?: Record<string, unknown>[]): DuckDBBinding {
  return {
    run: vi.fn().mockResolvedValue(undefined),
    all: vi.fn().mockResolvedValue(data ?? []),
  };
}

describe('buildQuerySQL', () => {
  it('builds basic SELECT', () => {
    const query: DataQuery = { source: 'sales', fields: ['name', 'amount'] };
    const { sql, params } = buildQuerySQL(query);
    expect(sql).toBe('SELECT "name", "amount" FROM "sales"');
    expect(params).toEqual([]);
  });

  it('includes LIMIT and OFFSET', () => {
    const query: DataQuery = { source: 'data', fields: ['id'], limit: 10, offset: 20 };
    const { sql } = buildQuerySQL(query);
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain('OFFSET 20');
  });

  it('includes ORDER BY', () => {
    const query: DataQuery = {
      source: 'data',
      fields: ['name'],
      sort: [{ field: 'name', direction: 'asc' }, { field: 'id', direction: 'desc' }],
    };
    const { sql } = buildQuerySQL(query);
    expect(sql).toContain('ORDER BY "name" ASC, "id" DESC');
  });

  it('includes GROUP BY', () => {
    const query: DataQuery = { source: 'data', fields: ['dept'], groupBy: ['dept'] };
    const { sql } = buildQuerySQL(query);
    expect(sql).toContain('GROUP BY "dept"');
  });

  it('includes WHERE for filter object', () => {
    const query: DataQuery = {
      source: 'data',
      fields: ['name'],
      filters: { status: 'active' },
    };
    const { sql, params } = buildQuerySQL(query);
    expect(sql).toContain('WHERE "status" = ?');
    expect(params).toEqual(['active']);
  });

  it('escapes identifiers with double quotes', () => {
    const query: DataQuery = { source: 'my table', fields: ['my field'] };
    const { sql } = buildQuerySQL(query);
    expect(sql).toBe('SELECT "my field" FROM "my table"');
  });
});

describe('DuckDBNativeAdapter', () => {
  let mockDb: DuckDBBinding;
  let adapter: DuckDBNativeAdapter;

  beforeEach(() => {
    mockDb = createMockDB();
    adapter = new DuckDBNativeAdapter(mockDb, ':memory:');
  });

  describe('execute', () => {
    it('executes a query and returns DataResult', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>).mockResolvedValue([
        { name: 'Alice', amount: 100 },
        { name: 'Bob', amount: 200 },
      ]);

      const result = await adapter.execute({ source: 'sales', fields: ['name', 'amount'] });
      expect(result.columns).toHaveLength(2);
      expect(result.rows).toHaveLength(2);
      expect(result.metadata.totalRows).toBe(2);
      expect(result.metadata.truncated).toBe(false);
      expect(result.metadata.queryTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('returns empty result for no rows', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      const result = await adapter.execute({ source: 'empty', fields: ['id'] });
      expect(result.rows).toHaveLength(0);
      expect(result.columns).toHaveLength(1);
    });
  });

  describe('getSchema', () => {
    it('returns schema from information_schema', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>).mockResolvedValue([
        { column_name: 'id', data_type: 'INTEGER' },
        { column_name: 'name', data_type: 'VARCHAR' },
        { column_name: 'created', data_type: 'TIMESTAMP' },
        { column_name: 'active', data_type: 'BOOLEAN' },
      ]);

      const schema = await adapter.getSchema('users');
      expect(schema.id).toBe('users');
      expect(schema.fields).toHaveLength(4);
      expect(schema.fields[0].dataType).toBe('number');
      expect(schema.fields[1].dataType).toBe('string');
      expect(schema.fields[2].dataType).toBe('date');
      expect(schema.fields[3].dataType).toBe('boolean');
    });
  });

  describe('listDataSources', () => {
    it('lists tables from information_schema', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ table_name: 'sales' }, { table_name: 'products' }])
        .mockResolvedValueOnce([{ cnt: 100 }])
        .mockResolvedValueOnce([{ cnt: 50 }]);

      const sources = await adapter.listDataSources();
      expect(sources).toHaveLength(2);
      expect(sources[0].id).toBe('sales');
      expect(sources[0].rowCount).toBe(100);
      expect(sources[1].id).toBe('products');
    });
  });

  describe('getDistinctValues', () => {
    it('returns distinct values for a field', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ category: 'A' }, { category: 'B' }])
        .mockResolvedValueOnce([{ cnt: 2 }]);

      const result = await adapter.getDistinctValues('data', 'category');
      expect(result.values).toEqual(['A', 'B']);
      expect(result.totalCount).toBe(2);
      expect(result.truncated).toBe(false);
    });
  });

  describe('getFieldStats', () => {
    it('returns field statistics', async () => {
      (mockDb.all as ReturnType<typeof vi.fn>).mockResolvedValue([{
        min_val: 10,
        max_val: 500,
        distinct_count: 45,
        null_count: 2,
        total_count: 100,
      }]);

      const stats = await adapter.getFieldStats('data', 'amount');
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(500);
      expect(stats.distinctCount).toBe(45);
      expect(stats.nullCount).toBe(2);
      expect(stats.totalCount).toBe(100);
    });
  });

  describe('importFile', () => {
    it('imports CSV via read_csv_auto', async () => {
      await adapter.importFile('/data/sales.csv', 'sales');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('read_csv_auto'),
      );
    });

    it('imports Parquet via read_parquet', async () => {
      await adapter.importFile('/data/events.parquet', 'events');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('read_parquet'),
      );
    });

    it('imports JSON via read_json_auto', async () => {
      await adapter.importFile('/data/config.json', 'config');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('read_json_auto'),
      );
    });

    it('throws for unsupported formats', async () => {
      await expect(adapter.importFile('/data/file.xlsx', 'file')).rejects.toThrow('Unsupported');
    });
  });
});
