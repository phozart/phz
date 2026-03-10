import { describe, it, expect } from 'vitest';
import { resolveWidgetProps, resolveDashboardWidgets } from '../widget-resolver.js';
import type { KPIScoreProvider, WidgetResolverContext } from '../widget-resolver.js';
import { createBIEngine } from '../engine.js';
import { kpiId, widgetId, dataProductId, dashboardId } from '../types.js';
import type { KPIDefinition } from '../kpi.js';
import type { WidgetPlacement, KPICardWidgetConfig, BarChartWidgetConfig, TrendLineWidgetConfig, BottomNWidgetConfig, ScorecardWidgetConfig, StatusTableWidgetConfig, DrillLinkWidgetConfig } from '../widget.js';

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

const qualityKPI: KPIDefinition = {
  id: kpiId('quality'),
  name: 'Quality',
  target: 90,
  unit: 'percent',
  direction: 'higher_is_better',
  thresholds: { ok: 85, warn: 75 },
  deltaComparison: 'previous_period',
  dimensions: ['region'],
  dataSource: { scoreEndpoint: '/api/kpi/quality' },
};

const testData = [
  { name: 'Alice', attendance: 95, quality: 88, department: 'Engineering', region: 'North' },
  { name: 'Bob', attendance: 85, quality: 92, department: 'Engineering', region: 'South' },
  { name: 'Carol', attendance: 90, quality: 80, department: 'Sales', region: 'North' },
  { name: 'Dave', attendance: 92, quality: 85, department: 'Sales', region: 'East' },
];

const mockScoreProvider: KPIScoreProvider = (id, data, kpiDef) => {
  const field = id as string;
  const values = data.map(r => r[field] as number).filter(v => typeof v === 'number');
  const value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return { value, previousValue: value * 0.95, trendData: [80, 82, 84, 86, 88, 90, 89, 91, 92, 93, 94, value] };
};

function makeEngine() {
  return createBIEngine({
    initialKPIs: [attendanceKPI, qualityKPI],
  });
}

function makeCtx(overrides?: Partial<WidgetResolverContext>): WidgetResolverContext {
  return {
    engine: makeEngine(),
    data: testData,
    scoreProvider: mockScoreProvider,
    ...overrides,
  };
}

