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
export interface QueryCoordinatorConfig {
    maxConcurrent: number;
    batchWindowMs: number;
}
export declare function defaultQueryCoordinatorConfig(overrides?: Partial<QueryCoordinatorConfig>): QueryCoordinatorConfig;
export interface CoordinatorQuery {
    fields?: string[];
    filters?: Record<string, unknown>;
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
    offset?: number;
    [key: string]: unknown;
}
export interface CoordinatorResult {
    data: unknown[];
    meta?: Record<string, unknown>;
}
export interface QueryCoordinatorInstance {
    submit(widgetId: string, query: CoordinatorQuery & {
        source: string;
    }): Promise<CoordinatorResult>;
    cancel(widgetId: string): void;
    flush(): Promise<void>;
}
export declare function isQueryCoordinatorConfig(obj: unknown): obj is QueryCoordinatorConfig;
//# sourceMappingURL=query-coordinator.d.ts.map