/**
 * @phozart/phz-workspace — MemoryWorkspaceAdapter
 *
 * In-memory implementation of WorkspaceAdapter for testing and ephemeral usage.
 */

import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/phz-engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/phz-shared/definitions';
import { createDefinitionId } from '@phozart/phz-shared/definitions';
import type { WorkspaceAdapter, ArtifactHistoryExtension, VersionSummary } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type {
  PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter,
  AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription,
  TemplateDefinition, TemplateId,
} from '../types.js';

interface VersionEntry {
  version: number;
  savedAt: number;
  data: unknown;
}

export class MemoryWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
  private reports = new Map<string, ReportConfig>();
  private dashboards = new Map<string, DashboardConfig>();
  private kpis = new Map<string, KPIDefinition>();
  private metrics = new Map<string, MetricDef>();
  private definitions = new Map<string, GridDefinition>();
  private placements = new Map<string, PlacementRecord>();
  private alertRules = new Map<string, AlertRule>();
  private breaches = new Map<string, BreachRecord>();
  private subscriptions = new Map<string, AlertSubscription>();
  private templates = new Map<string, TemplateDefinition>();
  private history = new Map<string, VersionEntry[]>();

  // --- Initialize ---

  async initialize(): Promise<void> {
    // No-op for memory adapter
  }

  // --- EngineStorageAdapter: Reports ---

  async saveReport(report: ReportConfig): Promise<void> {
    this.reports.set(report.id as string, report);
    this.recordVersion(report.id as string, structuredClone(report));
  }

  async loadReports(): Promise<ReportConfig[]> {
    return Array.from(this.reports.values());
  }

  async deleteReport(id: ReportId): Promise<void> {
    this.reports.delete(id as string);
  }

  // --- EngineStorageAdapter: Dashboards ---

  async saveDashboard(dashboard: DashboardConfig): Promise<void> {
    this.dashboards.set(dashboard.id as string, dashboard);
  }

  async loadDashboards(): Promise<DashboardConfig[]> {
    return Array.from(this.dashboards.values());
  }

  async deleteDashboard(id: DashboardId): Promise<void> {
    this.dashboards.delete(id as string);
  }

  // --- EngineStorageAdapter: KPIs ---

  async saveKPI(kpi: KPIDefinition): Promise<void> {
    this.kpis.set(kpi.id as string, kpi);
  }

  async loadKPIs(): Promise<KPIDefinition[]> {
    return Array.from(this.kpis.values());
  }

  async deleteKPI(id: KPIId): Promise<void> {
    this.kpis.delete(id as string);
  }

  // --- EngineStorageAdapter: Metrics ---

  async saveMetric(metric: MetricDef): Promise<void> {
    this.metrics.set(metric.id as string, metric);
  }

  async loadMetrics(): Promise<MetricDef[]> {
    return Array.from(this.metrics.values());
  }

  async deleteMetric(id: MetricId): Promise<void> {
    this.metrics.delete(id as string);
  }

  // --- AsyncDefinitionStore ---

  async save(def: GridDefinition): Promise<GridDefinition> {
    const now = new Date().toISOString();
    const saved: GridDefinition = {
      ...def,
      updatedAt: now,
      createdAt: def.createdAt || now,
    };
    this.definitions.set(def.id as string, saved);
    return saved;
  }

  async load(id: DefinitionId): Promise<GridDefinition | undefined> {
    return this.definitions.get(id as string);
  }

  async list(): Promise<DefinitionMeta[]> {
    return Array.from(this.definitions.values()).map(d => ({
      id: d.id as string,
      name: d.name,
      description: d.description,
      updatedAt: d.updatedAt,
    }));
  }

  async delete(id: DefinitionId): Promise<boolean> {
    return this.definitions.delete(id as string);
  }

  async duplicate(id: DefinitionId, options?: { name?: string }): Promise<GridDefinition | undefined> {
    const original = this.definitions.get(id as string);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const copy: GridDefinition = {
      ...structuredClone(original),
      id: createDefinitionId(),
      name: options?.name ?? `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    this.definitions.set(copy.id as string, copy);
    return copy;
  }

  // --- Placements ---

  async savePlacement(placement: PlacementRecord): Promise<PlacementRecord> {
    this.placements.set(placement.id as string, placement);
    return placement;
  }

  async loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]> {
    let results = Array.from(this.placements.values());
    if (filter?.artifactId) {
      results = results.filter(p => p.artifactId === filter.artifactId);
    }
    if (filter?.artifactType) {
      results = results.filter(p => p.artifactType === filter.artifactType);
    }
    if (filter?.target) {
      results = results.filter(p => p.target === filter.target);
    }
    return results;
  }

  async deletePlacement(id: PlacementId): Promise<void> {
    this.placements.delete(id as string);
  }

  // --- Catalog ---

  async listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
    const artifacts: ArtifactMeta[] = [];

    for (const r of this.reports.values()) {
      artifacts.push({
        id: r.id as string,
        type: 'report',
        name: r.name,
        description: r.description,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    for (const d of this.dashboards.values()) {
      artifacts.push({
        id: d.id as string,
        type: 'dashboard',
        name: d.name,
        description: d.description,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    for (const k of this.kpis.values()) {
      artifacts.push({
        id: k.id as string,
        type: 'kpi',
        name: k.name,
        description: k.description,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    for (const m of this.metrics.values()) {
      artifacts.push({
        id: m.id as string,
        type: 'metric',
        name: m.name,
        description: m.description,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    for (const def of this.definitions.values()) {
      artifacts.push({
        id: def.id as string,
        type: 'grid-definition',
        name: def.name,
        description: def.description,
        createdAt: Date.parse(def.createdAt) || 0,
        updatedAt: Date.parse(def.updatedAt) || 0,
      });
    }

    let results = artifacts;

    if (filter?.type) {
      results = results.filter(a => a.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(a => a.name.toLowerCase().includes(q));
    }
    if (filter?.published !== undefined) {
      results = results.filter(a => a.published === filter.published);
    }

    return results;
  }

  // --- Breach Store ---

  async saveAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.set(rule.id as string, rule);
  }

  async loadAlertRules(artifactId?: string): Promise<AlertRule[]> {
    let results = Array.from(this.alertRules.values());
    if (artifactId) {
      results = results.filter(r => r.artifactId === artifactId);
    }
    return results;
  }

  async deleteAlertRule(ruleId: AlertRuleId): Promise<void> {
    this.alertRules.delete(ruleId as string);
  }

  async saveBreachRecord(breach: BreachRecord): Promise<void> {
    this.breaches.set(breach.id as string, breach);
  }

  async loadActiveBreaches(artifactId?: string): Promise<BreachRecord[]> {
    let results = Array.from(this.breaches.values()).filter(b => b.status === 'active');
    if (artifactId) {
      results = results.filter(b => b.artifactId === artifactId);
    }
    return results;
  }

  async updateBreachStatus(breachId: BreachId, status: BreachRecord['status']): Promise<void> {
    const breach = this.breaches.get(breachId as string);
    if (breach) {
      breach.status = status;
      if (status === 'acknowledged') {
        breach.acknowledgedAt = Date.now();
      } else if (status === 'resolved') {
        breach.resolvedAt = Date.now();
      }
    }
  }

  async saveSubscription(sub: AlertSubscription): Promise<void> {
    this.subscriptions.set(sub.id, sub);
  }

  async loadSubscriptions(ruleId?: AlertRuleId): Promise<AlertSubscription[]> {
    let results = Array.from(this.subscriptions.values());
    if (ruleId) {
      results = results.filter(s => s.ruleId === ruleId);
    }
    return results;
  }

  // --- Template Store ---

  async saveTemplate(template: TemplateDefinition): Promise<void> {
    this.templates.set(template.id as string, template);
  }

  async loadTemplates(): Promise<TemplateDefinition[]> {
    return Array.from(this.templates.values());
  }

  async deleteTemplate(id: TemplateId): Promise<void> {
    this.templates.delete(id as string);
  }

  // --- Artifact History ---

  private recordVersion(id: string, data: unknown): void {
    const entries = this.history.get(id) ?? [];
    entries.push({
      version: entries.length + 1,
      savedAt: Date.now(),
      data,
    });
    this.history.set(id, entries);
  }

  async getArtifactHistory(id: string, options?: { limit?: number; before?: number }): Promise<VersionSummary[]> {
    const entries = this.history.get(id) ?? [];
    let filtered = [...entries];

    if (options?.before !== undefined) {
      filtered = filtered.filter(e => e.version < options.before!);
    }

    // Most recent first
    filtered.sort((a, b) => b.version - a.version);

    if (options?.limit !== undefined) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered.map(e => ({
      version: e.version,
      savedAt: e.savedAt,
      sizeBytes: JSON.stringify(e.data).length,
    }));
  }

  async getArtifactVersion(id: string, version: number): Promise<unknown> {
    const entries = this.history.get(id) ?? [];
    const entry = entries.find(e => e.version === version);
    return entry?.data;
  }

  async restoreArtifactVersion(id: string, version: number): Promise<void> {
    const data = await this.getArtifactVersion(id, version);
    if (data === undefined) return;

    // Restore into the appropriate store based on what was stored
    const obj = structuredClone(data) as unknown;
    if (this.reports.has(id)) {
      this.reports.set(id, obj as ReportConfig);
    } else if (this.dashboards.has(id)) {
      this.dashboards.set(id, obj as DashboardConfig);
    } else if (this.kpis.has(id)) {
      this.kpis.set(id, obj as KPIDefinition);
    } else if (this.metrics.has(id)) {
      this.metrics.set(id, obj as MetricDef);
    }
  }

  // --- Clear ---

  async clear(): Promise<void> {
    this.reports.clear();
    this.dashboards.clear();
    this.kpis.clear();
    this.metrics.clear();
    this.definitions.clear();
    this.placements.clear();
    this.alertRules.clear();
    this.breaches.clear();
    this.subscriptions.clear();
    this.templates.clear();
    this.history.clear();
  }
}
