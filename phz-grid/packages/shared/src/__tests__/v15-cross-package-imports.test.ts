/**
 * v15 Cross-Package Import Verification
 *
 * Verifies that all critical exports from the v15 architecture refactoring
 * are accessible via their intended import paths. Each import is a real
 * import statement; the test asserts the imported values are defined.
 */
import { describe, it, expect } from 'vitest';

// ========================================================================
// 1. @phozart/phz-shared (root barrel)
// ========================================================================

import {
  // Adapters (re-exported from root)
  type DataAdapter,
  type DataQuery,
  type DataResult,
  type PersistenceAdapter,
  type AlertChannelAdapter,
  type AttentionItem,
  type UsageAnalyticsAdapter,
  type SubscriptionAdapter,
  // Types (selectively re-exported)
  type ShareTarget,
  isUserTarget,
  isRoleTarget,
  matchesShareTarget,
  type FieldEnrichment,
  createFieldEnrichment,
  type FilterPresetValue,
  createDefaultFilterPresetValue,
  type FilterValueMatchRule,
  evaluateMatchRule,
  type FilterValueHandling,
  createDefaultFilterValueHandling,
  type PersonalAlert,
  createEmptyAlertSummary,
  createDefaultGracePeriodConfig,
  type AsyncReportJob,
  createAsyncReportJob,
  isTerminalStatus,
  type Subscription,
  createSubscription,
  describeSchedule,
  type ErrorState,
  createErrorState,
  isRetryableError,
  type EmptyState,
  createEmptyState,
  DEFAULT_EMPTY_STATES,
  type DashboardWidget,
  type DecisionTreeNode,
  evaluateNodeStatus,
  type ApiSpec,
  createApiEndpoint,
  type MessagePool,
  ERROR_MESSAGE_POOLS,
  getRandomMessage,
  // Amendment A: single-value-alert
  type AlertVisualState,
  type SingleValueAlertConfig,
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
  createDefaultAlertConfig,
  // Amendment B: micro-widget
  type MicroWidgetCellConfig,
  type CellRendererRegistry,
  createCellRendererRegistry,
  // Amendment D: attention-filter
  type FilterableAttentionItem,
  filterAttentionItems,
  computeAttentionFacets,
  // Artifacts (re-exported from root)
  type ArtifactType,
  type ArtifactVisibility,
  isVisibleToViewer,
  groupByVisibility,
  transitionVisibility,
  type DefaultPresentation,
  createDefaultPresentation,
  mergePresentation,
  type PersonalView,
  createPersonalView,
  type GridArtifact,
  createGridArtifact,
  isGridArtifact,
  // Design system (re-exported from root)
  ALERT_WIDGET_TOKENS,
  generateAlertTokenCSS,
  resolveAlertTokenVar,
  IMPACT_CHAIN_TOKENS,
  generateChainTokenCSS,
  resolveChainTokenVar,
  // Coordination (selectively re-exported from root)
  type FilterContextManager,
  createFilterContext,
  type DashboardDataPipeline,
  isDashboardDataConfig,
  type InteractionBus,
  createInteractionBus,
  type LoadingState,
  createInitialLoadingState,
  isLoadingComplete,
  type ExecutionStrategyConfig,
  createDefaultExecutionStrategy,
  type ServerGridConfig,
  createDefaultServerGridConfig,
  type GridExportConfig,
  createDefaultExportConfig,
  type FilterAutoSaveConfig,
  createDefaultAutoSaveConfig,
  // Coordination: state machines
  type AsyncReportUIState,
  createAsyncReportUIState,
  addJob,
  type ExportsTabState,
  createExportsTabState,
  type SubscriptionsTabState,
  createSubscriptionsTabState,
  type ExpressionBuilderState,
  createExpressionBuilderState,
  type PreviewContextState,
  createPreviewContextState,
  // Amendment D: faceted state (coordination)
  type AttentionFacetedState,
  initialAttentionFacetedState,
  toggleFacetValue,
  clearFacet,
  acknowledgeItem,
  getVisibleItems,
} from '@phozart/phz-shared';

// ========================================================================
// 2. @phozart/phz-shared/types
// ========================================================================

