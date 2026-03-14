/**
 * @phozart/core — Immutable Utility Functions
 */
export function immutableUpdate(obj, updates) {
    return { ...obj, ...updates };
}
export function immutableArrayUpdate(arr, index, update) {
    const result = [...arr];
    result[index] = { ...result[index], ...update };
    return result;
}
export function immutableArrayInsert(arr, index, item) {
    const result = [...arr];
    result.splice(index, 0, item);
    return result;
}
export function immutableArrayRemove(arr, index) {
    const result = [...arr];
    result.splice(index, 1);
    return result;
}
export function immutableMapUpdate(map, key, value) {
    const result = new Map(map);
    result.set(key, value);
    return result;
}
export function immutableMapDelete(map, key) {
    const result = new Map(map);
    result.delete(key);
    return result;
}
export function immutableSetAdd(set, item) {
    const result = new Set(set);
    result.add(item);
    return result;
}
export function immutableSetDelete(set, item) {
    const result = new Set(set);
    result.delete(item);
    return result;
}
let idCounter = 0;
export function generateRowId() {
    return `row-${++idCounter}-${Date.now().toString(36)}`;
}
export function serializeCellPosition(pos) {
    return `${pos.rowId}:${pos.field}`;
}
export function deserializeCellPosition(key) {
    const separatorIndex = key.indexOf(':');
    return {
        rowId: key.slice(0, separatorIndex),
        field: key.slice(separatorIndex + 1),
    };
}
export function resolveLabelTemplate(template, row) {
    return template.replace(/\{(\w+)\}/g, (_match, field) => {
        const val = row[field];
        return val != null ? String(val) : '';
    });
}
export function buildTreeFromSource(rows, levels) {
    if (levels.length === 0 || rows.length === 0)
        return [];
    const level = levels[0];
    const remaining = levels.slice(1);
    const groups = new Map();
    for (const row of rows) {
        const raw = row[level.field];
        if (raw == null || raw === '')
            continue;
        const key = String(raw);
        let group = groups.get(key);
        if (!group) {
            group = [];
            groups.set(key, group);
        }
        group.push(row);
    }
    const nodes = [];
    for (const [key, groupRows] of groups) {
        const label = level.labelTemplate
            ? resolveLabelTemplate(level.labelTemplate, groupRows[0])
            : key;
        const node = { value: key, label };
        if (remaining.length > 0) {
            node.children = buildTreeFromSource(groupRows, remaining);
        }
        nodes.push(node);
    }
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    return nodes;
}
//# sourceMappingURL=utils.js.map