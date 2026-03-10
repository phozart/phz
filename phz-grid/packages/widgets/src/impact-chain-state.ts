/**
 * @phozart/phz-widgets — Impact Chain State (7A-C)
 *
 * Pure state machine for impact chain rendering — the horizontal causal flow
 * variant of the decision tree widget. All functions are pure and side-effect
 * free; the Lit component layer consumes these.
 */

import type {
  ImpactChainNode,
  ImpactNodeRole,
  HypothesisState,
  ChainLayout,
  ChainLayoutDirection,
  DecisionTreeRenderVariant,
  DecisionTreeVariantConfig,
} from '@phozart/phz-shared/types';

// ========================================================================
// State
// ========================================================================

/** Immutable state for an impact chain visualization. */
export interface ImpactChainState {
  nodes: ImpactChainNode[];
  variant: DecisionTreeRenderVariant;
  chainLayout: ChainLayout;
  expandedNodeIds: Set<string>;
  containerWidth: number;
}

// ========================================================================
// Layout computation result types
// ========================================================================

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

// ========================================================================
// Chain container variant (responsive)
// ========================================================================

/** Responsive rendering mode based on container width. */
export type ChainContainerVariant = 'full' | 'compact' | 'summary';

// ========================================================================
// Chain summary
// ========================================================================

/** Aggregated summary of hypothesis states and key nodes. */
export interface ChainSummary {
  validated: number;
  inconclusive: number;
  invalidated: number;
  pending: number;
  rootCauses: string[];
  impacts: string[];
}

// ========================================================================
// Default chain layout
// ========================================================================

const DEFAULT_CHAIN_LAYOUT: ChainLayout = {
  direction: 'horizontal',
  showEdgeLabels: true,
  collapseInvalidated: false,
};

// ========================================================================
// Node sizing constants
// ========================================================================

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const NODE_GAP = 40;

// ========================================================================
// Factory
// ========================================================================

/**
 * Create initial impact chain state from nodes and optional variant config.
 *
 * @param nodes - The impact chain nodes to visualize.
 * @param config - Optional variant config; defaults to impact-chain variant.
 */
export function initialImpactChainState(
  nodes: ImpactChainNode[],
  config?: DecisionTreeVariantConfig,
): ImpactChainState {
  const expandedIds = new Set<string>();
  for (const node of nodes) {
    if (!node.parentId) {
      expandedIds.add(node.id);
    }
  }

  return {
    nodes,
    variant: config?.renderVariant ?? 'impact-chain',
    chainLayout: config?.chainLayout ?? { ...DEFAULT_CHAIN_LAYOUT },
    expandedNodeIds: expandedIds,
    containerWidth: 800,
  };
}

// ========================================================================
// Layout computation
// ========================================================================

/**
 * Compute the visual layout for the impact chain: node positions and edges.
 *
 * Positions are computed as a simple linear chain based on the node ordering,
 * with the axis determined by the layout direction. Collapsed invalidated
 * nodes are excluded when `collapseInvalidated` is true.
 */
