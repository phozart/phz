/**
 * @phozart/phz-engine — Chart Analytics Overlays
 *
 * Types and pure computation functions for chart analytics overlays:
 * reference lines, trend lines, threshold bands, average lines, and target lines.
 *
 * Regression functions use least-squares methods. All math functions
 * handle edge cases (empty arrays, single points, constant values).
 */
import type { KPIDefinition } from './kpi.js';
import type { AlertRule } from './kpi-alerting.js';
export type ChartOverlayType = 'reference-line' | 'trend-line' | 'threshold-band' | 'average-line' | 'target-line';
export type DashStyle = 'solid' | 'dashed' | 'dotted';
export interface ChartOverlay {
    id: string;
    type: ChartOverlayType;
    label?: string;
    color?: string;
    dashStyle?: DashStyle;
}
export interface ReferenceLine extends ChartOverlay {
    type: 'reference-line';
    axis: 'x' | 'y';
    value: number;
}
export interface TrendLine extends ChartOverlay {
    type: 'trend-line';
    method: 'linear' | 'exponential' | 'moving-average';
    period?: number;
    data?: {
        x: number;
        y: number;
    }[];
}
export interface ChartThresholdBand extends ChartOverlay {
    type: 'threshold-band';
    min: number;
    max: number;
    fillColor?: string;
    fillOpacity?: number;
}
export interface AverageLine extends ChartOverlay {
    type: 'average-line';
    field: string;
    scope: 'visible' | 'all';
}
export interface TargetLine extends ChartOverlay {
    type: 'target-line';
    kpiId: string;
    field?: string;
}
export interface LinearRegressionResult {
    slope: number;
    intercept: number;
    r2: number;
}
/**
 * Compute linear regression using the ordinary least-squares method.
 *
 * For n points (x_i, y_i):
 *   slope = (n * sum(x*y) - sum(x) * sum(y)) / (n * sum(x^2) - sum(x)^2)
 *   intercept = mean(y) - slope * mean(x)
 *   r2 = 1 - SS_res / SS_tot
 */
export declare function computeLinearRegression(data: {
    x: number;
    y: number;
}[]): LinearRegressionResult;
/**
 * Compute a simple moving average. Returns null for the first (period - 1)
 * items where the window is incomplete.
 *
 * Period <= 0 is treated as invalid and returns all nulls.
 */
export declare function computeMovingAverage(values: number[], period: number): (number | null)[];
export interface ExponentialRegressionResult {
    /** Coefficient: y = a * e^(b*x) */
    a: number;
    /** Exponent: y = a * e^(b*x) */
    b: number;
    /** R-squared on the log-transformed fit */
    r2: number;
}
/**
 * Compute exponential regression by ln-transforming y values,
 * performing linear regression on (x, ln(y)), then exponentiating back.
 *
 * Only uses data points where y > 0 (ln is undefined for y <= 0).
 */
export declare function computeExponentialRegression(data: {
    x: number;
    y: number;
}[]): ExponentialRegressionResult;
/**
 * Resolve the target value for a specific category from a KPI definition.
 * Uses breakdown targetOverrides when available, falls back to the KPI target.
 *
 * Returns null if the KPI definition is undefined.
 */
export declare function resolveTargetForCategory(kpiDef: KPIDefinition | undefined, _categoryField: string, categoryValue: string): number | null;
/**
 * Convert an alert rule with threshold breach config into visual
 * threshold bands for chart overlays.
 *
 * Only handles `threshold_breach` rules. Other rule types return
 * an empty array.
 */
export declare function alertRuleToThresholdBands(alertRule: AlertRule): ChartThresholdBand[];
//# sourceMappingURL=chart-overlays.d.ts.map