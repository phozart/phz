/**
 * @phozart/phz-shared — Grid Definitions as First-Class Artifacts (A-1.04)
 *
 * Enables grids to be saved, cataloged, and navigated to just like
 * reports and dashboards. A GridArtifact wraps the grid configuration
 * with artifact metadata.
 *
 * Extracted from workspace/navigation/grid-artifact.ts.
 */
import type { ArtifactType } from './artifact-visibility.js';
export interface ArtifactMeta {
    id: string;
    type: ArtifactType;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    published?: boolean;
}
export interface GridColumnConfig {
    field: string;
    header?: string;
    width?: number;
    visible?: boolean;
    sortable?: boolean;
    filterable?: boolean;
}
export interface GridArtifact {
    id: string;
    type: 'grid-definition';
    name: string;
    description?: string;
    dataSourceId: string;
    columns: GridColumnConfig[];
    defaultSort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    defaultFilters?: Record<string, unknown>;
    density?: 'compact' | 'dense' | 'comfortable';
    enableGrouping?: boolean;
    enableExport?: boolean;
    createdAt: number;
    updatedAt: number;
}
export declare function isGridArtifact(obj: unknown): obj is GridArtifact;
export declare function createGridArtifact(input: Omit<GridArtifact, 'id' | 'type' | 'createdAt' | 'updatedAt'> & {
    id?: string;
}): GridArtifact;
export declare function gridArtifactToMeta(artifact: GridArtifact): ArtifactMeta;
//# sourceMappingURL=grid-artifact.d.ts.map