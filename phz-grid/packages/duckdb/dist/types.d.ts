/**
 * @phozart/duckdb — Type Definitions
 *
 * DuckDB-WASM data source adapter types.
 * Uses peer dependencies: @duckdb/duckdb-wasm, apache-arrow
 */
import type { GridApi, Unsubscribe } from '@phozart/core';
export interface AsyncDuckDB {
    open(config: unknown): Promise<void>;
    connect(): Promise<AsyncDuckDBConnection>;
    registerFileBuffer(name: string, buffer: Uint8Array): Promise<void>;
    registerFileURL(name: string, url: string): Promise<void>;
    terminate(): Promise<void>;
}
export interface AsyncDuckDBConnection {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<ArrowTable<T>>;
    send<T = unknown>(sql: string, params?: unknown[]): Promise<ArrowResultStream<T>>;
    close(): Promise<void>;
    cancelSent(): Promise<void>;
}
export interface ArrowTable<_T = unknown> {
    toArray(): unknown[];
    numRows: number;
    schema: ArrowSchema;
}
export interface ArrowSchema {
    fields: Array<{
        name: string;
        type: unknown;
        nullable: boolean;
    }>;
}
export interface ArrowResultStream<_T = unknown> {
    [Symbol.asyncIterator](): AsyncIterator<ArrowRecordBatch>;
}
export interface ArrowRecordBatch {
    toArray(): unknown[];
    numRows: number;
}
/**
 * Configuration for {@link createDuckDBDataSource}.
 *
 * All properties are optional. By default the data source uses the
 * bundled DuckDB-WASM URLs from `@duckdb/duckdb-wasm` and auto-detects
 * `SharedArrayBuffer` support for multi-threading.
 */
export interface DuckDBConfig {
    /** Custom URL for the DuckDB WASM worker script. */
    workerUrl?: string;
    /** Custom URL for the DuckDB WASM binary (`.wasm` file). */
    wasmUrl?: string;
    /** Enable streaming query results via `queryStream()`. */
    enableStreaming?: boolean;
    /** Enable query progress callbacks via `onProgress()`. */
    enableProgress?: boolean;
    /** Maximum memory (in MB) DuckDB may use. */
    memoryLimit?: number;
    /** Number of worker threads. Falls back to 1 when `SharedArrayBuffer` is unavailable. */
    threads?: number;
}
/**
 * DuckDB-WASM data source — provides in-browser SQL analytics with
 * support for CSV, Parquet, JSON, and Arrow IPC files.
 *
 * Lifecycle: `initialize()` -> `connect()` -> load data / query -> `terminateWorker()`.
 *
 * Created via {@link createDuckDBDataSource}.
 */
export interface DuckDBDataSource {
    /** Download and instantiate the DuckDB WASM binary. Must be called first. */
    initialize(): Promise<void>;
    /** Open a connection to the in-memory database. */
    connect(): Promise<AsyncDuckDBConnection>;
    /** Close the current connection. */
    disconnect(): Promise<void>;
    /** Returns `true` if a connection is open. */
    isConnected(): boolean;
    /** Load a file (File, URL, or path string) into a DuckDB table. Returns the table name. */
    loadFile(file: File | URL | string, options?: LoadFileOptions): Promise<string>;
    /** Load multiple files into named tables. Returns an array of table names. */
    loadMultipleFiles(files: Array<{
        name: string;
        file: File | URL | string;
    }>): Promise<string[]>;
    /** Get the schema (columns, row count) for a table. Defaults to the first loaded table. */
    getSchema(tableName?: string): Promise<TableSchema>;
    /** List all table names in the database. */
    getTables(): Promise<string[]>;
    /** Get detailed info (schema, size, counts) for a specific table. */
    getTableInfo(tableName: string): Promise<TableInfo>;
    /** Execute a SQL query and return all results at once. */
    query(sql: string, params?: unknown[]): Promise<QueryResult>;
    /** Execute a SQL query and stream results in batches. */
    queryStream(sql: string, params?: unknown[]): AsyncIterable<QueryChunk>;
    /** Execute a read-only SQL statement (SELECT, WITH, EXPLAIN, DESCRIBE, SHOW). */
    executeSQL(sql: string): Promise<void>;
    /** Cancel the currently running query. */
    cancelQuery(): void;
    /** Subscribe to query progress updates. Returns an unsubscribe function. */
    onProgress(handler: (progress: QueryProgress) => void): Unsubscribe;
    /** Export a table as an Apache Arrow table. */
    toArrowTable(tableName?: string): Promise<ArrowTable>;
    /** Import an Apache Arrow table into DuckDB under the given name. */
    fromArrowTable(table: ArrowTable, tableName: string): Promise<void>;
    /** Get the underlying AsyncDuckDB instance. */
    getDatabase(): AsyncDuckDB;
    /** Disconnect and terminate the DuckDB Web Worker. */
    terminateWorker(): Promise<void>;
    /** Wire this data source to a grid, pushing query results via DuckDBBridge. */
    attachToGrid(grid: GridApi): void;
    /** Detach from the currently attached grid. */
    detachFromGrid(): void;
}
export interface LoadFileOptions {
    format?: 'csv' | 'parquet' | 'json' | 'arrow' | 'auto';
    tableName?: string;
    schema?: Record<string, string>;
    header?: boolean;
    delimiter?: string;
    compression?: 'gzip' | 'zstd' | 'snappy' | 'none' | 'auto';
}
export interface TableSchema {
    name: string;
    columns: ColumnSchema[];
    rowCount: number;
}
export interface ColumnSchema {
    name: string;
    type: string;
    nullable: boolean;
}
export interface TableInfo {
    name: string;
    schema: TableSchema;
    sizeBytes: number;
    rowCount: number;
    columnCount: number;
}
export interface QueryResult {
    data: unknown[];
    schema: ColumnSchema[];
    rowCount: number;
    executionTime: number;
    fromCache: boolean;
}
export interface QueryChunk {
    data: unknown[];
    index: number;
    total: number;
    progress: number;
}
export interface QueryProgress {
    state: 'preparing' | 'executing' | 'streaming' | 'complete' | 'error';
    progress: number;
    rowsProcessed: number;
    totalRows?: number;
    message?: string;
}
export interface ParquetMetadata {
    version: string;
    rowGroups: RowGroupMetadata[];
    schema: ParquetSchema;
    totalRows: number;
}
export interface RowGroupMetadata {
    id: number;
    rowCount: number;
    columns: ColumnChunkMetadata[];
    totalByteSize: number;
}
export interface ColumnChunkMetadata {
    name: string;
    type: string;
    encoding: string;
    compression: string;
    statistics?: ColumnStatistics;
}
export interface ColumnStatistics {
    min?: unknown;
    max?: unknown;
    nullCount: number;
    distinctCount?: number;
}
export interface ParquetSchema {
    fields: Array<{
        name: string;
        type: string;
        nullable: boolean;
    }>;
}
export interface QueryPlan {
    sql: string;
    plan: QueryPlanNode[];
    estimatedCost: number;
    estimatedRows: number;
}
export interface QueryPlanNode {
    id: number;
    type: string;
    table?: string;
    filter?: string;
    estimatedRows: number;
    children: QueryPlanNode[];
}
//# sourceMappingURL=types.d.ts.map