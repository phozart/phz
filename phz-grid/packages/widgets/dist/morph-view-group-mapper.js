/**
 * @phozart/widgets — Morph Group / View Group Mapper
 *
 * Bridges the workspace MorphGroup system (category-chart, single-value,
 * tabular, text, navigation) with the new WidgetViewGroup model.
 *
 * Morph groups define which widget types can "morph" between each other
 * (e.g., bar-chart <-> pie-chart). View groups extend this concept by
 * allowing a single dashboard slot to switch between multiple views
 * with configurable switching UI (tabs, dropdown, toggle).
 */
import { getViewSwitchingMode } from '@phozart/shared/types';
/** Maps widget type names to their morph group membership. */
const MORPH_GROUP_REGISTRY = {
    'bar-chart': 'category-chart',
    'line-chart': 'category-chart',
    'area-chart': 'category-chart',
    'pie-chart': 'category-chart',
    'scatter-chart': 'category-chart',
    'heatmap': 'category-chart',
    'waterfall-chart': 'category-chart',
    'funnel-chart': 'category-chart',
    'kpi-card': 'single-value',
    'gauge': 'single-value',
    'kpi-scorecard': 'single-value',
    'trend-line': 'single-value',
    'data-table': 'tabular',
    'pivot-table': 'tabular',
    'status-table': 'tabular',
    'text-block': 'text',
    'heading': 'text',
    'rich-text': 'text',
    'decision-tree': 'navigation',
    'drill-link': 'navigation',
};
/** Human-readable labels for each morph group. */
const MORPH_GROUP_LABELS = {
    'category-chart': 'Charts',
    'single-value': 'Metrics',
    'tabular': 'Tables',
    'text': 'Text',
    'navigation': 'Navigation',
};
/**
 * Get the morph group for a widget type.
 */
export function getMorphGroupForType(widgetType) {
    return MORPH_GROUP_REGISTRY[widgetType] ?? 'text';
}
/**
 * Get all widget types within a morph group.
 */
export function getTypesInMorphGroup(group) {
    return Object.entries(MORPH_GROUP_REGISTRY)
        .filter(([, g]) => g === group)
        .map(([type]) => type);
}
/**
 * Convert a morph group into a WidgetViewGroup.
 *
 * Each widget type in the morph group becomes a WidgetView.
 * The first type is the default view. The switching mode is
 * determined automatically from the view count.
 *
 * @param group - The morph group to convert
 * @param currentType - The currently active widget type (used as default view)
 * @param configOverride - Optional per-view config overrides
 */
export function morphGroupToViewGroup(group, currentType, configOverride) {
    const types = getTypesInMorphGroup(group);
    const views = types.map(type => ({
        id: `view-${type}`,
        label: formatWidgetTypeLabel(type),
        widgetType: type,
        config: configOverride?.[type] ?? {},
    }));
    const defaultViewId = currentType && types.includes(currentType)
        ? `view-${currentType}`
        : views[0]?.id ?? '';
    return {
        id: `group-${group}`,
        label: MORPH_GROUP_LABELS[group],
        views,
        defaultViewId,
        switchingMode: getViewSwitchingMode(views.length),
    };
}
/**
 * Convert all morph groups to view groups, optionally filtering
 * to only the groups that are relevant for a given set of widget types.
 */
export function allMorphGroupsToViewGroups(relevantTypes) {
    const groups = new Set();
    if (relevantTypes) {
        for (const type of relevantTypes) {
            groups.add(getMorphGroupForType(type));
        }
    }
    else {
        for (const group of Object.values(MORPH_GROUP_REGISTRY)) {
            groups.add(group);
        }
    }
    return Array.from(groups).map(group => morphGroupToViewGroup(group));
}
/**
 * Format a kebab-case widget type as a human-readable label.
 * e.g., 'bar-chart' -> 'Bar Chart'
 */
export function formatWidgetTypeLabel(widgetType) {
    return widgetType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Check if two widget types are in the same morph group (i.e., can morph).
 */
export function canMorphBetween(typeA, typeB) {
    if (typeA === typeB)
        return false;
    return getMorphGroupForType(typeA) === getMorphGroupForType(typeB);
}
//# sourceMappingURL=morph-view-group-mapper.js.map