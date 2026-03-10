/**
 * @phozart/phz-local — DuckDB Native Adapter (R.3)
 *
 * Implements DataAdapter wrapping native DuckDB Node.js bindings.
 * DuckDB is an optional dependency — this module gracefully handles
 * its absence. Tests mock the DuckDB interface.
 */
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema, DataSourceSummary } from '@phozart/phz-workspace';
export interface DuckDBBinding {
    run(sql: string, params?: unknown[]): Promise<void>;
    all(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}
export declare function buildQuerySQL(query: DataQuery): {
    sql: string;
    params: unknown[];
};
export declare class DuckDBNativeAdapter implements DataAdapter {
    private db;
    private dbPath;
    constructor(db: DuckDBBinding, dbPath: string);
    execute(query: DataQuery, context?: {
        viewerContext?: unknown;
        signal?: AbortSignal;
    }): Promise<DataResult>;
    getSchema(sourceId?: string): Promise<DataSourceSchema>;
    listDataSources(): Promise<DataSourceSummary[]>;
    getDistinctValues(sourceId: string, field: string, options?: {
        search?: string;
        limit?: number;
        filters?: unknown;
    }): Promise<{
        values: unknown[];
        totalCount: number;
        truncated: boolean;
    }>;
    getFieldStats(sourceId: string, field: string, filters?: unknown): Promise<{
        min?: number;
        max?: number;
        distinctCount: number;
        nullCount: number;
        totalCount: number;
    }>;
    importFile(filePath: string, tableName: string): Promise<void>;
}
//# sourceMappingURL=duckdb-native-adapter.d.ts.map