/**
 * @phozart/phz-engine — Status Engine
 *
 * Core classification: given a value and a KPI definition, compute status and delta.
 */
import type { StatusLevel } from './types.js';
import type { KPIDefinition, KPIScoreResponse } from './kpi.js';
import type { ThresholdBand } from './expression-types.js';
export interface StatusResult {
    level: StatusLevel;
    color: string;
    label: string;
    icon: 'circle' | 'diamond' | 'triangle';
}
export interface Delta {
    value: number;
    direction: 'improving' | 'declining';
    unit: string;
}
export interface ClassifiedBreakdown {
    breakdownId: string;
    value: number;
    previousValue?: number;
    status: StatusResult;
    delta?: Delta;
}
export interface ClassifiedScore {
    kpiId: string;
    value: number;
    status: StatusResult;
    delta?: Delta;
    breakdowns?: ClassifiedBreakdown[];
}
export declare const STATUS_COLORS: Record<StatusLevel, string>;
export declare const STATUS_ICONS: Record<StatusLevel, 'circle' | 'diamond' | 'triangle'>;
/**
 * Compute the status level for a value given a KPI definition.
 *
 * higher_is_better: value >= ok → ok, value >= warn → warn, else → crit
 * lower_is_better: value <= ok → ok, value <= warn → warn, else → crit
 */
/**
 * Resolve a threshold band's upTo value given parameter and metric values.
 */
export declare function resolveThresholdValue(source: ThresholdBand['upTo'], paramValues?: Record<string, unknown>, metricValues?: Record<string, number | null>): number | null;
/**
 * Compute status using custom threshold bands.
 * Bands must be ordered from lowest upTo to highest.
 * The value falls into the first band where value <= resolvedUpTo.
 */
export declare function computeStatusFromBands(value: number, bands: ThresholdBand[], paramValues?: Record<string, unknown>, metricValues?: Record<string, number | null>): StatusResult;
export declare function computeStatus(value: number | null | undefined, kpi: KPIDefinition, paramValues?: Record<string, unknown>, metricValues?: Record<string, number | null>): StatusResult;
/**
 * Compute delta between current and previous values.
 */
export declare function computeDelta(current: number, previous: number, kpi: KPIDefinition): Delta;
/**
 * Classify a full KPI score response: applies status + delta to overall and each breakdown.
 */
export declare function classifyKPIScore(score: KPIScoreResponse, kpi: KPIDefinition): ClassifiedScore;
//# sourceMappingURL=status.d.ts.map