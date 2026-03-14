/**
 * @phozart/shared — PersonalAlert (A-1.12 + A-1.13)
 *
 * User-facing alert configurations, notification preferences,
 * and grace period handling. PersonalAlert lets individual users
 * create their own threshold-based alerts on any metric.
 */
export function createEmptyAlertSummary() {
    return {
        total: 0,
        byStatus: { active: 0, acknowledged: 0, resolved: 0 },
        bySeverity: { info: 0, warning: 0, critical: 0 },
    };
}
// ========================================================================
// Grace Period Defaults & Validation
// ========================================================================
/** System-wide maximum grace period: 24 hours. */
const SYSTEM_MAX_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
/** Minimum meaningful grace period: 1 second. */
const MIN_GRACE_PERIOD_MS = 1000;
/**
 * Create a default AlertGracePeriodConfig with sensible values.
 * Grace period is disabled by default; when enabled, the default
 * duration is 5 minutes with 3 consecutive breaches required.
 */
export function createDefaultGracePeriodConfig(overrides) {
    return {
        enabled: overrides?.enabled ?? false,
        durationMs: overrides?.durationMs ?? 5 * 60 * 1000, // 5 minutes
        minConsecutiveBreaches: overrides?.minConsecutiveBreaches ?? 3,
        maxDurationMs: overrides?.maxDurationMs ?? SYSTEM_MAX_GRACE_PERIOD_MS,
    };
}
/**
 * Validate that a grace period configuration is logically consistent.
 *
 * Returns true when:
 * - durationMs is between MIN_GRACE_PERIOD_MS and maxDurationMs
 * - minConsecutiveBreaches is at least 1
 * - maxDurationMs does not exceed the system cap
 */
export function isGracePeriodValid(config) {
    if (!config.enabled)
        return true;
    if (config.durationMs < MIN_GRACE_PERIOD_MS)
        return false;
    if (config.durationMs > config.maxDurationMs)
        return false;
    if (config.maxDurationMs > SYSTEM_MAX_GRACE_PERIOD_MS)
        return false;
    if (config.minConsecutiveBreaches < 1)
        return false;
    return true;
}
/**
 * Clamp a grace period configuration to valid bounds.
 * Ensures durationMs is within [MIN_GRACE_PERIOD_MS, maxDurationMs]
 * and minConsecutiveBreaches is at least 1.
 */
export function clampGracePeriod(config) {
    const maxDurationMs = Math.min(config.maxDurationMs, SYSTEM_MAX_GRACE_PERIOD_MS);
    const durationMs = Math.max(MIN_GRACE_PERIOD_MS, Math.min(config.durationMs, maxDurationMs));
    const minConsecutiveBreaches = Math.max(1, config.minConsecutiveBreaches);
    return {
        enabled: config.enabled,
        durationMs,
        minConsecutiveBreaches,
        maxDurationMs,
    };
}
//# sourceMappingURL=personal-alert.js.map