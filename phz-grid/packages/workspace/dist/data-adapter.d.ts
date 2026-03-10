/**
 * @phozart/phz-workspace — DataAdapter Interface & Related Types
 *
 * Defines the contract for data sources, queries, aggregations,
 * time intelligence, data quality, and query coordination.
 *
 * NOTE: The workspace DataAdapter, DataQuery, and DataResult are extended
 * versions of the shared types (with pivotBy, windows, strategy, quality).
 * Do NOT replace these with shared re-exports — they are workspace-specific
 * supersets. The coordinator types below ARE re-exported from shared.
 */
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
export interface FieldMetadata {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    nullable: boolean;
    cardinality?: 'low' | 'medium' | 'high';
    semanticHint?: SemanticHint;
    unit?: UnitSpec;
}
export interface ColumnDescriptor {
    name: string;
    dataType: string;
}
export interface DataSourceSchema {
    id: string;
    name: string;
    fields: FieldMetadata[];
    timeIntelligence?: TimeIntelligenceConfig;
}
export interface DataSourceSummary {
    id: string;
    name: string;
    fieldCount: number;
    rowCount?: number;
}
export type AggregationFunction = 'sum' | 'avg' | 'count' | 'countDistinct' | 'min' | 'max' | 'median' | 'stddev' | 'variance' | 'first' | 'last';
export interface AggregationSpec {
    field: string;
    function: AggregationFunction;
    alias?: string;
}
export type WindowFunction = 'runningTotal' | 'rank' | 'denseRank' | 'rowNumber' | 'lag' | 'lead' | 'percentOfTotal' | 'periodOverPeriod';
export interface WindowSpec {
    field: string;
    function: WindowFunction;
    partitionBy?: string[];
    orderBy?: string[];
    alias: string;
    offset?: number;
    periodField?: string;
    periodGranularity?: string;
}
export interface DataQualityIssue {
    severity: 'info' | 'warning' | 'error';
    message: string;
    field?: string;
}
export interface DataQualityInfo {
    lastRefreshed?: string;
    freshnessStatus?: 'fresh' | 'stale' | 'unknown';
    freshnessThresholdMinutes?: number;
    completeness?: number;
    issues?: DataQualityIssue[];
}
export declare function computeFreshnessStatus(lastRefreshed: string, thresholdMinutes: number): 'fresh' | 'stale' | 'unknown';
export interface FieldReference {
    field: string;
}
export interface DataResult {
    columns: ColumnDescriptor[];
    rows: unknown[][];
    metadata: {
        totalRows: number;
        truncated: boolean;
        queryTimeMs: number;
        quality?: DataQualityInfo;
    };
    /** Arrow IPC buffer for DuckDB-WASM ingestion. Widgets receive rows; arrowBuffer enables local query. */
    arrowBuffer?: ArrayBuffer;
}
/**
 * Type guard: returns true when result has a non-empty Arrow IPC buffer.
 */
export declare function hasArrowBuffer(result: DataResult): boolean;
export interface DataQuery {
    source: string;
    fields: string[];
    filters?: unknown;
    groupBy?: string[];
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
    offset?: number;
    aggregations?: AggregationSpec[];
    pivotBy?: FieldReference[];
    windows?: WindowSpec[];
    strategy?: QueryStrategy;
}
export interface QueryStrategy {
    execution: 'server' | 'cache' | 'auto';
    cacheKey?: string;
    cacheTTL?: number;
    estimatedRows?: number;
}
export interface DataAdapter {
    execute(query: DataQuery, context?: {
        viewerContext?: unknown;
        signal?: AbortSignal;
    }): Promise<DataResult>;
    getSchema(sourceId?: string): Promise<DataSourceSchema>;
    listDataSources(): Promise<DataSourceSummary[]>;
    getDistinctValues(sourceId: string, field: string, options?: {
        search?: string;
        limit?: number;
        filters?: unknown;
    }): Promise<{
        values: unknown[];
        totalCount: number;
        truncated: boolean;
    }>;
    getFieldStats(sourceId: string, field: string, filters?: unknown): Promise<{
        min?: number;
        max?: number;
        distinctCount: number;
        nullCount: number;
        totalCount: number;
    }>;
}
/**
 * @deprecated Import CoordinatorQuery from '@phozart/phz-shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export { type CoordinatorQuery, type CoordinatorResult, type QueryCoordinatorConfig, defaultQueryCoordinatorConfig, isQueryCoordinatorConfig, } from '@phozart/phz-shared/coordination';
/** Workspace-specific QueryCoordinator interface (uses workspace DataQuery). */
export interface QueryCoordinator {
    submit(widgetId: string, query: import('@phozart/phz-shared/coordination').CoordinatorQuery): Promise<import('@phozart/phz-shared/coordination').CoordinatorResult>;
    flush(): Promise<void>;
    cancel(widgetId: string): void;
}
export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export interface RelativePeriod {
    id: string;
    label: string;
    calculate: (referenceDate: Date, config: TimeIntelligenceConfig) => {
        from: Date;
        to: Date;
    };
}
export interface TimeIntelligenceConfig {
    primaryDateField: string;
    fiscalYearStartMonth: number;
    weekStartDay: 'sunday' | 'monday';
    granularities: TimeGranularity[];
    relativePeriods: RelativePeriod[];
}
export declare const DEFAULT_RELATIVE_PERIODS: RelativePeriod[];
export declare function resolvePeriod(periodId: string, config: TimeIntelligenceConfig, referenceDate?: Date): {
    from: Date;
    to: Date;
};
//# sourceMappingURL=data-adapter.d.ts.map