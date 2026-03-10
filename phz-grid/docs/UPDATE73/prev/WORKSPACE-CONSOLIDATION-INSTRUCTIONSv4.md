# phz-workspace Consolidation — Claude Code Instructions

## Context and honest gap assessment

phz-grid has strong computation and rendering layers: a 5-layer expression DAG,
20+ SVG widgets, DuckDB-WASM adapter, filter expression AST, query planner, and
framework adapters for React/Vue/Angular/Python. What it does not have is a
coherent authoring environment.

The current admin tools are fragmented:
- `ReportDesigner` (6-step wizard) lives in `engine-admin`
- `DashboardBuilder` (3-panel) lives in `engine-admin`
- `KPIDesigner` (6-step wizard) lives in `engine-admin`
- `FilterStudio` lives in `engine-admin`
- `GridAdmin` (tab-based config) lives in `grid-admin`
- `GridCreator` (5-step wizard) lives in `grid-creator`

These are individual tools, not a workspace. There is no:
- Unified shell that navigates between tools
- Catalog browser to list, search, and manage saved artifacts
- Template system for rapid dashboard creation
- Data-driven layout suggestion after data source selection
- Formalized adapter interfaces (WorkspaceAdapter, DataAdapter)
- Open widget registry (current widget resolution is implicit)
- Intent-based layout (current dashboard layout is absolute grid positioning)
- Schema versioning with migration functions
- Capability declaration from consumer to workspace
- Placement/publishing system for routing artifacts to roles
- Alert rules, subscriptions, or breach detection on KPI/metric status transitions
- Compound risk identification across multiple KPIs
- Visual highlighting of active breaches in rendered dashboards

The goal is to consolidate authoring into `@phozart/phz-workspace` — a single
embeddable Web Component that acts as a general-purpose BI authoring environment.
The output is versioned JSON config. The consumer provides data. The workspace
provides the authoring surface and the rendering contract.

This is an open-source project (MIT). The design should prioritize:
- Time to first dashboard under 5 minutes
- Zero-code report/dashboard creation for end users
- Extensibility without modification (open widget registry, adapter SPI)
- Framework-agnostic embedding (Web Components with Lit)

---

## Phase 1: Research — Do Not Make Any Changes Yet

Read the full codebase before touching anything. Output a markdown analysis file.

### 1.1 Map every package

For each package in the monorepo, document:
- What it exports (public API surface)
- What it imports from other internal packages
- Whether it contains any DOM/rendering code
- Whether it contains computation code that runs at render time (consumer-side)
- Whether it contains only authoring/configuration code (workspace-side)
- Whether it contains shared types/interfaces/schemas used by both sides

Packages to cover: `core`, `engine`, `grid`, `widgets`, `criteria`, `definitions`,
`grid-admin`, `engine-admin`, `grid-creator`, `duckdb`, `ai`, `collab`,
`react`, `vue`, `angular`.

### 1.2 Identify the consumer/workspace boundary

The split rule:
- **Consumer-side**: executes during report/dashboard rendering in the consumer app
- **Workspace-side**: executes only during config authoring by an admin
- **Shared**: types, interfaces, Zod schemas, branded IDs used by both sides

For each export in `criteria` and `engine`, classify it. Pay attention to:
- `CriteriaEngine` and `resolve-criteria` in engine — likely consumer-side
- `FilterRegistry` and `FilterBindingStore` — evaluate which side
- `phz-filter-designer` and `phz-filter-studio` — likely workspace-side
- `phz-selection-criteria` — likely consumer-side
- Store implementations in `definitions` — split between dev adapter and interface

### 1.3 Map the SaveController

Read `packages/engine-admin/src/save-controller.ts` fully. Document:
- What state it manages
- What events it emits
- What it persists and where
- Whether it has a pluggable adapter or writes to a fixed store

### 1.4 Map widget resolution path

Trace what happens when a consumer app loads a report/dashboard config and renders it:
- How does a widget type string (e.g. `"bar-chart"`) resolve to a rendered component?
- Is there an explicit registry, or is the mapping hardcoded in a switch/if-else?
- What happens if the config references a widget type the consumer doesn't have?
- Are widget configs self-describing or do they assume renderer knowledge?

Classify as: closed registry, open registry, or implicit coupling.

### 1.5 Map the data query resolution path

Trace how data bindings in configs get resolved to actual data:
- Does the consumer receive a query descriptor and execute it?
- Does `engine` contain query-building logic that runs at render time?
- Is there an implicit DataAdapter, or does each consumer hard-wire data fetching?
- Can a config authored in the workspace render with a completely different data backend?

### 1.6 Map expression evaluation boundaries

The 5-layer hierarchy (Fields → Parameters → Calculated Fields → Metrics → KPIs):
- Which layers evaluate at authoring time vs. render time?
- Does the consumer need the full expression evaluator to render a dashboard?
- If a user changes a filter at runtime, does the expression tree re-walk?
- Can expression evaluation be isolated into a standalone tree-shakeable module?

### 1.7 Audit the layout model

Look at how spatial arrangement is encoded in dashboard configs:
- Classify as absolute (row/col/span), intent-based (semantic grouping with weights),
  or mixed
- If absolute, document what would need to change for intent-based layout
- Check whether CSS Container Queries are used anywhere in the widget CSS

### 1.8 Audit the filter and criteria system end-to-end

The `criteria` package has SelectionCriteria, FilterDesigner, FilterConfigurator,
RuleAdmin, and PresetAdmin. The `engine` has CriteriaEngine and resolve-criteria.
Document the full filter lifecycle:

- How does a filter UI component (e.g. date-range picker) communicate its
  current value to the rest of the system?
- Does filter state propagate at the dashboard level (one filter affects
  all widgets) or per-widget?
- Is there a concept of "filter context" — a shared set of active filters
  that all widgets on a dashboard subscribe to?
- How do cascading filters work (selecting a region limits the available
  cities)? Does CriteriaEngine handle dependency resolution?
- Can filter state be serialized to a URL for sharing/bookmarking?
- Are there saved filter presets (named filter combinations)?
- How does the filter bar interact with cross-filtering from widget clicks?
  Do they merge or conflict?
- Does the DataAdapter receive filter expressions, or are filters applied
  client-side after data fetch?

This audit is critical because filtering touches every layer: the DataAdapter
query, the engine computation, the widget rendering, and the user interaction.
If filters are currently bolted on, they need to become a first-class data
flow concern.

### 1.9 Audit the template and preset landscape

Check whether any concept of "template" exists in the codebase:
- Dashboard templates, report templates, starter configs
- Any heuristic that examines field metadata to suggest visualizations
- Any wizard step that proposes defaults based on the selected data source

### 1.10 Map the existing admin tool UX flows

For each admin tool (ReportDesigner, DashboardBuilder, KPIDesigner, FilterStudio,
GridAdmin, GridCreator), document:
- Entry point (how does a user open it?)
- State management (how is in-progress work tracked?)
- Save flow (what happens on save? where does the config go?)
- Exit flow (how does a user leave without saving?)
- Inter-tool navigation (can a user move from one tool to another?)

This reveals how fragmented the current authoring experience is.

### 1.11 Evaluate schema evolution readiness

- Do current configs carry a schema version field?
- Are there migration functions or compatibility shims?
- What is the oldest config format still in use?
- How does the Zod validation layer handle unknown/extra fields?

### 1.12 Audit the status engine for alert-readiness

The existing status engine (`computeStatus()`, `computeDelta()`, `classify()`)
already evaluates KPIs against thresholds and returns OK/warning/critical.
Document:

- What inputs `computeStatus(value, kpi)` requires and what it returns
- Whether `computeDelta(current, prev, kpi)` tracks direction/trend
- Whether any concept of "previous status" or "status transition" exists
  (e.g. was this KPI OK last evaluation and is now critical?)
- Whether compound conditions across multiple KPIs can be expressed using
  the existing expression AST (e.g. "revenue dropped AND churn increased")
- Whether the expression compiler can evaluate boolean conditions, not just
  numeric calculations
- Whether any notification, subscription, or alert concept exists anywhere
  in the codebase

The status engine is the foundation for the alert system. The gap is the
reactive layer: detecting transitions, evaluating compound conditions,
tracking breach state, and notifying subscribers.

### 1.13 Output of Phase 1

Write `WORKSPACE-CONSOLIDATION-ANALYSIS.md` containing:

1. **Package classification table**: each package with columns `keep-separate`,
   `merge-into-workspace`, `merge-into-shared-types`, `partially-split`
2. **Boundary case findings**: per-export classification for `criteria` and `engine`
3. **SaveController summary**: current behavior and what needs to change
4. **Widget resolution findings**: current mechanism and what must change
5. **Data resolution findings**: current mechanism and what must change
6. **Expression evaluation boundaries**: what the consumer must ship
7. **Layout model assessment**: current state and migration path
8. **Template/preset landscape**: what exists vs. what's needed
9. **Filter system assessment**: current filter lifecycle, dashboard-level propagation gaps, cascading support, URL serialization readiness
10. **Admin tool UX flow map**: fragmentation analysis
11. **Proposed adapter interfaces**: formalized TypeScript interfaces
12. **Status engine alert-readiness**: what exists, what's missing for reactive alerts
13. **Risk flags**: breaking changes, hidden dependencies, migration complexity

Do not proceed to Phase 2 until Phase 1 is complete and reviewed.

---

## Phase 2: Foundation — Shared Types and Adapter Interfaces

### 2.1 Create the shared types package

Create `packages/phz-types`. This package contains only:
- Branded ID types (`ReportId`, `DashboardId`, `KPIId`, `WidgetId`, etc.)
- Core config interfaces (`ReportConfig`, `DashboardConfig`, `KPIDefinition`,
  `WidgetConfig`, `PlacementRecord`, `ArtifactSummary`)
