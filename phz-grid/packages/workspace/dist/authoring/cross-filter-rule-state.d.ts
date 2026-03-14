/**
 * @phozart/workspace — Cross-Filter Rule State
 *
 * Pure functions for managing cross-filter scoping rules in the
 * dashboard editor. Rules define which widgets can cross-filter
 * which targets and how fields are mapped between them.
 */
import type { FieldMetadata } from '@phozart/shared';
export interface CrossFilterFieldMapping {
    sourceField: string;
    targetField: string;
    operator?: 'eq' | 'in' | 'range';
}
export interface CrossFilterRule {
    id: string;
    sourceWidgetId: string;
    targetWidgetId: string | '*';
    fieldMapping: CrossFilterFieldMapping[];
    bidirectional: boolean;
    enabled: boolean;
}
export interface CrossFilterRuleState {
    rules: CrossFilterRule[];
    editingRuleId?: string;
    editingDraft?: Partial<CrossFilterRule>;
    validationErrors: string[];
}
export declare function initialCrossFilterRuleState(): CrossFilterRuleState;
export declare function addRule(state: CrossFilterRuleState, rule: CrossFilterRule): CrossFilterRuleState;
export declare function removeRule(state: CrossFilterRuleState, ruleId: string): CrossFilterRuleState;
export declare function updateRule(state: CrossFilterRuleState, ruleId: string, updates: Partial<CrossFilterRule>): CrossFilterRuleState;
export declare function startEditRule(state: CrossFilterRuleState, ruleId: string): CrossFilterRuleState;
export declare function commitRule(state: CrossFilterRuleState): CrossFilterRuleState;
export declare function cancelEditRule(state: CrossFilterRuleState): CrossFilterRuleState;
export declare function autoSuggestFieldMapping(sourceFields: Pick<FieldMetadata, 'name' | 'dataType' | 'nullable' | 'cardinality'>[], targetFields: Pick<FieldMetadata, 'name' | 'dataType' | 'nullable' | 'cardinality'>[]): CrossFilterFieldMapping[];
export declare function validateRules(rules: CrossFilterRule[], widgetIds: string[]): {
    valid: boolean;
    errors: string[];
};
export declare function getCrossFilterMatrix(rules: CrossFilterRule[], widgetIds: string[]): Record<string, string[]>;
//# sourceMappingURL=cross-filter-rule-state.d.ts.map