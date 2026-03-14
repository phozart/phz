/**
 * @phozart/viewer — Catalog Screen State
 *
 * Headless state machine for the artifact catalog. Manages search,
 * filtering by type, sorting, and paginated artifact listing.
 */
import type { ArtifactType, VisibilityMeta } from '@phozart/shared/artifacts';
export type CatalogSortField = 'name' | 'type' | 'updatedAt' | 'visibility';
export type CatalogSortDirection = 'asc' | 'desc';
export interface CatalogSort {
    field: CatalogSortField;
    direction: CatalogSortDirection;
}
export interface CatalogState {
    /** All artifacts visible to the current viewer. */
    artifacts: VisibilityMeta[];
    /** Filtered/sorted artifacts after applying search and type filter. */
    filteredArtifacts: VisibilityMeta[];
    /** Full-text search query. */
    searchQuery: string;
    /** Filter by artifact type (null = show all). */
    typeFilter: ArtifactType | null;
    /** Current sort configuration. */
    sort: CatalogSort;
    /** Whether the catalog is loading. */
    loading: boolean;
    /** Current page (0-based). */
    page: number;
    /** Number of items per page. */
    pageSize: number;
    /** Total number of items matching current filters. */
    totalCount: number;
    /** Favorite artifact IDs. */
    favoriteIds: Set<string>;
    /** Recently viewed artifact IDs with timestamps, max 10, newest first. */
    recentItems: Array<{
        id: string;
        timestamp: number;
    }>;
    /** Display mode for the catalog. */
    viewMode: 'grid' | 'list';
}
export declare function createCatalogState(overrides?: Partial<CatalogState>): CatalogState;
/**
 * Apply search query and type filter to the artifact list, then sort.
 * Returns a new CatalogState with filteredArtifacts updated.
 */
export declare function applyFilters(state: CatalogState): CatalogState;
/**
 * Set search query and recompute filtered artifacts.
 */
export declare function setSearchQuery(state: CatalogState, query: string): CatalogState;
/**
 * Set type filter and recompute filtered artifacts.
 */
export declare function setTypeFilter(state: CatalogState, typeFilter: ArtifactType | null): CatalogState;
/**
 * Set sort configuration and recompute filtered artifacts.
 */
export declare function setCatalogSort(state: CatalogState, sort: CatalogSort): CatalogState;
/**
 * Set the current page (0-based). Clamps to valid range.
 */
export declare function setCatalogPage(state: CatalogState, page: number): CatalogState;
/**
 * Set artifacts and recompute filtered list.
 */
export declare function setCatalogArtifacts(state: CatalogState, artifacts: VisibilityMeta[]): CatalogState;
/**
 * Toggle favorite status for an artifact.
 */
export declare function toggleFavorite(state: CatalogState, artifactId: string): CatalogState;
/**
 * Toggle between grid and list view modes.
 */
export declare function toggleViewMode(state: CatalogState): CatalogState;
/**
 * Get the current page of artifacts.
 */
export declare function getCurrentPage(state: CatalogState): VisibilityMeta[];
/**
 * Get total number of pages.
 */
export declare function getTotalPages(state: CatalogState): number;
/**
 * Add an artifact to the recent items list.
 * Moves to front if already present. Caps at 10 items.
 */
export declare function addRecentItem(state: CatalogState, artifactId: string): CatalogState;
/**
 * Get recent artifacts resolved from the artifacts array.
 * Returns artifacts matching recentItems IDs in recency order.
 */
export declare function getRecentArtifacts(state: CatalogState): VisibilityMeta[];
/**
 * Load persisted favorites from external storage.
 */
export declare function loadPersistedFavorites(state: CatalogState, ids: string[]): CatalogState;
/**
 * Load persisted recent items from external storage.
 */
export declare function loadPersistedRecents(state: CatalogState, items: Array<{
    id: string;
    timestamp: number;
}>): CatalogState;
//# sourceMappingURL=catalog-state.d.ts.map