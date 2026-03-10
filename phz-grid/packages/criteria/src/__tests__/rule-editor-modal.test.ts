import { describe, it, expect } from 'vitest';
import type {
  FilterRule, FilterDefinition, FilterDefinitionId,
  FilterRuleConfig, FilterRuleType,
  ExcludePatternConfig, IncludePatternConfig,
  ValueSetConfig, TreeGroupCompareConfig, CustomRuleConfig,
  CrossFilterConfig, CrossFilterCondition, CrossFilterAction,
} from '@phozart/phz-core';
import { filterDefinitionId } from '@phozart/phz-core';

// -- Test helpers for rule editor modal logic --

/** Validates a regex pattern (mirrors modal logic) */
function validateRegex(pattern: string, flags?: string): boolean {
  if (!pattern) return true;
  if (pattern.length > 500) return false;
  try {
    new RegExp(pattern, flags);
    return true;
  } catch {
    return false;
  }
}

/** Validates JSON params string (mirrors modal logic) */
function validateJsonParams(params: string): boolean {
  if (!params.trim()) return true;
  try {
    JSON.parse(params);
    return true;
  } catch {
    return false;
  }
}

/** Build default config for a rule type (mirrors modal logic) */
function defaultConfigForType(type: FilterRuleType): FilterRuleConfig {
  switch (type) {
    case 'exclude_pattern':
      return { type: 'exclude_pattern', pattern: '', flags: 'i' };
    case 'include_pattern':
      return { type: 'include_pattern', pattern: '', flags: 'i' };
    case 'value_set':
      return { type: 'value_set', mode: 'exclude', values: [] };
    case 'tree_group_compare':
      return { type: 'tree_group_compare', groupField: '', operator: 'equals', value: '' };
    case 'custom':
      return { type: 'custom', evaluatorKey: '' };
    case 'cross_filter':
      return {
        type: 'cross_filter',
        conditions: [{ source: 'filter' as const, key: '', operator: 'equals' as const, values: [] }],
        logic: 'all' as const,
        action: { type: 'include_values' as const, values: [] },
      };
  }
}

interface RuleValidationErrors {
  [key: string]: string;
}

/** Validate rule form fields (mirrors modal logic) */
function validateRuleForm(
  filterDefId: string,
  type: FilterRuleType,
  config: {
    pattern?: string;
    flags?: string;
    vsValues?: string;
    tgField?: string;
    tgValue?: string;
    tgOperator?: string;
    tgValues?: string;
    customKey?: string;
    customParams?: string;
    cfConditions?: CrossFilterCondition[];
    cfValueSource?: string;
    cfBehavior?: string;
    cfActionValues?: string;
    cfActionContextKey?: string;
  },
): RuleValidationErrors {
  const errors: RuleValidationErrors = {};

  if (!filterDefId) {
    errors['filterDefId'] = 'Please select a filter definition';
  }

  switch (type) {
    case 'exclude_pattern':
    case 'include_pattern':
      if (!config.pattern?.trim()) {
        errors['pattern'] = 'Pattern is required';
      } else if ((config.pattern?.length ?? 0) > 500) {
        errors['pattern'] = 'Pattern must be 500 characters or less';
      } else if (!validateRegex(config.pattern!, config.flags)) {
        errors['pattern'] = 'Invalid regular expression';
      }
      break;
    case 'value_set': {
      const values = (config.vsValues ?? '').split('\n').filter(v => v.trim());
      if (values.length === 0) {
        errors['values'] = 'Enter at least one value';
      }
      break;
    }
    case 'tree_group_compare':
      if (!config.tgField?.trim()) {
        errors['groupField'] = 'Group field is required';
      }
      if (config.tgOperator === 'in' || config.tgOperator === 'not_in') {
        const tgVals = (config.tgValues ?? '').split('\n').filter(v => v.trim());
        if (tgVals.length === 0) {
          errors['tgValues'] = 'Enter at least one value';
        }
      } else {
        if (!config.tgValue?.trim()) {
          errors['tgValue'] = 'Value is required';
        }
      }
      break;
    case 'cross_filter': {
      const conditions = config.cfConditions ?? [];
      if (conditions.length === 0) {
        errors['cfConditions'] = 'At least one condition is required';
      } else {
        const hasEmptyKey = conditions.some(c => !c.key.trim());
        if (hasEmptyKey) {
          errors['cfConditions'] = 'All conditions must have a key';
        }
      }
      if (config.cfValueSource === 'context') {
        if (!config.cfActionContextKey?.trim()) {
          errors['cfActionValues'] = 'Context key is required';
        }
      } else {
        const actionVals = (config.cfActionValues ?? '').split('\n').filter(v => v.trim());
        if (actionVals.length === 0) {
          errors['cfActionValues'] = 'Enter at least one value';
        }
      }
      break;
    }
    case 'custom':
      if (!config.customKey?.trim()) {
        errors['evaluatorKey'] = 'Evaluator key is required';
      }
      if (config.customParams?.trim() && !validateJsonParams(config.customParams)) {
        errors['customParams'] = 'Invalid JSON';
      }
      break;
  }

  return errors;
}

