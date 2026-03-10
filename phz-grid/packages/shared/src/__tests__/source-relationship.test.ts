/**
 * Source Relationship types — unit tests
 *
 * Tests for join resolution, propagation direction, chain traversal,
 * and join key retrieval.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveJoin,
  flipJoinType,
  isJoinPropagationAllowed,
  isForwardPropagationAllowed,
  isReversePropagationAllowed,
  findReachableSources,
  getJoinKeysForPair,
  type SourceRelationship,
} from '../types/source-relationship.js';

const relationships: SourceRelationship[] = [
  {
    id: 'r1',
    leftSourceId: 'sales',
    rightSourceId: 'orders',
    joinType: 'inner',
    joinKeys: [{ leftField: 'region', rightField: 'order_region' }],
  },
  {
    id: 'r2',
    leftSourceId: 'sales',
    rightSourceId: 'inventory',
    joinType: 'left',
    joinKeys: [{ leftField: 'sku', rightField: 'product_sku' }],
  },
  {
    id: 'r3',
    leftSourceId: 'orders',
    rightSourceId: 'returns',
    joinType: 'right',
    joinKeys: [{ leftField: 'order_id', rightField: 'return_order_id' }],
  },
  {
    id: 'r4',
    leftSourceId: 'inventory',
    rightSourceId: 'returns',
    joinType: 'none',
    joinKeys: [],
  },
  {
    id: 'r5',
    leftSourceId: 'sales',
    rightSourceId: 'returns',
    joinType: 'full',
    joinKeys: [{ leftField: 'sale_id', rightField: 'return_sale_id' }],
  },
];

// ========================================================================
// flipJoinType
// ========================================================================

describe('flipJoinType', () => {
  it('flips left to right', () => {
    expect(flipJoinType('left')).toBe('right');
  });

  it('flips right to left', () => {
    expect(flipJoinType('right')).toBe('left');
  });

  it('keeps inner as inner', () => {
    expect(flipJoinType('inner')).toBe('inner');
  });

  it('keeps full as full', () => {
    expect(flipJoinType('full')).toBe('full');
  });

  it('keeps none as none', () => {
    expect(flipJoinType('none')).toBe('none');
  });
});

// ========================================================================
// resolveEffectiveJoin
// ========================================================================

describe('resolveEffectiveJoin', () => {
  it('returns join type for direct left→right', () => {
    expect(resolveEffectiveJoin(relationships, 'sales', 'orders')).toBe('inner');
  });

  it('returns flipped join for right→left', () => {
    // sales→inventory is 'left', so inventory→sales should be 'right'
    expect(resolveEffectiveJoin(relationships, 'inventory', 'sales')).toBe('right');
  });

  it('returns none for unrelated sources', () => {
    expect(resolveEffectiveJoin(relationships, 'orders', 'inventory')).toBe('none');
  });

  it('returns full for full join in either direction', () => {
    expect(resolveEffectiveJoin(relationships, 'sales', 'returns')).toBe('full');
    expect(resolveEffectiveJoin(relationships, 'returns', 'sales')).toBe('full');
  });

  it('returns right as left when reversed', () => {
    // orders→returns is 'right', so returns→orders should be 'left'
    expect(resolveEffectiveJoin(relationships, 'returns', 'orders')).toBe('left');
  });
});

// ========================================================================
// isForwardPropagationAllowed / isReversePropagationAllowed
// ========================================================================

describe('propagation direction checks', () => {
  it('inner allows forward', () => {
    expect(isForwardPropagationAllowed('inner')).toBe(true);
  });

  it('inner allows reverse', () => {
    expect(isReversePropagationAllowed('inner')).toBe(true);
  });

  it('left allows forward only', () => {
    expect(isForwardPropagationAllowed('left')).toBe(true);
    expect(isReversePropagationAllowed('left')).toBe(false);
  });

  it('right allows reverse only', () => {
    expect(isForwardPropagationAllowed('right')).toBe(false);
    expect(isReversePropagationAllowed('right')).toBe(true);
  });

  it('full allows both', () => {
    expect(isForwardPropagationAllowed('full')).toBe(true);
    expect(isReversePropagationAllowed('full')).toBe(true);
  });

  it('none blocks both', () => {
    expect(isForwardPropagationAllowed('none')).toBe(false);
    expect(isReversePropagationAllowed('none')).toBe(false);
  });
});

// ========================================================================
// isJoinPropagationAllowed
// ========================================================================

describe('isJoinPropagationAllowed', () => {
  it('inner allows sales→orders', () => {
    expect(isJoinPropagationAllowed(relationships, 'sales', 'orders')).toBe(true);
  });

  it('inner allows orders→sales (reverse of inner)', () => {
    expect(isJoinPropagationAllowed(relationships, 'orders', 'sales')).toBe(true);
  });

  it('left allows sales→inventory (forward)', () => {
    expect(isJoinPropagationAllowed(relationships, 'sales', 'inventory')).toBe(true);
  });

  it('left blocks inventory→sales (reverse)', () => {
    expect(isJoinPropagationAllowed(relationships, 'inventory', 'sales')).toBe(false);
  });

  it('none blocks inventory↔returns', () => {
    expect(isJoinPropagationAllowed(relationships, 'inventory', 'returns')).toBe(false);
    expect(isJoinPropagationAllowed(relationships, 'returns', 'inventory')).toBe(false);
  });

  it('returns false for unrelated sources', () => {
    expect(isJoinPropagationAllowed(relationships, 'orders', 'inventory')).toBe(false);
  });
});

// ========================================================================
// findReachableSources
// ========================================================================

describe('findReachableSources', () => {
  const allSources = ['sales', 'orders', 'inventory', 'returns'];

  it('finds all sources reachable from sales', () => {
    const reachable = findReachableSources(relationships, 'sales', allSources);
    // sales→orders (inner), sales→inventory (left), sales→returns (full)
    expect(reachable).toContain('orders');
    expect(reachable).toContain('inventory');
    expect(reachable).toContain('returns');
  });

  it('finds sources reachable from orders', () => {
    const reachable = findReachableSources(relationships, 'orders', allSources);
    // orders→sales (inner reverse), orders→returns is 'right' (forward blocked)
    // but via sales: sales→inventory (left), sales→returns (full)
    expect(reachable).toContain('sales');
  });

  it('inventory cannot reach sales (reverse of left)', () => {
    // inventory→sales is 'right' (reverse of left=blocked)
    // But inventory→returns is 'none'
    const reachable = findReachableSources(relationships, 'inventory', allSources);
    expect(reachable).not.toContain('sales');
  });

  it('returns empty for isolated source', () => {
    const reachable = findReachableSources([], 'sales', allSources);
    expect(reachable).toEqual([]);
  });
});

// ========================================================================
// getJoinKeysForPair
// ========================================================================

describe('getJoinKeysForPair', () => {
  it('returns keys for direct pair', () => {
    const keys = getJoinKeysForPair(relationships, 'sales', 'orders');
    expect(keys).toEqual([{ leftField: 'region', rightField: 'order_region' }]);
  });

  it('returns flipped keys for reversed pair', () => {
    const keys = getJoinKeysForPair(relationships, 'orders', 'sales');
    expect(keys).toEqual([{ leftField: 'order_region', rightField: 'region' }]);
  });

  it('returns empty for unrelated pair', () => {
    const keys = getJoinKeysForPair(relationships, 'orders', 'inventory');
    expect(keys).toEqual([]);
  });

  it('returns empty for empty relationships', () => {
    const keys = getJoinKeysForPair([], 'sales', 'orders');
    expect(keys).toEqual([]);
  });
});
