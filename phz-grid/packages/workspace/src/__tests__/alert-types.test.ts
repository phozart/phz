import { describe, it, expect } from 'vitest';
import {
  alertRuleId,
  breachId,
} from '../types.js';
import type {
  AlertRuleId,
  BreachId,
  SimpleThreshold,
  CompoundCondition,
  AlertCondition,
  AlertRule,
  AlertSubscription,
  AlertChannelAdapter,
  BreachRecord,
  ActiveBreach,
} from '../types.js';

describe('Alert & Breach types', () => {
  describe('branded IDs', () => {
    it('creates an AlertRuleId', () => {
      const id: AlertRuleId = alertRuleId('alert-001');
      expect(id).toBe('alert-001');
      // Branded type — still a string at runtime
      expect(typeof id).toBe('string');
    });

    it('creates a BreachId', () => {
      const id: BreachId = breachId('breach-001');
      expect(id).toBe('breach-001');
      expect(typeof id).toBe('string');
    });
  });

  describe('AlertCondition', () => {
    it('creates a simple threshold', () => {
      const cond: SimpleThreshold = {
        kind: 'threshold',
        metric: 'response_time',
        operator: '>',
        value: 500,
        durationMs: 60000,
      };
      expect(cond.kind).toBe('threshold');
      expect(cond.operator).toBe('>');
      expect(cond.durationMs).toBe(60000);
    });

    it('creates a compound condition (AND)', () => {
      const left: SimpleThreshold = {
        kind: 'threshold',
        metric: 'cpu',
        operator: '>',
        value: 90,
      };
      const right: SimpleThreshold = {
        kind: 'threshold',
        metric: 'memory',
        operator: '>',
        value: 85,
      };
      const compound: CompoundCondition = {
        kind: 'compound',
        op: 'AND',
        children: [left, right],
      };
      expect(compound.children).toHaveLength(2);
      expect(compound.op).toBe('AND');
    });

    it('creates nested compound conditions', () => {
      const inner: CompoundCondition = {
        kind: 'compound',
        op: 'OR',
        children: [
          { kind: 'threshold', metric: 'a', operator: '>', value: 1 },
          { kind: 'threshold', metric: 'b', operator: '<', value: 2 },
        ],
      };
      const outer: CompoundCondition = {
        kind: 'compound',
        op: 'NOT',
        children: [inner],
      };
      expect(outer.op).toBe('NOT');
      expect(outer.children[0].kind).toBe('compound');
    });

    it('uses AlertCondition discriminated union', () => {
      const conditions: AlertCondition[] = [
        { kind: 'threshold', metric: 'x', operator: '>=', value: 10 },
        { kind: 'compound', op: 'OR', children: [] },
      ];
      expect(conditions[0].kind).toBe('threshold');
      expect(conditions[1].kind).toBe('compound');
    });

    it('supports all comparison operators', () => {
      const operators: SimpleThreshold['operator'][] = ['>', '<', '>=', '<=', '==', '!='];
      expect(operators).toHaveLength(6);
    });
  });

  describe('AlertRule', () => {
    it('creates a complete alert rule', () => {
      const rule: AlertRule = {
        id: alertRuleId('rule-1'),
        name: 'High CPU Alert',
        description: 'Fires when CPU exceeds 90%',
        artifactId: 'dashboard-1',
        widgetId: 'cpu-gauge',
        condition: {
          kind: 'threshold',
          metric: 'cpu_usage',
          operator: '>',
          value: 90,
        },
        severity: 'critical',
        cooldownMs: 300000,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      expect(rule.severity).toBe('critical');
      expect(rule.cooldownMs).toBe(300000);
      expect(rule.enabled).toBe(true);
    });

    it('supports all severity levels', () => {
      const severities: AlertRule['severity'][] = ['info', 'warning', 'critical'];
      expect(severities).toHaveLength(3);
    });
  });

  describe('AlertSubscription', () => {
    it('creates a subscription', () => {
      const sub: AlertSubscription = {
        id: 'sub-1',
        ruleId: alertRuleId('rule-1'),
        channelId: 'email',
        recipientRef: 'user@example.com',
        format: 'inline',
        active: true,
      };
      expect(sub.format).toBe('inline');
      expect(sub.active).toBe(true);
    });

    it('supports all format types', () => {
      const formats: AlertSubscription['format'][] = ['inline', 'digest', 'webhook'];
      expect(formats).toHaveLength(3);
    });
  });

  describe('BreachRecord', () => {
    it('creates a breach record', () => {
      const breach: BreachRecord = {
        id: breachId('b-1'),
        ruleId: alertRuleId('rule-1'),
        artifactId: 'dash-1',
        widgetId: 'w-1',
        status: 'active',
        detectedAt: Date.now(),
        currentValue: 95,
        thresholdValue: 90,
        severity: 'critical',
        message: 'CPU at 95%, threshold 90%',
      };
      expect(breach.status).toBe('active');
      expect(breach.currentValue).toBe(95);
    });

    it('supports status transitions', () => {
      const statuses: BreachRecord['status'][] = ['active', 'acknowledged', 'resolved'];
      expect(statuses).toHaveLength(3);
    });

    it('includes optional timestamps for acknowledged/resolved', () => {
      const breach: BreachRecord = {
        id: breachId('b-2'),
        ruleId: alertRuleId('rule-1'),
        artifactId: 'dash-1',
        status: 'resolved',
        detectedAt: 1000,
        acknowledgedAt: 2000,
        resolvedAt: 3000,
        currentValue: 50,
        thresholdValue: 90,
        severity: 'warning',
        message: 'Resolved',
      };
      expect(breach.acknowledgedAt).toBe(2000);
      expect(breach.resolvedAt).toBe(3000);
    });
  });

  describe('ActiveBreach', () => {
    it('combines breach and rule', () => {
      const rule: AlertRule = {
        id: alertRuleId('rule-1'),
        name: 'Test',
        description: '',
        artifactId: 'a1',
        condition: { kind: 'threshold', metric: 'm', operator: '>', value: 0 },
        severity: 'info',
        cooldownMs: 0,
        enabled: true,
        createdAt: 0,
        updatedAt: 0,
      };
      const breach: BreachRecord = {
        id: breachId('b-1'),
        ruleId: alertRuleId('rule-1'),
        artifactId: 'a1',
        status: 'active',
        detectedAt: Date.now(),
        currentValue: 5,
        thresholdValue: 0,
        severity: 'info',
        message: 'Above zero',
      };
      const active: ActiveBreach = { breach, rule };
      expect(active.breach.ruleId).toBe(active.rule.id);
    });
  });

  describe('AlertChannelAdapter interface', () => {
    it('validates a mock channel adapter', async () => {
      const mockChannel: AlertChannelAdapter = {
        send: async () => {},
        test: async () => true,
      };
      expect(await mockChannel.test()).toBe(true);
    });
  });
});
