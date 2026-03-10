/**
 * Tests for report editor ↔ data source panel wiring.
 *
 * Verifies that field-add/field-remove events from the data source panel
 * correctly translate into report column state transitions.
 *
 * Tasks: 1.1, 1.4 (WB-002, WB-003)
 */

import { describe, it, expect } from 'vitest';
import {
  initialReportEditorState,
  addColumn,
  removeColumn,
  type ReportEditorState,
} from '../authoring/report-editor-state.js';
import {
  handleFieldAdd,
  handleFieldRemove,
  buildAvailableFieldsFromSchema,
} from '../authoring/report-editor-wiring.js';

describe('report-editor-wiring', () => {
  describe('handleFieldAdd', () => {
    it('adds a column to the report state', () => {
      const state = initialReportEditorState('Test', 'ds-1');
      const newState = handleFieldAdd(state, 'revenue', {
        name: 'revenue',
        dataType: 'number',
        semanticHint: 'measure',
      });
      expect(newState.columns).toHaveLength(1);
      expect(newState.columns[0].field).toBe('revenue');
      expect(newState.columns[0].label).toBe('revenue');
    });

    it('does not add duplicate columns', () => {
      let state = initialReportEditorState('Test', 'ds-1');
      state = handleFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });
      state = handleFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });
      expect(state.columns).toHaveLength(1);
    });

    it('uses field name as label', () => {
      const state = initialReportEditorState('Test', 'ds-1');
      const newState = handleFieldAdd(state, 'customer_name', {
        name: 'customer_name',
        dataType: 'string',
      });
      expect(newState.columns[0].label).toBe('customer_name');
    });
  });

  describe('handleFieldRemove', () => {
    it('removes a column from the report state', () => {
      let state = initialReportEditorState('Test', 'ds-1');
      state = handleFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });
      state = handleFieldRemove(state, 'revenue');
      expect(state.columns).toHaveLength(0);
    });

    it('is a no-op for non-existent columns', () => {
      const state = initialReportEditorState('Test', 'ds-1');
      const newState = handleFieldRemove(state, 'nonexistent');
      expect(newState.columns).toHaveLength(0);
    });
  });

  describe('buildAvailableFieldsFromSchema', () => {
    it('converts schema fields to available fields format', () => {
      const fields = buildAvailableFieldsFromSchema([
        { name: 'id', dataType: 'string' },
        { name: 'amount', dataType: 'number' },
        { name: 'date', dataType: 'date' },
      ]);
      expect(fields).toEqual([
        { field: 'id', label: 'id' },
        { field: 'amount', label: 'amount' },
        { field: 'date', label: 'date' },
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(buildAvailableFieldsFromSchema([])).toEqual([]);
    });
  });
});
