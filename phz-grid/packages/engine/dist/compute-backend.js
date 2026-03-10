/**
 * @phozart/phz-engine — ComputeBackend Strategy
 *
 * Abstraction layer for computation: aggregation, pivot, filter, calculated fields.
 * BIEngine uses this to delegate work to either the JS engine or DuckDB-WASM.
 */
import { computeAggregations } from './aggregation.js';
import { computePivot } from './pivot.js';
function matchesFilter(row, filter) {
    const value = row[filter.field];
    switch (filter.operator) {
        case 'equals':
            return value === filter.value;
        case 'notEquals':
            return value !== filter.value;
        case 'greaterThan':
            return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value;
        case 'greaterThanOrEqual':
            return typeof value === 'number' && typeof filter.value === 'number' && value >= filter.value;
        case 'lessThan':
            return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value;
        case 'lessThanOrEqual':
            return typeof value === 'number' && typeof filter.value === 'number' && value <= filter.value;
        case 'contains':
            return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().includes(filter.value.toLowerCase());
        case 'notContains':
            return typeof value === 'string' && typeof filter.value === 'string' && !value.toLowerCase().includes(filter.value.toLowerCase());
        case 'startsWith':
            return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().startsWith(filter.value.toLowerCase());
        case 'endsWith':
            return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().endsWith(filter.value.toLowerCase());
        case 'isNull':
            return value === null || value === undefined;
        case 'isNotNull':
            return value !== null && value !== undefined;
        case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
        case 'notIn':
            return Array.isArray(filter.value) && !filter.value.includes(value);
        case 'between': {
            const [min, max] = filter.value;
            return typeof value === 'number' && value >= min && value <= max;
        }
        default:
            return true;
    }
}
function evaluateSimpleExpression(row, expression) {
    // Simple expression evaluator for "field1 op field2" patterns
    const match = expression.match(/^(\w+)\s*([+\-*/])\s*(\w+)$/);
    if (match) {
        const [, left, op, right] = match;
        const lval = row[left];
        const rval = row[right];
        if (typeof lval !== 'number' || typeof rval !== 'number')
            return null;
        switch (op) {
            case '+': return lval + rval;
            case '-': return lval - rval;
            case '*': return lval * rval;
            case '/': return rval !== 0 ? lval / rval : null;
        }
    }
    // Try single field reference
    if (/^\w+$/.test(expression) && expression in row) {
        return row[expression];
    }
    return null;
}
export class JSComputeBackend {
    async aggregate(data, config) {
        return computeAggregations(data, config);
    }
    async pivot(data, config) {
        return computePivot(data, config);
    }
    async filter(data, criteria) {
        if (criteria.length === 0)
            return data;
        return data.filter(row => criteria.every(f => matchesFilter(row, f)));
    }
    async computeCalculatedFields(data, fields) {
        if (fields.length === 0)
            return data;
        return data.map(row => {
            const newRow = { ...row };
            for (const field of fields) {
                newRow[field.name] = evaluateSimpleExpression(row, field.expression);
            }
            return newRow;
        });
    }
}
export function createJSComputeBackend() {
    return new JSComputeBackend();
}
//# sourceMappingURL=compute-backend.js.map