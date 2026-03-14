/**
 * @phozart/workspace — Dashboard Editor Component
 *
 * Field palette (left 260px) + Canvas (center CSS grid) + Config panel (right 360px).
 * Floating toolbar on selected widget: Morph | Configure | Duplicate | Delete.
 */
import { LitElement, nothing } from 'lit';
import type { DataAdapter } from '@phozart/shared';
import type { DataSourceSchema } from '../data-adapter.js';
import { type DashboardEditorState } from './dashboard-editor-state.js';
export declare class PhzDashboardEditor extends LitElement {
    name: string;
    dataSourceId: string;
    schema?: DataSourceSchema;
    initialState?: DashboardEditorState;
    /** DataAdapter for loading fields from data sources. When set, the data source panel loads fields automatically. */
    adapter?: DataAdapter;
    private _state;
    private _criteriaState;
    private _crossFilterState;
    private _showCrossFilterPanel;
    private _visibilityState;
    private _paletteState;
    private _lastSuggestion;
    private _canvasInteraction;
    private _canvasToolbar;
    private _freeformState;
    private _undoManager;
    private _suggestionTimer?;
    private _canvasPointer?;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private _initCanvasPointer;
    /** Sync dashboard editor widget positions into the freeform layout state. */
    private _syncEditorToFreeform;
    disconnectedCallback(): void;
    private _pushUndo;
    private _undo;
    private _redo;
    private _addWidget;
    private _removeWidget;
    private _selectWidget;
    private _deselectWidget;
    private _duplicateWidget;
    private _morphWidget;
    private _onFieldAdd;
    private _showSuggestionBar;
    private _dismissSuggestion;
    private _changeSuggestedType;
    private _onFieldRemove;
    private _togglePalette;
    /** Opens the palette and switches to the Widgets tab. */
    private _showWidgetGallery;
    private _onPaletteTabChange;
    private _onWidgetSearchInput;
    private _onCategoryToggle;
    private _onGalleryWidgetClick;
    private _toggleCriteria;
    private _removeCriteriaFilter;
    private _clearCriteriaFilters;
    private _toggleCrossFilterPanel;
    private _onVisibilityToggle;
    private _togglePreview;
    private _onPreviewRoleChange;
    private _onPageSelect;
    private _onPageAdd;
    private _onPageRemove;
    private _onPageReorder;
    private _onPageRename;
    private _onPageDuplicate;
    private _onSave;
    private _onPublish;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
    private _handleCanvasPointerEvent;
    /** Sync freeform widget positions back to the dashboard editor state. */
    private _syncFreeformToEditor;
    private _cssStyleString;
    private _renderFreeformCanvas;
    private _renderCanvasToolbar;
    private _renderSnapGuides;
    private _renderSelectionRect;
    private _renderDragGhost;
    private _renderPageContent;
    private _renderWidgetGallery;
    private _renderWidget;
    private _isChartWidget;
    private _renderConfigContent;
    private _renderVisibilityConfig;
    private _editVisibility;
    private _commitVisibility;
    private _cancelVisibility;
    private _removeVisibility;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-dashboard-editor': PhzDashboardEditor;
    }
}
//# sourceMappingURL=phz-dashboard-editor.d.ts.map