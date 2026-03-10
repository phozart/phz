/**
 * @phozart/phz-workspace — Cross-Filter Rule State
 *
 * Pure functions for managing cross-filter scoping rules in the
 * dashboard editor. Rules define which widgets can cross-filter
 * which targets and how fields are mapped between them.
 */
// ========================================================================
// Initial state
// ========================================================================
export function initialCrossFilterRuleState() {
    return { rules: [], validationErrors: [] };
}
// ========================================================================
// CRUD
// ========================================================================
export function addRule(state, rule) {
    return { ...state, rules: [...state.rules, rule] };
}
export function removeRule(state, ruleId) {
    return { ...state, rules: state.rules.filter(r => r.id !== ruleId) };
}
export function updateRule(state, ruleId, updates) {
    const idx = state.rules.findIndex(r => r.id === ruleId);
    if (idx === -1)
        return state;
    const updated = { ...state.rules[idx], ...updates };
    const rules = [...state.rules];
    rules[idx] = updated;
    return { ...state, rules };
}
// ========================================================================
// Edit flow
// ========================================================================
export function startEditRule(state, ruleId) {
    const rule = state.rules.find(r => r.id === ruleId);
    if (!rule)
        return state;
    return { ...state, editingRuleId: ruleId, editingDraft: { ...rule } };
}
export function commitRule(state) {
    if (!state.editingRuleId || !state.editingDraft)
        return state;
    const ruleId = state.editingRuleId;
    const draft = state.editingDraft;
    const rules = state.rules.map(r => r.id === ruleId ? { ...r, ...draft } : r);
    return { ...state, rules, editingRuleId: undefined, editingDraft: undefined };
}
export function cancelEditRule(state) {
    return { ...state, editingRuleId: undefined, editingDraft: undefined };
}
// ========================================================================
// Auto-suggest field mapping
// ========================================================================
export function autoSuggestFieldMapping(sourceFields, targetFields) {
    const mappings = [];
    const usedTargets = new Set();
    // Pass 1: case-insensitive name match
    for (const src of sourceFields) {
        const match = targetFields.find(t => !usedTargets.has(t.name) && t.name.toLowerCase() === src.name.toLowerCase());
        if (match) {
            mappings.push({ sourceField: src.name, targetField: match.name });
            usedTargets.add(match.name);
        }
    }
    // Pass 2: dataType + cardinality fallback for unmatched source fields
    for (const src of sourceFields) {
        if (mappings.some(m => m.sourceField === src.name))
            continue;
        const match = targetFields.find(t => !usedTargets.has(t.name) &&
            t.dataType === src.dataType &&
            t.cardinality != null &&
            t.cardinality === src.cardinality);
        if (match) {
            mappings.push({ sourceField: src.name, targetField: match.name });
            usedTargets.add(match.name);
        }
    }
    return mappings;
}
// ========================================================================
// Validation
// ========================================================================
export function validateRules(rules, widgetIds) {
    const errors = [];
    const widgetSet = new Set(widgetIds);
    for (const rule of rules) {
        if (!widgetSet.has(rule.sourceWidgetId)) {
            errors.push(`Source widget "${rule.sourceWidgetId}" does not exist`);
        }
        if (rule.targetWidgetId !== '*' && !widgetSet.has(rule.targetWidgetId)) {
            errors.push(`Target widget "${rule.targetWidgetId}" does not exist`);
        }
        if (rule.sourceWidgetId === rule.targetWidgetId) {
            errors.push(`Rule "${rule.id}" has self-reference: source equals target`);
        }
    }
    // Detect circular bidirectional chains using DFS
    const biRules = rules.filter(r => r.bidirectional);
    if (biRules.length > 1) {
        const adj = new Map();
        for (const r of biRules) {
            const targets = r.targetWidgetId === '*'
                ? widgetIds.filter(id => id !== r.sourceWidgetId)
                : [r.targetWidgetId];
            for (const t of targets) {
                if (!adj.has(r.sourceWidgetId))
                    adj.set(r.sourceWidgetId, new Set());
                adj.get(r.sourceWidgetId).add(t);
                if (!adj.has(t))
                    adj.set(t, new Set());
                adj.get(t).add(r.sourceWidgetId);
            }
        }
        // DFS cycle detection on undirected graph
        const visited = new Set();
        const hasCycle = (node, parent) => {
            visited.add(node);
            for (const neighbor of adj.get(node) ?? []) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor, node))
                        return true;
                }
                else if (neighbor !== parent) {
                    return true;
                }
            }
            return false;
        };
        for (const node of adj.keys()) {
            if (!visited.has(node)) {
                if (hasCycle(node, null)) {
                    errors.push('Bidirectional rules form a circular chain');
                    break;
                }
            }
        }
    }
    return { valid: errors.length === 0, errors };
}
// ========================================================================
// Cross-filter matrix (adjacency list)
// ========================================================================
export function getCrossFilterMatrix(rules, widgetIds) {
    const matrix = {};
    for (const rule of rules) {
        if (!rule.enabled)
            continue;
        const targets = rule.targetWidgetId === '*'
            ? widgetIds.filter(id => id !== rule.sourceWidgetId)
            : [rule.targetWidgetId];
        if (!matrix[rule.sourceWidgetId])
            matrix[rule.sourceWidgetId] = [];
        for (const t of targets) {
            if (!matrix[rule.sourceWidgetId].includes(t)) {
                matrix[rule.sourceWidgetId].push(t);
            }
        }
        if (rule.bidirectional) {
            for (const t of targets) {
                if (!matrix[t])
                    matrix[t] = [];
                if (!matrix[t].includes(rule.sourceWidgetId)) {
                    matrix[t].push(rule.sourceWidgetId);
                }
            }
        }
    }
    return matrix;
}
//# sourceMappingURL=cross-filter-rule-state.js.map