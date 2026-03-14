import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SortController, type SortHost } from '../controllers/sort.controller.js';
import type { ColumnDefinition, SortDirection } from '@phozart/core';

function makeSortHost(overrides?: Partial<SortHost>): SortHost {
  return {
    gridApi: {
      sort: vi.fn(),
      multiSort: vi.fn(),
      clearSort: vi.fn(),
    } as any,
    ariaManager: {
      announceChange: vi.fn(),
    } as any,
    sortColumns: [],
    sortDebounceMs: undefined,
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

function makeCol(field: string): ColumnDefinition {
  return { field, header: field } as ColumnDefinition;
}

function makeClickEvent(): MouseEvent {
  return { target: { closest: () => null }, ctrlKey: false, metaKey: false } as unknown as MouseEvent;
}

describe('SortController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes sort immediately when debounceMs is 0', () => {
    const host = makeSortHost({ sortDebounceMs: 0 });
    const ctrl = new SortController(host);
    const col = makeCol('name');

    ctrl.handleHeaderClick(col, makeClickEvent());

    expect(host.gridApi!.sort).toHaveBeenCalledWith('name', 'asc');
  });

  it('debounces sort when debounceMs > 0', () => {
    const host = makeSortHost({ sortDebounceMs: 300 });
    const ctrl = new SortController(host);
    const col = makeCol('name');

    ctrl.handleHeaderClick(col, makeClickEvent());

    // Sort should NOT have fired yet
    expect(host.gridApi!.sort).not.toHaveBeenCalled();

    // Advance past the debounce window
    vi.advanceTimersByTime(300);

    expect(host.gridApi!.sort).toHaveBeenCalledWith('name', 'asc');
  });

  it('cancels pending debounced sort on new click', () => {
    const host = makeSortHost({ sortDebounceMs: 300 });
    const ctrl = new SortController(host);
    const colA = makeCol('name');
    const colB = makeCol('age');

    ctrl.handleHeaderClick(colA, makeClickEvent());
    vi.advanceTimersByTime(100);

    // Second click before debounce fires
    ctrl.handleHeaderClick(colB, makeClickEvent());
    vi.advanceTimersByTime(300);

    // Only the second sort should have fired
    expect(host.gridApi!.sort).toHaveBeenCalledTimes(1);
    expect(host.gridApi!.sort).toHaveBeenCalledWith('age', 'asc');
  });

  it('does not debounce when debounceMs is undefined', () => {
    const host = makeSortHost({ sortDebounceMs: undefined });
    const ctrl = new SortController(host);
    const col = makeCol('name');

    ctrl.handleHeaderClick(col, makeClickEvent());

    expect(host.gridApi!.sort).toHaveBeenCalledWith('name', 'asc');
  });

  it('clears debounce timer on hostDisconnected', () => {
    const host = makeSortHost({ sortDebounceMs: 300 });
    const ctrl = new SortController(host);
    const col = makeCol('name');

    ctrl.handleHeaderClick(col, makeClickEvent());
    ctrl.hostDisconnected();
    vi.advanceTimersByTime(300);

    // Sort should NOT fire since we disconnected
    expect(host.gridApi!.sort).not.toHaveBeenCalled();
  });

  it('announces sort after debounce completes', () => {
    const host = makeSortHost({ sortDebounceMs: 200 });
    const ctrl = new SortController(host);
    const col = makeCol('name');

    ctrl.handleHeaderClick(col, makeClickEvent());

    // No announcement yet
    expect(host.ariaManager!.announceChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    // Announcement should happen after debounce
    expect(host.ariaManager!.announceChange).toHaveBeenCalled();
  });
});
