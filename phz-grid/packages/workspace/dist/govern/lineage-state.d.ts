/**
 * @phozart/phz-workspace — Govern > Lineage State (WE-8)
 *
 * Pure functions for artifact lineage/dependency graph visualization.
 * Provides DAG layout, upstream/downstream traversal, impact analysis,
 * and filtering — all O(V+E) graph algorithms with cycle guards.
 */
import type { ArtifactType } from '@phozart/phz-shared/artifacts';
import type { ArtifactMeta } from '../types.js';
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
export declare function initialLineageState(): LineageState;
export declare function buildLineageGraph(artifacts: ArtifactMeta[], dependencies: {
    from: string;
    to: string;
    type: string;
}[]): LineageGraph;
export declare function layoutDAG(graph: LineageGraph): LineageGraph;
export declare function getUpstreamLineage(graph: LineageGraph, nodeId: string): LineageGraph;
export declare function getDownstreamLineage(graph: LineageGraph, nodeId: string): LineageGraph;
export declare function getImpactedNodes(graph: LineageGraph, nodeId: string): string[];
export declare function filterByArtifactType(graph: LineageGraph, types: ArtifactType[]): LineageGraph;
export declare function setSelectedNode(state: LineageState, nodeId: string | undefined): LineageState;
export declare function setLineageFilter(state: LineageState, filter: LineageFilter): LineageState;
export declare function setHoveredNode(state: LineageState, nodeId: string | undefined): LineageState;
//# sourceMappingURL=lineage-state.d.ts.map