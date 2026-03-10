/**
 * ArtefactId/DashboardId Type Bridge Tests
 *
 * Ensures consistent ID types across engine types and criteria bindings.
 * The bug: filter bindings silently fail when ArtefactId and DashboardId
 * have mismatched prefixes (e.g., raw "d1" vs "dashboard:d1").
 */
import { describe, it, expect } from 'vitest';
import { createBIEngine } from '../engine.js';
import { reportId, dashboardId, reportArtefactId, dashboardArtefactId, widgetArtefactId, widgetId, parseArtefactId } from '../types.js';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';
import type { ArtefactId } from '@phozart/phz-core';

describe('ArtefactId type bridge', () => {
  it('reportArtefactId prefixes with "report:"', () => {
    const rId = reportId('r1');
    const artId = reportArtefactId(rId);
    expect(artId as string).toBe('report:r1');
  });

  it('dashboardArtefactId prefixes with "dashboard:"', () => {
    const dId = dashboardId('d1');
    const artId = dashboardArtefactId(dId);
    expect(artId as string).toBe('dashboard:d1');
  });

  it('widgetArtefactId prefixes with "widget:"', () => {
    const wId = widgetId('w1');
    const artId = widgetArtefactId(wId);
    expect(artId as string).toBe('widget:w1');
  });

  it('parseArtefactId extracts type and raw ID', () => {
    expect(parseArtefactId(artefactId('report:r1'))).toEqual({ type: 'report', rawId: 'r1' });
    expect(parseArtefactId(artefactId('dashboard:d1'))).toEqual({ type: 'dashboard', rawId: 'd1' });
    expect(parseArtefactId(artefactId('widget:w1'))).toEqual({ type: 'widget', rawId: 'w1' });
    expect(parseArtefactId(artefactId('foo'))).toEqual({ type: 'unknown', rawId: 'foo' });
  });

  it('bindings created with dashboardArtefactId match getDashboardFilters lookup', () => {
    const engine = createBIEngine();
    const dId = dashboardId('test-dash');
    const artId = dashboardArtefactId(dId);

    engine.dashboards.save({
      id: dId,
      name: 'Test',
      layout: { columns: 3, rowHeight: 180, gap: 16 },
      widgets: [],
      created: Date.now(),
      updated: Date.now(),
    });

    // Register and bind a filter using the bridge function
    engine.criteria.registry.register({
      id: filterDefinitionId('status'),
      label: 'Status',
      type: 'single_select',
      sessionBehavior: 'reset',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    // getDashboardFilters internally converts dashboardId -> dashboardArtefactId
    const result = engine.getDashboardFilters(dId);
    expect(result.source).toBe('registry');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('status');
  });

  it('bindings with RAW dashboard ID (no prefix) do NOT match getDashboardFilters', () => {
    const engine = createBIEngine();
    const dId = dashboardId('mismatch-dash');

    engine.dashboards.save({
      id: dId,
      name: 'Test',
      layout: { columns: 3, rowHeight: 180, gap: 16 },
      widgets: [],
      created: Date.now(),
      updated: Date.now(),
    });

    // Bug scenario: someone binds using raw dashboard ID without prefix
    engine.criteria.registry.register({
      id: filterDefinitionId('status'),
      label: 'Status',
      type: 'single_select',
      sessionBehavior: 'reset',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: artefactId('mismatch-dash'), // RAW — no "dashboard:" prefix!
      visible: true,
      order: 0,
    });

    // getDashboardFilters looks for "dashboard:mismatch-dash" but binding is "mismatch-dash"
    const result = engine.getDashboardFilters(dId);
    // This should NOT find the binding (mismatch)
    expect(result.source).toBe('none');
    expect(result.fields).toHaveLength(0);
  });

  it('bindings with reportArtefactId match getReportFilters lookup', () => {
    const engine = createBIEngine();
    const rId = reportId('test-report');
    const artId = reportArtefactId(rId);

    engine.reports.save({
      id: rId,
      name: 'Test Report',
      dataProductId: 'dp1' as any,
      columns: [],
      created: Date.now(),
      updated: Date.now(),
    });

    engine.criteria.registry.register({
      id: filterDefinitionId('region'),
      label: 'Region',
      type: 'multi_select',
      sessionBehavior: 'reset',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const result = engine.getReportFilters(rId);
    expect(result.source).toBe('registry');
    expect(result.fields).toHaveLength(1);
  });

  it('BIEngine.criteria.buildCriteria uses correct artId for dashboard', () => {
    const engine = createBIEngine();
    const dId = dashboardId('build-test');
    const artId = dashboardArtefactId(dId);
    const now = Date.now();

    engine.criteria.registry.register({
      id: filterDefinitionId('dept'),
      label: 'Department',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'department',
      createdAt: now,
      updatedAt: now,
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('dept'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const criteria = engine.criteria.buildCriteria(artId, { dept: ['Engineering'] });
    expect(criteria.artefactId).toBe(artId);
    expect(criteria.filters).toHaveLength(1);
    expect(criteria.filters[0].value).toEqual(['Engineering']);
  });
});
