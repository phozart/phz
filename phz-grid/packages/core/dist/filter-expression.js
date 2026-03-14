/**
 * @phozart/core — Filter Expression Evaluator (Item 6.9)
 *
 * Evaluates a FilterExpression AST against a row of data.
 * Also provides backward-compat helpers to convert legacy FilterState.filters
 * into the new expression format.
 */
import { isFilterAtom } from './types/filter-expression.js';
// --- Date helpers (shared with row-model.ts) ---
function parseDate(value) {
    if (value instanceof Date)
        return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
// --- Atom evaluator ---
function evaluateAtom(row, atom) {
    const value = row[atom.field];
    const filterValue = atom.value;
    const operator = atom.operator;
    switch (operator) {
        case 'equals':
            return value === filterValue;
        case 'notEquals':
            return value !== filterValue;
        case 'contains':
            return String(value ?? '').toLowerCase().includes(String(filterValue ?? '').toLowerCase());
        case 'notContains':
            return !String(value ?? '').toLowerCase().includes(String(filterValue ?? '').toLowerCase());
        case 'startsWith':
            return String(value ?? '').toLowerCase().startsWith(String(filterValue ?? '').toLowerCase());
        case 'endsWith':
            return String(value ?? '').toLowerCase().endsWith(String(filterValue ?? '').toLowerCase());
        case 'lessThan':
            return value < filterValue;
        case 'lessThanOrEqual':
            return value <= filterValue;
        case 'greaterThan':
            return value > filterValue;
        case 'greaterThanOrEqual':
            return value >= filterValue;
        case 'between': {
            const [min, max] = filterValue;
            return value >= min && value <= max;
        }
        case 'in':
            return filterValue.includes(value);
        case 'notIn':
            return !filterValue.includes(value);
        case 'isNull':
            return value == null;
        case 'isNotNull':
            return value != null;
        case 'isEmpty':
            return value == null || value === '';
        case 'isNotEmpty':
            return value != null && value !== '';
        case 'dateDayOfWeek': {
            const d = parseDate(value);
            if (!d)
                return false;
            return filterValue.includes(d.getDay());
        }
        case 'dateMonth': {
            const d = parseDate(value);
            if (!d)
                return false;
            return filterValue.includes(d.getMonth());
        }
        case 'dateYear': {
            const d = parseDate(value);
            if (!d)
                return false;
            return filterValue.includes(d.getFullYear());
        }
        case 'dateWeekNumber': {
            const d = parseDate(value);
            if (!d)
                return false;
            return filterValue.includes(getISOWeekNumber(d));
        }
        default:
            return true;
    }
}
// --- Expression evaluator ---
/**
 * Evaluate a FilterExpression tree against a single row.
 */
export function evaluateFilterExpression(row, expr) {
    switch (expr.logic) {
        case 'and': {
            if (expr.conditions.length === 0)
                return true;
            return expr.conditions.every((cond) => isFilterAtom(cond) ? evaluateAtom(row, cond) : evaluateFilterExpression(row, cond));
        }
        case 'or': {
            if (expr.conditions.length === 0)
                return false;
            return expr.conditions.some((cond) => isFilterAtom(cond) ? evaluateAtom(row, cond) : evaluateFilterExpression(row, cond));
        }
        case 'not': {
            // NOT applies to the first condition
            const first = expr.conditions[0];
            if (!first)
                return true;
            const result = isFilterAtom(first)
                ? evaluateAtom(row, first)
                : evaluateFilterExpression(row, first);
            return !result;
        }
        default:
            return true;
    }
}
// --- Backward compatibility ---
/**
 * Convert legacy flat filter array to a FilterExpression (AND of atoms).
 */
export function normalizeFiltersToExpression(filters) {
    return {
        logic: 'and',
        conditions: filters.map((f) => ({
            field: f.field,
            operator: f.operator,
            value: f.value,
        })),
    };
}
// --- filterRows with expression support ---
/**
 * Filter rows using a FilterExpression AST.
 * Supports valueGetter from column definitions.
 */
export function filterRowsWithExpression(model, expr, columns) {
    if (expr.conditions.length === 0 && expr.logic === 'and') {
        return {
            ...model,
            filteredRowIds: new Set(model.rows.map((r) => r.__id)),
        };
    }
    const filteredRows = [];
    const filteredRowIds = new Set();
    for (const row of model.rows) {
        if (evaluateFilterExpression(row, expr)) {
            filteredRows.push(row);
            filteredRowIds.add(row.__id);
        }
    }
    return {
        rows: filteredRows,
        rowsById: model.rowsById,
        flatRows: filteredRows,
        rowCount: filteredRows.length,
        filteredRowIds,
    };
}
//# sourceMappingURL=filter-expression.js.map