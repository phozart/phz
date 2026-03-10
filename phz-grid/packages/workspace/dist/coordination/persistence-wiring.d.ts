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
export declare function createSaveEventBridge(adapter: SaveAdapter, options?: SaveBridgeOptions): SaveEventBridge;
export interface AutoSaveOptions {
    debounceMs?: number;
}
export interface AutoSaveWiring {
    onStateChanged(state: {
        dirty?: boolean;
        [key: string]: unknown;
    }): void;
    destroy(): void;
}
/**
 * Wire auto-save to a debounced save function.
 * Only triggers save when state is marked dirty.
 */
export declare function createAutoSaveWiring(saveFn: (state: unknown) => Promise<void>, options?: AutoSaveOptions): AutoSaveWiring;
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
export declare function createUndoRedoWiring<T>(maxHistory?: number): UndoRedoWiring<T>;
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
export declare function createConflictDetector(): ConflictDetector;
export {};
//# sourceMappingURL=persistence-wiring.d.ts.map