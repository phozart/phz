/**
 * @phozart/engine — Filter Rules Engine
 *
 * 5 rule types that programmatically constrain filter options.
 * Rules are the highest priority in state resolution.
 */

import type {
  FilterDefinitionId, FilterRule, FilterRuleConfig, FilterRuleResult,
  SelectionFieldOption, TreeNode, RuleEvaluationContext,
  ExcludePatternConfig, IncludePatternConfig, TreeGroupCompareConfig,
  ValueSetConfig, CustomRuleConfig, CrossFilterConfig,
  CrossFilterCondition, CrossFilterAction,
} from '@phozart/core';

// --- Safe Regex Helper ---

const MAX_REGEX_PATTERN_LENGTH = 500;

function safeRegExp(pattern: string, flags?: string): RegExp | null {
  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) return null;
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

// --- Custom Evaluator Type ---

export type CustomRuleEvaluator = (
  params: Record<string, unknown> | undefined,
  options: SelectionFieldOption[],
  treeNodes?: TreeNode[],
  context?: RuleEvaluationContext,
) => { included: string[]; excluded: string[] };

// --- Rule Engine Interface ---

export interface FilterRuleEngine {
  addRule(rule: FilterRule): void;
  removeRule(ruleId: string): void;
  toggleRule(ruleId: string, enabled: boolean): void;
  getRulesForFilter(filterDefId: FilterDefinitionId): FilterRule[];
  registerCustomEvaluator(key: string, evaluator: CustomRuleEvaluator): void;
  evaluate(filterDefId: FilterDefinitionId, options: SelectionFieldOption[], treeNodes?: TreeNode[], context?: RuleEvaluationContext): FilterRuleResult;
}

// --- Factory ---

export function createFilterRuleEngine(): FilterRuleEngine {
  const rules = new Map<string, FilterRule>();
  const customEvaluators = new Map<string, CustomRuleEvaluator>();

  return {
    addRule(rule: FilterRule): void {
      if (rules.has(rule.id)) {
        throw new Error(`Rule "${rule.id}" already exists`);
      }
      rules.set(rule.id, { ...rule });
    },

    removeRule(ruleId: string): void {
      if (!rules.has(ruleId)) {
        throw new Error(`Rule "${ruleId}" not found`);
      }
      rules.delete(ruleId);
    },

    toggleRule(ruleId: string, enabled: boolean): void {
      const rule = rules.get(ruleId);
      if (!rule) {
        throw new Error(`Rule "${ruleId}" not found`);
      }
      rules.set(ruleId, { ...rule, enabled });
    },

    getRulesForFilter(filterDefId: FilterDefinitionId): FilterRule[] {
      return Array.from(rules.values())
        .filter(r => r.filterDefinitionId === filterDefId)
        .sort((a, b) => a.priority - b.priority);
    },

    registerCustomEvaluator(key: string, evaluator: CustomRuleEvaluator): void {
      customEvaluators.set(key, evaluator);
    },

    evaluate(filterDefId: FilterDefinitionId, options: SelectionFieldOption[], treeNodes?: TreeNode[], context?: RuleEvaluationContext): FilterRuleResult {
      const applicable = Array.from(rules.values())
        .filter(r => r.filterDefinitionId === filterDefId && r.enabled)
        .sort((a, b) => a.priority - b.priority);

      if (applicable.length === 0) {
        return { constrainedOptions: [...options], appliedRuleIds: [], excludedValues: [] };
      }

      let currentOptions = [...options];
      const appliedRuleIds: string[] = [];
      const allExcluded: string[] = [];

      for (const rule of applicable) {
        const result = evaluateRule(rule, currentOptions, treeNodes, customEvaluators, context);
        currentOptions = currentOptions.filter(o => result.included.includes(o.value));
        const excluded = options
          .filter(o => result.excluded.includes(o.value))
          .map(o => o.value);
        allExcluded.push(...excluded);
        appliedRuleIds.push(rule.id);
      }

      return {
        constrainedOptions: currentOptions,
        appliedRuleIds,
        excludedValues: [...new Set(allExcluded)],
      };
    },
  };
}

// --- Single Rule Evaluation ---

