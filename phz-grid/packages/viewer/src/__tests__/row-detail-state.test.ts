/**
 * Tests for row-detail-state.ts — Row Detail Expansion State (UX-020)
 */
import { describe, it, expect } from 'vitest';
import {
  createRowDetailState,
  rowToDetailFields,
  expandRowDetail,
  collapseRowDetail,
  toggleRowDetail,
  navigateToNextRow,
  navigateToPrevRow,
  setDetailSearch,
  togglePinnedField,
  clearPinnedFields,
  getVisibleDetailFields,
  isRowExpanded,
  getExpandedRowIndex,
  scrollToDetailField,
} from '../screens/row-detail-state.js';
import type {
  RowDetailState,
  RowDetailColumnInput,
} from '../screens/row-detail-state.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const columns: RowDetailColumnInput[] = [
  { field: 'id', label: 'ID', type: 'number' },
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'email', label: 'Email', type: 'string' },
  { field: 'status', label: 'Status', type: 'string' },
];

const rows: unknown[][] = [
  [1, 'Alice', 'alice@example.com', 'active'],
  [2, 'Bob', 'bob@example.com', 'inactive'],
  [3, 'Charlie', 'charlie@example.com', 'active'],
];

// ---------------------------------------------------------------------------
// createRowDetailState
// ---------------------------------------------------------------------------