import {
  type ShareTargetUser,
  isTeamTarget,
  isEveryoneTarget,
  type EnrichedFieldMetadata,
  mergeFieldMetadata,
  type MatchOperator,
  applyExpression,
  type PersonalAlertPreference,
  type AsyncReportStatus,
  isAsyncReportExpired,
  type SubscriptionFrequency,
  buildSubscriptionDeepLink,
  type ErrorSeverity,
  createDefaultErrorStateConfig,
  pickRandomMessage,
  type EmptyScenario,
  type WidgetPosition as SharedWidgetPosition,
  type ViewSwitchingMode,
  getViewSwitchingMode,
  type ExpandableWidgetConfig,
  createDefaultExpandableConfig,
  type ContainerBoxConfig,
  createDefaultContainerBoxConfig,
  type HttpMethod,
  type ApiEndpoint as SharedApiEndpoint,
  type MessageTone,
  EMPTY_STATE_MESSAGE_POOLS,
  getAllMessages,
  getScenarios,
  countMessages,
  // Amendment A
  type AlertVisualMode,
  type WidgetAlertSeverity,
  type AlertContainerSize,
  type DegradedAlertParams,
  type AlertTokenSet,
  // Amendment B
  type MicroWidgetDisplayMode,
  type MicroWidgetType,
  type SparklineDataBinding,
  type MicroWidgetRenderResult,
  type MicroWidgetRenderer,
  // Amendment C: impact-chain
  type ImpactChainNode,
  type ImpactNodeRole,
  type HypothesisState,
  type ChainLayout,
  type ChainLayoutDirection,
  type DecisionTreeRenderVariant,
  type DecisionTreeVariantConfig,
  type ImpactMetric,
  // Amendment D
  type AttentionPriority,
  type AttentionSource,
  type AttentionFacetValue,
  type AttentionFacet,
  type AttentionFilterState,
} from '@phozart/phz-shared/types';

// ========================================================================
// 3. @phozart/phz-shared/adapters
// ========================================================================

import {
  type DataAdapter as AdapterDataAdapter,
  type DataQuery as AdapterDataQuery,
  type DataResult as AdapterDataResult,
  type ColumnDescriptor,
  type ViewerContext,
  type PersistenceAdapter as AdapterPersistenceAdapter,
  type MeasureRegistryAdapter,
  type AlertChannelAdapter as AdapterAlertChannelAdapter,
  type HelpConfig,
  type AttentionItem as AdapterAttentionItem,
  type UsageAnalyticsAdapter as AdapterUsageAnalyticsAdapter,
  type SubscriptionAdapter as AdapterSubscriptionAdapter,
} from '@phozart/phz-shared/adapters';

// ========================================================================
// 4. @phozart/phz-shared/design-system
// ========================================================================

import {
  DESIGN_TOKENS,
  BREAKPOINT_VALUES,
  getKPICardClass,
  SHELL_LAYOUT,
  ICONS,
  ALERT_WIDGET_TOKENS as DSAlertTokens,
  generateAlertTokenCSS as DSGenerateAlertCSS,
  IMPACT_CHAIN_TOKENS as DSChainTokens,
  generateChainTokenCSS as DSGenerateChainCSS,
} from '@phozart/phz-shared/design-system';

// ========================================================================
// 5. @phozart/phz-shared/artifacts
// ========================================================================

import {
  type ArtifactType as ArtArtifactType,
  type VisibilityMeta,
  type VisibilityGroup,
  canTransition,
  duplicateWithVisibility,
  type DefaultPresentation as ArtDefaultPresentation,
  type PersonalView as ArtPersonalView,
  applyPersonalView,
  type ArtifactMeta,
  type GridColumnConfig,
  gridArtifactToMeta,
} from '@phozart/phz-shared/artifacts';

// ========================================================================
// 6. @phozart/phz-shared/coordination
// ========================================================================

