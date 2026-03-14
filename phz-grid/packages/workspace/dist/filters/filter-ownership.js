/**
 * @phozart/workspace — Filter Ownership Model (U.5)
 *
 * Bridges FilterDefinitions, ArtifactFilterContracts, security bindings,
 * and filter rules into the existing FilterContextManager system.
 *
 * Admin defines FilterDefinitions -> binds to dashboards via ArtifactFilterContract.
 * End users can only use admin-defined filters + create personal presets within constraints.
 */
import { evaluateSecurityBinding, } from './filter-definition.js';
import { resolveFilterContract, } from './filter-contract-resolver.js';
export function resolveFiltersFromContract(contract, definitions, viewerContext, presetValues) {
    const resolved = resolveFilterContract(contract, definitions, viewerContext);
    const filters = [];
    const defaults = {};
    const effectiveValues = {};
    for (const rf of resolved.filters) {
        const label = rf.overrides?.label ?? rf.definition.label;
        const required = rf.overrides?.required ?? rf.definition.required ?? false;
        filters.push({
            definition: rf.definition,
            queryLayer: rf.queryLayer,
            label,
            required,
        });
        // Resolve default
        if (rf.resolvedDefault !== undefined) {
            defaults[rf.definition.id] = rf.resolvedDefault;
        }
        // Effective value: preset takes precedence over default
        const presetVal = presetValues?.[rf.definition.id];
        if (presetVal !== undefined) {
            effectiveValues[rf.definition.id] = presetVal;
        }
        else if (rf.resolvedDefault !== undefined) {
            effectiveValues[rf.definition.id] = rf.resolvedDefault;
        }
    }
    return { filters, defaults, effectiveValues };
}
export function prunePresetValues(presetValues, contract, definitions) {
    const acceptedIds = new Set((contract.acceptedFilters ?? []).map(r => r.filterDefinitionId));
    const defMap = new Map();
    for (const d of definitions) {
        defMap.set(d.id, d);
    }
    const onInvalid = contract.validation?.onInvalid ?? 'prune';
    const pruned = {};
    const removed = [];
    for (const [filterId, value] of Object.entries(presetValues)) {
        // Remove filters no longer in the contract
        if (!acceptedIds.has(filterId)) {
            removed.push(filterId);
            continue;
        }
        const def = defMap.get(filterId);
        if (!def) {
            removed.push(filterId);
            continue;
        }
        // Validate value against static source if using prune strategy
        if (onInvalid === 'prune' && def.valueSource.type === 'static') {
            const allowed = new Set(def.valueSource.values);
            if (!allowed.has(String(value))) {
                removed.push(filterId);
                continue;
            }
        }
        pruned[filterId] = value;
    }
    return { pruned, removed };
}
// ========================================================================
// Security restrictions
// ========================================================================
export function applySecurityRestrictions(definition, viewer, allValues) {
    if (!definition.securityBinding)
        return allValues;
    return evaluateSecurityBinding(definition.securityBinding, viewer, allValues);
}
export function buildFilterBarFromContract(contract, definitions) {
    const defMap = new Map();
    for (const d of definitions) {
        defMap.set(d.id, d);
    }
    const entries = [];
    for (const ref of contract.acceptedFilters ?? []) {
        const def = defMap.get(ref.filterDefinitionId);
        if (!def)
            continue;
        entries.push({
            id: def.id,
            label: ref.overrides?.label ?? def.label,
            filterType: def.filterType,
            required: ref.overrides?.required ?? def.required ?? false,
            defaultValue: def.defaultValue,
            bindings: def.bindings,
        });
    }
    return entries;
}
//# sourceMappingURL=filter-ownership.js.map