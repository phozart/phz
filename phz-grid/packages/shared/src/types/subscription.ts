/**
 * @phozart/shared — ReportSubscription / SubscriptionSchedule (A-1.15)
 *
 * Report/dashboard subscription for scheduled delivery.
 * Includes schedule description helpers and deep link generation.
 */

// ========================================================================
// SubscriptionFrequency & Format
// ========================================================================

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'on-change';
export type SubscriptionFormat = 'pdf' | 'csv' | 'excel' | 'inline';

// ========================================================================
// SubscriptionSchedule — detailed schedule specification
// ========================================================================

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

// ========================================================================
// ReportSubscription — full subscription record
// ========================================================================

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

// ========================================================================
// Legacy Subscription alias (backward compatible)
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createSubscription(input: {
  artifactId: string;
  userId: string;
  frequency: SubscriptionFrequency;
  format: SubscriptionFormat;
  recipients: string[];
  filterPresetId?: string;
}): Subscription {
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
export function describeSchedule(schedule: SubscriptionSchedule): string {
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
export function buildSubscriptionDeepLink(
  baseUrl: string,
  subscriptionId: string,
  artifactId?: string,
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({ id: subscriptionId });
  if (artifactId) {
    params.set('artifactId', artifactId);
  }
  return `${cleanBase}/subscriptions?${params.toString()}`;
}
