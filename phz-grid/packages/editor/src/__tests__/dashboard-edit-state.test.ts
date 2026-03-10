/**
 * Tests for Dashboard Edit State (B-2.06)
 */
import {
  createDashboardEditState,
  addWidget,
  removeWidget,
  updateWidgetConfig,
  moveWidget,
  resizeWidget,
  selectWidget,
  deselectWidget,
  startDrag,
  updateDragTarget,
  endDrag,
  cancelDrag,
  toggleConfigPanel,
  toggleMeasurePalette,
  setGridLayout,
  setDashboardTitle,
  setDashboardDescription,
  markDashboardSaved,
} from '../screens/dashboard-edit-state.js';
import type { DashboardWidget } from '@phozart/phz-shared/types';

const WIDGET: DashboardWidget = {
  id: 'w1',
  widgetType: 'bar-chart',
  position: { col: 0, row: 0, colSpan: 4, rowSpan: 2 },
  config: { title: 'Revenue' },
  visible: true,
};

const WIDGET_2: DashboardWidget = {
  id: 'w2',
  widgetType: 'kpi-card',
  position: { col: 4, row: 0, colSpan: 2, rowSpan: 1 },
  config: { metric: 'users' },
  visible: true,
};

describe('createDashboardEditState', () => {
  it('creates with defaults', () => {
    const state = createDashboardEditState('dash-1');
    expect(state.dashboardId).toBe('dash-1');
    expect(state.widgets).toEqual([]);
    expect(state.selectedWidgetId).toBeNull();
    expect(state.gridLayout).toEqual({ columns: 12, rows: 8, gap: 16 });
    expect(state.dragState).toBeNull();
    expect(state.configPanelOpen).toBe(false);
    expect(state.measurePaletteOpen).toBe(false);
    expect(state.dirty).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createDashboardEditState('dash-1', {
      widgets: [WIDGET],
      title: 'My Dashboard',
    });
    expect(state.widgets).toHaveLength(1);
    expect(state.title).toBe('My Dashboard');
  });
});

describe('widget operations', () => {
  it('adds a widget', () => {
    let state = createDashboardEditState('dash-1');
    state = addWidget(state, WIDGET);
    expect(state.widgets).toHaveLength(1);
    expect(state.widgets[0].id).toBe('w1');
    expect(state.dirty).toBe(true);
  });

  it('removes a widget', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET, WIDGET_2] });
    state = removeWidget(state, 'w1');
    expect(state.widgets).toHaveLength(1);
    expect(state.widgets[0].id).toBe('w2');
    expect(state.dirty).toBe(true);
  });

  it('deselects widget on remove if selected', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = selectWidget(state, 'w1');
    state = removeWidget(state, 'w1');
    expect(state.selectedWidgetId).toBeNull();
    expect(state.configPanelOpen).toBe(false);
  });

  it('updates widget config', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = updateWidgetConfig(state, 'w1', { title: 'Updated' });
    expect(state.widgets[0].config.title).toBe('Updated');
    expect(state.dirty).toBe(true);
  });

  it('moves a widget', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = moveWidget(state, 'w1', { col: 2, row: 3, colSpan: 4, rowSpan: 2 });
    expect(state.widgets[0].position.col).toBe(2);
    expect(state.widgets[0].position.row).toBe(3);
    expect(state.dirty).toBe(true);
  });

  it('resizes a widget', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = resizeWidget(state, 'w1', 6, 3);
    expect(state.widgets[0].position.colSpan).toBe(6);
    expect(state.widgets[0].position.rowSpan).toBe(3);
    expect(state.dirty).toBe(true);
  });
});

