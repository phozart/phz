/**
 * @phozart/shared — Dashboard Data Pipeline types (A-1.05)
 *
 * Preload/full-load parallel data architecture types.
 * Pure types only — no DataAdapter dependency.
 *
 * Extracted from workspace/coordination/dashboard-data-pipeline.ts.
 */

// ========================================================================
// DashboardLoadingState
// ========================================================================

export interface DashboardLoadingState {
  phase: 'idle' | 'preloading' | 'preload-complete' | 'full-loading' | 'full-complete' | 'error';
  message?: string;
  progress?: number;
  error?: string;
}

// ========================================================================
// DataQuery (minimal self-contained version)
// ========================================================================

export interface DataQuery {
  source: string;
  fields: string[];
  filters?: unknown;
  groupBy?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
}

// ========================================================================
// DataResult (minimal self-contained version)
// ========================================================================

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

// ========================================================================
// Dashboard Data Config
// ========================================================================

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

export type DetailTrigger =
  | 'user-action'
  | { type: 'drill-through'; fromWidgetTypes?: string[] }
  | { type: 'breach' };

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

// ========================================================================
// DataSourceConfig — per-source configuration for multi-source dashboards
// ========================================================================

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

// ========================================================================
// DashboardDataConfig — supports both legacy and multi-source formats
// ========================================================================

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

// ========================================================================
// migrateLegacyDataConfig — converts legacy format to multi-source format
// ========================================================================

/**
 * Wraps a legacy `{preload, fullLoad}` config into the multi-source
 * `{sources: [...]}` format. If the config already has `sources`, it is
 * returned as-is (no double-migration).
 *
 * The top-level `preload` and `fullLoad` fields are preserved for backward
 * compatibility so that consumers reading the old fields still work.
 */
export function migrateLegacyDataConfig(config: DashboardDataConfig): DashboardDataConfig {
  // Already migrated — nothing to do
  if (config.sources && config.sources.length > 0) {
    return config;
  }

  // No preload or fullLoad at all — return with empty sources
  if (!config.preload && !config.fullLoad) {
    return { ...config, sources: [] };
  }

  const defaultSource: DataSourceConfig = {
    sourceId: 'default',
    ...(config.preload ? { preload: config.preload } : {}),
    ...(config.fullLoad ? { fullLoad: config.fullLoad } : {}),
  };

  return {
    ...config,
    sources: [defaultSource],
  };
}

// ========================================================================
// DashboardDataPipeline interface
// ========================================================================

export interface DashboardDataPipeline {
  readonly state: DashboardLoadingState;
  start(): Promise<void>;
  onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
  getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
  invalidate(): Promise<void>;
  destroy(): void;
}

// ========================================================================
// Type guards
// ========================================================================

/**
 * Type guard for `DashboardDataConfig`. Accepts both legacy format
 * (top-level `preload`/`fullLoad`) and multi-source format (`sources` array).
 */
export function isDashboardDataConfig(obj: unknown): obj is DashboardDataConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;

  // Multi-source format: sources array present and non-empty
  if (Array.isArray(o.sources) && o.sources.length > 0) {
    return o.sources.every(
      (s: unknown) =>
        s != null &&
        typeof s === 'object' &&
        typeof (s as Record<string, unknown>).sourceId === 'string',
    );
  }

  // Legacy format: top-level preload and fullLoad
  if (o.preload == null || typeof o.preload !== 'object') return false;
  if (o.fullLoad == null || typeof o.fullLoad !== 'object') return false;
  const preload = o.preload as Record<string, unknown>;
  if (preload.query == null || typeof preload.query !== 'object') return false;
  const fullLoad = o.fullLoad as Record<string, unknown>;
  if (fullLoad.query == null || typeof fullLoad.query !== 'object') return false;
  return true;
}

export function isDetailSourceConfig(obj: unknown): obj is DetailSourceConfig {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.dataSourceId === 'string' &&
    Array.isArray(o.filterMapping) &&
    o.baseQuery != null && typeof o.baseQuery === 'object' &&
    o.trigger !== undefined
  );
}
