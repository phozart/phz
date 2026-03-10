/**
 * @phozart/phz-editor — Editor Shell Package
 *
 * BI authoring environment for creating dashboards, reports,
 * alerts, and sharing artifacts. Designed for the author persona.
 *
 * This barrel exports all headless state machines, types, and
 * Web Components. Import from specific modules for tree-shaking.
 */
// ========================================================================
// Editor shell state machine (B-2.02)
// ========================================================================
export { createEditorShellState, navigateTo, navigateBack, navigateForward, toggleEditMode, setEditMode, markUnsavedChanges, markSaved, pushUndo, undo, redo, setLoading, setError, clearError, setMeasures, toggleAutoSave, setAutoSaveDebounce, canUndo, canRedo, canGoBack, canGoForward, } from './editor-state.js';
// ========================================================================
// Editor navigation (B-2.02)
// ========================================================================
export { parseRoute, buildRoutePath, buildBreadcrumbs, getScreenLabel, buildEditorDeepLink, } from './editor-navigation.js';
// ========================================================================
// Editor config (B-2.02)
// ========================================================================
export { createEditorShellConfig, validateEditorConfig, } from './editor-config.js';
// ========================================================================
// Catalog screen state (B-2.04)
// ========================================================================
export { createCatalogState, setCatalogItems, searchCatalog, filterCatalogByType, filterCatalogByVisibility, sortCatalog, openCreateDialog, closeCreateDialog, setCatalogLoading, setCatalogError, } from './screens/catalog-state.js';
// ========================================================================
// Dashboard view state (B-2.05)
// ========================================================================
export { createDashboardViewState, setDashboardData, setPermissions, expandWidget, collapseWidget, setDashboardViewLoading, setDashboardViewError, } from './screens/dashboard-view-state.js';
// ========================================================================
// Dashboard edit state (B-2.06)
// ========================================================================
export { createDashboardEditState, addWidget, removeWidget, updateWidgetConfig, moveWidget, resizeWidget, selectWidget, deselectWidget, startDrag, updateDragTarget, endDrag, cancelDrag, toggleConfigPanel, toggleMeasurePalette, setGridLayout, setDashboardTitle, setDashboardDescription, markDashboardSaved, } from './screens/dashboard-edit-state.js';
// ========================================================================
// Report edit state (B-2.09)
// ========================================================================
export { createReportEditState, addReportColumn, removeReportColumn, updateReportColumn, reorderReportColumns, addReportFilter, removeReportFilter, updateReportFilter, setReportSorts, toggleReportPreview, setReportPreviewData, clearReportPreview, setReportTitle, setReportDescription, setReportDataSource, markReportSaved, setReportLoading, setReportError, } from './screens/report-state.js';
// ========================================================================
// Explorer state (B-2.10)
// ========================================================================
export { createExplorerState, addDimension, removeDimension, addMeasure, removeMeasure, addExplorerFilter, removeExplorerFilter, setExplorerSort, setExplorerLimit, setExplorerExecuting, setExplorerResults, setSuggestedChartType, openSaveDialog, updateSaveTarget, closeSaveDialog, setExplorerDataSource, setExplorerError, } from './screens/explorer-state.js';
// ========================================================================
// Measure palette state (B-2.07)
// ========================================================================
export { createMeasurePaletteState, searchMeasures, filterByCategory, setActiveTab, selectPaletteItem, deselectPaletteItem, refreshPaletteData, } from './authoring/measure-palette-state.js';
// ========================================================================
// Config panel state (B-2.08)
// ========================================================================
export { createConfigPanelState, setConfigValue, removeConfigValue, setFullConfig, setAllowedFields, validateConfig, isConfigValid, setExpandedSection, setConfigPanelLoading, markConfigSaved, } from './authoring/config-panel-state.js';
// ========================================================================
// Sharing flow state (B-2.11)
// ========================================================================
export { createSharingFlowState, setTargetVisibility, addShareTarget, removeShareTarget, clearShareTargets, setShareSearchQuery, setShareSearchResults, setSharingSaving, markSharingSaved, setSharingError, setCanPublish, hasVisibilityChanged, canSaveSharing, } from './authoring/sharing-state.js';
// ========================================================================
// Alert & subscription state (B-2.12)
// ========================================================================
export { createAlertSubscriptionState, setAlertSubTab, searchAlertsSubs, setAlerts, addAlert, updateAlert, removeAlert, toggleAlertEnabled, setSubscriptions, addSubscription, updateSubscription, removeSubscription, toggleSubscriptionEnabled, openCreateAlert, closeCreateAlert, openCreateSubscription, closeCreateSubscription, startEditingAlert, startEditingSubscription, cancelEditing, setAlertSubLoading, setAlertSubError, } from './authoring/alert-subscription-state.js';
// ========================================================================
// Web Components (side-effects: custom element registration)
// ========================================================================
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
//# sourceMappingURL=index.js.map