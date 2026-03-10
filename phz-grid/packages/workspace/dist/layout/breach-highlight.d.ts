/**
 * @phozart/phz-workspace — Breach Highlight (L.8)
 *
 * CSS class helpers and breach bar data for dashboard breach visualization.
 */
import type { BreachRecord } from '../types.js';
type Severity = BreachRecord['severity'];
export declare function getBreachSeverityCSS(severity: Severity): string;
export interface BreachBarData {
    critical: number;
    warning: number;
    info: number;
    total: number;
}
export declare function computeBreachBarData(breaches: BreachRecord[]): BreachBarData;
export declare function shouldPulse(severity: Severity): boolean;
export {};
//# sourceMappingURL=breach-highlight.d.ts.map