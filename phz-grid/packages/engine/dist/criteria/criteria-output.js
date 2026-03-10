/**
 * @phozart/phz-engine — Criteria Output
 *
 * Structured ArtefactCriteria with typed operators and a debounced
 * subscription model.
 */
// --- Factory ---
export function createCriteriaOutputManager(registry, bindingStore) {
    const subscribers = new Set();
    let debounceMs = 0;
    let debounceTimer = null;
    return {
        buildCriteria(artId, currentValues, resolvedLevels, ruleResults) {
            const bindings = bindingStore.getBindingsForArtefact(artId);
            const filters = [];
            let isComplete = true;
            for (const binding of bindings) {
                if (!binding.visible)
                    continue;
                const def = registry.get(binding.filterDefinitionId);
                if (!def || def.deprecated)
                    continue;
                const key = def.id;
                let value = currentValues[key] ?? null;
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
        subscribe(listener) {
            subscribers.add(listener);
            return () => { subscribers.delete(listener); };
        },
        emit(criteria) {
            if (debounceMs > 0) {
                if (debounceTimer)
                    clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    for (const sub of subscribers)
                        sub(criteria);
                    debounceTimer = null;
                }, debounceMs);
            }
            else {
                for (const sub of subscribers)
                    sub(criteria);
            }
        },
        setDebounceMs(ms) {
            debounceMs = ms;
        },
    };
}
// --- Operator Inference ---
export function inferOperator(type, value, allowNullValue, searchConfig) {
    // Null value
    if (value === null) {
        return allowNullValue ? 'is_null' : 'in'; // null = all selected
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
export function splitSearchTokens(query, minChars) {
    const min = minChars ?? 1;
    return query
        .trim()
        .split(/\s+/)
        .filter(t => t.length >= min);
}
// --- Tree Output Filtering ---
export function filterTreeOutput(selectedValues, treeNodes, mode) {
    if (mode === 'selected_level' || mode === 'full_path') {
        return selectedValues;
    }
    // leaf_only: remove any selected value that has children in the tree
    const parentValues = new Set();
    collectParentValues(treeNodes, parentValues);
    return selectedValues.filter(v => !parentValues.has(v));
}
function collectParentValues(nodes, result) {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            result.add(node.value);
            collectParentValues(node.children, result);
        }
    }
}
//# sourceMappingURL=criteria-output.js.map