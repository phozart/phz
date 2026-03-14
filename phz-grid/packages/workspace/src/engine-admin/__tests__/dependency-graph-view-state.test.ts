import { describe, it, expect } from 'vitest';
import {
  type GraphNode,
  type GraphEdge,
  type DependencyGraphViewState,
  createDependencyGraphViewState,
  selectNode,
  clearSelection,
  highlightUpstream,
  highlightDownstream,
  highlightBoth,
  toggleLayerVisibility,
  setGraphSearch,
  getVisibleNodes,
  getVisibleEdges,
} from '../dependency-graph-view-state.js';

// ── Test data ──
// field:revenue (layer 1) → calc:margin (layer 3) → metric:avg_margin (layer 4) → kpi:profitability (layer 5)
// field:cost (layer 1) → calc:margin (layer 3)
// param:target (layer 2) → kpi:profitability (layer 5)
const nodes: GraphNode[] = [
  { id: 'field:revenue', kind: 'field', label: 'Revenue', layer: 1 },
  { id: 'field:cost', kind: 'field', label: 'Cost', layer: 1 },
  { id: 'param:target', kind: 'parameter', label: 'Target', layer: 2 },
  { id: 'calc:margin', kind: 'calc-field', label: 'Margin', layer: 3 },
  { id: 'metric:avg_margin', kind: 'metric', label: 'Avg Margin', layer: 4 },
  { id: 'kpi:profitability', kind: 'kpi', label: 'Profitability', layer: 5 },
];

const edges: GraphEdge[] = [
  { from: 'field:revenue', to: 'calc:margin' },
  { from: 'field:cost', to: 'calc:margin' },
  { from: 'calc:margin', to: 'metric:avg_margin' },
  { from: 'metric:avg_margin', to: 'kpi:profitability' },
  { from: 'param:target', to: 'kpi:profitability' },
];

