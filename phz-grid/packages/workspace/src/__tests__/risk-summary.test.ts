import { describe, it, expect } from 'vitest';
import {
  computeRiskSummary,
  type RiskSummaryConfig,
  type RiskSummaryData,
} from '../alerts/risk-summary-widget.js';
import type { BreachRecord } from '../types.js';
import { breachId, alertRuleId } from '../types.js';

function makeBreach(severity: BreachRecord['severity'], overrides?: Partial<BreachRecord>): BreachRecord {
  return {
    id: breachId('b-' + Math.random().toString(36).slice(2)),
    ruleId: alertRuleId('rule-1'),
    artifactId: 'dash-1',
    status: 'active',
    detectedAt: Date.now(),
    currentValue: 100,
    thresholdValue: 50,
    severity,
    message: `${severity} breach`,
    ...overrides,
  };
}

describe('RiskSummaryWidget', () => {
  describe('computeRiskSummary', () => {
    it('returns zero counts for empty breaches', () => {
      const summary = computeRiskSummary([]);
      expect(summary.totalActive).toBe(0);
      expect(summary.bySeverity.critical).toBe(0);
      expect(summary.bySeverity.warning).toBe(0);
      expect(summary.bySeverity.info).toBe(0);
      expect(summary.highestSeverity).toBeUndefined();
    });

    it('counts breaches by severity', () => {
      const breaches = [
        makeBreach('critical'),
        makeBreach('warning'),
        makeBreach('warning'),
        makeBreach('info'),
      ];
      const summary = computeRiskSummary(breaches);
      expect(summary.totalActive).toBe(4);
      expect(summary.bySeverity.critical).toBe(1);
      expect(summary.bySeverity.warning).toBe(2);
      expect(summary.bySeverity.info).toBe(1);
    });

    it('identifies highest severity', () => {
      expect(computeRiskSummary([makeBreach('critical')]).highestSeverity).toBe('critical');
      expect(computeRiskSummary([makeBreach('warning')]).highestSeverity).toBe('warning');
      expect(computeRiskSummary([makeBreach('info')]).highestSeverity).toBe('info');
    });

    it('critical trumps warning and info', () => {
      const breaches = [
        makeBreach('info'),
        makeBreach('warning'),
        makeBreach('critical'),
      ];
      expect(computeRiskSummary(breaches).highestSeverity).toBe('critical');
    });

    it('warning trumps info', () => {
      const breaches = [
        makeBreach('info'),
        makeBreach('warning'),
      ];
      expect(computeRiskSummary(breaches).highestSeverity).toBe('warning');
    });

    it('only counts active breaches', () => {
      const breaches = [
        makeBreach('critical', { status: 'active' }),
        makeBreach('warning', { status: 'resolved' }),
        makeBreach('info', { status: 'acknowledged' }),
      ];
      const summary = computeRiskSummary(breaches);
      expect(summary.totalActive).toBe(1);
      expect(summary.bySeverity.critical).toBe(1);
      expect(summary.bySeverity.warning).toBe(0);
    });

    it('includes list of affected artifact IDs', () => {
      const breaches = [
        makeBreach('warning', { artifactId: 'dash-1' }),
        makeBreach('warning', { artifactId: 'dash-2' }),
        makeBreach('info', { artifactId: 'dash-1' }),
      ];
      const summary = computeRiskSummary(breaches);
      expect(summary.affectedArtifacts).toContain('dash-1');
      expect(summary.affectedArtifacts).toContain('dash-2');
      expect(summary.affectedArtifacts).toHaveLength(2);
    });
  });
});
