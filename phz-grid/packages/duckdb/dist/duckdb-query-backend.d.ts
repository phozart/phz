/**
 * DuckDB QueryBackend — executes queries against DuckDB-WASM tables.
 *
 * Delegates SQL generation and execution to a provided executeSQL function.
 * Consumers must provide a pre-initialized query executor with data loaded.
 */
import type { QueryBackend } from '@phozart/phz-core';
export interface DuckDBQueryBackendOptions {
    tableName: string;
    /**
     * Query executor — accepts a SQL string and returns rows.
     * This is typically DuckDBDataSource.query() or a direct connection.
     */
    executeSQL: (sql: string) => Promise<Record<string, unknown>[]>;
}
export declare function createDuckDBQueryBackend(options: DuckDBQueryBackendOptions): QueryBackend;
//# sourceMappingURL=duckdb-query-backend.d.ts.map