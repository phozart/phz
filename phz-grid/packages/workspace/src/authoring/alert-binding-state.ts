/**
 * @phozart/workspace — Alert Binding Config Panel State (7A-A)
 *
 * Pure state machine for the "Alert Binding" section in the widget config panel.
 * Manages the selection of alert rules, visual modes, and animation toggles
 * for single-value widgets (KPI card, gauge, scorecard, trend-line).
 */

import type {
  SingleValueAlertConfig,
  AlertVisualMode,
} from '@phozart/shared/types';

// ========================================================================
// Alert Rule Reference (minimal)
// ========================================================================

/**
 * Minimal reference to an alert rule available for binding.
 * The full AlertRule lives in the engine — this is the subset needed
 * by the config panel UI.
 */
export interface AlertRuleRef {
  id: string;
  name: string;
  /** ID of the metric this rule monitors. */
  metricId: string;
  /** Human-readable description. */
  description?: string;
}

// ========================================================================
// AlertBindingState
// ========================================================================

export interface AlertBindingState {
  /** All alert rules available for binding. */
  availableRules: AlertRuleRef[];
  /** Current widget alert configuration. */
  config: SingleValueAlertConfig;
  /** Auto-suggested rule IDs (filtered by metricId match). */
  suggestedRuleIds: string[];
}

// ========================================================================
// initialAlertBindingState
// ========================================================================

/**
 * Create the initial alert binding state from available rules and
 * an optional existing widget config.
 */
export function initialAlertBindingState(
  availableRules: AlertRuleRef[],
  currentConfig?: SingleValueAlertConfig,
): AlertBindingState {
  return {
    availableRules,
    config: currentConfig ?? {
      alertRuleBinding: undefined,
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    },
    suggestedRuleIds: [],
  };
}

// ========================================================================
// selectAlertRule
// ========================================================================

/**
 * Bind the widget to a specific alert rule.
 */
export function selectAlertRule(
  state: AlertBindingState,
  ruleId: string,
): AlertBindingState {
  // Only bind if the rule exists in the available set
  const exists = state.availableRules.some(r => r.id === ruleId);
  if (!exists) {
    return state;
  }

  return {
    ...state,
    config: {
      ...state.config,
      alertRuleBinding: ruleId,
    },
  };
}

// ========================================================================
// setVisualMode
// ========================================================================

/**
 * Update the alert visual mode.
 */
export function setVisualMode(
  state: AlertBindingState,
  mode: AlertVisualMode,
): AlertBindingState {
  return {
    ...state,
    config: {
      ...state.config,
      alertVisualMode: mode,
    },
  };
}

// ========================================================================
// toggleAnimateTransition
// ========================================================================

/**
 * Toggle the alertAnimateTransition flag.
 */
export function toggleAnimateTransition(
  state: AlertBindingState,
): AlertBindingState {
  return {
    ...state,
    config: {
      ...state.config,
      alertAnimateTransition: !state.config.alertAnimateTransition,
    },
  };
}

// ========================================================================
// getAutoSuggestedRules
// ========================================================================

/**
 * Filter the available rules to those whose metricId matches the widget's metric.
 * Returns a new state with suggestedRuleIds populated.
 */
export function getAutoSuggestedRules(
  state: AlertBindingState,
  widgetMetricId: string,
): AlertBindingState {
  const suggestedRuleIds = state.availableRules
    .filter(r => r.metricId === widgetMetricId)
    .map(r => r.id);

  return {
    ...state,
    suggestedRuleIds,
  };
}

// ========================================================================
// clearAlertBinding
// ========================================================================

/**
 * Remove the alert rule binding, keeping all other config intact.
 */
export function clearAlertBinding(
  state: AlertBindingState,
): AlertBindingState {
  return {
    ...state,
    config: {
      ...state.config,
      alertRuleBinding: undefined,
    },
    suggestedRuleIds: [],
  };
}
