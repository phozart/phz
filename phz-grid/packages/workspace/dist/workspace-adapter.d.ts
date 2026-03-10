/**
 * @phozart/phz-workspace — WorkspaceAdapter Interface
 *
 * Extends EngineStorageAdapter + AsyncDefinitionStore with placement and catalog methods.
 */
import type { EngineStorageAdapter } from '@phozart/phz-engine';
import type { AsyncDefinitionStore } from '@phozart/phz-shared/definitions';
import type { PlacementRecord } from './placement.js';
import type { PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter, AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription, TemplateDefinition, TemplateId } from './types.js';
import type { DashboardBookmark, DashboardInteractionState } from '@phozart/phz-shared';
export interface WorkspaceAdapter extends EngineStorageAdapter, AsyncDefinitionStore {
    /** Persist a placement record */
    savePlacement(placement: PlacementRecord): Promise<PlacementRecord>;
    /** Load placements, optionally filtered */
    loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]>;
    /** Delete a placement by ID */
    deletePlacement(id: PlacementId): Promise<void>;
    /** List all artifacts across all types */
    listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;
    /** Initialize the adapter (create tables, connect, etc.) */
    initialize(): Promise<void>;
    saveAlertRule?(rule: AlertRule): Promise<void>;
    loadAlertRules?(artifactId?: string): Promise<AlertRule[]>;
    deleteAlertRule?(ruleId: AlertRuleId): Promise<void>;
    saveBreachRecord?(breach: BreachRecord): Promise<void>;
    loadActiveBreaches?(artifactId?: string): Promise<BreachRecord[]>;
    updateBreachStatus?(breachId: BreachId, status: BreachRecord['status']): Promise<void>;
    saveSubscription?(sub: AlertSubscription): Promise<void>;
    loadSubscriptions?(ruleId?: AlertRuleId): Promise<AlertSubscription[]>;
    saveTemplate?(template: TemplateDefinition): Promise<void>;
    loadTemplates?(): Promise<TemplateDefinition[]>;
    deleteTemplate?(id: TemplateId): Promise<void>;
    saveLastInteractionState?(dashboardId: string, state: DashboardInteractionState): Promise<void>;
    loadLastInteractionState?(dashboardId: string): Promise<DashboardInteractionState | undefined>;
    saveDashboardBookmark?(bookmark: DashboardBookmark): Promise<void>;
    listDashboardBookmarks?(dashboardId: string): Promise<DashboardBookmark[]>;
    deleteDashboardBookmark?(bookmarkId: string): Promise<void>;
}
export interface VersionSummary {
    version: number;
    savedAt: number;
    savedBy?: string;
    changeDescription?: string;
    sizeBytes: number;
}
export interface ArtifactHistoryExtension {
    getArtifactHistory(id: string, options?: {
        limit?: number;
        before?: number;
    }): Promise<VersionSummary[]>;
    getArtifactVersion(id: string, version: number): Promise<unknown>;
    restoreArtifactVersion(id: string, version: number): Promise<void>;
}
export declare function hasHistorySupport(adapter: WorkspaceAdapter): adapter is WorkspaceAdapter & ArtifactHistoryExtension;
export declare function generateChangeDescription(previous: unknown, current: unknown): string;
//# sourceMappingURL=workspace-adapter.d.ts.map