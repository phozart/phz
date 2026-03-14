import { describe, it, expect, vi } from 'vitest';
import { createCriteriaOutputManager, inferOperator, filterTreeOutput, splitSearchTokens } from '../criteria/criteria-output.js';
import { createFilterRegistry } from '../criteria/filter-registry.js';
import { createFilterBindingStore } from '../criteria/filter-bindings.js';
import type { FilterDefinition, ArtefactCriteria, TreeNode } from '@phozart/core';
import { filterDefinitionId, artefactId } from '@phozart/core';

const ART_A = artefactId('report-1');

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id,
    type: 'single_select',
    sessionBehavior: 'reset',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as FilterDefinition;
}

describe('inferOperator', () => {
  it('multi_select with array → in', () => {
    expect(inferOperator('multi_select', ['a', 'b'])).toBe('in');
  });

  it('single_select → equals', () => {
    expect(inferOperator('single_select', 'US')).toBe('equals');
  });

  it('date_range → between', () => {
    expect(inferOperator('date_range', '2025-01-01|2025-12-31')).toBe('between');
  });

  it('search → like', () => {
    expect(inferOperator('search', 'test')).toBe('like');
  });

  it('search with beginsWith → starts_with', () => {
    expect(inferOperator('search', 'test', false, { matchMode: 'beginsWith' })).toBe('starts_with');
  });

  it('search with contains → like', () => {
    expect(inferOperator('search', 'test', false, { matchMode: 'contains' })).toBe('like');
  });

  it('null with allowNullValue → is_null', () => {
    expect(inferOperator('single_select', null, true)).toBe('is_null');
  });

  it('null without allowNullValue → in (all selected)', () => {
    expect(inferOperator('single_select', null, false)).toBe('in');
  });

  it('field_presence → is_not_null', () => {
    expect(inferOperator('field_presence', '{}')).toBe('is_not_null');
  });

  it('numeric_range → between', () => {
    expect(inferOperator('numeric_range', '10|100')).toBe('between');
  });

  it('chip_group with array → in', () => {
    expect(inferOperator('chip_group', ['a'])).toBe('in');
  });

  it('tree_select with array → in', () => {
    expect(inferOperator('tree_select', ['root', 'child'])).toBe('in');
  });
});

