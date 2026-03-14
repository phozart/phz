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
export declare class RefreshScheduler {
    private entries;
    private refreshFn;
    constructor(refreshFn: RefreshFunction);
    scheduleRefresh(connectionId: string, intervalMs: number): void;
    cancelRefresh(connectionId: string): void;
    cancelAll(): void;
    getStatus(connectionId: string): RefreshStatus | undefined;
    getAllStatuses(): RefreshStatus[];
}
//# sourceMappingURL=refresh-scheduler.d.ts.map