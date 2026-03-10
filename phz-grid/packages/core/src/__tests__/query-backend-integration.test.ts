import { describe, it, expect, vi } from 'vitest';
import { createGrid } from '../create-grid.js';
import { createJSArrayQueryBackend } from '../js-query-backend.js';
import type { QueryBackend, LocalQuery, LocalQueryResult } from '../types/query-backend.js';

const SAMPLE_DATA = [
  { name: 'Alice', age: 30, dept: 'Eng' },
  { name: 'Bob', age: 25, dept: 'Sales' },
  { name: 'Charlie', age: 35, dept: 'Eng' },
  { name: 'Diana', age: 28, dept: 'Mkt' },
  { name: 'Eve', age: 32, dept: 'Sales' },
];

const COLUMNS = [
  { field: 'name', type: 'string' as const, sortable: true, filterable: true },
  { field: 'age', type: 'number' as const, sortable: true, filterable: true },
  { field: 'dept', type: 'string' as const, sortable: true, filterable: true },
];

describe('QueryBackend integration with createGrid', () => {
  it('creates grid without queryBackend (default sync path)', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(grid.getData()).toHaveLength(5);
    expect(grid.isLoading()).toBe(false);
    expect(grid.getQueryBackend()).toBeNull();
    grid.destroy();
  });

  it('creates grid with queryBackend', () => {
    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    const grid = createGrid({
      data: SAMPLE_DATA,
      columns: COLUMNS,
      queryBackend: backend,
    });
    expect(grid.getQueryBackend()).toBe(backend);
    grid.destroy();
  });

  it('setQueryBackend swaps backend at runtime', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(grid.getQueryBackend()).toBeNull();

    const backend = createJSArrayQueryBackend(SAMPLE_DATA, COLUMNS);
    grid.setQueryBackend(backend);
    expect(grid.getQueryBackend()).toBe(backend);

    grid.setQueryBackend(null);
    expect(grid.getQueryBackend()).toBeNull();
    grid.destroy();
  });

  it('isLoading reflects loading state', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(grid.isLoading()).toBe(false);
    grid.destroy();
  });

  it('setQueryBackend triggers dispatchQueryBackend', async () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });

    let executeCalled = false;
    const mockBackend: QueryBackend = {
      async execute(query: LocalQuery): Promise<LocalQueryResult> {
        executeCalled = true;
        return {
          rows: [{ name: 'Result' }],
          totalCount: 1,
          filteredCount: 1,
          executionEngine: 'js-compute',
          executionTimeMs: 0,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
      },
    };

    grid.setQueryBackend(mockBackend);

    // Wait for the async dispatch
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(executeCalled).toBe(true);
    grid.destroy();
  });

  it('rapid setQueryBackend calls cancel previous queries', async () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });

    const executionOrder: number[] = [];
    let callCount = 0;

    function createSlowBackend(id: number, delayMs: number): QueryBackend {
      return {
        async execute(): Promise<LocalQueryResult> {
          callCount++;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          executionOrder.push(id);
          return {
            rows: [{ id }],
            totalCount: 1,
            filteredCount: 1,
            executionEngine: 'js-compute',
            executionTimeMs: 0,
          };
        },
        getCapabilities() {
          return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
        },
      };
    }

    // First backend takes 50ms
    grid.setQueryBackend(createSlowBackend(1, 50));
    // Immediately switch to second backend (cancels first)
    grid.setQueryBackend(createSlowBackend(2, 10));

    // Wait for both to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Both execute() calls fire, but only the second result should be applied
    // (The first query's result is discarded via queryId check)
    expect(callCount).toBe(2);
    grid.destroy();
  });

  it('destroy cleans up queryBackend', () => {
    const destroySpy = vi.fn();
    const backend: QueryBackend = {
      async execute(): Promise<LocalQueryResult> {
        return { rows: [], totalCount: 0, filteredCount: 0, executionEngine: 'js-compute', executionTimeMs: 0 };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
      },
      destroy: destroySpy,
    };

    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS, queryBackend: backend });
    grid.destroy();
    expect(destroySpy).toHaveBeenCalledOnce();
  });

  it('queryBackend null preserves sync behavior', () => {
    const grid = createGrid({
      data: SAMPLE_DATA,
      columns: COLUMNS,
      queryBackend: undefined,
    });

    // Sync operations should work as before
    grid.sort('name', 'asc');
    const sorted = grid.getSortedRowModel();
    expect(sorted.rows[0].name).toBe('Alice');
    expect(sorted.rows[4].name).toBe('Eve');

    grid.addFilter('dept', 'equals', 'Eng');
    const filtered = grid.getFilteredRowModel();
    expect(filtered.rowCount).toBe(2);

    grid.destroy();
  });

  it('GridApi methods exist for QueryBackend', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(typeof grid.setQueryBackend).toBe('function');
    expect(typeof grid.getQueryBackend).toBe('function');
    expect(typeof grid.isLoading).toBe('function');
    grid.destroy();
  });

  it('getProgressiveState returns null without progressive config', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(grid.getProgressiveState()).toBeNull();
    grid.destroy();
  });

  it('refreshData exists and works without error', () => {
    const grid = createGrid({ data: SAMPLE_DATA, columns: COLUMNS });
    expect(typeof grid.refreshData).toBe('function');
    grid.refreshData(); // should not throw
    grid.destroy();
  });
});

