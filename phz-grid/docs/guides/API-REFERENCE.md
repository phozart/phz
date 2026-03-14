# phz-grid API Reference

Complete type reference for `@phozart/workspace`. All types are sourced
directly from the TypeScript source. Import paths are noted per section.

> **v15 additions**: See [API-REFERENCE-V15.md](./API-REFERENCE-V15.md) for
> new exports from `@phozart/shared`, `@phozart/viewer`,
> `@phozart/editor`, and new engine subsystems.

---

## 1. Data Layer

**Import:** `@phozart/workspace`

### DataAdapter

The primary interface for all data access. Implement this to connect to any
data source: DuckDB-WASM, REST APIs, GraphQL, custom backends.

```typescript
interface DataAdapter {
  execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult>;

  getSchema(sourceId?: string): Promise<DataSourceSchema>;

  listDataSources(): Promise<DataSourceSummary[]>;

  getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }>;

  getFieldStats(
    sourceId: string,
    field: string,
    filters?: unknown,
  ): Promise<{
    min?: number;
    max?: number;
    distinctCount: number;
    nullCount: number;
    totalCount: number;
  }>;
}
```

### DataQuery

```typescript
interface DataQuery {
  source: string;                    // Data source ID
  fields: string[];                  // Field names to select; use ['*'] for all
  filters?: unknown;                 // FilterExpression (see Filters section)
  groupBy?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  aggregations?: AggregationSpec[];
  pivotBy?: FieldReference[];
  windows?: WindowSpec[];
}
```

### DataResult

```typescript
interface DataResult {
  columns: ColumnDescriptor[];
  rows: unknown[][];
  metadata: {
    totalRows: number;
    truncated: boolean;
    queryTimeMs: number;
    quality?: DataQualityInfo;
  };
}
```

### DataSourceSchema

```typescript
interface DataSourceSchema {
  id: string;
  name: string;
  fields: FieldMetadata[];
  timeIntelligence?: TimeIntelligenceConfig;
}
```

### DataSourceSummary

```typescript
interface DataSourceSummary {
  id: string;
  name: string;
  fieldCount: number;
  rowCount?: number;
}
```

### FieldMetadata

```typescript
interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  cardinality?: 'low' | 'medium' | 'high';
  semanticHint?: SemanticHint;
  unit?: UnitSpec;
}
```

### SemanticHint

```typescript
type SemanticHint = 'measure' | 'dimension' | 'identifier' | 'timestamp' | 'category' | 'currency' | 'percentage';
```

### ColumnDescriptor

```typescript
interface ColumnDescriptor {
  name: string;
  dataType: string;
}
```

### AggregationSpec

```typescript
interface AggregationSpec {
  field: string;
  function: AggregationFunction;
  alias?: string;
}

type AggregationFunction =
  | 'sum' | 'avg' | 'count' | 'countDistinct'
  | 'min' | 'max' | 'median'
  | 'stddev' | 'variance'
  | 'first' | 'last';
```

### WindowSpec

```typescript
interface WindowSpec {
  field: string;
  function: WindowFunction;
  partitionBy?: string[];
  orderBy?: string[];
  alias: string;
  offset?: number;         // for lag/lead functions
  periodField?: string;    // for periodOverPeriod
  periodGranularity?: string;
}

type WindowFunction =
  | 'runningTotal' | 'rank' | 'denseRank' | 'rowNumber'
  | 'lag' | 'lead' | 'percentOfTotal' | 'periodOverPeriod';
```

### FieldReference

```typescript
interface FieldReference {
  field: string;
}
```

---

## 2. Widget System

**Import:** `@phozart/workspace`

### WidgetManifest

Declares a widget type's capabilities, size constraints, and required fields.

```typescript
interface WidgetManifest {
  type: string;                        // Unique widget type identifier
  category: string;                    // Display category (e.g. 'chart', 'kpi')
  name: string;
  description: string;
  thumbnail?: string;                  // URL to preview image
  requiredFields: FieldRequirement[];
  supportedAggregations: string[];
  minSize: WidgetSizeBounds;
  preferredSize: WidgetSizeBounds;
  maxSize: WidgetSizeBounds;
  supportedInteractions: InteractionType[];
  configSchema?: unknown;              // JSON Schema for widget-specific config
  variants: WidgetVariant[];
  load?: () => Promise<{
    render(config: unknown, container: HTMLElement, context: unknown): void;
    update?(config: unknown, context: unknown): void;
    destroy?(): void;
  }>;
  responsiveBehavior?: WidgetResponsiveBehavior;
}
```

