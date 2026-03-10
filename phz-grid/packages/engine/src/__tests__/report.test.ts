import { describe, it, expect } from 'vitest';
import { createReportConfigStore } from '../report.js';
import type { ReportConfig } from '../report.js';
import { reportId, dataProductId } from '../types.js';

function makeReport(id: string = 'r1'): ReportConfig {
  return {
    id: reportId(id),
    name: 'Sales Report',
    dataProductId: dataProductId('sales'),
    columns: [
      { field: 'region', header: 'Region' },
      { field: 'amount', header: 'Amount', width: 120 },
    ],
    sort: { columns: [{ field: 'amount', direction: 'desc' }] },
    pageSize: 50,
    created: Date.now(),
    updated: Date.now(),
  };
}

describe('ReportConfigStore', () => {
  it('saves and retrieves a report', () => {
    const store = createReportConfigStore();
    const report = makeReport();
    store.save(report);
    expect(store.get(reportId('r1'))?.name).toBe('Sales Report');
  });

  it('lists all reports', () => {
    const store = createReportConfigStore();
    store.save(makeReport('r1'));
    store.save(makeReport('r2'));
    expect(store.list()).toHaveLength(2);
  });

  it('deletes a report', () => {
    const store = createReportConfigStore();
    store.save(makeReport());
    store.delete(reportId('r1'));
    expect(store.get(reportId('r1'))).toBeUndefined();
  });

  it('validates — missing fields', () => {
    const store = createReportConfigStore();
    const result = store.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('validates — valid report', () => {
    const store = createReportConfigStore();
    const result = store.validate(makeReport());
    expect(result.valid).toBe(true);
  });

  it('converts to grid config', () => {
    const store = createReportConfigStore();
    const report = makeReport();
    const gridConfig = store.toGridConfig(report);
    expect(gridConfig.columns).toHaveLength(2);
    expect(gridConfig.columns[0].field).toBe('region');
    expect(gridConfig.sort?.columns[0].direction).toBe('desc');
  });

  it('updates timestamp on save', () => {
    const store = createReportConfigStore();
    const report = makeReport();
    const before = Date.now();
    store.save(report);
    const saved = store.get(reportId('r1'));
    expect(saved!.updated).toBeGreaterThanOrEqual(before);
  });

  it('createBlank returns a shell with generated ID', () => {
    const store = createReportConfigStore();
    const blank = store.createBlank();
    expect(blank.id).toMatch(/^rpt-/);
    expect(blank.name).toBe('Untitled Report');
    expect(blank.dataProductId).toBe('');
    expect(blank.columns).toEqual([]);
    expect(blank.created).toBeGreaterThan(0);
    expect(blank.updated).toBe(blank.created);
  });

  it('createBlank accepts custom name', () => {
    const store = createReportConfigStore();
    const blank = store.createBlank('My Report');
    expect(blank.name).toBe('My Report');
  });

  it('createBlank generates unique IDs', () => {
    const store = createReportConfigStore();
    const a = store.createBlank();
    const b = store.createBlank();
    expect(a.id).not.toBe(b.id);
  });

  it('accepts generateDashboard config', () => {
    const store = createReportConfigStore();
    const report: ReportConfig = {
      ...makeReport(),
      generateDashboard: {
        href: '/dashboards/new?from={reportId}&mode={dataMode}',
        label: 'Create Dashboard',
      },
    };
    store.save(report);
    const saved = store.get(reportId('r1'));
    expect(saved!.generateDashboard).toBeDefined();
    expect(saved!.generateDashboard!.href).toContain('{reportId}');
    expect(saved!.generateDashboard!.label).toBe('Create Dashboard');
  });
});
