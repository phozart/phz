/**
 * @phozart/shared — Impact Chain types (7A-C)
 *
 * Types for the impact chain rendering variant of the decision tree widget.
 * An impact chain is a horizontal causal flow for root cause analysis,
 * extending DecisionTreeNode with role, hypothesis state, and metrics.
 */
import type { DecisionTreeNode } from './widgets.js';
/** The functional role of a node in the impact chain. */
export type ImpactNodeRole = 'root-cause' | 'failure' | 'impact' | 'hypothesis';
/** Validation state for hypothesis nodes. */
export type HypothesisState = 'validated' | 'inconclusive' | 'invalidated' | 'pending';
/** A metric displayed alongside an impact chain node. */
export interface ImpactMetric {
    /** Human-readable label (e.g. "Latency"). */
    label: string;
    /** Format string for the value (e.g. "123ms", "45%"). */
    value: string;
    /** Data field reference for live binding. */
    field: string;
}
/** A node in an impact chain — extends DecisionTreeNode with causal analysis fields. */
export interface ImpactChainNode extends DecisionTreeNode {
    /** The role this node plays in the chain. */
    nodeRole?: ImpactNodeRole;
    /** Hypothesis validation state (only meaningful when nodeRole is 'hypothesis'). */
    hypothesisState?: HypothesisState;
    /** Metrics to display on the node card. */
    impactMetrics?: ImpactMetric[];
    /** Label for the incoming edge (e.g. "causes", "triggers", "affects"). */
    edgeLabel?: string;
}
/** Layout direction for the impact chain rendering. */
export type ChainLayoutDirection = 'horizontal' | 'vertical';
/** Layout configuration for the impact chain variant. */
export interface ChainLayout {
    /** Primary flow direction. */
    direction: ChainLayoutDirection;
    /** Whether to render labels on edges between nodes. */
    showEdgeLabels: boolean;
    /** Whether to visually collapse invalidated hypothesis nodes. */
    collapseInvalidated: boolean;
    /** Optional natural-language conclusion text (supports template variables). */
    conclusionText?: string;
}
/** Which rendering variant the decision tree widget should use. */
export type DecisionTreeRenderVariant = 'tree' | 'impact-chain';
/** Configuration for selecting and tuning a decision tree rendering variant. */
export interface DecisionTreeVariantConfig {
    /** The active render variant. */
    renderVariant: DecisionTreeRenderVariant;
    /** Chain-specific layout options (only used when renderVariant is 'impact-chain'). */
    chainLayout?: ChainLayout;
}
//# sourceMappingURL=impact-chain.d.ts.map