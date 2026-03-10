/**
 * @phozart/phz-duckdb — Unit Tests
 *
 * Tests for type exports, factory function, and data source behavior.
 * Note: Full DuckDB-WASM integration tests require a browser environment.
 */

import { describe, it, expect } from 'vitest';
import {
  createDuckDBDataSource,
  getQueryPlan,
} from '../index.js';
import type {
  DuckDBConfig,
  DuckDBDataSource,
  LoadFileOptions,
  TableSchema,
  ColumnSchema,
  TableInfo,
  QueryResult,
  QueryChunk,
  QueryProgress,
  ParquetMetadata,
  RowGroupMetadata,
  ColumnChunkMetadata,
  ColumnStatistics,
  ParquetSchema,
  QueryPlan,
  QueryPlanNode,
  ArrowTable,
  AsyncDuckDB,
  AsyncDuckDBConnection,
} from '../index.js';

describe('@phozart/phz-duckdb', () => {
  describe('type exports', () => {
    it('exports createDuckDBDataSource factory', () => {
      expect(createDuckDBDataSource).toBeDefined();
      expect(typeof createDuckDBDataSource).toBe('function');
    });

    it('exports getQueryPlan function', () => {
      expect(getQueryPlan).toBeDefined();
      expect(typeof getQueryPlan).toBe('function');
    });

    it('DuckDBConfig type is usable', () => {
      const config: DuckDBConfig = {
        workerUrl: '/worker.js',
        wasmUrl: '/duckdb.wasm',
        enableStreaming: true,
        enableProgress: true,
        memoryLimit: 256,
        threads: 4,
      };
      expect(config.threads).toBe(4);
    });

    it('LoadFileOptions type is usable', () => {
      const options: LoadFileOptions = {
        format: 'parquet',
        tableName: 'test',
        schema: { id: 'INTEGER', name: 'VARCHAR' },
        header: true,
        delimiter: ',',
        compression: 'gzip',
      };
      expect(options.format).toBe('parquet');
    });

    it('TableSchema type is usable', () => {
      const schema: TableSchema = {
        name: 'users',
        columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
        rowCount: 100,
      };
      expect(schema.columns).toHaveLength(1);
    });

    it('QueryResult type is usable', () => {
      const result: QueryResult = {
        data: [{ id: 1 }],
        schema: [{ name: 'id', type: 'INTEGER', nullable: false }],
        rowCount: 1,
        executionTime: 42,
        fromCache: false,
      };
      expect(result.rowCount).toBe(1);
    });

    it('QueryProgress type covers all states', () => {
      const states: QueryProgress['state'][] = ['preparing', 'executing', 'streaming', 'complete', 'error'];
      expect(states).toHaveLength(5);
    });

    it('ParquetMetadata type is usable', () => {
      const meta: ParquetMetadata = {
        version: '2.0',
        rowGroups: [{
          id: 0,
          rowCount: 1000,
          columns: [{
            name: 'id',
            type: 'INT32',
            encoding: 'PLAIN',
            compression: 'SNAPPY',
            statistics: { nullCount: 0, min: 1, max: 1000 },
          }],
          totalByteSize: 4096,
        }],
        schema: { fields: [{ name: 'id', type: 'INT32', nullable: false }] },
        totalRows: 1000,
      };
      expect(meta.rowGroups).toHaveLength(1);
    });

    it('QueryPlan type is usable', () => {
      const plan: QueryPlan = {
        sql: 'SELECT * FROM t',
        plan: [{
          id: 0,
          type: 'SEQUENTIAL_SCAN',
          table: 't',
          estimatedRows: 100,
          children: [],
        }],
        estimatedCost: 1.5,
        estimatedRows: 100,
      };
      expect(plan.plan[0].type).toBe('SEQUENTIAL_SCAN');
    });
  });

  describe('createDuckDBDataSource', () => {
    it('creates a DuckDBDataSource instance', () => {
      const ds = createDuckDBDataSource({});
      expect(ds).toBeDefined();
      expect(typeof ds.initialize).toBe('function');
      expect(typeof ds.connect).toBe('function');
      expect(typeof ds.disconnect).toBe('function');
      expect(typeof ds.isConnected).toBe('function');
      expect(typeof ds.loadFile).toBe('function');
      expect(typeof ds.loadMultipleFiles).toBe('function');
      expect(typeof ds.getSchema).toBe('function');
      expect(typeof ds.getTables).toBe('function');
      expect(typeof ds.getTableInfo).toBe('function');
      expect(typeof ds.query).toBe('function');
      expect(typeof ds.queryStream).toBe('function');
      expect(typeof ds.executeSQL).toBe('function');
      expect(typeof ds.cancelQuery).toBe('function');
      expect(typeof ds.onProgress).toBe('function');
      expect(typeof ds.toArrowTable).toBe('function');
      expect(typeof ds.fromArrowTable).toBe('function');
      expect(typeof ds.getDatabase).toBe('function');
      expect(typeof ds.terminateWorker).toBe('function');
      expect(typeof ds.attachToGrid).toBe('function');
      expect(typeof ds.detachFromGrid).toBe('function');
    });

    it('starts disconnected', () => {
      const ds = createDuckDBDataSource({});
      expect(ds.isConnected()).toBe(false);
    });

    it('throws when accessing database before init', () => {
      const ds = createDuckDBDataSource({});
      expect(() => ds.getDatabase()).toThrow('Not initialized');
    });

    it('throws when querying before connect', async () => {
      const ds = createDuckDBDataSource({});
      await expect(ds.query('SELECT 1')).rejects.toThrow('Not connected');
    });

    it('onProgress returns unsubscribe function', () => {
      const ds = createDuckDBDataSource({});
      const unsub = ds.onProgress(() => {});
      expect(typeof unsub).toBe('function');
      unsub(); // Should not throw
    });

    it('attachToGrid/detachFromGrid do not throw', () => {
      const ds = createDuckDBDataSource({});
      const mockGrid = {} as any;
      expect(() => ds.attachToGrid(mockGrid)).not.toThrow();
      expect(() => ds.detachFromGrid()).not.toThrow();
    });
  });

  describe('does not re-export core (tree-shaking fix)', () => {
    it('core symbols are not re-exported', async () => {
      const mod = await import('../index.js');
      expect((mod as any).createGrid).toBeUndefined();
      expect((mod as any).EventEmitter).toBeUndefined();
      expect((mod as any).StateManager).toBeUndefined();
    });
  });
});
