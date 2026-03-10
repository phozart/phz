/**
 * @phozart/phz-core — QueryBackend abstraction
 *
 * A unified query interface that decouples the grid's data pipeline
 * from the execution engine. Implementations can use in-memory JS,
 * DuckDB-WASM, or a remote server to process filter/sort/group operations.
 */

export interface LocalQuery {
  filters: Array<{ field: string; operator: string; value: unknown }>;
  sort: Array<{ field: string; direction: 'asc' | 'desc' }>;
  groupBy: string[];
  offset?: number;
  limit?: number;
  fields?: string[];
}

export interface LocalQueryResult {
  rows: Record<string, unknown>[];
  totalCount: number;
  filteredCount: number;
  executionEngine: 'js-compute' | 'duckdb-wasm' | 'server';
  executionTimeMs: number;
}

export interface QueryBackendCapabilities {
  filter: boolean;
  sort: boolean;
  group: boolean;
  aggregate: boolean;
  pagination: boolean;
}

export interface QueryBackend {
  execute(query: LocalQuery): Promise<LocalQueryResult>;
  getCapabilities(): QueryBackendCapabilities;
  destroy?(): void;
}
