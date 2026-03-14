/**
 * @phozart/widgets — Decision Tree Variants Tests (7A-C)
 */
import { describe, it, expect } from 'vitest';
import { DECISION_TREE_VARIANTS } from '../decision-tree-variants.js';
import type { DecisionTreeRenderVariant } from '@phozart/shared/types';

describe('DECISION_TREE_VARIANTS', () => {
  it('contains exactly 2 variants', () => {
    expect(DECISION_TREE_VARIANTS).toHaveLength(2);
  });

  it('has tree variant as first entry', () => {
    const tree = DECISION_TREE_VARIANTS[0];
    expect(tree.id).toBe('tree');
    expect(tree.name).toBe('Status Tree');
    expect(tree.description).toBeTruthy();
    expect(tree.presetConfig.renderVariant).toBe('tree');
  });

  it('has impact-chain variant as second entry', () => {
    const chain = DECISION_TREE_VARIANTS[1];
    expect(chain.id).toBe('impact-chain');
    expect(chain.name).toBe('Impact Chain');
    expect(chain.description).toBeTruthy();
    expect(chain.presetConfig.renderVariant).toBe('impact-chain');
  });

  it('all presetConfig renderVariant values are valid DecisionTreeRenderVariant', () => {
    const validVariants: DecisionTreeRenderVariant[] = ['tree', 'impact-chain'];
    for (const variant of DECISION_TREE_VARIANTS) {
      expect(validVariants).toContain(variant.presetConfig.renderVariant);
    }
  });

  it('each variant has a unique id', () => {
    const ids = DECISION_TREE_VARIANTS.map(v => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
