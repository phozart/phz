/**
 * Sprint U.2 — FilterRule conditional business rules
 *
 * Tests: condition evaluation (all operators), action execution,
 * priority ordering, compound conditions, viewer attribute matching.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateFilterRules,
  evaluateCondition,
  type FilterRule,
  type FilterRuleCondition,
  type FilterRuleAction,
  type FilterRuleResult,
} from '../filters/filter-rule-engine.js';
import type { ViewerContext } from '../types.js';

function makeRule(overrides: Partial<FilterRule> & Pick<FilterRule, 'conditions' | 'actions'>): FilterRule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    priority: 10,
    conditionLogic: 'and',
    enabled: true,
    ...overrides,
  };
}

describe('FilterRuleEngine (U.2)', () => {
  // ── Condition evaluation ──
  describe('evaluateCondition', () => {
    it('matches field-value eq', () => {
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-region',
        operator: 'eq',
        value: 'US',
      };
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'US' })).toBe(true);
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'EU' })).toBe(false);
    });

    it('matches field-value neq', () => {
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-region',
        operator: 'neq',
        value: 'US',
      };
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'EU' })).toBe(true);
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'US' })).toBe(false);
    });

    it('matches field-value in', () => {
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-region',
        operator: 'in',
        value: ['US', 'EU'],
      };
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'US' })).toBe(true);
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'APAC' })).toBe(false);
    });

    it('matches field-value not-in', () => {
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-region',
        operator: 'not-in',
        value: ['US', 'EU'],
      };
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'APAC' })).toBe(true);
      expect(evaluateCondition(cond, undefined, { 'fd-region': 'US' })).toBe(false);
    });

    it('matches field-value gt and lt', () => {
      const gt: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-amount',
        operator: 'gt',
        value: 100,
      };
      expect(evaluateCondition(gt, undefined, { 'fd-amount': 150 })).toBe(true);
      expect(evaluateCondition(gt, undefined, { 'fd-amount': 50 })).toBe(false);

      const lt: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-amount',
        operator: 'lt',
        value: 100,
      };
      expect(evaluateCondition(lt, undefined, { 'fd-amount': 50 })).toBe(true);
      expect(evaluateCondition(lt, undefined, { 'fd-amount': 150 })).toBe(false);
    });

    it('handles missing filter state gracefully', () => {
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-missing',
        operator: 'eq',
        value: 'X',
      };
      expect(evaluateCondition(cond, undefined, {})).toBe(false);
    });

    it('matches viewer-attribute eq', () => {
      const cond: FilterRuleCondition = {
        type: 'viewer-attribute',
        attribute: 'role',
        operator: 'eq',
        value: 'admin',
      };
      const viewer: ViewerContext = { attributes: { role: 'admin' } };
      expect(evaluateCondition(cond, viewer, {})).toBe(true);
    });

    it('matches viewer-attribute in', () => {
      const cond: FilterRuleCondition = {
        type: 'viewer-attribute',
        attribute: 'department',
        operator: 'in',
        value: ['sales', 'marketing'],
      };
      const viewer: ViewerContext = { attributes: { department: 'sales' } };
      expect(evaluateCondition(cond, viewer, {})).toBe(true);
    });

    it('returns false for viewer-attribute when no viewer', () => {
      const cond: FilterRuleCondition = {
        type: 'viewer-attribute',
        attribute: 'role',
        operator: 'eq',
        value: 'admin',
      };
      expect(evaluateCondition(cond, undefined, {})).toBe(false);
    });

    it('evaluates compound AND', () => {
      const cond: FilterRuleCondition = {
        type: 'compound',
        logic: 'and',
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
          { type: 'field-value', filterDefinitionId: 'b', operator: 'eq', value: 2 },
        ],
      };
      expect(evaluateCondition(cond, undefined, { a: 1, b: 2 })).toBe(true);
      expect(evaluateCondition(cond, undefined, { a: 1, b: 3 })).toBe(false);
    });

    it('evaluates compound OR', () => {
      const cond: FilterRuleCondition = {
        type: 'compound',
        logic: 'or',
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
          { type: 'field-value', filterDefinitionId: 'b', operator: 'eq', value: 2 },
        ],
      };
      expect(evaluateCondition(cond, undefined, { a: 1, b: 99 })).toBe(true);
      expect(evaluateCondition(cond, undefined, { a: 99, b: 99 })).toBe(false);
    });
  });

  // ── Rule evaluation ──
  describe('evaluateFilterRules', () => {
    it('returns matched rules with actions', () => {
      const rule = makeRule({
        conditions: [
          { type: 'field-value', filterDefinitionId: 'fd-region', operator: 'eq', value: 'US' },
        ],
        actions: [
          { type: 'restrict', filterDefinitionId: 'fd-state', allowedValues: ['CA', 'NY', 'TX'] },
        ],
      });
      const results = evaluateFilterRules([rule], undefined, { 'fd-region': 'US' });
      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].actions).toHaveLength(1);
      expect(results[0].actions[0].type).toBe('restrict');
    });

    it('skips disabled rules', () => {
      const rule = makeRule({
        enabled: false,
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
        ],
        actions: [{ type: 'hide', filterDefinitionId: 'b' }],
      });
      const results = evaluateFilterRules([rule], undefined, { a: 1 });
      expect(results).toHaveLength(0);
    });

    it('orders results by priority (lower = higher priority)', () => {
      const ruleHigh = makeRule({
        id: 'high',
        name: 'High Priority',
        priority: 1,
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
        ],
        actions: [{ type: 'hide', filterDefinitionId: 'x' }],
      });
      const ruleLow = makeRule({
        id: 'low',
        name: 'Low Priority',
        priority: 100,
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
        ],
        actions: [{ type: 'hide', filterDefinitionId: 'y' }],
      });

      const results = evaluateFilterRules([ruleLow, ruleHigh], undefined, { a: 1 });
      expect(results[0].ruleId).toBe('high');
      expect(results[1].ruleId).toBe('low');
    });

    it('supports OR condition logic', () => {
      const rule = makeRule({
        conditionLogic: 'or',
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
          { type: 'field-value', filterDefinitionId: 'b', operator: 'eq', value: 2 },
        ],
        actions: [{ type: 'force', filterDefinitionId: 'c', value: 'forced' }],
      });
      // Only 'a' matches, but OR logic should trigger
      const results = evaluateFilterRules([rule], undefined, { a: 1, b: 99 });
      expect(results[0].matched).toBe(true);
    });

    it('supports AND condition logic (default)', () => {
      const rule = makeRule({
        conditions: [
          { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 },
          { type: 'field-value', filterDefinitionId: 'b', operator: 'eq', value: 2 },
        ],
        actions: [{ type: 'force', filterDefinitionId: 'c', value: 'forced' }],
      });
      // Only 'a' matches, AND logic should not trigger
      const results = evaluateFilterRules([rule], undefined, { a: 1, b: 99 });
      expect(results[0].matched).toBe(false);
    });

    it('handles multiple rules applying', () => {
      const rules = [
        makeRule({
          id: 'r1', name: 'R1', priority: 1,
          conditions: [{ type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 }],
          actions: [{ type: 'restrict', filterDefinitionId: 'x', allowedValues: ['A'] }],
        }),
        makeRule({
          id: 'r2', name: 'R2', priority: 2,
          conditions: [{ type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 }],
          actions: [{ type: 'disable', filterDefinitionId: 'y', message: 'Disabled by r2' }],
        }),
      ];
      const results = evaluateFilterRules(rules, undefined, { a: 1 });
      expect(results.filter(r => r.matched)).toHaveLength(2);
    });

    it('works with viewer context conditions', () => {
      const rule = makeRule({
        conditions: [
          { type: 'viewer-attribute', attribute: 'role', operator: 'eq', value: 'restricted' },
        ],
        actions: [
          { type: 'restrict', filterDefinitionId: 'fd-region', allowedValues: ['US'] },
        ],
      });
      const viewer: ViewerContext = { attributes: { role: 'restricted' } };
      const results = evaluateFilterRules([rule], viewer, {});
      expect(results[0].matched).toBe(true);
    });
  });
});
