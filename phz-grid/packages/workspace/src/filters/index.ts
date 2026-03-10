/**
 * @phozart/phz-workspace — Filters Module (O.7)
 */

// Filter context (O.1 + O.1a + O.6)
export {
  createFilterContext,
  createDebouncedFilterDispatch,
  type FilterContextManager,
  type FilterContextOptions,
  type DebouncedDispatch,
} from './filter-context.js';

// Cascading resolver (O.2)
export {
  buildDependencyGraph,
  resolveCascadingDependency,
  type DependencyGraph,
  type CascadingResult,
} from './cascading-resolver.js';

// URL sync (O.3)
export {
  serializeFilterState,
  deserializeFilterState,
} from './url-filter-sync.js';

// Preset manager (O.4)
export {
  createFilterPresetManager,
  type FilterPreset,
  type FilterPresetManager,
} from './filter-preset-manager.js';

// Query layer resolution (T.2)
export {
  resolveQueryLayer,
  classifyFilterChange,
} from './query-layer.js';

// Filter bar utilities (O.5 + O.5a)
export {
  inferFilterUIType,
  buildDateFilterOptions,
  type InferOptions,
  type DateFilterOption,
} from './phz-filter-bar.js';

// FilterDefinition (U.1)
export {
  isFilterDefinition,
  createFilterDefinition,
  validateFilterDefinition,
  resolveBindingsForSource,
  evaluateSecurityBinding,
  resolveFilterDefault,
  type FilterDefinition,
  type FilterBinding,
  type SecurityBinding,
} from './filter-definition.js';

// FilterRuleEngine (U.2)
export {
  evaluateFilterRules,
  evaluateCondition,
  type FilterRule,
  type FilterRuleCondition,
  type FilterRuleAction,
  type FilterRuleResult,
} from './filter-rule-engine.js';

// FilterContractResolver (U.3)
export {
  resolveFilterContract,
  validateFilterValues,
  type ResolvedFilter,
  type ResolvedFilterContract,
  type FilterValuesValidation,
} from './filter-contract-resolver.js';

// FilterRuleEditor (U.4)
export {
  createFilterRuleEditorState,
  addCondition,
  removeCondition,
  updateCondition,
  addAction,
  removeAction,
  updateAction,
  getRuleFromState,
  validateRuleState,
  type FilterRuleEditorState,
  type RuleValidationResult,
} from './filter-rule-editor.js';

// FilterOwnership (U.5)
export {
  resolveFiltersFromContract,
  prunePresetValues,
  applySecurityRestrictions,
  buildFilterBarFromContract,
  type ContractFilterResolution,
  type PruneResult,
  type FilterBarEntry,
} from './filter-ownership.js';

// FilterAdmin (B-3.06)
export * from './filter-admin-state.js';

// FilterValueAdmin (B-3.07)
export * from './filter-value-admin-state.js';
