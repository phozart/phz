/**
 * @phozart/duckdb — DuckDB-WASM Data Source Implementation
 *
 * Creates a DuckDB-backed data source that can connect to a grid instance.
 * Uses @duckdb/duckdb-wasm as a peer dependency — at runtime users must
 * have it installed.
 */
import type { DuckDBConfig, DuckDBDataSource } from './types.js';
/**
 * Create a DuckDB-WASM backed data source for in-browser SQL analytics.
 *
 * The returned {@link DuckDBDataSource} must be initialized and connected
 * before use. It can load CSV, Parquet, JSON, and Arrow IPC files, run
 * arbitrary SQL queries, and attach directly to a grid via `attachToGrid()`.
 *
 * @param config - DuckDB configuration (WASM/Worker URLs, memory limit, threads).
 * @returns An uninitialized {@link DuckDBDataSource}. Call `initialize()` then `connect()`.
 *
 * @throws Error if `initialize()` or `connect()` fails (e.g. missing WASM binary).
 *
 * @example
 * ```ts
 * import { createDuckDBDataSource } from '@phozart/duckdb';
 *
 * const ds = createDuckDBDataSource({ memoryLimit: 512 });
 * await ds.initialize();
 * await ds.connect();
 *
 * await ds.loadFile('/data/sales.parquet');
 * const result = await ds.query('SELECT region, SUM(revenue) FROM sales GROUP BY region');
 * console.log(result.data);
 *
 * await ds.terminateWorker();
 * ```
 */
export declare function createDuckDBDataSource(config: DuckDBConfig): DuckDBDataSource;
export declare function getQueryPlan(dataSource: DuckDBDataSource, sql: string): Promise<import('./types.js').QueryPlan>;
//# sourceMappingURL=duckdb-data-source.d.ts.map