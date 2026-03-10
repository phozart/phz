import { describe, it, expect } from 'vitest';
import { resolveDrillFilter, resolveDrillAction } from '../drill-through.js';
import type { DrillContext, DrillThroughConfig } from '../drill-through.js';
import { kpiId, reportId } from '../types.js';
import { createReportConfigStore } from '../report.js';
import type { ReportConfig } from '../report.js';

describe('resolveDrillFilter', () => {
  it('resolves pivot drill to filters from row + column values', () => {
    const context: DrillContext = {
      source: {
        type: 'pivot',
        rowValues: { region: 'North' },
        columnValues: { product: 'Widget' },
      },
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(2);
    expect(filterState.filters[0]).toEqual({ field: 'region', operator: 'equals', value: 'North' });
    expect(filterState.filters[1]).toEqual({ field: 'product', operator: 'equals', value: 'Widget' });
  });

  it('resolves chart drill to filter on x-value', () => {
    const context: DrillContext = {
      source: {
        type: 'chart',
        xValue: '2024-Q1',
        seriesField: 'quarter',
      },
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(1);
    expect(filterState.filters[0].value).toBe('2024-Q1');
  });

  it('resolves KPI drill with breakdown', () => {
    const context: DrillContext = {
      source: {
        type: 'kpi',
        kpiId: kpiId('attendance'),
        breakdownId: 'north',
      },
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(2);
  });

  it('resolves scorecard drill with entity', () => {
    const context: DrillContext = {
      source: {
        type: 'scorecard',
        kpiId: kpiId('attendance'),
        breakdownId: 'north',
        entityId: 'school-1',
      },
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(3);
  });

  it('merges selection context as additional filters', () => {
    const context: DrillContext = {
      source: { type: 'chart', xValue: 'Q1', seriesField: 'quarter' },
      selectionContext: { year: '2024', region: 'North' },
    };
    const filterState = resolveDrillFilter(context);
    // 1 from chart + 2 from selection
    expect(filterState.filters).toHaveLength(3);
  });

  it('skips null and array values from selection context', () => {
    const context: DrillContext = {
      source: { type: 'chart', xValue: 'Q1', seriesField: 'quarter' },
      selectionContext: { year: '2024', tags: ['a', 'b'], region: null },
    };
    const filterState = resolveDrillFilter(context);
    // 1 from chart + 1 from selection (only 'year' — tags is array, region is null)
    expect(filterState.filters).toHaveLength(2);
  });
});

describe('resolveDrillAction', () => {
  it('resolves to a full drill action', () => {
    const context: DrillContext = {
      source: { type: 'pivot', rowValues: { region: 'North' }, columnValues: {} },
      targetReportId: reportId('detail-report'),
      openIn: 'modal',
    };
    const action = resolveDrillAction(context);
    expect(action.targetReportId).toBe('detail-report');
    expect(action.filters.region).toBe('North');
    expect(action.openIn).toBe('modal');
  });

  it('defaults to panel when openIn not specified', () => {
    const context: DrillContext = {
      source: { type: 'chart', xValue: 'Q1', seriesField: 'quarter' },
    };
    const action = resolveDrillAction(context);
    expect(action.openIn).toBe('panel');
  });
});

describe('grid-row drill with isSummaryRow', () => {
  it('produces empty filters when isSummaryRow is true', () => {
    const context: DrillContext = {
      source: {
        type: 'grid-row',
        rowData: { department: 'Sales', region: 'North' },
        isSummaryRow: true,
      },
      filterFields: ['department', 'region'],
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(0);
  });

  it('produces filters normally when isSummaryRow is false', () => {
    const context: DrillContext = {
      source: {
        type: 'grid-row',
        rowData: { department: 'Sales', region: 'North', salary: 50000 },
        isSummaryRow: false,
      },
      filterFields: ['department', 'region'],
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(2);
    expect(filterState.filters[0]).toEqual({ field: 'department', operator: 'equals', value: 'Sales' });
    expect(filterState.filters[1]).toEqual({ field: 'region', operator: 'equals', value: 'North' });
  });

  it('includes field and value on GridRowDrillSource', () => {
    const context: DrillContext = {
      source: {
        type: 'grid-row',
        rowData: { department: 'Sales', salary: 60000 },
        field: 'salary',
        value: 60000,
        isSummaryRow: false,
      },
      filterFields: ['department'],
    };
    const filterState = resolveDrillFilter(context);
    expect(filterState.filters).toHaveLength(1);
    expect(filterState.filters[0].field).toBe('department');
    // field/value are on source but don't affect filters directly — they're context
    expect(context.source.type === 'grid-row' && context.source.field).toBe('salary');
    expect(context.source.type === 'grid-row' && context.source.value).toBe(60000);
  });
});

describe('DrillThroughConfig round-trip', () => {
  it('persists drillThrough config on ReportConfig', () => {
    const store = createReportConfigStore();
    const drillConfig: DrillThroughConfig = {
      targetReportId: reportId('detail-report'),
      trigger: 'click',
      openIn: 'panel',
      mode: 'filtered',
      filterFields: ['department', 'region'],
    };
    const config: ReportConfig = {
      id: reportId('master'),
      name: 'Master Report',
      dataProductId: 'dp-1' as any,
      columns: [{ field: 'name' }],
      created: Date.now(),
      updated: Date.now(),
      drillThrough: drillConfig,
    };
    store.save(config);
    const saved = store.get(reportId('master'));
    expect(saved?.drillThrough).toBeDefined();
    expect(saved?.drillThrough?.mode).toBe('filtered');
    expect(saved?.drillThrough?.trigger).toBe('click');
    expect(saved?.drillThrough?.filterFields).toEqual(['department', 'region']);
  });
});
