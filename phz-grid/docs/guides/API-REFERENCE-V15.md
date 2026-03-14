# phz-grid v15 API Reference

> **New packages**: `@phozart/shared`, `@phozart/viewer`, `@phozart/editor`
> **New engine subsystems**: alerts, subscriptions, analytics, API, attention
> **Spec amendments**: A (alert-aware KPIs), B (micro-widget cells), C (impact chains), D (faceted attention)

For core workspace types (DataAdapter, widgets, layout, templates, alerts,
filters, explorer, interaction, time intelligence, formatting, quality,
history, i18n, viewer context, connectors, adapters, coordination), see
[API-REFERENCE.md](./API-REFERENCE.md).

---

## Table of Contents

1. [@phozart/shared](#1-phozartphz-shared)
   - [1.1 Adapters](#11-adapters)
   - [1.2 Types](#12-types)
   - [1.3 Design System](#13-design-system)
   - [1.4 Artifacts](#14-artifacts)
   - [1.5 Coordination](#15-coordination)
2. [@phozart/viewer](#2-phozartphz-viewer)
3. [@phozart/editor](#3-phozartphz-editor)
4. [New Engine Exports](#4-new-engine-exports)
   - [4.1 Explorer](#41-explorer)
   - [4.2 Personal Alert Engine](#42-personal-alert-engine)
   - [4.3 Subscription Engine](#43-subscription-engine)
   - [4.4 Usage Analytics](#44-usage-analytics)
   - [4.5 OpenAPI Generator](#45-openapi-generator)
   - [4.6 Attention System](#46-attention-system)
5. [New Workspace Exports](#5-new-workspace-exports)
   - [5.1 Command Palette](#51-command-palette)
   - [5.2 Keyboard Shortcuts](#52-keyboard-shortcuts)
   - [5.3 Settings State](#53-settings-state)
   - [5.4 API Access State](#54-api-access-state)

---

## 1. @phozart/shared

**Source**: `packages/shared/src/`

The shared package provides adapter interfaces, type definitions, design
system, artifact metadata, and runtime coordination used by all three shells.

### 1.1 Adapters

**Import**: `@phozart/shared/adapters`

Re-exports from individual adapter modules:

| Module                     | Key exports                                                                                                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-adapter`             | `DataAdapter`, `DataQuery`, `DataResult`, `DataSourceSchema`, `DataSourceSummary`, `ColumnDescriptor`, `FieldMetadata`, `SemanticHint`, `UnitSpec`, `DataQualityInfo`, `QueryStrategy`, `AggregationSpec`, `WindowSpec`, `FieldReference`, `ViewerContext` |
| `persistence-adapter`      | `WorkspaceAdapter`, `EngineStorageAdapter`, `AsyncDefinitionStore`, persistence method types                                                                                                                                                               |
| `measure-registry-adapter` | `MeasureRegistryAdapter`                                                                                                                                                                                                                                   |
| `alert-channel-adapter`    | `AlertChannelAdapter`, `BreachRecord`, `AlertSubscription`                                                                                                                                                                                                 |
| `help-config`              | `HelpConfig`                                                                                                                                                                                                                                               |
| `attention-adapter`        | `AttentionAdapter`, `AttentionItem`                                                                                                                                                                                                                        |
| `usage-analytics-adapter`  | `UsageAnalyticsAdapter`                                                                                                                                                                                                                                    |
| `subscription-adapter`     | `SubscriptionAdapter`                                                                                                                                                                                                                                      |

### 1.2 Types

**Import**: `@phozart/shared/types`

#### ShareTarget

```typescript
type ShareTarget = ShareTargetUser | ShareTargetRole | ShareTargetTeam | ShareTargetEveryone;

interface ShareTargetUser {
  type: 'user';
  userId: string;
}
interface ShareTargetRole {
  type: 'role';
  roleId: string;
}
interface ShareTargetTeam {
  type: 'team';
  teamId: string;
}
interface ShareTargetEveryone {
  type: 'everyone';
}

function isUserTarget(t: ShareTarget): t is ShareTargetUser;
function isRoleTarget(t: ShareTarget): t is ShareTargetRole;
function matchesShareTarget(target: ShareTarget, context: ViewerContext): boolean;
function matchesAnyShareTarget(targets: ShareTarget[], context: ViewerContext): boolean;
function isSharedWith(targets: ShareTarget[], context: ViewerContext): boolean;
```

#### FieldEnrichment

```typescript
interface FieldEnrichment {
  fieldName: string;
  semanticHint?: SemanticHint;
  unit?: UnitSpec;
  description?: string;
  displayName?: string;
}

interface EnrichedFieldMetadata extends FieldMetadata {
  enrichment?: FieldEnrichment;
}

function createFieldEnrichment(
  fieldName: string,
  overrides?: Partial<FieldEnrichment>,
): FieldEnrichment;
function mergeFieldMetadata(
  field: FieldMetadata,
  enrichment?: FieldEnrichment,
): EnrichedFieldMetadata;
```

#### FilterValueHandling

```typescript
type FilterValueSource =
  | { type: 'data-source'; dataSourceId: string; field: string }
  | { type: 'lookup-table'; entries: Array<{ value: unknown; label: string }> }
  | { type: 'static'; values: unknown[] };

type FilterValueTransform =
  | { type: 'lookup' }
  | { type: 'expression'; expression: string }
  | { type: 'granularity-shift'; from: string; to: string };

type FilterDefault =
  | { type: 'static'; value: unknown }
  | { type: 'relative-date'; offset: number; unit: string }
  | { type: 'viewer-attribute'; attribute: string }
  | { type: 'expression'; expression: string };

interface FilterValueHandling {
  valueSource: FilterValueSource;
  transform?: FilterValueTransform;
  default?: FilterDefault;
}

function createDefaultFilterValueHandling(): FilterValueHandling;
function resolveStaticDefault(handling: FilterValueHandling): unknown;
```

#### FilterValueMatchRule

```typescript
type MatchOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'in';
type ExpressionFunction = 'UPPER' | 'LOWER' | 'TRIM' | 'SUBSTRING';

interface FilterValueMatchRule {
  operator: MatchOperator;
  value: unknown;
  expression?: ExpressionFunction;
}

function applyExpression(value: string, fn: ExpressionFunction): string;
function evaluateMatchRule(rule: FilterValueMatchRule, input: unknown): boolean;
```

#### PersonalAlert

```typescript
type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertNotificationChannel = 'in-app' | 'email' | 'webhook';

interface AlertGracePeriodConfig {
  enabled: boolean;
  periodMs: number;
  maxPeriodMs: number;
}

interface PersonalAlertPreference {
  severityFilter: AlertSeverity[];
  channels: AlertNotificationChannel[];
  gracePeriod: AlertGracePeriodConfig;
}

interface PersonalAlert {
  id: string;
  alertRuleId: string;
  name: string;
  description?: string;
  severityFilter: AlertSeverity[];
  enabled: boolean;
}

function createEmptyAlertSummary(): PersonalAlertSummary;
function createDefaultGracePeriodConfig(): AlertGracePeriodConfig;
function isGracePeriodValid(config: AlertGracePeriodConfig): boolean;
function clampGracePeriod(config: AlertGracePeriodConfig): AlertGracePeriodConfig;
```

#### Subscription

```typescript
type SubscriptionFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';
type SubscriptionFormat = 'inline' | 'digest' | 'pdf' | 'csv';

interface SubscriptionSchedule {
  frequency: SubscriptionFrequency;
  dayOfWeek?: number;
  hourOfDay?: number;
}

interface Subscription {
  id: string;
  artifactId: string;
  artifactType: string;
  schedule: SubscriptionSchedule;
  format: SubscriptionFormat;
  enabled: boolean;
  recipientRef: string;
}

function createSubscription(overrides?: Partial<Subscription>): Subscription;
function describeSchedule(schedule: SubscriptionSchedule): string;
function buildSubscriptionDeepLink(sub: Subscription): string;
```

#### AsyncReport

```typescript
type AsyncReportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'expired';

interface AsyncReportJob {
  id: string;
  status: AsyncReportStatus;
  progress?: number;
  resultUrl?: string;
  createdAt: number;
  completedAt?: number;
}

function isTerminalStatus(status: AsyncReportStatus): boolean;
function createAsyncReportJob(overrides?: Partial<AsyncReportJob>): AsyncReportJob;
function isAsyncReportExpired(job: AsyncReportJob, ttlMs?: number): boolean;
function hasAsyncSupport(adapter: unknown): boolean;
```

#### ErrorState & EmptyState

```typescript
type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorState {
  scenario: ErrorScenario;
  severity: ErrorSeverity;
  title: string;
  message: string;
  retryable: boolean;
}

function createErrorState(scenario: ErrorScenario, overrides?: Partial<ErrorState>): ErrorState;
function isRetryableError(state: ErrorState): boolean;
function formatErrorForClipboard(state: ErrorState): string;

interface EmptyState {
  scenario: EmptyScenario;
  title: string;
  message: string;
  actionLabel?: string;
}

function createEmptyState(scenario: EmptyScenario, overrides?: Partial<EmptyState>): EmptyState;
```

#### SingleValueAlertConfig (Spec Amendment A)

```typescript
type AlertVisualMode = 'none' | 'indicator' | 'background' | 'border';
type WidgetAlertSeverity = 'healthy' | 'warning' | 'critical';

interface SingleValueAlertConfig {
  alertRuleBinding?: string;
  alertVisualMode: AlertVisualMode;
  alertAnimateTransition: boolean;
}

interface AlertVisualState {
  severity: WidgetAlertSeverity;
  ruleId?: string;
  lastTransition?: number;
}

type AlertContainerSize = 'full' | 'compact' | 'minimal';

interface AlertTokenSet {
  bg?: string;
  indicator?: string;
  border?: string;
}

function resolveAlertVisualState(
  config: SingleValueAlertConfig,
  alertEvents: Map<string, WidgetAlertSeverity>,
): AlertVisualState;
function getAlertTokens(severity: WidgetAlertSeverity, mode: AlertVisualMode): AlertTokenSet;
function degradeAlertMode(
  mode: AlertVisualMode,
  containerSize: AlertContainerSize,
): DegradedAlertParams;
function createDefaultAlertConfig(): SingleValueAlertConfig;
```

#### MicroWidgetCellConfig (Spec Amendment B)

```typescript
type MicroWidgetDisplayMode = 'value-only' | 'sparkline' | 'delta' | 'gauge-arc';
type MicroWidgetType = 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard';

interface MicroWidgetCellConfig {
  widgetType: MicroWidgetType;
  dataBinding: { valueField: string; compareField?: string; sparklineField?: string };
  displayMode: MicroWidgetDisplayMode;
  thresholds?: { warning?: number; critical?: number };
}

interface MicroWidgetRenderResult {
  html: string;
  width: number;
  height: number;
}

interface MicroWidgetRenderer {
  render(
    config: MicroWidgetCellConfig,
    value: unknown,
    width: number,
    height: number,
  ): MicroWidgetRenderResult;
  canRender(config: MicroWidgetCellConfig, columnWidth: number): boolean;
}

interface CellRendererRegistry {
  register(type: string, renderer: MicroWidgetRenderer): void;
  get(type: string): MicroWidgetRenderer | null;
  has(type: string): boolean;
  getRegisteredTypes(): string[];
}

function createCellRendererRegistry(): CellRendererRegistry;
```

#### ImpactChainNode (Spec Amendment C)

```typescript
type ImpactNodeRole = 'root-cause' | 'failure' | 'impact' | 'hypothesis';
type HypothesisState = 'validated' | 'inconclusive' | 'invalidated' | 'pending';

interface ImpactMetric {
  label: string;
  value: string;
  field: string;
}

interface ImpactChainNode extends DecisionTreeNode {
  nodeRole?: ImpactNodeRole;
  hypothesisState?: HypothesisState;
  impactMetrics?: ImpactMetric[];
  edgeLabel?: string;
}

type ChainLayoutDirection = 'horizontal' | 'vertical';

interface ChainLayout {
  direction: ChainLayoutDirection;
  showEdgeLabels: boolean;
  collapseInvalidated: boolean;
  conclusionText?: string;
}

type DecisionTreeRenderVariant = 'tree' | 'impact-chain';

interface DecisionTreeVariantConfig {
  renderVariant: DecisionTreeRenderVariant;
  chainLayout?: ChainLayout;
}
```

#### Attention Filter (Spec Amendment D)

```typescript
type AttentionPriority = 'critical' | 'warning' | 'info';
type AttentionSource = 'alert' | 'system' | 'external' | 'stale' | 'review' | 'broken-query';

interface AttentionFacetValue {
  value: string;
  count: number;
  color?: string;
}
interface AttentionFacet {
  field: string;
  label: string;
  values: AttentionFacetValue[];
  multiSelect: boolean;
}

interface AttentionFilterState {
  priority?: AttentionPriority[];
  source?: AttentionSource[];
  artifactId?: string[];
  acknowledged?: boolean;
  dateRange?: { from: number; to: number };
}

interface FilterableAttentionItem {
  id: string;
  priority: AttentionPriority;
  source: AttentionSource;
  artifactId?: string;
  acknowledged: boolean;
  timestamp: number;
}

function filterAttentionItems(
  items: FilterableAttentionItem[],
  filter: AttentionFilterState,
): FilterableAttentionItem[];
function computeAttentionFacets(
  items: FilterableAttentionItem[],
  activeFilter?: AttentionFilterState,
): AttentionFacet[];
```

#### Additional Types

- `WidgetPosition`, `DashboardWidget`, `ViewSwitchingMode`, `WidgetView`, `WidgetViewGroup`
- `ExpandableWidgetConfig`, `ContainerBoxConfig`
- `NodeStatus`, `DecisionTreeNode`, `evaluateNodeStatus()`
- `ApiEndpoint`, `ApiParam`, `ApiSchemaRef`, `ApiSpec`, `APIRoleAccess`, `APISpecConfig`, `createApiEndpoint()`
- `MessageTone`, `MessagePool`, `ERROR_MESSAGE_POOLS`, `EMPTY_STATE_MESSAGE_POOLS`, `getRandomMessage()`, `getAllMessages()`
- `FilterPresetValue`, `createDefaultFilterPresetValue()`

### 1.3 Design System

**Import**: `@phozart/shared/design-system`

Re-exports from:

- `design-tokens.ts` — `DESIGN_TOKENS` (19 colors, spacing 4px grid, typography, radii, shadows)
- `responsive.ts` — breakpoint utilities (desktop, laptop, tablet, mobile)
- `container-queries.ts` — per-widget-type container query thresholds
- `component-patterns.ts` — CSS patterns for forms, modals, drawers, empty states, loading skeletons
- `shell-layout.ts` — `SHELL_LAYOUT` constants (header height, sidebar width, content max width)
- `icons.ts` — icon set constants
- `mobile.ts` — mobile interaction helpers (bottom tab bar, bottom sheets, swipe gestures)
- `alert-tokens.ts` — alert severity color tokens for widget alert visualization
- `chain-tokens.ts` — impact chain edge and node style tokens

### 1.4 Artifacts

**Import**: `@phozart/shared/artifacts`

```typescript
// Visibility
type ArtifactVisibility = 'personal' | 'shared' | 'published';

interface VisibilityMeta {
  id: string;
  type: ArtifactType;
  name: string;
  visibility: ArtifactVisibility;
  ownerId: string;
  sharedWith: string[];
  description?: string;
}

function isVisibleToViewer(meta: VisibilityMeta, context: ViewerContext): boolean;
function groupByVisibility(metas: VisibilityMeta[]): Map<ArtifactVisibility, VisibilityMeta[]>;
function canTransition(from: ArtifactVisibility, to: ArtifactVisibility): boolean;
function transitionVisibility(
  meta: VisibilityMeta,
  to: ArtifactVisibility,
  sharedWith?: string[],
): VisibilityMeta;
function duplicateWithVisibility(meta: VisibilityMeta, newOwnerId: string): VisibilityMeta;

// Default presentation
interface DefaultPresentation {
  density?: string;
  theme?: string;
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  hiddenColumns?: string[];
  frozenColumns?: number;
  sortState?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

function createDefaultPresentation(overrides?: Partial<DefaultPresentation>): DefaultPresentation;
function mergePresentation(
  base: DefaultPresentation,
  overlay?: Partial<DefaultPresentation>,
): DefaultPresentation;

// Personal view
interface PersonalView {
  userId: string;
  artifactId: string;
  presentation: Partial<DefaultPresentation>;
  savedAt: number;
}

function createPersonalView(
  userId: string,
  artifactId: string,
  presentation: Partial<DefaultPresentation>,
): PersonalView;
function applyPersonalView(base: DefaultPresentation, personal?: PersonalView): DefaultPresentation;

// Grid artifact
interface GridArtifact {
  id: string;
  type: 'grid-definition';
  dataSourceId: string;
  columns: GridColumnConfig[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  defaultFilters?: unknown;
  density?: string;
  enableGrouping?: boolean;
  enableExport?: boolean;
}

function isGridArtifact(meta: ArtifactMeta): boolean;
function createGridArtifact(overrides?: Partial<GridArtifact>): GridArtifact;
function gridArtifactToMeta(artifact: GridArtifact): ArtifactMeta;
```

### 1.5 Coordination

**Import**: `@phozart/shared/coordination`

Major state machines and coordination types. All are pure functions with
immutable state transitions.

| Module                     | Key exports                                                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filter-context`           | `FilterContextManager`, `createFilterContext()`, `DashboardFilterDef`, `FieldMapping`, `resolveFieldForSource()`, `createDebouncedFilterDispatch()`                                                                                 |
| `dashboard-data-pipeline`  | `DashboardLoadingState`, `PreloadConfig`, `FullLoadConfig`, `DetailSourceConfig`, `DashboardDataConfig`, `DashboardDataPipeline`, `DataSourceConfig`, `migrateLegacyDataConfig()`                                                   |
| `query-coordinator`        | `QueryCoordinatorConfig`, `defaultQueryCoordinatorConfig()`, `CoordinatorQuery`, `CoordinatorResult`, `QueryCoordinatorInstance`                                                                                                    |
| `interaction-bus`          | `WidgetEvent`, `InteractionBus`, `createInteractionBus()`                                                                                                                                                                           |
| `navigation-events`        | `NavigationFilterMapping`, `NavigationFilter`, `NavigationEvent`, `resolveNavigationFilters()`, `buildNavigationEvent()`, `emitNavigationEvent()`                                                                                   |
| `loading-state`            | `LoadingPhase`, `LoadingState`, `createInitialLoadingState()`, `updateLoadingProgress()`, `isLoadingComplete()`, `MultiSourceLoadingState`, `createMultiSourceLoadingState()`, `updateSourceProgress()`, `computeOverallProgress()` |
| `execution-strategy`       | `ExecutionEngine`, `ExecutionStrategyConfig`, `ExecutionContext`, `createDefaultExecutionStrategy()`, `selectExecutionEngine()`, `selectEngineForFeature()`                                                                         |
| `server-mode`              | `ServerGridConfig`, `createDefaultServerGridConfig()`, `isServerMode()`, `hasServerCapability()`                                                                                                                                    |
| `export-config`            | `GridExportConfig`, `createDefaultExportConfig()`, `shouldUseAsyncExport()`, `isFormatEnabled()`                                                                                                                                    |
| `filter-auto-save`         | `FilterAutoSaveConfig`, `FilterStateSnapshot`, `createDefaultAutoSaveConfig()`, `createFilterSnapshot()`, `shouldAutoSave()`, `pruneHistory()`                                                                                      |
| `async-report-ui-state`    | `AsyncReportUIState`, `createAsyncReportUIState()`, `addJob()`, `updateJobStatus()`, `removeJob()`, `getCompletedJobs()`, `getActiveJobs()`                                                                                         |
| `exports-tab-state`        | `ExportEntry`, `ExportsTabState`, `createExportsTabState()`, `addExport()`, `updateExport()`, `removeExport()`, `setSort()`, `setFilterStatus()`, `getVisibleExports()`                                                             |
| `subscriptions-tab-state`  | `SubscriptionsTabState`, `createSubscriptionsTabState()`, `setSubscriptions()`, `setActiveTab()`, `setSearchQuery()`, `getFilteredSubscriptions()`, `countByStatus()`                                                               |
| `expression-builder-state` | `ExpressionNode`, `ExpressionBuilderState`, `createExpressionBuilderState()`, `addNode()`, `removeNode()`, `updateNode()`, `buildExpression()`, `validateExpression()`                                                              |
| `preview-context-state`    | `PreviewContextState`, `createPreviewContextState()`, `enablePreview()`, `disablePreview()`, `selectRole()`, `setCustomUserId()`, `getEffectiveContext()`                                                                           |
| `attention-faceted-state`  | `AttentionFacetedState`, `initialAttentionFacetedState()`, `toggleFacetValue()`, `clearFacet()`, `clearAllFilters()`, `acknowledgeItem()`, `acknowledgeAllVisible()`, `setAttentionSort()`, `loadMore()`, `getVisibleItems()`       |

---

## 2. @phozart/viewer

**Import**: `@phozart/viewer`
**Source**: `packages/viewer/src/`

### Shell State

```typescript
type ViewerScreen = 'catalog' | 'dashboard' | 'report' | 'explorer' | 'error' | 'empty';

interface ViewerShellState {
  screen: ViewerScreen;
  history: NavigationEntry[];
  historyIndex: number;
  errorMessage?: string;
  emptyMessage?: string;
  loading: boolean;
  attentionCount: number;
  viewerContext?: unknown;
  filterContext?: unknown;
  mobileLayout: boolean;
}

function createViewerShellState(overrides?: Partial<ViewerShellState>): ViewerShellState;
function navigateTo(
  state: ViewerShellState,
  screen: ViewerScreen,
  params?: Record<string, string>,
): ViewerShellState;
function navigateBack(state: ViewerShellState): ViewerShellState;
function navigateForward(state: ViewerShellState): ViewerShellState;
function canGoBack(state: ViewerShellState): boolean;
function canGoForward(state: ViewerShellState): boolean;
function setError(state: ViewerShellState, message: string): ViewerShellState;
function setEmpty(state: ViewerShellState, message: string): ViewerShellState;
function setLoading(state: ViewerShellState, loading: boolean): ViewerShellState;
function setAttentionCount(state: ViewerShellState, count: number): ViewerShellState;
function setMobileLayout(state: ViewerShellState, mobile: boolean): ViewerShellState;
```

### Navigation

```typescript
interface ViewerRoute {
  screen: ViewerScreen;
  params: Record<string, string>;
}

function parseRoute(path: string): ViewerRoute;
function buildRoutePath(route: ViewerRoute): string;
function screenForArtifactType(type: string): ViewerScreen;
```

### Configuration

```typescript
interface ViewerFeatureFlags {
  enableExplore?: boolean;
  enableExport?: boolean;
  enableAttention?: boolean;
  enableFilterBar?: boolean;
}

interface ViewerBranding {
  appName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface ViewerShellConfig {
  featureFlags: ViewerFeatureFlags;
  branding: ViewerBranding;
}

function createViewerShellConfig(overrides?: Partial<ViewerShellConfig>): ViewerShellConfig;
function createDefaultFeatureFlags(): ViewerFeatureFlags;
```

### Screen State Machines

**CatalogState**: `createCatalogState()`, `setSearchQuery()`, `setTypeFilter()`, `setCatalogSort()`, `setCatalogPage()`, `setCatalogArtifacts()`, `toggleFavorite()`, `toggleViewMode()`, `getCurrentPage()`, `getTotalPages()`

**DashboardViewState**: `createDashboardViewState()`, `loadDashboard()`, `setWidgetLoading()`, `setWidgetError()`, `applyCrossFilter()`, `clearCrossFilter()`, `clearAllCrossFilters()`, `toggleFullscreen()`, `toggleWidgetExpanded()`, `refreshDashboard()`

**ReportViewState**: `createReportViewState()`, `loadReport()`, `setReportData()`, `setReportSort()`, `toggleReportSort()`, `setReportPage()`, `setReportPageSize()`, `setReportSearch()`, `toggleColumnVisibility()`, `setExporting()`, `getReportTotalPages()`, `getVisibleColumns()`

**ExplorerScreenState**: `createExplorerScreenState()`, `setDataSources()`, `selectDataSource()`, `setFields()`, `setPreviewMode()`, `setSuggestedChartType()`, `setFieldSearch()`, `getExplorerSnapshot()`, `getFilteredFields()`

**AttentionDropdownState**: `createAttentionDropdownState()`, `setAttentionItems()`, `toggleAttentionDropdown()`, `markItemsAsRead()`, `markAllAsRead()`, `dismissItem()`, `setAttentionTypeFilter()`, `getFilteredItems()`

**FilterBarState**: `createFilterBarState()`, `setFilterDefs()`, `openFilter()`, `closeFilter()`, `setFilterValue()`, `clearFilterValue()`, `clearAllFilters()`, `setPresets()`, `applyPreset()`, `toggleFilterBarCollapsed()`, `getActiveFilterCount()`, `hasFilterValue()`

### Components

| Tag                        | Class                  | Purpose                            |
| -------------------------- | ---------------------- | ---------------------------------- |
| `<phz-viewer-shell>`       | `PhzViewerShell`       | Top-level viewer container         |
| `<phz-viewer-catalog>`     | `PhzViewerCatalog`     | Card-based artifact catalog        |
| `<phz-viewer-dashboard>`   | `PhzViewerDashboard`   | Dashboard viewer with cross-filter |
| `<phz-viewer-report>`      | `PhzViewerReport`      | Report viewer with sort/pagination |
| `<phz-viewer-explorer>`    | `PhzViewerExplorer`    | Ad-hoc data exploration            |
| `<phz-attention-dropdown>` | `PhzAttentionDropdown` | Notification bell dropdown         |
| `<phz-filter-bar>`         | `PhzFilterBar`         | Dashboard filter bar               |
| `<phz-viewer-error>`       | `PhzViewerError`       | Error state display                |
| `<phz-viewer-empty>`       | `PhzViewerEmpty`       | Empty state display                |

---

## 3. @phozart/editor

**Import**: `@phozart/editor`
**Source**: `packages/editor/src/`

### Shell State

```typescript
type EditorScreen = 'catalog' | 'dashboard' | 'report' | 'explorer' | 'settings' | 'error';

interface EditorShellState {
  screen: EditorScreen;
  history: NavigationEntry[];
  historyIndex: number;
  editMode: boolean;
  unsavedChanges: boolean;
  undoStack: unknown[];
  redoStack: unknown[];
  loading: boolean;
  error?: string;
  measures: unknown[];
  autoSaveEnabled: boolean;
  autoSaveDebounceMs: number;
}

function createEditorShellState(overrides?: Partial<EditorShellState>): EditorShellState;
function navigateTo(
  state: EditorShellState,
  screen: EditorScreen,
  params?: Record<string, string>,
): EditorShellState;
function toggleEditMode(state: EditorShellState): EditorShellState;
function markUnsavedChanges(state: EditorShellState): EditorShellState;
function markSaved(state: EditorShellState): EditorShellState;
function pushUndo(state: EditorShellState, snapshot: unknown): EditorShellState;
function undo(state: EditorShellState): EditorShellState;
function redo(state: EditorShellState): EditorShellState;
function canUndo(state: EditorShellState): boolean;
function canRedo(state: EditorShellState): boolean;
function toggleAutoSave(state: EditorShellState): EditorShellState;
```

### Navigation

```typescript
interface EditorRoute {
  screen: EditorScreen;
  params: Record<string, string>;
}
interface Breadcrumb {
  label: string;
  screen: EditorScreen;
  params?: Record<string, string>;
}

function parseRoute(path: string): EditorRoute;
function buildRoutePath(route: EditorRoute): string;
function buildBreadcrumbs(route: EditorRoute): Breadcrumb[];
function getScreenLabel(screen: EditorScreen): string;
function buildEditorDeepLink(route: EditorRoute): string;
```

### Configuration

```typescript
interface EditorFeatureFlags {
  enableExplore?: boolean;
  enableTemplates?: boolean;
  enableSharing?: boolean;
  enableAlerts?: boolean;
  enableSubscriptions?: boolean;
}

interface EditorShellConfig {
  featureFlags: EditorFeatureFlags;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

function createEditorShellConfig(overrides?: Partial<EditorShellConfig>): EditorShellConfig;
function validateEditorConfig(config: EditorShellConfig): ConfigValidationResult;
```

### Screen State Machines

**CatalogState**: `createCatalogState()`, `setCatalogItems()`, `searchCatalog()`, `filterCatalogByType()`, `filterCatalogByVisibility()`, `sortCatalog()`, `openCreateDialog()`, `closeCreateDialog()`

**DashboardViewState**: `createDashboardViewState()`, `setDashboardData()`, `setPermissions()`, `expandWidget()`, `collapseWidget()`

**DashboardEditState**: `createDashboardEditState()`, `addWidget()`, `removeWidget()`, `updateWidgetConfig()`, `moveWidget()`, `resizeWidget()`, `selectWidget()`, `deselectWidget()`, `startDrag()`, `updateDragTarget()`, `endDrag()`, `cancelDrag()`, `toggleConfigPanel()`, `toggleMeasurePalette()`, `setGridLayout()`, `setDashboardTitle()`, `markDashboardSaved()`

**ReportEditState**: `createReportEditState()`, `addReportColumn()`, `removeReportColumn()`, `updateReportColumn()`, `reorderReportColumns()`, `addReportFilter()`, `removeReportFilter()`, `setReportSorts()`, `toggleReportPreview()`, `setReportPreviewData()`, `setReportTitle()`, `setReportDataSource()`, `markReportSaved()`

**ExplorerState**: `createExplorerState()`, `addDimension()`, `removeDimension()`, `addMeasure()`, `removeMeasure()`, `addExplorerFilter()`, `removeExplorerFilter()`, `setExplorerSort()`, `setExplorerLimit()`, `setExplorerResults()`, `setSuggestedChartType()`, `openSaveDialog()`, `updateSaveTarget()`, `closeSaveDialog()`

**MeasurePaletteState**: `createMeasurePaletteState()`, `searchMeasures()`, `filterByCategory()`, `setActiveTab()`, `selectPaletteItem()`, `deselectPaletteItem()`, `refreshPaletteData()`

**ConfigPanelState**: `createConfigPanelState()`, `setConfigValue()`, `removeConfigValue()`, `setFullConfig()`, `setAllowedFields()`, `validateConfig()`, `isConfigValid()`, `setExpandedSection()`

**SharingFlowState**: `createSharingFlowState()`, `setTargetVisibility()`, `addShareTarget()`, `removeShareTarget()`, `clearShareTargets()`, `setShareSearchQuery()`, `setShareSearchResults()`, `setSharingSaving()`, `markSharingSaved()`, `hasVisibilityChanged()`, `canSaveSharing()`

**AlertSubscriptionState**: `createAlertSubscriptionState()`, `setAlertSubTab()`, `searchAlertsSubs()`, `setAlerts()`, `addAlert()`, `updateAlert()`, `removeAlert()`, `toggleAlertEnabled()`, `setSubscriptions()`, `addSubscription()`, `updateSubscription()`, `removeSubscription()`, `toggleSubscriptionEnabled()`, `openCreateAlert()`, `openCreateSubscription()`, `startEditingAlert()`, `startEditingSubscription()`, `cancelEditing()`

### Components

| Tag                        | Class                  | Purpose                             |
| -------------------------- | ---------------------- | ----------------------------------- |
| `<phz-editor-shell>`       | `PhzEditorShell`       | Top-level editor container          |
| `<phz-editor-catalog>`     | `PhzEditorCatalog`     | Artifact catalog with create dialog |
| `<phz-editor-dashboard>`   | `PhzEditorDashboard`   | Dashboard view/edit                 |
| `<phz-editor-report>`      | `PhzEditorReport`      | Report view/edit                    |
| `<phz-editor-explorer>`    | `PhzEditorExplorer`    | Data exploration                    |
| `<phz-measure-palette>`    | `PhzMeasurePalette`    | Drag source for measures            |
| `<phz-config-panel>`       | `PhzConfigPanel`       | Widget configuration panel          |
| `<phz-sharing-flow>`       | `PhzSharingFlow`       | Artifact sharing dialog             |
| `<phz-alert-subscription>` | `PhzAlertSubscription` | Alert & subscription management     |

---

## 4. New Engine Exports

**Import**: `@phozart/engine`
**Source**: `packages/engine/src/`

### 4.1 Explorer

Moved from `@phozart/workspace/explore` to `@phozart/engine/explorer`.

```typescript
// Sub-path import
import { createFieldPalette, suggestChartType } from '@phozart/engine/explorer';
```

| Export                                                                                          | Purpose                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `exploreToDataQuery()`                                                                          | Convert `ExploreQuery` to `DataQuery`    |
| `validateAggregation()`                                                                         | Check field/aggregation compatibility    |
| `createFieldPalette()`, `groupFieldsByType()`, `searchFields()`, `autoPlaceField()`             | Field palette management                 |
| `createDropZoneState()`, `addFieldToZone()`, `removeFieldFromZone()`, `moveFieldBetweenZones()` | Drop zone state                          |
| `createPreviewController()`, `toExploreQuery()`                                                 | Pivot preview                            |
| `suggestChartType()`                                                                            | Chart type suggestion from field profile |
| `exploreToReport()`, `exploreToDashboardWidget()`                                               | Artifact conversion                      |
| `createDataExplorer()`                                                                          | Full explorer state machine              |
| `promoteFilterToDashboard()`, `buildDrillThroughPrePopulation()`                                | Dashboard integration                    |

### 4.2 Personal Alert Engine

```typescript
interface AlertEvaluationResult {
  alertId: string;
  triggered: boolean;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
  withinGracePeriod: boolean;
}

interface AlertEvaluationContract {
  evaluate(alertId: string, dataSourceId: string): Promise<AlertEvaluationResult>;
  subscribe(alertId: string, callback: (result: AlertEvaluationResult) => void): () => void;
  getHistory(alertId: string, limit?: number): AlertEvaluationResult[];
}

function createInMemoryAlertContract(): AlertEvaluationContract;
```

### 4.3 Subscription Engine

```typescript
interface SubscriptionEngineState {
  subscriptions: Subscription[];
  activeSubscriptionId: string | null;
  processing: boolean;
}

function createSubscriptionEngineState(
  overrides?: Partial<SubscriptionEngineState>,
): SubscriptionEngineState;
function addSubscription(
  state: SubscriptionEngineState,
  sub: Subscription,
): SubscriptionEngineState;
// Also: removeSubscription, setActiveSubscription, startProcessing, stopProcessing,
//       isReadyForExecution, getNextExecutionTime
```

### 4.4 Usage Analytics

```typescript
interface BufferedEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

interface UsageCollectorState {
  buffer: BufferedEvent[];
  bufferSize: number;
  flushIntervalMs: number;
  collecting: boolean;
}

interface UsageCollectorConfig {
  bufferSize?: number;
  flushIntervalMs?: number;
}

function createUsageCollector(config?: UsageCollectorConfig): UsageCollectorState;
// Also: trackEvent, flush, shouldFlush, pauseCollection, resumeCollection
```

### 4.5 OpenAPI Generator

```typescript
interface OpenAPIDocument {
  openapi: '3.1.0';
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown> };
}

function generateOpenAPISpec(spec: ApiSpec, config?: APISpecConfig): OpenAPIDocument;
```

### 4.6 Attention System

```typescript
interface AttentionSystemState {
  items: AttentionItem[];
  unreadCount: number;
  lastFetchedAt: number | null;
  fetchIntervalMs: number;
  categories: string[];
}

function createAttentionSystemState(
  overrides?: Partial<AttentionSystemState>,
): AttentionSystemState;
// Also: addItems, markAsRead, dismissItem, clearAll,
//       getUnreadCount, getItemsByCategory, setFetchInterval
```

---

## 5. New Workspace Exports

**Import**: `@phozart/workspace`
**Source**: `packages/workspace/src/`

### 5.1 Command Palette

**Source**: `packages/workspace/src/shell/command-palette-state.ts`

```typescript
type ActionCategory = 'navigate' | 'create' | 'configure' | 'export' | 'help';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  category: ActionCategory;
  keywords: string[];
  shortcut?: string;
  icon?: string;
  handler: () => void;
}

interface CommandResult {
  type: 'artifact' | 'action' | 'recent';
  artifact?: ArtifactMeta;
  action?: CommandAction;
  score: number;
}

interface CommandPaletteState {
  open: boolean;
  query: string;
  results: CommandResult[];
  selectedIndex: number;
  recentItems: CommandResult[];
  maxRecentItems: number;
  registeredActions: CommandAction[];
}

function initialCommandPaletteState(actions?: CommandAction[]): CommandPaletteState;
// Also: openPalette, closePalette, setQuery, search, selectNext, selectPrevious,
//       executeSelected, addToRecent, registerAction, unregisterAction
```

### 5.2 Keyboard Shortcuts

**Source**: `packages/workspace/src/shell/keyboard-shortcuts-state.ts`

```typescript
type ShortcutContext =
  | 'global'
  | 'catalog'
  | 'report-editor'
  | 'dashboard-editor'
  | 'settings'
  | 'command-palette';

interface ContextualShortcut extends ShortcutEntry {
  context: ShortcutContext;
  group: string;
  customizable: boolean;
}

interface KeyboardShortcutsState {
  shortcuts: ContextualShortcut[];
  activeContext: ShortcutContext;
  helpOverlayOpen: boolean;
  customBindings: Map<string, { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }>;
  recordingShortcutId?: string;
}

const DEFAULT_CONTEXTUAL_SHORTCUTS: ContextualShortcut[];

// Also: initialKeyboardShortcutsState, setActiveContext, openHelpOverlay,
//       closeHelpOverlay, startRecording, stopRecording, setCustomBinding,
//       resetBinding, detectConflicts, matchContextualShortcut
```

### 5.3 Settings State

**Source**: `packages/workspace/src/govern/settings-state.ts`

```typescript
type ThemeMode = 'light' | 'dark' | 'auto';

interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  appName: string;
  faviconUrl?: string;
}

interface DefaultSettings {
  density: 'compact' | 'dense' | 'comfortable';
  pageSize: number;
  defaultView: 'card' | 'table';
  locale: string;
  timezone: string;
  dateFormat: string;
  numberFormat: 'us' | 'eu';
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

interface SettingsState {
  theme: ThemeMode;
  branding: BrandingConfig;
  defaults: DefaultSettings;
  featureFlags: FeatureFlag[];
  dirty: boolean;
  lastSavedAt?: number;
}

const BUILT_IN_FLAGS: FeatureFlag[];

// Also: initialSettingsState, setTheme, setBranding, setDefaults,
//       toggleFeatureFlag, markSettingsDirty, markSettingsSaved
```

### 5.4 API Access State

**Source**: `packages/workspace/src/govern/api-access-state.ts`

```typescript
type ApiKeyStatus = 'active' | 'revoked' | 'expired';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  status: ApiKeyStatus;
  scopes: string[];
  rateLimit: RateLimitConfig;
  createdBy: string;
}

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

interface ApiRole {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  isBuiltIn: boolean;
}

interface ApiAccessState {
  keys: ApiKey[];
  roles: ApiRole[];
  selectedKeyId?: string;
  editingKey?: Partial<ApiKey>;
  search: string;
  statusFilter?: ApiKeyStatus;
  openApiSpec?: string;
}

const API_SCOPES: readonly string[];
type ApiScope =
  | 'read:artifacts'
  | 'write:artifacts'
  | 'read:data'
  | 'write:data'
  | 'admin:settings'
  | 'admin:users'
  | 'export:reports'
  | 'execute:queries';

const BUILT_IN_ROLES: ApiRole[];

// Also: initialApiAccessState, addKey, revokeKey, updateKey, deleteKey,
//       selectKey, setEditingKey, setSearch, setStatusFilter,
//       setOpenApiSpec, getFilteredKeys, isKeyExpired
```
