/**
 * @phozart/phz-workspace — Risk Summary Widget (N.3)
 *
 * Pure functions for computing risk summaries from breaches
 * and generating visual breach indicator CSS.
 */
import type { BreachRecord } from '../types.js';
export interface RiskSummaryConfig {
    showBySeverity: boolean;
    showAffectedArtifacts: boolean;
}
export interface RiskSummaryData {
    totalActive: number;
    bySeverity: {
        critical: number;
        warning: number;
        info: number;
    };
    highestSeverity: BreachRecord['severity'] | undefined;
    affectedArtifacts: string[];
}
export interface BreachIndicatorConfig {
    className: string;
}
export declare function computeRiskSummary(breaches: BreachRecord[]): RiskSummaryData;
export declare function withBreachIndicator(severity: BreachRecord['severity'] | undefined): BreachIndicatorConfig;
export declare function getBreachBorderCSS(severity: BreachRecord['severity'] | undefined): string;
export declare function getBreachGlowCSS(severity: BreachRecord['severity'] | undefined): string;
//# sourceMappingURL=risk-summary-widget.d.ts.map