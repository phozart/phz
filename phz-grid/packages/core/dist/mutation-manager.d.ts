/**
 * @phozart/core — MutationManager
 *
 * Orchestrates optimistic mutations with server write-back.
 * Applies changes optimistically, reverts on failure, reports conflicts.
 */
import type { DataMutationProvider, MutationResult, MutationConflict, MutationOperation, BatchMutationResult } from './types/server.js';
export interface MutationManagerCallbacks<T = unknown> {
    onOptimistic?: (type: 'insert' | 'update' | 'delete', data: unknown) => void;
    onConfirm?: (type: 'insert' | 'update' | 'delete', data: unknown) => void;
    onRevert?: (type: 'insert' | 'update' | 'delete', data: unknown, error: string) => void;
    onConflict?: (rowId: string, conflict: MutationConflict<T>) => void;
}
export declare class MutationManager<T = unknown> {
    private provider;
    private callbacks;
    private pendingCount;
    constructor(provider: DataMutationProvider<T>, callbacks?: MutationManagerCallbacks<T>);
    hasPendingMutations(): boolean;
    insert(data: T): Promise<MutationResult<T>>;
    update(rowId: string, changes: Partial<T>): Promise<MutationResult<T>>;
    delete(rowId: string): Promise<MutationResult<void>>;
    batch(operations: MutationOperation<T>[]): Promise<BatchMutationResult<T>>;
}
//# sourceMappingURL=mutation-manager.d.ts.map