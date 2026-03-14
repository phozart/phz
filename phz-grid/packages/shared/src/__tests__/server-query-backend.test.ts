import { describe, it, expect, vi } from 'vitest';
import { createServerQueryBackend } from '../coordination/server-query-backend.js';
import type { LocalQuery } from '@phozart/core';

function createMockAdapter() {
  return {
    execute: vi.fn(async () => ({
      columns: [{ name: 'name', dataType: 'string' }],
      rows: [['Alice'], ['Bob']],
      metadata: { totalRows: 100, truncated: false, queryTimeMs: 5 },
    })),
    getSchema: vi.fn(async () => ({ id: 'users', name: 'users', fields: [] })),
    listDataSources: vi.fn(async () => []),
    getDistinctValues: vi.fn(async () => ({ values: [], totalCount: 0, truncated: false })),
    getFieldStats: vi.fn(async () => ({ distinctCount: 0, nullCount: 0, totalCount: 0 })),
  };
}

describe('createServerQueryBackend', () => {
  it('executes basic query through adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toHaveLength(2);
    expect(result.executionEngine).toBe('server');
    expect(result.totalCount).toBe(100);
    expect(adapter.execute).toHaveBeenCalledOnce();
  });

  it('passes source ID to adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'sales-data',
    });

    await backend.execute({ filters: [], sort: [], groupBy: [] });
    const call = adapter.execute.mock.calls[0][0];
    expect(call.source).toBe('sales-data');
  });

  it('passes filters to adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const query: LocalQuery = {
      filters: [{ field: 'status', operator: 'equals', value: 'active' }],
      sort: [],
      groupBy: [],
    };
    await backend.execute(query);

    const call = adapter.execute.mock.calls[0][0];
    expect(call.filters).toEqual([{ field: 'status', operator: 'equals', value: 'active' }]);
  });

  it('passes sort to adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const query: LocalQuery = {
      filters: [],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: [],
    };
    await backend.execute(query);

    const call = adapter.execute.mock.calls[0][0];
    expect(call.sort).toEqual([{ field: 'name', direction: 'asc' }]);
  });

  it('omits sort when empty', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    await backend.execute({ filters: [], sort: [], groupBy: [] });
    const call = adapter.execute.mock.calls[0][0];
    expect(call.sort).toBeUndefined();
  });

  it('passes pagination to adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      offset: 20,
      limit: 10,
    };
    await backend.execute(query);

    const call = adapter.execute.mock.calls[0][0];
    expect(call.offset).toBe(20);
    expect(call.limit).toBe(10);
  });

  it('passes field selection to adapter', async () => {
    const adapter = createMockAdapter();
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      fields: ['name', 'age'],
    };
    await backend.execute(query);

    const call = adapter.execute.mock.calls[0][0];
    expect(call.fields).toEqual(['name', 'age']);
  });

  it('reports server capabilities', () => {
    const backend = createServerQueryBackend({
      adapter: createMockAdapter(),
      sourceId: 'users',
    });
    const caps = backend.getCapabilities();
    expect(caps.filter).toBe(true);
    expect(caps.sort).toBe(true);
    expect(caps.pagination).toBe(true);
    expect(caps.group).toBe(false);
    expect(caps.aggregate).toBe(false);
  });

  it('handles adapter returning no metadata', async () => {
    const adapter = {
      ...createMockAdapter(),
      execute: vi.fn(async () => ({
        columns: [],
        rows: [['Alice']],
        metadata: undefined as any,
      })),
    };
    const backend = createServerQueryBackend({
      adapter,
      sourceId: 'users',
    });

    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.totalCount).toBe(1);
    expect(result.filteredCount).toBe(1);
  });

  it('includes execution time', async () => {
    const backend = createServerQueryBackend({
      adapter: createMockAdapter(),
      sourceId: 'users',
    });

    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(typeof result.executionTimeMs).toBe('number');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('destroy is safe to call', () => {
    const backend = createServerQueryBackend({
      adapter: createMockAdapter(),
      sourceId: 'users',
    });
    expect(() => backend.destroy!()).not.toThrow();
  });

  it('returns a fresh capabilities object each call', () => {
    const backend = createServerQueryBackend({
      adapter: createMockAdapter(),
      sourceId: 'users',
    });
    const caps1 = backend.getCapabilities();
    const caps2 = backend.getCapabilities();
    expect(caps1).not.toBe(caps2);
    expect(caps1).toEqual(caps2);
  });
});
