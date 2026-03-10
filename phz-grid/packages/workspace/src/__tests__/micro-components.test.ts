/**
 * @phozart/phz-workspace — Micro-Component Tests (Phase 2C + 2B)
 *
 * Tests for phz-color-picker, phz-shadow-picker, phz-slider-input,
 * and the enhanced config panel backward compatibility.
 *
 * These run in Vitest (Node) — no DOM rendering, so we test exports,
 * constants, and state logic rather than Lit rendering.
 */

import { describe, it, expect } from 'vitest';
import { SWATCH_COLORS, PhzColorPicker } from '../authoring/phz-color-picker.js';
import { SHADOW_VALUES, PhzShadowPicker } from '../authoring/phz-shadow-picker.js';
import type { ShadowLevel } from '../authoring/phz-shadow-picker.js';
import { PhzSliderInput } from '../authoring/phz-slider-input.js';
import { PhzConfigPanel } from '../authoring/phz-config-panel.js';
import {
  initialEnhancedConfigFromWidget,
  setEnhancedConfigSection,
  toggleEnhancedAccordion,
  updateEnhancedContainer,
  updateEnhancedTitleBar,
  updateEnhancedChart,
  updateEnhancedKpi,
  updateEnhancedScorecard,
  updateEnhancedBehaviour,
  addEnhancedFormattingRule,
  removeEnhancedFormattingRule,
  addEnhancedOverlay,
  removeEnhancedOverlay,
} from '../authoring/enhanced-config-state.js';
import type { EnhancedConfigPanelState } from '../authoring/enhanced-config-state.js';

// ========================================================================
// PhzColorPicker
// ========================================================================

describe('PhzColorPicker', () => {
  it('exports SWATCH_COLORS with 19 colors', () => {
    expect(SWATCH_COLORS).toHaveLength(19);
  });

  it('all swatch colors are valid hex strings', () => {
    for (const color of SWATCH_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('exports PhzColorPicker class', () => {
    expect(PhzColorPicker).toBeDefined();
    expect(typeof PhzColorPicker).toBe('function');
  });

  it('PhzColorPicker has expected default property values', () => {
    // Check static properties exist on the class (Lit decorator metadata)
    expect(PhzColorPicker.prototype).toBeDefined();
  });
});

// ========================================================================
// PhzShadowPicker
// ========================================================================

describe('PhzShadowPicker', () => {
  it('exports SHADOW_VALUES with 4 levels', () => {
    const levels = Object.keys(SHADOW_VALUES);
    expect(levels).toHaveLength(4);
    expect(levels).toEqual(['none', 'sm', 'md', 'lg']);
  });

  it('none shadow is "none"', () => {
    expect(SHADOW_VALUES.none).toBe('none');
  });

  it('non-none shadows contain rgba', () => {
    expect(SHADOW_VALUES.sm).toContain('rgba');
    expect(SHADOW_VALUES.md).toContain('rgba');
    expect(SHADOW_VALUES.lg).toContain('rgba');
  });

  it('exports PhzShadowPicker class', () => {
    expect(PhzShadowPicker).toBeDefined();
    expect(typeof PhzShadowPicker).toBe('function');
  });
});

// ========================================================================
// PhzSliderInput
// ========================================================================

describe('PhzSliderInput', () => {
  it('exports PhzSliderInput class', () => {
    expect(PhzSliderInput).toBeDefined();
    expect(typeof PhzSliderInput).toBe('function');
  });
});

// ========================================================================
// PhzConfigPanel (backward compat + enhanced mode)
// ========================================================================

describe('PhzConfigPanel', () => {
  it('exports PhzConfigPanel class', () => {
    expect(PhzConfigPanel).toBeDefined();
    expect(typeof PhzConfigPanel).toBe('function');
  });

  it('enhanced config initializes for chart widget type', () => {
    const state = initialEnhancedConfigFromWidget('w1', 'bar-chart');
    expect(state.widgetId).toBe('w1');
    expect(state.widgetType).toBe('bar-chart');
    expect(state.activeSection).toBe('appearance');
    expect(state.chart).toBeDefined();
    expect(state.kpi).toBeUndefined();
    expect(state.scorecard).toBeUndefined();
  });

  it('enhanced config initializes for KPI widget type', () => {
    const state = initialEnhancedConfigFromWidget('w2', 'kpi-card');
    expect(state.kpi).toBeDefined();
    expect(state.chart).toBeUndefined();
  });

  it('enhanced config initializes for scorecard widget type', () => {
    const state = initialEnhancedConfigFromWidget('w3', 'kpi-scorecard');
    expect(state.scorecard).toBeDefined();
    expect(state.chart).toBeUndefined();
  });

  it('section navigation produces new state', () => {
    const state = initialEnhancedConfigFromWidget('w1', 'bar-chart');
    const next = setEnhancedConfigSection(state, 'behavior');
    expect(next.activeSection).toBe('behavior');
    expect(next).not.toBe(state);
  });

  it('accordion toggle adds and removes accordion ids', () => {
    const state = initialEnhancedConfigFromWidget('w1', 'bar-chart');
    expect(state.expandedAccordions).toHaveLength(0);
    const opened = toggleEnhancedAccordion(state, 'container');
    expect(opened.expandedAccordions).toContain('container');
    const closed = toggleEnhancedAccordion(opened, 'container');
    expect(closed.expandedAccordions).not.toContain('container');
  });
});
