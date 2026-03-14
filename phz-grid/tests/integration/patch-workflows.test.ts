/**
 * Patch Workflow Integration Tests
 *
 * Verifies the 4 composition tiers work end-to-end through compiled dist/ output.
 * These test the signal path, not individual functions.
 *
 * Patch 1: "Bass Line" — Grid only (core)
 * Patch 2: "Full Lead" — Grid + Analytics (core + engine)
 * Patch 3: "Cosmic Exploration" — Grid + DuckDB (skipped: requires WASM runtime)
 * Patch 4: "Full Orchestra" — Viewer + Editor state machines
 *
 * Key API behavior (compiled dist/):
 * - getData() returns RAW data (insertion order, no pipeline)
 * - getFilteredRowModel().rows returns filtered data
 * - getSortedRowModel().rows returns sorted data
 * - getFlattenedRowModel().rows returns full pipeline output
 * - filter() is deprecated; use addFilter()
 * - computeGroupAggregations() takes RowGroup[], not raw data
 */
import { describe, it, expect } from 'vitest';

import { createGrid } from '@phozart/core';
import type { ColumnDefinition, GridApi } from '@phozart/core';
import {
  createBIEngine,
  computeAggregation,
  computeAggregations,
  computePivot,
  computeStatus,
} from '@phozart/engine';

// ---------------------------------------------------------------------------
// Shared test data — realistic sales dataset
// ---------------------------------------------------------------------------

const SALES_DATA = [
  {
    id: 1,
    region: 'EMEA',
    product: 'Widget A',
    revenue: 45000,
    units: 150,
    date: '2025-01-15',
    rep: 'Alice',
  },
  {
    id: 2,
    region: 'APAC',
    product: 'Widget B',
    revenue: 32000,
    units: 200,
    date: '2025-01-20',
    rep: 'Bob',
  },
  {
    id: 3,
    region: 'EMEA',
    product: 'Widget A',
    revenue: 51000,
    units: 170,
    date: '2025-02-10',
    rep: 'Carol',
  },
  {
    id: 4,
    region: 'AMER',
    product: 'Widget C',
    revenue: 67000,
    units: 90,
    date: '2025-02-15',
    rep: 'Dave',
  },
  {
    id: 5,
    region: 'APAC',
    product: 'Widget A',
    revenue: 28000,
    units: 120,
    date: '2025-03-01',
    rep: 'Eve',
  },
  {
    id: 6,
    region: 'AMER',
    product: 'Widget B',
    revenue: 55000,
    units: 180,
    date: '2025-03-10',
    rep: 'Frank',
  },
  {
    id: 7,
    region: 'EMEA',
    product: 'Widget C',
    revenue: 39000,
    units: 110,
    date: '2025-03-20',
    rep: 'Grace',
  },
  {
    id: 8,
    region: 'AMER',
    product: 'Widget A',
    revenue: 72000,
    units: 240,
    date: '2025-04-05',
    rep: 'Henry',
  },
  {
    id: 9,
    region: 'APAC',
    product: 'Widget C',
    revenue: 41000,
    units: 95,
    date: '2025-04-15',
    rep: 'Iris',
  },
  {
    id: 10,
    region: 'EMEA',
    product: 'Widget B',
    revenue: 48000,
    units: 160,
    date: '2025-04-25',
    rep: 'Jack',
  },
];

const SALES_COLUMNS: ColumnDefinition[] = [
  { field: 'id', header: 'ID', type: 'number' },
  { field: 'region', header: 'Region', type: 'string' },
  { field: 'product', header: 'Product', type: 'string' },
  { field: 'revenue', header: 'Revenue', type: 'number' },
  { field: 'units', header: 'Units', type: 'number' },
  { field: 'date', header: 'Date', type: 'date' },
  { field: 'rep', header: 'Sales Rep', type: 'string' },
];

// ---------------------------------------------------------------------------
// Patch 1: "Bass Line" — Data Grid Only
// ---------------------------------------------------------------------------

