/**
 * @phozart/widgets — Impact Chain State Tests (7A-C)
 */
import { describe, it, expect } from 'vitest';
import type {
  ImpactChainNode,
  HypothesisState,
  ImpactNodeRole,
} from '@phozart/shared/types';
import {
  initialImpactChainState,
  computeChainLayout,
  getChainContainerVariant,
  toggleNodeExpand,
  setContainerWidth,
  getHypothesisColor,
  getHypothesisLabel,
  getNodeRoleColor,
  computeChainSummary,
  resolveConclusion,
} from '../impact-chain-state.js';

// ========================================================================
// Test data factory
// ========================================================================

function makeChainNodes(): ImpactChainNode[] {
  return [
    {
      id: 'rc1',
      label: 'Memory Leak',
      status: 'active',
      children: ['f1'],
      nodeRole: 'root-cause',
      hypothesisState: 'validated',
    },
    {
      id: 'f1',
      label: 'OOM Crash',
      status: 'active',
      parentId: 'rc1',
      children: ['i1'],
      nodeRole: 'failure',
      hypothesisState: 'validated',
      edgeLabel: 'causes',
    },
    {
      id: 'i1',
      label: 'Service Downtime',
      status: 'pending',
      parentId: 'f1',
      children: [],
      nodeRole: 'impact',
      hypothesisState: 'inconclusive',
      edgeLabel: 'triggers',
      impactMetrics: [
        { label: 'Duration', value: '45min', field: 'downtime_min' },
      ],
    },
  ];
}

function makeHypothesisNodes(): ImpactChainNode[] {
  return [
    { id: 'h1', label: 'Hyp A', status: 'active', children: [], nodeRole: 'hypothesis', hypothesisState: 'validated' },
    { id: 'h2', label: 'Hyp B', status: 'active', children: [], nodeRole: 'hypothesis', hypothesisState: 'invalidated' },
    { id: 'h3', label: 'Hyp C', status: 'active', children: [], nodeRole: 'hypothesis', hypothesisState: 'inconclusive' },
    { id: 'h4', label: 'Hyp D', status: 'active', children: [], nodeRole: 'hypothesis', hypothesisState: 'pending' },
  ];
}

// ========================================================================
// initialImpactChainState
// ========================================================================

describe('initialImpactChainState', () => {
  it('creates state with default config', () => {
    const state = initialImpactChainState(makeChainNodes());
    expect(state.nodes).toHaveLength(3);
    expect(state.variant).toBe('impact-chain');
    expect(state.chainLayout.direction).toBe('horizontal');
    expect(state.chainLayout.showEdgeLabels).toBe(true);
    expect(state.chainLayout.collapseInvalidated).toBe(false);
    expect(state.containerWidth).toBe(800);
  });

  it('creates state with custom config', () => {
    const state = initialImpactChainState(makeChainNodes(), {
      renderVariant: 'tree',
      chainLayout: {
        direction: 'vertical',
        showEdgeLabels: false,
        collapseInvalidated: true,
      },
    });
    expect(state.variant).toBe('tree');
    expect(state.chainLayout.direction).toBe('vertical');
    expect(state.chainLayout.showEdgeLabels).toBe(false);
    expect(state.chainLayout.collapseInvalidated).toBe(true);
  });

  it('expands root nodes by default', () => {
    const state = initialImpactChainState(makeChainNodes());
    expect(state.expandedNodeIds.has('rc1')).toBe(true);
    expect(state.expandedNodeIds.has('f1')).toBe(false);
  });

  it('handles empty nodes array', () => {
    const state = initialImpactChainState([]);
    expect(state.nodes).toHaveLength(0);
    expect(state.expandedNodeIds.size).toBe(0);
  });

  it('uses default chain layout when config has no chainLayout', () => {
    const state = initialImpactChainState(makeChainNodes(), { renderVariant: 'impact-chain' });
    expect(state.chainLayout.direction).toBe('horizontal');
    expect(state.chainLayout.showEdgeLabels).toBe(true);
  });
});

// ========================================================================
// computeChainLayout
// ========================================================================