### WidgetVariant

```typescript
interface WidgetVariant {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  presetConfig: Record<string, unknown>;
}
```

### WidgetCommonConfig

Base configuration shared by all widget instances.

```typescript
interface WidgetCommonConfig {
  title: string;
  subtitle?: string;
  description?: string;
  colorOverride?: string;
  hideHeader?: boolean;
  padding: 'none' | 'compact' | 'default';
  emptyStateMessage?: string;
  loadingBehavior: 'skeleton' | 'spinner' | 'previous';
  enableDrillThrough?: boolean;
  enableCrossFilter?: boolean;
  enableExport?: boolean;
  clickAction: 'drill' | 'filter' | 'navigate' | 'none';
  minHeight?: number;
  aspectRatio?: number;
  ariaLabel?: string;
  highContrastMode: 'auto' | 'force' | 'off';
}
```

**Defaults** (from `defaultWidgetCommonConfig()`):

| Field | Default |
|-------|---------|
| `title` | `''` |
| `padding` | `'default'` |
| `loadingBehavior` | `'skeleton'` |
| `clickAction` | `'none'` |
| `highContrastMode` | `'auto'` |

### WidgetResponsiveBehavior

```typescript
interface WidgetResponsiveBehavior {
  compactBelow: number;         // px width threshold for compact mode
  compactBehavior: {
    hideLegend?: boolean;
    hideAxisLabels?: boolean;
    hideDataLabels?: boolean;
    simplifyToSingleValue?: boolean;
    collapseToSummary?: boolean;
  };
  minimalBelow?: number;        // px width threshold for minimal mode
  minAspectRatio?: number;
  maxAspectRatio?: number;
}
```

### FieldRequirement

```typescript
interface FieldRequirement {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  role: 'measure' | 'dimension' | 'category' | 'time';
  required: boolean;
}
```

### InteractionType

```typescript
type InteractionType = 'drill-through' | 'cross-filter' | 'export-csv' | 'export-png' | 'click-detail';
```

### WidgetSizeBounds

```typescript
interface WidgetSizeBounds {
  cols: number;
  rows: number;
}
```

### WidgetRenderer

Implement this to register a custom widget renderer.

```typescript
interface WidgetRenderer<TConfig = unknown> {
  type: string;
  render(config: TConfig, container: HTMLElement, context: RenderContext): void;
  destroy?(): void;
}
```

### RenderContext

```typescript
interface RenderContext {
  data: Record<string, unknown>[];
  theme: Record<string, string>;
  locale: string;
}
```

---

## 3. Layout

**Import:** `@phozart/workspace`

### LayoutNode

Composable tree structure for dashboard layouts. Each node is one of four kinds.

```typescript
type LayoutNode = TabsLayout | SectionsLayout | AutoGridLayout | WidgetSlot;
```

### TabsLayout

```typescript
interface TabsLayout {
  kind: 'tabs';
  tabs: Array<{
    label: string;
    icon?: string;
    children: LayoutNode[];
  }>;
}
```

### SectionsLayout

```typescript
interface SectionsLayout {
  kind: 'sections';
  sections: Array<{
    title: string;
    collapsed?: boolean;
    children: LayoutNode[];
  }>;
}
```

### AutoGridLayout

```typescript
interface AutoGridLayout {
  kind: 'auto-grid';
  minItemWidth: number;    // minimum column width in px
  gap: number;             // gap between items in px
  maxColumns?: number;
  children: LayoutNode[];
}
```

### WidgetSlot

Leaf node — places a single widget.

```typescript
interface WidgetSlot {
  kind: 'widget';
  widgetId: string;
  weight?: number;         // flex weight for column span (default 1)
  minHeight?: number;      // minimum height in px
}
```

**Helper:** `flattenLayoutWidgets(node: LayoutNode): string[]`
Returns all `widgetId` strings referenced within a layout tree.

---

## 4. Templates

**Import:** `@phozart/workspace`

### TemplateDefinition

```typescript
interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  layout: LayoutNode;
  widgetSlots: TemplateWidgetSlot[];
  matchRules: TemplateMatchRule[];
  tags: string[];
  builtIn: boolean;
}
```

### TemplateWidgetSlot

