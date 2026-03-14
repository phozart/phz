/**
 * @phozart/editor — Editor Shell Package
 *
 * BI authoring environment for creating dashboards, reports,
 * alerts, and sharing artifacts. Designed for the author persona.
 *
 * This barrel exports all headless state machines, types, and
 * Web Components. Import from specific modules for tree-shaking.
 */
export { createEditorShellState, navigateTo, navigateBack, navigateForward, toggleEditMode, setEditMode, markUnsavedChanges, markSaved, pushUndo, undo, redo, setLoading, setError, clearError, setMeasures, toggleAutoSave, setAutoSaveDebounce, canUndo, canRedo, canGoBack, canGoForward, } from './editor-state.js';
export type { EditorScreen, NavigationEntry, EditorShellState, } from './editor-state.js';
export { parseRoute, buildRoutePath, buildBreadcrumbs, getScreenLabel, buildEditorDeepLink, } from './editor-navigation.js';
export type { EditorRoute, Breadcrumb, } from './editor-navigation.js';
export { createEditorShellConfig, validateEditorConfig, } from './editor-config.js';
export type { EditorFeatureFlags, EditorShellConfig, ConfigValidationResult, } from './editor-config.js';
export { createCatalogState, setCatalogItems, searchCatalog, filterCatalogByType, filterCatalogByVisibility, sortCatalog, openCreateDialog, closeCreateDialog, setCatalogLoading, setCatalogError, } from './screens/catalog-state.js';
export type { CatalogSortField, CatalogSortOrder, CatalogItem, CatalogState, } from './screens/catalog-state.js';
export { createDashboardViewState, setDashboardData, setPermissions, expandWidget, collapseWidget, setDashboardViewLoading, setDashboardViewError, } from './screens/dashboard-view-state.js';
export type { DashboardViewState, } from './screens/dashboard-view-state.js';
export { createDashboardEditState, addWidget, removeWidget, updateWidgetConfig, moveWidget, resizeWidget, selectWidget, deselectWidget, startDrag, updateDragTarget, endDrag, cancelDrag, toggleConfigPanel, toggleMeasurePalette, setGridLayout, setDashboardTitle, setDashboardDescription, markDashboardSaved, } from './screens/dashboard-edit-state.js';
export type { GridLayout, DragState, DashboardEditState, } from './screens/dashboard-edit-state.js';
export { createReportEditState, addReportColumn, removeReportColumn, updateReportColumn, reorderReportColumns, addReportFilter, removeReportFilter, updateReportFilter, setReportSorts, toggleReportPreview, setReportPreviewData, clearReportPreview, setReportTitle, setReportDescription, setReportDataSource, markReportSaved, setReportLoading, setReportError, } from './screens/report-state.js';
export type { ReportColumnConfig, ReportFilterConfig, ReportSortConfig, ReportEditState, } from './screens/report-state.js';
export { createExplorerState, addDimension, removeDimension, addMeasure, removeMeasure, addExplorerFilter, removeExplorerFilter, setExplorerSort, setExplorerLimit, setExplorerExecuting, setExplorerResults, setSuggestedChartType, openSaveDialog, updateSaveTarget, closeSaveDialog, setExplorerDataSource, setExplorerError, } from './screens/explorer-state.js';
export type { SaveTargetType, SaveTarget, ExplorerState, } from './screens/explorer-state.js';
export { createMeasurePaletteState, searchMeasures, filterByCategory, setActiveTab, selectPaletteItem, deselectPaletteItem, refreshPaletteData, } from './authoring/measure-palette-state.js';
export type { MeasurePaletteState, } from './authoring/measure-palette-state.js';
export { createConfigPanelState, setConfigValue, removeConfigValue, setFullConfig, setAllowedFields, validateConfig, isConfigValid, setExpandedSection, setConfigPanelLoading, markConfigSaved, } from './authoring/config-panel-state.js';
export type { ValidationError, FieldConstraint, ConfigPanelState, } from './authoring/config-panel-state.js';
export { createSharingFlowState, setTargetVisibility, addShareTarget, removeShareTarget, clearShareTargets, setShareSearchQuery, setShareSearchResults, setSharingSaving, markSharingSaved, setSharingError, setCanPublish, hasVisibilityChanged, canSaveSharing, } from './authoring/sharing-state.js';
export type { SharingFlowState, } from './authoring/sharing-state.js';
export { createAlertSubscriptionState, setAlertSubTab, searchAlertsSubs, setAlerts, addAlert, updateAlert, removeAlert, toggleAlertEnabled, setSubscriptions, addSubscription, updateSubscription, removeSubscription, toggleSubscriptionEnabled, openCreateAlert, closeCreateAlert, openCreateSubscription, closeCreateSubscription, startEditingAlert, startEditingSubscription, cancelEditing, setAlertSubLoading, setAlertSubError, } from './authoring/alert-subscription-state.js';
export type { AlertSubscriptionState, } from './authoring/alert-subscription-state.js';
export { PhzEditorShell } from './components/phz-editor-shell.js';
export { PhzEditorCatalog } from './components/phz-editor-catalog.js';
export { PhzEditorDashboard } from './components/phz-editor-dashboard.js';
export { PhzEditorReport } from './components/phz-editor-report.js';
export { PhzEditorExplorer } from './components/phz-editor-explorer.js';
export { PhzMeasurePalette } from './components/phz-measure-palette.js';
export { PhzEditorConfigPanel } from './components/phz-config-panel.js';
/** @deprecated Use PhzEditorConfigPanel instead. */
export { PhzEditorConfigPanel as PhzConfigPanel } from './components/phz-config-panel.js';
export { PhzSharingFlow } from './components/phz-sharing-flow.js';
export { PhzAlertSubscription } from './components/phz-alert-subscription.js';
//# sourceMappingURL=index.d.ts.map