/**
 * @phozart/workspace — Remote Data Connector (Q.1)
 *
 * Interface and in-memory implementation for browser-side connections
 * to URLs (CSV/JSON/Parquet) and REST APIs as data sources.
 */

// --- Branded Id ---
export type ConnectionId = string & { readonly __brand: 'ConnectionId' };
export function connectionId(id: string): ConnectionId { return id as ConnectionId; }

let _connCounter = 0;
function generateConnectionId(): ConnectionId {
  return connectionId(`conn-${Date.now()}-${++_connCounter}`);
}

// --- Connection Status ---
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'refreshing';

// --- URL Connection ---
export interface URLConnectionConfig {
  url: string;
  format: 'csv' | 'json' | 'parquet';
  refreshIntervalMs?: number;
  headers?: Record<string, string>;
}

// --- API Connection ---
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

// --- Remote Connection Record ---
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

// --- Factory helpers ---
export function createURLConnection(opts: {
  name: string;
  url: string;
  format: URLConnectionConfig['format'];
  refreshIntervalMs?: number;
  headers?: Record<string, string>;
}): RemoteConnection {
  return {
    id: generateConnectionId(),
    name: opts.name,
    type: 'url',
    config: {
      url: opts.url,
      format: opts.format,
      refreshIntervalMs: opts.refreshIntervalMs,
      headers: opts.headers,
    },
    status: 'idle',
    createdAt: Date.now(),
  };
}

export function createAPIConnection(opts: {
  name: string;
  endpoint: string;
  method: APIConnectionConfig['method'];
  headers?: Record<string, string>;
  body?: string;
  pagination?: APIConnectionConfig['pagination'];
  resultPath?: string;
}): RemoteConnection {
  return {
    id: generateConnectionId(),
    name: opts.name,
    type: 'api',
    config: {
      endpoint: opts.endpoint,
      method: opts.method,
      headers: opts.headers,
      body: opts.body,
      pagination: opts.pagination,
      resultPath: opts.resultPath,
    },
    status: 'idle',
    createdAt: Date.now(),
  };
}

// --- RemoteDataConnector Interface ---
export interface RemoteDataConnector {
  connectURL(opts: { name: string; url: string; format: URLConnectionConfig['format']; refreshIntervalMs?: number; headers?: Record<string, string> }): Promise<RemoteConnection>;
  connectAPI(opts: { name: string; endpoint: string; method: APIConnectionConfig['method']; headers?: Record<string, string>; body?: string; pagination?: APIConnectionConfig['pagination'] }): Promise<RemoteConnection>;
  refresh(id: ConnectionId): Promise<RemoteConnection>;
  listConnections(): Promise<RemoteConnection[]>;
  removeConnection(id: ConnectionId): Promise<void>;
}

// --- In-Memory Implementation ---
export class MemoryRemoteConnector implements RemoteDataConnector {
  private connections = new Map<string, RemoteConnection>();

  async connectURL(opts: {
    name: string;
    url: string;
    format: URLConnectionConfig['format'];
    refreshIntervalMs?: number;
    headers?: Record<string, string>;
  }): Promise<RemoteConnection> {
    const conn = createURLConnection(opts);
    conn.status = 'connected';
    conn.lastRefreshedAt = Date.now();
    this.connections.set(conn.id as string, conn);
    return conn;
  }

  async connectAPI(opts: {
    name: string;
    endpoint: string;
    method: APIConnectionConfig['method'];
    headers?: Record<string, string>;
    body?: string;
    pagination?: APIConnectionConfig['pagination'];
  }): Promise<RemoteConnection> {
    const conn = createAPIConnection(opts);
    conn.status = 'connected';
    conn.lastRefreshedAt = Date.now();
    this.connections.set(conn.id as string, conn);
    return conn;
  }

  async refresh(id: ConnectionId): Promise<RemoteConnection> {
    const conn = this.connections.get(id as string);
    if (!conn) throw new Error(`Connection ${id} not found`);

    conn.lastRefreshedAt = Date.now();
    conn.status = 'connected';
    conn.errorMessage = undefined;
    return conn;
  }

  async listConnections(): Promise<RemoteConnection[]> {
    return Array.from(this.connections.values());
  }

  async removeConnection(id: ConnectionId): Promise<void> {
    this.connections.delete(id as string);
  }
}
