import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateManager, createInitialState } from '../state.js';
import { createGrid } from '../create-grid.js';
import type { GridState } from '../types/state.js';

describe('StateManager.subscribeSelector', () => {
  let sm: StateManager;

  beforeEach(() => {
    sm = new StateManager(createInitialState([]));
  });

  it('fires callback when selected value changes', async () => {
    const cb = vi.fn();
    sm.subscribeSelector(
      (s: GridState) => s.sort,
      cb,
    );

    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    await Promise.resolve(); // flush microtask

    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0][0]).toEqual({ columns: [{ field: 'name', direction: 'asc' }] });
  });

  it('does NOT fire when unrelated state changes', async () => {
    const cb = vi.fn();
    sm.subscribeSelector(
      (s: GridState) => s.sort,
      cb,
    );

    // Change filter, not sort
    sm.setState({
      filter: {
        filters: [{ field: 'age', operator: 'greaterThan', value: 20 }],
        presets: {},
      },
    });
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('provides previous value to callback', async () => {
    const cb = vi.fn();
    sm.subscribeSelector(
      (s: GridState) => s.sort.columns.length,
      cb,
    );

    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    await Promise.resolve();

    expect(cb).toHaveBeenCalledWith(1, 0);
  });

  it('unsubscribe stops notifications', async () => {
    const cb = vi.fn();
    const unsub = sm.subscribeSelector(
      (s: GridState) => s.sort,
      cb,
    );

    unsub();
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('custom equalityFn controls when callback fires', async () => {
    const cb = vi.fn();
    // Only fire when the number of sort columns changes (ignore direction changes)
    sm.subscribeSelector(
      (s: GridState) => s.sort.columns.length,
      cb,
      (a, b) => a === b,
    );

    // Same length (0 -> 1), should fire
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    await Promise.resolve();
    expect(cb).toHaveBeenCalledOnce();

    cb.mockClear();

    // Still length 1 (direction change), should NOT fire because custom eq compares length
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'desc' }] } });
    await Promise.resolve();
    expect(cb).not.toHaveBeenCalled();
  });

  it('destroy cleans up selector subscriptions', async () => {
    const cb = vi.fn();
    sm.subscribeSelector(
      (s: GridState) => s.sort,
      cb,
    );

    sm.destroy();
    // After destroy, setState should not error (listeners cleared)
    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });
});

describe('GridApi.subscribeSelector', () => {
  it('delegates to stateManager and fires on sort change', async () => {
    const grid = createGrid({
      data: [{ name: 'Alice', age: 30 }],
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'age', header: 'Age', type: 'number' as const },
      ],
    });

    const cb = vi.fn();
    grid.subscribeSelector(
      (s: GridState) => s.sort.columns.length,
      cb,
    );

    grid.sort('name', 'asc');
    await Promise.resolve();

    expect(cb).toHaveBeenCalledWith(1, 0);
  });

  it('does not fire on unrelated changes', async () => {
    const grid = createGrid({
      data: [{ name: 'Alice' }],
      columns: [{ field: 'name', header: 'Name' }],
    });

    const cb = vi.fn();
    grid.subscribeSelector(
      (s: GridState) => s.sort,
      cb,
    );

    grid.addFilter('name', 'equals', 'Bob');
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });
});
