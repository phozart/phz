/**
 * LocalStorage-backed DefinitionStore.
 */

import type { DefinitionId } from '../types/identity.js';
import { createDefinitionId } from '../types/identity.js';
import type { GridDefinition, DefinitionMeta } from '../types/grid-definition.js';
import type { DefinitionStore } from './definition-store.js';

export interface LocalStorageStoreOptions {
  prefix?: string;
}

export function createLocalStorageStore(options?: LocalStorageStoreOptions): DefinitionStore {
  const prefix = options?.prefix ?? 'phz-def:';

  function storageKey(id: DefinitionId): string {
    return `${prefix}${id}`;
  }

  function getAllIds(): DefinitionId[] {
    const ids: DefinitionId[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        ids.push(key.slice(prefix.length) as DefinitionId);
      }
    }
    return ids;
  }

  return {
    save(def: GridDefinition): GridDefinition {
      const now = new Date().toISOString();
      const saved: GridDefinition = {
        ...def,
        updatedAt: now,
        createdAt: def.createdAt || now,
      };
      localStorage.setItem(storageKey(def.id), JSON.stringify(saved));
      return saved;
    },

    load(id: DefinitionId): GridDefinition | undefined {
      const raw = localStorage.getItem(storageKey(id));
      return raw ? JSON.parse(raw) : undefined;
    },

    list(): DefinitionMeta[] {
      return getAllIds().map(id => {
        const raw = localStorage.getItem(storageKey(id));
        if (!raw) return null;
        const def = JSON.parse(raw) as GridDefinition;
        return { id: def.id, name: def.name, description: def.description, updatedAt: def.updatedAt };
      }).filter(Boolean) as DefinitionMeta[];
    },

    delete(id: DefinitionId): boolean {
      const key = storageKey(id);
      if (localStorage.getItem(key) === null) return false;
      localStorage.removeItem(key);
      return true;
    },

    duplicate(id: DefinitionId, options?: { name?: string }): GridDefinition | undefined {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) return undefined;

      const original = JSON.parse(raw) as GridDefinition;
      const now = new Date().toISOString();
      const copy: GridDefinition = {
        ...original,
        id: createDefinitionId(),
        name: options?.name ?? `${original.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      localStorage.setItem(storageKey(copy.id), JSON.stringify(copy));
      return copy;
    },

    clear(): void {
      const ids = getAllIds();
      for (const id of ids) {
        localStorage.removeItem(storageKey(id));
      }
    },
  };
}