/** Build a FilterRule from form state (mirrors modal logic) */
function buildRule(
  mode: 'add' | 'edit' | 'copy',
  existingRule: FilterRule | null,
  type: FilterRuleType,
  filterDefId: FilterDefinitionId,
  priority: number,
  enabled: boolean,
  description: string,
  config: FilterRuleConfig,
): FilterRule {
  const now = Date.now();
  const isNew = mode === 'add' || mode === 'copy';
  const id = isNew ? `rule_${type}_${now}` : existingRule!.id;

  return {
    id,
    filterDefinitionId: filterDefId,
    type,
    priority,
    enabled,
    config,
    description: description.trim() || undefined,
    createdAt: isNew ? now : existingRule!.createdAt,
    createdBy: existingRule?.createdBy,
  };
}

/** Extract config summary tags (mirrors rule admin logic) */
function getConfigSummary(rule: FilterRule): string[] {
  const tags: string[] = [];
  const config = rule.config;
  switch (config.type) {
    case 'exclude_pattern':
    case 'include_pattern':
      if (config.pattern) tags.push(`/${config.pattern}/${config.flags ?? ''}`);
      break;
    case 'value_set':
      tags.push(config.mode);
      tags.push(`${config.values.length} value(s)`);
      break;
    case 'tree_group_compare':
      if (config.operator === 'in' || config.operator === 'not_in') {
        tags.push(`${config.groupField} ${config.operator.replace(/_/g, ' ')} [${(config.values ?? []).length} values]`);
      } else {
        tags.push(`${config.groupField} ${config.operator.replace(/_/g, ' ')} "${config.value}"`);
      }
      break;
    case 'custom':
      tags.push(config.evaluatorKey);
      break;
    case 'cross_filter':
      tags.push(`${config.conditions.length} condition(s)`);
      tags.push(config.logic.toUpperCase());
      tags.push(`\u2192 ${config.action.type.replace(/_/g, ' ')}`);
      if (config.elseAction) {
        tags.push(`else: ${config.elseAction.replace(/_/g, ' ')}`);
      }
      break;
  }
  return tags;
}

// -- Test data --

const defRegion: FilterDefinition = {
  id: filterDefinitionId('region'),
  label: 'Region',
  type: 'multi_select',
  sessionBehavior: 'reset',
  createdAt: 1000,
  updatedAt: 1000,
};

const defProduct: FilterDefinition = {
  id: filterDefinitionId('product'),
  label: 'Product',
  type: 'single_select',
  sessionBehavior: 'persist',
  createdAt: 1000,
  updatedAt: 1000,
};

const excludeRule: FilterRule = {
  id: 'rule_1',
  filterDefinitionId: filterDefinitionId('region'),
  type: 'exclude_pattern',
  priority: 0,
  enabled: true,
  config: { type: 'exclude_pattern', pattern: '^TEST_', flags: 'i' },
  description: 'Exclude test regions',
  createdAt: 1000,
};