describe('computeChainLayout', () => {
  it('computes horizontal positions', () => {
    const state = initialImpactChainState(makeChainNodes());
    const layout = computeChainLayout(state);
    expect(layout.layoutDirection).toBe('horizontal');
    expect(layout.nodePositions).toHaveLength(3);
    // First node at x=0
    expect(layout.nodePositions[0].x).toBe(0);
    expect(layout.nodePositions[0].y).toBe(0);
    // Second node offset to the right
    expect(layout.nodePositions[1].x).toBeGreaterThan(0);
    expect(layout.nodePositions[1].y).toBe(0);
  });

  it('computes vertical positions', () => {
    const state = initialImpactChainState(makeChainNodes(), {
      renderVariant: 'impact-chain',
      chainLayout: { direction: 'vertical', showEdgeLabels: true, collapseInvalidated: false },
    });
    const layout = computeChainLayout(state);
    expect(layout.layoutDirection).toBe('vertical');
    expect(layout.nodePositions[0].x).toBe(0);
    expect(layout.nodePositions[0].y).toBe(0);
    expect(layout.nodePositions[1].x).toBe(0);
    expect(layout.nodePositions[1].y).toBeGreaterThan(0);
  });

  it('generates edges between consecutive nodes', () => {
    const state = initialImpactChainState(makeChainNodes());
    const layout = computeChainLayout(state);
    expect(layout.edges).toHaveLength(2);
    expect(layout.edges[0].from).toBe('rc1');
    expect(layout.edges[0].to).toBe('f1');
    expect(layout.edges[1].from).toBe('f1');
    expect(layout.edges[1].to).toBe('i1');
  });

  it('includes edge labels when showEdgeLabels is true', () => {
    const state = initialImpactChainState(makeChainNodes());
    const layout = computeChainLayout(state);
    expect(layout.edges[0].label).toBe('causes');
    expect(layout.edges[1].label).toBe('triggers');
  });

  it('excludes edge labels when showEdgeLabels is false', () => {
    const state = initialImpactChainState(makeChainNodes(), {
      renderVariant: 'impact-chain',
      chainLayout: { direction: 'horizontal', showEdgeLabels: false, collapseInvalidated: false },
    });
    const layout = computeChainLayout(state);
    expect(layout.edges[0].label).toBeUndefined();
  });

  it('collapses invalidated nodes when collapseInvalidated is true', () => {
    const state = initialImpactChainState(makeHypothesisNodes(), {
      renderVariant: 'impact-chain',
      chainLayout: { direction: 'horizontal', showEdgeLabels: true, collapseInvalidated: true },
    });
    const layout = computeChainLayout(state);
    // h2 is invalidated, should be excluded
    const nodeIds = layout.nodePositions.map(p => p.nodeId);
    expect(nodeIds).not.toContain('h2');
    expect(nodeIds).toContain('h1');
    expect(nodeIds).toContain('h3');
    expect(nodeIds).toContain('h4');
    expect(layout.nodePositions).toHaveLength(3);
  });

  it('includes all nodes when collapseInvalidated is false', () => {
    const state = initialImpactChainState(makeHypothesisNodes());
    const layout = computeChainLayout(state);
    expect(layout.nodePositions).toHaveLength(4);
  });

  it('returns no edges for single-node chain', () => {
    const state = initialImpactChainState([
      { id: 'solo', label: 'Solo', status: 'active', children: [] },
    ]);
    const layout = computeChainLayout(state);
    expect(layout.edges).toHaveLength(0);
    expect(layout.nodePositions).toHaveLength(1);
  });

  it('returns empty layout for empty nodes', () => {
    const state = initialImpactChainState([]);
    const layout = computeChainLayout(state);
    expect(layout.nodePositions).toHaveLength(0);
    expect(layout.edges).toHaveLength(0);
  });

  it('all nodePositions have positive width and height', () => {
    const state = initialImpactChainState(makeChainNodes());
    const layout = computeChainLayout(state);
    for (const pos of layout.nodePositions) {
      expect(pos.width).toBeGreaterThan(0);
      expect(pos.height).toBeGreaterThan(0);
    }
  });
});

