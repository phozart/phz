/**
 * @phozart/phz-workspace — Widget Palette State
 *
 * Pure state machine for the tabbed Fields/Widgets panel in the dashboard editor.
 * Manages tab selection, search filtering, and category expansion.
 */
import type { WidgetManifest } from '../types.js';
export type PaletteTab = 'fields' | 'widgets';
export interface WidgetPaletteState {
    activeTab: PaletteTab;
    widgetSearchQuery: string;
    expandedCategories: Set<string>;
}
export declare function initialWidgetPaletteState(): WidgetPaletteState;
export declare function setPaletteTab(state: WidgetPaletteState, tab: PaletteTab): WidgetPaletteState;
export declare function setWidgetSearch(state: WidgetPaletteState, query: string): WidgetPaletteState;
export declare function toggleWidgetCategory(state: WidgetPaletteState, category: string): WidgetPaletteState;
/**
 * Filter and group manifests by category, matching search query against
 * type, name, and description (case-insensitive).
 */
export declare function getFilteredWidgets(manifests: WidgetManifest[], searchQuery: string): Map<string, WidgetManifest[]>;
//# sourceMappingURL=widget-palette-state.d.ts.map