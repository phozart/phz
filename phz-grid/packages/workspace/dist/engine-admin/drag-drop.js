/**
 * @phozart/engine-admin — Drag-and-Drop Layout Utilities
 *
 * Pure functions for widget repositioning logic.
 * No DOM dependencies — used by PhzDashboardBuilder for drag-drop operations.
 */
/**
 * Swap the positions of two widgets in the layout.
 * Returns a new array; does not mutate the input.
 */
export function swapWidgetPositions(widgets, sourceId, targetId) {
    const sourceIdx = widgets.findIndex(w => w.id === sourceId);
    const targetIdx = widgets.findIndex(w => w.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1)
        return widgets;
    return widgets.map((w, i) => {
        if (i === sourceIdx) {
            return { ...w, position: { ...widgets[targetIdx].position } };
        }
        if (i === targetIdx) {
            return { ...w, position: { ...widgets[sourceIdx].position } };
        }
        return w;
    });
}
/**
 * Move a widget to a specific grid position (row, col).
 * Preserves rowSpan and colSpan. Returns a new array.
 */
export function moveWidgetToPosition(widgets, widgetId, target) {
    const idx = widgets.findIndex(w => w.id === widgetId);
    if (idx === -1)
        return widgets;
    return widgets.map((w, i) => {
        if (i !== idx)
            return w;
        return {
            ...w,
            position: { ...w.position, row: target.row, col: target.col },
        };
    });
}
/**
 * Recalculate grid positions for all widgets based on their array order
 * and the number of layout columns. Assigns sequential row/col coordinates.
 */
export function recalculateGridPositions(widgets, layoutColumns) {
    return widgets.map((w, i) => ({
        ...w,
        position: {
            ...w.position,
            row: Math.floor(i / layoutColumns),
            col: i % layoutColumns,
        },
    }));
}
/**
 * Build a layout-change event detail payload from current widget positions.
 */
export function buildLayoutChangeDetail(widgets) {
    return {
        positions: widgets.map(w => ({
            widgetId: w.id,
            row: w.position.row,
            col: w.position.col,
            rowSpan: w.position.rowSpan,
            colSpan: w.position.colSpan,
        })),
    };
}
//# sourceMappingURL=drag-drop.js.map