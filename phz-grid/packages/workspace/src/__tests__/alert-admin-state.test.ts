import { describe, it, expect, beforeEach } from 'vitest';
import { alertRuleId } from '../types.js';
import type { AlertRule, AlertCondition } from '../types.js';
import {
  initialAlertAdminState,
  setAlertSearch,
  setSeverityFilter,
  getFilteredRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleRuleEnabled,
  selectAlertRule,
  clearAlertSelection,
  buildThreshold,
  buildCompound,
  addConditionChild,
  removeConditionChild,
  applyConditionToEditingRule,
  setCooldown,
  addChannel,
  removeChannel,
  toggleChannelEnabled,
  addSubscription,
  removeSubscription,
  getSubscriptionsForRule,
  validateAlertAdminRule,
  _resetRuleCounter,
  type AlertChannel,
} from '../alerts/alert-admin-state.js';

beforeEach(() => _resetRuleCounter());

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRule(overrides?: Partial<AlertRule>): Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Test Rule',
    description: 'A test alert',
    artifactId: 'art-1',
    condition: buildThreshold('revenue', '>', 1000),
    severity: 'warning',
    cooldownMs: 60000,
    enabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialAlertAdminState', () => {
  it('creates empty state', () => {
    const state = initialAlertAdminState();
    expect(state.rules).toHaveLength(0);
    expect(state.channels).toHaveLength(0);
    expect(state.search).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Search and filter
// ---------------------------------------------------------------------------

describe('search and filter', () => {
  it('filters by search', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule({ name: 'Revenue Alert' }));
    state = createAlertRule(state, makeRule({ name: 'Cost Alert' }));
    state = setAlertSearch(state, 'revenue');
    expect(getFilteredRules(state)).toHaveLength(1);
  });

  it('filters by severity', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule({ severity: 'critical' }));
    state = createAlertRule(state, makeRule({ severity: 'info' }));
    state = setSeverityFilter(state, 'critical');
    expect(getFilteredRules(state)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Rule CRUD
// ---------------------------------------------------------------------------

describe('rule CRUD', () => {
  it('creates a rule', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    expect(state.rules).toHaveLength(1);
    expect(state.selectedRuleId).toBe(state.rules[0].id);
    expect(state.editingRule).toBeDefined();
  });

  it('updates a rule', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const rule = state.rules[0];
    state = updateAlertRule(state, { ...rule, name: 'Updated' });
    expect(state.rules[0].name).toBe('Updated');
  });

  it('deletes a rule and its subscriptions', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const ruleId = state.rules[0].id;
    state = addSubscription(state, { id: 'sub-1', ruleId, channelId: 'ch-1', recipientRef: 'user@test.com', format: 'inline', active: true });
    state = deleteAlertRule(state, ruleId);
    expect(state.rules).toHaveLength(0);
    expect(state.subscriptions).toHaveLength(0);
  });

  it('toggles rule enabled', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const ruleId = state.rules[0].id;
    state = toggleRuleEnabled(state, ruleId);
    expect(state.rules[0].enabled).toBe(false);
    state = toggleRuleEnabled(state, ruleId);
    expect(state.rules[0].enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects and clears', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    state = clearAlertSelection(state);
    expect(state.selectedRuleId).toBeUndefined();
    expect(state.editingRule).toBeUndefined();

    state = selectAlertRule(state, state.rules[0].id);
    expect(state.selectedRuleId).toBe(state.rules[0].id);
    expect(state.editingRule).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Condition builder
// ---------------------------------------------------------------------------

describe('condition builder', () => {
  it('builds threshold condition', () => {
    const cond = buildThreshold('revenue', '>', 1000);
    expect(cond.kind).toBe('threshold');
    expect(cond.metric).toBe('revenue');
    expect(cond.operator).toBe('>');
    expect(cond.value).toBe(1000);
  });

  it('builds compound condition', () => {
    const c1 = buildThreshold('revenue', '>', 1000);
    const c2 = buildThreshold('cost', '<', 500);
    const compound = buildCompound('AND', [c1, c2]);
    expect(compound.kind).toBe('compound');
    expect(compound.op).toBe('AND');
    expect(compound.children).toHaveLength(2);
  });

  it('adds child to compound', () => {
    const compound = buildCompound('OR', []);
    const updated = addConditionChild(compound, buildThreshold('x', '>', 0));
    expect(updated.children).toHaveLength(1);
  });

  it('removes child from compound', () => {
    const c1 = buildThreshold('a', '>', 0);
    const c2 = buildThreshold('b', '<', 10);
    const compound = buildCompound('AND', [c1, c2]);
    const updated = removeConditionChild(compound, 0);
    expect(updated.children).toHaveLength(1);
    expect((updated.children[0] as any).metric).toBe('b');
  });

  it('applies condition to editing rule', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const newCond = buildCompound('OR', [buildThreshold('x', '>', 5)]);
    state = applyConditionToEditingRule(state, newCond);
    expect(state.editingRule!.condition.kind).toBe('compound');
  });
});

// ---------------------------------------------------------------------------
// Cooldown
// ---------------------------------------------------------------------------

describe('cooldown', () => {
  it('sets cooldown', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    state = setCooldown(state, state.rules[0].id, 120000);
    expect(state.rules[0].cooldownMs).toBe(120000);
  });

  it('rejects negative', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const prev = state.rules[0].cooldownMs;
    state = setCooldown(state, state.rules[0].id, -1);
    expect(state.rules[0].cooldownMs).toBe(prev);
  });
});

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

describe('channels', () => {
  const channel: AlertChannel = { id: 'ch-1', name: 'Email', type: 'email', config: {}, enabled: true };

  it('adds a channel', () => {
    let state = initialAlertAdminState();
    state = addChannel(state, channel);
    expect(state.channels).toHaveLength(1);
  });

  it('removes channel and its subscriptions', () => {
    let state = initialAlertAdminState();
    state = addChannel(state, channel);
    state = createAlertRule(state, makeRule());
    state = addSubscription(state, { id: 'sub-1', ruleId: state.rules[0].id, channelId: 'ch-1', recipientRef: 'x', format: 'inline', active: true });
    state = removeChannel(state, 'ch-1');
    expect(state.channels).toHaveLength(0);
    expect(state.subscriptions).toHaveLength(0);
  });

  it('toggles channel enabled', () => {
    let state = initialAlertAdminState();
    state = addChannel(state, channel);
    state = toggleChannelEnabled(state, 'ch-1');
    expect(state.channels[0].enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

describe('subscriptions', () => {
  it('adds and removes subscriptions', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const ruleId = state.rules[0].id;
    state = addSubscription(state, { id: 'sub-1', ruleId, channelId: 'ch-1', recipientRef: 'x', format: 'inline', active: true });
    expect(state.subscriptions).toHaveLength(1);
    expect(getSubscriptionsForRule(state, ruleId)).toHaveLength(1);

    state = removeSubscription(state, 'sub-1');
    expect(state.subscriptions).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('validates a valid rule', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule());
    const result = validateAlertAdminRule(state.rules[0]);
    expect(result.valid).toBe(true);
  });

  it('fails without name', () => {
    let state = initialAlertAdminState();
    state = createAlertRule(state, makeRule({ name: '' }));
    const result = validateAlertAdminRule(state.rules[0]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Rule name is required');
  });

  it('validates NOT condition with single child', () => {
    const cond = buildCompound('NOT', [buildThreshold('x', '>', 0)]);
    const rule: AlertRule = {
      id: alertRuleId('test'),
      name: 'Test',
      description: 'test',
      artifactId: 'art-1',
      condition: cond,
      severity: 'info',
      cooldownMs: 0,
      enabled: true,
      createdAt: 0,
      updatedAt: 0,
    };
    expect(validateAlertAdminRule(rule).valid).toBe(true);
  });

  it('fails NOT with multiple children', () => {
    const cond = buildCompound('NOT', [buildThreshold('x', '>', 0), buildThreshold('y', '<', 10)]);
    const rule: AlertRule = {
      id: alertRuleId('test'),
      name: 'Test',
      description: 'test',
      artifactId: 'art-1',
      condition: cond,
      severity: 'info',
      cooldownMs: 0,
      enabled: true,
      createdAt: 0,
      updatedAt: 0,
    };
    expect(validateAlertAdminRule(rule).valid).toBe(false);
  });
});
