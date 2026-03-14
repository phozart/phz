/**
 * @phozart/workspace — Credential Store (Q.3)
 *
 * Interface for storing connection credentials securely.
 * In-memory implementation for Node/test environments.
 * Browser implementations can use OPFS or IndexedDB behind the same interface.
 */
export type StoredCredential = {
    type: 'bearer';
    token: string;
} | {
    type: 'basic';
    username: string;
    password: string;
} | {
    type: 'api-key';
    key: string;
    value: string;
} | {
    type: 'custom-headers';
    headers: Record<string, string>;
};
export interface CredentialStore {
    save(connectionId: string, credential: StoredCredential): Promise<void>;
    load(connectionId: string): Promise<StoredCredential | undefined>;
    delete(connectionId: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class MemoryCredentialStore implements CredentialStore {
    private credentials;
    save(connectionId: string, credential: StoredCredential): Promise<void>;
    load(connectionId: string): Promise<StoredCredential | undefined>;
    delete(connectionId: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=credential-store.d.ts.map