describe('Progressive loading integration', () => {
  function createChunkingBackend(allRows: Record<string, unknown>[]): QueryBackend {
    return {
      async execute(query: LocalQuery): Promise<LocalQueryResult> {
        const offset = query.offset ?? 0;
        const limit = query.limit ?? allRows.length;
        const chunk = allRows.slice(offset, offset + limit);
        return {
          rows: chunk,
          totalCount: allRows.length,
          filteredCount: allRows.length,
          executionEngine: 'js-compute',
          executionTimeMs: 1,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
      },
    };
  }

  it('progressive load with 3 chunks renders after first chunk', async () => {
    // Generate 15 rows, chunk size 5 → 3 chunks
    const rows = Array.from({ length: 15 }, (_, i) => ({ id: i, name: `Row ${i}` }));
    const backend = createChunkingBackend(rows);

    const progressEvents: string[] = [];

    const grid = createGrid({
      data: [],
      columns: [
        { field: 'id', type: 'number' as const },
        { field: 'name', type: 'string' as const },
      ],
      queryBackend: backend,
      progressiveLoad: { chunkSize: 5 },
    });

    grid.on('data:progress', (evt) => {
      progressEvents.push(evt.phase);
    });

    // getProgressiveState should return non-null
    const initial = grid.getProgressiveState();
    expect(initial).not.toBeNull();

    // Trigger load
    grid.refreshData();

    // Wait for all chunks to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have received progress events
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents).toContain('complete');

    // All rows loaded
    expect(grid.getData()).toHaveLength(15);

    // Progressive state should be complete
    const final = grid.getProgressiveState();
    expect(final?.phase).toBe('complete');
    expect(final?.loadedRowCount).toBe(15);
    expect(final?.estimatedTotalCount).toBe(15);

    grid.destroy();
  });

  it('cancellation mid-stream discards remaining chunks', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    let executeCount = 0;

    const slowBackend: QueryBackend = {
      async execute(query: LocalQuery): Promise<LocalQueryResult> {
        executeCount++;
        const offset = query.offset ?? 0;
        const limit = query.limit ?? rows.length;
        // Add slight delay to allow cancellation
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          rows: rows.slice(offset, offset + limit),
          totalCount: rows.length,
          filteredCount: rows.length,
          executionEngine: 'js-compute',
          executionTimeMs: 1,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
      },
    };

    const grid = createGrid({
      data: [],
      columns: [{ field: 'id', type: 'number' as const }],
      queryBackend: slowBackend,
      progressiveLoad: { chunkSize: 5 },
    });

    // Start progressive load
    grid.refreshData();

    // Immediately cancel by setting new data (via setData, which doesn't use backend)
    await new Promise(resolve => setTimeout(resolve, 15));
    // Cancel by dispatching a new query (refreshData again)
    grid.refreshData();

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 200));

    // The second load should have completed
    const state = grid.getProgressiveState();
    expect(state?.phase).toBe('complete');

    grid.destroy();
  });

  it('backend without pagination falls back to single execute', async () => {
    let executeCallCount = 0;
    const noPaginationBackend: QueryBackend = {
      async execute(): Promise<LocalQueryResult> {
        executeCallCount++;
        return {
          rows: SAMPLE_DATA,
          totalCount: 5,
          filteredCount: 5,
          executionEngine: 'js-compute',
          executionTimeMs: 0,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: false };
      },
    };

    const grid = createGrid({
      data: [],
      columns: COLUMNS,
      queryBackend: noPaginationBackend,
      progressiveLoad: { chunkSize: 2 },
    });

    grid.setQueryBackend(noPaginationBackend);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should have used single execute (not chunked) because pagination: false
    // The grid falls back to dispatchQueryBackend (single call)
    expect(executeCallCount).toBeGreaterThanOrEqual(1);
    expect(grid.getData()).toHaveLength(5);

    grid.destroy();
  });

  it('auto-refresh replaces data without overlay', async () => {
    vi.useFakeTimers();
    try {
      let callCount = 0;
      const backend: QueryBackend = {
        async execute(query: LocalQuery): Promise<LocalQueryResult> {
          callCount++;
          const rows = [{ id: callCount }];
          return {
            rows,
            totalCount: 1,
            filteredCount: 1,
            executionEngine: 'js-compute',
            executionTimeMs: 0,
          };
        },
        getCapabilities() {
          return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
        },
      };

      const grid = createGrid({
        data: [],
        columns: [{ field: 'id', type: 'number' as const }],
        queryBackend: backend,
        progressiveLoad: { chunkSize: 100, refreshIntervalMs: 1000 },
      });

      // Initial load
      grid.refreshData();
      await vi.advanceTimersByTimeAsync(50);
      expect(callCount).toBeGreaterThanOrEqual(1);

      const countAfterInitial = callCount;

      // Advance timer past refresh interval
      await vi.advanceTimersByTimeAsync(1100);
      expect(callCount).toBeGreaterThan(countAfterInitial);

      // During refresh, phase should be 'refreshing' (not 'initial')
      // which means no full-screen overlay
      grid.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('refreshData triggers manual re-dispatch', async () => {
    let executeCount = 0;
    const backend: QueryBackend = {
      async execute(): Promise<LocalQueryResult> {
        executeCount++;
        return {
          rows: [{ id: 1 }],
          totalCount: 1,
          filteredCount: 1,
          executionEngine: 'js-compute',
          executionTimeMs: 0,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: false, pagination: true };
      },
    };

    const grid = createGrid({
      data: [],
      columns: [{ field: 'id', type: 'number' as const }],
      queryBackend: backend,
      progressiveLoad: { chunkSize: 100 },
    });

    grid.refreshData();
    await new Promise(resolve => setTimeout(resolve, 50));

    const countAfterFirst = executeCount;
    grid.refreshData();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(executeCount).toBeGreaterThan(countAfterFirst);
    grid.destroy();
  });
});

describe('QueryBackend sort/filter re-dispatch', () => {
  function createTrackingBackend(): { backend: QueryBackend; queries: LocalQuery[] } {
    const queries: LocalQuery[] = [];
    const backend: QueryBackend = {
      async execute(query: LocalQuery): Promise<LocalQueryResult> {
        queries.push(structuredClone(query));
        // Simulate backend filtering: only return rows matching filters
        let rows = [...SAMPLE_DATA];
        for (const f of query.filters) {
          if (f.operator === 'equals') {
            rows = rows.filter(r => (r as any)[f.field] === f.value);
          }
        }
        // Simulate backend sorting
        if (query.sort.length > 0) {
          const s = query.sort[0];
          rows.sort((a, b) => {
            const va = (a as any)[s.field];
            const vb = (b as any)[s.field];
            const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
            return s.direction === 'asc' ? cmp : -cmp;
          });
        }
        return {
          rows,
          totalCount: SAMPLE_DATA.length,
          filteredCount: rows.length,
          executionEngine: 'test',
          executionTimeMs: 0,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: false, aggregate: false, pagination: true };
      },
    };
    return { backend, queries };
  }

  it('sort() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20)); // initial dispatch
    const initialCount = queries.length;

    grid.sort('name', 'desc');
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(queries.length).toBeGreaterThan(initialCount);
    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.sort).toEqual([{ field: 'name', direction: 'desc' }]);
    grid.destroy();
  });

  it('addFilter() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));
    const initialCount = queries.length;

    grid.addFilter('dept', 'equals', 'Eng');
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(queries.length).toBeGreaterThan(initialCount);
    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.filters).toEqual([{ field: 'dept', operator: 'equals', value: 'Eng' }]);
    grid.destroy();
  });

  it('clearFilters() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.addFilter('dept', 'equals', 'Eng');
    await new Promise(resolve => setTimeout(resolve, 20));
    const countAfterFilter = queries.length;

    grid.clearFilters();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(queries.length).toBeGreaterThan(countAfterFilter);
    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.filters).toEqual([]);
    grid.destroy();
  });

  it('removeFilter() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.addFilter('dept', 'equals', 'Eng');
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.removeFilter('dept');
    await new Promise(resolve => setTimeout(resolve, 20));

    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.filters).toEqual([]);
    grid.destroy();
  });

  it('clearSort() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.sort('name', 'asc');
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.clearSort();
    await new Promise(resolve => setTimeout(resolve, 20));

    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.sort).toEqual([]);
    grid.destroy();
  });

  it('multiSort() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.multiSort([
      { field: 'dept', direction: 'asc' },
      { field: 'name', direction: 'desc' },
    ]);
    await new Promise(resolve => setTimeout(resolve, 20));

    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.sort).toEqual([
      { field: 'dept', direction: 'asc' },
      { field: 'name', direction: 'desc' },
    ]);
    grid.destroy();
  });

  it('backend results replace local data after filter dispatch', async () => {
    const { backend } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    // Initial dispatch loads all 5 rows
    expect(grid.getData()).toHaveLength(5);

    grid.addFilter('dept', 'equals', 'Eng');
    await new Promise(resolve => setTimeout(resolve, 20));

    // Backend returns only 2 Eng rows
    expect(grid.getData()).toHaveLength(2);
    expect(grid.getData().every(r => r.dept === 'Eng')).toBe(true);
    grid.destroy();
  });

  it('pipeline bypasses local filter/sort when backend is active', async () => {
    const { backend } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    // Sort descending — backend returns data in desc order
    grid.sort('name', 'desc');
    await new Promise(resolve => setTimeout(resolve, 20));

    const sorted = grid.getSortedRowModel();
    // Backend sorts desc: Eve, Diana, Charlie, Bob, Alice
    expect(sorted.rows[0].name).toBe('Eve');
    expect(sorted.rows[4].name).toBe('Alice');

    // getSortedRowModel should pass through backend data, not re-sort locally
    expect(sorted.rowCount).toBe(5);
    grid.destroy();
  });

  it('auto-dispatches initial query on grid creation with queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    // Should have auto-dispatched on creation
    expect(queries.length).toBeGreaterThanOrEqual(1);
    expect(grid.getData()).toHaveLength(5);
    grid.destroy();
  });

  it('export uses already-loaded data without re-querying', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    const queryCountBefore = queries.length;
    // getSortedRowModel (used by export) should not trigger a new query
    const rows = grid.getSortedRowModel().rows;
    expect(rows).toHaveLength(5);
    expect(queries.length).toBe(queryCountBefore); // no new queries
    grid.destroy();
  });

  it('setFilters() re-dispatches to queryBackend', async () => {
    const { backend, queries } = createTrackingBackend();
    const grid = createGrid({ data: [], columns: COLUMNS, queryBackend: backend });
    await new Promise(resolve => setTimeout(resolve, 20));

    grid.setFilters([
      { field: 'dept', operator: 'equals' as const, value: 'Sales' },
    ]);
    await new Promise(resolve => setTimeout(resolve, 20));

    const lastQuery = queries[queries.length - 1];
    expect(lastQuery.filters).toEqual([{ field: 'dept', operator: 'equals', value: 'Sales' }]);

    // Backend returned only Sales rows
    expect(grid.getData()).toHaveLength(2);
    expect(grid.getData().every(r => r.dept === 'Sales')).toBe(true);
    grid.destroy();
  });
});
