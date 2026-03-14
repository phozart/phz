/**
 * @phozart/viewer — Read-only consumption shell
 *
 * Headless state machines, Lit components, and configuration
 * for the viewer persona. No workspace dependency.
 */
export { type ViewerScreen, type NavigationEntry, type ViewerShellState, createViewerShellState, navigateTo, navigateBack, navigateForward, canGoBack, canGoForward, setError, setEmpty, setLoading, setAttentionCount, setViewerContext, setFilterContext, setMobileLayout, } from './viewer-state.js';
export { type ViewerRoute, parseRoute, buildRoutePath, entryToRoute, routeToEntry, routesEqual, screenForArtifactType, } from './viewer-navigation.js';
export { type ViewerFeatureFlags, type ViewerBranding, type ViewerShellConfig, createViewerShellConfig, createDefaultFeatureFlags, } from './viewer-config.js';
export { type CatalogSortField, type CatalogSortDirection, type CatalogSort, type CatalogState, createCatalogState, applyFilters, setSearchQuery, setTypeFilter, setCatalogSort, setCatalogPage, setCatalogArtifacts, toggleFavorite, toggleViewMode, getCurrentPage, getTotalPages, addRecentItem, getRecentArtifacts, loadPersistedFavorites, loadPersistedRecents, } from './screens/catalog-state.js';
export { type DashboardWidgetView, type DashboardViewState, createDashboardViewState, loadDashboard, setWidgetLoading, setWidgetError, applyCrossFilter, clearCrossFilter, clearAllCrossFilters, toggleFullscreen, toggleWidgetExpanded, refreshDashboard, } from './screens/dashboard-state.js';
export { type ReportColumnView, type ReportSort, type ReportViewState, type HeaderActionType, type ColumnHeaderAction, createReportViewState, loadReport, setReportData, setReportSort, toggleReportSort, setReportPage, setReportPageSize, setReportSearch, toggleColumnVisibility, setExporting, getReportTotalPages, getVisibleColumns, addSortColumn, removeSortColumn, clearAllSorts, getSortIndex, setHoveredColumn, computeHeaderActions, } from './screens/report-state.js';
export { type ExplorerPreviewMode, type ExplorerScreenState, createExplorerScreenState, setDataSources, selectDataSource, setFields, setExplorer, setPreviewMode, setSuggestedChartType, setFieldSearch, getExplorerSnapshot, getFilteredFields, } from './screens/explorer-state.js';
export { type AttentionDropdownState, createAttentionDropdownState, setAttentionItems, toggleAttentionDropdown, openAttentionDropdown, closeAttentionDropdown, markItemsAsRead, markAllAsRead, dismissItem, setAttentionTypeFilter, getFilteredItems, } from './screens/attention-state.js';
export { type CommandItem, type CommandPaletteState, type GroupedCommands, createCommandPaletteState, openPalette, closePalette, togglePalette, setQuery, selectNext, selectPrevious, executeSelected, getFilteredCommands, } from './screens/command-palette-state.js';
export { type FilterBarState, createFilterBarState, setFilterDefs, openFilter, closeFilter, setFilterValue, clearFilterValue, clearAllFilters, setPresets, applyPreset, toggleFilterBarCollapsed, getActiveFilterCount, hasFilterValue, } from './screens/filter-bar-state.js';
export { type ViewManagerState, createViewManagerState, openViewManager, closeViewManager, setViews, setActiveView, setDirty, startRename, updateRenameName, finishRename, cancelRename, } from './screens/view-manager-state.js';
export { type FreshnessLevel, type DataFreshnessState, createDataFreshnessState, recordRefresh, computeFreshnessLevel, getFreshnessAge, formatFreshnessLabel, setFreshnessThresholds, enableAutoRefresh, disableAutoRefresh, isRefreshDue, } from './screens/data-freshness-state.js';
export type { RowDetailField, RowDetailState, RowDetailColumnInput } from './screens/row-detail-state.js';
export { createRowDetailState, rowToDetailFields, expandRowDetail, collapseRowDetail, toggleRowDetail, navigateToNextRow, navigateToPrevRow, setDetailSearch, togglePinnedField, clearPinnedFields, getVisibleDetailFields, isRowExpanded, getExpandedRowIndex, scrollToDetailField, } from './screens/row-detail-state.js';
export type { ActiveFilterChip, ActiveFilterVisibilityState, FilterDefinitionInput, FilterValueInput } from './screens/active-filter-state.js';
export { createActiveFilterVisibilityState, computeFilterChips, formatFilterValue, setFilterChips, expandChip, collapseChip, toggleCollapsed, removeChip, getChipCount, getExpandedChip, } from './screens/active-filter-state.js';
export type { WidgetHighlightRole, CrossFilterHighlightState } from './screens/cross-filter-highlight-state.js';
export { createCrossFilterHighlightState, activateHighlighting, deactivateHighlighting, setHoverWidget, clearHoverWidget, getWidgetRole, isHighlightActive, getHighlightedWidgetIds, } from './screens/cross-filter-highlight-state.js';
export type { HelpShortcutEntry, HelpShortcutCategory, KeyboardHelpState } from './screens/keyboard-help-state.js';
export { createKeyboardHelpState, openKeyboardHelp, closeKeyboardHelp, toggleKeyboardHelp, setHelpSearch, setHelpCategory, getFilteredShortcuts, getShortcutsByCategory, DEFAULT_HELP_SHORTCUTS, } from './screens/keyboard-help-state.js';
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