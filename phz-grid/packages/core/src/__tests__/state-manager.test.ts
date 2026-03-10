import { describe, it, expect, vi } from 'vitest';
import { StateManager, createInitialState } from '../state.js';
import type { UserRole } from '../types/common.js';

describe('createInitialState', () => {
  it('creates state with empty columns', () => {
    const state = createInitialState([]);
    expect(state.columns.order).toEqual([]);
    expect(state.sort.columns).toEqual([]);
    expect(state.filter.filters).toEqual([]);
    expect(state.grouping.groupBy).toEqual([]);
  });

  it('populates column order from definitions', () => {
    const cols = [
      { field: 'name', header: 'Name', type: 'string' as const, sortable: true, filterable: true },
      { field: 'age', header: 'Age', type: 'number' as const, sortable: true, filterable: true },
    ];
    const state = createInitialState(cols);
    expect(state.columns.order).toEqual(['name', 'age']);
    expect(state.columns.widths).toEqual({ name: 150, age: 150 });
    expect(state.columns.visibility).toEqual({ name: true, age: true });
  });

  it('sets default width from column definition', () => {
    const cols = [
      { field: 'name', header: 'Name', type: 'string' as const, sortable: true, filterable: true, width: 200 },
    ];
    const state = createInitialState(cols);
    expect(state.columns.widths.name).toBe(200);
  });

  it('hides columns when user lacks required role', () => {
    const cols = [
      {
        field: 'salary',
        header: 'Salary',
        type: 'number' as const,
        sortable: true,
        filterable: true,
        access: { requiredRoles: ['admin'] as UserRole[] },
      },
    ];
    const state = createInitialState(cols, 'viewer');
    expect(state.columns.visibility.salary).toBe(false);
  });

  it('shows masked columns as visible', () => {
    const cols = [
      {
        field: 'salary',
        header: 'Salary',
        type: 'number' as const,
        sortable: true,
        filterable: true,
        access: { requiredRoles: ['admin'] as UserRole[], mask: '***' },
      },
    ];
    const state = createInitialState(cols, 'viewer');
    expect(state.columns.visibility.salary).toBe(true);
  });
});

describe('StateManager', () => {
  function makeManager() {
    const cols = [
      { field: 'name', header: 'Name', type: 'string' as const, sortable: true, filterable: true },
    ];
    return new StateManager(createInitialState(cols));
  }

  it('getState returns the current state', () => {
    const mgr = makeManager();
    const state = mgr.getState();
    expect(state.columns.order).toEqual(['name']);
  });

  it('setState with partial object merges', () => {
    const mgr = makeManager();
    mgr.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    expect(mgr.getState().sort.columns).toHaveLength(1);
    // columns should still be intact
    expect(mgr.getState().columns.order).toEqual(['name']);
  });

  it('setState with updater function', () => {
    const mgr = makeManager();
    mgr.setState(prev => ({
      ...prev,
      sort: { columns: [{ field: 'name', direction: 'desc' }] },
    }));
    expect(mgr.getState().sort.columns[0].direction).toBe('desc');
  });

  // notify() uses queueMicrotask, so we need to flush microtasks
  const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

  it('notifies subscribers on setState', async () => {
    const mgr = makeManager();
    const listener = vi.fn();
    mgr.subscribe(listener);
    mgr.setState({ sort: { columns: [] } });
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    const receivedState = listener.mock.calls[0][0];
    expect(receivedState.sort.columns).toEqual([]);
  });

  it('unsubscribe stops notifications', async () => {
    const mgr = makeManager();
    const listener = vi.fn();
    const unsub = mgr.subscribe(listener);
    unsub();
    mgr.setState({ sort: { columns: [] } });
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });

  it('batch suppresses intermediate notifications', async () => {
    const mgr = makeManager();
    const listener = vi.fn();
    mgr.subscribe(listener);
    mgr.batch(() => {
      mgr.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
      mgr.setState({ filter: { filters: [], presets: {} } as any });
      mgr.setState({ sort: { columns: [{ field: 'name', direction: 'desc' }] } });
    });
    await flush();
    // Only one notification after batch
    expect(listener).toHaveBeenCalledTimes(1);
    expect(mgr.getState().sort.columns[0].direction).toBe('desc');
  });

  it('batch notifies even if fn throws', async () => {
    const mgr = makeManager();
    const listener = vi.fn();
    mgr.subscribe(listener);
    expect(() => {
      mgr.batch(() => {
        mgr.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
        throw new Error('oops');
      });
    }).toThrow('oops');
    await flush();
    // Should still notify
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('multiple subscribers all get notified', async () => {
    const mgr = makeManager();
    const l1 = vi.fn();
    const l2 = vi.fn();
    mgr.subscribe(l1);
    mgr.subscribe(l2);
    mgr.setState({ sort: { columns: [] } });
    await flush();
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
  });
});
