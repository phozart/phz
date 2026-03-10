import { describe, it, expect } from 'vitest';
import {
  createRenderContext,
  filterBreachesForWidget,
  type ExtendedRenderContext,
} from '../alerts/render-context-ext.js';
import type { ActiveBreach, BreachRecord, AlertRule } from '../types.js';
import { breachId, alertRuleId } from '../types.js';

function makeBreach(widgetId: string | undefined, severity: BreachRecord['severity'] = 'warning'): ActiveBreach {
  return {
    breach: {
      id: breachId('b-' + Math.random().toString(36).slice(2)),
      ruleId: alertRuleId('rule-1'),
      artifactId: 'dash-1',
      widgetId,
      status: 'active',
      detectedAt: Date.now(),
      currentValue: 100,
      thresholdValue: 50,
      severity,
      message: 'breach',
    },
    rule: {
      id: alertRuleId('rule-1'),
      name: 'Test Rule',
      description: '',
      artifactId: 'dash-1',
      condition: { kind: 'threshold', metric: 'revenue', operator: '>', value: 50 },
      severity,
      cooldownMs: 0,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}

describe('RenderContext Breaches (N.4)', () => {
  describe('createRenderContext', () => {
    it('creates context with breaches defaulting to empty', () => {
      const ctx = createRenderContext({
        data: [{ id: 1 }],
        theme: { primary: '#000' },
        locale: 'en-US',
      });
      expect(ctx.breaches).toEqual([]);
      expect(ctx.data).toHaveLength(1);
    });

    it('creates context with provided breaches', () => {
      const breaches = [makeBreach('w1')];
      const ctx = createRenderContext({
        data: [],
        theme: {},
        locale: 'en-US',
        breaches,
      });
      expect(ctx.breaches).toHaveLength(1);
    });

    it('preserves existing RenderContext fields', () => {
      const ctx = createRenderContext({
        data: [{ x: 1 }],
        theme: { bg: '#fff' },
        locale: 'de-DE',
      });
      expect(ctx.locale).toBe('de-DE');
      expect(ctx.theme.bg).toBe('#fff');
    });
  });

  describe('filterBreachesForWidget', () => {
    it('returns breaches matching the widget id', () => {
      const breaches = [
        makeBreach('w1'),
        makeBreach('w2'),
        makeBreach('w1'),
      ];
      const filtered = filterBreachesForWidget(breaches, 'w1');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(b => b.breach.widgetId === 'w1')).toBe(true);
    });

    it('returns empty for no matching breaches', () => {
      const breaches = [makeBreach('w2')];
      expect(filterBreachesForWidget(breaches, 'w1')).toEqual([]);
    });

    it('includes breaches with no widgetId (artifact-level)', () => {
      const breaches = [
        makeBreach(undefined), // artifact-level
        makeBreach('w1'),
      ];
      const filtered = filterBreachesForWidget(breaches, 'w1');
      expect(filtered).toHaveLength(2); // widget + artifact-level
    });

    it('returns all artifact-level breaches for any widget', () => {
      const breaches = [makeBreach(undefined)];
      expect(filterBreachesForWidget(breaches, 'w1')).toHaveLength(1);
      expect(filterBreachesForWidget(breaches, 'w2')).toHaveLength(1);
    });
  });
});
