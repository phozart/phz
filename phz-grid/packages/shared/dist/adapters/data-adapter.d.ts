/**
 * @phozart/shared — DataAdapter SPI & Related Types
 *
 * Core contract for data sources. Consumer applications implement DataAdapter
 * to provide query execution, schema introspection, and field-level metadata.
 *
 * v15 additions: optional async query methods for long-running reports.
 */
import type { AsyncReportRequest } from '../types/async-report.js';
export type SemanticHint = 'measure' | 'dimension' | 'identifier' | 'timestamp' | 'category' | 'currency' | 'percentage';
export interface UnitSpec {
    type: 'currency' | 'percent' | 'number' | 'duration' | 'custom';
    currencyCode?: string;
    durationUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
    suffix?: string;
    decimalPlaces?: number;
    abbreviate?: boolean;
    showSign?: boolean;
}
export interface ViewerContext {
    userId?: string;
    roles?: string[];
    teams?: string[];
    attributes?: Record<string, unknown>;
}
export interface DataSourceMeta {
    id: string;
    name: string;
    description?: string;
    fieldCount: number;
    rowCount?: number;
    lastRefreshed?: string;
    tags?: string[];
}
export interface FieldMetadata {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    nullable: boolean;
    cardinality?: 'low' | 'medium' | 'high';
    semanticHint?: SemanticHint;
    unit?: UnitSpec;
}
export interface DataQuery {
    source: string;
    fields: string[];
    filters?: DataQueryFilter[];
    groupBy?: string[];
    sort?: DataQuerySort[];
    limit?: number;
    offset?: number;
    aggregations?: DataQueryAggregation[];
}
export type DataQueryFilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'notBetween' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
export interface DataQueryFilter {
    field: string;
    operator: DataQueryFilterOperator;
    value: unknown;
}
export interface DataQuerySort {
    field: string;
    direction: 'asc' | 'desc';
}
export type AggregationFunction = 'sum' | 'avg' | 'count' | 'countDistinct' | 'min' | 'max' | 'median' | 'stddev' | 'variance' | 'first' | 'last';
export interface DataQueryAggregation {
    field: string;
    function: AggregationFunction;
    alias?: string;
}
export interface ColumnDescriptor {
    name: string;
    dataType: string;
}
export interface DataResultMetadata {
    totalRows: number;
    truncated: boolean;
    queryTimeMs: number;
}
export interface DataResult {
    columns: ColumnDescriptor[];
    rows: unknown[][];
    metadata: DataResultMetadata;
    /** Arrow IPC buffer for DuckDB-WASM ingestion. */
    arrowBuffer?: ArrayBuffer;
}
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'parquet' | 'pdf';
export interface DataSourceSchema {
    id: string;
    name: string;
    fields: FieldMetadata[];
}
export interface DistinctValuesResult {
    values: unknown[];
    totalCount: number;
    truncated: boolean;
}
export interface FieldStatsResult {
    min?: number;
    max?: number;
    distinctCount: number;
    nullCount: number;
    totalCount: number;
}
export type AsyncRequestPhase = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' | 'expired';
export interface AsyncRequestStatus {
    requestId: string;
    phase: AsyncRequestPhase;
    progress?: number;
    resultUrl?: string;
    errorMessage?: string;
    startedAt?: number;
    completedAt?: number;
}
/**
 * Core data adapter SPI. Consumer applications implement this interface
 * to provide data access for grids, dashboards, and reports.
 *
 * All methods receive plain objects and return Promises. Implementations
 * must be side-effect-free beyond network I/O.
 */
export interface DataAdapter {
    /**
     * Execute a synchronous query and return tabular results.
     */
    execute(query: DataQuery, context?: {
        viewerContext?: ViewerContext;
        signal?: AbortSignal;
    }): Promise<DataResult>;
    /**
     * Retrieve the schema (field metadata) for a given data source.
     */
    getSchema(sourceId?: string): Promise<DataSourceSchema>;
    /**
     * List available data sources.
     */
    listDataSources(): Promise<DataSourceMeta[]>;
    /**
     * Get distinct values for a field, with optional search and limit.
     */
    getDistinctValues(sourceId: string, field: string, options?: {
        search?: string;
        limit?: number;
        filters?: DataQueryFilter[];
    }): Promise<DistinctValuesResult>;
    /**
     * Get summary statistics for a field.
     */
    getFieldStats(sourceId: string, field: string, filters?: DataQueryFilter[]): Promise<FieldStatsResult>;
    /**
     * Submit a long-running query for asynchronous execution.
     * Returns a request ID that can be polled with getAsyncRequestStatus.
     */
    executeQueryAsync?(request: AsyncReportRequest, context?: {
        viewerContext?: ViewerContext;
        signal?: AbortSignal;
    }): Promise<{
        requestId: string;
    }>;
    /**
     * Poll the status of an async request.
     */
    getAsyncRequestStatus?(requestId: string): Promise<AsyncRequestStatus>;
    /**
     * List all active/recent async requests for the current viewer.
     */
    listAsyncRequests?(context?: {
        viewerContext?: ViewerContext;
    }): Promise<AsyncRequestStatus[]>;
    /**
     * Cancel a running async request.
     */
    cancelAsyncRequest?(requestId: string): Promise<void>;
}
/**
 * Returns true when the given result contains a non-empty Arrow IPC buffer.
 */
export declare function hasArrowBuffer(result: DataResult): boolean;
//# sourceMappingURL=data-adapter.d.ts.map