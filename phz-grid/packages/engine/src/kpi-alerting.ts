/**
 * @phozart/engine — KPI Alerting Engine
 *
 * Register alert rules against KPIs and evaluate them against current + historical data.
 * Alert types: threshold_breach, anomaly_detected, trend_reversal, consecutive_decline.
 */

import type { KPIId } from './types.js';
import { detectAnomalies, detectTrendChange } from './anomaly-detector.js';
import type { AnomalyMethod } from './anomaly-detector.js';

export type AlertRuleType = 'threshold_breach' | 'anomaly_detected' | 'trend_reversal' | 'consecutive_decline';
export type AlertSeverity = 'warning' | 'critical';

export interface ThresholdBreachConfig {
  operator: 'above' | 'below';
  value: number;
}

export interface AnomalyAlertConfig {
  method?: AnomalyMethod;
  sigma?: number;
}

export interface ConsecutiveDeclineConfig {
  periods: number;
}

export interface AlertRule {
  id: string;
  kpiId: KPIId;
  type: AlertRuleType;
  config: ThresholdBreachConfig | AnomalyAlertConfig | ConsecutiveDeclineConfig | Record<string, unknown>;
  severity: AlertSeverity;
}

export interface Alert {
  id: string;
  ruleId: string;
  kpiId: KPIId;
  type: AlertRuleType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  currentValue: number;
}

export interface KPIAlertEngine {
  registerAlert(rule: AlertRule): void;
  unregisterAlert(ruleId: string): void;
  getRules(kpiId: KPIId): AlertRule[];
  evaluate(kpiId: KPIId, currentValue: number, historicalData: number[]): Alert[];
  getActiveAlerts(): Alert[];
  acknowledgeAlert(alertId: string): void;
}

let alertCounter = 0;

function nextAlertId(): string {
  return `alert-${++alertCounter}`;
}

export function createKPIAlertEngine(): KPIAlertEngine {
  const rules = new Map<string, AlertRule>();
  const activeAlerts = new Map<string, Alert>();

  function evaluateThresholdBreach(rule: AlertRule, currentValue: number): Alert | null {
    const config = rule.config as ThresholdBreachConfig;
    const breached =
      (config.operator === 'below' && currentValue < config.value) ||
      (config.operator === 'above' && currentValue > config.value);

    if (!breached) return null;

    return {
      id: nextAlertId(),
      ruleId: rule.id,
      kpiId: rule.kpiId,
      type: 'threshold_breach',
      severity: rule.severity,
      message: `KPI ${rule.kpiId} value ${currentValue} is ${config.operator} threshold ${config.value}`,
      timestamp: new Date(),
      currentValue,
    };
  }

  function evaluateAnomalyDetected(rule: AlertRule, currentValue: number, historicalData: number[]): Alert | null {
    const config = rule.config as AnomalyAlertConfig;
    // Append current value to historical data and detect anomalies
    const series = [...historicalData, currentValue];
    const anomalies = detectAnomalies(series, {
      method: config.method ?? 'zscore',
      sigma: config.sigma ?? 2,
    });

    // Check if the last value (current) is flagged as anomalous
    const lastIndex = series.length - 1;
    const isAnomalous = anomalies.some(a => a.index === lastIndex);
    if (!isAnomalous) return null;

    return {
      id: nextAlertId(),
      ruleId: rule.id,
      kpiId: rule.kpiId,
      type: 'anomaly_detected',
      severity: rule.severity,
      message: `KPI ${rule.kpiId} current value ${currentValue} is anomalous relative to historical data`,
      timestamp: new Date(),
      currentValue,
    };
  }

  function evaluateTrendReversal(rule: AlertRule, _currentValue: number, historicalData: number[]): Alert | null {
    if (historicalData.length < 4) return null;

    const result = detectTrendChange(historicalData);
    if (result.changes.length === 0) return null;

    const lastChange = result.changes[result.changes.length - 1];
    return {
      id: nextAlertId(),
      ruleId: rule.id,
      kpiId: rule.kpiId,
      type: 'trend_reversal',
      severity: rule.severity,
      message: `KPI ${rule.kpiId} trend changed from ${lastChange.fromTrend} to ${lastChange.toTrend}`,
      timestamp: new Date(),
      currentValue: _currentValue,
    };
  }

  function evaluateConsecutiveDecline(rule: AlertRule, currentValue: number, historicalData: number[]): Alert | null {
    const config = rule.config as ConsecutiveDeclineConfig;
    const periods = config.periods;

    // Build the full series including current value
    const series = [...historicalData, currentValue];
    if (series.length < periods + 1) return null;

    // Check last N transitions
    let consecutiveDeclines = 0;
    for (let i = series.length - 1; i > 0; i--) {
      if (series[i] < series[i - 1]) {
        consecutiveDeclines++;
      } else {
        break;
      }
    }

    if (consecutiveDeclines < periods) return null;

    return {
      id: nextAlertId(),
      ruleId: rule.id,
      kpiId: rule.kpiId,
      type: 'consecutive_decline',
      severity: rule.severity,
      message: `KPI ${rule.kpiId} has declined for ${consecutiveDeclines} consecutive periods`,
      timestamp: new Date(),
      currentValue,
    };
  }

  return {
    registerAlert(rule: AlertRule): void {
      rules.set(rule.id, rule);
    },

    unregisterAlert(ruleId: string): void {
      rules.delete(ruleId);
    },

    getRules(kpiId: KPIId): AlertRule[] {
      return Array.from(rules.values()).filter(r => r.kpiId === kpiId);
    },

    evaluate(kpiId: KPIId, currentValue: number, historicalData: number[]): Alert[] {
      const kpiRules = this.getRules(kpiId);
      const triggered: Alert[] = [];

      for (const rule of kpiRules) {
        let alert: Alert | null = null;

        switch (rule.type) {
          case 'threshold_breach':
            alert = evaluateThresholdBreach(rule, currentValue);
            break;
          case 'anomaly_detected':
            alert = evaluateAnomalyDetected(rule, currentValue, historicalData);
            break;
          case 'trend_reversal':
            alert = evaluateTrendReversal(rule, currentValue, historicalData);
            break;
          case 'consecutive_decline':
            alert = evaluateConsecutiveDecline(rule, currentValue, historicalData);
            break;
        }

        if (alert) {
          triggered.push(alert);
          activeAlerts.set(alert.id, alert);
        }
      }

      return triggered;
    },

    getActiveAlerts(): Alert[] {
      return Array.from(activeAlerts.values());
    },

    acknowledgeAlert(alertId: string): void {
      activeAlerts.delete(alertId);
    },
  };
}
