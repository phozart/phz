import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryWorkspaceAdapter } from '../adapters/memory-adapter.js';
import type { AlertRule, BreachRecord, AlertSubscription, AlertRuleId, BreachId } from '../types.js';

function makeAlertRule(overrides?: Partial<AlertRule>): AlertRule {
  return {
    id: ('rule_' + Math.random().toString(36).slice(2)) as AlertRuleId,
    name: 'High Revenue Alert',
    description: 'Fires when revenue exceeds 1M',
    artifactId: 'dashboard-1',
    condition: { kind: 'threshold', metric: 'revenue', operator: '>', value: 1000000 },
    severity: 'warning',
    cooldownMs: 300000,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeBreachRecord(ruleId: AlertRuleId, overrides?: Partial<BreachRecord>): BreachRecord {
  return {
    id: ('breach_' + Math.random().toString(36).slice(2)) as BreachId,
    ruleId,
    artifactId: 'dashboard-1',
    status: 'active',
    detectedAt: Date.now(),
    currentValue: 1500000,
    thresholdValue: 1000000,
    severity: 'warning',
    message: 'Revenue exceeded 1M',
    ...overrides,
  };
}

function makeSubscription(ruleId: AlertRuleId, overrides?: Partial<AlertSubscription>): AlertSubscription {
  return {
    id: 'sub_' + Math.random().toString(36).slice(2),
    ruleId,
    channelId: 'email',
    recipientRef: 'admin@example.com',
    format: 'inline',
    active: true,
    ...overrides,
  };
}

describe('BreachStore (MemoryWorkspaceAdapter)', () => {
  let adapter: MemoryWorkspaceAdapter;

  beforeEach(async () => {
    adapter = new MemoryWorkspaceAdapter();
    await adapter.initialize();
  });

  describe('AlertRule CRUD', () => {
    it('saves and loads alert rules', async () => {
      const rule = makeAlertRule();
      await adapter.saveAlertRule(rule);
      const loaded = await adapter.loadAlertRules();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('High Revenue Alert');
    });

    it('overwrites existing rule with same id', async () => {
      const rule = makeAlertRule();
      await adapter.saveAlertRule(rule);
      await adapter.saveAlertRule({ ...rule, name: 'Updated' });
      const loaded = await adapter.loadAlertRules();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Updated');
    });

    it('filters rules by artifactId', async () => {
      await adapter.saveAlertRule(makeAlertRule({ artifactId: 'dash-1' }));
      await adapter.saveAlertRule(makeAlertRule({ artifactId: 'dash-2' }));
      const filtered = await adapter.loadAlertRules('dash-1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artifactId).toBe('dash-1');
    });

    it('returns all rules when no filter', async () => {
      await adapter.saveAlertRule(makeAlertRule({ artifactId: 'dash-1' }));
      await adapter.saveAlertRule(makeAlertRule({ artifactId: 'dash-2' }));
      const all = await adapter.loadAlertRules();
      expect(all).toHaveLength(2);
    });

    it('deletes a rule', async () => {
      const rule = makeAlertRule();
      await adapter.saveAlertRule(rule);
      await adapter.deleteAlertRule(rule.id);
      const loaded = await adapter.loadAlertRules();
      expect(loaded).toHaveLength(0);
    });
  });

  describe('BreachRecord CRUD', () => {
    it('saves and loads breach records', async () => {
      const rule = makeAlertRule();
      await adapter.saveAlertRule(rule);
      const breach = makeBreachRecord(rule.id);
      await adapter.saveBreachRecord(breach);
      const loaded = await adapter.loadActiveBreaches();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].ruleId).toBe(rule.id);
    });

    it('loadActiveBreaches filters by status=active', async () => {
      const rule = makeAlertRule();
      const b1 = makeBreachRecord(rule.id, { status: 'active' });
      const b2 = makeBreachRecord(rule.id, { status: 'resolved' });
      await adapter.saveBreachRecord(b1);
      await adapter.saveBreachRecord(b2);
      const active = await adapter.loadActiveBreaches();
      expect(active).toHaveLength(1);
      expect(active[0].status).toBe('active');
    });

    it('filters breaches by artifactId', async () => {
      const rule = makeAlertRule();
      await adapter.saveBreachRecord(makeBreachRecord(rule.id, { artifactId: 'dash-1' }));
      await adapter.saveBreachRecord(makeBreachRecord(rule.id, { artifactId: 'dash-2' }));
      const filtered = await adapter.loadActiveBreaches('dash-1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artifactId).toBe('dash-1');
    });

    it('updates breach status', async () => {
      const rule = makeAlertRule();
      const breach = makeBreachRecord(rule.id);
      await adapter.saveBreachRecord(breach);

      await adapter.updateBreachStatus(breach.id, 'acknowledged');
      const loaded = await adapter.loadActiveBreaches();
      // acknowledged is not 'active', so it should not appear
      expect(loaded).toHaveLength(0);

      const b2 = makeBreachRecord(rule.id);
      await adapter.saveBreachRecord(b2);
      await adapter.updateBreachStatus(b2.id, 'resolved');
      const active = await adapter.loadActiveBreaches();
      expect(active).toHaveLength(0);
    });
  });

  describe('AlertSubscription CRUD', () => {
    it('saves and loads subscriptions', async () => {
      const rule = makeAlertRule();
      const sub = makeSubscription(rule.id);
      await adapter.saveSubscription(sub);
      const loaded = await adapter.loadSubscriptions();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].channelId).toBe('email');
    });

    it('filters subscriptions by ruleId', async () => {
      const rule1 = makeAlertRule();
      const rule2 = makeAlertRule();
      await adapter.saveSubscription(makeSubscription(rule1.id));
      await adapter.saveSubscription(makeSubscription(rule2.id));
      const filtered = await adapter.loadSubscriptions(rule1.id);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].ruleId).toBe(rule1.id);
    });

    it('returns all subscriptions when no filter', async () => {
      const rule1 = makeAlertRule();
      const rule2 = makeAlertRule();
      await adapter.saveSubscription(makeSubscription(rule1.id));
      await adapter.saveSubscription(makeSubscription(rule2.id));
      const all = await adapter.loadSubscriptions();
      expect(all).toHaveLength(2);
    });
  });

  describe('clear includes breach store data', () => {
    it('clears all breach store data on adapter.clear()', async () => {
      const rule = makeAlertRule();
      await adapter.saveAlertRule(rule);
      await adapter.saveBreachRecord(makeBreachRecord(rule.id));
      await adapter.saveSubscription(makeSubscription(rule.id));

      await adapter.clear();

      expect(await adapter.loadAlertRules()).toHaveLength(0);
      expect(await adapter.loadActiveBreaches()).toHaveLength(0);
      expect(await adapter.loadSubscriptions()).toHaveLength(0);
    });
  });
});