describe('selection', () => {
  it('selects a widget and opens config panel', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = selectWidget(state, 'w1');
    expect(state.selectedWidgetId).toBe('w1');
    expect(state.configPanelOpen).toBe(true);
  });

  it('selects without opening config panel', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = selectWidget(state, 'w1', false);
    expect(state.selectedWidgetId).toBe('w1');
    expect(state.configPanelOpen).toBe(false);
  });

  it('deselects', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = selectWidget(state, 'w1');
    state = deselectWidget(state);
    expect(state.selectedWidgetId).toBeNull();
    expect(state.configPanelOpen).toBe(false);
  });
});

describe('drag-and-drop', () => {
  it('starts drag on existing widget', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = startDrag(state, 'w1');
    expect(state.dragState).not.toBeNull();
    expect(state.dragState!.widgetId).toBe('w1');
    expect(state.dragState!.sourceCol).toBe(0);
    expect(state.dragState!.sourceRow).toBe(0);
  });

  it('returns same state when starting drag on nonexistent widget', () => {
    const state = createDashboardEditState('dash-1');
    const same = startDrag(state, 'nonexistent');
    expect(same.dragState).toBeNull();
  });

  it('updates drag target', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = startDrag(state, 'w1');
    state = updateDragTarget(state, 3, 2);
    expect(state.dragState!.targetCol).toBe(3);
    expect(state.dragState!.targetRow).toBe(2);
  });

  it('updateDragTarget is no-op when not dragging', () => {
    const state = createDashboardEditState('dash-1');
    const same = updateDragTarget(state, 1, 1);
    expect(same).toBe(state);
  });

  it('endDrag moves widget to target position', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = startDrag(state, 'w1');
    state = updateDragTarget(state, 5, 3);
    state = endDrag(state);
    expect(state.dragState).toBeNull();
    expect(state.widgets[0].position.col).toBe(5);
    expect(state.widgets[0].position.row).toBe(3);
    expect(state.dirty).toBe(true);
  });

  it('cancelDrag clears drag state without moving', () => {
    let state = createDashboardEditState('dash-1', { widgets: [WIDGET] });
    state = startDrag(state, 'w1');
    state = updateDragTarget(state, 5, 3);
    state = cancelDrag(state);
    expect(state.dragState).toBeNull();
    expect(state.widgets[0].position.col).toBe(0); // unchanged
  });
});

describe('panel toggles', () => {
  it('toggles config panel', () => {
    let state = createDashboardEditState('dash-1');
    state = toggleConfigPanel(state);
    expect(state.configPanelOpen).toBe(true);
    state = toggleConfigPanel(state);
    expect(state.configPanelOpen).toBe(false);
  });

  it('toggles measure palette', () => {
    let state = createDashboardEditState('dash-1');
    state = toggleMeasurePalette(state);
    expect(state.measurePaletteOpen).toBe(true);
    state = toggleMeasurePalette(state);
    expect(state.measurePaletteOpen).toBe(false);
  });
});

describe('grid layout', () => {
  it('updates grid layout', () => {
    let state = createDashboardEditState('dash-1');
    state = setGridLayout(state, { columns: 24, gap: 8 });
    expect(state.gridLayout.columns).toBe(24);
    expect(state.gridLayout.gap).toBe(8);
    expect(state.gridLayout.rows).toBe(8); // unchanged
    expect(state.dirty).toBe(true);
  });
});

describe('metadata', () => {
  it('sets title', () => {
    let state = createDashboardEditState('dash-1');
    state = setDashboardTitle(state, 'Revenue Dashboard');
    expect(state.title).toBe('Revenue Dashboard');
    expect(state.dirty).toBe(true);
  });

  it('sets description', () => {
    let state = createDashboardEditState('dash-1');
    state = setDashboardDescription(state, 'Q4 revenue metrics');
    expect(state.description).toBe('Q4 revenue metrics');
    expect(state.dirty).toBe(true);
  });

  it('marks as saved', () => {
    let state = createDashboardEditState('dash-1');
    state = setDashboardTitle(state, 'x');
    expect(state.dirty).toBe(true);
    state = markDashboardSaved(state);
    expect(state.dirty).toBe(false);
  });
});