- Zod schemas for all of the above
- `WorkspaceAdapter` interface (config persistence)
- `DataAdapter` interface (runtime data resolution)
- `WidgetManifest` type (what a widget declares about itself)
- `ConsumerCapabilities` type (what the consumer can render)
- `TemplateDefinition` type (template metadata and matching rules)
- `LayoutIntent` types (semantic layout tree)
- `VersionedConfig` base type with `$schema` and `$version` fields
- `FilterContext` type (shared filter state across a dashboard)
- `FilterPreset` type (saved, named filter combinations)
- `ExploreQuery` type (visual query builder state: rows, columns, values, filters)
- `AlertRule` type (condition definition referencing KPIs/metrics)
- `AlertCondition` type (simple threshold or compound expression)
- `AlertSubscription` type (links alert rules to notification channels)
- `AlertChannelAdapter` interface (consumer-provided notification delivery)
- `BreachRecord` type (runtime evaluation result with transition tracking)
- `ViewerContext` type (viewer identity and attributes for data-level filtering)
- `TimeIntelligenceConfig` type (fiscal calendar, relative periods)
- `UnitSpec` type (semantic units: currency, percent, duration, custom)
- `DataQualityInfo` type (freshness, completeness, issues)
- `FieldMapping` type (cross-data-source field name mapping)
- `LocalSession` type (persisted DuckDB session metadata)

No implementation code. No DOM. No Lit. Safe to import from both sides.

### 2.2 Formalize the WorkspaceAdapter interface

```typescript
interface WorkspaceAdapter {
  // Artifacts
  getArtifact(id: ArtifactId): Promise<VersionedConfig | null>
  listArtifacts(filter?: ArtifactFilter): Promise<ArtifactSummary[]>
  saveArtifact(config: VersionedConfig): Promise<void>
  deleteArtifact(id: ArtifactId): Promise<void>

  // Templates
  listTemplates(filter?: TemplateFilter): Promise<TemplateSummary[]>
  getTemplate(id: TemplateId): Promise<TemplateDefinition | null>
  saveTemplate(template: TemplateDefinition): Promise<void>

  // Placements
  getPlacementsForRoute(route: string): Promise<PlacementRecord[]>
  getPlacementsForArtifact(id: ArtifactId): Promise<PlacementRecord[]>
  savePlacement(placement: PlacementRecord): Promise<void>
  deletePlacement(artifactId: ArtifactId, route: string): Promise<void>
}
```

### 2.3 Formalize the DataAdapter interface

Separate from WorkspaceAdapter. This is the consumer's runtime data contract.

```typescript
interface DataAdapter {
  execute(query: DataQuery, signal?: AbortSignal, viewer?: ViewerContext): Promise<DataResult>
  getSchema(dataSourceId: string): Promise<DataSourceSchema>
  listDataSources(): Promise<DataSourceSummary[]>

  // Required for filter UIs: populate dropdowns, ranges, search
  getDistinctValues(dataSourceId: string, field: string, options?: {
    search?: string             // partial match for type-ahead
    limit?: number              // max values to return (default 200)
    filters?: FilterExpression[]  // pre-filter context (cascading filters)
  }): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }>

  getFieldStats(dataSourceId: string, field: string, filters?: FilterExpression[]): Promise<{
    min?: number | string
    max?: number | string
    distinctCount: number
    nullCount: number
    totalCount: number
  }>
}

interface DataQuery {
  dataSourceId: string
  fields: FieldReference[]
  groupBy?: FieldReference[]
  aggregations?: AggregationSpec[]    // SUM, AVG, COUNT etc. per field
  pivotBy?: FieldReference[]          // pivot columns (cross-tab)
  filters?: FilterExpression[]
  sortBy?: SortExpression[]
  limit?: number
  offset?: number
  // Window functions for running totals, ranks, period-over-period
  windows?: WindowSpec[]
}

interface AggregationSpec {
  field: string
  function: 'sum' | 'avg' | 'count' | 'countDistinct' | 'min' | 'max' |
            'median' | 'stddev' | 'variance' | 'first' | 'last'
  alias?: string                      // output column name
}

interface WindowSpec {
  field: string
  function: 'runningTotal' | 'rank' | 'denseRank' | 'rowNumber' |
            'lag' | 'lead' | 'percentOfTotal' | 'periodOverPeriod'
  partitionBy?: string[]
  orderBy?: string
  alias: string
  // For lag/lead
  offset?: number
  // For periodOverPeriod
  periodField?: string
  periodGranularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

interface DataResult {
  columns: ColumnDescriptor[]
  rows: unknown[][]
  metadata: { totalRows: number; truncated: boolean; queryTimeMs: number }
}

interface DataSourceSchema {
  id: string
  name: string
  fields: FieldMetadata[]
}

interface FieldMetadata {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  cardinality?: 'low' | 'medium' | 'high'  // hint for template matching
  semanticHint?: string  // e.g. 'currency', 'percentage', 'count', 'identifier'
}
```

The `cardinality` and `semanticHint` fields on `FieldMetadata` are optional but
power the template suggestion system. The DataAdapter can populate them from
database statistics or leave them empty.

### 2.4 Formalize the WidgetManifest type

```typescript
interface WidgetManifest {
  type: string                              // unique key, e.g. 'bar-chart'
  name: string                              // display name
  category: 'chart' | 'kpi' | 'table' | 'status' | 'custom'
  description?: string
  thumbnail?: string                        // URL or data URI for catalog display

  // Data contract
  requiredFields: FieldRequirement[]        // what data shape this widget needs
  supportedAggregations?: string[]          // sum, avg, count, etc.

  // Layout contract
  minSize: { cols: number; rows: number }
  preferredSize: { cols: number; rows: number }
  maxSize?: { cols: number; rows: number }
  resizable: boolean

  // Interaction contract
  supportedInteractions: InteractionType[]  // drill-through, cross-filter, export, etc.

  // Configuration schema (for auto-generating option panels)
  configSchema?: ZodSchema                  // widget-specific options

  // Renderer
  load: () => Promise<WidgetRenderer>       // lazy-loaded renderer factory
}

interface WidgetRenderer {
  render(config: WidgetConfig, container: HTMLElement, context: RenderContext): void
  update?(config: WidgetConfig, context: RenderContext): void
  destroy?(): void
}

interface RenderContext {
  data: DataResult
  theme: ThemeTokens
  interactions: InteractionBus
  locale: string
  containerSize: { width: number; height: number }
  breaches: ActiveBreach[]        // active breaches relevant to this widget's KPIs
  filterContext: FilterContextState  // dashboard-level shared filter state
}

interface ActiveBreach {
  alertRuleId: string
  severity: 'info' | 'warning' | 'critical'
  targetId: string                // which KPI/metric is in breach
  currentValue: number
  thresholdValue: number
  transitionedAt: string
  ruleName: string
  ruleDescription?: string
}
```

### 2.5 Define the LayoutIntent types

Replace absolute grid positioning with a composable layout tree:

```typescript
type LayoutNode =
  | TabsLayout
  | SectionsLayout
  | AutoGridLayout
  | WidgetSlot

interface TabsLayout {
  kind: 'tabs'
  id: string
  tabs: { label: string; layout: LayoutNode }[]
}

interface SectionsLayout {
  kind: 'sections'
  id: string
  direction: 'column'           // sections always stack vertically
  sections: {
    label: string
    collapsible: boolean
    defaultCollapsed: boolean
    layout: LayoutNode
  }[]
}

interface AutoGridLayout {
  kind: 'auto-grid'
  id: string
  minItemWidth: number          // minimum widget width in px (default 280)
  maxColumns?: number           // cap columns (default: no cap)
  gap: number                   // gap in px
  children: LayoutNode[]
}

interface WidgetSlot {
  kind: 'widget'
  id: string
  widgetId: string              // references a widget in the dashboard config
  weight?: number               // relative sizing hint (default 1)
  minWidth?: number             // override auto-grid minimum for this widget
  preferredHeight?: number      // height hint in px
}
```

The renderer translates this tree to CSS Grid. `AutoGridLayout` becomes
`grid-template-columns: repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`.
`weight` translates to `grid-column: span N` calculated proportionally.
Sections become collapsible `<details>` elements or equivalent.
Tabs become a tab bar with panel switching.

Legacy absolute-position configs (`position: { row, col }, size: { colSpan, rowSpan }`)
must remain supported. The migration path:
1. Detect legacy format by checking for `position` property on widgets
2. Convert to `AutoGridLayout` with widgets ordered by (row, col)
3. Preserve original in `_legacyLayout` field for rollback

### 2.6 Define the TemplateDefinition type

```typescript
interface TemplateDefinition {
  id: TemplateId
  name: string
  description: string
  category: 'overview' | 'detail' | 'comparison' | 'kpi-board' | 'custom'
  thumbnail?: string

  // The actual dashboard/report config to clone when applied
  config: VersionedConfig

  // Matching rules for auto-suggestion
  matchRules: TemplateMatchRule[]

  // Whether this is a system default or user-created
  builtIn: boolean
}

interface TemplateMatchRule {
  // Field requirements this template expects
  requiredFieldTypes: {
    type: FieldMetadata['type']
    semanticHint?: string
    minCount: number
  }[]

  // Score boost for matching (higher = better match)
  weight: number

  // Human-readable explanation shown in the suggestion UI
  rationale: string
}
```

### 2.7 Add schema versioning to all persisted types

Every config type must extend:

```typescript
interface VersionedConfig {
  $schema: 'phz-workspace'
  $version: number
  id: string
  type: 'report' | 'dashboard' | 'kpi' | 'template' | 'placement' | 'alert-rule' | 'subscription'
  name: string
  createdAt: string
  updatedAt: string
}
```

Implement a migration registry:

```typescript
type MigrationFn = (config: unknown) => unknown

const migrations: Map<string, Map<number, MigrationFn>> = new Map()
// key: artifact type, value: Map<fromVersion, migrationFn>

function migrateConfig(config: VersionedConfig): VersionedConfig {
  const typeMigrations = migrations.get(config.type)
  if (!typeMigrations) return config as VersionedConfig
  let current = config
  while (current.$version < CURRENT_VERSIONS[config.type]) {
    const migrate = typeMigrations.get(current.$version + 1)
    if (!migrate) throw new Error(
      `No migration for ${config.type} from v${current.$version}`
    )
    current = migrate(current) as VersionedConfig
  }
  return current
}
```

Migrations are pure functions, no side effects, no DOM, no API calls.
Run on read, not on save. Stored configs keep their original version until re-saved.

### 2.8 Define alert and subscription types

Alert rules are workspace-authored artifacts persisted through the same adapter.
The condition language reuses the existing expression AST, not a new DSL.

