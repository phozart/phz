/**
 * @phozart/editor — Editor Shell State Machine (B-2.02)
 *
 * Headless state management for the editor shell. Manages screen navigation,
 * editing mode, unsaved changes tracking, auto-save debounce, undo/redo stack,
 * measure registry integration, and viewer context.
 *
 * All functions are pure — they return a new state object rather than mutating.
 */
// ========================================================================
// createEditorShellState — factory with sensible defaults
// ========================================================================
/**
 * Create a new EditorShellState with sensible defaults.
 * Pass partial overrides to customize the initial state.
 */
export function createEditorShellState(config) {
    const initial = {
        currentScreen: 'catalog',
        activeArtifactId: null,
        activeArtifactType: null,
        editMode: false,
        unsavedChanges: false,
        autoSaveEnabled: true,
        autoSaveDebounceMs: 2000,
        undoStack: [],
        redoStack: [],
        navigationHistory: [{ screen: 'catalog', artifactId: null, artifactType: null }],
        historyIndex: 0,
        loading: false,
        error: null,
        viewerContext: null,
        measures: [],
    };
    if (!config)
        return initial;
    return { ...initial, ...config };
}
// ========================================================================
// navigateTo — move to a new screen, appending to navigation history
// ========================================================================
/**
 * Navigate to a new screen. If navigating from a point in the middle
 * of the history (after undo), the forward history is truncated.
 *
 * Resets editMode and unsavedChanges when the artifact changes.
 */
export function navigateTo(state, screen, artifactId, artifactType) {
    const entry = {
        screen,
        artifactId: artifactId ?? null,
        artifactType: artifactType ?? state.activeArtifactType,
    };
    // Truncate forward history if we navigated back earlier, cap at 50 entries
    const MAX_HISTORY = 50;
    const truncatedHistory = state.navigationHistory.slice(0, state.historyIndex + 1);
    const newHistory = [...truncatedHistory, entry].slice(-MAX_HISTORY);
    const artifactChanged = artifactId !== undefined && artifactId !== state.activeArtifactId;
    return {
        ...state,
        currentScreen: screen,
        activeArtifactId: artifactId ?? state.activeArtifactId,
        activeArtifactType: artifactType ?? state.activeArtifactType,
        navigationHistory: newHistory,
        historyIndex: newHistory.length - 1,
        // Reset edit state when artifact changes
        editMode: artifactChanged ? false : state.editMode,
        unsavedChanges: artifactChanged ? false : state.unsavedChanges,
        // Clear undo/redo when artifact changes
        undoStack: artifactChanged ? [] : state.undoStack,
        redoStack: artifactChanged ? [] : state.redoStack,
        error: null,
    };
}
// ========================================================================
// navigateBack / navigateForward — move through history
// ========================================================================
/**
 * Navigate back in the history stack.
 * Returns the same state if already at the beginning.
 */
export function navigateBack(state) {
    if (state.historyIndex <= 0)
        return state;
    const newIndex = state.historyIndex - 1;
    const entry = state.navigationHistory[newIndex];
    return {
        ...state,
        currentScreen: entry.screen,
        activeArtifactId: entry.artifactId,
        activeArtifactType: entry.artifactType,
        historyIndex: newIndex,
        editMode: false,
        unsavedChanges: false,
        error: null,
    };
}
/**
 * Navigate forward in the history stack.
 * Returns the same state if already at the end.
 */
export function navigateForward(state) {
    if (state.historyIndex >= state.navigationHistory.length - 1)
        return state;
    const newIndex = state.historyIndex + 1;
    const entry = state.navigationHistory[newIndex];
    return {
        ...state,
        currentScreen: entry.screen,
        activeArtifactId: entry.artifactId,
        activeArtifactType: entry.artifactType,
        historyIndex: newIndex,
        editMode: false,
        unsavedChanges: false,
        error: null,
    };
}
// ========================================================================
// Edit mode transitions
// ========================================================================
/**
 * Toggle edit mode on/off. Clears undo/redo when exiting edit mode.
 */
export function toggleEditMode(state) {
    const newEditMode = !state.editMode;
    return {
        ...state,
        editMode: newEditMode,
        // Clear undo/redo when leaving edit mode
        undoStack: newEditMode ? state.undoStack : [],
        redoStack: newEditMode ? state.redoStack : [],
    };
}
/**
 * Explicitly set edit mode to a specific value.
 */