describe('resolveWidgetProps', () => {
  it('resolves kpi-card with score provider', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w1'),
      widgetType: 'kpi-card',
      config: { id: widgetId('w1'), type: 'kpi-card', kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } } as KPICardWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('kpi-card');
    expect(result.kpiDefinition?.id).toBe('attendance');
    expect(result.value).toBeCloseTo(90.5); // avg of 95,85,90,92
    expect(result.previousValue).toBeDefined();
    expect(result.trendData).toHaveLength(12);
    expect(result.cardStyle).toBe('compact');
  });

  it('resolves kpi-card without score provider returns definition only', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w1'),
      widgetType: 'kpi-card',
      config: { id: widgetId('w1'), type: 'kpi-card', kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } } as KPICardWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx({ scoreProvider: undefined }));
    expect(result.kpiDefinition?.id).toBe('attendance');
    expect(result.value).toBeUndefined();
  });

  it('resolves kpi-card with unknown KPI returns empty', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w1'),
      widgetType: 'kpi-card',
      config: { id: widgetId('w1'), type: 'kpi-card', kpiId: kpiId('unknown'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } } as KPICardWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('kpi-card');
    expect(result.kpiDefinition).toBeUndefined();
  });

  it('resolves bar-chart with grouped averages', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w2'),
      widgetType: 'bar-chart',
      config: {
        id: widgetId('w2'), type: 'bar-chart',
        dataProductId: dataProductId('emp'), metricField: 'attendance', dimension: 'department',
        rankOrder: 'desc',
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 2 },
      } as BarChartWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('bar-chart');
    expect(result.chartData?.data).toHaveLength(2); // Engineering, Sales
    expect(result.rankOrder).toBe('desc');
    // Engineering avg: (95+85)/2=90, Sales avg: (90+92)/2=91 → desc: Sales first
    expect(result.chartData?.data[0].x).toBe('Sales');
  });

  it('resolves trend-line with trend data', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w3'),
      widgetType: 'trend-line',
      config: {
        id: widgetId('w3'), type: 'trend-line',
        dataProductId: dataProductId('emp'), metricField: 'quality', periods: 12,
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
      } as TrendLineWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('trend-line');
    expect(result.chartData?.data).toHaveLength(12);
    expect(result.target).toBe(90); // quality KPI target
    expect(result.periods).toBe(12);
  });

  it('resolves bottom-n with sorted entries', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w4'),
      widgetType: 'bottom-n',
      config: {
        id: widgetId('w4'), type: 'bottom-n',
        dataProductId: dataProductId('emp'), metricField: 'attendance', dimension: 'department',
        n: 5, direction: 'bottom',
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
      } as BottomNWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('bottom-n');
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBeLessThanOrEqual(5);
    expect(result.n).toBe(5);
    expect(result.direction).toBe('bottom');
    // Engineering avg=90 < Sales avg=91, so Engineering first in bottom
    expect(result.data![0].department).toBe('Engineering');
  });

  it('resolves kpi-scorecard with multiple KPIs', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w5'),
      widgetType: 'kpi-scorecard',
      config: {
        id: widgetId('w5'), type: 'kpi-scorecard',
        kpis: [kpiId('attendance'), kpiId('quality')], expandable: false,
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 3 },
      } as ScorecardWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 3 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('kpi-scorecard');
    expect(result.kpiDefinitions).toHaveLength(2);
    expect(result.scores).toHaveLength(2);
    expect(result.scores![0].kpiId).toBe('attendance');
    expect(result.scores![1].kpiId).toBe('quality');
  });

  it('resolves status-table with KPI definitions', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w6'),
      widgetType: 'status-table',
      config: {
        id: widgetId('w6'), type: 'status-table',
        kpis: [kpiId('attendance'), kpiId('quality')], entityDimension: 'name',
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 3 },
      } as StatusTableWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 3 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('status-table');
    expect(result.entityField).toBe('name');
    expect(result.kpiDefinitions).toHaveLength(2);
    expect(result.data).toHaveLength(4);
  });

  it('resolves drill-link with passthrough props', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w7'),
      widgetType: 'drill-link',
      config: {
        id: widgetId('w7'), type: 'drill-link',
        label: 'View Report', targetReportId: 'rpt-1' as any,
        filters: { region: 'North' },
        position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 },
      } as DrillLinkWidgetConfig,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('drill-link');
    expect(result.label).toBe('View Report');
    expect(result.targetReportId).toBe('rpt-1');
    expect(result.filters).toEqual({ region: 'North' });
  });

  it('returns basic props for unknown widget type', () => {
    const widget: WidgetPlacement = {
      id: widgetId('w8'),
      widgetType: 'custom',
      config: { id: widgetId('w8'), type: 'custom', renderer: 'my-custom', position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } } as any,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };
    const result = resolveWidgetProps(widget, makeCtx());
    expect(result.widgetType).toBe('custom');
  });
});

describe('resolveDashboardWidgets', () => {
  it('resolves all widgets in a dashboard config', () => {
    const dashboard = {
      id: dashboardId('dash-1'),
      name: 'Test Dashboard',
      layout: { columns: 3, rowHeight: 180, gap: 16 },
      widgets: [
        {
          id: widgetId('w-att'),
          widgetType: 'kpi-card' as const,
          config: { id: widgetId('w-att'), type: 'kpi-card' as const, kpiId: kpiId('attendance'), position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 1 } },
          position: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
        },
        {
          id: widgetId('w-qual'),
          widgetType: 'kpi-card' as const,
          config: { id: widgetId('w-qual'), type: 'kpi-card' as const, kpiId: kpiId('quality'), position: { row: 0, col: 1 }, size: { rowSpan: 1, colSpan: 1 } },
          position: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
        },
      ],
      created: Date.now(),
      updated: Date.now(),
    };

    const resolved = resolveDashboardWidgets(dashboard, makeCtx());
    expect(resolved.size).toBe(2);
    expect(resolved.get('w-att')?.widgetType).toBe('kpi-card');
    expect(resolved.get('w-att')?.value).toBeCloseTo(90.5);
    expect(resolved.get('w-qual')?.value).toBeCloseTo(86.25);
  });
});
