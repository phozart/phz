/**
 * Tests for EditorShellState machine (B-2.02)
 */
import {
  createEditorShellState,
  navigateTo,
  navigateBack,
  navigateForward,
  toggleEditMode,
  setEditMode,
  markUnsavedChanges,
  markSaved,
  pushUndo,
  undo,
  redo,
  setLoading,
  setError,
  clearError,
  setMeasures,
  toggleAutoSave,
  setAutoSaveDebounce,
  canUndo,
  canRedo,
  canGoBack,
  canGoForward,
} from '../editor-state.js';
import type { EditorShellState, MeasureDefinition } from '../index.js';

describe('createEditorShellState', () => {
  it('creates state with default values', () => {
    const state = createEditorShellState();
    expect(state.currentScreen).toBe('catalog');
    expect(state.activeArtifactId).toBeNull();
    expect(state.activeArtifactType).toBeNull();
    expect(state.editMode).toBe(false);
    expect(state.unsavedChanges).toBe(false);
    expect(state.autoSaveEnabled).toBe(true);
    expect(state.autoSaveDebounceMs).toBe(2000);
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
    expect(state.navigationHistory).toHaveLength(1);
    expect(state.historyIndex).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.viewerContext).toBeNull();
    expect(state.measures).toEqual([]);
  });

  it('accepts partial overrides', () => {
    const state = createEditorShellState({
      currentScreen: 'dashboard-edit',
      editMode: true,
      autoSaveDebounceMs: 5000,
    });
    expect(state.currentScreen).toBe('dashboard-edit');
    expect(state.editMode).toBe(true);
    expect(state.autoSaveDebounceMs).toBe(5000);
    // Non-overridden values remain defaults
    expect(state.unsavedChanges).toBe(false);
    expect(state.loading).toBe(false);
  });
});

describe('navigateTo', () => {
  it('changes screen and appends to history', () => {
    const state = createEditorShellState();
    const next = navigateTo(state, 'dashboard-view', 'dash-1', 'dashboard');
    expect(next.currentScreen).toBe('dashboard-view');
    expect(next.activeArtifactId).toBe('dash-1');
    expect(next.activeArtifactType).toBe('dashboard');
    expect(next.navigationHistory).toHaveLength(2);
    expect(next.historyIndex).toBe(1);
  });

  it('resets edit state when artifact changes', () => {
    let state = createEditorShellState({ editMode: true, unsavedChanges: true });
    state = navigateTo(state, 'dashboard-edit', 'dash-2');
    expect(state.editMode).toBe(false);
    expect(state.unsavedChanges).toBe(false);
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
  });

  it('preserves edit state when navigating without changing artifact', () => {
    let state = createEditorShellState({
      activeArtifactId: 'dash-1',
      editMode: true,
      unsavedChanges: true,
    });
    state = navigateTo(state, 'dashboard-edit');
    expect(state.editMode).toBe(true);
    expect(state.unsavedChanges).toBe(true);
  });

  it('truncates forward history when navigating from middle', () => {
    let state = createEditorShellState();
    state = navigateTo(state, 'dashboard-view', 'dash-1');
    state = navigateTo(state, 'report', 'rpt-1');
    // Go back twice
    state = navigateBack(state);
    state = navigateBack(state);
    expect(state.historyIndex).toBe(0);
    // Navigate to a new screen truncates forward
    state = navigateTo(state, 'explorer');
    expect(state.navigationHistory).toHaveLength(2);
    expect(state.historyIndex).toBe(1);
    expect(state.currentScreen).toBe('explorer');
  });

  it('clears error on navigation', () => {
    let state = createEditorShellState();
    state = setError(state, 'some error');
    state = navigateTo(state, 'explorer');
    expect(state.error).toBeNull();
  });
});

describe('navigateBack / navigateForward', () => {
  it('goes back in history', () => {
    let state = createEditorShellState();
    state = navigateTo(state, 'dashboard-view', 'dash-1');
    state = navigateTo(state, 'report', 'rpt-1');
    expect(state.historyIndex).toBe(2);

    state = navigateBack(state);
    expect(state.historyIndex).toBe(1);
    expect(state.currentScreen).toBe('dashboard-view');
    expect(state.activeArtifactId).toBe('dash-1');
  });

  it('returns same state when at beginning', () => {
    const state = createEditorShellState();
    const same = navigateBack(state);
    expect(same).toBe(state);
  });

  it('goes forward after going back', () => {
    let state = createEditorShellState();
    state = navigateTo(state, 'dashboard-view', 'dash-1');
    state = navigateBack(state);
    state = navigateForward(state);
    expect(state.currentScreen).toBe('dashboard-view');
    expect(state.activeArtifactId).toBe('dash-1');
  });

  it('returns same state when at end', () => {
    const state = createEditorShellState();
    const same = navigateForward(state);
    expect(same).toBe(state);
  });
});

describe('toggleEditMode / setEditMode', () => {
  it('toggles edit mode', () => {
    let state = createEditorShellState();
    expect(state.editMode).toBe(false);
    state = toggleEditMode(state);
    expect(state.editMode).toBe(true);
    state = toggleEditMode(state);
    expect(state.editMode).toBe(false);
  });

  it('clears undo/redo when leaving edit mode', () => {
    let state = createEditorShellState({ editMode: true });
    state = pushUndo(state, { snapshot: 1 });
    expect(state.undoStack).toHaveLength(1);
    state = toggleEditMode(state); // leave edit mode
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
  });

  it('setEditMode sets explicitly', () => {
    let state = createEditorShellState();
    state = setEditMode(state, true);
    expect(state.editMode).toBe(true);
    state = setEditMode(state, true); // same value
    expect(state).toBe(state); // no-op identity
  });
});

