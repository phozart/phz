/**
 * @phozart/widgets — Decision Tree State Tests
 */
import { describe, it, expect, vi } from 'vitest';
import type { DecisionTreeNode, NodeStatus } from '@phozart/shared/types';
import {
  createDecisionTreeState,
  toggleNode,
  evaluateAllNodes,
  getVisibleNodes,
  findNodePath,
  getNodeDepth,
  getEffectiveStatus,
} from '../decision-tree-state.js';

function makeNodes(): DecisionTreeNode[] {
  return [
    { id: 'root', label: 'Start', status: 'active', children: ['a', 'b'] },
    { id: 'a', label: 'Option A', status: 'pending', parentId: 'root', children: ['a1'] },
    { id: 'b', label: 'Option B', status: 'complete', parentId: 'root', children: [] },
    { id: 'a1', label: 'Sub-option A1', status: 'pending', parentId: 'a', children: [] },
  ];
}

describe('createDecisionTreeState', () => {
  it('creates state with root nodes expanded', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(state.nodes).toHaveLength(4);
    expect(state.expandedNodeIds.has('root')).toBe(true);
    // Non-root nodes should not be auto-expanded
    expect(state.expandedNodeIds.has('a')).toBe(false);
    expect(state.expandedNodeIds.has('b')).toBe(false);
  });

  it('handles empty node array', () => {
    const state = createDecisionTreeState([]);
    expect(state.nodes).toHaveLength(0);
    expect(state.expandedNodeIds.size).toBe(0);
    expect(state.evaluatedStatuses.size).toBe(0);
  });

  it('handles multiple root nodes', () => {
    const nodes: DecisionTreeNode[] = [
      { id: 'r1', label: 'Root 1', status: 'pending', children: [] },
      { id: 'r2', label: 'Root 2', status: 'pending', children: [] },
    ];
    const state = createDecisionTreeState(nodes);
    expect(state.expandedNodeIds.has('r1')).toBe(true);
    expect(state.expandedNodeIds.has('r2')).toBe(true);
  });
});

describe('toggleNode', () => {
  it('expands a collapsed node', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(state.expandedNodeIds.has('a')).toBe(false);

    const toggled = toggleNode(state, 'a');
    expect(toggled.expandedNodeIds.has('a')).toBe(true);
  });

  it('collapses an expanded node', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(state.expandedNodeIds.has('root')).toBe(true);

    const toggled = toggleNode(state, 'root');
    expect(toggled.expandedNodeIds.has('root')).toBe(false);
  });

  it('returns new state object (immutable)', () => {
    const state = createDecisionTreeState(makeNodes());
    const toggled = toggleNode(state, 'a');
    expect(toggled).not.toBe(state);
    expect(toggled.expandedNodeIds).not.toBe(state.expandedNodeIds);
  });
});

describe('evaluateAllNodes', () => {
  it('applies evaluator to all nodes', () => {
    const state = createDecisionTreeState(makeNodes());
    const evaluator = (node: DecisionTreeNode): NodeStatus => {
      return node.children.length > 0 ? 'active' : 'complete';
    };

    const evaluated = evaluateAllNodes(state, evaluator);
    expect(evaluated.evaluatedStatuses.get('root')).toBe('active');
    expect(evaluated.evaluatedStatuses.get('a')).toBe('active');
    expect(evaluated.evaluatedStatuses.get('b')).toBe('complete');
    expect(evaluated.evaluatedStatuses.get('a1')).toBe('complete');
  });

  it('returns new state object (immutable)', () => {
    const state = createDecisionTreeState(makeNodes());
    const evaluated = evaluateAllNodes(state, () => 'pending');
    expect(evaluated).not.toBe(state);
    expect(evaluated.evaluatedStatuses).not.toBe(state.evaluatedStatuses);
  });
});

describe('getVisibleNodes', () => {
  it('shows root nodes always', () => {
    const state = createDecisionTreeState(makeNodes());
    // Root is expanded, so its children are visible too
    const visible = getVisibleNodes(state);
    const ids = visible.map(n => n.id);
    expect(ids).toContain('root');
  });

  it('shows children of expanded parents', () => {
    const state = createDecisionTreeState(makeNodes());
    // Root is auto-expanded -> a, b are visible
    const visible = getVisibleNodes(state);
    const ids = visible.map(n => n.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('hides children of collapsed parents', () => {
    const state = createDecisionTreeState(makeNodes());
    // 'a' is not expanded, so 'a1' should be hidden
    const visible = getVisibleNodes(state);
    const ids = visible.map(n => n.id);
    expect(ids).not.toContain('a1');
  });

  it('shows grandchildren when all ancestors are expanded', () => {
    let state = createDecisionTreeState(makeNodes());
    state = toggleNode(state, 'a'); // expand 'a'
    const visible = getVisibleNodes(state);
    const ids = visible.map(n => n.id);
    expect(ids).toContain('a1');
  });

  it('hides grandchildren when intermediate parent is collapsed', () => {
    let state = createDecisionTreeState(makeNodes());
    state = toggleNode(state, 'a'); // expand 'a'
    state = toggleNode(state, 'root'); // collapse 'root'
    const visible = getVisibleNodes(state);
    const ids = visible.map(n => n.id);
    expect(ids).toContain('root');
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('a1');
    expect(ids).not.toContain('b');
  });
});

describe('findNodePath', () => {
  it('returns path from root to target node', () => {
    const state = createDecisionTreeState(makeNodes());
    const path = findNodePath(state, 'a1');
    expect(path.map(n => n.id)).toEqual(['root', 'a', 'a1']);
  });

  it('returns single-element path for root node', () => {
    const state = createDecisionTreeState(makeNodes());
    const path = findNodePath(state, 'root');
    expect(path.map(n => n.id)).toEqual(['root']);
  });

  it('returns empty array for non-existent node', () => {
    const state = createDecisionTreeState(makeNodes());
    const path = findNodePath(state, 'nonexistent');
    expect(path).toEqual([]);
  });
});

describe('getNodeDepth', () => {
  it('returns 0 for root nodes', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getNodeDepth(state, 'root')).toBe(0);
  });

  it('returns 1 for direct children', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getNodeDepth(state, 'a')).toBe(1);
    expect(getNodeDepth(state, 'b')).toBe(1);
  });

  it('returns 2 for grandchildren', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getNodeDepth(state, 'a1')).toBe(2);
  });

  it('returns -1 for non-existent node', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getNodeDepth(state, 'nonexistent')).toBe(-1);
  });
});

