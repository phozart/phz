/**
 * @phozart/phz-editor — Measure Palette State (B-2.07)
 *
 * State machine for the measure registry palette. Authors browse
 * and search measures and KPIs from the registry, then drag them
 * onto dashboard widgets or report columns.
 */

import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';

// ========================================================================
// MeasurePaletteState
// ========================================================================

export interface MeasurePaletteState {
  /** All available measures. */
  measures: MeasureDefinition[];
  /** All available KPIs. */
  kpis: KPIDefinition[];
  /** Current search query. */
  searchQuery: string;
  /** Selected category filter (from measure tags). */
  selectedCategory: string | null;
  /** All unique categories derived from measure/KPI tags. */
  categories: string[];
  /** Filtered measures after search + category. */
  filteredMeasures: MeasureDefinition[];
  /** Filtered KPIs after search + category. */
  filteredKPIs: KPIDefinition[];
  /** Active tab: measures or KPIs. */
  activeTab: 'measures' | 'kpis';
  /** Currently selected item (for detail panel). */
  selectedItemId: string | null;
  /** Selected item type. */
  selectedItemType: 'measure' | 'kpi' | null;
}

// ========================================================================
// Internal: extract unique categories from tags
// ========================================================================

function extractCategories(
  measures: MeasureDefinition[],
  kpis: KPIDefinition[],
): string[] {
  const tagSet = new Set<string>();
  for (const m of measures) {
    for (const tag of m.tags ?? []) tagSet.add(tag);
  }
  for (const k of kpis) {
    for (const tag of k.tags ?? []) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}

// ========================================================================
// Internal: apply filtering
// ========================================================================

function filterMeasures(
  measures: MeasureDefinition[],
  searchQuery: string,
  category: string | null,
): MeasureDefinition[] {
  let result = measures;

  if (category) {
    result = result.filter(m => m.tags?.includes(category));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false) ||
        m.expression.toLowerCase().includes(q),
    );
  }

  return result;
}

function filterKPIs(
  kpis: KPIDefinition[],
  searchQuery: string,
  category: string | null,
): KPIDefinition[] {
  let result = kpis;

  if (category) {
    result = result.filter(k => k.tags?.includes(category));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      k =>
        k.name.toLowerCase().includes(q) ||
        (k.description?.toLowerCase().includes(q) ?? false),
    );
  }

  return result;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a new MeasurePaletteState from measures and KPIs.
 */
export function createMeasurePaletteState(
  measures: MeasureDefinition[],
  kpis: KPIDefinition[],
): MeasurePaletteState {
  return {
    measures,
    kpis,
    searchQuery: '',
    selectedCategory: null,
    categories: extractCategories(measures, kpis),
    filteredMeasures: measures,
    filteredKPIs: kpis,
    activeTab: 'measures',
    selectedItemId: null,
    selectedItemType: null,
  };
}

// ========================================================================
// Search
// ========================================================================

/**
 * Update the search query and re-filter both measures and KPIs.
 */
export function searchMeasures(
  state: MeasurePaletteState,
  query: string,
): MeasurePaletteState {
  return {
    ...state,
    searchQuery: query,
    filteredMeasures: filterMeasures(state.measures, query, state.selectedCategory),
    filteredKPIs: filterKPIs(state.kpis, query, state.selectedCategory),
  };
}

// ========================================================================
// Category filter
// ========================================================================

/**
 * Filter by a category tag. Pass null to clear the category filter.
 */
export function filterByCategory(
  state: MeasurePaletteState,
  category: string | null,
): MeasurePaletteState {
  return {
    ...state,
    selectedCategory: category,
    filteredMeasures: filterMeasures(state.measures, state.searchQuery, category),
    filteredKPIs: filterKPIs(state.kpis, state.searchQuery, category),
  };
}

// ========================================================================
// Tab switching
// ========================================================================

/**
 * Switch between measures and KPIs tabs.
 */
export function setActiveTab(
  state: MeasurePaletteState,
  tab: 'measures' | 'kpis',
): MeasurePaletteState {
  return { ...state, activeTab: tab };
}

// ========================================================================
// Selection
// ========================================================================

/**
 * Select a measure or KPI for the detail panel.
 */
export function selectPaletteItem(
  state: MeasurePaletteState,
  itemId: string,
  itemType: 'measure' | 'kpi',
): MeasurePaletteState {
  return {
    ...state,
    selectedItemId: itemId,
    selectedItemType: itemType,
  };
}

/**
 * Deselect the current palette item.
 */
export function deselectPaletteItem(state: MeasurePaletteState): MeasurePaletteState {
  return {
    ...state,
    selectedItemId: null,
    selectedItemType: null,
  };
}

// ========================================================================
// Data refresh
// ========================================================================

/**
 * Replace the measures and KPIs (e.g. after a registry refresh).
 * Re-applies current filters.
 */
export function refreshPaletteData(
  state: MeasurePaletteState,
  measures: MeasureDefinition[],
  kpis: KPIDefinition[],
): MeasurePaletteState {
  return {
    ...state,
    measures,
    kpis,
    categories: extractCategories(measures, kpis),
    filteredMeasures: filterMeasures(measures, state.searchQuery, state.selectedCategory),
    filteredKPIs: filterKPIs(kpis, state.searchQuery, state.selectedCategory),
  };
}
