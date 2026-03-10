/**
 * @phozart/phz-shared — ArtifactVisibility lifecycle (A-1.04)
 *
 * Manages personal/shared/published visibility states for artifacts.
 * Supports role-based sharing, ShareTarget-aware filtering, and ViewerContext.
 *
 * Extracted from workspace/navigation/artifact-visibility.ts as pure types + functions.
 */
import type { ShareTarget } from '../types/share-target.js';
import type { ViewerContext } from '../adapters/data-adapter.js';
export type { ViewerContext };
export type ArtifactType = 'report' | 'dashboard' | 'kpi' | 'metric' | 'grid-definition' | 'filter-preset' | 'alert-rule' | 'subscription' | 'filter-definition' | 'filter-rule';
export type ArtifactVisibility = 'personal' | 'shared' | 'published';
export interface VisibilityMeta {
    id: string;
    type: ArtifactType;
    name: string;
    visibility: ArtifactVisibility;
    ownerId: string;
    sharedWith?: string[];
    /** Structured share targets (user, role, team) — preferred over sharedWith. */
    shareTargets?: ShareTarget[];
    description?: string;
}
export interface VisibilityGroup {
    personal: VisibilityMeta[];
    shared: VisibilityMeta[];
    published: VisibilityMeta[];
}
export declare function isVisibleToViewer(meta: VisibilityMeta, viewer: ViewerContext | undefined): boolean;
export declare function groupByVisibility(artifacts: VisibilityMeta[]): VisibilityGroup;
export declare function canTransition(from: ArtifactVisibility, to: ArtifactVisibility): boolean;
export declare function transitionVisibility(meta: VisibilityMeta, to: ArtifactVisibility, sharedWith?: string[]): VisibilityMeta;
export declare function duplicateWithVisibility(meta: VisibilityMeta, newOwnerId: string): VisibilityMeta;
//# sourceMappingURL=artifact-visibility.d.ts.map