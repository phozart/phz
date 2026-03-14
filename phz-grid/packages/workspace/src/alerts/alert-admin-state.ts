/**
 * @phozart/workspace — Alert Admin State (B-3.08)
 *
 * Pure functions for alert rule creation/editing, compound condition building,
 * channel configuration, and grace period settings.
 */

import type {
  AlertRule,
  AlertRuleId,
  AlertCondition,
  SimpleThreshold,
  CompoundCondition,
  AlertSubscription,
  AlertChannelAdapter,
} from '../types.js';
import { alertRuleId } from '../types.js';

// ========================================================================
// Types
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

let ruleCounter = 0;

export function initialAlertAdminState(): AlertAdminState {
  return {
    rules: [],
    channels: [],
    subscriptions: [],
    search: '',
  };
}

// ========================================================================
// Search and filter
// ========================================================================

export function setAlertSearch(
  state: AlertAdminState,
  search: string,
): AlertAdminState {
  return { ...state, search };
}

export function setSeverityFilter(
  state: AlertAdminState,
  severity: 'info' | 'warning' | 'critical' | undefined,
): AlertAdminState {
  return { ...state, severityFilter: severity };
}

export function getFilteredRules(state: AlertAdminState): AlertRule[] {
  let result = state.rules;

  if (state.severityFilter) {
    result = result.filter(r => r.severity === state.severityFilter);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }

  return result;
}

// ========================================================================
// Rule CRUD
// ========================================================================

export function createAlertRule(
  state: AlertAdminState,
  input: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>,
): AlertAdminState {
  ruleCounter++;
  const now = Date.now();
  const rule: AlertRule = {
    ...input,
    id: alertRuleId(`ar_${now}_${ruleCounter}`),
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...state,
    rules: [...state.rules, rule],
    selectedRuleId: rule.id,
    editingRule: rule,
  };
}

export function updateAlertRule(
  state: AlertAdminState,
  rule: AlertRule,
): AlertAdminState {
  const updated: AlertRule = { ...rule, updatedAt: Date.now() };
  return {
    ...state,
    rules: state.rules.map(r => (r.id === rule.id ? updated : r)),
    editingRule: state.editingRule?.id === rule.id ? updated : state.editingRule,
  };
}

export function deleteAlertRule(
  state: AlertAdminState,
  ruleId: AlertRuleId,
): AlertAdminState {
  return {
    ...state,
    rules: state.rules.filter(r => r.id !== ruleId),
    subscriptions: state.subscriptions.filter(s => s.ruleId !== ruleId),
    selectedRuleId: state.selectedRuleId === ruleId ? undefined : state.selectedRuleId,
    editingRule: state.editingRule?.id === ruleId ? undefined : state.editingRule,
  };
}

export function toggleRuleEnabled(
  state: AlertAdminState,
  ruleId: AlertRuleId,
): AlertAdminState {
  const rule = state.rules.find(r => r.id === ruleId);
  if (!rule) return state;
  return updateAlertRule(state, { ...rule, enabled: !rule.enabled });
}

// ========================================================================
// Selection / editing
// ========================================================================

export function selectAlertRule(
  state: AlertAdminState,
  ruleId: AlertRuleId,
): AlertAdminState {
  const rule = state.rules.find(r => r.id === ruleId);
  return {
    ...state,
    selectedRuleId: ruleId,
    editingRule: rule ? { ...rule } : undefined,
  };
}

export function clearAlertSelection(state: AlertAdminState): AlertAdminState {
  return {
    ...state,
    selectedRuleId: undefined,
    editingRule: undefined,
    editingCondition: undefined,
  };
}

// ========================================================================
// Condition builder
// ========================================================================

export function buildThreshold(
  metric: string,
  operator: SimpleThreshold['operator'],
  value: number,
): SimpleThreshold {
  return { kind: 'threshold', metric, operator, value };
}

export function buildCompound(
  op: CompoundCondition['op'],
  children: AlertCondition[],
): CompoundCondition {
  return { kind: 'compound', op, children };
}

