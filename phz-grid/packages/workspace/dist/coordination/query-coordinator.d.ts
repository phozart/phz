/**
 * @phozart/phz-workspace — Query Coordinator (K.6)
 *
 * Batches concurrent widget data queries with concurrency control,
 * deduplication, and cancellation via AbortController.
 */
import type { DataAdapter, DataQuery, CoordinatorResult, QueryCoordinatorConfig } from '../data-adapter.js';
export type { QueryCoordinatorConfig };
export interface QueryCoordinatorInstance {
    submit(widgetId: string, query: Omit<DataQuery, 'source'> & {
        source: string;
    }): Promise<CoordinatorResult>;
    cancel(widgetId: string): void;
    flush(): Promise<void>;
}
export declare function createQueryCoordinator(adapter: DataAdapter, config?: Partial<QueryCoordinatorConfig>): QueryCoordinatorInstance;
//# sourceMappingURL=query-coordinator.d.ts.map