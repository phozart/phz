/**
 * @phozart/workspace — Govern > Lineage State (WE-8)
 *
 * Pure functions for artifact lineage/dependency graph visualization.
 * Provides DAG layout, upstream/downstream traversal, impact analysis,
 * and filtering — all O(V+E) graph algorithms with cycle guards.
 */

import type { ArtifactType } from '@phozart/shared/artifacts';
import type { ArtifactMeta } from '../types.js';

// ========================================================================
// Types
// ========================================================================

export interface LineageNode {
  id: string;
  artifactType: ArtifactType;
  name: string;
  x?: number;
  y?: number;
}

export interface LineageEdge {
  source: string;
  target: string;
  relationship: 'uses' | 'feeds' | 'derives' | 'filters';
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface LineageFilter {
  artifactTypes?: ArtifactType[];
  searchQuery?: string;
  direction?: 'upstream' | 'downstream' | 'both';
}

export interface LineageState {
  graph: LineageGraph;
  selectedNodeId?: string;
  filter: LineageFilter;
  hoveredNodeId?: string;
}

// ========================================================================
// Factory
// ========================================================================

export function initialLineageState(): LineageState {
  return {
    graph: { nodes: [], edges: [] },
    filter: {},
  };
}

// ========================================================================
// buildLineageGraph
// ========================================================================

export function buildLineageGraph(
  artifacts: ArtifactMeta[],
  dependencies: { from: string; to: string; type: string }[],
): LineageGraph {
  const nodeMap = new Map<string, ArtifactMeta>();
  for (const a of artifacts) {
    nodeMap.set(a.id, a);
  }

  const nodes: LineageNode[] = artifacts.map(a => ({
    id: a.id,
    artifactType: a.type,
    name: a.name,
  }));

  // Deduplicate edges and filter out references to non-existent artifacts
  const edgeSet = new Set<string>();
  const edges: LineageEdge[] = [];

  for (const dep of dependencies) {
    if (!nodeMap.has(dep.from) || !nodeMap.has(dep.to)) continue;

    const key = `${dep.from}|${dep.to}|${dep.type}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);

    edges.push({
      source: dep.from,
      target: dep.to,
      relationship: dep.type as LineageEdge['relationship'],
    });
  }

  return { nodes, edges };
}

// ========================================================================
// layoutDAG — topological layer assignment via Kahn's algorithm
// ========================================================================

export function layoutDAG(graph: LineageGraph): LineageGraph {
  if (graph.nodes.length === 0) return { nodes: [], edges: graph.edges };

  // Build adjacency and in-degree maps
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    children.set(node.id, []);
  }

  for (const edge of graph.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    children.get(edge.source)?.push(edge.target);
  }

  // Kahn's algorithm with layer tracking
  const layers = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      layers.set(id, 0);
    }
  }

  let idx = 0;
  while (idx < queue.length) {
    const current = queue[idx++];
    const currentLayer = layers.get(current) ?? 0;

    for (const child of children.get(current) ?? []) {
      const newDeg = (inDegree.get(child) ?? 1) - 1;
      inDegree.set(child, newDeg);

      // Assign max layer from all parents
      const prevLayer = layers.get(child) ?? 0;
      layers.set(child, Math.max(prevLayer, currentLayer + 1));

      if (newDeg === 0) {
        queue.push(child);
      }
    }
  }

  // Handle nodes in cycles (not visited by Kahn's) — assign layer 0
  for (const node of graph.nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  // Assign y-positions within each layer
  const layerCounters = new Map<number, number>();

  const nodes: LineageNode[] = graph.nodes.map(node => {
    const x = layers.get(node.id) ?? 0;
    const y = layerCounters.get(x) ?? 0;
    layerCounters.set(x, y + 1);
    return { ...node, x, y };
  });

  return { nodes, edges: graph.edges };
}

// ========================================================================
// getUpstreamLineage — all ancestors of a node (reverse traversal)
// ========================================================================

export function getUpstreamLineage(
  graph: LineageGraph,
  nodeId: string,
): LineageGraph {
  const nodeExists = graph.nodes.some(n => n.id === nodeId);
  if (!nodeExists) return { nodes: [], edges: [] };

  // Build reverse adjacency: target → sources
  const parents = new Map<string, string[]>();
  for (const edge of graph.edges) {
    let list = parents.get(edge.target);
    if (!list) {
      list = [];
      parents.set(edge.target, list);
    }
    list.push(edge.source);
  }

  // BFS upstream
  const visited = new Set<string>();
  const queue = [nodeId];
  visited.add(nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const parent of parents.get(current) ?? []) {
      if (!visited.has(parent)) {
        visited.add(parent);
        queue.push(parent);
      }
    }
  }

  const nodeSet = visited;
  const nodes = graph.nodes.filter(n => nodeSet.has(n.id));
  const edges = graph.edges.filter(
    e => nodeSet.has(e.source) && nodeSet.has(e.target),
  );

  return { nodes, edges };
}

// ========================================================================
// getDownstreamLineage — all descendants of a node (forward traversal)
// ========================================================================

export function getDownstreamLineage(
  graph: LineageGraph,
  nodeId: string,
): LineageGraph {
  const nodeExists = graph.nodes.some(n => n.id === nodeId);
  if (!nodeExists) return { nodes: [], edges: [] };

  // Build forward adjacency: source → targets
  const childrenMap = new Map<string, string[]>();
  for (const edge of graph.edges) {
    let list = childrenMap.get(edge.source);
    if (!list) {
      list = [];
      childrenMap.set(edge.source, list);
    }
    list.push(edge.target);
  }

  // BFS downstream
  const visited = new Set<string>();
  const queue = [nodeId];
  visited.add(nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childrenMap.get(current) ?? []) {
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    }
  }

  const nodeSet = visited;
  const nodes = graph.nodes.filter(n => nodeSet.has(n.id));
  const edges = graph.edges.filter(
    e => nodeSet.has(e.source) && nodeSet.has(e.target),
  );

  return { nodes, edges };
}

// ========================================================================
// getImpactedNodes — downstream node IDs excluding the source (for delete warnings)
// ========================================================================

export function getImpactedNodes(
  graph: LineageGraph,
  nodeId: string,
): string[] {
  // Build forward adjacency: source → targets
  const childrenMap = new Map<string, string[]>();
  for (const edge of graph.edges) {
    let list = childrenMap.get(edge.source);
    if (!list) {
      list = [];
      childrenMap.set(edge.source, list);
    }
    list.push(edge.target);
  }

  // BFS with cycle guard (visited Set)
  const visited = new Set<string>();
  visited.add(nodeId);
  const queue = [nodeId];
  const impacted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childrenMap.get(current) ?? []) {
      if (!visited.has(child)) {
        visited.add(child);
        impacted.push(child);
        queue.push(child);
      }
    }
  }

  return impacted;
}

// ========================================================================
// filterByArtifactType — keeps only nodes of given types, prunes orphaned edges
// ========================================================================

export function filterByArtifactType(
  graph: LineageGraph,
  types: ArtifactType[],
): LineageGraph {
  const typeSet = new Set(types);
  const nodes = graph.nodes.filter(n => typeSet.has(n.artifactType));
  const nodeIds = new Set(nodes.map(n => n.id));

  // Only keep edges where both endpoints survived the filter
  const edges = graph.edges.filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target),
  );

  return { nodes, edges };
}

// ========================================================================
// State reducers (immutable)
// ========================================================================

export function setSelectedNode(
  state: LineageState,
  nodeId: string | undefined,
): LineageState {
  return { ...state, selectedNodeId: nodeId };
}

export function setLineageFilter(
  state: LineageState,
  filter: LineageFilter,
): LineageState {
  return { ...state, filter };
}

export function setHoveredNode(
  state: LineageState,
  nodeId: string | undefined,
): LineageState {
  return { ...state, hoveredNodeId: nodeId };
}
