/**
 * @phozart/phz-editor — Dashboard Edit State (B-2.06)
 *
 * State machine for dashboard editing: widget placement, drag-drop,
 * grid layout configuration, widget config panel, and measure palette.
 */
// ========================================================================
// Factory
// ========================================================================
export function createDashboardEditState(dashboardId, overrides) {
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
export function addWidget(state, widget) {
    return {
        ...state,
        widgets: [...state.widgets, widget],
        dirty: true,
    };
}
/**
 * Remove a widget by ID.
 */
export function removeWidget(state, widgetId) {
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
export function updateWidgetConfig(state, widgetId, config) {
    const widgets = state.widgets.map(w => w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w);
    return { ...state, widgets, dirty: true };
}
/**
 * Move a widget to a new position.
 */
export function moveWidget(state, widgetId, position) {
    const widgets = state.widgets.map(w => w.id === widgetId ? { ...w, position } : w);
    return { ...state, widgets, dirty: true };
}
/**
 * Resize a widget.
 */
export function resizeWidget(state, widgetId, colSpan, rowSpan) {
    const widgets = state.widgets.map(w => w.id === widgetId
        ? { ...w, position: { ...w.position, colSpan, rowSpan } }
        : w);
    return { ...state, widgets, dirty: true };
}
// ========================================================================
// Selection
// ========================================================================
/**
 * Select a widget by ID and optionally open the config panel.
 */
export function selectWidget(state, widgetId, openConfigPanel) {
    return {
        ...state,
        selectedWidgetId: widgetId,
        configPanelOpen: openConfigPanel ?? (widgetId !== null),
    };
}
/**
 * Deselect the current widget and close the config panel.
 */
export function deselectWidget(state) {
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
export function startDrag(state, widgetId) {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget)
        return state;
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
export function updateDragTarget(state, targetCol, targetRow) {
    if (!state.dragState)
        return state;
    return {
        ...state,
        dragState: { ...state.dragState, targetCol, targetRow },
    };
}
/**
 * Complete the drag: move the widget to the target position and clear drag state.
 */
export function endDrag(state) {
    if (!state.dragState?.widgetId)
        return { ...state, dragState: null };
    const { widgetId, targetCol, targetRow } = state.dragState;
    const widgets = state.widgets.map(w => w.id === widgetId
        ? { ...w, position: { ...w.position, col: targetCol, row: targetRow } }
        : w);
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
export function cancelDrag(state) {
    return { ...state, dragState: null };
}
// ========================================================================
// Panel toggles
// ========================================================================
/**
 * Toggle the config panel open/closed.
 */
export function toggleConfigPanel(state) {
    return { ...state, configPanelOpen: !state.configPanelOpen };
}
/**
 * Toggle the measure palette open/closed.
 */
export function toggleMeasurePalette(state) {
    return { ...state, measurePaletteOpen: !state.measurePaletteOpen };
}
// ========================================================================
// Grid layout
// ========================================================================
/**
 * Update the grid layout configuration.
 */
export function setGridLayout(state, layout) {
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
export function setDashboardTitle(state, title) {
    return { ...state, title, dirty: true };
}
/**
 * Update the dashboard description.
 */
export function setDashboardDescription(state, description) {
    return { ...state, description, dirty: true };
}
/**
 * Mark the dashboard as saved (dirty = false).
 */
export function markDashboardSaved(state) {
    return { ...state, dirty: false };
}
//# sourceMappingURL=dashboard-edit-state.js.map