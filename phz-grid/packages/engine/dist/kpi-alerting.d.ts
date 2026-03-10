/**
 * @phozart/phz-engine — KPI Alerting Engine
 *
 * Register alert rules against KPIs and evaluate them against current + historical data.
 * Alert types: threshold_breach, anomaly_detected, trend_reversal, consecutive_decline.
 */
import type { KPIId } from './types.js';
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
export declare function createKPIAlertEngine(): KPIAlertEngine;
//# sourceMappingURL=kpi-alerting.d.ts.map