/**
 * @phozart/workspace — FilterRuleEngine (U.2)
 *
 * Evaluates conditional business rules against the current filter state
 * and viewer context. Rules are priority-ordered; multiple rules can
 * match simultaneously.
 */

import type { ViewerContext } from '../types.js';

// ========================================================================
// FilterRule
// ========================================================================

export interface FilterRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: FilterRuleCondition[];
  conditionLogic?: 'and' | 'or';
  actions: FilterRuleAction[];
  enabled: boolean;
}

// ========================================================================
// Conditions (discriminated union)
// ========================================================================

export type FilterRuleCondition =
  | { type: 'field-value'; filterDefinitionId: string; operator: 'eq' | 'neq' | 'in' | 'not-in' | 'gt' | 'lt'; value: unknown }
  | { type: 'viewer-attribute'; attribute: string; operator: 'eq' | 'neq' | 'in' | 'not-in'; value: unknown }
  | { type: 'compound'; logic: 'and' | 'or'; conditions: FilterRuleCondition[] };

// ========================================================================
// Actions (discriminated union)
// ========================================================================

export type FilterRuleAction =
  | { type: 'restrict'; filterDefinitionId: string; allowedValues: unknown[] }
  | { type: 'hide'; filterDefinitionId: string }
  | { type: 'disable'; filterDefinitionId: string; message?: string }
  | { type: 'force'; filterDefinitionId: string; value: unknown };

// ========================================================================
// Result
// ========================================================================

export interface FilterRuleResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: FilterRuleAction[];
}

// ========================================================================
// Condition evaluation
// ========================================================================

export function evaluateCondition(
  condition: FilterRuleCondition,
  viewer: ViewerContext | undefined,
  filterState: Record<string, unknown>,
): boolean {
  switch (condition.type) {
    case 'field-value':
      return evaluateFieldValue(condition, filterState);
    case 'viewer-attribute':
      return evaluateViewerAttribute(condition, viewer);
    case 'compound':
      return evaluateCompound(condition, viewer, filterState);
    default:
      return false;
  }
}

function evaluateFieldValue(
  condition: { filterDefinitionId: string; operator: string; value: unknown },
  filterState: Record<string, unknown>,
): boolean {
  const actual = filterState[condition.filterDefinitionId];
  if (actual === undefined) return false;

  return compareValues(actual, condition.operator, condition.value);
}

function evaluateViewerAttribute(
  condition: { attribute: string; operator: string; value: unknown },
  viewer: ViewerContext | undefined,
): boolean {
  if (!viewer?.attributes) return false;

  const actual = viewer.attributes[condition.attribute];
  if (actual === undefined) return false;

  return compareValues(actual, condition.operator, condition.value);
}

function evaluateCompound(
  condition: { logic: 'and' | 'or'; conditions: FilterRuleCondition[] },
  viewer: ViewerContext | undefined,
  filterState: Record<string, unknown>,
): boolean {
  const { logic, conditions } = condition;
  if (conditions.length === 0) return true;

  if (logic === 'and') {
    return conditions.every(c => evaluateCondition(c, viewer, filterState));
  }
  return conditions.some(c => evaluateCondition(c, viewer, filterState));
}

function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'in': {
      if (!Array.isArray(expected)) return false;
      return expected.includes(actual);
    }
    case 'not-in': {
      if (!Array.isArray(expected)) return true;
      return !expected.includes(actual);
    }
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    default:
      return false;
  }
}

// ========================================================================
// Rule evaluation (main entry point)
// ========================================================================

export function evaluateFilterRules(
  rules: FilterRule[],
  viewerContext: ViewerContext | undefined,
  currentFilterState: Record<string, unknown>,
): FilterRuleResult[] {
  // Filter to enabled rules, sort by priority (lower = higher priority)
  const activeRules = rules
    .filter(r => r.enabled)
    .sort((a, b) => a.priority - b.priority);

  return activeRules.map(rule => {
    const logic = rule.conditionLogic ?? 'and';
    let matched: boolean;

    if (rule.conditions.length === 0) {
      matched = true;
    } else if (logic === 'and') {
      matched = rule.conditions.every(c =>
        evaluateCondition(c, viewerContext, currentFilterState),
      );
    } else {
      matched = rule.conditions.some(c =>
        evaluateCondition(c, viewerContext, currentFilterState),
      );
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      actions: matched ? [...rule.actions] : [],
    };
  });
}
