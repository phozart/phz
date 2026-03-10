/**
 * Tests for Report Edit State (B-2.09)
 */
import {
  createReportEditState,
  addReportColumn,
  removeReportColumn,
  updateReportColumn,
  reorderReportColumns,
  addReportFilter,
  removeReportFilter,
  updateReportFilter,
  setReportSorts,
  toggleReportPreview,
  setReportPreviewData,
  clearReportPreview,
  setReportTitle,
  setReportDescription,
  setReportDataSource,
  markReportSaved,
  setReportLoading,
  setReportError,
} from '../screens/report-state.js';
import type { ReportColumnConfig, ReportFilterConfig } from '../screens/report-state.js';

const COL_1: ReportColumnConfig = {
  field: 'name',
  label: 'Name',
  visible: true,
};

const COL_2: ReportColumnConfig = {
  field: 'amount',
  label: 'Amount',
  visible: true,
  format: '#,##0.00',
};

const COL_3: ReportColumnConfig = {
  field: 'date',
  label: 'Date',
  visible: true,
};

describe('createReportEditState', () => {
  it('creates with defaults', () => {
    const state = createReportEditState('rpt-1');
    expect(state.reportId).toBe('rpt-1');
    expect(state.title).toBe('');
    expect(state.columns).toEqual([]);
    expect(state.filters).toEqual([]);
    expect(state.sorts).toEqual([]);
    expect(state.previewMode).toBe(false);
    expect(state.dirty).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createReportEditState('rpt-1', {
      title: 'My Report',
      columns: [COL_1],
    });
    expect(state.title).toBe('My Report');
    expect(state.columns).toHaveLength(1);
  });
});

describe('column operations', () => {
  it('adds a column', () => {
    let state = createReportEditState('rpt-1');
    state = addReportColumn(state, COL_1);
    expect(state.columns).toHaveLength(1);
    expect(state.dirty).toBe(true);
  });

  it('removes a column by field', () => {
    let state = createReportEditState('rpt-1', { columns: [COL_1, COL_2] });
    state = removeReportColumn(state, 'name');
    expect(state.columns).toHaveLength(1);
    expect(state.columns[0].field).toBe('amount');
  });

  it('updates a column', () => {
    let state = createReportEditState('rpt-1', { columns: [COL_1] });
    state = updateReportColumn(state, 'name', { label: 'Full Name', width: 200 });
    expect(state.columns[0].label).toBe('Full Name');
    expect(state.columns[0].width).toBe(200);
    expect(state.dirty).toBe(true);
  });

  it('reorders columns', () => {
    let state = createReportEditState('rpt-1', { columns: [COL_1, COL_2, COL_3] });
    state = reorderReportColumns(state, ['date', 'amount', 'name']);
    expect(state.columns.map(c => c.field)).toEqual(['date', 'amount', 'name']);
    expect(state.dirty).toBe(true);
  });

  it('reorder skips unknown fields', () => {
    let state = createReportEditState('rpt-1', { columns: [COL_1, COL_2] });
    state = reorderReportColumns(state, ['unknown', 'amount', 'name']);
    expect(state.columns.map(c => c.field)).toEqual(['amount', 'name']);
  });
});

describe('filter operations', () => {
  it('adds a filter', () => {
    let state = createReportEditState('rpt-1');
    const filter: ReportFilterConfig = { field: 'status', operator: 'equals', value: 'active', enabled: true };
    state = addReportFilter(state, filter);
    expect(state.filters).toHaveLength(1);
    expect(state.dirty).toBe(true);
  });

  it('removes a filter by index', () => {
    const f1: ReportFilterConfig = { field: 'a', operator: 'equals', value: 1, enabled: true };
    const f2: ReportFilterConfig = { field: 'b', operator: 'gt', value: 5, enabled: true };
    let state = createReportEditState('rpt-1', { filters: [f1, f2] });
    state = removeReportFilter(state, 0);
    expect(state.filters).toHaveLength(1);
    expect(state.filters[0].field).toBe('b');
  });

  it('updates a filter', () => {
    const f1: ReportFilterConfig = { field: 'a', operator: 'equals', value: 1, enabled: true };
    let state = createReportEditState('rpt-1', { filters: [f1] });
    state = updateReportFilter(state, 0, { value: 99 });
    expect(state.filters[0].value).toBe(99);
    expect(state.dirty).toBe(true);
  });
});

describe('sort operations', () => {
  it('sets sorts', () => {
    let state = createReportEditState('rpt-1');
    state = setReportSorts(state, [
      { field: 'amount', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ]);
    expect(state.sorts).toHaveLength(2);
    expect(state.dirty).toBe(true);
  });
});

describe('preview mode', () => {
  it('toggles preview mode', () => {
    let state = createReportEditState('rpt-1');
    state = toggleReportPreview(state);
    expect(state.previewMode).toBe(true);
    state = toggleReportPreview(state);
    expect(state.previewMode).toBe(false);
  });

  it('sets preview data', () => {
    let state = createReportEditState('rpt-1');
    state = setReportPreviewData(state, [['a', 1], ['b', 2]], 2);
    expect(state.previewData).toHaveLength(2);
    expect(state.previewRowCount).toBe(2);
    expect(state.previewMode).toBe(true);
  });

  it('clears preview', () => {
    let state = createReportEditState('rpt-1');
    state = setReportPreviewData(state, [['a']], 1);
    state = clearReportPreview(state);
    expect(state.previewData).toBeNull();
    expect(state.previewRowCount).toBe(0);
    expect(state.previewMode).toBe(false);
  });
});

describe('metadata', () => {
  it('sets title', () => {
    let state = createReportEditState('rpt-1');
    state = setReportTitle(state, 'Revenue Report');
    expect(state.title).toBe('Revenue Report');
    expect(state.dirty).toBe(true);
  });

  it('sets description', () => {
    let state = createReportEditState('rpt-1');
    state = setReportDescription(state, 'Monthly breakdown');
    expect(state.description).toBe('Monthly breakdown');
    expect(state.dirty).toBe(true);
  });

  it('sets data source', () => {
    let state = createReportEditState('rpt-1');
    state = setReportDataSource(state, 'ds-2');
    expect(state.dataSourceId).toBe('ds-2');
    expect(state.dirty).toBe(true);
  });

  it('marks as saved', () => {
    let state = createReportEditState('rpt-1');
    state = setReportTitle(state, 'x');
    expect(state.dirty).toBe(true);
    state = markReportSaved(state);
    expect(state.dirty).toBe(false);
  });
});

describe('loading / error', () => {
  it('sets loading and clears error', () => {
    let state = setReportError(createReportEditState('rpt-1'), 'err');
    state = setReportLoading(state, true);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets error and clears loading', () => {
    let state = setReportLoading(createReportEditState('rpt-1'), true);
    state = setReportError(state, 'query failed');
    expect(state.error).toBe('query failed');
    expect(state.loading).toBe(false);
  });
});
