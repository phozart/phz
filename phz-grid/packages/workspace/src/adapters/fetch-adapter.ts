/**
 * @phozart/phz-workspace — FetchWorkspaceAdapter
 *
 * REST client implementing WorkspaceAdapter that delegates to a server.
 */

import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/phz-engine';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/phz-shared/definitions';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type {
  PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter,
  AlertRule, AlertRuleId, BreachRecord, BreachId, AlertSubscription,
  TemplateDefinition, TemplateId,
} from '../types.js';

export interface FetchAdapterOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class FetchWorkspaceAdapter implements WorkspaceAdapter {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: FetchAdapterOptions) {
    // Strip trailing slash
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...(options.headers as Record<string, string> | undefined) },
    });
    if (!response.ok) {
      throw new Error(`Workspace API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private async requestOptional<T>(path: string, options: RequestInit = {}): Promise<T | undefined> {
    const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...(options.headers as Record<string, string> | undefined) },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`Workspace API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private buildQueryString(params: Record<string, string | undefined>): string {
    const entries = Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined);
    if (entries.length === 0) return '';
    return '?' + new URLSearchParams(entries).toString();
  }

  // --- Initialize ---

  async initialize(): Promise<void> {
    await this.request('/health', { method: 'GET' });
  }

  // --- Reports ---

  async saveReport(report: ReportConfig): Promise<void> {
    await this.request('/reports', { method: 'POST', body: JSON.stringify(report) });
  }

  async loadReports(): Promise<ReportConfig[]> {
    return this.request<ReportConfig[]>('/reports', { method: 'GET' });
  }

  async deleteReport(id: ReportId): Promise<void> {
    await this.request(`/reports/${id as string}`, { method: 'DELETE' });
  }

  // --- Dashboards ---

  async saveDashboard(dashboard: DashboardConfig): Promise<void> {
    await this.request('/dashboards', { method: 'POST', body: JSON.stringify(dashboard) });
  }

  async loadDashboards(): Promise<DashboardConfig[]> {
    return this.request<DashboardConfig[]>('/dashboards', { method: 'GET' });
  }

  async deleteDashboard(id: DashboardId): Promise<void> {
    await this.request(`/dashboards/${id as string}`, { method: 'DELETE' });
  }

  // --- KPIs ---

  async saveKPI(kpi: KPIDefinition): Promise<void> {
    await this.request('/kpis', { method: 'POST', body: JSON.stringify(kpi) });
  }

  async loadKPIs(): Promise<KPIDefinition[]> {
    return this.request<KPIDefinition[]>('/kpis', { method: 'GET' });
  }

  async deleteKPI(id: KPIId): Promise<void> {
    await this.request(`/kpis/${id as string}`, { method: 'DELETE' });
  }

  // --- Metrics ---

  async saveMetric(metric: MetricDef): Promise<void> {
    await this.request('/metrics', { method: 'POST', body: JSON.stringify(metric) });
  }

  async loadMetrics(): Promise<MetricDef[]> {
    return this.request<MetricDef[]>('/metrics', { method: 'GET' });
  }

  async deleteMetric(id: MetricId): Promise<void> {
    await this.request(`/metrics/${id as string}`, { method: 'DELETE' });
  }

  // --- Definitions (AsyncDefinitionStore) ---

  async save(def: GridDefinition): Promise<GridDefinition> {
    return this.request<GridDefinition>('/definitions', { method: 'POST', body: JSON.stringify(def) });
  }

  async load(id: DefinitionId): Promise<GridDefinition | undefined> {
    return this.requestOptional<GridDefinition>(`/definitions/${id as string}`, { method: 'GET' });
  }

  async list(): Promise<DefinitionMeta[]> {
    return this.request<DefinitionMeta[]>('/definitions', { method: 'GET' });
  }

  async delete(id: DefinitionId): Promise<boolean> {
    const result = await this.request<{ deleted: boolean }>(`/definitions/${id as string}`, { method: 'DELETE' });
    return result.deleted;
  }

  async duplicate(id: DefinitionId, options?: { name?: string }): Promise<GridDefinition | undefined> {
    return this.requestOptional<GridDefinition>(
      `/definitions/${id as string}/duplicate`,
      { method: 'POST', body: JSON.stringify(options ?? {}) },
    );
  }

  // --- Placements ---

  async savePlacement(placement: PlacementRecord): Promise<PlacementRecord> {
    return this.request<PlacementRecord>('/placements', { method: 'POST', body: JSON.stringify(placement) });
  }

  async loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]> {
    const qs = filter
      ? this.buildQueryString({
          artifactId: filter.artifactId,
          artifactType: filter.artifactType,
          target: filter.target,
        })
      : '';
    return this.request<PlacementRecord[]>(`/placements${qs}`, { method: 'GET' });
  }

  async deletePlacement(id: PlacementId): Promise<void> {
    await this.request(`/placements/${id as string}`, { method: 'DELETE' });
  }

  // --- Catalog ---

  async listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
    const qs = filter
      ? this.buildQueryString({
          type: filter.type,
          search: filter.search,
          published: filter.published !== undefined ? String(filter.published) : undefined,
        })
      : '';
    return this.request<ArtifactMeta[]>(`/artifacts${qs}`, { method: 'GET' });
  }

  // --- Breach Store ---

  async saveAlertRule(rule: AlertRule): Promise<void> {
    await this.request('/alert-rules', { method: 'POST', body: JSON.stringify(rule) });
  }

  async loadAlertRules(artifactId?: string): Promise<AlertRule[]> {
    const qs = artifactId ? this.buildQueryString({ artifactId }) : '';
    return this.request<AlertRule[]>(`/alert-rules${qs}`, { method: 'GET' });
  }

  async deleteAlertRule(ruleId: AlertRuleId): Promise<void> {
    await this.request(`/alert-rules/${ruleId as string}`, { method: 'DELETE' });
  }

  async saveBreachRecord(breach: BreachRecord): Promise<void> {
    await this.request('/breaches', { method: 'POST', body: JSON.stringify(breach) });
  }

  async loadActiveBreaches(artifactId?: string): Promise<BreachRecord[]> {
    const qs = artifactId ? this.buildQueryString({ artifactId }) : '';
    return this.request<BreachRecord[]>(`/breaches/active${qs}`, { method: 'GET' });
  }

  async updateBreachStatus(breachId: BreachId, status: BreachRecord['status']): Promise<void> {
    await this.request(`/breaches/${breachId as string}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async saveSubscription(sub: AlertSubscription): Promise<void> {
    await this.request('/subscriptions', { method: 'POST', body: JSON.stringify(sub) });
  }

  async loadSubscriptions(ruleId?: AlertRuleId): Promise<AlertSubscription[]> {
    const qs = ruleId ? this.buildQueryString({ ruleId: ruleId as string }) : '';
    return this.request<AlertSubscription[]>(`/subscriptions${qs}`, { method: 'GET' });
  }

  // --- Template Store ---

  async saveTemplate(template: TemplateDefinition): Promise<void> {
    await this.request('/templates', { method: 'POST', body: JSON.stringify(template) });
  }

  async loadTemplates(): Promise<TemplateDefinition[]> {
    return this.request<TemplateDefinition[]>('/templates', { method: 'GET' });
  }

  async deleteTemplate(id: TemplateId): Promise<void> {
    await this.request(`/templates/${id as string}`, { method: 'DELETE' });
  }

  // --- Clear ---

  async clear(): Promise<void> {
    await this.request('/clear', { method: 'POST' });
  }
}