```typescript
interface AlertRule extends VersionedConfig {
  type: 'alert-rule'
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean

  // What to monitor — can reference one or more KPIs/metrics
  targets: AlertTarget[]

  // When to fire — reuses the expression AST
  condition: AlertCondition

  // Cooldown: minimum time between re-fires (prevents alert storms)
  cooldownMinutes: number         // default 60

  // Context: which dashboard/report this alert relates to (optional)
  dashboardId?: string
  description?: string            // human-readable explanation
}

interface AlertTarget {
  type: 'kpi' | 'metric' | 'calculated-field'
  id: string                      // KPIId, MetricId, etc.
  alias: string                   // name used in the condition expression
}

// Simple threshold: fires when a single target crosses a value
// Compound: fires when a boolean expression over multiple targets is true
type AlertCondition =
  | SimpleThresholdCondition
  | CompoundCondition

interface SimpleThresholdCondition {
  kind: 'threshold'
  targetAlias: string
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  value: number
  // Optional: only fire on status *transition*, not while status holds
  transitionOnly: boolean         // default true
}

interface CompoundCondition {
  kind: 'compound'
  // Reuses the expression AST from the engine.
  // The expression must evaluate to a boolean.
  // Field references resolve to target aliases.
  // Example: "revenue_kpi.status == 'critical' AND churn_kpi.delta > 0.1"
  expression: ExpressionAST
  transitionOnly: boolean
}
```

The compound condition is where phz-grid differentiates. Most BI tools evaluate
alerts per-metric. The expression DAG can evaluate cross-KPI conditions:
"revenue dropped AND churn increased AND NPS is below target" is a single
compound alert rule, not three separate ones. This catches systemic risk
patterns that individual threshold alerts miss.

```typescript
interface AlertSubscription extends VersionedConfig {
  type: 'subscription'
  alertRuleId: string
  channelId: string               // maps to an AlertChannelAdapter
  channelConfig: Record<string, unknown>  // channel-specific config
  // e.g. { email: 'ops@company.com' } or { webhookUrl: '...' }
  // or { slackChannel: '#alerts' }
  enabled: boolean
}
```

Subscriptions link alert rules to notification channels. phz-grid does not
know what a "user" is. A subscription says "notify channel X when rule Y
fires." The consumer maps channels to actual delivery infrastructure.

```typescript
interface AlertChannelAdapter {
  id: string
  name: string                    // display name in the workspace UI
  configSchema: ZodSchema         // for auto-generating the subscription form

  notify(alert: BreachNotification): Promise<void>
  testConnection?(config: Record<string, unknown>): Promise<boolean>
}

interface BreachNotification {
  alertRule: AlertRule
  breach: BreachRecord
  subscription: AlertSubscription
  timestamp: string
}
```

The `AlertChannelAdapter` is the consumer's responsibility. phz-grid ships
zero channel implementations (no email, no Slack, no webhook). It defines
the contract. The consumer registers their adapters:

```typescript
const workspace = createWorkspace({
  adapter: myWorkspaceAdapter,
  dataAdapter: myDataAdapter,
  alertChannels: [
    new EmailChannelAdapter({ smtpConfig }),
    new SlackChannelAdapter({ token }),
    new WebhookChannelAdapter()
  ]
})
```

If no channels are registered, the alert rule designer is still available
(rules can be authored and breach state tracked) but the subscription UI
is hidden.

```typescript
interface BreachRecord {
  id: string
  alertRuleId: string
  severity: AlertRule['severity']
  status: 'active' | 'resolved' | 'acknowledged'

  // Transition tracking
  previousStatus: 'ok' | 'warning' | 'critical' | null  // null = first evaluation
  currentStatus: 'ok' | 'warning' | 'critical'
  transitionedAt: string          // when the status changed

  // Evaluation context
  evaluatedAt: string
  targetValues: Record<string, {
    value: number
    status: string
    delta?: number
  }>

  // Resolution
  resolvedAt?: string
  acknowledgedBy?: string         // opaque string, consumer defines identity
  acknowledgedAt?: string
  notes?: string
}
```

Breach records are the runtime output. The consumer persists them (via a
`BreachStore` extension on WorkspaceAdapter or a separate adapter — see
Phase 5). The workspace renders them in dashboards (see Phase 6).

---

## Phase 3: Workspace Shell and Catalog

### 3.1 Create the workspace package scaffold

```
packages/phz-workspace/
  src/
    shell/
      workspace-shell.ts         # Root component: nav, routing, context
      workspace-context.ts       # Shared state: active artifact, adapter, capabilities
    catalog/
      catalog-browser.ts         # List/search/filter saved artifacts
      artifact-card.ts           # Card component for artifact list items
      template-gallery.ts        # Template selection with previews
    suggest/
      schema-analyzer.ts         # Analyze DataSourceSchema → field profile
      template-matcher.ts        # Score templates against field profile
      suggestion-flow.ts         # UI: propose templates after data source selection
    explore/
      data-explorer.ts           # Visual query builder (rows/columns/values/filters)
      field-palette.ts           # Draggable field list from data source schema
      pivot-preview.ts           # Live pivot table preview of current query
      chart-suggest.ts           # Suggest chart type from current explore query shape
      explore-to-artifact.ts     # Convert explore state to report or dashboard config
    filters/
      filter-context.ts          # Dashboard-level shared filter state
      filter-bar.ts              # Horizontal filter bar for dashboard headers
      filter-preset-manager.ts   # Save/load/share named filter combinations
      cascading-resolver.ts      # Dependency resolution between linked filters
      url-filter-sync.ts         # Serialize/deserialize filter state to URL params
    placement/
      placement-manager.ts       # Manage artifact placements by route + role
    alerts/
      alert-rule-designer.ts     # Author alert rules (targets, conditions, severity)
      subscription-manager.ts    # Manage subscriptions per alert rule
      breach-panel.ts            # View active/historical breaches, acknowledge, resolve
      alert-evaluator.ts         # Pure function: evaluate alert rules against current values
      risk-summary.ts            # Widget: aggregated breach status across dashboard KPIs
    adapters/
      memory-adapter.ts          # In-memory WorkspaceAdapter for dev/testing
      fetch-adapter.ts           # HTTP-based WorkspaceAdapter
      duckdb-data-adapter.ts     # DuckDB-WASM DataAdapter (reference impl)
    local/
      local-data-store.ts        # OPFS persistence for DuckDB sessions
      file-upload-manager.ts     # CSV/Excel/Parquet/JSON file import
      upload-preview.ts          # Pre-import preview with type inference display
      session-manager.ts         # Session list, rename, export/import as ZIP
      sheet-picker.ts            # Excel multi-sheet selector
      remote-data-connector.ts   # URL and API connection manager
      connection-editor.ts       # UI for configuring URL/API connections
      data-source-panel.ts       # Unified panel listing all data sources
    registry/
      widget-registry.ts         # Open widget registration + fallback rendering
      default-widgets.ts         # Register built-in 20+ widgets
    migration/
      migrate.ts                 # Schema migration runner
      migrations/                # Per-type migration functions
    coordination/
      query-coordinator.ts       # Query merging, dedup, concurrency control
    format/
      format-value.ts            # Shared number/date/unit formatting via Intl
    index.ts
  package.json
```

### 3.2 Implement the workspace shell

`WorkspaceShell` is a Lit component that provides:

- A sidebar or top nav with sections: Catalog, Data Sources, Explore, Create New, Templates, Alerts, Placements
- A content area that renders the active tool (ReportDesigner, DashboardBuilder, etc.)
- Context provision (adapter, capabilities, widget registry) to all child tools
- Breadcrumb navigation between tools
- Global search across all artifact types

The shell does not duplicate the existing admin tools. It orchestrates them:

```typescript
@customElement('phz-workspace')
export class WorkspaceShell extends LitElement {
  @property({ type: Object }) adapter: WorkspaceAdapter
  @property({ type: Object }) dataAdapter: DataAdapter
  @property({ type: Object }) capabilities?: ConsumerCapabilities
  @property({ type: Array }) alertChannels?: AlertChannelAdapter[]
  @property({ type: Object }) viewerContext?: ViewerContext
  @property({ type: Object }) i18n?: I18nProvider
  @property({ type: Boolean }) open: boolean = false

  // Internal routing state
  @state() private view: WorkspaceView = 'catalog'
  @state() private activeArtifactId?: string

  // The shell provides context to child components
  // via Lit Context protocol or property drilling
}
```

The consumer embeds it as:

```html
<phz-workspace
  .adapter=${myWorkspaceAdapter}
  .dataAdapter=${myDataAdapter}
  .capabilities=${myCapabilities}
  .alertChannels=${myAlertChannels}
  .viewerContext=${{ userId: 'admin-1', roles: ['admin'] }}
  .open=${showWorkspace}
  @workspace-close=${() => setShowWorkspace(false)}
></phz-workspace>
```

### 3.3 Implement the catalog browser

`CatalogBrowser` is a Lit component that:
- Calls `adapter.listArtifacts()` on mount
- Renders artifacts grouped by type (Reports, Dashboards, KPIs)
- Shows status badges: draft / published / stale (config newer than last publish)
- Shows active breach count per artifact (if breach store available):
  artifacts with active critical breaches get a red indicator in the list
- Search bar filters by name and description
- Each artifact card shows: name, type, last modified, published routes
- Click opens the artifact in its appropriate designer
- "Create New" button starts the creation flow (see 3.5)
- Bulk actions: delete, duplicate, export as JSON

Every component accepts `loading: boolean` and `error: string | null` props,
consistent with existing widget conventions.

### 3.4 Implement the template gallery

`TemplateGallery` is a Lit component that:
- Calls `adapter.listTemplates()` on mount
- Renders templates with thumbnail previews
- Separates built-in templates from user-created templates
- "Use Template" clones the template config, assigns a new ID, opens it in the builder
- "Create Template from Dashboard" takes any existing dashboard config and saves it
  as a template (adds matchRules interactively)
- Admin toggle: "Set as Organization Template" (marks for org-wide availability)

Ship 5-8 default templates:

