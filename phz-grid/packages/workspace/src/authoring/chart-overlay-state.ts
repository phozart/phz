/**
 * @phozart/workspace — Chart Overlay Config Panel State Machine
 *
 * Pure state machine for managing chart analytics overlays in the
 * dashboard editor config panel. Supports CRUD operations and an
 * edit-draft-commit flow for safe in-place editing.
 */

import type { ChartOverlay } from '@phozart/engine';

// ========================================================================
// State
// ========================================================================

export interface ChartOverlayState {
  /** List of overlays applied to the current chart widget. */
  overlays: ChartOverlay[];
  /** ID of the overlay currently being edited (if any). */
  editingOverlayId?: string;
  /** Draft copy of the editing overlay for cancel-safe editing. */
  editingDraft?: ChartOverlay;
}

// ========================================================================
// initialChartOverlayState
// ========================================================================

export function initialChartOverlayState(
  existingOverlays?: ChartOverlay[],
): ChartOverlayState {
  return {
    overlays: existingOverlays ? [...existingOverlays] : [],
    editingOverlayId: undefined,
    editingDraft: undefined,
  };
}

// ========================================================================
// addOverlay
// ========================================================================

export function addOverlay(
  state: ChartOverlayState,
  overlay: ChartOverlay,
): ChartOverlayState {
  return {
    ...state,
    overlays: [...state.overlays, overlay],
  };
}

// ========================================================================
// removeOverlay
// ========================================================================

export function removeOverlay(
  state: ChartOverlayState,
  overlayId: string,
): ChartOverlayState {
  const exists = state.overlays.some(o => o.id === overlayId);
  if (!exists) return state;

  const clearEditing = state.editingOverlayId === overlayId;
  return {
    ...state,
    overlays: state.overlays.filter(o => o.id !== overlayId),
    editingOverlayId: clearEditing ? undefined : state.editingOverlayId,
    editingDraft: clearEditing ? undefined : state.editingDraft,
  };
}

// ========================================================================
// updateOverlay
// ========================================================================

export function updateOverlay(
  state: ChartOverlayState,
  overlayId: string,
  updates: Partial<ChartOverlay>,
): ChartOverlayState {
  const idx = state.overlays.findIndex(o => o.id === overlayId);
  if (idx === -1) return state;

  const updated = [...state.overlays];
  updated[idx] = { ...updated[idx], ...updates };
  return { ...state, overlays: updated };
}

// ========================================================================
// startEditOverlay
// ========================================================================

export function startEditOverlay(
  state: ChartOverlayState,
  overlayId: string,
): ChartOverlayState {
  const overlay = state.overlays.find(o => o.id === overlayId);
  if (!overlay) return state;

  return {
    ...state,
    editingOverlayId: overlayId,
    editingDraft: { ...overlay },
  };
}

// ========================================================================
// commitOverlay
// ========================================================================

export function commitOverlay(state: ChartOverlayState): ChartOverlayState {
  if (!state.editingOverlayId || !state.editingDraft) return state;

  const updated = state.overlays.map(o =>
    o.id === state.editingOverlayId ? { ...state.editingDraft! } : o,
  );

  return {
    ...state,
    overlays: updated,
    editingOverlayId: undefined,
    editingDraft: undefined,
  };
}

// ========================================================================
// cancelEditOverlay
// ========================================================================

export function cancelEditOverlay(state: ChartOverlayState): ChartOverlayState {
  return {
    ...state,
    editingOverlayId: undefined,
    editingDraft: undefined,
  };
}

// ========================================================================
// reorderOverlays
// ========================================================================

export function reorderOverlays(
  state: ChartOverlayState,
  newOrder: string[],
): ChartOverlayState {
  const overlayMap = new Map(state.overlays.map(o => [o.id, o]));
  const reordered: ChartOverlay[] = [];

  for (const id of newOrder) {
    const overlay = overlayMap.get(id);
    if (overlay) reordered.push(overlay);
  }

  return { ...state, overlays: reordered };
}