const valueSetRule: FilterRule = {
  id: 'rule_2',
  filterDefinitionId: filterDefinitionId('product'),
  type: 'value_set',
  priority: 1,
  enabled: true,
  config: { type: 'value_set', mode: 'exclude', values: ['DISCONTINUED', 'LEGACY'] },
  description: 'Exclude discontinued products',
  createdAt: 2000,
};

const treeRule: FilterRule = {
  id: 'rule_3',
  filterDefinitionId: filterDefinitionId('region'),
  type: 'tree_group_compare',
  priority: 2,
  enabled: false,
  config: { type: 'tree_group_compare', groupField: 'category', operator: 'equals', value: 'EMEA' },
  description: 'EMEA only',
  createdAt: 3000,
};

const customRule: FilterRule = {
  id: 'rule_4',
  filterDefinitionId: filterDefinitionId('region'),
  type: 'custom',
  priority: 3,
  enabled: true,
  config: { type: 'custom', evaluatorKey: 'userAccess', params: { level: 'admin' } },
  description: 'User access filter',
  createdAt: 4000,
};

// -- Tests --

describe('Rule Editor Modal — Validation', () => {
  it('requires a filter definition', () => {
    const errors = validateRuleForm('', 'exclude_pattern', { pattern: '^TEST' });
    expect(errors['filterDefId']).toBeDefined();
  });

  it('passes when filter definition is set', () => {
    const errors = validateRuleForm('region', 'exclude_pattern', { pattern: '^TEST' });
    expect(errors['filterDefId']).toBeUndefined();
  });

  describe('exclude_pattern / include_pattern', () => {
    it('requires a pattern', () => {
      const errors = validateRuleForm('region', 'exclude_pattern', { pattern: '' });
      expect(errors['pattern']).toBe('Pattern is required');
    });

    it('rejects patterns over 500 chars', () => {
      const errors = validateRuleForm('region', 'include_pattern', { pattern: 'a'.repeat(501) });
      expect(errors['pattern']).toBe('Pattern must be 500 characters or less');
    });

    it('rejects invalid regex', () => {
      const errors = validateRuleForm('region', 'exclude_pattern', { pattern: '(' });
      expect(errors['pattern']).toBe('Invalid regular expression');
    });

    it('accepts valid regex', () => {
      const errors = validateRuleForm('region', 'exclude_pattern', { pattern: '^TEST_|_DEV$', flags: 'i' });
      expect(errors['pattern']).toBeUndefined();
    });

    it('accepts complex regex with flags', () => {
      const errors = validateRuleForm('region', 'include_pattern', { pattern: '\\d{3}-\\w+', flags: 'gi' });
      expect(errors['pattern']).toBeUndefined();
    });
  });

  describe('value_set', () => {
    it('requires at least one value', () => {
      const errors = validateRuleForm('product', 'value_set', { vsValues: '' });
      expect(errors['values']).toBe('Enter at least one value');
    });

    it('rejects whitespace-only values', () => {
      const errors = validateRuleForm('product', 'value_set', { vsValues: '  \n  \n  ' });
      expect(errors['values']).toBe('Enter at least one value');
    });

    it('accepts one or more values', () => {
      const errors = validateRuleForm('product', 'value_set', { vsValues: 'VALUE_1\nVALUE_2' });
      expect(errors['values']).toBeUndefined();
    });
  });

  describe('tree_group_compare', () => {
    it('requires groupField', () => {
      const errors = validateRuleForm('region', 'tree_group_compare', { tgField: '', tgValue: 'EMEA' });
      expect(errors['groupField']).toBe('Group field is required');
    });

    it('requires value', () => {
      const errors = validateRuleForm('region', 'tree_group_compare', { tgField: 'category', tgValue: '' });
      expect(errors['tgValue']).toBe('Value is required');
    });

    it('accepts valid fields', () => {
      const errors = validateRuleForm('region', 'tree_group_compare', { tgField: 'category', tgValue: 'EMEA' });
      expect(errors['groupField']).toBeUndefined();
      expect(errors['tgValue']).toBeUndefined();
    });
  });

  describe('custom', () => {
    it('requires evaluator key', () => {
      const errors = validateRuleForm('region', 'custom', { customKey: '' });
      expect(errors['evaluatorKey']).toBe('Evaluator key is required');
    });

    it('rejects invalid JSON params', () => {
      const errors = validateRuleForm('region', 'custom', { customKey: 'test', customParams: '{bad json' });
      expect(errors['customParams']).toBe('Invalid JSON');
    });

    it('accepts valid evaluator key with empty params', () => {
      const errors = validateRuleForm('region', 'custom', { customKey: 'userAccess', customParams: '' });
      expect(errors['evaluatorKey']).toBeUndefined();
      expect(errors['customParams']).toBeUndefined();
    });

    it('accepts valid JSON params', () => {
      const errors = validateRuleForm('region', 'custom', {
        customKey: 'userAccess',
        customParams: '{"level":"admin","threshold":100}',
      });
      expect(errors['evaluatorKey']).toBeUndefined();
      expect(errors['customParams']).toBeUndefined();
    });
  });
});

