/**
 * S.4 — Catalog Browser Visual Redesign
 *
 * Visual helpers for the redesigned catalog: visibility tabs, artifact cards
 * with type-specific colors, status badges, and preview panel data.
 */
import { ARTIFACT_ICONS, icon } from '../styles/icons.js';
export const VISIBILITY_TABS = [
    { id: 'my-work', label: 'My Work' },
    { id: 'shared', label: 'Shared' },
    { id: 'published', label: 'Published' },
];
// ========================================================================
// Artifact Type Colors
// ========================================================================
export const ARTIFACT_TYPE_COLORS = {
    'dashboard': '#3B82F6',
    'report': '#10B981',
    'grid-definition': '#8B5CF6',
    'kpi': '#F97316',
    'metric': '#6366F1',
    'filter-preset': '#14B8A6',
    'filter-definition': '#0EA5E9',
    'filter-rule': '#D946EF',
    'alert-rule': '#EF4444',
    'subscription': '#8B5CF6',
};
// ========================================================================
// Artifact Type Icons
// ========================================================================
/** @deprecated Use ARTIFACT_ICONS from styles/icons.ts for SVG icons */
const ARTIFACT_TYPE_ICONS = {
    'dashboard': '\u25A6',
    'report': '\u2637',
    'grid-definition': '\u2588',
    'kpi': '\u2191',
    'metric': '\u2211',
    'filter-preset': '\u2AF6',
    'filter-definition': '\u2AF6',
    'filter-rule': '\u21D2',
    'alert-rule': '\u26A0',
    'subscription': '\u2709',
};
const MAX_DESCRIPTION_LENGTH = 120;
/**
 * Get the SVG icon markup for an artifact type.
 * Returns a complete inline <svg> element string.
 */
export function getArtifactIcon(type, size = 20) {
    const iconName = ARTIFACT_ICONS[type];
    const color = ARTIFACT_TYPE_COLORS[type] ?? '#78716C';
    return iconName ? icon(iconName, size, color) : '';
}
export function getArtifactCardProps(artifact) {
    let truncatedDescription;
    if (artifact.description) {
        truncatedDescription = artifact.description.length > MAX_DESCRIPTION_LENGTH
            ? artifact.description.slice(0, MAX_DESCRIPTION_LENGTH - 3) + '...'
            : artifact.description;
    }
    return {
        typeIcon: ARTIFACT_TYPE_ICONS[artifact.type] ?? '\u25A0',
        typeColor: ARTIFACT_TYPE_COLORS[artifact.type] ?? '#78716C',
        displayName: artifact.name,
        truncatedDescription,
    };
}
export function getStatusBadge(artifact) {
    if (artifact.published) {
        return { label: 'Published', variant: 'published' };
    }
    return { label: 'Draft', variant: 'draft' };
}
// ========================================================================
// Visibility Filtering
// ========================================================================
export function filterByVisibility(artifacts, tabId) {
    switch (tabId) {
        case 'published':
            return artifacts.filter(a => a.published === true);
        case 'my-work':
            return artifacts.filter(a => !a.published);
        case 'shared':
            return artifacts; // placeholder — shared logic needs user context
        default:
            return artifacts;
    }
}
//# sourceMappingURL=catalog-visual.js.map