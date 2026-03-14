/**
 * @phozart/shared — Shared infrastructure for all shells
 *
 * This package contains adapter interfaces, design system, artifact types,
 * runtime coordination, and shared type definitions used by workspace,
 * viewer, and editor packages.
 *
 * Sub-path imports (e.g., '@phozart/shared/adapters') are the preferred
 * way to consume this package. The barrel re-export here is for convenience
 * but uses explicit re-exports to avoid duplicate member collisions.
 */

// Adapter interfaces (canonical source for DataAdapter, DataQuery, DataResult, etc.)
export * from './adapters/index.js';

// Type definitions (exclude types already exported by adapters)
export {
  // share-target
  type ShareTarget,
  type ShareTargetUser,
  type ShareTargetRole,
  type ShareTargetTeam,
  type ShareTargetEveryone,
  isUserTarget,
  isRoleTarget,
  isTeamTarget,
  isEveryoneTarget,
  matchesShareTarget,
  matchesAnyShareTarget,
  isSharedWith,
  // field-enrichment (SemanticHint + UnitSpec already in adapters)
  type FieldEnrichment,
  type EnrichedFieldMetadata,
  createFieldEnrichment,
  mergeFieldMetadata,
  // filter-preset-value (FilterPreset already in adapters/persistence)
  type FilterPresetValue,
  createDefaultFilterPresetValue,
  // filter-value-match-rule
  type MatchOperator,
  type ExpressionFunction,
  type FilterValueMatchRule,
  applyExpression,
  evaluateMatchRule,
  // filter-value-handling
  type FilterValueSource,
  type FilterValueTransform,
  type FilterDefault,
  type FilterValueHandling,
  createDefaultFilterValueHandling,
  resolveStaticDefault,
  // personal-alert
  type AlertSeverity,
  type AlertNotificationChannel,
  type AlertGracePeriodConfig,
  type PersonalAlertPreference,
  type PersonalAlertSummary,
  type PersonalAlert,
  createEmptyAlertSummary,
  createDefaultGracePeriodConfig,
  isGracePeriodValid,
  clampGracePeriod,
  // async-report
  type AsyncReportStatus,
  type AsyncReportJob,
  type AsyncReportRequest,
  isTerminalStatus,
  createAsyncReportJob,
  isAsyncReportExpired,
  hasAsyncSupport,
  // subscription
  type SubscriptionFrequency,
  type SubscriptionFormat,
  type SubscriptionSchedule,
  type ReportSubscription,
  type Subscription,
  createSubscription,
  describeSchedule,
  buildSubscriptionDeepLink,
  // error-states
  type ErrorSeverity,
  type ErrorScenario,
  type ErrorDetails,
  type ErrorState,
  type ErrorRecoveryAction,
  type ErrorStateConfig,
  createErrorState,
  isRetryableError,
  createDefaultErrorStateConfig,
  pickRandomMessage,
  formatErrorForClipboard,
  // error-hierarchy (see also errors/ barrel below)
  // empty-states
  type EmptyScenario,
  type EmptyStateConfig,
  type EmptyStateReason,
  type EmptyState,
  createEmptyState,
  createDefaultEmptyStateConfig,
  DEFAULT_EMPTY_STATES,
  // widgets
  type WidgetPosition,
  type DashboardWidget,
  type ViewSwitchingMode,
  type WidgetView,
  type WidgetViewGroup,
  getViewSwitchingMode,
  type ExpandableWidgetConfig,
  createDefaultExpandableConfig,
  type ContainerBoxConfig,
  createDefaultContainerBoxConfig,
  type NodeStatus,
  type DecisionTreeNode,
  evaluateNodeStatus,
  // api-spec
  type HttpMethod,
  type ApiEndpoint,
  type ApiParam,
  type ApiSchemaRef,
  type ApiSpec,
  type APIRoleAccess,
  type APISpecConfig,
  createApiEndpoint,
  // message-pools (C-2.13)
  type MessageTone,
  type MessagePool,
  ERROR_MESSAGE_POOLS,
  EMPTY_STATE_MESSAGE_POOLS,
  getRandomMessage,
  getAllMessages,
  getScenarios,
  countMessages,
  // single-value-alert (7A-A)
  type AlertVisualMode,
  type WidgetAlertSeverity,
  type SingleValueAlertConfig,
  type AlertVisualState,
  type AlertContainerSize,
  type DegradedAlertParams,
  type AlertTokenSet,
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
  createDefaultAlertConfig,
  // attention-filter (7A-D)
  type AttentionPriority,
  type AttentionSource,
  type AttentionFacetValue,
  type AttentionFacet,
  type AttentionFilterState,
  type FilterableAttentionItem,
  filterAttentionItems,
  computeAttentionFacets,
  // micro-widget (7A-B)
  type MicroWidgetDisplayMode,
  type MicroWidgetType,
  type MicroWidgetCellConfig,
  type SparklineDataBinding,
  type MicroWidgetRenderResult,
  type MicroWidgetRenderer,
  type CellRendererRegistry,
  createCellRendererRegistry,
  // semantic-role (WE-1)
  type SemanticRole,
  type FieldsByRole,
  resolveSemanticRole,
  groupFieldsByRole,
  // dashboard-performance (WE-14)
  type DashboardLoadProfile,
  type DashboardSourceProfile,
  type DashboardPerformanceWarning,
  type PerformanceWarningCode,
  type SourcePerformanceHint,
  // dashboard-bookmark (WE-13)
  type DashboardBookmark,
  type DashboardInteractionState,
  type SerializedDrillDownState,
  type SerializedDrillBreadcrumb,
  createBookmarkId,
  isValidBookmark,
  mergeInteractionState,
} from './types/index.js';

