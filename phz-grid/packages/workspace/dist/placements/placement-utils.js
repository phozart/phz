/**
 * Pure utility functions for PlacementManager — filtering and sorting.
 */
/**
 * Filter placements by artifactId. Returns all if artifactId is undefined.
 */
export function filterPlacementsByArtifact(placements, artifactId) {
    if (!artifactId)
        return placements;
    return placements.filter(p => p.artifactId === artifactId);
}
/**
 * Sort placements by createdAt descending (newest first).
 */
export function sortPlacementsByDate(placements) {
    return [...placements].sort((a, b) => b.createdAt - a.createdAt);
}
//# sourceMappingURL=placement-utils.js.map