/**
 * In-memory DefinitionStore — for development, testing, and ephemeral use.
 */

import type { DefinitionId } from '../types/identity.js';
import { createDefinitionId } from '../types/identity.js';
import type { GridDefinition, DefinitionMeta } from '../types/grid-definition.js';
import type { DefinitionStore } from './definition-store.js';

export function createInMemoryStore(): DefinitionStore {
  const store = new Map<DefinitionId, GridDefinition>();

  return {
    save(def: GridDefinition): GridDefinition {
      const now = new Date().toISOString();
      const saved: GridDefinition = {
        ...def,
        updatedAt: now,
        createdAt: def.createdAt || now,
      };
      store.set(def.id, saved);
      return saved;
    },

    load(id: DefinitionId): GridDefinition | undefined {
      return store.get(id);
    },

    list(): DefinitionMeta[] {
      return Array.from(store.values()).map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        updatedAt: d.updatedAt,
      }));
    },

    delete(id: DefinitionId): boolean {
      return store.delete(id);
    },

    duplicate(id: DefinitionId, options?: { name?: string }): GridDefinition | undefined {
      const original = store.get(id);
      if (!original) return undefined;

      const now = new Date().toISOString();
      const copy: GridDefinition = {
        ...structuredClone(original),
        id: createDefinitionId(),
        name: options?.name ?? `${original.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      store.set(copy.id, copy);
      return copy;
    },

    clear(): void {
      store.clear();
    },
  };
}
