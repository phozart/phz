/**
 * @phozart/workspace — Canvas Toolbar State (Canvas Phase 4A)
 *
 * State machine for the floating canvas toolbar.
 * Controls zoom, grid snap, grid dots, alignment buttons, and canvas mode.
 */
export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.5, 2];
export function initialCanvasToolbarState() {
    return {
        zoom: 1,
        gridSnap: true,
        showGridDots: true,
        canvasMode: 'freeform',
        selectedCount: 0,
    };
}
export function setCanvasToolbarZoom(state, zoom) {
    const clamped = Math.max(0.25, Math.min(3, zoom));
    return { ...state, zoom: clamped };
}
export function setCanvasToolbarZoomPreset(state, preset) {
    return { ...state, zoom: preset };
}
export function toggleCanvasToolbarGridSnap(state) {
    return { ...state, gridSnap: !state.gridSnap };
}
export function toggleCanvasToolbarGridDots(state) {
    return { ...state, showGridDots: !state.showGridDots };
}
export function setCanvasToolbarMode(state, mode) {
    return { ...state, canvasMode: mode };
}
export function updateCanvasToolbarSelection(state, count) {
    return { ...state, selectedCount: count };
}
/** Returns whether alignment buttons should be visible */
export function showCanvasAlignmentButtons(state) {
    return state.selectedCount >= 2;
}
/** Returns whether distribution buttons should be visible */
export function showCanvasDistributionButtons(state) {
    return state.selectedCount >= 3;
}
/** Zoom in by 25% (capped at 3.0) */
export function canvasToolbarZoomIn(state) {
    return setCanvasToolbarZoom(state, state.zoom + 0.25);
}
/** Zoom out by 25% (floored at 0.25) */
export function canvasToolbarZoomOut(state) {
    return setCanvasToolbarZoom(state, state.zoom - 0.25);
}
/** Reset zoom to 100% */
export function canvasToolbarZoomReset(state) {
    return { ...state, zoom: 1 };
}
//# sourceMappingURL=canvas-toolbar-state.js.map