import { describe, it, expect, vi } from 'vitest';
import { MutationManager } from '../mutation-manager.js';
import type {
  DataMutationProvider,
  MutationResult,
  MutationConflict,
} from '../types/server.js';

type TestRow = { id: string; name: string; age: number };

function createMockProvider(): DataMutationProvider<TestRow> {
  return {
    insertRow: vi.fn(async (data: TestRow): Promise<MutationResult<TestRow>> => ({
      success: true,
      data: { ...data, id: 'server-generated-id' },
    })),
    updateRow: vi.fn(
      async (rowId: string, changes: Partial<TestRow>): Promise<MutationResult<TestRow>> => ({
        success: true,
        data: { id: rowId, name: 'Updated', age: 99, ...changes },
      }),
    ),
    deleteRow: vi.fn(async (): Promise<MutationResult<void>> => ({
      success: true,
    })),
  };
}

describe('WI 21: MutationManager — optimistic apply', () => {
  it('applies insert optimistically and confirms on success', async () => {
    const provider = createMockProvider();
    const onOptimistic = vi.fn();
    const onConfirm = vi.fn();

    const manager = new MutationManager(provider, { onOptimistic, onConfirm });

    const newRow: TestRow = { id: 'temp-1', name: 'Alice', age: 30 };
    await manager.insert(newRow);

    expect(onOptimistic).toHaveBeenCalledWith('insert', newRow);
    expect(onConfirm).toHaveBeenCalledWith(
      'insert',
      expect.objectContaining({ id: 'server-generated-id' }),
    );
    expect(provider.insertRow).toHaveBeenCalledWith(newRow);
  });

  it('applies update optimistically and confirms on success', async () => {
    const provider = createMockProvider();
    const onOptimistic = vi.fn();
    const onConfirm = vi.fn();

    const manager = new MutationManager(provider, { onOptimistic, onConfirm });

    await manager.update('row-1', { name: 'Bob' });

    expect(onOptimistic).toHaveBeenCalledWith('update', { rowId: 'row-1', changes: { name: 'Bob' } });
    expect(onConfirm).toHaveBeenCalledWith(
      'update',
      expect.objectContaining({ name: 'Bob' }),
    );
  });

  it('applies delete optimistically and confirms on success', async () => {
    const provider = createMockProvider();
    const onOptimistic = vi.fn();
    const onConfirm = vi.fn();

    const manager = new MutationManager(provider, { onOptimistic, onConfirm });

    await manager.delete('row-1');

    expect(onOptimistic).toHaveBeenCalledWith('delete', { rowId: 'row-1' });
    expect(onConfirm).toHaveBeenCalledWith('delete', undefined);
  });
});

describe('WI 21: MutationManager — revert on failure', () => {
  it('reverts on insert failure', async () => {
    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(async () => ({ success: false, error: 'Validation failed' })),
      updateRow: vi.fn(async () => ({ success: true })),
      deleteRow: vi.fn(async () => ({ success: true })),
    };
    const onRevert = vi.fn();

    const manager = new MutationManager(provider, { onRevert });

    const result = await manager.insert({ id: '1', name: 'X', age: 0 });

    expect(result.success).toBe(false);
    expect(onRevert).toHaveBeenCalledWith('insert', { id: '1', name: 'X', age: 0 }, 'Validation failed');
  });

  it('reverts on update failure', async () => {
    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(async () => ({ success: true })),
      updateRow: vi.fn(async () => ({ success: false, error: 'Not found' })),
      deleteRow: vi.fn(async () => ({ success: true })),
    };
    const onRevert = vi.fn();

    const manager = new MutationManager(provider, { onRevert });

    const result = await manager.update('row-1', { name: 'fail' });
    expect(result.success).toBe(false);
    expect(onRevert).toHaveBeenCalledWith(
      'update',
      { rowId: 'row-1', changes: { name: 'fail' } },
      'Not found',
    );
  });

  it('reverts on network error (exception)', async () => {
    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(async () => {
        throw new Error('Network error');
      }),
      updateRow: vi.fn(async () => ({ success: true })),
      deleteRow: vi.fn(async () => ({ success: true })),
    };
    const onRevert = vi.fn();

    const manager = new MutationManager(provider, { onRevert });

    const result = await manager.insert({ id: '1', name: 'X', age: 0 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
    expect(onRevert).toHaveBeenCalled();
  });
});

