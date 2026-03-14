/**
 * @phozart/engine — Chart Analytics Overlays
 *
 * Types and pure computation functions for chart analytics overlays:
 * reference lines, trend lines, threshold bands, average lines, and target lines.
 *
 * Regression functions use least-squares methods. All math functions
 * handle edge cases (empty arrays, single points, constant values).
 */
/**
 * Compute linear regression using the ordinary least-squares method.
 *
 * For n points (x_i, y_i):
 *   slope = (n * sum(x*y) - sum(x) * sum(y)) / (n * sum(x^2) - sum(x)^2)
 *   intercept = mean(y) - slope * mean(x)
 *   r2 = 1 - SS_res / SS_tot
 */
export function computeLinearRegression(data) {
    const n = data.length;
    if (n === 0)
        return { slope: 0, intercept: 0, r2: 0 };
    if (n === 1)
        return { slope: 0, intercept: data[0].y, r2: 0 };
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (const { x, y } of data) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
        // All x-values are the same — vertical line, slope undefined
        return { slope: 0, intercept: sumY / n, r2: 0 };
    }
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    // Compute R-squared
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    for (const { x, y } of data) {
        const predicted = slope * x + intercept;
        ssRes += (y - predicted) ** 2;
        ssTot += (y - meanY) ** 2;
    }
    // When ssTot is 0, all y-values are identical — the fit is perfect (constant line)
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    return { slope, intercept, r2 };
}
// ========================================================================
// Moving Average
// ========================================================================
/**
 * Compute a simple moving average. Returns null for the first (period - 1)
 * items where the window is incomplete.
 *
 * Period <= 0 is treated as invalid and returns all nulls.
 */
export function computeMovingAverage(values, period) {
    if (values.length === 0)
        return [];
    if (period <= 0)
        return values.map(() => null);
    const result = [];
    let windowSum = 0;
    for (let i = 0; i < values.length; i++) {
        windowSum += values[i];
        if (i < period - 1) {
            result.push(null);
        }
        else {
            if (i >= period) {
                windowSum -= values[i - period];
            }
            result.push(windowSum / period);
        }
    }
    return result;
}
/**
 * Compute exponential regression by ln-transforming y values,
 * performing linear regression on (x, ln(y)), then exponentiating back.
 *
 * Only uses data points where y > 0 (ln is undefined for y <= 0).
 */
export function computeExponentialRegression(data) {
    if (data.length === 0)
        return { a: 0, b: 0, r2: 0 };
    if (data.length === 1)
        return { a: data[0].y > 0 ? data[0].y : 0, b: 0, r2: 0 };
    // Filter to positive y-values only (ln requires y > 0)
    const positive = data.filter(d => d.y > 0);
    if (positive.length < 2) {
        return { a: positive.length === 1 ? positive[0].y : 0, b: 0, r2: 0 };
    }
    // Transform: ln(y) = ln(a) + b*x  →  linear regression on (x, ln(y))
    const logData = positive.map(d => ({ x: d.x, y: Math.log(d.y) }));
    const { slope, intercept, r2 } = computeLinearRegression(logData);
    return {
        a: Math.exp(intercept),
        b: slope,
        r2,
    };
}
// ========================================================================
// Target Resolution
// ========================================================================
/**
 * Resolve the target value for a specific category from a KPI definition.
 * Uses breakdown targetOverrides when available, falls back to the KPI target.
 *
 * Returns null if the KPI definition is undefined.
 */
export function resolveTargetForCategory(kpiDef, _categoryField, categoryValue) {
    if (!kpiDef)
        return null;
    const breakdown = kpiDef.breakdowns?.find(b => b.id === categoryValue);
    if (breakdown?.targetOverride !== undefined) {
        return breakdown.targetOverride;
    }
    return kpiDef.target;
}
// ========================================================================
// Alert Rule → Threshold Bands
// ========================================================================
const SEVERITY_COLORS = {
    warning: 'rgba(234, 179, 8, 0.15)',
    critical: 'rgba(220, 38, 38, 0.15)',
};
/**
 * Convert an alert rule with threshold breach config into visual
 * threshold bands for chart overlays.
 *
 * Only handles `threshold_breach` rules. Other rule types return
 * an empty array.
 */
export function alertRuleToThresholdBands(alertRule) {
    if (alertRule.type !== 'threshold_breach')
        return [];
    const config = alertRule.config;
    const fillColor = SEVERITY_COLORS[alertRule.severity];
    const band = {
        id: `alert-band-${alertRule.id}`,
        type: 'threshold-band',
        label: `Alert: ${alertRule.severity}`,
        min: config.operator === 'below' ? -Infinity : config.value,
        max: config.operator === 'below' ? config.value : Infinity,
        fillColor,
        fillOpacity: 0.15,
    };
    return [band];
}
//# sourceMappingURL=chart-overlays.js.map