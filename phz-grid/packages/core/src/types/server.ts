/**
 * @phozart/core — Server-Side Operation Types
 *
 * Unified types for server-side data fetching, filtering, sorting,
 * grouping, export, mutations, and real-time updates.
 */

// --- Pagination ---

export interface OffsetPagination {
  type: 'offset';
  offset: number;
  limit: number;
}

export interface CursorPagination {
  type: 'cursor';
  cursor?: string;
  limit: number;
}

export type PaginationRequest = OffsetPagination | CursorPagination;

export interface PaginationInfo {
  totalCount?: number;
  totalCountType: 'exact' | 'estimate' | 'unknown';
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// --- Sort ---

export interface SortDescriptor {
  field: string;
  direction: 'asc' | 'desc';
  collation?: string;
}

// --- Filter ---

export interface ServerFilterCondition {
  field: string;
  operator: string;
  value: unknown;
  valueTo?: unknown;
}

export interface ServerFilterGroup {
  logic: 'and' | 'or';
  conditions: Array<ServerFilterCondition | ServerFilterGroup>;
}

export function isServerFilterGroup(
  item: ServerFilterCondition | ServerFilterGroup,
): item is ServerFilterGroup {
  return 'logic' in item && 'conditions' in item;
}

// --- Grouping ---

export interface ServerGroupField {
  field: string;
  aggregations?: Array<{ field: string; function: string }>;
}

export interface ServerGroupRequest {
  groupBy: ServerGroupField[];
  expandedGroupKeys: unknown[][];
}

export interface ServerGroupRow {
  groupKey: unknown[];
  groupLabel: string;
  childCount: number;
  hasSubGroups: boolean;
  aggregates?: Record<string, unknown>;
}

// --- Request / Response ---

export interface ServerDataRequest {
  pagination: PaginationRequest;
  sort?: SortDescriptor[];
  filter?: ServerFilterGroup;
  grouping?: ServerGroupRequest;
  fullTextSearch?: string;
  signal?: AbortSignal;
}

export interface ServerDataResponse<T = unknown> {
  rows: T[];
  pagination: PaginationInfo;
  groupRows?: ServerGroupRow[];
  aggregates?: Record<string, Record<string, unknown>>;
}

// --- Server Capabilities ---

export interface ServerCapabilities {
  sort: boolean;
  filter: boolean;
  grouping: boolean;
  pivot: boolean;
  fullTextSearch: boolean;
  cursorPagination: boolean;
  exactTotalCount: boolean;
  realTimeUpdates: boolean;
  exportFormats?: ('csv' | 'xlsx' | 'pdf' | 'parquet')[];
  filterOperators?: Record<string, string[]>;
}

// --- Server Export ---

export interface ServerExportRequest {
  format: 'csv' | 'xlsx' | 'pdf' | 'parquet';
  filter?: ServerFilterGroup;
  sort?: SortDescriptor[];
  columns?: string[];
  fileName?: string;
}

export type ServerExportResponse =
  | { type: 'sync'; downloadUrl: string }
  | { type: 'async'; jobId: string };

export interface ExportProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  rowsProcessed: number;
  downloadUrl?: string;
  error?: string;
}

export interface ServerExportProvider {
  requestExport(request: ServerExportRequest): Promise<ServerExportResponse>;
  getExportStatus?(jobId: string): Promise<ExportProgress>;
  cancelExport?(jobId: string): Promise<void>;
}

// --- Mutations ---

export interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  conflict?: MutationConflict<T>;
}

export interface MutationConflict<T = unknown> {
  serverVersion: T;
  baseVersion: T;
  clientChanges: Partial<T>;
}

export interface BatchMutationResult<T = unknown> {
  results: MutationResult<T>[];
  successCount: number;
  failureCount: number;
}

export interface MutationOperation<T = unknown> {
  type: 'insert' | 'update' | 'delete';
  rowId?: string;
  data?: Partial<T>;
}

export interface DataMutationProvider<T = unknown> {
  insertRow(data: T): Promise<MutationResult<T>>;
  updateRow(rowId: string, changes: Partial<T>): Promise<MutationResult<T>>;
  deleteRow(rowId: string): Promise<MutationResult<void>>;
  batch?(operations: MutationOperation<T>[]): Promise<BatchMutationResult<T>>;
}

// --- Real-Time Push Updates ---

export type RealtimeConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface DataUpdate<T = unknown> {
  type: 'insert' | 'update' | 'delete' | 'refresh';
  rowId?: string;
  data?: T;
  delta?: Partial<T>;
  timestamp: number;
  sequence: number;
}

export type DataUpdateHandler<T = unknown> = (update: DataUpdate<T>) => void;

export interface RealtimeProvider<T = unknown> {
  subscribe(handler: DataUpdateHandler<T>): () => void;
  getConnectionState(): RealtimeConnectionState;
  onConnectionStateChange(handler: (state: RealtimeConnectionState) => void): () => void;
}

// --- Retry Policy ---

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryOnCodes?: DataSourceErrorCode[];
}

export type DataSourceErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'ABORTED';

export interface DataSourceError {
  code: DataSourceErrorCode;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}
