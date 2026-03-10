/**
 * @phozart/phz-engine — Subscription Engine (C-2.05)
 *
 * State management for report/dashboard subscriptions.
 * Includes schedule computation and execution readiness checks.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type {
  Subscription,
  SubscriptionSchedule,
  SubscriptionFrequency,
} from '@phozart/phz-shared/types';

// Note: Subscription and SubscriptionSchedule are defined in @phozart/phz-shared/types.
// They are not re-exported here to avoid duplicate export collisions.

// ========================================================================
// SubscriptionEngineState
// ========================================================================

export interface SubscriptionEngineState {
  subscriptions: Subscription[];
  activeSubscriptionId: string | null;
  processing: boolean;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a fresh SubscriptionEngineState.
 */
export function createSubscriptionEngineState(
  overrides?: Partial<SubscriptionEngineState>,
): SubscriptionEngineState {
  return {
    subscriptions: [],
    activeSubscriptionId: null,
    processing: false,
    ...overrides,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Add a subscription. If one with the same ID exists, it is replaced.
 */
export function addSubscription(
  state: SubscriptionEngineState,
  sub: Subscription,
): SubscriptionEngineState {
  const filtered = state.subscriptions.filter(s => s.id !== sub.id);
  return {
    ...state,
    subscriptions: [...filtered, sub],
  };
}

/**
 * Update an existing subscription with partial data.
 * Returns the state unchanged if the subscription is not found.
 */
export function updateSubscription(
  state: SubscriptionEngineState,
  id: string,
  updates: Partial<Subscription>,
): SubscriptionEngineState {
  let found = false;
  const subscriptions = state.subscriptions.map(s => {
    if (s.id !== id) return s;
    found = true;
    return { ...s, ...updates, updatedAt: Date.now() };
  });
  if (!found) return state;
  return { ...state, subscriptions };
}

/**
 * Remove a subscription by ID.
 */
export function removeSubscription(
  state: SubscriptionEngineState,
  id: string,
): SubscriptionEngineState {
  const subscriptions = state.subscriptions.filter(s => s.id !== id);
  const activeSubscriptionId =
    state.activeSubscriptionId === id ? null : state.activeSubscriptionId;
  return { ...state, subscriptions, activeSubscriptionId };
}

// ========================================================================
// Schedule computation
// ========================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse a "HH:MM" time string into hours and minutes.
 */
function parseTime(timeOfDay?: string): { hours: number; minutes: number } {
  if (!timeOfDay) return { hours: 0, minutes: 0 };
  const parts = timeOfDay.split(':');
  return {
    hours: parseInt(parts[0], 10) || 0,
    minutes: parseInt(parts[1], 10) || 0,
  };
}

/**
 * Compute the next scheduled run date for a subscription schedule.
 * Uses the current date/time as the reference point.
 *
 * @param schedule - The subscription schedule.
 * @param now - Optional reference date (defaults to new Date()).
 */
export function getNextScheduledRun(
  schedule: SubscriptionSchedule,
  now?: Date,
): Date {
  const ref = now ?? new Date();
  const { hours, minutes } = parseTime(schedule.timeOfDay);

  switch (schedule.frequency) {
    case 'daily': {
      const next = new Date(ref);
      next.setHours(hours, minutes, 0, 0);
      if (next <= ref) {
        next.setTime(next.getTime() + DAY_MS);
      }
      return next;
    }

    case 'weekly': {
      const targetDay = schedule.dayOfWeek ?? 1; // default Monday
      const next = new Date(ref);
      next.setHours(hours, minutes, 0, 0);
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && next <= ref)) {
        daysUntil += 7;
      }
      next.setTime(next.getTime() + daysUntil * DAY_MS);
      return next;
    }

    case 'monthly': {
      const targetDate = schedule.dayOfMonth ?? 1;
      const next = new Date(ref);
      next.setDate(targetDate);
      next.setHours(hours, minutes, 0, 0);
      if (next <= ref) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDate);
        next.setHours(hours, minutes, 0, 0);
      }
      return next;
    }

    case 'on-change': {
      // For on-change, return next minute as a placeholder
      const next = new Date(ref);
      next.setMinutes(next.getMinutes() + 1, 0, 0);
      return next;
    }

    default:
      return new Date(ref.getTime() + DAY_MS);
  }
}

/**
 * Check if a subscription is due for execution at the given time.
 *
 * @param sub - The subscription to check.
 * @param now - Optional reference date (defaults to new Date()).
 */
export function isDueForExecution(sub: Subscription, now?: Date): boolean {
  if (!sub.enabled) return false;

  const ref = now ?? new Date();
  const refMs = ref.getTime();

  // If nextScheduledAt is set and in the past, it is due
  if (sub.nextScheduledAt != null && sub.nextScheduledAt <= refMs) {
    return true;
  }

  // For on-change frequency, it is always "due" (externally triggered)
  if (sub.frequency === 'on-change') return false;

  // If never sent before and no nextScheduledAt, it is due
  if (sub.lastSentAt == null && sub.nextScheduledAt == null) {
    return true;
  }

  return false;
}