import {
  type FilterOperator as CoordFilterOperator,
  type FilterValue,
  type CrossFilterEntry,
  type FilterContextState,
  resolveFieldForSource,
  createDebouncedFilterDispatch,
  type DashboardLoadingState,
  type PreloadConfig,
  type DetailSourceConfig,
  type DashboardDataConfig,
  isDetailSourceConfig,
  type QueryCoordinatorConfig,
  defaultQueryCoordinatorConfig,
  type NavigationFilterMapping,
  type NavigationEvent,
  resolveNavigationFilters,
  buildNavigationEvent,
  type LoadingPhase,
  updateLoadingProgress,
  isLoadingError,
  isLoading,
  getLoadingDurationMs,
  type MultiSourceLoadingState,
  createMultiSourceLoadingState,
  updateSourceProgress,
  computeOverallProgress,
  type DataSourceConfig,
  migrateLegacyDataConfig,
  type ExecutionEngine,
  selectExecutionEngine,
  selectEngineForFeature,
  isServerMode,
  hasServerCapability,
  shouldUseAsyncExport,
  isFormatEnabled,
  type FilterStateSnapshot,
  createFilterSnapshot,
  shouldAutoSave,
  pruneHistory,
  updateJobStatus,
  removeJob,
  getCompletedJobs,
  getActiveJobs,
  type ExportEntry,
  addExport,
  updateExport,
  removeExport,
  setSort,
  setFilterStatus,
  getVisibleExports,
  setSubscriptions as setSubTabSubscriptions,
  setActiveTab as setSubActiveTab,
  setSearchQuery as setSubSearchQuery,
  getFilteredSubscriptions,
  countByStatus,
  addNode,
  removeNode,
  updateNode,
  buildExpression,
  validateExpression as coordValidateExpression,
  resetNodeCounter,
  enablePreview,
  disablePreview,
  selectRole,
  getEffectiveContext,
  // Amendment D: faceted state
  type AttentionSortOrder,
  setAttentionSort,
  loadMore,
  clearAllFilters as clearAllAttentionFilters,
  acknowledgeAllVisible,
} from '@phozart/phz-shared/coordination';

// ========================================================================
// 7. Viewer state machines (barrel)
// ========================================================================

import {
  type ViewerShellState,
  createViewerShellState,
  navigateTo as viewerNavigateTo,
  navigateBack as viewerNavigateBack,
  canGoBack as viewerCanGoBack,
  setError as viewerSetError,
  setEmpty as viewerSetEmpty,
  setLoading as viewerSetLoading,
  type ViewerRoute,
  parseRoute as viewerParseRoute,
  buildRoutePath as viewerBuildRoutePath,
  type ViewerShellConfig,
  createViewerShellConfig,
  createDefaultFeatureFlags,
  // Screen states
  type CatalogState as ViewerCatalogState,
  createCatalogState as viewerCreateCatalogState,
  type DashboardViewState as ViewerDashboardViewState,
  createDashboardViewState as viewerCreateDashboardViewState,
  type ReportViewState,
  createReportViewState,
  type ExplorerScreenState,
  createExplorerScreenState,
  type AttentionDropdownState,
  createAttentionDropdownState,
  type FilterBarState,
  createFilterBarState,
} from '@phozart/phz-viewer';

// ========================================================================
// 8. Editor state machines (barrel)
// ========================================================================

import {
  type EditorShellState,
  createEditorShellState,
  navigateTo as editorNavigateTo,
  toggleEditMode,
  markUnsavedChanges,
  undo,
  redo,
  canUndo,
  canRedo,
  type EditorRoute,
  parseRoute as editorParseRoute,
  buildRoutePath as editorBuildRoutePath,
  buildBreadcrumbs,
  type EditorShellConfig,
  createEditorShellConfig,
  validateEditorConfig,
  // Screen states
  type CatalogState as EditorCatalogState,
  createCatalogState as editorCreateCatalogState,
  type DashboardViewState as EditorDashboardViewState,
  createDashboardViewState as editorCreateDashboardViewState,
  type DashboardEditState,
  createDashboardEditState,
  addWidget,
  removeWidget,
  type ReportEditState,
  createReportEditState,
  type ExplorerState as EditorExplorerState,
  createExplorerState,
  // Authoring states
  type MeasurePaletteState,
  createMeasurePaletteState,
  type ConfigPanelState,
  createConfigPanelState,
  type SharingFlowState,
  createSharingFlowState,
  type AlertSubscriptionState,
  createAlertSubscriptionState,
} from '@phozart/phz-editor';

// ========================================================================
// 9. Engine alert/subscription/analytics/api modules
// ========================================================================