```typescript
interface TemplateWidgetSlot {
  slotId: string;
  widgetType: string;
  variantId?: string;
  defaultConfig: Record<string, unknown>;
  fieldBindings: Record<string, string>;  // bindingKey -> default field name
}
```

### TemplateMatchRule

Used for scoring template recommendations against a data source schema.

```typescript
interface TemplateMatchRule {
  requiredFieldTypes: Array<{
    type: 'string' | 'number' | 'date' | 'boolean';
    semanticHint?: string;
    minCount: number;
  }>;
  weight: number;     // score multiplier
  rationale: string;  // human-readable explanation
}
```

### TemplateBinding

Represents an explicit field binding resolved from `TemplateWidgetSlot.fieldBindings`.

```typescript
interface TemplateBinding {
  slotId: string;
  bindingKey: string;
  fieldName: string;
}
```

**Related functions:**

- `resolveBindings(slots, bindings)` — Merges slot defaults with explicit bindings.
  Returns `Map<slotId, Record<bindingKey, fieldName>>`.
- `autoBindFields(slots, profile)` — Heuristically matches slots to measure/dimension/time
  fields from a `FieldProfile`. Returns `TemplateBinding[]`.

### TemplateId

```typescript
type TemplateId = string & { readonly __brand: 'TemplateId' };
function templateId(id: string): TemplateId;
```

---

## 5. Alerts

**Import:** `@phozart/workspace`

### AlertRule

```typescript
interface AlertRule {
  id: AlertRuleId;
  name: string;
  description: string;
  artifactId: string;         // dashboard or report ID
  widgetId?: string;          // widget within the artifact
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'critical';
  cooldownMs: number;         // minimum ms between successive breaches
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### AlertCondition

Discriminated union supporting simple thresholds and compound conditions.

```typescript
type AlertCondition = SimpleThreshold | CompoundCondition;

interface SimpleThreshold {
  kind: 'threshold';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  durationMs?: number;        // must stay breached for this duration
}

interface CompoundCondition {
  kind: 'compound';
  op: 'AND' | 'OR' | 'NOT';
  children: AlertCondition[];
}
```

### BreachRecord

```typescript
interface BreachRecord {
  id: BreachId;
  ruleId: AlertRuleId;
  artifactId: string;
  widgetId?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  detectedAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  currentValue: number;
  thresholdValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}
```

### ActiveBreach

```typescript
interface ActiveBreach {
  breach: BreachRecord;
  rule: AlertRule;
}
```

### AlertChannelAdapter

Consumer-implemented interface for delivering breach notifications.

```typescript
interface AlertChannelAdapter {
  send(breach: BreachRecord, subscription: AlertSubscription): Promise<void>;
  test(): Promise<boolean>;
  configSchema?: unknown;       // JSON Schema for channel config UI
}
```

### AlertSubscription

```typescript
interface AlertSubscription {
  id: string;
  ruleId: AlertRuleId;
  channelId: string;            // registered AlertChannelAdapter identifier
  recipientRef: string;         // email, Slack ID, webhook URL, etc.
  format: 'inline' | 'digest' | 'webhook';
  active: boolean;
}
```

### Branded IDs

```typescript
type AlertRuleId = string & { readonly __brand: 'AlertRuleId' };
function alertRuleId(id: string): AlertRuleId;

type BreachId = string & { readonly __brand: 'BreachId' };
function breachId(id: string): BreachId;
```

---

## 6. Filters

**Import:** `@phozart/workspace`

### FilterContextState

```typescript
interface FilterContextState {
  values: Map<string, FilterValue>;
  activeFilterIds: Set<string>;
  crossFilters: CrossFilterEntry[];
  lastUpdated: number;
  source: 'user' | 'preset' | 'url' | 'default';
}
```

### FilterValue

```typescript
interface FilterValue {
  filterId: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  label: string;
}
```

### FilterOperator

```typescript
type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  | 'between' | 'notBetween'
  | 'in' | 'notIn'
  | 'isNull' | 'isNotNull'
  | 'before' | 'after'
  | 'lastN' | 'thisperiod' | 'previousperiod';
