/**
 * @phozart/core — State Management
 *
 * Immutable state tree with subscriber notifications.
 */
import type { GridState, SerializedGridState } from './types/state.js';
import type { ColumnDefinition } from './types/column.js';
import type { Unsubscribe, UserRole } from './types/common.js';
export type StatePriority = 'immediate' | 'deferred' | 'background';
export type StateListener<TData = any> = (state: GridState<TData>) => void;
export declare function createInitialState<TData = any>(columns: ColumnDefinition<TData>[], userRole?: UserRole): GridState<TData>;
/**
 * Pin a column to the left or right edge at runtime.
 * Returns a new state with the pin override applied (immutable).
 */
export declare function pinColumn<TData = any>(state: GridState<TData>, field: string, side: 'left' | 'right'): GridState<TData>;
/**
 * Remove a runtime pin override for a column.
 * Sets the override to `null` so that it explicitly overrides any static
 * `col.frozen` value. Returns a new state (immutable).
 * Safe to call on a column that has no override.
 */
export declare function unpinColumn<TData = any>(state: GridState<TData>, field: string): GridState<TData>;
/**
 * Get the effective pin state for a column.
 * Checks `pinOverrides` first, then falls back to `col.frozen`.
 * Returns `null` when the column is not pinned.
 */
export declare function getEffectivePinState<TData = any>(state: GridState<TData>, col: ColumnDefinition): 'left' | 'right' | null;
export declare class StateManager<TData = any> {
    private state;
    private listeners;
    private selectorSubs;
    private batching;
    private _undoStack;
    private _redoStack;
    private _undoLabels;
    private _redoLabels;
    private _lastActionLabel?;
    private _pendingPriorities;
    private _backgroundTimer;
    constructor(initialState: GridState<TData>);
    getState(): Readonly<GridState<TData>>;
    setState(updater: Partial<GridState<TData>> | ((prev: GridState<TData>) => GridState<TData>), options?: {
        priority?: StatePriority;
    }): void;
    batch(fn: () => void): void;
    subscribe(listener: StateListener<TData>): Unsubscribe;
    subscribeSelector<T>(selector: (state: GridState<TData>) => T, callback: (selected: T, prev: T) => void, equalityFn?: (a: T, b: T) => boolean): Unsubscribe;
    pushUndo(label?: string): void;
    undo(): boolean;
    redo(): boolean;
    /** Execute a state mutation with automatic undo snapshot */
    performAction(label: string, fn: () => void): void;
    getLastActionLabel(): string | undefined;
    canUndo(): boolean;
    canRedo(): boolean;
    private updateHistory;
    getPendingPriorities(): StatePriority[];
    private dispatchListeners;
    private notifyImmediate;
    private notifyScheduled;
    private notify;
    private notifyBackground;
    exportState(options?: {
        sanitizeFilterValues?: boolean;
    }): SerializedGridState;
    importState(serialized: SerializedGridState): void;
    destroy(): void;
}
//# sourceMappingURL=state.d.ts.map