describe('getEffectiveStatus', () => {
  it('returns evaluated status when available', () => {
    let state = createDecisionTreeState(makeNodes());
    state = evaluateAllNodes(state, () => 'complete');
    expect(getEffectiveStatus(state, 'root')).toBe('complete');
  });

  it('falls back to node own status when not evaluated', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getEffectiveStatus(state, 'root')).toBe('active');
    expect(getEffectiveStatus(state, 'b')).toBe('complete');
  });

  it('returns pending for unknown node', () => {
    const state = createDecisionTreeState(makeNodes());
    expect(getEffectiveStatus(state, 'nonexistent')).toBe('pending');
  });

  it('evaluated status overrides node own status', () => {
    let state = createDecisionTreeState(makeNodes());
    // 'b' has status 'complete', override to 'error'
    state = evaluateAllNodes(state, (node) =>
      node.id === 'b' ? 'error' : 'pending',
    );
    expect(getEffectiveStatus(state, 'b')).toBe('error');
  });

  it('supports all NodeStatus values', () => {
    const statuses: NodeStatus[] = ['pending', 'active', 'complete', 'skipped', 'error'];
    for (const status of statuses) {
      let state = createDecisionTreeState(makeNodes());
      state = evaluateAllNodes(state, () => status);
      expect(getEffectiveStatus(state, 'root')).toBe(status);
    }
  });
});

// ========================================================================
// Additional edge-case coverage for Wave 2
// ========================================================================

describe('toggleNode — additional edge cases', () => {
  it('preserves nodes and evaluatedStatuses references', () => {
    const state = createDecisionTreeState(makeNodes());
    const next = toggleNode(state, 'a');
    expect(next.nodes).toBe(state.nodes);
    expect(next.evaluatedStatuses).toBe(state.evaluatedStatuses);
  });

  it('toggle twice returns to original expansion state', () => {
    const state = createDecisionTreeState(makeNodes());
    const toggled = toggleNode(toggleNode(state, 'a'), 'a');
    expect(toggled.expandedNodeIds.has('a')).toBe(false);
  });

  it('can expand multiple nodes independently', () => {
    let state = createDecisionTreeState(makeNodes());
    state = toggleNode(state, 'a');
    state = toggleNode(state, 'b');
    expect(state.expandedNodeIds.has('a')).toBe(true);
    expect(state.expandedNodeIds.has('b')).toBe(true);
    expect(state.expandedNodeIds.has('root')).toBe(true);
  });
});

describe('evaluateAllNodes — additional edge cases', () => {
  it('preserves nodes and expandedNodeIds references', () => {
    const state = createDecisionTreeState(makeNodes());
    const next = evaluateAllNodes(state, () => 'pending');
    expect(next.nodes).toBe(state.nodes);
    expect(next.expandedNodeIds).toBe(state.expandedNodeIds);
  });

  it('calls evaluator with correct number of nodes', () => {
    const state = createDecisionTreeState(makeNodes());
    const evaluator = vi.fn((_node: DecisionTreeNode) => 'active' as NodeStatus);
    evaluateAllNodes(state, evaluator);
    expect(evaluator).toHaveBeenCalledTimes(4);
  });
});

describe('getVisibleNodes — additional edge cases', () => {
  it('returns empty for empty tree', () => {
    const state = createDecisionTreeState([]);
    expect(getVisibleNodes(state)).toEqual([]);
  });

  it('all root nodes visible in flat tree', () => {
    const nodes: DecisionTreeNode[] = [
      { id: 'n1', label: 'N1', status: 'active', children: [] },
      { id: 'n2', label: 'N2', status: 'pending', children: [] },
    ];
    const state = createDecisionTreeState(nodes);
    expect(getVisibleNodes(state)).toHaveLength(2);
  });
});

describe('findNodePath — additional edge cases', () => {
  it('returns 2-element path for direct child', () => {
    const state = createDecisionTreeState(makeNodes());
    const path = findNodePath(state, 'a');
    expect(path.map(n => n.id)).toEqual(['root', 'a']);
  });
});

describe('getNodeDepth — edge cases', () => {
  it('returns 0 for all root nodes in flat tree', () => {
    const nodes: DecisionTreeNode[] = [
      { id: 'n1', label: 'N1', status: 'active', children: [] },
      { id: 'n2', label: 'N2', status: 'pending', children: [] },
    ];
    const state = createDecisionTreeState(nodes);
    expect(getNodeDepth(state, 'n1')).toBe(0);
    expect(getNodeDepth(state, 'n2')).toBe(0);
  });
});
