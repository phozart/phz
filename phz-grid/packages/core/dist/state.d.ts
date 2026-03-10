/**
 * @phozart/phz-core — State Management
 *
 * Immutable state tree with subscriber notifications.
 */
import type { GridState, SerializedGridState } from './types/state.js';
import type { ColumnDefinition } from './types/column.js';
import type { Unsubscribe, UserRole } from './types/common.js';
export type StatePriority = 'immediate' | 'deferred' | 'background';
export type StateListener<TData = any> = (state: GridState<TData>) => void;
export declare function createInitialState<TData = any>(columns: ColumnDefinition<TData>[], userRole?: UserRole): GridState<TData>;
export declare class StateManager<TData = any> {
    private state;
    private listeners;
    private selectorSubs;
    private batching;
    private _undoStack;
    private _redoStack;
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
    pushUndo(): void;
    undo(): boolean;
    redo(): boolean;
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