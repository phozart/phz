/**
 * @phozart/phz-workspace — MemoryWorkspaceAdapter
 *
 * In-memory implementation of WorkspaceAdapter for testing and ephemeral usage.
 */
import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/phz-engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/phz-shared/definitions';
import type { WorkspaceAdapter, ArtifactHistoryExtension, VersionSummary } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type { PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter, AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription, TemplateDefinition, TemplateId } from '../types.js';
export declare class MemoryWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
    private reports;
    private dashboards;
    private kpis;
    private metrics;
    private definitions;
    private placements;
    private alertRules;
    private breaches;
    private subscriptions;
    private templates;
    private history;
    initialize(): Promise<void>;
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
    save(def: GridDefinition): Promise<GridDefinition>;
    load(id: DefinitionId): Promise<GridDefinition | undefined>;
    list(): Promise<DefinitionMeta[]>;
    delete(id: DefinitionId): Promise<boolean>;
    duplicate(id: DefinitionId, options?: {
        name?: string;
    }): Promise<GridDefinition | undefined>;
    savePlacement(placement: PlacementRecord): Promise<PlacementRecord>;
    loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]>;
    deletePlacement(id: PlacementId): Promise<void>;
    listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;
    saveAlertRule(rule: AlertRule): Promise<void>;
    loadAlertRules(artifactId?: string): Promise<AlertRule[]>;
    deleteAlertRule(ruleId: AlertRuleId): Promise<void>;
    saveBreachRecord(breach: BreachRecord): Promise<void>;
    loadActiveBreaches(artifactId?: string): Promise<BreachRecord[]>;
    updateBreachStatus(breachId: BreachId, status: BreachRecord['status']): Promise<void>;
    saveSubscription(sub: AlertSubscription): Promise<void>;
    loadSubscriptions(ruleId?: AlertRuleId): Promise<AlertSubscription[]>;
    saveTemplate(template: TemplateDefinition): Promise<void>;
    loadTemplates(): Promise<TemplateDefinition[]>;
    deleteTemplate(id: TemplateId): Promise<void>;
    private recordVersion;
    getArtifactHistory(id: string, options?: {
        limit?: number;
        before?: number;
    }): Promise<VersionSummary[]>;
    getArtifactVersion(id: string, version: number): Promise<unknown>;
    restoreArtifactVersion(id: string, version: number): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=memory-adapter.d.ts.map