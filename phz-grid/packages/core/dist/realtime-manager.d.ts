/**
 * @phozart/core — RealtimeManager
 *
 * Manages real-time push updates from a generic RealtimeProvider.
 * Applies delta updates (insert/update/delete/refresh), detects
 * sequence gaps, and handles reconnection with full refresh.
 */
import type { RealtimeProvider, RealtimeConnectionState } from './types/server.js';
export interface RealtimeManagerCallbacks<T = unknown> {
    onInsert?: (rowId: string, data: T) => void;
    onUpdate?: (rowId: string, delta: Partial<T>) => void;
    onDelete?: (rowId: string) => void;
    onRefresh?: () => void;
    onConnectionChange?: (state: RealtimeConnectionState) => void;
}
export declare class RealtimeManager<T = unknown> {
    private provider;
    private callbacks;
    private unsubscribeData;
    private unsubscribeConnection;
    private lastSequence;
    private connectionState;
    private wasDisconnected;
    constructor(provider: RealtimeProvider<T>, callbacks?: RealtimeManagerCallbacks<T>);
    start(): void;
    stop(): void;
    getConnectionState(): RealtimeConnectionState;
    private handleUpdate;
    private handleConnectionChange;
}
//# sourceMappingURL=realtime-manager.d.ts.map