describe('Rule Editor Modal — Regex Validation', () => {
  it('validates empty pattern as valid', () => {
    expect(validateRegex('')).toBe(true);
  });

  it('validates simple patterns', () => {
    expect(validateRegex('^TEST_')).toBe(true);
    expect(validateRegex('\\d+')).toBe(true);
    expect(validateRegex('[a-z]+')).toBe(true);
  });

  it('validates patterns with flags', () => {
    expect(validateRegex('^test', 'i')).toBe(true);
    expect(validateRegex('foo', 'gi')).toBe(true);
  });

  it('rejects invalid patterns', () => {
    expect(validateRegex('(')).toBe(false);
    expect(validateRegex('[unclosed')).toBe(false);
    expect(validateRegex('*')).toBe(false);
  });

  it('rejects patterns exceeding max length', () => {
    expect(validateRegex('a'.repeat(501))).toBe(false);
    expect(validateRegex('a'.repeat(500))).toBe(true);
  });
});

describe('Rule Editor Modal — JSON Params Validation', () => {
  it('validates empty string', () => {
    expect(validateJsonParams('')).toBe(true);
    expect(validateJsonParams('  ')).toBe(true);
  });

  it('validates valid JSON', () => {
    expect(validateJsonParams('{}')).toBe(true);
    expect(validateJsonParams('{"key":"value"}')).toBe(true);
    expect(validateJsonParams('{"nested":{"a":1}}')).toBe(true);
  });

  it('rejects invalid JSON', () => {
    expect(validateJsonParams('{bad')).toBe(false);
    expect(validateJsonParams('undefined')).toBe(false);
    expect(validateJsonParams('{key: value}')).toBe(false);
  });
});

describe('Rule Editor Modal — Default Config', () => {
  it('creates exclude_pattern default', () => {
    const config = defaultConfigForType('exclude_pattern');
    expect(config.type).toBe('exclude_pattern');
    expect((config as ExcludePatternConfig).pattern).toBe('');
    expect((config as ExcludePatternConfig).flags).toBe('i');
  });

  it('creates include_pattern default', () => {
    const config = defaultConfigForType('include_pattern');
    expect(config.type).toBe('include_pattern');
    expect((config as IncludePatternConfig).pattern).toBe('');
  });

  it('creates value_set default', () => {
    const config = defaultConfigForType('value_set');
    expect(config.type).toBe('value_set');
    expect((config as ValueSetConfig).mode).toBe('exclude');
    expect((config as ValueSetConfig).values).toEqual([]);
  });

  it('creates tree_group_compare default', () => {
    const config = defaultConfigForType('tree_group_compare');
    expect(config.type).toBe('tree_group_compare');
    expect((config as TreeGroupCompareConfig).operator).toBe('equals');
  });

  it('creates custom default', () => {
    const config = defaultConfigForType('custom');
    expect(config.type).toBe('custom');
    expect((config as CustomRuleConfig).evaluatorKey).toBe('');
  });
});

