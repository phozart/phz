import { describe, it, expect } from 'vitest';
import {
  createSubscription,
  validateSubscription,
  toggleSubscription,
} from '../alerts/phz-subscription-manager.js';
import type { AlertSubscription, AlertRuleId } from '../types.js';
import { alertRuleId } from '../types.js';

describe('SubscriptionManager', () => {
  describe('createSubscription', () => {
    it('creates a subscription with defaults', () => {
      const sub = createSubscription(alertRuleId('rule-1'), 'email-channel', 'user@example.com');
      expect(sub.ruleId).toBe('rule-1');
      expect(sub.channelId).toBe('email-channel');
      expect(sub.recipientRef).toBe('user@example.com');
      expect(sub.format).toBe('inline');
      expect(sub.active).toBe(true);
    });

    it('generates unique ids', () => {
      const s1 = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      const s2 = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      expect(s1.id).not.toBe(s2.id);
    });

    it('accepts format override', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com', 'digest');
      expect(sub.format).toBe('digest');
    });
  });

  describe('validateSubscription', () => {
    it('returns no errors for valid subscription', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      expect(validateSubscription(sub)).toEqual([]);
    });

    it('returns error for empty channelId', () => {
      const sub = createSubscription(alertRuleId('r1'), '', 'a@a.com');
      const errors = validateSubscription(sub);
      expect(errors.some(e => e.toLowerCase().includes('channel'))).toBe(true);
    });

    it('returns error for empty recipientRef', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', '');
      const errors = validateSubscription(sub);
      expect(errors.some(e => e.toLowerCase().includes('recipient'))).toBe(true);
    });
  });

  describe('toggleSubscription', () => {
    it('toggles active to inactive', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      expect(sub.active).toBe(true);
      const toggled = toggleSubscription(sub);
      expect(toggled.active).toBe(false);
    });

    it('toggles inactive to active', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      const inactive = toggleSubscription(sub);
      const active = toggleSubscription(inactive);
      expect(active.active).toBe(true);
    });

    it('does not mutate original', () => {
      const sub = createSubscription(alertRuleId('r1'), 'ch1', 'a@a.com');
      const toggled = toggleSubscription(sub);
      expect(sub.active).toBe(true);
      expect(toggled.active).toBe(false);
    });
  });
});