describe('Patch 1: Bass Line (Grid Only)', () => {
  it('creates a grid and returns data', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    expect(grid.getData()).toHaveLength(10);
    grid.destroy();
  });

  it('sort pipeline produces ordered results', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid.sort('revenue', 'desc');

    const sorted = grid.getSortedRowModel().rows;
    expect(sorted[0].revenue).toBe(72000);
    expect(sorted[sorted.length - 1].revenue).toBe(28000);

    grid.destroy();
  });

  it('filter pipeline produces subset', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid.addFilter('region', 'equals', 'EMEA');

    const filtered = grid.getFilteredRowModel().rows;
    expect(filtered).toHaveLength(4);
    expect(filtered.every((r) => r.region === 'EMEA')).toBe(true);

    grid.destroy();
  });

  it('multi-sort works across fields', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid.multiSort([
      { field: 'region', direction: 'asc' },
      { field: 'revenue', direction: 'desc' },
    ]);

    const sorted = grid.getSortedRowModel().rows;
    // AMER first (alphabetically), then within AMER: 72000, 67000, 55000
    expect(sorted[0].region).toBe('AMER');
    expect(sorted[0].revenue).toBe(72000);

    grid.destroy();
  });

  it('selection persists across sort', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    const rows = grid.getData();

    grid.select([rows[0].__id, rows[3].__id]);
    expect(grid.getSelection().rows).toHaveLength(2);

    grid.sort('revenue', 'desc');
    expect(grid.getSelection().rows).toHaveLength(2);

    grid.destroy();
  });

  it('state export/import roundtrips', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid.sort('revenue', 'desc');

    const exported = grid.exportState();
    expect(exported).toBeDefined();
    expect(exported.sort).toBeDefined();

    const grid2 = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid2.importState(exported);
    const state2 = grid2.getState();
    expect(state2.sort).toBeDefined();

    grid.destroy();
    grid2.destroy();
  });

  it('CSV export includes all visible columns', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    const csv = grid.exportCsv();
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Region');
    expect(lines[0]).toContain('Revenue');
    expect(lines).toHaveLength(11); // header + 10 rows
    grid.destroy();
  });

  it('event system fires on state changes', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    const events: string[] = [];

    grid.on('sort:change', () => events.push('sort'));
    grid.on('filter:change', () => events.push('filter'));
    grid.on('selection:change', () => events.push('selection'));

    grid.sort('revenue', 'asc');
    grid.addFilter('region', 'equals', 'EMEA');
    grid.select(grid.getData()[0].__id);

    expect(events).toContain('sort');
    expect(events).toContain('filter');
    expect(events).toContain('selection');

    grid.destroy();
  });

  it('views: save and list', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });

    grid.sort('revenue', 'desc');
    const view1 = grid.saveView('Revenue View');
    expect(view1.id).toBeDefined();
    expect(view1.name).toBe('Revenue View');

    grid.clearSort();
    const view2 = grid.saveView('Default View');

    const views = grid.listViews();
    expect(views).toHaveLength(2);

    grid.destroy();
  });
});

// ---------------------------------------------------------------------------
// Patch 2: "Full Lead" — Grid + Analytics
// ---------------------------------------------------------------------------

