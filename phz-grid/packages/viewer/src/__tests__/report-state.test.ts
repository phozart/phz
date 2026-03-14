/**
 * Tests for report-state.ts — Report View State
 */
import { describe, it, expect } from 'vitest';
import {
  createReportViewState,
  loadReport,
  setReportData,
  setReportSort,
  toggleReportSort,
  setReportPage,
  setReportPageSize,
  setReportSearch,
  toggleColumnVisibility,
  setExporting,
  getReportTotalPages,
  getVisibleColumns,
  addSortColumn,
  removeSortColumn,
  clearAllSorts,
  getSortIndex,
} from '../screens/report-state.js';
import type { ReportColumnView } from '../screens/report-state.js';

const sampleColumns: ReportColumnView[] = [
  { field: 'name', label: 'Name', visible: true, sortable: true },
  { field: 'amount', label: 'Amount', visible: true, sortable: true },
  { field: 'notes', label: 'Notes', visible: false, sortable: false },
];

describe('report-state', () => {
  describe('createReportViewState', () => {
    it('creates default state', () => {
      const state = createReportViewState();
      expect(state.reportId).toBeNull();
      expect(state.columns).toEqual([]);
      expect(state.sortColumns).toEqual([]);
      expect(state.page).toBe(0);
      expect(state.pageSize).toBe(50);
      expect(state.totalRows).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.exporting).toBe(false);
      expect(state.exportFormats).toEqual(['csv', 'xlsx']);
    });
  });

  describe('loadReport', () => {
    it('loads report metadata', () => {
      const state = loadReport(createReportViewState(), {
        id: 'rpt-1',
        title: 'Monthly Report',
        description: 'Revenue summary',
        columns: sampleColumns,
      });

      expect(state.reportId).toBe('rpt-1');
      expect(state.title).toBe('Monthly Report');
      expect(state.description).toBe('Revenue summary');
      expect(state.columns).toHaveLength(3);
      expect(state.sortColumns).toEqual([]);
      expect(state.page).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.lastRefreshed).toBeGreaterThan(0);
    });
  });

  describe('setReportData', () => {
    it('sets rows and total count', () => {
      const state = setReportData(createReportViewState(), [['a', 1], ['b', 2]], 100);
      expect(state.rows).toHaveLength(2);
      expect(state.totalRows).toBe(100);
      expect(state.loading).toBe(false);
    });
  });

  describe('setReportSort / toggleReportSort', () => {
    it('sets sort and resets page', () => {
      let state = createReportViewState();
      state = { ...state, page: 3 };
      state = setReportSort(state, { field: 'name', direction: 'asc' });
      expect(state.sortColumns).toEqual([{ field: 'name', direction: 'asc' }]);
      expect(state.page).toBe(0);
      expect(state.loading).toBe(true);
    });

    it('setReportSort with null clears sortColumns', () => {
      let state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      state = setReportSort(state, null);
      expect(state.sortColumns).toEqual([]);
    });

    it('toggles sort: asc -> desc -> remove', () => {
      let state = createReportViewState();
      state = toggleReportSort(state, 'name');
      expect(state.sortColumns).toEqual([{ field: 'name', direction: 'asc' }]);

      state = toggleReportSort(state, 'name');
      expect(state.sortColumns).toEqual([{ field: 'name', direction: 'desc' }]);

      state = toggleReportSort(state, 'name');
      expect(state.sortColumns).toEqual([]);
    });

    it('resets to asc when toggling different field (single-sort mode)', () => {
      let state = createReportViewState();
      state = toggleReportSort(state, 'name');
      state = toggleReportSort(state, 'amount');
      expect(state.sortColumns).toEqual([{ field: 'amount', direction: 'asc' }]);
    });
  });

  describe('setReportPage', () => {
    it('sets page and triggers loading', () => {
      const state = setReportPage(
        createReportViewState({ totalRows: 200, pageSize: 50 }),
        2,
      );
      expect(state.page).toBe(2);
      expect(state.loading).toBe(true);
    });

    it('clamps to max page', () => {
      const state = setReportPage(
        createReportViewState({ totalRows: 100, pageSize: 50 }),
        99,
      );
      expect(state.page).toBe(1);
    });

    it('clamps to 0', () => {
      const state = setReportPage(createReportViewState(), -5);
      expect(state.page).toBe(0);
    });
  });

  describe('setReportPageSize', () => {
    it('sets page size and resets page', () => {
      let state = createReportViewState();
      state = { ...state, page: 3 };
      state = setReportPageSize(state, 100);
      expect(state.pageSize).toBe(100);
      expect(state.page).toBe(0);
      expect(state.loading).toBe(true);
    });

    it('clamps to minimum of 1', () => {
      const state = setReportPageSize(createReportViewState(), 0);
      expect(state.pageSize).toBe(1);
    });
  });

  describe('setReportSearch', () => {
    it('sets query and resets page', () => {
      let state = createReportViewState();
      state = { ...state, page: 2 };
      state = setReportSearch(state, 'test');
      expect(state.searchQuery).toBe('test');
      expect(state.page).toBe(0);
      expect(state.loading).toBe(true);
    });
  });

  describe('toggleColumnVisibility', () => {
    it('toggles column visibility', () => {
      let state = loadReport(createReportViewState(), {
        id: 'rpt-1',
        title: 'Test',
        columns: sampleColumns,
      });

      state = toggleColumnVisibility(state, 'notes');
      expect(state.columns.find(c => c.field === 'notes')!.visible).toBe(true);

      state = toggleColumnVisibility(state, 'name');
      expect(state.columns.find(c => c.field === 'name')!.visible).toBe(false);
    });
  });

  describe('setExporting', () => {
    it('sets exporting flag', () => {
      const state = setExporting(createReportViewState(), true);
      expect(state.exporting).toBe(true);
    });
  });

  describe('getReportTotalPages', () => {
    it('returns total pages', () => {
      expect(getReportTotalPages(createReportViewState({ totalRows: 100, pageSize: 50 }))).toBe(2);
      expect(getReportTotalPages(createReportViewState({ totalRows: 101, pageSize: 50 }))).toBe(3);
      expect(getReportTotalPages(createReportViewState({ totalRows: 0 }))).toBe(1);
    });
  });

  describe('getVisibleColumns', () => {
    it('returns only visible columns', () => {
      const state = loadReport(createReportViewState(), {
        id: 'rpt-1',
        title: 'Test',
        columns: sampleColumns,
      });
      const visible = getVisibleColumns(state);
      expect(visible).toHaveLength(2);
      expect(visible.map(c => c.field)).toEqual(['name', 'amount']);
    });
  });

  describe('multi-column sort', () => {
    it('addSortColumn adds a sort column to empty sortColumns', () => {
      const state = createReportViewState();
      const next = addSortColumn(state, 'name', 'asc');
      expect(next.sortColumns).toEqual([{ field: 'name', direction: 'asc' }]);
    });

    it('addSortColumn appends to existing sortColumns', () => {
      const state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      const next = addSortColumn(state, 'age', 'desc');
      expect(next.sortColumns).toHaveLength(2);
      expect(next.sortColumns[1]).toEqual({ field: 'age', direction: 'desc' });
    });

    it('addSortColumn replaces direction if field already sorted', () => {
      const state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      const next = addSortColumn(state, 'name', 'desc');
      expect(next.sortColumns).toHaveLength(1);
      expect(next.sortColumns[0]).toEqual({ field: 'name', direction: 'desc' });
    });

    it('removeSortColumn removes the field from sortColumns', () => {
      const state = createReportViewState({ sortColumns: [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ]});
      const next = removeSortColumn(state, 'name');
      expect(next.sortColumns).toEqual([{ field: 'age', direction: 'desc' }]);
    });

    it('removeSortColumn returns same state if field not found', () => {
      const state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      const next = removeSortColumn(state, 'nonexistent');
      expect(next.sortColumns).toEqual(state.sortColumns);
    });

    it('clearAllSorts empties sortColumns', () => {
      const state = createReportViewState({ sortColumns: [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ]});
      const next = clearAllSorts(state);
      expect(next.sortColumns).toEqual([]);
    });

    it('getSortIndex returns index of sorted field', () => {
      const state = createReportViewState({ sortColumns: [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ]});
      expect(getSortIndex(state, 'name')).toBe(0);
      expect(getSortIndex(state, 'age')).toBe(1);
    });

    it('getSortIndex returns -1 for unsorted field', () => {
      const state = createReportViewState({ sortColumns: [] });
      expect(getSortIndex(state, 'name')).toBe(-1);
    });

    it('toggleReportSort with addToMulti=true adds to multi-sort', () => {
      const state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      const next = toggleReportSort(state, 'age', true);
      expect(next.sortColumns).toHaveLength(2);
    });

    it('toggleReportSort without addToMulti replaces entire sort (backward compat)', () => {
      const state = createReportViewState({ sortColumns: [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ]});
      const next = toggleReportSort(state, 'email');
      expect(next.sortColumns).toEqual([{ field: 'email', direction: 'asc' }]);
    });

    it('toggleReportSort cycles asc -> desc -> remove for addToMulti', () => {
      let state = createReportViewState({ sortColumns: [{ field: 'name', direction: 'asc' }] });
      state = toggleReportSort(state, 'name', true);
      expect(state.sortColumns[0].direction).toBe('desc');
      state = toggleReportSort(state, 'name', true);
      expect(state.sortColumns).toEqual([]);
    });
  });
});