export function computeChainLayout(state: ImpactChainState): ComputedChainLayout {
  const { chainLayout, nodes } = state;
  const direction = chainLayout.direction;

  const visibleNodes = chainLayout.collapseInvalidated
    ? nodes.filter(n => n.hypothesisState !== 'invalidated')
    : nodes;

  const nodePositions: NodePosition[] = visibleNodes.map((node, index) => {
    const x = direction === 'horizontal' ? index * (NODE_WIDTH + NODE_GAP) : 0;
    const y = direction === 'vertical' ? index * (NODE_HEIGHT + NODE_GAP) : 0;
    return {
      nodeId: node.id,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });

  const edges: ChainEdge[] = [];
  for (let i = 0; i < visibleNodes.length - 1; i++) {
    const from = visibleNodes[i];
    const to = visibleNodes[i + 1];
    const edge: ChainEdge = { from: from.id, to: to.id };
    if (chainLayout.showEdgeLabels && to.edgeLabel) {
      edge.label = to.edgeLabel;
    }
    edges.push(edge);
  }

  return { layoutDirection: direction, nodePositions, edges };
}

// ========================================================================
// Responsive behavior
// ========================================================================

/**
 * Determine the chain container rendering variant based on available width.
 *
 * - `> 600px`: 'full' — horizontal, full node cards
 * - `400-600px`: 'compact' — vertical, full cards (alias: compact)
 * - `200-400px`: 'compact' — vertical, compact (role badge + label + status)
 * - `< 200px`: 'summary' — text-only summary ("3 validated, 1 invalidated")
 */
export function getChainContainerVariant(containerWidth: number): ChainContainerVariant {
  if (containerWidth > 600) return 'full';
  if (containerWidth >= 200) return 'compact';
  return 'summary';
}

// ========================================================================
// Node operations
// ========================================================================

/**
 * Toggle the expanded/collapsed state of a node. Returns a new state.
 */
export function toggleNodeExpand(state: ImpactChainState, nodeId: string): ImpactChainState {
  const next = new Set(state.expandedNodeIds);
  if (next.has(nodeId)) {
    next.delete(nodeId);
  } else {
    next.add(nodeId);
  }
  return { ...state, expandedNodeIds: next };
}

/**
 * Update the container width, which drives responsive variant switching.
 */
export function setContainerWidth(state: ImpactChainState, width: number): ImpactChainState {
  return { ...state, containerWidth: width };
}

// ========================================================================
// Hypothesis state helpers
// ========================================================================

const HYPOTHESIS_COLORS: Record<HypothesisState, string> = {
  validated: '#22c55e',
  inconclusive: '#f59e0b',
  invalidated: '#ef4444',
  pending: '#a8a29e',
};

const HYPOTHESIS_LABELS: Record<HypothesisState, string> = {
  validated: 'Validated',
  inconclusive: 'Inconclusive',
  invalidated: 'Invalidated',
  pending: 'Pending',
};

/**
 * Get the accent color for a hypothesis state.
 */
export function getHypothesisColor(hypothesisState: HypothesisState): string {
  return HYPOTHESIS_COLORS[hypothesisState];
}

/**
 * Get a human-readable label for a hypothesis state.
 */
export function getHypothesisLabel(hypothesisState: HypothesisState): string {
  return HYPOTHESIS_LABELS[hypothesisState];
}

// ========================================================================
// Node role helpers
// ========================================================================

const NODE_ROLE_COLORS: Record<ImpactNodeRole, string> = {
  'root-cause': '#dc2626',
  failure: '#f59e0b',
  impact: '#3b82f6',
  hypothesis: '#8b5cf6',
};

/**
 * Get the accent color for a node role.
 */
export function getNodeRoleColor(role: ImpactNodeRole): string {
  return NODE_ROLE_COLORS[role];
}

// ========================================================================
// Chain summary
// ========================================================================

/**
 * Compute an aggregated summary of the chain for minimal/summary rendering.
 * Counts hypothesis states and extracts root causes and impact labels.
 */
export function computeChainSummary(nodes: ImpactChainNode[]): ChainSummary {
  const summary: ChainSummary = {
    validated: 0,
    inconclusive: 0,
    invalidated: 0,
    pending: 0,
    rootCauses: [],
    impacts: [],
  };

  for (const node of nodes) {
    // Count hypothesis states
    const hs = node.hypothesisState ?? 'pending';
    summary[hs] += 1;

    // Collect root causes and impacts by role
    if (node.nodeRole === 'root-cause') {
      summary.rootCauses.push(node.label);
    }
    if (node.nodeRole === 'impact') {
      summary.impacts.push(node.label);
    }
  }

  return summary;
}

// ========================================================================
// Conclusion text template resolution
// ========================================================================

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
export function resolveConclusion(
  template: string,
  nodes: ImpactChainNode[],
  data?: Record<string, unknown>,
): string {
  const summary = computeChainSummary(nodes);

  const builtins: Record<string, string> = {
    validatedCount: String(summary.validated),
    invalidatedCount: String(summary.invalidated),
    inconclusiveCount: String(summary.inconclusive),
    pendingCount: String(summary.pending),
    rootCauses: summary.rootCauses.join(', '),
    impacts: summary.impacts.join(', '),
  };

  const vars: Record<string, string> = { ...builtins };
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      vars[key] = String(value ?? '');
    }
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, varName: string) => {
    return vars[varName] ?? '';
  });
}
