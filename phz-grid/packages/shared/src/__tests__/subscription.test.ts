/**
 * Tests for Subscription types and helpers.
 */
import {
  createSubscription,
  describeSchedule,
  buildSubscriptionDeepLink,
} from '@phozart/phz-shared/types';
import type { SubscriptionSchedule } from '@phozart/phz-shared/types';

// ========================================================================
// createSubscription
// ========================================================================

describe('createSubscription', () => {
  it('creates a subscription with correct fields', () => {
    const result = createSubscription({
      artifactId: 'dash-1',
      userId: 'u1',
      frequency: 'daily',
      format: 'pdf',
      recipients: ['a@b.com', 'c@d.com'],
    });

    expect(result.id).toMatch(/^sub_/);
    expect(result.artifactId).toBe('dash-1');
    expect(result.userId).toBe('u1');
    expect(result.frequency).toBe('daily');
    expect(result.format).toBe('pdf');
    expect(result.recipients).toEqual(['a@b.com', 'c@d.com']);
    expect(result.enabled).toBe(true);
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
    expect(result.createdAt).toBe(result.updatedAt);
  });

  it('includes filterPresetId when provided', () => {
    const result = createSubscription({
      artifactId: 'dash-1',
      userId: 'u1',
      frequency: 'weekly',
      format: 'csv',
      recipients: ['x@y.com'],
      filterPresetId: 'fp-42',
    });
    expect(result.filterPresetId).toBe('fp-42');
  });

  it('generates unique IDs', () => {
    const s1 = createSubscription({
      artifactId: 'd1', userId: 'u1', frequency: 'daily', format: 'pdf', recipients: [],
    });
    const s2 = createSubscription({
      artifactId: 'd2', userId: 'u2', frequency: 'daily', format: 'pdf', recipients: [],
    });
    expect(s1.id).not.toBe(s2.id);
  });

  it('copies the recipients array (no shared reference)', () => {
    const recipients = ['a@b.com'];
    const result = createSubscription({
      artifactId: 'd1', userId: 'u1', frequency: 'daily', format: 'pdf', recipients,
    });
    recipients.push('extra@b.com');
    expect(result.recipients).toEqual(['a@b.com']);
  });
});

// ========================================================================
// describeSchedule
// ========================================================================

describe('describeSchedule', () => {
  it('describes a daily schedule', () => {
    const schedule: SubscriptionSchedule = { frequency: 'daily', timeOfDay: '08:00' };
    expect(describeSchedule(schedule)).toBe('Daily at 08:00');
  });

  it('describes a daily schedule with timezone', () => {
    const schedule: SubscriptionSchedule = { frequency: 'daily', timeOfDay: '08:00', timezone: 'America/New_York' };
    expect(describeSchedule(schedule)).toBe('Daily at 08:00 (America/New_York)');
  });

  it('defaults time to 00:00 when not specified', () => {
    const schedule: SubscriptionSchedule = { frequency: 'daily' };
    expect(describeSchedule(schedule)).toBe('Daily at 00:00');
  });

  it('describes a weekly schedule with day of week', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', dayOfWeek: 3, timeOfDay: '09:30' };
    expect(describeSchedule(schedule)).toBe('Weekly on Wednesday at 09:30');
  });

  it('defaults to Monday for weekly with invalid dayOfWeek', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', dayOfWeek: 10, timeOfDay: '09:30' };
    expect(describeSchedule(schedule)).toBe('Weekly on Monday at 09:30');
  });

  it('defaults to Monday for weekly with negative dayOfWeek', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', dayOfWeek: -1, timeOfDay: '09:30' };
    expect(describeSchedule(schedule)).toBe('Weekly on Monday at 09:30');
  });

  it('defaults to Monday for weekly with no dayOfWeek', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', timeOfDay: '09:30' };
    expect(describeSchedule(schedule)).toBe('Weekly on Monday at 09:30');
  });

  it('describes Sunday (dayOfWeek=0)', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', dayOfWeek: 0, timeOfDay: '10:00' };
    expect(describeSchedule(schedule)).toBe('Weekly on Sunday at 10:00');
  });

  it('describes Saturday (dayOfWeek=6)', () => {
    const schedule: SubscriptionSchedule = { frequency: 'weekly', dayOfWeek: 6, timeOfDay: '10:00' };
    expect(describeSchedule(schedule)).toBe('Weekly on Saturday at 10:00');
  });

  it('describes a monthly schedule with day of month', () => {
    const schedule: SubscriptionSchedule = { frequency: 'monthly', dayOfMonth: 15, timeOfDay: '06:00' };
    expect(describeSchedule(schedule)).toBe('Monthly on day 15 at 06:00');
  });

  it('defaults to day 1 for monthly with invalid dayOfMonth', () => {
    const schedule: SubscriptionSchedule = { frequency: 'monthly', dayOfMonth: 0, timeOfDay: '06:00' };
    expect(describeSchedule(schedule)).toBe('Monthly on day 1 at 06:00');
  });

  it('defaults to day 1 for monthly with dayOfMonth > 31', () => {
    const schedule: SubscriptionSchedule = { frequency: 'monthly', dayOfMonth: 32, timeOfDay: '06:00' };
    expect(describeSchedule(schedule)).toBe('Monthly on day 1 at 06:00');
  });

  it('defaults to day 1 for monthly with no dayOfMonth', () => {
    const schedule: SubscriptionSchedule = { frequency: 'monthly', timeOfDay: '06:00' };
    expect(describeSchedule(schedule)).toBe('Monthly on day 1 at 06:00');
  });

  it('describes on-change schedule', () => {
    const schedule: SubscriptionSchedule = { frequency: 'on-change' };
    expect(describeSchedule(schedule)).toBe('On every data change');
  });
});

// ========================================================================
// buildSubscriptionDeepLink
// ========================================================================

describe('buildSubscriptionDeepLink', () => {
  it('builds a deep link with subscription ID', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_123');
    expect(url).toBe('https://app.example.com/subscriptions?id=sub_123');
  });

  it('includes artifactId when provided', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_123', 'dash-1');
    expect(url).toBe('https://app.example.com/subscriptions?id=sub_123&artifactId=dash-1');
  });

  it('strips trailing slashes from base URL', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com///', 'sub_1');
    expect(url).toBe('https://app.example.com/subscriptions?id=sub_1');
  });

  it('handles base URL with path', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com/workspace', 'sub_1');
    expect(url).toBe('https://app.example.com/workspace/subscriptions?id=sub_1');
  });

  it('omits artifactId when not provided', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_1');
    expect(url).not.toContain('artifactId');
  });
});