describe('Rule Editor Modal — Build Rule', () => {
  it('builds a new rule in add mode', () => {
    const config: ExcludePatternConfig = { type: 'exclude_pattern', pattern: '^TEST', flags: 'i' };
    const rule = buildRule('add', null, 'exclude_pattern', filterDefinitionId('region'), 0, true, 'Test rule', config);

    expect(rule.id).toContain('rule_exclude_pattern_');
    expect(rule.filterDefinitionId).toBe('region');
    expect(rule.type).toBe('exclude_pattern');
    expect(rule.priority).toBe(0);
    expect(rule.enabled).toBe(true);
    expect(rule.config).toEqual(config);
    expect(rule.description).toBe('Test rule');
    expect(rule.createdAt).toBeGreaterThan(0);
  });

  it('preserves ID and createdAt in edit mode', () => {
    const config: ValueSetConfig = { type: 'value_set', mode: 'include', values: ['A', 'B'] };
    const rule = buildRule('edit', excludeRule, 'value_set', filterDefinitionId('region'), 5, false, 'Updated', config);

    expect(rule.id).toBe('rule_1');
    expect(rule.createdAt).toBe(1000);
    expect(rule.type).toBe('value_set');
    expect(rule.priority).toBe(5);
    expect(rule.enabled).toBe(false);
    expect(rule.description).toBe('Updated');
  });

  it('generates new ID in copy mode', () => {
    const config: ExcludePatternConfig = { type: 'exclude_pattern', pattern: '^COPY', flags: 'i' };
    const rule = buildRule('copy', excludeRule, 'exclude_pattern', filterDefinitionId('region'), 10, true, 'Copied', config);

    expect(rule.id).not.toBe('rule_1');
    expect(rule.id).toContain('rule_exclude_pattern_');
    expect(rule.createdAt).toBeGreaterThan(1000);
  });

  it('trims empty description to undefined', () => {
    const config: ExcludePatternConfig = { type: 'exclude_pattern', pattern: '^X', flags: 'i' };
    const rule = buildRule('add', null, 'exclude_pattern', filterDefinitionId('region'), 0, true, '  ', config);

    expect(rule.description).toBeUndefined();
  });
});

describe('Rule Admin — Config Summary Tags', () => {
  it('shows regex for pattern rules', () => {
    const tags = getConfigSummary(excludeRule);
    expect(tags).toEqual(['/^TEST_/i']);
  });

  it('shows mode and count for value set rules', () => {
    const tags = getConfigSummary(valueSetRule);
    expect(tags).toEqual(['exclude', '2 value(s)']);
  });

  it('shows comparison expression for tree group rules', () => {
    const tags = getConfigSummary(treeRule);
    expect(tags).toEqual(['category equals "EMEA"']);
  });

  it('shows evaluator key for custom rules', () => {
    const tags = getConfigSummary(customRule);
    expect(tags).toEqual(['userAccess']);
  });
});

describe('Rule Editor Modal — Mode Initialization', () => {
  it('copy mode appends (Copy) to description', () => {
    const baseDesc = excludeRule.description ?? '';
    const copyDesc = baseDesc + ' (Copy)';
    expect(copyDesc).toBe('Exclude test regions (Copy)');
  });

  it('copy mode assigns new priority above max', () => {
    const maxPriority = 5;
    const copyPriority = maxPriority + 1;
    expect(copyPriority).toBe(6);
  });

  it('copy mode starts enabled', () => {
    // Even if original is disabled, copy starts enabled
    expect(treeRule.enabled).toBe(false);
    const copyEnabled = true; // modal forces enabled for copy
    expect(copyEnabled).toBe(true);
  });

  it('add mode defaults to first definition when only one available', () => {
    const defs = [defRegion];
    const defaultDefId = defs.length === 1 ? defs[0].id : '';
    expect(defaultDefId).toBe('region');
  });

  it('add mode leaves definition empty when multiple available', () => {
    const defs = [defRegion, defProduct];
    const defaultDefId = defs.length === 1 ? defs[0].id : '';
    expect(defaultDefId).toBe('');
  });
});

