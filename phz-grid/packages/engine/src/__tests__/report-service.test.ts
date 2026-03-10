import { describe, it, expect, vi } from 'vitest';
import { createBIEngine } from '../engine.js';
import { reportId, dashboardId, dataProductId } from '../types.js';
import { createReportService, createDashboardService } from '../report-service.js';
import type { CriteriaConfig } from '@phozart/phz-core';

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
        id: 'status',
        label: 'Status',
        type: 'single_select',
        dataField: 'status',
        required: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'closed', label: 'Closed' },
        ],
      },
    ],
  };
}

function createTestEngine() {
  const engine = createBIEngine();
  engine.dataProducts.register({
    id: dataProductId('sales'),
    name: 'Sales',
    schema: {
      fields: [
        { name: 'region', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'amount', type: 'number' },
      ],
    },
  });
  engine.reports.save({
    id: reportId('r1'),
    name: 'Sales Report',
    dataProductId: dataProductId('sales'),
    columns: [{ field: 'region' }, { field: 'amount' }],
    criteriaConfig: makeCriteriaConfig(),
    created: Date.now(),
    updated: Date.now(),
  });
  return engine;
}

describe('ReportService', () => {
  it('resolves fields from inline criteria config', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));

    const fields = service.getFields();
    expect(fields).toHaveLength(2);
    expect(fields[0].id).toBe('region');
    expect(fields[1].id).toBe('status');
  });

  it('initializes default values from field definitions', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));

    const values = service.getValues();
    expect(values.region).toEqual(['EMEA']);
    expect(values.status).toBeUndefined(); // no default
  });

  it('setValue updates value and notifies subscribers', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));
    const listener = vi.fn();

    service.subscribe(listener);
    service.setValue('region', ['APAC', 'NA']);

    expect(listener).toHaveBeenCalledOnce();
    const params = listener.mock.calls[0][0];
    expect(params.values.region).toEqual(['APAC', 'NA']);
  });

  it('setValues updates multiple values at once', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));
    const listener = vi.fn();

    service.subscribe(listener);
    service.setValues({ region: ['NA'], status: 'active' });

    expect(listener).toHaveBeenCalledOnce();
    const params = listener.mock.calls[0][0];
    expect(params.values.region).toEqual(['NA']);
    expect(params.values.status).toBe('active');
  });

  it('getFilterParams reports isComplete based on required fields', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));

    // status is required but has no default → incomplete
    let params = service.getFilterParams();
    expect(params.isComplete).toBe(false);

    service.setValue('status', 'active');
    params = service.getFilterParams();
    expect(params.isComplete).toBe(true);
  });

  it('reset restores default values', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));

    service.setValues({ region: ['NA', 'APAC'], status: 'closed' });
    service.reset();

    const values = service.getValues();
    expect(values.region).toEqual(['EMEA']); // restored default
    expect(values.status).toBeUndefined(); // no default
  });

  it('unsubscribe stops notifications', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));
    const listener = vi.fn();

    const unsub = service.subscribe(listener);
    service.setValue('region', ['NA']);
    expect(listener).toHaveBeenCalledOnce();

    unsub();
    service.setValue('region', ['APAC']);
    expect(listener).toHaveBeenCalledOnce(); // not called again
  });

  it('destroy clears all listeners', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));
    const listener = vi.fn();

    service.subscribe(listener);
    service.destroy();
    service.setValue('region', ['NA']);

    expect(listener).not.toHaveBeenCalled();
  });

  it('getFilterParams includes criteria output', () => {
    const engine = createTestEngine();
    const service = createReportService(engine, reportId('r1'));

    service.setValue('status', 'active');
    const params = service.getFilterParams();

    expect(params.criteria).not.toBeNull();
    expect(params.criteria!.filters.length).toBeGreaterThan(0);
  });

  it('handles report with no criteria config', () => {
    const engine = createBIEngine();
    engine.dataProducts.register({
      id: dataProductId('sales'),
      name: 'Sales',
      schema: { fields: [{ name: 'region', type: 'string' }] },
    });
    engine.reports.save({
      id: reportId('empty'),
      name: 'Empty Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      created: Date.now(),
      updated: Date.now(),
    });

    const service = createReportService(engine, reportId('empty'));
    expect(service.getFields()).toHaveLength(0);
    expect(service.getFilterParams().source).toBe('none');
  });
});

describe('DashboardService', () => {
  function createTestDashboardEngine() {
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
    return engine;
  }

  it('resolves dashboard filter fields and manages state', () => {
    const engine = createTestDashboardEngine();
    const service = createDashboardService(engine, dashboardId('d1'));
    expect(service.getFields()).toHaveLength(2);

    const listener = vi.fn();
    service.subscribe(listener);
    service.setValue('region', ['APAC']);

    expect(listener).toHaveBeenCalledOnce();
    expect(service.getValues().region).toEqual(['APAC']);
  });

  it('initializes default values from field definitions', () => {
    const engine = createTestDashboardEngine();
    const service = createDashboardService(engine, dashboardId('d1'));

    const values = service.getValues();
    expect(values.region).toEqual(['EMEA']);
    expect(values.status).toBeUndefined();
  });

  it('getFilterParams reports isComplete based on required fields', () => {
    const engine = createTestDashboardEngine();
    const service = createDashboardService(engine, dashboardId('d1'));

    let params = service.getFilterParams();
    expect(params.isComplete).toBe(false);

    service.setValue('status', 'active');
    params = service.getFilterParams();
    expect(params.isComplete).toBe(true);
  });

  it('reset restores default values', () => {
    const engine = createTestDashboardEngine();
    const service = createDashboardService(engine, dashboardId('d1'));

    service.setValues({ region: ['NA', 'APAC'], status: 'closed' });
    service.reset();

    const values = service.getValues();
    expect(values.region).toEqual(['EMEA']);
    expect(values.status).toBeUndefined();
  });

  it('destroy clears all listeners', () => {
    const engine = createTestDashboardEngine();
    const service = createDashboardService(engine, dashboardId('d1'));
    const listener = vi.fn();

    service.subscribe(listener);
    service.destroy();
    service.setValue('region', ['NA']);

    expect(listener).not.toHaveBeenCalled();
  });
});
