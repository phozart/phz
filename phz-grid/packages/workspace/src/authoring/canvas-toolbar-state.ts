/**
 * @phozart/phz-workspace — Canvas Toolbar State (Canvas Phase 4A)
 *
 * State machine for the floating canvas toolbar.
 * Controls zoom, grid snap, grid dots, alignment buttons, and canvas mode.
 */

export type ZoomPreset = 0.5 | 0.75 | 1 | 1.5 | 2;

export const ZOOM_PRESETS: ZoomPreset[] = [0.5, 0.75, 1, 1.5, 2];

export interface CanvasToolbarState {
  zoom: number;
  gridSnap: boolean;
  showGridDots: boolean;
  canvasMode: 'auto-grid' | 'freeform';
  /** Number of selected widgets — determines which toolbar buttons are visible */
  selectedCount: number;
}

export function initialCanvasToolbarState(): CanvasToolbarState {
  return {
    zoom: 1,
    gridSnap: true,
    showGridDots: true,
    canvasMode: 'freeform',
    selectedCount: 0,
  };
}

export function setCanvasToolbarZoom(state: CanvasToolbarState, zoom: number): CanvasToolbarState {
  const clamped = Math.max(0.25, Math.min(3, zoom));
  return { ...state, zoom: clamped };
}

export function setCanvasToolbarZoomPreset(state: CanvasToolbarState, preset: ZoomPreset): CanvasToolbarState {
  return { ...state, zoom: preset };
}

export function toggleCanvasToolbarGridSnap(state: CanvasToolbarState): CanvasToolbarState {
  return { ...state, gridSnap: !state.gridSnap };
}

export function toggleCanvasToolbarGridDots(state: CanvasToolbarState): CanvasToolbarState {
  return { ...state, showGridDots: !state.showGridDots };
}

export function setCanvasToolbarMode(
  state: CanvasToolbarState,
  mode: 'auto-grid' | 'freeform',
): CanvasToolbarState {
  return { ...state, canvasMode: mode };
}

export function updateCanvasToolbarSelection(
  state: CanvasToolbarState,
  count: number,
): CanvasToolbarState {
  return { ...state, selectedCount: count };
}

/** Returns whether alignment buttons should be visible */
export function showCanvasAlignmentButtons(state: CanvasToolbarState): boolean {
  return state.selectedCount >= 2;
}

/** Returns whether distribution buttons should be visible */
export function showCanvasDistributionButtons(state: CanvasToolbarState): boolean {
  return state.selectedCount >= 3;
}

/** Zoom in by 25% (capped at 3.0) */
export function canvasToolbarZoomIn(state: CanvasToolbarState): CanvasToolbarState {
  return setCanvasToolbarZoom(state, state.zoom + 0.25);
}

/** Zoom out by 25% (floored at 0.25) */
export function canvasToolbarZoomOut(state: CanvasToolbarState): CanvasToolbarState {
  return setCanvasToolbarZoom(state, state.zoom - 0.25);
}

/** Reset zoom to 100% */
export function canvasToolbarZoomReset(state: CanvasToolbarState): CanvasToolbarState {
  return { ...state, zoom: 1 };
}
