import { describe, it, expect } from 'vitest';
import {
  initialReportEditorState,
  addColumn,
  removeColumn,
  reorderColumns,
  updateColumn,
  toggleColumnVisibility,
  pinColumn,
  addFilter,
  removeFilter,
  setSorting,
  setGrouping,
  addConditionalFormat,
  removeConditionalFormat,
  setDensity,
  setConfigPanelTab,
  selectColumn,
  toGridConfig,
} from '../report-editor-state.js';
import type { ReportEditorState, ConditionalFormatRule } from '../report-editor-state.js';
import type { FilterValue } from '../../types.js';

function makeState(): ReportEditorState {
  let s = initialReportEditorState('Sales Report', 'ds-1');
  s = addColumn(s, 'name', 'Name');
  s = addColumn(s, 'revenue', 'Revenue');
  s = addColumn(s, 'region', 'Region');
  return s;
}

function makeFilter(id: string, field: string): FilterValue {
  return { filterId: id, field, operator: 'equals', value: 'test', label: `Filter ${field}` };
}

function makeFormatRule(id: string, field: string): ConditionalFormatRule {
  return { id, field, operator: 'greaterThan', value: 100, style: { backgroundColor: '#ff0000' } };
}

describe('ReportEditorState', () => {
  describe('initialReportEditorState', () => {
    it('sets name and dataSourceId', () => {
      const s = initialReportEditorState('My Report', 'ds-1');
      expect(s.name).toBe('My Report');
      expect(s.dataSourceId).toBe('ds-1');
    });

    it('starts with empty columns', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.columns).toEqual([]);
    });

    it('starts with empty filters', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.filters).toEqual([]);
    });

    it('starts with empty sorting', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.sorting).toEqual([]);
    });

    it('starts with empty grouping', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.grouping).toEqual([]);
    });

    it('starts with empty formatting', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.formatting).toEqual([]);
    });

    it('defaults density to comfortable', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.density).toBe('comfortable');
    });

    it('defaults configPanelTab to columns', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.configPanelTab).toBe('columns');
    });

    it('has no selectedColumnField', () => {
      const s = initialReportEditorState('R', 'ds-1');
      expect(s.selectedColumnField).toBeUndefined();
    });
  });

  describe('addColumn', () => {
    it('adds a column with field and label', () => {
      const s = addColumn(initialReportEditorState('R', 'ds-1'), 'name', 'Full Name');
      expect(s.columns).toHaveLength(1);
      expect(s.columns[0]).toEqual({ field: 'name', label: 'Full Name', visible: true });
    });

    it('uses field as default label when label is omitted', () => {
      const s = addColumn(initialReportEditorState('R', 'ds-1'), 'revenue');
      expect(s.columns[0].label).toBe('revenue');
    });

    it('prevents duplicate columns by field', () => {
      let s = addColumn(initialReportEditorState('R', 'ds-1'), 'name', 'Name');
      s = addColumn(s, 'name', 'Different Label');
      expect(s.columns).toHaveLength(1);
      expect(s.columns[0].label).toBe('Name');
    });

    it('returns same reference when duplicate is added', () => {
      const s = addColumn(initialReportEditorState('R', 'ds-1'), 'name');
      const s2 = addColumn(s, 'name');
      expect(s2).toBe(s);
    });

    it('adds multiple distinct columns', () => {
      let s = initialReportEditorState('R', 'ds-1');
      s = addColumn(s, 'a', 'A');
      s = addColumn(s, 'b', 'B');
      s = addColumn(s, 'c', 'C');
      expect(s.columns).toHaveLength(3);
      expect(s.columns.map(c => c.field)).toEqual(['a', 'b', 'c']);
    });

    it('sets visible to true by default', () => {
      const s = addColumn(initialReportEditorState('R', 'ds-1'), 'x');
      expect(s.columns[0].visible).toBe(true);
    });
  });

  describe('removeColumn', () => {
    it('removes a column by field', () => {
      const s = removeColumn(makeState(), 'revenue');
      expect(s.columns).toHaveLength(2);
      expect(s.columns.map(c => c.field)).toEqual(['name', 'region']);
    });

    it('returns state unchanged if field not found', () => {
      const s = makeState();
      const s2 = removeColumn(s, 'nonexistent');
      expect(s2.columns).toHaveLength(3);
    });

    it('can remove all columns', () => {
      let s = makeState();
      s = removeColumn(s, 'name');
      s = removeColumn(s, 'revenue');
      s = removeColumn(s, 'region');
      expect(s.columns).toHaveLength(0);
    });
  });

  describe('reorderColumns', () => {
    it('moves a column from one position to another', () => {
      const s = reorderColumns(makeState(), 0, 2);
      expect(s.columns.map(c => c.field)).toEqual(['revenue', 'region', 'name']);
    });

    it('handles moving to a lower index', () => {
      const s = reorderColumns(makeState(), 2, 0);
      expect(s.columns.map(c => c.field)).toEqual(['region', 'name', 'revenue']);
    });

    it('handles same index (no-op)', () => {
      const s = makeState();
      const s2 = reorderColumns(s, 1, 1);
      expect(s2.columns.map(c => c.field)).toEqual(['name', 'revenue', 'region']);
    });

    it('returns state unchanged for negative fromIndex', () => {
      const s = makeState();
      const s2 = reorderColumns(s, -1, 1);
      expect(s2).toBe(s);
    });

    it('returns state unchanged for out-of-bounds toIndex', () => {
      const s = makeState();
      const s2 = reorderColumns(s, 0, 5);
      expect(s2).toBe(s);
    });

    it('returns state unchanged for negative toIndex', () => {
      const s = makeState();
      const s2 = reorderColumns(s, 0, -1);
      expect(s2).toBe(s);
    });

    it('returns state unchanged for out-of-bounds fromIndex', () => {
      const s = makeState();
      const s2 = reorderColumns(s, 10, 1);
      expect(s2).toBe(s);
    });
  });

  describe('updateColumn', () => {
    it('updates partial properties of a column', () => {
      const s = updateColumn(makeState(), 'revenue', { width: 200, format: '$0,0' });
      const col = s.columns.find(c => c.field === 'revenue')!;
      expect(col.width).toBe(200);
      expect(col.format).toBe('$0,0');
    });

    it('preserves the field even if updates try to override it', () => {
      const s = updateColumn(makeState(), 'revenue', { field: 'hacked' } as Partial<typeof s.columns[0]>);
      expect(s.columns.find(c => c.field === 'revenue')).toBeDefined();
      expect(s.columns.find(c => c.field === 'hacked')).toBeUndefined();
    });

    it('does not affect other columns', () => {
      const original = makeState();
      const s = updateColumn(original, 'revenue', { width: 150 });
      expect(s.columns.find(c => c.field === 'name')).toEqual(original.columns.find(c => c.field === 'name'));
      expect(s.columns.find(c => c.field === 'region')).toEqual(original.columns.find(c => c.field === 'region'));
    });

    it('handles updating a non-existent column gracefully', () => {
      const s = makeState();
      const s2 = updateColumn(s, 'nonexistent', { width: 100 });
      expect(s2.columns).toHaveLength(3);
    });
  });

  describe('toggleColumnVisibility', () => {
    it('toggles visible from true to false', () => {
      const s = toggleColumnVisibility(makeState(), 'name');
      expect(s.columns.find(c => c.field === 'name')!.visible).toBe(false);
    });

    it('toggles visible from false back to true', () => {
      let s = toggleColumnVisibility(makeState(), 'name');
      s = toggleColumnVisibility(s, 'name');
      expect(s.columns.find(c => c.field === 'name')!.visible).toBe(true);
    });

    it('does not affect other columns', () => {
      const s = toggleColumnVisibility(makeState(), 'name');
      expect(s.columns.find(c => c.field === 'revenue')!.visible).toBe(true);
    });
  });

  describe('pinColumn', () => {
    it('pins a column to the left', () => {
      const s = pinColumn(makeState(), 'name', 'left');
      expect(s.columns.find(c => c.field === 'name')!.pinned).toBe('left');
    });

    it('pins a column to the right', () => {
      const s = pinColumn(makeState(), 'revenue', 'right');
      expect(s.columns.find(c => c.field === 'revenue')!.pinned).toBe('right');
    });

    it('unpins a column by passing undefined', () => {
      let s = pinColumn(makeState(), 'name', 'left');
      s = pinColumn(s, 'name', undefined);
      expect(s.columns.find(c => c.field === 'name')!.pinned).toBeUndefined();
    });
  });

  describe('addFilter', () => {
    it('adds a new filter', () => {
      const filter = makeFilter('f-1', 'region');
      const s = addFilter(initialReportEditorState('R', 'ds-1'), filter);
      expect(s.filters).toHaveLength(1);
      expect(s.filters[0]).toEqual(filter);
    });

    it('replaces existing filter with same filterId', () => {
      const f1 = makeFilter('f-1', 'region');
      const f1Updated: FilterValue = { ...f1, value: 'updated' };
      let s = addFilter(initialReportEditorState('R', 'ds-1'), f1);
      s = addFilter(s, f1Updated);
      expect(s.filters).toHaveLength(1);
      expect(s.filters[0].value).toBe('updated');
    });

    it('allows multiple filters with different filterIds', () => {
      const f1 = makeFilter('f-1', 'region');
      const f2 = makeFilter('f-2', 'revenue');
      let s = addFilter(initialReportEditorState('R', 'ds-1'), f1);
      s = addFilter(s, f2);
      expect(s.filters).toHaveLength(2);
    });
  });

  describe('removeFilter', () => {
    it('removes a filter by filterId', () => {
      const f1 = makeFilter('f-1', 'region');
      const f2 = makeFilter('f-2', 'revenue');
      let s = addFilter(initialReportEditorState('R', 'ds-1'), f1);
      s = addFilter(s, f2);
      s = removeFilter(s, 'f-1');
      expect(s.filters).toHaveLength(1);
      expect(s.filters[0].filterId).toBe('f-2');
    });

    it('returns state unchanged if filterId not found', () => {
      const s = addFilter(initialReportEditorState('R', 'ds-1'), makeFilter('f-1', 'x'));
      const s2 = removeFilter(s, 'nonexistent');
      expect(s2.filters).toHaveLength(1);
    });
  });

  describe('setSorting', () => {
    it('replaces the sorting array', () => {
      const sorting = [{ field: 'revenue', direction: 'desc' as const }];
      const s = setSorting(initialReportEditorState('R', 'ds-1'), sorting);
      expect(s.sorting).toEqual(sorting);
    });

    it('can set multi-column sorting', () => {
      const sorting = [
        { field: 'region', direction: 'asc' as const },
        { field: 'revenue', direction: 'desc' as const },
      ];
      const s = setSorting(initialReportEditorState('R', 'ds-1'), sorting);
      expect(s.sorting).toHaveLength(2);
    });

    it('can clear sorting with empty array', () => {
      const s = setSorting(
        setSorting(initialReportEditorState('R', 'ds-1'), [{ field: 'x', direction: 'asc' }]),
        [],
      );
      expect(s.sorting).toEqual([]);
    });
  });

  describe('setGrouping', () => {
    it('replaces the grouping fields', () => {
      const s = setGrouping(initialReportEditorState('R', 'ds-1'), ['region', 'category']);
      expect(s.grouping).toEqual(['region', 'category']);
    });

    it('can clear grouping with empty array', () => {
      let s = setGrouping(initialReportEditorState('R', 'ds-1'), ['region']);
      s = setGrouping(s, []);
      expect(s.grouping).toEqual([]);
    });
  });

  describe('addConditionalFormat / removeConditionalFormat', () => {
    it('adds a conditional format rule', () => {
      const rule = makeFormatRule('cf-1', 'revenue');
      const s = addConditionalFormat(initialReportEditorState('R', 'ds-1'), rule);
      expect(s.formatting).toHaveLength(1);
      expect(s.formatting[0]).toEqual(rule);
    });

    it('adds multiple rules', () => {
      const r1 = makeFormatRule('cf-1', 'revenue');
      const r2 = makeFormatRule('cf-2', 'quantity');
      let s = addConditionalFormat(initialReportEditorState('R', 'ds-1'), r1);
      s = addConditionalFormat(s, r2);
      expect(s.formatting).toHaveLength(2);
    });

    it('removes a rule by id', () => {
      const r1 = makeFormatRule('cf-1', 'revenue');
      const r2 = makeFormatRule('cf-2', 'quantity');
      let s = addConditionalFormat(initialReportEditorState('R', 'ds-1'), r1);
      s = addConditionalFormat(s, r2);
      s = removeConditionalFormat(s, 'cf-1');
      expect(s.formatting).toHaveLength(1);
      expect(s.formatting[0].id).toBe('cf-2');
    });

    it('removeConditionalFormat does nothing for unknown id', () => {
      const r1 = makeFormatRule('cf-1', 'revenue');
      const s = addConditionalFormat(initialReportEditorState('R', 'ds-1'), r1);
      const s2 = removeConditionalFormat(s, 'nonexistent');
      expect(s2.formatting).toHaveLength(1);
    });
  });

  describe('setDensity', () => {
    it('sets density to compact', () => {
      const s = setDensity(initialReportEditorState('R', 'ds-1'), 'compact');
      expect(s.density).toBe('compact');
    });

    it('sets density to dense', () => {
      const s = setDensity(initialReportEditorState('R', 'ds-1'), 'dense');
      expect(s.density).toBe('dense');
    });

    it('sets density to comfortable', () => {
      const s = setDensity(setDensity(initialReportEditorState('R', 'ds-1'), 'compact'), 'comfortable');
      expect(s.density).toBe('comfortable');
    });
  });

  describe('setConfigPanelTab', () => {
    it('sets tab to filters', () => {
      const s = setConfigPanelTab(initialReportEditorState('R', 'ds-1'), 'filters');
      expect(s.configPanelTab).toBe('filters');
    });

    it('sets tab to style', () => {
      const s = setConfigPanelTab(initialReportEditorState('R', 'ds-1'), 'style');
      expect(s.configPanelTab).toBe('style');
    });
  });

  describe('selectColumn', () => {
    it('selects a column by field', () => {
      const s = selectColumn(makeState(), 'revenue');
      expect(s.selectedColumnField).toBe('revenue');
    });

    it('clears selection with undefined', () => {
      let s = selectColumn(makeState(), 'revenue');
      s = selectColumn(s, undefined);
      expect(s.selectedColumnField).toBeUndefined();
    });
  });

  describe('toGridConfig', () => {
    it('maps columns to grid-compatible format', () => {
      const config = toGridConfig(makeState());
      expect(config.columns).toHaveLength(3);
      expect(config.columns[0]).toEqual({
        field: 'name',
        headerName: 'Name',
        width: undefined,
        hide: undefined,
        pinned: undefined,
      });
    });

    it('maps hidden columns with hide: true', () => {
      const s = toggleColumnVisibility(makeState(), 'revenue');
      const config = toGridConfig(s);
      const revCol = config.columns.find(c => c.field === 'revenue')!;
      expect(revCol.hide).toBe(true);
    });

    it('maps visible columns with hide: undefined', () => {
      const config = toGridConfig(makeState());
      const nameCol = config.columns.find(c => c.field === 'name')!;
      expect(nameCol.hide).toBeUndefined();
    });

    it('includes pinned in output', () => {
      const s = pinColumn(makeState(), 'name', 'left');
      const config = toGridConfig(s);
      expect(config.columns.find(c => c.field === 'name')!.pinned).toBe('left');
    });

    it('includes width in output', () => {
      const s = updateColumn(makeState(), 'revenue', { width: 200 });
      const config = toGridConfig(s);
      expect(config.columns.find(c => c.field === 'revenue')!.width).toBe(200);
    });

    it('includes filters', () => {
      const filter = makeFilter('f-1', 'region');
      const s = addFilter(makeState(), filter);
      const config = toGridConfig(s);
      expect(config.filters).toHaveLength(1);
      expect(config.filters[0]).toEqual(filter);
    });

    it('includes sorting', () => {
      const sorting = [{ field: 'revenue', direction: 'desc' as const }];
      const s = setSorting(makeState(), sorting);
      const config = toGridConfig(s);
      expect(config.sorting).toEqual(sorting);
    });

    it('includes grouping', () => {
      const s = setGrouping(makeState(), ['region']);
      const config = toGridConfig(s);
      expect(config.grouping).toEqual(['region']);
    });

    it('includes density', () => {
      const s = setDensity(makeState(), 'compact');
      const config = toGridConfig(s);
      expect(config.density).toBe('compact');
    });
  });

  describe('immutability', () => {
    it('addColumn does not mutate original state', () => {
      const original = initialReportEditorState('R', 'ds-1');
      const frozen = { ...original, columns: [...original.columns] };
      addColumn(original, 'name');
      expect(original.columns).toEqual(frozen.columns);
    });

    it('removeColumn does not mutate original state', () => {
      const original = makeState();
      const colCount = original.columns.length;
      removeColumn(original, 'name');
      expect(original.columns).toHaveLength(colCount);
    });

    it('reorderColumns does not mutate original state', () => {
      const original = makeState();
      const fields = original.columns.map(c => c.field);
      reorderColumns(original, 0, 2);
      expect(original.columns.map(c => c.field)).toEqual(fields);
    });

    it('updateColumn does not mutate original state', () => {
      const original = makeState();
      const revCol = original.columns.find(c => c.field === 'revenue')!;
      updateColumn(original, 'revenue', { width: 999 });
      expect(revCol.width).toBeUndefined();
    });

    it('addFilter does not mutate original state', () => {
      const original = initialReportEditorState('R', 'ds-1');
      const filterCount = original.filters.length;
      addFilter(original, makeFilter('f-1', 'x'));
      expect(original.filters).toHaveLength(filterCount);
    });

    it('setSorting does not mutate original state', () => {
      const original = initialReportEditorState('R', 'ds-1');
      setSorting(original, [{ field: 'x', direction: 'asc' }]);
      expect(original.sorting).toEqual([]);
    });

    it('setGrouping does not mutate original state', () => {
      const original = initialReportEditorState('R', 'ds-1');
      setGrouping(original, ['region']);
      expect(original.grouping).toEqual([]);
    });

    it('each transition returns a new object reference', () => {
      const s0 = initialReportEditorState('R', 'ds-1');
      const s1 = addColumn(s0, 'x');
      const s2 = removeColumn(s1, 'x');
      const s3 = setDensity(s2, 'compact');
      expect(s0).not.toBe(s1);
      expect(s1).not.toBe(s2);
      expect(s2).not.toBe(s3);
    });
  });
});
