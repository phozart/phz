import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialDragDropState,
  startDrag,
  hoverTarget,
  cancelDrag,
  computeValidTargets,
  executeDrop,
} from '../drag-drop-state.js';
import type { DragSource, DropTarget } from '../drag-drop-state.js';
import {
  initialDashboardEditorState,
  addWidget,
  _resetWidgetCounter,
} from '../dashboard-editor-state.js';
import type { DashboardEditorState } from '../dashboard-editor-state.js';

describe('DragDropState', () => {
  let dashState: DashboardEditorState;

  beforeEach(() => {
    _resetWidgetCounter();
    dashState = initialDashboardEditorState('test', 'ds-1');
  });

  describe('initialDragDropState', () => {
    it('has no dragging source', () => {
      const s = initialDragDropState();
      expect(s.dragging).toBeUndefined();
    });

    it('has no hovering target', () => {
      const s = initialDragDropState();
      expect(s.hovering).toBeUndefined();
    });

    it('has empty validTargets', () => {
      const s = initialDragDropState();
      expect(s.validTargets).toEqual([]);
    });
  });

  describe('startDrag', () => {
    it('sets dragging source', () => {
      const source: DragSource = { type: 'field-palette', field: 'revenue', dataType: 'number' };
      const s = startDrag(initialDragDropState(), source);
      expect(s.dragging).toEqual(source);
    });

    it('clears hovering on start', () => {
      let s = initialDragDropState();
      s = hoverTarget(s, { type: 'canvas-cell', row: 0, col: 0 });
      s = startDrag(s, { type: 'field-palette', field: 'x', dataType: 'string' });
      expect(s.hovering).toBeUndefined();
    });
  });

  describe('hoverTarget', () => {
    it('sets hovering target', () => {
      const target: DropTarget = { type: 'canvas-cell', row: 1, col: 2 };
      const s = hoverTarget(initialDragDropState(), target);
      expect(s.hovering).toEqual(target);
    });

    it('clears hovering with undefined', () => {
      let s = hoverTarget(initialDragDropState(), { type: 'canvas-cell', row: 0, col: 0 });
      s = hoverTarget(s, undefined);
      expect(s.hovering).toBeUndefined();
    });
  });

  describe('cancelDrag', () => {
    it('resets to initial state', () => {
      let s = startDrag(initialDragDropState(), { type: 'field-palette', field: 'x', dataType: 'string' });
      s = hoverTarget(s, { type: 'canvas-cell', row: 0, col: 0 });
      s = cancelDrag(s);
      expect(s.dragging).toBeUndefined();
      expect(s.hovering).toBeUndefined();
      expect(s.validTargets).toEqual([]);
    });
  });

  describe('computeValidTargets', () => {
    it('field-palette: includes canvas, widget zones, and filter bar', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const source: DragSource = { type: 'field-palette', field: 'revenue', dataType: 'number' };
      const targets = computeValidTargets(source, dashState);
      const types = targets.map(t => t.type);
      expect(types).toContain('canvas-cell');
      expect(types).toContain('widget-data-zone');
      expect(types).toContain('filter-bar');
    });

    it('field-palette: includes all three data zones per widget', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const wid = dashState.widgets[0].id;
      const source: DragSource = { type: 'field-palette', field: 'revenue', dataType: 'number' };
      const targets = computeValidTargets(source, dashState);
      const dataZones = targets.filter(
        t => t.type === 'widget-data-zone' && (t as { widgetId: string }).widgetId === wid,
      ) as Array<{ type: 'widget-data-zone'; widgetId: string; zone: string }>;
      const zones = dataZones.map(t => t.zone);
      expect(zones).toContain('dimensions');
      expect(zones).toContain('measures');
      expect(zones).toContain('filters');
    });

    it('widget-library: includes only canvas', () => {
      const source: DragSource = { type: 'widget-library', widgetType: 'bar-chart' };
      const targets = computeValidTargets(source, dashState);
      expect(targets).toHaveLength(1);
      expect(targets[0].type).toBe('canvas-cell');
    });

    it('existing-widget: includes canvas and swap targets (excluding self)', () => {
      dashState = addWidget(dashState, 'bar-chart');
      dashState = addWidget(dashState, 'kpi-card');
      const sourceWidgetId = dashState.widgets[0].id;
      const otherWidgetId = dashState.widgets[1].id;
      const source: DragSource = { type: 'existing-widget', widgetId: sourceWidgetId };
      const targets = computeValidTargets(source, dashState);
      const types = targets.map(t => t.type);
      expect(types).toContain('canvas-cell');
      expect(types).toContain('widget-swap');
      // Should not include self as swap target
      const swaps = targets.filter(t => t.type === 'widget-swap') as Array<{ type: 'widget-swap'; widgetId: string }>;
      const swapIds = swaps.map(t => t.widgetId);
      expect(swapIds).toContain(otherWidgetId);
      expect(swapIds).not.toContain(sourceWidgetId);
    });

    it('filter-chip: includes only filter bar', () => {
      const source: DragSource = { type: 'filter-chip', filterId: 'f-1' };
      const targets = computeValidTargets(source, dashState);
      expect(targets).toHaveLength(1);
      expect(targets[0].type).toBe('filter-bar');
    });
  });

  describe('executeDrop', () => {
    it('field on canvas: creates widget with data config set (number -> kpi-card with measure)', () => {
      const source: DragSource = { type: 'field-palette', field: 'revenue', dataType: 'number' };
      const target: DropTarget = { type: 'canvas-cell', row: 1, col: 2 };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe('kpi-card');
      expect(result.widgets[0].position.row).toBe(1);
      expect(result.widgets[0].position.col).toBe(2);
      expect(result.widgets[0].dataConfig.measures).toEqual([
        { field: 'revenue', aggregation: 'sum' },
      ]);
    });

    it('field on canvas: string field creates bar-chart with dimension', () => {
      const source: DragSource = { type: 'field-palette', field: 'category', dataType: 'string' };
      const target: DropTarget = { type: 'canvas-cell', row: 0, col: 0 };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].type).toBe('bar-chart');
      expect(result.widgets[0].dataConfig.dimensions).toEqual([{ field: 'category' }]);
    });

    it('field on canvas: date field creates line-chart with dimension', () => {
      const source: DragSource = { type: 'field-palette', field: 'created_at', dataType: 'date' };
      const target: DropTarget = { type: 'canvas-cell', row: 0, col: 0 };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].type).toBe('line-chart');
      expect(result.widgets[0].dataConfig.dimensions).toEqual([{ field: 'created_at' }]);
    });

    it('field on widget-data-zone dimensions: adds to dimensions', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const wid = dashState.widgets[0].id;
      const source: DragSource = { type: 'field-palette', field: 'region', dataType: 'string' };
      const target: DropTarget = { type: 'widget-data-zone', widgetId: wid, zone: 'dimensions' };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].dataConfig.dimensions).toEqual([{ field: 'region' }]);
    });

    it('field on widget-data-zone measures: adds measure with sum aggregation', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const wid = dashState.widgets[0].id;
      const source: DragSource = { type: 'field-palette', field: 'revenue', dataType: 'number' };
      const target: DropTarget = { type: 'widget-data-zone', widgetId: wid, zone: 'measures' };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].dataConfig.measures).toEqual([
        { field: 'revenue', aggregation: 'sum' },
      ]);
    });

    it('field on widget-data-zone filters: adds filter with eq operator', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const wid = dashState.widgets[0].id;
      const source: DragSource = { type: 'field-palette', field: 'status', dataType: 'string' };
      const target: DropTarget = { type: 'widget-data-zone', widgetId: wid, zone: 'filters' };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].dataConfig.filters).toEqual([
        { field: 'status', operator: 'eq', value: null },
      ]);
    });

    it('field on widget-data-zone: returns unchanged for non-existent widget', () => {
      const source: DragSource = { type: 'field-palette', field: 'x', dataType: 'string' };
      const target: DropTarget = { type: 'widget-data-zone', widgetId: 'no-such', zone: 'dimensions' };
      const result = executeDrop(dashState, source, target);
      expect(result).toBe(dashState);
    });

    it('widget-library on canvas: creates widget at target position', () => {
      const source: DragSource = { type: 'widget-library', widgetType: 'pie-chart' };
      const target: DropTarget = { type: 'canvas-cell', row: 3, col: 4 };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0].type).toBe('pie-chart');
      expect(result.widgets[0].position.row).toBe(3);
      expect(result.widgets[0].position.col).toBe(4);
    });

    it('existing-widget on canvas: moves widget', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const wid = dashState.widgets[0].id;
      const source: DragSource = { type: 'existing-widget', widgetId: wid };
      const target: DropTarget = { type: 'canvas-cell', row: 5, col: 5 };
      const result = executeDrop(dashState, source, target);
      expect(result.widgets[0].position.row).toBe(5);
      expect(result.widgets[0].position.col).toBe(5);
    });

    it('existing-widget on widget-swap: swaps positions', () => {
      dashState = addWidget(dashState, 'bar-chart', { row: 0, col: 0, colSpan: 2, rowSpan: 2 });
      dashState = addWidget(dashState, 'kpi-card', { row: 0, col: 2, colSpan: 1, rowSpan: 1 });
      const w1 = dashState.widgets[0];
      const w2 = dashState.widgets[1];
      const source: DragSource = { type: 'existing-widget', widgetId: w1.id };
      const target: DropTarget = { type: 'widget-swap', widgetId: w2.id };
      const result = executeDrop(dashState, source, target);
      const r1 = result.widgets.find(w => w.id === w1.id)!;
      const r2 = result.widgets.find(w => w.id === w2.id)!;
      expect(r1.position).toEqual(w2.position);
      expect(r2.position).toEqual(w1.position);
    });

    it('existing-widget on widget-swap: returns unchanged for non-existent source', () => {
      dashState = addWidget(dashState, 'bar-chart');
      const source: DragSource = { type: 'existing-widget', widgetId: 'no-such' };
      const target: DropTarget = { type: 'widget-swap', widgetId: dashState.widgets[0].id };
      const result = executeDrop(dashState, source, target);
      expect(result).toBe(dashState);
    });

    it('unhandled combo returns unchanged state', () => {
      const source: DragSource = { type: 'filter-chip', filterId: 'f-1' };
      const target: DropTarget = { type: 'canvas-cell', row: 0, col: 0 };
      const result = executeDrop(dashState, source, target);
      expect(result).toBe(dashState);
    });
  });
});
