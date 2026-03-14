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
import type { WidgetViewGroup } from '@phozart/shared/types';
/**
 * MorphGroup — mirrors the workspace MorphGroup type.
 * Kept as a string literal union so this module has no runtime import
 * dependency on the workspace package.
 */
export type MorphGroup = 'category-chart' | 'single-value' | 'tabular' | 'text' | 'navigation';
/**
 * Get the morph group for a widget type.
 */
export declare function getMorphGroupForType(widgetType: string): MorphGroup;
/**
 * Get all widget types within a morph group.
 */
export declare function getTypesInMorphGroup(group: MorphGroup): string[];
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
export declare function morphGroupToViewGroup(group: MorphGroup, currentType?: string, configOverride?: Record<string, Record<string, unknown>>): WidgetViewGroup;
/**
 * Convert all morph groups to view groups, optionally filtering
 * to only the groups that are relevant for a given set of widget types.
 */
export declare function allMorphGroupsToViewGroups(relevantTypes?: string[]): WidgetViewGroup[];
/**
 * Format a kebab-case widget type as a human-readable label.
 * e.g., 'bar-chart' -> 'Bar Chart'
 */
export declare function formatWidgetTypeLabel(widgetType: string): string;
/**
 * Check if two widget types are in the same morph group (i.e., can morph).
 */
export declare function canMorphBetween(typeA: string, typeB: string): boolean;
//# sourceMappingURL=morph-view-group-mapper.d.ts.map