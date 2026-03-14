/**
 * @phozart/shared — FilterValueHandling (A-1.10)
 *
 * Defines how filter values are sourced, transformed, defaulted,
 * and handled across the lifecycle of a filter interaction.
 */
// ========================================================================
// Factory: createDefaultFilterValueHandling
// ========================================================================
/**
 * Create a FilterValueHandling with sensible defaults.
 * Returns a single-select, non-required configuration with
 * static empty values, search debounce of 300ms, and no
 * free-text entry.
 */
export function createDefaultFilterValueHandling(overrides) {
    return {
        source: overrides?.source ?? { type: 'static', values: [] },
        transform: overrides?.transform,
        defaultValue: overrides?.defaultValue,
        required: overrides?.required ?? false,
        multi: overrides?.multi ?? false,
        maxSelections: overrides?.maxSelections ?? 0,
        allowFreeText: overrides?.allowFreeText ?? false,
        placeholder: overrides?.placeholder,
        excludeNulls: overrides?.excludeNulls ?? true,
        showCounts: overrides?.showCounts ?? false,
        searchDebounceMs: overrides?.searchDebounceMs ?? 300,
    };
}
// ========================================================================
// Utility: resolveStaticDefault
// ========================================================================
export function resolveStaticDefault(def) {
    if (def.type === 'static')
        return def.value;
    return undefined;
}
//# sourceMappingURL=filter-value-handling.js.map