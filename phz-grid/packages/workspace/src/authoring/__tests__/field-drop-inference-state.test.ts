/**
 * @phozart/workspace — Field-Drop Inference State Tests (UX-016)
 *
 * Drag-drop data model field-to-widget inference state machine.
 * Pure function state management for inferring the best widget type
 * when a user drops a data field onto the dashboard canvas.
 */
import { describe, it, expect } from 'vitest';
import {
  createFieldDropInferenceState,
  inferWidgetForField,
  inferWidgetForFields,
  selectInference,
  getSelectedInference,
  clearInference,
} from '../field-drop-inference-state.js';
import type { FieldInput, FieldDropInferenceState } from '../field-drop-inference-state.js';

// ========================================================================
// createFieldDropInferenceState
// ========================================================================

describe('createFieldDropInferenceState', () => {
  it('creates empty state with no inferences', () => {
    const state = createFieldDropInferenceState();
    expect(state.inferences).toEqual([]);
    expect(state.selectedIndex).toBe(0);
    expect(state.fields).toEqual([]);
  });
});

// ========================================================================
// inferWidgetForField — single field inference
// ========================================================================

describe('inferWidgetForField', () => {
  it('number + currency → kpi-card (0.9)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'revenue', dataType: 'number', semanticHint: 'currency' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('kpi-card');
    expect(next.inferences[0].confidence).toBe(0.9);
    expect(next.inferences[0].rationale).toBe('Currency value — KPI card');
  });

  it('number + percentage → gauge (0.85)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'margin', dataType: 'number', semanticHint: 'percentage' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('gauge');
    expect(next.inferences[0].confidence).toBe(0.85);
    expect(next.inferences[0].rationale).toBe('Percentage value — gauge display');
  });

  it('number (no semantic hint) → kpi-card (0.8) + bar-chart secondary', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'quantity', dataType: 'number' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences).toHaveLength(2);
    expect(next.inferences[0].widgetType).toBe('kpi-card');
    expect(next.inferences[0].confidence).toBe(0.8);
    expect(next.inferences[0].rationale).toBe('Numeric value — KPI card');

    // Secondary inference for numeric fields
    expect(next.inferences[1].widgetType).toBe('bar-chart');
    expect(next.inferences[1].confidence).toBe(0.8 - 0.15);
  });

  it('numeric fields always include bar-chart as secondary inference', () => {
    const state = createFieldDropInferenceState();
    const currencyField: FieldInput = { name: 'revenue', dataType: 'number', semanticHint: 'currency' };
    const next = inferWidgetForField(state, currencyField);

    expect(next.inferences.length).toBeGreaterThanOrEqual(2);
    const barChart = next.inferences.find(i => i.widgetType === 'bar-chart');
    expect(barChart).toBeDefined();
    expect(barChart!.confidence).toBe(0.9 - 0.15);
  });

  it('date → trend-line (0.9) + data-table secondary', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'orderDate', dataType: 'date' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences).toHaveLength(2);
    expect(next.inferences[0].widgetType).toBe('trend-line');
    expect(next.inferences[0].confidence).toBe(0.9);
    expect(next.inferences[0].rationale).toBe('Date field — trend line');

    // Secondary inference for date fields
    expect(next.inferences[1].widgetType).toBe('data-table');
    expect(next.inferences[1].confidence).toBe(0.9 - 0.2);
  });

  it('date with timestamp hint → trend-line (0.9)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'createdAt', dataType: 'date', semanticHint: 'timestamp' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('trend-line');
    expect(next.inferences[0].confidence).toBe(0.9);
    expect(next.inferences[0].rationale).toBe('Date field — trend line');
  });

  it('string + low cardinality → pie-chart (0.8)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'status', dataType: 'string', cardinality: 'low' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('pie-chart');
    expect(next.inferences[0].confidence).toBe(0.8);
    expect(next.inferences[0].rationale).toBe('Few categories — pie chart');
  });

  it('string + high cardinality → data-table (0.85)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'customerId', dataType: 'string', cardinality: 'high' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('data-table');
    expect(next.inferences[0].confidence).toBe(0.85);
    expect(next.inferences[0].rationale).toBe('Many distinct values — data table');
  });

  it('string + medium cardinality → bar-chart (0.8)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'region', dataType: 'string', cardinality: 'medium' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('bar-chart');
    expect(next.inferences[0].confidence).toBe(0.8);
    expect(next.inferences[0].rationale).toBe('Moderate categories — bar chart');
  });

  it('string (no cardinality) → bar-chart (0.75)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'description', dataType: 'string' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('bar-chart');
    expect(next.inferences[0].confidence).toBe(0.75);
    expect(next.inferences[0].rationale).toBe('Text field — bar chart');
  });

  it('boolean → kpi-card (0.7)', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'isActive', dataType: 'boolean' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].widgetType).toBe('kpi-card');
    expect(next.inferences[0].confidence).toBe(0.7);
    expect(next.inferences[0].rationale).toBe('Boolean field — KPI card');
  });

  it('sets fields=[field] on state', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'revenue', dataType: 'number', semanticHint: 'currency' };
    const next = inferWidgetForField(state, field);

    expect(next.fields).toEqual([field]);
  });

  it('populates measures=[field.name] for numeric fields', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'revenue', dataType: 'number', semanticHint: 'currency' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].dataConfig.measures).toEqual(['revenue']);
    expect(next.inferences[0].dataConfig.dimensions).toEqual([]);
  });

  it('populates dimensions=[field.name] for non-numeric fields', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'region', dataType: 'string', cardinality: 'medium' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].dataConfig.dimensions).toEqual(['region']);
    expect(next.inferences[0].dataConfig.measures).toEqual([]);
  });

  it('populates dimensions for date fields', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'orderDate', dataType: 'date' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].dataConfig.dimensions).toEqual(['orderDate']);
    expect(next.inferences[0].dataConfig.measures).toEqual([]);
  });

  it('populates dimensions for boolean fields', () => {
    const state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'isActive', dataType: 'boolean' };
    const next = inferWidgetForField(state, field);

    expect(next.inferences[0].dataConfig.dimensions).toEqual(['isActive']);
    expect(next.inferences[0].dataConfig.measures).toEqual([]);
  });

  it('resets selectedIndex to 0', () => {
    let state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'quantity', dataType: 'number' };
    state = inferWidgetForField(state, field);
    state = selectInference(state, 1);
    expect(state.selectedIndex).toBe(1);

    // New inference should reset selectedIndex
    const next = inferWidgetForField(state, { name: 'price', dataType: 'number', semanticHint: 'currency' });
    expect(next.selectedIndex).toBe(0);
  });
});