export function setEditingCondition(
  state: AlertAdminState,
  condition: AlertCondition,
): AlertAdminState {
  return { ...state, editingCondition: condition };
}

export function addConditionChild(
  condition: CompoundCondition,
  child: AlertCondition,
): CompoundCondition {
  return { ...condition, children: [...condition.children, child] };
}

export function removeConditionChild(
  condition: CompoundCondition,
  index: number,
): CompoundCondition {
  if (index < 0 || index >= condition.children.length) return condition;
  return {
    ...condition,
    children: condition.children.filter((_, i) => i !== index),
  };
}

export function applyConditionToEditingRule(
  state: AlertAdminState,
  condition: AlertCondition,
): AlertAdminState {
  if (!state.editingRule) return state;
  return {
    ...state,
    editingRule: { ...state.editingRule, condition },
    editingCondition: condition,
  };
}

// ========================================================================
// Grace period (cooldown)
// ========================================================================

export function setCooldown(
  state: AlertAdminState,
  ruleId: AlertRuleId,
  cooldownMs: number,
): AlertAdminState {
  if (cooldownMs < 0) return state;
  const rule = state.rules.find(r => r.id === ruleId);
  if (!rule) return state;
  return updateAlertRule(state, { ...rule, cooldownMs });
}

// ========================================================================
// Channel management
// ========================================================================

export function addChannel(
  state: AlertAdminState,
  channel: AlertChannel,
): AlertAdminState {
  if (state.channels.some(c => c.id === channel.id)) return state;
  return { ...state, channels: [...state.channels, channel] };
}

export function removeChannel(
  state: AlertAdminState,
  channelId: string,
): AlertAdminState {
  return {
    ...state,
    channels: state.channels.filter(c => c.id !== channelId),
    subscriptions: state.subscriptions.filter(s => s.channelId !== channelId),
  };
}

export function toggleChannelEnabled(
  state: AlertAdminState,
  channelId: string,
): AlertAdminState {
  return {
    ...state,
    channels: state.channels.map(c =>
      c.id === channelId ? { ...c, enabled: !c.enabled } : c,
    ),
  };
}

// ========================================================================
// Subscription management
// ========================================================================

export function addSubscription(
  state: AlertAdminState,
  subscription: AlertSubscription,
): AlertAdminState {
  return {
    ...state,
    subscriptions: [...state.subscriptions, subscription],
  };
}

export function removeSubscription(
  state: AlertAdminState,
  subscriptionId: string,
): AlertAdminState {
  return {
    ...state,
    subscriptions: state.subscriptions.filter(s => s.id !== subscriptionId),
  };
}

export function getSubscriptionsForRule(
  state: AlertAdminState,
  ruleId: AlertRuleId,
): AlertSubscription[] {
  return state.subscriptions.filter(s => s.ruleId === ruleId);
}

// ========================================================================
// Validation
// ========================================================================

export interface AlertAdminValidation {
  valid: boolean;
  errors: string[];
}

export function validateAlertAdminRule(rule: AlertRule): AlertAdminValidation {
  const errors: string[] = [];

  if (!rule.name?.trim()) {
    errors.push('Rule name is required');
  }
  if (!rule.artifactId?.trim()) {
    errors.push('Artifact ID is required');
  }
  if (rule.cooldownMs < 0) {
    errors.push('Cooldown cannot be negative');
  }
  if (!validateConditionShape(rule.condition)) {
    errors.push('Invalid condition structure');
  }

  return { valid: errors.length === 0, errors };
}

function validateConditionShape(condition: AlertCondition): boolean {
  if (condition.kind === 'threshold') {
    return (
      typeof condition.metric === 'string' &&
      condition.metric.length > 0 &&
      typeof condition.value === 'number'
    );
  }
  if (condition.kind === 'compound') {
    if (condition.children.length === 0) return false;
    if (condition.op === 'NOT' && condition.children.length !== 1) return false;
    return condition.children.every(validateConditionShape);
  }
  return false;
}

/**
 * Reset the rule counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetRuleCounter(): void {
  ruleCounter = 0;
}