// ========================================================================
// getChainContainerVariant
// ========================================================================

describe('getChainContainerVariant', () => {
  it('returns full for width > 600', () => {
    expect(getChainContainerVariant(800)).toBe('full');
    expect(getChainContainerVariant(601)).toBe('full');
  });

  it('returns compact for width 200-600', () => {
    expect(getChainContainerVariant(600)).toBe('compact');
    expect(getChainContainerVariant(400)).toBe('compact');
    expect(getChainContainerVariant(200)).toBe('compact');
  });

  it('returns summary for width < 200', () => {
    expect(getChainContainerVariant(199)).toBe('summary');
    expect(getChainContainerVariant(100)).toBe('summary');
    expect(getChainContainerVariant(0)).toBe('summary');
  });
});

// ========================================================================
// toggleNodeExpand
// ========================================================================

describe('toggleNodeExpand', () => {
  it('expands a collapsed node', () => {
    const state = initialImpactChainState(makeChainNodes());
    expect(state.expandedNodeIds.has('f1')).toBe(false);
    const next = toggleNodeExpand(state, 'f1');
    expect(next.expandedNodeIds.has('f1')).toBe(true);
  });

  it('collapses an expanded node', () => {
    const state = initialImpactChainState(makeChainNodes());
    expect(state.expandedNodeIds.has('rc1')).toBe(true);
    const next = toggleNodeExpand(state, 'rc1');
    expect(next.expandedNodeIds.has('rc1')).toBe(false);
  });

  it('returns a new state object (immutable)', () => {
    const state = initialImpactChainState(makeChainNodes());
    const next = toggleNodeExpand(state, 'f1');
    expect(next).not.toBe(state);
    expect(next.expandedNodeIds).not.toBe(state.expandedNodeIds);
    // Shared references for unchanged fields
    expect(next.nodes).toBe(state.nodes);
  });
});

// ========================================================================
// setContainerWidth
// ========================================================================

describe('setContainerWidth', () => {
  it('updates the container width', () => {
    const state = initialImpactChainState(makeChainNodes());
    const next = setContainerWidth(state, 400);
    expect(next.containerWidth).toBe(400);
  });

  it('returns a new state object', () => {
    const state = initialImpactChainState(makeChainNodes());
    const next = setContainerWidth(state, 400);
    expect(next).not.toBe(state);
  });
});

// ========================================================================
// getHypothesisColor
// ========================================================================

describe('getHypothesisColor', () => {
  it('returns green for validated', () => {
    expect(getHypothesisColor('validated')).toBe('#22c55e');
  });

  it('returns amber for inconclusive', () => {
    expect(getHypothesisColor('inconclusive')).toBe('#f59e0b');
  });

  it('returns red for invalidated', () => {
    expect(getHypothesisColor('invalidated')).toBe('#ef4444');
  });

  it('returns muted for pending', () => {
    expect(getHypothesisColor('pending')).toBe('#a8a29e');
  });

  it('returns a color for every HypothesisState', () => {
    const states: HypothesisState[] = ['validated', 'inconclusive', 'invalidated', 'pending'];
    for (const hs of states) {
      expect(getHypothesisColor(hs)).toBeTruthy();
    }
  });
});

// ========================================================================
// getHypothesisLabel
// ========================================================================

describe('getHypothesisLabel', () => {
  it('returns human-readable labels for all states', () => {
    expect(getHypothesisLabel('validated')).toBe('Validated');
    expect(getHypothesisLabel('inconclusive')).toBe('Inconclusive');
    expect(getHypothesisLabel('invalidated')).toBe('Invalidated');
    expect(getHypothesisLabel('pending')).toBe('Pending');
  });
});

// ========================================================================
// getNodeRoleColor
// ========================================================================

