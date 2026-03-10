/**
 * @phozart/phz-workspace — Chart Overlay Config Panel State Machine
 *
 * Pure state machine for managing chart analytics overlays in the
 * dashboard editor config panel. Supports CRUD operations and an
 * edit-draft-commit flow for safe in-place editing.
 */
import type { ChartOverlay } from '@phozart/phz-engine';
export interface ChartOverlayState {
    /** List of overlays applied to the current chart widget. */
    overlays: ChartOverlay[];
    /** ID of the overlay currently being edited (if any). */
    editingOverlayId?: string;
    /** Draft copy of the editing overlay for cancel-safe editing. */
    editingDraft?: ChartOverlay;
}
export declare function initialChartOverlayState(existingOverlays?: ChartOverlay[]): ChartOverlayState;
export declare function addOverlay(state: ChartOverlayState, overlay: ChartOverlay): ChartOverlayState;
export declare function removeOverlay(state: ChartOverlayState, overlayId: string): ChartOverlayState;
export declare function updateOverlay(state: ChartOverlayState, overlayId: string, updates: Partial<ChartOverlay>): ChartOverlayState;
export declare function startEditOverlay(state: ChartOverlayState, overlayId: string): ChartOverlayState;
export declare function commitOverlay(state: ChartOverlayState): ChartOverlayState;
export declare function cancelEditOverlay(state: ChartOverlayState): ChartOverlayState;
export declare function reorderOverlays(state: ChartOverlayState, newOrder: string[]): ChartOverlayState;
//# sourceMappingURL=chart-overlay-state.d.ts.map