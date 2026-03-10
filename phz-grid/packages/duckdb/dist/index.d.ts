/**
 * @phozart/phz-duckdb — DuckDB-WASM Data Source Adapter
 *
 * Provides a DuckDB-WASM-backed data source for large-scale
 * in-browser analytics with Apache Arrow integration.
 */
export type { DuckDBConfig, DuckDBDataSource, AsyncDuckDB, AsyncDuckDBConnection, ArrowTable, ArrowSchema, ArrowResultStream, ArrowRecordBatch, LoadFileOptions, TableSchema, ColumnSchema, TableInfo, QueryResult, QueryChunk, QueryProgress, ParquetMetadata, RowGroupMetadata, ColumnChunkMetadata, ColumnStatistics, ParquetSchema, QueryPlan, QueryPlanNode, } from './types.js';
export { createDuckDBDataSource, getQueryPlan } from './duckdb-data-source.js';
export { buildGridQuery, buildCountQuery, sanitizeIdentifier, type GridQueryInput, type SqlResult, type FilterInput, type SortInput, type ViewportInput, type AggregateColumn, type AggregationFunction, type HavingInput, } from './sql-builder.js';
export { DuckDBAsyncSource } from './duckdb-async-source.js';
export { DuckDBBridge, type BridgeRefreshResult } from './duckdb-bridge.js';
export { HybridEngine, type HybridEngineConfig, type EngineMode } from './hybrid-engine.js';
export { buildAggregationQuery, buildGroupAggregationQuery, type DuckDBAggregationFunction, type AggregationFieldInput, } from './duckdb-aggregation.js';
export { buildPivotQuery } from './duckdb-pivot.js';
export { createAIQueryExecutor, type AIQueryExecutor, type AIQueryExecutorConfig, type AIExecutionResult, type AIToolkitLike, } from './ai-executor.js';
export { buildProjectionQuery, buildPredicatePushdownQuery, buildSchemaInspectionQuery, } from './parquet-loader.js';
export { buildJoinQuery, buildCreateViewQuery, type JoinDefinition, type JoinCondition, type JoinFilter, } from './data-blending.js';
export { DuckDBComputeBackend, createDuckDBComputeBackend, type DuckDBQueryExecutor, } from './duckdb-compute-backend.js';
export { createDuckDBQueryBackend } from './duckdb-query-backend.js';
export type { DuckDBQueryBackendOptions } from './duckdb-query-backend.js';
export { createDuckDBPool } from './duckdb-pool.js';
export type { DuckDBPool, DuckDBPoolTable } from './duckdb-pool.js';
//# sourceMappingURL=index.d.ts.map