describe('getNodeRoleColor', () => {
  it('returns distinct colors for all roles', () => {
    const roles: ImpactNodeRole[] = ['root-cause', 'failure', 'impact', 'hypothesis'];
    const colors = roles.map(r => getNodeRoleColor(r));
    expect(new Set(colors).size).toBe(4);
  });

  it('returns red for root-cause', () => {
    expect(getNodeRoleColor('root-cause')).toBe('#dc2626');
  });

  it('returns amber for failure', () => {
    expect(getNodeRoleColor('failure')).toBe('#f59e0b');
  });

  it('returns blue for impact', () => {
    expect(getNodeRoleColor('impact')).toBe('#3b82f6');
  });

  it('returns purple for hypothesis', () => {
    expect(getNodeRoleColor('hypothesis')).toBe('#8b5cf6');
  });
});

// ========================================================================
// computeChainSummary
// ========================================================================

describe('computeChainSummary', () => {
  it('counts hypothesis states', () => {
    const summary = computeChainSummary(makeHypothesisNodes());
    expect(summary.validated).toBe(1);
    expect(summary.invalidated).toBe(1);
    expect(summary.inconclusive).toBe(1);
    expect(summary.pending).toBe(1);
  });

  it('extracts root cause labels', () => {
    const summary = computeChainSummary(makeChainNodes());
    expect(summary.rootCauses).toEqual(['Memory Leak']);
  });

  it('extracts impact labels', () => {
    const summary = computeChainSummary(makeChainNodes());
    expect(summary.impacts).toEqual(['Service Downtime']);
  });

  it('handles empty nodes', () => {
    const summary = computeChainSummary([]);
    expect(summary.validated).toBe(0);
    expect(summary.invalidated).toBe(0);
    expect(summary.rootCauses).toEqual([]);
    expect(summary.impacts).toEqual([]);
  });

  it('defaults missing hypothesisState to pending', () => {
    const nodes: ImpactChainNode[] = [
      { id: 'x', label: 'No state', status: 'active', children: [] },
    ];
    const summary = computeChainSummary(nodes);
    expect(summary.pending).toBe(1);
  });

  it('handles multiple root causes', () => {
    const nodes: ImpactChainNode[] = [
      { id: 'rc1', label: 'Cause A', status: 'active', children: [], nodeRole: 'root-cause' },
      { id: 'rc2', label: 'Cause B', status: 'active', children: [], nodeRole: 'root-cause' },
    ];
    const summary = computeChainSummary(nodes);
    expect(summary.rootCauses).toEqual(['Cause A', 'Cause B']);
  });
});

// ========================================================================
// resolveConclusion
// ========================================================================

describe('resolveConclusion', () => {
  it('resolves built-in template variables', () => {
    const result = resolveConclusion(
      '{{validatedCount}} validated, {{invalidatedCount}} invalidated',
      makeHypothesisNodes(),
    );
    expect(result).toBe('1 validated, 1 invalidated');
  });

  it('resolves rootCauses and impacts variables', () => {
    const result = resolveConclusion(
      'Root: {{rootCauses}} | Impact: {{impacts}}',
      makeChainNodes(),
    );
    expect(result).toBe('Root: Memory Leak | Impact: Service Downtime');
  });

  it('resolves custom data variables', () => {
    const result = resolveConclusion(
      'Team: {{team}}, Severity: {{severity}}',
      [],
      { team: 'Platform', severity: 'P1' },
    );
    expect(result).toBe('Team: Platform, Severity: P1');
  });

  it('replaces unknown variables with empty string', () => {
    const result = resolveConclusion('Value: {{unknown}}', []);
    expect(result).toBe('Value: ');
  });

  it('returns template unchanged when no variables present', () => {
    const result = resolveConclusion('No variables here', makeChainNodes());
    expect(result).toBe('No variables here');
  });

  it('handles empty template', () => {
    const result = resolveConclusion('', makeChainNodes());
    expect(result).toBe('');
  });

  it('custom data overrides built-in variables', () => {
    const result = resolveConclusion(
      '{{validatedCount}} ok',
      makeHypothesisNodes(),
      { validatedCount: '99' },
    );
    expect(result).toBe('99 ok');
  });

  it('handles null/undefined values in data gracefully', () => {
    const result = resolveConclusion(
      '{{val}}',
      [],
      { val: null as unknown as string },
    );
    expect(result).toBe('');
  });
});
