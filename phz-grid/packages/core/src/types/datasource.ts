/**
 * @phozart/core — Data Source Types
 */

import type { RowData } from './row.js';
import type { ServerDataRequest, ServerDataResponse, ServerCapabilities } from './server.js';

export type DataSource<TData = any> =
  | LocalDataSource<TData>
  | AsyncDataSource<TData>
  | DuckDBDataSourceRef;

export interface LocalDataSource<TData = any> {
  type: 'local';
  data: TData[];
}

export interface AsyncDataSource<TData = any> {
  type: 'async';
  fetch(request: DataFetchRequest): Promise<DataFetchResponse<TData>>;
  serverFetch?(request: ServerDataRequest): Promise<ServerDataResponse<TData>>;
  capabilities?: ServerCapabilities;
}

export interface DataFetchRequest {
  offset: number;
  limit: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filter?: Array<{ field: string; operator: string; value: unknown }>;
}

export interface DataFetchResponse<TData = any> {
  data: TData[];
  totalCount: number;
}

export interface DuckDBDataSourceRef {
  type: 'duckdb';
  tableName: string;
  connection: DuckDBConnectionRef;
}

export interface DuckDBConnectionRef {
  isConnected(): boolean;
  query(sql: string): Promise<unknown[]>;
}
