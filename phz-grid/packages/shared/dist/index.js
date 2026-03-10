/**
 * @phozart/phz-shared — Shared infrastructure for all shells
 *
 * This package contains adapter interfaces, design system, artifact types,
 * runtime coordination, and shared type definitions used by workspace,
 * viewer, and editor packages.
 *
 * Sub-path imports (e.g., '@phozart/phz-shared/adapters') are the preferred
 * way to consume this package. The barrel re-export here is for convenience
 * but uses explicit re-exports to avoid duplicate member collisions.
 */
// Adapter interfaces (canonical source for DataAdapter, DataQuery, DataResult, etc.)
export * from './adapters/index.js';
// Type definitions (exclude types already exported by adapters)
export { isUserTarget, isRoleTarget, isTeamTarget, isEveryoneTarget, matchesShareTarget, matchesAnyShareTarget, isSharedWith, createFieldEnrichment, mergeFieldMetadata, createDefaultFilterPresetValue, applyExpression, evaluateMatchRule, createDefaultFilterValueHandling, resolveStaticDefault, createEmptyAlertSummary, createDefaultGracePeriodConfig, isGracePeriodValid, clampGracePeriod, isTerminalStatus, createAsyncReportJob, isAsyncReportExpired, hasAsyncSupport, createSubscription, describeSchedule, buildSubscriptionDeepLink, createErrorState, isRetryableError, createDefaultErrorStateConfig, pickRandomMessage, formatErrorForClipboard, createEmptyState, createDefaultEmptyStateConfig, DEFAULT_EMPTY_STATES, getViewSwitchingMode, createDefaultExpandableConfig, createDefaultContainerBoxConfig, evaluateNodeStatus, createApiEndpoint, ERROR_MESSAGE_POOLS, EMPTY_STATE_MESSAGE_POOLS, getRandomMessage, getAllMessages, getScenarios, countMessages, resolveAlertVisualState, getAlertTokens, degradeAlertMode, createDefaultAlertConfig, filterAttentionItems, computeAttentionFacets, createCellRendererRegistry, resolveSemanticRole, groupFieldsByRole, createBookmarkId, isValidBookmark, mergeInteractionState, } from './types/index.js';
// Artifact metadata types (ViewerContext already in adapters — exclude it)
export { isVisibleToViewer, groupByVisibility, canTransition, transitionVisibility, duplicateWithVisibility, createDefaultPresentation, mergePresentation, createPersonalView, applyPersonalView, isGridArtifact, createGridArtifact, gridArtifactToMeta, } from './artifacts/index.js';
// Design system (tokens, responsive, container queries)
export * from './design-system/index.js';
// Runtime coordination (exclude types that collide with adapters)
export { resolveFieldForSource, createFilterContext, createDebouncedFilterDispatch, isDashboardDataConfig, isDetailSourceConfig, defaultQueryCoordinatorConfig, isQueryCoordinatorConfig, createInteractionBus, resolveNavigationFilters, buildNavigationEvent, emitNavigationEvent, createInitialLoadingState, updateLoadingProgress, isLoadingComplete, isLoadingError, isLoading, getLoadingDurationMs, createMultiSourceLoadingState, updateSourceProgress, computeOverallProgress, migrateLegacyDataConfig, createDefaultExecutionStrategy, selectExecutionEngine, selectEngineForFeature, createDefaultServerGridConfig, isServerMode, hasServerCapability, createDefaultExportConfig, shouldUseAsyncExport, isFormatEnabled, createDefaultAutoSaveConfig, createFilterSnapshot, shouldAutoSave, pruneHistory, createAsyncReportUIState, addJob, updateJobStatus, removeJob, getCompletedJobs, getActiveJobs, createExportsTabState, addExport, updateExport, removeExport, setSort, setFilterStatus, getVisibleExports, createSubscriptionsTabState, setSubscriptions, setActiveTab, setSearchQuery, setCreateDialogOpen, getFilteredSubscriptions, countByStatus, createExpressionBuilderState, addNode, removeNode, updateNode, buildExpression, validateExpression as validateBuilderExpression, resetNodeCounter, createPreviewContextState, enablePreview, disablePreview, selectRole, setCustomUserId, setAvailableRoles, getEffectiveContext, initialAttentionFacetedState, toggleFacetValue, clearFacet, clearAllFilters, acknowledgeItem, acknowledgeAllVisible, setAttentionSort, loadMore, getVisibleItems, 
// server-query-backend
createServerQueryBackend, } from './coordination/index.js';
// Dashboard performance estimation (WE-14)
export { estimateDashboardPerformance, getSourceAssessment, getOverallAssessment, } from './dashboard-performance.js';
// Definition types, stores, converters (migrated from @phozart/phz-definitions)
export { createDefinitionId, createInMemoryStore, createLocalStorageStore, 
// converters
definitionToGridConfig, gridConfigToDefinition, exportDefinition, importDefinition, 
// migration
CURRENT_SCHEMA_VERSION, migrateDefinition, 
// validation
GridDefinitionSchema, validateDefinition, } from './definitions/index.js';
//# sourceMappingURL=index.js.map