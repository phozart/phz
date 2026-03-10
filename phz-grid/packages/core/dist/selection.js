/**
 * @phozart/phz-core — Selection Context Serialization
 *
 * URL-safe serialization, merge, and validation for SelectionContext.
 */
/**
 * Serialize a SelectionContext to URLSearchParams.
 * Arrays are joined with commas.
 */
export function serializeSelection(ctx) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(ctx)) {
        if (value === null || value === undefined)
            continue;
        if (Array.isArray(value)) {
            if (value.length > 0) {
                params.set(key, value.join(','));
            }
        }
        else {
            params.set(key, value);
        }
    }
    return params;
}
/**
 * Deserialize URLSearchParams back to a SelectionContext.
 * Multi-select fields are split on commas.
 */
export function deserializeSelection(params, fields) {
    const ctx = {};
    const fieldMap = new Map(fields.map(f => [f.id, f]));
    for (const [key, value] of params.entries()) {
        const fieldDef = fieldMap.get(key);
        if (!fieldDef)
            continue;
        if (fieldDef.type === 'multi_select' || fieldDef.type === 'chip_group') {
            ctx[key] = value.split(',').filter(v => v.length > 0);
        }
        else {
            ctx[key] = value;
        }
    }
    // Apply defaults for missing fields
    for (const field of fields) {
        if (!(field.id in ctx) && field.defaultValue !== undefined) {
            ctx[field.id] = field.defaultValue;
        }
    }
    return ctx;
}
/**
 * Merge a base SelectionContext with overrides.
 * Null values in overrides remove keys.
 */
export function mergeSelection(base, overrides) {
    const result = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (value === null) {
            delete result[key];
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Validate a SelectionContext against field definitions.
 */
export function validateSelection(ctx, fields) {
    const errors = [];
    for (const field of fields) {
        const value = ctx[field.id];
        // Check required (locked fields must have a value)
        if (field.locked && (value === null || value === undefined)) {
            errors.push({ field: field.id, message: `Field "${field.label}" is required` });
            continue;
        }
        if (value === null || value === undefined)
            continue;
        // Check type compatibility
        if (field.type === 'single_select' || field.type === 'period_picker' || field.type === 'text') {
            if (Array.isArray(value)) {
                errors.push({ field: field.id, message: `Field "${field.label}" expects a single value` });
            }
        }
        if (field.type === 'multi_select' || field.type === 'chip_group') {
            if (!Array.isArray(value)) {
                errors.push({ field: field.id, message: `Field "${field.label}" expects an array value` });
            }
        }
        // Check against options if defined
        if (field.options && field.options.length > 0) {
            const validValues = new Set(field.options.map(o => o.value));
            const values = Array.isArray(value) ? value : [value];
            for (const v of values) {
                if (!validValues.has(v)) {
                    errors.push({ field: field.id, message: `Invalid value "${v}" for field "${field.label}"` });
                }
            }
        }
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=selection.js.map