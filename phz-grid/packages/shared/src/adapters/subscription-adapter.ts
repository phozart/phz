/**
 * @phozart/shared — SubscriptionAdapter SPI
 *
 * Contract for managing scheduled report subscriptions. Consumers
 * implement this to connect to their scheduling/delivery backend.
 */

import type { ReportSubscription } from '../types/subscription.js';

// ========================================================================
// SubscriptionAdapter interface
// ========================================================================

/**
 * Scheduled subscription SPI. Consumer applications implement this
 * to provide CRUD operations for report delivery subscriptions.
 */
export interface SubscriptionAdapter {
  /**
   * Create a new subscription.
   */
  create(subscription: ReportSubscription): Promise<{ id: string; success: boolean }>;

  /**
   * Update an existing subscription.
   */
  update(subscription: ReportSubscription): Promise<{ success: boolean; error?: string }>;

  /**
   * Delete a subscription by ID.
   */
  delete(subscriptionId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * List subscriptions for the current user.
   */
  listForUser(userId: string): Promise<ReportSubscription[]>;

  /**
   * List subscriptions for a specific artifact.
   */
  listForArtifact(artifactId: string): Promise<ReportSubscription[]>;

  /**
   * Pause a subscription (keep configuration but stop delivery).
   */
  pause(subscriptionId: string): Promise<{ success: boolean }>;

  /**
   * Resume a paused subscription.
   */
  resume(subscriptionId: string): Promise<{ success: boolean }>;

  /**
   * Trigger an immediate delivery for a subscription (bypass schedule).
   */
  triggerNow?(subscriptionId: string): Promise<{ success: boolean }>;
}
