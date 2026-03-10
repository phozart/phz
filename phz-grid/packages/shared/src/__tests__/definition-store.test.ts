import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryStore } from '../definitions/store/in-memory-store.js';
import type { DefinitionStore } from '../definitions/store/definition-store.js';
import type { GridDefinition } from '../definitions/types/grid-definition.js';
import { createDefinitionId, type DefinitionId } from '../definitions/types/identity.js';

function makeDefinition(id?: string, name?: string): GridDefinition {
  return {
    id: createDefinitionId(id ?? 'def-1'),
    name: name ?? 'Test Grid',
    schemaVersion: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dataSource: { type: 'local', data: [{ x: 1 }] },
    columns: [{ field: 'x' }],
  };
}

describe('InMemoryStore', () => {
  let store: DefinitionStore;

  beforeEach(() => {
    store = createInMemoryStore();
  });

  it('saves and loads a definition', () => {
    const def = makeDefinition();
    store.save(def);
    const loaded = store.load(def.id);
    expect(loaded).toBeDefined();
    expect(loaded!.name).toBe('Test Grid');
  });

  it('lists all saved definitions', () => {
    store.save(makeDefinition('a', 'Grid A'));
    store.save(makeDefinition('b', 'Grid B'));
    const list = store.list();
    expect(list).toHaveLength(2);
    expect(list.map(m => m.name).sort()).toEqual(['Grid A', 'Grid B']);
  });

  it('deletes a definition', () => {
    const def = makeDefinition();
    store.save(def);
    expect(store.delete(def.id)).toBe(true);
    expect(store.load(def.id)).toBeUndefined();
  });

  it('returns false when deleting non-existent', () => {
    expect(store.delete('nonexistent' as DefinitionId)).toBe(false);
  });

  it('duplicates a definition with new id', () => {
    const def = makeDefinition('orig', 'Original');
    store.save(def);
    const copy = store.duplicate(def.id);
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(def.id);
    expect(copy!.name).toBe('Original (Copy)');
    expect(store.list()).toHaveLength(2);
  });

  it('duplicates with custom name', () => {
    const def = makeDefinition();
    store.save(def);
    const copy = store.duplicate(def.id, { name: 'My Copy' });
    expect(copy!.name).toBe('My Copy');
  });

  it('returns undefined when duplicating non-existent', () => {
    expect(store.duplicate('missing' as DefinitionId)).toBeUndefined();
  });

  it('clears all definitions', () => {
    store.save(makeDefinition('a'));
    store.save(makeDefinition('b'));
    store.clear();
    expect(store.list()).toHaveLength(0);
  });

  it('updates updatedAt on save', () => {
    const def = makeDefinition();
    const saved = store.save(def);
    expect(saved.updatedAt).not.toBe('2024-01-01T00:00:00Z');
  });
});