describe('markUnsavedChanges / markSaved', () => {
  it('marks unsaved and saved', () => {
    let state = createEditorShellState();
    expect(state.unsavedChanges).toBe(false);
    state = markUnsavedChanges(state);
    expect(state.unsavedChanges).toBe(true);
    state = markSaved(state);
    expect(state.unsavedChanges).toBe(false);
  });

  it('returns same reference for no-op', () => {
    const state = createEditorShellState();
    expect(markUnsavedChanges(markUnsavedChanges(state)).unsavedChanges).toBe(true);
    expect(markSaved(state)).toBe(state); // already saved
  });
});

describe('undo / redo', () => {
  it('pushes to undo stack and clears redo', () => {
    let state = createEditorShellState();
    state = pushUndo(state, 'snap-1');
    expect(state.undoStack).toEqual(['snap-1']);
    expect(state.redoStack).toEqual([]);
    expect(state.unsavedChanges).toBe(true);
  });

  it('respects max undo depth (50)', () => {
    let state = createEditorShellState();
    for (let i = 0; i < 60; i++) {
      state = pushUndo(state, `snap-${i}`);
    }
    expect(state.undoStack).toHaveLength(50);
    expect(state.undoStack[0]).toBe('snap-10'); // oldest 10 trimmed
  });

  it('undo pops from undo and pushes to redo', () => {
    let state = createEditorShellState();
    state = pushUndo(state, 'snap-1');
    state = pushUndo(state, 'snap-2');

    const result1 = undo(state);
    expect(result1.snapshot).toBe('snap-2');
    expect(result1.state.undoStack).toEqual(['snap-1']);
    expect(result1.state.redoStack).toEqual(['snap-2']);

    const result2 = undo(result1.state);
    expect(result2.snapshot).toBe('snap-1');
    expect(result2.state.undoStack).toEqual([]);
    expect(result2.state.redoStack).toEqual(['snap-2', 'snap-1']);
  });

  it('undo returns null snapshot when stack is empty', () => {
    const state = createEditorShellState();
    const result = undo(state);
    expect(result.snapshot).toBeNull();
    expect(result.state).toBe(state);
  });

  it('redo pops from redo and pushes to undo', () => {
    let state = createEditorShellState();
    state = pushUndo(state, 'snap-1');
    const undoResult = undo(state);

    const redoResult = redo(undoResult.state);
    expect(redoResult.snapshot).toBe('snap-1');
    expect(redoResult.state.undoStack).toEqual(['snap-1']);
    expect(redoResult.state.redoStack).toEqual([]);
  });

  it('redo returns null snapshot when stack is empty', () => {
    const state = createEditorShellState();
    const result = redo(state);
    expect(result.snapshot).toBeNull();
    expect(result.state).toBe(state);
  });
});

describe('canUndo / canRedo / canGoBack / canGoForward', () => {
  it('reflects stack states', () => {
    let state = createEditorShellState();
    expect(canUndo(state)).toBe(false);
    expect(canRedo(state)).toBe(false);
    expect(canGoBack(state)).toBe(false);
    expect(canGoForward(state)).toBe(false);

    state = pushUndo(state, 'snap');
    expect(canUndo(state)).toBe(true);

    state = navigateTo(state, 'explorer');
    expect(canGoBack(state)).toBe(true);

    state = navigateBack(state);
    expect(canGoForward(state)).toBe(true);
  });
});

describe('setLoading / setError / clearError', () => {
  it('sets and clears loading', () => {
    let state = createEditorShellState();
    state = setLoading(state, true);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets error and stops loading', () => {
    let state = setLoading(createEditorShellState(), true);
    state = setError(state, 'fetch failed');
    expect(state.error).toBe('fetch failed');
    expect(state.loading).toBe(false);
  });

  it('clears error', () => {
    let state = setError(createEditorShellState(), 'err');
    state = clearError(state);
    expect(state.error).toBeNull();
  });

  it('clearError is no-op when no error', () => {
    const state = createEditorShellState();
    expect(clearError(state)).toBe(state);
  });
});

describe('setMeasures', () => {
  it('sets measures array', () => {
    const measures: MeasureDefinition[] = [
      {
        id: 'm1',
        name: 'Revenue',
        expression: 'SUM(amount)',
        dataType: 'currency',
        dataSourceId: 'ds1',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    const state = setMeasures(createEditorShellState(), measures);
    expect(state.measures).toEqual(measures);
  });
});

describe('toggleAutoSave / setAutoSaveDebounce', () => {
  it('toggles auto-save', () => {
    let state = createEditorShellState();
    expect(state.autoSaveEnabled).toBe(true);
    state = toggleAutoSave(state);
    expect(state.autoSaveEnabled).toBe(false);
  });

  it('sets debounce with minimum of 500ms', () => {
    let state = createEditorShellState();
    state = setAutoSaveDebounce(state, 3000);
    expect(state.autoSaveDebounceMs).toBe(3000);

    state = setAutoSaveDebounce(state, 100);
    expect(state.autoSaveDebounceMs).toBe(500); // clamped
  });
});
