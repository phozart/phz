/**
 * @phozart/phz-workspace — Widget Visibility State
 *
 * Pure functions for conditional widget visibility: types, CRUD, evaluation.
 * Widgets can be shown/hidden based on filter state or data result values.
 */

import type {
  WidgetVisibilityCondition,
  VisibilityExpression,
  VisibilityOperator,
} from '@phozart/phz-engine';

// Re-export types for consumers
export type { WidgetVisibilityCondition, VisibilityExpression, VisibilityOperator };

// --- State ---

export interface WidgetVisibilityState {
  conditions: Record<string, WidgetVisibilityCondition>;
  editingWidgetId?: string;
  editingDraft?: WidgetVisibilityCondition;
}

// --- Initial state ---

export function initialWidgetVisibilityState(): WidgetVisibilityState {
  return { conditions: {} };
}

// --- CRUD ---

export function setVisibilityCondition(
  state: WidgetVisibilityState,
  widgetId: string,
  condition: WidgetVisibilityCondition,
): WidgetVisibilityState {
  return { ...state, conditions: { ...state.conditions, [widgetId]: condition } };
}

export function removeVisibilityCondition(
  state: WidgetVisibilityState,
  widgetId: string,
): WidgetVisibilityState {
  if (!(widgetId in state.conditions)) return state;
  const { [widgetId]: _, ...rest } = state.conditions;
  return { ...state, conditions: rest };
}

// --- Edit flow ---

export function startEditCondition(
  state: WidgetVisibilityState,
  widgetId: string,
): WidgetVisibilityState {
  const existing = state.conditions[widgetId];
  const draft: WidgetVisibilityCondition = existing
    ? { ...existing, expression: { ...existing.expression } }
    : {
        expression: { field: '', operator: 'eq', value: '' },
        evaluateAgainst: 'filter-state',
        hiddenBehavior: 'collapse',
      };
  return { ...state, editingWidgetId: widgetId, editingDraft: draft };
}

export function commitCondition(state: WidgetVisibilityState): WidgetVisibilityState {
  if (!state.editingWidgetId || !state.editingDraft) return state;
  return {
    ...state,
    conditions: { ...state.conditions, [state.editingWidgetId]: state.editingDraft },
    editingWidgetId: undefined,
    editingDraft: undefined,
  };
}

export function cancelEditCondition(state: WidgetVisibilityState): WidgetVisibilityState {
  return { ...state, editingWidgetId: undefined, editingDraft: undefined };
}

// --- Evaluation ---

function isSet(val: unknown): boolean {
  return val !== null && val !== undefined && val !== '';
}

export function evaluateVisibility(
  condition: WidgetVisibilityCondition,
  context: Record<string, unknown>,
): boolean {
  const { field, operator, value } = condition.expression;
  const fieldVal = context[field];

  switch (operator) {
    case 'is-set':
      return isSet(fieldVal);
    case 'is-not-set':
      return !isSet(fieldVal);
    case 'eq':
      return fieldVal === value;
    case 'ne':
      return fieldVal !== value;
    case 'gt':
      if (fieldVal == null || typeof fieldVal !== 'number') return false;
      return fieldVal > (value as number);
    case 'lt':
      if (fieldVal == null || typeof fieldVal !== 'number') return false;
      return fieldVal < (value as number);
    case 'gte':
      if (fieldVal == null || typeof fieldVal !== 'number') return false;
      return fieldVal >= (value as number);
    case 'lte':
      if (fieldVal == null || typeof fieldVal !== 'number') return false;
      return fieldVal <= (value as number);
    case 'in': {
      const arr = Array.isArray(value) ? value : [value];
      return arr.includes(fieldVal);
    }
    case 'not-in': {
      const arr = Array.isArray(value) ? value : [value];
      return !arr.includes(fieldVal);
    }
    default:
      return true;
  }
}

// --- Filtering ---

export function getVisibleWidgets<T extends { id: string }>(
  widgets: T[],
  conditions: Record<string, WidgetVisibilityCondition>,
  filterState: Record<string, unknown>,
): T[] {
  return widgets.filter(w => {
    const cond = conditions[w.id as string];
    if (!cond) return true;
    return evaluateVisibility(cond, filterState);
  });
}
