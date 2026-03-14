/**
 * @phozart/workspace — FilterRuleEditor headless state (U.4)
 *
 * Pure state management for authoring conditional filter rules.
 * The Lit component (phz-filter-rule-editor) consumes this logic.
 */

import type { FilterRule, FilterRuleCondition, FilterRuleAction } from './filter-rule-engine.js';

// ========================================================================
// Editor state
// ========================================================================

export interface FilterRuleEditorState {
  id?: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditionLogic: 'and' | 'or';
  conditions: FilterRuleCondition[];
  actions: FilterRuleAction[];
}

// ========================================================================
// Validation
// ========================================================================

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRuleState(state: FilterRuleEditorState): RuleValidationResult {
  const errors: string[] = [];

  if (!state.name?.trim()) {
    errors.push('name is required');
  }

  if (state.conditions.length === 0) {
    errors.push('at least one condition is required');
  }

  if (state.actions.length === 0) {
    errors.push('at least one action is required');
  }

  return { valid: errors.length === 0, errors };
}

// ========================================================================
// Factory
// ========================================================================

let counter = 0;
function generateRuleId(): string {
  return `rule_${Date.now()}_${++counter}`;
}

export function createFilterRuleEditorState(rule?: FilterRule): FilterRuleEditorState {
  if (rule) {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      enabled: rule.enabled,
      conditionLogic: rule.conditionLogic ?? 'and',
      conditions: [...rule.conditions],
      actions: [...rule.actions],
    };
  }

  return {
    name: '',
    priority: 10,
    enabled: true,
    conditionLogic: 'and',
    conditions: [],
    actions: [],
  };
}

// ========================================================================
// Condition operations (immutable updates)
// ========================================================================

export function addCondition(
  state: FilterRuleEditorState,
  condition: FilterRuleCondition,
): FilterRuleEditorState {
  return {
    ...state,
    conditions: [...state.conditions, condition],
  };
}

export function removeCondition(
  state: FilterRuleEditorState,
  index: number,
): FilterRuleEditorState {
  if (index < 0 || index >= state.conditions.length) return state;
  return {
    ...state,
    conditions: state.conditions.filter((_, i) => i !== index),
  };
}

export function updateCondition(
  state: FilterRuleEditorState,
  index: number,
  condition: FilterRuleCondition,
): FilterRuleEditorState {
  if (index < 0 || index >= state.conditions.length) return state;
  const conditions = [...state.conditions];
  conditions[index] = condition;
  return { ...state, conditions };
}

// ========================================================================
// Action operations (immutable updates)
// ========================================================================

export function addAction(
  state: FilterRuleEditorState,
  action: FilterRuleAction,
): FilterRuleEditorState {
  return {
    ...state,
    actions: [...state.actions, action],
  };
}

export function removeAction(
  state: FilterRuleEditorState,
  index: number,
): FilterRuleEditorState {
  if (index < 0 || index >= state.actions.length) return state;
  return {
    ...state,
    actions: state.actions.filter((_, i) => i !== index),
  };
}

export function updateAction(
  state: FilterRuleEditorState,
  index: number,
  action: FilterRuleAction,
): FilterRuleEditorState {
  if (index < 0 || index >= state.actions.length) return state;
  const actions = [...state.actions];
  actions[index] = action;
  return { ...state, actions };
}

// ========================================================================
// Extract FilterRule from editor state
// ========================================================================

export function getRuleFromState(state: FilterRuleEditorState): FilterRule {
  return {
    id: state.id ?? generateRuleId(),
    name: state.name,
    description: state.description,
    priority: state.priority,
    enabled: state.enabled,
    conditionLogic: state.conditionLogic,
    conditions: [...state.conditions],
    actions: [...state.actions],
  };
}
