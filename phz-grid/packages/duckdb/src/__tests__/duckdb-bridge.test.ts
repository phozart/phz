/**
 * @phozart/phz-duckdb — DuckDB Bridge Tests (WI 23)
 *
 * Tests that DuckDBBridge subscribes to grid events and dispatches
 * SQL queries via sql-builder when state changes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuckDBBridge } from '../duckdb-bridge.js';
import type { DuckDBDataSource } from '../types.js';
import type { GridApi } from '@phozart/phz-core';

function createMockDataSource(): DuckDBDataSource {
  return {
    initialize: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    loadFile: vi.fn(),
    loadMultipleFiles: vi.fn(),
    getSchema: vi.fn(),
    getTables: vi.fn(async () => ['sales']),
    getTableInfo: vi.fn(),
    query: vi.fn(async () => ({
      data: [{ id: 1, name: 'test' }],
      schema: [],
      rowCount: 1,
      executionTime: 5,
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

describe('DuckDBBridge', () => {
  let ds: DuckDBDataSource;
  let grid: ReturnType<typeof createMockGridApi>;
  let bridge: DuckDBBridge;

  beforeEach(() => {
    ds = createMockDataSource();
    grid = createMockGridApi();
    bridge = new DuckDBBridge(ds, 'sales');
  });

  describe('construction', () => {
    it('creates a bridge with data source and table name', () => {
      expect(bridge).toBeDefined();
    });
  });

  describe('attach', () => {
    it('subscribes to grid state changes on attach', () => {
      bridge.attach(grid);
      expect(grid.subscribe).toHaveBeenCalled();
      expect(grid._subscribers.length).toBeGreaterThan(0);
    });
  });

  describe('detach', () => {
    it('unsubscribes from grid on detach', () => {
      bridge.attach(grid);
      bridge.detach();
      expect(grid._subscribers.length).toBe(0);
    });
  });

  describe('refresh', () => {
    it('executes a query using current grid state', async () => {
      bridge.attach(grid);
      await bridge.refresh();
      expect(ds.query).toHaveBeenCalled();
    });

    it('sets data on the grid after query', async () => {
      bridge.attach(grid);
      await bridge.refresh();
      expect(grid.setData).toHaveBeenCalled();
    });

    it('also queries for total count', async () => {
      bridge.attach(grid);
      await bridge.refresh();
      // query should be called at least twice: data + count
      expect((ds.query as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTableName', () => {
    it('returns the configured table name', () => {
      expect(bridge.getTableName()).toBe('sales');
    });
  });

  describe('setTableName', () => {
    it('updates the table name', () => {
      bridge.setTableName('orders');
      expect(bridge.getTableName()).toBe('orders');
    });
  });
});
