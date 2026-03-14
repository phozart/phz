/**
 * @phozart/workspace — Cell Display State Machine (7A-B)
 *
 * State management for the "Cell Display" section in column configuration.
 * Controls whether a column uses default text rendering or a micro-widget
 * renderer, and which display mode / data bindings are selected.
 *
 * Pure functions only — no DOM, no Lit, no side effects.
 */
import type { MicroWidgetDisplayMode, MicroWidgetType, MicroWidgetCellConfig } from '@phozart/shared/types';
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
/**
 * Create the initial cell display state for a column.
 *
 * @param columnField - The column's field name (used as default valueField).
 * @param availableWidgetTypes - Widget types available for this column.
 * @returns A fresh CellDisplayState in 'default' renderer mode.
 */
export declare function initialCellDisplayState(columnField: string, availableWidgetTypes?: MicroWidgetType[]): CellDisplayState;
/**
 * Switch between 'default' text rendering and 'micro-widget' rendering.
 */
export declare function setRendererType(state: CellDisplayState, type: 'default' | 'micro-widget'): CellDisplayState;
/**
 * Set the micro-widget type.
 */
export declare function setWidgetType(state: CellDisplayState, widgetType: MicroWidgetType): CellDisplayState;
/**
 * Set the display mode.
 */
export declare function setDisplayMode(state: CellDisplayState, mode: MicroWidgetDisplayMode): CellDisplayState;
/**
 * Update data binding configuration.
 */
export declare function setDataBinding(state: CellDisplayState, binding: {
    valueField: string;
    compareField?: string;
    sparklineField?: string;
}): CellDisplayState;
/**
 * Update threshold configuration for status coloring.
 */
export declare function setThresholds(state: CellDisplayState, thresholds?: {
    warning?: number;
    critical?: number;
}): CellDisplayState;
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
export declare function getAvailableModesForColumnWidth(_state: CellDisplayState, width: number): MicroWidgetDisplayMode[];
/**
 * Convert the cell display state to a MicroWidgetCellConfig for the renderer.
 * Returns null if the renderer type is 'default'.
 */
export declare function toMicroWidgetCellConfig(state: CellDisplayState): MicroWidgetCellConfig | null;
//# sourceMappingURL=cell-display-state.d.ts.map