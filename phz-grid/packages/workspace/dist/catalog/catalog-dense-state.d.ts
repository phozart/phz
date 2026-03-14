/**
 * @phozart/workspace — Catalog Dense Table View State (B-3.01)
 *
 * Pure functions for managing a dense table view of the artifact catalog.
 * Supports multi-column sorting, bulk selection, and inline quick actions.
 */
import type { ArtifactMeta, ArtifactType } from '../types.js';
export type DenseSortField = 'name' | 'type' | 'visibility' | 'updatedAt' | 'owner';
export interface DenseSortConfig {
    field: DenseSortField;
    direction: 'asc' | 'desc';
}
export type InlineAction = {
    kind: 'rename';
    artifactId: string;
    newName: string;
} | {
    kind: 'duplicate';
    artifactId: string;
} | {
    kind: 'change-visibility';
    artifactId: string;
    published: boolean;
};
export type BulkAction = 'delete' | 'share' | 'publish' | 'unpublish';
export interface CatalogDenseState {
    artifacts: ArtifactMeta[];
    viewMode: 'card' | 'dense-table';
    sort: DenseSortConfig;
    selectedIds: Set<string>;
    search: string;
    typeFilter?: ArtifactType;
    pageSize: number;
    currentPage: number;
}
export declare function initialCatalogDenseState(artifacts?: ArtifactMeta[]): CatalogDenseState;
export declare function toggleViewMode(state: CatalogDenseState): CatalogDenseState;
export declare function setSort(state: CatalogDenseState, field: DenseSortField): CatalogDenseState;
export declare function sortArtifacts(artifacts: ArtifactMeta[], sort: DenseSortConfig): ArtifactMeta[];
export declare function filterDenseArtifacts(state: CatalogDenseState): ArtifactMeta[];
export declare function getPagedArtifacts(state: CatalogDenseState): ArtifactMeta[];
export declare function getTotalPages(state: CatalogDenseState): number;
export declare function goToPage(state: CatalogDenseState, page: number): CatalogDenseState;
export declare function toggleSelection(state: CatalogDenseState, artifactId: string): CatalogDenseState;
export declare function selectAll(state: CatalogDenseState): CatalogDenseState;
export declare function deselectAll(state: CatalogDenseState): CatalogDenseState;
export declare function isAllSelected(state: CatalogDenseState): boolean;
export declare function applyInlineAction(state: CatalogDenseState, action: InlineAction): CatalogDenseState;
export declare function canApplyBulkAction(state: CatalogDenseState, action: BulkAction): boolean;
export declare function applyBulkAction(state: CatalogDenseState, action: BulkAction): CatalogDenseState;
//# sourceMappingURL=catalog-dense-state.d.ts.map