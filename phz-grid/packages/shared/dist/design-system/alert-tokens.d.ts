/**
 * Alert Widget Design Tokens (7A-A)
 *
 * Color and animation tokens for alert-aware single-value widgets.
 * These tokens integrate with the three-layer CSS custom property system:
 * public API tokens (--phz-*) -> internal computed tokens (--_*) -> component styles.
 */
export declare const ALERT_WIDGET_TOKENS: {
    readonly 'widget.alert.healthy.bg': "transparent";
    readonly 'widget.alert.healthy.indicator': "#22c55e";
    readonly 'widget.alert.warning.bg': "rgba(245, 158, 11, 0.08)";
    readonly 'widget.alert.warning.indicator': "#f59e0b";
    readonly 'widget.alert.warning.border': "#f59e0b";
    readonly 'widget.alert.critical.bg': "rgba(239, 68, 68, 0.08)";
    readonly 'widget.alert.critical.indicator': "#ef4444";
    readonly 'widget.alert.critical.border': "#ef4444";
    readonly 'widget.alert.pulse.duration': "2s";
    readonly 'widget.alert.pulse.keyframes': "alertPulse";
};
export type AlertWidgetTokenKey = keyof typeof ALERT_WIDGET_TOKENS;
/**
 * Generate CSS custom property declarations for all alert widget tokens.
 *
 * @returns A string of `--phz-widget-alert-*: value;` declarations (no selector wrapper).
 */
export declare function generateAlertTokenCSS(): string;
/**
 * Resolve a single alert token key to its CSS custom property reference.
 *
 * @param key - One of the ALERT_WIDGET_TOKENS keys.
 * @returns The CSS `var(--phz-widget-alert-*)` reference string, or the raw value as fallback.
 */
export declare function resolveAlertTokenVar(key: AlertWidgetTokenKey): string;
//# sourceMappingURL=alert-tokens.d.ts.map