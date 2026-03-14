/**
 * @phozart/workspace — Govern > Lineage State Tests
 *
 * TDD: Tests written FIRST, then implementation.
 */
import { describe, it, expect } from 'vitest';
import { buildLineageGraph, layoutDAG, getUpstreamLineage, getDownstreamLineage, getImpactedNodes, filterByArtifactType, setSelectedNode, setLineageFilter, setHoveredNode, initialLineageState, } from '../lineage-state.js';
// ========================================================================
// Helpers
// ========================================================================
function makeArtifact(id, type, name) {
    return { id, type, name, createdAt: 0, updatedAt: 0 };
}
function makeDep(from, to, type = 'uses') {
    return { from, to, type };
}
// ========================================================================
// Tests
// ========================================================================
describe('Lineage State', () => {
    // --- buildLineageGraph ---
    describe('buildLineageGraph', () => {
        it('creates correct nodes and edges from artifacts and dependencies', () => {
            const artifacts = [
                makeArtifact('d1', 'dashboard', 'Sales Dashboard'),
                makeArtifact('r1', 'report', 'Sales Report'),
                makeArtifact('m1', 'metric', 'Revenue Metric'),
            ];
            const deps = [
                makeDep('d1', 'r1', 'uses'),
                makeDep('r1', 'm1', 'feeds'),
            ];
            const graph = buildLineageGraph(artifacts, deps);
            expect(graph.nodes).toHaveLength(3);
            expect(graph.edges).toHaveLength(2);
            expect(graph.nodes.find(n => n.id === 'd1')?.artifactType).toBe('dashboard');
            expect(graph.edges[0]).toEqual({
                source: 'd1',
                target: 'r1',
                relationship: 'uses',
            });
        });
        it('deduplicates edges with same source, target, and relationship', () => {
            const artifacts = [
                makeArtifact('a', 'dashboard', 'A'),
                makeArtifact('b', 'report', 'B'),
            ];
            const deps = [
                makeDep('a', 'b', 'uses'),
                makeDep('a', 'b', 'uses'), // duplicate
            ];
            const graph = buildLineageGraph(artifacts, deps);
            expect(graph.edges).toHaveLength(1);
        });
        it('ignores edges referencing non-existent artifacts', () => {
            const artifacts = [
                makeArtifact('a', 'dashboard', 'A'),
            ];
            const deps = [
                makeDep('a', 'missing', 'uses'),
            ];
            const graph = buildLineageGraph(artifacts, deps);
            expect(graph.edges).toHaveLength(0);
        });
    });
    // --- layoutDAG ---
    describe('layoutDAG', () => {
        it('assigns layers correctly for a linear chain', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'dashboard', name: 'C' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'b', target: 'c', relationship: 'feeds' },
                ],
            };
            const laid = layoutDAG(graph);
            const nodeA = laid.nodes.find(n => n.id === 'a');
            const nodeB = laid.nodes.find(n => n.id === 'b');
            const nodeC = laid.nodes.find(n => n.id === 'c');
            // A has no incoming edges → layer 0, B → layer 1, C → layer 2
            expect(nodeA.x).toBe(0);
            expect(nodeB.x).toBe(1);
            expect(nodeC.x).toBe(2);
        });
        it('handles diamond dependency', () => {
            //   A
            //  / \
            // B   C
            //  \ /
            //   D
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'report', name: 'C' },
                    { id: 'd', artifactType: 'dashboard', name: 'D' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'a', target: 'c', relationship: 'feeds' },
                    { source: 'b', target: 'd', relationship: 'feeds' },
                    { source: 'c', target: 'd', relationship: 'feeds' },
                ],
            };
            const laid = layoutDAG(graph);
            const nodeA = laid.nodes.find(n => n.id === 'a');
            const nodeB = laid.nodes.find(n => n.id === 'b');
            const nodeC = laid.nodes.find(n => n.id === 'c');
            const nodeD = laid.nodes.find(n => n.id === 'd');
            expect(nodeA.x).toBe(0);
            expect(nodeB.x).toBe(1);
            expect(nodeC.x).toBe(1);
            expect(nodeD.x).toBe(2);
        });
        it('handles disconnected subgraphs (multiple connected components)', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'x', artifactType: 'dashboard', name: 'X' },
                    { id: 'y', artifactType: 'kpi', name: 'Y' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'x', target: 'y', relationship: 'uses' },
                ],
            };
            const laid = layoutDAG(graph);
            // Both root nodes at layer 0
            expect(laid.nodes.find(n => n.id === 'a').x).toBe(0);
            expect(laid.nodes.find(n => n.id === 'x').x).toBe(0);
            // Both leaf nodes at layer 1
            expect(laid.nodes.find(n => n.id === 'b').x).toBe(1);
            expect(laid.nodes.find(n => n.id === 'y').x).toBe(1);
            // y values assigned within layer (deterministic ordering)
            expect(typeof laid.nodes.find(n => n.id === 'a').y).toBe('number');
        });
        it('assigns y-positions within each layer', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'report', name: 'C' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'a', target: 'c', relationship: 'feeds' },
                ],
            };
            const laid = layoutDAG(graph);
            const nodeB = laid.nodes.find(n => n.id === 'b');
            const nodeC = laid.nodes.find(n => n.id === 'c');
            // Same layer, different y positions
            expect(nodeB.x).toBe(nodeC.x);
            expect(nodeB.y).not.toBe(nodeC.y);
        });
    });
    // --- getUpstreamLineage ---
    describe('getUpstreamLineage', () => {
        it('returns correct ancestors for a node in a chain', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'dashboard', name: 'C' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'b', target: 'c', relationship: 'feeds' },
                ],
            };
            const upstream = getUpstreamLineage(graph, 'c');
            expect(upstream.nodes.map(n => n.id).sort()).toEqual(['a', 'b', 'c']);
            expect(upstream.edges).toHaveLength(2);
        });
        it('returns only the node itself for a root node', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                ],
            };
            const upstream = getUpstreamLineage(graph, 'a');
            expect(upstream.nodes.map(n => n.id)).toEqual(['a']);
            expect(upstream.edges).toHaveLength(0);
        });
    });
    // --- getDownstreamLineage ---
    describe('getDownstreamLineage', () => {
        it('returns correct descendants for a root node', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'dashboard', name: 'C' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'b', target: 'c', relationship: 'feeds' },
                ],
            };
            const downstream = getDownstreamLineage(graph, 'a');
            expect(downstream.nodes.map(n => n.id).sort()).toEqual(['a', 'b', 'c']);
            expect(downstream.edges).toHaveLength(2);
        });
        it('returns only the node itself for a leaf node', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                ],
            };
            const downstream = getDownstreamLineage(graph, 'b');
            expect(downstream.nodes.map(n => n.id)).toEqual(['b']);
            expect(downstream.edges).toHaveLength(0);
        });
    });
    // --- getImpactedNodes ---
    describe('getImpactedNodes', () => {
        it('returns full transitive closure of downstream nodes', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'dashboard', name: 'C' },
                    { id: 'd', artifactType: 'kpi', name: 'D' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                    { source: 'b', target: 'c', relationship: 'feeds' },
                    { source: 'b', target: 'd', relationship: 'feeds' },
                ],
            };
            const impacted = getImpactedNodes(graph, 'a');
            expect(impacted.sort()).toEqual(['b', 'c', 'd']);
        });
        it('guards against cycles (does not infinite loop)', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'report', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                    { id: 'c', artifactType: 'report', name: 'C' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'derives' },
                    { source: 'b', target: 'c', relationship: 'derives' },
                    { source: 'c', target: 'a', relationship: 'derives' }, // cycle!
                ],
            };
            // Should terminate and return downstream nodes without looping
            const impacted = getImpactedNodes(graph, 'a');
            expect(impacted.sort()).toEqual(['b', 'c']);
        });
        it('returns empty array for a leaf node', () => {
            const graph = {
                nodes: [
                    { id: 'a', artifactType: 'metric', name: 'A' },
                    { id: 'b', artifactType: 'report', name: 'B' },
                ],
                edges: [
                    { source: 'a', target: 'b', relationship: 'feeds' },
                ],
            };
            expect(getImpactedNodes(graph, 'b')).toEqual([]);
        });
    });
    // --- filterByArtifactType ---
    describe('filterByArtifactType', () => {
        it('filters nodes by artifact type and removes orphaned edges', () => {
            const graph = {
                nodes: [
                    { id: 'd1', artifactType: 'dashboard', name: 'Dashboard' },
                    { id: 'r1', artifactType: 'report', name: 'Report' },
                    { id: 'm1', artifactType: 'metric', name: 'Metric' },
                ],
                edges: [
                    { source: 'd1', target: 'r1', relationship: 'uses' },
                    { source: 'r1', target: 'm1', relationship: 'feeds' },
                ],
            };
            const filtered = filterByArtifactType(graph, ['dashboard', 'report']);
            expect(filtered.nodes).toHaveLength(2);
            expect(filtered.nodes.map(n => n.id).sort()).toEqual(['d1', 'r1']);
            // edge d1→r1 is kept, edge r1→m1 is orphaned (m1 removed)
            expect(filtered.edges).toHaveLength(1);
            expect(filtered.edges[0]).toEqual({
                source: 'd1',
                target: 'r1',
                relationship: 'uses',
            });
        });
        it('returns empty graph when no types match', () => {
            const graph = {
                nodes: [
                    { id: 'd1', artifactType: 'dashboard', name: 'Dashboard' },
                ],
                edges: [],
            };
            const filtered = filterByArtifactType(graph, ['kpi']);
            expect(filtered.nodes).toHaveLength(0);
            expect(filtered.edges).toHaveLength(0);
        });
    });
    // --- Empty graph ---
    describe('empty graph', () => {
        it('returns empty results for all operations on empty graph', () => {
            const graph = { nodes: [], edges: [] };
            expect(layoutDAG(graph).nodes).toHaveLength(0);
            expect(getUpstreamLineage(graph, 'any').nodes).toHaveLength(0);
            expect(getDownstreamLineage(graph, 'any').nodes).toHaveLength(0);
            expect(getImpactedNodes(graph, 'any')).toEqual([]);
            expect(filterByArtifactType(graph, ['dashboard']).nodes).toHaveLength(0);
        });
    });
    // --- State reducers ---
    describe('state reducers', () => {
        it('setSelectedNode updates selectedNodeId', () => {
            const state = initialLineageState();
            const next = setSelectedNode(state, 'node-1');
            expect(next.selectedNodeId).toBe('node-1');
        });
        it('setSelectedNode clears selection with undefined', () => {
            const state = { ...initialLineageState(), selectedNodeId: 'node-1' };
            const next = setSelectedNode(state, undefined);
            expect(next.selectedNodeId).toBeUndefined();
        });
        it('setLineageFilter updates filter', () => {
            const state = initialLineageState();
            const filter = {
                artifactTypes: ['dashboard', 'report'],
                searchQuery: 'sales',
                direction: 'upstream',
            };
            const next = setLineageFilter(state, filter);
            expect(next.filter).toEqual(filter);
        });
        it('setHoveredNode updates hoveredNodeId', () => {
            const state = initialLineageState();
            const next = setHoveredNode(state, 'hover-1');
            expect(next.hoveredNodeId).toBe('hover-1');
        });
    });
});
//# sourceMappingURL=lineage-state.test.js.map