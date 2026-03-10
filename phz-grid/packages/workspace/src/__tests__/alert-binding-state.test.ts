/**
 * Tests for alert binding config panel state machine.
 */
import { describe, it, expect } from 'vitest';
import {
  initialAlertBindingState,
  selectAlertRule,
  setVisualMode,
  toggleAnimateTransition,
  getAutoSuggestedRules,
  clearAlertBinding,
} from '../authoring/alert-binding-state.js';
import type { AlertRuleRef, AlertBindingState } from '../authoring/alert-binding-state.js';
import type { SingleValueAlertConfig } from '@phozart/phz-shared/types';

// ========================================================================
// Test fixtures
// ========================================================================

const SAMPLE_RULES: AlertRuleRef[] = [
  { id: 'rule-1', name: 'Revenue Warning', metricId: 'revenue' },
  { id: 'rule-2', name: 'Cost Critical', metricId: 'cost' },
  { id: 'rule-3', name: 'Revenue Critical', metricId: 'revenue', description: 'Revenue over threshold' },
  { id: 'rule-4', name: 'Margin Alert', metricId: 'margin' },
];

const EXISTING_CONFIG: SingleValueAlertConfig = {
  alertRuleBinding: 'rule-1',
  alertVisualMode: 'border',
  alertAnimateTransition: false,
};

// ========================================================================
// initialAlertBindingState
// ========================================================================

describe('initialAlertBindingState', () => {
  it('creates default state with no existing config', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    expect(state.availableRules).toBe(SAMPLE_RULES);
    expect(state.config.alertRuleBinding).toBeUndefined();
    expect(state.config.alertVisualMode).toBe('indicator');
    expect(state.config.alertAnimateTransition).toBe(true);
    expect(state.suggestedRuleIds).toEqual([]);
  });

  it('uses existing config when provided', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    expect(state.config.alertRuleBinding).toBe('rule-1');
    expect(state.config.alertVisualMode).toBe('border');
    expect(state.config.alertAnimateTransition).toBe(false);
  });

  it('creates state with empty rules array', () => {
    const state = initialAlertBindingState([]);
    expect(state.availableRules).toEqual([]);
    expect(state.config.alertRuleBinding).toBeUndefined();
  });
});

// ========================================================================
// selectAlertRule
// ========================================================================

describe('selectAlertRule', () => {
  it('binds to an existing rule', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = selectAlertRule(state, 'rule-2');
    expect(updated.config.alertRuleBinding).toBe('rule-2');
  });

  it('ignores binding to a non-existent rule', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = selectAlertRule(state, 'rule-999');
    expect(updated.config.alertRuleBinding).toBeUndefined();
    expect(updated).toBe(state); // same reference, no mutation
  });

  it('replaces existing binding', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    expect(state.config.alertRuleBinding).toBe('rule-1');
    const updated = selectAlertRule(state, 'rule-3');
    expect(updated.config.alertRuleBinding).toBe('rule-3');
  });

  it('preserves other config properties when binding', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = selectAlertRule(state, 'rule-2');
    expect(updated.config.alertVisualMode).toBe('border');
    expect(updated.config.alertAnimateTransition).toBe(false);
  });
});

// ========================================================================
// setVisualMode
// ========================================================================

describe('setVisualMode', () => {
  it('changes visual mode to background', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = setVisualMode(state, 'background');
    expect(updated.config.alertVisualMode).toBe('background');
  });

  it('changes visual mode to none', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = setVisualMode(state, 'none');
    expect(updated.config.alertVisualMode).toBe('none');
  });

  it('preserves binding when changing mode', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = setVisualMode(state, 'indicator');
    expect(updated.config.alertRuleBinding).toBe('rule-1');
  });
});

// ========================================================================
// toggleAnimateTransition
// ========================================================================

describe('toggleAnimateTransition', () => {
  it('toggles from true to false', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    expect(state.config.alertAnimateTransition).toBe(true);
    const updated = toggleAnimateTransition(state);
    expect(updated.config.alertAnimateTransition).toBe(false);
  });

  it('toggles from false to true', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    expect(state.config.alertAnimateTransition).toBe(false);
    const updated = toggleAnimateTransition(state);
    expect(updated.config.alertAnimateTransition).toBe(true);
  });

  it('preserves other config properties', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = toggleAnimateTransition(state);
    expect(updated.config.alertRuleBinding).toBe('rule-1');
    expect(updated.config.alertVisualMode).toBe('border');
  });
});

// ========================================================================
// getAutoSuggestedRules
// ========================================================================

describe('getAutoSuggestedRules', () => {
  it('returns rules matching the widget metric ID', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = getAutoSuggestedRules(state, 'revenue');
    expect(updated.suggestedRuleIds).toEqual(['rule-1', 'rule-3']);
  });

  it('returns empty array when no rules match', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = getAutoSuggestedRules(state, 'nonexistent-metric');
    expect(updated.suggestedRuleIds).toEqual([]);
  });

  it('returns single-item array when one rule matches', () => {
    const state = initialAlertBindingState(SAMPLE_RULES);
    const updated = getAutoSuggestedRules(state, 'cost');
    expect(updated.suggestedRuleIds).toEqual(['rule-2']);
  });

  it('preserves config when computing suggestions', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = getAutoSuggestedRules(state, 'revenue');
    expect(updated.config).toEqual(EXISTING_CONFIG);
  });
});

// ========================================================================
// clearAlertBinding
// ========================================================================

describe('clearAlertBinding', () => {
  it('removes the alert rule binding', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    expect(state.config.alertRuleBinding).toBe('rule-1');
    const updated = clearAlertBinding(state);
    expect(updated.config.alertRuleBinding).toBeUndefined();
  });

  it('clears suggested rule IDs', () => {
    let state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    state = getAutoSuggestedRules(state, 'revenue');
    expect(state.suggestedRuleIds.length).toBeGreaterThan(0);
    const updated = clearAlertBinding(state);
    expect(updated.suggestedRuleIds).toEqual([]);
  });

  it('preserves visual mode and animation settings', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = clearAlertBinding(state);
    expect(updated.config.alertVisualMode).toBe('border');
    expect(updated.config.alertAnimateTransition).toBe(false);
  });

  it('preserves available rules', () => {
    const state = initialAlertBindingState(SAMPLE_RULES, EXISTING_CONFIG);
    const updated = clearAlertBinding(state);
    expect(updated.availableRules).toBe(SAMPLE_RULES);
  });
});
