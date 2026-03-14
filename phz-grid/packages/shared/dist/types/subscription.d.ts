/**
 * @phozart/shared — ReportSubscription / SubscriptionSchedule (A-1.15)
 *
 * Report/dashboard subscription for scheduled delivery.
 * Includes schedule description helpers and deep link generation.
 */
export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'on-change';
export type SubscriptionFormat = 'pdf' | 'csv' | 'excel' | 'inline';
/**
 * Detailed schedule configuration for subscriptions. For daily
 * subscriptions, only timeOfDay is relevant. For weekly, dayOfWeek
 * specifies which day. For monthly, dayOfMonth specifies the date.
 */
export interface SubscriptionSchedule {
    /** Delivery frequency. */
    frequency: SubscriptionFrequency;
    /** Time of day for delivery in HH:MM format (24h). */
    timeOfDay?: string;
    /** Day of week for weekly subscriptions (0=Sunday, 6=Saturday). */
    dayOfWeek?: number;
    /** Day of month for monthly subscriptions (1-31). */
    dayOfMonth?: number;
    /** Timezone for schedule evaluation (IANA tz, e.g. 'America/New_York'). */
    timezone?: string;
}
export interface ReportSubscription {
    id: string;
    artifactId: string;
    userId: string;
    /** Detailed schedule (preferred over legacy frequency). */
    schedule: SubscriptionSchedule;
    /** Delivery format. */
    format: SubscriptionFormat;
    /** Email addresses or user IDs of recipients. */
    recipients: string[];
    /** Whether this subscription is currently active. */
    enabled: boolean;
    /** Timestamp of the last successful delivery. */
    lastSentAt?: number;
    /** Computed timestamp of the next scheduled delivery. */
    nextScheduledAt?: number;
    /** Optional filter preset to apply when generating the report. */
    filterPresetId?: string;
    /** Optional subject line for email delivery. */
    subject?: string;
    /** Optional message body for email delivery. */
    message?: string;
    createdAt: number;
    updatedAt: number;
}
export interface Subscription {
    id: string;
    artifactId: string;
    userId: string;
    frequency: SubscriptionFrequency;
    format: SubscriptionFormat;
    recipients: string[];
    enabled: boolean;
    lastSentAt?: number;
    nextScheduledAt?: number;
    filterPresetId?: string;
    createdAt: number;
    updatedAt: number;
}
export declare function createSubscription(input: {
    artifactId: string;
    userId: string;
    frequency: SubscriptionFrequency;
    format: SubscriptionFormat;
    recipients: string[];
    filterPresetId?: string;
}): Subscription;
/**
 * Generate a human-readable description of a subscription schedule.
 *
 * Examples:
 * - "Daily at 08:00"
 * - "Weekly on Monday at 09:30"
 * - "Monthly on day 15 at 06:00"
 * - "On every data change"
 */
export declare function describeSchedule(schedule: SubscriptionSchedule): string;
/**
 * Build a deep link URL for viewing or managing a subscription.
 * The base URL should be the application root (e.g. 'https://app.example.com').
 *
 * @param baseUrl - Application base URL (no trailing slash).
 * @param subscriptionId - The subscription ID.
 * @param artifactId - Optional artifact ID for context.
 * @returns A URL string pointing to the subscription management view.
 */
export declare function buildSubscriptionDeepLink(baseUrl: string, subscriptionId: string, artifactId?: string): string;
//# sourceMappingURL=subscription.d.ts.map