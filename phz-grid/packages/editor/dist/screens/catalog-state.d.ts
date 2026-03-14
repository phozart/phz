/**
 * @phozart/editor — Catalog Screen State (B-2.04)
 *
 * Editor catalog state with creation actions. Unlike the viewer catalog
 * (read-only), the editor catalog supports creating new dashboards and
 * reports, filtering by artifact type, search, and visibility management.
 */
import type { ArtifactVisibility, ArtifactType } from '@phozart/shared/artifacts';
export type CatalogSortField = 'name' | 'updatedAt' | 'createdAt' | 'type';
export type CatalogSortOrder = 'asc' | 'desc';
export interface CatalogItem {
    id: string;
    name: string;
    description?: string;
    type: ArtifactType;
    visibility: ArtifactVisibility;
    ownerId: string;
    ownerName?: string;
    updatedAt: number;
    createdAt: number;
    thumbnailUrl?: string;
    tags?: string[];
}
export interface CatalogState {
    /** All catalog items (unfiltered). */
    items: CatalogItem[];
    /** Filtered and sorted items for display. */
    filteredItems: CatalogItem[];
    /** Text search query. */
    searchQuery: string;
    /** Filter by artifact type (null = show all). */
    typeFilter: ArtifactType | null;
    /** Filter by visibility level (null = show all). */
    visibilityFilter: ArtifactVisibility | null;
    /** Sort field and order. */
    sortField: CatalogSortField;
    sortOrder: CatalogSortOrder;
    /** Whether the "create new" dialog is open. */
    createDialogOpen: boolean;
    /** The type of artifact being created. */
    createArtifactType: ArtifactType | null;
    /** Whether items are loading. */
    loading: boolean;
    /** Current error. */
    error: unknown;
}
export declare function createCatalogState(items?: CatalogItem[]): CatalogState;
/**
 * Set the catalog items and re-apply filters.
 */
export declare function setCatalogItems(state: CatalogState, items: CatalogItem[]): CatalogState;
/**
 * Update the search query and re-filter.
 */
export declare function searchCatalog(state: CatalogState, query: string): CatalogState;
/**
 * Filter by artifact type.
 */
export declare function filterCatalogByType(state: CatalogState, type: ArtifactType | null): CatalogState;
/**
 * Filter by visibility level.
 */
export declare function filterCatalogByVisibility(state: CatalogState, visibility: ArtifactVisibility | null): CatalogState;
/**
 * Change sort field and/or order.
 */
export declare function sortCatalog(state: CatalogState, field: CatalogSortField, order?: CatalogSortOrder): CatalogState;
/**
 * Open the create artifact dialog.
 */
export declare function openCreateDialog(state: CatalogState, artifactType: ArtifactType): CatalogState;
/**
 * Close the create artifact dialog.
 */
export declare function closeCreateDialog(state: CatalogState): CatalogState;
/**
 * Set loading state.
 */
export declare function setCatalogLoading(state: CatalogState, loading: boolean): CatalogState;
/**
 * Set error state.
 */
export declare function setCatalogError(state: CatalogState, error: unknown): CatalogState;
//# sourceMappingURL=catalog-state.d.ts.map