// Artifact metadata types (ViewerContext already in adapters — exclude it)
export {
  // artifact-visibility (ArtifactType + ViewerContext defined here but
  // ViewerContext also in adapters — consumers should use the adapter version
  // when interacting with DataAdapter)
  type ArtifactType,
  type ArtifactVisibility,
  type VisibilityMeta,
  type VisibilityGroup,
  isVisibleToViewer,
  groupByVisibility,
  canTransition,
  transitionVisibility,
  duplicateWithVisibility,
  // default-presentation
  type DefaultPresentation,
  createDefaultPresentation,
  mergePresentation,
  // personal-view
  type PersonalView,
  createPersonalView,
  applyPersonalView,
  // grid-artifact
  type ArtifactMeta,
  type GridColumnConfig,
  type GridArtifact,
  isGridArtifact,
  createGridArtifact,
  gridArtifactToMeta,
} from './artifacts/index.js';

// Design system (tokens, responsive, container queries)
export * from './design-system/index.js';

// Runtime coordination (exclude types that collide with adapters)
export {
  // filter-context
  type FilterOperator,
  type FilterValue,
  type CrossFilterEntry,
  type FilterContextState,
  type FilterUIType,
  type DashboardFilterDef,
  type FieldMapping,
  resolveFieldForSource,
  type FilterContextManager,
  type FilterContextOptions,
  createFilterContext,
  type DebouncedDispatch,
  createDebouncedFilterDispatch,
  // dashboard-data-pipeline (DataQuery/DataResult/ColumnDescriptor collide with adapters)
  type DashboardLoadingState,
  type PreloadConfig,
  type FullLoadConfig,
  type FieldMappingEntry,
  type DetailTrigger,
  type DetailSourceConfig,
  type DashboardDataConfig,
  type DashboardDataPipeline,
  isDashboardDataConfig,
  isDetailSourceConfig,
  // query-coordinator
  type QueryCoordinatorConfig,
  defaultQueryCoordinatorConfig,
  type CoordinatorQuery,
  type CoordinatorResult,
  type QueryCoordinatorInstance,
  isQueryCoordinatorConfig,
  // interaction-bus
  type WidgetEvent,
  type InteractionBus,
  createInteractionBus,
  // navigation-events
  type NavigationFilterMapping,
  type NavigationFilter,
  type NavigationEvent,
  resolveNavigationFilters,
  buildNavigationEvent,
  emitNavigationEvent,
  // loading-state
  type LoadingPhase,
  type LoadingState,
  createInitialLoadingState,
  updateLoadingProgress,
  isLoadingComplete,
  isLoadingError,
  isLoading,
  getLoadingDurationMs,
  // loading-state (multi-source orchestrator — A-2.05)
  type MultiSourceLoadingState,
  createMultiSourceLoadingState,
  updateSourceProgress,
  computeOverallProgress,
  // dashboard-data-pipeline (multi-source — A-2.04)
  type DataSourceConfig,
  migrateLegacyDataConfig,
  // execution-strategy (A-2.06)
  type ExecutionEngine,
  type ExecutionStrategyConfig,
  type ExecutionContext,
  createDefaultExecutionStrategy,
  selectExecutionEngine,
  selectEngineForFeature,
  // server-mode (A-2.07)
  type ServerGridConfig,
  createDefaultServerGridConfig,
  isServerMode,
  hasServerCapability,
  // export-config (A-2.08) — ExportFormat already exported from adapters
  type GridExportConfig,
  createDefaultExportConfig,
  shouldUseAsyncExport,
  isFormatEnabled,
  // filter-auto-save (A-2.10)
  type FilterAutoSaveConfig,
  type FilterStateSnapshot,
  createDefaultAutoSaveConfig,
  createFilterSnapshot,
  shouldAutoSave,
  pruneHistory,
  // async-report-ui-state (C-2.01) — AsyncReportJob/AsyncReportStatus already in types
  type AsyncReportUIState,
  createAsyncReportUIState,
  addJob,
  updateJobStatus,
  removeJob,
  getCompletedJobs,
  getActiveJobs,
  // exports-tab-state (C-2.02) — ExportFormat already in adapters
  type ExportEntry,
  type ExportSortField,
  type ExportsTabState,
  createExportsTabState,
  addExport,
  updateExport,
  removeExport,
  setSort,
  setFilterStatus,
  getVisibleExports,
  // subscriptions-tab-state (C-2.06) — Subscription already in types
  type SubscriptionTabFilter,
  type SubscriptionsTabState,
  createSubscriptionsTabState,
  setSubscriptions,
  setActiveTab,
  setSearchQuery,
  setCreateDialogOpen,
  getFilteredSubscriptions,
  countByStatus,
  // expression-builder-state (C-2.10)
  type ExpressionNodeType,
  type ExpressionNode,
  type ExpressionBuilderState,
  createExpressionBuilderState,
  addNode,
  removeNode,
  updateNode,
  buildExpression,
  validateExpression as validateBuilderExpression,
  resetNodeCounter,
  // preview-context-state (C-2.11) — ViewerContext already in adapters
  type PreviewContextState,
  createPreviewContextState,
  enablePreview,
  disablePreview,
  selectRole,
  setCustomUserId,
  setAvailableRoles,
  getEffectiveContext,
  // attention-faceted-state (7A-D)
  type AttentionSortOrder,
  type AttentionFacetedState,
  initialAttentionFacetedState,
  toggleFacetValue,
  clearFacet,
  clearAllFilters,
  acknowledgeItem,
  acknowledgeAllVisible,
  setAttentionSort,
  loadMore,
  getVisibleItems,
  // server-query-backend
  createServerQueryBackend,
  type ServerQueryBackendOptions,
} from './coordination/index.js';

