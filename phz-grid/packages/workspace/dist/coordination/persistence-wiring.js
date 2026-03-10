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
/**
 * Bridge save events from editor components to WorkspaceAdapter persistence.
 * Listens for 'save-report' and 'save-dashboard' CustomEvents.
 */
export function createSaveEventBridge(adapter, options) {
    return {
        async handleSaveEvent(eventType, detail) {
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
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                options?.onSaveComplete?.(eventType, false, message);
            }
        },
    };
}
/**
 * Wire auto-save to a debounced save function.
 * Only triggers save when state is marked dirty.
 */
export function createAutoSaveWiring(saveFn, options) {
    const debounceMs = options?.debounceMs ?? 30000;
    let timer = null;
    let destroyed = false;
    return {
        onStateChanged(state) {
            if (destroyed || !state.dirty)
                return;
            // Cancel pending save
            if (timer !== null)
                clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                if (!destroyed) {
                    saveFn(state).catch(() => { }); // errors handled by caller
                }
            }, debounceMs);
        },
        destroy() {
            destroyed = true;
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        },
    };
}
/**
 * Generic undo/redo stack with state snapshot management.
 * Notifies listeners when state is restored via undo/redo.
 */
export function createUndoRedoWiring(maxHistory = 50) {
    const undoStack = [];
    const redoStack = [];
    const listeners = new Set();
    function notify(state) {
        for (const listener of listeners) {
            listener(state);
        }
    }
    return {
        push(state) {
            undoStack.push(state);
            redoStack.length = 0; // Clear redo on new action
            // Trim history if needed
            if (undoStack.length > maxHistory) {
                undoStack.shift();
            }
        },
        undo() {
            if (undoStack.length <= 1)
                return undefined;
            const current = undoStack.pop();
            redoStack.push(current);
            const previous = undoStack[undoStack.length - 1];
            notify(previous);
            return previous;
        },
        redo() {
            if (redoStack.length === 0)
                return undefined;
            const next = redoStack.pop();
            undoStack.push(next);
            notify(next);
            return next;
        },
        get canUndo() {
            return undoStack.length > 1;
        },
        get canRedo() {
            return redoStack.length > 0;
        },
        onStateRestore(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}
/**
 * Detect conflicts between local and remote artifact versions.
 * When a save completes, update the local version. Before saving,
 * check if the remote version has advanced past our local version.
 */
export function createConflictDetector() {
    let localVersion = 0;
    return {
        setLocalVersion(version) {
            localVersion = version;
        },
        onSaveSuccess(newVersion) {
            localVersion = newVersion;
        },
        check(remoteVersion) {
            return {
                conflict: remoteVersion > localVersion,
                localVersion,
                remoteVersion,
            };
        },
    };
}
//# sourceMappingURL=persistence-wiring.js.map