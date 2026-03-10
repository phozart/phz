/**
 * @phozart/phz-shared — SingleValueAlertConfig (7A-A)
 *
 * Types and pure functions for alert-aware single-value widgets
 * (KPI card, gauge, scorecard, trend-line). This module defines
 * how alert state is visualized on individual widget instances.
 */

// ========================================================================
// Alert Visual Mode & Widget-level Severity
// ========================================================================

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

// ========================================================================
// SingleValueAlertConfig
// ========================================================================

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

// ========================================================================
// AlertVisualState
// ========================================================================

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

// ========================================================================
// Container size for responsive degradation
// ========================================================================

export type AlertContainerSize = 'full' | 'compact' | 'minimal';

// ========================================================================
// Degraded rendering parameters
// ========================================================================

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

// ========================================================================
// resolveAlertVisualState
// ========================================================================

/**
 * Resolve the current AlertVisualState from a widget's config and
 * a map of alert events (ruleId -> severity).
 *
 * If there is no binding or the bound rule has no event, returns 'healthy'.
 */
export function resolveAlertVisualState(
  config: SingleValueAlertConfig,
  alertEvents: Map<string, WidgetAlertSeverity>,
): AlertVisualState {
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

// ========================================================================
// getAlertTokens
// ========================================================================

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
export function getAlertTokens(
  severity: WidgetAlertSeverity,
  mode: AlertVisualMode,
): AlertTokenSet {
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
export function degradeAlertMode(
  mode: AlertVisualMode,
  containerSize: AlertContainerSize,
): DegradedAlertParams {
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
export function createDefaultAlertConfig(): SingleValueAlertConfig {
  return {
    alertRuleBinding: undefined,
    alertVisualMode: 'indicator',
    alertAnimateTransition: true,
  };
}
