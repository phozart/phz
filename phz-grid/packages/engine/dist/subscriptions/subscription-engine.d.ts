/**
 * @phozart/phz-engine — Subscription Engine (C-2.05)
 *
 * State management for report/dashboard subscriptions.
 * Includes schedule computation and execution readiness checks.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { Subscription, SubscriptionSchedule } from '@phozart/phz-shared/types';
export interface SubscriptionEngineState {
    subscriptions: Subscription[];
    activeSubscriptionId: string | null;
    processing: boolean;
}
/**
 * Create a fresh SubscriptionEngineState.
 */
export declare function createSubscriptionEngineState(overrides?: Partial<SubscriptionEngineState>): SubscriptionEngineState;
/**
 * Add a subscription. If one with the same ID exists, it is replaced.
 */
export declare function addSubscription(state: SubscriptionEngineState, sub: Subscription): SubscriptionEngineState;
/**
 * Update an existing subscription with partial data.
 * Returns the state unchanged if the subscription is not found.
 */
export declare function updateSubscription(state: SubscriptionEngineState, id: string, updates: Partial<Subscription>): SubscriptionEngineState;
/**
 * Remove a subscription by ID.
 */
export declare function removeSubscription(state: SubscriptionEngineState, id: string): SubscriptionEngineState;
/**
 * Compute the next scheduled run date for a subscription schedule.
 * Uses the current date/time as the reference point.
 *
 * @param schedule - The subscription schedule.
 * @param now - Optional reference date (defaults to new Date()).
 */
export declare function getNextScheduledRun(schedule: SubscriptionSchedule, now?: Date): Date;
/**
 * Check if a subscription is due for execution at the given time.
 *
 * @param sub - The subscription to check.
 * @param now - Optional reference date (defaults to new Date()).
 */
export declare function isDueForExecution(sub: Subscription, now?: Date): boolean;
//# sourceMappingURL=subscription-engine.d.ts.map