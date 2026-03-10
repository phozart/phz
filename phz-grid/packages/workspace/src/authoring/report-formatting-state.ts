/**
 * @phozart/phz-workspace — Report Formatting State
 *
 * Pure functions for managing conditional formatting rules in the
 * report editor. Supports CRUD operations, reordering, and draft editing.
 */

export type FormattingCondition = 'greaterThan' | 'lessThan' | 'equals' | 'between' | 'contains' | 'notEmpty';

export interface FormattingRule {
  id: string;
  field: string;
  condition: FormattingCondition;
  value: unknown;
  secondaryValue?: unknown;  // for 'between'
  style: Record<string, string>;
  priority: number;
  enabled: boolean;
}

export interface ReportFormattingState {
  rules: FormattingRule[];
  editingRuleId?: string;
  ruleDraft?: Partial<FormattingRule>;
}

export function initialReportFormattingState(): ReportFormattingState {
  return { rules: [] };
}

export function addFormattingRule(
  state: ReportFormattingState,
  rule: FormattingRule,
): ReportFormattingState {
  if (state.rules.some(r => r.id === rule.id)) return state;
  return { ...state, rules: [...state.rules, rule] };
}

export function removeFormattingRule(
  state: ReportFormattingState,
  ruleId: string,
): ReportFormattingState {
  return {
    ...state,
    rules: state.rules.filter(r => r.id !== ruleId),
    editingRuleId: state.editingRuleId === ruleId ? undefined : state.editingRuleId,
    ruleDraft: state.editingRuleId === ruleId ? undefined : state.ruleDraft,
  };
}

export function updateFormattingRule(
  state: ReportFormattingState,
  ruleId: string,
  updates: Partial<FormattingRule>,
): ReportFormattingState {
  return {
    ...state,
    rules: state.rules.map(r =>
      r.id === ruleId ? { ...r, ...updates, id: r.id } : r,
    ),
  };
}

export function reorderRules(
  state: ReportFormattingState,
  fromIndex: number,
  toIndex: number,
): ReportFormattingState {
  if (
    fromIndex < 0 || fromIndex >= state.rules.length ||
    toIndex < 0 || toIndex >= state.rules.length
  ) return state;
  const rules = [...state.rules];
  const [moved] = rules.splice(fromIndex, 1);
  rules.splice(toIndex, 0, moved);
  return { ...state, rules };
}

export function startEditFormattingRule(
  state: ReportFormattingState,
  ruleId: string,
): ReportFormattingState {
  const rule = state.rules.find(r => r.id === ruleId);
  if (!rule) return state;
  return {
    ...state,
    editingRuleId: ruleId,
    ruleDraft: { ...rule },
  };
}

export function commitFormattingRule(state: ReportFormattingState): ReportFormattingState {
  if (!state.editingRuleId || !state.ruleDraft) return state;
  const editId = state.editingRuleId;
  return {
    ...state,
    rules: state.rules.map(r =>
      r.id === editId ? { ...r, ...state.ruleDraft, id: r.id } : r,
    ),
    editingRuleId: undefined,
    ruleDraft: undefined,
  };
}
