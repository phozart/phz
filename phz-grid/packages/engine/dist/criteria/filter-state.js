/**
 * @phozart/phz-engine — Filter State Management
 *
 * 6-level state resolution chain and StateStorageAdapter for
 * persist/reset session behavior.
 */
// --- Factory ---
export function createFilterStateManager(storage) {
    return {
        resolveState(filterId, inputs) {
            return resolveFilterValue(filterId, inputs);
        },
        persistState(key, values, definitions) {
            if (!storage)
                return;
            const toPersist = {};
            for (const def of definitions) {
                if (def.sessionBehavior === 'persist' && filterId(def.id) in values) {
                    toPersist[def.id] = values[def.id];
                }
            }
            if (Object.keys(toPersist).length > 0) {
                storage.persist(key, toPersist);
            }
        },
        loadPersistedState(key, definitions, bindings) {
            if (!storage)
                return { reconciled: {}, staleKeys: [] };
            const raw = storage.load(key);
            if (!raw)
                return { reconciled: {}, staleKeys: [] };
            return reconcilePersistedState(raw, definitions, bindings);
        },
    };
}
function filterId(id) {
    return id;
}
// --- 6-Level State Resolution ---
export function resolveFilterValue(id, inputs) {
    const key = id;
    // Level 1: Rule values (highest priority)
    if (inputs.ruleValues && key in inputs.ruleValues && inputs.ruleValues[key] !== undefined) {
        return { value: inputs.ruleValues[key], level: 'rule' };
    }
    // Level 2: Preset values
    if (inputs.presetValues && key in inputs.presetValues && inputs.presetValues[key] !== undefined) {
        return { value: inputs.presetValues[key], level: 'preset' };
    }
    // Level 3: Persisted values
    if (inputs.persistedValues && key in inputs.persistedValues && inputs.persistedValues[key] !== undefined) {
        return { value: inputs.persistedValues[key], level: 'persisted' };
    }
    // Level 4: Binding defaults
    if (inputs.bindingDefaults && key in inputs.bindingDefaults && inputs.bindingDefaults[key] !== undefined) {
        return { value: inputs.bindingDefaults[key], level: 'binding_default' };
    }
    // Level 5: Definition defaults
    if (inputs.definitionDefaults && key in inputs.definitionDefaults && inputs.definitionDefaults[key] !== undefined) {
        return { value: inputs.definitionDefaults[key], level: 'definition_default' };
    }
    // Level 6: All selected (null = all)
    return { value: null, level: 'all_selected' };
}
// --- Memory Storage Adapter ---
export function createMemoryStorageAdapter() {
    const store = new Map();
    return {
        persist(key, state) {
            store.set(key, { ...state });
        },
        load(key) {
            const data = store.get(key);
            return data ? { ...data } : null;
        },
        remove(key) {
            store.delete(key);
        },
    };
}
// --- Stale Reconciliation ---
export function reconcilePersistedState(persisted, definitions, bindings) {
    const validIds = new Set();
    for (const def of definitions) {
        if (def.sessionBehavior === 'persist') {
            validIds.add(def.id);
        }
    }
    // If bindings provided, further restrict to only bound filters
    if (bindings) {
        const boundIds = new Set(bindings.map(b => b.filterDefinitionId));
        for (const id of validIds) {
            if (!boundIds.has(id))
                validIds.delete(id);
        }
    }
    const reconciled = {};
    const staleKeys = [];
    for (const [key, value] of Object.entries(persisted)) {
        if (validIds.has(key)) {
            reconciled[key] = value;
        }
        else {
            staleKeys.push(key);
        }
    }
    return { reconciled, staleKeys };
}
//# sourceMappingURL=filter-state.js.map