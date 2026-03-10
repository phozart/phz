/**
 * @phozart/phz-collab — Data Governance Tests
 *
 * Tests that syncGridToYjs respects grid's restricted field sets
 * and that collab session properly uses maskFields + grid API.
 */

import { describe, it, expect, vi } from 'vitest';
import { createCollabSession } from '../collab-session.js';
import type { CollabConfig, YDoc, YMap, YArray } from '../types.js';
import type { GridApi } from '@phozart/phz-core';

function createMockYMap(): YMap<unknown> {
  const store = new Map<string, unknown>();
  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => { store.set(key, value); },
    delete: (key: string) => { store.delete(key); },
    has: (key: string) => store.has(key),
    toJSON: () => Object.fromEntries(store),
    forEach: (fn: (value: unknown, key: string) => void) => store.forEach(fn),
    observe: () => {},
    unobserve: () => {},
  };
}

function createMockYArray(): YArray<unknown> {
  const items: unknown[] = [];
  return {
    toArray: () => [...items],
    push: (content: unknown[]) => items.push(...content),
    delete: (index: number, length: number) => items.splice(index, length),
    get: (index: number) => items[index],
    length: items.length,
    observe: () => {},
    unobserve: () => {},
  };
}

function createMockYDoc(): YDoc {
  const maps = new Map<string, YMap<unknown>>();
  const arrays = new Map<string, YArray<unknown>>();
  return {
    getArray: <T = unknown>(name: string) => {
      if (!arrays.has(name)) arrays.set(name, createMockYArray());
      return arrays.get(name)! as YArray<T>;
    },
    getMap: <T = unknown>(name: string) => {
      if (!maps.has(name)) maps.set(name, createMockYMap());
      return maps.get(name)! as YMap<T>;
    },
    transact: (fn: () => void) => fn(),
    on: () => {},
    off: () => {},
    destroy: () => {},
  };
}

function createMockGridApi(options: {
  data: Record<string, unknown>[];
  restrictedFields?: Set<string>;
  maskedFields?: Set<string>;
}): GridApi {
  return {
    getData: () => options.data as any,
    getColumnState: () => ({
      order: Object.keys(options.data[0] ?? {}),
      widths: {},
      visibility: {},
    }),
    getRestrictedFields: () => options.restrictedFields ?? new Set(),
    getMaskedFields: () => options.maskedFields ?? new Set(),
    subscribe: () => () => {},
    getState: () => ({}) as any,
  } as unknown as GridApi;
}

describe('Collab Data Governance', () => {
  it('syncGridToYjs skips restricted fields', () => {
    const config: CollabConfig = {
      userId: 'user1',
      userName: 'Test User',
    };
    const session = createCollabSession(config);
    const mockDoc = createMockYDoc();

    // Manually set the doc on the session (connect sets it, but requires async)
    (session as any).doc = mockDoc;

    const grid = createMockGridApi({
      data: [
        { __id: 'row1', name: 'Alice', ssn: '123-45-6789', salary: 90000 },
      ],
      restrictedFields: new Set(['salary']),
      maskedFields: new Set(['ssn']),
    });

    session.attachToGrid(grid);

    // Check what was synced to Yjs
    const yRow = mockDoc.getMap('row-row1');
    const synced = yRow.toJSON();

    // salary (restricted) should NOT be in the synced data
    expect(synced).not.toHaveProperty('salary');

    // name should be present
    expect(synced).toHaveProperty('name', 'Alice');

    // ssn should be present but masked (via getData returning masked data or maskFields config)
    // Since getData returns masked data when maskedFields is set, the '****' value should be synced
    // The key should exist but not contain the real SSN value

    session.destroy();
  });

  it('syncGridToYjs masks fields from maskFields config', () => {
    const config: CollabConfig = {
      userId: 'user1',
      userName: 'Test User',
      maskFields: ['ssn'],
    };
    const session = createCollabSession(config);
    const mockDoc = createMockYDoc();
    (session as any).doc = mockDoc;

    const grid = createMockGridApi({
      data: [
        { __id: 'row1', name: 'Alice', ssn: '123-45-6789' },
      ],
    });

    session.attachToGrid(grid);

    const yRow = mockDoc.getMap('row-row1');
    const synced = yRow.toJSON();

    // maskFields from config should mask SSN
    expect(synced).toHaveProperty('ssn', '****');
    expect(synced).toHaveProperty('name', 'Alice');

    session.destroy();
  });
});
