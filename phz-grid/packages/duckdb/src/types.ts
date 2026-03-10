/**
 * @phozart/phz-duckdb — Type Definitions
 *
 * DuckDB-WASM data source adapter types.
 * Uses peer dependencies: @duckdb/duckdb-wasm, apache-arrow
 */

import type { GridApi, Unsubscribe } from '@phozart/phz-core';

// --- External type stubs (from peer dependencies) ---
// These are minimal interfaces so the package compiles without hard deps.
// At runtime the real @duckdb/duckdb-wasm and apache-arrow objects are used.

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
  fields: Array<{ name: string; type: unknown; nullable: boolean }>;
}

export interface ArrowResultStream<_T = unknown> {
  [Symbol.asyncIterator](): AsyncIterator<ArrowRecordBatch>;
}

export interface ArrowRecordBatch {
  toArray(): unknown[];
  numRows: number;
}

// --- DuckDB Config ---

export interface DuckDBConfig {
  workerUrl?: string;
  wasmUrl?: string;
  enableStreaming?: boolean;
  enableProgress?: boolean;
  memoryLimit?: number;
  threads?: number;
}

// --- Data Source Interface ---

export interface DuckDBDataSource {
  // Connection
  initialize(): Promise<void>;
  connect(): Promise<AsyncDuckDBConnection>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Data Loading
  loadFile(file: File | URL | string, options?: LoadFileOptions): Promise<string>;
  loadMultipleFiles(files: Array<{ name: string; file: File | URL | string }>): Promise<string[]>;

  // Schema
  getSchema(tableName?: string): Promise<TableSchema>;
  getTables(): Promise<string[]>;
  getTableInfo(tableName: string): Promise<TableInfo>;

  // Query
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
  queryStream(sql: string, params?: unknown[]): AsyncIterable<QueryChunk>;
  executeSQL(sql: string): Promise<void>;
  cancelQuery(): void;
  onProgress(handler: (progress: QueryProgress) => void): Unsubscribe;

  // Arrow Integration
  toArrowTable(tableName?: string): Promise<ArrowTable>;
  fromArrowTable(table: ArrowTable, tableName: string): Promise<void>;

  // Worker
  getDatabase(): AsyncDuckDB;
  terminateWorker(): Promise<void>;

  // Grid Integration
  attachToGrid(grid: GridApi): void;
  detachFromGrid(): void;
}

// --- Loading ---

export interface LoadFileOptions {
  format?: 'csv' | 'parquet' | 'json' | 'arrow' | 'auto';
  tableName?: string;
  schema?: Record<string, string>;
  header?: boolean;
  delimiter?: string;
  compression?: 'gzip' | 'zstd' | 'snappy' | 'none' | 'auto';
}

// --- Schema ---

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

// --- Query ---

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

// --- Advanced Features ---

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
  fields: Array<{ name: string; type: string; nullable: boolean }>;
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
