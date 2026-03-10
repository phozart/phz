import { describe, it, expect } from 'vitest';
import { createDashboardConfigStore, upgradeDashboardConfig } from '../dashboard.js';
import type { DashboardConfig } from '../dashboard.js';
import type { WidgetPlacement } from '../widget.js';
import { dashboardId, widgetId } from '../types.js';
import { DEFAULT_DASHBOARD_THEME } from '../dashboard-enhanced.js';

function makeDashboard(id: string = 'd1'): DashboardConfig {
  return {
    id: dashboardId(id),
    name: 'Sales Dashboard',
    layout: { columns: 12, rowHeight: 80, gap: 16 },
    widgets: [
      {
        id: widgetId('w1'),
        widgetType: 'kpi-card',
        config: { id: widgetId('w1'), type: 'kpi-card', kpiId: 'kpi-1' as any, position: { row: 0, col: 0 }, size: { rowSpan: 1, colSpan: 3 } } as any,
        position: { row: 0, col: 0, rowSpan: 1, colSpan: 3 },
      },
      {
        id: widgetId('w2'),
        widgetType: 'bar-chart',
        config: { id: widgetId('w2'), type: 'bar-chart', position: { row: 0, col: 3 }, size: { rowSpan: 2, colSpan: 6 } } as any,
        position: { row: 0, col: 3, rowSpan: 2, colSpan: 6 },
      },
    ],
    created: Date.now(),
    updated: Date.now(),
  };
}

describe('DashboardConfigStore', () => {
  it('saves and retrieves a dashboard', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard());
    expect(store.get(dashboardId('d1'))?.name).toBe('Sales Dashboard');
  });

  it('lists all dashboards', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard('d1'));
    store.save(makeDashboard('d2'));
    expect(store.list()).toHaveLength(2);
  });

  it('deletes a dashboard', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard());
    store.delete(dashboardId('d1'));
    expect(store.get(dashboardId('d1'))).toBeUndefined();
  });

  it('validates — missing fields', () => {
    const store = createDashboardConfigStore();
    const result = store.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates — valid dashboard', () => {
    const store = createDashboardConfigStore();
    const result = store.validate(makeDashboard());
    expect(result.valid).toBe(true);
  });

  it('adds a widget', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard());
    const newWidget: WidgetPlacement = {
      id: widgetId('w3'),
      widgetType: 'trend-line',
      config: { id: widgetId('w3'), type: 'trend-line', position: { row: 2, col: 0 }, size: { rowSpan: 1, colSpan: 6 } } as any,
      position: { row: 2, col: 0, rowSpan: 1, colSpan: 6 },
    };
    store.addWidget(dashboardId('d1'), newWidget);
    expect(store.get(dashboardId('d1'))?.widgets).toHaveLength(3);
  });

  it('removes a widget', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard());
    store.removeWidget(dashboardId('d1'), widgetId('w1'));
    expect(store.get(dashboardId('d1'))?.widgets).toHaveLength(1);
  });

  it('updates a widget', () => {
    const store = createDashboardConfigStore();
    store.save(makeDashboard());
    store.updateWidget(dashboardId('d1'), widgetId('w1'), {
      position: { row: 1, col: 0, rowSpan: 1, colSpan: 4 },
    });
    const widget = store.get(dashboardId('d1'))?.widgets.find(w => w.id === widgetId('w1'));
    expect(widget?.position.colSpan).toBe(4);
  });

  it('resolves layout positions', () => {
    const store = createDashboardConfigStore();
    const dashboard = makeDashboard();
    const layout = store.resolveLayout(dashboard, 1200);
    expect(layout.positions).toHaveLength(2);
    expect(layout.columnWidth).toBeGreaterThan(0);
    // First widget at col 0 should have x = 0
    expect(layout.positions[0].x).toBe(0);
    // Second widget at col 3 should have positive x
    expect(layout.positions[1].x).toBeGreaterThan(0);
  });
});

describe('upgradeDashboardConfig', () => {
  it('converts v1 dashboard to v2 EnhancedDashboardConfig', () => {
    const v1 = makeDashboard();
    const v2 = upgradeDashboardConfig(v1);

    expect(v2.version).toBe(2);
    expect(v2.id).toBe(v1.id);
    expect(v2.name).toBe(v1.name);
    expect(v2.layout.columns).toBe(12);
    expect(v2.layout.gap).toBe(16);
    expect(v2.widgets).toHaveLength(2);
    expect(v2.placements).toHaveLength(2);
    expect(v2.globalFilters).toEqual([]);
    expect(v2.theme).toEqual(DEFAULT_DASHBOARD_THEME);
  });

  it('maps placements from v1 widget positions', () => {
    const v1 = makeDashboard();
    const v2 = upgradeDashboardConfig(v1);

    // First widget: col=0, colSpan=3, rowSpan=1 (no heightOverride)
    expect(v2.placements[0].widgetId).toBe(widgetId('w1'));
    expect(v2.placements[0].column).toBe(0);
    expect(v2.placements[0].colSpan).toBe(3);
    expect(v2.placements[0].heightOverride).toBeUndefined();

    // Second widget: col=3, colSpan=6, rowSpan=2 (has heightOverride)
    expect(v2.placements[1].widgetId).toBe(widgetId('w2'));
    expect(v2.placements[1].column).toBe(3);
    expect(v2.placements[1].colSpan).toBe(6);
    expect(v2.placements[1].heightOverride).toBe(2 * 80 + 1 * 16); // rowSpan*rowHeight + (rowSpan-1)*gap
  });

  it('preserves metadata timestamps', () => {
    const v1 = makeDashboard();
    v1.createdBy = 'admin';
    const v2 = upgradeDashboardConfig(v1);

    expect(v2.metadata.created).toBe(v1.created);
    expect(v2.metadata.updated).toBe(v1.updated);
    expect(v2.metadata.createdBy).toBe('admin');
  });

  it('carries over optional fields', () => {
    const v1 = makeDashboard();
    v1.description = 'Test description';
    v1.autoRefreshInterval = 30000;
    const v2 = upgradeDashboardConfig(v1);

    expect(v2.description).toBe('Test description');
    expect(v2.autoRefreshInterval).toBe(30000);
  });
});
