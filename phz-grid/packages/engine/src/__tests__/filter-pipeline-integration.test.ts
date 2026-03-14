/**
 * Filter Pipeline Integration Test
 *
 * End-to-end: CriteriaEngine -> FilterAdapter -> Dashboard Widget Resolution
 *
 * Verifies that setting filter values on CriteriaEngine propagates
 * filtered data through to the widget resolver pipeline.
 */
import { describe, it, expect, vi } from 'vitest';
import { createBIEngine } from '../engine.js';
import { createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings } from '../filter-adapter.js';
import { resolveDashboardWidgets } from '../widget-resolver.js';
import type { KPIScoreProvider } from '../widget-resolver.js';
import { kpiId, dashboardId, widgetId, dataProductId } from '../types.js';
import { filterDefinitionId, artefactId } from '@phozart/core';
import type { KPIDefinition } from '../kpi.js';
import type { DashboardConfig } from '../dashboard.js';
import type { GlobalFilter } from '../dashboard-enhanced.js';

// --- Shared fixtures ---

const testData = [
  { name: 'Alice', department: 'Engineering', region: 'North', attendance: 95, quality: 88 },
  { name: 'Bob', department: 'Engineering', region: 'South', attendance: 85, quality: 92 },
  { name: 'Carol', department: 'Sales', region: 'North', attendance: 90, quality: 80 },
  { name: 'Dave', department: 'Sales', region: 'East', attendance: 72, quality: 85 },
  { name: 'Eve', department: 'HR', region: 'West', attendance: 88, quality: 77 },
];

const attendanceKPI: KPIDefinition = {
  id: kpiId('attendance'),
  name: 'Attendance',
  target: 95,
  unit: 'percent',
  direction: 'higher_is_better',
  thresholds: { ok: 90, warn: 80 },
  deltaComparison: 'previous_period',
  dimensions: ['region'],
  dataSource: { scoreEndpoint: '/api/kpi/attendance' },
};

const mockScoreProvider: KPIScoreProvider = (id, data, kpiDef) => {
  const field = id as string;
  const values = data.map(r => r[field] as number).filter(v => typeof v === 'number');
  const value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return { value, previousValue: value * 0.95, trendData: Array.from({ length: 12 }, (_, i) => 80 + i) };
};

// --- Tests ---

