/**
 * LocalStorage-backed DefinitionStore.
 */
import { createDefinitionId } from '../types/identity.js';
export function createLocalStorageStore(options) {
    const prefix = options?.prefix ?? 'phz-def:';
    function storageKey(id) {
        return `${prefix}${id}`;
    }
    function getAllIds() {
        const ids = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                ids.push(key.slice(prefix.length));
            }
        }
        return ids;
    }
    return {
        save(def) {
            const now = new Date().toISOString();
            const saved = {
                ...def,
                updatedAt: now,
                createdAt: def.createdAt || now,
            };
            localStorage.setItem(storageKey(def.id), JSON.stringify(saved));
            return saved;
        },
        load(id) {
            const raw = localStorage.getItem(storageKey(id));
            return raw ? JSON.parse(raw) : undefined;
        },
        list() {
            return getAllIds().map(id => {
                const raw = localStorage.getItem(storageKey(id));
                if (!raw)
                    return null;
                const def = JSON.parse(raw);
                return { id: def.id, name: def.name, description: def.description, updatedAt: def.updatedAt };
            }).filter(Boolean);
        },
        delete(id) {
            const key = storageKey(id);
            if (localStorage.getItem(key) === null)
                return false;
            localStorage.removeItem(key);
            return true;
        },
        duplicate(id, options) {
            const raw = localStorage.getItem(storageKey(id));
            if (!raw)
                return undefined;
            const original = JSON.parse(raw);
            const now = new Date().toISOString();
            const copy = {
                ...original,
                id: createDefinitionId(),
                name: options?.name ?? `${original.name} (Copy)`,
                createdAt: now,
                updatedAt: now,
            };
            localStorage.setItem(storageKey(copy.id), JSON.stringify(copy));
            return copy;
        },
        clear() {
            const ids = getAllIds();
            for (const id of ids) {
                localStorage.removeItem(storageKey(id));
            }
        },
    };
}
//# sourceMappingURL=local-storage-store.js.map