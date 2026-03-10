import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import { createPlacement } from '../placement.js';
import { placementId } from '../types.js';
import type { PlacementRecord } from '../placement.js';
import { reportId, dashboardId, kpiId, metricId } from '@phozart/phz-engine';
import type { ReportConfig } from '@phozart/phz-engine';
import type { DashboardConfig } from '@phozart/phz-engine';
import type { KPIDefinition } from '@phozart/phz-engine';
import type { MetricDef } from '@phozart/phz-engine';
import { createDefinitionId } from '@phozart/phz-shared/definitions';
import type { GridDefinition } from '@phozart/phz-shared/definitions';

function makeReport(id: string, name: string): ReportConfig {
  return { id: reportId(id), name } as ReportConfig;
}

function makeDashboard(id: string, name: string): DashboardConfig {
  return { id: dashboardId(id), name } as DashboardConfig;
}

function makeKPI(id: string, name: string): KPIDefinition {
  return { id: kpiId(id), name } as KPIDefinition;
}

function makeMetric(id: string, name: string): MetricDef {
  return { id: metricId(id), name } as MetricDef;
}

function makeDefinition(name: string): GridDefinition {
  return {
    id: createDefinitionId(),
    name,
    schemaVersion: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: { type: 'local', data: [] },
    columns: [],
  } as GridDefinition;
}

