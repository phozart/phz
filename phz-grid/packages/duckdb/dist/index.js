/**
 * @phozart/duckdb — DuckDB-WASM Data Source Adapter
 *
 * Provides a DuckDB-WASM-backed data source for large-scale
 * in-browser analytics with Apache Arrow integration.
 */
// Factory
export { createDuckDBDataSource, getQueryPlan } from './duckdb-data-source.js';
// SQL Builder (WI 23)
export { buildGridQuery, buildCountQuery, sanitizeIdentifier, } from './sql-builder.js';
// DuckDB AsyncDataSource adapter
export { DuckDBAsyncSource } from './duckdb-async-source.js';
// DuckDB Bridge (WI 23)
export { DuckDBBridge } from './duckdb-bridge.js';
// Hybrid Engine (WI 23)
export { HybridEngine } from './hybrid-engine.js';
// DuckDB Aggregation (WI 24)
export { buildAggregationQuery, buildGroupAggregationQuery, } from './duckdb-aggregation.js';
// DuckDB Pivot (WI 25)
export { buildPivotQuery } from './duckdb-pivot.js';
// AI Executor (WI 26)
export { createAIQueryExecutor, } from './ai-executor.js';
// Parquet Loader (WI 27)
export { buildProjectionQuery, buildPredicatePushdownQuery, buildSchemaInspectionQuery, } from './parquet-loader.js';
// Data Blending (WI 28)
export { buildJoinQuery, buildCreateViewQuery, } from './data-blending.js';
// DuckDB ComputeBackend
export { DuckDBComputeBackend, createDuckDBComputeBackend, sanitizeExpression, } from './duckdb-compute-backend.js';
// QueryBackend
export { createDuckDBQueryBackend } from './duckdb-query-backend.js';
// Connection Pool
export { createDuckDBPool } from './duckdb-pool.js';
// DuckDB Export
export { exportTable, exportFilteredTable, buildExportQuery } from './duckdb-export.js';
// Error Classes
export { PhzConnectionError, PhzQueryError } from './errors.js';
//# sourceMappingURL=index.js.map