/**
 * Tests for dashboard editor ↔ data source panel wiring.
 *
 * Verifies that field-add events from the data source panel correctly
 * translate into dashboard widget data config updates.
 *
 * Tasks: 1.2, 1.5 (WB-004)
 */

import { describe, it, expect } from 'vitest';
import {
  initialDashboardEditorState,
  addWidget,
  selectWidget,
  type DashboardEditorState,
} from '../authoring/dashboard-editor-state.js';
import {
  handleDashboardFieldAdd,
  handleDashboardFieldRemove,
  autoCreateWidgetForField,
} from '../authoring/dashboard-editor-wiring.js';

describe('dashboard-editor-wiring', () => {
  describe('handleDashboardFieldAdd', () => {
    it('adds dimension to selected widget when field is a string', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);

      const newState = handleDashboardFieldAdd(state, 'region', {
        name: 'region',
        dataType: 'string',
        semanticHint: 'dimension',
      });

      const widget = newState.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.dimensions).toHaveLength(1);
      expect(widget.dataConfig.dimensions[0].field).toBe('region');
    });

    it('adds measure to selected widget when field is a number', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);

      const newState = handleDashboardFieldAdd(state, 'revenue', {
        name: 'revenue',
        dataType: 'number',
        semanticHint: 'measure',
      });

      const widget = newState.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.measures).toHaveLength(1);
      expect(widget.dataConfig.measures[0].field).toBe('revenue');
      expect(widget.dataConfig.measures[0].aggregation).toBe('sum');
    });

    it('returns state unchanged when no widget is selected', () => {
      const state = initialDashboardEditorState('Test', 'ds-1');
      const newState = handleDashboardFieldAdd(state, 'revenue', {
        name: 'revenue',
        dataType: 'number',
      });
      expect(newState).toBe(state);
    });

    it('does not add duplicate dimensions', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);

      state = handleDashboardFieldAdd(state, 'region', { name: 'region', dataType: 'string' });
      state = handleDashboardFieldAdd(state, 'region', { name: 'region', dataType: 'string' });

      const widget = state.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.dimensions).toHaveLength(1);
    });

    it('does not add duplicate measures', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);

      state = handleDashboardFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });
      state = handleDashboardFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });

      const widget = state.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.measures).toHaveLength(1);
    });
  });

  describe('handleDashboardFieldRemove', () => {
    it('removes dimension from selected widget', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);
      state = handleDashboardFieldAdd(state, 'region', { name: 'region', dataType: 'string' });

      state = handleDashboardFieldRemove(state, 'region');
      const widget = state.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.dimensions).toHaveLength(0);
    });

    it('removes measure from selected widget', () => {
      let state = initialDashboardEditorState('Test', 'ds-1');
      state = addWidget(state, 'bar-chart');
      const widgetId = state.widgets[0].id;
      state = selectWidget(state, widgetId);
      state = handleDashboardFieldAdd(state, 'revenue', { name: 'revenue', dataType: 'number' });

      state = handleDashboardFieldRemove(state, 'revenue');
      const widget = state.widgets.find(w => w.id === widgetId)!;
      expect(widget.dataConfig.measures).toHaveLength(0);
    });

    it('returns state unchanged when no widget is selected', () => {
      const state = initialDashboardEditorState('Test', 'ds-1');
      const newState = handleDashboardFieldRemove(state, 'revenue');
      expect(newState).toBe(state);
    });
  });

  describe('autoCreateWidgetForField', () => {
    it('suggests kpi-card for a number field with no context', () => {
      const suggestion = autoCreateWidgetForField({ name: 'revenue', dataType: 'number' });
      expect(suggestion.widgetType).toBe('kpi-card');
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('suggests bar-chart for string fields (categorical dimension)', () => {
      const suggestion = autoCreateWidgetForField({ name: 'region', dataType: 'string' });
      expect(suggestion.widgetType).toBe('bar-chart');
    });

    it('suggests trend-line for date fields', () => {
      const suggestion = autoCreateWidgetForField({ name: 'created_at', dataType: 'date' });
      expect(suggestion.widgetType).toBe('trend-line');
    });
  });
});
