/**
 * @phozart/phz-workspace — Cell Display State Machine (7A-B)
 *
 * State management for the "Cell Display" section in column configuration.
 * Controls whether a column uses default text rendering or a micro-widget
 * renderer, and which display mode / data bindings are selected.
 *
 * Pure functions only — no DOM, no Lit, no side effects.
 */

import type {
  MicroWidgetDisplayMode,
  MicroWidgetType,
  MicroWidgetCellConfig,
} from '@phozart/phz-shared/types';

// ========================================================================
// CellDisplayState
// ========================================================================

/**
 * State for the cell display configuration panel.
 */
export interface CellDisplayState {
  /** Whether this column uses a micro-widget or default text rendering. */
  rendererType: 'default' | 'micro-widget';
  /** Selected micro-widget type (only meaningful when rendererType is 'micro-widget'). */
  widgetType: MicroWidgetType;
  /** Selected display mode. */
  displayMode: MicroWidgetDisplayMode;
  /** Data binding configuration. */
  dataBinding: {
    valueField: string;
    compareField?: string;
    sparklineField?: string;
  };
  /** Threshold configuration for status coloring. */
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  /** Available widget types for this column (provided by the shell). */
  availableWidgetTypes: MicroWidgetType[];
}

// ========================================================================
// Column-width thresholds for mode availability
// ========================================================================

/** Minimum column width for any micro-widget mode. */
const MIN_WIDTH = 60;
/** Minimum width for sparkline mode. */
const SPARKLINE_MIN_WIDTH = 80;
/** Minimum width for delta mode. */
const DELTA_MIN_WIDTH = 100;

// ========================================================================
// initialCellDisplayState
// ========================================================================

/**
 * Create the initial cell display state for a column.
 *
 * @param columnField - The column's field name (used as default valueField).
 * @param availableWidgetTypes - Widget types available for this column.
 * @returns A fresh CellDisplayState in 'default' renderer mode.
 */
export function initialCellDisplayState(
  columnField: string,
  availableWidgetTypes: MicroWidgetType[] = ['trend-line', 'gauge', 'kpi-card', 'scorecard'],
): CellDisplayState {
  return {
    rendererType: 'default',
    widgetType: 'kpi-card',
    displayMode: 'value-only',
    dataBinding: {
      valueField: columnField,
    },
    thresholds: undefined,
    availableWidgetTypes,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Switch between 'default' text rendering and 'micro-widget' rendering.
 */
export function setRendererType(
  state: CellDisplayState,
  type: 'default' | 'micro-widget',
): CellDisplayState {
  return { ...state, rendererType: type };
}

/**
 * Set the micro-widget type.
 */
export function setWidgetType(
  state: CellDisplayState,
  widgetType: MicroWidgetType,
): CellDisplayState {
  return { ...state, widgetType };
}

/**
 * Set the display mode.
 */
export function setDisplayMode(
  state: CellDisplayState,
  mode: MicroWidgetDisplayMode,
): CellDisplayState {
  return { ...state, displayMode: mode };
}

/**
 * Update data binding configuration.
 */
export function setDataBinding(
  state: CellDisplayState,
  binding: {
    valueField: string;
    compareField?: string;
    sparklineField?: string;
  },
): CellDisplayState {
  return { ...state, dataBinding: { ...binding } };
}

/**
 * Update threshold configuration for status coloring.
 */
export function setThresholds(
  state: CellDisplayState,
  thresholds?: { warning?: number; critical?: number },
): CellDisplayState {
  return {
    ...state,
    thresholds: thresholds ? { ...thresholds } : undefined,
  };
}

// ========================================================================
// getAvailableModesForColumnWidth
// ========================================================================

/**
 * Given the current state and a column width, return the display modes
 * that can render at that width. Returns an empty array if the column
 * is too narrow for any mode.
 *
 * Width rules:
 * - <60px: no modes available
 * - 60-79px: value-only, gauge-arc
 * - 80-99px: value-only, gauge-arc, sparkline
 * - 100px+: all modes (value-only, sparkline, delta, gauge-arc)
 */
export function getAvailableModesForColumnWidth(
  _state: CellDisplayState,
  width: number,
): MicroWidgetDisplayMode[] {
  if (width < MIN_WIDTH) {
    return [];
  }

  const modes: MicroWidgetDisplayMode[] = ['value-only', 'gauge-arc'];

  if (width >= SPARKLINE_MIN_WIDTH) {
    modes.push('sparkline');
  }

  if (width >= DELTA_MIN_WIDTH) {
    modes.push('delta');
  }

  return modes;
}

// ========================================================================
// toMicroWidgetCellConfig
// ========================================================================

/**
 * Convert the cell display state to a MicroWidgetCellConfig for the renderer.
 * Returns null if the renderer type is 'default'.
 */
export function toMicroWidgetCellConfig(
  state: CellDisplayState,
): MicroWidgetCellConfig | null {
  if (state.rendererType === 'default') {
    return null;
  }

  return {
    widgetType: state.widgetType,
    dataBinding: { ...state.dataBinding },
    displayMode: state.displayMode,
    thresholds: state.thresholds ? { ...state.thresholds } : undefined,
  };
}