```

### CrossFilterEntry

```typescript
interface CrossFilterEntry {
  sourceWidgetId: string;
  field: string;
  value: unknown;
  timestamp: number;
}
```

### DashboardFilterBarConfig

```typescript
interface DashboardFilterBarConfig {
  filters: DashboardFilterDef[];
  position: 'top' | 'left';
  collapsible: boolean;
  defaultCollapsed: boolean;
  showActiveFilterCount: boolean;
  showPresetPicker: boolean;
  defaultPresetId?: string;
  dependencies: FilterDependency[];
}
```

### DashboardFilterDef

```typescript
interface DashboardFilterDef {
  id: string;
  field: string;
  dataSourceId: string;
  label: string;
  filterType: FilterUIType;
  defaultValue?: unknown;
  required: boolean;
  appliesTo: string[];      // widget IDs this filter targets
}
```

### FilterUIType

```typescript
type FilterUIType =
  | 'select' | 'multi-select' | 'chip-select' | 'tree-select'
  | 'date-range' | 'date-preset' | 'numeric-range'
  | 'search' | 'boolean-toggle' | 'field-presence';
```

### FilterDependency

```typescript
interface FilterDependency {
  parentFilterId: string;
  childFilterId: string;
  constraintType: 'data-driven' | 'explicit-mapping';
}
```

### FilterContextManager

Created via `createFilterContext(options?)`. Manages the four-layer filter state
for a dashboard.

```typescript
interface FilterContextManager {
  getState(): FilterContextState;
  setFilter(filter: FilterValue): void;
  clearFilter(filterId: string): void;
  clearAll(): void;
  applyCrossFilter(entry: CrossFilterEntry): void;
  clearCrossFilter(widgetId: string): void;
  resolveFilters(widgetId?: string): FilterValue[];
  resolveFiltersForSource(dataSourceId: string, widgetId?: string): FilterValue[];
  subscribe(listener: () => void): () => void;    // returns unsubscribe function
  setSource(source: FilterContextState['source']): void;
}
```

**Filter priority order** (highest to lowest):
1. User/widget filters
2. Cross-filters (excluding the requesting widget's own)
3. Dashboard default values from `DashboardFilterDef.defaultValue`

---

## 7. Explorer

**Import:** `@phozart/workspace`

### ExploreQuery

Self-service exploration model. Users drag fields into slots to build ad-hoc queries.

```typescript
interface ExploreQuery {
  dimensions: ExploreFieldSlot[];
  measures: ExploreValueSlot[];
  filters: ExploreFilterSlot[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
}
```

### ExploreFieldSlot

```typescript
interface ExploreFieldSlot {
  field: string;
  alias?: string;
}
```

### ExploreValueSlot

```typescript
interface ExploreValueSlot {
  field: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';
  alias?: string;
}
```

### ExploreFilterSlot

```typescript
interface ExploreFilterSlot {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'between';
  value: unknown;
}
```

**Helper:** `exploreToDataQuery(explore: ExploreQuery): ExploreDataQuery`

Converts an `ExploreQuery` to a flat `ExploreDataQuery` suitable for passing
to a `DataAdapter`. Dimension fields become `groupBy`, measure fields become
`aggregations`.

---

## 8. Interaction

**Import:** `@phozart/workspace`

### InteractionBus

Pub/sub event bus for cross-widget communication. Created via `createInteractionBus()`.

```typescript
interface InteractionBus {
  emit(event: WidgetEvent): void;
  on<T extends WidgetEvent['type']>(
    type: T,
    handler: (event: Extract<WidgetEvent, { type: T }>) => void,
  ): () => void;   // returns unsubscribe function
  off<T extends WidgetEvent['type']>(
    type: T,
    handler: (event: Extract<WidgetEvent, { type: T }>) => void,
  ): void;
}
```

### WidgetEvent

Discriminated union of all cross-widget events:

```typescript
type WidgetEvent =
  | { type: 'drill-through'; sourceWidgetId: string; field: string; value: unknown }
  | { type: 'cross-filter'; sourceWidgetId: string; filters: unknown[] }
  | { type: 'clear-cross-filter'; sourceWidgetId: string }
  | { type: 'selection-change'; sourceWidgetId: string; selectedRows: unknown[] }
  | { type: 'time-range-change'; sourceWidgetId: string; from: Date; to: Date }
  | { type: 'navigate'; targetArtifactId: string; filters?: unknown[] }
  | { type: 'export-request'; sourceWidgetId: string; format: 'csv' | 'png' | 'pdf' };
```

### RenderContext

Provided to `WidgetRenderer.render()` by the widget host:

```typescript
interface RenderContext {
  data: Record<string, unknown>[];
  theme: Record<string, string>;
  locale: string;
}
```

---

## 9. Time Intelligence

**Import:** `@phozart/workspace`

### TimeIntelligenceConfig

Attached to a `DataSourceSchema` to declare time-aware query capabilities.

```typescript
interface TimeIntelligenceConfig {
  primaryDateField: string;
  fiscalYearStartMonth: number;    // 1-12, default 1 (January)
  weekStartDay: 'sunday' | 'monday';
  granularities: TimeGranularity[];
  relativePeriods: RelativePeriod[];
}
```

### TimeGranularity

```typescript
type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
```

### RelativePeriod

```typescript
interface RelativePeriod {
  id: string;
  label: string;
  calculate: (referenceDate: Date, config: TimeIntelligenceConfig) => { from: Date; to: Date };
}
```

**Built-in relative periods** (`DEFAULT_RELATIVE_PERIODS`):

| ID | Label |
|----|-------|
| `'today'` | Today |
| `'yesterday'` | Yesterday |
| `'this-week'` | This Week |
| `'last-week'` | Last Week |
| `'this-month'` | This Month |
| `'last-month'` | Last Month |
| `'this-quarter'` | This Quarter |
| `'last-quarter'` | Last Quarter |
| `'this-year'` | This Year |
| `'last-year'` | Last Year |
| `'last-7-days'` | Last 7 Days |
| `'last-30-days'` | Last 30 Days |
| `'last-90-days'` | Last 90 Days |
| `'last-365-days'` | Last 365 Days |

Quarter and year calculations respect `fiscalYearStartMonth`.
Week calculations respect `weekStartDay`.

**Helper:** `resolvePeriod(periodId, config, referenceDate?)` — Calculates
`{ from: Date; to: Date }` for a period ID. Throws if the ID is not found.

---

## 10. Formatting

**Import:** `@phozart/workspace`

### UnitSpec

Controls how numeric values are formatted in widgets and grids.

```typescript
interface UnitSpec {
  type: 'currency' | 'percent' | 'number' | 'duration' | 'custom';
  currencyCode?: string;       // ISO 4217 (e.g. 'USD', 'EUR'). Default: 'USD'
  durationUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
  suffix?: string;             // appended for 'custom' type
  decimalPlaces?: number;
  abbreviate?: boolean;        // use compact notation (1.2K, 3.4M)
  showSign?: boolean;          // show '+' for positive values
}
```

### formatValue

```typescript
function formatValue(
  value: number | null,
  unit: UnitSpec | undefined,
  locale: string,
  options?: { compact?: boolean },
): string;
```

`null` returns an em-dash (`—`). Uses `Intl.NumberFormat` for locale-aware output.

| `unit.type` | Example output |
|-------------|----------------|
| `'currency'` | `$1,234.56`, `$1.2K` (with `abbreviate`) |
| `'percent'` | `42%` |
| `'number'` | `1,234`, `+1.2K` (with `showSign` + `abbreviate`) |
| `'duration'` | `3.5s`, `120m` |
| `'custom'` | `99 items` (with `suffix: ' items'`) |
| `undefined` | plain locale number |

### AggregationWarning

```typescript
interface AggregationWarning {
  severity: 'warning' | 'error';
  message: string;
  field: string;
  aggregation: string;
}
```

**`validateAggregation(field, aggregation): AggregationWarning | null`**

Checks if an aggregation is compatible with a field's data type. Returns `null`
if valid, an error `AggregationWarning` if incompatible (e.g. `sum` on a string
field), or a warning if the field is numeric but nullable.

---

## 11. Quality

**Import:** `@phozart/workspace`

### DataQualityInfo

Attached to `DataResult.metadata.quality` when the data source provides freshness
and completeness metadata.

```typescript
interface DataQualityInfo {
  lastRefreshed?: string;          // ISO 8601 timestamp
  freshnessStatus?: 'fresh' | 'stale' | 'unknown';
  freshnessThresholdMinutes?: number;
  completeness?: number;           // 0.0-1.0 (1.0 = fully complete)
  issues?: DataQualityIssue[];
}
```

### DataQualityIssue

```typescript
interface DataQualityIssue {
  severity: 'info' | 'warning' | 'error';
  message: string;
  field?: string;                  // field name if issue is field-specific
}
```

**Helper:** `computeFreshnessStatus(lastRefreshed: string, thresholdMinutes: number): 'fresh' | 'stale' | 'unknown'`

Returns `'unknown'` if `lastRefreshed` is not a valid date string.

---

## 12. History

**Import:** `@phozart/workspace`

### ArtifactHistoryExtension

Optional mixin for `WorkspaceAdapter` implementations that support version history.

```typescript
interface ArtifactHistoryExtension {
  getArtifactHistory(
    id: string,
    options?: { limit?: number; before?: number }
  ): Promise<VersionSummary[]>;

