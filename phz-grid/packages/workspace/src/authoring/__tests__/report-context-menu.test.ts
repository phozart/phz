import { describe, it, expect } from 'vitest';
import {
  getColumnHeaderMenu,
  getCellMenu,
  getSelectionMenu,
  getContextMenu,
} from '../report-context-menu.js';
import type { ContextMenuItem, ReportContextTarget } from '../report-context-menu.js';
import {
  initialReportEditorState,
  addColumn,
  setSorting,
  setGrouping,
  pinColumn,
} from '../report-editor-state.js';
import type { ReportEditorState } from '../report-editor-state.js';

function makeState(): ReportEditorState {
  let s = initialReportEditorState('Test Report', 'ds-1');
  s = addColumn(s, 'name', 'Name');
  s = addColumn(s, 'revenue', 'Revenue');
  s = addColumn(s, 'region', 'Region');
  return s;
}

function findItem(items: ContextMenuItem[], id: string): ContextMenuItem | undefined {
  return items.find(i => i.id === id);
}

function nonSeparatorItems(items: ContextMenuItem[]): ContextMenuItem[] {
  return items.filter(i => !i.separator);
}

describe('ReportContextMenu', () => {
  describe('getColumnHeaderMenu', () => {
    it('returns sort-asc and sort-desc items', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'sort-asc')).toBeDefined();
      expect(findItem(items, 'sort-desc')).toBeDefined();
    });

    it('returns group item', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      const groupItem = findItem(items, 'group');
      expect(groupItem).toBeDefined();
      expect(groupItem!.label).toBe('Group by name');
    });

    it('returns pin-left, pin-right items', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'pin-left')).toBeDefined();
      expect(findItem(items, 'pin-right')).toBeDefined();
    });

    it('returns hide-column item', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'hide-column')).toBeDefined();
    });

    it('returns add-filter item with field name', () => {
      const items = getColumnHeaderMenu(makeState(), 'revenue');
      const filterItem = findItem(items, 'add-filter');
      expect(filterItem).toBeDefined();
      expect(filterItem!.label).toBe('Add Filter on revenue');
    });

    it('returns conditional-format item', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'conditional-format')).toBeDefined();
    });

    it('returns column-settings item', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'column-settings')).toBeDefined();
    });

    it('includes separator items', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      const seps = items.filter(i => i.separator);
      expect(seps.length).toBeGreaterThan(0);
    });

    it('disables sort-asc when already sorted ascending', () => {
      const s = setSorting(makeState(), [{ field: 'revenue', direction: 'asc' }]);
      const items = getColumnHeaderMenu(s, 'revenue');
      expect(findItem(items, 'sort-asc')!.disabled).toBe(true);
      expect(findItem(items, 'sort-desc')!.disabled).toBeFalsy();
    });

    it('disables sort-desc when already sorted descending', () => {
      const s = setSorting(makeState(), [{ field: 'revenue', direction: 'desc' }]);
      const items = getColumnHeaderMenu(s, 'revenue');
      expect(findItem(items, 'sort-desc')!.disabled).toBe(true);
      expect(findItem(items, 'sort-asc')!.disabled).toBeFalsy();
    });

    it('does not disable sort items for unsorted column', () => {
      const s = setSorting(makeState(), [{ field: 'revenue', direction: 'asc' }]);
      const items = getColumnHeaderMenu(s, 'name');
      expect(findItem(items, 'sort-asc')!.disabled).toBeFalsy();
      expect(findItem(items, 'sort-desc')!.disabled).toBeFalsy();
    });

    it('shows "Ungroup" when field is grouped', () => {
      const s = setGrouping(makeState(), ['region']);
      const items = getColumnHeaderMenu(s, 'region');
      const item = findItem(items, 'ungroup');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Ungroup');
    });

    it('shows "Group by <field>" when field is not grouped', () => {
      const s = setGrouping(makeState(), ['region']);
      const items = getColumnHeaderMenu(s, 'name');
      const item = findItem(items, 'group');
      expect(item).toBeDefined();
      expect(item!.label).toBe('Group by name');
    });

    it('shows "Unpin" when field is pinned left', () => {
      const s = pinColumn(makeState(), 'name', 'left');
      const items = getColumnHeaderMenu(s, 'name');
      expect(findItem(items, 'unpin')).toBeDefined();
      expect(findItem(items, 'pin-left')!.disabled).toBe(true);
    });

    it('shows "Unpin" when field is pinned right', () => {
      const s = pinColumn(makeState(), 'revenue', 'right');
      const items = getColumnHeaderMenu(s, 'revenue');
      expect(findItem(items, 'unpin')).toBeDefined();
      expect(findItem(items, 'pin-right')!.disabled).toBe(true);
    });

    it('does not show "Unpin" when field is not pinned', () => {
      const items = getColumnHeaderMenu(makeState(), 'name');
      expect(findItem(items, 'unpin')).toBeUndefined();
    });

    it('disables pin-left when already pinned left', () => {
      const s = pinColumn(makeState(), 'name', 'left');
      const items = getColumnHeaderMenu(s, 'name');
      expect(findItem(items, 'pin-left')!.disabled).toBe(true);
      expect(findItem(items, 'pin-right')!.disabled).toBeFalsy();
    });
  });

  describe('getCellMenu', () => {
    it('returns copy-value item with shortcut', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: 'Acme' });
      const copy = findItem(items, 'copy-value');
      expect(copy).toBeDefined();
      expect(copy!.shortcut).toBe('Ctrl+C');
    });

    it('returns filter-by-value with the value in the label', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: 'Acme Corp' });
      const filterBy = findItem(items, 'filter-by-value');
      expect(filterBy).toBeDefined();
      expect(filterBy!.label).toContain('Acme Corp');
    });

    it('returns exclude-value with the value in the label', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: 42 });
      const exclude = findItem(items, 'exclude-value');
      expect(exclude).toBeDefined();
      expect(exclude!.label).toContain('42');
    });

    it('displays "null" for null values', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: null });
      const filterBy = findItem(items, 'filter-by-value');
      expect(filterBy!.label).toContain('null');
    });

    it('displays "null" for undefined values', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: undefined });
      const filterBy = findItem(items, 'filter-by-value');
      expect(filterBy!.label).toContain('null');
    });

    it('returns view-data item', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: 'x' });
      expect(findItem(items, 'view-data')).toBeDefined();
    });

    it('includes separators', () => {
      const items = getCellMenu(makeState(), { type: 'cell', field: 'name', rowIndex: 0, value: 'x' });
      expect(items.some(i => i.separator)).toBe(true);
    });
  });

  describe('getSelectionMenu', () => {
    it('returns copy-selected item with shortcut', () => {
      const items = getSelectionMenu(makeState(), { type: 'selection', fields: ['name'], rowIndices: [0, 1] });
      const copy = findItem(items, 'copy-selected');
      expect(copy).toBeDefined();
      expect(copy!.shortcut).toBe('Ctrl+C');
    });

    it('returns export-selection item', () => {
      const items = getSelectionMenu(makeState(), { type: 'selection', fields: ['name'], rowIndices: [0] });
      const exp = findItem(items, 'export-selection');
      expect(exp).toBeDefined();
      expect(exp!.label).toContain('CSV');
    });
  });

  describe('getContextMenu — dispatcher', () => {
    it('dispatches column-header target to getColumnHeaderMenu', () => {
      const target: ReportContextTarget = { type: 'column-header', field: 'name' };
      const items = getContextMenu(makeState(), target);
      expect(findItem(items, 'sort-asc')).toBeDefined();
      expect(findItem(items, 'hide-column')).toBeDefined();
    });

    it('dispatches cell target to getCellMenu', () => {
      const target: ReportContextTarget = { type: 'cell', field: 'name', rowIndex: 0, value: 'test' };
      const items = getContextMenu(makeState(), target);
      expect(findItem(items, 'copy-value')).toBeDefined();
      expect(findItem(items, 'filter-by-value')).toBeDefined();
    });

    it('dispatches selection target to getSelectionMenu', () => {
      const target: ReportContextTarget = { type: 'selection', fields: ['name'], rowIndices: [0, 1] };
      const items = getContextMenu(makeState(), target);
      expect(findItem(items, 'copy-selected')).toBeDefined();
      expect(findItem(items, 'export-selection')).toBeDefined();
    });

    it('dispatches row target with copy-row and view-row', () => {
      const target: ReportContextTarget = { type: 'row', rowIndex: 5 };
      const items = getContextMenu(makeState(), target);
      expect(findItem(items, 'copy-row')).toBeDefined();
      expect(findItem(items, 'view-row')).toBeDefined();
    });

    it('row menu has exactly 2 items', () => {
      const target: ReportContextTarget = { type: 'row', rowIndex: 0 };
      const items = getContextMenu(makeState(), target);
      expect(items).toHaveLength(2);
    });

    it('row menu items have icons', () => {
      const target: ReportContextTarget = { type: 'row', rowIndex: 0 };
      const items = getContextMenu(makeState(), target);
      expect(items.every(i => i.icon != null)).toBe(true);
    });
  });
});
