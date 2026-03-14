/**
 * Tests for Subscription Engine (C-2.05)
 */
import { describe, it, expect } from 'vitest';
import {
  createSubscriptionEngineState,
  addSubscription,
  updateSubscription,
  removeSubscription,
  getNextScheduledRun,
  isDueForExecution,
} from '../subscriptions/subscription-engine.js';
import type { Subscription, SubscriptionSchedule } from '@phozart/shared/types';

// --- Test helpers ---

function makeSub(overrides?: Partial<Subscription>): Subscription {
  const now = Date.now();
  return {
    id: `sub_${Math.random().toString(36).slice(2, 8)}`,
    artifactId: 'report_1',
    userId: 'user_1',
    frequency: 'daily',
    format: 'pdf',
    recipients: ['user@example.com'],
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('createSubscriptionEngineState', () => {
  it('creates default state', () => {
    const state = createSubscriptionEngineState();
    expect(state.subscriptions).toEqual([]);
    expect(state.activeSubscriptionId).toBeNull();
    expect(state.processing).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createSubscriptionEngineState({ processing: true });
    expect(state.processing).toBe(true);
  });
});

describe('addSubscription', () => {
  it('adds a subscription', () => {
    const state = createSubscriptionEngineState();
    const sub = makeSub({ id: 's1' });
    const next = addSubscription(state, sub);
    expect(next.subscriptions).toHaveLength(1);
    expect(next.subscriptions[0].id).toBe('s1');
  });

  it('replaces existing subscription with same ID', () => {
    const state = createSubscriptionEngineState();
    const s1a = makeSub({ id: 's1', format: 'pdf' });
    const s1b = makeSub({ id: 's1', format: 'csv' });
    const next = addSubscription(addSubscription(state, s1a), s1b);
    expect(next.subscriptions).toHaveLength(1);
    expect(next.subscriptions[0].format).toBe('csv');
  });
});

describe('updateSubscription', () => {
  it('updates an existing subscription', () => {
    let state = createSubscriptionEngineState();
    state = addSubscription(state, makeSub({ id: 's1', enabled: true }));
    state = updateSubscription(state, 's1', { enabled: false });
    expect(state.subscriptions[0].enabled).toBe(false);
  });

  it('sets updatedAt on update', () => {
    let state = createSubscriptionEngineState();
    const sub = makeSub({ id: 's1', updatedAt: 1000 });
    state = addSubscription(state, sub);
    state = updateSubscription(state, 's1', { format: 'csv' });
    expect(state.subscriptions[0].updatedAt).toBeGreaterThan(1000);
  });

  it('returns state unchanged for unknown ID', () => {
    const state = createSubscriptionEngineState();
    const next = updateSubscription(state, 'unknown', { enabled: false });
    expect(next).toBe(state);
  });
});

describe('removeSubscription', () => {
  it('removes a subscription', () => {
    let state = createSubscriptionEngineState();
    state = addSubscription(state, makeSub({ id: 's1' }));
    state = removeSubscription(state, 's1');
    expect(state.subscriptions).toHaveLength(0);
  });

  it('clears activeSubscriptionId when active is removed', () => {
    let state = createSubscriptionEngineState({ activeSubscriptionId: 's1' });
    state = addSubscription(state, makeSub({ id: 's1' }));
    state = removeSubscription(state, 's1');
    expect(state.activeSubscriptionId).toBeNull();
  });

  it('keeps activeSubscriptionId when non-active is removed', () => {
    let state = createSubscriptionEngineState({ activeSubscriptionId: 's1' });
    state = addSubscription(state, makeSub({ id: 's1' }));
    state = addSubscription(state, makeSub({ id: 's2' }));
    state = removeSubscription(state, 's2');
    expect(state.activeSubscriptionId).toBe('s1');
  });
});

describe('getNextScheduledRun', () => {
  it('computes next daily run', () => {
    const now = new Date('2026-03-08T10:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'daily',
      timeOfDay: '08:00',
    };
    const next = getNextScheduledRun(schedule, now);
    // 08:00 is before 10:00 on the same day, so next is tomorrow at 08:00
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(now.getDate() + 1);
  });

  it('returns same day for daily run when time is in the future', () => {
    const now = new Date('2026-03-08T06:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'daily',
      timeOfDay: '08:00',
    };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(now.getDate());
  });

  it('computes next weekly run', () => {
    // March 8, 2026 is a Sunday (day 0)
    const now = new Date('2026-03-08T10:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'weekly',
      dayOfWeek: 1, // Monday
      timeOfDay: '09:00',
    };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getDay()).toBe(1); // Monday
    expect(next.getHours()).toBe(9);
  });

  it('computes next monthly run', () => {
    const now = new Date('2026-03-20T10:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'monthly',
      dayOfMonth: 15,
      timeOfDay: '06:00',
    };
    const next = getNextScheduledRun(schedule, now);
    // day 15 is past, so next month
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it('returns same month for monthly if day is in the future', () => {
    const now = new Date('2026-03-10T10:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'monthly',
      dayOfMonth: 15,
      timeOfDay: '06:00',
    };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(15);
  });

  it('handles on-change frequency', () => {
    const now = new Date('2026-03-08T10:00:00Z');
    const schedule: SubscriptionSchedule = {
      frequency: 'on-change',
    };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it('defaults dayOfWeek to Monday for weekly', () => {
    const now = new Date('2026-03-08T10:00:00Z'); // Sunday
    const schedule: SubscriptionSchedule = { frequency: 'weekly', timeOfDay: '09:00' };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getDay()).toBe(1);
  });

  it('defaults dayOfMonth to 1 for monthly', () => {
    const now = new Date('2026-03-08T10:00:00Z');
    const schedule: SubscriptionSchedule = { frequency: 'monthly', timeOfDay: '09:00' };
    const next = getNextScheduledRun(schedule, now);
    expect(next.getDate()).toBe(1);
  });
});

describe('isDueForExecution', () => {
  it('returns true when nextScheduledAt is in the past', () => {
    const sub = makeSub({ nextScheduledAt: Date.now() - 60_000 });
    expect(isDueForExecution(sub)).toBe(true);
  });

  it('returns false when nextScheduledAt is in the future', () => {
    const sub = makeSub({ nextScheduledAt: Date.now() + 60_000 });
    expect(isDueForExecution(sub)).toBe(false);
  });

  it('returns false when disabled', () => {
    const sub = makeSub({ enabled: false, nextScheduledAt: Date.now() - 60_000 });
    expect(isDueForExecution(sub)).toBe(false);
  });

  it('returns true when never sent and no nextScheduledAt', () => {
    const sub = makeSub({ lastSentAt: undefined, nextScheduledAt: undefined });
    expect(isDueForExecution(sub)).toBe(true);
  });

  it('returns false for on-change frequency', () => {
    const sub = makeSub({ frequency: 'on-change', lastSentAt: undefined, nextScheduledAt: undefined });
    expect(isDueForExecution(sub)).toBe(false);
  });

  it('returns false when has lastSentAt but no nextScheduledAt', () => {
    const sub = makeSub({ lastSentAt: Date.now() - 60_000, nextScheduledAt: undefined });
    expect(isDueForExecution(sub)).toBe(false);
  });
});