describe('Filter Pipeline Integration', () => {
  it('end-to-end: set filter -> adapter filters data -> widget resolver gets filtered data', () => {
    const engine = createBIEngine({ initialKPIs: [attendanceKPI] });
    const artId = artefactId('dashboard:pipeline-test');
    const now = Date.now();

    // Setup filter definitions
    engine.criteria.registry.register({
      id: filterDefinitionId('department'),
      label: 'Department',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'department',
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Sales', label: 'Sales' },
        { value: 'HR', label: 'HR' },
      ],
      createdAt: now,
      updatedAt: now,
    });

    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('department'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    // Create adapter
    const adapter = createFilterAdapter(engine.criteria, artId);

    // Set filter: only Engineering
    adapter.setValues({ department: ['Engineering'] });

    // Apply filter to data
    const filteredData = adapter.applyFilters(testData);
    expect(filteredData).toHaveLength(2);

    // Resolve dashboard widgets with filtered data
    const dashboard: DashboardConfig = {
      id: dashboardId('d1'),
      name: 'Test',
      layout: { columns: 3, rowHeight: 180, gap: 16, responsive: true },
      widgets: [
        {
          id: widgetId('w-att'),
          widgetType: 'kpi-card',
          config: { id: widgetId('w-att'), type: 'kpi-card', kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } },
          position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
        },
      ],
      created: now,
      updated: now,
    };

    const resolved = resolveDashboardWidgets(dashboard, {
      engine,
      data: filteredData,
      scoreProvider: mockScoreProvider,
    });

    // avg(95, 85) = 90 for Engineering only
    expect(resolved.get('w-att')?.value).toBeCloseTo(90);
  });

  it('filter changes propagate: subscriber receives new criteria, re-resolves widgets', () => {
    const engine = createBIEngine({ initialKPIs: [attendanceKPI] });
    const artId = artefactId('dashboard:subscribe-test');
    const now = Date.now();

    engine.criteria.registry.register({
      id: filterDefinitionId('region'),
      label: 'Region',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'region',
      options: [
        { value: 'North', label: 'North' },
        { value: 'South', label: 'South' },
        { value: 'East', label: 'East' },
        { value: 'West', label: 'West' },
      ],
      createdAt: now,
      updatedAt: now,
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const adapter = createFilterAdapter(engine.criteria, artId);

    const dashboard: DashboardConfig = {
      id: dashboardId('d2'),
      name: 'Test',
      layout: { columns: 3, rowHeight: 180, gap: 16, responsive: true },
      widgets: [
        {
          id: widgetId('w-att'),
          widgetType: 'kpi-card',
          config: { id: widgetId('w-att'), type: 'kpi-card', kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } },
          position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
        },
      ],
      created: now,
      updated: now,
    };

    // Track resolved values across filter changes
    const resolvedValues: number[] = [];

    adapter.subscribe(() => {
      const filteredData = adapter.applyFilters(testData);
      const resolved = resolveDashboardWidgets(dashboard, {
        engine,
        data: filteredData,
        scoreProvider: mockScoreProvider,
      });
      resolvedValues.push(resolved.get('w-att')?.value ?? 0);
    });

    // Change 1: North only -> Alice(95) + Carol(90) = avg 92.5
    adapter.setValues({ region: ['North'] });
    expect(resolvedValues[0]).toBeCloseTo(92.5);

    // Change 2: South only -> Bob(85) = avg 85
    adapter.setValues({ region: ['South'] });
    expect(resolvedValues[1]).toBeCloseTo(85);

    // Change 3: Reset -> all data
    adapter.reset();
    // After reset, no notification (reset doesn't trigger subscriber)
    // Manually apply to check
    const allData = adapter.applyFilters(testData);
    expect(allData).toHaveLength(5);
  });

  it('GlobalFilter bridge: converts GlobalFilters to CriteriaEngine, filters data correctly', () => {
    const engine = createBIEngine({ initialKPIs: [attendanceKPI] });
    const artId = artefactId('dashboard:global-filter-test');

    const globalFilters: GlobalFilter[] = [
      { id: 'gf-dept', label: 'Department', fieldKey: 'department', filterType: 'select' },
      { id: 'gf-region', label: 'Region', fieldKey: 'region', filterType: 'multi-select' },
    ];

    // Bridge GlobalFilters into CriteriaEngine
    globalFiltersToCriteriaBindings(engine.criteria, artId, globalFilters);

    // Create adapter using the bridged bindings
    const adapter = createFilterAdapter(engine.criteria, artId);

    // Set values using CriteriaEngine (not the old GlobalFilter mechanism)
    adapter.setValues({ 'gf-dept': 'Sales' });
    const filtered = adapter.applyFilters(testData);

    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.department === 'Sales')).toBe(true);
  });

  it('multiple filters combine with AND logic through the full pipeline', () => {
    const engine = createBIEngine({ initialKPIs: [attendanceKPI] });
    const artId = artefactId('dashboard:multi-filter-test');
    const now = Date.now();

    engine.criteria.registry.register({
      id: filterDefinitionId('department'),
      label: 'Department',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'department',
      options: [],
      createdAt: now,
      updatedAt: now,
    });
    engine.criteria.registry.register({
      id: filterDefinitionId('region'),
      label: 'Region',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'region',
      options: [],
      createdAt: now,
      updatedAt: now,
    });

    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('department'),
      artefactId: artId,
      visible: true,
      order: 0,
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 1,
    });

    const adapter = createFilterAdapter(engine.criteria, artId);

    // Filter: Engineering AND North -> only Alice
    adapter.setValues({
      department: ['Engineering'],
      region: ['North'],
    });

    const filtered = adapter.applyFilters(testData);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Alice');

    // Widget resolver gets only Alice's data
    const dashboard: DashboardConfig = {
      id: dashboardId('d3'),
      name: 'Test',
      layout: { columns: 1, rowHeight: 180, gap: 16, responsive: true },
      widgets: [{
        id: widgetId('w-att'),
        widgetType: 'kpi-card',
        config: { id: widgetId('w-att'), type: 'kpi-card', kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } },
        position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      }],
      created: now,
      updated: now,
    };

    const resolved = resolveDashboardWidgets(dashboard, {
      engine,
      data: filtered,
      scoreProvider: mockScoreProvider,
    });

    // Only Alice's attendance: 95
    expect(resolved.get('w-att')?.value).toBeCloseTo(95);
  });
});
