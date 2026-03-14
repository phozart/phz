/**
 * @phozart/engine — Anomaly Detection
 *
 * Detect anomalies in time series data using statistical methods:
 * Z-score, IQR (interquartile range), and moving average deviation.
 */
export type AnomalyMethod = 'zscore' | 'iqr' | 'moving_avg';
export type AnomalySeverity = 'warning' | 'critical';
export interface AnomalyConfig {
    method: AnomalyMethod;
    /** Z-score: number of standard deviations (default 2) */
    sigma?: number;
    /** IQR: multiplier for IQR range (default 1.5) */
    multiplier?: number;
    /** Moving avg: window size (default 5) */
    windowSize?: number;
    /** Moving avg: how many std-devs from moving average to flag (default 2) */
    threshold?: number;
}
export interface AnomalyResult {
    index: number;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: AnomalySeverity;
}
export type TrendDirection = 'increasing' | 'decreasing' | 'flat';
export interface TrendChange {
    index: number;
    fromTrend: TrendDirection;
    toTrend: TrendDirection;
}
export interface TrendChangeResult {
    overallTrend: TrendDirection;
    changes: TrendChange[];
}
/**
 * Detect anomalies in a time series using the configured method.
 */
export declare function detectAnomalies(series: number[], config: AnomalyConfig): AnomalyResult[];
/**
 * Detect trend changes (reversals) in a time series.
 * Uses a sliding window to compute local slopes and detect direction changes.
 */
export declare function detectTrendChange(series: number[]): TrendChangeResult;
//# sourceMappingURL=anomaly-detector.d.ts.map