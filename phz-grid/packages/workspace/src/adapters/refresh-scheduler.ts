/**
 * @phozart/workspace — Refresh Scheduler (Q.4)
 *
 * Manages periodic background refreshes for remote data connections.
 * Uses setInterval internally; cancellable per-connection or globally.
 */

export interface RefreshStatus {
  connectionId: string;
  intervalMs: number;
  state: 'scheduled' | 'refreshing' | 'error';
  lastRefreshedAt?: number;
  lastError?: string;
}

export interface RefreshEntry {
  connectionId: string;
  intervalMs: number;
  timerId: ReturnType<typeof setInterval>;
  status: RefreshStatus;
}

export type RefreshFunction = (connectionId: string) => Promise<void>;

export class RefreshScheduler {
  private entries = new Map<string, RefreshEntry>();
  private refreshFn: RefreshFunction;

  constructor(refreshFn: RefreshFunction) {
    this.refreshFn = refreshFn;
  }

  scheduleRefresh(connectionId: string, intervalMs: number): void {
    // Cancel existing schedule for this connection
    this.cancelRefresh(connectionId);

    const status: RefreshStatus = {
      connectionId,
      intervalMs,
      state: 'scheduled',
    };

    const timerId = setInterval(async () => {
      const entry = this.entries.get(connectionId);
      if (!entry) return;

      entry.status.state = 'refreshing';

      try {
        await this.refreshFn(connectionId);
        entry.status.state = 'scheduled';
        entry.status.lastRefreshedAt = Date.now();
        entry.status.lastError = undefined;
      } catch (err) {
        entry.status.state = 'error';
        entry.status.lastError = err instanceof Error ? err.message : String(err);
      }
    }, intervalMs);

    this.entries.set(connectionId, {
      connectionId,
      intervalMs,
      timerId,
      status,
    });
  }

  cancelRefresh(connectionId: string): void {
    const entry = this.entries.get(connectionId);
    if (entry) {
      clearInterval(entry.timerId);
      this.entries.delete(connectionId);
    }
  }

  cancelAll(): void {
    for (const entry of this.entries.values()) {
      clearInterval(entry.timerId);
    }
    this.entries.clear();
  }

  getStatus(connectionId: string): RefreshStatus | undefined {
    return this.entries.get(connectionId)?.status;
  }

  getAllStatuses(): RefreshStatus[] {
    return Array.from(this.entries.values()).map(e => e.status);
  }
}
