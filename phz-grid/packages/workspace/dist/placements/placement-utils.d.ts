/**
 * Pure utility functions for PlacementManager — filtering and sorting.
 */
import type { PlacementRecord } from '../placement.js';
/**
 * Filter placements by artifactId. Returns all if artifactId is undefined.
 */
export declare function filterPlacementsByArtifact(placements: PlacementRecord[], artifactId: string | undefined): PlacementRecord[];
/**
 * Sort placements by createdAt descending (newest first).
 */
export declare function sortPlacementsByDate(placements: PlacementRecord[]): PlacementRecord[];
//# sourceMappingURL=placement-utils.d.ts.map