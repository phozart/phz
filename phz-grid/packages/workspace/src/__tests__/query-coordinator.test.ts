import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createQueryCoordinator,
  type QueryCoordinatorInstance,
} from '../coordination/query-coordinator.js';
import type { DataAdapter, DataQuery, DataResult } from '../data-adapter.js';

function mockDataAdapter(delay = 0): DataAdapter {
  return {
    async execute(query: DataQuery, context?: { signal?: AbortSignal }): Promise<DataResult> {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      if (context?.signal?.aborted) throw new Error('Aborted');
      return {
        columns: query.fields.map(f => ({ name: f, dataType: 'string' })),
        rows: [[1, 2]],
        metadata: { totalRows: 1, truncated: false, queryTimeMs: delay },
      };
    },
    async getSchema() {
      return { id: 'test', name: 'Test', fields: [] };
    },
    async listDataSources() {
      return [{ id: 'test', name: 'Test', fieldCount: 0 }];
    },
    async getDistinctValues() {
      return { values: [], totalCount: 0, truncated: false };
    },
    async getFieldStats() {
      return { distinctCount: 0, nullCount: 0, totalCount: 0 };
    },
  };
}

describe('QueryCoordinator', () => {
  describe('createQueryCoordinator', () => {
    it('creates a coordinator instance', () => {
      const adapter = mockDataAdapter();
      const coordinator = createQueryCoordinator(adapter);
      expect(coordinator).toBeDefined();
      expect(typeof coordinator.submit).toBe('function');
      expect(typeof coordinator.cancel).toBe('function');
      expect(typeof coordinator.flush).toBe('function');
    });
  });

  describe('submit', () => {
    it('executes a query and returns result', async () => {
      const adapter = mockDataAdapter();
      const coordinator = createQueryCoordinator(adapter);
      const result = await coordinator.submit('w1', {
        source: 'test',
        fields: ['revenue'],
      });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('executes multiple concurrent queries', async () => {
      const adapter = mockDataAdapter(10);
      const coordinator = createQueryCoordinator(adapter);

      const [r1, r2, r3] = await Promise.all([
        coordinator.submit('w1', { source: 'test', fields: ['a'] }),
        coordinator.submit('w2', { source: 'test', fields: ['b'] }),
        coordinator.submit('w3', { source: 'test', fields: ['c'] }),
      ]);

      expect(r1.data).toBeDefined();
      expect(r2.data).toBeDefined();
      expect(r3.data).toBeDefined();
    });

    it('respects concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const adapter: DataAdapter = {
        async execute(query, context) {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(r => setTimeout(r, 20));
          concurrent--;
          return {
            columns: [],
            rows: [],
            metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
          };
        },
        async getSchema() { return { id: 'test', name: 'Test', fields: [] }; },
        async listDataSources() { return []; },
        async getDistinctValues() { return { values: [], totalCount: 0, truncated: false }; },
        async getFieldStats() { return { distinctCount: 0, nullCount: 0, totalCount: 0 }; },
      };

      const coordinator = createQueryCoordinator(adapter, { maxConcurrent: 2, batchWindowMs: 0 });

      await Promise.all([
        coordinator.submit('w1', { source: 'test', fields: ['a'] }),
        coordinator.submit('w2', { source: 'test', fields: ['b'] }),
        coordinator.submit('w3', { source: 'test', fields: ['c'] }),
        coordinator.submit('w4', { source: 'test', fields: ['d'] }),
      ]);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('cancel', () => {
    it('cancels a pending query', async () => {
      const adapter = mockDataAdapter(100);
      const coordinator = createQueryCoordinator(adapter);

      const promise = coordinator.submit('w1', { source: 'test', fields: ['a'] });
      coordinator.cancel('w1');

      await expect(promise).rejects.toThrow();
    });
  });

  describe('flush', () => {
    it('waits for all pending queries to complete', async () => {
      const adapter = mockDataAdapter(10);
      const coordinator = createQueryCoordinator(adapter);

      coordinator.submit('w1', { source: 'test', fields: ['a'] });
      coordinator.submit('w2', { source: 'test', fields: ['b'] });

      await coordinator.flush();
      // If flush resolves, all queries completed
    });
  });

  describe('deduplication', () => {
    it('cancels previous query when same widget submits again', async () => {
      const executeSpy = vi.fn().mockResolvedValue({
        columns: [],
        rows: [],
        metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
      });

      const adapter: DataAdapter = {
        execute: executeSpy,
        async getSchema() { return { id: 'test', name: 'Test', fields: [] }; },
        async listDataSources() { return []; },
        async getDistinctValues() { return { values: [], totalCount: 0, truncated: false }; },
        async getFieldStats() { return { distinctCount: 0, nullCount: 0, totalCount: 0 }; },
      };

      const coordinator = createQueryCoordinator(adapter, { batchWindowMs: 0 });

      // Submit same widget twice -- first should be cancelled
      const query = { source: 'test', fields: ['a'] };
      const p1 = coordinator.submit('w1', query);
      const p2 = coordinator.submit('w1', query);

      // First submission should be cancelled (rejected)
      await expect(p1).rejects.toThrow('cancelled');

      // Second submission should succeed
      const r2 = await p2;
      expect(r2.data).toBeDefined();
    });
  });
});
