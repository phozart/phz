/**
 * @phozart/phz-engine — Default Score Provider
 *
 * Built-in KPIScoreProvider that computes KPI values from raw data.
 * Supports real historical data for previousValue, trend, and breakdowns.
 * Falls back to synthetic estimates when real data is unavailable.
 */
import type { KPIScoreProvider } from './widget-resolver.js';
export interface ScoreProviderConfig {
    /** Previous period raw data — used to compute real previousValue */
    previousPeriodData?: Record<string, unknown>[];
    /** Array of period snapshots — each entry is a set of rows for that period, used for real trend */
    trendPeriods?: Record<string, unknown>[][];
}
/**
 * Create a default score provider that computes KPI scores from raw data.
 *
 * When config provides previousPeriodData or trendPeriods, real values are used.
 * Otherwise, synthetic estimates are generated and flagged with estimated: true.
 */
export declare function createDefaultScoreProvider(config?: ScoreProviderConfig): KPIScoreProvider;
//# sourceMappingURL=score-provider.d.ts.map