describe('row-detail-state', () => {
  describe('createRowDetailState', () => {
    it('returns factory defaults', () => {
      const state = createRowDetailState();
      expect(state.expandedRowIndex).toBeNull();
      expect(state.fields).toEqual([]);
      expect(state.searchQuery).toBe('');
      expect(state.pinnedFields).toEqual(new Set());
      expect(state.scrollToField).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // rowToDetailFields
  // -------------------------------------------------------------------------

  describe('rowToDetailFields', () => {
    it('maps row values to column metadata', () => {
      const fields = rowToDetailFields(rows[0], columns);
      expect(fields).toHaveLength(4);
      expect(fields[0]).toEqual({ field: 'id', label: 'ID', value: 1, type: 'number' });
      expect(fields[1]).toEqual({ field: 'name', label: 'Name', value: 'Alice', type: 'string' });
      expect(fields[2]).toEqual({ field: 'email', label: 'Email', value: 'alice@example.com', type: 'string' });
      expect(fields[3]).toEqual({ field: 'status', label: 'Status', value: 'active', type: 'string' });
    });

    it('produces undefined values when row is shorter than columns', () => {
      const shortRow = [10, 'Dana'];
      const fields = rowToDetailFields(shortRow, columns);
      expect(fields).toHaveLength(4);
      expect(fields[0].value).toBe(10);
      expect(fields[1].value).toBe('Dana');
      expect(fields[2].value).toBeUndefined();
      expect(fields[3].value).toBeUndefined();
    });

    it('ignores extra row values beyond columns length', () => {
      const longRow = [1, 'Alice', 'alice@example.com', 'active', 'extra1', 'extra2'];
      const fields = rowToDetailFields(longRow, columns);
      expect(fields).toHaveLength(4);
    });

    it('handles empty row and columns', () => {
      expect(rowToDetailFields([], [])).toEqual([]);
    });

    it('handles empty row with columns', () => {
      const fields = rowToDetailFields([], columns);
      expect(fields).toHaveLength(4);
      fields.forEach((f) => expect(f.value).toBeUndefined());
    });

    it('handles row with empty columns', () => {
      const fields = rowToDetailFields([1, 2, 3], []);
      expect(fields).toHaveLength(0);
    });

    it('omits type when column has no type', () => {
      const colsNoType: RowDetailColumnInput[] = [
        { field: 'x', label: 'X' },
      ];
      const fields = rowToDetailFields([42], colsNoType);
      expect(fields[0]).toEqual({ field: 'x', label: 'X', value: 42, type: undefined });
    });
  });

  // -------------------------------------------------------------------------
  // expandRowDetail
  // -------------------------------------------------------------------------

  describe('expandRowDetail', () => {
    it('sets expandedRowIndex and computes fields', () => {
      const state = createRowDetailState();
      const next = expandRowDetail(state, 0, rows[0], columns);
      expect(next.expandedRowIndex).toBe(0);
      expect(next.fields).toHaveLength(4);
      expect(next.fields[0].value).toBe(1);
    });

    it('clears searchQuery and scrollToField', () => {
      let state = createRowDetailState();
      state = { ...state, searchQuery: 'old', scrollToField: 'name' };
      const next = expandRowDetail(state, 1, rows[1], columns);
      expect(next.searchQuery).toBe('');
      expect(next.scrollToField).toBeNull();
    });

    it('preserves pinnedFields', () => {
      let state = createRowDetailState();
      state = { ...state, pinnedFields: new Set(['name', 'email']) };
      const next = expandRowDetail(state, 2, rows[2], columns);
      expect(next.pinnedFields).toEqual(new Set(['name', 'email']));
    });

    it('returns a new reference', () => {
      const state = createRowDetailState();
      const next = expandRowDetail(state, 0, rows[0], columns);
      expect(next).not.toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // collapseRowDetail
  // -------------------------------------------------------------------------

  describe('collapseRowDetail', () => {
    it('resets to collapsed state', () => {
      const expanded = expandRowDetail(createRowDetailState(), 1, rows[1], columns);
      const collapsed = collapseRowDetail(expanded);
      expect(collapsed.expandedRowIndex).toBeNull();
      expect(collapsed.fields).toEqual([]);
      expect(collapsed.searchQuery).toBe('');
      expect(collapsed.scrollToField).toBeNull();
    });

    it('preserves pinnedFields', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = { ...state, pinnedFields: new Set(['id']) };
      const collapsed = collapseRowDetail(state);
      expect(collapsed.pinnedFields).toEqual(new Set(['id']));
    });

    it('is no-op (same reference) when already collapsed', () => {
      const state = createRowDetailState();
      const result = collapseRowDetail(state);
      expect(result).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // toggleRowDetail
  // -------------------------------------------------------------------------

  describe('toggleRowDetail', () => {
    it('expands a row when none is expanded', () => {
      const state = createRowDetailState();
      const next = toggleRowDetail(state, 1, rows[1], columns);
      expect(next.expandedRowIndex).toBe(1);
      expect(next.fields[1].value).toBe('Bob');
    });

    it('collapses when same row is toggled', () => {
      const expanded = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const toggled = toggleRowDetail(expanded, 0, rows[0], columns);
      expect(toggled.expandedRowIndex).toBeNull();
      expect(toggled.fields).toEqual([]);
    });

    it('switches to a different row', () => {
      const expanded = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const switched = toggleRowDetail(expanded, 2, rows[2], columns);
      expect(switched.expandedRowIndex).toBe(2);
      expect(switched.fields[0].value).toBe(3); // Charlie's id
    });
  });

  // -------------------------------------------------------------------------
  // navigateToNextRow
  // -------------------------------------------------------------------------

  describe('navigateToNextRow', () => {
    it('advances to the next row', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const next = navigateToNextRow(state, rows, columns);
      expect(next.expandedRowIndex).toBe(1);
      expect(next.fields[1].value).toBe('Bob');
    });

    it('is no-op at the last row (no wrap)', () => {
      const state = expandRowDetail(createRowDetailState(), 2, rows[2], columns);
      const next = navigateToNextRow(state, rows, columns);
      expect(next).toBe(state);
    });

    it('is no-op when collapsed', () => {
      const state = createRowDetailState();
      const next = navigateToNextRow(state, rows, columns);
      expect(next).toBe(state);
    });

    it('clears searchQuery and scrollToField on navigation', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = { ...state, searchQuery: 'test', scrollToField: 'id' };
      const next = navigateToNextRow(state, rows, columns);
      expect(next.searchQuery).toBe('');
      expect(next.scrollToField).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // navigateToPrevRow
  // -------------------------------------------------------------------------

  describe('navigateToPrevRow', () => {
    it('goes to the previous row', () => {
      const state = expandRowDetail(createRowDetailState(), 2, rows[2], columns);
      const prev = navigateToPrevRow(state, rows, columns);
      expect(prev.expandedRowIndex).toBe(1);
      expect(prev.fields[1].value).toBe('Bob');
    });

    it('is no-op at row 0 (no wrap)', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const prev = navigateToPrevRow(state, rows, columns);
      expect(prev).toBe(state);
    });

    it('is no-op when collapsed', () => {
      const state = createRowDetailState();
      const prev = navigateToPrevRow(state, rows, columns);
      expect(prev).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // setDetailSearch
  // -------------------------------------------------------------------------

  describe('setDetailSearch', () => {
    it('sets the search query when expanded', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const next = setDetailSearch(state, 'ema');
      expect(next.searchQuery).toBe('ema');
    });

    it('is no-op when collapsed (returns same ref)', () => {
      const state = createRowDetailState();
      const next = setDetailSearch(state, 'anything');
      expect(next).toBe(state);
    });

    it('returns new reference when query changes', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const next = setDetailSearch(state, 'test');
      expect(next).not.toBe(state);
    });

    it('is no-op (same reference) when query is unchanged', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = setDetailSearch(state, 'ema');
      const next = setDetailSearch(state, 'ema');
      expect(next).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // togglePinnedField
  // -------------------------------------------------------------------------

  describe('togglePinnedField', () => {
    it('adds a field to pinned set', () => {
      const state = createRowDetailState();
      const next = togglePinnedField(state, 'name');
      expect(next.pinnedFields.has('name')).toBe(true);
    });

    it('removes a field already pinned', () => {
      let state = createRowDetailState();
      state = togglePinnedField(state, 'name');
      const next = togglePinnedField(state, 'name');
      expect(next.pinnedFields.has('name')).toBe(false);
    });

    it('works regardless of expanded state', () => {
      const collapsed = createRowDetailState();
      const pinned = togglePinnedField(collapsed, 'id');
      expect(pinned.pinnedFields.has('id')).toBe(true);
    });

    it('does not mutate the original state', () => {
      const state = createRowDetailState();
      const next = togglePinnedField(state, 'email');
      expect(state.pinnedFields.has('email')).toBe(false);
      expect(next.pinnedFields.has('email')).toBe(true);
    });

    it('returns a new reference', () => {
      const state = createRowDetailState();
      const next = togglePinnedField(state, 'x');
      expect(next).not.toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // clearPinnedFields
  // -------------------------------------------------------------------------

  describe('clearPinnedFields', () => {
    it('clears all pinned fields', () => {
      let state = createRowDetailState();
      state = togglePinnedField(state, 'name');
      state = togglePinnedField(state, 'email');
      const cleared = clearPinnedFields(state);
      expect(cleared.pinnedFields.size).toBe(0);
    });

    it('is no-op when already empty (same reference)', () => {
      const state = createRowDetailState();
      const cleared = clearPinnedFields(state);
      expect(cleared).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // getVisibleDetailFields
  // -------------------------------------------------------------------------

  describe('getVisibleDetailFields', () => {
    it('returns all fields when no search and no pins', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const visible = getVisibleDetailFields(state);
      expect(visible).toHaveLength(4);
      expect(visible.map((f) => f.field)).toEqual(['id', 'name', 'email', 'status']);
    });

    it('filters fields by searchQuery (case-insensitive match on field)', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = setDetailSearch(state, 'email');
      const visible = getVisibleDetailFields(state);
      expect(visible).toHaveLength(1);
      expect(visible[0].field).toBe('email');
    });

    it('filters fields by searchQuery matching label', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = setDetailSearch(state, 'Stat');
      const visible = getVisibleDetailFields(state);
      expect(visible).toHaveLength(1);
      expect(visible[0].field).toBe('status');
    });

    it('search is case-insensitive', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = setDetailSearch(state, 'NAME');
      const visible = getVisibleDetailFields(state);
      expect(visible).toHaveLength(1);
      expect(visible[0].field).toBe('name');
    });

    it('pinned fields come first, preserving original order', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = { ...state, pinnedFields: new Set(['status', 'name']) };
      const visible = getVisibleDetailFields(state);
      // pinned in original order: name (index 1), status (index 3)
      // then unpinned: id (index 0), email (index 2)
      expect(visible.map((f) => f.field)).toEqual(['name', 'status', 'id', 'email']);
    });

    it('search + pinning combined: filters then orders', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      // Pin 'status', search for fields containing 'a' → matches 'name', 'email', 'status'
      state = { ...state, pinnedFields: new Set(['status']), searchQuery: 'a' };
      const visible = getVisibleDetailFields(state);
      // 'a' matches: name (field), email (field has 'a'? no — 'email' has no 'a'. label 'Email' has no 'a')
      // Let's be precise: field='name' label='Name' → 'a' matches 'name' and 'Name'
      // field='email' label='Email' → 'a' matches 'email' (has 'a')
      // field='status' label='Status' → 'a' matches 'status' (has 'a')
      // field='id' label='ID' → no match
      // So matching: name, email, status. Pinned first: status. Then: name, email.
      expect(visible.map((f) => f.field)).toEqual(['status', 'name', 'email']);
    });

    it('returns empty array when not expanded', () => {
      const state = createRowDetailState();
      const visible = getVisibleDetailFields(state);
      expect(visible).toEqual([]);
    });

    it('returns empty array when search matches nothing', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = setDetailSearch(state, 'zzzzz');
      const visible = getVisibleDetailFields(state);
      expect(visible).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // isRowExpanded
  // -------------------------------------------------------------------------

  describe('isRowExpanded', () => {
    it('returns true for the expanded row', () => {
      const state = expandRowDetail(createRowDetailState(), 1, rows[1], columns);
      expect(isRowExpanded(state, 1)).toBe(true);
    });

    it('returns false for a different row', () => {
      const state = expandRowDetail(createRowDetailState(), 1, rows[1], columns);
      expect(isRowExpanded(state, 0)).toBe(false);
      expect(isRowExpanded(state, 2)).toBe(false);
    });

    it('returns false when nothing is expanded', () => {
      const state = createRowDetailState();
      expect(isRowExpanded(state, 0)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getExpandedRowIndex
  // -------------------------------------------------------------------------

  describe('getExpandedRowIndex', () => {
    it('returns the expanded row index', () => {
      const state = expandRowDetail(createRowDetailState(), 2, rows[2], columns);
      expect(getExpandedRowIndex(state)).toBe(2);
    });

    it('returns null when nothing is expanded', () => {
      const state = createRowDetailState();
      expect(getExpandedRowIndex(state)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // scrollToDetailField
  // -------------------------------------------------------------------------

  describe('scrollToDetailField', () => {
    it('sets the scrollToField hint', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const next = scrollToDetailField(state, 'email');
      expect(next.scrollToField).toBe('email');
    });

    it('is no-op when collapsed (returns same ref)', () => {
      const state = createRowDetailState();
      const next = scrollToDetailField(state, 'email');
      expect(next).toBe(state);
    });

    it('returns a new reference when expanded', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const next = scrollToDetailField(state, 'name');
      expect(next).not.toBe(state);
    });

    it('is no-op (same reference) when field is unchanged', () => {
      let state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      state = scrollToDetailField(state, 'email');
      const next = scrollToDetailField(state, 'email');
      expect(next).toBe(state);
    });
  });

  // -------------------------------------------------------------------------
  // Immutability guarantees
  // -------------------------------------------------------------------------

  describe('immutability', () => {
    it('expandRowDetail does not mutate the original state', () => {
      const state = createRowDetailState();
      const original = { ...state };
      expandRowDetail(state, 0, rows[0], columns);
      expect(state.expandedRowIndex).toBe(original.expandedRowIndex);
      expect(state.fields).toBe(original.fields);
      expect(state.searchQuery).toBe(original.searchQuery);
    });

    it('collapseRowDetail does not mutate the original state', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const fieldsBefore = state.fields;
      collapseRowDetail(state);
      expect(state.fields).toBe(fieldsBefore);
      expect(state.expandedRowIndex).toBe(0);
    });

    it('togglePinnedField does not mutate the original pinnedFields set', () => {
      const state = createRowDetailState();
      const pinnedBefore = state.pinnedFields;
      togglePinnedField(state, 'name');
      expect(state.pinnedFields).toBe(pinnedBefore);
      expect(state.pinnedFields.size).toBe(0);
    });

    it('navigateToNextRow does not mutate the original state', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      const idxBefore = state.expandedRowIndex;
      navigateToNextRow(state, rows, columns);
      expect(state.expandedRowIndex).toBe(idxBefore);
    });

    it('setDetailSearch does not mutate the original state', () => {
      const state = expandRowDetail(createRowDetailState(), 0, rows[0], columns);
      setDetailSearch(state, 'test');
      expect(state.searchQuery).toBe('');
    });
  });
});
