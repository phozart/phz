/**
 * Tests for cell display state machine (7A-B).
 *
 * All state transitions and available modes filtering by width.
 */
import { describe, it, expect } from 'vitest';
import {
  initialCellDisplayState,
  setRendererType,
  setWidgetType,
  setDisplayMode,
  setDataBinding,
  setThresholds,
  getAvailableModesForColumnWidth,
  toMicroWidgetCellConfig,
} from '../authoring/cell-display-state.js';
import type { CellDisplayState } from '../authoring/cell-display-state.js';

// ========================================================================
// initialCellDisplayState
// ========================================================================

describe('initialCellDisplayState', () => {
  it('creates state with default renderer type', () => {
    const state = initialCellDisplayState('revenue');
    expect(state.rendererType).toBe('default');
  });

  it('uses the column field as default valueField', () => {
    const state = initialCellDisplayState('revenue');
    expect(state.dataBinding.valueField).toBe('revenue');
  });

  it('provides default available widget types', () => {
    const state = initialCellDisplayState('x');
    expect(state.availableWidgetTypes).toEqual(['trend-line', 'gauge', 'kpi-card', 'scorecard']);
  });

  it('accepts custom available widget types', () => {
    const state = initialCellDisplayState('x', ['gauge', 'kpi-card']);
    expect(state.availableWidgetTypes).toEqual(['gauge', 'kpi-card']);
  });

  it('defaults display mode to value-only', () => {
    const state = initialCellDisplayState('x');
    expect(state.displayMode).toBe('value-only');
  });

  it('defaults thresholds to undefined', () => {
    const state = initialCellDisplayState('x');
    expect(state.thresholds).toBeUndefined();
  });
});

// ========================================================================
// State transitions
// ========================================================================

describe('setRendererType', () => {
  it('switches to micro-widget', () => {
    const state = initialCellDisplayState('x');
    const next = setRendererType(state, 'micro-widget');
    expect(next.rendererType).toBe('micro-widget');
  });

  it('switches back to default', () => {
    const state = setRendererType(initialCellDisplayState('x'), 'micro-widget');
    const next = setRendererType(state, 'default');
    expect(next.rendererType).toBe('default');
  });

  it('returns a new object (immutable)', () => {
    const state = initialCellDisplayState('x');
    const next = setRendererType(state, 'micro-widget');
    expect(next).not.toBe(state);
  });
});

describe('setWidgetType', () => {
  it('changes widget type', () => {
    const state = initialCellDisplayState('x');
    const next = setWidgetType(state, 'gauge');
    expect(next.widgetType).toBe('gauge');
  });
});

describe('setDisplayMode', () => {
  it('changes display mode', () => {
    const state = initialCellDisplayState('x');
    const next = setDisplayMode(state, 'sparkline');
    expect(next.displayMode).toBe('sparkline');
  });
});

describe('setDataBinding', () => {
  it('updates data binding', () => {
    const state = initialCellDisplayState('x');
    const next = setDataBinding(state, {
      valueField: 'revenue',
      compareField: 'previous_revenue',
      sparklineField: 'history',
    });
    expect(next.dataBinding.valueField).toBe('revenue');
    expect(next.dataBinding.compareField).toBe('previous_revenue');
    expect(next.dataBinding.sparklineField).toBe('history');
  });

  it('returns a new object with copied binding', () => {
    const binding = { valueField: 'v', compareField: 'c' };
    const state = initialCellDisplayState('x');
    const next = setDataBinding(state, binding);
    expect(next.dataBinding).not.toBe(binding);
    expect(next.dataBinding).toEqual(binding);
  });
});

describe('setThresholds', () => {
  it('sets threshold values', () => {
    const state = initialCellDisplayState('x');
    const next = setThresholds(state, { warning: 70, critical: 90 });
    expect(next.thresholds).toEqual({ warning: 70, critical: 90 });
  });

  it('clears thresholds when undefined is passed', () => {
    const state = setThresholds(initialCellDisplayState('x'), { warning: 50 });
    const next = setThresholds(state, undefined);
    expect(next.thresholds).toBeUndefined();
  });

  it('copies threshold object (immutable)', () => {
    const thresh = { warning: 70, critical: 90 };
    const state = initialCellDisplayState('x');
    const next = setThresholds(state, thresh);
    expect(next.thresholds).not.toBe(thresh);
    expect(next.thresholds).toEqual(thresh);
  });
});

// ========================================================================
// getAvailableModesForColumnWidth
// ========================================================================

describe('getAvailableModesForColumnWidth', () => {
  const state = initialCellDisplayState('x');

  it('returns empty array below 60px', () => {
    expect(getAvailableModesForColumnWidth(state, 59)).toEqual([]);
  });

  it('returns value-only and gauge-arc at 60px', () => {
    const modes = getAvailableModesForColumnWidth(state, 60);
    expect(modes).toContain('value-only');
    expect(modes).toContain('gauge-arc');
    expect(modes).not.toContain('sparkline');
    expect(modes).not.toContain('delta');
  });

  it('adds sparkline at 80px', () => {
    const modes = getAvailableModesForColumnWidth(state, 80);
    expect(modes).toContain('value-only');
    expect(modes).toContain('gauge-arc');
    expect(modes).toContain('sparkline');
    expect(modes).not.toContain('delta');
  });

  it('adds delta at 100px', () => {
    const modes = getAvailableModesForColumnWidth(state, 100);
    expect(modes).toContain('value-only');
    expect(modes).toContain('gauge-arc');
    expect(modes).toContain('sparkline');
    expect(modes).toContain('delta');
  });

  it('returns all four modes at 200px', () => {
    const modes = getAvailableModesForColumnWidth(state, 200);
    expect(modes).toHaveLength(4);
  });
});

// ========================================================================
// toMicroWidgetCellConfig
// ========================================================================

describe('toMicroWidgetCellConfig', () => {
  it('returns null when rendererType is default', () => {
    const state = initialCellDisplayState('x');
    expect(toMicroWidgetCellConfig(state)).toBeNull();
  });

  it('returns MicroWidgetCellConfig when rendererType is micro-widget', () => {
    let state = initialCellDisplayState('revenue');
    state = setRendererType(state, 'micro-widget');
    state = setWidgetType(state, 'gauge');
    state = setDisplayMode(state, 'gauge-arc');
    state = setThresholds(state, { warning: 70, critical: 90 });

    const config = toMicroWidgetCellConfig(state);
    expect(config).not.toBeNull();
    expect(config!.widgetType).toBe('gauge');
    expect(config!.displayMode).toBe('gauge-arc');
    expect(config!.dataBinding.valueField).toBe('revenue');
    expect(config!.thresholds).toEqual({ warning: 70, critical: 90 });
  });

  it('returns config without thresholds when not set', () => {
    let state = initialCellDisplayState('x');
    state = setRendererType(state, 'micro-widget');
    const config = toMicroWidgetCellConfig(state);
    expect(config!.thresholds).toBeUndefined();
  });
});
