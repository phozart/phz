/**
 * @phozart/workspace — Canvas Interaction State (Canvas Phase 1D)
 *
 * Tracks the visual interaction layer — what the user sees during
 * drag/resize/select operations on the freeform canvas.
 * Pure functions, no DOM dependency.
 */
// ========================================================================
// Factory
// ========================================================================
export function initialCanvasInteractionState() {
    return {
        mode: 'idle',
        snapGuides: [],
        showGridDots: true,
    };
}
// ========================================================================
// Mode transitions
// ========================================================================
export function enterCanvasDragMode(state, ghost) {
    return {
        ...state,
        mode: 'dragging',
        ghostPlacement: ghost,
    };
}
export function enterCanvasResizeMode(state, ghost) {
    return {
        ...state,
        mode: 'resizing',
        ghostPlacement: ghost,
    };
}
export function enterCanvasSelectMode(state, startCol, startRow) {
    return {
        ...state,
        mode: 'selecting-area',
        selectionRect: { startCol, startRow, endCol: startCol, endRow: startRow },
    };
}
export function enterCanvasPanMode(state) {
    return { ...state, mode: 'panning' };
}
export function exitCanvasInteraction(state) {
    return {
        ...state,
        mode: 'idle',
        snapGuides: [],
        selectionRect: undefined,
        ghostPlacement: undefined,
    };
}
// ========================================================================
// Ghost placement update
// ========================================================================
export function updateCanvasGhost(state, ghost) {
    if (state.mode !== 'dragging' && state.mode !== 'resizing')
        return state;
    return { ...state, ghostPlacement: ghost };
}
// ========================================================================
// Snap guides
// ========================================================================
export function computeCanvasSnapGuides(widgets, movingWidget) {
    const guides = [];
    const movingLeft = movingWidget.col;
    const movingRight = movingWidget.col + movingWidget.colSpan;
    const movingTop = movingWidget.row;
    const movingBottom = movingWidget.row + movingWidget.rowSpan;
    const movingCenterH = movingWidget.col + movingWidget.colSpan / 2;
    const movingCenterV = movingWidget.row + movingWidget.rowSpan / 2;
    for (const w of widgets) {
        if (w.id === movingWidget.id)
            continue;
        const wLeft = w.col;
        const wRight = w.col + w.colSpan;
        const wTop = w.row;
        const wBottom = w.row + w.rowSpan;
        const wCenterH = w.col + w.colSpan / 2;
        const wCenterV = w.row + w.rowSpan / 2;
        // Vertical guides (horizontal alignment)
        if (movingLeft === wLeft)
            guides.push({ axis: 'vertical', position: wLeft });
        if (movingRight === wRight)
            guides.push({ axis: 'vertical', position: wRight });
        if (movingLeft === wRight)
            guides.push({ axis: 'vertical', position: wRight });
        if (movingRight === wLeft)
            guides.push({ axis: 'vertical', position: wLeft });
        if (Math.abs(movingCenterH - wCenterH) < 1)
            guides.push({ axis: 'vertical', position: wCenterH });
        // Horizontal guides (vertical alignment)
        if (movingTop === wTop)
            guides.push({ axis: 'horizontal', position: wTop });
        if (movingBottom === wBottom)
            guides.push({ axis: 'horizontal', position: wBottom });
        if (movingTop === wBottom)
            guides.push({ axis: 'horizontal', position: wBottom });
        if (movingBottom === wTop)
            guides.push({ axis: 'horizontal', position: wTop });
        if (Math.abs(movingCenterV - wCenterV) < 1)
            guides.push({ axis: 'horizontal', position: wCenterV });
    }
    // Deduplicate
    const seen = new Set();
    return guides.filter(g => {
        const key = `${g.axis}:${g.position}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
export function setCanvasSnapGuides(state, guides) {
    return { ...state, snapGuides: guides };
}
// ========================================================================
// Selection rectangle
// ========================================================================
export function updateCanvasSelectionRect(state, endCol, endRow) {
    if (state.mode !== 'selecting-area' || !state.selectionRect)
        return state;
    return {
        ...state,
        selectionRect: { ...state.selectionRect, endCol, endRow },
    };
}
export function getWidgetsInCanvasSelectionRect(widgets, rect) {
    // Normalize rect (handle negative-direction selection)
    const minCol = Math.min(rect.startCol, rect.endCol);
    const maxCol = Math.max(rect.startCol, rect.endCol);
    const minRow = Math.min(rect.startRow, rect.endRow);
    const maxRow = Math.max(rect.startRow, rect.endRow);
    return widgets
        .filter(w => {
        // Widget must overlap with rect
        const wRight = w.col + w.colSpan;
        const wBottom = w.row + w.rowSpan;
        return w.col < maxCol && wRight > minCol && w.row < maxRow && wBottom > minRow;
    })
        .map(w => w.id);
}
// ========================================================================
// Grid dots
// ========================================================================
export function toggleCanvasGridDots(state) {
    return { ...state, showGridDots: !state.showGridDots };
}
export function setCanvasGridDots(state, show) {
    return { ...state, showGridDots: show };
}
//# sourceMappingURL=canvas-interaction-state.js.map