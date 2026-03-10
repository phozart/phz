/**
 * Sprint 2.3 — Bug 4: Collab state changes typed correctly
 *
 * Tests that setupYjsObservers correctly identifies the type of state change
 * (sort, filter, grouping, columns) instead of hardcoding all as "sort".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollabSession } from '../collab-session.js';
import type { CollabConfig, SyncProvider, YDoc, RemoteChange } from '../types.js';

/**
 * Creates a mock Yjs document with observable maps and arrays.
 */
function createMockYDoc(): YDoc & { _observers: Map<string, Set<Function>> } {
  const observers = new Map<string, Set<Function>>();
  const maps = new Map<string, Map<string, unknown>>();
  const arrays = new Map<string, unknown[]>();

  function getOrCreateMap(name: string) {
    if (!maps.has(name)) maps.set(name, new Map());
    const data = maps.get(name)!;
    const mapObservers = new Set<Function>();

    return {
      get: (key: string) => data.get(key),
      set: (key: string, value: unknown) => {
        data.set(key, value);
        for (const handler of mapObservers) {
          handler({ transaction: { local: false } });
        }
      },
      delete: (key: string) => data.delete(key),
      has: (key: string) => data.has(key),
      toJSON: () => Object.fromEntries(data),
      forEach: (fn: (value: unknown, key: string) => void) => data.forEach(fn),
      observe: (handler: Function) => mapObservers.add(handler),
      unobserve: (handler: Function) => mapObservers.delete(handler),
      _data: data,
      _observers: mapObservers,
    };
  }

  function getOrCreateArray(name: string) {
    if (!arrays.has(name)) arrays.set(name, []);
    const data = arrays.get(name)!;
    const arrObservers = new Set<Function>();

    return {
      toArray: () => [...data],
      push: (content: unknown[]) => data.push(...content),
      delete: (index: number, length: number) => data.splice(index, length),
      get: (index: number) => data[index],
      get length() { return data.length; },
      observe: (handler: Function) => arrObservers.add(handler),
      unobserve: (handler: Function) => arrObservers.delete(handler),
      _data: data,
      _observers: arrObservers,
    };
  }

  const mapCache = new Map<string, ReturnType<typeof getOrCreateMap>>();
  const arrayCache = new Map<string, ReturnType<typeof getOrCreateArray>>();

  return {
    getArray: (name: string) => {
      if (!arrayCache.has(name)) arrayCache.set(name, getOrCreateArray(name));
      return arrayCache.get(name)! as any;
    },
    getMap: (name: string) => {
      if (!mapCache.has(name)) mapCache.set(name, getOrCreateMap(name));
      return mapCache.get(name)! as any;
    },
    transact: (fn: () => void) => fn(),
    on: (event: string, handler: (...args: unknown[]) => void) => {
      if (!observers.has(event)) observers.set(event, new Set());
      observers.get(event)!.add(handler);
    },
    off: (event: string, handler: (...args: unknown[]) => void) => {
      observers.get(event)?.delete(handler);
    },
    destroy: () => { observers.clear(); },
    _observers: observers,
  } as any;
}

function createMockProvider(mockDoc?: YDoc): SyncProvider {
  return {
    name: 'mock',
    connect: async (doc: YDoc, _sessionId: string) => {
      // no-op in mock
    },
    disconnect: async () => {},
    isConnected: () => true,
    onConnectionStateChange: (_handler) => () => {},
  };
}