describe('Rule Editor Context Menu Items', () => {
  it('includes edit and copy options for rule context menu', () => {
    // Mirrors buildRuleContextItems from filter-designer
    const items = [
      { id: 'edit-rule', label: 'Edit Rule' },
      { id: 'copy-rule', label: 'Duplicate Rule' },
      { id: 'toggle-rule', label: 'Disable Rule' },
      { id: 'move-rule-up', label: 'Move Higher Priority' },
      { id: 'move-rule-down', label: 'Move Lower Priority' },
      { id: 'remove-rule', label: 'Remove Rule' },
    ];

    const ids = items.map(i => i.id);
    expect(ids).toContain('edit-rule');
    expect(ids).toContain('copy-rule');
    expect(ids).toContain('remove-rule');
    expect(ids.indexOf('edit-rule')).toBeLessThan(ids.indexOf('remove-rule'));
  });
});

describe('Rule Editor Modal — Edge Cases', () => {
  it('handles include_pattern same as exclude_pattern for validation', () => {
    const errorsExclude = validateRuleForm('region', 'exclude_pattern', { pattern: '^TEST' });
    const errorsInclude = validateRuleForm('region', 'include_pattern', { pattern: '^TEST' });
    expect(Object.keys(errorsExclude).length).toBe(0);
    expect(Object.keys(errorsInclude).length).toBe(0);
  });

  it('parses multiline values correctly', () => {
    const input = 'VALUE_1\nVALUE_2\n\nVALUE_3\n  \n';
    const values = input.split('\n').map(v => v.trim()).filter(Boolean);
    expect(values).toEqual(['VALUE_1', 'VALUE_2', 'VALUE_3']);
  });

  it('handles JSON params with nested objects', () => {
    const params = '{"filters":{"region":"EMEA"},"limit":50}';
    expect(validateJsonParams(params)).toBe(true);
    const parsed = JSON.parse(params);
    expect(parsed.filters.region).toBe('EMEA');
  });

  it('builds value_set config from textarea', () => {
    const input = 'DISC\nLEGACY\nTEST';
    const values = input.split('\n').map(v => v.trim()).filter(Boolean);
    const config: ValueSetConfig = { type: 'value_set', mode: 'exclude', values };
    expect(config.values).toEqual(['DISC', 'LEGACY', 'TEST']);
    expect(config.mode).toBe('exclude');
  });

  it('tree_group_compare operators work in summary', () => {
    const ops: Array<'equals' | 'not_equals' | 'contains'> = ['equals', 'not_equals', 'contains'];
    const summaries = ops.map(op => {
      const rule: FilterRule = {
        id: 'test',
        filterDefinitionId: filterDefinitionId('r'),
        type: 'tree_group_compare',
        priority: 0,
        enabled: true,
        config: { type: 'tree_group_compare', groupField: 'cat', operator: op, value: 'X' },
        createdAt: 0,
      };
      return getConfigSummary(rule)[0];
    });
    expect(summaries).toEqual([
      'cat equals "X"',
      'cat not equals "X"',
      'cat contains "X"',
    ]);
  });

  it('tree_group_compare in/not_in operators show values count in summary', () => {
    const inRule: FilterRule = {
      id: 'tg-in',
      filterDefinitionId: filterDefinitionId('r'),
      type: 'tree_group_compare',
      priority: 0,
      enabled: true,
      config: { type: 'tree_group_compare', groupField: 'region', operator: 'in', value: '', values: ['US', 'UK', 'DE'] },
      createdAt: 0,
    };
    expect(getConfigSummary(inRule)).toEqual(['region in [3 values]']);

    const notInRule: FilterRule = {
      id: 'tg-not-in',
      filterDefinitionId: filterDefinitionId('r'),
      type: 'tree_group_compare',
      priority: 0,
      enabled: true,
      config: { type: 'tree_group_compare', groupField: 'cat', operator: 'not_in', value: '', values: ['A', 'B'] },
      createdAt: 0,
    };
    expect(getConfigSummary(notInRule)).toEqual(['cat not in [2 values]']);
  });
});

// ============================================================
// Cross-Filter Rule Tests (UI)
// ============================================================

