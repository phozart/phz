/**
 * @phozart/phz-core — MutationManager
 *
 * Orchestrates optimistic mutations with server write-back.
 * Applies changes optimistically, reverts on failure, reports conflicts.
 */

import type {
  DataMutationProvider,
  MutationResult,
  MutationConflict,
  MutationOperation,
  BatchMutationResult,
} from './types/server.js';

export interface MutationManagerCallbacks<T = unknown> {
  onOptimistic?: (type: 'insert' | 'update' | 'delete', data: unknown) => void;
  onConfirm?: (type: 'insert' | 'update' | 'delete', data: unknown) => void;
  onRevert?: (type: 'insert' | 'update' | 'delete', data: unknown, error: string) => void;
  onConflict?: (rowId: string, conflict: MutationConflict<T>) => void;
}

export class MutationManager<T = unknown> {
  private provider: DataMutationProvider<T>;
  private callbacks: MutationManagerCallbacks<T>;
  private pendingCount = 0;

  constructor(
    provider: DataMutationProvider<T>,
    callbacks: MutationManagerCallbacks<T> = {},
  ) {
    this.provider = provider;
    this.callbacks = callbacks;
  }

  hasPendingMutations(): boolean {
    return this.pendingCount > 0;
  }

  async insert(data: T): Promise<MutationResult<T>> {
    this.pendingCount++;
    this.callbacks.onOptimistic?.('insert', data);

    try {
      const result = await this.provider.insertRow(data);
      if (result.success) {
        this.callbacks.onConfirm?.('insert', result.data);
      } else {
        this.callbacks.onRevert?.('insert', data, result.error || 'Insert failed');
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.callbacks.onRevert?.('insert', data, error);
      return { success: false, error };
    } finally {
      this.pendingCount--;
    }
  }

  async update(rowId: string, changes: Partial<T>): Promise<MutationResult<T>> {
    this.pendingCount++;
    const mutationData = { rowId, changes };
    this.callbacks.onOptimistic?.('update', mutationData);

    try {
      const result = await this.provider.updateRow(rowId, changes);
      if (result.success) {
        this.callbacks.onConfirm?.('update', result.data);
      } else {
        if (result.conflict) {
          this.callbacks.onConflict?.(rowId, result.conflict);
        }
        this.callbacks.onRevert?.('update', mutationData, result.error || 'Update failed');
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.callbacks.onRevert?.('update', mutationData, error);
      return { success: false, error };
    } finally {
      this.pendingCount--;
    }
  }

  async delete(rowId: string): Promise<MutationResult<void>> {
    this.pendingCount++;
    const mutationData = { rowId };
    this.callbacks.onOptimistic?.('delete', mutationData);

    try {
      const result = await this.provider.deleteRow(rowId);
      if (result.success) {
        this.callbacks.onConfirm?.('delete', undefined);
      } else {
        this.callbacks.onRevert?.('delete', mutationData, result.error || 'Delete failed');
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.callbacks.onRevert?.('delete', mutationData, error);
      return { success: false, error };
    } finally {
      this.pendingCount--;
    }
  }

  async batch(
    operations: MutationOperation<T>[],
  ): Promise<BatchMutationResult<T>> {
    if (this.provider.batch) {
      return this.provider.batch(operations);
    }

    // Fallback: execute individually
    const results: MutationResult<T>[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const op of operations) {
      let result: MutationResult<any>;
      switch (op.type) {
        case 'insert':
          result = await this.provider.insertRow(op.data as T);
          break;
        case 'update':
          result = await this.provider.updateRow(op.rowId!, op.data as Partial<T>);
          break;
        case 'delete':
          result = await this.provider.deleteRow(op.rowId!);
          break;
      }
      results.push(result);
      if (result.success) successCount++;
      else failureCount++;
    }

    return { results, successCount, failureCount };
  }
}
