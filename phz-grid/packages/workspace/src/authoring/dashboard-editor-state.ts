/**
 * @phozart/workspace — Dashboard Editor State
 *
 * Pure functions for canvas-based dashboard building with widget placement,
 * morph groups, and config panels.
 */

import type { SourceRelationship } from '@phozart/shared/types';
import type { ExploreFieldSlot, ExploreValueSlot, ExploreFilterSlot } from '../explore-types.js';
import type { FreeformLayout, FreeformWidgetSlot, LayoutNode } from '../schema/config-layers.js';
import type { DashboardFilterBarConfig } from '../types.js';
import type { CrossFilterRule } from './cross-filter-rule-state.js';
import type { DashboardPage, PageNavConfig } from './dashboard-page-state.js';
import { DEFAULT_PAGE_NAV_CONFIG, createPage } from './dashboard-page-state.js';
import type { FreeformGridConfig } from './freeform-grid-state.js';
import { findOpenPosition, initialFreeformGridState } from './freeform-grid-state.js';

export type MorphGroup = 'category-chart' | 'single-value' | 'tabular' | 'text' | 'navigation';

export type EditorMode = 'edit' | 'preview';
export type PreviewRole = 'admin' | 'author' | 'viewer';

export interface PreviewSnapshot {
  showConfigPanel: boolean;
  showFieldPalette: boolean;
  selectedWidgetId?: string;
}

export interface DashboardSourceEntry {
  slotId: string;       // Stable internal name widgets reference (e.g. 'primary', 'orders')
  dataSourceId: string; // Actual source from DataAdapter.listDataSources()
  alias: string;        // Human-readable label
  color?: string;       // Visual tag in editor
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
  position: { row: number; col: number; colSpan: number; rowSpan: number };
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

const MORPH_GROUPS: Record<string, MorphGroup> = {
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

export function initialDashboardEditorState(name: string, dataSourceId: string): DashboardEditorState {
  const defaultPage = createPage('Page 1', 'canvas');
  const layout: LayoutNode = { kind: 'freeform', columns: 48, rows: 36, cellSizePx: 20, gapPx: 4, children: [] };
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

export function getMorphGroup(widgetType: string): MorphGroup {
  return MORPH_GROUPS[widgetType] ?? 'text';
}

export function getMorphOptions(widgetType: string): string[] {
  const group = getMorphGroup(widgetType);
  return Object.entries(MORPH_GROUPS)
    .filter(([type, g]) => g === group && type !== widgetType)
    .map(([type]) => type);
}

export function canMorph(fromType: string, toType: string): boolean {
  return getMorphGroup(fromType) === getMorphGroup(toType) && fromType !== toType;
}

export function addWidget(
  state: DashboardEditorState,
  widgetType: string,
  position?: { row: number; col: number; colSpan: number; rowSpan: number },
  sourceSlotId?: string,
): DashboardEditorState {
  widgetCounter++;
  const id = `w_${Date.now()}_${widgetCounter}`;
  const morphGroup = getMorphGroup(widgetType);
  let pos: { row: number; col: number; colSpan: number; rowSpan: number };

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
  } else {
    pos = position ?? { row: 0, col: state.widgets.length, colSpan: 2, rowSpan: 2 };
  }

  const widget: DashboardWidgetState = {
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

export function removeWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState {
  return { ...state, widgets: state.widgets.filter(w => w.id !== widgetId) };
}

export function moveWidget(
  state: DashboardEditorState,
  widgetId: string,
  newPosition: { row: number; col: number; colSpan: number; rowSpan: number },
): DashboardEditorState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, position: newPosition } : w,
    ),
  };
}

export function resizeWidget(
  state: DashboardEditorState,
  widgetId: string,
  newSpan: { colSpan?: number; rowSpan?: number },
): DashboardEditorState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId
        ? { ...w, position: { ...w.position, ...newSpan } }
        : w,
    ),
  };
}

export function morphWidget(
  state: DashboardEditorState,
  widgetId: string,
  newType: string,
): DashboardEditorState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;
  if (!canMorph(widget.type, newType)) return state;

  const newMorphGroup = getMorphGroup(newType);
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId
        ? { ...w, type: newType, morphGroup: newMorphGroup }
        : w,
    ),
  };
}

export function updateWidgetConfig(
  state: DashboardEditorState,
  widgetId: string,
  updates: Record<string, unknown>,
): DashboardEditorState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId
        ? { ...w, config: { ...w.config, ...updates } }
        : w,
    ),
  };
}

export function updateWidgetData(
  state: DashboardEditorState,
  widgetId: string,
  dataConfig: {
    dimensions: ExploreFieldSlot[];
    measures: ExploreValueSlot[];
    filters: ExploreFilterSlot[];
  },
): DashboardEditorState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, dataConfig } : w,
    ),
  };
}

