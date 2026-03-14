import { describe, it, expect } from 'vitest';
import { createBIEngine } from '../engine.js';
import { dataProductId, kpiId, metricId, reportId, dashboardId, widgetId, reportArtefactId, dashboardArtefactId, widgetArtefactId, parseArtefactId } from '../types.js';
import { artefactId, filterDefinitionId } from '@phozart/core';
import type { KPIDefinition } from '../kpi.js';
import type { DataProductDef } from '../data-product.js';

function makeSalesProduct(): DataProductDef {
  return {
    id: dataProductId('sales'),
    name: 'Sales Data',
    schema: {
      fields: [
        { name: 'region', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'product', type: 'string' },
      ],
    },
  };
}

function makeAttendanceKPI(): KPIDefinition {
  return {
    id: kpiId('attendance'),
    name: 'Attendance Rate',
    target: 95,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 75 },
    deltaComparison: 'previous_period',
    dimensions: ['region'],
    dataSource: { scoreEndpoint: '/api/kpi/attendance' },
  };
}

describe('BIEngine — integration', () => {
  it('creates engine with initial data', () => {
    const engine = createBIEngine({
      initialDataProducts: [makeSalesProduct()],
      initialKPIs: [makeAttendanceKPI()],
    });

    expect(engine.dataProducts.list()).toHaveLength(1);
    expect(engine.kpis.list()).toHaveLength(1);
  });

  it('registers data product → creates KPI → computes status', () => {
    const engine = createBIEngine();
    engine.dataProducts.register(makeSalesProduct());
    engine.kpis.register(makeAttendanceKPI());

    const kpi = engine.kpis.get(kpiId('attendance'))!;
    const status = engine.status.compute(92, kpi);
    expect(status.level).toBe('ok');

    const delta = engine.status.computeDelta(92, 88, kpi);
    expect(delta.direction).toBe('improving');
  });

  it('classifies a full KPI score', () => {
    const engine = createBIEngine({ initialKPIs: [makeAttendanceKPI()] });
    const kpi = engine.kpis.get(kpiId('attendance'))!;
    const classified = engine.status.classify(
      { kpiId: kpiId('attendance'), value: 80, previousValue: 85 },
      kpi,
    );
    expect(classified.status.level).toBe('warn');
    expect(classified.delta?.direction).toBe('declining');
  });

  it('aggregates data', () => {
    const engine = createBIEngine();
    const rows = [
      { amount: 100 },
      { amount: 200 },
      { amount: 300 },
    ];
    const result = engine.aggregate(rows, {
      fields: [{ field: 'amount', functions: ['sum', 'avg'] }],
    });
    expect(result.fieldResults.amount.sum).toBe(600);
    expect(result.fieldResults.amount.avg).toBe(200);
  });

  it('computes pivot', () => {
    const engine = createBIEngine();
    const rows = [
      { region: 'North', product: 'A', sales: 100 },
      { region: 'South', product: 'A', sales: 200 },
      { region: 'North', product: 'B', sales: 150 },
    ];
    const result = engine.pivot(rows, {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'sales', aggregation: 'sum' }],
    });
    expect(result.rowHeaders).toHaveLength(2);
    expect(result.columnHeaders).toHaveLength(2);
  });

  it('projects chart data', () => {
    const engine = createBIEngine();
    const rows = [
      { month: 'Jan', sales: 100 },
      { month: 'Feb', sales: 200 },
    ];
    const series = engine.projectChart(rows, {
      id: 'c1',
      type: 'line',
      options: {
        xAxis: { field: 'month' },
        series: [{ field: 'sales' }],
      },
    });
    expect(series).toHaveLength(1);
    expect(series[0].data).toHaveLength(2);
  });

  it('resolves drill-through', () => {
    const engine = createBIEngine();
    const action = engine.resolveDrill({
      source: { type: 'pivot', rowValues: { region: 'North' }, columnValues: { product: 'A' } },
      targetReportId: reportId('detail'),
      openIn: 'modal',
    });
    expect(action.targetReportId).toBe('detail');
    expect(action.filters.region).toBe('North');
    expect(action.openIn).toBe('modal');
  });

  it('merges report configs across layers', () => {
    const engine = createBIEngine();
    const merged = engine.mergeReportConfigs([
      {
        layer: 'system',
        config: {
          id: reportId('r1'),
          name: 'System Report',
          dataProductId: dataProductId('sales'),
          columns: [{ field: 'region' }],
          pageSize: 25,
          created: 0,
          updated: 0,
        },
      },
      {
        layer: 'user',
        config: { pageSize: 100 } as any,
      },
    ]);
    expect(merged.pageSize).toBe(100);
    expect(merged.name).toBe('System Report');
  });

  it('destroy is safe to call', () => {
    const engine = createBIEngine();
    expect(() => engine.destroy()).not.toThrow();
  });

  it('destroy clears all registries and stores', () => {
    const engine = createBIEngine({
      initialDataProducts: [makeSalesProduct()],
      initialKPIs: [makeAttendanceKPI()],
      initialMetrics: [{
        id: metricId('m1'),
        name: 'M1',
        dataProductId: dataProductId('sales'),
        formula: { type: 'simple', field: 'amount', aggregation: 'sum' },
      }],
      initialReports: [{
        id: reportId('r1'),
        name: 'R1',
        dataProductId: dataProductId('sales'),
        columns: [],
        created: 0,
        updated: 0,
      }],
      initialDashboards: [{
        id: dashboardId('d1'),
        name: 'D1',
        layout: { columns: 12, rowHeight: 80, gap: 16 },
        widgets: [],
        created: 0,
        updated: 0,
      }],
    });

    // Verify data exists before destroy
    expect(engine.dataProducts.list()).toHaveLength(1);
    expect(engine.kpis.list()).toHaveLength(1);
    expect(engine.metrics.list()).toHaveLength(1);
    expect(engine.reports.list()).toHaveLength(1);
    expect(engine.dashboards.list()).toHaveLength(1);

    engine.destroy();

    // All stores should be empty after destroy
    expect(engine.dataProducts.list()).toHaveLength(0);
    expect(engine.kpis.list()).toHaveLength(0);
    expect(engine.metrics.list()).toHaveLength(0);
    expect(engine.reports.list()).toHaveLength(0);
    expect(engine.dashboards.list()).toHaveLength(0);
  });

  it('destroy is idempotent — safe to call twice', () => {
    const engine = createBIEngine({
      initialDataProducts: [makeSalesProduct()],
    });
    engine.destroy();
    expect(() => engine.destroy()).not.toThrow();
    expect(engine.dataProducts.list()).toHaveLength(0);
  });

  it('exposes criteria engine on BIEngine', () => {
    const engine = createBIEngine();
    expect(engine.criteria).toBeDefined();
    expect(engine.criteria.registry).toBeDefined();
    expect(engine.criteria.bindings).toBeDefined();
    expect(engine.criteria.stateManager).toBeDefined();
  });

  it('getReportFilters auto-hydrates inline criteria config', () => {
    const engine = createBIEngine({
      initialDataProducts: [makeSalesProduct()],
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      criteriaConfig: {
        fields: [
          {
            id: 'region',
            label: 'Region',
            type: 'multi_select',
            dataField: 'region',
            options: [
              { value: 'EMEA', label: 'EMEA' },
              { value: 'NA', label: 'NA' },
            ],
          },
        ],
      },
      created: Date.now(),
      updated: Date.now(),
    });

    const result = engine.getReportFilters(reportId('r1'));
    expect(result.source).toBe('hydrated');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('region');
  });

  it('getDashboardFilters auto-hydrates inline criteria config', () => {
    const engine = createBIEngine();
    engine.dashboards.save({
      id: dashboardId('d1'),
      name: 'Test Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      criteriaConfig: {
        fields: [
          { id: 'period', label: 'Period', type: 'date_range' },
        ],
      },
      created: Date.now(),
      updated: Date.now(),
    });

    const result = engine.getDashboardFilters(dashboardId('d1'));
    expect(result.source).toBe('hydrated');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('period');
  });
});

