/**
 * @phozart/phz-shared — FilterValueHandling (A-1.10)
 *
 * Defines how filter values are sourced, transformed, defaulted,
 * and handled across the lifecycle of a filter interaction.
 */
export type FilterValueSource = {
    type: 'data-source';
    dataSourceId: string;
    field: string;
    sort?: 'asc' | 'desc';
    limit?: number;
} | {
    type: 'lookup-table';
    entries: Array<{
        value: string;
        label: string;
    }>;
} | {
    type: 'static';
    values: string[];
};
export type FilterValueTransform = {
    type: 'lookup';
    lookupSourceId: string;
    keyField: string;
    valueField: string;
} | {
    type: 'expression';
    expr: string;
} | {
    type: 'granularity-shift';
    from: string;
    to: string;
};
export type FilterDefault = {
    type: 'static';
    value: unknown;
} | {
    type: 'relative-date';
    offset: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
} | {
    type: 'viewer-attribute';
    attribute: string;
} | {
    type: 'expression';
    expr: string;
};
/**
 * Comprehensive configuration for how a filter's values are sourced,
 * transformed, defaulted, validated, and displayed. Used by filter
 * definitions to describe the full value lifecycle.
 */
export interface FilterValueHandling {
    /** Where filter values come from. */
    source: FilterValueSource;
    /** Optional transformation applied to values before use. */
    transform?: FilterValueTransform;
    /** Default value configuration. */
    defaultValue?: FilterDefault;
    /** Whether the filter must have a value set. */
    required: boolean;
    /** Whether multiple values can be selected. */
    multi: boolean;
    /** Maximum number of values a user can select (0 = unlimited). */
    maxSelections: number;
    /** Whether to allow free-text entry in addition to predefined values. */
    allowFreeText: boolean;
    /** Placeholder text shown when no value is selected. */
    placeholder?: string;
    /** Whether null/empty values should be excluded from the value list. */
    excludeNulls: boolean;
    /** Whether to show a count of matching records next to each value. */
    showCounts: boolean;
    /** Debounce delay in ms for search-based value loading. */
    searchDebounceMs: number;
}
/**
 * Create a FilterValueHandling with sensible defaults.
 * Returns a single-select, non-required configuration with
 * static empty values, search debounce of 300ms, and no
 * free-text entry.
 */
export declare function createDefaultFilterValueHandling(overrides?: Partial<FilterValueHandling>): FilterValueHandling;
export declare function resolveStaticDefault(def: FilterDefault): unknown | undefined;
//# sourceMappingURL=filter-value-handling.d.ts.map