export function selectWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState {
  return { ...state, selectedWidgetId: widgetId, showConfigPanel: true };
}

export function deselectWidget(state: DashboardEditorState): DashboardEditorState {
  return { ...state, selectedWidgetId: undefined, showConfigPanel: false };
}

export function duplicateWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;

  widgetCounter++;
  const newId = `w_${Date.now()}_${widgetCounter}`;

  const duplicate: DashboardWidgetState = {
    ...widget,
    id: newId,
    sourceSlotId: widget.sourceSlotId,  // preserve source binding
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

export function setWidgetSource(
  state: DashboardEditorState,
  widgetId: string,
  sourceSlotId: string | undefined,
): DashboardEditorState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, sourceSlotId } : w,
    ),
  };
}

export function addDashboardSource(
  state: DashboardEditorState,
  entry: DashboardSourceEntry,
): DashboardEditorState {
  if (state.dataSources.some(s => s.slotId === entry.slotId)) return state;
  return { ...state, dataSources: [...state.dataSources, entry] };
}

export function removeDashboardSource(
  state: DashboardEditorState,
  slotId: string,
): DashboardEditorState {
  // Can't remove the primary (first) source
  if (state.dataSources.length <= 1) return state;
  if (state.dataSources[0]?.slotId === slotId) return state;
  // Check for orphaned widgets
  const hasOrphans = state.widgets.some(w => w.sourceSlotId === slotId);
  if (hasOrphans) return state;
  return {
    ...state,
    dataSources: state.dataSources.filter(s => s.slotId !== slotId),
    sourceRelationships: state.sourceRelationships.filter(
      r => r.leftSourceId !== slotId && r.rightSourceId !== slotId,
    ),
  };
}

export function updateDashboardSource(
  state: DashboardEditorState,
  slotId: string,
  updates: Partial<Omit<DashboardSourceEntry, 'slotId'>>,
): DashboardEditorState {
  return {
    ...state,
    dataSources: state.dataSources.map(s =>
      s.slotId === slotId ? { ...s, ...updates, slotId } : s,
    ),
  };
}

export function resolveEffectiveSources(state: DashboardEditorState): DashboardSourceEntry[] {
  if (state.dataSources.length > 0) return state.dataSources;
  // Migration: create from legacy dataSourceId
  return [{ slotId: 'primary', dataSourceId: state.dataSourceId, alias: 'Primary' }];
}

export function getWidgetSourceSlot(
  state: DashboardEditorState,
  widgetId: string,
): string {
  const widget = state.widgets.find(w => w.id === widgetId);
  return widget?.sourceSlotId ?? state.dataSources[0]?.slotId ?? 'primary';
}

// ========================================================================
// Preview Mode
// ========================================================================

export function toggleEditorMode(state: DashboardEditorState): DashboardEditorState {
  if (state.editorMode === 'edit') {
    return enterPreview(state);
  }
  return exitPreview(state);
}

export function setEditorMode(state: DashboardEditorState, mode: EditorMode): DashboardEditorState {
  if (state.editorMode === mode) return state;
  if (mode === 'preview') {
    return enterPreview(state);
  }
  return exitPreview(state);
}

export function setPreviewRole(state: DashboardEditorState, role: PreviewRole): DashboardEditorState {
  if (state.editorMode !== 'preview') return state;
  if (state.previewRole === role) return state;
  return { ...state, previewRole: role };
}

function enterPreview(state: DashboardEditorState): DashboardEditorState {
  const snapshot: PreviewSnapshot = {
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

function exitPreview(state: DashboardEditorState): DashboardEditorState {
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

export function switchCanvasMode(
  state: DashboardEditorState,
  mode: 'auto-grid' | 'freeform',
): DashboardEditorState {
  if (state.canvasMode === mode) return state;
  if (mode === 'freeform') return migrateToFreeform(state);
  return migrateToAutoGrid(state);
}

export function migrateToFreeform(state: DashboardEditorState): DashboardEditorState {
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

  const freeformLayout: LayoutNode = {
    kind: 'freeform' as const,
    columns: 48,
    rows: 36,
    cellSizePx: 20,
    gapPx: 4,
    children: migratedWidgets.map(w => ({
      kind: 'freeform-widget' as const,
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

export function migrateToAutoGrid(state: DashboardEditorState): DashboardEditorState {
  // Sort widgets top-to-bottom, left-to-right into linear flow
  const sorted = [...state.widgets].sort(
    (a, b) => a.position.row - b.position.row || a.position.col - b.position.col,
  );

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

  const autoLayout: LayoutNode = {
    kind: 'auto-grid' as const,
    minItemWidth: 200,
    gap: 16,
    children: autoWidgets.map(w => ({
      kind: 'widget' as const,
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
export function _resetWidgetCounter(): void {
  widgetCounter = 0;
}