describe('dependency-graph-view-state', () => {
  // ── createDependencyGraphViewState ──

  describe('createDependencyGraphViewState', () => {
    it('creates state with nodes and edges', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(s.nodes).toEqual(nodes);
      expect(s.edges).toEqual(edges);
    });

    it('defaults to null selection', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(s.selectedNodeId).toBeNull();
    });

    it('defaults to empty highlights', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(s.highlightedNodeIds.size).toBe(0);
      expect(s.highlightDirection).toBe('none');
    });

    it('defaults to no collapsed layers', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(s.collapsedLayers.size).toBe(0);
    });

    it('defaults to empty search', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(s.searchQuery).toBe('');
      expect(s.filteredNodeIds.size).toBe(0);
    });
  });

  // ── selectNode ──

  describe('selectNode', () => {
    it('sets selectedNodeId', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = selectNode(s, 'calc:margin');
      expect(s2.selectedNodeId).toBe('calc:margin');
    });

    it('highlights both upstream and downstream for calc:margin', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = selectNode(s, 'calc:margin');
      // Upstream: field:revenue, field:cost
      // Downstream: metric:avg_margin, kpi:profitability
      // Self: calc:margin
      const ids = s2.highlightedNodeIds;
      expect(ids.has('calc:margin')).toBe(true);
      expect(ids.has('field:revenue')).toBe(true);
      expect(ids.has('field:cost')).toBe(true);
      expect(ids.has('metric:avg_margin')).toBe(true);
      expect(ids.has('kpi:profitability')).toBe(true);
      expect(ids.size).toBe(5);
    });

    it('sets direction to both', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = selectNode(s, 'calc:margin');
      expect(s2.highlightDirection).toBe('both');
    });

    it('does not include unrelated nodes', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = selectNode(s, 'calc:margin');
      // param:target flows into kpi:profitability, not calc:margin upstream
      expect(s2.highlightedNodeIds.has('param:target')).toBe(false);
    });
  });

  // ── clearSelection ──

  describe('clearSelection', () => {
    it('clears selectedNodeId', () => {
      const s = selectNode(createDependencyGraphViewState(nodes, edges), 'calc:margin');
      const s2 = clearSelection(s);
      expect(s2.selectedNodeId).toBeNull();
    });

    it('clears highlights', () => {
      const s = selectNode(createDependencyGraphViewState(nodes, edges), 'calc:margin');
      const s2 = clearSelection(s);
      expect(s2.highlightedNodeIds.size).toBe(0);
    });

    it('sets direction to none', () => {
      const s = selectNode(createDependencyGraphViewState(nodes, edges), 'calc:margin');
      const s2 = clearSelection(s);
      expect(s2.highlightDirection).toBe('none');
    });
  });

  // ── highlightUpstream ──

  describe('highlightUpstream', () => {
    it('on calc:margin includes field:revenue, field:cost, and calc:margin', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightUpstream(s, 'calc:margin', edges);
      expect(s2.highlightedNodeIds.has('calc:margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:revenue')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:cost')).toBe(true);
      expect(s2.highlightedNodeIds.size).toBe(3);
    });

    it('sets direction to upstream', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightUpstream(s, 'calc:margin', edges);
      expect(s2.highlightDirection).toBe('upstream');
    });

    it('on a leaf node (field:revenue) returns only itself', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightUpstream(s, 'field:revenue', edges);
      expect(s2.highlightedNodeIds.size).toBe(1);
      expect(s2.highlightedNodeIds.has('field:revenue')).toBe(true);
    });

    it('traverses multi-level upstream (kpi:profitability)', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightUpstream(s, 'kpi:profitability', edges);
      // kpi:profitability ← metric:avg_margin ← calc:margin ← field:revenue, field:cost
      // kpi:profitability ← param:target
      expect(s2.highlightedNodeIds.has('kpi:profitability')).toBe(true);
      expect(s2.highlightedNodeIds.has('metric:avg_margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('calc:margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:revenue')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:cost')).toBe(true);
      expect(s2.highlightedNodeIds.has('param:target')).toBe(true);
      expect(s2.highlightedNodeIds.size).toBe(6);
    });
  });

  // ── highlightDownstream ──

  describe('highlightDownstream', () => {
    it('on calc:margin includes metric:avg_margin, kpi:profitability, and calc:margin', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightDownstream(s, 'calc:margin', edges);
      expect(s2.highlightedNodeIds.has('calc:margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('metric:avg_margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('kpi:profitability')).toBe(true);
      expect(s2.highlightedNodeIds.size).toBe(3);
    });

    it('sets direction to downstream', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightDownstream(s, 'calc:margin', edges);
      expect(s2.highlightDirection).toBe('downstream');
    });

    it('on a terminal node (kpi:profitability) returns only itself', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightDownstream(s, 'kpi:profitability', edges);
      expect(s2.highlightedNodeIds.size).toBe(1);
      expect(s2.highlightedNodeIds.has('kpi:profitability')).toBe(true);
    });
  });

  // ── highlightBoth ──

  describe('highlightBoth', () => {
    it('is union of upstream and downstream', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightBoth(s, 'calc:margin', edges);
      // Upstream: field:revenue, field:cost
      // Downstream: metric:avg_margin, kpi:profitability
      // Self: calc:margin
      expect(s2.highlightedNodeIds.has('calc:margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:revenue')).toBe(true);
      expect(s2.highlightedNodeIds.has('field:cost')).toBe(true);
      expect(s2.highlightedNodeIds.has('metric:avg_margin')).toBe(true);
      expect(s2.highlightedNodeIds.has('kpi:profitability')).toBe(true);
      expect(s2.highlightedNodeIds.size).toBe(5);
    });

    it('sets direction to both', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightBoth(s, 'calc:margin', edges);
      expect(s2.highlightDirection).toBe('both');
    });

    it('does not include nodes outside the dependency chain', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightBoth(s, 'calc:margin', edges);
      expect(s2.highlightedNodeIds.has('param:target')).toBe(false);
    });
  });

  // ── toggleLayerVisibility ──

  describe('toggleLayerVisibility', () => {
    it('adds a layer to collapsedLayers', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = toggleLayerVisibility(s, 3);
      expect(s2.collapsedLayers.has(3)).toBe(true);
    });

    it('toggling twice removes the layer', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = toggleLayerVisibility(s, 3);
      const s3 = toggleLayerVisibility(s2, 3);
      expect(s3.collapsedLayers.has(3)).toBe(false);
    });

    it('can collapse multiple layers', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = toggleLayerVisibility(toggleLayerVisibility(s, 1), 5);
      expect(s2.collapsedLayers.has(1)).toBe(true);
      expect(s2.collapsedLayers.has(5)).toBe(true);
      expect(s2.collapsedLayers.size).toBe(2);
    });
  });

  // ── setGraphSearch ──

  describe('setGraphSearch', () => {
    it('filters nodes by label case-insensitively', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = setGraphSearch(s, 'margin', nodes);
      expect(s2.searchQuery).toBe('margin');
      expect(s2.filteredNodeIds.has('calc:margin')).toBe(true);
      expect(s2.filteredNodeIds.has('metric:avg_margin')).toBe(true);
      expect(s2.filteredNodeIds.size).toBe(2);
    });

    it('is case-insensitive', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = setGraphSearch(s, 'MARGIN', nodes);
      expect(s2.filteredNodeIds.has('calc:margin')).toBe(true);
      expect(s2.filteredNodeIds.has('metric:avg_margin')).toBe(true);
    });

    it('empty query clears filter', () => {
      const s = setGraphSearch(createDependencyGraphViewState(nodes, edges), 'margin', nodes);
      const s2 = setGraphSearch(s, '', nodes);
      expect(s2.searchQuery).toBe('');
      expect(s2.filteredNodeIds.size).toBe(0);
    });
  });

  // ── getVisibleNodes ──

  describe('getVisibleNodes', () => {
    it('returns all nodes when nothing collapsed and no search', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(getVisibleNodes(s)).toEqual(nodes);
    });

    it('excludes nodes in collapsed layers', () => {
      const s = toggleLayerVisibility(createDependencyGraphViewState(nodes, edges), 1);
      const visible = getVisibleNodes(s);
      expect(visible.every(n => n.layer !== 1)).toBe(true);
      expect(visible.length).toBe(4); // layers 2,3,4,5
    });

    it('intersects with search filter', () => {
      let s = createDependencyGraphViewState(nodes, edges);
      s = setGraphSearch(s, 'margin', nodes);
      const visible = getVisibleNodes(s);
      expect(visible.length).toBe(2);
      expect(visible.map(n => n.id)).toContain('calc:margin');
      expect(visible.map(n => n.id)).toContain('metric:avg_margin');
    });

    it('applies both collapsed layers AND search filter', () => {
      let s = createDependencyGraphViewState(nodes, edges);
      s = setGraphSearch(s, 'margin', nodes);
      s = toggleLayerVisibility(s, 3); // collapse layer 3 (calc:margin)
      const visible = getVisibleNodes(s);
      expect(visible.length).toBe(1);
      expect(visible[0].id).toBe('metric:avg_margin');
    });
  });

  // ── getVisibleEdges ──

  describe('getVisibleEdges', () => {
    it('returns all edges when all nodes visible', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      expect(getVisibleEdges(s)).toEqual(edges);
    });

    it('excludes edges where from node is hidden', () => {
      const s = toggleLayerVisibility(createDependencyGraphViewState(nodes, edges), 1);
      const visible = getVisibleEdges(s);
      // field:revenue→calc:margin and field:cost→calc:margin should be excluded
      expect(visible.find(e => e.from === 'field:revenue')).toBeUndefined();
      expect(visible.find(e => e.from === 'field:cost')).toBeUndefined();
    });

    it('excludes edges where to node is hidden', () => {
      const s = toggleLayerVisibility(createDependencyGraphViewState(nodes, edges), 3);
      const visible = getVisibleEdges(s);
      // anything pointing to calc:margin (layer 3) should be excluded
      expect(visible.find(e => e.to === 'calc:margin')).toBeUndefined();
      // calc:margin→metric:avg_margin should also be excluded (from is hidden)
      expect(visible.find(e => e.from === 'calc:margin')).toBeUndefined();
    });

    it('only includes edges between visible nodes', () => {
      let s = createDependencyGraphViewState(nodes, edges);
      s = toggleLayerVisibility(s, 1);
      s = toggleLayerVisibility(s, 2);
      const visible = getVisibleEdges(s);
      // Only layers 3,4,5 visible
      // calc:margin→metric:avg_margin ✓
      // metric:avg_margin→kpi:profitability ✓
      expect(visible.length).toBe(2);
    });
  });

  // ── Immutability ──

  describe('immutability', () => {
    it('selectNode returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = selectNode(s, 'calc:margin');
      expect(s2).not.toBe(s);
      expect(s.selectedNodeId).toBeNull(); // original unchanged
    });

    it('clearSelection returns a new state object', () => {
      const s = selectNode(createDependencyGraphViewState(nodes, edges), 'calc:margin');
      const s2 = clearSelection(s);
      expect(s2).not.toBe(s);
      expect(s.selectedNodeId).toBe('calc:margin'); // original unchanged
    });

    it('highlightUpstream returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightUpstream(s, 'calc:margin', edges);
      expect(s2).not.toBe(s);
      expect(s.highlightedNodeIds.size).toBe(0); // original unchanged
    });

    it('highlightDownstream returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightDownstream(s, 'calc:margin', edges);
      expect(s2).not.toBe(s);
      expect(s.highlightedNodeIds.size).toBe(0);
    });

    it('highlightBoth returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = highlightBoth(s, 'calc:margin', edges);
      expect(s2).not.toBe(s);
    });

    it('toggleLayerVisibility returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = toggleLayerVisibility(s, 3);
      expect(s2).not.toBe(s);
      expect(s.collapsedLayers.size).toBe(0);
    });

    it('setGraphSearch returns a new state object', () => {
      const s = createDependencyGraphViewState(nodes, edges);
      const s2 = setGraphSearch(s, 'margin', nodes);
      expect(s2).not.toBe(s);
      expect(s.searchQuery).toBe('');
    });
  });
});
