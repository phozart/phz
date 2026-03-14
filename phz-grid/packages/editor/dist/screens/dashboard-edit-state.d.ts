/**
 * @phozart/editor — Dashboard Edit State (B-2.06)
 *
 * State machine for dashboard editing: widget placement, drag-drop,
 * grid layout configuration, widget config panel, and measure palette.
 */
import type { DashboardWidget, WidgetPosition } from '@phozart/shared/types';
export interface GridLayout {
    columns: number;
    rows: number;
    gap: number;
}
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
export declare function createDashboardEditState(dashboardId: string, overrides?: Partial<DashboardEditState>): DashboardEditState;
/**
 * Add a widget to the dashboard.
 */
export declare function addWidget(state: DashboardEditState, widget: DashboardWidget): DashboardEditState;
/**
 * Remove a widget by ID.
 */
export declare function removeWidget(state: DashboardEditState, widgetId: string): DashboardEditState;
/**
 * Update a widget's configuration.
 */
export declare function updateWidgetConfig(state: DashboardEditState, widgetId: string, config: Record<string, unknown>): DashboardEditState;
/**
 * Move a widget to a new position.
 */
export declare function moveWidget(state: DashboardEditState, widgetId: string, position: WidgetPosition): DashboardEditState;
/**
 * Resize a widget.
 */
export declare function resizeWidget(state: DashboardEditState, widgetId: string, colSpan: number, rowSpan: number): DashboardEditState;
/**
 * Select a widget by ID and optionally open the config panel.
 */
export declare function selectWidget(state: DashboardEditState, widgetId: string | null, openConfigPanel?: boolean): DashboardEditState;
/**
 * Deselect the current widget and close the config panel.
 */
export declare function deselectWidget(state: DashboardEditState): DashboardEditState;
/**
 * Start dragging a widget.
 */
export declare function startDrag(state: DashboardEditState, widgetId: string): DashboardEditState;
/**
 * Update the drag target position.
 */
export declare function updateDragTarget(state: DashboardEditState, targetCol: number, targetRow: number): DashboardEditState;
/**
 * Complete the drag: move the widget to the target position and clear drag state.
 */
export declare function endDrag(state: DashboardEditState): DashboardEditState;
/**
 * Cancel the drag and restore original positions.
 */
export declare function cancelDrag(state: DashboardEditState): DashboardEditState;
/**
 * Toggle the config panel open/closed.
 */
export declare function toggleConfigPanel(state: DashboardEditState): DashboardEditState;
/**
 * Toggle the measure palette open/closed.
 */
export declare function toggleMeasurePalette(state: DashboardEditState): DashboardEditState;
/**
 * Update the grid layout configuration.
 */
export declare function setGridLayout(state: DashboardEditState, layout: Partial<GridLayout>): DashboardEditState;
/**
 * Update the dashboard title.
 */
export declare function setDashboardTitle(state: DashboardEditState, title: string): DashboardEditState;
/**
 * Update the dashboard description.
 */
export declare function setDashboardDescription(state: DashboardEditState, description: string): DashboardEditState;
/**
 * Mark the dashboard as saved (dirty = false).
 */
export declare function markDashboardSaved(state: DashboardEditState): DashboardEditState;
//# sourceMappingURL=dashboard-edit-state.d.ts.map