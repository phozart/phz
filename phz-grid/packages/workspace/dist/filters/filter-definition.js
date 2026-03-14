/**
 * @phozart/workspace — FilterDefinition (U.1)
 *
 * Centrally managed filter definitions as catalog artifacts.
 * Each FilterDefinition describes a reusable filter: its value source,
 * how it binds to data sources, optional security restrictions,
 * dependencies on other filters, and default values.
 */
// ========================================================================
// Validation constants
// ========================================================================
const VALID_FILTER_TYPES = new Set([
    'select', 'multi-select', 'range', 'date-range', 'text', 'boolean',
]);
const VALID_VALUE_SOURCE_TYPES = new Set([
    'data-source', 'lookup-table', 'static',
]);
// ========================================================================
// Type guard
// ========================================================================
export function isFilterDefinition(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.id === 'string' &&
        typeof o.label === 'string' &&
        typeof o.filterType === 'string' &&
        VALID_FILTER_TYPES.has(o.filterType) &&
        o.valueSource != null && typeof o.valueSource === 'object' &&
        VALID_VALUE_SOURCE_TYPES.has(o.valueSource.type) &&
        Array.isArray(o.bindings));
}
// ========================================================================
// Factory
// ========================================================================
let counter = 0;
function generateId() {
    return `fd_${Date.now()}_${++counter}`;
}
export function createFilterDefinition(input) {
    return {
        id: input.id ?? generateId(),
        label: input.label,
        description: input.description,
        filterType: input.filterType,
        valueSource: input.valueSource,
        bindings: [...input.bindings],
        securityBinding: input.securityBinding,
        dependsOn: input.dependsOn ? [...input.dependsOn] : undefined,
        defaultValue: input.defaultValue,
        required: input.required ?? false,
    };
}
export function validateFilterDefinition(fd) {
    const errors = [];
    if (!fd.label?.trim()) {
        errors.push('label is required');
    }
    if (!VALID_FILTER_TYPES.has(fd.filterType)) {
        errors.push(`invalid filterType: ${fd.filterType}`);
    }
    const vs = fd.valueSource;
    if (vs) {
        switch (vs.type) {
            case 'data-source':
                if (!vs.field?.trim()) {
                    errors.push('data-source valueSource requires a non-empty field');
                }
                if (!vs.dataSourceId?.trim()) {
                    errors.push('data-source valueSource requires a non-empty dataSourceId');
                }
                break;
            case 'lookup-table':
                if (!vs.entries?.length) {
                    errors.push('lookup-table valueSource requires at least one entry');
                }
                break;
            case 'static':
                // Empty static values are allowed (edge case)
                break;
        }
    }
    return { valid: errors.length === 0, errors };
}
// ========================================================================
// Binding resolution
// ========================================================================
export function resolveBindingsForSource(bindings, dataSourceId) {
    return bindings.filter(b => b.dataSourceId === dataSourceId);
}
// ========================================================================
// Security binding evaluation
// ========================================================================
export function evaluateSecurityBinding(binding, viewer, allValues) {
    if (!viewer?.attributes)
        return allValues;
    const attr = viewer.attributes[binding.viewerAttribute];
    if (attr === undefined || attr === null)
        return allValues;
    switch (binding.restrictionType) {
        case 'include-only': {
            const allowed = Array.isArray(attr) ? new Set(attr) : new Set([attr]);
            return allValues.filter(v => allowed.has(v));
        }
        case 'exclude': {
            const excluded = Array.isArray(attr) ? new Set(attr) : new Set([attr]);
            return allValues.filter(v => !excluded.has(v));
        }
        case 'max-value': {
            const maxVal = typeof attr === 'number' ? attr : Number(attr);
            if (isNaN(maxVal))
                return allValues;
            return allValues.filter(v => {
                const num = typeof v === 'number' ? v : Number(v);
                return !isNaN(num) && num <= maxVal;
            });
        }
        default:
            return allValues;
    }
}
// ========================================================================
// Default resolution
// ========================================================================
export function resolveFilterDefault(def, viewer) {
    switch (def.type) {
        case 'static':
            return def.value;
        case 'viewer-attribute': {
            return viewer?.attributes?.[def.attribute];
        }
        case 'relative-date': {
            const now = new Date();
            const ms = toMilliseconds(def.offset, def.unit);
            return new Date(now.getTime() + ms);
        }
        case 'expression':
            // Expression defaults are passed through as strings for the
            // data layer to evaluate (e.g. SQL expressions).
            return def.expr;
        default:
            return undefined;
    }
}
function toMilliseconds(offset, unit) {
    const DAY_MS = 86_400_000;
    switch (unit) {
        case 'days': return offset * DAY_MS;
        case 'weeks': return offset * 7 * DAY_MS;
        case 'months': return offset * 30 * DAY_MS; // approximate
        case 'years': return offset * 365 * DAY_MS; // approximate
        default: return 0;
    }
}
//# sourceMappingURL=filter-definition.js.map