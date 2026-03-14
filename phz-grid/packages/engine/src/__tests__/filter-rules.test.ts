import { describe, it, expect } from 'vitest';
import { createFilterRuleEngine, evaluateRule, previewRule } from '../criteria/filter-rules.js';
import type { FilterRule, SelectionFieldOption, TreeNode, RuleEvaluationContext } from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';

const REGION_ID = filterDefinitionId('region');

const OPTIONS: SelectionFieldOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
];

function makeRule(id: string, overrides: Partial<FilterRule>): FilterRule {
  return {
    id,
    filterDefinitionId: REGION_ID,
    type: 'value_set',
    priority: 0,
    enabled: true,
    config: { type: 'value_set', mode: 'include', values: [] },
    createdAt: Date.now(),
    ...overrides,
  } as FilterRule;
}

describe('evaluateRule', () => {
  describe('exclude_pattern', () => {
    it('excludes options matching pattern', () => {
      const rule = makeRule('r1', {
        type: 'exclude_pattern',
        config: { type: 'exclude_pattern', pattern: '^U' },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toEqual(['DE', 'FR', 'JP']);
      expect(result.excluded).toEqual(['US', 'UK']);
    });

    it('supports case-insensitive flags', () => {
      const rule = makeRule('r1', {
        type: 'exclude_pattern',
        config: { type: 'exclude_pattern', pattern: 'united', flags: 'i' },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.excluded).toEqual(['US', 'UK']);
    });
  });

  describe('include_pattern', () => {
    it('includes only options matching pattern', () => {
      const rule = makeRule('r1', {
        type: 'include_pattern',
        config: { type: 'include_pattern', pattern: '^U' },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toEqual(['US', 'UK']);
      expect(result.excluded).toEqual(['DE', 'FR', 'JP']);
    });
  });

  describe('value_set include', () => {
    it('includes only specified values', () => {
      const rule = makeRule('r1', {
        config: { type: 'value_set', mode: 'include', values: ['US', 'DE'] },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toEqual(['US', 'DE']);
      expect(result.excluded).toEqual(['UK', 'FR', 'JP']);
    });
  });

  describe('value_set exclude', () => {
    it('excludes specified values', () => {
      const rule = makeRule('r1', {
        config: { type: 'value_set', mode: 'exclude', values: ['JP'] },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toEqual(['US', 'UK', 'DE', 'FR']);
      expect(result.excluded).toEqual(['JP']);
    });
  });

  describe('tree_group_compare', () => {
    const treeNodes: TreeNode[] = [
      { value: 'US', label: 'US', children: [{ value: 'US-CA', label: 'California' }] },
      { value: 'EU', label: 'Europe', children: [{ value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' }] },
    ];

    it('matches tree nodes by equals', () => {
      const rule = makeRule('r1', {
        type: 'tree_group_compare',
        config: { type: 'tree_group_compare', groupField: 'region', operator: 'equals', value: 'US' },
      });
      const result = evaluateRule(rule, OPTIONS, treeNodes);
      expect(result.included).toContain('US');
      expect(result.excluded).toContain('UK');
    });

    it('matches tree nodes with contains', () => {
      const rule = makeRule('r1', {
        type: 'tree_group_compare',
        config: { type: 'tree_group_compare', groupField: 'region', operator: 'contains', value: 'U' },
      });
      // Tree nodes with 'U' in value: US, US-CA, EU — but only US is in OPTIONS
      const result = evaluateRule(rule, OPTIONS, treeNodes);
      expect(result.included).toContain('US');
      // DE, FR are children of EU tree node — they also contain no 'U' in their tree value
      expect(result.excluded).toContain('UK');
    });

    it('passes through when no tree nodes provided', () => {
      const rule = makeRule('r1', {
        type: 'tree_group_compare',
        config: { type: 'tree_group_compare', groupField: 'region', operator: 'equals', value: 'US' },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toHaveLength(OPTIONS.length);
    });
  });

  describe('custom', () => {
    it('uses registered evaluator', () => {
      const evaluators = new Map();
      evaluators.set('vowel-start', (_params: any, options: SelectionFieldOption[]) => {
        const vowels = 'AEIOU';
        const included = options.filter(o => vowels.includes(o.value[0])).map(o => o.value);
        const excluded = options.filter(o => !vowels.includes(o.value[0])).map(o => o.value);
        return { included, excluded };
      });

      const rule = makeRule('r1', {
        type: 'custom',
        config: { type: 'custom', evaluatorKey: 'vowel-start' },
      });
      const result = evaluateRule(rule, OPTIONS, undefined, evaluators);
      expect(result.included).toEqual(['US', 'UK']);
    });

    it('passes through when evaluator not found', () => {
      const rule = makeRule('r1', {
        type: 'custom',
        config: { type: 'custom', evaluatorKey: 'unknown' },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toHaveLength(OPTIONS.length);
    });
  });
});

describe('FilterRuleEngine', () => {
  describe('CRUD', () => {
    it('adds and retrieves rules', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', { priority: 1 }));
      engine.addRule(makeRule('r2', { priority: 0 }));
      const rules = engine.getRulesForFilter(REGION_ID);
      expect(rules).toHaveLength(2);
    });

    it('throws on duplicate add', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', {}));
      expect(() => engine.addRule(makeRule('r1', {}))).toThrow('already exists');
    });

    it('removes a rule', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', {}));
      engine.removeRule('r1');
      expect(engine.getRulesForFilter(REGION_ID)).toHaveLength(0);
    });

    it('throws on remove unknown', () => {
      const engine = createFilterRuleEngine();
      expect(() => engine.removeRule('x')).toThrow('not found');
    });

    it('toggles a rule', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', { enabled: true }));
      engine.toggleRule('r1', false);
      expect(engine.getRulesForFilter(REGION_ID)[0].enabled).toBe(false);
    });

    it('throws on toggle unknown', () => {
      const engine = createFilterRuleEngine();
      expect(() => engine.toggleRule('x', true)).toThrow('not found');
    });
  });

  describe('getRulesForFilter', () => {
    it('returns rules sorted by priority', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r2', { priority: 2 }));
      engine.addRule(makeRule('r1', { priority: 1 }));
      engine.addRule(makeRule('r3', { priority: 0 }));
      const rules = engine.getRulesForFilter(REGION_ID);
      expect(rules.map(r => r.id)).toEqual(['r3', 'r1', 'r2']);
    });
  });

  describe('evaluate', () => {
    it('applies multiple rules in priority order', () => {
      const engine = createFilterRuleEngine();
      // First: include only US, UK, DE
      engine.addRule(makeRule('r1', {
        priority: 0,
        config: { type: 'value_set', mode: 'include', values: ['US', 'UK', 'DE'] },
      }));
      // Then: exclude UK
      engine.addRule(makeRule('r2', {
        priority: 1,
        config: { type: 'value_set', mode: 'exclude', values: ['UK'] },
      }));

      const result = engine.evaluate(REGION_ID, OPTIONS);
      expect(result.constrainedOptions.map(o => o.value)).toEqual(['US', 'DE']);
    });

    it('skips disabled rules', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', {
        enabled: false,
        config: { type: 'value_set', mode: 'include', values: ['US'] },
      }));
      const result = engine.evaluate(REGION_ID, OPTIONS);
      expect(result.constrainedOptions).toHaveLength(OPTIONS.length);
    });

    it('returns correct appliedRuleIds', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', {
        config: { type: 'value_set', mode: 'include', values: ['US', 'UK', 'DE', 'FR', 'JP'] },
      }));
      const result = engine.evaluate(REGION_ID, OPTIONS);
      expect(result.appliedRuleIds).toEqual(['r1']);
    });

    it('returns excludedValues', () => {
      const engine = createFilterRuleEngine();
      engine.addRule(makeRule('r1', {
        config: { type: 'value_set', mode: 'exclude', values: ['JP', 'FR'] },
      }));
      const result = engine.evaluate(REGION_ID, OPTIONS);
      expect(result.excludedValues).toContain('JP');
      expect(result.excludedValues).toContain('FR');
    });

    it('returns all options when no rules', () => {
      const engine = createFilterRuleEngine();
      const result = engine.evaluate(REGION_ID, OPTIONS);
      expect(result.constrainedOptions).toHaveLength(OPTIONS.length);
      expect(result.appliedRuleIds).toHaveLength(0);
    });
  });
});

describe('previewRule', () => {
  it('returns before and after options', () => {
    const rule = makeRule('r1', {
      config: { type: 'value_set', mode: 'include', values: ['US', 'DE'] },
    });
    const { before, after } = previewRule(rule, OPTIONS);
    expect(before).toHaveLength(5);
    expect(after).toHaveLength(2);
    expect(after.map(o => o.value)).toEqual(['US', 'DE']);
  });

  it('passes context through to evaluateRule', () => {
    const evaluators = new Map();
    evaluators.set('ctx-rule', (_p: any, opts: SelectionFieldOption[], _t: any, ctx?: RuleEvaluationContext) => {
      const allowed = ctx?.allowedRegions;
      if (Array.isArray(allowed)) {
        const set = new Set(allowed);
        return {
          included: opts.filter(o => set.has(o.value)).map(o => o.value),
          excluded: opts.filter(o => !set.has(o.value)).map(o => o.value),
        };
      }
      return { included: opts.map(o => o.value), excluded: [] };
    });
    const rule = makeRule('r1', {
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'ctx-rule' },
    });
    const ctx: RuleEvaluationContext = { allowedRegions: ['US', 'FR'] };
    // evaluateRule receives evaluators + context directly
    const result = evaluateRule(rule, OPTIONS, undefined, evaluators, ctx);
    expect(result.included).toEqual(['US', 'FR']);
    expect(result.excluded).toEqual(['UK', 'DE', 'JP']);
  });
});

describe('RuleEvaluationContext', () => {
  const IMPC_OPTIONS: SelectionFieldOption[] = [
    { value: 'BEA', label: 'Belgium (BEA)' },
    { value: 'DEA', label: 'Germany (DEA)' },
    { value: 'FRA', label: 'France (FRA)' },
    { value: 'NLA', label: 'Netherlands (NLA)' },
    { value: 'GBA', label: 'United Kingdom (GBA)' },
  ];
  const ORIGIN_ID = filterDefinitionId('origin_impc');

  it('custom evaluator receives context and constrains by user home IMPC', () => {
    const evaluators = new Map();
    evaluators.set('constrain-by-direction', (
      params: Record<string, unknown> | undefined,
      options: SelectionFieldOption[],
      _tree: TreeNode[] | undefined,
      ctx?: RuleEvaluationContext,
    ) => {
      const direction = ctx?.mail_direction;
      const homeImpc = ctx?.home_impc;
      const side = params?.side;

      // Outbound + origin side → lock to home IMPC
      if (direction === 'outbound' && side === 'origin' && typeof homeImpc === 'string') {
        return {
          included: options.filter(o => o.value === homeImpc).map(o => o.value),
          excluded: options.filter(o => o.value !== homeImpc).map(o => o.value),
        };
      }
      return { included: options.map(o => o.value), excluded: [] };
    });

    const rule = makeRule('origin-constraint', {
      filterDefinitionId: ORIGIN_ID,
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'constrain-by-direction', params: { side: 'origin' } },
    });

    // With context: BE user, outbound
    const ctx: RuleEvaluationContext = { mail_direction: 'outbound', home_impc: 'BEA' };
    const result = evaluateRule(rule, IMPC_OPTIONS, undefined, evaluators, ctx);
    expect(result.included).toEqual(['BEA']);
    expect(result.excluded).toEqual(['DEA', 'FRA', 'NLA', 'GBA']);
  });

  it('custom evaluator passes through when context is absent', () => {
    const evaluators = new Map();
    evaluators.set('constrain-by-direction', (
      _params: any, options: SelectionFieldOption[], _tree: any, ctx?: RuleEvaluationContext,
    ) => {
      if (ctx?.mail_direction && ctx?.home_impc) {
        return {
          included: options.filter(o => o.value === ctx.home_impc).map(o => o.value),
          excluded: options.filter(o => o.value !== ctx.home_impc).map(o => o.value),
        };
      }
      return { included: options.map(o => o.value), excluded: [] };
    });

    const rule = makeRule('origin-constraint', {
      filterDefinitionId: ORIGIN_ID,
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'constrain-by-direction', params: { side: 'origin' } },
    });

    // No context → all options pass through
    const result = evaluateRule(rule, IMPC_OPTIONS, undefined, evaluators);
    expect(result.included).toHaveLength(5);
    expect(result.excluded).toHaveLength(0);
  });

  it('engine.evaluate passes context to custom rules', () => {
    const engine = createFilterRuleEngine();
    engine.registerCustomEvaluator('user-region', (
      _params, options, _tree, ctx?,
    ) => {
      const region = ctx?.user_region;
      if (typeof region === 'string') {
        return {
          included: options.filter(o => o.value === region).map(o => o.value),
          excluded: options.filter(o => o.value !== region).map(o => o.value),
        };
      }
      return { included: options.map(o => o.value), excluded: [] };
    });

    engine.addRule(makeRule('r-ctx', {
      filterDefinitionId: REGION_ID,
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'user-region' },
    }));

    const ctx: RuleEvaluationContext = { user_region: 'DE' };
    const result = engine.evaluate(REGION_ID, OPTIONS, undefined, ctx);
    expect(result.constrainedOptions.map(o => o.value)).toEqual(['DE']);
    expect(result.appliedRuleIds).toEqual(['r-ctx']);
  });

  it('context with array values works in custom evaluator', () => {
    const evaluators = new Map();
    evaluators.set('allowed-set', (
      _params: any, options: SelectionFieldOption[], _tree: any, ctx?: RuleEvaluationContext,
    ) => {
      const allowed = ctx?.allowed_values;
      if (Array.isArray(allowed)) {
        const set = new Set(allowed);
        return {
          included: options.filter(o => set.has(o.value)).map(o => o.value),
          excluded: options.filter(o => !set.has(o.value)).map(o => o.value),
        };
      }
      return { included: options.map(o => o.value), excluded: [] };
    });

    const rule = makeRule('r-arr', {
      type: 'custom',
      config: { type: 'custom', evaluatorKey: 'allowed-set' },
    });

    const ctx: RuleEvaluationContext = { allowed_values: ['US', 'JP'] };
    const result = evaluateRule(rule, OPTIONS, undefined, evaluators, ctx);
    expect(result.included).toEqual(['US', 'JP']);
    expect(result.excluded).toEqual(['UK', 'DE', 'FR']);
  });
});

