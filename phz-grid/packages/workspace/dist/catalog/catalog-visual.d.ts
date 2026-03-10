/**
 * S.4 — Catalog Browser Visual Redesign
 *
 * Visual helpers for the redesigned catalog: visibility tabs, artifact cards
 * with type-specific colors, status badges, and preview panel data.
 */
import type { ArtifactMeta, ArtifactType } from '../types.js';
export interface VisibilityTab {
    id: string;
    label: string;
}
export declare const VISIBILITY_TABS: VisibilityTab[];
export declare const ARTIFACT_TYPE_COLORS: Record<ArtifactType, string>;
export interface ArtifactCardProps {
    typeIcon: string;
    typeColor: string;
    displayName: string;
    truncatedDescription?: string;
}
/**
 * Get the SVG icon markup for an artifact type.
 * Returns a complete inline <svg> element string.
 */
export declare function getArtifactIcon(type: ArtifactType, size?: number): string;
export declare function getArtifactCardProps(artifact: ArtifactMeta): ArtifactCardProps;
export interface StatusBadge {
    label: string;
    variant: 'published' | 'shared' | 'personal' | 'draft';
}
export declare function getStatusBadge(artifact: ArtifactMeta): StatusBadge;
export declare function filterByVisibility(artifacts: ArtifactMeta[], tabId: string): ArtifactMeta[];
//# sourceMappingURL=catalog-visual.d.ts.map