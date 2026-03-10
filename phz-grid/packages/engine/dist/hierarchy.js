/**
 * @phozart/phz-engine — Hierarchy Definitions
 *
 * Defines within-visualization drill-down hierarchies.
 * A hierarchy is an ordered sequence of levels that a user can navigate
 * through (e.g., Year → Quarter → Month → Week → Day for dates).
 *
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// ID Generation
// ========================================================================
let _counter = 0;
function nextId(prefix) {
    return `${prefix}-${Date.now()}-${++_counter}`;
}
// ========================================================================
// Date Hierarchy Factory
// ========================================================================
const DATE_LEVELS = [
    { suffix: 'year', label: 'Year' },
    { suffix: 'quarter', label: 'Quarter' },
    { suffix: 'month', label: 'Month' },
    { suffix: 'week', label: 'Week' },
    { suffix: 'day', label: 'Day' },
];
/**
 * Generate a date hierarchy with exactly 5 levels:
 * Year → Quarter → Month → Week → Day.
 *
 * Field names are derived from the date field (e.g., `orderDate_year`).
 */
export function generateDateHierarchy(dateField) {
    const levels = DATE_LEVELS.map(({ suffix, label }) => ({
        field: `${dateField}_${suffix}`,
        label,
        sortOrder: 'asc',
    }));
    return {
        id: nextId('date-hierarchy'),
        name: `${dateField} Date Hierarchy`,
        levels,
        sourceId: dateField,
    };
}
// ========================================================================
// Custom Hierarchy Factory
// ========================================================================
/**
 * Create a custom hierarchy from an ordered list of field names.
 * Labels default to the field names.
 */
export function createCustomHierarchy(name, fields) {
    const levels = fields.map(field => ({
        field,
        label: field,
    }));
    return {
        id: nextId('hierarchy'),
        name,
        levels,
    };
}
// ========================================================================
// Validation
// ========================================================================
/**
 * Validate a hierarchy definition.
 * Checks: at least 2 levels, no duplicate field names.
 */
export function validateHierarchy(hierarchy) {
    const errors = [];
    if (hierarchy.levels.length < 2) {
        errors.push(`Hierarchy must have at least 2 levels (found ${hierarchy.levels.length})`);
    }
    const seen = new Set();
    for (const level of hierarchy.levels) {
        if (seen.has(level.field)) {
            errors.push(`Duplicate field "${level.field}" in hierarchy levels`);
        }
        seen.add(level.field);
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=hierarchy.js.map