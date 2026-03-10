/**
 * In-memory DefinitionStore — for development, testing, and ephemeral use.
 */
import { createDefinitionId } from '../types/identity.js';
export function createInMemoryStore() {
    const store = new Map();
    return {
        save(def) {
            const now = new Date().toISOString();
            const saved = {
                ...def,
                updatedAt: now,
                createdAt: def.createdAt || now,
            };
            store.set(def.id, saved);
            return saved;
        },
        load(id) {
            return store.get(id);
        },
        list() {
            return Array.from(store.values()).map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                updatedAt: d.updatedAt,
            }));
        },
        delete(id) {
            return store.delete(id);
        },
        duplicate(id, options) {
            const original = store.get(id);
            if (!original)
                return undefined;
            const now = new Date().toISOString();
            const copy = {
                ...structuredClone(original),
                id: createDefinitionId(),
                name: options?.name ?? `${original.name} (Copy)`,
                createdAt: now,
                updatedAt: now,
            };
            store.set(copy.id, copy);
            return copy;
        },
        clear() {
            store.clear();
        },
    };
}
//# sourceMappingURL=in-memory-store.js.map