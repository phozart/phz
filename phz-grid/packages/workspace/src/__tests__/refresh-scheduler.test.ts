import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RefreshScheduler,
  type RefreshStatus,
  type RefreshEntry,
} from '../adapters/refresh-scheduler.js';

describe('RefreshScheduler', () => {
  let scheduler: RefreshScheduler;
  let refreshFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    refreshFn = vi.fn().mockResolvedValue(undefined);
    scheduler = new RefreshScheduler(refreshFn);
  });

  afterEach(() => {
    scheduler.cancelAll();
    vi.useRealTimers();
  });

  describe('scheduleRefresh', () => {
    it('schedules a refresh for a connection', () => {
      scheduler.scheduleRefresh('conn-1', 60_000);

      const status = scheduler.getStatus('conn-1');
      expect(status).toBeDefined();
      expect(status!.connectionId).toBe('conn-1');
      expect(status!.intervalMs).toBe(60_000);
      expect(status!.state).toBe('scheduled');
    });

    it('calls the refresh function at the interval', async () => {
      scheduler.scheduleRefresh('conn-1', 1_000);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(refreshFn).toHaveBeenCalledWith('conn-1');

      await vi.advanceTimersByTimeAsync(1_000);
      expect(refreshFn).toHaveBeenCalledTimes(2);
    });

    it('replaces existing schedule for same connection', () => {
      scheduler.scheduleRefresh('conn-1', 60_000);
      scheduler.scheduleRefresh('conn-1', 30_000);

      const status = scheduler.getStatus('conn-1');
      expect(status!.intervalMs).toBe(30_000);
    });

    it('handles multiple connections independently', async () => {
      scheduler.scheduleRefresh('conn-1', 1_000);
      scheduler.scheduleRefresh('conn-2', 2_000);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(refreshFn).toHaveBeenCalledWith('conn-1');

      await vi.advanceTimersByTimeAsync(1_000);
      expect(refreshFn).toHaveBeenCalledTimes(3); // conn-1 again + conn-2
    });
  });

  describe('cancelRefresh', () => {
    it('cancels a scheduled refresh', async () => {
      scheduler.scheduleRefresh('conn-1', 1_000);
      scheduler.cancelRefresh('conn-1');

      await vi.advanceTimersByTimeAsync(2_000);
      expect(refreshFn).not.toHaveBeenCalled();

      const status = scheduler.getStatus('conn-1');
      expect(status).toBeUndefined();
    });

    it('is a no-op for unknown connection', () => {
      // Should not throw
      scheduler.cancelRefresh('nonexistent');
    });
  });

  describe('cancelAll', () => {
    it('cancels all scheduled refreshes', async () => {
      scheduler.scheduleRefresh('conn-1', 1_000);
      scheduler.scheduleRefresh('conn-2', 1_000);
      scheduler.cancelAll();

      await vi.advanceTimersByTimeAsync(5_000);
      expect(refreshFn).not.toHaveBeenCalled();

      expect(scheduler.getStatus('conn-1')).toBeUndefined();
      expect(scheduler.getStatus('conn-2')).toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('returns undefined for unknown connection', () => {
      expect(scheduler.getStatus('nonexistent')).toBeUndefined();
    });

    it('tracks lastRefreshedAt after successful refresh', async () => {
      scheduler.scheduleRefresh('conn-1', 1_000);
      await vi.advanceTimersByTimeAsync(1_000);

      const status = scheduler.getStatus('conn-1');
      expect(status!.lastRefreshedAt).toBeGreaterThan(0);
      expect(status!.state).toBe('scheduled');
    });

    it('tracks error state on refresh failure', async () => {
      refreshFn.mockRejectedValueOnce(new Error('Network error'));
      scheduler.scheduleRefresh('conn-1', 1_000);
      await vi.advanceTimersByTimeAsync(1_000);

      const status = scheduler.getStatus('conn-1');
      expect(status!.state).toBe('error');
      expect(status!.lastError).toBe('Network error');
    });

    it('recovers from error on next successful refresh', async () => {
      refreshFn.mockRejectedValueOnce(new Error('Network error'));
      scheduler.scheduleRefresh('conn-1', 1_000);

      await vi.advanceTimersByTimeAsync(1_000); // fails
      expect(scheduler.getStatus('conn-1')!.state).toBe('error');

      refreshFn.mockResolvedValueOnce(undefined);
      await vi.advanceTimersByTimeAsync(1_000); // succeeds
      expect(scheduler.getStatus('conn-1')!.state).toBe('scheduled');
      expect(scheduler.getStatus('conn-1')!.lastError).toBeUndefined();
    });
  });

  describe('getAllStatuses', () => {
    it('returns all tracked connections', () => {
      scheduler.scheduleRefresh('conn-1', 1_000);
      scheduler.scheduleRefresh('conn-2', 2_000);

      const all = scheduler.getAllStatuses();
      expect(all).toHaveLength(2);
      expect(all.map(s => s.connectionId).sort()).toEqual(['conn-1', 'conn-2']);
    });

    it('returns empty array when nothing is scheduled', () => {
      expect(scheduler.getAllStatuses()).toEqual([]);
    });
  });
});
