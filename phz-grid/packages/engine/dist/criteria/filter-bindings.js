/**
 * @phozart/engine — Filter Bindings
 *
 * Associates filter definitions to artefacts (reports/dashboards)
 * with per-binding overrides. Includes migration from legacy CriteriaConfig.
 */
import { createFilterRegistry } from './filter-registry.js';
import { hydrateCriteriaConfig } from './resolve-criteria.js';
// --- Factory ---
export function createFilterBindingStore() {
    const bindings = [];
    function findIndex(filterDefId, artId) {
        return bindings.findIndex(b => b.filterDefinitionId === filterDefId && b.artefactId === artId);
    }
    return {
        bind(binding) {
            if (findIndex(binding.filterDefinitionId, binding.artefactId) >= 0) {
                throw new Error(`Binding for filter "${binding.filterDefinitionId}" to artefact "${binding.artefactId}" already exists`);
            }
            bindings.push({ ...binding });
        },
        unbind(filterDefId, artId) {
            const idx = findIndex(filterDefId, artId);
            if (idx < 0) {
                throw new Error(`Binding not found for filter "${filterDefId}" on artefact "${artId}"`);
            }
            bindings.splice(idx, 1);
        },
        getBindingsForArtefact(artId) {
            return bindings
                .filter(b => b.artefactId === artId)
                .sort((a, b) => a.order - b.order)
                .map(b => ({ ...b }));
        },
        getArtefactsForFilter(filterDefId) {
            return [...new Set(bindings.filter(b => b.filterDefinitionId === filterDefId).map(b => b.artefactId))];
        },
        updateBinding(filterDefId, artId, patch) {
            const idx = findIndex(filterDefId, artId);
            if (idx < 0) {
                throw new Error(`Binding not found for filter "${filterDefId}" on artefact "${artId}"`);
            }
            bindings[idx] = { ...bindings[idx], ...patch, filterDefinitionId: bindings[idx].filterDefinitionId, artefactId: bindings[idx].artefactId };
        },
        reorderBindings(artId, orderedIds) {
            for (let i = 0; i < orderedIds.length; i++) {
                const idx = findIndex(orderedIds[i], artId);
                if (idx >= 0) {
                    bindings[idx] = { ...bindings[idx], order: i };
                }
            }
        },
        hasBindings(filterDefId) {
            return bindings.some(b => b.filterDefinitionId === filterDefId);
        },
    };
}
// --- Resolve Artefact Fields ---
export function resolveArtefactFields(registry, bindingStore, artId) {
    const bindings = bindingStore.getBindingsForArtefact(artId);
    const fields = [];
    for (const binding of bindings) {
        if (!binding.visible)
            continue;
        const def = registry.get(binding.filterDefinitionId);
        if (!def || def.deprecated)
            continue;
        const field = {
            id: def.id,
            label: binding.labelOverride ?? def.label,
            type: def.type,
            dataField: binding.dataFieldOverride ?? def.dataField,
            options: def.options,
            treeOptions: def.treeOptions,
            dateRangeConfig: def.dateRangeConfig,
            numericRangeConfig: def.numericRangeConfig,
            searchConfig: def.searchConfig,
            fieldPresenceConfig: def.fieldPresenceConfig,
            defaultValue: binding.defaultValueOverride ?? def.defaultValue,
            required: binding.requiredOverride ?? def.required,
            selectionMode: binding.selectionModeOverride ?? def.selectionMode,
            allowNullValue: binding.allowNullValueOverride ?? def.allowNullValue,
            dependsOn: def.dependsOn?.[0],
            barConfig: binding.barConfigOverride,
        };
        fields.push(field);
    }
    return fields;
}
// --- Migration Bridge ---
export function migrateCriteriaConfig(config, artId) {
    const registry = createFilterRegistry();
    const bindingStore = createFilterBindingStore();
    hydrateCriteriaConfig(registry, bindingStore, config, artId);
    return { registry, bindings: bindingStore };
}
//# sourceMappingURL=filter-bindings.js.map