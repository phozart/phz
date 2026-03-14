/**
 * @phozart/engine — Criteria Output
 *
 * Structured ArtefactCriteria with typed operators and a debounced
 * subscription model.
 */
import type { ArtefactId, CriteriaOperator, ArtefactCriteria, StateResolutionLevel, TreeOutputMode, TreeNode, SearchFieldConfig } from '@phozart/core';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
export type CriteriaSubscriber = (criteria: ArtefactCriteria) => void;
export interface CriteriaOutputManager {
    buildCriteria(artefactId: ArtefactId, currentValues: Record<string, string | string[] | null>, resolvedLevels: Record<string, StateResolutionLevel>, ruleResults: Record<string, {
        isApplied: boolean;
        ruleIds: string[];
    }>): ArtefactCriteria;
    subscribe(listener: CriteriaSubscriber): () => void;
    emit(criteria: ArtefactCriteria): void;
    setDebounceMs(ms: number): void;
}
export declare function createCriteriaOutputManager(registry: FilterRegistry, bindingStore: FilterBindingStore): CriteriaOutputManager;
export declare function inferOperator(type: string, value: string | string[] | null, allowNullValue?: boolean, searchConfig?: SearchFieldConfig): CriteriaOperator;
/**
 * Split a search string into individual tokens, filtering by minChars.
 * Returns an array of lowercased, whitespace-trimmed tokens.
 */
export declare function splitSearchTokens(query: string, minChars?: number): string[];
export declare function filterTreeOutput(selectedValues: string[], treeNodes: TreeNode[], mode: TreeOutputMode): string[];
//# sourceMappingURL=criteria-output.d.ts.map