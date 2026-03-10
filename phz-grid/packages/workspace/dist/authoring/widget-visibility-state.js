/**
 * @phozart/phz-workspace — Widget Visibility State
 *
 * Pure functions for conditional widget visibility: types, CRUD, evaluation.
 * Widgets can be shown/hidden based on filter state or data result values.
 */
// --- Initial state ---
export function initialWidgetVisibilityState() {
    return { conditions: {} };
}
// --- CRUD ---
export function setVisibilityCondition(state, widgetId, condition) {
    return { ...state, conditions: { ...state.conditions, [widgetId]: condition } };
}
export function removeVisibilityCondition(state, widgetId) {
    if (!(widgetId in state.conditions))
        return state;
    const { [widgetId]: _, ...rest } = state.conditions;
    return { ...state, conditions: rest };
}
// --- Edit flow ---
export function startEditCondition(state, widgetId) {
    const existing = state.conditions[widgetId];
    const draft = existing
        ? { ...existing, expression: { ...existing.expression } }
        : {
            expression: { field: '', operator: 'eq', value: '' },
            evaluateAgainst: 'filter-state',
            hiddenBehavior: 'collapse',
        };
    return { ...state, editingWidgetId: widgetId, editingDraft: draft };
}
export function commitCondition(state) {
    if (!state.editingWidgetId || !state.editingDraft)
        return state;
    return {
        ...state,
        conditions: { ...state.conditions, [state.editingWidgetId]: state.editingDraft },
        editingWidgetId: undefined,
        editingDraft: undefined,
    };
}
export function cancelEditCondition(state) {
    return { ...state, editingWidgetId: undefined, editingDraft: undefined };
}
// --- Evaluation ---
function isSet(val) {
    return val !== null && val !== undefined && val !== '';
}
export function evaluateVisibility(condition, context) {
    const { field, operator, value } = condition.expression;
    const fieldVal = context[field];
    switch (operator) {
        case 'is-set':
            return isSet(fieldVal);
        case 'is-not-set':
            return !isSet(fieldVal);
        case 'eq':
            return fieldVal === value;
        case 'ne':
            return fieldVal !== value;
        case 'gt':
            if (fieldVal == null || typeof fieldVal !== 'number')
                return false;
            return fieldVal > value;
        case 'lt':
            if (fieldVal == null || typeof fieldVal !== 'number')
                return false;
            return fieldVal < value;
        case 'gte':
            if (fieldVal == null || typeof fieldVal !== 'number')
                return false;
            return fieldVal >= value;
        case 'lte':
            if (fieldVal == null || typeof fieldVal !== 'number')
                return false;
            return fieldVal <= value;
        case 'in': {
            const arr = Array.isArray(value) ? value : [value];
            return arr.includes(fieldVal);
        }
        case 'not-in': {
            const arr = Array.isArray(value) ? value : [value];
            return !arr.includes(fieldVal);
        }
        default:
            return true;
    }
}
// --- Filtering ---
export function getVisibleWidgets(widgets, conditions, filterState) {
    return widgets.filter(w => {
        const cond = conditions[w.id];
        if (!cond)
            return true;
        return evaluateVisibility(cond, filterState);
    });
}
//# sourceMappingURL=widget-visibility-state.js.map