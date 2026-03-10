/**
 * @phozart/phz-workspace — Cell Display State Machine (7A-B)
 *
 * State management for the "Cell Display" section in column configuration.
 * Controls whether a column uses default text rendering or a micro-widget
 * renderer, and which display mode / data bindings are selected.
 *
 * Pure functions only — no DOM, no Lit, no side effects.
 */
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
export function initialCellDisplayState(columnField, availableWidgetTypes = ['trend-line', 'gauge', 'kpi-card', 'scorecard']) {
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
export function setRendererType(state, type) {
    return { ...state, rendererType: type };
}
/**
 * Set the micro-widget type.
 */
export function setWidgetType(state, widgetType) {
    return { ...state, widgetType };
}
/**
 * Set the display mode.
 */
export function setDisplayMode(state, mode) {
    return { ...state, displayMode: mode };
}
/**
 * Update data binding configuration.
 */
export function setDataBinding(state, binding) {
    return { ...state, dataBinding: { ...binding } };
}
/**
 * Update threshold configuration for status coloring.
 */
export function setThresholds(state, thresholds) {
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
export function getAvailableModesForColumnWidth(_state, width) {
    if (width < MIN_WIDTH) {
        return [];
    }
    const modes = ['value-only', 'gauge-arc'];
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
export function toMicroWidgetCellConfig(state) {
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
//# sourceMappingURL=cell-display-state.js.map