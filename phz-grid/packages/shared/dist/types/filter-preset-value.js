/**
 * @phozart/phz-shared — FilterPresetValue (A-1.08)
 *
 * Saved filter presets that users can apply to dashboards/reports.
 * Each FilterPresetValue captures a single filter's state (field,
 * operator, value) within a named preset.
 */
// ========================================================================
// Factory: createDefaultFilterPresetValue
// ========================================================================
/**
 * Create a default FilterPresetValue with sensible defaults.
 * The returned value uses 'equals' as the default operator and
 * null as the default value, representing an unset filter.
 */
export function createDefaultFilterPresetValue(filterId, field, overrides) {
    return {
        filterId,
        field,
        operator: overrides?.operator ?? 'equals',
        value: overrides?.value ?? null,
        label: overrides?.label,
    };
}
// ========================================================================
// Factory: createFilterPreset
// ========================================================================
export function createFilterPreset(input) {
    const now = Date.now();
    return {
        id: `fp_${now}_${Math.random().toString(36).slice(2, 8)}`,
        name: input.name,
        description: input.description,
        values: [...input.values],
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
    };
}
//# sourceMappingURL=filter-preset-value.js.map