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
    secondaryValue?: unknown;
    style: Record<string, string>;
    priority: number;
    enabled: boolean;
}
export interface ReportFormattingState {
    rules: FormattingRule[];
    editingRuleId?: string;
    ruleDraft?: Partial<FormattingRule>;
}
export declare function initialReportFormattingState(): ReportFormattingState;
export declare function addFormattingRule(state: ReportFormattingState, rule: FormattingRule): ReportFormattingState;
export declare function removeFormattingRule(state: ReportFormattingState, ruleId: string): ReportFormattingState;
export declare function updateFormattingRule(state: ReportFormattingState, ruleId: string, updates: Partial<FormattingRule>): ReportFormattingState;
export declare function reorderRules(state: ReportFormattingState, fromIndex: number, toIndex: number): ReportFormattingState;
export declare function startEditFormattingRule(state: ReportFormattingState, ruleId: string): ReportFormattingState;
export declare function commitFormattingRule(state: ReportFormattingState): ReportFormattingState;
//# sourceMappingURL=report-formatting-state.d.ts.map