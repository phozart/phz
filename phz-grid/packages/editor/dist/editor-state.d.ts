/**
 * @phozart/editor — Editor Shell State Machine (B-2.02)
 *
 * Headless state management for the editor shell. Manages screen navigation,
 * editing mode, unsaved changes tracking, auto-save debounce, undo/redo stack,
 * measure registry integration, and viewer context.
 *
 * All functions are pure — they return a new state object rather than mutating.
 */
import type { ViewerContext } from '@phozart/shared/adapters';
import type { MeasureDefinition } from '@phozart/shared/adapters';
export type EditorScreen = 'catalog' | 'dashboard-view' | 'dashboard-edit' | 'report' | 'explorer' | 'sharing' | 'alerts';
export interface NavigationEntry {
    screen: EditorScreen;
    artifactId: string | null;
    artifactType: string | null;
}
export interface EditorShellState {
    /** The currently active screen. */
    currentScreen: EditorScreen;
    /** The ID of the artifact being viewed or edited. */
    activeArtifactId: string | null;
    /** The type of the active artifact (e.g. 'dashboard', 'report'). */
    activeArtifactType: string | null;
    /** Whether the user is in editing mode (vs. viewing). */
    editMode: boolean;
    /** Whether there are unsaved changes in the current context. */
    unsavedChanges: boolean;
    /** Whether auto-save is enabled. */
    autoSaveEnabled: boolean;
    /** Debounce interval for auto-save in milliseconds. */
    autoSaveDebounceMs: number;
    /** Stack of snapshots for undo. */
    undoStack: unknown[];
    /** Stack of snapshots for redo. */
    redoStack: unknown[];
    /** Full navigation history for back/forward. */
    navigationHistory: NavigationEntry[];
    /** Current index within the navigation history. */
    historyIndex: number;
    /** Whether the shell is loading data. */
    loading: boolean;
    /** Current error state, if any. */
    error: unknown;
    /** The viewer context (user identity and roles). */
    viewerContext: ViewerContext | null;
    /** Available measure definitions from the registry. */
    measures: MeasureDefinition[];
}
/**
 * Create a new EditorShellState with sensible defaults.
 * Pass partial overrides to customize the initial state.
 */
export declare function createEditorShellState(config?: Partial<EditorShellState>): EditorShellState;
/**
 * Navigate to a new screen. If navigating from a point in the middle
 * of the history (after undo), the forward history is truncated.
 *
 * Resets editMode and unsavedChanges when the artifact changes.
 */
export declare function navigateTo(state: EditorShellState, screen: EditorScreen, artifactId?: string, artifactType?: string): EditorShellState;
/**
 * Navigate back in the history stack.
 * Returns the same state if already at the beginning.
 */
export declare function navigateBack(state: EditorShellState): EditorShellState;
/**
 * Navigate forward in the history stack.
 * Returns the same state if already at the end.
 */
export declare function navigateForward(state: EditorShellState): EditorShellState;
/**
 * Toggle edit mode on/off. Clears undo/redo when exiting edit mode.
 */
export declare function toggleEditMode(state: EditorShellState): EditorShellState;
/**
 * Explicitly set edit mode to a specific value.
 */
export declare function setEditMode(state: EditorShellState, editMode: boolean): EditorShellState;
/**
 * Mark the current state as having unsaved changes.
 */
export declare function markUnsavedChanges(state: EditorShellState): EditorShellState;
/**
 * Mark the current state as saved (no unsaved changes).
 */
export declare function markSaved(state: EditorShellState): EditorShellState;
/**
 * Push a snapshot onto the undo stack. Clears the redo stack
 * (new edit branch). Respects MAX_UNDO_DEPTH to bound memory usage.
 */
export declare function pushUndo(state: EditorShellState, snapshot: unknown): EditorShellState;
/**
 * Pop from the undo stack and push the current snapshot to redo.
 * Returns the same state if the undo stack is empty.
 *
 * Note: The returned `snapshot` is the value popped from the undo stack.
 * Callers should apply it to their domain state separately.
 */
export declare function undo(state: EditorShellState): {
    state: EditorShellState;
    snapshot: unknown;
};
/**
 * Pop from the redo stack and push the current snapshot to undo.
 * Returns the same state if the redo stack is empty.
 */
export declare function redo(state: EditorShellState): {
    state: EditorShellState;
    snapshot: unknown;
};
/**
 * Set the loading state.
 */
export declare function setLoading(state: EditorShellState, loading: boolean): EditorShellState;
/**
 * Set an error on the shell state.
 */
export declare function setError(state: EditorShellState, error: unknown): EditorShellState;
/**
 * Clear the error state.
 */
export declare function clearError(state: EditorShellState): EditorShellState;
/**
 * Set the available measures from the measure registry.
 */
export declare function setMeasures(state: EditorShellState, measures: MeasureDefinition[]): EditorShellState;
/**
 * Toggle auto-save on/off.
 */
export declare function toggleAutoSave(state: EditorShellState): EditorShellState;
/**
 * Set the auto-save debounce interval.
 */
export declare function setAutoSaveDebounce(state: EditorShellState, debounceMs: number): EditorShellState;
/** Whether the undo stack has entries. */
export declare function canUndo(state: EditorShellState): boolean;
/** Whether the redo stack has entries. */
export declare function canRedo(state: EditorShellState): boolean;
/** Whether back navigation is available. */
export declare function canGoBack(state: EditorShellState): boolean;
/** Whether forward navigation is available. */
export declare function canGoForward(state: EditorShellState): boolean;
//# sourceMappingURL=editor-state.d.ts.map