| Template | Description | Match pattern |
|----------|-------------|---------------|
| KPI Overview | Row of KPI cards + trend line below | 2+ numeric fields, 1 date field |
| Comparison Board | Bar charts comparing categories | 1 low-cardinality string + 2+ numerics |
| Time Series Dashboard | Trend lines + period comparison | 1 date field + 1+ numeric fields |
| Tabular Report | Sortable/filterable data table | 5+ fields of any type |
| Scorecard | Gauge + status table + bottom-N | 1+ numeric with targets/thresholds |
| Executive Summary | KPI cards + pie + bar + table | 3+ numerics, 2+ low-cardinality strings |
| Detail Drill | Master table + click-to-filter detail | 1 identifier + mixed field types |
| Distribution Analysis | Histogram + scatter + heatmap | 2+ numeric fields, no required date |
| Operational Monitor | Risk summary + KPI cards with breach indicators + trend lines | 3+ KPIs with thresholds defined |

### 3.5 Implement the suggestion flow

This is the critical "time to first dashboard" feature. The flow:

```
User clicks "Create New" in catalog
  → Step 1: Pick artifact type (Report / Dashboard / KPI)
  → Step 2: Select data source (calls dataAdapter.listDataSources())
  → Step 3: System analyzes schema → proposes templates
  → Step 4: User picks a template OR starts blank
  → Step 5: Opens the appropriate designer with config pre-populated
```

**Step 3 is the key innovation.** The `SchemaAnalyzer` examines the
`DataSourceSchema` and produces a `FieldProfile`:

```typescript
interface FieldProfile {
  numericFields: FieldMetadata[]       // type === 'number'
  categoricalFields: FieldMetadata[]   // type === 'string', cardinality low/medium
  dateFields: FieldMetadata[]          // type === 'date'
  identifierFields: FieldMetadata[]    // type === 'string', cardinality high
  booleanFields: FieldMetadata[]
  totalFieldCount: number

  // Derived hints
  hasTimeDimension: boolean
  hasCategoricalDimension: boolean
  numericFieldCount: number
  suggestedMeasures: FieldMetadata[]   // numerics likely to be aggregated
  suggestedDimensions: FieldMetadata[] // categoricals likely to be grouped by
}
```

The `suggestedMeasures` heuristic:
- Fields with names containing `revenue`, `cost`, `amount`, `total`, `count`,
  `sum`, `price`, `quantity`, `sales`, `profit`, `budget`, `spend`, `fee`,
  `rate`, `score`, `value`, `weight`, `volume`, `duration`, `hours`, `days`
- Fields with `semanticHint` of `currency`, `count`, `percentage`
- Any remaining numeric fields not already classified

The `suggestedDimensions` heuristic:
- String fields with `cardinality` of `low` or `medium`
- Fields with names containing `region`, `country`, `category`, `type`,
  `status`, `department`, `team`, `product`, `segment`, `channel`, `source`,
  `tier`, `level`, `group`, `class`
- Date fields (always a dimension candidate)

The `TemplateMatcher` scores each template against the field profile:

```typescript
function scoreTemplate(
  template: TemplateDefinition,
  profile: FieldProfile
): TemplateScore {
  let score = 0
  let matchedRules = 0
  const reasons: string[] = []

  for (const rule of template.matchRules) {
    const satisfied = rule.requiredFieldTypes.every(req => {
      const candidates = profile[fieldTypeToProfileKey(req.type)]
        .filter(f => !req.semanticHint || f.semanticHint === req.semanticHint)
      return candidates.length >= req.minCount
    })
    if (satisfied) {
      score += rule.weight
      matchedRules++
      reasons.push(rule.rationale)
    }
  }

  return { template, score, matchedRules, reasons }
}
```

The suggestion UI (`SuggestionFlow`) shows top 3 scored templates with:
- Template thumbnail preview
- Match reasons as bullet points ("Your data has 3 numeric fields and a date
  column — this trend dashboard will show them over time")
- "Use this template" button
- "Start blank" option always available

This is heuristic pattern matching, not AI/NLP. It runs in milliseconds.
The templates themselves are editable artifacts — admins create new ones for
their organization's common data patterns.

---

## Phase 4: Wire Existing Tools into the Workspace

### 4.1 Adapt SaveController to use WorkspaceAdapter

Update `SaveController` so on save it calls `adapter.saveArtifact()` instead of
writing to localStorage. The adapter is injected via workspace context:

```typescript
// Before (current)
await localStorageStore.save(config)

// After
await this.adapter.saveArtifact({
  ...config,
  $schema: 'phz-workspace',
  $version: CURRENT_VERSIONS[config.type],
  updatedAt: new Date().toISOString()
})
```

The existing `createLocalStorageStore()` becomes the `MemoryAdapter`'s persistence
layer for the dev/testing path.

### 4.2 Integrate existing designers into workspace shell

The workspace shell routes to existing tools:
- "New Report" or opening a report artifact → `<phz-report-designer>`
- "New Dashboard" or opening a dashboard → `<phz-dashboard-builder>`
- "New KPI" or opening a KPI → `<phz-kpi-designer>`
- "Manage Filters" → `<phz-filter-studio>`
- "Configure Grid" → `<phz-grid-admin>`

The shell wraps each tool with:
- A header showing artifact name, type, save status, and back button
- SaveController integration (auto-save to adapter)
- UndoController integration (shared undo stack within the workspace session)

Do not rewrite the existing tools. Wrap and orchestrate them.

### 4.3 Add inter-tool navigation

When editing a dashboard, the user should be able to:
- Click on a KPI widget → jump to the KPI designer for that KPI
- Click on a report widget → jump to the report designer
- Click "Add Widget" → open a widget picker that shows available types from
  the widget registry, filtered by consumer capabilities
- Use breadcrumbs to navigate back: Catalog → Dashboard: Sales Ops → KPI: Revenue

### 4.4 Implement the widget registry

```typescript
class WidgetRegistry {
  private manifests = new Map<string, WidgetManifest>()

  register(manifest: WidgetManifest): void {
    this.manifests.set(manifest.type, manifest)
  }

  get(type: string): WidgetManifest | undefined {
    return this.manifests.get(type)
  }

  listByCategory(category?: string): WidgetManifest[] {
    const all = Array.from(this.manifests.values())
    return category ? all.filter(m => m.category === category) : all
  }

  // Filter by consumer capabilities
  listAvailable(capabilities?: ConsumerCapabilities): WidgetManifest[] {
    if (!capabilities) return this.listByCategory()
    return this.listByCategory().filter(m =>
      capabilities.widgetTypes.includes(m.type)
    )
  }

  // Fallback renderer for unknown widget types
  renderFallback(type: string, container: HTMLElement): void {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--phz-text-muted);">
        Widget type "${type}" is not available in this environment.
      </div>
    `
  }
}
```

Register all 20+ existing widgets from `@phozart/phz-widgets` as default manifests
in `default-widgets.ts`. Each existing widget component becomes a renderer behind
the registry.

### 4.5 Implement the placement manager

`PlacementManager` is a Lit component:
- Shows current placements per artifact (route, roles, label)
- Add/remove placements
- Calls `adapter.savePlacement()` and `adapter.deletePlacement()`

```typescript
interface PlacementRecord {
  artifactId: string
  artifactType: 'report' | 'dashboard' | 'kpi'
  route: string                // plain string, consumer matches however it wants
  roles: string[]              // empty = all roles
  label: string                // display label in consumer nav
  sortOrder: number            // ordering within a route
}
```

### 4.6 Implement the alert rule designer

`AlertRuleDesigner` is a Lit component for authoring alert rules. The flow:

1. **Select targets**: Pick one or more KPIs/metrics from the catalog. Each
   gets an alias (e.g. "revenue", "churn") used in the condition expression.
2. **Define condition**: Two modes:
   - **Simple**: Pick a target, operator (>, <, =, etc.), threshold value.
     Toggle "fire on transition only" (default: on).
   - **Compound**: Write an expression using target aliases. The expression
     editor reuses the existing formula editor from MetricBuilder but
     validates for boolean output. Example:
     `revenue.status == "critical" AND churn.delta > 0.1 AND nps.value < 40`
3. **Set severity**: info / warning / critical
4. **Set cooldown**: Minimum minutes between re-fires (default 60)
5. **Associate dashboard** (optional): Link to a dashboard for context
6. **Add subscriptions**: If AlertChannelAdapters are registered, show
   a subscription form per channel. Each channel's `configSchema` generates
   the form fields automatically.

The compound expression mode is the differentiator. Show a live preview
that evaluates the expression against current data and displays "Would
fire: yes/no" with the current target values. This makes compound rules
debuggable before saving.

Inter-tool navigation: from the KPI designer, a "Set Alert" button opens
the alert rule designer pre-populated with that KPI as a target. From
the dashboard builder, a "Configure Alerts" button opens the alert rule
designer scoped to KPIs on that dashboard.

### 4.7 Implement the alert evaluator

`AlertEvaluator` is a pure function (no DOM, no side effects) that:

```typescript
interface AlertEvaluatorInput {
  rules: AlertRule[]
  currentValues: Map<string, KPIScoreResponse>  // target ID → current score
  previousBreaches: BreachRecord[]               // previous evaluation results
}

interface AlertEvaluatorOutput {
  newBreaches: BreachRecord[]      // newly fired alerts
  resolvedBreaches: BreachRecord[] // previously active, now resolved
  activeBreaches: BreachRecord[]   // still in breach
  notifications: BreachNotification[]  // breaches that need notification
                                       // (respecting cooldown)
}

function evaluateAlerts(input: AlertEvaluatorInput): AlertEvaluatorOutput
```

The evaluator:
- Iterates all enabled rules
- Resolves target aliases to current values from `currentValues`
- For simple thresholds: compares value against operator/threshold
- For compound conditions: evaluates the expression AST using the
  expression compiler from `engine` (already supports boolean output
  via conditional expressions — verify in Phase 1.11)
- Compares current breach state against `previousBreaches` to detect
  transitions (OK→breach, breach→OK, severity change)
- Applies `transitionOnly` flag: if true, only fire on state changes,
  not while state holds steady
- Applies cooldown: suppress notifications for rules that fired within
  the cooldown window
- Returns breach records and notification requests

The consumer calls this function. phz-grid does not own the scheduling.
The consumer decides when to re-evaluate (on data refresh, on a cron,
on a webhook, etc.):

```typescript
import { evaluateAlerts } from '@phozart/phz-workspace'

