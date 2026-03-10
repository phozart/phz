/**
 * @phozart/phz-engine — Personal Alert Engine (C-2.03)
 *
 * Evaluates personal alert conditions against current data values.
 * Pure functions only — no side effects, no DOM.
 */

import type {
  PersonalAlert,
  PersonalAlertPreference,
  AlertSeverity,
  AlertGracePeriodConfig,
} from '@phozart/phz-shared/types';

// ========================================================================
// AlertEvaluationResult
// ========================================================================

export interface AlertEvaluationResult {
  alertId: string;
  triggered: boolean;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
  withinGracePeriod: boolean;
}

// ========================================================================
// Internal threshold extraction
// ========================================================================

/**
 * Extract a numeric threshold from a PersonalAlert.
 * Uses the alert name as a signal — in production this would be
 * driven by the AlertRule configuration. For the pure-function engine,
 * we accept threshold via the alert's metadata convention.
 *
 * Alerts encode thresholds in their name or description as a convention:
 * the alertRuleId is used as a lookup key into the values map.
 */

const DEFAULT_THRESHOLD = 100;

function extractThreshold(alert: PersonalAlert): number {
  // Check description for "threshold:N" pattern
  if (alert.description) {
    const match = alert.description.match(/threshold:\s*([\d.]+)/i);
    if (match) return parseFloat(match[1]);
  }
  return DEFAULT_THRESHOLD;
}

function extractSeverity(alert: PersonalAlert): AlertSeverity {
  // Check severity filter — use the highest severity from the filter
  if (alert.severityFilter && alert.severityFilter.length > 0) {
    const priority: AlertSeverity[] = ['critical', 'warning', 'info'];
    for (const s of priority) {
      if (alert.severityFilter.includes(s)) return s;
    }
  }
  return 'warning';
}

// ========================================================================
// Grace period check
// ========================================================================

function isWithinGracePeriod(
  gracePeriod: AlertGracePeriodConfig | undefined,
  lastTriggeredAt: number | undefined,
): boolean {
  if (!gracePeriod?.enabled) return false;
  if (lastTriggeredAt == null) return false;
  const elapsed = Date.now() - lastTriggeredAt;
  return elapsed < gracePeriod.durationMs;
}

// ========================================================================
// evaluateAlert
// ========================================================================

/**
 * Evaluate a single personal alert against the current metric value.
 * Returns an AlertEvaluationResult indicating whether the alert triggered.
 *
 * @param alert - The personal alert definition.
 * @param currentValue - The current numeric value of the metric.
 * @param lastTriggeredAt - Optional timestamp of the last trigger (for grace period).
 */
export function evaluateAlert(
  alert: PersonalAlert,
  currentValue: number,
  lastTriggeredAt?: number,
): AlertEvaluationResult {
  const threshold = extractThreshold(alert);
  const severity = extractSeverity(alert);
  const withinGrace = isWithinGracePeriod(alert.gracePeriod, lastTriggeredAt);
  const breached = currentValue >= threshold;
  const triggered = alert.enabled && breached && !withinGrace;

  return {
    alertId: alert.id,
    triggered,
    severity,
    currentValue,
    thresholdValue: threshold,
    message: triggered
      ? `Alert "${alert.name}": value ${currentValue} exceeds threshold ${threshold}`
      : `Alert "${alert.name}": value ${currentValue} is within threshold ${threshold}`,
    withinGracePeriod: withinGrace,
  };
}

// ========================================================================
// evaluateAllAlerts
// ========================================================================

/**
 * Evaluate all alerts against a map of current values.
 * The key in the values map is the alert's `alertRuleId`.
 *
 * @param alerts - Array of personal alerts to evaluate.
 * @param values - Map of alertRuleId to current numeric value.
 */
export function evaluateAllAlerts(
  alerts: PersonalAlert[],
  values: Record<string, number>,
): AlertEvaluationResult[] {
  return alerts.map(alert => {
    const currentValue = values[alert.alertRuleId] ?? 0;
    return evaluateAlert(alert, currentValue);
  });
}

// ========================================================================
// shouldNotify
// ========================================================================

/**
 * Determine whether a notification should be sent for an evaluation result,
 * based on the user's notification preferences.
 *
 * @param result - The alert evaluation result.
 * @param preference - The user's notification preference for this alert rule.
 */
export function shouldNotify(
  result: AlertEvaluationResult,
  preference: PersonalAlertPreference,
): boolean {
  if (!result.triggered) return false;

  // Check if the alert is muted
  if (preference.muteUntil != null && Date.now() < preference.muteUntil) {
    return false;
  }

  // Check severity filter
  if (preference.severityFilter && preference.severityFilter.length > 0) {
    if (!preference.severityFilter.includes(result.severity)) {
      return false;
    }
  }

  // Must have at least one notification channel
  return preference.channels.length > 0;
}

// ========================================================================
// formatAlertMessage
// ========================================================================

/**
 * Format an alert evaluation result into a human-readable message.
 */
export function formatAlertMessage(result: AlertEvaluationResult): string {
  if (!result.triggered) {
    return `[OK] Value ${result.currentValue} is within threshold ${result.thresholdValue}`;
  }

  const severityLabel = result.severity.toUpperCase();
  return `[${severityLabel}] Value ${result.currentValue} exceeds threshold ${result.thresholdValue}`;
}
