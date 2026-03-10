/**
 * @phozart/phz-engine — Personal Alert Engine (C-2.03)
 *
 * Evaluates personal alert conditions against current data values.
 * Pure functions only — no side effects, no DOM.
 */
import type { PersonalAlert, PersonalAlertPreference, AlertSeverity } from '@phozart/phz-shared/types';
export interface AlertEvaluationResult {
    alertId: string;
    triggered: boolean;
    severity: AlertSeverity;
    currentValue: number;
    thresholdValue: number;
    message: string;
    withinGracePeriod: boolean;
}
/**
 * Evaluate a single personal alert against the current metric value.
 * Returns an AlertEvaluationResult indicating whether the alert triggered.
 *
 * @param alert - The personal alert definition.
 * @param currentValue - The current numeric value of the metric.
 * @param lastTriggeredAt - Optional timestamp of the last trigger (for grace period).
 */
export declare function evaluateAlert(alert: PersonalAlert, currentValue: number, lastTriggeredAt?: number): AlertEvaluationResult;
/**
 * Evaluate all alerts against a map of current values.
 * The key in the values map is the alert's `alertRuleId`.
 *
 * @param alerts - Array of personal alerts to evaluate.
 * @param values - Map of alertRuleId to current numeric value.
 */
export declare function evaluateAllAlerts(alerts: PersonalAlert[], values: Record<string, number>): AlertEvaluationResult[];
/**
 * Determine whether a notification should be sent for an evaluation result,
 * based on the user's notification preferences.
 *
 * @param result - The alert evaluation result.
 * @param preference - The user's notification preference for this alert rule.
 */
export declare function shouldNotify(result: AlertEvaluationResult, preference: PersonalAlertPreference): boolean;
/**
 * Format an alert evaluation result into a human-readable message.
 */
export declare function formatAlertMessage(result: AlertEvaluationResult): string;
//# sourceMappingURL=personal-alert-engine.d.ts.map