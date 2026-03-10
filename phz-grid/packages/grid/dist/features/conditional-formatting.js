function matchCondition(value, condition) {
    const { operator, value: target, value2 } = condition;
    if (value == null && operator !== 'isNull' && operator !== 'isEmpty')
        return false;
    switch (operator) {
        case 'equals':
            return value == target;
        case 'notEquals':
            return value != target;
        case 'greaterThan':
            return Number(value) > Number(target);
        case 'greaterThanOrEqual':
            return Number(value) >= Number(target);
        case 'lessThan':
            return Number(value) < Number(target);
        case 'lessThanOrEqual':
            return Number(value) <= Number(target);
        case 'between':
            return Number(value) >= Number(target) && Number(value) <= Number(value2);
        case 'contains':
            return String(value).toLowerCase().includes(String(target).toLowerCase());
        case 'notContains':
            return !String(value).toLowerCase().includes(String(target).toLowerCase());
        case 'startsWith':
            return String(value).toLowerCase().startsWith(String(target).toLowerCase());
        case 'endsWith':
            return String(value).toLowerCase().endsWith(String(target).toLowerCase());
        case 'isNull':
            return value == null;
        case 'isNotNull':
            return value != null;
        case 'isEmpty':
            return value == null || value === '';
        case 'isNotEmpty':
            return value != null && value !== '';
        case 'in':
            return Array.isArray(target) && target.includes(value);
        case 'notIn':
            return Array.isArray(target) && !target.includes(value);
        default:
            return false;
    }
}
export function createConditionalFormattingEngine() {
    let rules = [];
    return {
        addRule(rule) {
            rules.push(rule);
            rules.sort((a, b) => a.priority - b.priority);
        },
        removeRule(id) {
            rules = rules.filter(r => r.id !== id);
        },
        getRules() {
            return [...rules];
        },
        clearRules() {
            rules = [];
        },
        evaluate(value, field, row) {
            const matching = rules.filter(r => {
                if (r.type === 'cell' || r.type === 'column') {
                    if (r.field !== field)
                        return false;
                }
                // For row-level rules, check the specified field
                const checkValue = r.type === 'row' ? row[r.field] : value;
                return matchCondition(checkValue, r.condition);
            });
            if (matching.length === 0)
                return null;
            // Merge styles from all matching rules (priority order)
            const merged = {};
            for (const rule of matching) {
                Object.assign(merged, rule.style);
            }
            return merged;
        },
        evaluateRow(row, columns) {
            const result = new Map();
            for (const col of columns) {
                const value = row[col.field];
                const style = this.evaluate(value, col.field, row);
                if (style)
                    result.set(col.field, style);
            }
            return result;
        },
    };
}
// --- Preset Rule Builders ---
export function createColorScaleRule(id, field, minColor, maxColor, minVal, maxVal, priority = 100) {
    return {
        id,
        type: 'cell',
        field,
        condition: { operator: 'greaterThanOrEqual', value: minVal },
        style: { backgroundColor: minColor },
        priority,
    };
}
export function createThresholdRule(id, field, operator, value, style, priority = 50) {
    return {
        id,
        type: 'cell',
        field,
        condition: { operator, value },
        style,
        priority,
    };
}
export function createHighlightAboveTarget(field, target, color = '#22C55E', bgColor = 'rgba(34, 197, 94, 0.1)') {
    return {
        id: `target-above-${field}`,
        type: 'cell',
        field,
        condition: { operator: 'greaterThanOrEqual', value: target },
        style: { color, backgroundColor: bgColor, fontWeight: '600' },
        priority: 50,
    };
}
export function createHighlightBelowTarget(field, target, color = '#EF4444', bgColor = 'rgba(239, 68, 68, 0.1)') {
    return {
        id: `target-below-${field}`,
        type: 'cell',
        field,
        condition: { operator: 'lessThan', value: target },
        style: { color, backgroundColor: bgColor, fontWeight: '600' },
        priority: 50,
    };
}
//# sourceMappingURL=conditional-formatting.js.map