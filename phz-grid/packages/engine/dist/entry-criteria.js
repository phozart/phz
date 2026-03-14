/**
 * @phozart/engine/criteria — Criteria-focused entry point
 *
 * CriteriaEngine, FilterAdapter, filter registry, bindings, state, rules, and output.
 */
// Criteria Engine (unified facade)
export { createCriteriaEngine, migrateFromCriteriaConfig } from './criteria/criteria-engine.js';
// Filter Adapter (bridges CriteriaEngine to widget data filtering)
export { createFilterAdapter, applyArtefactCriteria, globalFiltersToCriteriaBindings } from './filter-adapter.js';
// Filter Definition Registry
export { createFilterRegistry, detectDependencyCycles, topologicalSortFilters } from './criteria/filter-registry.js';
// Filter Bindings
export { createFilterBindingStore, resolveArtefactFields, migrateCriteriaConfig } from './criteria/filter-bindings.js';
// Filter State Management
export { createFilterStateManager, resolveFilterValue, createMemoryStorageAdapter, reconcilePersistedState } from './criteria/filter-state.js';
// Filter Rules Engine
export { createFilterRuleEngine, evaluateRule, previewRule } from './criteria/filter-rules.js';
// Criteria Output
export { createCriteriaOutputManager, inferOperator, filterTreeOutput, splitSearchTokens } from './criteria/criteria-output.js';
// Filter Admin Service
export { createFilterAdminService, FULL_ADMIN_PERMISSIONS, READONLY_PERMISSIONS } from './criteria/filter-admin.js';
// Criteria Resolution (auto-hydration & divergence detection)
export { resolveReportCriteria, resolveDashboardCriteria, hydrateCriteriaConfig } from './criteria/resolve-criteria.js';
// Selection Criteria Functions
export { resolveDynamicDefaults, resolveDynamicPreset, resolveDependencies, filterTreeByParent, buildExportMetadata, formatCriteriaValue, validateCriteria, serializeCriteria, deserializeCriteria, resolveBuiltinPreset, resolveComparisonPeriod, getAvailablePresets, formatDateRangeDisplay, getFiscalQuarter, getFiscalQuarterBounds, getWeekStart, getWeekEnd, getISOWeekNumber, getSequentialWeekNumber, getMonthBounds, getCalendarQuarterBounds, inferCriteriaType, deriveOptionsFromData, resolveOptionsSource, resolveFieldOptions, applyCriteriaToData, applyPresenceFilter, BUILTIN_DATE_PRESETS, DATE_PRESET_GROUP_LABELS, } from './selection-criteria.js';
//# sourceMappingURL=entry-criteria.js.map