/**
 * W.3 — Upload Preview + Sheet Picker
 */

import { describe, it, expect } from 'vitest';

describe('Upload Preview (W.3)', () => {
  describe('createPreviewState()', () => {
    it('creates initial preview state', async () => {
      const { createPreviewState } = await import('../local/upload-preview.js');
      const state = createPreviewState();
      expect(state.rows).toEqual([]);
      expect(state.columns).toEqual([]);
      expect(state.maxPreviewRows).toBe(20);
      expect(state.loading).toBe(false);
    });
  });

  describe('inferColumnTypes()', () => {
    it('infers string columns', async () => {
      const { inferColumnTypes } = await import('../local/upload-preview.js');
      const rows = [['Alice'], ['Bob'], ['Charlie']];
      const types = inferColumnTypes(rows, ['name']);
      expect(types[0].inferredType).toBe('string');
    });

    it('infers number columns', async () => {
      const { inferColumnTypes } = await import('../local/upload-preview.js');
      const rows = [['100'], ['200'], ['300']];
      const types = inferColumnTypes(rows, ['amount']);
      expect(types[0].inferredType).toBe('number');
    });

    it('infers date columns', async () => {
      const { inferColumnTypes } = await import('../local/upload-preview.js');
      const rows = [['2024-01-01'], ['2024-02-15'], ['2024-03-30']];
      const types = inferColumnTypes(rows, ['date']);
      expect(types[0].inferredType).toBe('date');
    });

    it('infers boolean columns', async () => {
      const { inferColumnTypes } = await import('../local/upload-preview.js');
      const rows = [['true'], ['false'], ['true']];
      const types = inferColumnTypes(rows, ['active']);
      expect(types[0].inferredType).toBe('boolean');
    });

    it('allows type override', async () => {
      const { inferColumnTypes, applyTypeOverride } = await import('../local/upload-preview.js');
      const types = inferColumnTypes([['100']], ['id']);
      const overridden = applyTypeOverride(types, 'id', 'string');
      expect(overridden[0].inferredType).toBe('string');
      expect(overridden[0].overridden).toBe(true);
    });
  });

  describe('Sheet picker', () => {
    it('creates sheet list from sheet names', async () => {
      const { createSheetList } = await import('../local/upload-preview.js');
      const sheets = createSheetList(['Sheet1', 'Sales', 'Summary']);
      expect(sheets).toHaveLength(3);
      expect(sheets[0].name).toBe('Sheet1');
      expect(sheets[0].index).toBe(0);
      expect(sheets[1].name).toBe('Sales');
    });

    it('defaults to first sheet selected', async () => {
      const { createSheetList } = await import('../local/upload-preview.js');
      const sheets = createSheetList(['Sheet1', 'Sheet2']);
      expect(sheets[0].selected).toBe(true);
      expect(sheets[1].selected).toBe(false);
    });

    it('selects a specific sheet', async () => {
      const { createSheetList, selectSheet } = await import('../local/upload-preview.js');
      const sheets = createSheetList(['Sheet1', 'Sheet2', 'Sheet3']);
      const updated = selectSheet(sheets, 2);
      expect(updated[0].selected).toBe(false);
      expect(updated[2].selected).toBe(true);
    });
  });
});
