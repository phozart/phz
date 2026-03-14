/**
 * @phozart/workspace/engine-admin — Engine Admin Components
 *
 * All engine-admin components migrated into the workspace package.
 */
export { PhzDataBrowser } from './components/phz-data-browser.js';
export { PhzKPIDesigner } from './components/phz-kpi-designer.js';
export { PhzMetricBuilder } from './components/phz-metric-builder.js';
export { PhzReportDesigner } from './components/phz-report-designer.js';
export { PhzDashboardBuilder } from './components/phz-dashboard-builder.js';
export { PhzSelectionFieldManager } from './components/phz-selection-field-manager.js';
export { PhzPivotDesigner } from './components/phz-pivot-designer.js';
export { PhzEngineAdmin } from './components/phz-engine-admin.js';
export { PhzDashboardStudio } from './components/phz-dashboard-studio.js';
export { PhzWidgetConfigPanel } from './components/phz-widget-config-panel.js';
export { PhzGlobalFilterBar } from './components/phz-global-filter-bar.js';
export { PhzSlideOver } from './components/phz-slide-over.js';
export { PhzDataModelSidebar } from './components/phz-data-model-sidebar.js';
export { PhzDataModelModal } from './components/phz-data-model-modal.js';
export { PhzExpressionBuilder } from './components/phz-expression-builder.js';
export { PhzParameterForm } from './components/phz-parameter-form.js';
export { PhzCalculatedFieldForm } from './components/phz-calculated-field-form.js';
export { PhzMetricForm } from './components/phz-metric-form.js';
export { PhzKpiForm } from './components/phz-kpi-form.js';
export { PhzFilterStudio } from './components/phz-filter-studio.js';
export { PhzFilterPicker } from './components/phz-filter-picker.js';
export { PhzSaveIndicator } from './components/phz-save-indicator.js';
export { swapWidgetPositions, moveWidgetToPosition, recalculateGridPositions, buildLayoutChangeDetail } from './drag-drop.js';
export { UndoManager } from './undo-manager.js';
export { UndoController } from './undo-controller.js';
export { SaveController } from './save-controller.js';
export { evaluateSampleRows, inferResultType, buildValidationWarnings, formatEvalError } from './expression-preview.js';
export { PhzShareDialog, SHARE_TABS } from './components/phz-share-dialog.js';
export type { ShareTab } from './components/phz-share-dialog.js';
export { PhzDataConnector } from './components/phz-data-connector.js';
export { detectSchema, detectDelimiter, parseCSVPreview, validateSourceConfig } from './data-source-detector.js';
export type { DetectedField, CSVParseOptions, CSVParseResult, ValidationResult, SourceType } from './data-source-detector.js';
export type { DashboardEditorMode, DashboardEditorState, EditorWidgetPlacement, EditorGlobalFilter } from './dashboard-editor-state.js';
export { createDashboardEditorState, enableAdvancedMode, toggleDataModel, toggleToolbar, addWidget, removeWidget, selectWidget, updateWidgetConfig, setName, setDescription, isAdvancedFeatureUsed, } from './dashboard-editor-state.js';
export type { SuggestionKind, AutocompleteSuggestion, AutocompleteContext, ExpressionAutocompleteState } from './expression-autocomplete-state.js';
export type { AcceptResult } from './expression-autocomplete-state.js';
export { createExpressionAutocompleteState, computeSuggestions, selectNext, selectPrevious, acceptSuggestion, dismissAutocomplete, getSelectedSuggestion, } from './expression-autocomplete-state.js';
export type { GraphNodeKind, GraphNode, GraphEdge, HighlightDirection, DependencyGraphViewState } from './dependency-graph-view-state.js';
export { createDependencyGraphViewState, selectNode, clearSelection, highlightUpstream, highlightDownstream, highlightBoth, toggleLayerVisibility, setGraphSearch, getVisibleNodes, getVisibleEdges, } from './dependency-graph-view-state.js';
//# sourceMappingURL=index.d.ts.map