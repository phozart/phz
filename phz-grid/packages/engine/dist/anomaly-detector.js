/**
 * @phozart/engine — Anomaly Detection
 *
 * Detect anomalies in time series data using statistical methods:
 * Z-score, IQR (interquartile range), and moving average deviation.
 */
function mean(nums) {
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function stdDev(nums, avg) {
    const variance = nums.reduce((sum, v) => sum + (v - avg) ** 2, 0) / nums.length;
    return Math.sqrt(variance);
}
function classifySeverity(deviation, threshold) {
    // Critical if deviation exceeds 1.5x the threshold
    return deviation >= threshold * 1.5 ? 'critical' : 'warning';
}
function filterValid(series) {
    const values = [];
    const indices = [];
    for (let i = 0; i < series.length; i++) {
        const v = series[i];
        if (v !== null && v !== undefined && typeof v === 'number' && !isNaN(v)) {
            values.push(v);
            indices.push(i);
        }
    }
    return { values, indices };
}
function detectZScore(series, sigma) {
    const { values, indices } = filterValid(series);
    if (values.length < 3)
        return [];
    const avg = mean(values);
    const sd = stdDev(values, avg);
    if (sd === 0)
        return [];
    const results = [];
    for (let i = 0; i < values.length; i++) {
        const zScore = Math.abs(values[i] - avg) / sd;
        if (zScore > sigma) {
            results.push({
                index: indices[i],
                value: values[i],
                expectedValue: avg,
                deviation: zScore,
                severity: classifySeverity(zScore, sigma),
            });
        }
    }
    return results;
}
function percentile(sorted, p) {
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
function detectIQR(series, multiplier) {
    const { values, indices } = filterValid(series);
    if (values.length < 3)
        return [];
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = percentile(sorted, 0.25);
    const q3 = percentile(sorted, 0.75);
    const iqr = q3 - q1;
    if (iqr === 0)
        return [];
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    const median = percentile(sorted, 0.5);
    const results = [];
    for (let i = 0; i < values.length; i++) {
        if (values[i] < lowerBound || values[i] > upperBound) {
            const deviation = Math.abs(values[i] - median) / iqr;
            results.push({
                index: indices[i],
                value: values[i],
                expectedValue: median,
                deviation,
                severity: classifySeverity(deviation, multiplier),
            });
        }
    }
    return results;
}
function detectMovingAvgDeviation(series, windowSize, threshold) {
    const { values, indices } = filterValid(series);
    if (values.length < 3)
        return [];
    const results = [];
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = values.slice(start, i + 1);
        // For first element, skip if window too small
        if (window.length < 2 && i > 0)
            continue;
        // Use the preceding window (excluding current) for expected value
        const precedingStart = Math.max(0, i - windowSize);
        const preceding = values.slice(precedingStart, i);
        if (preceding.length === 0)
            continue;
        const avg = mean(preceding);
        const sd = stdDev(preceding, avg);
        if (sd === 0)
            continue;
        const zScore = Math.abs(values[i] - avg) / sd;
        if (zScore > threshold) {
            results.push({
                index: indices[i],
                value: values[i],
                expectedValue: avg,
                deviation: zScore,
                severity: classifySeverity(zScore, threshold),
            });
        }
    }
    return results;
}
/**
 * Detect anomalies in a time series using the configured method.
 */
export function detectAnomalies(series, config) {
    if (series.length < 3)
        return [];
    switch (config.method) {
        case 'zscore':
            return detectZScore(series, config.sigma ?? 2);
        case 'iqr':
            return detectIQR(series, config.multiplier ?? 1.5);
        case 'moving_avg':
            return detectMovingAvgDeviation(series, config.windowSize ?? 5, config.threshold ?? 2);
        default:
            return [];
    }
}
/**
 * Detect trend changes (reversals) in a time series.
 * Uses a sliding window to compute local slopes and detect direction changes.
 */
export function detectTrendChange(series) {
    if (series.length < 2) {
        return { overallTrend: 'flat', changes: [] };
    }
    // Compute direction of each segment
    const minWindow = Math.max(2, Math.floor(series.length / 4));
    function segmentTrend(start, end) {
        if (end - start < 1)
            return 'flat';
        let up = 0;
        let down = 0;
        for (let i = start + 1; i <= end; i++) {
            if (series[i] > series[i - 1])
                up++;
            else if (series[i] < series[i - 1])
                down++;
        }
        if (up > down)
            return 'increasing';
        if (down > up)
            return 'decreasing';
        return 'flat';
    }
    // Overall trend
    const overallTrend = segmentTrend(0, series.length - 1);
    // Look for trend changes by splitting into segments
    const changes = [];
    let prevTrend = null;
    for (let i = minWindow; i <= series.length - minWindow; i++) {
        const leftTrend = segmentTrend(Math.max(0, i - minWindow), i);
        const rightTrend = segmentTrend(i, Math.min(series.length - 1, i + minWindow));
        if (leftTrend !== 'flat' && rightTrend !== 'flat' && leftTrend !== rightTrend) {
            // Avoid duplicate reports for the same reversal
            if (prevTrend !== rightTrend) {
                changes.push({ index: i, fromTrend: leftTrend, toTrend: rightTrend });
                prevTrend = rightTrend;
            }
        }
    }
    return { overallTrend, changes };
}
//# sourceMappingURL=anomaly-detector.js.map