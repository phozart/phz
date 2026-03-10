/**
 * @phozart/phz-grid — RemoteDataManager Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteDataManager } from '../remote-data-manager.js';
import type { AsyncDataSource, DataFetchRequest, DataFetchResponse } from '@phozart/phz-core';

function createMockDataSource(options?: {
  totalCount?: number;
  delay?: number;
  error?: Error;
}): AsyncDataSource {
  const totalCount = options?.totalCount ?? 500;
  const delay = options?.delay ?? 0;
  const error = options?.error;

  return {
    type: 'async',
    fetch: vi.fn(async (request: DataFetchRequest): Promise<DataFetchResponse> => {
      if (error) throw error;
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      const data = Array.from({ length: Math.min(request.limit, totalCount - request.offset) }, (_, i) => ({
        __id: `row-${request.offset + i}`,
        name: `Item ${request.offset + i}`,
        value: request.offset + i,
      }));
      return { data, totalCount };
    }),
  };
}

describe('RemoteDataManager', () => {
  let onDataUpdate: ReturnType<typeof vi.fn>;
  let onLoadingChange: ReturnType<typeof vi.fn>;
  let onTotalCountChange: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDataUpdate = vi.fn();
    onLoadingChange = vi.fn();
    onTotalCountChange = vi.fn();
    onError = vi.fn();
  });

  it('fetches initial data on ensureRange', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);

    // Wait for fetch to complete
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({
      offset: 0,
      limit: 100,
    }));
    expect(onTotalCountChange).toHaveBeenCalledWith(500);
    expect(onLoadingChange).toHaveBeenCalledWith(true);
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });

  it('does not re-fetch cached pages', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    const callCountBefore = (ds.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    manager.ensureRange(0, 50);

    // No additional fetch calls since page 0 is cached
    expect((ds.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCountBefore);
  });

  it('prefetches pages ahead of visible range', async () => {
    const ds = createMockDataSource({ totalCount: 1000 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 2,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    // Should have fetched page 0 (visible) + pages 1,2 (prefetch)
    expect(ds.fetch).toHaveBeenCalledTimes(3);
    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }));
    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 200 }));
  });

  it('returns skeleton rows for uncached data', () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    const rows = manager.getRows(0, 4);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ __skeleton: true, __index: 0 });
    expect(rows[4]).toEqual({ __skeleton: true, __index: 4 });
  });

  it('returns cached data after fetch completes', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 4);
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    const rows = manager.getRows(0, 4);
    expect(rows).toHaveLength(5);
    expect((rows[0] as Record<string, unknown>).__skeleton).toBeUndefined();
    expect((rows[0] as Record<string, unknown>).name).toBe('Item 0');
    expect((rows[4] as Record<string, unknown>).name).toBe('Item 4');
  });

  it('invalidates cache on sort/filter change', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());
    onDataUpdate.mockClear();

    // Set sort — should invalidate cache
    manager.setSortAndFilter(
      [{ field: 'name', direction: 'asc' }],
      undefined,
    );

    expect(onDataUpdate).toHaveBeenCalled();

    // Rows should be skeleton again (cache was cleared)
    const rows = manager.getRows(0, 4);
    expect((rows[0] as Record<string, unknown>).__skeleton).toBe(true);
  });

  it('passes sort and filter to fetch request', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.setSortAndFilter(
      [{ field: 'name', direction: 'desc' }],
      [{ field: 'value', operator: 'greaterThan', value: 10 }],
    );

    manager.ensureRange(0, 50);
    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({
      sort: [{ field: 'name', direction: 'desc' }],
      filter: [{ field: 'value', operator: 'greaterThan', value: 10 }],
    }));
  });

  it('tracks loading state correctly', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);

    // Should be loading immediately
    expect(onLoadingChange).toHaveBeenCalledWith(true);

    await vi.waitFor(() => expect(onDataUpdate).toHaveBeenCalled());

    // Should stop loading after fetch completes
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });

  it('calls onError on fetch failure', async () => {
    const fetchError = new Error('Network error');
    const ds = createMockDataSource({ error: fetchError });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
      onError,
    });

    manager.ensureRange(0, 50);

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError).toHaveBeenCalledWith(fetchError, 0);
  });

  it('getTotalCount returns 0 before any fetch', () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    expect(manager.getTotalCount()).toBe(0);
  });

  it('getTotalCount returns value after fetch', async () => {
    const ds = createMockDataSource({ totalCount: 1234 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);
    await vi.waitFor(() => expect(onTotalCountChange).toHaveBeenCalled());

    expect(manager.getTotalCount()).toBe(1234);
  });

  it('destroy prevents further fetches', async () => {
    const ds = createMockDataSource({ totalCount: 500, delay: 50 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    manager.ensureRange(0, 50);
    manager.destroy();

    // Wait a bit to ensure the in-flight fetch doesn't trigger callbacks
    await new Promise(r => setTimeout(r, 100));

    // onDataUpdate should not have been called after destroy
    expect(onDataUpdate).not.toHaveBeenCalled();
  });

  it('fetches multiple pages for wide range', async () => {
    const ds = createMockDataSource({ totalCount: 500 });
    const manager = new RemoteDataManager({
      dataSource: ds,
      pageSize: 100,
      prefetchPages: 0,
      onDataUpdate,
      onLoadingChange,
      onTotalCountChange,
    });

    // Range spans pages 0 and 1
    manager.ensureRange(50, 150);
    await vi.waitFor(() => expect((ds.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2));

    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    expect(ds.fetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }));
  });
});
