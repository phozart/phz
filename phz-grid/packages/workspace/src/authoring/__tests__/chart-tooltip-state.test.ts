import { describe, it, expect } from 'vitest';
import {
  type ChartTooltipEditorState,
  initialChartTooltipEditorState,
  setTooltipMode,
  updateAutoConfig,
  addCustomField,
  removeCustomField,
  updateCustomField,
  reorderCustomFields,
  startEditField,
  commitField,
} from '../chart-tooltip-state.js';
import type { TooltipField } from '@phozart/phz-engine';

function makeField(overrides: Partial<TooltipField> & { field: string; order: number }): TooltipField {
  return { ...overrides };
}

describe('chart-tooltip-state', () => {
  describe('initialChartTooltipEditorState', () => {
    it('defaults to auto mode with showCategory and showValue enabled', () => {
      const s = initialChartTooltipEditorState();
      expect(s.mode).toBe('auto');
      expect(s.autoConfig.showCategory).toBe(true);
      expect(s.autoConfig.showValue).toBe(true);
      expect(s.autoConfig.showPercentage).toBe(false);
      expect(s.autoConfig.showDelta).toBe(false);
      expect(s.customFields).toEqual([]);
      expect(s.editingFieldIndex).toBeUndefined();
    });
  });

  describe('setTooltipMode', () => {
    it('switches to custom mode', () => {
      const s = setTooltipMode(initialChartTooltipEditorState(), 'custom');
      expect(s.mode).toBe('custom');
    });

    it('switches back to auto mode', () => {
      const s = setTooltipMode(initialChartTooltipEditorState(), 'custom');
      const s2 = setTooltipMode(s, 'auto');
      expect(s2.mode).toBe('auto');
    });

    it('returns same reference when mode is unchanged', () => {
      const s = initialChartTooltipEditorState();
      const s2 = setTooltipMode(s, 'auto');
      expect(s2).toBe(s);
    });
  });

  describe('updateAutoConfig', () => {
    it('toggles showPercentage', () => {
      const s = updateAutoConfig(initialChartTooltipEditorState(), { showPercentage: true });
      expect(s.autoConfig.showPercentage).toBe(true);
      expect(s.autoConfig.showCategory).toBe(true); // unchanged
    });

    it('sets deltaMode', () => {
      const s = updateAutoConfig(initialChartTooltipEditorState(), { showDelta: true, deltaMode: 'both' });
      expect(s.autoConfig.showDelta).toBe(true);
      expect(s.autoConfig.deltaMode).toBe('both');
    });
  });

  describe('addCustomField', () => {
    it('appends a new field with next order number', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'revenue', order: 0 }));
      expect(s.customFields).toHaveLength(1);
      expect(s.customFields[0].field).toBe('revenue');
    });

    it('appends multiple fields', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'revenue', order: 0 }));
      s = addCustomField(s, makeField({ field: 'costs', order: 1 }));
      expect(s.customFields).toHaveLength(2);
    });
  });

  describe('removeCustomField', () => {
    it('removes field at index', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'revenue', order: 0 }));
      s = addCustomField(s, makeField({ field: 'costs', order: 1 }));
      s = removeCustomField(s, 0);
      expect(s.customFields).toHaveLength(1);
      expect(s.customFields[0].field).toBe('costs');
    });

    it('returns same state when index is out of bounds', () => {
      const s = initialChartTooltipEditorState();
      const s2 = removeCustomField(s, 5);
      expect(s2).toBe(s);
    });
  });

  describe('updateCustomField', () => {
    it('updates field at index', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'revenue', order: 0 }));
      s = updateCustomField(s, 0, { label: 'Total Revenue' });
      expect(s.customFields[0].label).toBe('Total Revenue');
      expect(s.customFields[0].field).toBe('revenue');
    });

    it('returns same state when index is out of bounds', () => {
      const s = initialChartTooltipEditorState();
      const s2 = updateCustomField(s, 0, { label: 'x' });
      expect(s2).toBe(s);
    });
  });

  describe('reorderCustomFields', () => {
    it('reorders fields by new indices', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'a', order: 0 }));
      s = addCustomField(s, makeField({ field: 'b', order: 1 }));
      s = addCustomField(s, makeField({ field: 'c', order: 2 }));
      s = reorderCustomFields(s, [2, 0, 1]);
      expect(s.customFields.map(f => f.field)).toEqual(['c', 'a', 'b']);
      // Order numbers should be renumbered sequentially
      expect(s.customFields.map(f => f.order)).toEqual([0, 1, 2]);
    });
  });

  describe('startEditField / commitField', () => {
    it('sets editingFieldIndex', () => {
      const s = startEditField(initialChartTooltipEditorState(), 2);
      expect(s.editingFieldIndex).toBe(2);
    });

    it('commitField clears editingFieldIndex', () => {
      let s = initialChartTooltipEditorState();
      s = addCustomField(s, makeField({ field: 'revenue', order: 0 }));
      s = startEditField(s, 0);
      expect(s.editingFieldIndex).toBe(0);
      s = commitField(s);
      expect(s.editingFieldIndex).toBeUndefined();
    });
  });
});
