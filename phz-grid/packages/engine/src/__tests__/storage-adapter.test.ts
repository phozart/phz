/**
 * @phozart/engine — Storage Adapter Tests
 *
 * TDD: These tests define the EngineStorageAdapter interface contract,
 * MemoryStorageAdapter, LocalStorageAdapter, and BIEngine integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReportConfig } from '../report.js';
import type { DashboardConfig } from '../dashboard.js';
import type { KPIDefinition } from '../kpi.js';
import type { MetricDef } from '../metric.js';
import { reportId, dashboardId, dataProductId } from '../types.js';
import { kpiId } from '../types.js';
import { metricId } from '../types.js';
import type { EngineStorageAdapter } from '../storage-adapter.js';
import { MemoryStorageAdapter, LocalStorageAdapter } from '../storage-adapter.js';
import { createBIEngine } from '../engine.js';

// --- Test Fixtures ---

function makeReport(id: string, name: string): ReportConfig {
  return {
    id: reportId(id),
    name,
    dataProductId: dataProductId('dp-1'),
    columns: [{ field: 'col1' }],
    created: 1000,
    updated: 1000,
  };
}

function makeDashboard(id: string, name: string): DashboardConfig {
  return {
    id: dashboardId(id),
    name,
    layout: { columns: 12, rowHeight: 100, gap: 8 },
    widgets: [],
    created: 1000,
    updated: 1000,
  };
}

function makeKPI(id: string, name: string): KPIDefinition {
  return {
    id: kpiId(id),
    name,
    target: 90,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 70 },
    deltaComparison: 'previous_period',
    dimensions: [],
    dataSource: { scoreEndpoint: '/api/kpi' },
  };
}

function makeMetric(id: string, name: string): MetricDef {
  return {
    id: metricId(id),
    name,
    dataProductId: dataProductId('dp-1'),
    formula: { type: 'simple', field: 'amount', aggregation: 'sum' },
  };
}

// --- EngineStorageAdapter Interface ---

describe('EngineStorageAdapter interface', () => {
  describe('MemoryStorageAdapter', () => {
    let adapter: EngineStorageAdapter;

    beforeEach(() => {
      adapter = new MemoryStorageAdapter();
    });

    // --- Reports ---

    it('saveReport and loadReports round-trip', async () => {
      const report = makeReport('r1', 'Sales Report');
      await adapter.saveReport(report);
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('r1');
      expect(loaded[0].name).toBe('Sales Report');
    });

    it('saveReport overwrites existing report with same id', async () => {
      await adapter.saveReport(makeReport('r1', 'V1'));
      await adapter.saveReport(makeReport('r1', 'V2'));
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('V2');
    });

    it('deleteReport removes a report', async () => {
      await adapter.saveReport(makeReport('r1', 'Sales'));
      await adapter.deleteReport(reportId('r1'));
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(0);
    });

    // --- Dashboards ---

    it('saveDashboard and loadDashboards round-trip', async () => {
      const dash = makeDashboard('d1', 'Main Dashboard');
      await adapter.saveDashboard(dash);
      const loaded = await adapter.loadDashboards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Main Dashboard');
    });

    it('deleteDashboard removes a dashboard', async () => {
      await adapter.saveDashboard(makeDashboard('d1', 'Dash'));
      await adapter.deleteDashboard(dashboardId('d1'));
      const loaded = await adapter.loadDashboards();
      expect(loaded).toHaveLength(0);
    });

    // --- KPIs ---

    it('saveKPI and loadKPIs round-trip', async () => {
      await adapter.saveKPI(makeKPI('k1', 'Revenue KPI'));
      const loaded = await adapter.loadKPIs();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Revenue KPI');
    });

    it('deleteKPI removes a KPI', async () => {
      await adapter.saveKPI(makeKPI('k1', 'KPI'));
      await adapter.deleteKPI(kpiId('k1'));
      const loaded = await adapter.loadKPIs();
      expect(loaded).toHaveLength(0);
    });

    // --- Metrics ---

    it('saveMetric and loadMetrics round-trip', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Total Sales'));
      const loaded = await adapter.loadMetrics();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Total Sales');
    });

    it('deleteMetric removes a metric', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Metric'));
      await adapter.deleteMetric(metricId('m1'));
      const loaded = await adapter.loadMetrics();
      expect(loaded).toHaveLength(0);
    });

    // --- Clear ---

    it('clear removes all data', async () => {
      await adapter.saveReport(makeReport('r1', 'R'));
      await adapter.saveDashboard(makeDashboard('d1', 'D'));
      await adapter.saveKPI(makeKPI('k1', 'K'));
      await adapter.saveMetric(makeMetric('m1', 'M'));
      await adapter.clear();
      expect(await adapter.loadReports()).toHaveLength(0);
      expect(await adapter.loadDashboards()).toHaveLength(0);
      expect(await adapter.loadKPIs()).toHaveLength(0);
      expect(await adapter.loadMetrics()).toHaveLength(0);
    });
  });

  describe('LocalStorageAdapter', () => {
    let storage: Record<string, string>;
    let adapter: EngineStorageAdapter;

    beforeEach(() => {
      storage = {};
      const mockStorage = {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
        removeItem: vi.fn((key: string) => { delete storage[key]; }),
      };
      adapter = new LocalStorageAdapter(mockStorage as unknown as Storage, 'test-engine');
    });

    it('saveReport persists to localStorage as JSON', async () => {
      await adapter.saveReport(makeReport('r1', 'Report 1'));
      const raw = storage['test-engine:reports'];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Report 1');
    });

    it('loadReports returns empty array when no data stored', async () => {
      const loaded = await adapter.loadReports();
      expect(loaded).toEqual([]);
    });

    it('round-trips reports through JSON serialization', async () => {
      const report = makeReport('r1', 'Test');
      await adapter.saveReport(report);
      const loaded = await adapter.loadReports();
      expect(loaded[0].id).toBe('r1');
    });

    it('saveDashboard and loadDashboards work correctly', async () => {
      await adapter.saveDashboard(makeDashboard('d1', 'Dash'));
      const loaded = await adapter.loadDashboards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Dash');
    });

    it('saveKPI and loadKPIs work correctly', async () => {
      await adapter.saveKPI(makeKPI('k1', 'KPI'));
      const loaded = await adapter.loadKPIs();
      expect(loaded).toHaveLength(1);
    });

    it('saveMetric and loadMetrics work correctly', async () => {
      await adapter.saveMetric(makeMetric('m1', 'Metric'));
      const loaded = await adapter.loadMetrics();
      expect(loaded).toHaveLength(1);
    });

    it('deleteReport removes from storage', async () => {
      await adapter.saveReport(makeReport('r1', 'R1'));
      await adapter.saveReport(makeReport('r2', 'R2'));
      await adapter.deleteReport(reportId('r1'));
      const loaded = await adapter.loadReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('r2');
    });

    it('clear removes all keys', async () => {
      await adapter.saveReport(makeReport('r1', 'R'));
      await adapter.saveDashboard(makeDashboard('d1', 'D'));
      await adapter.clear();
      expect(await adapter.loadReports()).toHaveLength(0);
      expect(await adapter.loadDashboards()).toHaveLength(0);
    });

    it('handles corrupted JSON gracefully', async () => {
      storage['test-engine:reports'] = 'not-valid-json';
      const loaded = await adapter.loadReports();
      expect(loaded).toEqual([]);
    });

    it('uses namespace prefix for all keys', async () => {
      await adapter.saveReport(makeReport('r1', 'R'));
      await adapter.saveKPI(makeKPI('k1', 'K'));
      expect(Object.keys(storage).every(k => k.startsWith('test-engine:'))).toBe(true);
    });
  });
});

// --- BIEngine Integration ---

describe('BIEngine storage adapter integration', () => {
  it('accepts storageAdapter in BIEngineConfig', () => {
    const adapter = new MemoryStorageAdapter();
    const engine = createBIEngine({ storageAdapter: adapter });
    expect(engine).toBeDefined();
  });

  it('loadAll hydrates engine registries from storage', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.saveReport(makeReport('r1', 'Saved Report'));
    await adapter.saveDashboard(makeDashboard('d1', 'Saved Dash'));
    await adapter.saveKPI(makeKPI('k1', 'Saved KPI'));
    await adapter.saveMetric(makeMetric('m1', 'Saved Metric'));

    const engine = createBIEngine({ storageAdapter: adapter });
    await engine.loadAll();

    expect(engine.reports.list()).toHaveLength(1);
    expect(engine.reports.get(reportId('r1'))?.name).toBe('Saved Report');
    expect(engine.dashboards.list()).toHaveLength(1);
    expect(engine.kpis.list()).toHaveLength(1);
    expect(engine.metrics.list()).toHaveLength(1);
  });

  it('saveAll persists current engine state to storage', async () => {
    const adapter = new MemoryStorageAdapter();
    const engine = createBIEngine({ storageAdapter: adapter });

    engine.reports.save(makeReport('r1', 'New Report'));
    engine.dashboards.save(makeDashboard('d1', 'New Dash'));
    engine.kpis.register(makeKPI('k1', 'New KPI'));
    engine.metrics.register(makeMetric('m1', 'New Metric'));

    await engine.saveAll();

    const reports = await adapter.loadReports();
    expect(reports).toHaveLength(1);
    expect(reports[0].name).toBe('New Report');

    const dashboards = await adapter.loadDashboards();
    expect(dashboards).toHaveLength(1);

    const kpis = await adapter.loadKPIs();
    expect(kpis).toHaveLength(1);

    const metrics = await adapter.loadMetrics();
    expect(metrics).toHaveLength(1);
  });

  it('loadAll with no adapter is a no-op', async () => {
    const engine = createBIEngine();
    await engine.loadAll(); // should not throw
    expect(engine.reports.list()).toHaveLength(0);
  });

  it('saveAll with no adapter is a no-op', async () => {
    const engine = createBIEngine();
    engine.reports.save(makeReport('r1', 'R'));
    await engine.saveAll(); // should not throw
  });

  it('initial data and storage data merge on loadAll', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.saveReport(makeReport('r-stored', 'Stored'));

    const engine = createBIEngine({
      storageAdapter: adapter,
      initialReports: [makeReport('r-initial', 'Initial')],
    });

    await engine.loadAll();

    // Both should be present
    expect(engine.reports.list()).toHaveLength(2);
    expect(engine.reports.get(reportId('r-stored'))).toBeDefined();
    expect(engine.reports.get(reportId('r-initial'))).toBeDefined();
  });
});
