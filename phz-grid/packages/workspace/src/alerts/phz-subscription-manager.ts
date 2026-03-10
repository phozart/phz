/**
 * @phozart/phz-workspace — Subscription Manager (N.2)
 *
 * Pure logic functions for creating and managing alert subscriptions.
 */

import type { AlertSubscription, AlertRuleId } from '../types.js';

let subCounter = 0;

export function createSubscription(
  ruleId: AlertRuleId,
  channelId: string,
  recipientRef: string,
  format: AlertSubscription['format'] = 'inline',
): AlertSubscription {
  return {
    id: `sub_${Date.now()}_${++subCounter}`,
    ruleId,
    channelId,
    recipientRef,
    format,
    active: true,
  };
}

export function validateSubscription(sub: AlertSubscription): string[] {
  const errors: string[] = [];

  if (!sub.channelId || sub.channelId.trim() === '') {
    errors.push('Channel is required');
  }

  if (!sub.recipientRef || sub.recipientRef.trim() === '') {
    errors.push('Recipient is required');
  }

  return errors;
}

export function toggleSubscription(sub: AlertSubscription): AlertSubscription {
  return { ...sub, active: !sub.active };
}
