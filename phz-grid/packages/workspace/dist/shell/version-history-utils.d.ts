/**
 * @phozart/workspace — Version History Utils (L.17)
 *
 * Formatting and diff utilities for the version history panel.
 */
import type { VersionSummary } from '../workspace-adapter.js';
export interface VersionSummaryDisplay {
    version: number;
    savedAt: number;
    savedBy?: string;
    changeDescription?: string;
    timeAgo: string;
}
export declare function formatVersionSummary(summary: VersionSummary, now?: number): VersionSummaryDisplay;
export declare function computeChangeSummary(previous: Record<string, unknown>, current: Record<string, unknown>): string[];
//# sourceMappingURL=version-history-utils.d.ts.map