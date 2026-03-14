/**
 * @phozart/workspace — FetchWorkspaceAdapter
 *
 * REST client implementing WorkspaceAdapter that delegates to a server.
 */
import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/shared/definitions';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type { PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter, AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription, TemplateDefinition, TemplateId } from '../types.js';
export interface FetchAdapterOptions {
    baseUrl: string;
    headers?: Record<string, string>;
}
export declare class FetchWorkspaceAdapter implements WorkspaceAdapter {
    private baseUrl;
    private headers;
    constructor(options: FetchAdapterOptions);
    private request;
    private requestOptional;
    private buildQueryString;
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
    clear(): Promise<void>;
}
//# sourceMappingURL=fetch-adapter.d.ts.map