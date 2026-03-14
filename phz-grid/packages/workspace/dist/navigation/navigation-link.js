/**
 * @phozart/workspace — NavigationLink (V.1)
 *
 * Defines cross-artifact drill-through navigation links.
 * A NavigationLink connects a source artifact (e.g. dashboard) to a
 * target artifact (e.g. report), optionally mapping filter values
 * from the source context to the target's filter definitions.
 */
// ========================================================================
// Type guard
// ========================================================================
export function isNavigationLink(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.id === 'string' &&
        typeof o.sourceArtifactId === 'string' &&
        typeof o.targetArtifactId === 'string' &&
        typeof o.targetArtifactType === 'string' &&
        typeof o.label === 'string' &&
        Array.isArray(o.filterMappings));
}
// ========================================================================
// Factory
// ========================================================================
let counter = 0;
function generateId() {
    return `nl_${Date.now()}_${++counter}`;
}
export function createNavigationLink(input) {
    return {
        id: input.id ?? generateId(),
        sourceArtifactId: input.sourceArtifactId,
        targetArtifactId: input.targetArtifactId,
        targetArtifactType: input.targetArtifactType,
        label: input.label,
        description: input.description,
        filterMappings: input.filterMappings ? [...input.filterMappings] : [],
        openBehavior: input.openBehavior ?? 'same-panel',
        icon: input.icon,
    };
}
// ========================================================================
// Filter resolution
// ========================================================================
export function resolveNavigationFilters(mappings, sourceValues) {
    const result = {};
    for (const mapping of mappings) {
        const value = sourceValues[mapping.sourceField];
        if (value === undefined)
            continue;
        // For now, passthrough is the primary transform. Lookup and expression
        // transforms are resolved at the data layer.
        result[mapping.targetFilterDefinitionId] = value;
    }
    return result;
}
// ========================================================================
// Circular link detection (DFS cycle detection)
// ========================================================================
export function detectCircularLinks(links) {
    // Build adjacency list
    const graph = new Map();
    for (const link of links) {
        const existing = graph.get(link.sourceArtifactId) ?? [];
        existing.push(link.targetArtifactId);
        graph.set(link.sourceArtifactId, existing);
    }
    const cycles = [];
    const visited = new Set();
    const inStack = new Set();
    const path = [];
    function dfs(node) {
        if (inStack.has(node)) {
            // Found a cycle — extract it from the path
            const cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                cycles.push([...path.slice(cycleStart), node]);
            }
            else {
                cycles.push([node]);
            }
            return;
        }
        if (visited.has(node))
            return;
        visited.add(node);
        inStack.add(node);
        path.push(node);
        const neighbors = graph.get(node) ?? [];
        for (const neighbor of neighbors) {
            dfs(neighbor);
        }
        path.pop();
        inStack.delete(node);
    }
    for (const node of graph.keys()) {
        dfs(node);
    }
    return cycles;
}
//# sourceMappingURL=navigation-link.js.map