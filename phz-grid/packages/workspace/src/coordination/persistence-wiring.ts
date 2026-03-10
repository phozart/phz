/**
 * persistence-wiring — Bridges editor save events, auto-save, undo/redo,
 * and conflict detection to WorkspaceAdapter persistence.
 *
 * Task 5.1: Save event bridge — catch save-report/save-dashboard events
 * Task 5.2: Auto-save wiring — debounced save on state changes
 * Task 5.3: Undo/redo wiring — generic state snapshot stack with listeners
 * Task 5.4: Publish workflow — uses existing publish-workflow-state.ts
 * Task 5.5: Conflict detection — local/remote version comparison
 *
 * Tasks: 5.1-5.5 (WB-021 through WB-025, WB-028)
 */

// ========================================================================
// Task 5.1: Save Event Bridge
// ========================================================================

/** Minimal adapter interface for save operations */
interface SaveAdapter {
  saveReport?(report: unknown): Promise<void>;
  saveDashboard?(dashboard: unknown): Promise<void>;
}

export interface SaveBridgeOptions {
  onSaveComplete?: (eventType: string, success: boolean, error?: string) => void;
}

export interface SaveEventBridge {
  handleSaveEvent(eventType: string, detail: Record<string, unknown>): Promise<void>;
}

/**
 * Bridge save events from editor components to WorkspaceAdapter persistence.
 * Listens for 'save-report' and 'save-dashboard' CustomEvents.
 */
export function createSaveEventBridge(
  adapter: SaveAdapter,
  options?: SaveBridgeOptions,
): SaveEventBridge {
  return {
    async handleSaveEvent(eventType: string, detail: Record<string, unknown>): Promise<void> {
      try {
        switch (eventType) {
          case 'save-report':
            await adapter.saveReport?.(detail.state ?? detail);
            break;
          case 'save-dashboard':
            await adapter.saveDashboard?.(detail.state ?? detail);
            break;
        }
        options?.onSaveComplete?.(eventType, true, undefined);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        options?.onSaveComplete?.(eventType, false, message);
      }
    },
  };
}

// ========================================================================
// Task 5.2: Auto-save Wiring
// ========================================================================

export interface AutoSaveOptions {
  debounceMs?: number;
}

export interface AutoSaveWiring {
  onStateChanged(state: { dirty?: boolean; [key: string]: unknown }): void;
  destroy(): void;
}

/**
 * Wire auto-save to a debounced save function.
 * Only triggers save when state is marked dirty.
 */
export function createAutoSaveWiring(
  saveFn: (state: unknown) => Promise<void>,
  options?: AutoSaveOptions,
): AutoSaveWiring {
  const debounceMs = options?.debounceMs ?? 30000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  return {
    onStateChanged(state: { dirty?: boolean; [key: string]: unknown }): void {
      if (destroyed || !state.dirty) return;

      // Cancel pending save
      if (timer !== null) clearTimeout(timer);

      timer = setTimeout(() => {
        timer = null;
        if (!destroyed) {
          saveFn(state).catch(() => {}); // errors handled by caller
        }
      }, debounceMs);
    },

    destroy(): void {
      destroyed = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

// ========================================================================
// Task 5.3: Undo/Redo Wiring
// ========================================================================

export interface UndoRedoWiring<T> {
  push(state: T): void;
  undo(): T | undefined;
  redo(): T | undefined;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  onStateRestore(listener: (state: T) => void): () => void;
}

/**
 * Generic undo/redo stack with state snapshot management.
 * Notifies listeners when state is restored via undo/redo.
 */
export function createUndoRedoWiring<T>(maxHistory: number = 50): UndoRedoWiring<T> {
  const undoStack: T[] = [];
  const redoStack: T[] = [];
  const listeners = new Set<(state: T) => void>();

  function notify(state: T): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    push(state: T): void {
      undoStack.push(state);
      redoStack.length = 0; // Clear redo on new action

      // Trim history if needed
      if (undoStack.length > maxHistory) {
        undoStack.shift();
      }
    },

    undo(): T | undefined {
      if (undoStack.length <= 1) return undefined;

      const current = undoStack.pop()!;
      redoStack.push(current);

      const previous = undoStack[undoStack.length - 1];
      notify(previous);
      return previous;
    },

    redo(): T | undefined {
      if (redoStack.length === 0) return undefined;

      const next = redoStack.pop()!;
      undoStack.push(next);
      notify(next);
      return next;
    },

    get canUndo(): boolean {
      return undoStack.length > 1;
    },

    get canRedo(): boolean {
      return redoStack.length > 0;
    },

    onStateRestore(listener: (state: T) => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

// ========================================================================
// Task 5.5: Conflict Detection
// ========================================================================

export interface ConflictResult {
  conflict: boolean;
  localVersion: number;
  remoteVersion: number;
}

export interface ConflictDetector {
  setLocalVersion(version: number): void;
  onSaveSuccess(newVersion: number): void;
  check(remoteVersion: number): ConflictResult;
}

/**
 * Detect conflicts between local and remote artifact versions.
 * When a save completes, update the local version. Before saving,
 * check if the remote version has advanced past our local version.
 */
export function createConflictDetector(): ConflictDetector {
  let localVersion = 0;

  return {
    setLocalVersion(version: number): void {
      localVersion = version;
    },

    onSaveSuccess(newVersion: number): void {
      localVersion = newVersion;
    },

    check(remoteVersion: number): ConflictResult {
      return {
        conflict: remoteVersion > localVersion,
        localVersion,
        remoteVersion,
      };
    },
  };
}
