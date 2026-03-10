/**
 * @phozart/phz-widgets — Decision Tree State
 *
 * Headless state machine for decision tree visualization.
 * Pure functions that manage tree expansion, evaluation, and traversal.
 */
/**
 * Create initial decision tree state from a flat array of nodes.
 * Root nodes (those without a parentId) are expanded by default.
 */
export function createDecisionTreeState(nodes) {
    const rootIds = new Set();
    for (const node of nodes) {
        if (!node.parentId) {
            rootIds.add(node.id);
        }
    }
    return {
        nodes,
        expandedNodeIds: rootIds,
        evaluatedStatuses: new Map(),
    };
}
/**
 * Toggle the expanded/collapsed state of a node.
 * Returns a new state object (immutable).
 */
export function toggleNode(state, nodeId) {
    const next = new Set(state.expandedNodeIds);
    if (next.has(nodeId)) {
        next.delete(nodeId);
    }
    else {
        next.add(nodeId);
    }
    return { ...state, expandedNodeIds: next };
}
/**
 * Evaluate all nodes using the provided evaluator callback and store results.
 * Returns a new state with updated evaluatedStatuses map.
 */
export function evaluateAllNodes(state, evaluator) {
    const statuses = new Map();
    for (const node of state.nodes) {
        statuses.set(node.id, evaluator(node));
    }
    return { ...state, evaluatedStatuses: statuses };
}
/**
 * Get the list of visible nodes based on the current expansion state.
 *
 * A node is visible if:
 * - It is a root node (no parentId), or
 * - All of its ancestors are expanded.
 */
export function getVisibleNodes(state) {
    const nodeMap = new Map();
    for (const node of state.nodes) {
        nodeMap.set(node.id, node);
    }
    return state.nodes.filter(node => {
        if (!node.parentId)
            return true;
        // Walk up the ancestor chain; every ancestor must be expanded
        let current = node.parentId;
        while (current) {
            if (!state.expandedNodeIds.has(current))
                return false;
            const parent = nodeMap.get(current);
            current = parent?.parentId;
        }
        return true;
    });
}
/**
 * Find the path from the root to the given node (inclusive).
 * Returns an empty array if the node is not found.
 */
export function findNodePath(state, nodeId) {
    const nodeMap = new Map();
    for (const node of state.nodes) {
        nodeMap.set(node.id, node);
    }
    const target = nodeMap.get(nodeId);
    if (!target)
        return [];
    const path = [];
    let current = target;
    while (current) {
        path.unshift(current);
        current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return path;
}
/**
 * Get the depth (0-based) of a node in the tree.
 */
export function getNodeDepth(state, nodeId) {
    return findNodePath(state, nodeId).length - 1;
}
/**
 * Get the effective status for a node — prefers evaluated status, falls back to the node's own status.
 */
export function getEffectiveStatus(state, nodeId) {
    return state.evaluatedStatuses.get(nodeId)
        ?? state.nodes.find(n => n.id === nodeId)?.status
        ?? 'pending';
}
//# sourceMappingURL=decision-tree-state.js.map