/**
 * @phozart/phz-workspace — Dashboard Context Menu
 *
 * Pure functions generating context menus for dashboard editing targets.
 */

import type { ContextMenuItem } from './report-context-menu.js';
import type { DashboardEditorState } from './dashboard-editor-state.js';
import { getMorphOptions } from './dashboard-editor-state.js';

export type DashboardContextTarget =
  | { type: 'widget'; widgetId: string }
  | { type: 'canvas'; position: { row: number; col: number } }
  | { type: 'chart-segment'; widgetId: string; segmentIndex: number; value: unknown }
  | { type: 'kpi-value'; widgetId: string };

function sep(): ContextMenuItem {
  return { id: `sep-${Date.now()}-${Math.random()}`, label: '', separator: true };
}

export function getWidgetMenu(state: DashboardEditorState, widgetId: string): ContextMenuItem[] {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return [];

  const morphOptions = getMorphOptions(widget.type);
  const morphChildren: ContextMenuItem[] = morphOptions.map(opt => ({
    id: `morph-${opt}`,
    label: opt,
    icon: 'transform',
  }));

  const hasCrossFilter = widget.config.enableCrossFilter === true;

  return [
    { id: 'configure', label: 'Configure', icon: 'settings' },
    {
      id: 'morph-to',
      label: 'Morph To',
      icon: 'transform',
      children: morphChildren,
      disabled: morphChildren.length === 0,
    },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: 'Ctrl+D' },
    sep(),
    { id: 'view-data', label: 'View Data', icon: 'table' },
    { id: 'view-sql', label: 'View SQL', icon: 'code' },
    sep(),
    { id: 'add-to-filter-bar', label: 'Add to Filter Bar', icon: 'filter' },
    {
      id: 'toggle-cross-filter',
      label: hasCrossFilter ? 'Disable Cross-Filter' : 'Enable Cross-Filter',
      icon: 'cross-filter',
    },
    { id: 'drill-down', label: 'Drill Down', icon: 'drill' },
    sep(),
    { id: 'export-csv', label: 'Export CSV', icon: 'download' },
    { id: 'export-png', label: 'Export PNG', icon: 'image' },
    { id: 'export-pdf', label: 'Export PDF', icon: 'file-pdf' },
    sep(),
    { id: 'delete', label: 'Delete', icon: 'trash' },
  ];
}

export function getCanvasMenu(_state: DashboardEditorState, _position: { row: number; col: number }): ContextMenuItem[] {
  return [
    {
      id: 'add-widget',
      label: 'Add Widget',
      icon: 'plus',
      children: [
        {
          id: 'add-category-chart',
          label: 'Charts',
          children: [
            { id: 'add-bar-chart', label: 'Bar Chart', icon: 'bar-chart' },
            { id: 'add-line-chart', label: 'Line Chart', icon: 'line-chart' },
            { id: 'add-area-chart', label: 'Area Chart', icon: 'area-chart' },
            { id: 'add-pie-chart', label: 'Pie Chart', icon: 'pie-chart' },
          ],
        },
        {
          id: 'add-single-value',
          label: 'Single Value',
          children: [
            { id: 'add-kpi-card', label: 'KPI Card', icon: 'kpi' },
            { id: 'add-gauge', label: 'Gauge', icon: 'gauge' },
            { id: 'add-kpi-scorecard', label: 'KPI Scorecard', icon: 'scorecard' },
            { id: 'add-trend-line', label: 'Trend Line', icon: 'trend' },
          ],
        },
        {
          id: 'add-tabular',
          label: 'Tables',
          children: [
            { id: 'add-data-table', label: 'Data Table', icon: 'table' },
            { id: 'add-pivot-table', label: 'Pivot Table', icon: 'pivot' },
          ],
        },
      ],
    },
    { id: 'paste-widget', label: 'Paste Widget', icon: 'paste', shortcut: 'Ctrl+V' },
    { id: 'add-text-block', label: 'Add Text Block', icon: 'text' },
    sep(),
    { id: 'canvas-settings', label: 'Canvas Settings', icon: 'settings' },
  ];
}

export function getChartSegmentMenu(
  _state: DashboardEditorState,
  target: { type: 'chart-segment'; widgetId: string; segmentIndex: number; value: unknown },
): ContextMenuItem[] {
  const displayValue = target.value != null ? String(target.value) : 'null';

  return [
    { id: 'filter-by', label: `Filter by "${displayValue}"`, icon: 'filter' },
    { id: 'exclude', label: `Exclude "${displayValue}"`, icon: 'filter-off' },
    { id: 'cross-filter-all', label: 'Cross-Filter All Widgets', icon: 'cross-filter' },
    { id: 'drill-down', label: 'Drill Down', icon: 'drill' },
    { id: 'view-data', label: 'View Data', icon: 'table' },
  ];
}

export function getDashboardContextMenu(
  state: DashboardEditorState,
  target: DashboardContextTarget,
): ContextMenuItem[] {
  switch (target.type) {
    case 'widget':
      return getWidgetMenu(state, target.widgetId);
    case 'canvas':
      return getCanvasMenu(state, target.position);
    case 'chart-segment':
      return getChartSegmentMenu(state, target);
    case 'kpi-value':
      return getWidgetMenu(state, target.widgetId);
  }
}
