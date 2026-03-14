/**
 * @phozart/engine — Pluggable Storage Adapter
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

// --- Interface ---

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

// --- Memory Adapter ---

export class MemoryStorageAdapter implements EngineStorageAdapter {
  private reports = new Map<string, ReportConfig>();
  private dashboards = new Map<string, DashboardConfig>();
  private kpis = new Map<string, KPIDefinition>();
  private metrics = new Map<string, MetricDef>();

  async saveReport(report: ReportConfig): Promise<void> {
    this.reports.set(report.id as string, report);
  }
  async loadReports(): Promise<ReportConfig[]> {
    return Array.from(this.reports.values());
  }
  async deleteReport(id: ReportId): Promise<void> {
    this.reports.delete(id as string);
  }

  async saveDashboard(dashboard: DashboardConfig): Promise<void> {
    this.dashboards.set(dashboard.id as string, dashboard);
  }
  async loadDashboards(): Promise<DashboardConfig[]> {
    return Array.from(this.dashboards.values());
  }
  async deleteDashboard(id: DashboardId): Promise<void> {
    this.dashboards.delete(id as string);
  }

  async saveKPI(kpi: KPIDefinition): Promise<void> {
    this.kpis.set(kpi.id as string, kpi);
  }
  async loadKPIs(): Promise<KPIDefinition[]> {
    return Array.from(this.kpis.values());
  }
  async deleteKPI(id: KPIId): Promise<void> {
    this.kpis.delete(id as string);
  }

  async saveMetric(metric: MetricDef): Promise<void> {
    this.metrics.set(metric.id as string, metric);
  }
  async loadMetrics(): Promise<MetricDef[]> {
    return Array.from(this.metrics.values());
  }
  async deleteMetric(id: MetricId): Promise<void> {
    this.metrics.delete(id as string);
  }

  async clear(): Promise<void> {
    this.reports.clear();
    this.dashboards.clear();
    this.kpis.clear();
    this.metrics.clear();
  }
}

// --- LocalStorage Adapter ---

type StorageSlot = 'reports' | 'dashboards' | 'kpis' | 'metrics';

export class LocalStorageAdapter implements EngineStorageAdapter {
  constructor(
    private storage: Storage,
    private namespace: string,
  ) {}

  private key(slot: StorageSlot): string {
    return `${this.namespace}:${slot}`;
  }

  private readSlot<T>(slot: StorageSlot): T[] {
    try {
      const raw = this.storage.getItem(this.key(slot));
      if (!raw) return [];
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private writeSlot<T>(slot: StorageSlot, items: T[]): void {
    this.storage.setItem(this.key(slot), JSON.stringify(items));
  }

  // Reports
  async saveReport(report: ReportConfig): Promise<void> {
    const existing = this.readSlot<ReportConfig>('reports');
    const idx = existing.findIndex(r => r.id === report.id);
    if (idx >= 0) existing[idx] = report;
    else existing.push(report);
    this.writeSlot('reports', existing);
  }
  async loadReports(): Promise<ReportConfig[]> {
    return this.readSlot<ReportConfig>('reports');
  }
  async deleteReport(id: ReportId): Promise<void> {
    const existing = this.readSlot<ReportConfig>('reports');
    this.writeSlot('reports', existing.filter(r => r.id !== (id as string)));
  }

  // Dashboards
  async saveDashboard(dashboard: DashboardConfig): Promise<void> {
    const existing = this.readSlot<DashboardConfig>('dashboards');
    const idx = existing.findIndex(d => d.id === dashboard.id);
    if (idx >= 0) existing[idx] = dashboard;
    else existing.push(dashboard);
    this.writeSlot('dashboards', existing);
  }
  async loadDashboards(): Promise<DashboardConfig[]> {
    return this.readSlot<DashboardConfig>('dashboards');
  }
  async deleteDashboard(id: DashboardId): Promise<void> {
    const existing = this.readSlot<DashboardConfig>('dashboards');
    this.writeSlot('dashboards', existing.filter(d => d.id !== (id as string)));
  }

  // KPIs
  async saveKPI(kpi: KPIDefinition): Promise<void> {
    const existing = this.readSlot<KPIDefinition>('kpis');
    const idx = existing.findIndex(k => k.id === kpi.id);
    if (idx >= 0) existing[idx] = kpi;
    else existing.push(kpi);
    this.writeSlot('kpis', existing);
  }
  async loadKPIs(): Promise<KPIDefinition[]> {
    return this.readSlot<KPIDefinition>('kpis');
  }
  async deleteKPI(id: KPIId): Promise<void> {
    const existing = this.readSlot<KPIDefinition>('kpis');
    this.writeSlot('kpis', existing.filter(k => k.id !== (id as string)));
  }

  // Metrics
  async saveMetric(metric: MetricDef): Promise<void> {
    const existing = this.readSlot<MetricDef>('metrics');
    const idx = existing.findIndex(m => m.id === metric.id);
    if (idx >= 0) existing[idx] = metric;
    else existing.push(metric);
    this.writeSlot('metrics', existing);
  }
  async loadMetrics(): Promise<MetricDef[]> {
    return this.readSlot<MetricDef>('metrics');
  }
  async deleteMetric(id: MetricId): Promise<void> {
    const existing = this.readSlot<MetricDef>('metrics');
    this.writeSlot('metrics', existing.filter(m => m.id !== (id as string)));
  }

  // Clear
  async clear(): Promise<void> {
    this.storage.removeItem(this.key('reports'));
    this.storage.removeItem(this.key('dashboards'));
    this.storage.removeItem(this.key('kpis'));
    this.storage.removeItem(this.key('metrics'));
  }
}
