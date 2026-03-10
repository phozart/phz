/**
 * @phozart/phz-editor — Catalog Screen State (B-2.04)
 *
 * Editor catalog state with creation actions. Unlike the viewer catalog
 * (read-only), the editor catalog supports creating new dashboards and
 * reports, filtering by artifact type, search, and visibility management.
 */
// ========================================================================
// Factory
// ========================================================================
export function createCatalogState(items) {
    const state = {
        items: items ?? [],
        filteredItems: items ?? [],
        searchQuery: '',
        typeFilter: null,
        visibilityFilter: null,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        createDialogOpen: false,
        createArtifactType: null,
        loading: false,
        error: null,
    };
    return state;
}
// ========================================================================
// Internal: apply filters and sorting
// ========================================================================
function applyFiltersAndSort(state) {
    let result = [...state.items];
    // Search filter
    if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase();
        result = result.filter(item => item.name.toLowerCase().includes(query) ||
            (item.description?.toLowerCase().includes(query) ?? false) ||
            (item.tags?.some(tag => tag.toLowerCase().includes(query)) ?? false));
    }
    // Type filter
    if (state.typeFilter) {
        result = result.filter(item => item.type === state.typeFilter);
    }
    // Visibility filter
    if (state.visibilityFilter) {
        result = result.filter(item => item.visibility === state.visibilityFilter);
    }
    // Sort
    result.sort((a, b) => {
        let cmp = 0;
        switch (state.sortField) {
            case 'name':
                cmp = a.name.localeCompare(b.name);
                break;
            case 'updatedAt':
                cmp = a.updatedAt - b.updatedAt;
                break;
            case 'createdAt':
                cmp = a.createdAt - b.createdAt;
                break;
            case 'type':
                cmp = a.type.localeCompare(b.type);
                break;
        }
        return state.sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Set the catalog items and re-apply filters.
 */
export function setCatalogItems(state, items) {
    const newState = { ...state, items };
    return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}
/**
 * Update the search query and re-filter.
 */
export function searchCatalog(state, query) {
    const newState = { ...state, searchQuery: query };
    return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}
/**
 * Filter by artifact type.
 */
export function filterCatalogByType(state, type) {
    const newState = { ...state, typeFilter: type };
    return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}
/**
 * Filter by visibility level.
 */
export function filterCatalogByVisibility(state, visibility) {
    const newState = { ...state, visibilityFilter: visibility };
    return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}
/**
 * Change sort field and/or order.
 */
export function sortCatalog(state, field, order) {
    const newOrder = order ?? (state.sortField === field && state.sortOrder === 'asc' ? 'desc' : 'asc');
    const newState = { ...state, sortField: field, sortOrder: newOrder };
    return { ...newState, filteredItems: applyFiltersAndSort(newState) };
}
/**
 * Open the create artifact dialog.
 */
export function openCreateDialog(state, artifactType) {
    return { ...state, createDialogOpen: true, createArtifactType: artifactType };
}
/**
 * Close the create artifact dialog.
 */
export function closeCreateDialog(state) {
    return { ...state, createDialogOpen: false, createArtifactType: null };
}
/**
 * Set loading state.
 */
export function setCatalogLoading(state, loading) {
    return { ...state, loading };
}
/**
 * Set error state.
 */
export function setCatalogError(state, error) {
    return { ...state, error, loading: false };
}
//# sourceMappingURL=catalog-state.js.map