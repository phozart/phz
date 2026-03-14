/** @phozart/grid — Column Quick Toggle State (UX-022) */
import { describe, it, expect } from 'vitest';
import {
  createColumnQuickToggleState,
  openQuickToggle,
  closeQuickToggle,
  toggleQuickToggle,
  toggleColumnVisible,
  setQuickToggleSearch,
  showAllColumns,
  hideAllColumns,
  getFilteredColumns,
  getVisibleCount,
  getHiddenCount,
  type QuickColumnInput,
  type QuickColumnEntry,
  type ColumnQuickToggleState,
} from '../controllers/column-quick-toggle-state.js';

/* ------------------------------------------------------------------ */
/*  Fixtures                                                          */
/* ------------------------------------------------------------------ */

const BASE_COLUMNS: QuickColumnInput[] = [
  { field: 'name', label: 'Name' },
  { field: 'age', label: 'Age', visible: true },
  { field: 'email', label: 'Email', visible: false },
  { field: 'status', label: 'Status', frozen: 'left' },
  { field: 'total', label: 'Total', frozen: 'right', visible: true },
];

/* ------------------------------------------------------------------ */
/*  createColumnQuickToggleState                                      */
/* ------------------------------------------------------------------ */

describe('createColumnQuickToggleState', () => {
  it('creates initial state with open=false', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.open).toBe(false);
  });

  it('sets searchQuery to empty string', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.searchQuery).toBe('');
  });

  it('sets lastToggledField to null', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.lastToggledField).toBeNull();
  });

  it('maps columns with correct fields and labels', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns).toHaveLength(5);
    expect(state.columns[0].field).toBe('name');
    expect(state.columns[0].label).toBe('Name');
    expect(state.columns[3].field).toBe('status');
    expect(state.columns[3].label).toBe('Status');
  });

  it('defaults visible to true when not specified', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns[0].visible).toBe(true); // no visible prop
    expect(state.columns[3].visible).toBe(true); // no visible prop
  });

  it('respects explicit visible=true', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns[1].visible).toBe(true); // explicit true
    expect(state.columns[4].visible).toBe(true); // explicit true
  });

  it('respects explicit visible=false', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns[2].visible).toBe(false); // explicit false
  });

  it('defaults frozen to null when not specified', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns[0].frozen).toBeNull();
    expect(state.columns[1].frozen).toBeNull();
    expect(state.columns[2].frozen).toBeNull();
  });

  it('respects explicit frozen values', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    expect(state.columns[3].frozen).toBe('left');
    expect(state.columns[4].frozen).toBe('right');
  });

  it('handles empty columns array', () => {
    const state = createColumnQuickToggleState([]);
    expect(state.columns).toHaveLength(0);
    expect(state.open).toBe(false);
    expect(state.searchQuery).toBe('');
    expect(state.lastToggledField).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  openQuickToggle                                                   */
/* ------------------------------------------------------------------ */

describe('openQuickToggle', () => {
  it('sets open to true', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = openQuickToggle(state);
    expect(next.open).toBe(true);
  });

  it('returns new reference when state changes', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = openQuickToggle(state);
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when already open', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const opened = openQuickToggle(state);
    const again = openQuickToggle(opened);
    expect(again).toBe(opened);
  });
});

/* ------------------------------------------------------------------ */
/*  closeQuickToggle                                                  */
/* ------------------------------------------------------------------ */