// ========================================================================
// inferWidgetForFields — multi-field inference
// ========================================================================

describe('inferWidgetForFields', () => {
  it('date + number → trend-line (0.95)', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'orderDate', dataType: 'date' },
      { name: 'revenue', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('trend-line');
    expect(next.inferences[0].confidence).toBe(0.95);
    expect(next.inferences[0].dataConfig.dimensions).toEqual(['orderDate']);
    expect(next.inferences[0].dataConfig.measures).toEqual(['revenue']);
  });

  it('string + number → bar-chart (0.9)', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'category', dataType: 'string' },
      { name: 'sales', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('bar-chart');
    expect(next.inferences[0].confidence).toBe(0.9);
    expect(next.inferences[0].dataConfig.dimensions).toEqual(['category']);
    expect(next.inferences[0].dataConfig.measures).toEqual(['sales']);
  });

  it('2+ numbers only → kpi-scorecard (0.8)', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'revenue', dataType: 'number' },
      { name: 'profit', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('kpi-scorecard');
    expect(next.inferences[0].confidence).toBe(0.8);
    expect(next.inferences[0].dataConfig.measures).toEqual(['revenue', 'profit']);
    expect(next.inferences[0].dataConfig.dimensions).toEqual([]);
  });

  it('3 numbers → kpi-scorecard with all as measures', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'revenue', dataType: 'number' },
      { name: 'profit', dataType: 'number' },
      { name: 'cost', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('kpi-scorecard');
    expect(next.inferences[0].dataConfig.measures).toEqual(['revenue', 'profit', 'cost']);
  });

  it('string + 2+ numbers → bar-chart grouped variant (0.85)', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'region', dataType: 'string' },
      { name: 'revenue', dataType: 'number' },
      { name: 'profit', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('bar-chart');
    expect(next.inferences[0].variant).toBe('grouped');
    expect(next.inferences[0].confidence).toBe(0.85);
    expect(next.inferences[0].dataConfig.dimensions).toEqual(['region']);
    expect(next.inferences[0].dataConfig.measures).toEqual(['revenue', 'profit']);
  });

  it('fallback → data-table (0.7)', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'firstName', dataType: 'string' },
      { name: 'lastName', dataType: 'string' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.inferences[0].widgetType).toBe('data-table');
    expect(next.inferences[0].confidence).toBe(0.7);
    expect(next.inferences[0].dataConfig.dimensions).toEqual(['firstName', 'lastName']);
  });

  it('sets fields on state', () => {
    const state = createFieldDropInferenceState();
    const fields: FieldInput[] = [
      { name: 'orderDate', dataType: 'date' },
      { name: 'revenue', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);

    expect(next.fields).toEqual(fields);
  });

  it('resets selectedIndex to 0', () => {
    let state = createFieldDropInferenceState();
    const field: FieldInput = { name: 'quantity', dataType: 'number' };
    state = inferWidgetForField(state, field);
    state = selectInference(state, 1);

    const fields: FieldInput[] = [
      { name: 'orderDate', dataType: 'date' },
      { name: 'revenue', dataType: 'number' },
    ];
    const next = inferWidgetForFields(state, fields);
    expect(next.selectedIndex).toBe(0);
  });
});

