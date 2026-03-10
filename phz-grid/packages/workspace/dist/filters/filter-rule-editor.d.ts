/**
 * @phozart/phz-workspace — FilterRuleEditor headless state (U.4)
 *
 * Pure state management for authoring conditional filter rules.
 * The Lit component (phz-filter-rule-editor) consumes this logic.
 */
import type { FilterRule, FilterRuleCondition, FilterRuleAction } from './filter-rule-engine.js';
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
export interface RuleValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateRuleState(state: FilterRuleEditorState): RuleValidationResult;
export declare function createFilterRuleEditorState(rule?: FilterRule): FilterRuleEditorState;
export declare function addCondition(state: FilterRuleEditorState, condition: FilterRuleCondition): FilterRuleEditorState;
export declare function removeCondition(state: FilterRuleEditorState, index: number): FilterRuleEditorState;
export declare function updateCondition(state: FilterRuleEditorState, index: number, condition: FilterRuleCondition): FilterRuleEditorState;
export declare function addAction(state: FilterRuleEditorState, action: FilterRuleAction): FilterRuleEditorState;
export declare function removeAction(state: FilterRuleEditorState, index: number): FilterRuleEditorState;
export declare function updateAction(state: FilterRuleEditorState, index: number, action: FilterRuleAction): FilterRuleEditorState;
export declare function getRuleFromState(state: FilterRuleEditorState): FilterRule;
//# sourceMappingURL=filter-rule-editor.d.ts.map