/**
 * @phozart/phz-engine — KPI Alerting Tests (TDD: RED phase)
 */
import { describe, it, expect } from 'vitest';
import {
  createKPIAlertEngine,
  type AlertRule,
  type Alert,
  type AlertRuleType,
} from '../kpi-alerting.js';
import type { KPIId } from '../types.js';
import { kpiId } from '../types.js';

const testKpiId = kpiId('revenue') as KPIId;
const testKpiId2 = kpiId('churn') as KPIId;

describe('KPIAlertEngine', () => {
  describe('registerAlert', () => {
    it('registers a threshold breach rule', () => {
      const engine = createKPIAlertEngine();
      const rule: AlertRule = {
        id: 'rule-1',
        kpiId: testKpiId,
        type: 'threshold_breach',
        config: { operator: 'below', value: 100 },
        severity: 'critical',
      };
      engine.registerAlert(rule);
      expect(engine.getRules(testKpiId)).toHaveLength(1);
    });

    it('registers an anomaly detected rule', () => {
      const engine = createKPIAlertEngine();
      const rule: AlertRule = {
        id: 'rule-2',
        kpiId: testKpiId,
        type: 'anomaly_detected',
        config: { method: 'zscore', sigma: 2 },
        severity: 'warning',
      };
      engine.registerAlert(rule);
      expect(engine.getRules(testKpiId)).toHaveLength(1);
    });

    it('registers a trend reversal rule', () => {
      const engine = createKPIAlertEngine();
      const rule: AlertRule = {
        id: 'rule-3',
        kpiId: testKpiId,
        type: 'trend_reversal',
        config: {},
        severity: 'warning',
      };
      engine.registerAlert(rule);
      expect(engine.getRules(testKpiId)).toHaveLength(1);
    });

    it('registers a consecutive decline rule', () => {
      const engine = createKPIAlertEngine();
      const rule: AlertRule = {
        id: 'rule-4',
        kpiId: testKpiId,
        type: 'consecutive_decline',
        config: { periods: 3 },
        severity: 'warning',
      };
      engine.registerAlert(rule);
      expect(engine.getRules(testKpiId)).toHaveLength(1);
    });

    it('registers multiple rules for the same KPI', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({ id: 'r1', kpiId: testKpiId, type: 'threshold_breach', config: { operator: 'below', value: 100 }, severity: 'critical' });
      engine.registerAlert({ id: 'r2', kpiId: testKpiId, type: 'anomaly_detected', config: { method: 'zscore' }, severity: 'warning' });
      expect(engine.getRules(testKpiId)).toHaveLength(2);
    });

    it('can unregister a rule', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({ id: 'r1', kpiId: testKpiId, type: 'threshold_breach', config: { operator: 'below', value: 100 }, severity: 'critical' });
      engine.unregisterAlert('r1');
      expect(engine.getRules(testKpiId)).toHaveLength(0);
    });
  });

  describe('evaluate — threshold_breach', () => {
    it('triggers alert when value is below threshold', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'threshold_breach',
        config: { operator: 'below', value: 100 },
        severity: 'critical',
      });
      const alerts = engine.evaluate(testKpiId, 80, [90, 95, 100, 105]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].ruleId).toBe('r1');
      expect(alerts[0].type).toBe('threshold_breach');
      expect(alerts[0].severity).toBe('critical');
    });

    it('does not trigger when value is above threshold', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'threshold_breach',
        config: { operator: 'below', value: 100 },
        severity: 'critical',
      });
      const alerts = engine.evaluate(testKpiId, 120, [90, 95, 100, 105]);
      expect(alerts).toHaveLength(0);
    });

    it('triggers alert when value is above threshold (operator=above)', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'threshold_breach',
        config: { operator: 'above', value: 100 },
        severity: 'warning',
      });
      const alerts = engine.evaluate(testKpiId, 120, []);
      expect(alerts).toHaveLength(1);
    });
  });

  describe('evaluate — anomaly_detected', () => {
    it('triggers alert when current value is anomalous in historical context', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'anomaly_detected',
        config: { method: 'zscore', sigma: 2 },
        severity: 'warning',
      });
      // Historical data is stable around 10, current value is 50
      const alerts = engine.evaluate(testKpiId, 50, [10, 12, 11, 13, 10, 12, 11, 14, 10, 13]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('anomaly_detected');
    });

    it('does not trigger for normal values', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'anomaly_detected',
        config: { method: 'zscore', sigma: 2 },
        severity: 'warning',
      });
      const alerts = engine.evaluate(testKpiId, 12, [10, 12, 11, 13, 10, 12, 11, 14, 10, 13]);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('evaluate — trend_reversal', () => {
    it('triggers alert when historical data shows trend reversal', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'trend_reversal',
        config: {},
        severity: 'warning',
      });
      // Was going up, now going down
      const alerts = engine.evaluate(testKpiId, 3, [1, 2, 3, 4, 5, 4, 3]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('trend_reversal');
    });

    it('does not trigger when trend is consistent', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'trend_reversal',
        config: {},
        severity: 'warning',
      });
      const alerts = engine.evaluate(testKpiId, 11, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('evaluate — consecutive_decline', () => {
    it('triggers alert when N consecutive declines detected', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'consecutive_decline',
        config: { periods: 3 },
        severity: 'warning',
      });
      // Last 3 values: 10, 8, 6 — plus current 4 = 4 consecutive declines
      const alerts = engine.evaluate(testKpiId, 4, [15, 14, 10, 8, 6]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('consecutive_decline');
    });

    it('does not trigger when declines are less than N', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'consecutive_decline',
        config: { periods: 5 },
        severity: 'warning',
      });
      const alerts = engine.evaluate(testKpiId, 9, [15, 14, 10, 8, 6]);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('getActiveAlerts', () => {
    it('returns all triggered alerts across KPIs', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({ id: 'r1', kpiId: testKpiId, type: 'threshold_breach', config: { operator: 'below', value: 100 }, severity: 'critical' });
      engine.registerAlert({ id: 'r2', kpiId: testKpiId2, type: 'threshold_breach', config: { operator: 'above', value: 50 }, severity: 'warning' });

      engine.evaluate(testKpiId, 80, []);
      engine.evaluate(testKpiId2, 60, []);

      const active = engine.getActiveAlerts();
      expect(active).toHaveLength(2);
    });

    it('returns empty array when no alerts triggered', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({ id: 'r1', kpiId: testKpiId, type: 'threshold_breach', config: { operator: 'below', value: 100 }, severity: 'critical' });
      engine.evaluate(testKpiId, 150, []);
      expect(engine.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('acknowledgeAlert', () => {
    it('removes alert from active list', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({ id: 'r1', kpiId: testKpiId, type: 'threshold_breach', config: { operator: 'below', value: 100 }, severity: 'critical' });
      engine.evaluate(testKpiId, 80, []);

      const active = engine.getActiveAlerts();
      expect(active).toHaveLength(1);
      const alertId = active[0].id;

      engine.acknowledgeAlert(alertId);
      expect(engine.getActiveAlerts()).toHaveLength(0);
    });

    it('does nothing for non-existent alert id', () => {
      const engine = createKPIAlertEngine();
      expect(() => engine.acknowledgeAlert('nonexistent')).not.toThrow();
    });
  });

  describe('evaluate with no rules', () => {
    it('returns empty array when no rules registered for KPI', () => {
      const engine = createKPIAlertEngine();
      const alerts = engine.evaluate(testKpiId, 100, []);
      expect(alerts).toEqual([]);
    });
  });

  describe('alert metadata', () => {
    it('includes timestamp and message in alert', () => {
      const engine = createKPIAlertEngine();
      engine.registerAlert({
        id: 'r1',
        kpiId: testKpiId,
        type: 'threshold_breach',
        config: { operator: 'below', value: 100 },
        severity: 'critical',
      });
      const alerts = engine.evaluate(testKpiId, 50, []);
      expect(alerts[0].timestamp).toBeInstanceOf(Date);
      expect(typeof alerts[0].message).toBe('string');
      expect(alerts[0].message.length).toBeGreaterThan(0);
    });
  });
});