  getArtifactVersion(id: string, version: number): Promise<unknown>;

  restoreArtifactVersion(id: string, version: number): Promise<void>;
}
```

Use `hasHistorySupport(adapter)` to check before calling:

```typescript
function hasHistorySupport(adapter: WorkspaceAdapter): adapter is WorkspaceAdapter & ArtifactHistoryExtension;
```

### VersionSummary

```typescript
interface VersionSummary {
  version: number;           // monotonically increasing, starts at 1
  savedAt: number;           // Unix timestamp ms
  savedBy?: string;          // optional user identifier
  changeDescription?: string;
  sizeBytes: number;
}
```

**`generateChangeDescription(previous: unknown, current: unknown): string`**

Compares two artifact objects by key. Returns:
- `'Initial version'` — when `previous` is `undefined` or `null`
- `'No changes'` — when both objects are equivalent
- `'Added x. Modified y. Removed z.'` — describing added/removed/modified top-level keys

---

## 13. I18n

**Import:** `@phozart/workspace`

### I18nProvider

```typescript
interface I18nProvider {
  t(key: string, params?: Record<string, string | number>): string;
  locale: string;
  direction: 'ltr' | 'rtl';
}
```

**`createDefaultI18nProvider(locale?: string): I18nProvider`**

Creates a built-in English provider. Falls back to the key string if a
translation is not found in `DEFAULT_STRINGS`. Named parameters use `{name}`
interpolation:

```typescript
i18n.t('filter.activeFilters', { count: 5 }) // "5 active filter(s)"
```

Automatically detects RTL for locales: `ar`, `he`, `fa`, `ur`, `ps`, `sd`, `yi`.

### DirectionConfig

```typescript
interface DirectionConfig {
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
}
```

**RTL helper functions:**

```typescript
function resolveDirection(i18n?: I18nProvider): 'ltr' | 'rtl';
function logicalProperty(physicalProp: string, direction: 'ltr' | 'rtl'): string;
function generateRTLOverrides(): string;  // returns CSS string for :host([dir="rtl"])
```

---

## 14. Viewer

**Import:** `@phozart/workspace`

### ViewerContext

Identity context for the currently viewing user. Passed to `DataAdapter.execute()`
as `context.viewerContext`. The adapter is responsible for applying access control.

```typescript
interface ViewerContext {
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;  // arbitrary key-value claims
}
```

---

## 15. Connectors

**Import:** `@phozart/workspace`

### RemoteDataConnector

Manages browser-side connections to remote data files and APIs.

```typescript
interface RemoteDataConnector {
  connectURL(opts: {
    name: string;
    url: string;
    format: 'csv' | 'json' | 'parquet';
    refreshIntervalMs?: number;
    headers?: Record<string, string>;
  }): Promise<RemoteConnection>;