// ========================================================================
// selectInference
// ========================================================================

describe('selectInference', () => {
  it('sets selectedIndex', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    // Should have 2 inferences (kpi-card + bar-chart)
    expect(state.inferences).toHaveLength(2);

    const next = selectInference(state, 1);
    expect(next.selectedIndex).toBe(1);
  });

  it('clamps to 0 when negative', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });

    const next = selectInference(state, -5);
    expect(next.selectedIndex).toBe(0);
  });

  it('clamps to last valid index when exceeding range', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    // 2 inferences → max valid index = 1

    const next = selectInference(state, 99);
    expect(next.selectedIndex).toBe(1);
  });

  it('clamps to 0 when inferences are empty', () => {
    const state = createFieldDropInferenceState();
    const next = selectInference(state, 5);
    expect(next.selectedIndex).toBe(0);
  });
});

// ========================================================================
// getSelectedInference
// ========================================================================

describe('getSelectedInference', () => {
  it('returns correct inference at selectedIndex', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    state = selectInference(state, 1);

    const selected = getSelectedInference(state);
    expect(selected).not.toBeNull();
    expect(selected!.widgetType).toBe('bar-chart');
  });

  it('returns first inference by default', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'revenue', dataType: 'number', semanticHint: 'currency' });

    const selected = getSelectedInference(state);
    expect(selected).not.toBeNull();
    expect(selected!.widgetType).toBe('kpi-card');
  });

  it('returns null when inferences are empty', () => {
    const state = createFieldDropInferenceState();
    const selected = getSelectedInference(state);
    expect(selected).toBeNull();
  });
});

// ========================================================================
// clearInference
// ========================================================================

describe('clearInference', () => {
  it('resets to empty state', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    state = selectInference(state, 1);

    const cleared = clearInference(state);
    expect(cleared.inferences).toEqual([]);
    expect(cleared.selectedIndex).toBe(0);
    expect(cleared.fields).toEqual([]);
  });
});

// ========================================================================
// Immutability
// ========================================================================

describe('immutability', () => {
  it('inferWidgetForField returns a new state object', () => {
    const state = createFieldDropInferenceState();
    const next = inferWidgetForField(state, { name: 'revenue', dataType: 'number' });

    expect(next).not.toBe(state);
    expect(state.inferences).toEqual([]);
    expect(state.fields).toEqual([]);
  });

  it('inferWidgetForFields returns a new state object', () => {
    const state = createFieldDropInferenceState();
    const next = inferWidgetForFields(state, [
      { name: 'date', dataType: 'date' },
      { name: 'value', dataType: 'number' },
    ]);

    expect(next).not.toBe(state);
    expect(state.inferences).toEqual([]);
    expect(state.fields).toEqual([]);
  });

  it('selectInference returns a new state object', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    const next = selectInference(state, 1);

    expect(next).not.toBe(state);
    expect(state.selectedIndex).toBe(0);
  });

  it('clearInference returns a new state object', () => {
    let state = createFieldDropInferenceState();
    state = inferWidgetForField(state, { name: 'quantity', dataType: 'number' });
    const cleared = clearInference(state);

    expect(cleared).not.toBe(state);
    expect(state.inferences).toHaveLength(2);
  });
});
