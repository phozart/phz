/**
 * @phozart/engine — BI Engine Facade
 *
 * Single entry point that integrates all engine modules.
 */

import type { AggregationConfig, PivotConfig, ChartConfig, SelectionContext, SelectionFieldDef, ArtefactId } from '@phozart/core';
import type { StatusLevel, ValidationResult, ReportId, DashboardId } from './types.js';
import { reportArtefactId, dashboardArtefactId } from './types.js';
import { createCriteriaEngine } from './criteria/criteria-engine.js';
import type { CriteriaEngine, CriteriaEngineConfig } from './criteria/criteria-engine.js';
import { resolveReportCriteria, resolveDashboardCriteria } from './criteria/resolve-criteria.js';
import type { CriteriaResolutionResult, DivergenceCallback } from './criteria/resolve-criteria.js';
import { createDataProductRegistry } from './data-product.js';
import type { DataProductRegistry, DataProductDef } from './data-product.js';
import { createKPIRegistry } from './kpi.js';
import type { KPIRegistry, KPIDefinition, KPIScoreResponse } from './kpi.js';
import { computeStatus, computeDelta, classifyKPIScore } from './status.js';
import type { StatusResult, Delta, ClassifiedScore } from './status.js';
import { createMetricCatalog } from './metric.js';
import type { MetricCatalog, MetricDef } from './metric.js';
import { computeAggregation, computeAggregations } from './aggregation.js';
import type { AggregationResult } from './aggregation.js';
import { createReportConfigStore } from './report.js';
import type { ReportConfigStore, ReportConfig } from './report.js';
import { createDashboardConfigStore } from './dashboard.js';
import type { DashboardConfigStore, DashboardConfig, ResolvedLayout } from './dashboard.js';
import { computePivot } from './pivot.js';
import type { PivotResult } from './pivot.js';
import { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
import type { ChartDataSeries, PieSlice } from './chart-projection.js';
import { resolveDrillFilter, resolveDrillAction } from './drill-through.js';
import type { DrillContext, DrillThroughAction } from './drill-through.js';
import { mergeReportConfigs, mergeDashboardConfigs, deepMerge } from './config-merge.js';
import type { ConfigLayerDef } from './config-merge.js';
import { FormatRegistry } from './format-registry.js';
import { createDashboardDataModelStore } from './dashboard-data-model.js';
import type { DashboardDataModelStore } from './dashboard-data-model.js';
import type { DashboardDataModel } from './expression-types.js';
import type { EngineStorageAdapter } from './storage-adapter.js';
import type { ComputeBackend } from './compute-backend.js';
import { createJSComputeBackend } from './compute-backend.js';
import { WorkerComputeBackend } from './workers/worker-compute-backend.js';
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
  // Registries
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

  // Status computation
  status: {
    compute(value: number | null | undefined, kpi: KPIDefinition): StatusResult;
    computeDelta(current: number, previous: number, kpi: KPIDefinition): Delta;
    classify(score: KPIScoreResponse, kpi: KPIDefinition): ClassifiedScore;
  };

  // Aggregation
  aggregate(rows: Record<string, unknown>[], config: AggregationConfig): AggregationResult;

  // Pivot
  pivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult;

  // Chart projection
  projectChart(rows: Record<string, unknown>[], config: ChartConfig): ChartDataSeries[];
  projectAggregatedChart(rows: Record<string, unknown>[], config: ChartConfig, groupField: string): ChartDataSeries[];
  projectPie(rows: Record<string, unknown>[], categoryField: string, valueField: string): PieSlice[];

  // Drill-through
  resolveDrill(context: DrillContext): DrillThroughAction;

  // Config merge
  mergeReportConfigs(layers: ConfigLayerDef<ReportConfig>[]): ReportConfig;
  mergeDashboardConfigs(layers: ConfigLayerDef<DashboardConfig>[]): DashboardConfig;

  // Criteria Engine (filter registry integration)
  criteria: CriteriaEngine;

  /** Resolve filter fields for a report (auto-hydrates inline config if needed) */
  getReportFilters(reportId: ReportId, onDivergence?: DivergenceCallback): CriteriaResolutionResult;

  /** Resolve filter fields for a dashboard (auto-hydrates inline config if needed) */
  getDashboardFilters(dashboardId: DashboardId, onDivergence?: DivergenceCallback): CriteriaResolutionResult;

  // Persistence
  loadAll(): Promise<void>;
  saveAll(): Promise<void>;

  // Performance monitoring
  engineMetrics: EngineMetrics | undefined;

  // Lifecycle
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
export function createBIEngine(config?: BIEngineConfig): BIEngine {
  const dataProducts = createDataProductRegistry();
  const kpis = createKPIRegistry(dataProducts);
  const metrics = createMetricCatalog(dataProducts);
  const reports = createReportConfigStore();
  const dashboards = createDashboardConfigStore();
  const formats = new FormatRegistry();
  const criteria = createCriteriaEngine(config?.criteriaEngine);
  const dataModel = createDashboardDataModelStore(config?.initialDataModel?.fields);
  let computeBackend: ComputeBackend;
  if (config?.computeBackend) {
    computeBackend = config.computeBackend;
  } else if (config?.workerEnabled) {
    computeBackend = new WorkerComputeBackend(config.workerUrl);
  } else {
    computeBackend = createJSComputeBackend();
  }
  const engineMetrics = config?.enableMetrics ? new EngineMetrics() : undefined;

  // Load data model if provided
  if (config?.initialDataModel) {
    dataModel.load(config.initialDataModel);
  }

  // Load initial data
  if (config?.initialDataProducts) {
    for (const dp of config.initialDataProducts) dataProducts.register(dp);
  }
  if (config?.initialKPIs) {
    for (const kpi of config.initialKPIs) kpis.register(kpi);
  }
  if (config?.initialMetrics) {
    for (const metric of config.initialMetrics) metrics.register(metric);
  }
  if (config?.initialReports) {
    for (const report of config.initialReports) reports.save(report);
  }
  if (config?.initialDashboards) {
    for (const dashboard of config.initialDashboards) dashboards.save(dashboard);
  }

  return {
    dataProducts,
    kpis,
    metrics,
    reports,
    dashboards,
    formats,
    dataModel,
    computeBackend,
    engineMetrics,

    status: {
      compute: computeStatus,
      computeDelta,
      classify: classifyKPIScore,
    },

    aggregate(rows, aggConfig) {
      if (engineMetrics) {
        const handle = engineMetrics.startTimer('aggregation');
        const result = computeAggregations(rows, aggConfig);
        engineMetrics.stopTimer(handle);
        return result;
      }
      return computeAggregations(rows, aggConfig);
    },

    pivot(rows, pivotConfig) {
      if (engineMetrics) {
        const handle = engineMetrics.startTimer('pivot');
        const result = computePivot(rows, pivotConfig);
        engineMetrics.stopTimer(handle);
        return result;
      }
      return computePivot(rows, pivotConfig);
    },

    projectChart(rows, chartConfig) {
      return projectChartData(rows, chartConfig);
    },

    projectAggregatedChart(rows, chartConfig, groupField) {
      return projectAggregatedChartData(rows, chartConfig, groupField);
    },

    projectPie(rows, categoryField, valueField) {
      return projectPieData(rows, categoryField, valueField);
    },

    resolveDrill(context) {
      return resolveDrillAction(context, reports);
    },

    mergeReportConfigs(layers) {
      return mergeReportConfigs(layers);
    },

    mergeDashboardConfigs(layers) {
      return mergeDashboardConfigs(layers);
    },

    criteria,

    getReportFilters(id, onDivergence?) {
      return resolveReportCriteria(id, criteria, reports, onDivergence);
    },

    getDashboardFilters(id, onDivergence?) {
      return resolveDashboardCriteria(id, criteria, dashboards, onDivergence);
    },

    async loadAll() {
      const adapter = config?.storageAdapter;
      if (!adapter) return;
      const [storedReports, storedDashboards, storedKPIs, storedMetrics] = await Promise.all([
        adapter.loadReports(),
        adapter.loadDashboards(),
        adapter.loadKPIs(),
        adapter.loadMetrics(),
      ]);
      for (const report of storedReports) reports.save(report);
      for (const dashboard of storedDashboards) dashboards.save(dashboard);
      for (const kpi of storedKPIs) kpis.register(kpi);
      for (const metric of storedMetrics) metrics.register(metric);
    },

    async saveAll() {
      const adapter = config?.storageAdapter;
      if (!adapter) return;
      await Promise.all([
        ...reports.list().map(r => adapter.saveReport(r)),
        ...dashboards.list().map(d => adapter.saveDashboard(d)),
        ...kpis.list().map(k => adapter.saveKPI(k)),
        ...metrics.list().map(m => adapter.saveMetric(m)),
      ]);
    },

    destroy() {
      for (const dp of dataProducts.list()) dataProducts.unregister(dp.id);
      for (const k of kpis.list()) kpis.remove(k.id);
      for (const m of metrics.list()) metrics.remove(m.id);
      for (const r of reports.list()) reports.delete(r.id);
      for (const d of dashboards.list()) dashboards.delete(d.id);
      formats.clear();
    },
  };
}