  connectAPI(opts: {
    name: string;
    endpoint: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    pagination?: {
      type: 'offset' | 'cursor';
      pageSize: number;
      cursorField?: string;
    };
  }): Promise<RemoteConnection>;

  refresh(id: ConnectionId): Promise<RemoteConnection>;
  listConnections(): Promise<RemoteConnection[]>;
  removeConnection(id: ConnectionId): Promise<void>;
}
```

### URLConnectionConfig

```typescript
interface URLConnectionConfig {
  url: string;
  format: 'csv' | 'json' | 'parquet';
  refreshIntervalMs?: number;
  headers?: Record<string, string>;
}
```

### APIConnectionConfig

```typescript
interface APIConnectionConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  pagination?: {
    type: 'offset' | 'cursor';
    pageSize: number;
    cursorField?: string;
  };
  resultPath?: string;    // dot-path into response JSON to extract data array
}
```

### RemoteConnection

```typescript
interface RemoteConnection {
  id: ConnectionId;
  name: string;
  type: 'url' | 'api';
  config: URLConnectionConfig | APIConnectionConfig;
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'refreshing';
  createdAt: number;
  lastRefreshedAt?: number;
  errorMessage?: string;
}
```

### ConnectionId

```typescript
type ConnectionId = string & { readonly __brand: 'ConnectionId' };
function connectionId(id: string): ConnectionId;
```

### CredentialStore

```typescript
interface CredentialStore {
  save(connectionId: string, credential: StoredCredential): Promise<void>;
  load(connectionId: string): Promise<StoredCredential | undefined>;
  delete(connectionId: string): Promise<void>;
  clear(): Promise<void>;
}

