/**
 * @phozart/workspace — MemoryDataAdapter
 *
 * In-memory implementation of DataAdapter for testing, prototyping,
 * and small datasets. Stores rows as plain objects and executes
 * queries (filter, sort, aggregate, paginate) over them.
 */
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema, DataSourceSummary } from '../data-adapter.js';
type Row = Record<string, unknown>;
export declare class MemoryDataAdapter implements DataAdapter {
    private sources;
    addSource(id: string, data: Row[]): void;
    removeSource(id: string): void;
    private getSourceOrThrow;
    getSchema(sourceId?: string): Promise<DataSourceSchema>;
    listDataSources(): Promise<DataSourceSummary[]>;
    execute(query: DataQuery, context?: {
        viewerContext?: unknown;
        signal?: AbortSignal;
    }): Promise<DataResult>;
    private executeGroupBy;
    private computeAggregation;
    getDistinctValues(sourceId: string, field: string, options?: {
        search?: string;
        limit?: number;
        filters?: unknown;
    }): Promise<{
        values: unknown[];
        totalCount: number;
        truncated: boolean;
    }>;
    getFieldStats(sourceId: string, field: string, _filters?: unknown): Promise<{
        min?: number;
        max?: number;
        distinctCount: number;
        nullCount: number;
        totalCount: number;
    }>;
}
export {};
//# sourceMappingURL=memory-data-adapter.d.ts.map