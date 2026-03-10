/**
 * @phozart/phz-widgets — Impact Chain State (7A-C)
 *
 * Pure state machine for impact chain rendering — the horizontal causal flow
 * variant of the decision tree widget. All functions are pure and side-effect
 * free; the Lit component layer consumes these.
 */
import type { ImpactChainNode, ImpactNodeRole, HypothesisState, ChainLayout, ChainLayoutDirection, DecisionTreeRenderVariant, DecisionTreeVariantConfig } from '@phozart/phz-shared/types';
/** Immutable state for an impact chain visualization. */
export interface ImpactChainState {
    nodes: ImpactChainNode[];
    variant: DecisionTreeRenderVariant;
    chainLayout: ChainLayout;
    expandedNodeIds: Set<string>;
    containerWidth: number;
}
/** Positioned node within the computed layout. */
export interface NodePosition {
    nodeId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
/** An edge connecting two nodes in the chain. */
export interface ChainEdge {
    from: string;
    to: string;
    label?: string;
}
/** Full layout computation result. */
export interface ComputedChainLayout {
    layoutDirection: ChainLayoutDirection;
    nodePositions: NodePosition[];
    edges: ChainEdge[];
}
/** Responsive rendering mode based on container width. */
export type ChainContainerVariant = 'full' | 'compact' | 'summary';
/** Aggregated summary of hypothesis states and key nodes. */
export interface ChainSummary {
    validated: number;
    inconclusive: number;
    invalidated: number;
    pending: number;
    rootCauses: string[];
    impacts: string[];
}
/**
 * Create initial impact chain state from nodes and optional variant config.
 *
 * @param nodes - The impact chain nodes to visualize.
 * @param config - Optional variant config; defaults to impact-chain variant.
 */
export declare function initialImpactChainState(nodes: ImpactChainNode[], config?: DecisionTreeVariantConfig): ImpactChainState;
/**
 * Compute the visual layout for the impact chain: node positions and edges.
 *
 * Positions are computed as a simple linear chain based on the node ordering,
 * with the axis determined by the layout direction. Collapsed invalidated
 * nodes are excluded when `collapseInvalidated` is true.
 */
export declare function computeChainLayout(state: ImpactChainState): ComputedChainLayout;
/**
 * Determine the chain container rendering variant based on available width.
 *
 * - `> 600px`: 'full' — horizontal, full node cards
 * - `400-600px`: 'compact' — vertical, full cards (alias: compact)
 * - `200-400px`: 'compact' — vertical, compact (role badge + label + status)
 * - `< 200px`: 'summary' — text-only summary ("3 validated, 1 invalidated")
 */
export declare function getChainContainerVariant(containerWidth: number): ChainContainerVariant;
/**
 * Toggle the expanded/collapsed state of a node. Returns a new state.
 */
export declare function toggleNodeExpand(state: ImpactChainState, nodeId: string): ImpactChainState;
/**
 * Update the container width, which drives responsive variant switching.
 */
export declare function setContainerWidth(state: ImpactChainState, width: number): ImpactChainState;
/**
 * Get the accent color for a hypothesis state.
 */
export declare function getHypothesisColor(hypothesisState: HypothesisState): string;
/**
 * Get a human-readable label for a hypothesis state.
 */
export declare function getHypothesisLabel(hypothesisState: HypothesisState): string;
/**
 * Get the accent color for a node role.
 */
export declare function getNodeRoleColor(role: ImpactNodeRole): string;
/**
 * Compute an aggregated summary of the chain for minimal/summary rendering.
 * Counts hypothesis states and extracts root causes and impact labels.
 */
export declare function computeChainSummary(nodes: ImpactChainNode[]): ChainSummary;
/**
 * Resolve a conclusion text template with variable substitution.
 *
 * Supports `{{variableName}}` placeholders. Built-in variables derived
 * from the nodes:
 * - `validatedCount`, `invalidatedCount`, `inconclusiveCount`, `pendingCount`
 * - `rootCauses` (comma-separated labels)
 * - `impacts` (comma-separated labels)
 *
 * Additional variables can be supplied via the `data` parameter.
 *
 * @param template - The conclusion text template string.
 * @param nodes - The impact chain nodes.
 * @param data - Optional additional data for template variables.
 * @returns The resolved conclusion text.
 */
export declare function resolveConclusion(template: string, nodes: ImpactChainNode[], data?: Record<string, unknown>): string;
//# sourceMappingURL=impact-chain-state.d.ts.map