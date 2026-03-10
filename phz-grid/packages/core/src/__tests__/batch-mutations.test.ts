import { describe, it, expect, vi } from 'vitest';
import { createGrid } from '../create-grid.js';
import { StateManager, createInitialState } from '../state.js';

const columns = [
  { field: 'name', header: 'Name', sortable: true, filterable: true },
  { field: 'age', header: 'Age', type: 'number' as const, sortable: true },
  { field: 'city', header: 'City', filterable: true },
];

function makeData(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Person ${i}`,
    age: 20 + (i % 50),
    city: i % 2 === 0 ? 'NYC' : 'LA',
  }));
}

describe('StateManager.batch()', () => {
  it('suppresses notifications during batch, fires once after', async () => {
    const sm = new StateManager(createInitialState(columns));
    const listener = vi.fn();
    sm.subscribe(listener);

    sm.batch(() => {
      sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
      sm.setState({ filter: { filters: [{ field: 'age', operator: 'greaterThan', value: 25 }], presets: {} } });
      sm.setState({ status: { loading: false, error: null, rowCount: 100, filteredRowCount: 50 } });
    });

    // Microtask should have been queued once
    await new Promise<void>((r) => queueMicrotask(r));
    expect(listener).toHaveBeenCalledTimes(1);

    // The final state should reflect all three updates
    const state = sm.getState();
    expect(state.sort.columns).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(state.filter.filters).toHaveLength(1);
    expect(state.status.rowCount).toBe(100);
  });

  it('still notifies normally outside of batch', async () => {
    const sm = new StateManager(createInitialState(columns));
    const listener = vi.fn();
    sm.subscribe(listener);

    sm.setState({ sort: { columns: [{ field: 'name', direction: 'asc' }] } });
    sm.setState({ filter: { filters: [], presets: {} } });

    // Each setState queues a microtask, but since the first microtask
    // runs both (microtask coalescing in current impl), we get 1 notification
    await new Promise<void>((r) => queueMicrotask(r));
    // The existing microtask-based dedup means >=1 call
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('addRows batching', () => {
  it('invalidates pipeline once for addRows, not N times', async () => {
    const grid = createGrid({ data: makeData(5), columns });

    // Subscribe to track state notifications
    const listener = vi.fn();
    grid.subscribe(listener);

    // Add 100 rows
    const newRows = makeData(100);
    const ids = grid.addRows(newRows);

    expect(ids).toHaveLength(100);
    expect(grid.getData()).toHaveLength(105);

    // Wait for microtask
    await new Promise<void>((r) => queueMicrotask(r));

    // Should fire at most 1 notification, not 100
    expect(listener.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('emits row:add events for each row added', () => {
    const grid = createGrid({ data: makeData(5), columns });
    const handler = vi.fn();
    grid.on('row:add', handler);

    grid.addRows([{ name: 'X', age: 1, city: 'Z' }, { name: 'Y', age: 2, city: 'W' }]);

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('status reflects correct row count after addRows', () => {
    const grid = createGrid({ data: makeData(5), columns });
    grid.addRows(makeData(10));

    const state = grid.getState();
    expect(state.status.rowCount).toBe(15);
  });
});

describe('updateRows batching', () => {
  it('invalidates pipeline once for updateRows', async () => {
    const grid = createGrid({ data: makeData(10), columns });
    const listener = vi.fn();
    grid.subscribe(listener);

    const updates = grid.getData().map((row) => ({
      id: row.__id,
      data: { age: 99 },
    }));

    grid.updateRows(updates);

    await new Promise<void>((r) => queueMicrotask(r));
    // Should fire at most 1 notification (already correct in current code)
    expect(listener.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

describe('deleteRows batching', () => {
  it('invalidates pipeline once for deleteRows', async () => {
    const grid = createGrid({ data: makeData(10), columns });
    const listener = vi.fn();
    grid.subscribe(listener);

    const ids = grid.getData().slice(0, 5).map((r) => r.__id);
    grid.deleteRows(ids);

    expect(grid.getData()).toHaveLength(5);

    await new Promise<void>((r) => queueMicrotask(r));
    // Should fire at most 1 notification (already correct in current code)
    expect(listener.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
