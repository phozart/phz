/**
 * @phozart/workspace — Remote Data Connector (Q.1)
 *
 * Interface and in-memory implementation for browser-side connections
 * to URLs (CSV/JSON/Parquet) and REST APIs as data sources.
 */
export type ConnectionId = string & {
    readonly __brand: 'ConnectionId';
};
export declare function connectionId(id: string): ConnectionId;
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'refreshing';
export interface URLConnectionConfig {
    url: string;
    format: 'csv' | 'json' | 'parquet';
    refreshIntervalMs?: number;
    headers?: Record<string, string>;
}
export interface APIConnectionConfig {
    endpoint: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    pagination?: {
        type: 'offset' | 'cursor';
        pageSize: number;
        cursorField?: string;
    };
    resultPath?: string;
}
export interface RemoteConnection {
    id: ConnectionId;
    name: string;
    type: 'url' | 'api';
    config: URLConnectionConfig | APIConnectionConfig;
    status: ConnectionStatus;
    createdAt: number;
    lastRefreshedAt?: number;
    errorMessage?: string;
}
export declare function createURLConnection(opts: {
    name: string;
    url: string;
    format: URLConnectionConfig['format'];
    refreshIntervalMs?: number;
    headers?: Record<string, string>;
}): RemoteConnection;
export declare function createAPIConnection(opts: {
    name: string;
    endpoint: string;
    method: APIConnectionConfig['method'];
    headers?: Record<string, string>;
    body?: string;
    pagination?: APIConnectionConfig['pagination'];
    resultPath?: string;
}): RemoteConnection;
export interface RemoteDataConnector {
    connectURL(opts: {
        name: string;
        url: string;
        format: URLConnectionConfig['format'];
        refreshIntervalMs?: number;
        headers?: Record<string, string>;
    }): Promise<RemoteConnection>;
    connectAPI(opts: {
        name: string;
        endpoint: string;
        method: APIConnectionConfig['method'];
        headers?: Record<string, string>;
        body?: string;
        pagination?: APIConnectionConfig['pagination'];
    }): Promise<RemoteConnection>;
    refresh(id: ConnectionId): Promise<RemoteConnection>;
    listConnections(): Promise<RemoteConnection[]>;
    removeConnection(id: ConnectionId): Promise<void>;
}
export declare class MemoryRemoteConnector implements RemoteDataConnector {
    private connections;
    connectURL(opts: {
        name: string;
        url: string;
        format: URLConnectionConfig['format'];
        refreshIntervalMs?: number;
        headers?: Record<string, string>;
    }): Promise<RemoteConnection>;
    connectAPI(opts: {
        name: string;
        endpoint: string;
        method: APIConnectionConfig['method'];
        headers?: Record<string, string>;
        body?: string;
        pagination?: APIConnectionConfig['pagination'];
    }): Promise<RemoteConnection>;
    refresh(id: ConnectionId): Promise<RemoteConnection>;
    listConnections(): Promise<RemoteConnection[]>;
    removeConnection(id: ConnectionId): Promise<void>;
}
//# sourceMappingURL=remote-connector.d.ts.map