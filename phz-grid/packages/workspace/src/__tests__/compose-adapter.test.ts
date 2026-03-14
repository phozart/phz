import { describe, it, expect, vi } from 'vitest';
import { composeWorkspaceAdapter } from '../adapters/compose.js';
import { MemoryStorageAdapter } from '@phozart/engine';
import { createPlacement } from '../placement.js';

describe('composeWorkspaceAdapter', () => {
  it('delegates engine methods to provided storage adapter', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveReport({ id: 'r1', name: 'Test' } as any);
    const reports = await adapter.loadReports();
    expect(reports).toHaveLength(1);
    expect(reports[0].name).toBe('Test');
  });

  it('delegates dashboard methods to engine adapter', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveDashboard({ id: 'd1', name: 'Exec' } as any);
    const dashboards = await adapter.loadDashboards();
    expect(dashboards).toHaveLength(1);
  });

  it('delegates KPI methods to engine adapter', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveKPI({ id: 'k1', name: 'NPS' } as any);
    const kpis = await adapter.loadKPIs();
    expect(kpis).toHaveLength(1);
  });

  it('delegates metric methods to engine adapter', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveMetric({ id: 'm1', name: 'Revenue' } as any);
    const metrics = await adapter.loadMetrics();
    expect(metrics).toHaveLength(1);
  });

  it('provides placement methods via in-memory default', async () => {
    const adapter = composeWorkspaceAdapter({});
    await adapter.initialize();
    const p = createPlacement({
      artifactType: 'report',
      artifactId: 'r1',
      target: 'home',
    });
    const saved = await adapter.savePlacement(p);
    expect(saved.id).toBe(p.id);
    const loaded = await adapter.loadPlacements();
    expect(loaded).toHaveLength(1);
  });

  it('filters placements', async () => {
    const adapter = composeWorkspaceAdapter({});
    await adapter.initialize();
    await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't1' }));
    await adapter.savePlacement(createPlacement({ artifactType: 'dashboard', artifactId: 'd1', target: 't1' }));
    const reports = await adapter.loadPlacements({ artifactType: 'report' });
    expect(reports).toHaveLength(1);
  });

  it('deletes placements', async () => {
    const adapter = composeWorkspaceAdapter({});
    await adapter.initialize();
    const p = createPlacement({ artifactType: 'kpi', artifactId: 'k1', target: 't1' });
    await adapter.savePlacement(p);
    await adapter.deletePlacement(p.id);
    expect(await adapter.loadPlacements()).toHaveLength(0);
  });

  it('provides default in-memory engine when none supplied', async () => {
    const adapter = composeWorkspaceAdapter({});
    await adapter.saveReport({ id: 'r1', name: 'Test' } as any);
    const reports = await adapter.loadReports();
    expect(reports).toHaveLength(1);
  });

  it('clear() clears all stores', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveReport({ id: 'r1', name: 'Test' } as any);
    await adapter.savePlacement(createPlacement({ artifactType: 'report', artifactId: 'r1', target: 't1' }));
    await adapter.clear();
    expect(await adapter.loadReports()).toHaveLength(0);
    expect(await adapter.loadPlacements()).toHaveLength(0);
  });

  it('listArtifacts aggregates from engine', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveReport({ id: 'r1', name: 'Sales' } as any);
    await adapter.saveDashboard({ id: 'd1', name: 'Exec' } as any);
    const all = await adapter.listArtifacts();
    expect(all).toHaveLength(2);
  });

  it('listArtifacts filters by type', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveReport({ id: 'r1', name: 'Sales' } as any);
    await adapter.saveDashboard({ id: 'd1', name: 'Exec' } as any);
    const reports = await adapter.listArtifacts({ type: 'report' });
    expect(reports).toHaveLength(1);
    expect(reports[0].type).toBe('report');
  });

  it('listArtifacts filters by search', async () => {
    const engine = new MemoryStorageAdapter();
    const adapter = composeWorkspaceAdapter({ engine });
    await adapter.saveReport({ id: 'r1', name: 'Sales Report' } as any);
    await adapter.saveReport({ id: 'r2', name: 'HR Report' } as any);
    const found = await adapter.listArtifacts({ search: 'sales' });
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('Sales Report');
  });

  it('definition methods delegate to provided store', async () => {
    const mockStore = {
      save: vi.fn(async (def: any) => def),
      load: vi.fn(async () => undefined),
      list: vi.fn(async () => []),
      delete: vi.fn(async () => true),
      duplicate: vi.fn(async () => undefined),
      clear: vi.fn(async () => {}),
    };
    const adapter = composeWorkspaceAdapter({ definitions: mockStore });
    const def = { id: 'def1', name: 'Grid' } as any;
    await adapter.save(def);
    expect(mockStore.save).toHaveBeenCalledWith(def);
  });
});
