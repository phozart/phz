/**
 * @phozart/phz-workspace — Config Layer Separation Types
 *
 * DataDefinition = what data to show (fields, expressions, filters)
 * PresentationDefinition = how to show it (colors, formatting, layout)
 * LayoutIntent = where to place it (positioning, responsive behavior)
 */
export interface DataDefinition {
    fields: string[];
    expressions?: Record<string, string>;
    filters?: Record<string, unknown>;
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
}
export interface PresentationDefinition {
    theme?: string;
    formatting?: Record<string, unknown>;
    density?: 'compact' | 'dense' | 'comfortable';
    colorScheme?: string[];
}
export interface LayoutIntent {
    type: 'flow' | 'grid' | 'stack';
    columns?: number;
    gap?: number;
    responsive?: boolean;
}
export interface TabsLayout {
    kind: 'tabs';
    tabs: Array<{
        label: string;
        icon?: string;
        children: LayoutNode[];
    }>;
}
export interface SectionsLayout {
    kind: 'sections';
    sections: Array<{
        title: string;
        collapsed?: boolean;
        children: LayoutNode[];
    }>;
}
export interface AutoGridLayout {
    kind: 'auto-grid';
    minItemWidth: number;
    gap: number;
    maxColumns?: number;
    children: LayoutNode[];
}
export interface WidgetSlot {
    kind: 'widget';
    widgetId: string;
    weight?: number;
    minHeight?: number;
    dataTier?: 'preload' | 'full' | 'both';
}
export interface FreeformLayout {
    kind: 'freeform';
    columns: number;
    rows: number;
    cellSizePx: number;
    gapPx: number;
    children: FreeformWidgetSlot[];
}
export interface FreeformWidgetSlot {
    kind: 'freeform-widget';
    widgetId: string;
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    zIndex?: number;
}
export type LayoutNode = TabsLayout | SectionsLayout | AutoGridLayout | FreeformLayout | WidgetSlot;
export declare function flattenLayoutWidgets(node: LayoutNode): string[];
export declare function freeformToAutoGrid(freeform: FreeformLayout): AutoGridLayout;
export declare function convertLegacyLayout(placements: Array<{
    row: number;
    col: number;
    colSpan: number;
    rowSpan: number;
    widgetId: string;
}>): AutoGridLayout;
//# sourceMappingURL=config-layers.d.ts.map