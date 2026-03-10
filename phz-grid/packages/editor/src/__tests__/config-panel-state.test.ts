/**
 * Tests for Config Panel State (B-2.08)
 */
import {
  createConfigPanelState,
  setConfigValue,
  removeConfigValue,
  setFullConfig,
  setAllowedFields,
  validateConfig,
  isConfigValid,
  setExpandedSection,
  setConfigPanelLoading,
  markConfigSaved,
} from '../authoring/config-panel-state.js';
import type { FieldConstraint } from '../authoring/config-panel-state.js';

const FIELDS: FieldConstraint[] = [
  { name: 'metric', label: 'Metric', required: true, allowedTypes: ['number'], measureOnly: true },
  { name: 'dimension', label: 'Dimension', required: false, allowedTypes: ['string'], measureOnly: false },
  { name: 'title', label: 'Title', required: true, allowedTypes: ['string'], measureOnly: false },
];

describe('createConfigPanelState', () => {
  it('creates with defaults', () => {
    const state = createConfigPanelState('bar-chart', 'w1');
    expect(state.widgetType).toBe('bar-chart');
    expect(state.widgetId).toBe('w1');
    expect(state.allowedFields).toEqual([]);
    expect(state.currentConfig).toEqual({});
    expect(state.validationErrors).toEqual([]);
    expect(state.dirty).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.expandedSection).toBeNull();
  });

  it('accepts overrides', () => {
    const state = createConfigPanelState('kpi-card', 'w2', {
      allowedFields: FIELDS,
      currentConfig: { title: 'Test' },
    });
    expect(state.allowedFields).toHaveLength(3);
    expect(state.currentConfig.title).toBe('Test');
  });
});

describe('setConfigValue', () => {
  it('sets a value and marks dirty', () => {
    let state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    state = setConfigValue(state, 'metric', 'revenue');
    expect(state.currentConfig.metric).toBe('revenue');
    expect(state.dirty).toBe(true);
  });

  it('re-validates after setting value', () => {
    let state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    // Before setting required fields, should have errors
    state = setConfigValue(state, 'dimension', 'region');
    expect(state.validationErrors.some(e => e.field === 'metric')).toBe(true);
    expect(state.validationErrors.some(e => e.field === 'title')).toBe(true);
  });

  it('clears validation error when required field is set', () => {
    let state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    state = setConfigValue(state, 'metric', 'revenue');
    state = setConfigValue(state, 'title', 'My Chart');
    expect(state.validationErrors).toEqual([]);
  });
});

describe('removeConfigValue', () => {
  it('removes a value and marks dirty', () => {
    let state = createConfigPanelState('bar-chart', 'w1', {
      allowedFields: FIELDS,
      currentConfig: { metric: 'revenue', title: 'Test' },
    });
    state = removeConfigValue(state, 'metric');
    expect(state.currentConfig.metric).toBeUndefined();
    expect(state.dirty).toBe(true);
  });
});

describe('setFullConfig', () => {
  it('replaces entire config and resets dirty', () => {
    let state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    state = setConfigValue(state, 'metric', 'x');
    expect(state.dirty).toBe(true);

    state = setFullConfig(state, { metric: 'revenue', title: 'Dashboard' });
    expect(state.currentConfig).toEqual({ metric: 'revenue', title: 'Dashboard' });
    expect(state.dirty).toBe(false);
  });
});

describe('setAllowedFields', () => {
  it('sets allowed fields and re-validates', () => {
    let state = createConfigPanelState('bar-chart', 'w1');
    state = setAllowedFields(state, FIELDS);
    expect(state.allowedFields).toHaveLength(3);
    // Required fields should cause errors since config is empty
    expect(state.validationErrors).toHaveLength(2); // metric and title are required
  });
});

describe('validateConfig', () => {
  it('returns errors for missing required fields', () => {
    const state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    const errors = validateConfig(state);
    expect(errors).toHaveLength(2);
    expect(errors[0].field).toBe('metric');
    expect(errors[0].severity).toBe('error');
    expect(errors[1].field).toBe('title');
  });

  it('returns no errors when all required fields are set', () => {
    const state = createConfigPanelState('bar-chart', 'w1', {
      allowedFields: FIELDS,
      currentConfig: { metric: 'revenue', title: 'Test' },
    });
    const errors = validateConfig(state);
    expect(errors).toEqual([]);
  });

  it('treats empty string as missing', () => {
    const state = createConfigPanelState('bar-chart', 'w1', {
      allowedFields: FIELDS,
      currentConfig: { metric: '', title: 'Test' },
    });
    const errors = validateConfig(state);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('metric');
  });
});

describe('isConfigValid', () => {
  it('returns true when no error-severity errors', () => {
    const state = createConfigPanelState('bar-chart', 'w1', {
      allowedFields: FIELDS,
      currentConfig: { metric: 'revenue', title: 'Test' },
    });
    expect(isConfigValid(state)).toBe(true);
  });

  it('returns false when required fields are missing', () => {
    const state = createConfigPanelState('bar-chart', 'w1', { allowedFields: FIELDS });
    expect(isConfigValid(state)).toBe(false);
  });
});

describe('UI state', () => {
  it('sets expanded section', () => {
    let state = createConfigPanelState('bar-chart', 'w1');
    state = setExpandedSection(state, 'data');
    expect(state.expandedSection).toBe('data');
    state = setExpandedSection(state, null);
    expect(state.expandedSection).toBeNull();
  });

  it('sets loading', () => {
    let state = createConfigPanelState('bar-chart', 'w1');
    state = setConfigPanelLoading(state, true);
    expect(state.loading).toBe(true);
  });

  it('marks saved', () => {
    let state = createConfigPanelState('bar-chart', 'w1');
    state = setConfigValue(state, 'x', 'y');
    expect(state.dirty).toBe(true);
    state = markConfigSaved(state);
    expect(state.dirty).toBe(false);
  });
});
