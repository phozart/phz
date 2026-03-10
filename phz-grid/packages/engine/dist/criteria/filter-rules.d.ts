/**
 * @phozart/phz-engine — Filter Rules Engine
 *
 * 5 rule types that programmatically constrain filter options.
 * Rules are the highest priority in state resolution.
 */
import type { FilterDefinitionId, FilterRule, FilterRuleResult, SelectionFieldOption, TreeNode, RuleEvaluationContext } from '@phozart/phz-core';
export type CustomRuleEvaluator = (params: Record<string, unknown> | undefined, options: SelectionFieldOption[], treeNodes?: TreeNode[], context?: RuleEvaluationContext) => {
    included: string[];
    excluded: string[];
};
export interface FilterRuleEngine {
    addRule(rule: FilterRule): void;
    removeRule(ruleId: string): void;
    toggleRule(ruleId: string, enabled: boolean): void;
    getRulesForFilter(filterDefId: FilterDefinitionId): FilterRule[];
    registerCustomEvaluator(key: string, evaluator: CustomRuleEvaluator): void;
    evaluate(filterDefId: FilterDefinitionId, options: SelectionFieldOption[], treeNodes?: TreeNode[], context?: RuleEvaluationContext): FilterRuleResult;
}
export declare function createFilterRuleEngine(): FilterRuleEngine;
export declare function evaluateRule(rule: FilterRule, options: SelectionFieldOption[], treeNodes?: TreeNode[], customEvaluators?: Map<string, CustomRuleEvaluator>, context?: RuleEvaluationContext): {
    included: string[];
    excluded: string[];
};
export declare function previewRule(rule: FilterRule, options: SelectionFieldOption[], treeNodes?: TreeNode[], context?: RuleEvaluationContext): {
    before: SelectionFieldOption[];
    after: SelectionFieldOption[];
};
//# sourceMappingURL=filter-rules.d.ts.map