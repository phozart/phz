import { describe, it, expect, vi } from 'vitest';
import { createBIEngine } from '../engine.js';
import { reportId, dashboardId, dataProductId } from '../types.js';
import { filterDefinitionId, artefactId } from '@phozart/core';
import { reportArtefactId, dashboardArtefactId } from '../types.js';
import { resolveReportCriteria, resolveDashboardCriteria } from '../criteria/resolve-criteria.js';
import type { DivergenceInfo } from '../criteria/resolve-criteria.js';
import type { CriteriaConfig } from '@phozart/core';

function makeCriteriaConfig(): CriteriaConfig {
  return {
    fields: [
      {
        id: 'region',
        label: 'Region',
        type: 'multi_select',
        dataField: 'region',
        options: [
          { value: 'EMEA', label: 'EMEA' },
          { value: 'APAC', label: 'APAC' },
          { value: 'NA', label: 'North America' },
        ],
        defaultValue: ['EMEA'],
      },
      {
        id: 'period',
        label: 'Period',
        type: 'date_range',
        dataField: 'created_date',
      },
    ],
  };
}

describe('resolveReportCriteria', () => {
  it('returns source "none" when report does not exist', () => {
    const engine = createBIEngine();
    const result = resolveReportCriteria(
      reportId('nonexistent'),
      engine.criteria,
      engine.reports,
    );
    expect(result.source).toBe('none');
    expect(result.fields).toHaveLength(0);
  });

  it('returns source "none" when report has no criteria and no bindings', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      created: Date.now(),
      updated: Date.now(),
    });

    const result = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
    );
    expect(result.source).toBe('none');
    expect(result.fields).toHaveLength(0);
  });

  it('auto-hydrates inline criteriaConfig to registry (source "hydrated")', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    const result = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
    );

    expect(result.source).toBe('hydrated');
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].id).toBe('region');
    expect(result.fields[0].label).toBe('Region');
    expect(result.fields[1].id).toBe('period');

    // Verify they're now in the registry
    const def = engine.criteria.registry.get(filterDefinitionId('region'));
    expect(def).toBeDefined();
    expect(def!.label).toBe('Region');
  });

  it('uses registry bindings when they exist (source "registry")', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      created: Date.now(),
      updated: Date.now(),
    });

    // Manually register filter definition and bind it
    const artId = reportArtefactId(reportId('r1'));
    engine.criteria.registry.register({
      id: filterDefinitionId('status'),
      label: 'Status Filter',
      type: 'single_select',
      sessionBehavior: 'reset',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const result = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
    );

    expect(result.source).toBe('registry');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('status');
  });

  it('detects divergence when both inline and registry exist', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    // Pre-register a filter definition with different label and bind it
    const artId = reportArtefactId(reportId('r1'));
    engine.criteria.registry.register({
      id: filterDefinitionId('region'),
      label: 'Geographic Region',  // Different from inline "Region"
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'region',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const onDivergence = vi.fn();
    const result = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
      onDivergence,
    );

    expect(result.source).toBe('registry');
    expect(result.divergence).toBeDefined();
    expect(result.divergence!.diverged).toContain('region');
    expect(result.divergence!.inlineOnly).toContain('period');
    expect(onDivergence).toHaveBeenCalledOnce();
  });

  it('second hydration call is idempotent', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('r1'),
      name: 'Sales Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    // First call hydrates
    const result1 = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
    );
    expect(result1.source).toBe('hydrated');

    // Second call sees existing bindings — uses registry
    const result2 = resolveReportCriteria(
      reportId('r1'),
      engine.criteria,
      engine.reports,
    );
    expect(result2.source).toBe('registry');
    expect(result2.fields).toHaveLength(2);
  });
});

describe('resolveDashboardCriteria', () => {
  it('returns source "none" for nonexistent dashboard', () => {
    const engine = createBIEngine();
    const result = resolveDashboardCriteria(
      dashboardId('nonexistent'),
      engine.criteria,
      engine.dashboards,
    );
    expect(result.source).toBe('none');
  });

  it('auto-hydrates dashboard inline criteriaConfig', () => {
    const engine = createBIEngine();
    engine.dashboards.save({
      id: dashboardId('d1'),
      name: 'Sales Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    const result = resolveDashboardCriteria(
      dashboardId('d1'),
      engine.criteria,
      engine.dashboards,
    );

    expect(result.source).toBe('hydrated');
    expect(result.fields).toHaveLength(2);
  });

  it('uses registry bindings when they exist (source "registry")', () => {
    const engine = createBIEngine();
    engine.dashboards.save({
      id: dashboardId('d1'),
      name: 'Sales Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      created: Date.now(),
      updated: Date.now(),
    });

    const artId = dashboardArtefactId(dashboardId('d1'));
    engine.criteria.registry.register({
      id: filterDefinitionId('status'),
      label: 'Status Filter',
      type: 'single_select',
      sessionBehavior: 'reset',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const result = resolveDashboardCriteria(
      dashboardId('d1'),
      engine.criteria,
      engine.dashboards,
    );

    expect(result.source).toBe('registry');
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].id).toBe('status');
  });

  it('detects divergence when both inline and registry exist', () => {
    const engine = createBIEngine();
    engine.dashboards.save({
      id: dashboardId('d1'),
      name: 'Sales Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    const artId = dashboardArtefactId(dashboardId('d1'));
    engine.criteria.registry.register({
      id: filterDefinitionId('region'),
      label: 'Geographic Region',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'region',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    engine.criteria.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 0,
    });

    const onDivergence = vi.fn();
    const result = resolveDashboardCriteria(
      dashboardId('d1'),
      engine.criteria,
      engine.dashboards,
      onDivergence,
    );

    expect(result.source).toBe('registry');
    expect(result.divergence).toBeDefined();
    expect(result.divergence!.diverged).toContain('region');
    expect(result.divergence!.inlineOnly).toContain('period');
    expect(result.divergence!.artefactType).toBe('dashboard');
    expect(onDivergence).toHaveBeenCalledOnce();
  });

  it('second hydration call is idempotent', () => {
    const engine = createBIEngine();
    engine.dashboards.save({
      id: dashboardId('d1'),
      name: 'Sales Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      criteriaConfig: makeCriteriaConfig(),
      created: Date.now(),
      updated: Date.now(),
    });

    const result1 = resolveDashboardCriteria(
      dashboardId('d1'),
      engine.criteria,
      engine.dashboards,
    );
    expect(result1.source).toBe('hydrated');

    const result2 = resolveDashboardCriteria(
      dashboardId('d1'),
      engine.criteria,
      engine.dashboards,
    );
    expect(result2.source).toBe('registry');
    expect(result2.fields).toHaveLength(2);
  });
});
