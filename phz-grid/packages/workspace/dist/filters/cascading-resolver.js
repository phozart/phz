/**
 * @phozart/workspace — Cascading Filter Resolver (O.2)
 *
 * Manages parent-child filter dependencies with topological ordering
 * and uses DataAdapter.getDistinctValues() for data-driven cascading.
 */
export function buildDependencyGraph(deps) {
    const children = new Map();
    const parents = new Map();
    const allNodes = new Set();
    for (const dep of deps) {
        allNodes.add(dep.parentFilterId);
        allNodes.add(dep.childFilterId);
        const existing = children.get(dep.parentFilterId) ?? [];
        existing.push(dep.childFilterId);
        children.set(dep.parentFilterId, existing);
        parents.set(dep.childFilterId, dep.parentFilterId);
    }
    // Topological sort using Kahn's algorithm
    const inDegree = new Map();
    for (const node of allNodes) {
        inDegree.set(node, 0);
    }
    for (const dep of deps) {
        inDegree.set(dep.childFilterId, (inDegree.get(dep.childFilterId) ?? 0) + 1);
    }
    const queue = [];
    for (const [node, degree] of inDegree) {
        if (degree === 0)
            queue.push(node);
    }
    const order = [];
    while (queue.length > 0) {
        const node = queue.shift();
        order.push(node);
        for (const child of children.get(node) ?? []) {
            const newDegree = (inDegree.get(child) ?? 1) - 1;
            inDegree.set(child, newDegree);
            if (newDegree === 0) {
                queue.push(child);
            }
        }
    }
    if (order.length !== allNodes.size) {
        throw new Error(`Cycle detected in filter dependencies. Expected ${allNodes.size} nodes, but topological sort yielded ${order.length}.`);
    }
    return { order, children, parents };
}
export async function resolveCascadingDependency(adapter, filterDef, dependency, parentValue, options) {
    if (parentValue === null || parentValue === undefined) {
        return { values: [], totalCount: 0, truncated: false };
    }
    const result = await adapter.getDistinctValues(filterDef.dataSourceId, filterDef.field, {
        search: options?.search,
        limit: options?.limit,
        filters: {
            [dependency.parentFilterId]: parentValue,
        },
    });
    return {
        values: result.values,
        totalCount: result.totalCount,
        truncated: result.truncated,
    };
}
//# sourceMappingURL=cascading-resolver.js.map