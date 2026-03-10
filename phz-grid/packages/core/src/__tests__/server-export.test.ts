import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerExportManager } from '../server-export-manager.js';
import type {
  ServerExportProvider,
  ServerExportRequest,
  ServerExportResponse,
  ExportProgress,
} from '../types/server.js';

function createSyncProvider(): ServerExportProvider {
  return {
    requestExport: vi.fn(async (): Promise<ServerExportResponse> => ({
      type: 'sync',
      downloadUrl: 'https://example.com/export.csv',
    })),
  };
}

function createAsyncProvider(): ServerExportProvider {
  let status: ExportProgress = {
    status: 'pending',
    progress: 0,
    rowsProcessed: 0,
  };

  return {
    requestExport: vi.fn(async (): Promise<ServerExportResponse> => {
      status = { status: 'processing', progress: 0, rowsProcessed: 0 };
      return { type: 'async', jobId: 'job-123' };
    }),
    getExportStatus: vi.fn(async (jobId: string): Promise<ExportProgress> => {
      if (status.progress < 1) {
        status.progress += 0.5;
        status.rowsProcessed += 500;
        if (status.progress >= 1) {
          status.status = 'completed';
          status.downloadUrl = 'https://example.com/export-job-123.csv';
        }
      }
      return { ...status };
    }),
    cancelExport: vi.fn(async () => {
      status = { status: 'cancelled', progress: 0, rowsProcessed: 0 };
    }),
  };
}

describe('WI 19: ServerExportManager — sync export', () => {
  it('returns download URL immediately for sync export', async () => {
    const provider = createSyncProvider();
    const manager = new ServerExportManager(provider);
    const request: ServerExportRequest = { format: 'csv' };

    const result = await manager.startExport(request);

    expect(result.downloadUrl).toBe('https://example.com/export.csv');
    expect(result.status).toBe('completed');
    expect(provider.requestExport).toHaveBeenCalledWith(request);
  });
});

describe('WI 19: ServerExportManager — async export', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls progress for async export', async () => {
    const provider = createAsyncProvider();
    const onProgress = vi.fn();
    const manager = new ServerExportManager(provider, { pollIntervalMs: 100 });

    const exportPromise = manager.startExport({ format: 'csv' }, onProgress);

    // First poll
    await vi.advanceTimersByTimeAsync(100);
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 0.5, status: 'processing' }),
    );

    // Second poll — completes
    await vi.advanceTimersByTimeAsync(100);

    const result = await exportPromise;
    expect(result.status).toBe('completed');
    expect(result.downloadUrl).toBe('https://example.com/export-job-123.csv');
    expect(provider.getExportStatus).toHaveBeenCalledTimes(2);
  });

  it('cancels an async export', async () => {
    const provider = createAsyncProvider();
    const manager = new ServerExportManager(provider, { pollIntervalMs: 100 });

    const exportPromise = manager.startExport({ format: 'xlsx' });

    // Let the initial request happen
    await vi.advanceTimersByTimeAsync(0);

    // Cancel it
    await manager.cancelExport();
    expect(provider.cancelExport).toHaveBeenCalledWith('job-123');

    // Advance past poll interval — should not poll anymore
    await vi.advanceTimersByTimeAsync(200);
    expect(provider.getExportStatus).not.toHaveBeenCalled();

    const result = await exportPromise;
    expect(result.status).toBe('cancelled');
  });
});

describe('WI 19: ServerExportManager — fallback', () => {
  it('hasServerExport returns false when no provider', () => {
    const manager = new ServerExportManager(undefined);
    expect(manager.hasServerExport()).toBe(false);
  });

  it('hasServerExport returns true when provider exists', () => {
    const manager = new ServerExportManager(createSyncProvider());
    expect(manager.hasServerExport()).toBe(true);
  });

  it('throws when trying to export without provider', async () => {
    const manager = new ServerExportManager(undefined);
    await expect(manager.startExport({ format: 'csv' })).rejects.toThrow(
      'No server export provider',
    );
  });
});

describe('WI 19: ServerExportManager — error handling', () => {
  it('handles export request failure', async () => {
    const provider: ServerExportProvider = {
      requestExport: vi.fn(async () => {
        throw new Error('Export service unavailable');
      }),
    };
    const manager = new ServerExportManager(provider);

    await expect(manager.startExport({ format: 'csv' })).rejects.toThrow(
      'Export service unavailable',
    );
  });
});
