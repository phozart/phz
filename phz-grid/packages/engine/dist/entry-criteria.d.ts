/**
 * @phozart/phz-engine/criteria — Criteria-focused entry point
 *
 * CriteriaEngine, FilterAdapter, filter registry, bindings, state, rules, and output.
 */
export { createCriteriaEngine, migrateFromCriteriaConfig } from './criteria/criteria-engine.js';
export type { CriteriaEngine, CriteriaEngineConfig } from './criteria/criteria-engine.js';
export { createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings } from './filter-adapter.js';
export type { FilterAdapter } from './filter-adapter.js';
export { createFilterRegistry, detectDependencyCycles, topologicalSortFilters } from './criteria/filter-registry.js';
export type { FilterRegistry } from './criteria/filter-registry.js';
export { createFilterBindingStore, resolveArtefactFields, migrateCriteriaConfig } from './criteria/filter-bindings.js';
export type { FilterBindingStore } from './criteria/filter-bindings.js';
export { createFilterStateManager, resolveFilterValue, createMemoryStorageAdapter, reconcilePersistedState } from './criteria/filter-state.js';
export type { FilterStateManager, ResolvedFilterValue } from './criteria/filter-state.js';
export { createFilterRuleEngine, evaluateRule, previewRule } from './criteria/filter-rules.js';
export type { FilterRuleEngine, CustomRuleEvaluator } from './criteria/filter-rules.js';
export { createCriteriaOutputManager, inferOperator, filterTreeOutput, splitSearchTokens } from './criteria/criteria-output.js';
export type { CriteriaOutputManager, CriteriaSubscriber } from './criteria/criteria-output.js';
export { createFilterAdminService, FULL_ADMIN_PERMISSIONS, READONLY_PERMISSIONS } from './criteria/filter-admin.js';
export type { FilterAdminService } from './criteria/filter-admin.js';
export { resolveReportCriteria, resolveDashboardCriteria, hydrateCriteriaConfig } from './criteria/resolve-criteria.js';
export type { CriteriaResolutionResult, DivergenceInfo, DivergenceCallback } from './criteria/resolve-criteria.js';
export { resolveDynamicDefaults, resolveDynamicPreset, resolveDependencies, filterTreeByParent, buildExportMetadata, formatCriteriaValue, validateCriteria, serializeCriteria, deserializeCriteria, resolveBuiltinPreset, resolveComparisonPeriod, getAvailablePresets, formatDateRangeDisplay, getFiscalQuarter, getFiscalQuarterBounds, getWeekStart, getWeekEnd, getISOWeekNumber, getSequentialWeekNumber, getMonthBounds, getCalendarQuarterBounds, inferCriteriaType, deriveOptionsFromData, resolveOptionsSource, resolveFieldOptions, applyCriteriaToData, applyPresenceFilter, BUILTIN_DATE_PRESETS, DATE_PRESET_GROUP_LABELS, } from './selection-criteria.js';
//# sourceMappingURL=entry-criteria.d.ts.map