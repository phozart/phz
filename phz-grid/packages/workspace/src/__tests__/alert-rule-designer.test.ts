import { describe, it, expect } from 'vitest';
import {
  buildDefaultAlertRule,
  validateAlertRule,
  buildThresholdCondition,
  buildCompoundCondition,
  type AlertRuleFormState,
} from '../alerts/phz-alert-rule-designer.js';
import type { AlertRule, SimpleThreshold, CompoundCondition } from '../types.js';
import { alertRuleId } from '../types.js';

describe('AlertRuleDesigner', () => {
  describe('buildDefaultAlertRule', () => {
    it('creates a default rule with threshold condition', () => {
      const rule = buildDefaultAlertRule('dash-1');
      expect(rule.artifactId).toBe('dash-1');
      expect(rule.condition.kind).toBe('threshold');
      expect(rule.severity).toBe('warning');
      expect(rule.enabled).toBe(true);
      expect(rule.cooldownMs).toBeGreaterThan(0);
    });

    it('generates a unique id', () => {
      const r1 = buildDefaultAlertRule('d1');
      const r2 = buildDefaultAlertRule('d1');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('validateAlertRule', () => {
    it('returns no errors for valid rule', () => {
      const rule = buildDefaultAlertRule('dash-1');
      rule.name = 'Valid Rule';
      (rule.condition as SimpleThreshold).metric = 'revenue';
      const errors = validateAlertRule(rule);
      expect(errors).toEqual([]);
    });

    it('returns error for missing name', () => {
      const rule = buildDefaultAlertRule('dash-1');
      rule.name = '';
      const errors = validateAlertRule(rule);
      expect(errors).toContain('Name is required');
    });

    it('returns error for threshold with empty metric', () => {
      const rule = buildDefaultAlertRule('dash-1');
      rule.name = 'Test';
      (rule.condition as SimpleThreshold).metric = '';
      const errors = validateAlertRule(rule);
      expect(errors.some(e => e.toLowerCase().includes('metric'))).toBe(true);
    });

    it('returns error for compound with no children', () => {
      const rule = buildDefaultAlertRule('dash-1');
      rule.name = 'Test';
      rule.condition = { kind: 'compound', op: 'AND', children: [] };
      const errors = validateAlertRule(rule);
      expect(errors.some(e => e.toLowerCase().includes('children') || e.toLowerCase().includes('condition'))).toBe(true);
    });

    it('returns error for negative cooldown', () => {
      const rule = buildDefaultAlertRule('dash-1');
      rule.name = 'Test';
      (rule.condition as SimpleThreshold).metric = 'revenue';
      rule.cooldownMs = -1;
      const errors = validateAlertRule(rule);
      expect(errors.some(e => e.toLowerCase().includes('cooldown'))).toBe(true);
    });
  });

  describe('buildThresholdCondition', () => {
    it('creates a SimpleThreshold', () => {
      const cond = buildThresholdCondition('revenue', '>', 1000);
      expect(cond.kind).toBe('threshold');
      expect(cond.metric).toBe('revenue');
      expect(cond.operator).toBe('>');
      expect(cond.value).toBe(1000);
    });
  });

  describe('buildCompoundCondition', () => {
    it('creates an AND compound condition', () => {
      const children = [
        buildThresholdCondition('revenue', '>', 1000),
        buildThresholdCondition('orders', '<', 5),
      ];
      const cond = buildCompoundCondition('AND', children);
      expect(cond.kind).toBe('compound');
      expect(cond.op).toBe('AND');
      expect(cond.children).toHaveLength(2);
    });

    it('creates an OR compound condition', () => {
      const cond = buildCompoundCondition('OR', [
        buildThresholdCondition('a', '>', 1),
      ]);
      expect(cond.op).toBe('OR');
    });

    it('creates a NOT compound condition', () => {
      const cond = buildCompoundCondition('NOT', [
        buildThresholdCondition('a', '>', 1),
      ]);
      expect(cond.op).toBe('NOT');
    });
  });
});
