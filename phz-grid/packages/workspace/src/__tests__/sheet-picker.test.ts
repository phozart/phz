/**
 * W.3b — Sheet picker component logic
 * Sheet selection, preview rows, table naming.
 */
import { describe, it, expect } from 'vitest';
import {
  createSheetPicker,
  type SheetInfo,
  type SheetPickerState,
} from '../local/phz-sheet-picker.js';

describe('Sheet Picker (W.3)', () => {
  const sheets: SheetInfo[] = [
    { name: 'Sales', rowCount: 1000, headers: ['region', 'revenue', 'date'] },
    { name: 'Inventory', rowCount: 500, headers: ['sku', 'quantity', 'warehouse'] },
    { name: 'Summary', rowCount: 10, headers: ['metric', 'value'] },
  ];

  describe('createSheetPicker', () => {
    it('creates picker state with all sheets', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      expect(state.sheets).toHaveLength(3);
    });

    it('selects first sheet by default', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      expect(state.selectedSheets).toEqual(['Sales']);
    });

    it('generates table names as filename_sheetname', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      const names = state.getTableNames();
      expect(names).toContain('report_Sales');
      expect(names).toContain('report_Inventory');
      expect(names).toContain('report_Summary');
    });

    it('strips extension from filename in table names', () => {
      const state = createSheetPicker(sheets, 'data.xlsx');
      expect(state.getTableNames()[0]).toBe('data_Sales');
    });

    it('toggles sheet selection', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      const updated = state.toggleSheet('Inventory');
      expect(updated.selectedSheets).toContain('Sales');
      expect(updated.selectedSheets).toContain('Inventory');
    });

    it('deselects an already-selected sheet', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      const updated = state.toggleSheet('Sales');
      expect(updated.selectedSheets).not.toContain('Sales');
    });

    it('provides sheet preview rows', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      const sheet = state.getSheetInfo('Sales');
      expect(sheet?.rowCount).toBe(1000);
      expect(sheet?.headers).toEqual(['region', 'revenue', 'date']);
    });

    it('returns undefined for unknown sheet name', () => {
      const state = createSheetPicker(sheets, 'report.xlsx');
      expect(state.getSheetInfo('NotASheet')).toBeUndefined();
    });

    it('sanitizes table names (replaces spaces/special chars)', () => {
      const sheetsWithSpaces: SheetInfo[] = [
        { name: 'My Sheet (2)', rowCount: 10, headers: ['a'] },
      ];
      const state = createSheetPicker(sheetsWithSpaces, 'my file.xlsx');
      const names = state.getTableNames();
      // Should not contain spaces or parens
      expect(names[0]).toMatch(/^[a-zA-Z0-9_]+$/);
    });
  });
});