// Dashboard performance estimation (WE-14)
export {
  estimateDashboardPerformance,
  getSourceAssessment,
  getOverallAssessment,
} from './dashboard-performance.js';

// Definition types, stores, converters (migrated from @phozart/definitions)
export {
  // types
  type DefinitionId,
  type DefinitionIdentity,
  createDefinitionId,
  type DefinitionDataSource,
  type LocalDataSource,
  type UrlDataSource,
  type DataProductDataSource,
  type DuckDBQueryDataSource,
  type DefinitionColumnType,
  type DefinitionColumnSpec,
  type DefinitionDefaults,
  type DefinitionFormatting,
  type ConditionalFormattingDef,
  type DefinitionBehavior,
  type DefinitionSavedView,
  type ViewCollection,
  type DefinitionAccess,
  type GridDefinition,
  type DefinitionMeta,
  // store
  type DefinitionStore,
  type AsyncDefinitionStore,
  createInMemoryStore,
  createLocalStorageStore,
  type LocalStorageStoreOptions,
  // converters
  definitionToGridConfig,
  type ToGridConfigOptions,
  gridConfigToDefinition,
  type FromGridConfigMeta,
  exportDefinition,
  importDefinition,
  type DefinitionEnvelope,
  type ImportOptions,
  // migration
  CURRENT_SCHEMA_VERSION,
  migrateDefinition,
  // validation
  GridDefinitionSchema,
  validateDefinition,
  type DefinitionValidationResult,
  type DefinitionValidationError,
} from './definitions/index.js';

// Error Hierarchy
export { PhzError } from './errors/phz-error.js';
export { PhzValidationError, type ValidationFieldError } from './errors/validation-error.js';
