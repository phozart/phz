/**
 * @phozart/shared — Impact Chain Type Tests (7A-C)
 */
import { describe, it, expect } from 'vitest';
import type {
  ImpactChainNode,
  ImpactNodeRole,
  HypothesisState,
  ImpactMetric,
  ChainLayout,
  ChainLayoutDirection,
  DecisionTreeRenderVariant,
  DecisionTreeVariantConfig,
  DecisionTreeNode,
} from '../types/index.js';
import { IMPACT_CHAIN_TOKENS, generateChainTokenCSS, resolveChainTokenVar } from '../design-system/chain-tokens.js';

// ========================================================================
// Helper: minimal ImpactChainNode factory
// ========================================================================

function makeImpactNode(overrides?: Partial<ImpactChainNode>): ImpactChainNode {
  return {
    id: 'n1',
    label: 'Test Node',
    status: 'active',
    children: [],
    ...overrides,
  };
}

// ========================================================================
// ImpactChainNode extends DecisionTreeNode
// ========================================================================

describe('ImpactChainNode type', () => {
  it('is assignable to DecisionTreeNode (structural subtyping)', () => {
    const impactNode: ImpactChainNode = makeImpactNode({
      nodeRole: 'root-cause',
      hypothesisState: 'validated',
    });
    // Should be assignable to DecisionTreeNode without loss of base fields
    const treeNode: DecisionTreeNode = impactNode;
    expect(treeNode.id).toBe('n1');
    expect(treeNode.label).toBe('Test Node');
    expect(treeNode.status).toBe('active');
    expect(treeNode.children).toEqual([]);
  });

  it('preserves all base DecisionTreeNode fields', () => {
    const node = makeImpactNode({
      description: 'A test node',
      parentId: 'root',
      children: ['c1', 'c2'],
      condition: 'x > 5',
      data: { key: 'value' },
    });
    expect(node.description).toBe('A test node');
    expect(node.parentId).toBe('root');
    expect(node.children).toEqual(['c1', 'c2']);
    expect(node.condition).toBe('x > 5');
    expect(node.data).toEqual({ key: 'value' });
  });

  it('supports all ImpactNodeRole values', () => {
    const roles: ImpactNodeRole[] = ['root-cause', 'failure', 'impact', 'hypothesis'];
    for (const role of roles) {
      const node = makeImpactNode({ nodeRole: role });
      expect(node.nodeRole).toBe(role);
    }
  });

  it('supports all HypothesisState values', () => {
    const states: HypothesisState[] = ['validated', 'inconclusive', 'invalidated', 'pending'];
    for (const hs of states) {
      const node = makeImpactNode({ hypothesisState: hs });
      expect(node.hypothesisState).toBe(hs);
    }
  });

  it('supports impactMetrics array', () => {
    const metrics: ImpactMetric[] = [
      { label: 'Latency', value: '123ms', field: 'latency_p99' },
      { label: 'Error Rate', value: '4.5%', field: 'error_rate' },
    ];
    const node = makeImpactNode({ impactMetrics: metrics });
    expect(node.impactMetrics).toHaveLength(2);
    expect(node.impactMetrics![0].label).toBe('Latency');
    expect(node.impactMetrics![1].field).toBe('error_rate');
  });

  it('supports edgeLabel', () => {
    const node = makeImpactNode({ edgeLabel: 'causes' });
    expect(node.edgeLabel).toBe('causes');
  });

  it('allows optional extension fields to be undefined', () => {
    const node = makeImpactNode();
    expect(node.nodeRole).toBeUndefined();
    expect(node.hypothesisState).toBeUndefined();
    expect(node.impactMetrics).toBeUndefined();
    expect(node.edgeLabel).toBeUndefined();
  });
});

// ========================================================================
// ChainLayout defaults
// ========================================================================

