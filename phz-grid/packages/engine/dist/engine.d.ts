/**
 * @phozart/engine — BI Engine Facade
 *
 * Single entry point that integrates all engine modules.
 */
import type { AggregationConfig, PivotConfig, ChartConfig } from '@phozart/core';
import type { ReportId, DashboardId } from './types.js';
import type { CriteriaEngine, CriteriaEngineConfig } from './criteria/criteria-engine.js';
import type { CriteriaResolutionResult, DivergenceCallback } from './criteria/resolve-criteria.js';
import type { DataProductRegistry, DataProductDef } from './data-product.js';
import type { KPIRegistry, KPIDefinition, KPIScoreResponse } from './kpi.js';
import type { StatusResult, Delta, ClassifiedScore } from './status.js';
import type { MetricCatalog, MetricDef } from './metric.js';
import type { AggregationResult } from './aggregation.js';
import type { ReportConfigStore, ReportConfig } from './report.js';
import type { DashboardConfigStore, DashboardConfig } from './dashboard.js';
import type { PivotResult } from './pivot.js';
import type { ChartDataSeries, PieSlice } from './chart-projection.js';
import type { DrillContext, DrillThroughAction } from './drill-through.js';
import type { ConfigLayerDef } from './config-merge.js';
import { FormatRegistry } from './format-registry.js';
import type { DashboardDataModelStore } from './dashboard-data-model.js';
import type { DashboardDataModel } from './expression-types.js';
import type { EngineStorageAdapter } from './storage-adapter.js';
import type { ComputeBackend } from './compute-backend.js';
import { EngineMetrics } from './engine-metrics.js';
/**
 * BI Engine facade — the single entry point for all analytical operations.
 *
 * Provides registries for data products, KPIs, metrics, reports, and dashboards,
 * along with aggregation, pivot, chart projection, drill-through, and criteria
 * resolution capabilities.
 *
 * Create an instance via {@link createBIEngine}.
 */
export interface BIEngine {
    /** Data product registry (schema definitions for data sources). */
    dataProducts: DataProductRegistry;
    /** KPI definition and scoring registry. */
    kpis: KPIRegistry;
    /** Metric catalog (formulas, computed measures). */
    metrics: MetricCatalog;
    /** Report configuration store. */
    reports: ReportConfigStore;
    /** Dashboard configuration store. */
    dashboards: DashboardConfigStore;
    /** Number/date format registry. */
    formats: FormatRegistry;
    /** Dashboard data model (parameters, calculated fields, thresholds). */
    dataModel: DashboardDataModelStore;
    /** Compute backend for aggregation/filter evaluation (JS, Worker, or DuckDB). */
    computeBackend: ComputeBackend;
    status: {
        compute(value: number | null | undefined, kpi: KPIDefinition): StatusResult;
        computeDelta(current: number, previous: number, kpi: KPIDefinition): Delta;
        classify(score: KPIScoreResponse, kpi: KPIDefinition): ClassifiedScore;
    };
    aggregate(rows: Record<string, unknown>[], config: AggregationConfig): AggregationResult;
    pivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult;
    projectChart(rows: Record<string, unknown>[], config: ChartConfig): ChartDataSeries[];
    projectAggregatedChart(rows: Record<string, unknown>[], config: ChartConfig, groupField: string): ChartDataSeries[];
    projectPie(rows: Record<string, unknown>[], categoryField: string, valueField: string): PieSlice[];
    resolveDrill(context: DrillContext): DrillThroughAction;
    mergeReportConfigs(layers: ConfigLayerDef<ReportConfig>[]): ReportConfig;
    mergeDashboardConfigs(layers: ConfigLayerDef<DashboardConfig>[]): DashboardConfig;
    criteria: CriteriaEngine;
    /** Resolve filter fields for a report (auto-hydrates inline config if needed) */
    getReportFilters(reportId: ReportId, onDivergence?: DivergenceCallback): CriteriaResolutionResult;
    /** Resolve filter fields for a dashboard (auto-hydrates inline config if needed) */
    getDashboardFilters(dashboardId: DashboardId, onDivergence?: DivergenceCallback): CriteriaResolutionResult;
    loadAll(): Promise<void>;
    saveAll(): Promise<void>;
    engineMetrics: EngineMetrics | undefined;
    destroy(): void;
}
/**
 * Configuration for {@link createBIEngine}.
 *
 * All properties are optional. Pass `initial*` arrays to pre-populate
 * registries on creation. Provide a `storageAdapter` to enable
 * {@link BIEngine.loadAll | loadAll()} / {@link BIEngine.saveAll | saveAll()}.
 */
export interface BIEngineConfig {
    /** Data product definitions to register on startup. */
    initialDataProducts?: DataProductDef[];
    /** KPI definitions to register on startup. */
    initialKPIs?: KPIDefinition[];
    /** Metric definitions to register on startup. */
    initialMetrics?: MetricDef[];
    /** Report configurations to pre-load. */
    initialReports?: ReportConfig[];
    /** Dashboard configurations to pre-load. */
    initialDashboards?: DashboardConfig[];
    /** Dashboard data model (parameters, calculated fields, thresholds). */
    initialDataModel?: DashboardDataModel;
    /** Configuration for the criteria (filter) engine sub-system. */
    criteriaEngine?: CriteriaEngineConfig;
    /** Persistence adapter for loadAll / saveAll. */
    storageAdapter?: EngineStorageAdapter;
    /** Custom compute backend (e.g. DuckDB). Overrides `workerEnabled`. */
    computeBackend?: ComputeBackend;
    /** When `true`, use a Web Worker for compute-heavy operations. */
    workerEnabled?: boolean;
    /** URL of the worker script. Required when `workerEnabled` is `true`. */
    workerUrl?: string | URL;
    /** Enable the built-in performance metrics collector. */
    enableMetrics?: boolean;
}
/**
 * Create a new BI engine instance with the given configuration.
 *
 * The engine is the central facade for all analytical operations:
 * aggregation, pivot, chart projection, drill-through, KPI scoring,
 * report/dashboard management, and criteria resolution.
 *
 * @param config - Optional engine configuration. Omit for an empty engine.
 * @returns A fully initialized {@link BIEngine} instance.
 *
 * @example
 * ```ts
 * import { createBIEngine } from '@phozart/engine';
 *
 * const engine = createBIEngine({
 *   initialReports: [myReport],
 *   enableMetrics: true,
 * });
 *
 * const result = engine.aggregate(rows, {
 *   fields: [{ field: 'revenue', functions: ['sum', 'avg'] }],
 * });
 *
 * engine.destroy();
 * ```
 */
export declare function createBIEngine(config?: BIEngineConfig): BIEngine;
//# sourceMappingURL=engine.d.ts.map