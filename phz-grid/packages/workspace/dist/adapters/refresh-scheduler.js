/**
 * @phozart/workspace — Refresh Scheduler (Q.4)
 *
 * Manages periodic background refreshes for remote data connections.
 * Uses setInterval internally; cancellable per-connection or globally.
 */
export class RefreshScheduler {
    constructor(refreshFn) {
        this.entries = new Map();
        this.refreshFn = refreshFn;
    }
    scheduleRefresh(connectionId, intervalMs) {
        // Cancel existing schedule for this connection
        this.cancelRefresh(connectionId);
        const status = {
            connectionId,
            intervalMs,
            state: 'scheduled',
        };
        const timerId = setInterval(async () => {
            const entry = this.entries.get(connectionId);
            if (!entry)
                return;
            entry.status.state = 'refreshing';
            try {
                await this.refreshFn(connectionId);
                entry.status.state = 'scheduled';
                entry.status.lastRefreshedAt = Date.now();
                entry.status.lastError = undefined;
            }
            catch (err) {
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
    cancelRefresh(connectionId) {
        const entry = this.entries.get(connectionId);
        if (entry) {
            clearInterval(entry.timerId);
            this.entries.delete(connectionId);
        }
    }
    cancelAll() {
        for (const entry of this.entries.values()) {
            clearInterval(entry.timerId);
        }
        this.entries.clear();
    }
    getStatus(connectionId) {
        return this.entries.get(connectionId)?.status;
    }
    getAllStatuses() {
        return Array.from(this.entries.values()).map(e => e.status);
    }
}
//# sourceMappingURL=refresh-scheduler.js.map