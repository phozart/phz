/**
 * UX-015: Visual Dependency Graph — View State Machine
 *
 * Pure-function, immutable state machine for the dependency graph view.
 * Manages node selection, BFS-based highlight traversal, layer collapse,
 * and search filtering. No DOM or rendering logic.
 */

// ── Types ──

export type GraphNodeKind = 'field' | 'parameter' | 'calc-field' | 'metric' | 'kpi';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  layer: number; // 1-5
}

export interface GraphEdge {
  from: string;
  to: string;
}

export type HighlightDirection = 'none' | 'upstream' | 'downstream' | 'both';

export interface DependencyGraphViewState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  highlightedNodeIds: ReadonlySet<string>;
  highlightDirection: HighlightDirection;
  collapsedLayers: ReadonlySet<number>;
  searchQuery: string;
  filteredNodeIds: ReadonlySet<string>;
}

// ── BFS helpers (internal) ──

/**
 * BFS backwards: find all nodes that eventually flow INTO nodeId.
 * Follows edges where edge.to === current, collecting edge.from.
 */
function bfsUpstream(nodeId: string, edges: readonly GraphEdge[]): Set<string> {
  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.to === current && !visited.has(edge.from)) {
        visited.add(edge.from);
        queue.push(edge.from);
      }
    }
  }

  return visited;
}

/**
 * BFS forward: find all nodes reachable FROM nodeId.
 * Follows edges where edge.from === current, collecting edge.to.
 */
function bfsDownstream(nodeId: string, edges: readonly GraphEdge[]): Set<string> {
  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }

  return visited;
}

// ── State functions ──

/**
 * Factory: create initial dependency graph view state.
 */
export function createDependencyGraphViewState(
  nodes: GraphNode[],
  edges: GraphEdge[],
): DependencyGraphViewState {
  return {
    nodes,
    edges,
    selectedNodeId: null,
    highlightedNodeIds: new Set<string>(),
    highlightDirection: 'none',
    collapsedLayers: new Set<number>(),
    searchQuery: '',
    filteredNodeIds: new Set<string>(),
  };
}

/**
 * Select a node and highlight both upstream and downstream dependencies.
 */
export function selectNode(
  state: DependencyGraphViewState,
  nodeId: string,
): DependencyGraphViewState {
  const upstream = bfsUpstream(nodeId, state.edges);
  const downstream = bfsDownstream(nodeId, state.edges);
  const combined = new Set<string>([...upstream, ...downstream]);

  return {
    ...state,
    selectedNodeId: nodeId,
    highlightedNodeIds: combined,
    highlightDirection: 'both',
  };
}

/**
 * Clear node selection and all highlights.
 */
export function clearSelection(
  state: DependencyGraphViewState,
): DependencyGraphViewState {
  return {
    ...state,
    selectedNodeId: null,
    highlightedNodeIds: new Set<string>(),
    highlightDirection: 'none',
  };
}

/**
 * Highlight only upstream dependencies of a node (BFS backwards).
 */
export function highlightUpstream(
  state: DependencyGraphViewState,
  nodeId: string,
  edges: readonly GraphEdge[],
): DependencyGraphViewState {
  return {
    ...state,
    highlightedNodeIds: bfsUpstream(nodeId, edges),
    highlightDirection: 'upstream',
  };
}

/**
 * Highlight only downstream dependencies of a node (BFS forward).
 */
export function highlightDownstream(
  state: DependencyGraphViewState,
  nodeId: string,
  edges: readonly GraphEdge[],
): DependencyGraphViewState {
  return {
    ...state,
    highlightedNodeIds: bfsDownstream(nodeId, edges),
    highlightDirection: 'downstream',
  };
}

/**
 * Highlight both upstream and downstream dependencies (union).
 */
export function highlightBoth(
  state: DependencyGraphViewState,
  nodeId: string,
  edges: readonly GraphEdge[],
): DependencyGraphViewState {
  const upstream = bfsUpstream(nodeId, edges);
  const downstream = bfsDownstream(nodeId, edges);
  const combined = new Set<string>([...upstream, ...downstream]);

  return {
    ...state,
    highlightedNodeIds: combined,
    highlightDirection: 'both',
  };
}

/**
 * Toggle a layer's visibility in the collapsed set.
 */
export function toggleLayerVisibility(
  state: DependencyGraphViewState,
  layer: number,
): DependencyGraphViewState {
  const next = new Set(state.collapsedLayers);
  if (next.has(layer)) {
    next.delete(layer);
  } else {
    next.add(layer);
  }
  return { ...state, collapsedLayers: next };
}

/**
 * Set the search query and compute filtered node IDs.
 * Empty query clears the filter (shows all nodes).
 */
export function setGraphSearch(
  state: DependencyGraphViewState,
  query: string,
  nodes: readonly GraphNode[],
): DependencyGraphViewState {
  if (query === '') {
    return { ...state, searchQuery: '', filteredNodeIds: new Set<string>() };
  }

  const lower = query.toLowerCase();
  const matching = new Set<string>();
  for (const node of nodes) {
    if (node.label.toLowerCase().includes(lower)) {
      matching.add(node.id);
    }
  }

  return { ...state, searchQuery: query, filteredNodeIds: matching };
}

/**
 * Compute visible nodes: exclude collapsed layers, intersect with search filter.
 */
export function getVisibleNodes(state: DependencyGraphViewState): GraphNode[] {
  const { nodes, collapsedLayers, searchQuery, filteredNodeIds } = state;

  return nodes.filter(node => {
    if (collapsedLayers.has(node.layer)) return false;
    if (searchQuery !== '' && !filteredNodeIds.has(node.id)) return false;
    return true;
  });
}

/**
 * Compute visible edges: both endpoints must be visible.
 */
export function getVisibleEdges(state: DependencyGraphViewState): GraphEdge[] {
  const visibleIds = new Set(getVisibleNodes(state).map(n => n.id));

  return state.edges.filter(
    edge => visibleIds.has(edge.from) && visibleIds.has(edge.to),
  );
}
