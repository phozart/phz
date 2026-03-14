/**
 * @phozart/workspace — FilterRuleEditor headless state (U.4)
 *
 * Pure state management for authoring conditional filter rules.
 * The Lit component (phz-filter-rule-editor) consumes this logic.
 */
export function validateRuleState(state) {
    const errors = [];
    if (!state.name?.trim()) {
        errors.push('name is required');
    }
    if (state.conditions.length === 0) {
        errors.push('at least one condition is required');
    }
    if (state.actions.length === 0) {
        errors.push('at least one action is required');
    }
    return { valid: errors.length === 0, errors };
}
// ========================================================================
// Factory
// ========================================================================
let counter = 0;
function generateRuleId() {
    return `rule_${Date.now()}_${++counter}`;
}
export function createFilterRuleEditorState(rule) {
    if (rule) {
        return {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            priority: rule.priority,
            enabled: rule.enabled,
            conditionLogic: rule.conditionLogic ?? 'and',
            conditions: [...rule.conditions],
            actions: [...rule.actions],
        };
    }
    return {
        name: '',
        priority: 10,
        enabled: true,
        conditionLogic: 'and',
        conditions: [],
        actions: [],
    };
}
// ========================================================================
// Condition operations (immutable updates)
// ========================================================================
export function addCondition(state, condition) {
    return {
        ...state,
        conditions: [...state.conditions, condition],
    };
}
export function removeCondition(state, index) {
    if (index < 0 || index >= state.conditions.length)
        return state;
    return {
        ...state,
        conditions: state.conditions.filter((_, i) => i !== index),
    };
}
export function updateCondition(state, index, condition) {
    if (index < 0 || index >= state.conditions.length)
        return state;
    const conditions = [...state.conditions];
    conditions[index] = condition;
    return { ...state, conditions };
}
// ========================================================================
// Action operations (immutable updates)
// ========================================================================
export function addAction(state, action) {
    return {
        ...state,
        actions: [...state.actions, action],
    };
}
export function removeAction(state, index) {
    if (index < 0 || index >= state.actions.length)
        return state;
    return {
        ...state,
        actions: state.actions.filter((_, i) => i !== index),
    };
}
export function updateAction(state, index, action) {
    if (index < 0 || index >= state.actions.length)
        return state;
    const actions = [...state.actions];
    actions[index] = action;
    return { ...state, actions };
}
// ========================================================================
// Extract FilterRule from editor state
// ========================================================================
export function getRuleFromState(state) {
    return {
        id: state.id ?? generateRuleId(),
        name: state.name,
        description: state.description,
        priority: state.priority,
        enabled: state.enabled,
        conditionLogic: state.conditionLogic,
        conditions: [...state.conditions],
        actions: [...state.actions],
    };
}
//# sourceMappingURL=filter-rule-editor.js.map