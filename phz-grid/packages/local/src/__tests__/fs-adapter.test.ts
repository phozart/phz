import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FsWorkspaceAdapter } from '../adapters/fs-workspace-adapter.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { reportId, dashboardId, kpiId, metricId } from '@phozart/phz-engine';
import type { ReportConfig, DashboardConfig, KPIDefinition, MetricDef } from '@phozart/phz-engine';
import { createDefinitionId } from '@phozart/phz-shared/definitions';
import type { GridDefinition } from '@phozart/phz-shared/definitions';
import { createPlacement } from '@phozart/phz-workspace';

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

describe('FsWorkspaceAdapter', () => {
  let adapter: FsWorkspaceAdapter;
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'phz-test-'));
    adapter = new FsWorkspaceAdapter(testDir);
    await adapter.initialize();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // --- Reports ---

  describe('reports', () => {
    it('saves and loads reports', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Sales');
    });

    it('overwrites existing report', async () => {
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

  // --- Dashboards ---

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

  // --- KPIs ---

  describe('KPIs', () => {
    it('saves and loads KPIs', async () => {
      await adapter.saveKPI(makeKPI('k1', 'NPS'));
      const loaded = await adapter.loadKPIs();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('NPS');
    });
  });

  // --- Metrics ---

  describe('metrics', () => {
    it('saves and loads metrics', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Revenue'));
      const loaded = await adapter.loadMetrics();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Revenue');
    });
  });

  // --- Definitions ---

  describe('definitions', () => {
    it('saves and loads a definition', async () => {
      const def = makeDefinition('Grid A');
      const saved = await adapter.save(def);
      expect(saved.name).toBe('Grid A');
      const loaded = await adapter.load(def.id);
      expect(loaded?.name).toBe('Grid A');
    });

    it('lists definitions', async () => {
      await adapter.save(makeDefinition('Grid A'));
      await adapter.save(makeDefinition('Grid B'));
      const list = await adapter.list();
      expect(list).toHaveLength(2);
    });

    it('deletes a definition', async () => {
      const def = makeDefinition('Grid A');
      await adapter.save(def);
      expect(await adapter.delete(def.id)).toBe(true);
      expect(await adapter.load(def.id)).toBeUndefined();
    });

    it('returns false when deleting non-existent definition', async () => {
      expect(await adapter.delete(createDefinitionId('nope'))).toBe(false);
    });

    it('duplicates a definition', async () => {
      const def = makeDefinition('Original');
      await adapter.save(def);
      const copy = await adapter.duplicate(def.id, { name: 'Copy' });
      expect(copy).toBeDefined();
      expect(copy!.name).toBe('Copy');
      expect(copy!.id).not.toBe(def.id);
    });
  });

  // --- Placements ---

  describe('placements', () => {
    it('saves and loads placements', async () => {
      const p = createPlacement({
        artifactType: 'report',
        artifactId: 'r1',
        target: 'main',
      });
      await adapter.savePlacement(p);
      const loaded = await adapter.loadPlacements();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].artifactId).toBe('r1');
    });

    it('filters placements', async () => {
      await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't1' }));
      await adapter.savePlacement(createPlacement({ artifactType: 'dashboard', artifactId: 'd1', target: 't1' }));
      const reports = await adapter.loadPlacements({ artifactType: 'report' });
      expect(reports).toHaveLength(1);
    });
  });

  // --- listArtifacts ---

  describe('listArtifacts', () => {
    it('returns artifacts across all types', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      await adapter.saveKPI(makeKPI('k1', 'NPS'));

      const all = await adapter.listArtifacts();
      expect(all).toHaveLength(3);
    });

    it('filters by type', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      const reports = await adapter.listArtifacts({ type: 'report' });
      expect(reports).toHaveLength(1);
    });

    it('filters by search', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales Report'));
      await adapter.saveReport(makeReport('r2', 'HR Report'));
      const found = await adapter.listArtifacts({ search: 'sales' });
      expect(found).toHaveLength(1);
    });
  });

  // --- Artifact History ---

  describe('artifact history', () => {
    it('records versions on save', async () => {
      await adapter.saveReport(makeReport('r1', 'V1'));
      await adapter.saveReport(makeReport('r1', 'V2'));

      const history = await adapter.getArtifactHistory('r1');
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(2); // Most recent first
    });

    it('retrieves a specific version', async () => {
      await adapter.saveReport(makeReport('r1', 'V1'));
      await adapter.saveReport(makeReport('r1', 'V2'));

      const v1 = await adapter.getArtifactVersion('r1', 1) as any;
      expect(v1.name).toBe('V1');
    });

    it('limits history results', async () => {
      await adapter.saveReport(makeReport('r1', 'V1'));
      await adapter.saveReport(makeReport('r1', 'V2'));
      await adapter.saveReport(makeReport('r1', 'V3'));

      const history = await adapter.getArtifactHistory('r1', { limit: 2 });
      expect(history).toHaveLength(2);
    });
  });

  // --- Clear ---

  describe('clear', () => {
    it('removes all artifacts', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.saveDashboard(makeDashboard('d1', 'Exec'));
      await adapter.save(makeDefinition('Grid'));

      await adapter.clear();

      expect(await adapter.loadReports()).toHaveLength(0);
      expect(await adapter.loadDashboards()).toHaveLength(0);
      expect(await adapter.list()).toHaveLength(0);
    });
  });
});
