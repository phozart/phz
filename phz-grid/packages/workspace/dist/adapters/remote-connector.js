/**
 * @phozart/workspace — Remote Data Connector (Q.1)
 *
 * Interface and in-memory implementation for browser-side connections
 * to URLs (CSV/JSON/Parquet) and REST APIs as data sources.
 */
export function connectionId(id) { return id; }
let _connCounter = 0;
function generateConnectionId() {
    return connectionId(`conn-${Date.now()}-${++_connCounter}`);
}
// --- Factory helpers ---
export function createURLConnection(opts) {
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
export function createAPIConnection(opts) {
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
// --- In-Memory Implementation ---
export class MemoryRemoteConnector {
    constructor() {
        this.connections = new Map();
    }
    async connectURL(opts) {
        const conn = createURLConnection(opts);
        conn.status = 'connected';
        conn.lastRefreshedAt = Date.now();
        this.connections.set(conn.id, conn);
        return conn;
    }
    async connectAPI(opts) {
        const conn = createAPIConnection(opts);
        conn.status = 'connected';
        conn.lastRefreshedAt = Date.now();
        this.connections.set(conn.id, conn);
        return conn;
    }
    async refresh(id) {
        const conn = this.connections.get(id);
        if (!conn)
            throw new Error(`Connection ${id} not found`);
        conn.lastRefreshedAt = Date.now();
        conn.status = 'connected';
        conn.errorMessage = undefined;
        return conn;
    }
    async listConnections() {
        return Array.from(this.connections.values());
    }
    async removeConnection(id) {
        this.connections.delete(id);
    }
}
//# sourceMappingURL=remote-connector.js.map