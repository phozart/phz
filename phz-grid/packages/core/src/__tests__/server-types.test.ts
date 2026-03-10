import { describe, it, expect } from 'vitest';
import type {
  ServerDataRequest,
  ServerDataResponse,
  ServerFilterGroup,
  ServerFilterCondition,
  PaginationInfo,
  SortDescriptor,
  ServerCapabilities,
  ServerGroupRequest,
  ServerGroupRow,
  ServerExportRequest,
  ServerExportResponse,
  ExportProgress,
  DataMutationProvider,
  MutationResult,
  MutationConflict,
  BatchMutationResult,
  RealtimeProvider,
  DataUpdate,
  RetryPolicy,
  DataSourceError,
} from '../types/server.js';
import type { AsyncDataSource, DataFetchRequest } from '../types/datasource.js';

describe('WI 15: Server Types — ServerDataRequest', () => {
  it('supports offset-based pagination', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
    };
    expect(request.pagination.type).toBe('offset');
    if (request.pagination.type === 'offset') {
      expect(request.pagination.offset).toBe(0);
      expect(request.pagination.limit).toBe(100);
    }
  });

  it('supports cursor-based pagination', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'cursor', cursor: 'abc123', limit: 50 },
    };
    expect(request.pagination.type).toBe('cursor');
    if (request.pagination.type === 'cursor') {
      expect(request.pagination.cursor).toBe('abc123');
      expect(request.pagination.limit).toBe(50);
    }
  });

  it('supports sort descriptors', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
      sort: [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'desc', collation: 'en-US' },
      ],
    };
    expect(request.sort).toHaveLength(2);
    expect(request.sort![1].collation).toBe('en-US');
  });

  it('supports flat filter conditions', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
      filter: {
        logic: 'and',
        conditions: [
          { field: 'age', operator: 'greaterThan', value: 18 },
          { field: 'status', operator: 'equals', value: 'active' },
        ],
      },
    };
    expect(request.filter!.logic).toBe('and');
    expect(request.filter!.conditions).toHaveLength(2);
  });

  it('supports nested filter groups — (A AND B) OR (C AND D)', () => {
    const filter: ServerFilterGroup = {
      logic: 'or',
      conditions: [
        {
          logic: 'and',
          conditions: [
            { field: 'country', operator: 'equals', value: 'US' },
            { field: 'age', operator: 'greaterThan', value: 21 },
          ],
        },
        {
          logic: 'and',
          conditions: [
            { field: 'country', operator: 'equals', value: 'UK' },
            { field: 'age', operator: 'greaterThan', value: 18 },
          ],
        },
      ],
    };
    expect(filter.logic).toBe('or');
    expect(filter.conditions).toHaveLength(2);
    // First nested group
    const firstGroup = filter.conditions[0] as ServerFilterGroup;
    expect(firstGroup.logic).toBe('and');
    expect(firstGroup.conditions).toHaveLength(2);
  });

  it('supports deeply nested filter groups', () => {
    const filter: ServerFilterGroup = {
      logic: 'and',
      conditions: [
        { field: 'active', operator: 'equals', value: true },
        {
          logic: 'or',
          conditions: [
            { field: 'role', operator: 'equals', value: 'admin' },
            {
              logic: 'and',
              conditions: [
                { field: 'role', operator: 'equals', value: 'user' },
                { field: 'verified', operator: 'equals', value: true },
              ],
            },
          ],
        },
      ],
    };
    expect(filter.conditions).toHaveLength(2);
    const orGroup = filter.conditions[1] as ServerFilterGroup;
    expect(orGroup.logic).toBe('or');
    const nestedAnd = orGroup.conditions[1] as ServerFilterGroup;
    expect(nestedAnd.logic).toBe('and');
  });

  it('supports between operator with valueTo', () => {
    const condition: ServerFilterCondition = {
      field: 'price',
      operator: 'between',
      value: 10,
      valueTo: 100,
    };
    expect(condition.valueTo).toBe(100);
  });

  it('supports AbortSignal', () => {
    const controller = new AbortController();
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
      signal: controller.signal,
    };
    expect(request.signal).toBe(controller.signal);
    expect(request.signal!.aborted).toBe(false);
  });

  it('supports grouping in request', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
      grouping: {
        groupBy: [
          { field: 'country', aggregations: [{ field: 'revenue', function: 'sum' }] },
        ],
        expandedGroupKeys: [['US']],
      },
    };
    expect(request.grouping!.groupBy).toHaveLength(1);
    expect(request.grouping!.expandedGroupKeys).toHaveLength(1);
  });

  it('supports fullTextSearch', () => {
    const request: ServerDataRequest = {
      pagination: { type: 'offset', offset: 0, limit: 100 },
      fullTextSearch: 'hello world',
    };
    expect(request.fullTextSearch).toBe('hello world');
  });
});

