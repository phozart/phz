/**
 * Pure utility functions for CatalogBrowser — grouping and filtering.
 */
import type { ArtifactMeta, ArtifactType, TemplateDefinition } from '../types.js';
export declare function groupArtifactsByType(artifacts: ArtifactMeta[]): Map<ArtifactType, ArtifactMeta[]>;
export declare function filterArtifactsBySearch(artifacts: ArtifactMeta[], query: string): ArtifactMeta[];
export declare function filterTemplatesBySearch(templates: TemplateDefinition[], query: string): TemplateDefinition[];
export interface UnifiedSearchResult {
    artifacts: ArtifactMeta[];
    templates: TemplateDefinition[];
    totalCount: number;
}
export declare function unifiedSearch(artifacts: ArtifactMeta[], templates: TemplateDefinition[], query: string): UnifiedSearchResult;
//# sourceMappingURL=catalog-utils.d.ts.map