// ============================================================
// Cross-Filter Rule Tests
// ============================================================

describe('cross_filter', () => {
  // Generic test options — reuse the top-level OPTIONS (US/UK/DE/FR/JP)

  describe('condition evaluation', () => {
    it('evaluates equals condition', () => {
      const rule = makeRule('cf1', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US', 'UK'] },
        },
      });
      const ctx: RuleEvaluationContext = { status: 'active' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK']);
      expect(result.excluded).toEqual(['DE', 'FR', 'JP']);
    });

    it('evaluates not_equals condition', () => {
      const rule = makeRule('cf2', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'not_equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
        },
      });
      const ctx: RuleEvaluationContext = { status: 'archived' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US']);
    });

    it('evaluates in condition', () => {
      const rule = makeRule('cf3', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'tier', operator: 'in', values: ['gold', 'platinum'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US', 'UK'] },
        },
      });
      const ctx: RuleEvaluationContext = { tier: 'gold' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK']);
    });

    it('evaluates not_in condition', () => {
      const rule = makeRule('cf4', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'tier', operator: 'not_in', values: ['trial', 'free'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['FR'] },
        },
      });
      const ctx: RuleEvaluationContext = { tier: 'gold' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['FR']);
    });

    it('evaluates is_set condition', () => {
      const rule = makeRule('cf5', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'role', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
        },
      });
      const ctx: RuleEvaluationContext = { role: 'editor' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US']);
    });

    it('evaluates is_not_set condition', () => {
      const rule = makeRule('cf6', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'override', operator: 'is_not_set' }],
          logic: 'all',
          action: { type: 'include_values', values: ['US', 'UK'] },
        },
      });
      const ctx: RuleEvaluationContext = {};
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK']);
    });
  });

  describe('logic combinators', () => {
    it('ALL requires every condition to be met', () => {
      const rule = makeRule('cf-all', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [
            { source: 'filter', key: 'status', operator: 'equals', values: ['active'] },
            { source: 'context', key: 'tier', operator: 'equals', values: ['gold'] },
          ],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
        },
      });
      // Only status matches, tier does not
      const ctx: RuleEvaluationContext = { status: 'active', tier: 'silver' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      // Conditions not met → else action (default pass_through)
      expect(result.included).toHaveLength(5);
    });

    it('ANY requires at least one condition to be met', () => {
      const rule = makeRule('cf-any', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [
            { source: 'filter', key: 'status', operator: 'equals', values: ['active'] },
            { source: 'context', key: 'tier', operator: 'equals', values: ['gold'] },
          ],
          logic: 'any',
          action: { type: 'include_values', values: ['US'] },
        },
      });
      // Only status matches
      const ctx: RuleEvaluationContext = { status: 'active', tier: 'silver' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US']);
    });
  });

  describe('actions', () => {
    it('include_values keeps only specified values', () => {
      const rule = makeRule('cf-inc', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'include_values', values: ['US', 'UK'] },
        },
      });
      const ctx: RuleEvaluationContext = { active: true };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK']);
      expect(result.excluded).toEqual(['DE', 'FR', 'JP']);
    });

    it('exclude_values removes specified values', () => {
      const rule = makeRule('cf-exc', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'exclude_values', values: ['FR', 'JP'] },
        },
      });
      const ctx: RuleEvaluationContext = { active: true };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK', 'DE']);
      expect(result.excluded).toEqual(['FR', 'JP']);
    });

    it('include_from_context reads array from context key', () => {
      const rule = makeRule('cf-ctx-arr', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_from_context', contextKey: 'allowed_values' },
        },
      });
      const ctx: RuleEvaluationContext = { status: 'active', allowed_values: ['US', 'UK'] };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK']);
    });

    it('include_from_context reads single string from context key', () => {
      const rule = makeRule('cf-ctx-str', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'include_from_context', contextKey: 'primary_value' },
        },
      });
      const ctx: RuleEvaluationContext = { active: true, primary_value: 'US' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US']);
    });

    it('exclude_from_context removes values read from context key', () => {
      const rule = makeRule('cf-exc-ctx', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'exclude_from_context', contextKey: 'blocked_values' },
        },
      });
      const ctx: RuleEvaluationContext = { active: true, blocked_values: ['FR', 'JP'] };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK', 'DE']);
      expect(result.excluded).toEqual(['FR', 'JP']);
    });

    it('exclude_from_context reads single string from context key', () => {
      const rule = makeRule('cf-exc-ctx-str', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'exclude_from_context', contextKey: 'blocked_value' },
        },
      });
      const ctx: RuleEvaluationContext = { active: true, blocked_value: 'DE' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toEqual(['US', 'UK', 'FR', 'JP']);
      expect(result.excluded).toEqual(['DE']);
    });

    it('exclude_from_context passes through when context key missing', () => {
      const rule = makeRule('cf-exc-ctx-miss', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'context', key: 'active', operator: 'is_set' }],
          logic: 'all',
          action: { type: 'exclude_from_context', contextKey: 'nonexistent' },
        },
      });
      const ctx: RuleEvaluationContext = { active: true };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toHaveLength(5);
      expect(result.excluded).toHaveLength(0);
    });
  });

  describe('else action', () => {
    it('pass_through returns all options when conditions not met', () => {
      const rule = makeRule('cf-else-pt', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
          elseAction: 'pass_through',
        },
      });
      const ctx: RuleEvaluationContext = { status: 'archived' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toHaveLength(5);
      expect(result.excluded).toHaveLength(0);
    });

    it('block returns no options when conditions not met', () => {
      const rule = makeRule('cf-else-block', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
          elseAction: 'block',
        },
      });
      const ctx: RuleEvaluationContext = { status: 'archived' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toHaveLength(0);
      expect(result.excluded).toHaveLength(5);
    });

    it('defaults to pass_through when elseAction is undefined', () => {
      const rule = makeRule('cf-else-default', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'x', operator: 'equals', values: ['Y'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
        },
      });
      const ctx: RuleEvaluationContext = { x: 'Z' };
      const result = evaluateRule(rule, OPTIONS, undefined, undefined, ctx);
      expect(result.included).toHaveLength(5);
    });
  });

  describe('no context', () => {
    it('falls back to elseAction when no context is provided', () => {
      const rule = makeRule('cf-no-ctx', {
        type: 'cross_filter',
        config: {
          type: 'cross_filter',
          conditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
          logic: 'all',
          action: { type: 'include_values', values: ['US'] },
          elseAction: 'block',
        },
      });
      const result = evaluateRule(rule, OPTIONS);
      expect(result.included).toHaveLength(0);
    });
  });
});

