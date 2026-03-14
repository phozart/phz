/**
 * @phozart/workspace — Dashboard Editor State
 *
 * Pure functions for canvas-based dashboard building with widget placement,
 * morph groups, and config panels.
 */
import { DEFAULT_PAGE_NAV_CONFIG, createPage } from './dashboard-page-state.js';
import { findOpenPosition, initialFreeformGridState } from './freeform-grid-state.js';
const MORPH_GROUPS = {
    'bar-chart': 'category-chart',
    'line-chart': 'category-chart',
    'area-chart': 'category-chart',
    'pie-chart': 'category-chart',
    'kpi-card': 'single-value',
    'gauge': 'single-value',
    'kpi-scorecard': 'single-value',
    'trend-line': 'single-value',
    'data-table': 'tabular',
    'pivot-table': 'tabular',
    'text-block': 'text',
    'heading': 'text',
    'drill-link': 'navigation',
};
let widgetCounter = 0;
export function initialDashboardEditorState(name, dataSourceId) {
    const defaultPage = createPage('Page 1', 'canvas');
    const layout = { kind: 'freeform', columns: 48, rows: 36, cellSizePx: 20, gapPx: 4, children: [] };
    return {
        name,
        dataSourceId,
        dataSources: [{ slotId: 'primary', dataSourceId, alias: 'Primary' }],
        sourceRelationships: [],
        widgets: [],
        layout,
        crossFilterRules: [],
        filters: {
            filters: [],
            position: 'top',
            collapsible: true,
            defaultCollapsed: false,
            showActiveFilterCount: true,
            showPresetPicker: false,
            dependencies: [],
        },
        configPanelTab: 'data',
        showFieldPalette: true,
        showConfigPanel: false,
        canvasZoom: 1,
        gridSnap: true,
        editorMode: 'edit',
        pages: [defaultPage],
        activePageId: defaultPage.id,
        pageNavConfig: { ...DEFAULT_PAGE_NAV_CONFIG },
        canvasMode: 'freeform',
        freeformConfig: initialFreeformGridState().grid,
    };
}
export function getMorphGroup(widgetType) {
    return MORPH_GROUPS[widgetType] ?? 'text';
}
export function getMorphOptions(widgetType) {
    const group = getMorphGroup(widgetType);
    return Object.entries(MORPH_GROUPS)
        .filter(([type, g]) => g === group && type !== widgetType)
        .map(([type]) => type);
}
export function canMorph(fromType, toType) {
    return getMorphGroup(fromType) === getMorphGroup(toType) && fromType !== toType;
}
export function addWidget(state, widgetType, position, sourceSlotId) {
    widgetCounter++;
    const id = `w_${Date.now()}_${widgetCounter}`;
    const morphGroup = getMorphGroup(widgetType);
    let pos;
    if (state.canvasMode === 'freeform' && !position) {
        // Use findOpenPosition from freeform-grid-state for smart placement
        const freeformState = {
            grid: state.freeformConfig,
            widgets: state.widgets.map(w => ({
                id: w.id,
                col: w.position.col,
                row: w.position.row,
                colSpan: w.position.colSpan,
                rowSpan: w.position.rowSpan,
            })),
            selectedWidgetIds: [],
            zoom: 1,
        };
        const openPos = findOpenPosition(freeformState, 8, 6);
        pos = { row: openPos.row, col: openPos.col, colSpan: 8, rowSpan: 6 };
    }
    else {
        pos = position ?? { row: 0, col: state.widgets.length, colSpan: 2, rowSpan: 2 };
    }
    const widget = {
        id,
        type: widgetType,
        morphGroup,
        config: {},
        dataConfig: {
            dimensions: [],
            measures: [],
            filters: [],
        },
        position: pos,
        sourceSlotId,
    };
    return { ...state, widgets: [...state.widgets, widget] };
}
export function removeWidget(state, widgetId) {
    return { ...state, widgets: state.widgets.filter(w => w.id !== widgetId) };
}
export function moveWidget(state, widgetId, newPosition) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId ? { ...w, position: newPosition } : w),
    };
}
export function resizeWidget(state, widgetId, newSpan) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId
            ? { ...w, position: { ...w.position, ...newSpan } }
            : w),
    };
}
export function morphWidget(state, widgetId, newType) {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget)
        return state;
    if (!canMorph(widget.type, newType))
        return state;
    const newMorphGroup = getMorphGroup(newType);
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId
            ? { ...w, type: newType, morphGroup: newMorphGroup }
            : w),
    };
}
export function updateWidgetConfig(state, widgetId, updates) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId
            ? { ...w, config: { ...w.config, ...updates } }
            : w),
    };
}
export function updateWidgetData(state, widgetId, dataConfig) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId ? { ...w, dataConfig } : w),
    };
}
export function selectWidget(state, widgetId) {
    return { ...state, selectedWidgetId: widgetId, showConfigPanel: true };
}
export function deselectWidget(state) {
    return { ...state, selectedWidgetId: undefined, showConfigPanel: false };
}
export function duplicateWidget(state, widgetId) {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget)
        return state;
    widgetCounter++;
    const newId = `w_${Date.now()}_${widgetCounter}`;
    const duplicate = {
        ...widget,
        id: newId,
        sourceSlotId: widget.sourceSlotId, // preserve source binding
        config: { ...widget.config },
        dataConfig: {
            dimensions: [...widget.dataConfig.dimensions],
            measures: [...widget.dataConfig.measures],
            filters: [...widget.dataConfig.filters],
        },
        position: {
            ...widget.position,
            col: state.canvasMode === 'freeform' ? widget.position.col + 2 : widget.position.col + 1,
            row: state.canvasMode === 'freeform' ? widget.position.row + 2 : widget.position.row,
        },
    };
    return { ...state, widgets: [...state.widgets, duplicate] };
}
// ========================================================================
// Multi-source management
// ========================================================================
export function setWidgetSource(state, widgetId, sourceSlotId) {
    return {
        ...state,
        widgets: state.widgets.map(w => w.id === widgetId ? { ...w, sourceSlotId } : w),
    };
}
export function addDashboardSource(state, entry) {
    if (state.dataSources.some(s => s.slotId === entry.slotId))
        return state;
    return { ...state, dataSources: [...state.dataSources, entry] };
}
export function removeDashboardSource(state, slotId) {
    // Can't remove the primary (first) source
    if (state.dataSources.length <= 1)
        return state;
    if (state.dataSources[0]?.slotId === slotId)
        return state;
    // Check for orphaned widgets
    const hasOrphans = state.widgets.some(w => w.sourceSlotId === slotId);
    if (hasOrphans)
        return state;
    return {
        ...state,
        dataSources: state.dataSources.filter(s => s.slotId !== slotId),
        sourceRelationships: state.sourceRelationships.filter(r => r.leftSourceId !== slotId && r.rightSourceId !== slotId),
    };
}
export function updateDashboardSource(state, slotId, updates) {
    return {
        ...state,
        dataSources: state.dataSources.map(s => s.slotId === slotId ? { ...s, ...updates, slotId } : s),
    };
}
export function resolveEffectiveSources(state) {
    if (state.dataSources.length > 0)
        return state.dataSources;
    // Migration: create from legacy dataSourceId
    return [{ slotId: 'primary', dataSourceId: state.dataSourceId, alias: 'Primary' }];
}
export function getWidgetSourceSlot(state, widgetId) {
    const widget = state.widgets.find(w => w.id === widgetId);
    return widget?.sourceSlotId ?? state.dataSources[0]?.slotId ?? 'primary';
}
// ========================================================================
// Preview Mode
// ========================================================================
export function toggleEditorMode(state) {
    if (state.editorMode === 'edit') {
        return enterPreview(state);
    }
    return exitPreview(state);
}
export function setEditorMode(state, mode) {
    if (state.editorMode === mode)
        return state;
    if (mode === 'preview') {
        return enterPreview(state);
    }
    return exitPreview(state);
}
export function setPreviewRole(state, role) {
    if (state.editorMode !== 'preview')
        return state;
    if (state.previewRole === role)
        return state;
    return { ...state, previewRole: role };
}
function enterPreview(state) {
    const snapshot = {
        showConfigPanel: state.showConfigPanel,
        showFieldPalette: state.showFieldPalette,
        selectedWidgetId: state.selectedWidgetId,
    };
    return {
        ...state,
        editorMode: 'preview',
        previewRole: 'viewer',
        _previewSnapshot: snapshot,
        showConfigPanel: false,
        showFieldPalette: false,
        selectedWidgetId: undefined,
    };
}
function exitPreview(state) {
    const snapshot = state._previewSnapshot;
    return {
        ...state,
        editorMode: 'edit',
        previewRole: undefined,
        _previewSnapshot: undefined,
        showConfigPanel: snapshot?.showConfigPanel ?? false,
        showFieldPalette: snapshot?.showFieldPalette ?? true,
        selectedWidgetId: snapshot?.selectedWidgetId,
    };
}
// ========================================================================
// Canvas Mode Switching
// ========================================================================
export function switchCanvasMode(state, mode) {
    if (state.canvasMode === mode)
        return state;
    if (mode === 'freeform')
        return migrateToFreeform(state);
    return migrateToAutoGrid(state);
}
export function migrateToFreeform(state) {
    // Map 12-col positions to 48-col (multiply by 4)
    const migratedWidgets = state.widgets.map(w => ({
        ...w,
        position: {
            col: w.position.col * 4,
            row: w.position.row * 4,
            colSpan: w.position.colSpan * 4,
            rowSpan: w.position.rowSpan * 4,
        },
    }));
    const freeformLayout = {
        kind: 'freeform',
        columns: 48,
        rows: 36,
        cellSizePx: 20,
        gapPx: 4,
        children: migratedWidgets.map(w => ({
            kind: 'freeform-widget',
            widgetId: w.id,
            col: w.position.col,
            row: w.position.row,
            colSpan: w.position.colSpan,
            rowSpan: w.position.rowSpan,
        })),
    };
    return {
        ...state,
        canvasMode: 'freeform',
        widgets: migratedWidgets,
        layout: freeformLayout,
        freeformConfig: { columns: 48, rows: 36, cellSizePx: 20, gapPx: 4, snapToGrid: true },
    };
}
export function migrateToAutoGrid(state) {
    // Sort widgets top-to-bottom, left-to-right into linear flow
    const sorted = [...state.widgets].sort((a, b) => a.position.row - b.position.row || a.position.col - b.position.col);
    // Convert back to 12-col positions
    const autoWidgets = sorted.map((w, i) => ({
        ...w,
        position: {
            col: (i * 4) % 12,
            row: Math.floor((i * 4) / 12) * 3,
            colSpan: Math.min(4, Math.max(1, Math.round(w.position.colSpan / 4))),
            rowSpan: Math.max(1, Math.round(w.position.rowSpan / 4)),
        },
    }));
    const autoLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: autoWidgets.map(w => ({
            kind: 'widget',
            widgetId: w.id,
            weight: w.position.colSpan,
            minHeight: w.position.rowSpan * 100,
        })),
    };
    return {
        ...state,
        canvasMode: 'auto-grid',
        widgets: autoWidgets,
        layout: autoLayout,
    };
}
/**
 * Reset the widget counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetWidgetCounter() {
    widgetCounter = 0;
}
//# sourceMappingURL=dashboard-editor-state.js.map