type StoredCredential =
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'api-key'; key: string; value: string }
  | { type: 'custom-headers'; headers: Record<string, string> };
```

### CORSDiagnosis

```typescript
type CORSResolution = 'download-manually' | 'configure-server' | 'use-local-proxy';

interface CORSDiagnosis {
  isCORS: boolean;
  url: string;
  message: string;
  resolutions: CORSResolution[];
}

function diagnoseCORSError(error: unknown, url: string): CORSDiagnosis;
```

---

## 16. Adapters

**Import:** `@phozart/workspace` (memory adapters) | `@phozart/local` (fs adapter)

### WorkspaceAdapter

See the full interface definition in the [Admin Guide — WorkspaceAdapter](ADMIN-GUIDE.md#1-workspaceadapter).

Core required methods:

```typescript
interface WorkspaceAdapter extends EngineStorageAdapter, AsyncDefinitionStore {
  initialize(): Promise<void>;
  savePlacement(placement: PlacementRecord): Promise<PlacementRecord>;
  loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]>;
  deletePlacement(id: PlacementId): Promise<void>;
  listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;

  // Optional breach store extensions
  saveAlertRule?(rule: AlertRule): Promise<void>;
  loadAlertRules?(artifactId?: string): Promise<AlertRule[]>;
  deleteAlertRule?(ruleId: AlertRuleId): Promise<void>;
  saveBreachRecord?(breach: BreachRecord): Promise<void>;
  loadActiveBreaches?(artifactId?: string): Promise<BreachRecord[]>;
  updateBreachStatus?(breachId: BreachId, status: BreachRecord['status']): Promise<void>;
  saveSubscription?(sub: AlertSubscription): Promise<void>;
  loadSubscriptions?(ruleId?: AlertRuleId): Promise<AlertSubscription[]>;

  // Optional template store extensions
  saveTemplate?(template: TemplateDefinition): Promise<void>;
  loadTemplates?(): Promise<TemplateDefinition[]>;
  deleteTemplate?(id: TemplateId): Promise<void>;
}
```

### MemoryWorkspaceAdapter

In-memory implementation. Implements `WorkspaceAdapter` + `ArtifactHistoryExtension`.

```typescript
class MemoryWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
  // Full WorkspaceAdapter implementation
  // Automatic version recording on saveReport()
  // clear() resets all stores including history
}
```

**Usage:**
```typescript
import { MemoryWorkspaceAdapter } from '@phozart/workspace';
const adapter = new MemoryWorkspaceAdapter();
await adapter.initialize();
```

### FetchWorkspaceAdapter

REST client implementation.

```typescript
class FetchWorkspaceAdapter implements WorkspaceAdapter {
  constructor(options: FetchAdapterOptions);
  // initialize() calls GET /health
}

interface FetchAdapterOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}
```

### FsWorkspaceAdapter

Filesystem implementation for Node.js. Implements `WorkspaceAdapter` + `ArtifactHistoryExtension`.

```typescript
import { FsWorkspaceAdapter } from '@phozart/local';

class FsWorkspaceAdapter implements WorkspaceAdapter, ArtifactHistoryExtension {
  constructor(dataDir: string);
  // initialize() creates artifact directories
  // Uses atomic writes: write .tmp, then rename
  // Artifact files: {dataDir}/artifacts/{type}/{id}.json
  // Version files:  {dataDir}/artifacts/{type}/{id}.v{n}.json
}
```

### MemoryDataAdapter

In-memory `DataAdapter` for testing and small datasets. Supports filter, sort,
groupBy, aggregations, and pagination over plain object arrays.

```typescript
import { MemoryDataAdapter } from '@phozart/workspace';