describe('ArtefactId type bridge', () => {
  it('reportArtefactId produces parseable ArtefactId', () => {
    const artId = reportArtefactId(reportId('sales-q4'));
    const parsed = parseArtefactId(artId);
    expect(parsed.type).toBe('report');
    expect(parsed.rawId).toBe('sales-q4');
  });

  it('dashboardArtefactId produces parseable ArtefactId', () => {
    const artId = dashboardArtefactId(dashboardId('main-dash'));
    const parsed = parseArtefactId(artId);
    expect(parsed.type).toBe('dashboard');
    expect(parsed.rawId).toBe('main-dash');
  });

  it('widgetArtefactId produces parseable ArtefactId', () => {
    const artId = widgetArtefactId(widgetId('kpi-card-1'));
    const parsed = parseArtefactId(artId);
    expect(parsed.type).toBe('widget');
    expect(parsed.rawId).toBe('kpi-card-1');
  });

  it('parseArtefactId returns unknown for untyped artefact IDs', () => {
    const artId = artefactId('no-prefix-here');
    const parsed = parseArtefactId(artId);
    expect(parsed.type).toBe('unknown');
    expect(parsed.rawId).toBe('no-prefix-here');
  });

  it('filter bindings round-trip through ArtefactId bridge', () => {
    const engine = createBIEngine();

    // Register a filter definition
    engine.criteria.registry.register({
      id: filterDefinitionId('status'),
      label: 'Status',
      type: 'single_select',
      sessionBehavior: 'reset',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Bind using the type bridge
    const artId = dashboardArtefactId(dashboardId('dash-1'));
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    // Look up using the same bridge — should find the binding
    const bindings = engine.criteria.bindings.getBindingsForArtefact(artId);
    expect(bindings).toHaveLength(1);
    expect(bindings[0].filterDefinitionId).toBe('status');

    // Verify the artefact ID is consistent
    const sameArtId = dashboardArtefactId(dashboardId('dash-1'));
    expect(sameArtId).toBe(artId);

    // Parse and verify
    const parsed = parseArtefactId(artId);
    expect(parsed.type).toBe('dashboard');
    expect(parsed.rawId).toBe('dash-1');
  });
});
