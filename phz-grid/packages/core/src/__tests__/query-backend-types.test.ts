import { describe, it, expect } from 'vitest';
import type {
  LocalQuery,
  LocalQueryResult,
  QueryBackend,
  QueryBackendCapabilities,
} from '../types/query-backend.js';

describe('QueryBackend types', () => {
  it('LocalQuery supports basic filter/sort/group', () => {
    const query: LocalQuery = {
      filters: [{ field: 'status', operator: 'equals', value: 'active' }],
      sort: [{ field: 'name', direction: 'asc' }],
      groupBy: ['department'],
    };
    expect(query.filters).toHaveLength(1);
    expect(query.sort[0].direction).toBe('asc');
    expect(query.groupBy).toEqual(['department']);
  });

  it('LocalQuery supports pagination', () => {
    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      offset: 100,
      limit: 50,
    };
    expect(query.offset).toBe(100);
    expect(query.limit).toBe(50);
  });

  it('LocalQuery supports field selection', () => {
    const query: LocalQuery = {
      filters: [],
      sort: [],
      groupBy: [],
      fields: ['name', 'age'],
    };
    expect(query.fields).toEqual(['name', 'age']);
  });

  it('LocalQueryResult includes execution metadata', () => {
    const result: LocalQueryResult = {
      rows: [{ name: 'Alice' }],
      totalCount: 100,
      filteredCount: 1,
      executionEngine: 'js-compute',
      executionTimeMs: 5,
    };
    expect(result.executionEngine).toBe('js-compute');
    expect(result.executionTimeMs).toBe(5);
    expect(result.totalCount).toBe(100);
  });

  it('QueryBackendCapabilities describes engine features', () => {
    const caps: QueryBackendCapabilities = {
      filter: true,
      sort: true,
      group: true,
      aggregate: false,
      pagination: true,
    };
    expect(caps.aggregate).toBe(false);
    expect(caps.filter).toBe(true);
  });

  it('QueryBackend interface is implementable', async () => {
    const backend: QueryBackend = {
      async execute(query: LocalQuery): Promise<LocalQueryResult> {
        return {
          rows: [],
          totalCount: 0,
          filteredCount: 0,
          executionEngine: 'js-compute',
          executionTimeMs: 0,
        };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: false, aggregate: false, pagination: true };
      },
    };
    const result = await backend.execute({ filters: [], sort: [], groupBy: [] });
    expect(result.rows).toEqual([]);
    expect(backend.getCapabilities().group).toBe(false);
  });

  it('QueryBackend destroy is optional', () => {
    const backend: QueryBackend = {
      async execute() {
        return { rows: [], totalCount: 0, filteredCount: 0, executionEngine: 'js-compute', executionTimeMs: 0 };
      },
      getCapabilities() {
        return { filter: true, sort: true, group: true, aggregate: true, pagination: true };
      },
    };
    // destroy is optional — should not throw when undefined
    expect(backend.destroy).toBeUndefined();
  });

  it('execute returns engine type for each backend', async () => {
    const engines: LocalQueryResult['executionEngine'][] = ['js-compute', 'duckdb-wasm', 'server'];
    for (const engine of engines) {
      const result: LocalQueryResult = {
        rows: [],
        totalCount: 0,
        filteredCount: 0,
        executionEngine: engine,
        executionTimeMs: 0,
      };
      expect(engines).toContain(result.executionEngine);
    }
  });
});