export function evaluateRule(
  rule: FilterRule,
  options: SelectionFieldOption[],
  treeNodes?: TreeNode[],
  customEvaluators?: Map<string, CustomRuleEvaluator>,
  context?: RuleEvaluationContext,
): { included: string[]; excluded: string[] } {
  const config = rule.config;

  switch (config.type) {
    case 'exclude_pattern':
      return evaluateExcludePattern(config, options);
    case 'include_pattern':
      return evaluateIncludePattern(config, options);
    case 'value_set':
      return evaluateValueSet(config, options);
    case 'tree_group_compare':
      return evaluateTreeGroupCompare(config, options, treeNodes);
    case 'custom':
      return evaluateCustom(config, options, treeNodes, customEvaluators, context);
    case 'cross_filter':
      return evaluateCrossFilter(config, options, context);
    default:
      return { included: options.map(o => o.value), excluded: [] };
  }
}

function evaluateExcludePattern(config: ExcludePatternConfig, options: SelectionFieldOption[]): { included: string[]; excluded: string[] } {
  const regex = safeRegExp(config.pattern, config.flags);
  if (!regex) {
    return { included: options.map(o => o.value), excluded: [] };
  }
  const included: string[] = [];
  const excluded: string[] = [];
  for (const opt of options) {
    if (regex.test(opt.value) || regex.test(opt.label)) {
      excluded.push(opt.value);
    } else {
      included.push(opt.value);
    }
  }
  return { included, excluded };
}

function evaluateIncludePattern(config: IncludePatternConfig, options: SelectionFieldOption[]): { included: string[]; excluded: string[] } {
  const regex = safeRegExp(config.pattern, config.flags);
  if (!regex) {
    return { included: options.map(o => o.value), excluded: [] };
  }
  const included: string[] = [];
  const excluded: string[] = [];
  for (const opt of options) {
    if (regex.test(opt.value) || regex.test(opt.label)) {
      included.push(opt.value);
    } else {
      excluded.push(opt.value);
    }
  }
  return { included, excluded };
}

function evaluateValueSet(config: ValueSetConfig, options: SelectionFieldOption[]): { included: string[]; excluded: string[] } {
  const valueSet = new Set(config.values);
  const included: string[] = [];
  const excluded: string[] = [];
  for (const opt of options) {
    const inSet = valueSet.has(opt.value);
    if (config.mode === 'include') {
      if (inSet) included.push(opt.value); else excluded.push(opt.value);
    } else {
      if (inSet) excluded.push(opt.value); else included.push(opt.value);
    }
  }
  return { included, excluded };
}

function evaluateTreeGroupCompare(
  config: TreeGroupCompareConfig,
  options: SelectionFieldOption[],
  treeNodes?: TreeNode[],
): { included: string[]; excluded: string[] } {
  if (!treeNodes) return { included: options.map(o => o.value), excluded: [] };

  const matchingValues = new Set<string>();
  collectMatchingTreeValues(treeNodes, config, matchingValues);

  const included: string[] = [];
  const excluded: string[] = [];
  for (const opt of options) {
    if (matchingValues.has(opt.value)) {
      included.push(opt.value);
    } else {
      excluded.push(opt.value);
    }
  }
  return { included, excluded };
}

function collectMatchingTreeValues(
  nodes: TreeNode[],
  config: TreeGroupCompareConfig,
  result: Set<string>,
): void {
  for (const node of nodes) {
    const fieldValue = node.value;
    let matches = false;
    switch (config.operator) {
      case 'equals':
        matches = fieldValue === config.value;
        break;
      case 'not_equals':
        matches = fieldValue !== config.value;
        break;
      case 'contains':
        matches = fieldValue.includes(config.value);
        break;
      case 'in':
        matches = (config.values ?? []).includes(fieldValue);
        break;
      case 'not_in':
        matches = !(config.values ?? []).includes(fieldValue);
        break;
    }
    if (matches) result.add(node.value);
    if (node.children) {
      collectMatchingTreeValues(node.children, config, result);
    }
  }
}

function evaluateCustom(
  config: CustomRuleConfig,
  options: SelectionFieldOption[],
  treeNodes?: TreeNode[],
  customEvaluators?: Map<string, CustomRuleEvaluator>,
  context?: RuleEvaluationContext,
): { included: string[]; excluded: string[] } {
  const evaluator = customEvaluators?.get(config.evaluatorKey);
  if (!evaluator) {
    // Unknown evaluator — pass through
    return { included: options.map(o => o.value), excluded: [] };
  }
  return evaluator(config.params, options, treeNodes, context);
}

// --- Cross-Filter Evaluation ---

