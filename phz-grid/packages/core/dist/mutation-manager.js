/**
 * @phozart/core — MutationManager
 *
 * Orchestrates optimistic mutations with server write-back.
 * Applies changes optimistically, reverts on failure, reports conflicts.
 */
export class MutationManager {
    provider;
    callbacks;
    pendingCount = 0;
    constructor(provider, callbacks = {}) {
        this.provider = provider;
        this.callbacks = callbacks;
    }
    hasPendingMutations() {
        return this.pendingCount > 0;
    }
    async insert(data) {
        this.pendingCount++;
        this.callbacks.onOptimistic?.('insert', data);
        try {
            const result = await this.provider.insertRow(data);
            if (result.success) {
                this.callbacks.onConfirm?.('insert', result.data);
            }
            else {
                this.callbacks.onRevert?.('insert', data, result.error || 'Insert failed');
            }
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.callbacks.onRevert?.('insert', data, error);
            return { success: false, error };
        }
        finally {
            this.pendingCount--;
        }
    }
    async update(rowId, changes) {
        this.pendingCount++;
        const mutationData = { rowId, changes };
        this.callbacks.onOptimistic?.('update', mutationData);
        try {
            const result = await this.provider.updateRow(rowId, changes);
            if (result.success) {
                this.callbacks.onConfirm?.('update', result.data);
            }
            else {
                if (result.conflict) {
                    this.callbacks.onConflict?.(rowId, result.conflict);
                }
                this.callbacks.onRevert?.('update', mutationData, result.error || 'Update failed');
            }
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.callbacks.onRevert?.('update', mutationData, error);
            return { success: false, error };
        }
        finally {
            this.pendingCount--;
        }
    }
    async delete(rowId) {
        this.pendingCount++;
        const mutationData = { rowId };
        this.callbacks.onOptimistic?.('delete', mutationData);
        try {
            const result = await this.provider.deleteRow(rowId);
            if (result.success) {
                this.callbacks.onConfirm?.('delete', undefined);
            }
            else {
                this.callbacks.onRevert?.('delete', mutationData, result.error || 'Delete failed');
            }
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.callbacks.onRevert?.('delete', mutationData, error);
            return { success: false, error };
        }
        finally {
            this.pendingCount--;
        }
    }
    async batch(operations) {
        if (this.provider.batch) {
            return this.provider.batch(operations);
        }
        // Fallback: execute individually
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        for (const op of operations) {
            let result;
            switch (op.type) {
                case 'insert':
                    result = await this.provider.insertRow(op.data);
                    break;
                case 'update':
                    result = await this.provider.updateRow(op.rowId, op.data);
                    break;
                case 'delete':
                    result = await this.provider.deleteRow(op.rowId);
                    break;
            }
            results.push(result);
            if (result.success)
                successCount++;
            else
                failureCount++;
        }
        return { results, successCount, failureCount };
    }
}
//# sourceMappingURL=mutation-manager.js.map