import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWidgetMenu,
  getCanvasMenu,
  getChartSegmentMenu,
  getDashboardContextMenu,
} from '../dashboard-context-menu.js';
import type { DashboardContextTarget } from '../dashboard-context-menu.js';
import {
  initialDashboardEditorState,
  addWidget,
  updateWidgetConfig,
  _resetWidgetCounter,
} from '../dashboard-editor-state.js';
import type { DashboardEditorState } from '../dashboard-editor-state.js';

describe('DashboardContextMenu', () => {
  let state: DashboardEditorState;

  beforeEach(() => {
    _resetWidgetCounter();
    state = initialDashboardEditorState('test', 'ds-1');
    state = addWidget(state, 'bar-chart');
  });

  describe('getWidgetMenu', () => {
    it('returns full menu with expected items', () => {
      const menu = getWidgetMenu(state, state.widgets[0].id);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('configure');
      expect(ids).toContain('morph-to');
      expect(ids).toContain('duplicate');
      expect(ids).toContain('view-data');
      expect(ids).toContain('view-sql');
      expect(ids).toContain('add-to-filter-bar');
      expect(ids).toContain('drill-down');
      expect(ids).toContain('export-csv');
      expect(ids).toContain('export-png');
      expect(ids).toContain('export-pdf');
      expect(ids).toContain('delete');
    });

    it('includes separators', () => {
      const menu = getWidgetMenu(state, state.widgets[0].id);
      const separators = menu.filter(m => m.separator === true);
      expect(separators.length).toBeGreaterThanOrEqual(4);
    });

    it('has morph submenu matching morph group options', () => {
      const menu = getWidgetMenu(state, state.widgets[0].id);
      const morphItem = menu.find(m => m.id === 'morph-to');
      expect(morphItem).toBeDefined();
      expect(morphItem!.children).toBeDefined();
      const morphLabels = morphItem!.children!.map(c => c.label);
      expect(morphLabels).toContain('line-chart');
      expect(morphLabels).toContain('area-chart');
      expect(morphLabels).toContain('pie-chart');
      expect(morphLabels).not.toContain('bar-chart');
    });

    it('disables morph submenu when no options exist', () => {
      state = addWidget(state, 'drill-link');
      const drillId = state.widgets[state.widgets.length - 1].id;
      const menu = getWidgetMenu(state, drillId);
      const morphItem = menu.find(m => m.id === 'morph-to');
      expect(morphItem!.disabled).toBe(true);
      expect(morphItem!.children).toEqual([]);
    });

    it('shows cross-filter toggle label based on config', () => {
      const id = state.widgets[0].id;
      const menu1 = getWidgetMenu(state, id);
      const cf1 = menu1.find(m => m.id === 'toggle-cross-filter');
      expect(cf1!.label).toBe('Enable Cross-Filter');

      state = updateWidgetConfig(state, id, { enableCrossFilter: true });
      const menu2 = getWidgetMenu(state, id);
      const cf2 = menu2.find(m => m.id === 'toggle-cross-filter');
      expect(cf2!.label).toBe('Disable Cross-Filter');
    });

    it('returns empty array for non-existent widget', () => {
      const menu = getWidgetMenu(state, 'no-such-widget');
      expect(menu).toEqual([]);
    });

    it('includes duplicate with shortcut Ctrl+D', () => {
      const menu = getWidgetMenu(state, state.widgets[0].id);
      const dup = menu.find(m => m.id === 'duplicate');
      expect(dup!.shortcut).toBe('Ctrl+D');
    });
  });

  describe('getCanvasMenu', () => {
    it('shows Add Widget with subcategories', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const addWidgetItem = menu.find(m => m.id === 'add-widget');
      expect(addWidgetItem).toBeDefined();
      expect(addWidgetItem!.children).toBeDefined();
      expect(addWidgetItem!.children!.length).toBeGreaterThanOrEqual(3);
    });

    it('has Charts subcategory with chart types', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const addWidgetItem = menu.find(m => m.id === 'add-widget')!;
      const charts = addWidgetItem.children!.find(c => c.id === 'add-category-chart');
      expect(charts).toBeDefined();
      const chartLabels = charts!.children!.map(c => c.label);
      expect(chartLabels).toContain('Bar Chart');
      expect(chartLabels).toContain('Line Chart');
      expect(chartLabels).toContain('Area Chart');
      expect(chartLabels).toContain('Pie Chart');
    });

    it('has Single Value subcategory', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const addWidgetItem = menu.find(m => m.id === 'add-widget')!;
      const singleValue = addWidgetItem.children!.find(c => c.id === 'add-single-value');
      expect(singleValue).toBeDefined();
      const labels = singleValue!.children!.map(c => c.label);
      expect(labels).toContain('KPI Card');
      expect(labels).toContain('Gauge');
    });

    it('has Tables subcategory', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const addWidgetItem = menu.find(m => m.id === 'add-widget')!;
      const tables = addWidgetItem.children!.find(c => c.id === 'add-tabular');
      expect(tables).toBeDefined();
      const labels = tables!.children!.map(c => c.label);
      expect(labels).toContain('Data Table');
      expect(labels).toContain('Pivot Table');
    });

    it('includes Paste Widget, Add Text Block, and Canvas Settings', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const ids = menu.map(m => m.id);
      expect(ids).toContain('paste-widget');
      expect(ids).toContain('add-text-block');
      expect(ids).toContain('canvas-settings');
    });

    it('includes Paste Widget shortcut Ctrl+V', () => {
      const menu = getCanvasMenu(state, { row: 0, col: 0 });
      const paste = menu.find(m => m.id === 'paste-widget');
      expect(paste!.shortcut).toBe('Ctrl+V');
    });
  });

  describe('getChartSegmentMenu', () => {
    it('shows filter/exclude/cross-filter/drill/view-data items', () => {
      const target = {
        type: 'chart-segment' as const,
        widgetId: state.widgets[0].id,
        segmentIndex: 0,
        value: 'Electronics',
      };
      const menu = getChartSegmentMenu(state, target);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('filter-by');
      expect(ids).toContain('exclude');
      expect(ids).toContain('cross-filter-all');
      expect(ids).toContain('drill-down');
      expect(ids).toContain('view-data');
    });

    it('includes value in filter-by label', () => {
      const target = {
        type: 'chart-segment' as const,
        widgetId: state.widgets[0].id,
        segmentIndex: 0,
        value: 'Electronics',
      };
      const menu = getChartSegmentMenu(state, target);
      const filterBy = menu.find(m => m.id === 'filter-by');
      expect(filterBy!.label).toBe('Filter by "Electronics"');
    });

    it('includes value in exclude label', () => {
      const target = {
        type: 'chart-segment' as const,
        widgetId: state.widgets[0].id,
        segmentIndex: 0,
        value: 42,
      };
      const menu = getChartSegmentMenu(state, target);
      const exclude = menu.find(m => m.id === 'exclude');
      expect(exclude!.label).toBe('Exclude "42"');
    });

    it('handles null value', () => {
      const target = {
        type: 'chart-segment' as const,
        widgetId: state.widgets[0].id,
        segmentIndex: 0,
        value: null,
      };
      const menu = getChartSegmentMenu(state, target);
      const filterBy = menu.find(m => m.id === 'filter-by');
      expect(filterBy!.label).toBe('Filter by "null"');
    });
  });

  describe('getDashboardContextMenu', () => {
    it('dispatches widget target to getWidgetMenu', () => {
      const target: DashboardContextTarget = { type: 'widget', widgetId: state.widgets[0].id };
      const menu = getDashboardContextMenu(state, target);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('configure');
      expect(ids).toContain('delete');
    });

    it('dispatches canvas target to getCanvasMenu', () => {
      const target: DashboardContextTarget = { type: 'canvas', position: { row: 0, col: 0 } };
      const menu = getDashboardContextMenu(state, target);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('add-widget');
      expect(ids).toContain('canvas-settings');
    });

    it('dispatches chart-segment target to getChartSegmentMenu', () => {
      const target: DashboardContextTarget = {
        type: 'chart-segment',
        widgetId: state.widgets[0].id,
        segmentIndex: 0,
        value: 'test',
      };
      const menu = getDashboardContextMenu(state, target);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('filter-by');
      expect(ids).toContain('cross-filter-all');
    });

    it('dispatches kpi-value target to getWidgetMenu', () => {
      state = addWidget(state, 'kpi-card');
      const kpiId = state.widgets[state.widgets.length - 1].id;
      const target: DashboardContextTarget = { type: 'kpi-value', widgetId: kpiId };
      const menu = getDashboardContextMenu(state, target);
      const ids = menu.map(m => m.id);
      expect(ids).toContain('configure');
      expect(ids).toContain('morph-to');
    });
  });
});
