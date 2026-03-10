/**
 * @phozart/phz-editor — Dashboard Edit State (B-2.06)
 *
 * State machine for dashboard editing: widget placement, drag-drop,
 * grid layout configuration, widget config panel, and measure palette.
 */

import type { DashboardWidget, WidgetPosition } from '@phozart/phz-shared/types';

// ========================================================================
// GridLayout — defines the dashboard grid
// ========================================================================

export interface GridLayout {
  columns: number;
  rows: number;
  gap: number;
}

// ========================================================================
// DragState — transient drag-and-drop state
// ========================================================================

export interface DragState {
  dragging: boolean;
  widgetId: string | null;
  /** Source position (col, row) of the widget being dragged. */
  sourceCol: number;
  sourceRow: number;
  /** Current drop-target position. */
  targetCol: number;
  targetRow: number;
}

// ========================================================================
// DashboardEditState
// ========================================================================

export interface DashboardEditState {
  /** The dashboard artifact ID being edited. */
  dashboardId: string;
  /** Dashboard title. */
  title: string;
  /** Dashboard description. */
  description: string;
  /** All widgets on the dashboard. */
  widgets: DashboardWidget[];
  /** The ID of the currently selected widget (for config panel). */
  selectedWidgetId: string | null;
  /** Grid layout configuration. */
  gridLayout: GridLayout;
  /** Current drag-and-drop state (null when not dragging). */
  dragState: DragState | null;
  /** Whether the widget config panel is open. */
  configPanelOpen: boolean;
  /** Whether the measure palette is open. */
  measurePaletteOpen: boolean;
  /** Whether the dashboard has unsaved changes. */
  dirty: boolean;
}

// ========================================================================
// Factory
// ========================================================================

export function createDashboardEditState(
  dashboardId: string,
  overrides?: Partial<DashboardEditState>,
): DashboardEditState {
  return {
    dashboardId,
    title: '',
    description: '',
    widgets: [],
    selectedWidgetId: null,
    gridLayout: { columns: 12, rows: 8, gap: 16 },
    dragState: null,
    configPanelOpen: false,
    measurePaletteOpen: false,
    dirty: false,
    ...overrides,
  };
}

// ========================================================================
// Widget operations
// ========================================================================

/**
 * Add a widget to the dashboard.
 */
export function addWidget(
  state: DashboardEditState,
  widget: DashboardWidget,
): DashboardEditState {
  return {
    ...state,
    widgets: [...state.widgets, widget],
    dirty: true,
  };
}

/**
 * Remove a widget by ID.
 */
export function removeWidget(
  state: DashboardEditState,
  widgetId: string,
): DashboardEditState {
  const widgets = state.widgets.filter(w => w.id !== widgetId);
  return {
    ...state,
    widgets,
    selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
    configPanelOpen: state.selectedWidgetId === widgetId ? false : state.configPanelOpen,
    dirty: true,
  };
}

/**
 * Update a widget's configuration.
 */
export function updateWidgetConfig(
  state: DashboardEditState,
  widgetId: string,
  config: Record<string, unknown>,
): DashboardEditState {
  const widgets = state.widgets.map(w =>
    w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w,
  );
  return { ...state, widgets, dirty: true };
}

/**
 * Move a widget to a new position.
 */
export function moveWidget(
  state: DashboardEditState,
  widgetId: string,
  position: WidgetPosition,
): DashboardEditState {
  const widgets = state.widgets.map(w =>
    w.id === widgetId ? { ...w, position } : w,
  );
  return { ...state, widgets, dirty: true };
}

/**
 * Resize a widget.
 */
export function resizeWidget(
  state: DashboardEditState,
  widgetId: string,
  colSpan: number,
  rowSpan: number,
): DashboardEditState {
  const widgets = state.widgets.map(w =>
    w.id === widgetId
      ? { ...w, position: { ...w.position, colSpan, rowSpan } }
      : w,
  );
  return { ...state, widgets, dirty: true };
}

// ========================================================================
// Selection
// ========================================================================

/**
 * Select a widget by ID and optionally open the config panel.
 */
export function selectWidget(
  state: DashboardEditState,
  widgetId: string | null,
  openConfigPanel?: boolean,
): DashboardEditState {
  return {
    ...state,
    selectedWidgetId: widgetId,
    configPanelOpen: openConfigPanel ?? (widgetId !== null),
  };
}

/**
 * Deselect the current widget and close the config panel.
 */
export function deselectWidget(state: DashboardEditState): DashboardEditState {
  return {
    ...state,
    selectedWidgetId: null,
    configPanelOpen: false,
  };
}

// ========================================================================
// Drag-and-drop
// ========================================================================

/**
 * Start dragging a widget.
 */
export function startDrag(
  state: DashboardEditState,
  widgetId: string,
): DashboardEditState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;

  return {
    ...state,
    dragState: {
      dragging: true,
      widgetId,
      sourceCol: widget.position.col,
      sourceRow: widget.position.row,
      targetCol: widget.position.col,
      targetRow: widget.position.row,
    },
  };
}

/**
 * Update the drag target position.
 */
export function updateDragTarget(
  state: DashboardEditState,
  targetCol: number,
  targetRow: number,
): DashboardEditState {
  if (!state.dragState) return state;

  return {
    ...state,
    dragState: { ...state.dragState, targetCol, targetRow },
  };
}

/**
 * Complete the drag: move the widget to the target position and clear drag state.
 */
export function endDrag(state: DashboardEditState): DashboardEditState {
  if (!state.dragState?.widgetId) return { ...state, dragState: null };

  const { widgetId, targetCol, targetRow } = state.dragState;
  const widgets = state.widgets.map(w =>
    w.id === widgetId
      ? { ...w, position: { ...w.position, col: targetCol, row: targetRow } }
      : w,
  );

  return {
    ...state,
    widgets,
    dragState: null,
    dirty: true,
  };
}

/**
 * Cancel the drag and restore original positions.
 */
export function cancelDrag(state: DashboardEditState): DashboardEditState {
  return { ...state, dragState: null };
}

// ========================================================================
// Panel toggles
// ========================================================================

/**
 * Toggle the config panel open/closed.
 */
export function toggleConfigPanel(state: DashboardEditState): DashboardEditState {
  return { ...state, configPanelOpen: !state.configPanelOpen };
}

/**
 * Toggle the measure palette open/closed.
 */
export function toggleMeasurePalette(state: DashboardEditState): DashboardEditState {
  return { ...state, measurePaletteOpen: !state.measurePaletteOpen };
}

// ========================================================================
// Grid layout
// ========================================================================

/**
 * Update the grid layout configuration.
 */
export function setGridLayout(
  state: DashboardEditState,
  layout: Partial<GridLayout>,
): DashboardEditState {
  return {
    ...state,
    gridLayout: { ...state.gridLayout, ...layout },
    dirty: true,
  };
}

// ========================================================================
// Dashboard metadata
// ========================================================================

/**
 * Update the dashboard title.
 */
export function setDashboardTitle(state: DashboardEditState, title: string): DashboardEditState {
  return { ...state, title, dirty: true };
}

/**
 * Update the dashboard description.
 */
export function setDashboardDescription(
  state: DashboardEditState,
  description: string,
): DashboardEditState {
  return { ...state, description, dirty: true };
}

/**
 * Mark the dashboard as saved (dirty = false).
 */
export function markDashboardSaved(state: DashboardEditState): DashboardEditState {
  return { ...state, dirty: false };
}
