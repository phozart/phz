/**
 * @phozart/workspace — NavigationLink (V.1)
 *
 * Defines cross-artifact drill-through navigation links.
 * A NavigationLink connects a source artifact (e.g. dashboard) to a
 * target artifact (e.g. report), optionally mapping filter values
 * from the source context to the target's filter definitions.
 */
import type { ArtifactType } from '../types.js';
export interface NavigationFilterMapping {
    sourceField: string;
    targetFilterDefinitionId: string;
    transform: 'passthrough' | 'lookup' | 'expression';
    transformExpr?: string;
}
export interface NavigationSource {
    artifactId: string;
    artifactType: ArtifactType;
    widgetId?: string;
    field?: string;
    value?: unknown;
}
export type NavigationOpenBehavior = 'same-panel' | 'new-tab' | 'modal' | 'slide-over';
export interface NavigationLink {
    id: string;
    sourceArtifactId: string;
    targetArtifactId: string;
    targetArtifactType: ArtifactType;
    label: string;
    description?: string;
    filterMappings: NavigationFilterMapping[];
    openBehavior?: NavigationOpenBehavior;
    icon?: string;
}
export declare function isNavigationLink(obj: unknown): obj is NavigationLink;
export declare function createNavigationLink(input: Omit<NavigationLink, 'id' | 'filterMappings' | 'openBehavior'> & {
    id?: string;
    filterMappings?: NavigationFilterMapping[];
    openBehavior?: NavigationOpenBehavior;
}): NavigationLink;
export declare function resolveNavigationFilters(mappings: NavigationFilterMapping[], sourceValues: Record<string, unknown>): Record<string, unknown>;
export declare function detectCircularLinks(links: NavigationLink[]): string[][];
//# sourceMappingURL=navigation-link.d.ts.map