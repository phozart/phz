/**
 * @phozart/phz-shared — SingleValueAlertConfig (7A-A)
 *
 * Types and pure functions for alert-aware single-value widgets
 * (KPI card, gauge, scorecard, trend-line). This module defines
 * how alert state is visualized on individual widget instances.
 */
/**
 * How the alert state is rendered on the widget.
 * - 'none': no visual alert indication
 * - 'indicator': small colored dot/icon
 * - 'background': tinted background
 * - 'border': colored border
 */
export type AlertVisualMode = 'none' | 'indicator' | 'background' | 'border';
/**
 * Widget-level severity. Note: this is distinct from the engine-level
 * AlertSeverity ('info' | 'warning' | 'critical') in personal-alert.ts.
 * Widget-level severity includes 'healthy' (no alert breached) and omits
 * 'info' since single-value widgets only care about actionable states.
 */
export type WidgetAlertSeverity = 'healthy' | 'warning' | 'critical';
/**
 * Configuration for alert visualization on a single-value widget.
 * Stored as part of the widget's config and persisted with the dashboard.
 */
export interface SingleValueAlertConfig {
    /** ID of the alert rule this widget is bound to. */
    alertRuleBinding?: string;
    /** How the alert state is rendered. */
    alertVisualMode: AlertVisualMode;
    /** Whether to animate transitions between severity states. */
    alertAnimateTransition: boolean;
}
/**
 * Resolved visual state for a widget based on current alert events.
 * This is a computed value, not persisted.
 */
export interface AlertVisualState {
    /** Current severity level. */
    severity: WidgetAlertSeverity;
    /** ID of the alert rule that determined this state. */
    ruleId?: string;
    /** Timestamp (epoch ms) of the last severity transition. */
    lastTransition?: number;
}
export type AlertContainerSize = 'full' | 'compact' | 'minimal';
export interface DegradedAlertParams {
    /** Whether to show the indicator dot. */
    showIndicator: boolean;
    /** Indicator size in pixels. */
    indicatorSize: number;
    /** Border width in pixels (only used when mode is 'border'). */
    borderWidth: number;
    /** Whether background tinting is active. */
    showBackground: boolean;
}
/**
 * Resolve the current AlertVisualState from a widget's config and
 * a map of alert events (ruleId -> severity).
 *
 * If there is no binding or the bound rule has no event, returns 'healthy'.
 */
export declare function resolveAlertVisualState(config: SingleValueAlertConfig, alertEvents: Map<string, WidgetAlertSeverity>): AlertVisualState;
/**
 * Token name record for a given severity and visual mode combination.
 * Returns the design token keys to use for background, indicator, and border.
 * When a token is not applicable for the mode, the value is undefined.
 */
export interface AlertTokenSet {
    bg?: string;
    indicator?: string;
    border?: string;
}
/**
 * Map a severity + visual mode to the corresponding design token names.
 */
export declare function getAlertTokens(severity: WidgetAlertSeverity, mode: AlertVisualMode): AlertTokenSet;
/**
 * Degrade alert rendering parameters based on container size.
 *
 * - full (>400px): all modes at full fidelity
 * - compact (200-400px): indicator -> dot only, border -> 3px
 * - minimal (<200px): indicator -> smaller dot, border -> 2px, background unchanged
 */
export declare function degradeAlertMode(mode: AlertVisualMode, containerSize: AlertContainerSize): DegradedAlertParams;
/**
 * Create a default SingleValueAlertConfig.
 * No binding, indicator mode, transitions enabled.
 */
export declare function createDefaultAlertConfig(): SingleValueAlertConfig;
//# sourceMappingURL=single-value-alert.d.ts.map