function createMockGrid() {
  let state: Record<string, unknown> = {
    sort: { columns: [] },
    filter: { filters: [], logic: 'and' as const, presets: {} },
    columns: { order: ['name'], widths: { name: 150 }, visibility: { name: true } },
    grouping: { groupBy: [], expandedGroups: new Set<string>() },
  };

  const subscribers: Array<(state: Record<string, unknown>) => void> = [];

  return {
    getState: () => state,
    getData: () => [{ __id: '1', name: 'Alice' }],
    getRestrictedFields: () => new Set<string>(),
    getColumnState: () => state.columns,
    subscribe: (listener: (state: Record<string, unknown>) => void) => {
      subscribers.push(listener);
      return () => {
        const idx = subscribers.indexOf(listener);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
    sort: vi.fn(),
    setFilters: vi.fn(),
    _triggerState: (newState: Record<string, unknown>) => {
      // Create a new state object so JSON.stringify comparison works
      state = { ...state, ...newState };
      for (const sub of subscribers) sub(state);
    },
    _subscribers: subscribers,
  };
}

describe('Bug 4: Collab state change type detection', () => {
  const config: CollabConfig = {
    userId: 'user-1',
    userName: 'Alice',
    enableHistory: true,
  };

  it('attachToGrid detects sort changes as type "state" with field "sort"', () => {
    const session = createCollabSession(config);
    const grid = createMockGrid();
    session.attachToGrid(grid as any);

    const localChanges: Array<{ type: string; change: any }> = [];
    session.onLocalChange((change) => {
      localChanges.push({ type: change.type, change: change.change });
    });

    grid._triggerState({
      sort: { columns: [{ field: 'name', direction: 'asc' as const }] },
    });

    expect(localChanges.length).toBe(1);
    expect(localChanges[0].type).toBe('state');
    expect(localChanges[0].change.field).toBe('sort');
  });

  it('attachToGrid detects filter changes as type "state" with field "filter"', () => {
    const session = createCollabSession(config);
    const grid = createMockGrid();
    session.attachToGrid(grid as any);

    const localChanges: Array<{ type: string; change: any }> = [];
    session.onLocalChange((change) => {
      localChanges.push({ type: change.type, change: change.change });
    });

    grid._triggerState({
      filter: {
        filters: [{ field: 'name', operator: 'contains' as any, value: 'A' }],
        logic: 'and' as const,
        presets: {},
      },
    });

    expect(localChanges.length).toBe(1);
    expect(localChanges[0].type).toBe('state');
    expect(localChanges[0].change.field).toBe('filter');
  });

  it('attachToGrid detects grouping changes as type "state" with field "grouping"', () => {
    const session = createCollabSession(config);
    const grid = createMockGrid();
    session.attachToGrid(grid as any);

    const localChanges: Array<{ type: string; change: any }> = [];
    session.onLocalChange((change) => {
      localChanges.push({ type: change.type, change: change.change });
    });

    grid._triggerState({
      grouping: { groupBy: ['name'], expandedGroups: new Set<string>() },
    });

    expect(localChanges.length).toBe(1);
    expect(localChanges[0].type).toBe('state');
    expect(localChanges[0].change.field).toBe('grouping');
  });

  it('attachToGrid detects multiple simultaneous changes', () => {
    const session = createCollabSession(config);
    const grid = createMockGrid();
    session.attachToGrid(grid as any);

    const localChanges: Array<{ type: string; change: any }> = [];
    session.onLocalChange((change) => {
      localChanges.push({ type: change.type, change: change.change });
    });

    grid._triggerState({
      sort: { columns: [{ field: 'name', direction: 'desc' as const }] },
      filter: {
        filters: [{ field: 'name', operator: 'equals' as any, value: 'X' }],
        logic: 'and' as const,
        presets: {},
      },
    });

    expect(localChanges.length).toBe(2);
    const fields = localChanges.map(c => c.change.field).sort();
    expect(fields).toEqual(['filter', 'sort']);
  });

  it('detachFromGrid stops tracking', () => {
    const session = createCollabSession(config);
    const grid = createMockGrid();
    session.attachToGrid(grid as any);

    const localChanges: Array<{ type: string; change: any }> = [];
    session.onLocalChange((change) => {
      localChanges.push({ type: change.type, change: change.change });
    });

    session.detachFromGrid();

    grid._triggerState({
      sort: { columns: [{ field: 'name', direction: 'asc' as const }] },
    });

    expect(localChanges.length).toBe(0);
  });
});
