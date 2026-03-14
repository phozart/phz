/**
 * @phozart/engine — Hierarchy Definitions
 *
 * Defines within-visualization drill-down hierarchies.
 * A hierarchy is an ordered sequence of levels that a user can navigate
 * through (e.g., Year → Quarter → Month → Week → Day for dates).
 *
 * Pure functions only — no side effects, no DOM.
 */
export interface HierarchyLevel {
    field: string;
    label: string;
    formatFn?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface HierarchyDefinition {
    id: string;
    name: string;
    levels: HierarchyLevel[];
    sourceId?: string;
}
/**
 * Generate a date hierarchy with exactly 5 levels:
 * Year → Quarter → Month → Week → Day.
 *
 * Field names are derived from the date field (e.g., `orderDate_year`).
 */
export declare function generateDateHierarchy(dateField: string): HierarchyDefinition;
/**
 * Create a custom hierarchy from an ordered list of field names.
 * Labels default to the field names.
 */
export declare function createCustomHierarchy(name: string, fields: string[]): HierarchyDefinition;
/**
 * Validate a hierarchy definition.
 * Checks: at least 2 levels, no duplicate field names.
 */
export declare function validateHierarchy(hierarchy: HierarchyDefinition): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=hierarchy.d.ts.map