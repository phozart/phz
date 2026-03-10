/**
 * @phozart/phz-workspace — Alert Binding Config Panel State (7A-A)
 *
 * Pure state machine for the "Alert Binding" section in the widget config panel.
 * Manages the selection of alert rules, visual modes, and animation toggles
 * for single-value widgets (KPI card, gauge, scorecard, trend-line).
 */
// ========================================================================
// initialAlertBindingState
// ========================================================================
/**
 * Create the initial alert binding state from available rules and
 * an optional existing widget config.
 */
export function initialAlertBindingState(availableRules, currentConfig) {
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
export function selectAlertRule(state, ruleId) {
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
export function setVisualMode(state, mode) {
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
export function toggleAnimateTransition(state) {
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
export function getAutoSuggestedRules(state, widgetMetricId) {
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
export function clearAlertBinding(state) {
    return {
        ...state,
        config: {
            ...state.config,
            alertRuleBinding: undefined,
        },
        suggestedRuleIds: [],
    };
}
//# sourceMappingURL=alert-binding-state.js.map