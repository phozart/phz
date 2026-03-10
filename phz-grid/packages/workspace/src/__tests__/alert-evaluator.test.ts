import { describe, it, expect } from 'vitest';
import {
  evaluateRule,
  evaluateCondition,
  evaluateRules,
  type EvaluationResult,
} from '../alerts/alert-evaluator.js';
import type {
  AlertRule,
  AlertRuleId,
  BreachRecord,
  SimpleThreshold,
  CompoundCondition,
  AlertCondition,
} from '../types.js';
import { alertRuleId, breachId } from '../types.js';

function makeRule(condition: AlertCondition, overrides?: Partial<AlertRule>): AlertRule {
  return {
    id: alertRuleId('rule-1'),
    name: 'Test Rule',
    description: 'A test alert rule',
    artifactId: 'dash-1',
    condition,
    severity: 'warning',
    cooldownMs: 0,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function threshold(metric: string, operator: SimpleThreshold['operator'], value: number): SimpleThreshold {
  return { kind: 'threshold', metric, operator, value };
}

describe('AlertEvaluator', () => {
  describe('evaluateCondition — SimpleThreshold operators', () => {
    const values = new Map<string, number>([['revenue', 500]]);

    it('> triggers when value exceeds threshold', () => {
      expect(evaluateCondition(threshold('revenue', '>', 400), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '>', 500), values).triggered).toBe(false);
      expect(evaluateCondition(threshold('revenue', '>', 600), values).triggered).toBe(false);
    });

    it('< triggers when value is below threshold', () => {
      expect(evaluateCondition(threshold('revenue', '<', 600), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '<', 500), values).triggered).toBe(false);
      expect(evaluateCondition(threshold('revenue', '<', 400), values).triggered).toBe(false);
    });

    it('>= triggers when value is at or above threshold', () => {
      expect(evaluateCondition(threshold('revenue', '>=', 500), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '>=', 400), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '>=', 600), values).triggered).toBe(false);
    });

    it('<= triggers when value is at or below threshold', () => {
      expect(evaluateCondition(threshold('revenue', '<=', 500), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '<=', 600), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '<=', 400), values).triggered).toBe(false);
    });

    it('== triggers when value equals threshold', () => {
      expect(evaluateCondition(threshold('revenue', '==', 500), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '==', 501), values).triggered).toBe(false);
    });

    it('!= triggers when value does not equal threshold', () => {
      expect(evaluateCondition(threshold('revenue', '!=', 400), values).triggered).toBe(true);
      expect(evaluateCondition(threshold('revenue', '!=', 500), values).triggered).toBe(false);
    });
  });

  describe('evaluateCondition — edge cases', () => {
    it('returns not triggered when metric is missing from values', () => {
      const values = new Map<string, number>();
      const result = evaluateCondition(threshold('missing', '>', 0), values);
      expect(result.triggered).toBe(false);
    });

    it('handles NaN values as not triggered', () => {
      const values = new Map<string, number>([['bad', NaN]]);
      const result = evaluateCondition(threshold('bad', '>', 0), values);
      expect(result.triggered).toBe(false);
    });
  });

  describe('evaluateCondition — CompoundCondition', () => {
    const values = new Map<string, number>([
      ['revenue', 500],
      ['orders', 10],
    ]);

    it('AND triggers when all children trigger', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'AND',
        children: [
          threshold('revenue', '>', 400),
          threshold('orders', '>', 5),
        ],
      };
      expect(evaluateCondition(cond, values).triggered).toBe(true);
    });

    it('AND does not trigger when any child fails', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'AND',
        children: [
          threshold('revenue', '>', 400),
          threshold('orders', '>', 50), // fails
        ],
      };
      expect(evaluateCondition(cond, values).triggered).toBe(false);
    });

    it('OR triggers when any child triggers', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'OR',
        children: [
          threshold('revenue', '>', 1000), // fails
          threshold('orders', '>', 5), // triggers
        ],
      };
      expect(evaluateCondition(cond, values).triggered).toBe(true);
    });

    it('OR does not trigger when all children fail', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'OR',
        children: [
          threshold('revenue', '>', 1000),
          threshold('orders', '>', 50),
        ],
      };
      expect(evaluateCondition(cond, values).triggered).toBe(false);
    });

    it('NOT inverts a single child', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'NOT',
        children: [threshold('revenue', '>', 1000)], // false → NOT → true
      };
      expect(evaluateCondition(cond, values).triggered).toBe(true);
    });

    it('deeply nested compound conditions evaluate correctly', () => {
      const cond: CompoundCondition = {
        kind: 'compound',
        op: 'AND',
        children: [
          {
            kind: 'compound',
            op: 'OR',
            children: [
              threshold('revenue', '>', 400),
              threshold('revenue', '<', 100),
            ],
          },
          {
            kind: 'compound',
            op: 'NOT',
            children: [threshold('orders', '>', 100)],
          },
        ],
      };
      expect(evaluateCondition(cond, values).triggered).toBe(true);
    });
  });

  describe('evaluateRule', () => {
    it('returns triggered result when condition fires', () => {
      const rule = makeRule(threshold('revenue', '>', 400));
      const values = new Map<string, number>([['revenue', 500]]);
      const result = evaluateRule(rule, values);
      expect(result.triggered).toBe(true);
      expect(result.currentValue).toBe(500);
      expect(result.thresholdValue).toBe(400);
      expect(result.message).toBeTruthy();
    });

    it('returns not triggered when condition does not fire', () => {
      const rule = makeRule(threshold('revenue', '>', 1000));
      const values = new Map<string, number>([['revenue', 500]]);
      const result = evaluateRule(rule, values);
      expect(result.triggered).toBe(false);
    });

    it('skips disabled rules', () => {
      const rule = makeRule(threshold('revenue', '>', 0), { enabled: false });
      const values = new Map<string, number>([['revenue', 500]]);
      const result = evaluateRule(rule, values);
      expect(result.triggered).toBe(false);
    });

    it('includes breached conditions', () => {
      const rule = makeRule(threshold('revenue', '>', 400));
      const values = new Map<string, number>([['revenue', 500]]);
      const result = evaluateRule(rule, values);
      expect(result.breachedConditions.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateRules — batch', () => {
    it('evaluates multiple rules and returns breaches', () => {
      const rules = [
        makeRule(threshold('revenue', '>', 400), { id: alertRuleId('r1'), name: 'High Rev' }),
        makeRule(threshold('orders', '<', 5), { id: alertRuleId('r2'), name: 'Low Orders' }),
        makeRule(threshold('revenue', '>', 1000), { id: alertRuleId('r3'), name: 'Very High' }),
      ];
      const values = new Map<string, number>([
        ['revenue', 500],
        ['orders', 10],
      ]);
      const breaches = evaluateRules(rules, values);
      expect(breaches).toHaveLength(1); // only r1 triggers
      expect(breaches[0].ruleId).toBe('r1');
    });

    it('returns empty array when no rules trigger', () => {
      const rules = [makeRule(threshold('revenue', '>', 1000))];
      const values = new Map<string, number>([['revenue', 500]]);
      expect(evaluateRules(rules, values)).toEqual([]);
    });
  });

  describe('cooldown enforcement', () => {
    it('skips evaluation if last breach within cooldownMs', () => {
      const rule = makeRule(threshold('revenue', '>', 400), {
        cooldownMs: 60000,
      });
      const values = new Map<string, number>([['revenue', 500]]);

      const existingBreaches: BreachRecord[] = [{
        id: breachId('b1'),
        ruleId: rule.id,
        artifactId: 'dash-1',
        status: 'active',
        detectedAt: Date.now() - 10000, // 10 seconds ago
        currentValue: 500,
        thresholdValue: 400,
        severity: 'warning',
        message: 'previous',
      }];

      const breaches = evaluateRules([rule], values, existingBreaches);
      expect(breaches).toHaveLength(0); // suppressed by cooldown
    });

    it('allows evaluation after cooldown expires', () => {
      const rule = makeRule(threshold('revenue', '>', 400), {
        cooldownMs: 60000,
      });
      const values = new Map<string, number>([['revenue', 500]]);

      const existingBreaches: BreachRecord[] = [{
        id: breachId('b1'),
        ruleId: rule.id,
        artifactId: 'dash-1',
        status: 'active',
        detectedAt: Date.now() - 120000, // 2 minutes ago, past cooldown
        currentValue: 500,
        thresholdValue: 400,
        severity: 'warning',
        message: 'old',
      }];

      const breaches = evaluateRules([rule], values, existingBreaches);
      expect(breaches).toHaveLength(1);
    });
  });

  describe('status transitions', () => {
    it('new breach has status "active"', () => {
      const rules = [makeRule(threshold('revenue', '>', 400))];
      const values = new Map<string, number>([['revenue', 500]]);
      const breaches = evaluateRules(rules, values);
      expect(breaches[0].status).toBe('active');
    });

    it('breach severity matches rule severity', () => {
      const rules = [makeRule(threshold('revenue', '>', 400), { severity: 'critical' })];
      const values = new Map<string, number>([['revenue', 500]]);
      const breaches = evaluateRules(rules, values);
      expect(breaches[0].severity).toBe('critical');
    });
  });
});
