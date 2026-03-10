/**
 * @phozart/phz-workspace — Canvas Toolbar State (Canvas Phase 4A)
 *
 * State machine for the floating canvas toolbar.
 * Controls zoom, grid snap, grid dots, alignment buttons, and canvas mode.
 */
export type ZoomPreset = 0.5 | 0.75 | 1 | 1.5 | 2;
export declare const ZOOM_PRESETS: ZoomPreset[];
export interface CanvasToolbarState {
    zoom: number;
    gridSnap: boolean;
    showGridDots: boolean;
    canvasMode: 'auto-grid' | 'freeform';
    /** Number of selected widgets — determines which toolbar buttons are visible */
    selectedCount: number;
}
export declare function initialCanvasToolbarState(): CanvasToolbarState;
export declare function setCanvasToolbarZoom(state: CanvasToolbarState, zoom: number): CanvasToolbarState;
export declare function setCanvasToolbarZoomPreset(state: CanvasToolbarState, preset: ZoomPreset): CanvasToolbarState;
export declare function toggleCanvasToolbarGridSnap(state: CanvasToolbarState): CanvasToolbarState;
export declare function toggleCanvasToolbarGridDots(state: CanvasToolbarState): CanvasToolbarState;
export declare function setCanvasToolbarMode(state: CanvasToolbarState, mode: 'auto-grid' | 'freeform'): CanvasToolbarState;
export declare function updateCanvasToolbarSelection(state: CanvasToolbarState, count: number): CanvasToolbarState;
/** Returns whether alignment buttons should be visible */
export declare function showCanvasAlignmentButtons(state: CanvasToolbarState): boolean;
/** Returns whether distribution buttons should be visible */
export declare function showCanvasDistributionButtons(state: CanvasToolbarState): boolean;
/** Zoom in by 25% (capped at 3.0) */
export declare function canvasToolbarZoomIn(state: CanvasToolbarState): CanvasToolbarState;
/** Zoom out by 25% (floored at 0.25) */
export declare function canvasToolbarZoomOut(state: CanvasToolbarState): CanvasToolbarState;
/** Reset zoom to 100% */
export declare function canvasToolbarZoomReset(state: CanvasToolbarState): CanvasToolbarState;
//# sourceMappingURL=canvas-toolbar-state.d.ts.map