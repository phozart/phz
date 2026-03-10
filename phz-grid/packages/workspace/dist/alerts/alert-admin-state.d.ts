/**
 * @phozart/phz-workspace — Alert Admin State (B-3.08)
 *
 * Pure functions for alert rule creation/editing, compound condition building,
 * channel configuration, and grace period settings.
 */
import type { AlertRule, AlertRuleId, AlertCondition, SimpleThreshold, CompoundCondition, AlertSubscription } from '../types.js';
export interface AlertChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'in-app';
    config: Record<string, unknown>;
    enabled: boolean;
}
export interface AlertAdminState {
    rules: AlertRule[];
    channels: AlertChannel[];
    subscriptions: AlertSubscription[];
    selectedRuleId?: AlertRuleId;
    editingRule?: AlertRule;
    editingCondition?: AlertCondition;
    search: string;
    severityFilter?: 'info' | 'warning' | 'critical';
}
export declare function initialAlertAdminState(): AlertAdminState;
export declare function setAlertSearch(state: AlertAdminState, search: string): AlertAdminState;
export declare function setSeverityFilter(state: AlertAdminState, severity: 'info' | 'warning' | 'critical' | undefined): AlertAdminState;
export declare function getFilteredRules(state: AlertAdminState): AlertRule[];
export declare function createAlertRule(state: AlertAdminState, input: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertAdminState;
export declare function updateAlertRule(state: AlertAdminState, rule: AlertRule): AlertAdminState;
export declare function deleteAlertRule(state: AlertAdminState, ruleId: AlertRuleId): AlertAdminState;
export declare function toggleRuleEnabled(state: AlertAdminState, ruleId: AlertRuleId): AlertAdminState;
export declare function selectAlertRule(state: AlertAdminState, ruleId: AlertRuleId): AlertAdminState;
export declare function clearAlertSelection(state: AlertAdminState): AlertAdminState;
export declare function buildThreshold(metric: string, operator: SimpleThreshold['operator'], value: number): SimpleThreshold;
export declare function buildCompound(op: CompoundCondition['op'], children: AlertCondition[]): CompoundCondition;
export declare function setEditingCondition(state: AlertAdminState, condition: AlertCondition): AlertAdminState;
export declare function addConditionChild(condition: CompoundCondition, child: AlertCondition): CompoundCondition;
export declare function removeConditionChild(condition: CompoundCondition, index: number): CompoundCondition;
export declare function applyConditionToEditingRule(state: AlertAdminState, condition: AlertCondition): AlertAdminState;
export declare function setCooldown(state: AlertAdminState, ruleId: AlertRuleId, cooldownMs: number): AlertAdminState;
export declare function addChannel(state: AlertAdminState, channel: AlertChannel): AlertAdminState;
export declare function removeChannel(state: AlertAdminState, channelId: string): AlertAdminState;
export declare function toggleChannelEnabled(state: AlertAdminState, channelId: string): AlertAdminState;
export declare function addSubscription(state: AlertAdminState, subscription: AlertSubscription): AlertAdminState;
export declare function removeSubscription(state: AlertAdminState, subscriptionId: string): AlertAdminState;
export declare function getSubscriptionsForRule(state: AlertAdminState, ruleId: AlertRuleId): AlertSubscription[];
export interface AlertAdminValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateAlertAdminRule(rule: AlertRule): AlertAdminValidation;
/**
 * Reset the rule counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetRuleCounter(): void;
//# sourceMappingURL=alert-admin-state.d.ts.map