describe('closeQuickToggle', () => {
  it('sets open to false', () => {
    const state = openQuickToggle(createColumnQuickToggleState(BASE_COLUMNS));
    const next = closeQuickToggle(state);
    expect(next.open).toBe(false);
  });

  it('clears searchQuery on close', () => {
    let state = openQuickToggle(createColumnQuickToggleState(BASE_COLUMNS));
    state = setQuickToggleSearch(state, 'name');
    const next = closeQuickToggle(state);
    expect(next.searchQuery).toBe('');
  });

  it('returns new reference when state changes', () => {
    const state = openQuickToggle(createColumnQuickToggleState(BASE_COLUMNS));
    const next = closeQuickToggle(state);
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when already closed', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const again = closeQuickToggle(state);
    expect(again).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/*  toggleQuickToggle                                                 */
/* ------------------------------------------------------------------ */

describe('toggleQuickToggle', () => {
  it('opens when closed', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleQuickToggle(state);
    expect(next.open).toBe(true);
  });

  it('closes when open', () => {
    const state = openQuickToggle(createColumnQuickToggleState(BASE_COLUMNS));
    const next = toggleQuickToggle(state);
    expect(next.open).toBe(false);
  });

  it('clears searchQuery when closing via toggle', () => {
    let state = openQuickToggle(createColumnQuickToggleState(BASE_COLUMNS));
    state = setQuickToggleSearch(state, 'test');
    const next = toggleQuickToggle(state);
    expect(next.searchQuery).toBe('');
  });

  it('preserves searchQuery when opening via toggle (already empty)', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleQuickToggle(state);
    expect(next.searchQuery).toBe('');
  });
});

/* ------------------------------------------------------------------ */
/*  toggleColumnVisible                                               */
/* ------------------------------------------------------------------ */

describe('toggleColumnVisible', () => {
  it('flips visible from true to false', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'name');
    const col = next.columns.find(c => c.field === 'name')!;
    expect(col.visible).toBe(false);
  });

  it('flips visible from false to true', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'email');
    const col = next.columns.find(c => c.field === 'email')!;
    expect(col.visible).toBe(true);
  });

  it('sets lastToggledField', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'age');
    expect(next.lastToggledField).toBe('age');
  });

  it('does not mutate other columns', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'name');
    // 'age' should still be visible
    expect(next.columns.find(c => c.field === 'age')!.visible).toBe(true);
    // 'email' should still be hidden
    expect(next.columns.find(c => c.field === 'email')!.visible).toBe(false);
  });

  it('returns new reference when toggled', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'name');
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when field not found', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'nonexistent');
    expect(next).toBe(state);
  });

  it('preserves column order after toggle', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = toggleColumnVisible(state, 'age');
    expect(next.columns.map(c => c.field)).toEqual(
      state.columns.map(c => c.field),
    );
  });
});

/* ------------------------------------------------------------------ */
/*  setQuickToggleSearch                                              */
/* ------------------------------------------------------------------ */