describe('MemoryWorkspaceAdapter', () => {
  let adapter: MemoryWorkspaceAdapter;

  beforeEach(async () => {
    adapter = new MemoryWorkspaceAdapter();
    await adapter.initialize();
  });

  // --- EngineStorageAdapter ---

  describe('reports', () => {
    it('saves and loads reports', async () => {
      const r = makeReport('r1', 'Sales');
      await adapter.saveReport(r);
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Sales');
    });

    it('overwrites existing report with same id', async () => {
      await adapter.saveReport(makeReport('r1', 'V1'));
      await adapter.saveReport(makeReport('r1', 'V2'));
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('V2');
    });

    it('deletes a report', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.deleteReport(reportId('r1'));
      expect(await adapter.loadReports()).toHaveLength(0);
    });
  });

  describe('dashboards', () => {
    it('saves and loads dashboards', async () => {
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      const loaded = await adapter.loadDashboards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Exec');
    });

    it('deletes a dashboard', async () => {
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      await adapter.deleteDashboard(dashboardId('d1'));
      expect(await adapter.loadDashboards()).toHaveLength(0);
    });
  });

  describe('KPIs', () => {
    it('saves and loads KPIs', async () => {
      await adapter.saveKPI(makeKPI('k1', 'NPS'));
      const loaded = await adapter.loadKPIs();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('NPS');
    });

    it('deletes a KPI', async () => {
      await adapter.saveKPI(makeKPI('k1', 'NPS'));
      await adapter.deleteKPI(kpiId('k1'));
      expect(await adapter.loadKPIs()).toHaveLength(0);
    });
  });

  describe('metrics', () => {
    it('saves and loads metrics', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Revenue'));
      const loaded = await adapter.loadMetrics();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Revenue');
    });

    it('deletes a metric', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Revenue'));
      await adapter.deleteMetric(metricId('m1'));
      expect(await adapter.loadMetrics()).toHaveLength(0);
    });
  });

  // --- AsyncDefinitionStore ---

  describe('definitions', () => {
    it('saves and loads a definition', async () => {
      const def = makeDefinition('Grid A');
      const saved = await adapter.save(def);
      expect(saved.name).toBe('Grid A');
      const loaded = await adapter.load(def.id);
      expect(loaded?.name).toBe('Grid A');
    });

    it('lists definitions as DefinitionMeta', async () => {
      await adapter.save(makeDefinition('Grid A'));
      await adapter.save(makeDefinition('Grid B'));
      const list = await adapter.list();
      expect(list).toHaveLength(2);
      expect(list.map(m => m.name).sort()).toEqual(['Grid A', 'Grid B']);
    });

    it('deletes a definition', async () => {
      const def = makeDefinition('Grid A');
      await adapter.save(def);
      const deleted = await adapter.delete(def.id);
      expect(deleted).toBe(true);
      expect(await adapter.load(def.id)).toBeUndefined();
    });

    it('returns false when deleting non-existent definition', async () => {
      const deleted = await adapter.delete(createDefinitionId('nonexistent'));
      expect(deleted).toBe(false);
    });

    it('duplicates a definition', async () => {
      const def = makeDefinition('Original');
      await adapter.save(def);
      const copy = await adapter.duplicate(def.id, { name: 'Copy' });
      expect(copy).toBeDefined();
      expect(copy!.name).toBe('Copy');
      expect(copy!.id).not.toBe(def.id);
      expect(await adapter.list()).toHaveLength(2);
    });

    it('returns undefined when duplicating non-existent', async () => {
      const copy = await adapter.duplicate(createDefinitionId('nope'));
      expect(copy).toBeUndefined();
    });
  });

  // --- Placements ---

  describe('placements', () => {
    it('saves and loads placements', async () => {
      const p = createPlacement({
        artifactType: 'report',
        artifactId: 'r1',
        target: 'dashboard-main',
      });
      const saved = await adapter.savePlacement(p);
      expect(saved.id).toBe(p.id);

      const loaded = await adapter.loadPlacements();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].artifactId).toBe('r1');
    });

    it('filters placements by artifactType', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't1' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'dashboard', artifactId: 'd1', target: 't1' }));
      const reports = await adapter.loadPlacements({ artifactType: 'report' });
      expect(reports).toHaveLength(1);
      expect(reports[0].artifactType).toBe('report');
    });

    it('filters placements by target', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 'page-a' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r2', target: 'page-b' }));
      const loaded = await adapter.loadPlacements({ target: 'page-a' });
      expect(loaded).toHaveLength(1);
      expect(loaded[0].artifactId).toBe('r1');
    });

    it('filters placements by artifactId', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't1' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r2', target: 't1' }));
      const loaded = await adapter.loadPlacements({ artifactId: 'r1' });
      expect(loaded).toHaveLength(1);
    });

    it('deletes a placement', async () => {
      const p = createPlacement({ artifactType: 'kpi', artifactId: 'k1', target: 't1' });
      await adapter.savePlacement(p);
      await adapter.deletePlacement(p.id);
      expect(await adapter.loadPlacements()).toHaveLength(0);
    });
  });

  // --- listArtifacts ---

  describe('listArtifacts', () => {
    it('returns artifacts across all types', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales Report'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec Dashboard'));
      await adapter.saveKPI(makeKPI('k1', 'NPS'));
      await adapter.saveMetric(makeMetric('m1', 'Revenue'));
      await adapter.save(makeDefinition('Grid A'));

      const all = await adapter.listArtifacts();
      expect(all).toHaveLength(5);
    });

    it('filters by artifact type', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      const reports = await adapter.listArtifacts({ type: 'report' });
      expect(reports).toHaveLength(1);
      expect(reports[0].type).toBe('report');
    });

    it('filters by search string', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales Report'));
      await adapter.saveReport(makeReport('r2', 'HR Report'));
      const found = await adapter.listArtifacts({ search: 'sales' });
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe('Sales Report');
    });
  });

  // --- clear ---

  describe('clear', () => {
    it('clears all data', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      await adapter.saveKPI(makeKPI('k1', 'NPS'));
      await adapter.saveMetric(makeMetric('m1', 'Rev'));
      await adapter.save(makeDefinition('Grid'));
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't' }));

      await adapter.clear();

      expect(await adapter.loadReports()).toHaveLength(0);
      expect(await adapter.loadDashboards()).toHaveLength(0);
      expect(await adapter.loadKPIs()).toHaveLength(0);
      expect(await adapter.loadMetrics()).toHaveLength(0);
      expect(await adapter.list()).toHaveLength(0);
      expect(await adapter.loadPlacements()).toHaveLength(0);
    });
  });
});
