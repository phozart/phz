/**
 * @phozart/phz-engine — KPI Alerting Engine
 *
 * Register alert rules against KPIs and evaluate them against current + historical data.
 * Alert types: threshold_breach, anomaly_detected, trend_reversal, consecutive_decline.
 */
import { detectAnomalies, detectTrendChange } from './anomaly-detector.js';
let alertCounter = 0;
function nextAlertId() {
    return `alert-${++alertCounter}`;
}
export function createKPIAlertEngine() {
    const rules = new Map();
    const activeAlerts = new Map();
    function evaluateThresholdBreach(rule, currentValue) {
        const config = rule.config;
        const breached = (config.operator === 'below' && currentValue < config.value) ||
            (config.operator === 'above' && currentValue > config.value);
        if (!breached)
            return null;
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
    function evaluateAnomalyDetected(rule, currentValue, historicalData) {
        const config = rule.config;
        // Append current value to historical data and detect anomalies
        const series = [...historicalData, currentValue];
        const anomalies = detectAnomalies(series, {
            method: config.method ?? 'zscore',
            sigma: config.sigma ?? 2,
        });
        // Check if the last value (current) is flagged as anomalous
        const lastIndex = series.length - 1;
        const isAnomalous = anomalies.some(a => a.index === lastIndex);
        if (!isAnomalous)
            return null;
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
    function evaluateTrendReversal(rule, _currentValue, historicalData) {
        if (historicalData.length < 4)
            return null;
        const result = detectTrendChange(historicalData);
        if (result.changes.length === 0)
            return null;
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
    function evaluateConsecutiveDecline(rule, currentValue, historicalData) {
        const config = rule.config;
        const periods = config.periods;
        // Build the full series including current value
        const series = [...historicalData, currentValue];
        if (series.length < periods + 1)
            return null;
        // Check last N transitions
        let consecutiveDeclines = 0;
        for (let i = series.length - 1; i > 0; i--) {
            if (series[i] < series[i - 1]) {
                consecutiveDeclines++;
            }
            else {
                break;
            }
        }
        if (consecutiveDeclines < periods)
            return null;
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
        registerAlert(rule) {
            rules.set(rule.id, rule);
        },
        unregisterAlert(ruleId) {
            rules.delete(ruleId);
        },
        getRules(kpiId) {
            return Array.from(rules.values()).filter(r => r.kpiId === kpiId);
        },
        evaluate(kpiId, currentValue, historicalData) {
            const kpiRules = this.getRules(kpiId);
            const triggered = [];
            for (const rule of kpiRules) {
                let alert = null;
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
        getActiveAlerts() {
            return Array.from(activeAlerts.values());
        },
        acknowledgeAlert(alertId) {
            activeAlerts.delete(alertId);
        },
    };
}
//# sourceMappingURL=kpi-alerting.js.map