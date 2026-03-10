/**
 * @phozart/phz-shared — PersonalAlert (A-1.12 + A-1.13)
 *
 * User-facing alert configurations, notification preferences,
 * and grace period handling. PersonalAlert lets individual users
 * create their own threshold-based alerts on any metric.
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertNotificationChannel = 'email' | 'in-app' | 'webhook' | 'sms';
/**
 * Grace period configuration for alerts. Prevents alert fatigue by
 * requiring the threshold to be sustained for a minimum duration
 * before triggering.
 */
export interface AlertGracePeriodConfig {
    /** Whether the grace period is enabled. */
    enabled: boolean;
    /** Duration in milliseconds that the threshold must be sustained. */
    durationMs: number;
    /** Minimum number of consecutive evaluations that must breach. */
    minConsecutiveBreaches: number;
    /** Maximum grace period in ms (system-level cap). */
    maxDurationMs: number;
}
/**
 * A user-created alert that monitors a specific metric against
 * a threshold. Unlike admin AlertRules, PersonalAlerts are owned
 * by individual users and cannot affect other users.
 */
export interface PersonalAlert {
    id: string;
    userId: string;
    name: string;
    description?: string;
    /** ID of the alert rule this personal alert subscribes to. */
    alertRuleId: string;
    /** Optional artifact ID (dashboard, report) being monitored. */
    artifactId?: string;
    /** Optional widget ID within the artifact. */
    widgetId?: string;
    /** Notification channels to deliver the alert through. */
    channels: AlertNotificationChannel[];
    /** Optional severity filter (only receive alerts at these levels). */
    severityFilter?: AlertSeverity[];
    /** Grace period configuration (prevents alert fatigue). */
    gracePeriod?: AlertGracePeriodConfig;
    /** Whether this personal alert is active. */
    enabled: boolean;
    /** Mute all notifications until this timestamp (epoch ms). */
    muteUntil?: number;
    createdAt: number;
    updatedAt: number;
}
export interface PersonalAlertPreference {
    alertRuleId: string;
    userId: string;
    channels: AlertNotificationChannel[];
    muteUntil?: number;
    severityFilter?: AlertSeverity[];
}
export interface PersonalAlertSummary {
    total: number;
    byStatus: {
        active: number;
        acknowledged: number;
        resolved: number;
    };
    bySeverity: {
        info: number;
        warning: number;
        critical: number;
    };
}
export declare function createEmptyAlertSummary(): PersonalAlertSummary;
/**
 * Create a default AlertGracePeriodConfig with sensible values.
 * Grace period is disabled by default; when enabled, the default
 * duration is 5 minutes with 3 consecutive breaches required.
 */
export declare function createDefaultGracePeriodConfig(overrides?: Partial<AlertGracePeriodConfig>): AlertGracePeriodConfig;
/**
 * Validate that a grace period configuration is logically consistent.
 *
 * Returns true when:
 * - durationMs is between MIN_GRACE_PERIOD_MS and maxDurationMs
 * - minConsecutiveBreaches is at least 1
 * - maxDurationMs does not exceed the system cap
 */
export declare function isGracePeriodValid(config: AlertGracePeriodConfig): boolean;
/**
 * Clamp a grace period configuration to valid bounds.
 * Ensures durationMs is within [MIN_GRACE_PERIOD_MS, maxDurationMs]
 * and minConsecutiveBreaches is at least 1.
 */
export declare function clampGracePeriod(config: AlertGracePeriodConfig): AlertGracePeriodConfig;
//# sourceMappingURL=personal-alert.d.ts.map