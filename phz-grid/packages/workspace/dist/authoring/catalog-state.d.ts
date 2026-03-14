/**
 * @phozart/workspace — Catalog State
 *
 * Pure functions for filtering, searching, sorting, and tagging artifacts
 * in the home/catalog view.
 */
import type { ArtifactMeta } from '../types.js';
export interface CatalogState {
    artifacts: ArtifactMeta[];
    search: string;
    selectedTags: string[];
    typeFilter?: 'report' | 'dashboard';
    sortBy: 'name' | 'updatedAt' | 'createdAt';
    sortDir: 'asc' | 'desc';
}
export declare function initialCatalogState(artifacts?: ArtifactMeta[]): CatalogState;
export declare function filterArtifacts(state: CatalogState): ArtifactMeta[];
export declare function extractTags(artifacts: ArtifactMeta[]): string[];
export declare function sortArtifacts(artifacts: ArtifactMeta[], sortBy: CatalogState['sortBy'], sortDir: CatalogState['sortDir']): ArtifactMeta[];
export declare function getArtifactsByStatus(artifacts: ArtifactMeta[], status: 'draft' | 'published'): ArtifactMeta[];
//# sourceMappingURL=catalog-state.d.ts.map