describe('setQuickToggleSearch', () => {
  it('sets searchQuery', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = setQuickToggleSearch(state, 'email');
    expect(next.searchQuery).toBe('email');
  });

  it('returns new reference when query changes', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = setQuickToggleSearch(state, 'test');
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when query is identical', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = setQuickToggleSearch(state, '');
    expect(next).toBe(state);
  });

  it('no-op for identical non-empty query', () => {
    const state = setQuickToggleSearch(
      createColumnQuickToggleState(BASE_COLUMNS),
      'hello',
    );
    const again = setQuickToggleSearch(state, 'hello');
    expect(again).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/*  showAllColumns                                                    */
/* ------------------------------------------------------------------ */

describe('showAllColumns', () => {
  it('sets all columns to visible', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = showAllColumns(state);
    expect(next.columns.every(c => c.visible)).toBe(true);
  });

  it('clears lastToggledField', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = toggleColumnVisible(state, 'name');
    expect(state.lastToggledField).toBe('name');
    const next = showAllColumns(state);
    expect(next.lastToggledField).toBeNull();
  });

  it('returns new reference when state changes', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS); // email is hidden
    const next = showAllColumns(state);
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when all already visible', () => {
    const input: QuickColumnInput[] = [
      { field: 'a', label: 'A', visible: true },
      { field: 'b', label: 'B', visible: true },
    ];
    const state = createColumnQuickToggleState(input);
    const next = showAllColumns(state);
    expect(next).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/*  hideAllColumns                                                    */
/* ------------------------------------------------------------------ */

describe('hideAllColumns', () => {
  it('sets all columns to hidden', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = hideAllColumns(state);
    expect(next.columns.every(c => !c.visible)).toBe(true);
  });

  it('clears lastToggledField', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = toggleColumnVisible(state, 'name');
    const next = hideAllColumns(state);
    expect(next.lastToggledField).toBeNull();
  });

  it('returns new reference when state changes', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const next = hideAllColumns(state);
    expect(next).not.toBe(state);
  });

  it('no-op returns same reference when all already hidden', () => {
    const input: QuickColumnInput[] = [
      { field: 'a', label: 'A', visible: false },
      { field: 'b', label: 'B', visible: false },
    ];
    const state = createColumnQuickToggleState(input);
    const next = hideAllColumns(state);
    expect(next).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/*  getFilteredColumns                                                */
/* ------------------------------------------------------------------ */

describe('getFilteredColumns', () => {
  it('returns all columns when searchQuery is empty', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const result = getFilteredColumns(state);
    expect(result).toHaveLength(5);
  });

  it('filters by field name (case-insensitive)', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = setQuickToggleSearch(state, 'NAME');
    const result = getFilteredColumns(state);
    expect(result.some(c => c.field === 'name')).toBe(true);
  });

  it('filters by label (case-insensitive)', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = setQuickToggleSearch(state, 'email');
    const result = getFilteredColumns(state);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('email');
  });

  it('matches partial strings', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = setQuickToggleSearch(state, 'sta');
    const result = getFilteredColumns(state);
    expect(result.some(c => c.field === 'status')).toBe(true);
  });

  it('returns empty array when no matches', () => {
    let state = createColumnQuickToggleState(BASE_COLUMNS);
    state = setQuickToggleSearch(state, 'zzzzz');
    const result = getFilteredColumns(state);
    expect(result).toHaveLength(0);
  });

  it('matches on field OR label', () => {
    const input: QuickColumnInput[] = [
      { field: 'order_id', label: 'Order Number' },
      { field: 'cust_name', label: 'Customer Name' },
    ];
    let state = createColumnQuickToggleState(input);

    // match on label only (field 'order_id' does not contain 'order' — wait, it doesn't,
    // but label 'Order Number' does)
    state = setQuickToggleSearch(state, 'order');
    expect(getFilteredColumns(state)).toHaveLength(1);
    expect(getFilteredColumns(state)[0].field).toBe('order_id');

    // match on field only ('cust_' is not in label 'Customer Name')
    state = setQuickToggleSearch(state, 'cust_');
    expect(getFilteredColumns(state)).toHaveLength(1);
    expect(getFilteredColumns(state)[0].field).toBe('cust_name');

    // match on label for both — 'customer' only in one, 'number' only in other
    // Use 'er' which appears in 'Order' and 'Customer'
    state = setQuickToggleSearch(state, 'er');
    const result = getFilteredColumns(state);
    expect(result).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/*  getVisibleCount                                                   */
/* ------------------------------------------------------------------ */

describe('getVisibleCount', () => {
  it('counts visible columns', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    // name(true), age(true), email(false), status(true), total(true) = 4
    expect(getVisibleCount(state)).toBe(4);
  });

  it('returns 0 when all hidden', () => {
    const state = hideAllColumns(createColumnQuickToggleState(BASE_COLUMNS));
    expect(getVisibleCount(state)).toBe(0);
  });

  it('returns full count when all visible', () => {
    const state = showAllColumns(createColumnQuickToggleState(BASE_COLUMNS));
    expect(getVisibleCount(state)).toBe(5);
  });

  it('returns 0 for empty columns', () => {
    const state = createColumnQuickToggleState([]);
    expect(getVisibleCount(state)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  getHiddenCount                                                    */
/* ------------------------------------------------------------------ */

describe('getHiddenCount', () => {
  it('counts hidden columns', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    // email is the only hidden column = 1
    expect(getHiddenCount(state)).toBe(1);
  });

  it('returns 0 when all visible', () => {
    const state = showAllColumns(createColumnQuickToggleState(BASE_COLUMNS));
    expect(getHiddenCount(state)).toBe(0);
  });

  it('returns full count when all hidden', () => {
    const state = hideAllColumns(createColumnQuickToggleState(BASE_COLUMNS));
    expect(getHiddenCount(state)).toBe(5);
  });

  it('returns 0 for empty columns', () => {
    const state = createColumnQuickToggleState([]);
    expect(getHiddenCount(state)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Immutability                                                      */
/* ------------------------------------------------------------------ */

describe('immutability', () => {
  it('original state is not mutated by toggleColumnVisible', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const originalVisible = state.columns[0].visible;
    toggleColumnVisible(state, 'name');
    expect(state.columns[0].visible).toBe(originalVisible);
  });

  it('original state is not mutated by showAllColumns', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const hiddenBefore = state.columns[2].visible; // email = false
    showAllColumns(state);
    expect(state.columns[2].visible).toBe(hiddenBefore);
  });

  it('original state is not mutated by hideAllColumns', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const visibleBefore = state.columns[0].visible; // name = true
    hideAllColumns(state);
    expect(state.columns[0].visible).toBe(visibleBefore);
  });

  it('original columns array is not mutated', () => {
    const state = createColumnQuickToggleState(BASE_COLUMNS);
    const lenBefore = state.columns.length;
    toggleColumnVisible(state, 'name');
    expect(state.columns.length).toBe(lenBefore);
  });
});
