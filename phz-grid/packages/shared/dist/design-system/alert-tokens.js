/**
 * Alert Widget Design Tokens (7A-A)
 *
 * Color and animation tokens for alert-aware single-value widgets.
 * These tokens integrate with the three-layer CSS custom property system:
 * public API tokens (--phz-*) -> internal computed tokens (--_*) -> component styles.
 */
// ========================================================================
// Alert Widget Token Values
// ========================================================================
export const ALERT_WIDGET_TOKENS = {
    'widget.alert.healthy.bg': 'transparent',
    'widget.alert.healthy.indicator': '#22c55e',
    'widget.alert.warning.bg': 'rgba(245, 158, 11, 0.08)',
    'widget.alert.warning.indicator': '#f59e0b',
    'widget.alert.warning.border': '#f59e0b',
    'widget.alert.critical.bg': 'rgba(239, 68, 68, 0.08)',
    'widget.alert.critical.indicator': '#ef4444',
    'widget.alert.critical.border': '#ef4444',
    'widget.alert.pulse.duration': '2s',
    'widget.alert.pulse.keyframes': 'alertPulse',
};
// ========================================================================
// Token-to-CSS-Variable Mapping
// ========================================================================
const ALERT_TOKEN_TO_CSS = {
    'widget.alert.healthy.bg': '--phz-widget-alert-healthy-bg',
    'widget.alert.healthy.indicator': '--phz-widget-alert-healthy-indicator',
    'widget.alert.warning.bg': '--phz-widget-alert-warning-bg',
    'widget.alert.warning.indicator': '--phz-widget-alert-warning-indicator',
    'widget.alert.warning.border': '--phz-widget-alert-warning-border',
    'widget.alert.critical.bg': '--phz-widget-alert-critical-bg',
    'widget.alert.critical.indicator': '--phz-widget-alert-critical-indicator',
    'widget.alert.critical.border': '--phz-widget-alert-critical-border',
    'widget.alert.pulse.duration': '--phz-widget-alert-pulse-duration',
    'widget.alert.pulse.keyframes': '--phz-widget-alert-pulse-keyframes',
};
/**
 * Generate CSS custom property declarations for all alert widget tokens.
 *
 * @returns A string of `--phz-widget-alert-*: value;` declarations (no selector wrapper).
 */
export function generateAlertTokenCSS() {
    const lines = [];
    for (const [key, cssVar] of Object.entries(ALERT_TOKEN_TO_CSS)) {
        const value = ALERT_WIDGET_TOKENS[key];
        lines.push(`  ${cssVar}: ${value};`);
    }
    return lines.join('\n');
}
/**
 * Resolve a single alert token key to its CSS custom property reference.
 *
 * @param key - One of the ALERT_WIDGET_TOKENS keys.
 * @returns The CSS `var(--phz-widget-alert-*)` reference string, or the raw value as fallback.
 */
export function resolveAlertTokenVar(key) {
    const cssVar = ALERT_TOKEN_TO_CSS[key];
    const fallback = ALERT_WIDGET_TOKENS[key];
    return `var(${cssVar}, ${fallback})`;
}
//# sourceMappingURL=alert-tokens.js.map