// Consumer's data refresh handler
async function onDataRefresh() {
  const rules = await adapter.listArtifacts({ type: 'alert-rule' })
  const currentValues = await fetchCurrentKPIValues()
  const previousBreaches = await breachStore.getActive()

  const result = evaluateAlerts({ rules, currentValues, previousBreaches })

  // Persist breach state
  await breachStore.saveBreaches(result.activeBreaches)
  await breachStore.resolveBreaches(result.resolvedBreaches)

  // Deliver notifications via registered channels
  for (const notification of result.notifications) {
    const channel = channels.get(notification.subscription.channelId)
    await channel.notify(notification)
  }
}
```

### 4.8 Register the risk summary widget

Add a `risk-summary` widget to the default widget registry. This widget:
- Reads `context.breaches` from the RenderContext
- Displays a compact summary: count of active breaches by severity
- Expandable detail: list of active breaches with target name, value,
  threshold, time since transition
- Color-coded by severity using existing status tokens
  (`--phz-success`, `--phz-warning`, `--phz-critical`)
- Click on a breach navigates to the affected KPI or dashboard
- "Acknowledge" and "Resolve" buttons if the consumer provides a
  breach update callback

The risk summary widget is available in the widget picker when building
dashboards. It requires no data source — it reads from breach state.
Common placement: top of executive dashboards, pinned row in the
workspace catalog.

Also update existing KPI card and gauge widgets to accept `breaches`
from RenderContext. When a KPI referenced by the widget is in active
breach, the widget shows a visual indicator:
- Pulsing border in the severity color
- Small breach icon with tooltip showing rule name and time
- This is opt-in via a `showBreachIndicator: boolean` property on the
  widget config (default: true when breaches are available in context)

---

## Phase 5: Adapter Implementations

### 5.1 MemoryAdapter

Stores everything in a `Map<string, VersionedConfig>`. Supports:
- JSON export of all artifacts (for backup/migration)
- JSON import to seed initial state
- Used for: dev, testing, demos, getting-started experience

### 5.2 FetchAdapter

Takes a `baseUrl` and optional `headers`. Calls REST endpoints:
- `GET  {baseUrl}/artifacts` → listArtifacts
- `GET  {baseUrl}/artifacts/{id}` → getArtifact
- `POST {baseUrl}/artifacts` → saveArtifact
- `DELETE {baseUrl}/artifacts/{id}` → deleteArtifact
- `GET  {baseUrl}/templates` → listTemplates
- `GET  {baseUrl}/placements?route={route}` → getPlacementsForRoute
- `POST {baseUrl}/placements` → savePlacement
- `GET  {baseUrl}/breaches?status=active` → getActiveBreaches
- `GET  {baseUrl}/breaches?artifactId={id}` → getBreachesForArtifact
- `POST {baseUrl}/breaches` → saveBreaches (batch)
- `PATCH {baseUrl}/breaches/{id}/acknowledge` → acknowledgeBreachj
- `PATCH {baseUrl}/breaches/{id}/resolve` → resolveBreach

Document the URL structure but the consumer backend implements it however they want.

### 5.3 Optional BreachStore extension

Breach persistence is optional. If the consumer wants breach history and
acknowledgment tracking, they extend WorkspaceAdapter with breach methods:

```typescript
interface BreachStoreExtension {
  getActiveBreaches(): Promise<BreachRecord[]>
  getBreachesForArtifact(artifactId: string): Promise<BreachRecord[]>
  getBreachHistory(filter: BreachFilter): Promise<BreachRecord[]>
  saveBreaches(breaches: BreachRecord[]): Promise<void>
  acknowledgeBreach(id: string, by: string, notes?: string): Promise<void>
  resolveBreach(id: string, notes?: string): Promise<void>
}
```

If the adapter does not implement these methods, the workspace still renders
breach state from the evaluator output (in-memory, current session only)
but does not persist history or support acknowledgment workflows. The
`MemoryAdapter` implements `BreachStoreExtension` for dev/testing.

### 5.4 DuckDB DataAdapter (reference implementation)

Wraps the existing `@phozart/phz-duckdb` package as a DataAdapter:
- `listDataSources()` → list loaded tables (from Parquet, CSV, or user uploads)
- `getSchema(id)` → query `DESCRIBE` or `information_schema` for field metadata
- `getDistinctValues()` → `SELECT DISTINCT` with optional WHERE for cascading
- `getFieldStats()` → `SELECT MIN, MAX, COUNT, COUNT(DISTINCT)` queries
- `execute(query)` → translate DataQuery to SQL, run via DuckDB-WASM

### 5.5 Local data persistence with OPFS

DuckDB-WASM data loaded from CSV/Parquet/user uploads must persist locally
so users can close the browser and reopen their workspace without re-importing.
Use the Origin Private File System (OPFS) — a browser-native sandboxed
filesystem with no storage quota prompts for reasonable sizes.

```typescript
interface LocalDataStore {
  // Save a DuckDB database snapshot to OPFS
  persist(sessionId: string): Promise<void>

  // Restore a previously persisted session
  restore(sessionId: string): Promise<boolean>  // false if not found

  // List persisted sessions
  listSessions(): Promise<LocalSession[]>

  // Delete a persisted session
  deleteSession(sessionId: string): Promise<void>

  // Storage usage
  getStorageUsage(): Promise<{ used: number; available: number }>
}

interface LocalSession {
  id: string
  name: string                    // user-provided session name
  createdAt: string
  lastOpenedAt: string
  dataSources: { name: string; rowCount: number; sizeBytes: number }[]
  totalSizeBytes: number
  artifactCount: number           // dashboards, reports saved in this session
}
```

The persistence flow:
1. User imports a CSV or Parquet file into the workspace
2. DuckDB-WASM loads it into an in-memory table
3. On auto-save (every 30s of inactivity) or explicit save, the
   `LocalDataStore` exports the DuckDB database to OPFS using
   DuckDB-WASM's `exportDatabase()` or by writing Parquet snapshots
4. On next visit, the workspace checks OPFS for a saved session
5. If found, shows: "Resume session '[name]' with [N] data sources
   and [M] dashboards? [Resume] [Start fresh]"
6. On resume, the DuckDB instance is restored from OPFS and the
   MemoryAdapter reloads saved artifact configs from the same session

OPFS is used because:
- No storage quota prompts (unlike localStorage's 5-10MB limit)
- Handles hundreds of MB comfortably
- Origin-scoped (private to the domain)
- Works in Web Workers (DuckDB-WASM runs in a worker)
- Supported in Chrome 102+, Firefox 111+, Safari 15.2+

Fallback for browsers without OPFS: use IndexedDB to store exported
Parquet blobs. Same API surface, slower performance, but functional.

The `MemoryAdapter` also persists to the same session. Dashboard configs,
report configs, alert rules, filter presets — everything authored in
a local session is stored alongside the data. One session = one portable
unit containing data + all artifacts built on that data.

### 5.6 File upload and local playground

The workspace must support direct file upload as a data source. This is
the "bring your own data" experience — no database, no API, no backend.

```typescript
interface FileUploadManager {
  // Upload and register a file as a DuckDB table
  uploadFile(file: File, options?: UploadOptions): Promise<UploadResult>

  // List uploaded files in the current session
  listUploads(): Promise<UploadedFile[]>

  // Remove an uploaded file and its DuckDB table
  removeUpload(tableId: string): Promise<void>

  // Replace an uploaded file (re-import with same table name)
  replaceUpload(tableId: string, file: File): Promise<void>
}

interface UploadOptions {
  tableName?: string              // defaults to filename without extension
  delimiter?: string              // CSV delimiter (auto-detect by default)
  hasHeader?: boolean             // first row is header (default: true)
  dateFormat?: string             // date parsing format
  nullValues?: string[]           // strings to treat as NULL (default: ['', 'NULL', 'N/A'])
  sampleRows?: number             // rows to sample for type inference (default: 10000)
  maxRows?: number                // limit import (default: unlimited)
}

interface UploadResult {
  tableId: string
  tableName: string
  rowCount: number
  columns: FieldMetadata[]        // auto-inferred types
  warnings: UploadWarning[]       // type inference issues, truncated values, etc.
  sizeBytes: number
}

interface UploadWarning {
  severity: 'info' | 'warning' | 'error'
  column?: string
  message: string                 // e.g. "Column 'date' contains mixed formats, parsed as string"
}
```

Supported file types:
- **CSV** (.csv, .tsv, .txt): DuckDB-WASM's `read_csv_auto()` with
  auto-detection of delimiter, header, types, date formats. Show
  auto-detected settings with override option before confirming import.
- **Excel** (.xlsx, .xls): Parse with SheetJS (already available in
  the monorepo as a dependency), convert to CSV in memory, load into
  DuckDB. If the file has multiple sheets, let the user pick which
  sheets to import (each becomes a separate table).
- **Parquet** (.parquet): Direct load via DuckDB-WASM's native Parquet
  support. Fastest path, preserves types.
- **JSON** (.json, .jsonl): Array of objects or newline-delimited JSON.
  Loaded via DuckDB-WASM's `read_json_auto()`.

The upload flow in the workspace UI:

```
User clicks "Upload Data" or drags files onto the workspace
  → File type detected, preview of first 20 rows shown
  → Auto-detected settings displayed (delimiter, types, header)
  → User confirms or adjusts settings
  → File loaded into DuckDB-WASM as a named table
  → Table appears in the data source list alongside any API-provided sources
  → User can immediately explore, build reports, or create dashboards
  → Session auto-persists to OPFS (section 5.5)
```

For Excel files with multiple sheets:
```
  → Sheet picker shown: checkbox per sheet, preview of first 5 rows each
  → Selected sheets imported as separate tables
  → Tables named: "{filename}_{sheetname}"
