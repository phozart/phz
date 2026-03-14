/**
 * @phozart/core — Row Model Pipeline
 *
 * Implements the data processing pipeline:
 *   Raw Data → Parse → Filter → Sort → Group → Flatten → Virtualize
 *
 * Each stage caches its result and only recomputes when invalidated.
 */
import { generateRowId } from './utils.js';
// --- Parse Stage ---
export function parseData(rawData, rowIdField) {
    return rawData.map((item, index) => {
        const row = item;
        const id = rowIdField && row[rowIdField] != null
            ? row[rowIdField]
            : generateRowId();
        return { ...row, __id: id };
    });
}
export function buildRowMap(rows) {
    const map = new Map();
    for (const row of rows) {
        map.set(row.__id, row);
    }
    return map;
}
export function buildCoreRowModel(rows) {
    return {
        rows,
        rowsById: buildRowMap(rows),
        flatRows: rows,
        rowCount: rows.length,
    };
}
// --- Date helpers ---
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
// --- Filter Stage ---
function evaluateFilter(value, operator, filterValue) {
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
export function filterRows(model, filterState, columns) {
    if (filterState.filters.length === 0) {
        return {
            ...model,
            filteredRowIds: new Set(model.rows.map((r) => r.__id)),
        };
    }
    const filteredRows = [];
    const filteredRowIds = new Set();
    const colMap = new Map(columns.map(c => [c.field, c]));
    for (const row of model.rows) {
        let matches = true;
        for (const filter of filterState.filters) {
            const column = colMap.get(filter.field);
            const value = column?.valueGetter
                ? column.valueGetter(row)
                : row[filter.field];
            if (!evaluateFilter(value, filter.operator, filter.value)) {
                matches = false;
                break;
            }
        }
        if (matches) {
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
// --- Sort Stage ---
function defaultComparator(a, b) {
    if (a == null && b == null)
        return 0;
    if (a == null)
        return -1;
    if (b == null)
        return 1;
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() - b.getTime();
    }
    return String(a).localeCompare(String(b));
}
export function sortRows(model, sortState, columns) {
    if (sortState.columns.length === 0) {
        return {
            ...model,
            sortedRowIds: model.rows.map((r) => r.__id),
        };
    }
    const colMap = new Map(columns.map(c => [c.field, c]));
    const sorted = [...model.rows].sort((rowA, rowB) => {
        for (const sortCol of sortState.columns) {
            const column = colMap.get(sortCol.field);
            const comparator = column?.sortComparator ?? defaultComparator;
            const valueA = column?.valueGetter ? column.valueGetter(rowA) : rowA[sortCol.field];
            const valueB = column?.valueGetter ? column.valueGetter(rowB) : rowB[sortCol.field];
            const result = comparator(valueA, valueB);
            if (result !== 0) {
                return sortCol.direction === 'asc' ? result : -result;
            }
        }
        return 0;
    });
    return {
        rows: sorted,
        rowsById: model.rowsById,
        flatRows: sorted,
        rowCount: sorted.length,
        sortedRowIds: sorted.map((r) => r.__id),
    };
}
// --- Group Stage ---
export function groupRows(model, groupingState) {
    if (groupingState.groupBy.length === 0) {
        return { ...model, groups: [] };
    }
    const groups = buildGroups(model.rows, groupingState.groupBy, 0, groupingState.expandedGroups);
    return { ...model, groups };
}
function buildGroups(rows, fields, depth, expandedGroups) {
    if (depth >= fields.length)
        return [];
    const field = fields[depth];
    const groupMap = new Map();
    for (const row of rows) {
        const value = row[field];
        const key = String(value ?? '(empty)');
        let group = groupMap.get(key);
        if (!group) {
            group = [];
            groupMap.set(key, group);
        }
        group.push(row);
    }
    const groups = [];
    for (const [key, groupRows] of groupMap) {
        const groupKey = `${field}:${key}`;
        groups.push({
            key: groupKey,
            field,
            value: key,
            rows: groupRows,
            subGroups: depth + 1 < fields.length
                ? buildGroups(groupRows, fields, depth + 1, expandedGroups)
                : undefined,
            depth,
            isExpanded: expandedGroups.has(groupKey),
        });
    }
    return groups;
}
// --- Flatten Stage ---
export function flattenRows(model) {
    if (model.groups.length === 0) {
        return { ...model, flatRows: model.rows };
    }
    const flat = [];
    flattenGroupsRecursive(model.groups, flat);
    return {
        rows: model.rows,
        rowsById: model.rowsById,
        flatRows: flat,
        rowCount: flat.length,
    };
}
function flattenGroupsRecursive(groups, result) {
    for (const group of groups) {
        if (!group.isExpanded)
            continue;
        if (group.subGroups && group.subGroups.length > 0) {
            flattenGroupsRecursive(group.subGroups, result);
        }
        else {
            result.push(...group.rows);
        }
    }
}
// --- Virtualize Stage ---
export function virtualizeRows(model, virtualization, scrollTop, viewportHeight) {
    if (!virtualization.enabled) {
        return {
            ...model,
            visibleRows: model.flatRows,
            startIndex: 0,
            endIndex: model.flatRows.length - 1,
            totalHeight: model.flatRows.length * virtualization.estimatedRowHeight,
            offsetTop: 0,
        };
    }
    const rowHeight = virtualization.estimatedRowHeight;
    const overscan = virtualization.overscan;
    const totalHeight = model.flatRows.length * rowHeight;
    const rawStartIndex = Math.floor(scrollTop / rowHeight);
    const startIndex = Math.max(0, rawStartIndex - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const rawEndIndex = rawStartIndex + visibleCount;
    const endIndex = Math.min(model.flatRows.length - 1, rawEndIndex + overscan);
    const visibleRows = model.flatRows.slice(startIndex, endIndex + 1);
    const offsetTop = startIndex * rowHeight;
    return {
        rows: model.rows,
        rowsById: model.rowsById,
        flatRows: model.flatRows,
        rowCount: model.flatRows.length,
        visibleRows,
        startIndex,
        endIndex,
        totalHeight,
        offsetTop,
    };
}
//# sourceMappingURL=row-model.js.map