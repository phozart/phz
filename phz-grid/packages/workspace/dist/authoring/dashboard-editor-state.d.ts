/**
 * @phozart/phz-workspace — Dashboard Editor State
 *
 * Pure functions for canvas-based dashboard building with widget placement,
 * morph groups, and config panels.
 */
import type { SourceRelationship } from '@phozart/phz-shared/types';
import type { ExploreFieldSlot, ExploreValueSlot, ExploreFilterSlot } from '../explore-types.js';
import type { LayoutNode } from '../schema/config-layers.js';
import type { DashboardFilterBarConfig } from '../types.js';
import type { CrossFilterRule } from './cross-filter-rule-state.js';
import type { DashboardPage, PageNavConfig } from './dashboard-page-state.js';
import type { FreeformGridConfig } from './freeform-grid-state.js';
export type MorphGroup = 'category-chart' | 'single-value' | 'tabular' | 'text' | 'navigation';
export type EditorMode = 'edit' | 'preview';
export type PreviewRole = 'admin' | 'author' | 'viewer';
export interface PreviewSnapshot {
    showConfigPanel: boolean;
    showFieldPalette: boolean;
    selectedWidgetId?: string;
}
export interface DashboardSourceEntry {
    slotId: string;
    dataSourceId: string;
    alias: string;
    color?: string;
}
export interface DashboardWidgetState {
    id: string;
    type: string;
    morphGroup: MorphGroup;
    config: Record<string, unknown>;
    dataConfig: {
        dimensions: ExploreFieldSlot[];
        measures: ExploreValueSlot[];
        filters: ExploreFilterSlot[];
    };
    position: {
        row: number;
        col: number;
        colSpan: number;
        rowSpan: number;
    };
    /** Which data source slot this widget is bound to. undefined = dashboard's primary (dataSources[0]). */
    sourceSlotId?: string;
}
export interface DashboardEditorState {
    name: string;
    /** @deprecated Use dataSources[0].dataSourceId. Kept for backward compat. */
    dataSourceId: string;
    /** Multi-source configuration. */
    dataSources: DashboardSourceEntry[];
    /** Relationships between sources (filter propagation semantics). */
    sourceRelationships: SourceRelationship[];
    widgets: DashboardWidgetState[];
    layout: LayoutNode;
    filters: DashboardFilterBarConfig;
    crossFilterRules: CrossFilterRule[];
    selectedWidgetId?: string;
    configPanelTab: 'data' | 'style' | 'filters' | 'visibility';
    showFieldPalette: boolean;
    showConfigPanel: boolean;
    canvasZoom: number;
    gridSnap: boolean;
    editorMode: EditorMode;
    previewRole?: PreviewRole;
    _previewSnapshot?: PreviewSnapshot;
    /** Multi-page dashboard support. */
    pages: DashboardPage[];
    activePageId: string;
    pageNavConfig: PageNavConfig;
    /** Canvas layout mode: auto-grid (responsive) or freeform (pixel-precise). */
    canvasMode: 'auto-grid' | 'freeform';
    /** Freeform grid configuration (columns, rows, cell size, gap, snap). */
    freeformConfig: FreeformGridConfig;
}
export declare function initialDashboardEditorState(name: string, dataSourceId: string): DashboardEditorState;
export declare function getMorphGroup(widgetType: string): MorphGroup;
export declare function getMorphOptions(widgetType: string): string[];
export declare function canMorph(fromType: string, toType: string): boolean;
export declare function addWidget(state: DashboardEditorState, widgetType: string, position?: {
    row: number;
    col: number;
    colSpan: number;
    rowSpan: number;
}, sourceSlotId?: string): DashboardEditorState;
export declare function removeWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState;
export declare function moveWidget(state: DashboardEditorState, widgetId: string, newPosition: {
    row: number;
    col: number;
    colSpan: number;
    rowSpan: number;
}): DashboardEditorState;
export declare function resizeWidget(state: DashboardEditorState, widgetId: string, newSpan: {
    colSpan?: number;
    rowSpan?: number;
}): DashboardEditorState;
export declare function morphWidget(state: DashboardEditorState, widgetId: string, newType: string): DashboardEditorState;
export declare function updateWidgetConfig(state: DashboardEditorState, widgetId: string, updates: Record<string, unknown>): DashboardEditorState;
export declare function updateWidgetData(state: DashboardEditorState, widgetId: string, dataConfig: {
    dimensions: ExploreFieldSlot[];
    measures: ExploreValueSlot[];
    filters: ExploreFilterSlot[];
}): DashboardEditorState;
export declare function selectWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState;
export declare function deselectWidget(state: DashboardEditorState): DashboardEditorState;
export declare function duplicateWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState;
export declare function setWidgetSource(state: DashboardEditorState, widgetId: string, sourceSlotId: string | undefined): DashboardEditorState;
export declare function addDashboardSource(state: DashboardEditorState, entry: DashboardSourceEntry): DashboardEditorState;
export declare function removeDashboardSource(state: DashboardEditorState, slotId: string): DashboardEditorState;
export declare function updateDashboardSource(state: DashboardEditorState, slotId: string, updates: Partial<Omit<DashboardSourceEntry, 'slotId'>>): DashboardEditorState;
export declare function resolveEffectiveSources(state: DashboardEditorState): DashboardSourceEntry[];
export declare function getWidgetSourceSlot(state: DashboardEditorState, widgetId: string): string;
export declare function toggleEditorMode(state: DashboardEditorState): DashboardEditorState;
export declare function setEditorMode(state: DashboardEditorState, mode: EditorMode): DashboardEditorState;
export declare function setPreviewRole(state: DashboardEditorState, role: PreviewRole): DashboardEditorState;
export declare function switchCanvasMode(state: DashboardEditorState, mode: 'auto-grid' | 'freeform'): DashboardEditorState;
export declare function migrateToFreeform(state: DashboardEditorState): DashboardEditorState;
export declare function migrateToAutoGrid(state: DashboardEditorState): DashboardEditorState;
/**
 * Reset the widget counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetWidgetCounter(): void;
//# sourceMappingURL=dashboard-editor-state.d.ts.map