```

**Upload validation and preview:**
- Show a preview table of the first 20 rows before importing
- Highlight columns where type inference is uncertain (e.g. a "date"
  column with some unparseable values)
- Show total row count and estimated memory usage
- Warn if the file is very large (> 100MB): "This file is [size]. Large
  files may slow down your browser. [Import anyway] [Import first N rows]"
- After import, show a summary: "[N] rows, [M] columns imported.
  [Explore this data] [Create a dashboard]"

**Data replacement:**
Users should be able to re-upload a file to refresh data without losing
their dashboards and reports. The `replaceUpload()` function:
- Drops the existing DuckDB table
- Re-imports from the new file
- Validates that the schema is compatible (same columns or superset)
- If columns were removed, warns: "Column 'X' no longer exists. [N]
  widgets reference it. [Import anyway] [Cancel]"
- If new columns were added, they're available immediately
- Existing dashboards and reports continue working with refreshed data

This is the "bring your own CSV, build a dashboard, come back tomorrow
and your work is still there" experience.

### 5.7 Remote data connectors (browser-side, no server required)

End users should be able to point the workspace at data living on their
network without installing anything or running a terminal command. This
stays entirely in Tier 1 (browser-only). DuckDB-WASM can fetch data from
URLs directly via HTTP.

```typescript
interface RemoteDataConnector {
  // Connect to a URL-based data source
  connectURL(config: URLConnectionConfig): Promise<UploadResult>

  // Connect to a REST API endpoint
  connectAPI(config: APIConnectionConfig): Promise<UploadResult>

  // Refresh data from a previously connected remote source
  refresh(connectionId: string): Promise<UploadResult>

  // List active remote connections
  listConnections(): Promise<RemoteConnection[]>

  // Remove a connection (keeps cached data until explicitly cleared)
  removeConnection(connectionId: string): Promise<void>
}

interface URLConnectionConfig {
  name: string                    // user-given name for this data source
  url: string                     // URL to a CSV, Parquet, JSON, or Excel file
  type?: 'csv' | 'parquet' | 'json' | 'excel' | 'auto'  // auto-detect from extension/content-type
  refreshMode: 'manual' | 'on-open'   // refresh on every workspace open, or only when user clicks refresh
  headers?: Record<string, string>     // optional HTTP headers (auth tokens, API keys)
  uploadOptions?: UploadOptions        // same options as file upload (delimiter, etc.)
}

interface APIConnectionConfig {
  name: string
  url: string                     // REST endpoint that returns JSON array
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: unknown                  // for POST requests
  resultPath?: string             // JSONPath to the data array, e.g. 'data.results'
  // Pagination (optional, for large APIs)
  pagination?: {
    type: 'offset' | 'cursor' | 'page'
    pageSize: number
    maxPages?: number             // safety limit
  }
  refreshMode: 'manual' | 'on-open'
}

interface RemoteConnection {
  id: string
  name: string
  sourceType: 'url' | 'api'
  url: string
  lastFetched: string
  rowCount: number
  sizeBytes: number
  refreshMode: 'manual' | 'on-open'
  status: 'connected' | 'stale' | 'error'
  error?: string                  // last error message if status is 'error'
}
```

**The end-user flow:**

```
User clicks "Add Data" in the workspace
  → Three options:
    [Upload File]  [Connect to URL]  [Connect to API]

