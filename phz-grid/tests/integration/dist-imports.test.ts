/**
 * Integration tests that import from dist/ (compiled output).
 *
 * These tests verify that the PUBLISHED packages work correctly,
 * not just the source code. Run `npm run build` before running these.
 *
 * This catches problems that unit tests miss:
 * - Missing re-exports in index.ts
 * - Broken .d.ts files
 * - Inter-package resolution failures in compiled output
 */
import { describe, it, expect } from 'vitest';

// Import from compiled dist/ via package names
// (vitest.integration.config.ts points these to dist/)
import { createGrid, EventEmitter } from '@phozart/phz-core';
import {
  createBIEngine,
  createDataProductRegistry,
  createKPIRegistry,
  createMetricCatalog,
  computeAggregation,
  computeAggregations,
  computeStatus,
} from '@phozart/phz-engine';

const sampleData = [
  { name: 'Alice', age: 30, city: 'NYC', sales: 100 },
  { name: 'Bob', age: 25, city: 'LA', sales: 200 },
  { name: 'Carol', age: 35, city: 'NYC', sales: 150 },
  { name: 'Dave', age: 28, city: 'Chicago', sales: 300 },
  { name: 'Eve', age: 32, city: 'LA', sales: 250 },
];

const sampleColumns = [
  { field: 'name', header: 'Name', type: 'string' as const },
  { field: 'age', header: 'Age', type: 'number' as const },
  { field: 'city', header: 'City', type: 'string' as const },
  { field: 'sales', header: 'Sales', type: 'number' as const },
];

describe('Core: createGrid', () => {
  it('creates a grid with data', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    expect(grid.getData()).toHaveLength(5);
  });

  it('sorts data', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    grid.sort('age', 'asc');
    const sorted = grid.getSortedRowModel();
    expect(sorted.rows[0].name).toBe('Bob');
    expect(sorted.rows[4].name).toBe('Carol');
  });

  it('filters data', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    grid.addFilter('city', 'equals', 'NYC');
    const filtered = grid.getFilteredRowModel();
    expect(filtered.rows).toHaveLength(2);
    expect(filtered.rows.every(r => r.city === 'NYC')).toBe(true);
  });

  it('selects and deselects rows', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    const data = grid.getData();
    grid.select(data[0].__id);
    expect(grid.getSelection().rows).toHaveLength(1);
    grid.deselectAll();
    expect(grid.getSelection().rows).toHaveLength(0);
  });

  it('adds and deletes rows', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    const id = grid.addRow({ name: 'Frank', age: 40, city: 'Boston', sales: 500 });
    expect(grid.getData()).toHaveLength(6);
    grid.deleteRow(id);
    expect(grid.getData()).toHaveLength(5);
  });

  it('exports CSV', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    const csv = grid.exportCsv();
    expect(csv).toContain('Name');
    expect(csv).toContain('Alice');
    expect(csv.split('\n')).toHaveLength(6); // header + 5 rows
  });

  it('undo and redo', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    grid.sort('age', 'asc');
    const beforeUndo = grid.getSortedRowModel().rows[0].name;
    grid.undo();
    grid.redo();
    const afterRedo = grid.getSortedRowModel().rows[0].name;
    expect(afterRedo).toBe(beforeUndo);
  });

  it('getState returns state object', () => {
    const grid = createGrid({ data: sampleData, columns: sampleColumns });
    const state = grid.getState();
    expect(state).toBeDefined();
    expect(state.sort).toBeDefined();
  });
});

describe('Core: EventEmitter', () => {
  it('fires and receives events', () => {
    const emitter = new EventEmitter();
    let received = false;
    emitter.on('test', () => { received = true; });
    emitter.emit('test');
    expect(received).toBe(true);
  });
});

describe('Engine: createBIEngine', () => {
  it('creates an engine with all sub-systems', () => {
    const engine = createBIEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.aggregate).toBe('function');
    expect(typeof engine.pivot).toBe('function');
    expect(engine.reports).toBeDefined();
    expect(engine.dashboards).toBeDefined();
    expect(engine.kpis).toBeDefined();
    expect(engine.status).toBeDefined();
  });

  it('computes aggregations via engine.aggregate()', () => {
    const engine = createBIEngine();
    const result = engine.aggregate(
      [
        { product: 'A', revenue: 100, cost: 40 },
        { product: 'B', revenue: 200, cost: 80 },
        { product: 'A', revenue: 150, cost: 60 },
      ],
      { fields: [{ field: 'revenue', functions: ['sum', 'avg'] }] },
    );
    expect(result.fieldResults.revenue.sum).toBe(450);
    expect(result.fieldResults.revenue.avg).toBe(150);
  });
});

describe('Engine: standalone functions', () => {
  it('computeAggregation computes single field', () => {
    const rows = [{ sales: 100 }, { sales: 200 }, { sales: 300 }];
    expect(computeAggregation(rows, 'sales', 'sum')).toBe(600);
    expect(computeAggregation(rows, 'sales', 'avg')).toBe(200);
    expect(computeAggregation(rows, 'sales', 'min')).toBe(100);
    expect(computeAggregation(rows, 'sales', 'max')).toBe(300);
    expect(computeAggregation(rows, 'sales', 'count')).toBe(3);
  });

  it('computeAggregations computes multi-field', () => {
    const rows = [
      { revenue: 100, cost: 40 },
      { revenue: 200, cost: 80 },
    ];
    const result = computeAggregations(rows, {
      fields: [
        { field: 'revenue', functions: ['sum'] },
        { field: 'cost', functions: ['sum'] },
      ],
    });
    expect(result.fieldResults.revenue.sum).toBe(300);
    expect(result.fieldResults.cost.sum).toBe(120);
  });
});

describe('Engine: factory functions', () => {
  it('createDataProductRegistry returns a registry', () => {
    const registry = createDataProductRegistry();
    expect(registry).toBeDefined();
  });

  it('createKPIRegistry returns a registry', () => {
    const registry = createKPIRegistry();
    expect(registry).toBeDefined();
  });

  it('createMetricCatalog returns a catalog', () => {
    const catalog = createMetricCatalog();
    expect(catalog).toBeDefined();
  });
});

describe('Engine: KPI status', () => {
  it('computes status for a KPI', () => {
    const result = computeStatus(
      {
        id: 'kpi1',
        name: 'Revenue',
        dataProductId: 'dp1',
        valueField: 'revenue',
        thresholds: { ok: 100, warn: 50 },
        direction: 'higher_is_better',
      },
      120,
    );
    expect(result).toBeDefined();
    expect(result.level).toBeDefined();
  });
});