describe('WI 15: Server Types — ServerDataResponse', () => {
  it('contains rows and pagination info', () => {
    const response: ServerDataResponse<{ name: string }> = {
      rows: [{ name: 'Alice' }, { name: 'Bob' }],
      pagination: {
        totalCount: 100,
        totalCountType: 'exact',
        hasMore: true,
      },
    };
    expect(response.rows).toHaveLength(2);
    expect(response.pagination.totalCount).toBe(100);
    expect(response.pagination.totalCountType).toBe('exact');
    expect(response.pagination.hasMore).toBe(true);
  });

  it('supports cursor pagination response', () => {
    const response: ServerDataResponse<{ id: number }> = {
      rows: [{ id: 1 }],
      pagination: {
        totalCount: 1000,
        totalCountType: 'estimate',
        hasMore: true,
        nextCursor: 'cursor_abc',
        prevCursor: 'cursor_xyz',
      },
    };
    expect(response.pagination.nextCursor).toBe('cursor_abc');
    expect(response.pagination.prevCursor).toBe('cursor_xyz');
  });

  it('supports unknown totalCount', () => {
    const response: ServerDataResponse<{ id: number }> = {
      rows: [],
      pagination: {
        totalCountType: 'unknown',
        hasMore: false,
      },
    };
    expect(response.pagination.totalCountType).toBe('unknown');
    expect(response.pagination.totalCount).toBeUndefined();
  });

  it('supports group rows in response', () => {
    const response: ServerDataResponse<{ name: string }> = {
      rows: [],
      pagination: { totalCountType: 'exact', totalCount: 0, hasMore: false },
      groupRows: [
        {
          groupKey: ['US'],
          groupLabel: 'United States',
          childCount: 50,
          hasSubGroups: true,
          aggregates: { revenue: 125000 },
        },
      ],
    };
    expect(response.groupRows).toHaveLength(1);
    expect(response.groupRows![0].childCount).toBe(50);
    expect(response.groupRows![0].aggregates!.revenue).toBe(125000);
  });

  it('supports aggregates on response', () => {
    const response: ServerDataResponse<{ amount: number }> = {
      rows: [{ amount: 10 }],
      pagination: { totalCountType: 'exact', totalCount: 1, hasMore: false },
      aggregates: { amount: { sum: 10, avg: 10, count: 1 } },
    };
    expect(response.aggregates!.amount.sum).toBe(10);
  });
});

describe('WI 15: AsyncDataSource backward compatibility', () => {
  it('existing AsyncDataSource shape still works (flat filters, offset/limit)', () => {
    const source: AsyncDataSource = {
      type: 'async',
      fetch(request: DataFetchRequest) {
        return Promise.resolve({ data: [], totalCount: 0 });
      },
    };
    expect(source.type).toBe('async');
  });

  it('enhanced AsyncDataSource adds optional serverFetch and capabilities', () => {
    const source: AsyncDataSource = {
      type: 'async',
      fetch(request: DataFetchRequest) {
        return Promise.resolve({ data: [], totalCount: 0 });
      },
      serverFetch(request: ServerDataRequest) {
        return Promise.resolve({
          rows: [],
          pagination: { totalCountType: 'exact' as const, totalCount: 0, hasMore: false },
        });
      },
      capabilities: {
        sort: true,
        filter: true,
        grouping: false,
        pivot: false,
        fullTextSearch: false,
        cursorPagination: true,
        exactTotalCount: true,
        realTimeUpdates: false,
      },
    };
    expect(source.capabilities!.cursorPagination).toBe(true);
  });
});

describe('WI 15: isServerFilterGroup type guard', () => {
  // We'll import the guard once implemented
  it('distinguishes group from condition', async () => {
    const { isServerFilterGroup } = await import('../types/server.js');
    const group: ServerFilterGroup = {
      logic: 'and',
      conditions: [{ field: 'x', operator: 'equals', value: 1 }],
    };
    const condition: ServerFilterCondition = {
      field: 'x',
      operator: 'equals',
      value: 1,
    };
    expect(isServerFilterGroup(group)).toBe(true);
    expect(isServerFilterGroup(condition)).toBe(false);
  });
});
