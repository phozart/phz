/**
 * Dashboard Breach Highlight (L.8) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  getBreachSeverityCSS,
  computeBreachBarData,
  shouldPulse,
} from '../layout/breach-highlight.js';
import type { BreachRecord, BreachId, AlertRuleId } from '../types.js';

function makeBreach(severity: BreachRecord['severity'], status: BreachRecord['status'] = 'active'): BreachRecord {
  return {
    id: 'b1' as BreachId,
    ruleId: 'r1' as AlertRuleId,
    artifactId: 'a1',
    status,
    detectedAt: Date.now(),
    currentValue: 100,
    thresholdValue: 50,
    severity,
    message: 'test',
  };
}

describe('Breach Highlight (L.8)', () => {
  describe('getBreachSeverityCSS', () => {
    it('returns phz-breach-info for info', () => {
      expect(getBreachSeverityCSS('info')).toBe('phz-breach-info');
    });

    it('returns phz-breach-warning for warning', () => {
      expect(getBreachSeverityCSS('warning')).toBe('phz-breach-warning');
    });

    it('returns phz-breach-critical for critical', () => {
      expect(getBreachSeverityCSS('critical')).toBe('phz-breach-critical');
    });
  });

  describe('computeBreachBarData', () => {
    it('returns zeroes for empty input', () => {
      const data = computeBreachBarData([]);
      expect(data).toEqual({ critical: 0, warning: 0, info: 0, total: 0 });
    });

    it('counts breaches by severity', () => {
      const breaches = [
        makeBreach('critical'),
        makeBreach('critical'),
        makeBreach('warning'),
        makeBreach('info'),
        makeBreach('info'),
        makeBreach('info'),
      ];
      const data = computeBreachBarData(breaches);
      expect(data.critical).toBe(2);
      expect(data.warning).toBe(1);
      expect(data.info).toBe(3);
      expect(data.total).toBe(6);
    });

    it('handles single breach', () => {
      const data = computeBreachBarData([makeBreach('warning')]);
      expect(data).toEqual({ critical: 0, warning: 1, info: 0, total: 1 });
    });
  });

  describe('shouldPulse', () => {
    it('returns true only for critical', () => {
      expect(shouldPulse('critical')).toBe(true);
    });

    it('returns false for warning', () => {
      expect(shouldPulse('warning')).toBe(false);
    });

    it('returns false for info', () => {
      expect(shouldPulse('info')).toBe(false);
    });
  });
});