export function setEditMode(state, editMode) {
    if (state.editMode === editMode)
        return state;
    return {
        ...state,
        editMode,
        undoStack: editMode ? state.undoStack : [],
        redoStack: editMode ? state.redoStack : [],
    };
}
// ========================================================================
// Unsaved changes tracking
// ========================================================================
/**
 * Mark the current state as having unsaved changes.
 */
export function markUnsavedChanges(state) {
    if (state.unsavedChanges)
        return state;
    return { ...state, unsavedChanges: true };
}
/**
 * Mark the current state as saved (no unsaved changes).
 */
export function markSaved(state) {
    if (!state.unsavedChanges)
        return state;
    return { ...state, unsavedChanges: false };
}
// ========================================================================
// Undo / Redo
// ========================================================================
/** Maximum undo stack depth to prevent memory bloat. */
const MAX_UNDO_DEPTH = 50;
/**
 * Push a snapshot onto the undo stack. Clears the redo stack
 * (new edit branch). Respects MAX_UNDO_DEPTH to bound memory usage.
 */
export function pushUndo(state, snapshot) {
    const newUndo = [...state.undoStack, snapshot];
    // Trim oldest entries if we exceed the limit
    if (newUndo.length > MAX_UNDO_DEPTH) {
        newUndo.splice(0, newUndo.length - MAX_UNDO_DEPTH);
    }
    return {
        ...state,
        undoStack: newUndo,
        redoStack: [],
        unsavedChanges: true,
    };
}
/**
 * Pop from the undo stack and push the current snapshot to redo.
 * Returns the same state if the undo stack is empty.
 *
 * Note: The returned `snapshot` is the value popped from the undo stack.
 * Callers should apply it to their domain state separately.
 */
export function undo(state) {
    if (state.undoStack.length === 0) {
        return { state, snapshot: null };
    }
    const newUndo = [...state.undoStack];
    const snapshot = newUndo.pop();
    return {
        state: {
            ...state,
            undoStack: newUndo,
            redoStack: [...state.redoStack, snapshot],
            unsavedChanges: true,
        },
        snapshot,
    };
}
/**
 * Pop from the redo stack and push the current snapshot to undo.
 * Returns the same state if the redo stack is empty.
 */
export function redo(state) {
    if (state.redoStack.length === 0) {
        return { state, snapshot: null };
    }
    const newRedo = [...state.redoStack];
    const snapshot = newRedo.pop();
    return {
        state: {
            ...state,
            redoStack: newRedo,
            undoStack: [...state.undoStack, snapshot],
            unsavedChanges: true,
        },
        snapshot,
    };
}
// ========================================================================
// Loading / Error
// ========================================================================
/**
 * Set the loading state.
 */
export function setLoading(state, loading) {
    return { ...state, loading, error: loading ? null : state.error };
}
/**
 * Set an error on the shell state.
 */
export function setError(state, error) {
    return { ...state, error, loading: false };
}
/**
 * Clear the error state.
 */
export function clearError(state) {
    if (state.error === null)
        return state;
    return { ...state, error: null };
}
// ========================================================================
// Measures
// ========================================================================
/**
 * Set the available measures from the measure registry.
 */
export function setMeasures(state, measures) {
    return { ...state, measures };
}
// ========================================================================
// Auto-save configuration
// ========================================================================
/**
 * Toggle auto-save on/off.
 */
export function toggleAutoSave(state) {
    return { ...state, autoSaveEnabled: !state.autoSaveEnabled };
}
/**
 * Set the auto-save debounce interval.
 */
export function setAutoSaveDebounce(state, debounceMs) {
    return { ...state, autoSaveDebounceMs: Math.max(500, debounceMs) };
}
// ========================================================================
// canUndo / canRedo helpers
// ========================================================================
/** Whether the undo stack has entries. */
export function canUndo(state) {
    return state.undoStack.length > 0;
}
/** Whether the redo stack has entries. */
export function canRedo(state) {
    return state.redoStack.length > 0;
}
/** Whether back navigation is available. */
export function canGoBack(state) {
    return state.historyIndex > 0;
}
/** Whether forward navigation is available. */
export function canGoForward(state) {
    return state.historyIndex < state.navigationHistory.length - 1;
}
//# sourceMappingURL=editor-state.js.map