// ============================================================
// Tree Group Compare in/not_in Tests
// ============================================================

describe('tree_group_compare in/not_in', () => {
  const treeNodes: TreeNode[] = [
    { value: 'US', label: 'US' },
    { value: 'UK', label: 'UK' },
    { value: 'DE', label: 'DE', children: [{ value: 'DE-BY', label: 'Bavaria' }] },
    { value: 'FR', label: 'FR' },
  ];

  it('in operator includes only values in the set', () => {
    const rule = makeRule('tg-in', {
      type: 'tree_group_compare',
      config: { type: 'tree_group_compare', groupField: 'region', operator: 'in', value: '', values: ['US', 'DE', 'DE-BY'] },
    });
    const result = evaluateRule(rule, OPTIONS, treeNodes);
    expect(result.included).toContain('US');
    expect(result.included).toContain('DE');
    expect(result.excluded).toContain('UK');
    expect(result.excluded).toContain('FR');
  });

  it('not_in operator excludes values in the set', () => {
    const rule = makeRule('tg-not-in', {
      type: 'tree_group_compare',
      config: { type: 'tree_group_compare', groupField: 'region', operator: 'not_in', value: '', values: ['US', 'UK'] },
    });
    const result = evaluateRule(rule, OPTIONS, treeNodes);
    expect(result.included).toContain('DE');
    expect(result.included).toContain('FR');
    expect(result.excluded).toContain('US');
    expect(result.excluded).toContain('UK');
  });

  it('in with empty values array matches nothing', () => {
    const rule = makeRule('tg-in-empty', {
      type: 'tree_group_compare',
      config: { type: 'tree_group_compare', groupField: 'region', operator: 'in', value: '', values: [] },
    });
    const result = evaluateRule(rule, OPTIONS, treeNodes);
    expect(result.included).toHaveLength(0);
  });
});
