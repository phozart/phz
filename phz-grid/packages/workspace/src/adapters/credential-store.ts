/**
 * @phozart/workspace — Credential Store (Q.3)
 *
 * Interface for storing connection credentials securely.
 * In-memory implementation for Node/test environments.
 * Browser implementations can use OPFS or IndexedDB behind the same interface.
 */

// --- Stored Credential (discriminated union) ---
export type StoredCredential =
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'api-key'; key: string; value: string }
  | { type: 'custom-headers'; headers: Record<string, string> };

// --- CredentialStore Interface ---
export interface CredentialStore {
  save(connectionId: string, credential: StoredCredential): Promise<void>;
  load(connectionId: string): Promise<StoredCredential | undefined>;
  delete(connectionId: string): Promise<void>;
  clear(): Promise<void>;
}

// --- In-Memory Implementation ---
export class MemoryCredentialStore implements CredentialStore {
  private credentials = new Map<string, StoredCredential>();

  async save(connectionId: string, credential: StoredCredential): Promise<void> {
    this.credentials.set(connectionId, credential);
  }

  async load(connectionId: string): Promise<StoredCredential | undefined> {
    return this.credentials.get(connectionId);
  }

  async delete(connectionId: string): Promise<void> {
    this.credentials.delete(connectionId);
  }

  async clear(): Promise<void> {
    this.credentials.clear();
  }
}
