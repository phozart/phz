/**
 * @phozart/phz-collab — Type Definitions
 *
 * Real-time collaboration types using Yjs CRDTs.
 */
import type { GridApi, RowId, RowData, CellPosition, ColumnDefinition, GridState, Unsubscribe } from '@phozart/phz-core';
export interface YDoc {
    getArray<T = unknown>(name: string): YArray<T>;
    getMap<T = unknown>(name: string): YMap<T>;
    transact(fn: () => void): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    destroy(): void;
}
export interface YArray<T = unknown> {
    toArray(): T[];
    push(content: T[]): void;
    delete(index: number, length: number): void;
    get(index: number): T;
    length: number;
    observe(handler: (event: unknown) => void): void;
    unobserve(handler: (event: unknown) => void): void;
}
export interface YMap<T = unknown> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): void;
    has(key: string): boolean;
    toJSON(): Record<string, T>;
    forEach(fn: (value: T, key: string) => void): void;
    observe(handler: (event: unknown) => void): void;
    unobserve(handler: (event: unknown) => void): void;
}
export interface CollabConfig {
    sessionId?: string;
    userId: string;
    userName: string;
    userColor?: string;
    conflictResolution?: ConflictStrategy;
    enablePresence?: boolean;
    enableHistory?: boolean;
    historyLimit?: number;
    /** Fields to mask when syncing data to Yjs. Values are replaced with '****'. */
    maskFields?: string[];
}
export type ConflictStrategy = 'last-write-wins' | 'manual' | 'custom';
export interface CollabSession {
    connect(provider: SyncProvider): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getConnectionState(): ConnectionState;
    getPresence(): ReadonlyMap<UserId, UserPresence>;
    updatePresence(data: Partial<UserPresence>): void;
    onPresenceChange(handler: (presenceMap: Map<UserId, UserPresence>) => void): Unsubscribe;
    onRemoteChange(handler: (change: RemoteChange) => void): Unsubscribe;
    onLocalChange(handler: (change: LocalChange) => void): Unsubscribe;
    getChangeHistory(options?: HistoryOptions): ChangeEntry[];
    getSessionInfo(): SessionInfo;
    getUserInfo(userId: UserId): UserInfo | undefined;
    onConflict(handler: (conflict: Conflict) => ConflictResolution): Unsubscribe;
    resolveConflict(conflictId: string, resolution: ConflictResolution): void;
    getYDoc(): YDoc;
    attachToGrid(grid: GridApi): void;
    detachFromGrid(): void;
    destroy(): void;
}
export type UserId = string;
export interface UserPresence {
    userId: UserId;
    userName: string;
    userColor: string;
    cursor?: CellPosition;
    selection?: CellPosition[];
    editing?: CellPosition;
    lastActivity: number;
    online: boolean;
}
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export interface RemoteChange {
    type: 'cell' | 'row' | 'column' | 'state';
    userId: UserId;
    timestamp: number;
    change: CellChange | RowChange | ColumnChange | StateChange;
}
export interface LocalChange {
    type: 'cell' | 'row' | 'column' | 'state';
    timestamp: number;
    change: CellChange | RowChange | ColumnChange | StateChange;
}
export interface CellChange {
    position: CellPosition;
    oldValue: unknown;
    newValue: unknown;
}
export interface RowChange {
    action: 'add' | 'update' | 'delete';
    rowId: RowId;
    data?: RowData;
}
export interface ColumnChange {
    action: 'add' | 'update' | 'delete' | 'reorder';
    field: string;
    data?: ColumnDefinition;
    newIndex?: number;
}
export interface StateChange {
    field: keyof GridState;
    oldValue: unknown;
    newValue: unknown;
}
export interface HistoryOptions {
    limit?: number;
    since?: number;
    userId?: UserId;
    type?: 'cell' | 'row' | 'column' | 'state';
}
export interface ChangeEntry {
    id: string;
    userId: UserId;
    timestamp: number;
    type: 'cell' | 'row' | 'column' | 'state';
    change: CellChange | RowChange | ColumnChange | StateChange;
}
export interface SessionInfo {
    sessionId: string;
    createdAt: number;
    connectedUsers: number;
    totalChanges: number;
}
export interface UserInfo {
    userId: UserId;
    userName: string;
    userColor: string;
    joinedAt: number;
    changeCount: number;
}
export interface Conflict {
    id: string;
    type: 'cell' | 'row' | 'column';
    position?: CellPosition;
    rowId?: RowId;
    field?: string;
    localValue: unknown;
    remoteValue: unknown;
    localUserId: UserId;
    remoteUserId: UserId;
    timestamp: number;
}
export interface ConflictResolution {
    conflictId: string;
    resolution: 'local' | 'remote' | 'merge' | 'custom';
    customValue?: unknown;
}
export interface SyncProvider {
    name: string;
    connect(doc: YDoc, sessionId: string): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
}
export interface WebSocketSyncConfig {
    url: string;
    protocols?: string[];
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    auth?: {
        token?: string;
        headers?: Record<string, string>;
    };
}
export interface WebRTCSyncConfig {
    signalingServer: string;
    iceServers?: RTCIceServer[];
    enableDataChannelOptimization?: boolean;
}
export interface YGridDocument {
    rows: YArray<YMap<unknown>>;
    columns: YArray<YMap<unknown>>;
    state: YMap<unknown>;
    presence: YMap<UserPresence>;
}
//# sourceMappingURL=types.d.ts.map