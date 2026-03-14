/**
 * @phozart/engine — BI Engine Facade
 *
 * Single entry point that integrates all engine modules.
 */
import { createCriteriaEngine } from './criteria/criteria-engine.js';
import { resolveReportCriteria, resolveDashboardCriteria } from './criteria/resolve-criteria.js';
import { createDataProductRegistry } from './data-product.js';
import { createKPIRegistry } from './kpi.js';
import { computeStatus, computeDelta, classifyKPIScore } from './status.js';
import { createMetricCatalog } from './metric.js';
import { computeAggregations } from './aggregation.js';
import { createReportConfigStore } from './report.js';
import { createDashboardConfigStore } from './dashboard.js';
import { computePivot } from './pivot.js';
import { projectChartData, projectAggregatedChartData, projectPieData } from './chart-projection.js';
import { resolveDrillAction } from './drill-through.js';
import { mergeReportConfigs, mergeDashboardConfigs } from './config-merge.js';
import { FormatRegistry } from './format-registry.js';
import { createDashboardDataModelStore } from './dashboard-data-model.js';
import { createJSComputeBackend } from './compute-backend.js';
import { WorkerComputeBackend } from './workers/worker-compute-backend.js';
import { EngineMetrics } from './engine-metrics.js';
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
export function createBIEngine(config) {
    const dataProducts = createDataProductRegistry();
    const kpis = createKPIRegistry(dataProducts);
    const metrics = createMetricCatalog(dataProducts);
    const reports = createReportConfigStore();
    const dashboards = createDashboardConfigStore();
    const formats = new FormatRegistry();
    const criteria = createCriteriaEngine(config?.criteriaEngine);
    const dataModel = createDashboardDataModelStore(config?.initialDataModel?.fields);
    let computeBackend;
    if (config?.computeBackend) {
        computeBackend = config.computeBackend;
    }
    else if (config?.workerEnabled) {
        computeBackend = new WorkerComputeBackend(config.workerUrl);
    }
    else {
        computeBackend = createJSComputeBackend();
    }
    const engineMetrics = config?.enableMetrics ? new EngineMetrics() : undefined;
    // Load data model if provided
    if (config?.initialDataModel) {
        dataModel.load(config.initialDataModel);
    }
    // Load initial data
    if (config?.initialDataProducts) {
        for (const dp of config.initialDataProducts)
            dataProducts.register(dp);
    }
    if (config?.initialKPIs) {
        for (const kpi of config.initialKPIs)
            kpis.register(kpi);
    }
    if (config?.initialMetrics) {
        for (const metric of config.initialMetrics)
            metrics.register(metric);
    }
    if (config?.initialReports) {
        for (const report of config.initialReports)
            reports.save(report);
    }
    if (config?.initialDashboards) {
        for (const dashboard of config.initialDashboards)
            dashboards.save(dashboard);
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
        getReportFilters(id, onDivergence) {
            return resolveReportCriteria(id, criteria, reports, onDivergence);
        },
        getDashboardFilters(id, onDivergence) {
            return resolveDashboardCriteria(id, criteria, dashboards, onDivergence);
        },
        async loadAll() {
            const adapter = config?.storageAdapter;
            if (!adapter)
                return;
            const [storedReports, storedDashboards, storedKPIs, storedMetrics] = await Promise.all([
                adapter.loadReports(),
                adapter.loadDashboards(),
                adapter.loadKPIs(),
                adapter.loadMetrics(),
            ]);
            for (const report of storedReports)
                reports.save(report);
            for (const dashboard of storedDashboards)
                dashboards.save(dashboard);
            for (const kpi of storedKPIs)
                kpis.register(kpi);
            for (const metric of storedMetrics)
                metrics.register(metric);
        },
        async saveAll() {
            const adapter = config?.storageAdapter;
            if (!adapter)
                return;
            await Promise.all([
                ...reports.list().map(r => adapter.saveReport(r)),
                ...dashboards.list().map(d => adapter.saveDashboard(d)),
                ...kpis.list().map(k => adapter.saveKPI(k)),
                ...metrics.list().map(m => adapter.saveMetric(m)),
            ]);
        },
        destroy() {
            for (const dp of dataProducts.list())
                dataProducts.unregister(dp.id);
            for (const k of kpis.list())
                kpis.remove(k.id);
            for (const m of metrics.list())
                metrics.remove(m.id);
            for (const r of reports.list())
                reports.delete(r.id);
            for (const d of dashboards.list())
                dashboards.delete(d.id);
            formats.clear();
        },
    };
}
//# sourceMappingURL=engine.js.map