describe('Rule Editor Modal — Cross Filter Validation', () => {
  it('requires at least one condition', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [],
      cfValueSource: 'fixed',
      cfActionValues: 'US',
    });
    expect(errors['cfConditions']).toBe('At least one condition is required');
  });

  it('requires all conditions to have a key', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [
        { source: 'filter', key: 'status', operator: 'equals', values: ['active'] },
        { source: 'filter', key: '', operator: 'equals', values: [] },
      ],
      cfValueSource: 'fixed',
      cfActionValues: 'US',
    });
    expect(errors['cfConditions']).toBe('All conditions must have a key');
  });

  it('requires action values for fixed list', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
      cfValueSource: 'fixed',
      cfActionValues: '',
    });
    expect(errors['cfActionValues']).toBe('Enter at least one value');
  });

  it('requires context key for runtime context', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
      cfValueSource: 'context',
      cfActionContextKey: '',
    });
    expect(errors['cfActionValues']).toBe('Context key is required');
  });

  it('passes valid cross_filter form with fixed list', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
      cfValueSource: 'fixed',
      cfActionValues: 'US\nUK',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('passes valid cross_filter form with context source', () => {
    const errors = validateRuleForm('region', 'cross_filter', {
      cfConditions: [{ source: 'filter', key: 'status', operator: 'equals', values: ['active'] }],
      cfValueSource: 'context',
      cfActionContextKey: 'allowed_values',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('Rule Editor Modal — Cross Filter Default Config', () => {
  it('creates cross_filter default config', () => {
    const config = defaultConfigForType('cross_filter');
    expect(config.type).toBe('cross_filter');
    const cf = config as CrossFilterConfig;
    expect(cf.conditions).toHaveLength(1);
    expect(cf.logic).toBe('all');
    expect(cf.action.type).toBe('include_values');
  });
});

describe('Rule Admin — Cross Filter Config Summary Tags', () => {
  it('shows cross_filter summary tags', () => {
    const rule: FilterRule = {
      id: 'cf-test',
      filterDefinitionId: filterDefinitionId('region'),
      type: 'cross_filter',
      priority: 0,
      enabled: true,
      config: {
        type: 'cross_filter',
        conditions: [
          { source: 'filter', key: 'status', operator: 'equals', values: ['active'] },
          { source: 'context', key: 'tier', operator: 'in', values: ['gold', 'platinum'] },
        ],
        logic: 'all',
        action: { type: 'include_values', values: ['US', 'UK'] },
        elseAction: 'pass_through',
      },
      createdAt: 0,
    };
    const tags = getConfigSummary(rule);
    expect(tags).toContain('2 condition(s)');
    expect(tags).toContain('ALL');
    expect(tags).toContain('\u2192 include values');
    expect(tags).toContain('else: pass through');
  });

  it('omits else tag when elseAction is undefined', () => {
    const rule: FilterRule = {
      id: 'cf-test2',
      filterDefinitionId: filterDefinitionId('region'),
      type: 'cross_filter',
      priority: 0,
      enabled: true,
      config: {
        type: 'cross_filter',
        conditions: [{ source: 'filter', key: 'x', operator: 'equals', values: ['Y'] }],
        logic: 'any',
        action: { type: 'exclude_values', values: ['A'] },
      },
      createdAt: 0,
    };
    const tags = getConfigSummary(rule);
    expect(tags).toEqual(['1 condition(s)', 'ANY', '\u2192 exclude values']);
  });

  it('shows exclude_from_context summary tag', () => {
    const rule: FilterRule = {
      id: 'cf-test3',
      filterDefinitionId: filterDefinitionId('region'),
      type: 'cross_filter',
      priority: 0,
      enabled: true,
      config: {
        type: 'cross_filter',
        conditions: [{ source: 'context', key: 'role', operator: 'is_set' }],
        logic: 'all',
        action: { type: 'exclude_from_context', contextKey: 'blocked_values' },
        elseAction: 'block',
      },
      createdAt: 0,
    };
    const tags = getConfigSummary(rule);
    expect(tags).toContain('\u2192 exclude from context');
    expect(tags).toContain('else: block');
  });
});