describe('CriteriaOutputManager', () => {
  function setupManager() {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { type: 'multi_select', dataField: 'region_code', required: true }));
    registry.register(makeDef('status', { type: 'chip_group', dataField: 'status' }));

    const bindingStore = createFilterBindingStore();
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: ART_A,
      visible: true,
      order: 0,
    });
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('status'),
      artefactId: ART_A,
      visible: true,
      order: 1,
    });

    return createCriteriaOutputManager(registry, bindingStore);
  }

  describe('buildCriteria', () => {
    it('produces FilterCriterion per visible binding', () => {
      const mgr = setupManager();
      const criteria = mgr.buildCriteria(
        ART_A,
        { region: ['US', 'UK'], status: ['active'] },
        { region: 'preset', status: 'definition_default' },
        { region: { isApplied: false, ruleIds: [] }, status: { isApplied: false, ruleIds: [] } },
      );
      expect(criteria.filters).toHaveLength(2);
      expect(criteria.artefactId).toBe('report-1');
    });

    it('sets isRuleApplied and resolvedFrom', () => {
      const mgr = setupManager();
      const criteria = mgr.buildCriteria(
        ART_A,
        { region: ['US'], status: null },
        { region: 'rule', status: 'all_selected' },
        { region: { isApplied: true, ruleIds: ['r1'] }, status: { isApplied: false, ruleIds: [] } },
      );
      expect(criteria.filters[0].isRuleApplied).toBe(true);
      expect(criteria.filters[0].activeRuleIds).toEqual(['r1']);
      expect(criteria.filters[0].resolvedFrom).toBe('rule');
    });

    it('isComplete is false when required filter is null', () => {
      const mgr = setupManager();
      const criteria = mgr.buildCriteria(
        ART_A,
        { region: null, status: ['active'] },
        { region: 'all_selected', status: 'preset' },
        {},
      );
      expect(criteria.isComplete).toBe(false);
    });

    it('isComplete is true when all required filters have values', () => {
      const mgr = setupManager();
      const criteria = mgr.buildCriteria(
        ART_A,
        { region: ['US'], status: ['active'] },
        { region: 'preset', status: 'preset' },
        {},
      );
      expect(criteria.isComplete).toBe(true);
    });

    it('includes timestamp', () => {
      const mgr = setupManager();
      const before = Date.now();
      const criteria = mgr.buildCriteria(ART_A, {}, {}, {});
      expect(criteria.timestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe('subscribe / emit / unsubscribe', () => {
    it('subscriber receives emitted criteria', () => {
      const mgr = setupManager();
      const received: ArtefactCriteria[] = [];
      mgr.subscribe((c) => received.push(c));

      const criteria = mgr.buildCriteria(ART_A, { region: ['US'], status: [] }, {}, {});
      mgr.emit(criteria);

      expect(received).toHaveLength(1);
      expect(received[0].artefactId).toBe('report-1');
    });

    it('unsubscribe stops notifications', () => {
      const mgr = setupManager();
      const received: ArtefactCriteria[] = [];
      const unsub = mgr.subscribe((c) => received.push(c));

      const criteria = mgr.buildCriteria(ART_A, {}, {}, {});
      mgr.emit(criteria);
      expect(received).toHaveLength(1);

      unsub();
      mgr.emit(criteria);
      expect(received).toHaveLength(1);
    });

    it('debounced emission coalesces rapid changes', async () => {
      const mgr = setupManager();
      mgr.setDebounceMs(50);
      const received: ArtefactCriteria[] = [];
      mgr.subscribe((c) => received.push(c));

      const c1 = mgr.buildCriteria(ART_A, { region: ['US'] }, {}, {});
      const c2 = mgr.buildCriteria(ART_A, { region: ['UK'] }, {}, {});
      const c3 = mgr.buildCriteria(ART_A, { region: ['DE'] }, {}, {});

      mgr.emit(c1);
      mgr.emit(c2);
      mgr.emit(c3);

      // Wait for debounce
      await new Promise(r => setTimeout(r, 100));

      // Only the last one should have been delivered
      expect(received).toHaveLength(1);
    });
  });
});

describe('splitSearchTokens', () => {
  it('splits space-separated terms', () => {
    expect(splitSearchTokens('apple banana')).toEqual(['apple', 'banana']);
  });

  it('filters tokens below minChars', () => {
    expect(splitSearchTokens('a banana cherry', 3)).toEqual(['banana', 'cherry']);
  });

  it('trims and collapses whitespace', () => {
    expect(splitSearchTokens('  apple   banana  ')).toEqual(['apple', 'banana']);
  });

  it('returns empty array for empty input', () => {
    expect(splitSearchTokens('')).toEqual([]);
    expect(splitSearchTokens('   ')).toEqual([]);
  });

  it('returns single-element array for single term', () => {
    expect(splitSearchTokens('apple')).toEqual(['apple']);
  });
});

describe('buildCriteria multi-value search', () => {
  it('splits search value into token array when multiValue is true', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('product', {
      type: 'search',
      dataField: 'product_name',
      searchConfig: { multiValue: true, minChars: 2 },
    }));

    const bindingStore = createFilterBindingStore();
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('product'),
      artefactId: ART_A,
      visible: true,
      order: 0,
    });

    const mgr = createCriteriaOutputManager(registry, bindingStore);
    const criteria = mgr.buildCriteria(
      ART_A,
      { product: 'apple banana' },
      { product: 'preset' },
      {},
    );

    expect(criteria.filters[0].value).toEqual(['apple', 'banana']);
    expect(criteria.filters[0].operator).toBe('like');
  });

  it('keeps search value as string when multiValue is false', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('product', {
      type: 'search',
      dataField: 'product_name',
      searchConfig: { multiValue: false },
    }));

    const bindingStore = createFilterBindingStore();
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('product'),
      artefactId: ART_A,
      visible: true,
      order: 0,
    });

    const mgr = createCriteriaOutputManager(registry, bindingStore);
    const criteria = mgr.buildCriteria(
      ART_A,
      { product: 'apple banana' },
      { product: 'preset' },
      {},
    );

    expect(criteria.filters[0].value).toBe('apple banana');
    expect(criteria.filters[0].operator).toBe('like');
  });

  it('multi-value + beginsWith produces starts_with with token array', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('product', {
      type: 'search',
      dataField: 'product_name',
      searchConfig: { multiValue: true, matchMode: 'beginsWith' },
    }));

    const bindingStore = createFilterBindingStore();
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('product'),
      artefactId: ART_A,
      visible: true,
      order: 0,
    });

    const mgr = createCriteriaOutputManager(registry, bindingStore);
    const criteria = mgr.buildCriteria(
      ART_A,
      { product: 'app ban' },
      { product: 'preset' },
      {},
    );

    expect(criteria.filters[0].value).toEqual(['app', 'ban']);
    expect(criteria.filters[0].operator).toBe('starts_with');
  });

  it('multi-value filters tokens below minChars', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('product', {
      type: 'search',
      dataField: 'product_name',
      searchConfig: { multiValue: true, minChars: 3 },
    }));

    const bindingStore = createFilterBindingStore();
    bindingStore.bind({
      filterDefinitionId: filterDefinitionId('product'),
      artefactId: ART_A,
      visible: true,
      order: 0,
    });

    const mgr = createCriteriaOutputManager(registry, bindingStore);
    const criteria = mgr.buildCriteria(
      ART_A,
      { product: 'a banana cherry' },
      { product: 'preset' },
      {},
    );

    // 'a' is below minChars 3, so only 'banana' and 'cherry' remain
    expect(criteria.filters[0].value).toEqual(['banana', 'cherry']);
  });
});

describe('filterTreeOutput', () => {
  const tree: TreeNode[] = [
    {
      value: 'americas',
      label: 'Americas',
      children: [
        { value: 'us', label: 'US' },
        { value: 'ca', label: 'Canada' },
      ],
    },
    { value: 'eu', label: 'Europe' },
  ];

  it('leaf_only filters non-leaf nodes', () => {
    const result = filterTreeOutput(['americas', 'us', 'eu'], tree, 'leaf_only');
    expect(result).toEqual(['us', 'eu']);
  });

  it('selected_level returns all', () => {
    const result = filterTreeOutput(['americas', 'us'], tree, 'selected_level');
    expect(result).toEqual(['americas', 'us']);
  });

  it('full_path returns all', () => {
    const result = filterTreeOutput(['americas', 'us'], tree, 'full_path');
    expect(result).toEqual(['americas', 'us']);
  });
});