function evaluateCrossFilter(
  config: CrossFilterConfig,
  options: SelectionFieldOption[],
  context?: RuleEvaluationContext,
): { included: string[]; excluded: string[] } {
  if (!context) {
    return applyElseAction(config.elseAction, options);
  }

  const conditionsMet = evaluateConditions(config.conditions, config.logic, context);

  if (conditionsMet) {
    return executeAction(config.action, options, context);
  }
  return applyElseAction(config.elseAction, options);
}

function evaluateConditions(
  conditions: CrossFilterCondition[],
  logic: 'all' | 'any',
  context: RuleEvaluationContext,
): boolean {
  if (conditions.length === 0) return false;

  if (logic === 'all') {
    return conditions.every(c => evaluateCondition(c, context));
  }
  return conditions.some(c => evaluateCondition(c, context));
}

function evaluateCondition(
  cond: CrossFilterCondition,
  context: RuleEvaluationContext,
): boolean {
  const contextValue = context[cond.key];

  switch (cond.operator) {
    case 'is_set':
      return contextValue !== undefined && contextValue !== null;
    case 'is_not_set':
      return contextValue === undefined || contextValue === null;
    case 'equals':
      if (typeof contextValue === 'string') return contextValue === cond.values?.[0];
      return false;
    case 'not_equals':
      if (typeof contextValue === 'string') return contextValue !== cond.values?.[0];
      return true;
    case 'in':
      if (typeof contextValue === 'string') return (cond.values ?? []).includes(contextValue);
      return false;
    case 'not_in':
      if (typeof contextValue === 'string') return !(cond.values ?? []).includes(contextValue);
      return true;
    default:
      return false;
  }
}

function executeAction(
  action: CrossFilterAction,
  options: SelectionFieldOption[],
  context: RuleEvaluationContext,
): { included: string[]; excluded: string[] } {
  let allowedSet: Set<string>;

  switch (action.type) {
    case 'include_values':
      allowedSet = new Set(action.values ?? []);
      return {
        included: options.filter(o => allowedSet.has(o.value)).map(o => o.value),
        excluded: options.filter(o => !allowedSet.has(o.value)).map(o => o.value),
      };
    case 'exclude_values':
      allowedSet = new Set(action.values ?? []);
      return {
        included: options.filter(o => !allowedSet.has(o.value)).map(o => o.value),
        excluded: options.filter(o => allowedSet.has(o.value)).map(o => o.value),
      };
    case 'include_from_context': {
      const ctxVal = action.contextKey ? context[action.contextKey] : undefined;
      let allowed: string[];
      if (Array.isArray(ctxVal)) {
        allowed = ctxVal as string[];
      } else if (typeof ctxVal === 'string') {
        allowed = [ctxVal];
      } else {
        // Context key not found or wrong type — pass through
        return { included: options.map(o => o.value), excluded: [] };
      }
      allowedSet = new Set(allowed);
      return {
        included: options.filter(o => allowedSet.has(o.value)).map(o => o.value),
        excluded: options.filter(o => !allowedSet.has(o.value)).map(o => o.value),
      };
    }
    case 'exclude_from_context': {
      const ctxVal2 = action.contextKey ? context[action.contextKey] : undefined;
      let blocked: string[];
      if (Array.isArray(ctxVal2)) {
        blocked = ctxVal2 as string[];
      } else if (typeof ctxVal2 === 'string') {
        blocked = [ctxVal2];
      } else {
        // Context key not found or wrong type — pass through
        return { included: options.map(o => o.value), excluded: [] };
      }
      const blockedSet = new Set(blocked);
      return {
        included: options.filter(o => !blockedSet.has(o.value)).map(o => o.value),
        excluded: options.filter(o => blockedSet.has(o.value)).map(o => o.value),
      };
    }
    default:
      return { included: options.map(o => o.value), excluded: [] };
  }
}

function applyElseAction(
  elseAction: string | undefined,
  options: SelectionFieldOption[],
): { included: string[]; excluded: string[] } {
  if (elseAction === 'block') {
    return { included: [], excluded: options.map(o => o.value) };
  }
  // Default: pass_through
  return { included: options.map(o => o.value), excluded: [] };
}

// --- Preview Helper for Admin ---

export function previewRule(
  rule: FilterRule,
  options: SelectionFieldOption[],
  treeNodes?: TreeNode[],
  context?: RuleEvaluationContext,
): { before: SelectionFieldOption[]; after: SelectionFieldOption[] } {
  const result = evaluateRule(rule, options, treeNodes, undefined, context);
  return {
    before: options,
    after: options.filter(o => result.included.includes(o.value)),
  };
}
