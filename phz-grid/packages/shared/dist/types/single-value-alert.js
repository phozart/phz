/**
 * @phozart/shared — SingleValueAlertConfig (7A-A)
 *
 * Types and pure functions for alert-aware single-value widgets
 * (KPI card, gauge, scorecard, trend-line). This module defines
 * how alert state is visualized on individual widget instances.
 */
// ========================================================================
// resolveAlertVisualState
// ========================================================================
/**
 * Resolve the current AlertVisualState from a widget's config and
 * a map of alert events (ruleId -> severity).
 *
 * If there is no binding or the bound rule has no event, returns 'healthy'.
 */
export function resolveAlertVisualState(config, alertEvents) {
    if (!config.alertRuleBinding) {
        return { severity: 'healthy' };
    }
    const severity = alertEvents.get(config.alertRuleBinding);
    if (severity === undefined) {
        return { severity: 'healthy' };
    }
    return {
        severity,
        ruleId: config.alertRuleBinding,
        lastTransition: Date.now(),
    };
}
/**
 * Map a severity + visual mode to the corresponding design token names.
 */
export function getAlertTokens(severity, mode) {
    if (mode === 'none') {
        return {};
    }
    const prefix = `widget.alert.${severity}`;
    switch (mode) {
        case 'indicator':
            return { indicator: `${prefix}.indicator` };
        case 'background':
            return {
                bg: `${prefix}.bg`,
                indicator: `${prefix}.indicator`,
            };
        case 'border':
            return {
                border: `${prefix}.border`,
                indicator: `${prefix}.indicator`,
            };
        default:
            return {};
    }
}
// ========================================================================
// degradeAlertMode
// ========================================================================
/**
 * Degrade alert rendering parameters based on container size.
 *
 * - full (>400px): all modes at full fidelity
 * - compact (200-400px): indicator -> dot only, border -> 3px
 * - minimal (<200px): indicator -> smaller dot, border -> 2px, background unchanged
 */
export function degradeAlertMode(mode, containerSize) {
    if (mode === 'none') {
        return {
            showIndicator: false,
            indicatorSize: 0,
            borderWidth: 0,
            showBackground: false,
        };
    }
    switch (containerSize) {
        case 'full':
            return {
                showIndicator: mode === 'indicator' || mode === 'background' || mode === 'border',
                indicatorSize: 10,
                borderWidth: mode === 'border' ? 4 : 0,
                showBackground: mode === 'background',
            };
        case 'compact':
            return {
                showIndicator: mode === 'indicator' || mode === 'background' || mode === 'border',
                indicatorSize: 8,
                borderWidth: mode === 'border' ? 3 : 0,
                showBackground: mode === 'background',
            };
        case 'minimal':
            return {
                showIndicator: mode === 'indicator' || mode === 'background' || mode === 'border',
                indicatorSize: 6,
                borderWidth: mode === 'border' ? 2 : 0,
                showBackground: mode === 'background',
            };
    }
}
// ========================================================================
// createDefaultAlertConfig
// ========================================================================
/**
 * Create a default SingleValueAlertConfig.
 * No binding, indicator mode, transitions enabled.
 */
export function createDefaultAlertConfig() {
    return {
        alertRuleBinding: undefined,
        alertVisualMode: 'indicator',
        alertAnimateTransition: true,
    };
}
//# sourceMappingURL=single-value-alert.js.map