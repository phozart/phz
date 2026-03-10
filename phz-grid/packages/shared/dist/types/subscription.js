/**
 * @phozart/phz-shared — ReportSubscription / SubscriptionSchedule (A-1.15)
 *
 * Report/dashboard subscription for scheduled delivery.
 * Includes schedule description helpers and deep link generation.
 */
// ========================================================================
// Factory
// ========================================================================
export function createSubscription(input) {
    const now = Date.now();
    return {
        id: `sub_${now}_${Math.random().toString(36).slice(2, 8)}`,
        artifactId: input.artifactId,
        userId: input.userId,
        frequency: input.frequency,
        format: input.format,
        recipients: [...input.recipients],
        enabled: true,
        filterPresetId: input.filterPresetId,
        createdAt: now,
        updatedAt: now,
    };
}
// ========================================================================
// describeSchedule — human-readable schedule description
// ========================================================================
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/**
 * Generate a human-readable description of a subscription schedule.
 *
 * Examples:
 * - "Daily at 08:00"
 * - "Weekly on Monday at 09:30"
 * - "Monthly on day 15 at 06:00"
 * - "On every data change"
 */
export function describeSchedule(schedule) {
    const time = schedule.timeOfDay ?? '00:00';
    const tz = schedule.timezone ? ` (${schedule.timezone})` : '';
    switch (schedule.frequency) {
        case 'daily':
            return `Daily at ${time}${tz}`;
        case 'weekly': {
            const day = schedule.dayOfWeek != null && schedule.dayOfWeek >= 0 && schedule.dayOfWeek <= 6
                ? DAY_NAMES[schedule.dayOfWeek]
                : 'Monday';
            return `Weekly on ${day} at ${time}${tz}`;
        }
        case 'monthly': {
            const dom = schedule.dayOfMonth != null && schedule.dayOfMonth >= 1 && schedule.dayOfMonth <= 31
                ? schedule.dayOfMonth
                : 1;
            return `Monthly on day ${dom} at ${time}${tz}`;
        }
        case 'on-change':
            return 'On every data change';
        default:
            return `${schedule.frequency}`;
    }
}
// ========================================================================
// buildSubscriptionDeepLink — construct a URL for viewing a subscription
// ========================================================================
/**
 * Build a deep link URL for viewing or managing a subscription.
 * The base URL should be the application root (e.g. 'https://app.example.com').
 *
 * @param baseUrl - Application base URL (no trailing slash).
 * @param subscriptionId - The subscription ID.
 * @param artifactId - Optional artifact ID for context.
 * @returns A URL string pointing to the subscription management view.
 */
export function buildSubscriptionDeepLink(baseUrl, subscriptionId, artifactId) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const params = new URLSearchParams({ id: subscriptionId });
    if (artifactId) {
        params.set('artifactId', artifactId);
    }
    return `${cleanBase}/subscriptions?${params.toString()}`;
}
//# sourceMappingURL=subscription.js.map