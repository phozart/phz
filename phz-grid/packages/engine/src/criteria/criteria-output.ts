/**
 * @phozart/engine — Criteria Output
 *
 * Structured ArtefactCriteria with typed operators and a debounced
 * subscription model.
 */

import type {
  FilterDefinitionId, ArtefactId, FilterDefinition, FilterBinding,
  CriteriaOperator, FilterCriterion, ArtefactCriteria, StateResolutionLevel,
  TreeOutputMode, SelectionFieldOption, TreeNode, SearchFieldConfig,
} from '@phozart/core';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
import type { FilterStateManager, ResolvedFilterValue } from './filter-state.js';
import type { FilterRuleEngine } from './filter-rules.js';

// --- Subscription ---

export type CriteriaSubscriber = (criteria: ArtefactCriteria) => void;

// --- Output Manager Interface ---

export interface CriteriaOutputManager {
  buildCriteria(
    artefactId: ArtefactId,
    currentValues: Record<string, string | string[] | null>,
    resolvedLevels: Record<string, StateResolutionLevel>,
    ruleResults: Record<string, { isApplied: boolean; ruleIds: string[] }>,
  ): ArtefactCriteria;
  subscribe(listener: CriteriaSubscriber): () => void;
  emit(criteria: ArtefactCriteria): void;
  setDebounceMs(ms: number): void;
}

// --- Factory ---

export function createCriteriaOutputManager(
  registry: FilterRegistry,
  bindingStore: FilterBindingStore,
): CriteriaOutputManager {
  const subscribers = new Set<CriteriaSubscriber>();
  let debounceMs = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    buildCriteria(
      artId: ArtefactId,
      currentValues: Record<string, string | string[] | null>,
      resolvedLevels: Record<string, StateResolutionLevel>,
      ruleResults: Record<string, { isApplied: boolean; ruleIds: string[] }>,
    ): ArtefactCriteria {
      const bindings = bindingStore.getBindingsForArtefact(artId);
      const filters: FilterCriterion[] = [];
      let isComplete = true;

      for (const binding of bindings) {
        if (!binding.visible) continue;

        const def = registry.get(binding.filterDefinitionId);
        if (!def || def.deprecated) continue;

        const key = def.id as string;
        let value: string | string[] | null = currentValues[key] ?? null;
        const level = resolvedLevels[key] ?? 'all_selected';
        const ruleInfo = ruleResults[key] ?? { isApplied: false, ruleIds: [] };

        // Split multi-value search into token array for the API consumer
        if (def.type === 'search' && def.searchConfig?.multiValue && typeof value === 'string') {
          const tokens = splitSearchTokens(value, def.searchConfig.minChars);
          value = tokens.length > 0 ? tokens : value;
        }

        const operator = inferOperator(def.type, value, def.allowNullValue, def.searchConfig);

        if (def.required && value === null) {
          isComplete = false;
        }

        filters.push({
          filterDefinitionId: def.id,
          operator,
          value,
          dataField: binding.dataFieldOverride ?? def.dataField,
          isRuleApplied: ruleInfo.isApplied,
          activeRuleIds: ruleInfo.ruleIds,
          resolvedFrom: level,
        });
      }

      return {
        artefactId: artId,
        filters,
        timestamp: Date.now(),
        isComplete,
      };
    },

    subscribe(listener: CriteriaSubscriber): () => void {
      subscribers.add(listener);
      return () => { subscribers.delete(listener); };
    },

    emit(criteria: ArtefactCriteria): void {
      if (debounceMs > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          for (const sub of subscribers) sub(criteria);
          debounceTimer = null;
        }, debounceMs);
      } else {
        for (const sub of subscribers) sub(criteria);
      }
    },

    setDebounceMs(ms: number): void {
      debounceMs = ms;
    },
  };
}

// --- Operator Inference ---

export function inferOperator(
  type: string,
  value: string | string[] | null,
  allowNullValue?: boolean,
  searchConfig?: SearchFieldConfig,
): CriteriaOperator {
  // Null value
  if (value === null) {
    return allowNullValue ? 'is_null' : 'in';  // null = all selected
  }

  switch (type) {
    case 'multi_select':
    case 'chip_group':
    case 'tree_select':
      return Array.isArray(value) ? 'in' : 'equals';

    case 'single_select':
    case 'text':
      return 'equals';

    case 'date_range':
    case 'numeric_range':
      return 'between';

    case 'search':
      return searchConfig?.matchMode === 'beginsWith' ? 'starts_with' : 'like';

    case 'field_presence': {
      // Presence filter values encode has_value/empty
      return 'is_not_null';
    }

    case 'period_picker':
      return 'between';

    default:
      return Array.isArray(value) ? 'in' : 'equals';
  }
}

// --- Multi-Value Search Tokenization ---

/**
 * Split a search string into individual tokens, filtering by minChars.
 * Returns an array of lowercased, whitespace-trimmed tokens.
 */
export function splitSearchTokens(query: string, minChars?: number): string[] {
  const min = minChars ?? 1;
  return query
    .trim()
    .split(/\s+/)
    .filter(t => t.length >= min);
}

// --- Tree Output Filtering ---

export function filterTreeOutput(
  selectedValues: string[],
  treeNodes: TreeNode[],
  mode: TreeOutputMode,
): string[] {
  if (mode === 'selected_level' || mode === 'full_path') {
    return selectedValues;
  }

  // leaf_only: remove any selected value that has children in the tree
  const parentValues = new Set<string>();
  collectParentValues(treeNodes, parentValues);

  return selectedValues.filter(v => !parentValues.has(v));
}

function collectParentValues(nodes: TreeNode[], result: Set<string>): void {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      result.add(node.value);
      collectParentValues(node.children, result);
    }
  }
}
