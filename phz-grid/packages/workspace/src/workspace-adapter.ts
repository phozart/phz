/**
 * @phozart/phz-workspace — WorkspaceAdapter Interface
 *
 * Extends EngineStorageAdapter + AsyncDefinitionStore with placement and catalog methods.
 */

import type { EngineStorageAdapter } from '@phozart/phz-engine';
import type { AsyncDefinitionStore } from '@phozart/phz-shared/definitions';
import type { PlacementRecord } from './placement.js';
import type {
  PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter,
  AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription,
  TemplateDefinition, TemplateId,
} from './types.js';
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

  // NOTE: clear() is inherited from both EngineStorageAdapter and AsyncDefinitionStore.
  // Implementations MUST clear all engine artifacts (reports, dashboards, KPIs, metrics)
  // AND all grid definitions. Both stores must be reset.

  // --- Optional Breach Store extension (H.10) ---
  saveAlertRule?(rule: AlertRule): Promise<void>;
  loadAlertRules?(artifactId?: string): Promise<AlertRule[]>;
  deleteAlertRule?(ruleId: AlertRuleId): Promise<void>;
  saveBreachRecord?(breach: BreachRecord): Promise<void>;
  loadActiveBreaches?(artifactId?: string): Promise<BreachRecord[]>;
  updateBreachStatus?(breachId: BreachId, status: BreachRecord['status']): Promise<void>;
  saveSubscription?(sub: AlertSubscription): Promise<void>;
  loadSubscriptions?(ruleId?: AlertRuleId): Promise<AlertSubscription[]>;

  // --- Optional Template Store extension (H.4) ---
  saveTemplate?(template: TemplateDefinition): Promise<void>;
  loadTemplates?(): Promise<TemplateDefinition[]>;
  deleteTemplate?(id: TemplateId): Promise<void>;

  // --- Optional Bookmark Store extension (WE-13) ---
  saveLastInteractionState?(dashboardId: string, state: DashboardInteractionState): Promise<void>;
  loadLastInteractionState?(dashboardId: string): Promise<DashboardInteractionState | undefined>;
  saveDashboardBookmark?(bookmark: DashboardBookmark): Promise<void>;
  listDashboardBookmarks?(dashboardId: string): Promise<DashboardBookmark[]>;
  deleteDashboardBookmark?(bookmarkId: string): Promise<void>;
}

// --- Artifact History Extension (H.18) ---

export interface VersionSummary {
  version: number;
  savedAt: number;
  savedBy?: string;
  changeDescription?: string;
  sizeBytes: number;
}

export interface ArtifactHistoryExtension {
  getArtifactHistory(id: string, options?: { limit?: number; before?: number }): Promise<VersionSummary[]>;
  getArtifactVersion(id: string, version: number): Promise<unknown>;
  restoreArtifactVersion(id: string, version: number): Promise<void>;
}

export function hasHistorySupport(adapter: WorkspaceAdapter): adapter is WorkspaceAdapter & ArtifactHistoryExtension {
  return 'getArtifactHistory' in adapter && typeof (adapter as any).getArtifactHistory === 'function';
}

export function generateChangeDescription(previous: unknown, current: unknown): string {
  if (previous === undefined || previous === null) return 'Initial version';

  const prev = previous as Record<string, unknown>;
  const curr = current as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const key of allKeys) {
    const inPrev = key in prev;
    const inCurr = key in curr;

    if (!inPrev && inCurr) {
      added.push(key);
    } else if (inPrev && !inCurr) {
      removed.push(key);
    } else if (inPrev && inCurr && JSON.stringify(prev[key]) !== JSON.stringify(curr[key])) {
      modified.push(key);
    }
  }

  const parts: string[] = [];
  if (added.length > 0) parts.push(`Added ${added.join(', ')}`);
  if (removed.length > 0) parts.push(`Removed ${removed.join(', ')}`);
  if (modified.length > 0) parts.push(`Modified ${modified.join(', ')}`);

  return parts.length > 0 ? parts.join('. ') : 'No changes';
}
