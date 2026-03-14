/**
 * @phozart/engine — ComputeBackend Tests
 *
 * TDD: Red phase — tests for ComputeBackend interface and JSComputeBackend.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createJSComputeBackend,
  type ComputeBackend,
  type ComputeFilterInput,
} from '../compute-backend.js';
import type { AggregationConfig, PivotConfig } from '@phozart/core';

describe('ComputeBackend interface', () => {
  describe('JSComputeBackend', () => {
    let backend: ComputeBackend;

    const sampleRows = [
      { category: 'A', region: 'East', revenue: 100, cost: 40 },
      { category: 'A', region: 'West', revenue: 200, cost: 80 },
      { category: 'B', region: 'East', revenue: 150, cost: 60 },
      { category: 'B', region: 'West', revenue: 250, cost: 90 },
    ];

    beforeEach(() => {
      backend = createJSComputeBackend();
    });

    it('should create a JSComputeBackend instance', () => {
      expect(backend).toBeDefined();
      expect(typeof backend.aggregate).toBe('function');
      expect(typeof backend.pivot).toBe('function');
      expect(typeof backend.filter).toBe('function');
      expect(typeof backend.computeCalculatedFields).toBe('function');
    });

    describe('aggregate', () => {
      it('should compute sum aggregation', async () => {
        const config: AggregationConfig = {
          fields: [{ field: 'revenue', functions: ['sum'] }],
        };
        const result = await backend.aggregate(sampleRows, config);
        expect(result.fieldResults.revenue.sum).toBe(700);
      });

      it('should compute multiple aggregations on a single field', async () => {
        const config: AggregationConfig = {
          fields: [{ field: 'revenue', functions: ['sum', 'avg', 'min', 'max', 'count'] }],
        };
        const result = await backend.aggregate(sampleRows, config);
        expect(result.fieldResults.revenue.sum).toBe(700);
        expect(result.fieldResults.revenue.avg).toBe(175);
        expect(result.fieldResults.revenue.min).toBe(100);
        expect(result.fieldResults.revenue.max).toBe(250);
        expect(result.fieldResults.revenue.count).toBe(4);
      });

      it('should compute aggregations across multiple fields', async () => {
        const config: AggregationConfig = {
          fields: [
            { field: 'revenue', functions: ['sum'] },
            { field: 'cost', functions: ['sum'] },
          ],
        };
        const result = await backend.aggregate(sampleRows, config);
        expect(result.fieldResults.revenue.sum).toBe(700);
        expect(result.fieldResults.cost.sum).toBe(270);
      });

      it('should return null for empty data', async () => {
        const config: AggregationConfig = {
          fields: [{ field: 'revenue', functions: ['sum'] }],
        };
        const result = await backend.aggregate([], config);
        expect(result.fieldResults.revenue.sum).toBeNull();
      });
    });

    describe('pivot', () => {
      it('should compute a basic pivot', async () => {
        const config: PivotConfig = {
          rowFields: ['category'],
          columnFields: ['region'],
          valueFields: [{ field: 'revenue', aggregation: 'sum' }],
        };
        const result = await backend.pivot(sampleRows, config);
        expect(result.rowHeaders.length).toBe(2);
        expect(result.columnHeaders.length).toBe(2);
        expect(result.cells.length).toBe(2);
      });

      it('should return empty result for empty data', async () => {
        const config: PivotConfig = {
          rowFields: ['category'],
          columnFields: ['region'],
          valueFields: [{ field: 'revenue', aggregation: 'sum' }],
        };
        const result = await backend.pivot([], config);
        expect(result.rowHeaders).toEqual([]);
        expect(result.columnHeaders).toEqual([]);
        expect(result.cells).toEqual([]);
      });
    });

    describe('filter', () => {
      it('should filter rows with equals operator', async () => {
        const filters: ComputeFilterInput[] = [
          { field: 'category', operator: 'equals', value: 'A' },
        ];
        const result = await backend.filter(sampleRows, filters);
        expect(result.length).toBe(2);
        expect(result.every(r => r.category === 'A')).toBe(true);
      });

      it('should filter rows with greaterThan operator', async () => {
        const filters: ComputeFilterInput[] = [
          { field: 'revenue', operator: 'greaterThan', value: 150 },
        ];
        const result = await backend.filter(sampleRows, filters);
        expect(result.length).toBe(2);
        expect(result.every(r => (r.revenue as number) > 150)).toBe(true);
      });

      it('should apply multiple filters (AND logic)', async () => {
        const filters: ComputeFilterInput[] = [
          { field: 'category', operator: 'equals', value: 'A' },
          { field: 'revenue', operator: 'greaterThan', value: 100 },
        ];
        const result = await backend.filter(sampleRows, filters);
        expect(result.length).toBe(1);
        expect(result[0].revenue).toBe(200);
      });

      it('should return all rows with no filters', async () => {
        const result = await backend.filter(sampleRows, []);
        expect(result.length).toBe(4);
      });
    });

    describe('computeCalculatedFields', () => {
      it('should compute a simple calculated field', async () => {
        const fields = [
          { name: 'profit', expression: 'revenue - cost' },
        ];
        const result = await backend.computeCalculatedFields(sampleRows, fields);
        expect(result.length).toBe(4);
        expect(result[0].profit).toBe(60); // 100 - 40
        expect(result[1].profit).toBe(120); // 200 - 80
      });

      it('should return original rows when no fields are provided', async () => {
        const result = await backend.computeCalculatedFields(sampleRows, []);
        expect(result).toEqual(sampleRows);
      });
    });
  });
});

describe('BIEngine computeBackend integration', () => {
  it('should use JSComputeBackend by default', async () => {
    const { createBIEngine } = await import('../engine.js');
    const engine = createBIEngine();
    // aggregate method should still work (backed by JS compute)
    const result = engine.aggregate(
      [{ x: 10 }, { x: 20 }],
      { fields: [{ field: 'x', functions: ['sum'] }] },
    );
    expect(result.fieldResults.x.sum).toBe(30);
    engine.destroy();
  });

  it('should accept a custom computeBackend in config', async () => {
    const { createBIEngine } = await import('../engine.js');
    const { createJSComputeBackend } = await import('../compute-backend.js');
    const backend = createJSComputeBackend();
    const engine = createBIEngine({ computeBackend: backend });
    expect(engine.computeBackend).toBe(backend);
    engine.destroy();
  });
});
