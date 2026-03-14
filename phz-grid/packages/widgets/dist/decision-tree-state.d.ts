/**
 * @phozart/widgets — Decision Tree State
 *
 * Headless state machine for decision tree visualization.
 * Pure functions that manage tree expansion, evaluation, and traversal.
 */
import type { DecisionTreeNode, NodeStatus } from '@phozart/shared/types';
/** Immutable state representation for a decision tree widget. */
export interface DecisionTreeState {
    nodes: DecisionTreeNode[];
    expandedNodeIds: Set<string>;
    evaluatedStatuses: Map<string, NodeStatus>;
}
/**
 * Create initial decision tree state from a flat array of nodes.
 * Root nodes (those without a parentId) are expanded by default.
 */
export declare function createDecisionTreeState(nodes: DecisionTreeNode[]): DecisionTreeState;
/**
 * Toggle the expanded/collapsed state of a node.
 * Returns a new state object (immutable).
 */
export declare function toggleNode(state: DecisionTreeState, nodeId: string): DecisionTreeState;
/**
 * Evaluate all nodes using the provided evaluator callback and store results.
 * Returns a new state with updated evaluatedStatuses map.
 */
export declare function evaluateAllNodes(state: DecisionTreeState, evaluator: (node: DecisionTreeNode) => NodeStatus): DecisionTreeState;
/**
 * Get the list of visible nodes based on the current expansion state.
 *
 * A node is visible if:
 * - It is a root node (no parentId), or
 * - All of its ancestors are expanded.
 */
export declare function getVisibleNodes(state: DecisionTreeState): DecisionTreeNode[];
/**
 * Find the path from the root to the given node (inclusive).
 * Returns an empty array if the node is not found.
 */
export declare function findNodePath(state: DecisionTreeState, nodeId: string): DecisionTreeNode[];
/**
 * Get the depth (0-based) of a node in the tree.
 */
export declare function getNodeDepth(state: DecisionTreeState, nodeId: string): number;
/**
 * Get the effective status for a node — prefers evaluated status, falls back to the node's own status.
 */
export declare function getEffectiveStatus(state: DecisionTreeState, nodeId: string): NodeStatus;
//# sourceMappingURL=decision-tree-state.d.ts.map