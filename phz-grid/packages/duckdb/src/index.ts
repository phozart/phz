/**
 * @phozart/duckdb — DuckDB-WASM Data Source Adapter
 *
 * Provides a DuckDB-WASM-backed data source for large-scale
 * in-browser analytics with Apache Arrow integration.
 */

// Types
export type {
  DuckDBConfig,
  DuckDBDataSource,
  AsyncDuckDB,
  AsyncDuckDBConnection,
  ArrowTable,
  ArrowSchema,
  ArrowResultStream,
  ArrowRecordBatch,
  LoadFileOptions,
  TableSchema,
  ColumnSchema,
  TableInfo,
  QueryResult,
  QueryChunk,
  QueryProgress,
  ParquetMetadata,
  RowGroupMetadata,
  ColumnChunkMetadata,
  ColumnStatistics,
  ParquetSchema,
  QueryPlan,
  QueryPlanNode,
} from './types.js';

// Factory
export { createDuckDBDataSource, getQueryPlan } from './duckdb-data-source.js';

// SQL Builder (WI 23)
export {
  buildGridQuery,
  buildCountQuery,
  sanitizeIdentifier,
  type GridQueryInput,
  type SqlResult,
  type FilterInput,
  type SortInput,
  type ViewportInput,
  type AggregateColumn,
  type AggregationFunction,
  type HavingInput,
} from './sql-builder.js';

// DuckDB AsyncDataSource adapter
export { DuckDBAsyncSource } from './duckdb-async-source.js';

// DuckDB Bridge (WI 23)
export { DuckDBBridge, type BridgeRefreshResult } from './duckdb-bridge.js';

// Hybrid Engine (WI 23)
export { HybridEngine, type HybridEngineConfig, type EngineMode } from './hybrid-engine.js';

// DuckDB Aggregation (WI 24)
export {
  buildAggregationQuery,
  buildGroupAggregationQuery,
  type DuckDBAggregationFunction,
  type AggregationFieldInput,
} from './duckdb-aggregation.js';

// DuckDB Pivot (WI 25)
export { buildPivotQuery, type DateGranularity, type PivotQueryOptions } from './duckdb-pivot.js';

// AI Executor (WI 26)
export {
  createAIQueryExecutor,
  type AIQueryExecutor,
  type AIQueryExecutorConfig,
  type AIExecutionResult,
  type AIToolkitLike,
} from './ai-executor.js';

// Parquet Loader (WI 27)
export {
  buildProjectionQuery,
  buildPredicatePushdownQuery,
  buildSchemaInspectionQuery,
} from './parquet-loader.js';

// Data Blending (WI 28)
export {
  buildJoinQuery,
  buildCreateViewQuery,
  type JoinDefinition,
  type JoinCondition,
  type JoinFilter,
} from './data-blending.js';

// DuckDB ComputeBackend
export {
  DuckDBComputeBackend,
  createDuckDBComputeBackend,
  sanitizeExpression,
  type DuckDBQueryExecutor,
} from './duckdb-compute-backend.js';

// QueryBackend
export { createDuckDBQueryBackend } from './duckdb-query-backend.js';
export type { DuckDBQueryBackendOptions } from './duckdb-query-backend.js';

// Connection Pool
export { createDuckDBPool } from './duckdb-pool.js';
export type { DuckDBPool, DuckDBPoolTable } from './duckdb-pool.js';

// DuckDB Export
export { exportTable, exportFilteredTable, buildExportQuery } from './duckdb-export.js';
export type { ExportFormat, ExportCompression, ExportOptions } from './duckdb-export.js';

// Error Classes
export { PhzConnectionError, PhzQueryError, type ConnectionPhase } from './errors.js';
