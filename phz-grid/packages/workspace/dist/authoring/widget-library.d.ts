/**
 * @phozart/workspace — Widget Library
 *
 * Curated list of addable widgets with metadata for the "Add Widget" UI.
 * Static data — no side effects.
 */
import type { MorphGroup } from './dashboard-editor-state.js';
export type WidgetCategory = 'chart' | 'single-value' | 'tabular' | 'text' | 'navigation';
export interface WidgetLibraryEntry {
    type: string;
    name: string;
    icon: string;
    category: WidgetCategory;
    morphGroup: MorphGroup;
    description: string;
    defaultSize: {
        colSpan: number;
        rowSpan: number;
    };
}
export declare function getWidgetLibrary(): WidgetLibraryEntry[];
export declare function getWidgetsByCategory(): Map<WidgetCategory, WidgetLibraryEntry[]>;
export declare function getWidgetByType(type: string): WidgetLibraryEntry | undefined;
export declare function getWidgetsInMorphGroup(morphGroup: MorphGroup): WidgetLibraryEntry[];
//# sourceMappingURL=widget-library.d.ts.map