class MemoryDataAdapter implements DataAdapter {
  addSource(id: string, data: Record<string, unknown>[]): void;
  removeSource(id: string): void;
  // Implements: execute, getSchema, listDataSources, getDistinctValues, getFieldStats
}
```

**Supported aggregations:** `count`, `countDistinct`, `sum`, `avg`, `min`,
`max`, `median`, `first`, `last`, `stddev`, `variance`

Schema inference: field types are inferred from the first non-null value.
Cardinality thresholds: `distinctCount/total <= 0.5 = low`, `<= 0.75 = medium`,
`> 0.75 = high`.

---

## 17. Coordination

**Import:** `@phozart/workspace`

### QueryCoordinator

Batches concurrent widget data queries with concurrency control, deduplication,
and per-widget cancellation. Created via `createQueryCoordinator(adapter, config?)`.

```typescript
interface QueryCoordinatorInstance {
  submit(
    widgetId: string,
    query: DataQuery,
  ): Promise<CoordinatorResult>;

  cancel(widgetId: string): void;

  flush(): Promise<void>;  // waits for all pending queries to complete
}
```

Submitting a new query for a `widgetId` that already has a pending query
automatically cancels the previous one (deduplication). Results have columns
already materialized as object keys.

### QueryCoordinatorConfig

```typescript
interface QueryCoordinatorConfig {
  maxConcurrent: number;    // max simultaneous DataAdapter.execute() calls
  batchWindowMs: number;    // ms to wait before dispatching queued queries
}
```

**Defaults:**

| Field | Default |
|-------|---------|
| `maxConcurrent` | `4` |
| `batchWindowMs` | `50` |

**`defaultQueryCoordinatorConfig(overrides?): QueryCoordinatorConfig`**

### CoordinatorResult

```typescript
interface CoordinatorResult {
  data: unknown[];                  // array of row objects (key = column name)
  meta?: Record<string, unknown>;   // query metadata (totalRows, queryTimeMs, etc.)
}
```

---

## Artifact and Placement Types

**Import:** `@phozart/workspace`

### ArtifactType

```typescript
type ArtifactType =
  | 'report' | 'dashboard' | 'kpi' | 'metric'
  | 'grid-definition' | 'filter-preset'
  | 'alert-rule' | 'subscription';
```

### ArtifactMeta

```typescript
interface ArtifactMeta {
  id: string;
  type: ArtifactType;
  name: string;
  description?: string;
  createdAt: number;    // Unix timestamp ms
  updatedAt: number;    // Unix timestamp ms
  published?: boolean;
}
```

### ArtifactFilter

```typescript
interface ArtifactFilter {
  type?: ArtifactType;
  search?: string;      // case-insensitive substring match on name
  published?: boolean;
}
```

### PlacementRecord

Records where an artifact has been placed (e.g., a dashboard embedded in a portal).

```typescript
interface PlacementRecord {
  id: PlacementId;
  artifactType: ArtifactType;
  artifactId: string;
  target: string;               // target location identifier (page URL, slot name, etc.)
  config?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
```

### PlacementFilter

```typescript
interface PlacementFilter {
  artifactId?: string;
  artifactType?: ArtifactType;
  target?: string;
}
```

### PlacementId

```typescript
type PlacementId = string & { readonly __brand: 'PlacementId' };
function placementId(id: string): PlacementId;
function createPlacement(input: CreatePlacementInput): PlacementRecord;
```

---

## Widget Registry

**Import:** `@phozart/workspace`

### WidgetRegistry

Open registry for lazy-loadable widget renderers. Use `createWidgetRegistry()`.

```typescript
interface WidgetRegistry {
  register(type: string, renderer: WidgetRenderer | (() => Promise<WidgetRenderer>)): void;
  get(type: string): WidgetRenderer | undefined;      // sync only (no lazy loading)
  has(type: string): boolean;
  list(): string[];
  resolve(type: string): Promise<WidgetRenderer | undefined>;  // triggers lazy load
}
```

**`createWidgetRegistry(): WidgetRegistry`**

### ManifestRegistry

Registry for `WidgetManifest` objects. Use `createManifestRegistry()`.

```typescript
interface ManifestRegistry {
  registerManifest(manifest: WidgetManifest): void;
  getManifest(type: string): WidgetManifest | undefined;
  listManifests(): WidgetManifest[];
  listByCategory(category: string): WidgetManifest[];
  findByCapabilities(filter: CapabilityFilter): WidgetManifest[];
  getVariants(type: string): WidgetVariant[];
  resolveVariant(type: string, variantId: string): WidgetVariant | undefined;
}

interface CapabilityFilter {
  interactions?: InteractionType[];
  fieldRoles?: FieldRequirement['role'][];
}
```
