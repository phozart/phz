/**
 * @phozart/shared — QueryCoordinator types (A-1.05)
 *
 * Batches concurrent widget data queries with concurrency control,
 * deduplication, and cancellation.
 *
 * Pure types only — the implementation lives in workspace.
 *
 * Extracted from workspace/coordination/query-coordinator.ts + workspace/data-adapter.ts.
 */

// ========================================================================
// QueryCoordinatorConfig
// ========================================================================

export interface QueryCoordinatorConfig {
  maxConcurrent: number;
  batchWindowMs: number;
}

export function defaultQueryCoordinatorConfig(
  overrides?: Partial<QueryCoordinatorConfig>,
): QueryCoordinatorConfig {
  return {
    maxConcurrent: 4,
    batchWindowMs: 50,
    ...overrides,
  };
}

// ========================================================================
// CoordinatorQuery / CoordinatorResult
// ========================================================================

export interface CoordinatorQuery {
  fields?: string[];
  filters?: Record<string, unknown>;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface CoordinatorResult {
  data: unknown[];
  meta?: Record<string, unknown>;
}

// ========================================================================
// QueryCoordinatorInstance interface
// ========================================================================

export interface QueryCoordinatorInstance {
  submit(widgetId: string, query: CoordinatorQuery & { source: string }): Promise<CoordinatorResult>;
  cancel(widgetId: string): void;
  flush(): Promise<void>;
}

// ========================================================================
// Type guard
// ========================================================================

export function isQueryCoordinatorConfig(obj: unknown): obj is QueryCoordinatorConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.maxConcurrent === 'number' &&
    typeof o.batchWindowMs === 'number'
  );
}