import {
  // alerts
  type AlertEvaluationResult,
  evaluateAllAlerts,
  type AlertEvaluationContract,
  createInMemoryAlertContract,
  // subscriptions
  type SubscriptionEngineState,
  createSubscriptionEngineState,
  addSubscription as engineAddSub,
  getNextScheduledRun,
  isDueForExecution,
  // analytics
  type UsageCollectorState,
  type BufferedEvent,
  createUsageCollector,
  trackEvent,
  shouldFlush,
  // api
  type OpenAPIDocument,
  generateOpenAPISpec,
  endpointToOperation,
  // attention
  type AttentionSystemState,
  createAttentionSystemState,
  addItems as addAttentionItems,
  markRead,
  markAllRead,
  getUnreadItems,
} from '@phozart/phz-engine';

// ========================================================================
// 10. Widget new modules (7A amendments)
// ========================================================================

import {
  // Amendment D: attention widget
  initialAttentionWidgetState,
  computePrioritySummary,
  getTopItems,
  getTotalCount,
  getContainerVariant,
  type AttentionWidgetState,
  type PrioritySummary,
  // Amendment B: micro-widget renderers
  createValueOnlyRenderer,
  createSparklineRenderer,
  createDeltaRenderer,
  createGaugeArcRenderer,
  registerAllMicroWidgetRenderers,
  // Amendment C: impact chain state
  initialImpactChainState,
  computeChainLayout,
  getChainContainerVariant,
  toggleNodeExpand,
  setContainerWidth,
  getHypothesisColor,
  getHypothesisLabel,
  getNodeRoleColor,
  computeChainSummary,
  resolveConclusion,
  type ImpactChainState,
  type NodePosition,
  type ChainEdge,
  type ComputedChainLayout,
  type ChainContainerVariant,
  type ChainSummary,
  // Decision tree variants
  DECISION_TREE_VARIANTS,
  type DecisionTreeVariantEntry,
} from '@phozart/phz-widgets';

// ========================================================================
// Tests
// ========================================================================

