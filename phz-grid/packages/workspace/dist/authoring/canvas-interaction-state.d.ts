/**
 * @phozart/phz-workspace — Canvas Interaction State (Canvas Phase 1D)
 *
 * Tracks the visual interaction layer — what the user sees during
 * drag/resize/select operations on the freeform canvas.
 * Pure functions, no DOM dependency.
 */
import type { WidgetPlacement } from './freeform-grid-state.js';
export type CanvasInteractionMode = 'idle' | 'dragging' | 'resizing' | 'selecting-area' | 'panning';
export interface SnapGuide {
    axis: 'horizontal' | 'vertical';
    position: number;
}
export interface SelectionRect {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}
export interface CanvasInteractionState {
    mode: CanvasInteractionMode;
    snapGuides: SnapGuide[];
    selectionRect?: SelectionRect;
    ghostPlacement?: WidgetPlacement;
    showGridDots: boolean;
}
export declare function initialCanvasInteractionState(): CanvasInteractionState;
export declare function enterCanvasDragMode(state: CanvasInteractionState, ghost: WidgetPlacement): CanvasInteractionState;
export declare function enterCanvasResizeMode(state: CanvasInteractionState, ghost: WidgetPlacement): CanvasInteractionState;
export declare function enterCanvasSelectMode(state: CanvasInteractionState, startCol: number, startRow: number): CanvasInteractionState;
export declare function enterCanvasPanMode(state: CanvasInteractionState): CanvasInteractionState;
export declare function exitCanvasInteraction(state: CanvasInteractionState): CanvasInteractionState;
export declare function updateCanvasGhost(state: CanvasInteractionState, ghost: WidgetPlacement): CanvasInteractionState;
export declare function computeCanvasSnapGuides(widgets: WidgetPlacement[], movingWidget: WidgetPlacement): SnapGuide[];
export declare function setCanvasSnapGuides(state: CanvasInteractionState, guides: SnapGuide[]): CanvasInteractionState;
export declare function updateCanvasSelectionRect(state: CanvasInteractionState, endCol: number, endRow: number): CanvasInteractionState;
export declare function getWidgetsInCanvasSelectionRect(widgets: WidgetPlacement[], rect: SelectionRect): string[];
export declare function toggleCanvasGridDots(state: CanvasInteractionState): CanvasInteractionState;
export declare function setCanvasGridDots(state: CanvasInteractionState, show: boolean): CanvasInteractionState;
//# sourceMappingURL=canvas-interaction-state.d.ts.map