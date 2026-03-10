/**
 * LocalStorage-backed DefinitionStore.
 */
import type { DefinitionStore } from './definition-store.js';
export interface LocalStorageStoreOptions {
    prefix?: string;
}
export declare function createLocalStorageStore(options?: LocalStorageStoreOptions): DefinitionStore;
//# sourceMappingURL=local-storage-store.d.ts.map