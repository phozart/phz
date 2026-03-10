/**
 * @phozart/phz-viewer — Read-only consumption shell
 *
 * Headless state machines, Lit components, and configuration
 * for the viewer persona. No workspace dependency.
 */
export { type ViewerScreen, type NavigationEntry, type ViewerShellState, createViewerShellState, navigateTo, navigateBack, navigateForward, canGoBack, canGoForward, setError, setEmpty, setLoading, setAttentionCount, setViewerContext, setFilterContext, setMobileLayout, } from './viewer-state.js';
export { type ViewerRoute, parseRoute, buildRoutePath, entryToRoute, routeToEntry, routesEqual, screenForArtifactType, } from './viewer-navigation.js';
export { type ViewerFeatureFlags, type ViewerBranding, type ViewerShellConfig, createViewerShellConfig, createDefaultFeatureFlags, } from './viewer-config.js';
export { type CatalogSortField, type CatalogSortDirection, type CatalogSort, type CatalogState, createCatalogState, applyFilters, setSearchQuery, setTypeFilter, setCatalogSort, setCatalogPage, setCatalogArtifacts, toggleFavorite, toggleViewMode, getCurrentPage, getTotalPages, } from './screens/catalog-state.js';
export { type DashboardWidgetView, type DashboardViewState, createDashboardViewState, loadDashboard, setWidgetLoading, setWidgetError, applyCrossFilter, clearCrossFilter, clearAllCrossFilters, toggleFullscreen, toggleWidgetExpanded, refreshDashboard, } from './screens/dashboard-state.js';
export { type ReportColumnView, type ReportSort, type ReportViewState, createReportViewState, loadReport, setReportData, setReportSort, toggleReportSort, setReportPage, setReportPageSize, setReportSearch, toggleColumnVisibility, setExporting, getReportTotalPages, getVisibleColumns, } from './screens/report-state.js';
export { type ExplorerPreviewMode, type ExplorerScreenState, createExplorerScreenState, setDataSources, selectDataSource, setFields, setExplorer, setPreviewMode, setSuggestedChartType, setFieldSearch, getExplorerSnapshot, getFilteredFields, } from './screens/explorer-state.js';
export { type AttentionDropdownState, createAttentionDropdownState, setAttentionItems, toggleAttentionDropdown, openAttentionDropdown, closeAttentionDropdown, markItemsAsRead, markAllAsRead, dismissItem, setAttentionTypeFilter, getFilteredItems, } from './screens/attention-state.js';
export { type FilterBarState, createFilterBarState, setFilterDefs, openFilter, closeFilter, setFilterValue, clearFilterValue, clearAllFilters, setPresets, applyPreset, toggleFilterBarCollapsed, getActiveFilterCount, hasFilterValue, } from './screens/filter-bar-state.js';
export { PhzViewerShell } from './components/phz-viewer-shell.js';
export { PhzViewerCatalog } from './components/phz-viewer-catalog.js';
export { PhzViewerDashboard } from './components/phz-viewer-dashboard.js';
export { PhzViewerReport } from './components/phz-viewer-report.js';
export { PhzViewerExplorer } from './components/phz-viewer-explorer.js';
export { PhzAttentionDropdown } from './components/phz-attention-dropdown.js';
export { PhzFilterBar } from './components/phz-filter-bar.js';
export { PhzViewerError } from './components/phz-viewer-error.js';
export { PhzViewerEmpty } from './components/phz-viewer-empty.js';
export { PhzGridView, specToColumn } from './components/phz-grid-view.js';
export type { GridViewColumnSpec, GridViewDataSource, GridViewDefinition } from './components/phz-grid-view.js';
export { PhzDashboardView } from './components/phz-dashboard-view.js';
export type { DashboardViewConfig, DashboardViewWidget } from './components/phz-dashboard-view.js';
export { PhzReportEmbed } from './components/phz-report-view.js';
export type { ReportViewConfig } from './components/phz-report-view.js';
//# sourceMappingURL=index.d.ts.map