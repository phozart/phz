/**
 * @phozart/phz-viewer — Filter Bar State
 *
 * Headless state for the filter bar with value handling.
 * Manages active filters, presets, and value-handling configuration.
 */
// ========================================================================
// Factory
// ========================================================================
export function createFilterBarState(overrides) {
    return {
        filters: overrides?.filters ?? [],
        activeFilterId: overrides?.activeFilterId ?? null,
        presets: overrides?.presets ?? [],
        activePresetId: overrides?.activePresetId ?? null,
        valueHandling: overrides?.valueHandling ?? {},
        currentValues: overrides?.currentValues ?? {},
        collapsed: overrides?.collapsed ?? false,
        loadingPresets: overrides?.loadingPresets ?? false,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Set filter definitions for the current dashboard/report.
 */
export function setFilterDefs(state, filters) {
    return { ...state, filters };
}
/**
 * Set value handling configs for filters.
 */
export function setValueHandling(state, valueHandling) {
    return { ...state, valueHandling };
}
/**
 * Open the filter popover for a specific filter.
 */
export function openFilter(state, filterId) {
    return { ...state, activeFilterId: filterId };
}
/**
 * Close the filter popover.
 */
export function closeFilter(state) {
    return { ...state, activeFilterId: null };
}
/**
 * Set a filter value.
 */
export function setFilterValue(state, filterValue) {
    return {
        ...state,
        currentValues: {
            ...state.currentValues,
            [filterValue.filterId]: filterValue,
        },
        // Clear active preset since user is making manual changes
        activePresetId: null,
    };
}
/**
 * Clear a specific filter value.
 */
export function clearFilterValue(state, filterId) {
    const currentValues = { ...state.currentValues };
    delete currentValues[filterId];
    return { ...state, currentValues, activePresetId: null };
}
/**
 * Clear all filter values.
 */
export function clearAllFilters(state) {
    return { ...state, currentValues: {}, activePresetId: null };
}
/**
 * Set available presets.
 */
export function setPresets(state, presets) {
    return { ...state, presets, loadingPresets: false };
}
/**
 * Apply a preset by ID.
 */
export function applyPreset(state, presetId, presetValues) {
    const currentValues = {};
    for (const pv of presetValues) {
        currentValues[pv.filterId] = {
            filterId: pv.filterId,
            field: pv.field,
            operator: pv.operator,
            value: pv.value,
            label: pv.label ?? `${pv.field}: ${pv.value}`,
        };
    }
    return {
        ...state,
        currentValues,
        activePresetId: presetId,
    };
}
/**
 * Toggle the collapsed state of the filter bar.
 */
export function toggleFilterBarCollapsed(state) {
    return { ...state, collapsed: !state.collapsed };
}
/**
 * Get the count of active (non-empty) filters.
 */
export function getActiveFilterCount(state) {
    return Object.keys(state.currentValues).length;
}
/**
 * Check whether a specific filter has a value set.
 */
export function hasFilterValue(state, filterId) {
    return filterId in state.currentValues;
}
//# sourceMappingURL=filter-bar-state.js.map