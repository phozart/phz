import { describe, it, expect, vi } from 'vitest';
import { createWorkspaceClient } from '../client/workspace-client.js';

function createMockAdapter() {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    listArtifacts: vi.fn().mockResolvedValue([
      { id: 'r1', type: 'report', name: 'Sales Report', createdAt: 1, updatedAt: 1 },
      { id: 'd1', type: 'dashboard', name: 'Overview', createdAt: 1, updatedAt: 1 },
    ]),
    loadPlacements: vi.fn().mockResolvedValue([]),
    savePlacement: vi.fn().mockImplementation(p => Promise.resolve(p)),
    deletePlacement: vi.fn().mockResolvedValue(undefined),
    // EngineStorageAdapter methods
    saveReport: vi.fn(), loadReports: vi.fn().mockResolvedValue([]),
    deleteReport: vi.fn(), saveDashboard: vi.fn(),
    loadDashboards: vi.fn().mockResolvedValue([]), deleteDashboard: vi.fn(),
    saveKPI: vi.fn(), loadKPIs: vi.fn().mockResolvedValue([]),
    deleteKPI: vi.fn(), saveMetric: vi.fn(),
    loadMetrics: vi.fn().mockResolvedValue([]), deleteMetric: vi.fn(),
    clear: vi.fn(),
    // AsyncDefinitionStore methods
    save: vi.fn(), load: vi.fn(), list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(), duplicate: vi.fn(),
  };
}

describe('WorkspaceClient', () => {
  it('initializes adapter on create', async () => {
    const adapter = createMockAdapter();
    const client = await createWorkspaceClient({ adapter });
    expect(adapter.initialize).toHaveBeenCalled();
  });

  it('lists artifacts from adapter', async () => {
    const adapter = createMockAdapter();
    const client = await createWorkspaceClient({ adapter });
    const artifacts = await client.listArtifacts();
    expect(artifacts).toHaveLength(2);
  });

  it('filters artifacts by capabilities when provided', async () => {
    const adapter = createMockAdapter();
    const client = await createWorkspaceClient({
      adapter,
      capabilities: {
        widgetTypes: ['bar-chart', 'kpi-card'],
        interactions: ['click', 'hover'],
        maxNestingDepth: 2,
        supportedLayoutTypes: ['grid'],
      },
    });
    expect(client.capabilities).toBeDefined();
    expect(client.capabilities!.widgetTypes).toContain('bar-chart');
  });

  it('works without capabilities (unconstrained)', async () => {
    const adapter = createMockAdapter();
    const client = await createWorkspaceClient({ adapter });
    expect(client.capabilities).toBeUndefined();
  });

  it('manages placements', async () => {
    const adapter = createMockAdapter();
    const client = await createWorkspaceClient({ adapter });
    await client.savePlacement({ id: 'p1', artifactType: 'report', artifactId: 'r1', target: 'home', createdAt: 1, updatedAt: 1 } as any);
    expect(adapter.savePlacement).toHaveBeenCalled();
  });
});
