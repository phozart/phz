/**
 * Catalog Breach Count (L.7)
 *
 * Pure utility functions for computing and displaying breach counts
 * per artifact in the catalog browser.
 */
import type { BreachRecord } from '../types.js';
export interface ArtifactBreachCounts {
    total: number;
    highestSeverity: BreachRecord['severity'];
    bySeverity: {
        info: number;
        warning: number;
        critical: number;
    };
}
export interface BreachBadge {
    count: number;
    severity: BreachRecord['severity'];
    label: string;
}
export declare function countBreachesByArtifact(breaches: BreachRecord[]): Map<string, ArtifactBreachCounts>;
export declare function sortByBreachCount(artifactIds: string[], counts: Map<string, ArtifactBreachCounts>): string[];
export declare function getBreachBadge(counts: Map<string, ArtifactBreachCounts>, artifactId: string): BreachBadge | null;
//# sourceMappingURL=breach-count.d.ts.map