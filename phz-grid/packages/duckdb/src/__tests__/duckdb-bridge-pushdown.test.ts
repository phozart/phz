/**
 * @phozart/duckdb — DuckDB Bridge Push-down Tests
 *
 * Tests for wired push-down behavior: pagination LIMIT/OFFSET in bridge,
 * totalCount propagation, and initial load on attach.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuckDBBridge } from '../duckdb-bridge.js';
import type { DuckDBDataSource } from '../types.js';
import type { GridApi } from '@phozart/core';

function createMockDataSource(
  data: unknown[] = [{ id: 1 }],
  totalCount: number = 100,
): DuckDBDataSource {
  return {
    initialize: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    loadFile: vi.fn(),
    loadMultipleFiles: vi.fn(),
    getSchema: vi.fn(),
    getTables: vi.fn(async () => ['test']),
    getTableInfo: vi.fn(),
    query: vi.fn(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return {
          data: [{ total: totalCount }],
          schema: [],
          rowCount: 1,
          executionTime: 1,
          fromCache: false,
        };
      }
      return {
        data,
        schema: [],
        rowCount: data.length,
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

function createMockGridApi(): GridApi & { _subscribers: Function[] } {
  const subscribers: Function[] = [];
  return {
    _subscribers: subscribers,
    on: vi.fn(() => () => {}),
    subscribe: vi.fn((handler: Function) => {
      subscribers.push(handler);
      return () => {
        const idx = subscribers.indexOf(handler);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    }),
    getState: vi.fn(() => ({
      sort: { columns: [] },
      filter: { filters: [], presets: {} },
      grouping: { groupBy: [], expandedGroups: new Set() },
      viewport: { scrollTop: 0, scrollLeft: 0, visibleRowRange: [0, 100], visibleColumnRange: [0, 10] },
      status: { loading: false, error: null, rowCount: 0, filteredRowCount: 0 },
    })),
    setData: vi.fn(),
    getData: vi.fn(() => []),
    updateState: vi.fn(),
    emit: vi.fn(),
  } as unknown as GridApi & { _subscribers: Function[] };
}

describe('DuckDBBridge push-down wiring', () => {
  let ds: DuckDBDataSource;
  let grid: ReturnType<typeof createMockGridApi>;

  beforeEach(() => {
    ds = createMockDataSource([{ id: 1 }, { id: 2 }], 200);
    grid = createMockGridApi();
  });

  describe('refresh pushes data to grid', () => {
    it('calls grid.setData with query result data', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      await bridge.refresh();
      expect(grid.setData).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    it('runs both data and count queries', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      await bridge.refresh();
      expect(ds.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('pagination push-down', () => {
    it('includes LIMIT/OFFSET when pageSize is set', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      bridge.setPageSize(25);
      bridge.setPage(0);
      await bridge.refresh();

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).toContain('LIMIT ?');
      expect(dataSql![0]).toContain('OFFSET ?');
      expect(dataSql![1]).toContain(25);
      expect(dataSql![1]).toContain(0);
    });

    it('calculates correct offset for page 2', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      bridge.setPageSize(20);
      bridge.setPage(2);
      await bridge.refresh();

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      // page 2, pageSize 20 => offset 40
      expect(dataSql![1]).toContain(40);
      expect(dataSql![1]).toContain(20);
    });

    it('omits LIMIT/OFFSET when no pageSize set', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      await bridge.refresh();

      const calls = (ds.query as ReturnType<typeof vi.fn>).mock.calls;
      const dataSql = calls.find(
        (c: unknown[]) => !(c[0] as string).includes('COUNT(*)'),
      );
      expect(dataSql![0]).not.toContain('LIMIT');
      expect(dataSql![0]).not.toContain('OFFSET');
    });

    it('returns totalCount from count query', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      const result = await bridge.refresh();
      expect(result?.totalCount).toBe(200);
    });
  });

  describe('state change triggers refresh', () => {
    it('triggers refresh on sort change', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      const refreshSpy = vi.spyOn(bridge, 'refresh');

      const newState = {
        sort: { columns: [{ field: 'name', direction: 'asc' }] },
        filter: { filters: [], presets: {} },
        grouping: { groupBy: [], expandedGroups: new Set() },
        viewport: { scrollTop: 0, scrollLeft: 0, visibleRowRange: [0, 100], visibleColumnRange: [0, 10] },
        status: { loading: false, error: null, rowCount: 0, filteredRowCount: 0 },
      };

      // Simulate state change
      for (const sub of grid._subscribers) {
        sub(newState);
      }

      expect(refreshSpy).toHaveBeenCalled();
    });

    it('does not trigger refresh when state has not changed', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      const refreshSpy = vi.spyOn(bridge, 'refresh');

      const sameState = grid.getState();
      for (const sub of grid._subscribers) {
        sub(sameState);
      }

      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('detach cleanup', () => {
    it('detach removes all subscriptions', () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      expect(grid._subscribers.length).toBe(1);
      bridge.detach();
      expect(grid._subscribers.length).toBe(0);
    });

    it('refresh is a no-op after detach', async () => {
      const bridge = new DuckDBBridge(ds, 'orders');
      bridge.attach(grid);
      bridge.detach();
      const result = await bridge.refresh();
      expect(ds.query).not.toHaveBeenCalled();
    });
  });
});