describe('WI 21: MutationManager — conflict detection', () => {
  it('reports conflict on version mismatch (409)', async () => {
    const conflict: MutationConflict<TestRow> = {
      serverVersion: { id: 'row-1', name: 'ServerName', age: 40 },
      baseVersion: { id: 'row-1', name: 'BaseName', age: 30 },
      clientChanges: { name: 'ClientName' },
    };

    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(async () => ({ success: true })),
      updateRow: vi.fn(async () => ({
        success: false,
        error: 'Conflict',
        conflict,
      })),
      deleteRow: vi.fn(async () => ({ success: true })),
    };
    const onConflict = vi.fn();

    const manager = new MutationManager(provider, { onConflict });

    const result = await manager.update('row-1', { name: 'ClientName' });

    expect(result.success).toBe(false);
    expect(result.conflict).toBeDefined();
    expect(onConflict).toHaveBeenCalledWith('row-1', conflict);
  });
});

describe('WI 21: MutationManager — batch mutations', () => {
  it('executes batch when provider supports it', async () => {
    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(async () => ({ success: true })),
      updateRow: vi.fn(async () => ({ success: true })),
      deleteRow: vi.fn(async () => ({ success: true })),
      batch: vi.fn(async () => ({
        results: [
          { success: true, data: { id: '1', name: 'A', age: 1 } },
          { success: true, data: { id: '2', name: 'B', age: 2 } },
          { success: false, error: 'Validation failed' },
        ],
        successCount: 2,
        failureCount: 1,
      })),
    };

    const manager = new MutationManager(provider);

    const result = await manager.batch([
      { type: 'insert', data: { id: '1', name: 'A', age: 1 } },
      { type: 'update', rowId: '2', data: { name: 'B' } },
      { type: 'delete', rowId: '3' },
    ]);

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(provider.batch).toHaveBeenCalled();
  });

  it('falls back to individual operations when batch not supported', async () => {
    const provider = createMockProvider();

    const manager = new MutationManager(provider);

    const result = await manager.batch([
      { type: 'insert', data: { id: '1', name: 'A', age: 1 } },
      { type: 'update', rowId: '2', data: { name: 'B' } },
      { type: 'delete', rowId: '3' },
    ]);

    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(provider.insertRow).toHaveBeenCalledTimes(1);
    expect(provider.updateRow).toHaveBeenCalledTimes(1);
    expect(provider.deleteRow).toHaveBeenCalledTimes(1);
  });
});

describe('WI 21: MutationManager — pending state', () => {
  it('tracks pending mutations', async () => {
    let resolveInsert: (v: MutationResult<TestRow>) => void;
    const provider: DataMutationProvider<TestRow> = {
      insertRow: vi.fn(
        () =>
          new Promise<MutationResult<TestRow>>((resolve) => {
            resolveInsert = resolve;
          }),
      ),
      updateRow: vi.fn(async () => ({ success: true })),
      deleteRow: vi.fn(async () => ({ success: true })),
    };

    const manager = new MutationManager(provider);

    expect(manager.hasPendingMutations()).toBe(false);

    const promise = manager.insert({ id: '1', name: 'A', age: 1 });
    expect(manager.hasPendingMutations()).toBe(true);

    resolveInsert!({ success: true, data: { id: '1', name: 'A', age: 1 } });
    await promise;

    expect(manager.hasPendingMutations()).toBe(false);
  });
});
