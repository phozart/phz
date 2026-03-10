/**
 * @phozart/phz-workspace — Alert Binding Config Panel State (7A-A)
 *
 * Pure state machine for the "Alert Binding" section in the widget config panel.
 * Manages the selection of alert rules, visual modes, and animation toggles
 * for single-value widgets (KPI card, gauge, scorecard, trend-line).
 */
import type { SingleValueAlertConfig, AlertVisualMode } from '@phozart/phz-shared/types';
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
export interface AlertBindingState {
    /** All alert rules available for binding. */
    availableRules: AlertRuleRef[];
    /** Current widget alert configuration. */
    config: SingleValueAlertConfig;
    /** Auto-suggested rule IDs (filtered by metricId match). */
    suggestedRuleIds: string[];
}
/**
 * Create the initial alert binding state from available rules and
 * an optional existing widget config.
 */
export declare function initialAlertBindingState(availableRules: AlertRuleRef[], currentConfig?: SingleValueAlertConfig): AlertBindingState;
/**
 * Bind the widget to a specific alert rule.
 */
export declare function selectAlertRule(state: AlertBindingState, ruleId: string): AlertBindingState;
/**
 * Update the alert visual mode.
 */
export declare function setVisualMode(state: AlertBindingState, mode: AlertVisualMode): AlertBindingState;
/**
 * Toggle the alertAnimateTransition flag.
 */
export declare function toggleAnimateTransition(state: AlertBindingState): AlertBindingState;
/**
 * Filter the available rules to those whose metricId matches the widget's metric.
 * Returns a new state with suggestedRuleIds populated.
 */
export declare function getAutoSuggestedRules(state: AlertBindingState, widgetMetricId: string): AlertBindingState;
/**
 * Remove the alert rule binding, keeping all other config intact.
 */
export declare function clearAlertBinding(state: AlertBindingState): AlertBindingState;
//# sourceMappingURL=alert-binding-state.d.ts.map