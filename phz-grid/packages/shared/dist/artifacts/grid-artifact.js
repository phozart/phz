/**
 * @phozart/shared — Grid Definitions as First-Class Artifacts (A-1.04)
 *
 * Enables grids to be saved, cataloged, and navigated to just like
 * reports and dashboards. A GridArtifact wraps the grid configuration
 * with artifact metadata.
 *
 * Extracted from workspace/navigation/grid-artifact.ts.
 */
// ========================================================================
// Type guard
// ========================================================================
export function isGridArtifact(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.id === 'string' &&
        o.type === 'grid-definition' &&
        typeof o.name === 'string' &&
        typeof o.dataSourceId === 'string' &&
        Array.isArray(o.columns));
}
// ========================================================================
// Factory
// ========================================================================
let counter = 0;
function generateId() {
    return `grid_${Date.now()}_${++counter}`;
}
export function createGridArtifact(input) {
    const now = Date.now();
    return {
        id: input.id ?? generateId(),
        type: 'grid-definition',
        name: input.name,
        description: input.description,
        dataSourceId: input.dataSourceId,
        columns: [...input.columns],
        defaultSort: input.defaultSort ? [...input.defaultSort] : undefined,
        defaultFilters: input.defaultFilters ? { ...input.defaultFilters } : undefined,
        density: input.density,
        enableGrouping: input.enableGrouping,
        enableExport: input.enableExport,
        createdAt: now,
        updatedAt: now,
    };
}
// ========================================================================
// Convert to ArtifactMeta (for catalog)
// ========================================================================
export function gridArtifactToMeta(artifact) {
    return {
        id: artifact.id,
        type: 'grid-definition',
        name: artifact.name,
        description: artifact.description,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
    };
}
//# sourceMappingURL=grid-artifact.js.map