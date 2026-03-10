/**
 * Save Adapter Wiring (L.4) — Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { saveToAdapter } from '../shell/save-adapter-wiring.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { ArtifactType } from '../types.js';

function makeMockAdapter(): WorkspaceAdapter {
  return {
    saveReport: vi.fn().mockResolvedValue(undefined),
    saveDashboard: vi.fn().mockResolvedValue(undefined),
    saveKPI: vi.fn().mockResolvedValue(undefined),
    saveMetric: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue({}),
    saveAlertRule: vi.fn().mockResolvedValue(undefined),
    // Stubs for remaining adapter methods (not under test)
    loadReports: vi.fn(),
    deleteReport: vi.fn(),
    loadDashboards: vi.fn(),
    deleteDashboard: vi.fn(),
    loadKPIs: vi.fn(),
    deleteKPI: vi.fn(),
    loadMetrics: vi.fn(),
    deleteMetric: vi.fn(),
    clear: vi.fn(),
    load: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
    savePlacement: vi.fn(),
    loadPlacements: vi.fn(),
    deletePlacement: vi.fn(),
    listArtifacts: vi.fn(),
    initialize: vi.fn(),
  } as unknown as WorkspaceAdapter;
}

describe('saveToAdapter (L.4)', () => {
  it('routes "report" to saveReport', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'r1', name: 'Sales' };
    await saveToAdapter(adapter, 'report', artifact);
    expect(adapter.saveReport).toHaveBeenCalledWith(artifact);
  });

  it('routes "dashboard" to saveDashboard', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'd1', name: 'Exec' };
    await saveToAdapter(adapter, 'dashboard', artifact);
    expect(adapter.saveDashboard).toHaveBeenCalledWith(artifact);
  });

  it('routes "kpi" to saveKPI', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'k1' };
    await saveToAdapter(adapter, 'kpi', artifact);
    expect(adapter.saveKPI).toHaveBeenCalledWith(artifact);
  });

  it('routes "metric" to saveMetric', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'm1' };
    await saveToAdapter(adapter, 'metric', artifact);
    expect(adapter.saveMetric).toHaveBeenCalledWith(artifact);
  });

  it('routes "grid-definition" to save (definition store)', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'gd1' };
    await saveToAdapter(adapter, 'grid-definition', artifact);
    expect(adapter.save).toHaveBeenCalledWith(artifact);
  });

  it('routes "filter-preset" to save (definition store fallback)', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'fp1' };
    await saveToAdapter(adapter, 'filter-preset', artifact);
    // filter-preset uses the generic save method
    expect(adapter.save).toHaveBeenCalledWith(artifact);
  });

  it('routes "alert-rule" to saveAlertRule when available', async () => {
    const adapter = makeMockAdapter();
    const artifact = { id: 'ar1' };
    await saveToAdapter(adapter, 'alert-rule', artifact);
    expect(adapter.saveAlertRule).toHaveBeenCalledWith(artifact);
  });

  it('throws for "alert-rule" if saveAlertRule not supported', async () => {
    const adapter = makeMockAdapter();
    delete (adapter as any).saveAlertRule;
    await expect(
      saveToAdapter(adapter, 'alert-rule', { id: 'ar1' }),
    ).rejects.toThrow();
  });

  it('throws for unknown artifact type', async () => {
    const adapter = makeMockAdapter();
    await expect(
      saveToAdapter(adapter, 'unknown-type' as ArtifactType, {}),
    ).rejects.toThrow();
  });
});
