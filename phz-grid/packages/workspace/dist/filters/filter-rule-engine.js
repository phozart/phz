/**
 * @phozart/phz-workspace — FilterRuleEngine (U.2)
 *
 * Evaluates conditional business rules against the current filter state
 * and viewer context. Rules are priority-ordered; multiple rules can
 * match simultaneously.
 */
// ========================================================================
// Condition evaluation
// ========================================================================
export function evaluateCondition(condition, viewer, filterState) {
    switch (condition.type) {
        case 'field-value':
            return evaluateFieldValue(condition, filterState);
        case 'viewer-attribute':
            return evaluateViewerAttribute(condition, viewer);
        case 'compound':
            return evaluateCompound(condition, viewer, filterState);
        default:
            return false;
    }
}
function evaluateFieldValue(condition, filterState) {
    const actual = filterState[condition.filterDefinitionId];
    if (actual === undefined)
        return false;
    return compareValues(actual, condition.operator, condition.value);
}
function evaluateViewerAttribute(condition, viewer) {
    if (!viewer?.attributes)
        return false;
    const actual = viewer.attributes[condition.attribute];
    if (actual === undefined)
        return false;
    return compareValues(actual, condition.operator, condition.value);
}
function evaluateCompound(condition, viewer, filterState) {
    const { logic, conditions } = condition;
    if (conditions.length === 0)
        return true;
    if (logic === 'and') {
        return conditions.every(c => evaluateCondition(c, viewer, filterState));
    }
    return conditions.some(c => evaluateCondition(c, viewer, filterState));
}
function compareValues(actual, operator, expected) {
    switch (operator) {
        case 'eq':
            return actual === expected;
        case 'neq':
            return actual !== expected;
        case 'in': {
            if (!Array.isArray(expected))
                return false;
            return expected.includes(actual);
        }
        case 'not-in': {
            if (!Array.isArray(expected))
                return true;
            return !expected.includes(actual);
        }
        case 'gt':
            return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
        case 'lt':
            return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
        default:
            return false;
    }
}
// ========================================================================
// Rule evaluation (main entry point)
// ========================================================================
export function evaluateFilterRules(rules, viewerContext, currentFilterState) {
    // Filter to enabled rules, sort by priority (lower = higher priority)
    const activeRules = rules
        .filter(r => r.enabled)
        .sort((a, b) => a.priority - b.priority);
    return activeRules.map(rule => {
        const logic = rule.conditionLogic ?? 'and';
        let matched;
        if (rule.conditions.length === 0) {
            matched = true;
        }
        else if (logic === 'and') {
            matched = rule.conditions.every(c => evaluateCondition(c, viewerContext, currentFilterState));
        }
        else {
            matched = rule.conditions.some(c => evaluateCondition(c, viewerContext, currentFilterState));
        }
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            matched,
            actions: matched ? [...rule.actions] : [],
        };
    });
}
//# sourceMappingURL=filter-rule-engine.js.map