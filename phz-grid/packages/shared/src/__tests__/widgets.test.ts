/**
 * Tests for Widget types and helpers.
 */
import {
  getViewSwitchingMode,
  createDefaultExpandableConfig,
  createDefaultContainerBoxConfig,
  evaluateNodeStatus,
} from '@phozart/phz-shared/types';
import type { DecisionTreeNode } from '@phozart/phz-shared/types';

// ========================================================================
// getViewSwitchingMode
// ========================================================================

describe('getViewSwitchingMode', () => {
  it('returns "toggle" for 1 view', () => {
    expect(getViewSwitchingMode(1)).toBe('toggle');
  });

  it('returns "toggle" for 2 views', () => {
    expect(getViewSwitchingMode(2)).toBe('toggle');
  });

  it('returns "tabs" for 3 views', () => {
    expect(getViewSwitchingMode(3)).toBe('tabs');
  });

  it('returns "tabs" for 5 views', () => {
    expect(getViewSwitchingMode(5)).toBe('tabs');
  });

  it('returns "dropdown" for 6 views', () => {
    expect(getViewSwitchingMode(6)).toBe('dropdown');
  });

  it('returns "dropdown" for 10 views', () => {
    expect(getViewSwitchingMode(10)).toBe('dropdown');
  });

  it('returns "toggle" for 0 views', () => {
    expect(getViewSwitchingMode(0)).toBe('toggle');
  });
});

// ========================================================================
// createDefaultExpandableConfig
// ========================================================================

describe('createDefaultExpandableConfig', () => {
  it('creates default config', () => {
    const config = createDefaultExpandableConfig();
    expect(config.expandable).toBe(true);
    expect(config.defaultExpanded).toBe(false);
    expect(config.animationDurationMs).toBe(200);
    expect(config.showToggle).toBe(true);
    expect(config.collapsedMaxHeight).toBe(0);
  });

  it('applies overrides', () => {
    const config = createDefaultExpandableConfig({
      expandable: false,
      defaultExpanded: true,
      animationDurationMs: 500,
      showToggle: false,
      collapsedMaxHeight: 100,
    });
    expect(config.expandable).toBe(false);
    expect(config.defaultExpanded).toBe(true);
    expect(config.animationDurationMs).toBe(500);
    expect(config.showToggle).toBe(false);
    expect(config.collapsedMaxHeight).toBe(100);
  });

  it('applies partial overrides', () => {
    const config = createDefaultExpandableConfig({ animationDurationMs: 300 });
    expect(config.expandable).toBe(true);
    expect(config.animationDurationMs).toBe(300);
  });
});

// ========================================================================
// createDefaultContainerBoxConfig
// ========================================================================

describe('createDefaultContainerBoxConfig', () => {
  it('creates default config', () => {
    const config = createDefaultContainerBoxConfig();
    expect(config.background).toBe('var(--phz-surface, #ffffff)');
    expect(config.borderRadius).toBe(8);
    expect(config.padding).toBe(16);
    expect(config.shadow).toContain('--phz-shadow-sm');
    expect(config.border).toContain('--phz-border');
    expect(config.minHeight).toBe(120);
    expect(config.showHeader).toBe(true);
    expect(config.clipOverflow).toBe(false);
  });

  it('applies overrides', () => {
    const config = createDefaultContainerBoxConfig({
      background: '#000',
      borderRadius: 0,
      padding: 0,
      shadow: 'none',
      border: 'none',
      minHeight: 200,
      showHeader: false,
      clipOverflow: true,
    });
    expect(config.background).toBe('#000');
    expect(config.borderRadius).toBe(0);
    expect(config.padding).toBe(0);
    expect(config.shadow).toBe('none');
    expect(config.border).toBe('none');
    expect(config.minHeight).toBe(200);
    expect(config.showHeader).toBe(false);
    expect(config.clipOverflow).toBe(true);
  });
});

// ========================================================================
// evaluateNodeStatus
// ========================================================================

describe('evaluateNodeStatus', () => {
  function makeNode(id: string, status: DecisionTreeNode['status'], children: string[] = []): DecisionTreeNode {
    return { id, label: id, status, children };
  }

  it('returns own status when no children', () => {
    const node = makeNode('n1', 'active');
    expect(evaluateNodeStatus(node, new Map())).toBe('active');
  });

  it('returns own status for each leaf status', () => {
    expect(evaluateNodeStatus(makeNode('n', 'pending'), new Map())).toBe('pending');
    expect(evaluateNodeStatus(makeNode('n', 'complete'), new Map())).toBe('complete');
    expect(evaluateNodeStatus(makeNode('n', 'skipped'), new Map())).toBe('skipped');
    expect(evaluateNodeStatus(makeNode('n', 'error'), new Map())).toBe('error');
  });

  it('returns "complete" when all children are complete', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'complete')],
      ['c2', makeNode('c2', 'complete')],
    ]);
    const parent = makeNode('p', 'active', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('complete');
  });

  it('returns "skipped" when all children are skipped', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'skipped')],
      ['c2', makeNode('c2', 'skipped')],
    ]);
    const parent = makeNode('p', 'active', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('skipped');
  });

  it('returns "error" when any child has error', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'complete')],
      ['c2', makeNode('c2', 'error')],
    ]);
    const parent = makeNode('p', 'active', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('error');
  });

  it('returns "active" when any child is active (and none have error)', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'complete')],
      ['c2', makeNode('c2', 'active')],
    ]);
    const parent = makeNode('p', 'pending', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('active');
  });

  it('returns "pending" when children are a mix of complete and pending', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'complete')],
      ['c2', makeNode('c2', 'pending')],
    ]);
    const parent = makeNode('p', 'active', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('pending');
  });

  it('defaults missing children to "pending"', () => {
    const nodes = new Map<string, DecisionTreeNode>();
    const parent = makeNode('p', 'active', ['missing-child']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('pending');
  });

  it('error takes priority over active', () => {
    const nodes = new Map<string, DecisionTreeNode>([
      ['c1', makeNode('c1', 'active')],
      ['c2', makeNode('c2', 'error')],
    ]);
    const parent = makeNode('p', 'active', ['c1', 'c2']);
    expect(evaluateNodeStatus(parent, nodes)).toBe('error');
  });
});
