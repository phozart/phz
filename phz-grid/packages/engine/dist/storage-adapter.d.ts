/**
 * @phozart/phz-engine — Pluggable Storage Adapter
 *
 * Allows BIEngine state (reports, dashboards, KPIs, metrics) to be
 * persisted and restored across page refreshes. Ships with two adapters:
 * - MemoryStorageAdapter  — in-memory (tests / ephemeral usage)
 * - LocalStorageAdapter   — browser localStorage with namespaced keys
 */
import type { ReportConfig } from './report.js';
import type { DashboardConfig } from './dashboard.js';
import type { KPIDefinition } from './kpi.js';
import type { MetricDef } from './metric.js';
import type { ReportId, DashboardId, KPIId, MetricId } from './types.js';
export interface EngineStorageAdapter {
    saveReport(report: ReportConfig): Promise<void>;
    loadReports(): Promise<ReportConfig[]>;
    deleteReport(id: ReportId): Promise<void>;
    saveDashboard(dashboard: DashboardConfig): Promise<void>;
    loadDashboards(): Promise<DashboardConfig[]>;
    deleteDashboard(id: DashboardId): Promise<void>;
    saveKPI(kpi: KPIDefinition): Promise<void>;
    loadKPIs(): Promise<KPIDefinition[]>;
    deleteKPI(id: KPIId): Promise<void>;
    saveMetric(metric: MetricDef): Promise<void>;
    loadMetrics(): Promise<MetricDef[]>;
    deleteMetric(id: MetricId): Promise<void>;
    clear(): Promise<void>;
}
export declare class MemoryStorageAdapter implements EngineStorageAdapter {
    private reports;
    private dashboards;
    private kpis;
    private metrics;
    saveReport(report: ReportConfig): Promise<void>;
    loadReports(): Promise<ReportConfig[]>;
    deleteReport(id: ReportId): Promise<void>;
    saveDashboard(dashboard: DashboardConfig): Promise<void>;
    loadDashboards(): Promise<DashboardConfig[]>;
    deleteDashboard(id: DashboardId): Promise<void>;
    saveKPI(kpi: KPIDefinition): Promise<void>;
    loadKPIs(): Promise<KPIDefinition[]>;
    deleteKPI(id: KPIId): Promise<void>;
    saveMetric(metric: MetricDef): Promise<void>;
    loadMetrics(): Promise<MetricDef[]>;
    deleteMetric(id: MetricId): Promise<void>;
    clear(): Promise<void>;
}
export declare class LocalStorageAdapter implements EngineStorageAdapter {
    private storage;
    private namespace;
    constructor(storage: Storage, namespace: string);
    private key;
    private readSlot;
    private writeSlot;
    saveReport(report: ReportConfig): Promise<void>;
    loadReports(): Promise<ReportConfig[]>;
    deleteReport(id: ReportId): Promise<void>;
    saveDashboard(dashboard: DashboardConfig): Promise<void>;
    loadDashboards(): Promise<DashboardConfig[]>;
    deleteDashboard(id: DashboardId): Promise<void>;
    saveKPI(kpi: KPIDefinition): Promise<void>;
    loadKPIs(): Promise<KPIDefinition[]>;
    deleteKPI(id: KPIId): Promise<void>;
    saveMetric(metric: MetricDef): Promise<void>;
    loadMetrics(): Promise<MetricDef[]>;
    deleteMetric(id: MetricId): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=storage-adapter.d.ts.map