/**
 * Server QueryBackend — delegates query execution to a DataAdapter.
 *
 * Maps the grid's LocalQuery format to the DataAdapter's DataQuery format,
 * executes via adapter.execute(), and returns LocalQueryResult.
 */

import type {
  QueryBackend,
  LocalQuery,
  LocalQueryResult,
  QueryBackendCapabilities,
} from '@phozart/core';
import type { DataAdapter, DataQuery } from '../adapters/data-adapter.js';

export interface ServerQueryBackendOptions {
  adapter: DataAdapter;
  sourceId: string;
}

export function createServerQueryBackend(options: ServerQueryBackendOptions): QueryBackend {
  const { adapter, sourceId } = options;

  const capabilities: QueryBackendCapabilities = {
    filter: true,
    sort: true,
    group: false,
    aggregate: false,
    pagination: true,
  };

  return {
    async execute(query: LocalQuery): Promise<LocalQueryResult> {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const dataQuery: DataQuery = {
        source: sourceId,
        fields: query.fields ?? [],
        sort: query.sort.length > 0 ? query.sort : undefined,
        limit: query.limit,
        offset: query.offset,
      };

      if (query.filters.length > 0) {
        dataQuery.filters = query.filters.map(f => ({
          field: f.field,
          operator: f.operator as DataQuery['filters'] extends Array<infer T> ? T extends { operator: infer O } ? O : never : never,
          value: f.value,
        }));
      }

      const result = await adapter.execute(dataQuery);

      const rows = result.rows ?? [];
      const totalCount = result.metadata?.totalRows ?? rows.length;
      const filteredCount = totalCount;

      const elapsed = typeof performance !== 'undefined'
        ? performance.now() - startTime
        : Date.now() - startTime;

      return {
        rows: rows as unknown as Record<string, unknown>[],
        totalCount,
        filteredCount,
        executionEngine: 'server',
        executionTimeMs: Math.round(elapsed * 100) / 100,
      };
    },

    getCapabilities(): QueryBackendCapabilities {
      return { ...capabilities };
    },

    destroy(): void {
      // Server connections are managed by the DataAdapter
    },
  };
}
