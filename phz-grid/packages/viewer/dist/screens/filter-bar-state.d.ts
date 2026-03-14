/**
 * @phozart/viewer — Filter Bar State
 *
 * Headless state for the filter bar with value handling.
 * Manages active filters, presets, and value-handling configuration.
 */
import type { FilterValueHandling, FilterPresetValue } from '@phozart/shared/types';
import type { DashboardFilterDef, FilterValue } from '@phozart/shared/coordination';
export interface FilterBarState {
    /** Dashboard filter definitions. */
    filters: DashboardFilterDef[];
    /** ID of the filter currently being edited (popover open). */
    activeFilterId: string | null;
    /** Available presets for the current dashboard/report. */
    presets: FilterPresetValue[];
    /** ID of the currently applied preset (null if custom). */
    activePresetId: string | null;
    /** Per-filter value handling configuration. */
    valueHandling: Record<string, FilterValueHandling>;
    /** Current filter values (mirrors FilterContextManager). */
    currentValues: Record<string, FilterValue>;
    /** Whether the filter bar is collapsed (mobile). */
    collapsed: boolean;
    /** Whether presets are loading. */
    loadingPresets: boolean;
}
export declare function createFilterBarState(overrides?: Partial<FilterBarState>): FilterBarState;
/**
 * Set filter definitions for the current dashboard/report.
 */
export declare function setFilterDefs(state: FilterBarState, filters: DashboardFilterDef[]): FilterBarState;
/**
 * Set value handling configs for filters.
 */
export declare function setValueHandling(state: FilterBarState, valueHandling: Record<string, FilterValueHandling>): FilterBarState;
/**
 * Open the filter popover for a specific filter.
 */
export declare function openFilter(state: FilterBarState, filterId: string): FilterBarState;
/**
 * Close the filter popover.
 */
export declare function closeFilter(state: FilterBarState): FilterBarState;
/**
 * Set a filter value.
 */
export declare function setFilterValue(state: FilterBarState, filterValue: FilterValue): FilterBarState;
/**
 * Clear a specific filter value.
 */
export declare function clearFilterValue(state: FilterBarState, filterId: string): FilterBarState;
/**
 * Clear all filter values.
 */
export declare function clearAllFilters(state: FilterBarState): FilterBarState;
/**
 * Set available presets.
 */
export declare function setPresets(state: FilterBarState, presets: FilterPresetValue[]): FilterBarState;
/**
 * Apply a preset by ID.
 */
export declare function applyPreset(state: FilterBarState, presetId: string, presetValues: FilterPresetValue[]): FilterBarState;
/**
 * Toggle the collapsed state of the filter bar.
 */
export declare function toggleFilterBarCollapsed(state: FilterBarState): FilterBarState;
/**
 * Get the count of active (non-empty) filters.
 */
export declare function getActiveFilterCount(state: FilterBarState): number;
/**
 * Check whether a specific filter has a value set.
 */
export declare function hasFilterValue(state: FilterBarState, filterId: string): boolean;
//# sourceMappingURL=filter-bar-state.d.ts.map