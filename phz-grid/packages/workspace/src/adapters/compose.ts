/**
 * @phozart/phz-workspace — composeWorkspaceAdapter
 *
 * Composes existing EngineStorageAdapter + AsyncDefinitionStore instances
 * into a unified WorkspaceAdapter, adding placement/catalog methods
 * via in-memory defaults.
 */

import type { EngineStorageAdapter, ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import type { ReportId, DashboardId, KPIId, MetricId } from '@phozart/phz-engine';
import { MemoryStorageAdapter } from '@phozart/phz-engine';
import type { AsyncDefinitionStore } from '@phozart/phz-shared/definitions';
import type { GridDefinition, DefinitionMeta, DefinitionId } from '@phozart/phz-shared/definitions';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type { PlacementId, ArtifactMeta, ArtifactFilter, PlacementFilter } from '../types.js';

export interface ComposeOptions {
  engine?: EngineStorageAdapter;
  definitions?: AsyncDefinitionStore;
}

// In-memory definition store fallback
class MemoryDefinitionStore implements AsyncDefinitionStore {
  private defs = new Map<string, GridDefinition>();

  async save(def: GridDefinition): Promise<GridDefinition> {
    this.defs.set(def.id as string, def);
    return def;
  }

  async load(id: DefinitionId): Promise<GridDefinition | undefined> {
    return this.defs.get(id as string);
  }

  async list(): Promise<DefinitionMeta[]> {
    return Array.from(this.defs.values()).map(d => ({
      id: d.id as string,
      name: d.name,
      description: d.description,
      updatedAt: d.updatedAt,
    }));
  }

  async delete(id: DefinitionId): Promise<boolean> {
    return this.defs.delete(id as string);
  }

  async duplicate(id: DefinitionId, options?: { name?: string }): Promise<GridDefinition | undefined> {
    const original = this.defs.get(id as string);
    if (!original) return undefined;
    const copy = { ...structuredClone(original), name: options?.name ?? `${original.name} (Copy)` };
    this.defs.set(copy.id as string, copy);
    return copy;
  }

  async clear(): Promise<void> {
    this.defs.clear();
  }
}

export function composeWorkspaceAdapter(options: ComposeOptions): WorkspaceAdapter {
  const engine = options.engine ?? new MemoryStorageAdapter();
  const definitions = options.definitions ?? new MemoryDefinitionStore();
  const placements = new Map<string, PlacementRecord>();

  return {
    // --- Initialize ---
    async initialize(): Promise<void> {
      // No-op for composed adapter
    },

    // --- EngineStorageAdapter ---
    async saveReport(report: ReportConfig): Promise<void> {
      return engine.saveReport(report);
    },
    async loadReports(): Promise<ReportConfig[]> {
      return engine.loadReports();
    },
    async deleteReport(id: ReportId): Promise<void> {
      return engine.deleteReport(id);
    },
    async saveDashboard(dashboard: DashboardConfig): Promise<void> {
      return engine.saveDashboard(dashboard);
    },
    async loadDashboards(): Promise<DashboardConfig[]> {
      return engine.loadDashboards();
    },
    async deleteDashboard(id: DashboardId): Promise<void> {
      return engine.deleteDashboard(id);
    },
    async saveKPI(kpi: KPIDefinition): Promise<void> {
      return engine.saveKPI(kpi);
    },
    async loadKPIs(): Promise<KPIDefinition[]> {
      return engine.loadKPIs();
    },
    async deleteKPI(id: KPIId): Promise<void> {
      return engine.deleteKPI(id);
    },
    async saveMetric(metric: MetricDef): Promise<void> {
      return engine.saveMetric(metric);
    },
    async loadMetrics(): Promise<MetricDef[]> {
      return engine.loadMetrics();
    },
    async deleteMetric(id: MetricId): Promise<void> {
      return engine.deleteMetric(id);
    },

    // --- AsyncDefinitionStore ---
    async save(def: GridDefinition): Promise<GridDefinition> {
      return definitions.save(def);
    },
    async load(id: DefinitionId): Promise<GridDefinition | undefined> {
      return definitions.load(id);
    },
    async list(): Promise<DefinitionMeta[]> {
      return definitions.list();
    },
    async delete(id: DefinitionId): Promise<boolean> {
      return definitions.delete(id);
    },
    async duplicate(id: DefinitionId, opts?: { name?: string }): Promise<GridDefinition | undefined> {
      return definitions.duplicate(id, opts);
    },

    // --- Placements ---
    async savePlacement(placement: PlacementRecord): Promise<PlacementRecord> {
      placements.set(placement.id as string, placement);
      return placement;
    },
    async loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]> {
      let results = Array.from(placements.values());
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
    },
    async deletePlacement(id: PlacementId): Promise<void> {
      placements.delete(id as string);
    },

    // --- Catalog ---
    async listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
      const artifacts: ArtifactMeta[] = [];

      for (const r of await engine.loadReports()) {
        artifacts.push({
          id: r.id as string,
          type: 'report',
          name: r.name,
          description: r.description,
          createdAt: 0,
          updatedAt: 0,
        });
      }

      for (const d of await engine.loadDashboards()) {
        artifacts.push({
          id: d.id as string,
          type: 'dashboard',
          name: d.name,
          description: d.description,
          createdAt: 0,
          updatedAt: 0,
        });
      }

      for (const k of await engine.loadKPIs()) {
        artifacts.push({
          id: k.id as string,
          type: 'kpi',
          name: k.name,
          description: k.description,
          createdAt: 0,
          updatedAt: 0,
        });
      }

      for (const m of await engine.loadMetrics()) {
        artifacts.push({
          id: m.id as string,
          type: 'metric',
          name: m.name,
          description: m.description,
          createdAt: 0,
          updatedAt: 0,
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
    },

    // --- Clear ---
    async clear(): Promise<void> {
      await engine.clear();
      await definitions.clear();
      placements.clear();
    },
  };
}