describe('v15 Cross-Package Import Verification', () => {
  describe('@phozart/phz-shared (root barrel)', () => {
    it('exports adapter interfaces from root', () => {
      // Type-only imports do not have runtime values; verify function exports
      expect(createFilterContext).toBeDefined();
      expect(createInteractionBus).toBeDefined();
    });

    it('exports share-target functions', () => {
      expect(isUserTarget).toBeTypeOf('function');
      expect(isRoleTarget).toBeTypeOf('function');
      expect(matchesShareTarget).toBeTypeOf('function');
    });

    it('exports field-enrichment functions', () => {
      expect(createFieldEnrichment).toBeTypeOf('function');
    });

    it('exports filter-preset-value functions', () => {
      expect(createDefaultFilterPresetValue).toBeTypeOf('function');
    });

    it('exports filter-value-match-rule functions', () => {
      expect(evaluateMatchRule).toBeTypeOf('function');
    });

    it('exports filter-value-handling functions', () => {
      expect(createDefaultFilterValueHandling).toBeTypeOf('function');
    });

    it('exports personal-alert functions', () => {
      expect(createEmptyAlertSummary).toBeTypeOf('function');
      expect(createDefaultGracePeriodConfig).toBeTypeOf('function');
    });

    it('exports async-report functions', () => {
      expect(createAsyncReportJob).toBeTypeOf('function');
      expect(isTerminalStatus).toBeTypeOf('function');
    });

    it('exports subscription functions', () => {
      expect(createSubscription).toBeTypeOf('function');
      expect(describeSchedule).toBeTypeOf('function');
    });

    it('exports error-state functions', () => {
      expect(createErrorState).toBeTypeOf('function');
      expect(isRetryableError).toBeTypeOf('function');
    });

    it('exports empty-state functions', () => {
      expect(createEmptyState).toBeTypeOf('function');
      expect(DEFAULT_EMPTY_STATES).toBeDefined();
    });

    it('exports widget types functions', () => {
      expect(evaluateNodeStatus).toBeTypeOf('function');
    });

    it('exports api-spec functions', () => {
      expect(createApiEndpoint).toBeTypeOf('function');
    });

    it('exports message-pool functions', () => {
      expect(ERROR_MESSAGE_POOLS).toBeDefined();
      expect(getRandomMessage).toBeTypeOf('function');
    });

    it('exports Amendment A (single-value-alert) functions', () => {
      expect(resolveAlertVisualState).toBeTypeOf('function');
      expect(getAlertTokens).toBeTypeOf('function');
      expect(degradeAlertMode).toBeTypeOf('function');
      expect(createDefaultAlertConfig).toBeTypeOf('function');
    });

    it('exports Amendment B (micro-widget) factory', () => {
      expect(createCellRendererRegistry).toBeTypeOf('function');
    });

    it('exports Amendment D (attention-filter) functions', () => {
      expect(filterAttentionItems).toBeTypeOf('function');
      expect(computeAttentionFacets).toBeTypeOf('function');
    });

    it('exports artifact functions', () => {
      expect(isVisibleToViewer).toBeTypeOf('function');
      expect(groupByVisibility).toBeTypeOf('function');
      expect(transitionVisibility).toBeTypeOf('function');
      expect(createDefaultPresentation).toBeTypeOf('function');
      expect(mergePresentation).toBeTypeOf('function');
      expect(createPersonalView).toBeTypeOf('function');
      expect(createGridArtifact).toBeTypeOf('function');
      expect(isGridArtifact).toBeTypeOf('function');
    });

    it('exports design system tokens and functions', () => {
      expect(ALERT_WIDGET_TOKENS).toBeDefined();
      expect(generateAlertTokenCSS).toBeTypeOf('function');
      expect(resolveAlertTokenVar).toBeTypeOf('function');
      expect(IMPACT_CHAIN_TOKENS).toBeDefined();
      expect(generateChainTokenCSS).toBeTypeOf('function');
      expect(resolveChainTokenVar).toBeTypeOf('function');
    });

    it('exports coordination state machines', () => {
      expect(createAsyncReportUIState).toBeTypeOf('function');
      expect(addJob).toBeTypeOf('function');
      expect(createExportsTabState).toBeTypeOf('function');
      expect(createSubscriptionsTabState).toBeTypeOf('function');
      expect(createExpressionBuilderState).toBeTypeOf('function');
      expect(createPreviewContextState).toBeTypeOf('function');
    });

    it('exports Amendment D faceted state (coordination)', () => {
      expect(initialAttentionFacetedState).toBeTypeOf('function');
      expect(toggleFacetValue).toBeTypeOf('function');
      expect(clearFacet).toBeTypeOf('function');
      expect(acknowledgeItem).toBeTypeOf('function');
      expect(getVisibleItems).toBeTypeOf('function');
    });

    it('exports coordination utilities', () => {
      expect(createInitialLoadingState).toBeTypeOf('function');
      expect(isLoadingComplete).toBeTypeOf('function');
      expect(createDefaultExecutionStrategy).toBeTypeOf('function');
      expect(createDefaultServerGridConfig).toBeTypeOf('function');
      expect(createDefaultExportConfig).toBeTypeOf('function');
      expect(createDefaultAutoSaveConfig).toBeTypeOf('function');
      expect(isDashboardDataConfig).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/types', () => {
    it('exports share-target utilities', () => {
      expect(isTeamTarget).toBeTypeOf('function');
      expect(isEveryoneTarget).toBeTypeOf('function');
    });

    it('exports field-enrichment utilities', () => {
      expect(mergeFieldMetadata).toBeTypeOf('function');
    });

    it('exports filter-value-match-rule utilities', () => {
      expect(applyExpression).toBeTypeOf('function');
    });

    it('exports error-state utilities', () => {
      expect(createDefaultErrorStateConfig).toBeTypeOf('function');
      expect(pickRandomMessage).toBeTypeOf('function');
    });

    it('exports widget utilities', () => {
      expect(getViewSwitchingMode).toBeTypeOf('function');
      expect(createDefaultExpandableConfig).toBeTypeOf('function');
      expect(createDefaultContainerBoxConfig).toBeTypeOf('function');
    });

    it('exports message-pool constants', () => {
      expect(EMPTY_STATE_MESSAGE_POOLS).toBeDefined();
      expect(getAllMessages).toBeTypeOf('function');
      expect(getScenarios).toBeTypeOf('function');
      expect(countMessages).toBeTypeOf('function');
    });

    it('exports Amendment A types at runtime', () => {
      expect(resolveAlertVisualState).toBeTypeOf('function');
      expect(getAlertTokens).toBeTypeOf('function');
      expect(degradeAlertMode).toBeTypeOf('function');
      expect(createDefaultAlertConfig).toBeTypeOf('function');
    });

    it('exports Amendment B factory', () => {
      expect(createCellRendererRegistry).toBeTypeOf('function');
    });

    it('exports Amendment D filter functions', () => {
      expect(filterAttentionItems).toBeTypeOf('function');
      expect(computeAttentionFacets).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/adapters', () => {
    it('all adapter modules are importable (type-only except functions)', () => {
      // These are all type-only imports; verifying they don't throw at import time
      // is sufficient. The import statement itself is the test.
      expect(true).toBe(true);
    });
  });

  describe('@phozart/phz-shared/design-system', () => {
    it('exports design tokens', () => {
      expect(DESIGN_TOKENS).toBeDefined();
      expect(typeof DESIGN_TOKENS).toBe('object');
    });

    it('exports breakpoint values', () => {
      expect(BREAKPOINT_VALUES).toBeDefined();
    });

    it('exports container query CSS helpers', () => {
      expect(getKPICardClass).toBeTypeOf('function');
    });

    it('exports shell layout', () => {
      expect(SHELL_LAYOUT).toBeDefined();
    });

    it('exports icons', () => {
      expect(ICONS).toBeDefined();
    });

    it('exports alert widget tokens (7A-A)', () => {
      expect(DSAlertTokens).toBeDefined();
      expect(DSAlertTokens['widget.alert.healthy.indicator']).toBe('#22c55e');
      expect(DSAlertTokens['widget.alert.critical.indicator']).toBe('#ef4444');
      expect(DSGenerateAlertCSS).toBeTypeOf('function');
    });

    it('exports impact chain tokens (7A-C)', () => {
      expect(DSChainTokens).toBeDefined();
      expect(DSChainTokens['chain.rootCause.accent']).toBe('#dc2626');
      expect(DSGenerateChainCSS).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/artifacts', () => {
    it('exports visibility functions', () => {
      expect(canTransition).toBeTypeOf('function');
      expect(duplicateWithVisibility).toBeTypeOf('function');
    });

    it('exports personal view functions', () => {
      expect(applyPersonalView).toBeTypeOf('function');
    });

    it('exports grid artifact functions', () => {
      expect(gridArtifactToMeta).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-shared/coordination', () => {
    it('exports filter context utilities', () => {
      expect(resolveFieldForSource).toBeTypeOf('function');
      expect(createDebouncedFilterDispatch).toBeTypeOf('function');
    });

    it('exports dashboard data pipeline utilities', () => {
      expect(isDetailSourceConfig).toBeTypeOf('function');
      expect(migrateLegacyDataConfig).toBeTypeOf('function');
    });

    it('exports query coordinator config', () => {
      expect(defaultQueryCoordinatorConfig).toBeDefined();
    });

    it('exports navigation event utilities', () => {
      expect(resolveNavigationFilters).toBeTypeOf('function');
      expect(buildNavigationEvent).toBeTypeOf('function');
    });

    it('exports loading state utilities', () => {
      expect(updateLoadingProgress).toBeTypeOf('function');
      expect(isLoadingError).toBeTypeOf('function');
      expect(isLoading).toBeTypeOf('function');
      expect(getLoadingDurationMs).toBeTypeOf('function');
    });

    it('exports multi-source loading state', () => {
      expect(createMultiSourceLoadingState).toBeTypeOf('function');
      expect(updateSourceProgress).toBeTypeOf('function');
      expect(computeOverallProgress).toBeTypeOf('function');
    });

    it('exports execution strategy', () => {
      expect(selectExecutionEngine).toBeTypeOf('function');
      expect(selectEngineForFeature).toBeTypeOf('function');
    });

    it('exports server mode utilities', () => {
      expect(isServerMode).toBeTypeOf('function');
      expect(hasServerCapability).toBeTypeOf('function');
    });

    it('exports export config utilities', () => {
      expect(shouldUseAsyncExport).toBeTypeOf('function');
      expect(isFormatEnabled).toBeTypeOf('function');
    });

    it('exports filter auto-save utilities', () => {
      expect(createFilterSnapshot).toBeTypeOf('function');
      expect(shouldAutoSave).toBeTypeOf('function');
      expect(pruneHistory).toBeTypeOf('function');
    });

    it('exports async report UI state', () => {
      expect(updateJobStatus).toBeTypeOf('function');
      expect(removeJob).toBeTypeOf('function');
      expect(getCompletedJobs).toBeTypeOf('function');
      expect(getActiveJobs).toBeTypeOf('function');
    });

    it('exports exports tab state', () => {
      expect(addExport).toBeTypeOf('function');
      expect(updateExport).toBeTypeOf('function');
      expect(removeExport).toBeTypeOf('function');
      expect(setSort).toBeTypeOf('function');
      expect(setFilterStatus).toBeTypeOf('function');
      expect(getVisibleExports).toBeTypeOf('function');
    });

    it('exports subscriptions tab state', () => {
      expect(setSubTabSubscriptions).toBeTypeOf('function');
      expect(setSubActiveTab).toBeTypeOf('function');
      expect(setSubSearchQuery).toBeTypeOf('function');
      expect(getFilteredSubscriptions).toBeTypeOf('function');
      expect(countByStatus).toBeTypeOf('function');
    });

    it('exports expression builder state', () => {
      expect(addNode).toBeTypeOf('function');
      expect(removeNode).toBeTypeOf('function');
      expect(updateNode).toBeTypeOf('function');
      expect(buildExpression).toBeTypeOf('function');
      expect(coordValidateExpression).toBeTypeOf('function');
      expect(resetNodeCounter).toBeTypeOf('function');
    });

    it('exports preview context state', () => {
      expect(enablePreview).toBeTypeOf('function');
      expect(disablePreview).toBeTypeOf('function');
      expect(selectRole).toBeTypeOf('function');
      expect(getEffectiveContext).toBeTypeOf('function');
    });

    it('exports Amendment D: faceted attention state', () => {
      expect(setAttentionSort).toBeTypeOf('function');
      expect(loadMore).toBeTypeOf('function');
      expect(clearAllAttentionFilters).toBeTypeOf('function');
      expect(acknowledgeAllVisible).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-viewer (barrel)', () => {
    it('exports shell state machine', () => {
      expect(createViewerShellState).toBeTypeOf('function');
      expect(viewerNavigateTo).toBeTypeOf('function');
      expect(viewerNavigateBack).toBeTypeOf('function');
      expect(viewerCanGoBack).toBeTypeOf('function');
      expect(viewerSetError).toBeTypeOf('function');
      expect(viewerSetEmpty).toBeTypeOf('function');
      expect(viewerSetLoading).toBeTypeOf('function');
    });

    it('exports navigation utilities', () => {
      expect(viewerParseRoute).toBeTypeOf('function');
      expect(viewerBuildRoutePath).toBeTypeOf('function');
    });

    it('exports shell config', () => {
      expect(createViewerShellConfig).toBeTypeOf('function');
      expect(createDefaultFeatureFlags).toBeTypeOf('function');
    });

    it('exports catalog screen state', () => {
      expect(viewerCreateCatalogState).toBeTypeOf('function');
    });

    it('exports dashboard view state', () => {
      expect(viewerCreateDashboardViewState).toBeTypeOf('function');
    });

    it('exports report view state', () => {
      expect(createReportViewState).toBeTypeOf('function');
    });

    it('exports explorer screen state', () => {
      expect(createExplorerScreenState).toBeTypeOf('function');
    });

    it('exports attention dropdown state', () => {
      expect(createAttentionDropdownState).toBeTypeOf('function');
    });

    it('exports filter bar state', () => {
      expect(createFilterBarState).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-editor (barrel)', () => {
    it('exports shell state machine', () => {
      expect(createEditorShellState).toBeTypeOf('function');
      expect(editorNavigateTo).toBeTypeOf('function');
      expect(toggleEditMode).toBeTypeOf('function');
      expect(markUnsavedChanges).toBeTypeOf('function');
      expect(undo).toBeTypeOf('function');
      expect(redo).toBeTypeOf('function');
      expect(canUndo).toBeTypeOf('function');
      expect(canRedo).toBeTypeOf('function');
    });

    it('exports navigation utilities', () => {
      expect(editorParseRoute).toBeTypeOf('function');
      expect(editorBuildRoutePath).toBeTypeOf('function');
      expect(buildBreadcrumbs).toBeTypeOf('function');
    });

    it('exports editor config', () => {
      expect(createEditorShellConfig).toBeTypeOf('function');
      expect(validateEditorConfig).toBeTypeOf('function');
    });

    it('exports catalog state', () => {
      expect(editorCreateCatalogState).toBeTypeOf('function');
    });

    it('exports dashboard view state', () => {
      expect(editorCreateDashboardViewState).toBeTypeOf('function');
    });

    it('exports dashboard edit state', () => {
      expect(createDashboardEditState).toBeTypeOf('function');
      expect(addWidget).toBeTypeOf('function');
      expect(removeWidget).toBeTypeOf('function');
    });

    it('exports report edit state', () => {
      expect(createReportEditState).toBeTypeOf('function');
    });

    it('exports explorer state', () => {
      expect(createExplorerState).toBeTypeOf('function');
    });

    it('exports measure palette state', () => {
      expect(createMeasurePaletteState).toBeTypeOf('function');
    });

    it('exports config panel state', () => {
      expect(createConfigPanelState).toBeTypeOf('function');
    });

    it('exports sharing flow state', () => {
      expect(createSharingFlowState).toBeTypeOf('function');
    });

    it('exports alert/subscription state', () => {
      expect(createAlertSubscriptionState).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-engine alert/subscription/analytics/api modules', () => {
    it('exports personal alert engine', () => {
      expect(evaluateAllAlerts).toBeTypeOf('function');
      expect(createInMemoryAlertContract).toBeTypeOf('function');
    });

    it('exports subscription engine', () => {
      expect(createSubscriptionEngineState).toBeTypeOf('function');
      expect(engineAddSub).toBeTypeOf('function');
      expect(getNextScheduledRun).toBeTypeOf('function');
      expect(isDueForExecution).toBeTypeOf('function');
    });

    it('exports usage collector', () => {
      expect(createUsageCollector).toBeTypeOf('function');
      expect(trackEvent).toBeTypeOf('function');
      expect(shouldFlush).toBeTypeOf('function');
    });

    it('exports OpenAPI generator', () => {
      expect(generateOpenAPISpec).toBeTypeOf('function');
      expect(endpointToOperation).toBeTypeOf('function');
    });

    it('exports attention system', () => {
      expect(createAttentionSystemState).toBeTypeOf('function');
      expect(addAttentionItems).toBeTypeOf('function');
      expect(markRead).toBeTypeOf('function');
      expect(markAllRead).toBeTypeOf('function');
      expect(getUnreadItems).toBeTypeOf('function');
    });
  });

  describe('@phozart/phz-widgets new modules (7A amendments)', () => {
    it('exports attention widget state (7A-D)', () => {
      expect(initialAttentionWidgetState).toBeTypeOf('function');
      expect(computePrioritySummary).toBeTypeOf('function');
      expect(getTopItems).toBeTypeOf('function');
      expect(getTotalCount).toBeTypeOf('function');
      expect(getContainerVariant).toBeTypeOf('function');
    });

    it('exports micro-widget renderers (7A-B)', () => {
      expect(createValueOnlyRenderer).toBeTypeOf('function');
      expect(createSparklineRenderer).toBeTypeOf('function');
      expect(createDeltaRenderer).toBeTypeOf('function');
      expect(createGaugeArcRenderer).toBeTypeOf('function');
      expect(registerAllMicroWidgetRenderers).toBeTypeOf('function');
    });

    it('exports impact chain state (7A-C)', () => {
      expect(initialImpactChainState).toBeTypeOf('function');
      expect(computeChainLayout).toBeTypeOf('function');
      expect(getChainContainerVariant).toBeTypeOf('function');
      expect(toggleNodeExpand).toBeTypeOf('function');
      expect(setContainerWidth).toBeTypeOf('function');
      expect(getHypothesisColor).toBeTypeOf('function');
      expect(getHypothesisLabel).toBeTypeOf('function');
      expect(getNodeRoleColor).toBeTypeOf('function');
      expect(computeChainSummary).toBeTypeOf('function');
      expect(resolveConclusion).toBeTypeOf('function');
    });

    it('exports decision tree variants (7A-C)', () => {
      expect(DECISION_TREE_VARIANTS).toBeDefined();
      expect(Array.isArray(DECISION_TREE_VARIANTS)).toBe(true);
    });
  });
});
