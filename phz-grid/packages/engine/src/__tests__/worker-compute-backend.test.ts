/**
 * WorkerComputeBackend — fallback mode tests
 *
 * In Vitest (Node environment), Worker is undefined, so WorkerComputeBackend
 * falls back to JSComputeBackend. These tests verify the fallback behavior
 * and the protocol types.
 */
import { describe, it, expect } from 'vitest';
import { WorkerComputeBackend } from '../workers/worker-compute-backend.js';
import type { AggregationConfig, PivotConfig } from '@phozart/core';

describe('WorkerComputeBackend', () => {
  describe('fallback mode (no Worker)', () => {
    it('should fall back to JSComputeBackend when Worker is unavailable', () => {
      const backend = new WorkerComputeBackend();
      expect(backend.isFallback).toBe(true);
    });

    it('should aggregate in fallback mode', async () => {
      const backend = new WorkerComputeBackend();
      const data = [{ x: 10 }, { x: 20 }, { x: 30 }];
      const config: AggregationConfig = {
        fields: [{ field: 'x', functions: ['sum', 'avg'] }],
      };
      const result = await backend.aggregate(data, config);
      expect(result.fieldResults.x.sum).toBe(60);
      expect(result.fieldResults.x.avg).toBe(20);
    });

    it('should pivot in fallback mode', async () => {
      const backend = new WorkerComputeBackend();
      const data = [
        { cat: 'A', region: 'E', val: 10 },
        { cat: 'A', region: 'W', val: 20 },
        { cat: 'B', region: 'E', val: 30 },
      ];
      const config: PivotConfig = {
        rowFields: ['cat'],
        columnFields: ['region'],
        valueFields: [{ field: 'val', aggregation: 'sum' }],
      };
      const result = await backend.pivot(data, config);
      expect(result.rowHeaders.length).toBe(2);
    });

    it('should filter in fallback mode', async () => {
      const backend = new WorkerComputeBackend();
      const data = [{ x: 10 }, { x: 20 }, { x: 30 }];
      const result = await backend.filter(data, [
        { field: 'x', operator: 'greaterThan', value: 15 },
      ]);
      expect(result.length).toBe(2);
    });

    it('should compute calculated fields in fallback mode', async () => {
      const backend = new WorkerComputeBackend();
      const data = [{ a: 10, b: 5 }, { a: 20, b: 8 }];
      const result = await backend.computeCalculatedFields(data, [
        { name: 'c', expression: 'a + b' },
      ]);
      expect(result[0].c).toBe(15);
    });

    it('should handle setData in fallback mode', async () => {
      const backend = new WorkerComputeBackend();
      await backend.setData([{ x: 1 }]); // Should not throw
    });

    it('should handle terminate in fallback mode', () => {
      const backend = new WorkerComputeBackend();
      backend.terminate(); // Should not throw
    });
  });

  describe('protocol types', () => {
    it('should export protocol types correctly', async () => {
      const protocol = await import('../workers/compute-worker-protocol.js');
      // Type-only module — just verify it can be imported
      expect(protocol).toBeDefined();
    });
  });
});
