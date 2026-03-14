/**
 * @phozart/engine — Criteria Engine Facade
 *
 * Unified factory that wires all criteria engine layers together:
 * Registry → Bindings → State → Rules → Output → Admin
 */
import { createFilterRegistry } from './filter-registry.js';
import { createFilterBindingStore, resolveArtefactFields } from './filter-bindings.js';
import { hydrateCriteriaConfig } from './resolve-criteria.js';
import { createFilterStateManager, resolveFilterValue } from './filter-state.js';
import { createFilterRuleEngine } from './filter-rules.js';
import { createCriteriaOutputManager } from './criteria-output.js';
import { createFilterAdminService, FULL_ADMIN_PERMISSIONS } from './filter-admin.js';
// --- Factory ---
export function createCriteriaEngine(config) {
    const registry = createFilterRegistry();
    const bindings = createFilterBindingStore();
    const stateManager = createFilterStateManager(config?.storage);
    const ruleEngine = createFilterRuleEngine();
    const output = createCriteriaOutputManager(registry, bindings);
    const admin = createFilterAdminService(registry, bindings, config?.permissions ?? FULL_ADMIN_PERMISSIONS);
    if (config?.debounceMs) {
        output.setDebounceMs(config.debounceMs);
    }
    return {
        registry,
        bindings,
        stateManager,
        ruleEngine,
        output,
        admin,
        resolveFields(artId) {
            return resolveArtefactFields(registry, bindings, artId);
        },
        buildCriteria(artId, values, externalContext) {
            const artBindings = bindings.getBindingsForArtefact(artId);
            const resolvedLevels = {};
            const ruleResults = {};
            for (const binding of artBindings) {
                const key = binding.filterDefinitionId;
                const def = registry.get(binding.filterDefinitionId);
                if (!def)
                    continue;
                // Resolve state level
                const resolved = resolveFilterValue(binding.filterDefinitionId, {
                    definitionDefaults: def.defaultValue !== undefined
                        ? { [key]: def.defaultValue }
                        : undefined,
                    bindingDefaults: binding.defaultValueOverride !== undefined
                        ? { [key]: binding.defaultValueOverride }
                        : undefined,
                });
                resolvedLevels[key] = resolved.level;
                // Evaluate rules — merge external context with current filter values
                const mergedContext = { ...externalContext, ...values };
                const ruleResult = ruleEngine.evaluate(binding.filterDefinitionId, def.options ?? [], def.treeOptions, mergedContext);
                ruleResults[key] = {
                    isApplied: ruleResult.appliedRuleIds.length > 0,
                    ruleIds: ruleResult.appliedRuleIds,
                };
            }
            return output.buildCriteria(artId, values, resolvedLevels, ruleResults);
        },
        subscribe(listener) {
            return output.subscribe(listener);
        },
    };
}
// --- Migration from Legacy CriteriaConfig ---
export function migrateFromCriteriaConfig(config, artId, engineConfig) {
    const engine = createCriteriaEngine(engineConfig);
    hydrateCriteriaConfig(engine.registry, engine.bindings, config, artId);
    return engine;
}
//# sourceMappingURL=criteria-engine.js.map