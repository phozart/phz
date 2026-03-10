/**
 * @phozart/phz-duckdb — DuckDB-WASM Data Source Implementation
 *
 * Creates a DuckDB-backed data source that can connect to a grid instance.
 * Uses @duckdb/duckdb-wasm as a peer dependency — at runtime users must
 * have it installed.
 */
import type { DuckDBConfig, DuckDBDataSource } from './types.js';
export declare function createDuckDBDataSource(config: DuckDBConfig): DuckDBDataSource;
export declare function getQueryPlan(dataSource: DuckDBDataSource, sql: string): Promise<import('./types.js').QueryPlan>;
//# sourceMappingURL=duckdb-data-source.d.ts.map