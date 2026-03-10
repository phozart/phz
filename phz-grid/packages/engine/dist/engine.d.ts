/**
 * @phozart/phz-engine — BI Engine Facade
 *
 * Single entry point that integrates all engine modules.
 */
import type { AggregationConfig, PivotConfig, ChartConfig } from '@phozart/phz-core';
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
export interface BIEngine {
    dataProducts: DataProductRegistry;
    kpis: KPIRegistry;
    metrics: MetricCatalog;
    reports: ReportConfigStore;
    dashboards: DashboardConfigStore;
    formats: FormatRegistry;
    dataModel: DashboardDataModelStore;
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
export interface BIEngineConfig {
    initialDataProducts?: DataProductDef[];
    initialKPIs?: KPIDefinition[];
    initialMetrics?: MetricDef[];
    initialReports?: ReportConfig[];
    initialDashboards?: DashboardConfig[];
    initialDataModel?: DashboardDataModel;
    criteriaEngine?: CriteriaEngineConfig;
    storageAdapter?: EngineStorageAdapter;
    computeBackend?: ComputeBackend;
    enableMetrics?: boolean;
}
export declare function createBIEngine(config?: BIEngineConfig): BIEngine;
//# sourceMappingURL=engine.d.ts.map