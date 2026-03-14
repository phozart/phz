/**
 * Tests for Dashboard View State (B-2.05)
 */
import {
  createDashboardViewState,
  setDashboardData,
  setPermissions,
  expandWidget,
  collapseWidget,
  setDashboardViewLoading,
  setDashboardViewError,
} from '../screens/dashboard-view-state.js';
import type { DashboardWidget } from '@phozart/shared/types';

const WIDGET: DashboardWidget = {
  id: 'w1',
  widgetType: 'bar-chart',
  position: { col: 0, row: 0, colSpan: 4, rowSpan: 2 },
  config: { title: 'Revenue' },
  visible: true,
};

describe('createDashboardViewState', () => {
  it('creates with defaults', () => {
    const state = createDashboardViewState('dash-1');
    expect(state.dashboardId).toBe('dash-1');
    expect(state.title).toBe('');
    expect(state.widgets).toEqual([]);
    expect(state.visibility).toBe('personal');
    expect(state.canEdit).toBe(false);
    expect(state.canShare).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.expandedWidgetId).toBeNull();
  });

  it('accepts overrides', () => {
    const state = createDashboardViewState('dash-1', {
      title: 'Sales Dashboard',
      canEdit: true,
    });
    expect(state.title).toBe('Sales Dashboard');
    expect(state.canEdit).toBe(true);
  });
});

describe('setDashboardData', () => {
  it('sets dashboard data from loaded artifact', () => {
    let state = createDashboardViewState('dash-1');
    state = setDashboardData(state, {
      title: 'Revenue Dashboard',
      description: 'Q4 metrics',
      widgets: [WIDGET],
      visibility: 'published',
      ownerId: 'u1',
    });
    expect(state.title).toBe('Revenue Dashboard');
    expect(state.description).toBe('Q4 metrics');
    expect(state.widgets).toHaveLength(1);
    expect(state.visibility).toBe('published');
    expect(state.ownerId).toBe('u1');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('uses default grid layout when not provided', () => {
    let state = createDashboardViewState('dash-1');
    state = setDashboardData(state, {
      title: 'Test',
      widgets: [],
      visibility: 'personal',
      ownerId: 'u1',
    });
    expect(state.gridLayout).toEqual({ columns: 12, rows: 8, gap: 16 });
  });
});

describe('setPermissions', () => {
  it('sets edit and share permissions', () => {
    let state = createDashboardViewState('dash-1');
    state = setPermissions(state, { canEdit: true, canShare: true });
    expect(state.canEdit).toBe(true);
    expect(state.canShare).toBe(true);
  });
});

describe('widget expansion', () => {
  it('expands a widget', () => {
    let state = createDashboardViewState('dash-1');
    state = expandWidget(state, 'w1');
    expect(state.expandedWidgetId).toBe('w1');
  });

  it('collapses the expanded widget', () => {
    let state = createDashboardViewState('dash-1');
    state = expandWidget(state, 'w1');
    state = collapseWidget(state);
    expect(state.expandedWidgetId).toBeNull();
  });
});

describe('loading / error', () => {
  it('sets loading and clears error', () => {
    let state = setDashboardViewError(createDashboardViewState('dash-1'), 'err');
    state = setDashboardViewLoading(state, true);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets error and clears loading', () => {
    let state = setDashboardViewLoading(createDashboardViewState('dash-1'), true);
    state = setDashboardViewError(state, 'not found');
    expect(state.error).toBe('not found');
    expect(state.loading).toBe(false);
  });
});
