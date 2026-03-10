/**
 * @phozart/phz-editor — Measure Palette State (B-2.07)
 *
 * State machine for the measure registry palette. Authors browse
 * and search measures and KPIs from the registry, then drag them
 * onto dashboard widgets or report columns.
 */
// ========================================================================
// Internal: extract unique categories from tags
// ========================================================================
function extractCategories(measures, kpis) {
    const tagSet = new Set();
    for (const m of measures) {
        for (const tag of m.tags ?? [])
            tagSet.add(tag);
    }
    for (const k of kpis) {
        for (const tag of k.tags ?? [])
            tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
}
// ========================================================================
// Internal: apply filtering
// ========================================================================
function filterMeasures(measures, searchQuery, category) {
    let result = measures;
    if (category) {
        result = result.filter(m => m.tags?.includes(category));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(m => m.name.toLowerCase().includes(q) ||
            (m.description?.toLowerCase().includes(q) ?? false) ||
            m.expression.toLowerCase().includes(q));
    }
    return result;
}
function filterKPIs(kpis, searchQuery, category) {
    let result = kpis;
    if (category) {
        result = result.filter(k => k.tags?.includes(category));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(k => k.name.toLowerCase().includes(q) ||
            (k.description?.toLowerCase().includes(q) ?? false));
    }
    return result;
}
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a new MeasurePaletteState from measures and KPIs.
 */
export function createMeasurePaletteState(measures, kpis) {
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
export function searchMeasures(state, query) {
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
export function filterByCategory(state, category) {
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
export function setActiveTab(state, tab) {
    return { ...state, activeTab: tab };
}
// ========================================================================
// Selection
// ========================================================================
/**
 * Select a measure or KPI for the detail panel.
 */
export function selectPaletteItem(state, itemId, itemType) {
    return {
        ...state,
        selectedItemId: itemId,
        selectedItemType: itemType,
    };
}
/**
 * Deselect the current palette item.
 */
export function deselectPaletteItem(state) {
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
export function refreshPaletteData(state, measures, kpis) {
    return {
        ...state,
        measures,
        kpis,
        categories: extractCategories(measures, kpis),
        filteredMeasures: filterMeasures(measures, state.searchQuery, state.selectedCategory),
        filteredKPIs: filterKPIs(kpis, state.searchQuery, state.selectedCategory),
    };
}
//# sourceMappingURL=measure-palette-state.js.map