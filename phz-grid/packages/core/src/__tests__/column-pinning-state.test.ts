import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  StateManager,
  pinColumn,
  unpinColumn,
  getEffectivePinState,
} from '../state.js';
import type { ColumnDefinition } from '../types/column.js';

const cols: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string' },
  { field: 'age', header: 'Age', type: 'number' },
  { field: 'email', header: 'Email', type: 'string' },
];

describe('pinColumn', () => {
  it('sets override to "left" for field', () => {
    const state = createInitialState(cols);
    const next = pinColumn(state, 'name', 'left');
    expect(next.columns.pinOverrides.name).toBe('left');
  });

  it('sets override to "right" for field', () => {
    const state = createInitialState(cols);
    const next = pinColumn(state, 'age', 'right');
    expect(next.columns.pinOverrides.age).toBe('right');
  });

  it('preserves existing overrides for other fields', () => {
    let state = createInitialState(cols);
    state = pinColumn(state, 'name', 'left');
    state = pinColumn(state, 'age', 'right');
    expect(state.columns.pinOverrides.name).toBe('left');
    expect(state.columns.pinOverrides.age).toBe('right');
  });

  it('returns new state (immutability)', () => {
    const state = createInitialState(cols);
    const next = pinColumn(state, 'name', 'left');
    expect(next).not.toBe(state);
    expect(next.columns).not.toBe(state.columns);
    expect(next.columns.pinOverrides).not.toBe(state.columns.pinOverrides);
  });
});

describe('unpinColumn', () => {
  it('sets override to null for field (explicit unpin)', () => {
    let state = createInitialState(cols);
    state = pinColumn(state, 'name', 'left');
    expect(state.columns.pinOverrides.name).toBe('left');
    const next = unpinColumn(state, 'name');
    expect(next.columns.pinOverrides.name).toBeNull();
  });

  it('on non-overridden field sets null override', () => {
    const state = createInitialState(cols);
    const next = unpinColumn(state, 'email');
    expect(next.columns.pinOverrides.email).toBeNull();
  });

  it('overrides static col.frozen when unpinning a frozen column', () => {
    const state = createInitialState(cols);
    const next = unpinColumn(state, 'name');
    const col: ColumnDefinition = { field: 'name', header: 'Name', type: 'string', frozen: 'left' };
    // The null override should take precedence over col.frozen
    expect(getEffectivePinState(next, col)).toBeNull();
  });

  it('returns new state (immutability)', () => {
    let state = createInitialState(cols);
    state = pinColumn(state, 'name', 'left');
    const next = unpinColumn(state, 'name');
    expect(next).not.toBe(state);
    expect(next.columns).not.toBe(state.columns);
    expect(next.columns.pinOverrides).not.toBe(state.columns.pinOverrides);
  });
});

describe('getEffectivePinState', () => {
  it('returns override when present', () => {
    let state = createInitialState(cols);
    state = pinColumn(state, 'name', 'right');
    const col: ColumnDefinition = { field: 'name', header: 'Name', type: 'string' };
    expect(getEffectivePinState(state, col)).toBe('right');
  });

  it('falls back to col.frozen when no override', () => {
    const state = createInitialState(cols);
    const col: ColumnDefinition = { field: 'name', header: 'Name', type: 'string', frozen: 'left' };
    expect(getEffectivePinState(state, col)).toBe('left');
  });

  it('returns null when neither override nor frozen', () => {
    const state = createInitialState(cols);
    const col: ColumnDefinition = { field: 'name', header: 'Name', type: 'string' };
    expect(getEffectivePinState(state, col)).toBeNull();
  });

  it('prefers override over frozen', () => {
    let state = createInitialState(cols);
    state = pinColumn(state, 'name', 'right');
    const col: ColumnDefinition = { field: 'name', header: 'Name', type: 'string', frozen: 'left' };
    expect(getEffectivePinState(state, col)).toBe('right');
  });
});

describe('createInitialState includes pinOverrides', () => {
  it('includes pinOverrides: {} in columns', () => {
    const state = createInitialState(cols);
    expect(state.columns.pinOverrides).toEqual({});
  });
});

describe('exportState / importState with pinOverrides', () => {
  it('pin overrides included in exportState', () => {
    const mgr = new StateManager(createInitialState(cols));
    const pinned = pinColumn(mgr.getState(), 'name', 'left');
    mgr.setState(pinned);
    const serialized = mgr.exportState();
    expect(serialized.columns.pinOverrides).toEqual({ name: 'left' });
  });

  it('pin overrides restored by importState', () => {
    const mgr = new StateManager(createInitialState(cols));
    const pinned = pinColumn(mgr.getState(), 'age', 'right');
    mgr.setState(pinned);
    const serialized = mgr.exportState();

    // Create a fresh manager and import
    const mgr2 = new StateManager(createInitialState(cols));
    mgr2.importState(serialized);
    expect(mgr2.getState().columns.pinOverrides).toEqual({ age: 'right' });
  });
});