For "Connect to URL":
  → User pastes a URL (e.g. https://intranet.company.com/exports/sales.csv)
  → Optional: add headers (for auth tokens — stored locally in OPFS, never sent elsewhere)
  → Workspace fetches the URL via browser fetch()
  → If successful: preview of first 20 rows, same as file upload
  → User confirms → data loaded into DuckDB-WASM → persisted to OPFS
  → Data source appears in the list with a "link" icon indicating it's remote
  → "Refresh" button re-fetches from the URL on demand

For "Connect to API":
  → User enters the API endpoint URL
  → Picks GET or POST, optionally adds headers and body
  → "Test Connection" button fetches the first page and shows preview
  → If the response is nested JSON, user specifies the path to the data array
    (auto-detected: the connector examines the response structure and suggests
    paths that contain arrays of objects)
  → User confirms → all pages fetched → loaded into DuckDB-WASM
  → Persisted to OPFS with the connection config for refresh
```

**What this enables without a server:**

- **Company file server**: IT publishes a daily CSV export to an intranet
  URL. The user connects to it once. Every morning they click "Refresh"
  (or set `refreshMode: 'on-open'`) and their dashboards update.

- **Public data APIs**: Government open data, financial data APIs, weather
  APIs. User enters the endpoint, optionally with an API key in headers,
  and builds dashboards on live public data.

- **S3/cloud storage**: Parquet files in S3 with public or pre-signed URLs.
  DuckDB-WASM supports HTTP range requests on Parquet, meaning it can
  query large Parquet files without downloading the entire file — only
  the row groups matching the query are fetched.

- **SharePoint/Google Sheets**: Export links from office tools that produce
  CSV or Excel downloads. User pastes the share link and the workspace
  imports it.

**CORS handling:**

The browser enforces CORS on cross-origin requests. When a fetch fails
due to CORS:

1. The workspace shows a clear, non-technical error:
   "The data source at [url] blocked the connection. This is a browser
   security restriction, not a problem with your data."

2. Three resolution paths offered:
   - "Download the file manually and upload it here" — always works
   - "Ask your IT team to allow connections from this tool" — with a
     copyable snippet explaining what CORS header to add
   - "Use the desktop version for unrestricted access" — links to the
     `npx phz-local` instructions (Tier 2 has no CORS restrictions
     because it's a Node.js server, not a browser)

3. If the URL is on the same origin as the workspace (e.g. the workspace
   is hosted at company.com and the API is at api.company.com), CORS is
   not an issue. This is the most common enterprise deployment scenario.

**Credential storage:**

Headers (including auth tokens and API keys) are stored in OPFS alongside
the connection config. They never leave the browser. They are not sent to
any phz-grid server (there is no phz-grid server in Tier 1). On session
export as ZIP, credentials are NOT included by default. The export dialog
warns: "Connection credentials will not be included in the export. The
recipient will need to enter their own credentials."

**Auto-refresh on open:**

When `refreshMode: 'on-open'` is set on a connection:
1. Workspace opens → checks all connections with `refreshMode: 'on-open'`
2. For each: attempts to fetch the URL silently in the background
3. If successful: updates the DuckDB table, dashboards auto-refresh
4. If failed (network error, CORS, auth expired): shows a non-blocking
   notification: "Could not refresh [name]. Using cached data from [date].
   [Retry] [Use cached] [Edit connection]"
5. The workspace is usable immediately with cached data while refresh runs

This means a user's workflow is: open browser, go to workspace, data refreshes
automatically, dashboards show current numbers. No terminal. No server. No
manual file download. Just a browser bookmark.

### 5.8 Unified data source panel

All data sources — uploaded files, remote URL connections, remote API
connections, and server-provided sources (in Tier 3) — appear in a single
"Data Sources" panel in the workspace:

```
┌─────────────────────────────────────────────────┐
│  Data Sources                          [+ Add]  │
├─────────────────────────────────────────────────┤
│  📎 sales-2025.csv              12,450 rows     │
│     Uploaded 2 days ago                         │
│                                                 │
│  🔗 Daily Export (intranet)      8,200 rows     │
│     Refreshed 3 hours ago        [Refresh]      │
│                                                 │
│  🌐 Weather API                  1,095 rows     │
│     Refreshed on open            [Refresh]      │
│                                                 │
│  🗄️ Production DB: Sales         (server)       │
│     Live connection                             │
└─────────────────────────────────────────────────┘
```

Icon legend:
- 📎 Paper clip: local file upload
- 🔗 Link: remote URL connection
- 🌐 Globe: remote API connection
- 🗄️ Database: server-provided data source (Tier 3 only)

Each data source card shows: name, row count, last updated/refreshed,
source type icon. Actions per source type:
- Upload: replace file, remove, rename
- URL/API: refresh, edit connection, remove
- Server: no local actions (managed by consumer's backend)

The "Add" button opens the three-option picker (Upload / URL / API) plus
"Browse server data sources" if running in Tier 3.

This panel is the entry point for the explorer. Clicking a data source
opens it in the explorer with the field palette populated.

---

## Phase 6: Layout Modernization

### 6.1 Add CSS Container Queries to all widgets

Every widget wrapper should declare `container: widget-name / inline-size`.
Widget internal styles should use `@container` rules to adapt to available space:

```css
/* Example: KPI card adapts to container width */
:host {
  container: kpi-card / inline-size;
}

.kpi-layout {
  display: flex;
  flex-direction: column;
}

@container kpi-card (min-width: 360px) {
  .kpi-layout {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}

@container kpi-card (min-width: 520px) {
  .kpi-sparkline {
    display: block;  /* Show sparkline only when wide enough */
  }
}
```

This means the same widget renders appropriately whether it occupies 2 columns
or 6 columns on the dashboard, without JavaScript measurement or resize observers.

### 6.2 Implement the LayoutIntent renderer

Create a `LayoutRenderer` that takes a `LayoutNode` tree and produces CSS Grid markup:

- `TabsLayout` → tab bar + panel container, one panel visible at a time
- `SectionsLayout` → vertical stack of collapsible sections
- `AutoGridLayout` → `display: grid; grid-template-columns: repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`
- `WidgetSlot` with `weight` → `grid-column: span ${calculatedSpan}`

The `weight` calculation: within an `AutoGridLayout`, total weights are summed,
each widget gets `span = Math.round(weight / totalWeight * actualColumnCount)`.
Clamped to `[minSize.cols, maxSize?.cols ?? actualColumnCount]`.

### 6.3 Support legacy absolute layout

Configs with `position: { row, col }` and `size: { colSpan, rowSpan }` on widgets
must continue to render. The migration function converts them to `LayoutIntent`:

1. Sort widgets by (row, col)
2. Group widgets into rows (same row value)
3. Each row becomes a children array within an `AutoGridLayout`
4. Widget `colSpan` translates to `weight` proportionally

Provide a one-click "Upgrade Layout" button in the workspace that converts
legacy configs to intent-based layout with the user's approval.

### 6.4 Breach state visual highlighting

When a dashboard renders, the rendering pipeline must inject breach state
into the `RenderContext` for each widget. The flow:

1. Dashboard renderer loads the dashboard config
2. Collects all KPI/metric IDs referenced by widgets on this dashboard
3. Calls `breachStore.getActiveBreaches()` (if breach store available)
   or reads from in-memory evaluator output
4. Filters breaches to only those targeting KPIs on this dashboard
5. Passes filtered `ActiveBreach[]` to each widget's `RenderContext`

Widgets respond to breach state through three mechanisms:

**Severity border**: Widgets with an active breach on their KPI get a
left border or top accent in the severity color. Use the existing status
tokens: `--phz-warning` for warning, `--phz-critical` for critical.
This is subtle enough to not disrupt the dashboard layout but visible
enough to draw attention.

```css
/* Applied by the layout renderer, not the widget itself */
.widget-slot[data-breach-severity="critical"] {
  box-shadow: inset 3px 0 0 0 var(--phz-critical);
}
.widget-slot[data-breach-severity="warning"] {
  box-shadow: inset 3px 0 0 0 var(--phz-warning);
}
```

**Breach badge**: A small indicator (count or icon) overlaid on the
widget header, clickable to expand breach details. Shows rule name,
current value, threshold, and time since transition.

**Dashboard-level breach bar**: A thin horizontal bar at the top of
the dashboard (above all widgets) that summarizes total active breaches.
Clicking it scrolls to or highlights the affected widgets. This is
rendered by the dashboard layout component, not by individual widgets.
Pattern: "2 critical, 1 warning" with colored dots, collapsible.

All breach indicators are purely visual. They do not modify data or
interfere with widget interaction. They degrade gracefully: if no
breach data is available in context, no indicators render.

---

## Phase 7: Consumer-Side Integration

### 7.1 Consumer-side client

The consumer app never imports `engine-admin`, `grid-admin`, or `grid-creator`.
Those only live inside the workspace package.

```typescript
import { createWorkspaceClient } from '@phozart/phz-workspace'

const client = createWorkspaceClient({
  adapter: new FetchAdapter({ baseUrl: '/api/phz' }),
  dataAdapter: myDataAdapter,
  capabilities: {
    widgetTypes: ['bar-chart', 'data-table', 'line-chart', 'kpi-card'],
    interactions: ['drill-through', 'export-csv'],
    supportedLayoutTypes: ['auto-grid', 'sections', 'tabs']
  }
})

// Resolve what to show for this route + role
const placements = await client.getPlacementsForRoute('/reports/sales', userRoles)

// Load and render
const config = await client.getArtifact(placements[0].artifactId)
const migratedConfig = client.migrate(config)  // runs schema migrations if needed
```

### 7.2 Consumer capability declaration

When `capabilities` are provided to the workspace:
- The widget picker only shows types the consumer supports
- Layout options are constrained to supported layout types
- A validation pass flags configs that exceed declared capabilities
- The template matcher filters out templates requiring unsupported widget types

When `capabilities` are not provided, workspace operates unconstrained (backwards
compatible).

### 7.3 Consumer-side alert integration

The consumer owns alert scheduling and notification delivery. phz-grid provides
the evaluation logic and the types. The consumer integration pattern:

```typescript
import {
  evaluateAlerts,
  createWorkspaceClient,
  FetchAdapter
} from '@phozart/phz-workspace'

const client = createWorkspaceClient({
  adapter: new FetchAdapter({ baseUrl: '/api/phz' }),
  dataAdapter: myDataAdapter
})

// --- Consumer's scheduled job (cron, data refresh hook, etc.) ---

async function runAlertEvaluation() {
  // 1. Load all enabled alert rules
  const rules = await client.listArtifacts({ type: 'alert-rule', enabled: true })

  // 2. Fetch current KPI values from your data backend
  const currentValues = new Map()
  for (const rule of rules) {
    for (const target of rule.targets) {
      if (!currentValues.has(target.id)) {
        const score = await myKPIService.evaluate(target.id)
        currentValues.set(target.id, score)
      }
    }
  }

  // 3. Load previous breach state
  const previousBreaches = await myBreachStore.getActive()

  // 4. Evaluate — pure function, no side effects
  const result = evaluateAlerts({ rules, currentValues, previousBreaches })

  // 5. Persist breach state (consumer's responsibility)
  await myBreachStore.save(result.activeBreaches)
  for (const resolved of result.resolvedBreaches) {
    await myBreachStore.resolve(resolved.id)
  }

  // 6. Deliver notifications (consumer's channels)
  for (const notification of result.notifications) {
    await myNotificationService.send(notification)
  }
}
```

The separation is strict: phz-grid provides `evaluateAlerts()` as a pure
function. The consumer provides scheduling, breach persistence, and
notification delivery. This means the alert system works identically
whether the consumer runs a Node.js cron job, a serverless function
triggered by data pipeline completion, or a manual "check now" button
in their admin UI.

For rendering breach state in consumer-side dashboards, the consumer
passes breach records to the workspace client:

```typescript
// When rendering a dashboard, provide active breaches
const breaches = await myBreachStore.getActiveForDashboard(dashboardId)

// The dashboard renderer injects these into each widget's RenderContext
renderDashboard(config, { breaches })
```

---

## Phase 8: Getting-Started Experience and Local Playground

### 8.1 Demo app

Create a standalone demo app deployable as a static site (Vite, no backend):
- Ships with 3 sample datasets (CSV/Parquet): sales data, IoT sensor data,
  HR/people data
- DuckDB-WASM as both WorkspaceAdapter (MemoryAdapter) and DataAdapter
- Full workspace embedded in a minimal shell
- Deployable to Netlify/Vercel/GitHub Pages with zero configuration
- This is the "5 minutes to first dashboard" proof point

### 8.2 Local playground mode

The demo app doubles as a fully functional local playground. The user
experience:

1. User visits the hosted demo (or runs locally via `npx phz-playground`)
2. Landing page shows two paths:
   - "Try with sample data" → loads pre-built datasets, shows example dashboards
   - "Upload your own data" → opens the file upload flow (CSV, Excel, Parquet, JSON)
3. User uploads a file → preview → confirm → data loaded into DuckDB-WASM
4. Suggestion flow proposes templates based on the uploaded schema
5. User picks a template or opens the explorer
6. All work auto-persists to OPFS (browser-local, survives refresh and restart)
7. Next visit: "Welcome back. Resume your session? [Resume] [Start fresh]"

The playground is not a limited trial. It is the full workspace with the
full widget set, full explorer, full filter system, full alert system.
The only difference from a production deployment: data lives in the
browser via DuckDB-WASM instead of a server-side database.

**Session management UI**: Add a "Sessions" panel in the playground that shows:
- List of saved sessions with name, date, data source count, artifact count
- Storage usage (e.g. "Using 45MB of local storage")
- Rename, duplicate, delete sessions
- Export session as ZIP (DuckDB export + artifact configs as JSON)
- Import session from ZIP (portable between machines/browsers)

The session export/import creates a portable workspace. A consultant can
build dashboards on their laptop, export the session, email it to a
colleague, and the colleague imports it into their playground. No server.
No accounts. No data leaves the browser unless explicitly exported.

### 8.3 Three deployment tiers — same UI, different adapters

The workspace UI is identical across all three tiers. The difference is
which adapters are wired in. This is the product's core portability story.

```
┌─────────────────────────────────────────────────────────────────┐
│                    phz-workspace UI                              │
│  (same shell, same widgets, same explorer, same filters)        │
├────────────────┬──────────────────┬─────────────────────────────┤
│  Tier 1        │  Tier 2          │  Tier 3                     │
│  Browser-only  │  Local Server    │  Production                 │
│                │                  │                             │
│  DuckDB-WASM   │  DuckDB native   │  Consumer's backend         │
│  OPFS storage  │  Filesystem      │  Consumer's database        │
│  MemoryAdapter │  LocalAdapter    │  FetchAdapter               │
│                │                  │                             │
│  Data from:    │  Data from:      │  Data from:                 │
│  · File upload │  · Filesystem    │  · Consumer's DataAdapter   │
│  · URL fetch   │  · File upload   │                             │
│  · API connect │  · URL fetch     │                             │
│  · S3 Parquet  │  · Watched dirs  │                             │
│                │                  │                             │
│  < 100MB data  │  < 100GB data    │  Unlimited                  │
│  Zero install  │  npx install     │  Full integration           │
│  Browser-local │  Disk-local      │  Multi-user                 │
└────────────────┴──────────────────┴─────────────────────────────┘
```

Tier 1 is the hosted playground (section 8.2). Tier 3 is the production
deployment (Phase 7). Tier 2 is described below.

### 8.4 Tier 2: Local server with persistent private data

Publish a `@phozart/phz-local` package that provides a lightweight
local server. The user runs:

```bash
npx phz-local
# → Starts a local server on http://localhost:3847
# → Opens the browser to the workspace
# → Creates ~/.phz/ directory for data and config storage
# → DuckDB native (not WASM) handles the data layer
```

**What the local server provides:**

A single Node.js process running Fastify (or similar lightweight framework)
that implements the WorkspaceAdapter and DataAdapter interfaces as REST
endpoints on localhost. The workspace UI connects via FetchAdapter:

```typescript
// Automatically configured when running via npx phz-local
const workspace = createWorkspace({
  adapter: new FetchAdapter({ baseUrl: 'http://localhost:3847/api' }),
  dataAdapter: new FetchAdapter({ baseUrl: 'http://localhost:3847/data' }),
})
```

**What lives on disk:**

```
~/.phz/
  config.json                     # server settings (port, data dir)
  data/
    datasets/
      sales-2025.parquet          # imported/uploaded files
      hr-export.csv
      my-analysis.duckdb          # DuckDB databases
    artifacts/
      dashboards/                 # saved dashboard configs (JSON)
      reports/
      kpis/
      alert-rules/
      templates/
      filter-presets/
  sessions/
    session-a.json                # workspace session state
```

**Why this matters beyond OPFS:**

- **No browser memory limit**: Native DuckDB handles hundreds of GBs.
  A user can import their entire company's annual export and build
  dashboards on it. DuckDB-WASM in the browser caps at 1-4GB.

- **True file persistence**: Data lives on the filesystem, not in a
  browser sandbox. Clearing browser data doesn't delete work. Backing
  up is copying a folder. Moving to a new machine is copying a folder.

- **Cross-browser**: The user can open the workspace in Chrome, close it,
  open it in Firefox, same data, same dashboards. OPFS is per-browser.

- **Local file watching**: The server can watch a directory for new or
  changed files and auto-import them. A user drops a CSV into
  `~/.phz/data/watch/` and it appears as a data source in the workspace
  within seconds. This turns the local server into a personal data hub.

- **Private by default**: All data stays on the user's machine. No
  network calls leave localhost. For sensitive data analysis this is
  a genuine security advantage over any cloud-hosted BI tool.

**Local server implementation:**

```typescript
// packages/phz-local/src/server.ts

interface LocalServerConfig {
  port: number                    // default 3847
  dataDir: string                 // default ~/.phz
  openBrowser: boolean            // default true
  watchDir?: string               // directory to watch for auto-import
  cors: boolean                   // default true (localhost only)
}
```

The server implements:

1. **WorkspaceAdapter endpoints**: CRUD for artifacts stored as JSON files
   in the data directory. Each artifact type gets a subdirectory. File names
   are the artifact ID. No database required for config storage.

2. **DataAdapter endpoints**: Wraps DuckDB Node.js bindings.
   - `POST /data/upload` — accepts file upload, loads into DuckDB,
     copies original file to `datasets/`
   - `GET /data/sources` — lists tables in DuckDB + files in `datasets/`
   - `POST /data/query` — translates DataQuery to SQL, executes via DuckDB
   - `GET /data/schema/:id` — DESCRIBE table
   - `GET /data/distinct/:id/:field` — SELECT DISTINCT for filter population
   - `GET /data/stats/:id/:field` — MIN, MAX, COUNT for field stats

3. **Static file serving**: Serves the pre-built workspace UI from the
   package's `dist/` directory. The UI is the exact same build as Tier 1
   but configured to use FetchAdapter instead of WASM adapters.

4. **File watcher** (optional): Uses `fs.watch` or `chokidar` on the
   configured watch directory. When a new CSV/Parquet/JSON file appears,
   auto-import it into DuckDB and register as a data source.

**Personal datasets that persist across sessions:**

Unlike Tier 1 (browser), datasets in Tier 2 are permanent until the user
explicitly deletes them. The data source panel in the workspace shows:

- All imported datasets with file name, row count, size, import date
- "Add Data" button with three options:
  - Upload file (same as Tier 1)
  - Import from path (browse local filesystem for CSV/Parquet/Excel)
  - Watch folder (configure a directory for auto-import)
- Per-dataset actions: refresh (re-import from original file), remove, rename
- If the original file has been updated since import, show a badge:
  "Source file changed. [Refresh]"

**The upgrade path from Tier 1 to Tier 2:**

A user who started with the browser playground can migrate to the local
server without losing work:

1. In the browser playground, export session as ZIP (section 8.2)
2. Install: `npx phz-local`
3. Import session: `npx phz-local import ./my-session.zip`
4. The server restores datasets into DuckDB and artifact configs into
   the data directory
5. The user opens the workspace and everything is there, now backed
   by native DuckDB instead of WASM

**The upgrade path from Tier 2 to Tier 3:**

When a user or team is ready for production deployment:

1. Export all artifact configs as JSON (the server already stores them as JSON)
2. Import into the production WorkspaceAdapter (via REST API or bulk import)
3. The consumer's DataAdapter replaces the local DuckDB — field names may
   differ, so field mappings (WORKSPACE-ARCHITECTURE-GAPS.md Part 1) are
   configured in the dashboard
4. Dashboards, reports, KPIs, templates, alert rules all transfer.
   Only the data source bindings need remapping.

This progression — browser playground → local server → production — means
a user never has to start over. Work accumulates across tiers.

### 8.5 Documentation structure

Five persona entry points:

**For anyone** (2 minutes):
- Visit playground → Upload CSV → See a dashboard
- No install, no account, no database

**For individual analysts** (10 minutes):
- `npx phz-local` → Import datasets → Build dashboards on private data
- Work persists on disk, handles large datasets, fully offline

**For consumers** (5 minutes):
- Install → Load config → Render dashboard
- Single code snippet that renders a pre-built dashboard from JSON

**For authors** (30 minutes):
- Open workspace → Upload data or select data source → Pick template → Customize → Save
- Video/GIF walkthrough of the suggestion flow and the explorer

**For developers** (2 hours):
- Implement DataAdapter for your backend
- Register custom widget with WidgetManifest
- Implement WorkspaceAdapter for your persistence layer
- Framework integration (React/Vue/Angular)

---

## Constraints and rules

- Do not break consumer-side packages. `engine`, `widgets`, `criteria`, `core`
  must remain independently installable without dependency on `phz-workspace`.
- Do not add database drivers. The adapter pattern is the boundary.
- Do not add authentication, RBAC, or session management. The consumer handles auth.
- Do not add NLP, LLM, or AI-to-dashboard features. The template suggestion system
  is heuristic-based pattern matching against field metadata.
- Do not add email, Slack, webhook, or any notification delivery code. The
  `AlertChannelAdapter` is the boundary. The consumer implements delivery.
- Do not add cron, scheduling, or periodic evaluation. The consumer calls
  `evaluateAlerts()` when they decide to. phz-grid provides the evaluation
  function, not the trigger.
- Alert evaluation (`evaluateAlerts()`) must be a pure function: no DOM, no
  network calls, no side effects. Input in, breach records out.
- Do not invent a routing system. `route` in PlacementRecord is a plain string.
- Every new component accepts `loading: boolean` and `error: string | null` props.
- All new types go in `phz-types`, not scattered across workspace internals.
- Run the full test suite after each phase. Existing tests must still pass.
- Add tests for: adapter interfaces, widget registry, template matcher,
  schema analyzer, migration runner, layout renderer, catalog browser logic,
  alert evaluator (simple thresholds, compound conditions, transition detection,
  cooldown enforcement, severity escalation/de-escalation), breach record
  lifecycle (active → acknowledged → resolved), file upload (CSV type inference,
  Excel multi-sheet, Parquet load, schema validation on replace), local data
  store (OPFS persist/restore, session export/import, storage cleanup),
  query coordinator (query merging, deduplication, cancellation),
  phz-local server (filesystem adapter CRUD, DuckDB native query translation,
  file watcher auto-import, session ZIP compatibility across tiers).
- Schema migrations are pure functions with no side effects.
- Widget renderers must support lazy loading via async `load()` in WidgetManifest.
- Layout intents must degrade gracefully: unsupported layout types fall back to
  `auto-grid` without crashing.
- Templates are first-class artifacts, not hardcoded presets. They use the same
  persistence adapter as dashboards and reports.
- The `phz-local` server must be zero-configuration. `npx phz-local` must work
  with no arguments, no config files, no environment variables. Defaults create
  `~/.phz/` and pick an open port. All configuration is optional.
- The `phz-local` server binds to localhost only. It must never listen on
  0.0.0.0 or expose itself to the network without explicit opt-in.
- Session export/import (ZIP format) must be compatible across Tier 1 (browser)
  and Tier 2 (local server). A session exported from OPFS must import into the
  local server and vice versa.
- Remote connection credentials (API keys, auth tokens in headers) are stored
  locally only (OPFS in Tier 1, filesystem in Tier 2). They are never included
  in session exports unless the user explicitly opts in. They are never sent to
  any phz-grid server or third party.
- CORS failures must produce clear, non-technical error messages with actionable
  resolution paths (download manually, ask IT, use Tier 2). Never show raw
  browser error text.

## Build order

```
core → phz-types → definitions → duckdb → engine → grid → criteria → widgets →
grid-admin → engine-admin → grid-creator → phz-workspace → phz-local
```

`phz-workspace` and `phz-local` are last in the chain. No other package
depends on them. `phz-local` depends on `phz-workspace` (it serves the
workspace UI) and on `duckdb` (native Node.js bindings, not WASM).

## Public exports from phz-workspace

```typescript
// Workspace authoring (admin-side)
export { WorkspaceShell } from './shell/workspace-shell'
export { createWorkspace } from './shell/workspace-context'

// Consumer-side client (read-only, no admin tools)
export { createWorkspaceClient } from './client'

// Adapters
export { MemoryAdapter } from './adapters/memory-adapter'
export { FetchAdapter } from './adapters/fetch-adapter'
export { DuckDBDataAdapter } from './adapters/duckdb-data-adapter'

// Local playground
export { LocalDataStore } from './local/local-data-store'
export { FileUploadManager } from './local/file-upload-manager'
export { RemoteDataConnector } from './local/remote-data-connector'
export { DataSourcePanel } from './local/data-source-panel'
export { SessionManager } from './local/session-manager'

// Query coordination (internal, but consumer may need to configure)
export { createQueryCoordinator } from './coordination/query-coordinator'

// Formatting
export { formatValue } from './format/format-value'

// Widget registry
export { WidgetRegistry } from './registry/widget-registry'
export { registerDefaultWidgets } from './registry/default-widgets'

// Migration
export { migrateConfig, registerMigration } from './migration/migrate'

// Alert evaluation (pure function, consumer calls this)
export { evaluateAlerts } from './alerts/alert-evaluator'

// Data exploration
export { DataExplorer } from './explore/data-explorer'
export { exploreToReport, exploreToDashboard } from './explore/explore-to-artifact'

// Filter context (consumer uses this to manage dashboard-level filters)
export { createFilterContext, serializeFilterState, deserializeFilterState } from './filters/filter-context'
export { FilterBar } from './filters/filter-bar'

// Re-exports from phz-types (convenience)
export type {
  WorkspaceAdapter, DataAdapter, WidgetManifest, WidgetRenderer, RenderContext,
  ConsumerCapabilities, LayoutNode, TemplateDefinition, PlacementRecord,
  VersionedConfig, AlertRule, AlertCondition, AlertSubscription,
  AlertChannelAdapter, BreachRecord, BreachNotification, ActiveBreach,
  FilterContext, FilterPreset, FilterContextState, ExploreQuery,
  DataQuery, AggregationSpec, ViewerContext, TimeIntelligenceConfig,
  UnitSpec, DataQualityInfo, FieldMapping, LocalSession, I18nProvider
} from '@phozart/phz-types'
```

## Public exports from phz-local

`@phozart/phz-local` is a separate package. It is NOT a dependency of
`phz-workspace`. It depends on `phz-workspace` (serves its UI) and on
DuckDB native Node.js bindings.

```typescript
// Server
export { createLocalServer } from './server'
export type { LocalServerConfig } from './server'

// CLI entry point (npx phz-local)
// → bin/phz-local.js — parses args, calls createLocalServer()

// Adapters (server-side implementations of workspace interfaces)
export { FileSystemWorkspaceAdapter } from './adapters/fs-workspace-adapter'
export { DuckDBNativeDataAdapter } from './adapters/duckdb-native-adapter'
export { FileWatcher } from './watchers/file-watcher'
```
