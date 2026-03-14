/**
 * @phozart/duckdb — AI Executor Tests (WI 26)
 *
 * Tests the AI query execution pipeline: AI generates SQL → DuckDB executes.
 */

import { describe, it, expect, vi } from 'vitest';
import { createAIQueryExecutor, type AIQueryExecutor } from '../ai-executor.js';
import type { DuckDBDataSource } from '../types.js';

function createMockDataSource(): DuckDBDataSource {
  return {
    initialize: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    loadFile: vi.fn(),
    loadMultipleFiles: vi.fn(),
    getSchema: vi.fn(async () => ({
      name: 'sales',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false },
        { name: 'revenue', type: 'DOUBLE', nullable: true },
        { name: 'region', type: 'VARCHAR', nullable: true },
      ],
      rowCount: 1000,
    })),
    getTables: vi.fn(async () => ['sales']),
    getTableInfo: vi.fn(),
    query: vi.fn(async (sql: string) => ({
      data: [{ total: 42 }],
      schema: [{ name: 'total', type: 'INTEGER', nullable: false }],
      rowCount: 1,
      executionTime: 10,
      fromCache: false,
    })),
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

function createMockAIToolkit() {
  return {
    executeNaturalLanguageQuery: vi.fn(async (query: string, _options?: { schema?: unknown[]; dialect?: string }): Promise<{ sql: string; confidence: number; error?: string }> => ({
      sql: 'SELECT SUM("revenue") AS total FROM "sales"',
      confidence: 0.9,
    })),
    getStructuredSchema: vi.fn(() => ({})),
    attachToGrid: vi.fn(),
    detachFromGrid: vi.fn(),
  };
}

describe('ai-executor', () => {
  describe('createAIQueryExecutor', () => {
    it('creates an executor', () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      const executor = createAIQueryExecutor(ds, ai as any);
      expect(executor).toBeDefined();
      expect(typeof executor.executeNLQuery).toBe('function');
    });
  });

  describe('executeNLQuery', () => {
    it('calls AI to generate SQL then executes on DuckDB', async () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      const executor = createAIQueryExecutor(ds, ai as any);

      const result = await executor.executeNLQuery('total revenue');
      expect(ai.executeNaturalLanguageQuery).toHaveBeenCalledWith(
        'total revenue',
        expect.objectContaining({ dialect: 'duckdb' }),
      );
      expect(ds.query).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.sql).toContain('SELECT');
    });

    it('rejects non-SELECT queries', async () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      ai.executeNaturalLanguageQuery.mockResolvedValue({
        sql: 'DROP TABLE sales',
        confidence: 0.5,
      });
      const executor = createAIQueryExecutor(ds, ai as any);

      const result = await executor.executeNLQuery('delete everything');
      expect(result.error).toBeDefined();
      expect(ds.query).not.toHaveBeenCalled();
    });

    it('returns error when AI fails', async () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      ai.executeNaturalLanguageQuery.mockResolvedValue({
        sql: '',
        error: 'AI error',
        confidence: 0,
      });
      const executor = createAIQueryExecutor(ds, ai as any);

      const result = await executor.executeNLQuery('nonsense');
      expect(result.error).toBeDefined();
    });

    it('includes schema context when available', async () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      const executor = createAIQueryExecutor(ds, ai as any, { tableName: 'sales' });

      await executor.executeNLQuery('show me revenue');
      const call = ai.executeNaturalLanguageQuery.mock.calls[0];
      expect(call[1]).toHaveProperty('schema');
    });
  });

  describe('getSchemaContext', () => {
    it('fetches table schema for prompt context', async () => {
      const ds = createMockDataSource();
      const ai = createMockAIToolkit();
      const executor = createAIQueryExecutor(ds, ai as any, { tableName: 'sales' });

      const schema = await executor.getSchemaContext();
      expect(schema).toBeDefined();
      expect(schema.length).toBeGreaterThan(0);
      expect(schema[0]).toHaveProperty('field');
      expect(schema[0]).toHaveProperty('type');
    });
  });
});
