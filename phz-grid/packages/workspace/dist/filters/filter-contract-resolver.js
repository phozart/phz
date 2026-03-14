/**
 * @phozart/workspace — FilterContractResolver (U.3)
 *
 * Resolves an ArtifactFilterContract against available FilterDefinitions.
 * Validates filter values against the contract and produces pruned results.
 */
import { resolveFilterDefault } from './filter-definition.js';
// ========================================================================
// resolveFilterContract
// ========================================================================
export function resolveFilterContract(contract, definitions, viewerContext) {
    const defMap = new Map();
    for (const d of definitions) {
        defMap.set(d.id, d);
    }
    const filters = [];
    const warnings = [];
    for (const ref of contract.acceptedFilters ?? []) {
        const def = defMap.get(ref.filterDefinitionId);
        if (!def) {
            warnings.push(`FilterDefinition '${ref.filterDefinitionId}' not found`);
            continue;
        }
        // Determine default: override takes precedence over definition default
        const defaultSpec = ref.overrides?.defaultValue ?? def.defaultValue;
        const resolvedDefault = defaultSpec
            ? resolveFilterDefault(defaultSpec, viewerContext)
            : undefined;
        filters.push({
            definition: def,
            overrides: ref.overrides,
            queryLayer: ref.queryLayer ?? 'auto',
            resolvedDefault,
        });
    }
    return { filters, warnings };
}
export function validateFilterValues(contract, values, definitions) {
    const defMap = new Map();
    for (const d of definitions) {
        defMap.set(d.id, d);
    }
    const acceptedIds = new Set((contract.acceptedFilters ?? []).map(r => r.filterDefinitionId));
    const onInvalid = contract.validation?.onInvalid ?? 'prune';
    const pruned = {};
    const warnings = [];
    let valid = true;
    for (const [filterId, value] of Object.entries(values)) {
        // Prune filters not in the contract
        if (!acceptedIds.has(filterId)) {
            warnings.push(`Filter '${filterId}' is not in the contract, pruned`);
            continue;
        }
        const def = defMap.get(filterId);
        if (!def) {
            warnings.push(`FilterDefinition '${filterId}' not found, pruned`);
            continue;
        }
        // Validate against static value source
        if (def.valueSource.type === 'static') {
            const allowed = new Set(def.valueSource.values);
            const valueStr = String(value);
            if (!allowed.has(valueStr)) {
                switch (onInvalid) {
                    case 'prune':
                        warnings.push(`Value '${valueStr}' for filter '${filterId}' is not allowed, pruned`);
                        continue; // skip this value
                    case 'invalidate':
                        valid = false;
                        pruned[filterId] = value;
                        warnings.push(`Value '${valueStr}' for filter '${filterId}' is not allowed`);
                        continue;
                    case 'clamp':
                        // For clamp, use the first allowed value
                        if (allowed.size > 0) {
                            pruned[filterId] = def.valueSource.values[0];
                            warnings.push(`Value '${valueStr}' for filter '${filterId}' clamped to '${def.valueSource.values[0]}'`);
                        }
                        continue;
                    case 'ignore':
                        pruned[filterId] = value;
                        continue;
                }
            }
        }
        // data-source and lookup-table values can't be validated statically
        pruned[filterId] = value;
    }
    return { valid, pruned, warnings };
}
//# sourceMappingURL=filter-contract-resolver.js.map