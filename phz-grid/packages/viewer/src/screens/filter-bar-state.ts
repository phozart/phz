/**
 * @phozart/viewer — Filter Bar State
 *
 * Headless state for the filter bar with value handling.
 * Manages active filters, presets, and value-handling configuration.
 */

import type { FilterValueHandling, FilterPresetValue } from '@phozart/shared/types';
import type { DashboardFilterDef, FilterValue } from '@phozart/shared/coordination';

// ========================================================================
// FilterBarState
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createFilterBarState(
  overrides?: Partial<FilterBarState>,
): FilterBarState {
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
export function setFilterDefs(
  state: FilterBarState,
  filters: DashboardFilterDef[],
): FilterBarState {
  return { ...state, filters };
}

/**
 * Set value handling configs for filters.
 */
export function setValueHandling(
  state: FilterBarState,
  valueHandling: Record<string, FilterValueHandling>,
): FilterBarState {
  return { ...state, valueHandling };
}

/**
 * Open the filter popover for a specific filter.
 */
export function openFilter(
  state: FilterBarState,
  filterId: string,
): FilterBarState {
  return { ...state, activeFilterId: filterId };
}

/**
 * Close the filter popover.
 */
export function closeFilter(state: FilterBarState): FilterBarState {
  return { ...state, activeFilterId: null };
}

/**
 * Set a filter value.
 */
export function setFilterValue(
  state: FilterBarState,
  filterValue: FilterValue,
): FilterBarState {
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
export function clearFilterValue(
  state: FilterBarState,
  filterId: string,
): FilterBarState {
  const currentValues = { ...state.currentValues };
  delete currentValues[filterId];
  return { ...state, currentValues, activePresetId: null };
}

/**
 * Clear all filter values.
 */
export function clearAllFilters(state: FilterBarState): FilterBarState {
  return { ...state, currentValues: {}, activePresetId: null };
}

/**
 * Set available presets.
 */
export function setPresets(
  state: FilterBarState,
  presets: FilterPresetValue[],
): FilterBarState {
  return { ...state, presets, loadingPresets: false };
}

/**
 * Apply a preset by ID.
 */
export function applyPreset(
  state: FilterBarState,
  presetId: string,
  presetValues: FilterPresetValue[],
): FilterBarState {
  const currentValues: Record<string, FilterValue> = {};

  for (const pv of presetValues) {
    currentValues[pv.filterId] = {
      filterId: pv.filterId,
      field: pv.field,
      operator: pv.operator as FilterValue['operator'],
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
export function toggleFilterBarCollapsed(state: FilterBarState): FilterBarState {
  return { ...state, collapsed: !state.collapsed };
}

/**
 * Get the count of active (non-empty) filters.
 */
export function getActiveFilterCount(state: FilterBarState): number {
  return Object.keys(state.currentValues).length;
}

/**
 * Check whether a specific filter has a value set.
 */
export function hasFilterValue(state: FilterBarState, filterId: string): boolean {
  return filterId in state.currentValues;
}
