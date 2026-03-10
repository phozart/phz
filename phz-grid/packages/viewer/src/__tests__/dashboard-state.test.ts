/**
 * Tests for dashboard-state.ts — Dashboard View State
 */
import { describe, it, expect } from 'vitest';
import {
  createDashboardViewState,
  loadDashboard,
  setWidgetLoading,
  setWidgetError,
  applyCrossFilter,
  clearCrossFilter,
  clearAllCrossFilters,
  toggleFullscreen,
  toggleWidgetExpanded,
  refreshDashboard,
} from '../screens/dashboard-state.js';
import type { DashboardWidgetView } from '../screens/dashboard-state.js';

const makeWidget = (id: string, title: string): DashboardWidgetView => ({
  id,
  type: 'bar-chart',
  title,
  position: { x: 0, y: 0, w: 6, h: 4 },
  config: {},
  loading: false,
  error: null,
});

describe('dashboard-state', () => {
  describe('createDashboardViewState', () => {
    it('creates empty default state', () => {
      const state = createDashboardViewState();
      expect(state.dashboardId).toBeNull();
      expect(state.title).toBe('');
      expect(state.widgets).toEqual([]);
      expect(state.crossFilters).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.fullscreen).toBe(false);
      expect(state.expandedWidgetId).toBeNull();
    });
  });

  describe('loadDashboard', () => {
    it('loads dashboard with widgets', () => {
      const widgets = [makeWidget('w1', 'Chart A'), makeWidget('w2', 'Chart B')];
      const state = loadDashboard(createDashboardViewState(), {
        id: 'dash-1',
        title: 'Sales Dashboard',
        description: 'Q1 Sales',
        widgets,
      });

      expect(state.dashboardId).toBe('dash-1');
      expect(state.title).toBe('Sales Dashboard');
      expect(state.description).toBe('Q1 Sales');
      expect(state.widgets).toHaveLength(2);
      expect(state.loading).toBe(false);
      expect(state.crossFilters).toEqual([]);
      expect(state.expandedWidgetId).toBeNull();
      expect(state.lastRefreshed).toBeGreaterThan(0);
    });
  });

  describe('setWidgetLoading', () => {
    it('sets loading on specific widget', () => {
      let state = createDashboardViewState();
      state = loadDashboard(state, {
        id: 'dash-1',
        title: 'Test',
        widgets: [makeWidget('w1', 'A'), makeWidget('w2', 'B')],
      });

      state = setWidgetLoading(state, 'w1', true);
      expect(state.widgets.find(w => w.id === 'w1')!.loading).toBe(true);
      expect(state.widgets.find(w => w.id === 'w2')!.loading).toBe(false);
    });

    it('clears error when setting loading true', () => {
      let state = createDashboardViewState();
      state = loadDashboard(state, {
        id: 'dash-1',
        title: 'Test',
        widgets: [makeWidget('w1', 'A')],
      });
      state = setWidgetError(state, 'w1', 'something broke');
      state = setWidgetLoading(state, 'w1', true);
      expect(state.widgets[0].error).toBeNull();
    });
  });

  describe('setWidgetError', () => {
    it('sets error on specific widget', () => {
      let state = createDashboardViewState();
      state = loadDashboard(state, {
        id: 'dash-1',
        title: 'Test',
        widgets: [makeWidget('w1', 'A')],
      });
      state = setWidgetError(state, 'w1', 'Query failed');
      expect(state.widgets[0].error).toBe('Query failed');
      expect(state.widgets[0].loading).toBe(false);
    });
  });

  describe('applyCrossFilter / clearCrossFilter', () => {
    it('applies cross-filter', () => {
      let state = createDashboardViewState();
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w1',
        field: 'region',
        value: 'East',
        timestamp: Date.now(),
      });
      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0].field).toBe('region');
    });

    it('replaces existing cross-filter from same widget', () => {
      let state = createDashboardViewState();
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w1', field: 'region', value: 'East', timestamp: 1,
      });
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w1', field: 'region', value: 'West', timestamp: 2,
      });
      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0].value).toBe('West');
    });

    it('clears cross-filter from specific widget', () => {
      let state = createDashboardViewState();
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w1', field: 'region', value: 'East', timestamp: 1,
      });
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w2', field: 'product', value: 'X', timestamp: 2,
      });
      state = clearCrossFilter(state, 'w1');
      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0].sourceWidgetId).toBe('w2');
    });
  });

  describe('clearAllCrossFilters', () => {
    it('clears all cross-filters', () => {
      let state = createDashboardViewState();
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w1', field: 'a', value: '1', timestamp: 1,
      });
      state = applyCrossFilter(state, {
        sourceWidgetId: 'w2', field: 'b', value: '2', timestamp: 2,
      });
      state = clearAllCrossFilters(state);
      expect(state.crossFilters).toEqual([]);
    });
  });

  describe('toggleFullscreen', () => {
    it('toggles fullscreen state', () => {
      let state = createDashboardViewState();
      expect(state.fullscreen).toBe(false);
      state = toggleFullscreen(state);
      expect(state.fullscreen).toBe(true);
      state = toggleFullscreen(state);
      expect(state.fullscreen).toBe(false);
    });
  });

  describe('toggleWidgetExpanded', () => {
    it('expands a widget', () => {
      const state = toggleWidgetExpanded(createDashboardViewState(), 'w1');
      expect(state.expandedWidgetId).toBe('w1');
    });

    it('collapses when toggling same widget', () => {
      let state = toggleWidgetExpanded(createDashboardViewState(), 'w1');
      state = toggleWidgetExpanded(state, 'w1');
      expect(state.expandedWidgetId).toBeNull();
    });

    it('switches to different widget', () => {
      let state = toggleWidgetExpanded(createDashboardViewState(), 'w1');
      state = toggleWidgetExpanded(state, 'w2');
      expect(state.expandedWidgetId).toBe('w2');
    });
  });

  describe('refreshDashboard', () => {
    it('sets all widgets to loading', () => {
      let state = createDashboardViewState();
      state = loadDashboard(state, {
        id: 'dash-1',
        title: 'Test',
        widgets: [makeWidget('w1', 'A'), makeWidget('w2', 'B')],
      });
      state = refreshDashboard(state);
      expect(state.loading).toBe(true);
      expect(state.widgets.every(w => w.loading)).toBe(true);
      expect(state.widgets.every(w => w.error === null)).toBe(true);
    });
  });
});
