/**
 * @phozart/local — Filesystem Workspace Adapter (R.2)
 *
 * Implements WorkspaceAdapter over the filesystem.
 * Artifacts stored as: {dataDir}/artifacts/{type}/{id}.json
 * History versions as: {dataDir}/artifacts/{type}/{id}.v{n}.json
 * Uses atomic writes (write .tmp, rename) to prevent corruption.
 */
import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/shared/definitions';
import type { WorkspaceAdapter, ArtifactHistoryExtension, VersionSummary } from '@phozart/workspace';
import type { PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter, AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription, TemplateDefinition, TemplateId } from '@phozart/workspace';
import type { PlacementRecord } from '@phozart/workspace';
export declare class FsWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
    private dataDir;
    constructor(dataDir: string);
    private artifactDir;
    private artifactPath;
    private versionPath;
    private ensureDir;
    private atomicWrite;
    private readJson;
    private listJsonFiles;
    private loadAll;
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
    private getNextVersion;
    getArtifactHistory(id: string, options?: {
        limit?: number;
        before?: number;
    }): Promise<VersionSummary[]>;
    getArtifactVersion(id: string, version: number): Promise<unknown>;
    restoreArtifactVersion(id: string, version: number): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=fs-workspace-adapter.d.ts.map