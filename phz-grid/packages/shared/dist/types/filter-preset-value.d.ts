/**
 * @phozart/phz-shared — FilterPresetValue (A-1.08)
 *
 * Saved filter presets that users can apply to dashboards/reports.
 * Each FilterPresetValue captures a single filter's state (field,
 * operator, value) within a named preset.
 */
export interface FilterPresetValue {
    /** ID of the filter definition this value belongs to. */
    filterId: string;
    /** Field name being filtered. */
    field: string;
    /** Filter operator (equals, contains, between, etc.). */
    operator: string;
    /** The filter value (type depends on operator and field dataType). */
    value: unknown;
    /** Optional display label for the value (for user-facing display). */
    label?: string;
}
export interface FilterPreset {
    id: string;
    name: string;
    description?: string;
    values: FilterPresetValue[];
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    isDefault?: boolean;
}
/**
 * Create a default FilterPresetValue with sensible defaults.
 * The returned value uses 'equals' as the default operator and
 * null as the default value, representing an unset filter.
 */
export declare function createDefaultFilterPresetValue(filterId: string, field: string, overrides?: Partial<Omit<FilterPresetValue, 'filterId' | 'field'>>): FilterPresetValue;
export declare function createFilterPreset(input: {
    name: string;
    values: FilterPresetValue[];
    createdBy: string;
    description?: string;
}): FilterPreset;
//# sourceMappingURL=filter-preset-value.d.ts.map