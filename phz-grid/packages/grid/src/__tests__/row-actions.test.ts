/**
 * @phozart/phz-grid — Row Actions Tests
 *
 * Tests for effectiveRowActions getter and RowActionEventDetail shape.
 */
import { describe, it, expect } from 'vitest';
import { PhzGrid } from '../components/phz-grid.js';
import type { RowAction } from '../types.js';
import type { RowActionEventDetail } from '../events.js';

// ── effectiveRowActions ──

describe('effectiveRowActions', () => {
  it('returns empty array when rowActions is not set', () => {
    const grid = new PhzGrid();
    expect(grid.effectiveRowActions).toEqual([]);
  });

  it('returns rowActions when set', () => {
    const grid = new PhzGrid();
    const custom: RowAction[] = [
      { id: 'declare', label: 'Declare', bulkEnabled: true },
      { id: 'open', label: 'Open', href: '/app/{id}' },
    ];
    grid.rowActions = custom;

    const actions = grid.effectiveRowActions;
    expect(actions.length).toBe(2);
    expect(actions[0].id).toBe('declare');
    expect(actions[1].id).toBe('open');
    expect(actions[1].href).toBe('/app/{id}');
  });
});

// ── RowActionEventDetail shape ──

describe('RowActionEventDetail type', () => {
  it('has the expected shape for single-row action', () => {
    const detail: RowActionEventDetail = {
      actionId: 'declare',
      rowId: 42,
      rowData: { name: 'Alice', department: 'Eng' },
      href: '/app/42',
      isBulk: false,
    };
    expect(detail.actionId).toBe('declare');
    expect(detail.isBulk).toBe(false);
    expect(detail.rowIds).toBeUndefined();
  });

  it('has the expected shape for bulk action', () => {
    const detail: RowActionEventDetail = {
      actionId: '__delete',
      rowId: 1,
      rowData: {},
      isBulk: true,
      rowIds: [1, 2, 3],
    };
    expect(detail.isBulk).toBe(true);
    expect(detail.rowIds).toEqual([1, 2, 3]);
  });
});
