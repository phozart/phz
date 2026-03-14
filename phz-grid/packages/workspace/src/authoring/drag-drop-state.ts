/**
 * @phozart/workspace — Drag-and-Drop State
 *
 * Pure state management for drag-and-drop operations in the dashboard editor.
 */

import type { DashboardEditorState } from './dashboard-editor-state.js';
import { addWidget, moveWidget, updateWidgetData } from './dashboard-editor-state.js';

export type DragSource =
  | { type: 'field-palette'; field: string; dataType: string; semanticHint?: string }
  | { type: 'widget-library'; widgetType: string }
  | { type: 'existing-widget'; widgetId: string }
  | { type: 'filter-chip'; filterId: string };

export type DropTarget =
  | { type: 'canvas-cell'; row: number; col: number }
  | { type: 'widget-data-zone'; widgetId: string; zone: 'dimensions' | 'measures' | 'filters' }
  | { type: 'filter-bar' }
  | { type: 'widget-swap'; widgetId: string };

export interface DragDropState {
  dragging?: DragSource;
  hovering?: DropTarget;
  validTargets: DropTarget[];
}

export function initialDragDropState(): DragDropState {
  return { validTargets: [] };
}

export function startDrag(state: DragDropState, source: DragSource): DragDropState {
  return { ...state, dragging: source, hovering: undefined };
}

export function hoverTarget(state: DragDropState, target: DropTarget | undefined): DragDropState {
  return { ...state, hovering: target };
}

export function cancelDrag(_state: DragDropState): DragDropState {
  return initialDragDropState();
}

export function computeValidTargets(source: DragSource, dashboardState: DashboardEditorState): DropTarget[] {
  const targets: DropTarget[] = [];

  switch (source.type) {
    case 'field-palette':
      // Can drop on canvas (auto-creates widget), widget data zones, or filter bar
      targets.push({ type: 'canvas-cell', row: 0, col: 0 });
      for (const w of dashboardState.widgets) {
        targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'dimensions' });
        targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'measures' });
        targets.push({ type: 'widget-data-zone', widgetId: w.id, zone: 'filters' });
      }
      targets.push({ type: 'filter-bar' });
      break;

    case 'widget-library':
      targets.push({ type: 'canvas-cell', row: 0, col: 0 });
      break;

    case 'existing-widget':
      targets.push({ type: 'canvas-cell', row: 0, col: 0 });
      for (const w of dashboardState.widgets) {
        if (w.id !== source.widgetId) {
          targets.push({ type: 'widget-swap', widgetId: w.id });
        }
      }
      break;

    case 'filter-chip':
      targets.push({ type: 'filter-bar' });
      break;
  }

  return targets;
}

/**
 * Infer a sensible widget type from a field's data type.
 */
function inferWidgetType(dataType: string): string {
  switch (dataType) {
    case 'number': return 'kpi-card';
    case 'date': return 'line-chart';
    default: return 'bar-chart';
  }
}

export function executeDrop(
  dashboardState: DashboardEditorState,
  source: DragSource,
  target: DropTarget,
): DashboardEditorState {
  if (source.type === 'field-palette' && target.type === 'canvas-cell') {
    // Auto-create widget from field
    const widgetType = inferWidgetType(source.dataType);
    const position = { row: target.row, col: target.col, colSpan: 2, rowSpan: 2 };
    let state = addWidget(dashboardState, widgetType, position);
    // Add field to the new widget's data config
    const newWidget = state.widgets[state.widgets.length - 1];
    if (newWidget) {
      const zone = source.dataType === 'number' ? 'measures' : 'dimensions';
      const dataConfig = { ...newWidget.dataConfig };
      if (zone === 'measures') {
        dataConfig.measures = [...dataConfig.measures, { field: source.field, aggregation: 'sum' as const }];
      } else {
        dataConfig.dimensions = [...dataConfig.dimensions, { field: source.field }];
      }
      state = updateWidgetData(state, newWidget.id, dataConfig);
    }
    return state;
  }

  if (source.type === 'field-palette' && target.type === 'widget-data-zone') {
    const widget = dashboardState.widgets.find(w => w.id === target.widgetId);
    if (!widget) return dashboardState;
    const dataConfig = {
      dimensions: [...widget.dataConfig.dimensions],
      measures: [...widget.dataConfig.measures],
      filters: [...widget.dataConfig.filters],
    };
    if (target.zone === 'dimensions') {
      dataConfig.dimensions = [...dataConfig.dimensions, { field: source.field }];
    } else if (target.zone === 'measures') {
      dataConfig.measures = [...dataConfig.measures, { field: source.field, aggregation: 'sum' as const }];
    } else if (target.zone === 'filters') {
      dataConfig.filters = [...dataConfig.filters, { field: source.field, operator: 'eq' as const, value: null }];
    }
    return updateWidgetData(dashboardState, target.widgetId, dataConfig);
  }

  if (source.type === 'widget-library' && target.type === 'canvas-cell') {
    const position = { row: target.row, col: target.col, colSpan: 2, rowSpan: 2 };
    return addWidget(dashboardState, source.widgetType, position);
  }

  if (source.type === 'existing-widget' && target.type === 'canvas-cell') {
    return moveWidget(dashboardState, source.widgetId, {
      row: target.row,
      col: target.col,
      colSpan: 2,
      rowSpan: 2,
    });
  }

  if (source.type === 'existing-widget' && target.type === 'widget-swap') {
    // Swap positions between source widget and target widget
    const sourceWidget = dashboardState.widgets.find(w => w.id === source.widgetId);
    const targetWidget = dashboardState.widgets.find(w => w.id === target.widgetId);
    if (!sourceWidget || !targetWidget) return dashboardState;

    let state = moveWidget(dashboardState, source.widgetId, targetWidget.position);
    state = moveWidget(state, target.widgetId, sourceWidget.position);
    return state;
  }

  // Default: no-op for unhandled combos
  return dashboardState;
}
