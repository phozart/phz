/**
 * @phozart/phz-duckdb — DuckDBComputeBackend Tests
 *
 * TDD: Red phase — tests for DuckDBComputeBackend SQL generation.
 * Since we cannot use actual DuckDB-WASM in unit tests, we verify
 * that the backend generates correct SQL and delegates execution.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  DuckDBComputeBackend,
  type DuckDBQueryExecutor,
} from '../duckdb-compute-backend.js';
import type { AggregationConfig, PivotConfig } from '@phozart/phz-core';
import type { FilterInput } from '../sql-builder.js';

function createMockExecutor(rows: Record<string, unknown>[] = []): DuckDBQueryExecutor {
  return {
    execute: vi.fn().mockResolvedValue(rows),
    tableName: 'test_table',
  };
}

describe('DuckDBComputeBackend', () => {
  describe('aggregate', () => {
    it('should generate aggregation SQL and execute', async () => {
      const mockRows = [{ revenue_sum: 700, revenue_avg: 175 }];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const config: AggregationConfig = {
        fields: [{ field: 'revenue', functions: ['sum', 'avg'] }],
      };
      const result = await backend.aggregate([], config);

      expect(executor.execute).toHaveBeenCalledOnce();
      const call = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0];
      const sql = call[0] as string;
      expect(sql).toContain('SUM');
      expect(sql).toContain('AVG');
      expect(sql).toContain('"test_table"');

      // Result is mapped back into AggregationResult format
      expect(result.fieldResults.revenue.sum).toBe(700);
      expect(result.fieldResults.revenue.avg).toBe(175);
    });

    it('should handle multiple fields', async () => {
      const mockRows = [{ revenue_sum: 700, cost_sum: 270 }];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const config: AggregationConfig = {
        fields: [
          { field: 'revenue', functions: ['sum'] },
          { field: 'cost', functions: ['sum'] },
        ],
      };
      const result = await backend.aggregate([], config);

      expect(result.fieldResults.revenue.sum).toBe(700);
      expect(result.fieldResults.cost.sum).toBe(270);
    });

    it('should return null values when result row is empty', async () => {
      const executor = createMockExecutor([]);
      const backend = new DuckDBComputeBackend(executor);

      const config: AggregationConfig = {
        fields: [{ field: 'revenue', functions: ['sum'] }],
      };
      const result = await backend.aggregate([], config);
      expect(result.fieldResults.revenue.sum).toBeNull();
    });
  });

  describe('pivot', () => {
    it('should generate PIVOT SQL and execute', async () => {
      const mockRows = [
        { category: 'A', East: 100, West: 200 },
        { category: 'B', East: 150, West: 250 },
      ];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const config: PivotConfig = {
        rowFields: ['category'],
        columnFields: ['region'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const result = await backend.pivot([], config);

      expect(executor.execute).toHaveBeenCalledOnce();
      const sql = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(sql).toContain('PIVOT');
      expect(sql).toContain('"test_table"');
    });

    it('should return empty result for empty config', async () => {
      const executor = createMockExecutor([]);
      const backend = new DuckDBComputeBackend(executor);

      const config: PivotConfig = {
        rowFields: ['category'],
        columnFields: [],
        valueFields: [],
      };
      const result = await backend.pivot([], config);
      expect(result.rowHeaders).toEqual([]);
      expect(result.columnHeaders).toEqual([]);
      expect(result.cells).toEqual([]);
    });
  });

  describe('filter', () => {
    it('should generate filter SQL and execute', async () => {
      const mockRows = [
        { category: 'A', revenue: 100 },
        { category: 'A', revenue: 200 },
      ];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const filters: FilterInput[] = [
        { field: 'category', operator: 'equals', value: 'A' },
      ];
      const result = await backend.filter([], filters);

      expect(executor.execute).toHaveBeenCalledOnce();
      const sql = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(sql).toContain('SELECT * FROM');
      expect(sql).toContain('WHERE');
      expect(result).toEqual(mockRows);
    });

    it('should return all rows with no filters', async () => {
      const mockRows = [{ category: 'A' }, { category: 'B' }];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const result = await backend.filter([], []);
      expect(executor.execute).toHaveBeenCalledOnce();
      const sql = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(sql).toContain('SELECT * FROM');
      expect(sql).not.toContain('WHERE');
    });
  });

  describe('computeCalculatedFields', () => {
    it('should generate SQL expression columns', async () => {
      const mockRows = [
        { revenue: 100, cost: 40, profit: 60 },
        { revenue: 200, cost: 80, profit: 120 },
      ];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const fields = [
        { name: 'profit', expression: 'revenue - cost' },
      ];
      const result = await backend.computeCalculatedFields([], fields);

      expect(executor.execute).toHaveBeenCalledOnce();
      const sql = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(sql).toContain('SELECT *');
      expect(sql).toContain('revenue - cost');
      expect(sql).toContain('AS "profit"');
      expect(result).toEqual(mockRows);
    });

    it('should return all rows with no calculated fields', async () => {
      const mockRows = [{ revenue: 100 }];
      const executor = createMockExecutor(mockRows);
      const backend = new DuckDBComputeBackend(executor);

      const result = await backend.computeCalculatedFields([], []);
      const sql = (executor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(sql).toContain('SELECT * FROM');
      expect(result).toEqual(mockRows);
    });
  });
});
