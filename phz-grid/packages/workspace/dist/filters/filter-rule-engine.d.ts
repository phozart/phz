/**
 * @phozart/workspace — FilterRuleEngine (U.2)
 *
 * Evaluates conditional business rules against the current filter state
 * and viewer context. Rules are priority-ordered; multiple rules can
 * match simultaneously.
 */
import type { ViewerContext } from '../types.js';
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
export type FilterRuleCondition = {
    type: 'field-value';
    filterDefinitionId: string;
    operator: 'eq' | 'neq' | 'in' | 'not-in' | 'gt' | 'lt';
    value: unknown;
} | {
    type: 'viewer-attribute';
    attribute: string;
    operator: 'eq' | 'neq' | 'in' | 'not-in';
    value: unknown;
} | {
    type: 'compound';
    logic: 'and' | 'or';
    conditions: FilterRuleCondition[];
};
export type FilterRuleAction = {
    type: 'restrict';
    filterDefinitionId: string;
    allowedValues: unknown[];
} | {
    type: 'hide';
    filterDefinitionId: string;
} | {
    type: 'disable';
    filterDefinitionId: string;
    message?: string;
} | {
    type: 'force';
    filterDefinitionId: string;
    value: unknown;
};
export interface FilterRuleResult {
    ruleId: string;
    ruleName: string;
    matched: boolean;
    actions: FilterRuleAction[];
}
export declare function evaluateCondition(condition: FilterRuleCondition, viewer: ViewerContext | undefined, filterState: Record<string, unknown>): boolean;
export declare function evaluateFilterRules(rules: FilterRule[], viewerContext: ViewerContext | undefined, currentFilterState: Record<string, unknown>): FilterRuleResult[];
//# sourceMappingURL=filter-rule-engine.d.ts.map