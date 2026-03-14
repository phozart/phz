/**
 * @phozart/viewer — View Manager State
 *
 * Headless state machine for the saved views / column layouts panel.
 * Manages the view list, active view selection, dirty tracking,
 * and inline rename workflow.
 */

import type { ViewsSummary } from '@phozart/core';

// ========================================================================
// ViewManagerState
// ========================================================================

export interface ViewManagerState {
  /** Whether the view manager panel is open. */
  open: boolean;
  /** List of saved views (summary form). */
  views: ViewsSummary[];
  /** ID of the currently active view (null = none). */
  activeViewId: string | null;
  /** Whether the current grid state differs from the active view. */
  dirty: boolean;
  /** ID of the view currently being renamed (null = not renaming). */
  renamingViewId: string | null;
  /** Current value of the rename input field. */
  renameValue: string;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create the initial view manager state with sensible defaults.
 */
export function createViewManagerState(): ViewManagerState {
  return {
    open: false,
    views: [],
    activeViewId: null,
    dirty: false,
    renamingViewId: null,
    renameValue: '',
  };
}

// ========================================================================
// Open / Close
// ========================================================================

/**
 * Open the view manager panel.
 */
export function openViewManager(state: ViewManagerState): ViewManagerState {
  return { ...state, open: true };
}

/**
 * Close the view manager panel. Also cancels any active rename.
 */
export function closeViewManager(state: ViewManagerState): ViewManagerState {
  return {
    ...state,
    open: false,
    renamingViewId: null,
    renameValue: '',
  };
}

// ========================================================================
// Views List
// ========================================================================

/**
 * Set the full list of saved views.
 */
export function setViews(
  state: ViewManagerState,
  views: ViewsSummary[],
): ViewManagerState {
  return { ...state, views };
}

// ========================================================================
// Active View
// ========================================================================

/**
 * Set the active view by ID. Pass null to clear.
 */
export function setActiveView(
  state: ViewManagerState,
  viewId: string | null,
): ViewManagerState {
  return { ...state, activeViewId: viewId };
}

// ========================================================================
// Dirty Flag
// ========================================================================

/**
 * Mark whether the current grid state differs from the active view.
 */
export function setDirty(
  state: ViewManagerState,
  dirty: boolean,
): ViewManagerState {
  return { ...state, dirty };
}

// ========================================================================
// Rename Workflow
// ========================================================================

/**
 * Start renaming a view. Copies the view's current name into the
 * rename input. If the viewId is not found, returns the state unchanged.
 */
export function startRename(
  state: ViewManagerState,
  viewId: string,
): ViewManagerState {
  const view = state.views.find(v => v.id === viewId);
  if (!view) {
    return state;
  }
  return {
    ...state,
    renamingViewId: viewId,
    renameValue: view.name,
  };
}

/**
 * Update the rename input value while renaming.
 */
export function updateRenameName(
  state: ViewManagerState,
  name: string,
): ViewManagerState {
  return { ...state, renameValue: name };
}

/**
 * Finish the rename operation. Returns the new state plus the viewId
 * and newName for the caller to persist. If the rename value is empty
 * or whitespace-only, the rename is discarded (viewId is null,
 * newName is empty).
 */
export function finishRename(state: ViewManagerState): {
  state: ViewManagerState;
  viewId: string | null;
  newName: string;
} {
  const trimmed = state.renameValue.trim();
  const cleared: ViewManagerState = {
    ...state,
    renamingViewId: null,
    renameValue: '',
  };

  if (!trimmed || !state.renamingViewId) {
    return { state: cleared, viewId: null, newName: '' };
  }

  return {
    state: cleared,
    viewId: state.renamingViewId,
    newName: trimmed,
  };
}

/**
 * Cancel the rename operation, clearing the rename fields.
 * Safe to call when not renaming.
 */
export function cancelRename(state: ViewManagerState): ViewManagerState {
  return {
    ...state,
    renamingViewId: null,
    renameValue: '',
  };
}
