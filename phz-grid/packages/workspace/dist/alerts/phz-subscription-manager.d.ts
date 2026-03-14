/**
 * @phozart/workspace — Subscription Manager (N.2)
 *
 * Pure logic functions for creating and managing alert subscriptions.
 */
import type { AlertSubscription, AlertRuleId } from '../types.js';
export declare function createSubscription(ruleId: AlertRuleId, channelId: string, recipientRef: string, format?: AlertSubscription['format']): AlertSubscription;
export declare function validateSubscription(sub: AlertSubscription): string[];
export declare function toggleSubscription(sub: AlertSubscription): AlertSubscription;
//# sourceMappingURL=phz-subscription-manager.d.ts.map