describe('ChainLayout', () => {
  it('supports horizontal direction', () => {
    const layout: ChainLayout = {
      direction: 'horizontal',
      showEdgeLabels: true,
      collapseInvalidated: false,
    };
    expect(layout.direction).toBe('horizontal');
  });

  it('supports vertical direction', () => {
    const layout: ChainLayout = {
      direction: 'vertical',
      showEdgeLabels: false,
      collapseInvalidated: true,
    };
    expect(layout.direction).toBe('vertical');
  });

  it('supports optional conclusionText', () => {
    const layout: ChainLayout = {
      direction: 'horizontal',
      showEdgeLabels: true,
      collapseInvalidated: false,
      conclusionText: '{{validatedCount}} hypotheses validated',
    };
    expect(layout.conclusionText).toContain('validated');
  });

  it('all ChainLayoutDirection values are covered', () => {
    const dirs: ChainLayoutDirection[] = ['horizontal', 'vertical'];
    expect(dirs).toHaveLength(2);
  });
});

// ========================================================================
// DecisionTreeVariantConfig
// ========================================================================

describe('DecisionTreeVariantConfig', () => {
  it('supports tree variant', () => {
    const config: DecisionTreeVariantConfig = { renderVariant: 'tree' };
    expect(config.renderVariant).toBe('tree');
    expect(config.chainLayout).toBeUndefined();
  });

  it('supports impact-chain variant with layout', () => {
    const config: DecisionTreeVariantConfig = {
      renderVariant: 'impact-chain',
      chainLayout: {
        direction: 'horizontal',
        showEdgeLabels: true,
        collapseInvalidated: false,
      },
    };
    expect(config.renderVariant).toBe('impact-chain');
    expect(config.chainLayout?.direction).toBe('horizontal');
  });

  it('all DecisionTreeRenderVariant values are covered', () => {
    const variants: DecisionTreeRenderVariant[] = ['tree', 'impact-chain'];
    expect(variants).toHaveLength(2);
  });
});

// ========================================================================
// Type narrowing
// ========================================================================

describe('type narrowing', () => {
  it('narrows ImpactChainNode by checking nodeRole', () => {
    const node = makeImpactNode({ nodeRole: 'hypothesis', hypothesisState: 'validated' });
    if (node.nodeRole === 'hypothesis') {
      expect(node.hypothesisState).toBe('validated');
    }
  });

  it('narrows array of ImpactChainNode by filtering on nodeRole', () => {
    const nodes: ImpactChainNode[] = [
      makeImpactNode({ id: 'n1', nodeRole: 'root-cause' }),
      makeImpactNode({ id: 'n2', nodeRole: 'hypothesis' }),
      makeImpactNode({ id: 'n3', nodeRole: 'impact' }),
    ];
    const hypotheses = nodes.filter(n => n.nodeRole === 'hypothesis');
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].id).toBe('n2');
  });
});

// ========================================================================
// Impact Chain Design Tokens (chain-tokens.ts)
// ========================================================================

describe('IMPACT_CHAIN_TOKENS', () => {
  it('has exactly 6 token entries', () => {
    expect(Object.keys(IMPACT_CHAIN_TOKENS)).toHaveLength(6);
  });

  it('contains expected token keys', () => {
    expect(IMPACT_CHAIN_TOKENS['chain.rootCause.accent']).toBe('#dc2626');
    expect(IMPACT_CHAIN_TOKENS['chain.failure.accent']).toBe('#f59e0b');
    expect(IMPACT_CHAIN_TOKENS['chain.impact.accent']).toBe('#3b82f6');
    expect(IMPACT_CHAIN_TOKENS['chain.hypothesis.validated']).toBe('#22c55e');
    expect(IMPACT_CHAIN_TOKENS['chain.hypothesis.invalidated']).toBe('#ef4444');
    expect(IMPACT_CHAIN_TOKENS['chain.hypothesis.pending']).toBe('#f59e0b');
  });

  it('all values are valid hex color strings', () => {
    for (const value of Object.values(IMPACT_CHAIN_TOKENS)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('generateChainTokenCSS', () => {
  it('generates CSS declarations for all tokens', () => {
    const css = generateChainTokenCSS();
    expect(css).toContain('--phz-chain-root-cause-accent');
    expect(css).toContain('--phz-chain-hypothesis-validated');
    expect(css).toContain('#dc2626');
  });
});

describe('resolveChainTokenVar', () => {
  it('returns CSS var() reference with fallback', () => {
    const result = resolveChainTokenVar('chain.rootCause.accent');
    expect(result).toBe('var(--phz-chain-root-cause-accent, #dc2626)');
  });
});
