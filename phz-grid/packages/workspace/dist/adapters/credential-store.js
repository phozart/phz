/**
 * @phozart/workspace — Credential Store (Q.3)
 *
 * Interface for storing connection credentials securely.
 * In-memory implementation for Node/test environments.
 * Browser implementations can use OPFS or IndexedDB behind the same interface.
 */
// --- In-Memory Implementation ---
export class MemoryCredentialStore {
    constructor() {
        this.credentials = new Map();
    }
    async save(connectionId, credential) {
        this.credentials.set(connectionId, credential);
    }
    async load(connectionId) {
        return this.credentials.get(connectionId);
    }
    async delete(connectionId) {
        this.credentials.delete(connectionId);
    }
    async clear() {
        this.credentials.clear();
    }
}
//# sourceMappingURL=credential-store.js.map