describe('Patch 2: Full Lead (Grid + Engine)', () => {
  it('aggregation: sum/avg/min/max across revenue', () => {
    const result = computeAggregations(SALES_DATA as Record<string, unknown>[], {
      fields: [
        { field: 'revenue', functions: ['sum', 'avg', 'min', 'max', 'count'] },
        { field: 'units', functions: ['sum', 'avg'] },
      ],
    });

    expect(result.fieldResults.revenue.sum).toBe(478000);
    expect(result.fieldResults.revenue.count).toBe(10);
    expect(result.fieldResults.revenue.min).toBe(28000);
    expect(result.fieldResults.revenue.max).toBe(72000);
    expect(result.fieldResults.units.sum).toBe(1515);
  });

  it('single-field aggregation functions', () => {
    const rows = SALES_DATA as Record<string, unknown>[];
    expect(computeAggregation(rows, 'revenue', 'sum')).toBe(478000);
    expect(computeAggregation(rows, 'revenue', 'avg')).toBeCloseTo(47800);
    expect(computeAggregation(rows, 'revenue', 'min')).toBe(28000);
    expect(computeAggregation(rows, 'revenue', 'max')).toBe(72000);
    expect(computeAggregation(rows, 'revenue', 'count')).toBe(10);
  });

  it('pivot: revenue by region x product', () => {
    const result = computePivot(SALES_DATA as Record<string, unknown>[], {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'revenue', aggregation: 'sum' }],
    });

    expect(result).toBeDefined();
    expect(result.rowHeaders.length).toBeGreaterThan(0);
    expect(result.columnHeaders.length).toBeGreaterThan(0);
    expect(result.cells.length).toBeGreaterThan(0);
  });

  it('BIEngine facade: aggregate via unified API', () => {
    const engine = createBIEngine();

    const agg = engine.aggregate(SALES_DATA as Record<string, unknown>[], {
      fields: [{ field: 'revenue', functions: ['sum'] }],
    });
    expect(agg.fieldResults.revenue.sum).toBe(478000);
  });

  it('grid + engine: filter then aggregate filtered data', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    grid.addFilter('region', 'equals', 'EMEA');

    // Use getFilteredRowModel() to get pipeline output
    const filteredRows = grid.getFilteredRowModel().rows as Record<string, unknown>[];

    const result = computeAggregations(filteredRows, {
      fields: [{ field: 'revenue', functions: ['sum', 'avg'] }],
    });

    expect(result.fieldResults.revenue.sum).toBe(183000);
    expect(result.fieldResults.revenue.avg).toBe(45750);

    grid.destroy();
  });

  it('KPI status computation', () => {
    const result = computeStatus(
      {
        id: 'revenue-kpi',
        name: 'Total Revenue',
        dataProductId: 'sales',
        valueField: 'revenue',
        thresholds: { ok: 400000, warn: 300000 },
        direction: 'higher_is_better',
      },
      478000,
    );

    expect(result).toBeDefined();
    expect(result.level).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Patch 3: "Cosmic Exploration" — Grid + DuckDB
// ---------------------------------------------------------------------------

describe('Patch 3: Cosmic Exploration (Grid + DuckDB)', () => {
  it.skip('requires browser/WASM environment — tested in E2E', () => {});
});

// ---------------------------------------------------------------------------
// Patch 4: "Full Orchestra" — Viewer + Editor state machines
// ---------------------------------------------------------------------------

describe('Patch 4: Full Orchestra (Three Shells)', () => {
  it('editor: shell state with navigation and undo', async () => {
    const editor = await import('@phozart/editor');

    let state = editor.createEditorShellState();
    state = editor.navigateTo(state, { screen: 'dashboard', artifactId: 'dash-1' });
    // currentScreen is the navigation entry object
    expect(state.currentScreen).toBeDefined();

    // pushUndo captures current state for undo
    state = editor.pushUndo(state);
    expect(editor.canUndo(state)).toBe(true);
  });

  it('editor: dashboard edit state with widget management', async () => {
    const editor = await import('@phozart/editor');

    let dashboard = editor.createDashboardEditState();
    dashboard = editor.setDashboardTitle(dashboard, 'Q4 Revenue');

    dashboard = editor.addWidget(dashboard, {
      type: 'kpi-card',
      config: { title: 'Total Revenue' },
    } as any);
    expect(dashboard.widgets.length).toBe(1);

    dashboard = editor.addWidget(dashboard, {
      type: 'bar-chart',
      config: { title: 'By Region' },
    } as any);
    expect(dashboard.widgets.length).toBe(2);
  });

  it('editor: report edit state with columns', async () => {
    const editor = await import('@phozart/editor');

    let report = editor.createReportEditState();
    report = editor.setReportTitle(report, 'Sales by Region');
    report = editor.addReportColumn(report, { field: 'region', header: 'Region' } as any);
    report = editor.addReportColumn(report, { field: 'revenue', header: 'Revenue' } as any);
    expect(report.columns.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Cross-Module: Grid events → Engine aggregation (reactive pipeline)
// ---------------------------------------------------------------------------

describe('Cross-Module: Reactive Pipeline', () => {
  it('grid sort event triggers re-aggregation on raw data', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    let lastAggregation: any = null;

    grid.on('sort:change', () => {
      // getData() returns raw data — aggregation over all rows is still valid
      const allData = grid.getData() as Record<string, unknown>[];
      lastAggregation = computeAggregations(allData, {
        fields: [{ field: 'revenue', functions: ['sum'] }],
      });
    });

    grid.sort('revenue', 'desc');
    expect(lastAggregation).not.toBeNull();
    expect(lastAggregation.fieldResults.revenue.sum).toBe(478000);

    grid.destroy();
  });

  it('grid filter event triggers scoped aggregation via pipeline', () => {
    const grid = createGrid({ data: SALES_DATA, columns: SALES_COLUMNS });
    const aggregations: number[] = [];

    grid.on('filter:change', () => {
      // Use getFilteredRowModel() for pipeline output
      const filteredRows = grid.getFilteredRowModel().rows as Record<string, unknown>[];
      const result = computeAggregations(filteredRows, {
        fields: [{ field: 'revenue', functions: ['sum'] }],
      });
      aggregations.push(result.fieldResults.revenue.sum as number);
    });

    grid.addFilter('region', 'equals', 'EMEA');
    expect(aggregations[0]).toBe(183000);

    grid.destroy();
  });
});
