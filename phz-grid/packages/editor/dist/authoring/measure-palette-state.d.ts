/**
 * @phozart/phz-editor — Measure Palette State (B-2.07)
 *
 * State machine for the measure registry palette. Authors browse
 * and search measures and KPIs from the registry, then drag them
 * onto dashboard widgets or report columns.
 */
import type { MeasureDefinition, KPIDefinition } from '@phozart/phz-shared/adapters';
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
/**
 * Create a new MeasurePaletteState from measures and KPIs.
 */
export declare function createMeasurePaletteState(measures: MeasureDefinition[], kpis: KPIDefinition[]): MeasurePaletteState;
/**
 * Update the search query and re-filter both measures and KPIs.
 */
export declare function searchMeasures(state: MeasurePaletteState, query: string): MeasurePaletteState;
/**
 * Filter by a category tag. Pass null to clear the category filter.
 */
export declare function filterByCategory(state: MeasurePaletteState, category: string | null): MeasurePaletteState;
/**
 * Switch between measures and KPIs tabs.
 */
export declare function setActiveTab(state: MeasurePaletteState, tab: 'measures' | 'kpis'): MeasurePaletteState;
/**
 * Select a measure or KPI for the detail panel.
 */
export declare function selectPaletteItem(state: MeasurePaletteState, itemId: string, itemType: 'measure' | 'kpi'): MeasurePaletteState;
/**
 * Deselect the current palette item.
 */
export declare function deselectPaletteItem(state: MeasurePaletteState): MeasurePaletteState;
/**
 * Replace the measures and KPIs (e.g. after a registry refresh).
 * Re-applies current filters.
 */
export declare function refreshPaletteData(state: MeasurePaletteState, measures: MeasureDefinition[], kpis: KPIDefinition[]): MeasurePaletteState;
//# sourceMappingURL=measure-palette-state.d.ts.map