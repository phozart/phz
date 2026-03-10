/**
 * @phozart/phz-viewer — Catalog Screen State
 *
 * Headless state machine for the artifact catalog. Manages search,
 * filtering by type, sorting, and paginated artifact listing.
 */
// ========================================================================
// Factory: createCatalogState
// ========================================================================
export function createCatalogState(overrides) {
    const artifacts = overrides?.artifacts ?? [];
    const state = {
        artifacts,
        filteredArtifacts: overrides?.filteredArtifacts ?? [...artifacts],
        searchQuery: overrides?.searchQuery ?? '',
        typeFilter: overrides?.typeFilter ?? null,
        sort: overrides?.sort ?? { field: 'name', direction: 'asc' },
        loading: overrides?.loading ?? false,
        page: overrides?.page ?? 0,
        pageSize: overrides?.pageSize ?? 20,
        totalCount: overrides?.totalCount ?? artifacts.length,
        favoriteIds: overrides?.favoriteIds ?? new Set(),
        viewMode: overrides?.viewMode ?? 'grid',
    };
    return state;
}
// ========================================================================
// Filtering and sorting
// ========================================================================
/**
 * Apply search query and type filter to the artifact list, then sort.
 * Returns a new CatalogState with filteredArtifacts updated.
 */
export function applyFilters(state) {
    let result = [...state.artifacts];
    // Text search across name and description
    if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase().trim();
        result = result.filter(a => a.name.toLowerCase().includes(q) ||
            (a.description?.toLowerCase().includes(q) ?? false));
    }
    // Type filter
    if (state.typeFilter) {
        result = result.filter(a => a.type === state.typeFilter);
    }
    // Sort
    result.sort((a, b) => {
        const dir = state.sort.direction === 'asc' ? 1 : -1;
        switch (state.sort.field) {
            case 'name':
                return dir * a.name.localeCompare(b.name);
            case 'type':
                return dir * a.type.localeCompare(b.type);
            case 'visibility':
                return dir * a.visibility.localeCompare(b.visibility);
            default:
                return dir * a.name.localeCompare(b.name);
        }
    });
    return {
        ...state,
        filteredArtifacts: result,
        totalCount: result.length,
        page: 0, // Reset to first page on filter change
    };
}
/**
 * Set search query and recompute filtered artifacts.
 */
export function setSearchQuery(state, query) {
    return applyFilters({ ...state, searchQuery: query });
}
/**
 * Set type filter and recompute filtered artifacts.
 */
export function setTypeFilter(state, typeFilter) {
    return applyFilters({ ...state, typeFilter });
}
/**
 * Set sort configuration and recompute filtered artifacts.
 */
export function setCatalogSort(state, sort) {
    return applyFilters({ ...state, sort });
}
/**
 * Set the current page (0-based). Clamps to valid range.
 */
export function setCatalogPage(state, page) {
    const maxPage = Math.max(0, Math.ceil(state.totalCount / state.pageSize) - 1);
    return { ...state, page: Math.max(0, Math.min(page, maxPage)) };
}
/**
 * Set artifacts and recompute filtered list.
 */
export function setCatalogArtifacts(state, artifacts) {
    return applyFilters({ ...state, artifacts, loading: false });
}
/**
 * Toggle favorite status for an artifact.
 */
export function toggleFavorite(state, artifactId) {
    const favoriteIds = new Set(state.favoriteIds);
    if (favoriteIds.has(artifactId)) {
        favoriteIds.delete(artifactId);
    }
    else {
        favoriteIds.add(artifactId);
    }
    return { ...state, favoriteIds };
}
/**
 * Toggle between grid and list view modes.
 */
export function toggleViewMode(state) {
    return { ...state, viewMode: state.viewMode === 'grid' ? 'list' : 'grid' };
}
/**
 * Get the current page of artifacts.
 */
export function getCurrentPage(state) {
    const start = state.page * state.pageSize;
    return state.filteredArtifacts.slice(start, start + state.pageSize);
}
/**
 * Get total number of pages.
 */
export function getTotalPages(state) {
    return Math.max(1, Math.ceil(state.totalCount / state.pageSize));
}
//# sourceMappingURL=catalog-state.js.map