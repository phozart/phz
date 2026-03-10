/**
 * @phozart/phz-local — Filesystem Workspace Adapter (R.2)
 *
 * Implements WorkspaceAdapter over the filesystem.
 * Artifacts stored as: {dataDir}/artifacts/{type}/{id}.json
 * History versions as: {dataDir}/artifacts/{type}/{id}.v{n}.json
 * Uses atomic writes (write .tmp, rename) to prevent corruption.
 */

import { readFile, writeFile, rename, readdir, mkdir, unlink, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/phz-engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/phz-shared/definitions';
import { createDefinitionId } from '@phozart/phz-shared/definitions';
import type {
  WorkspaceAdapter,
  ArtifactHistoryExtension,
  VersionSummary,
} from '@phozart/phz-workspace';
import type {
  PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter,
  AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription,
  TemplateDefinition, TemplateId,
} from '@phozart/phz-workspace';
import type { PlacementRecord } from '@phozart/phz-workspace';

export class FsWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  // --- Filesystem helpers ---

  private artifactDir(type: string): string {
    return join(this.dataDir, 'artifacts', type);
  }

  private artifactPath(type: string, id: string): string {
    return join(this.artifactDir(type), `${id}.json`);
  }

  private versionPath(type: string, id: string, version: number): string {
    return join(this.artifactDir(type), `${id}.v${version}.json`);
  }

  private async ensureDir(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  private async atomicWrite(filePath: string, data: unknown): Promise<void> {
    const dir = join(filePath, '..');
    await this.ensureDir(dir);
    const tmpPath = filePath + '.tmp';
    await writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await rename(tmpPath, filePath);
  }

  private async readJson<T>(filePath: string): Promise<T | undefined> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return undefined;
    }
  }

  private async listJsonFiles(dir: string): Promise<string[]> {
    try {
      const entries = await readdir(dir);
      return entries.filter(f => f.endsWith('.json') && !f.includes('.v') && !f.endsWith('.tmp'));
    } catch {
      return [];
    }
  }

  private async loadAll<T>(type: string): Promise<T[]> {
    const dir = this.artifactDir(type);
    const files = await this.listJsonFiles(dir);
    const results: T[] = [];
    for (const file of files) {
      const data = await this.readJson<T>(join(dir, file));
      if (data) results.push(data);
    }
    return results;
  }

  // --- Initialize ---

  async initialize(): Promise<void> {
    await this.ensureDir(this.artifactDir('reports'));
    await this.ensureDir(this.artifactDir('dashboards'));
    await this.ensureDir(this.artifactDir('kpis'));
    await this.ensureDir(this.artifactDir('metrics'));
    await this.ensureDir(this.artifactDir('definitions'));
    await this.ensureDir(this.artifactDir('placements'));
    await this.ensureDir(this.artifactDir('alert-rules'));
    await this.ensureDir(this.artifactDir('breaches'));
    await this.ensureDir(this.artifactDir('subscriptions'));
    await this.ensureDir(this.artifactDir('templates'));
  }

  // --- Reports ---

  async saveReport(report: ReportConfig): Promise<void> {
    const id = report.id as string;
    await this.recordVersion('reports', id, report);
    await this.atomicWrite(this.artifactPath('reports', id), report);
  }

  async loadReports(): Promise<ReportConfig[]> {
    return this.loadAll<ReportConfig>('reports');
  }

  async deleteReport(id: ReportId): Promise<void> {
    try { await unlink(this.artifactPath('reports', id as string)); } catch { /* noop */ }
  }

  // --- Dashboards ---

  async saveDashboard(dashboard: DashboardConfig): Promise<void> {
    await this.atomicWrite(this.artifactPath('dashboards', dashboard.id as string), dashboard);
  }

  async loadDashboards(): Promise<DashboardConfig[]> {
    return this.loadAll<DashboardConfig>('dashboards');
  }

  async deleteDashboard(id: DashboardId): Promise<void> {
    try { await unlink(this.artifactPath('dashboards', id as string)); } catch { /* noop */ }
  }

  // --- KPIs ---

  async saveKPI(kpi: KPIDefinition): Promise<void> {
    await this.atomicWrite(this.artifactPath('kpis', kpi.id as string), kpi);
  }

  async loadKPIs(): Promise<KPIDefinition[]> {
    return this.loadAll<KPIDefinition>('kpis');
  }

  async deleteKPI(id: KPIId): Promise<void> {
    try { await unlink(this.artifactPath('kpis', id as string)); } catch { /* noop */ }
  }

  // --- Metrics ---

  async saveMetric(metric: MetricDef): Promise<void> {
    await this.atomicWrite(this.artifactPath('metrics', metric.id as string), metric);
  }

  async loadMetrics(): Promise<MetricDef[]> {
    return this.loadAll<MetricDef>('metrics');
  }

  async deleteMetric(id: MetricId): Promise<void> {
    try { await unlink(this.artifactPath('metrics', id as string)); } catch { /* noop */ }
  }

  // --- Definitions ---

  async save(def: GridDefinition): Promise<GridDefinition> {
    const now = new Date().toISOString();
    const saved: GridDefinition = {
      ...def,
      updatedAt: now,
      createdAt: def.createdAt || now,
    };
    await this.atomicWrite(this.artifactPath('definitions', def.id as string), saved);
    return saved;
  }

  async load(id: DefinitionId): Promise<GridDefinition | undefined> {
    return this.readJson<GridDefinition>(this.artifactPath('definitions', id as string));
  }

  async list(): Promise<DefinitionMeta[]> {
    const defs = await this.loadAll<GridDefinition>('definitions');
    return defs.map(d => ({
      id: d.id as string,
      name: d.name,
      description: d.description,
      updatedAt: d.updatedAt,
    }));
  }

  async delete(id: DefinitionId): Promise<boolean> {
    try {
      await unlink(this.artifactPath('definitions', id as string));
      return true;
    } catch {
      return false;
    }
  }

  async duplicate(id: DefinitionId, options?: { name?: string }): Promise<GridDefinition | undefined> {
    const original = await this.load(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const copy: GridDefinition = {
      ...structuredClone(original),
      id: createDefinitionId(),
      name: options?.name ?? `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await this.save(copy);
    return copy;
  }

  // --- Placements ---

  async savePlacement(placement: PlacementRecord): Promise<PlacementRecord> {
    await this.atomicWrite(this.artifactPath('placements', placement.id as string), placement);
    return placement;
  }

  async loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]> {
    let results = await this.loadAll<PlacementRecord>('placements');
    if (filter?.artifactId) results = results.filter(p => p.artifactId === filter.artifactId);
    if (filter?.artifactType) results = results.filter(p => p.artifactType === filter.artifactType);
    if (filter?.target) results = results.filter(p => p.target === filter.target);
    return results;
  }

  async deletePlacement(id: PlacementId): Promise<void> {
    try { await unlink(this.artifactPath('placements', id as string)); } catch { /* noop */ }
  }

  // --- Catalog ---

  async listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
    const artifacts: ArtifactMeta[] = [];

    const typeMap: Array<[string, string]> = [
      ['reports', 'report'],
      ['dashboards', 'dashboard'],
      ['kpis', 'kpi'],
      ['metrics', 'metric'],
      ['definitions', 'grid-definition'],
    ];

    for (const [dirName, artifactType] of typeMap) {
      const items = await this.loadAll<{ id: string; name: string; description?: string }>(dirName);
      for (const item of items) {
        artifacts.push({
          id: item.id,
          type: artifactType as ArtifactMeta['type'],
          name: item.name,
          description: item.description,
          createdAt: 0,
          updatedAt: 0,
        });
      }
    }

    let results = artifacts;
    if (filter?.type) results = results.filter(a => a.type === filter.type);
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
    await this.atomicWrite(this.artifactPath('alert-rules', rule.id as string), rule);
  }

  async loadAlertRules(artifactId?: string): Promise<AlertRule[]> {
    let results = await this.loadAll<AlertRule>('alert-rules');
    if (artifactId) results = results.filter(r => r.artifactId === artifactId);
    return results;
  }

  async deleteAlertRule(ruleId: AlertRuleId): Promise<void> {
    try { await unlink(this.artifactPath('alert-rules', ruleId as string)); } catch { /* noop */ }
  }

  async saveBreachRecord(breach: BreachRecord): Promise<void> {
    await this.atomicWrite(this.artifactPath('breaches', breach.id as string), breach);
  }

  async loadActiveBreaches(artifactId?: string): Promise<BreachRecord[]> {
    let results = (await this.loadAll<BreachRecord>('breaches')).filter(b => b.status === 'active');
    if (artifactId) results = results.filter(b => b.artifactId === artifactId);
    return results;
  }

  async updateBreachStatus(breachId: BreachId, status: BreachRecord['status']): Promise<void> {
    const breach = await this.readJson<BreachRecord>(this.artifactPath('breaches', breachId as string));
    if (!breach) return;
    breach.status = status;
    if (status === 'acknowledged') breach.acknowledgedAt = Date.now();
    if (status === 'resolved') breach.resolvedAt = Date.now();
    await this.atomicWrite(this.artifactPath('breaches', breachId as string), breach);
  }

  async saveSubscription(sub: AlertSubscription): Promise<void> {
    await this.atomicWrite(this.artifactPath('subscriptions', sub.id), sub);
  }

  async loadSubscriptions(ruleId?: AlertRuleId): Promise<AlertSubscription[]> {
    let results = await this.loadAll<AlertSubscription>('subscriptions');
    if (ruleId) results = results.filter(s => s.ruleId === ruleId);
    return results;
  }

  // --- Template Store ---

  async saveTemplate(template: TemplateDefinition): Promise<void> {
    await this.atomicWrite(this.artifactPath('templates', template.id as string), template);
  }

  async loadTemplates(): Promise<TemplateDefinition[]> {
    return this.loadAll<TemplateDefinition>('templates');
  }

  async deleteTemplate(id: TemplateId): Promise<void> {
    try { await unlink(this.artifactPath('templates', id as string)); } catch { /* noop */ }
  }

  // --- Artifact History ---

  private async recordVersion(type: string, id: string, data: unknown): Promise<void> {
    const nextVersion = await this.getNextVersion(type, id);
    await this.atomicWrite(this.versionPath(type, id, nextVersion), data);
  }

  private async getNextVersion(type: string, id: string): Promise<number> {
    const dir = this.artifactDir(type);
    try {
      const entries = await readdir(dir);
      const prefix = `${id}.v`;
      const versions = entries
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .map(f => parseInt(f.slice(prefix.length, -5), 10))
        .filter(n => !isNaN(n));
      return versions.length > 0 ? Math.max(...versions) + 1 : 1;
    } catch {
      return 1;
    }
  }

  async getArtifactHistory(id: string, options?: { limit?: number; before?: number }): Promise<VersionSummary[]> {
    // Search all type directories for versions of this id
    const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
    const results: VersionSummary[] = [];

    for (const type of types) {
      const dir = this.artifactDir(type);
      try {
        const entries = await readdir(dir);
        const prefix = `${id}.v`;
        for (const entry of entries) {
          if (!entry.startsWith(prefix) || !entry.endsWith('.json')) continue;
          const version = parseInt(entry.slice(prefix.length, -5), 10);
          if (isNaN(version)) continue;
          if (options?.before !== undefined && version >= options.before) continue;

          const filePath = join(dir, entry);
          const s = await stat(filePath);
          results.push({
            version,
            savedAt: s.mtimeMs,
            sizeBytes: s.size,
          });
        }
      } catch { /* directory may not exist */ }
    }

    results.sort((a, b) => b.version - a.version);
    if (options?.limit) return results.slice(0, options.limit);
    return results;
  }

  async getArtifactVersion(id: string, version: number): Promise<unknown> {
    const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
    for (const type of types) {
      const data = await this.readJson(this.versionPath(type, id, version));
      if (data !== undefined) return data;
    }
    return undefined;
  }

  async restoreArtifactVersion(id: string, version: number): Promise<void> {
    const data = await this.getArtifactVersion(id, version);
    if (data === undefined) return;

    // Find which type this artifact belongs to and restore
    const types = ['reports', 'dashboards', 'kpis', 'metrics', 'definitions'];
    for (const type of types) {
      const existing = await this.readJson(this.artifactPath(type, id));
      if (existing !== undefined) {
        await this.atomicWrite(this.artifactPath(type, id), data);
        return;
      }
    }
  }

  // --- Clear ---

  async clear(): Promise<void> {
    const types = [
      'reports', 'dashboards', 'kpis', 'metrics',
      'definitions', 'placements', 'alert-rules',
      'breaches', 'subscriptions', 'templates',
    ];

    for (const type of types) {
      const dir = this.artifactDir(type);
      try {
        const entries = await readdir(dir);
        for (const entry of entries) {
          await unlink(join(dir, entry));
        }
      } catch { /* noop */ }
    }
  }
}
