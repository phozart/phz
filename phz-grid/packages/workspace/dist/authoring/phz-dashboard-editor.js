/**
 * @phozart/phz-workspace — Dashboard Editor Component
 *
 * Field palette (left 260px) + Canvas (center CSS grid) + Config panel (right 360px).
 * Floating toolbar on selected widget: Morph | Configure | Duplicate | Delete.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { initialDashboardEditorState, addWidget, removeWidget, selectWidget, deselectWidget, duplicateWidget, morphWidget, getMorphOptions, toggleEditorMode, setPreviewRole, moveWidget, switchCanvasMode, } from './dashboard-editor-state.js';
import { createPage, addPage, removePage, reorderPages, setActivePage, updatePageLabel, duplicatePage, getActivePage, } from './dashboard-page-state.js';
import { createDashboardUndoManager } from './dashboard-undo.js';
import { handleDashboardFieldAdd, handleDashboardFieldRemove, autoCreateWidgetForField, } from './dashboard-editor-wiring.js';
import { initialEditorCriteriaState, toggleCriteria, removeCriteriaFilter, clearCriteriaFilters, } from './editor-criteria-state.js';
import { initialCrossFilterRuleState, getCrossFilterMatrix, } from './cross-filter-rule-state.js';
import { initialWidgetVisibilityState, removeVisibilityCondition, startEditCondition, commitCondition, cancelEditCondition, } from './widget-visibility-state.js';
import { initialWidgetPaletteState, setPaletteTab, setWidgetSearch, toggleWidgetCategory, } from './widget-palette-state.js';
import { getWidgetLibrary } from './widget-library.js';
import { toCSSGridStyle, toWidgetStyle, startFreeformDrag, updateFreeformDrag, commitFreeformDrag, cancelFreeformDrag, startResize, updateResize, commitResize, selectFreeformWidget, deselectFreeformWidget, selectMultipleFreeformWidgets, toggleFreeformWidgetSelection, setFreeformZoom, alignFreeformWidgets, distributeFreeformWidgets, initialFreeformGridState, } from './freeform-grid-state.js';
import { initialCanvasInteractionState, enterCanvasDragMode, enterCanvasResizeMode, enterCanvasSelectMode, exitCanvasInteraction, updateCanvasGhost, computeCanvasSnapGuides, setCanvasSnapGuides, updateCanvasSelectionRect, getWidgetsInCanvasSelectionRect, toggleCanvasGridDots, } from './canvas-interaction-state.js';
import { CanvasPointerController } from './canvas-pointer.controller.js';
import { initialCanvasToolbarState, toggleCanvasToolbarGridSnap, toggleCanvasToolbarGridDots, setCanvasToolbarMode, updateCanvasToolbarSelection, canvasToolbarZoomIn, canvasToolbarZoomOut, showCanvasAlignmentButtons, showCanvasDistributionButtons, } from './canvas-toolbar-state.js';
let PhzDashboardEditor = class PhzDashboardEditor extends LitElement {
    constructor() {
        super(...arguments);
        this.name = 'Untitled Dashboard';
        this.dataSourceId = '';
        this._criteriaState = initialEditorCriteriaState();
        this._crossFilterState = initialCrossFilterRuleState();
        this._showCrossFilterPanel = false;
        this._visibilityState = initialWidgetVisibilityState();
        this._paletteState = initialWidgetPaletteState();
        this._lastSuggestion = null;
        this._canvasInteraction = initialCanvasInteractionState();
        this._canvasToolbar = initialCanvasToolbarState();
        this._freeformState = initialFreeformGridState();
    }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    .de-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .de-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      background: var(--phz-bg-surface, #fff);
      flex-shrink: 0;
    }

    .toolbar-title { font-weight: 600; font-size: 15px; margin-right: auto; }

    .toolbar-btn {
      padding: 6px 10px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
    }

    .toolbar-btn:hover { background: var(--phz-bg-hover, #f3f4f6); }
    .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .toolbar-btn.primary { background: var(--phz-primary, #2563eb); color: #fff; border-color: var(--phz-primary, #2563eb); }

    .field-palette {
      width: 260px;
      flex-shrink: 0;
      border-right: 1px solid var(--phz-border, #d1d5db);
      overflow-y: auto;
      padding: 12px;
      background: var(--phz-bg-surface, #fff);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .field-palette phz-data-source-panel {
      flex: 1;
      min-height: 0;
    }

    .field-palette.hidden { display: none; }

    .palette-header {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 12px;
      text-transform: uppercase;
      color: var(--phz-text-secondary, #6b7280);
      letter-spacing: 0.05em;
    }

    .field-item {
      padding: 6px 10px;
      border-radius: 4px;
      cursor: grab;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .field-item:hover { background: var(--phz-bg-hover, #f3f4f6); }

    .field-type-badge {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 2px;
      font-weight: 500;
    }

    .field-type-badge.string { background: #dbeafe; color: #1d4ed8; }
    .field-type-badge.number { background: #dcfce7; color: #166534; }
    .field-type-badge.date { background: #fef3c7; color: #92400e; }
    .field-type-badge.boolean { background: #f3e8ff; color: #7c3aed; }

    .canvas {
      flex: 1;
      padding: 16px;
      overflow: auto;
      background: var(--phz-bg-canvas, #f9fafb);
      min-height: 0;
    }

    .canvas-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      min-height: 400px;
    }

    .widget-slot {
      border: 2px dashed var(--phz-border, #d1d5db);
      border-radius: 8px;
      padding: 12px;
      min-height: 80px;
      position: relative;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .widget-slot:hover { border-color: var(--phz-primary-light, #93c5fd); }

    .widget-slot.selected {
      border-color: var(--phz-primary, #2563eb);
      border-style: solid;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .widget-header { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .widget-type { font-size: 11px; color: var(--phz-text-secondary, #6b7280); text-transform: uppercase; }
    .widget-data-summary { font-size: 12px; color: var(--phz-text-tertiary, #9ca3af); margin-top: 4px; }

    .widget-actions {
      position: absolute;
      top: -32px;
      right: 0;
      display: flex;
      gap: 2px;
      background: var(--phz-bg-surface, #fff);
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      padding: 2px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .widget-action-btn {
      padding: 4px 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      border-radius: 2px;
    }

    .widget-action-btn:hover { background: var(--phz-bg-hover, #f3f4f6); }
    .widget-action-btn.delete:hover { background: #fee2e2; color: #dc2626; }

    .canvas-empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px;
      color: var(--phz-text-secondary, #6b7280);
      gap: 16px;
    }

    .canvas-empty p { margin: 0; font-size: 14px; }

    .canvas-empty-btn {
      padding: 10px 20px;
      border: 2px dashed var(--phz-primary, #2563eb);
      border-radius: 8px;
      background: transparent;
      color: var(--phz-primary, #2563eb);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-style 0.15s;
    }

    .canvas-empty-btn:hover {
      background: var(--phz-primary-50, #eff6ff);
      border-style: solid;
    }

    .config-panel {
      width: 360px;
      border-left: 1px solid var(--phz-border, #d1d5db);
      overflow-y: auto;
      background: var(--phz-bg-surface, #fff);
    }

    .config-panel.hidden { display: none; }

    .config-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      font-weight: 600;
      font-size: 14px;
    }

    .config-tabs { display: flex; border-bottom: 1px solid var(--phz-border, #d1d5db); }

    .config-tab {
      flex: 1;
      padding: 10px;
      text-align: center;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .config-tab.active {
      border-bottom-color: var(--phz-primary, #2563eb);
      color: var(--phz-primary, #2563eb);
    }

    .config-content { padding: 16px; }

    .add-widget-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

    .add-widget-btn {
      padding: 6px 12px;
      border: 1px dashed var(--phz-border, #d1d5db);
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
    }

    .add-widget-btn:hover {
      border-color: var(--phz-primary, #2563eb);
      background: var(--phz-bg-hover, #f0f7ff);
    }

    .palette-tabs {
      display: flex;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      margin: -12px -12px 12px;
    }

    .palette-tab {
      flex: 1;
      padding: 10px 8px;
      text-align: center;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--phz-text-secondary, #6b7280);
    }

    .palette-tab.active {
      border-bottom-color: var(--phz-primary, #2563eb);
      color: var(--phz-primary, #2563eb);
    }

    .palette-tab:hover:not(.active) {
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .widget-search {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }

    .widget-search:focus {
      outline: none;
      border-color: var(--phz-primary, #2563eb);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }

    .gallery-category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--phz-text-secondary, #6b7280);
      letter-spacing: 0.05em;
      user-select: none;
    }

    .gallery-category-header:hover {
      color: var(--phz-text-primary, #111827);
    }

    .gallery-toggle {
      font-size: 10px;
      transition: transform 0.15s;
    }

    .gallery-toggle.expanded { transform: rotate(90deg); }

    .gallery-card {
      display: flex;
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px;
      cursor: grab;
      margin-bottom: 6px;
      transition: border-color 0.15s, background 0.15s;
    }

    .gallery-card:hover {
      border-color: var(--phz-primary-light, #93c5fd);
      background: var(--phz-bg-hover, #f0f7ff);
    }

    .gallery-card-icon {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      background: var(--phz-bg-canvas, #f3f4f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .gallery-card-info { flex: 1; min-width: 0; }
    .gallery-card-name { font-size: 13px; font-weight: 500; line-height: 1.3; }
    .gallery-card-desc { font-size: 11px; color: var(--phz-text-secondary, #6b7280); line-height: 1.3; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .gallery-empty {
      text-align: center;
      padding: 24px 8px;
      font-size: 13px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .preview-banner {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--phz-preview-bg, #eff6ff);
      border-bottom: 2px solid var(--phz-primary, #2563eb);
      font-size: 13px;
      font-weight: 500;
      color: var(--phz-primary, #2563eb);
    }

    .preview-role-select {
      padding: 4px 8px;
      border: 1px solid var(--phz-primary, #2563eb);
      border-radius: 4px;
      background: var(--phz-bg-surface, #fff);
      font-size: 13px;
      color: var(--phz-text-primary, #111827);
      cursor: pointer;
    }

    .preview-exit-btn {
      margin-left: auto;
      padding: 4px 12px;
      border: 1px solid var(--phz-primary, #2563eb);
      border-radius: 4px;
      background: transparent;
      color: var(--phz-primary, #2563eb);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .preview-exit-btn:hover {
      background: var(--phz-primary, #2563eb);
      color: #fff;
    }

    .toolbar-btn.preview-active {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }

    .suggestion-bar {
      grid-column: 2 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: var(--phz-suggestion-bg, #f0fdf4);
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      font-size: 13px;
      animation: suggestion-fade-in 0.2s ease-out;
    }

    .suggestion-bar .suggestion-label {
      font-weight: 500;
      color: var(--phz-text-primary, #111827);
    }

    .suggestion-bar .suggestion-type {
      font-weight: 600;
      color: var(--phz-primary, #2563eb);
    }

    .suggestion-bar .suggestion-change {
      padding: 2px 8px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .suggestion-bar .suggestion-change:hover {
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .suggestion-bar .suggestion-dismiss {
      margin-left: auto;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      color: var(--phz-text-secondary, #6b7280);
      padding: 2px 6px;
    }

    @keyframes suggestion-fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ---- Freeform canvas styles ---- */

    .canvas-freeform {
      position: relative;
      overflow: auto;
    }

    .canvas-freeform[data-show-dots="true"] {
      background-image: radial-gradient(circle, var(--phz-grid-dot-color, #d1d5db) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .widget-slot-freeform {
      position: relative;
      cursor: grab;
      transition: box-shadow 0.15s;
    }

    .widget-slot-freeform:hover {
      box-shadow: 0 0 0 2px var(--phz-primary, #2563eb);
    }

    .widget-slot-freeform.selected {
      box-shadow: 0 0 0 2px var(--phz-primary, #2563eb);
    }

    .widget-slot-freeform.locked {
      cursor: not-allowed;
      opacity: 0.85;
    }

    .resize-handle {
      position: absolute; width: 8px; height: 8px;
      background: var(--phz-primary, #2563eb); border: 1px solid #fff;
      border-radius: 2px; z-index: 10;
    }
    .resize-handle[data-resize-handle="n"]  { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .resize-handle[data-resize-handle="s"]  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .resize-handle[data-resize-handle="e"]  { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
    .resize-handle[data-resize-handle="w"]  { left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .resize-handle[data-resize-handle="ne"] { top: -4px; right: -4px; cursor: ne-resize; }
    .resize-handle[data-resize-handle="nw"] { top: -4px; left: -4px; cursor: nw-resize; }
    .resize-handle[data-resize-handle="se"] { bottom: -4px; right: -4px; cursor: se-resize; }
    .resize-handle[data-resize-handle="sw"] { bottom: -4px; left: -4px; cursor: sw-resize; }

    .snap-guide {
      position: absolute; z-index: 20; pointer-events: none;
    }
    .snap-guide.horizontal {
      left: 0; right: 0; height: 1px;
      background: var(--phz-primary, #2563eb);
    }
    .snap-guide.vertical {
      top: 0; bottom: 0; width: 1px;
      background: var(--phz-primary, #2563eb);
    }

    .selection-rect {
      position: absolute; z-index: 15;
      border: 1px dashed var(--phz-primary, #2563eb);
      background: rgba(37, 99, 235, 0.08);
      pointer-events: none;
    }

    .drag-ghost {
      pointer-events: none; opacity: 0.4; z-index: 5;
    }

    .canvas-toolbar {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; margin-bottom: 8px;
      background: var(--phz-bg-secondary, #f9fafb);
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 8px; font-size: 13px;
    }
    .canvas-toolbar button {
      background: none; border: 1px solid transparent;
      padding: 4px 8px; border-radius: 4px; cursor: pointer;
      font-size: 12px;
    }
    .canvas-toolbar button:hover { background: var(--phz-bg-tertiary, #f3f4f6); }
    .canvas-toolbar button.active { border-color: var(--phz-primary, #2563eb); color: var(--phz-primary, #2563eb); }
    .canvas-toolbar .separator { width: 1px; height: 20px; background: var(--phz-border, #d1d5db); }
    .canvas-toolbar .zoom-label { font-variant-numeric: tabular-nums; min-width: 40px; text-align: center; }
  `; }
    connectedCallback() {
        super.connectedCallback();
        this._state = this.initialState ?? initialDashboardEditorState(this.name, this.dataSourceId);
        this._undoManager = createDashboardUndoManager(this._state);
        this._syncEditorToFreeform();
        this._initCanvasPointer();
    }
    _initCanvasPointer() {
        if (!this._canvasPointer) {
            this._canvasPointer = new CanvasPointerController(this, this._handleCanvasPointerEvent.bind(this), this._state.freeformConfig);
        }
    }
    /** Sync dashboard editor widget positions into the freeform layout state. */
    _syncEditorToFreeform() {
        let fs = initialFreeformGridState({ ...this._state.freeformConfig });
        for (const w of this._state.widgets) {
            fs = {
                ...fs,
                widgets: [
                    ...fs.widgets,
                    {
                        id: w.id,
                        col: w.position.col,
                        row: w.position.row,
                        colSpan: w.position.colSpan,
                        rowSpan: w.position.rowSpan,
                    },
                ],
            };
        }
        this._freeformState = fs;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._suggestionTimer)
            clearTimeout(this._suggestionTimer);
    }
    _pushUndo(label) {
        this._undoManager.execute(this._state, label);
        this.dispatchEvent(new CustomEvent('state-changed', {
            detail: { state: this._state, dirty: true },
            bubbles: true, composed: true,
        }));
    }
    _undo() {
        const prev = this._undoManager.undo();
        if (prev)
            this._state = prev;
    }
    _redo() {
        const next = this._undoManager.redo();
        if (next)
            this._state = next;
    }
    _addWidget(type) {
        this._state = addWidget(this._state, type);
        this._pushUndo(`Added ${type}`);
    }
    _removeWidget(id) {
        const widget = this._state.widgets.find(w => w.id === id);
        this._state = removeWidget(this._state, id);
        this._pushUndo(`Deleted ${widget?.type ?? 'widget'}`);
    }
    _selectWidget(id) {
        this._state = selectWidget(this._state, id);
    }
    _deselectWidget() {
        this._state = deselectWidget(this._state);
    }
    _duplicateWidget(id) {
        const widget = this._state.widgets.find(w => w.id === id);
        this._state = duplicateWidget(this._state, id);
        this._pushUndo(`Duplicated ${widget?.type ?? 'widget'}`);
    }
    _morphWidget(id, newType) {
        this._state = morphWidget(this._state, id, newType);
        this._pushUndo(`Morphed to ${newType}`);
    }
    _onFieldAdd(e) {
        const detail = e.detail;
        if (!this._state.selectedWidgetId) {
            // Use smart suggestion for auto-creating the widget
            const availableFields = this.schema?.fields ?? [];
            const suggestion = autoCreateWidgetForField(detail.metadata, this._state.widgets, availableFields);
            this._state = addWidget(this._state, suggestion.widgetType);
            const newWidgetId = this._state.widgets[this._state.widgets.length - 1].id;
            this._state = selectWidget(this._state, newWidgetId);
            this._showSuggestionBar(suggestion);
        }
        this._state = handleDashboardFieldAdd(this._state, detail.field, detail.metadata);
        this._pushUndo(`Added field '${detail.field}'`);
    }
    _showSuggestionBar(suggestion) {
        this._lastSuggestion = suggestion;
        if (this._suggestionTimer)
            clearTimeout(this._suggestionTimer);
        this._suggestionTimer = setTimeout(() => {
            this._lastSuggestion = null;
        }, 5000);
    }
    _dismissSuggestion() {
        this._lastSuggestion = null;
        if (this._suggestionTimer)
            clearTimeout(this._suggestionTimer);
    }
    _changeSuggestedType(newType) {
        if (!this._state.selectedWidgetId)
            return;
        this._state = morphWidget(this._state, this._state.selectedWidgetId, newType);
        this._lastSuggestion = null;
        if (this._suggestionTimer)
            clearTimeout(this._suggestionTimer);
        this._pushUndo(`Changed to ${newType}`);
    }
    _onFieldRemove(e) {
        const detail = e.detail;
        this._state = handleDashboardFieldRemove(this._state, detail.field);
        this._pushUndo(`Removed field '${detail.field}'`);
    }
    _togglePalette() {
        this._state = { ...this._state, showFieldPalette: !this._state.showFieldPalette };
    }
    /** Opens the palette and switches to the Widgets tab. */
    _showWidgetGallery() {
        this._state = { ...this._state, showFieldPalette: true };
        this._paletteState = setPaletteTab(this._paletteState, 'widgets');
    }
    _onPaletteTabChange(tab) {
        this._paletteState = setPaletteTab(this._paletteState, tab);
    }
    _onWidgetSearchInput(e) {
        const query = e.target.value;
        this._paletteState = setWidgetSearch(this._paletteState, query);
    }
    _onCategoryToggle(category) {
        this._paletteState = toggleWidgetCategory(this._paletteState, category);
    }
    _onGalleryWidgetClick(entry) {
        const nextCol = this._state.widgets.length;
        this._state = addWidget(this._state, entry.type, {
            row: 0, col: nextCol,
            colSpan: entry.defaultSize.colSpan,
            rowSpan: entry.defaultSize.rowSpan,
        });
        const newWidget = this._state.widgets[this._state.widgets.length - 1];
        if (newWidget) {
            this._state = selectWidget(this._state, newWidget.id);
        }
        this._pushUndo(`Added ${entry.name}`);
    }
    _toggleCriteria() {
        this._criteriaState = toggleCriteria(this._criteriaState);
    }
    _removeCriteriaFilter(filterId) {
        this._criteriaState = removeCriteriaFilter(this._criteriaState, filterId);
    }
    _clearCriteriaFilters() {
        this._criteriaState = clearCriteriaFilters(this._criteriaState);
    }
    _toggleCrossFilterPanel() {
        this._showCrossFilterPanel = !this._showCrossFilterPanel;
    }
    _onVisibilityToggle() {
        this.dispatchEvent(new CustomEvent('visibility-toggle', {
            detail: { state: this._state },
            bubbles: true, composed: true,
        }));
    }
    _togglePreview() {
        this._state = toggleEditorMode(this._state);
    }
    _onPreviewRoleChange(e) {
        const role = e.target.value;
        this._state = setPreviewRole(this._state, role);
    }
    // ========================================================================
    // Multi-Page Dashboard
    // ========================================================================
    _onPageSelect(e) {
        const { pageId } = e.detail;
        this._state = setActivePage(this._state, pageId);
    }
    _onPageAdd(e) {
        const { pageType } = e.detail;
        const labels = {
            canvas: 'Canvas', query: 'Query', sql: 'SQL', report: 'Report',
        };
        const label = `${labels[pageType]} ${this._state.pages.length + 1}`;
        const page = createPage(label, pageType);
        this._state = addPage(this._state, page);
        this._pushUndo(`Added page '${label}'`);
    }
    _onPageRemove(e) {
        const { pageId } = e.detail;
        this._state = removePage(this._state, pageId);
        this._pushUndo('Removed page');
    }
    _onPageReorder(e) {
        const { fromIndex, toIndex } = e.detail;
        this._state = reorderPages(this._state, fromIndex, toIndex);
        this._pushUndo('Reordered pages');
    }
    _onPageRename(e) {
        const { pageId, label } = e.detail;
        this._state = updatePageLabel(this._state, pageId, label);
        this._pushUndo(`Renamed page to '${label}'`);
    }
    _onPageDuplicate(e) {
        const { pageId } = e.detail;
        this._state = duplicatePage(this._state, pageId);
        this._pushUndo('Duplicated page');
    }
    _onSave() {
        this.dispatchEvent(new CustomEvent('save-dashboard', {
            detail: { state: this._state },
            bubbles: true, composed: true,
        }));
    }
    _onPublish() {
        this.dispatchEvent(new CustomEvent('publish-dashboard', {
            detail: { state: this._state },
            bubbles: true, composed: true,
        }));
    }
    render() {
        if (!this._state)
            return nothing;
        const isPreview = this._state.editorMode === 'preview';
        const selectedWidget = this._state.selectedWidgetId
            ? this._state.widgets.find(w => w.id === this._state.selectedWidgetId)
            : undefined;
        return html `
      ${isPreview ? html `
        <div class="preview-banner" role="status" aria-live="polite">
          <span>Previewing as</span>
          <select class="preview-role-select"
            .value=${this._state.previewRole ?? 'viewer'}
            @change=${this._onPreviewRoleChange}
            aria-label="Preview role">
            <option value="admin">Admin</option>
            <option value="author">Author</option>
            <option value="viewer">Viewer</option>
          </select>
          <button class="preview-exit-btn" @click=${this._togglePreview}>Exit Preview</button>
        </div>
      ` : nothing}

      <div class="toolbar">
        <span class="toolbar-title">${this._state.name}</span>
        ${isPreview ? nothing : html `
          <button class="toolbar-btn" @click=${this._togglePalette}>
            ${this._state.showFieldPalette ? 'Hide Fields' : 'Show Fields'}
          </button>
          <button class="toolbar-btn" @click=${this._undo}
            ?disabled=${!this._undoManager?.canUndo} title="Undo">Undo</button>
          <button class="toolbar-btn" @click=${this._redo}
            ?disabled=${!this._undoManager?.canRedo} title="Redo">Redo</button>
          <button class="toolbar-btn" @click=${this._toggleCriteria}>
            ${this._criteriaState.criteriaVisible ? 'Hide Criteria' : 'Criteria'}
          </button>
          <button class="toolbar-btn" @click=${this._toggleCrossFilterPanel}>Cross-filter</button>
          <button class="toolbar-btn" @click=${this._onVisibilityToggle}>Visibility</button>
          <button class="toolbar-btn" @click=${this._onSave}>Save</button>
          <button class="toolbar-btn primary" @click=${this._onPublish}>Publish</button>
        `}
        <button class="toolbar-btn ${isPreview ? 'preview-active' : ''}"
          @click=${this._togglePreview}
          title="${isPreview ? 'Exit Preview' : 'Preview Dashboard'}">
          ${isPreview ? 'Editing' : 'Preview'}
        </button>
      </div>

      <div class="de-body">
      <div class="field-palette ${this._state.showFieldPalette ? '' : 'hidden'}"
           @field-add=${this._onFieldAdd}
           @field-remove=${this._onFieldRemove}>
        <div class="palette-tabs" role="tablist" aria-label="Palette tabs">
          <button class="palette-tab ${this._paletteState.activeTab === 'fields' ? 'active' : ''}"
            role="tab" aria-selected="${this._paletteState.activeTab === 'fields'}"
            @click=${() => this._onPaletteTabChange('fields')}>Fields</button>
          <button class="palette-tab ${this._paletteState.activeTab === 'widgets' ? 'active' : ''}"
            role="tab" aria-selected="${this._paletteState.activeTab === 'widgets'}"
            @click=${() => this._onPaletteTabChange('widgets')}>Widgets</button>
        </div>

        ${this._paletteState.activeTab === 'fields' ? html `
          ${this.adapter ? html `
            <phz-data-source-panel
              .adapter=${this.adapter}
              .sourceId=${this.dataSourceId || undefined}
            ></phz-data-source-panel>
          ` : html `
            <div class="palette-header">Fields</div>
            ${this.schema?.fields.map(f => html `
              <div class="field-item" draggable="true" title="${f.name} (${f.dataType})">
                <span class="field-type-badge ${f.dataType}">${f.dataType.charAt(0).toUpperCase()}</span>
                ${f.name}
              </div>
            `) ?? html `<p style="color: var(--phz-text-secondary, #6b7280); font-size: 13px;">No schema loaded</p>`}
          `}
        ` : html `
          ${this._renderWidgetGallery()}
        `}
      </div>

      <div class="de-center">
      ${this._criteriaState.criteriaVisible ? html `
        <div style="padding: 8px 16px; border-bottom: 1px solid var(--phz-border, #d1d5db); background: var(--phz-bg-surface, #fff); display: flex; align-items: center; gap: 8px; font-size: 13px; flex-shrink: 0;">
          <span style="font-weight: 500;">Criteria:</span>
          ${this._criteriaState.activeFilters.map(f => html `
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border: 1px solid var(--phz-border, #d1d5db); border-radius: 4px;">
              ${f.label}
              <button style="border: none; background: none; cursor: pointer; font-size: 14px;" @click=${() => this._removeCriteriaFilter(f.id)}>x</button>
            </span>
          `)}
          ${this._criteriaState.activeFilters.length > 0 ? html `
            <button style="border: none; background: none; cursor: pointer; font-size: 12px; color: var(--phz-text-secondary, #6b7280);" @click=${this._clearCriteriaFilters}>Clear all</button>
          ` : html `<span style="color: var(--phz-text-secondary, #6b7280);">No criteria applied</span>`}
        </div>
      ` : nothing}

      ${this._showCrossFilterPanel ? html `
        <div style="padding: 8px 16px; border-bottom: 1px solid var(--phz-border, #d1d5db); background: var(--phz-bg-surface, #fff); font-size: 13px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-weight: 600;">Cross-filter Rules</span>
            <span style="color: var(--phz-text-secondary, #6b7280);">
              (${this._state.crossFilterRules.length} rule${this._state.crossFilterRules.length !== 1 ? 's' : ''})
            </span>
          </div>
          ${this._state.crossFilterRules.length > 0 ? html `
            ${this._state.crossFilterRules.map(rule => {
            const matrix = getCrossFilterMatrix([rule], this._state.widgets.map(w => w.id));
            const targets = matrix[rule.sourceWidgetId] ?? [];
            return html `
                <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
                  <span style="font-weight: 500;">${rule.sourceWidgetId}</span>
                  <span style="color: var(--phz-text-secondary, #6b7280);">${rule.bidirectional ? '<->' : '->'}</span>
                  <span>${rule.targetWidgetId === '*' ? 'All widgets' : rule.targetWidgetId}</span>
                  <span style="color: var(--phz-text-tertiary, #9ca3af);">(${targets.length} target${targets.length !== 1 ? 's' : ''})</span>
                  <span style="margin-left: auto; color: ${rule.enabled ? 'var(--phz-success, #16a34a)' : 'var(--phz-text-secondary, #6b7280)'};">
                    ${rule.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              `;
        })}
          ` : html `<span style="color: var(--phz-text-secondary, #6b7280);">No cross-filter rules configured</span>`}
        </div>
      ` : nothing}

      ${this._lastSuggestion ? html `
        <div class="suggestion-bar" role="status" aria-live="polite">
          <span class="suggestion-label">Created:</span>
          <span class="suggestion-type">${this._lastSuggestion.widgetType}</span>
          ${getMorphOptions(this._lastSuggestion.widgetType).length > 0 ? html `
            <select class="suggestion-change"
              aria-label="Change widget type"
              @change=${(e) => {
            const val = e.target.value;
            if (val)
                this._changeSuggestedType(val);
        }}>
              <option value="">Change type</option>
              ${getMorphOptions(this._lastSuggestion.widgetType).map(opt => html `
                <option value=${opt}>${opt}</option>
              `)}
            </select>
          ` : nothing}
          <button class="suggestion-dismiss" @click=${this._dismissSuggestion}
            aria-label="Dismiss suggestion" title="Dismiss">x</button>
        </div>
      ` : nothing}

      ${this._state.pages.length > 1 || !isPreview ? html `
        <phz-page-nav
          style="flex-shrink: 0;"
          .pages=${this._state.pages}
          .activePageId=${this._state.activePageId}
          .navConfig=${this._state.pageNavConfig}
          @page-select=${this._onPageSelect}
          @page-add=${this._onPageAdd}
          @page-remove=${this._onPageRemove}
          @page-reorder=${this._onPageReorder}
          @page-rename=${this._onPageRename}
          @page-duplicate=${this._onPageDuplicate}
        ></phz-page-nav>
      ` : nothing}

      ${this._renderPageContent()}
      </div><!-- .de-center -->

      <div class="config-panel ${this._state.showConfigPanel ? '' : 'hidden'}">
        ${selectedWidget
            ? html `
            <div class="config-header">${selectedWidget.type}</div>
            <div class="config-tabs">
              ${['data', 'style', 'filters', 'visibility'].map(tab => html `
                <button class="config-tab ${this._state.configPanelTab === tab ? 'active' : ''}"
                  @click=${() => { this._state = { ...this._state, configPanelTab: tab }; }}>
                  ${tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              `)}
            </div>
            <div class="config-content">
              ${this._renderConfigContent(selectedWidget)}
            </div>
          `
            : html `<div class="config-content" style="color: var(--phz-text-secondary, #6b7280);">
              Select a widget to configure it</div>`}
      </div>
      </div><!-- .de-body -->
    `;
    }
    // ========================================================================
    // Canvas Pointer Event Handler
    // ========================================================================
    _handleCanvasPointerEvent(event) {
        if (this._state.canvasMode !== 'freeform')
            return;
        switch (event.type) {
            case 'drag-start': {
                if (!event.widgetId)
                    return;
                const widget = this._freeformState.widgets.find(w => w.id === event.widgetId);
                if (!widget)
                    return;
                this._freeformState = startFreeformDrag(this._freeformState, event.widgetId);
                this._canvasInteraction = enterCanvasDragMode(this._canvasInteraction, widget);
                if (!event.shiftKey) {
                    this._state = selectWidget(this._state, event.widgetId);
                }
                else {
                    this._freeformState = toggleFreeformWidgetSelection(this._freeformState, event.widgetId);
                }
                break;
            }
            case 'drag-move': {
                this._freeformState = updateFreeformDrag(this._freeformState, event.deltaCol, event.deltaRow);
                if (this._freeformState.dragOperation) {
                    this._canvasInteraction = updateCanvasGhost(this._canvasInteraction, this._freeformState.dragOperation.currentPlacement);
                    const guides = computeCanvasSnapGuides(this._freeformState.widgets, this._freeformState.dragOperation.currentPlacement);
                    this._canvasInteraction = setCanvasSnapGuides(this._canvasInteraction, guides);
                }
                break;
            }
            case 'drag-end': {
                this._freeformState = commitFreeformDrag(this._freeformState);
                this._canvasInteraction = exitCanvasInteraction(this._canvasInteraction);
                this._syncFreeformToEditor();
                break;
            }
            case 'drag-cancel': {
                this._freeformState = cancelFreeformDrag(this._freeformState);
                this._canvasInteraction = exitCanvasInteraction(this._canvasInteraction);
                break;
            }
            case 'resize-start': {
                if (!event.widgetId || !event.resizeHandle)
                    return;
                this._freeformState = startResize(this._freeformState, event.widgetId, event.resizeHandle);
                const widget = this._freeformState.widgets.find(w => w.id === event.widgetId);
                if (widget) {
                    this._canvasInteraction = enterCanvasResizeMode(this._canvasInteraction, widget);
                }
                break;
            }
            case 'resize-move': {
                this._freeformState = updateResize(this._freeformState, event.deltaCol, event.deltaRow);
                if (this._freeformState.resizing) {
                    this._canvasInteraction = updateCanvasGhost(this._canvasInteraction, this._freeformState.resizing.currentPlacement);
                }
                break;
            }
            case 'resize-end': {
                this._freeformState = commitResize(this._freeformState);
                this._canvasInteraction = exitCanvasInteraction(this._canvasInteraction);
                this._syncFreeformToEditor();
                break;
            }
            case 'widget-click': {
                if (!event.widgetId)
                    return;
                if (event.shiftKey) {
                    this._freeformState = toggleFreeformWidgetSelection(this._freeformState, event.widgetId);
                }
                else {
                    this._state = selectWidget(this._state, event.widgetId);
                    this._freeformState = selectFreeformWidget(this._freeformState, event.widgetId);
                }
                break;
            }
            case 'canvas-click': {
                this._state = deselectWidget(this._state);
                this._freeformState = deselectFreeformWidget(this._freeformState);
                this._canvasInteraction = exitCanvasInteraction(this._canvasInteraction);
                break;
            }
            case 'select-start': {
                this._canvasInteraction = enterCanvasSelectMode(this._canvasInteraction, event.gridCol, event.gridRow);
                break;
            }
            case 'select-move': {
                this._canvasInteraction = updateCanvasSelectionRect(this._canvasInteraction, event.gridCol, event.gridRow);
                break;
            }
            case 'select-end': {
                if (this._canvasInteraction.selectionRect) {
                    const ids = getWidgetsInCanvasSelectionRect(this._freeformState.widgets, this._canvasInteraction.selectionRect);
                    this._freeformState = selectMultipleFreeformWidgets(this._freeformState, ids);
                }
                this._canvasInteraction = exitCanvasInteraction(this._canvasInteraction);
                break;
            }
        }
        // Update toolbar selection count
        this._canvasToolbar = updateCanvasToolbarSelection(this._canvasToolbar, this._freeformState.selectedWidgetIds.length);
    }
    /** Sync freeform widget positions back to the dashboard editor state. */
    _syncFreeformToEditor() {
        for (const fp of this._freeformState.widgets) {
            this._state = moveWidget(this._state, fp.id, {
                row: fp.row,
                col: fp.col,
                colSpan: fp.colSpan,
                rowSpan: fp.rowSpan,
            });
        }
    }
    // ========================================================================
    // Freeform Canvas Rendering
    // ========================================================================
    _cssStyleString(styleObj) {
        return Object.entries(styleObj)
            .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`)
            .join('; ');
    }
    _renderFreeformCanvas() {
        const gridStyle = toCSSGridStyle(this._state.freeformConfig);
        const zoomStyle = `transform: scale(${this._canvasToolbar.zoom}); transform-origin: top left;`;
        return html `
      ${this._renderCanvasToolbar()}
      <div class="canvas-freeform"
        data-show-dots="${this._canvasInteraction.showGridDots}"
        data-mode="${this._state.editorMode}"
        style="${this._cssStyleString(gridStyle)}; ${zoomStyle}">

        ${this._state.widgets.map(w => {
            const fp = this._freeformState.widgets.find(fwp => fwp.id === w.id);
            const widgetStyle = fp ? toWidgetStyle(fp) : {};
            const isSelected = this._freeformState.selectedWidgetIds.includes(w.id);
            return html `
            <div class="widget-slot-freeform ${isSelected ? 'selected' : ''} ${fp?.locked ? 'locked' : ''}"
              data-widget-id="${w.id}"
              style="${this._cssStyleString(widgetStyle)}">

              <div class="widget-placeholder">${w.type}</div>

              ${isSelected && this._state.editorMode === 'edit' ? html `
                ${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(handle => html `
                  <div class="resize-handle" data-resize-handle="${handle}"></div>
                `)}
              ` : nothing}
            </div>
          `;
        })}

        ${this._renderSnapGuides()}
        ${this._renderSelectionRect()}
        ${this._renderDragGhost()}
      </div>
    `;
    }
    _renderCanvasToolbar() {
        return html `
      <div class="canvas-toolbar" role="toolbar" aria-label="Canvas controls">
        <button @click=${() => { this._canvasToolbar = canvasToolbarZoomOut(this._canvasToolbar); this._freeformState = setFreeformZoom(this._freeformState, this._canvasToolbar.zoom); }}
          aria-label="Zoom out">&minus;</button>
        <span class="zoom-label">${Math.round(this._canvasToolbar.zoom * 100)}%</span>
        <button @click=${() => { this._canvasToolbar = canvasToolbarZoomIn(this._canvasToolbar); this._freeformState = setFreeformZoom(this._freeformState, this._canvasToolbar.zoom); }}
          aria-label="Zoom in">+</button>

        <div class="separator"></div>

        <button class="${this._canvasToolbar.gridSnap ? 'active' : ''}"
          @click=${() => { this._canvasToolbar = toggleCanvasToolbarGridSnap(this._canvasToolbar); }}
          aria-label="Toggle grid snap" aria-pressed="${this._canvasToolbar.gridSnap}">Snap</button>

        <button class="${this._canvasToolbar.showGridDots ? 'active' : ''}"
          @click=${() => { this._canvasToolbar = toggleCanvasToolbarGridDots(this._canvasToolbar); this._canvasInteraction = toggleCanvasGridDots(this._canvasInteraction); }}
          aria-label="Toggle grid dots" aria-pressed="${this._canvasToolbar.showGridDots}">Grid</button>

        <div class="separator"></div>

        ${showCanvasAlignmentButtons(this._canvasToolbar) ? html `
          <button @click=${() => { this._freeformState = alignFreeformWidgets(this._freeformState, 'left'); this._syncFreeformToEditor(); }}
            aria-label="Align left">Left</button>
          <button @click=${() => { this._freeformState = alignFreeformWidgets(this._freeformState, 'center-h'); this._syncFreeformToEditor(); }}
            aria-label="Align center">Center</button>
          <button @click=${() => { this._freeformState = alignFreeformWidgets(this._freeformState, 'right'); this._syncFreeformToEditor(); }}
            aria-label="Align right">Right</button>
        ` : nothing}

        ${showCanvasDistributionButtons(this._canvasToolbar) ? html `
          <button @click=${() => { this._freeformState = distributeFreeformWidgets(this._freeformState, 'horizontal'); this._syncFreeformToEditor(); }}
            aria-label="Distribute horizontally">Dist-H</button>
          <button @click=${() => { this._freeformState = distributeFreeformWidgets(this._freeformState, 'vertical'); this._syncFreeformToEditor(); }}
            aria-label="Distribute vertically">Dist-V</button>
        ` : nothing}

        <div class="separator"></div>

        <button class="${this._state.canvasMode === 'freeform' ? 'active' : ''}"
          @click=${() => { this._state = switchCanvasMode(this._state, this._state.canvasMode === 'freeform' ? 'auto-grid' : 'freeform'); this._canvasToolbar = setCanvasToolbarMode(this._canvasToolbar, this._state.canvasMode); }}
          aria-label="Toggle canvas mode">
          ${this._state.canvasMode === 'freeform' ? 'Free-form' : 'Auto-grid'}
        </button>
      </div>
    `;
    }
    _renderSnapGuides() {
        if (this._canvasInteraction.mode !== 'dragging')
            return nothing;
        const { cellSizePx, gapPx } = this._state.freeformConfig;
        const step = cellSizePx + gapPx;
        return html `
      ${this._canvasInteraction.snapGuides.map(guide => {
            if (guide.axis === 'horizontal') {
                return html `<div class="snap-guide horizontal" style="top: ${guide.position * step}px"></div>`;
            }
            return html `<div class="snap-guide vertical" style="left: ${guide.position * step}px"></div>`;
        })}
    `;
    }
    _renderSelectionRect() {
        if (!this._canvasInteraction.selectionRect || this._canvasInteraction.mode !== 'selecting-area')
            return nothing;
        const rect = this._canvasInteraction.selectionRect;
        const { cellSizePx, gapPx } = this._state.freeformConfig;
        const step = cellSizePx + gapPx;
        const left = Math.min(rect.startCol, rect.endCol) * step;
        const top = Math.min(rect.startRow, rect.endRow) * step;
        const width = Math.abs(rect.endCol - rect.startCol) * step;
        const height = Math.abs(rect.endRow - rect.startRow) * step;
        return html `<div class="selection-rect" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px"></div>`;
    }
    _renderDragGhost() {
        if (!this._canvasInteraction.ghostPlacement)
            return nothing;
        const ghost = this._canvasInteraction.ghostPlacement;
        const style = toWidgetStyle(ghost);
        return html `
      <div class="drag-ghost widget-slot-freeform"
        style="${this._cssStyleString(style)}">
      </div>
    `;
    }
    _renderPageContent() {
        const activePage = getActivePage(this._state);
        const pageType = activePage?.pageType ?? 'canvas';
        switch (pageType) {
            case 'query':
                return html `
          <div class="canvas" style="padding: 0;">
            <phz-data-workbench
              .dataSourceId=${this.dataSourceId}
            ></phz-data-workbench>
          </div>
        `;
            case 'sql':
                return html `
          <div class="canvas" style="padding: 0;">
            <phz-sql-editor></phz-sql-editor>
          </div>
        `;
            case 'report':
                return html `
          <div class="canvas" style="padding: 0;">
            <phz-report-editor
              .dataSourceId=${this.dataSourceId}
            ></phz-report-editor>
          </div>
        `;
            case 'canvas':
            default:
                return html `
          <div class="canvas" @click=${(e) => {
                    if (e.target.classList.contains('canvas'))
                        this._deselectWidget();
                }}>
            ${this._state.canvasMode === 'freeform'
                    ? this._renderFreeformCanvas()
                    : html `
                <div class="canvas-grid">
                  ${this._state.widgets.length === 0
                        ? html `<div class="canvas-empty">
                        <p>Drag fields from the palette or add a widget to get started</p>
                        <button class="canvas-empty-btn" @click=${this._showWidgetGallery}>+ Add Widget</button>
                      </div>`
                        : this._state.widgets.map(w => this._renderWidget(w))}
                </div>
              `}
          </div>
        `;
        }
    }
    _renderWidgetGallery() {
        const library = getWidgetLibrary();
        const query = this._paletteState.widgetSearchQuery;
        const lowerQuery = query.toLowerCase();
        // Filter library entries by search query (case-insensitive, matching type/name/description)
        const filtered = lowerQuery
            ? library.filter(e => `${e.type} ${e.name} ${e.description}`.toLowerCase().includes(lowerQuery))
            : library;
        // Group by category
        const groups = new Map();
        for (const entry of filtered) {
            const cat = entry.morphGroup;
            let list = groups.get(cat);
            if (!list) {
                list = [];
                groups.set(cat, list);
            }
            list.push(entry);
        }
        const CATEGORY_LABELS = {
            'category-chart': 'Charts',
            'single-value': 'Single Value',
            'tabular': 'Tables',
            'text': 'Text',
            'navigation': 'Navigation',
        };
        const CATEGORY_ORDER = ['category-chart', 'single-value', 'tabular', 'text', 'navigation'];
        return html `
      <input class="widget-search" type="text" placeholder="Search widgets..."
        .value=${this._paletteState.widgetSearchQuery}
        @input=${this._onWidgetSearchInput}
        aria-label="Search widgets" />
      ${groups.size === 0 ? html `
        <div class="gallery-empty">No widgets match "${query}"</div>
      ` : CATEGORY_ORDER.filter(cat => groups.has(cat)).map(cat => {
            const entries = groups.get(cat) ?? [];
            const isExpanded = this._paletteState.expandedCategories.has(cat) || lowerQuery.length > 0;
            return html `
          <div class="gallery-category-header" @click=${() => this._onCategoryToggle(cat)}
            role="button" aria-expanded="${isExpanded}">
            <span>${CATEGORY_LABELS[cat] ?? cat} (${entries.length})</span>
            <span class="gallery-toggle ${isExpanded ? 'expanded' : ''}">&#9654;</span>
          </div>
          ${isExpanded ? entries.map(entry => html `
            <div class="gallery-card" draggable="true"
              @click=${() => this._onGalleryWidgetClick(entry)}
              title="Add ${entry.name}">
              <div class="gallery-card-icon">${entry.icon.charAt(0).toUpperCase()}</div>
              <div class="gallery-card-info">
                <div class="gallery-card-name">${entry.name}</div>
                <div class="gallery-card-desc">${entry.description}</div>
              </div>
            </div>
          `) : nothing}
        `;
        })}
    `;
    }
    _renderWidget(widget) {
        const isPreview = this._state.editorMode === 'preview';
        const isSelected = !isPreview && this._state.selectedWidgetId === widget.id;
        const dims = widget.dataConfig.dimensions.length;
        const meas = widget.dataConfig.measures.length;
        return html `
      <div class="widget-slot ${isSelected ? 'selected' : ''}"
           style="grid-column: span ${widget.position.colSpan}; grid-row: span ${widget.position.rowSpan};"
           @click=${isPreview ? nothing : (e) => { e.stopPropagation(); this._selectWidget(widget.id); }}
           tabindex="${isPreview ? -1 : 0}" role="${isPreview ? 'presentation' : 'button'}"
           aria-label="${widget.type} widget">

        ${isSelected ? html `
          <div class="widget-actions">
            ${getMorphOptions(widget.type).slice(0, 3).map(opt => html `
              <button class="widget-action-btn"
                @click=${(e) => { e.stopPropagation(); this._morphWidget(widget.id, opt); }}
                title="Morph to ${opt}">${opt.split('-')[0]}</button>
            `)}
            <button class="widget-action-btn"
              @click=${(e) => { e.stopPropagation(); this._duplicateWidget(widget.id); }}
              title="Duplicate">dup</button>
            <button class="widget-action-btn delete"
              @click=${(e) => { e.stopPropagation(); this._removeWidget(widget.id); }}
              title="Delete">×</button>
          </div>
        ` : nothing}

        <div class="widget-header">${widget.config.title || widget.type}</div>
        <div class="widget-type">${widget.type}</div>
        ${(dims > 0 || meas > 0) ? html `
          <div class="widget-data-summary">
            ${dims > 0 ? `${dims} dimension${dims > 1 ? 's' : ''}` : ''}
            ${dims > 0 && meas > 0 ? ' · ' : ''}
            ${meas > 0 ? `${meas} measure${meas > 1 ? 's' : ''}` : ''}
          </div>
        ` : nothing}
      </div>
    `;
    }
    _isChartWidget(type) {
        return type === 'bar-chart' || type === 'trend-line';
    }
    _renderConfigContent(widget) {
        switch (this._state.configPanelTab) {
            case 'data':
                return html `
          <h4 style="margin: 0 0 8px; font-size: 13px;">Dimensions</h4>
          ${widget.dataConfig.dimensions.map(d => html `<div style="font-size: 13px; padding: 4px 0;">${d.field}</div>`)}
          <h4 style="margin: 12px 0 8px; font-size: 13px;">Measures</h4>
          ${widget.dataConfig.measures.map(m => html `<div style="font-size: 13px; padding: 4px 0;">${m.field} (${m.aggregation})</div>`)}
        `;
            case 'style':
                return html `
          <p style="font-size: 13px; color: var(--phz-text-secondary, #6b7280);">Style configuration for ${widget.type}</p>
          ${this._isChartWidget(widget.type) ? html `
            <h4 style="margin: 12px 0 8px; font-size: 13px;">Overlays</h4>
            <p style="font-size: 12px; color: var(--phz-text-secondary, #6b7280);">
              Add reference lines, trend lines, and threshold bands to this chart.
            </p>
          ` : nothing}
        `;
            case 'filters':
                return html `<p style="font-size: 13px; color: var(--phz-text-secondary, #6b7280);">Widget-level filters</p>`;
            case 'visibility':
                return this._renderVisibilityConfig(widget);
        }
    }
    _renderVisibilityConfig(widget) {
        const condition = this._visibilityState.conditions[widget.id];
        const OPERATORS = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not-in', 'is-set', 'is-not-set'];
        const OPERATOR_LABELS = {
            'eq': 'Equals', 'ne': 'Not equals', 'gt': 'Greater than', 'lt': 'Less than',
            'gte': 'Greater or equal', 'lte': 'Less or equal', 'in': 'In list', 'not-in': 'Not in list',
            'is-set': 'Is set', 'is-not-set': 'Is not set',
        };
        const noValueOps = new Set(['is-set', 'is-not-set']);
        if (condition) {
            return html `
        <h4 style="margin: 0 0 8px; font-size: 13px;">Visibility Condition</h4>
        <div style="font-size: 13px; padding: 8px; border: 1px solid var(--phz-border, #d1d5db); border-radius: 4px;">
          <div style="margin-bottom: 4px;"><strong>Field:</strong> ${condition.expression.field}</div>
          <div style="margin-bottom: 4px;"><strong>Operator:</strong> ${OPERATOR_LABELS[condition.expression.operator]}</div>
          ${!noValueOps.has(condition.expression.operator) ? html `
            <div style="margin-bottom: 4px;"><strong>Value:</strong> ${String(condition.expression.value)}</div>
          ` : nothing}
          <div style="margin-bottom: 4px;"><strong>Evaluate against:</strong> ${condition.evaluateAgainst}</div>
          <div><strong>Hidden behavior:</strong> ${condition.hiddenBehavior}</div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="toolbar-btn" @click=${() => this._editVisibility(widget.id)}>Edit</button>
          <button class="toolbar-btn" style="color: var(--phz-danger, #dc2626);"
            @click=${() => this._removeVisibility(widget.id)}>Remove</button>
        </div>
      `;
        }
        return html `
      <h4 style="margin: 0 0 8px; font-size: 13px;">Visibility Condition</h4>
      <p style="font-size: 12px; color: var(--phz-text-secondary, #6b7280); margin-bottom: 12px;">
        Show or hide this widget based on a filter value or data result.
      </p>
      <button class="toolbar-btn" @click=${() => this._editVisibility(widget.id)}>
        Add Condition
      </button>
    `;
    }
    _editVisibility(widgetId) {
        this._visibilityState = startEditCondition(this._visibilityState, widgetId);
    }
    _commitVisibility() {
        this._visibilityState = commitCondition(this._visibilityState);
        this._pushUndo('Updated visibility condition');
    }
    _cancelVisibility() {
        this._visibilityState = cancelEditCondition(this._visibilityState);
    }
    _removeVisibility(widgetId) {
        this._visibilityState = removeVisibilityCondition(this._visibilityState, widgetId);
        this._pushUndo('Removed visibility condition');
    }
};
__decorate([
    property({ type: String })
], PhzDashboardEditor.prototype, "name", void 0);
__decorate([
    property({ type: String })
], PhzDashboardEditor.prototype, "dataSourceId", void 0);
__decorate([
    property({ type: Object })
], PhzDashboardEditor.prototype, "schema", void 0);
__decorate([
    property({ type: Object })
], PhzDashboardEditor.prototype, "initialState", void 0);
__decorate([
    property({ attribute: false })
], PhzDashboardEditor.prototype, "adapter", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_state", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_criteriaState", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_crossFilterState", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_showCrossFilterPanel", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_visibilityState", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_paletteState", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_lastSuggestion", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_canvasInteraction", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_canvasToolbar", void 0);
__decorate([
    state()
], PhzDashboardEditor.prototype, "_freeformState", void 0);
PhzDashboardEditor = __decorate([
    safeCustomElement('phz-dashboard-editor')
], PhzDashboardEditor);
export { PhzDashboardEditor };
//# sourceMappingURL=phz-dashboard-editor.js.map