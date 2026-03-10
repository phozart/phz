/**
 * @phozart/phz-shared — Dashboard Data Pipeline types (A-1.05)
 *
 * Preload/full-load parallel data architecture types.
 * Pure types only — no DataAdapter dependency.
 *
 * Extracted from workspace/coordination/dashboard-data-pipeline.ts.
 */
export interface DashboardLoadingState {
    phase: 'idle' | 'preloading' | 'preload-complete' | 'full-loading' | 'full-complete' | 'error';
    message?: string;
    progress?: number;
    error?: string;
}
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
}
export interface ColumnDescriptor {
    name: string;
    dataType: string;
}
export interface DataResult {
    columns: ColumnDescriptor[];
    rows: unknown[][];
    metadata: {
        totalRows: number;
        truncated: boolean;
        queryTimeMs: number;
    };
    arrowBuffer?: ArrayBuffer;
}
export interface PreloadConfig {
    query: DataQuery;
    usePersonalView?: boolean;
}
export interface FullLoadConfig {
    query: DataQuery;
    applyCurrentFilters?: boolean;
    maxRows?: number;
}
export interface FieldMappingEntry {
    sourceField: string;
    targetField: string;
}
export type DetailTrigger = 'user-action' | {
    type: 'drill-through';
    fromWidgetTypes?: string[];
} | {
    type: 'breach';
};
export interface DetailSourceConfig {
    id: string;
    name: string;
    description?: string;
    dataSourceId: string;
    filterMapping: FieldMappingEntry[];
    baseQuery: DataQuery;
    preloadQuery?: DataQuery;
    maxRows?: number;
    trigger: DetailTrigger;
    renderMode?: 'panel' | 'modal' | 'navigate';
}
/**
 * Configuration for a single data source within a multi-source dashboard.
 * Each source can have independent preload/full-load queries and refresh intervals.
 */
export interface DataSourceConfig {
    /** Unique identifier for this source within the dashboard. */
    sourceId: string;
    /** Human-readable alias for display in the UI. */
    alias?: string;
    /** Preload query configuration for this source. */
    preload?: PreloadConfig;
    /** Full load query configuration for this source. */
    fullLoad?: FullLoadConfig;
    /** Auto-refresh interval in milliseconds. Undefined means no auto-refresh. */
    refreshIntervalMs?: number;
}
export interface DashboardDataConfig {
    /**
     * Multi-source configuration. Each entry defines an independent data source
     * with its own preload/full-load queries and refresh interval.
     *
     * When present, per-source configs take precedence over the top-level
     * `preload` and `fullLoad` fields.
     */
    sources?: DataSourceConfig[];
    /** @deprecated Use `sources[n].preload` instead. Kept for backward compatibility. */
    preload?: PreloadConfig;
    /** @deprecated Use `sources[n].fullLoad` instead. Kept for backward compatibility. */
    fullLoad?: FullLoadConfig;
    detailSources?: DetailSourceConfig[];
    transition?: 'seamless' | 'fade' | 'replace';
}
/**
 * Wraps a legacy `{preload, fullLoad}` config into the multi-source
 * `{sources: [...]}` format. If the config already has `sources`, it is
 * returned as-is (no double-migration).
 *
 * The top-level `preload` and `fullLoad` fields are preserved for backward
 * compatibility so that consumers reading the old fields still work.
 */
export declare function migrateLegacyDataConfig(config: DashboardDataConfig): DashboardDataConfig;
export interface DashboardDataPipeline {
    readonly state: DashboardLoadingState;
    start(): Promise<void>;
    onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
    getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
    invalidate(): Promise<void>;
    destroy(): void;
}
/**
 * Type guard for `DashboardDataConfig`. Accepts both legacy format
 * (top-level `preload`/`fullLoad`) and multi-source format (`sources` array).
 */
export declare function isDashboardDataConfig(obj: unknown): obj is DashboardDataConfig;
export declare function isDetailSourceConfig(obj: unknown): obj is DetailSourceConfig;
//# sourceMappingURL=dashboard-data-pipeline.d.ts.map