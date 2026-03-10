# phz-workspace Data Interaction — Companion Instructions

## Purpose

This document supplements the main instructions with the data interaction
layer: filtering, data exploration, and the visual query builder. These are
not secondary features. Filtering is how users interact with data. The visual
query builder is how non-technical users construct analyses without writing
code or expressions. Together they fill the gap between "pick a template"
and "write a formula" in the progressive disclosure stack.

Read this after the main instruction set and the conventions companion.
Apply during Phase 2 (types), Phase 3 (explore/filter modules), Phase 4
(integration with existing criteria package), Phase 6 (consumer rendering),
and Phase 7 (consumer integration).

---

## Part 1: Filter Architecture

**Filter ownership model — who manages what:**

This is the foundational rule. Every filter-related feature follows from it.

```
ADMIN (workspace authoring):
  ├── Creates and manages FilterDefinitions in the catalog
  │   (name, UI type, value source, data source bindings, security bindings)
  │
  ├── Configures which filters each dashboard/report accepts
  │   (ArtifactFilterContract: accepted filters, validation, transforms)
  │
  ├── Creates published filter presets for the organization
  │   ("Q3 2025 EMEA" — visible to everyone, visibility: 'published')
  │
  └── Sets default presets per dashboard
      (auto-applied when any user opens the dashboard)

END USER (consumer side):
  ├── Uses the filters the admin made available (cannot create new filter types)
  │
  ├── Sets filter values within the admin-defined constraints
  │   (validation limits what values are selectable)
  │
  ├── Saves personal presets on the admin's global filters
  │   ("My View: Europe, Express" — visibility: 'personal', only they see it)
  │
  └── Their personal preset becomes their dashboard preload
      (dashboard opens into their saved context next time)
```

Admins own the filter definitions and the filter contracts per artifact.
Users own personal presets. Users CANNOT create filter definitions, add
filters to dashboards, modify validation rules, or configure transforms.
They interact with the filters the admin provided, within the constraints
the admin defined. The personal preset is their only customization, and
it operates entirely within the boundaries the admin set.

This means:
- If an admin removes a filter from a dashboard, users' personal presets
  that reference that filter are automatically pruned (the orphaned value
  is dropped from the preset, the preset itself is preserved).
- If an admin changes validation rules (e.g. restricts a date range),
  users' existing presets with out-of-range values are automatically
  clamped or invalidated based on the `onInvalid` policy.
- If an admin adds a new filter to a dashboard, it appears in the filter
  bar with its default value. Existing user presets don't include a value
  for it, so the admin's default applies for that filter.

### 1.0 Filters are centrally managed catalog artifacts

Filters are NOT defined per-dashboard. They are defined once in the
workspace catalog, just like KPIs and metrics, and then bound to
dashboards and reports. This is the enterprise model.

**FilterDefinition** — a reusable, centrally managed filter:

```typescript
interface FilterDefinition extends VersionedConfig {
  type: 'filter-definition'

  // What the user sees
  label: string                   // "Region", "Time Period", "Service Type"
  description?: string
  filterType: FilterUIType        // select, multi-select, chip-select, date-range, etc.

  // Where the filter values come from
  valueSource: FilterValueSource

  // How this filter maps to fields in different data sources
  bindings: FilterBinding[]

  // Security: restrict available values based on viewer attributes
  securityBinding?: SecurityBinding

  // Dependencies: which other filters constrain this one (cascading)
  dependsOn?: string[]            // IDs of other FilterDefinitions

  // Defaults
  defaultValue?: unknown
  required: boolean               // cannot be cleared
}

type FilterValueSource =
  | { type: 'data-source'; dataSourceId: string; field: string; labelField?: string }
  // Values come from a specific field in a data source.
  // If labelField is set, it's used for display (e.g. field=country_code, labelField=country_name)
  | { type: 'lookup-table'; dataSourceId: string; valueField: string; labelField: string }
  // Values come from a dedicated lookup/reference table.
  // Decoupled from any report's data source.
  | { type: 'static'; values: { value: unknown; label: string }[] }
  // Hardcoded list. Use for small, stable sets (status, boolean, etc.)

interface FilterBinding {
  // Which data source this binding applies to
  dataSourceId: string

  // Which field in that data source this filter maps to
  targetField: string

  // Optional transformation (e.g. filter stores 'Europe' but the
  // target field uses country codes, need a lookup expansion)
  transform?: 'direct' | 'lookup'
  lookupConfig?: {
    lookupDataSourceId: string
    lookupValueField: string      // field in lookup matching the filter value
    lookupTargetField: string     // field in lookup matching the data source field
  }
}

interface SecurityBinding {
  // Which ViewerContext attribute restricts this filter's available values
  viewerAttribute: string         // e.g. 'region', 'department', 'access_level'

  // How the restriction is applied
  restrictionType: 'include-only' | 'exclude' | 'max-value'
  // 'include-only': viewer sees only values matching their attribute
  //   e.g. viewer.attributes.region = 'Europe' → only European regions shown
  // 'exclude': viewer sees all values except those matching
  // 'max-value': for numeric filters, viewer's attribute is the ceiling
  //   e.g. viewer.attributes.access_level = 3 → can't filter above level 3
}
```

**Why this matters:**

An organization has 30 dashboards and 15 reports. All of them use a
"Region" filter. In the current per-dashboard model, the admin configures
"Region" 45 times. In the central model:

1. Admin creates FilterDefinition "Region" once in the catalog
2. Value source: lookup table `ref_regions` → `region_code`, `region_name`
3. Bindings: maps to `region` in data source A, `country_group` in B,
   `dest_region` in C
4. Security: viewer attribute `region` restricts available values
5. Any dashboard/report can reference this filter by ID

When the list of regions changes, the admin updates it in one place.
When a new data source needs the same filter, the admin adds a binding.
When security rules change, the admin updates the security binding.

### 1.0.1 How dashboards reference central filters

The `DashboardFilterBarConfig` changes from defining filters inline to
referencing central FilterDefinitions:

```typescript
interface DashboardFilterBarConfig {
  filters: DashboardFilterRef[]   // references, not definitions
  position: 'top' | 'left'
  collapsible: boolean
  defaultCollapsed: boolean
  showActiveFilterCount: boolean
  showPresetPicker: boolean
  defaultPresetId?: string
  dependencies: FilterDependency[]
}

interface DashboardFilterRef {
  // Reference to the central FilterDefinition
  filterDefinitionId: string

  // Dashboard-specific overrides (optional)
  labelOverride?: string          // show a different label on this dashboard
  defaultValueOverride?: unknown  // different default than the central definition
  requiredOverride?: boolean      // make it required on this dashboard even if
                                  // the central definition says optional

  // Which widgets on this dashboard this filter affects
  appliesTo: string[]             // widget IDs, empty = all

  // Query behavior
  queryLayer: 'server' | 'client' | 'auto'
}
```

The filter bar renders using the central FilterDefinition (UI type, value
source, label) with optional dashboard-level overrides. The filter values
are fetched from the value source, restricted by the security binding,
and constrained by cascading dependencies — all configured centrally, all
reusable.

### 1.0.2 Filter catalog management in the workspace

The workspace shell's "Data Sources" section (or a dedicated "Filters"
section) includes a filter catalog:

- List all FilterDefinitions with their value sources and binding count
- Create new filters: pick a name, UI type, value source, add bindings
- Edit existing filters: change value source, add/remove bindings
- Test a filter: preview the value dropdown with a simulated viewer context
- See which dashboards/reports use this filter (reverse dependency view)
- Duplicate a filter to create a variant (e.g. "Region (Europe only)")

When an admin drags a field from the data source palette into a
dashboard's filter bar, the workspace:
1. Checks if a FilterDefinition already exists that binds to this field
2. If yes: shows "Use existing filter '[name]'?" → links the reference
3. If no: offers "Create new filter from this field" → opens the filter
   definition form pre-populated from the field metadata

This means admins naturally build up a filter catalog as they create
dashboards, rather than having to pre-define everything upfront.

### 1.0.3 Security filtering on filter values

When a viewer opens a dashboard and the filter bar renders, the
filter value population flow is:

1. Read the FilterDefinition's `valueSource`
2. Call `dataAdapter.getDistinctValues()` on the value source
3. If `securityBinding` exists, apply it:
   - Read `viewerContext.attributes[securityBinding.viewerAttribute]`
   - For `'include-only'`: filter the returned values to only those
     matching the viewer's attribute
   - For `'exclude'`: remove values matching the viewer's attribute
4. If `dependsOn` cascading: further filter by parent filter's current value
5. Render the filter UI with the resulting value set

The viewer never sees values they shouldn't have access to. The
restriction happens at the filter value population stage, not at the
data query stage. This means:
- A regional manager only sees their region in the Region dropdown
- They can't select other regions even if the data source contains them
- If they clear the Region filter, it auto-applies their region as an
  implicit filter (they can't see unfiltered data for regions they don't
  have access to)

The DataAdapter's `getDistinctValues()` already supports a `filters`
parameter for cascading. Security filtering adds an additional implicit
filter from the viewer's attributes. Both are applied server-side.

### 1.0.4 Shared and personal presets reference central filter IDs

FilterPresets (from section 1.4 below) reference central filter IDs,
not field names:

```typescript
interface FilterPreset extends VersionedConfig {
  type: 'filter-preset'
  description?: string
  scope: 'global' | 'dashboard' | 'report'
  scopeId?: string

  // Values reference central FilterDefinition IDs
  values: PresetFilterValue[]

  isDefault: boolean
}

interface PresetFilterValue {
  filterDefinitionId: string      // references the central filter
  value: unknown
  label: string                   // human-readable for display
}
```

Because presets reference central filter IDs, they work across any
dashboard that uses the same filters. A user saves "My View: Europe, Q3,
Express" on Dashboard A. If Dashboard B uses the same Region, Quarter,
and Service Type filters (same FilterDefinition IDs), the preset can
optionally be applied there too (`scope: 'global'` presets apply
across all dashboards that share the referenced filters).

### 1.1 The filter hierarchy

Filters operate at four levels. Each level inherits from the one above and
can add or override:

```
Global filter context (workspace-wide, e.g. "current fiscal year")
  └── Dashboard filter context (shared across all widgets on a dashboard)
        └── Report/artifact-specific filter (validated against the artifact's contract)
              └── Widget-level filter (specific to one widget, e.g. "top 10 only")
                    └── Cross-filter (transient, from clicking a data point)
```

The consumer sees one unified filter state per widget. The rendering pipeline
merges all levels into a single `FilterExpression[]` that gets passed to
`dataAdapter.execute()` as part of the `DataQuery`. Widgets never construct
their own data queries directly — they declare what data they need, and the
rendering pipeline adds the merged filters.

### 1.1.1 Artifact filter contracts

Each report or dashboard declares what filters it accepts, what values
are valid, and how incoming filter values should be transformed. This is
the bridge between the existing criteria package concepts and the central
filter catalog.

```typescript
interface ArtifactFilterContract {
  // Which central FilterDefinitions this artifact accepts
  acceptedFilters: AcceptedFilter[]

  // Filters this artifact requires — the artifact won't render without these
  requiredFilters: string[]        // FilterDefinition IDs

  // How to handle filter values that this artifact doesn't recognize
  unknownFilterPolicy: 'ignore' | 'warn' | 'reject'
  // 'ignore': silently drop unrecognized filters (default)
  // 'warn':   render with a notice: "Filter 'X' does not apply to this report"
  // 'reject': show error and don't render (for strict data governance scenarios)
}

interface AcceptedFilter {
  filterDefinitionId: string       // reference to the central FilterDefinition

  // What values are valid for THIS artifact specifically
  // (may be more restrictive than the central definition)
  validation?: FilterValidation

  // How to transform the incoming filter value for this artifact
  // (when the global vocabulary doesn't match the artifact's data model)
  valueTransform?: FilterValueTransform

  // Override the query behavior for this specific artifact
  queryLayerOverride?: 'server' | 'client' | 'auto'
}

interface FilterValidation {
  // Allowed values (whitelist). If set, values not in this list are rejected.
  allowedValues?: unknown[]

  // Disallowed values (blacklist). Values in this list are rejected.
  disallowedValues?: unknown[]

  // Range constraints (for numeric and date filters)
  min?: unknown
  max?: unknown

  // Custom validation message shown when values fail validation
  validationMessage?: string
  // e.g. "This report only contains data for 2024-2025. Please select
  //        a date range within this period."

  // What to do with invalid values
  onInvalid: 'reject' | 'clamp' | 'fallback'
  // 'reject': don't apply the filter, show validation message
  // 'clamp':  adjust value to nearest valid value
  //           (e.g. date before min → set to min)
  // 'fallback': use a specified fallback value instead
  fallbackValue?: unknown
}

interface FilterValueTransform {
  type: 'direct' | 'lookup' | 'expression' | 'granularity-shift'

  // 'direct': no transformation, pass value as-is
  // This is the default for most cases.

  // 'lookup': translate the filter value through a lookup table.
  // Example: global filter emits region='Europe', but this report's
  // data source uses country codes. The lookup expands 'Europe' to
  // ['NL', 'BE', 'DE', 'FR', ...].
  lookupConfig?: {
    lookupDataSourceId: string
    filterValueField: string       // field matching the incoming value
    targetValueField: string       // field to use as the translated value
    // The lookup returns all rows where filterValueField matches,
    // and uses targetValueField values as the actual filter.
  }

  // 'expression': transform the value using an expression.
  // Example: global filter emits quarter='Q3-2025', but this report
  // needs a date range. Expression converts to {from, to}.
  expression?: ExpressionAST

  // 'granularity-shift': change the time granularity.
  // Example: global filter emits a date range (2025-07-01 to 2025-09-30)
  // but this report works at month granularity. The shift extracts
  // months [7, 8, 9] from the range.
  granularityConfig?: {
    sourceGranularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
    targetGranularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
    targetField: string
  }
}
```

**Why this exists (the real-world problem):**

An organization has a global "Time Period" filter that emits
`{ operator: 'between', value: ['2025-07-01', '2025-09-30'] }`.

Report A uses an Oracle table where the date column is `event_date`
(DATE type). The global filter value works directly.

Report B uses a MicroStrategy cube where the time dimension is
`fiscal_quarter` (VARCHAR, e.g. 'FQ1-2026' because fiscal year starts
in July). The global filter value would produce zero results if passed
directly. The `granularity-shift` transform converts the date range to
the matching fiscal quarter code.

Report C uses a pre-aggregated table where time is stored as `year_month`
(INTEGER, e.g. 202507). The `expression` transform extracts year-month
integers from the date range.

Without filter contracts, the admin would need to create separate "Time
Period" filters for each report's data model. With filter contracts,
one global "Time Period" filter works everywhere — each report declares
how to translate it.

**How filter contracts are configured in the workspace:**

In the **report designer** or **dashboard builder**:

1. "Filters" configuration tab shows all central FilterDefinitions
2. Admin checks which filters this artifact accepts
3. For each accepted filter, the admin can optionally configure:
   - Validation rules (restrict valid ranges, whitelist values)
   - Value transforms (lookup, expression, granularity shift)
4. The workspace auto-detects when a transform is needed:
   - Global filter targets field type DATE, but artifact's bound field
     is VARCHAR → prompt: "This filter needs a transformation. The
     global filter emits dates, but this report's field is text."
   - Global filter targets `region` but artifact's data source has
     `country_code` → prompt: "Do you want to set up a lookup to
     expand regions to country codes?"

### 1.1.2 Filter resolution pipeline

When a filter value flows from the global context to a specific widget,
it passes through these stages:

```
Global FilterValue (from filter bar or preset)
  │
  ├── 1. Contract check: Does this artifact accept this filter?
  │   If unknownFilterPolicy = 'ignore' and filter not in contract → skip
  │   If unknownFilterPolicy = 'reject' → show error
  │
  ├── 2. Validation: Is the value valid for this artifact?
  │   Check allowedValues, disallowedValues, min/max range
  │   If invalid + onInvalid = 'clamp' → adjust value
  │   If invalid + onInvalid = 'fallback' → use fallbackValue
  │   If invalid + onInvalid = 'reject' → show validation message,
  │     don't apply filter (widget renders with no filter or previous valid filter)
  │
  ├── 3. Transform: Convert the value for this artifact's data model
  │   Apply lookup, expression, or granularity-shift as configured
  │
  ├── 4. Binding resolution: Map to the actual field name in the data source
  │   Use FilterBinding.targetField from the central FilterDefinition
  │
  └── 5. Merge with other filter levels (widget-level, cross-filter)
      Result: FilterExpression[] ready for dataAdapter.execute()
```

Each stage can produce a warning or error that surfaces in the UI:
- Validation failure: orange indicator on the affected widget(s) with tooltip
- Transform failure: red indicator, widget shows error state
- Binding missing: the filter simply doesn't apply to this widget (no error,
  it's valid for a global filter to not apply to every artifact)

### 1.1.3 Admin validation feedback in the workspace

When the admin configures a dashboard and references a global filter:

- The workspace shows a compatibility matrix: for each filter × each
  widget, does the filter binding exist? Is a transform needed?
  Green check = direct binding. Yellow = transform configured.
  Red X = no binding (filter doesn't apply to this widget's data source).
  Gray = binding exists but needs transform configuration.

- If the admin adds a widget from a data source that has no binding for
  an existing filter, the workspace prompts: "The 'Region' filter does
  not have a binding for data source 'EDI Messages'. Add one?"

- The admin can test filter application in preview mode: select a filter
  value, see the resolved filter expression for each widget, and verify
  that the transforms produce correct results.

### 1.1.4 Connection to existing criteria package

The existing `criteria` package has `FilterDesigner`, `FilterConfigurator`,
`RuleAdmin`, and `PresetAdmin`. These map to the new architecture:

- `FilterDesigner` → the UI for creating/editing a `FilterDefinition`
  (central filter catalog entry). Needs to be extended with `FilterBinding`
  configuration per data source and `SecurityBinding` configuration.

- `FilterConfigurator` → the UI for configuring an `AcceptedFilter` on
  a specific artifact (validation rules, transforms). This is the
  per-report/per-dashboard filter contract configuration.

- `RuleAdmin` → validation rules on the `AcceptedFilter` (allowed values,
  ranges, fallback behavior). Existing concept, needs to be wired to
  the new type system.

- `PresetAdmin` → the `FilterPreset` management UI. Already covered in
  the preset sections below.

During Phase 1.8 (criteria system audit), specifically identify:
- Which of these components exist as working code vs. partial stubs
- How close the existing `FilterBinding` concept in the criteria package
  is to the `FilterBinding` type defined here
- Whether the existing `CriteriaEngine` already handles value transforms
  or only direct field mapping
- What validation logic exists (range checking, allowed values) and
  whether it runs client-side or server-side

### 1.2 FilterContext type

```typescript
interface FilterContextState {
  // Active filter values, keyed by filter ID
  values: Map<string, FilterValue>

  // Which filters are currently applied (vs. available but not set)
  activeFilterIds: Set<string>

  // Cross-filter state (from widget click interactions)
  crossFilters: CrossFilterEntry[]

  // Metadata
  lastUpdated: string
  source: 'user' | 'preset' | 'url' | 'default'
}

interface FilterValue {
  filterDefinitionId: string      // references the central FilterDefinition
  operator: FilterOperator
  value: unknown               // type depends on the filter type
  label: string                // human-readable: "Region: Europe, Asia"
}

type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual'
  | 'between' | 'notBetween'
  | 'in' | 'notIn'
  | 'isNull' | 'isNotNull'
  | 'before' | 'after' | 'lastN' | 'thisperiod' | 'previousperiod'

interface CrossFilterEntry {
  sourceWidgetId: string
  field: string
  value: unknown
  timestamp: string            // for ordering / timeout
}
```

### 1.3 FilterContext manager

```typescript
interface FilterContextManager {
  // State
  getState(): FilterContextState
  subscribe(listener: (state: FilterContextState) => void): () => void

  // User actions
  setFilter(filterId: string, value: FilterValue): void
  clearFilter(filterId: string): void
  clearAll(): void

  // Cross-filter (from widget interactions)
  applyCrossFilter(entry: CrossFilterEntry): void
  clearCrossFilter(sourceWidgetId: string): void
  clearAllCrossFilters(): void

  // Presets
  applyPreset(preset: FilterPreset): void
  saveAsPreset(name: string): FilterPreset

  // URL sync
  serializeToURL(): string       // returns URL search params
  restoreFromURL(params: string): void

  // Resolution: merge all filter levels into a flat FilterExpression[]
  resolveFilters(widgetId?: string): FilterExpression[]
}
```

The `resolveFilters()` method is the critical function. When a widget needs
data, the rendering pipeline calls `resolveFilters(widgetId)` to get the
merged filter set, then passes it to `dataAdapter.execute()`. The merge
precedence: global defaults → dashboard context → widget-level → cross-filter.
Conflicts are resolved by the most specific level winning (a widget-level
filter overrides a dashboard-level filter on the same field).

### 1.4 FilterPreset type

```typescript
interface FilterPreset extends VersionedConfig {
  type: 'filter-preset'
  description?: string
  scope: 'global' | 'dashboard' | 'report'
  scopeId?: string              // dashboardId or reportId if scoped
  values: FilterValue[]
  isDefault: boolean            // auto-apply when dashboard loads
  // visibility and ownerId inherited from VersionedConfig
}
```

Filter presets are first-class artifacts, persisted via WorkspaceAdapter.
They inherit `visibility` and `ownerId` from `VersionedConfig`:

- **Personal presets** (`visibility: 'personal'`): A user saves "My Region"
  as a filter combination. Only they see it in the preset picker. Stored
  on the server alongside their personal dashboards, accessible from any
  browser within the org.
- **Shared presets** (`visibility: 'shared'`): A team lead creates
  "EMEA Q3 2025" and shares it with the sales team. The team sees it
  in their preset picker for the relevant dashboard.
- **Published presets** (`visibility: 'published'`): An admin creates
  "Q3 2025 Europe" as an org-wide preset. Everyone sees it. An admin
  can mark a published preset as default: when the dashboard loads,
  this preset is auto-applied for all viewers.

End users can save personal presets without any admin involvement. This
is the "save my filtered view" feature. The preset stores the filter
values, not the data. The data is still queried live from the DataAdapter
with the user's ViewerContext, so row-level isolation is preserved.

**Personal presets as dashboard preloads:**

When a dashboard's `preload.usePersonalView` is true (see main instructions,
DashboardDataConfig), the user's personal preset for that dashboard
becomes their preload query. The dashboard opens directly into their
context. A regional manager's "My View: Europe, Express, Q3" means the
preload query includes those filters, so the first data the dashboard
renders is already scoped to their working context. The full load runs
in the background with the same filters applied, so the full dataset
is also scoped. If the user clears filters, a new full load fetches
the broader scope.

This means "Save my view" has two effects:
1. The preset appears in their filter bar dropdown for manual recall
2. The preset becomes the automatic preload next time they open the dashboard

The second effect is the one users will feel most. Their dashboard
"remembers" them.

### 1.5 Cascading filters

Cascading means selecting a value in one filter constrains the available
values in another. Example: selecting "Europe" in the region filter limits
the country filter to European countries only.

```typescript
interface FilterDependency {
  parentFilterId: string
  childFilterId: string
  // How the child's available values are constrained
  constraintType: 'data-driven' | 'explicit-mapping'
}
```

For `data-driven` cascading (the common case):
1. User selects "Europe" in the region filter
2. The cascading resolver calls `dataAdapter.getDistinctValues('countries', {
     filters: [{ field: 'region', operator: 'in', value: ['Europe'] }]
   })`
3. The country filter dropdown updates to show only European countries
4. If the previously selected country is not in Europe, clear the selection

The `getDistinctValues()` method on DataAdapter (added in the main
instructions) supports the `filters` parameter for exactly this purpose.
The DataAdapter pushes the cascading constraint down to the query layer,
not filtering in JavaScript.

For `explicit-mapping` cascading (rare, for non-data relationships):
The admin manually defines a mapping in the FilterDesigner. Example:
"If department = Engineering, show team options [Frontend, Backend, Platform]."
This is stored in the filter configuration, not queried from data.

### 1.6 Dashboard filter bar configuration

Each dashboard config includes a filter bar definition:

```typescript
interface DashboardFilterBarConfig {
  // Which filters to show in the horizontal bar
  filters: DashboardFilterDef[]

  // Layout behavior
  position: 'top' | 'left'       // horizontal bar or vertical sidebar
  collapsible: boolean            // can the user collapse the filter bar?
  defaultCollapsed: boolean
  showActiveFilterCount: boolean  // "3 filters active" badge

  // Preset support
  showPresetPicker: boolean
  defaultPresetId?: string

  // Dependencies
  dependencies: FilterDependency[]
}

interface DashboardFilterDef {
  id: string
  field: string
  dataSourceId: string
  label: string
  filterType: FilterUIType
  defaultValue?: unknown
  required: boolean               // cannot be cleared
  // Which widgets this filter affects (empty = all widgets)
  appliesTo: string[]             // widget IDs, empty = all

  // Query layer: where this filter is resolved
  queryLayer: 'server' | 'client' | 'auto'
  // 'server': changing this filter triggers a server round-trip
  //           (re-runs the full load query with new filters)
  // 'client': applied on cached data, instant, no server call
  // 'auto':   pipeline decides based on whether the field is in the cache
}
}

type FilterUIType =
  | 'select'                      // single dropdown
  | 'multi-select'                // multi-select with checkboxes
  | 'chip-select'                 // horizontal chips
  | 'tree-select'                 // hierarchical (region → country → city)
  | 'date-range'                  // from/to date pickers
  | 'date-preset'                 // Last 7 days, This month, etc.
  | 'numeric-range'               // min/max sliders or inputs
  | 'search'                      // text search with type-ahead
  | 'boolean-toggle'              // on/off switch
  | 'field-presence'              // has value / is null
```

The `appliesTo` field is important. Not every filter should affect every
widget. A "date range" filter might affect all charts but not a static
KPI card showing all-time totals. An admin configures this per-filter
in the dashboard builder.

### 1.7 Cross-filter integration with the filter bar

When a user clicks a bar in a chart (cross-filter), the transient filter
must integrate cleanly with the persistent filter bar:

- Cross-filters appear as removable pills in the filter bar, visually
  distinct from admin-configured filters (e.g. lighter background,
  "x" to clear, italic label)
- Cross-filters stack with existing filters (AND logic)
- Cross-filters do NOT persist across page navigation or refresh
- If a cross-filter conflicts with a filter bar value on the same field,
  the cross-filter narrows further (intersection, not replacement)
- A "Clear all cross-filters" button appears when any are active

### 1.8 URL filter state

The filter context must be serializable to URL query parameters so users
can share filtered views by copying a link:

```typescript
// Serialize
const filterState = filterContext.serializeToURL()
// Returns: "f.region=in:Europe,Asia&f.date=between:2025-01-01,2025-06-30&preset=q3-europe"
history.replaceState(null, '', `?${filterState}`)

// Deserialize on page load
const params = new URLSearchParams(window.location.search)
filterContext.restoreFromURL(params.toString())
```

The serialization format:
- Filter values: `f.{field}={operator}:{value}` (comma-separated for arrays)
- Preset ID: `preset={presetId}` (if a preset is active)
- If both preset and individual filters are present, the preset loads first,
  then individual filters override specific values

Keep URLs human-readable. A product manager should be able to read
`?f.region=in:Europe&f.quarter=equals:Q3` and understand what it means.

---

## Part 2: Visual Query Explorer

### 2.1 What the explorer is

The Data Explorer is the tool between "pick a template" and "write
expressions." It lets a non-technical user construct a data analysis by
dragging fields into zones — conceptually similar to a pivot table builder
in Excel — but presented as a visual, interactive tool, not a spreadsheet.

The explorer produces two outputs:
1. A live preview of the query results (table and/or chart)
2. A `DataQuery` object that can be saved as a report config or used to
   populate a dashboard widget

The explorer is NOT a SQL editor. It does not expose SQL syntax. Under the
hood it constructs `DataQuery` objects that the DataAdapter translates to
SQL (or whatever the backend speaks). The user never sees the query.

### 2.2 Explorer layout

The explorer has four zones arranged around a central preview:

```
┌─────────────────────────────────────────────────────────┐
│ Data Source: [Sales Data ▾]        [Save as Report] [+] │
├──────────┬──────────────────────────────────────────────┤
│          │  DROP ZONES                                  │
│  Field   │  ┌──────────────────────────────────────┐    │
│  Palette │  │ Rows:    [Region ×] [Product ×]      │    │
│          │  │ Columns: [Quarter ×]                  │    │
│  ─────── │  │ Values:  [Revenue (SUM) ×] [Qty ×]   │    │
│  region  │  │ Filters: [Year = 2025 ×]              │    │
│  product │  └──────────────────────────────────────┘    │
│  quarter │                                              │
│  revenue │  PREVIEW                                     │
│  qty     │  ┌──────────────────────────────────────┐    │
│  cost    │  │                                      │    │
│  date    │  │  (live pivot table / chart preview)   │    │
│  ...     │  │                                      │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  [Table ◉] [Chart ○]  [SQL ○]               │
└──────────┴──────────────────────────────────────────────┘
```

### 2.3 Field palette

The left panel shows all fields from the selected data source, loaded via
`dataAdapter.getSchema()`. Each field shows:
- Field name
- Type icon (# for number, Aa for string, calendar for date, ✓ for boolean)
- Cardinality badge (if available): "42 values" for low-card, "10K+" for high-card

Fields are draggable. Drag a field to a drop zone to add it. Fields can
also be double-clicked to auto-place (numeric → Values, string → Rows,
date → Columns, then Rows as fallback).

The palette supports:
- Search/filter by name
- Group by type (Numbers, Categories, Dates)
- Show/hide fields marked as `semanticHint: 'identifier'` (IDs are rarely
  useful in exploration and clutter the palette)

### 2.4 Drop zones

**Rows**: Fields here become the GROUP BY dimensions displayed as row headers.
Multiple fields create a hierarchical grouping (Region → Product).
Order matters — drag to reorder.

**Columns**: Fields here create column headers in a cross-tab/pivot layout.
Typically one field (e.g. Quarter), occasionally two. Too many column values
produce an unreadable table — the explorer should warn if column cardinality
exceeds 20 and suggest moving to Rows instead.

**Values**: Fields here are the aggregated measures. Each value field gets
a default aggregation function:
- Number fields: SUM (default), changeable to AVG, COUNT, MIN, MAX, MEDIAN
- String fields: COUNT (default), COUNT DISTINCT
- Date fields: COUNT, MIN, MAX

The aggregation function is shown as a dropdown on the value pill:
`[Revenue (SUM) ▾]`. Clicking opens: SUM, AVG, COUNT, MIN, MAX, MEDIAN,
COUNT DISTINCT, % of Total, Running Total.

**Filters**: Fields here constrain the query. Dropping a field opens its
filter configurator inline:
- String field → multi-select with search (calls `getDistinctValues()`)
- Number field → range slider with min/max inputs (calls `getFieldStats()`)
- Date field → date range picker with presets (Last 7 days, This month, etc.)
- Boolean → toggle

Filters in the explorer work identically to dashboard filter bar filters.
They produce `FilterExpression[]` on the `DataQuery`.

### 2.5 Aggregation picker

When a numeric field is in the Values zone, clicking the aggregation
function opens a picker:

| Function | Label | Description |
|----------|-------|-------------|
| `sum` | Sum | Total of all values |
| `avg` | Average | Mean value |
| `count` | Count | Number of rows |
| `countDistinct` | Count Distinct | Number of unique values |
| `min` | Minimum | Lowest value |
| `max` | Maximum | Highest value |
| `median` | Median | Middle value |
| `percentOfTotal` | % of Total | Each group's share of total (window function) |
| `runningTotal` | Running Total | Cumulative sum (window function) |
| `periodOverPeriod` | vs. Previous Period | Change from prior period |

The last three are window functions that get translated to `WindowSpec` on
the `DataQuery`. The preview updates immediately when the aggregation changes.

### 2.6 Preview modes

The preview area supports three modes, toggled by buttons below the preview:

**Table mode** (default): Renders the query result as a formatted table.
- Rows = GROUP BY fields as row headers (with subtotals if multiple)
- Columns = pivot column values as column headers (if any)
- Cells = aggregated values
- Sortable by clicking column headers
- Conditional formatting auto-applied: heat map coloring on numeric cells
  (green high, red low by default, configurable)
- Subtotals and grand totals row at the bottom
- Row limit: show first 1000 rows with "Load more" pagination

**Chart mode**: Auto-suggests a chart type based on the query shape:
- 1 dimension + 1 measure → horizontal bar chart
- 1 date dimension + 1 measure → line chart
- 1 dimension + 2+ measures → grouped bar chart
- 2 dimensions + 1 measure → stacked bar or heatmap
- 1 measure only (no dimensions) → single KPI card

The user can override the auto-suggestion by picking from a chart type
selector. The chart renders using the existing widget components from
`@phozart/phz-widgets`. This is not a new charting system — the explorer
reuses the dashboard widgets as preview renderers.

**SQL mode**: Shows the generated SQL query (read-only). This is for
power users who want to understand what the explorer is doing or copy
the SQL for use elsewhere. The SQL is generated by the DuckDB DataAdapter
(if available) or shown as a structured DataQuery JSON if the adapter
doesn't expose SQL. The SQL view includes a "Copy" button.

### 2.7 Live preview execution

The preview updates automatically as the user modifies drop zones.
Debounce: 300ms after the last drop/change before executing. Show a
loading indicator on the preview while the query runs. If the query takes
longer than 2 seconds, show a progress message: "Querying [N] rows..."

For large datasets, the explorer should:
- Set `limit: 10000` on the DataQuery for preview purposes
- Show a "Showing first 10,000 of 2.4M rows" notice
- The actual saved report/dashboard can use different limits

If the query returns an error (e.g. the DataAdapter rejects the aggregation
or the query times out), show the error inline in the preview area with
a suggestion: "Try reducing the number of row dimensions or adding a
filter to narrow the data."

### 2.8 Save to artifact

The explorer toolbar has two save actions:

**"Save as Report"**: Converts the current explore state to a ReportConfig:
- Rows → report columns (GROUP BY fields)
- Columns → pivot configuration
- Values → aggregation configuration
- Filters → report filter configuration
- Sort → report sort (from table column click)
- Opens a name/description dialog, then saves via WorkspaceAdapter

**"Add to Dashboard"**: Converts the current explore state to a widget
config and adds it to a dashboard:
- Opens a dashboard picker (existing dashboards or "Create new")
- Auto-selects widget type from the chart mode suggestion
- The widget is added to the dashboard with the explore query as its
  data binding
- The user is optionally redirected to the dashboard builder

Both conversions use `exploreToReport()` and `exploreToDashboard()` functions
that map the explore state to the appropriate config types. These are pure
functions, testable without DOM.

```typescript
interface ExploreQuery {
  dataSourceId: string
  rows: ExploreFieldSlot[]
  columns: ExploreFieldSlot[]
  values: ExploreValueSlot[]
  filters: ExploreFilterSlot[]
  sortBy?: SortExpression[]
  limit?: number
}

interface ExploreFieldSlot {
  field: string
  label?: string
}

interface ExploreValueSlot {
  field: string
  aggregation: AggregationSpec['function']
  label?: string
  format?: string                 // '#,##0.00', '0.0%', etc.
  // Window function config (for % of total, running total, etc.)
  window?: {
    function: WindowSpec['function']
    partitionBy?: string[]
    orderBy?: string
  }
}

interface ExploreFilterSlot {
  field: string
  operator: FilterOperator
  value: unknown
  label: string
}
```

### 2.9 Explore to DataQuery translation

The `ExploreQuery` translates to `DataQuery` as follows:

```typescript
function exploreToDataQuery(explore: ExploreQuery): DataQuery {
  return {
    dataSourceId: explore.dataSourceId,
    fields: [
      ...explore.rows.map(r => ({ field: r.field })),
      ...explore.columns.map(c => ({ field: c.field })),
    ],
    groupBy: [
      ...explore.rows.map(r => ({ field: r.field })),
      ...explore.columns.map(c => ({ field: c.field })),
    ],
    aggregations: explore.values.map(v => ({
      field: v.field,
      function: v.aggregation,
      alias: v.label || `${v.aggregation}_${v.field}`
    })),
    pivotBy: explore.columns.map(c => ({ field: c.field })),
    filters: explore.filters.map(f => ({
      type: 'condition',
      field: f.field,
      operator: f.operator,
      value: f.value
    })),
    windows: explore.values
      .filter(v => v.window)
      .map(v => ({
        field: v.field,
        function: v.window!.function,
        partitionBy: v.window!.partitionBy,
        orderBy: v.window!.orderBy,
        alias: v.label || `${v.window!.function}_${v.field}`
      })),
    sortBy: explore.sortBy,
    limit: explore.limit || 10000
  }
}
```

### 2.10 Explore sessions and history

The explorer maintains a session with undo/redo support:
- Every drop zone change pushes a state snapshot
- Ctrl+Z undoes (removes the last field from the last modified zone)
- The session is not persisted unless explicitly saved as an artifact

The explorer also keeps a recent queries list (last 10 explore states).
In Tier 1/2 (single user), these are session-scoped in memory. In Tier 3
(server), recent explorations are saved as personal artifacts
(`visibility: 'personal'`, `type: 'explore-session'`) so the user can
close their browser, come back the next day, and see "Recent explorations"
with their last 10 queries. These are private to the user, invisible to
everyone else, and can be promoted to full reports or dashboards when ready.

---

## Part 3: Filter UX Conventions for Admin

### 3.1 Filter designer improvements

The existing FilterDesigner and FilterStudio in `criteria` need to
integrate with the workspace. The admin experience for configuring
dashboard filters:

**In the dashboard builder**, the admin configures the filter bar by:
1. Clicking "Configure Filters" in the dashboard header
2. A panel slides in showing the current filter bar definition
3. Drag fields from the data source schema to the filter bar
4. Each dropped field gets a filter type auto-selected based on field type:
   - String + low cardinality → chip-select
   - String + medium cardinality → multi-select with search
   - String + high cardinality → search (type-ahead)
   - Number → numeric-range
   - Date → date-range with presets
   - Boolean → boolean-toggle
5. The admin can override the auto-selected filter type
6. For each filter, the admin configures:
   - Label (defaults to field name)
   - Required (true/false)
   - Default value
   - Which widgets it applies to (default: all)
7. The admin can define cascading dependencies by drawing a connection
   between two filters (drag from parent to child)
8. The admin can create filter presets (named combinations)
9. The admin sets one preset as default (auto-applied on load)

### 3.2 Filter preset authoring

When the admin clicks "Save Current Filters as Preset":
1. The current filter bar state is captured
2. A dialog asks for: name, description, visibility (personal/shared/published),
   whether it's the default for this visibility scope
3. The preset is saved as a `FilterPreset` artifact via WorkspaceAdapter
4. Presets appear in the filter bar dropdown, grouped by visibility

End users can save personal presets at any time without admin involvement.
The filter bar shows a "Save this view" button that captures the current
filter state as a personal preset. The preset dropdown groups:

- **My presets**: personal presets owned by the current user
- **Team presets**: shared presets visible to the user's groups
- **Organization presets**: published presets visible to everyone

This is powered by the same visibility system as dashboards and reports
(VersionedConfig.visibility). No separate preset permission model needed.

### 3.3 Filter testing in the dashboard builder

The dashboard builder should show a "Test Filters" mode where:
- The filter bar renders at the top of the dashboard preview
- The admin can interact with filters and see how widgets respond
- Cascading behavior is visible (changing region updates country options)
- Cross-filter is testable (click a chart bar, see other widgets filter)
- The preview shows the resolved `DataQuery` for each widget (click a
  widget → see the query with all filter levels merged)
- This helps admins debug why a widget shows unexpected data

---

## Part 4: Filter UX for End Users (Consumer Side)

### 4.1 Filter bar rendering

The consumer renders the dashboard filter bar above the dashboard layout.
The filter bar is a Lit component provided by `@phozart/phz-workspace`:

```typescript
<phz-filter-bar
  .config=${dashboard.filterBar}
  .context=${filterContext}
  .dataAdapter=${dataAdapter}
  @filter-change=${(e) => filterContext.setFilter(e.detail.filterId, e.detail.value)}
  @filter-clear=${(e) => filterContext.clearFilter(e.detail.filterId)}
  @preset-apply=${(e) => filterContext.applyPreset(e.detail.preset)}
></phz-filter-bar>
```

The filter bar is a consumer-side component, not workspace-only. It ships
in the public exports and can be used independently of the workspace shell.

### 4.2 Filter UI component behavior

Each filter type has specific interaction conventions:

**Select / Multi-select**:
- Shows the top N values immediately (from `getDistinctValues()`)
- Type-ahead search for finding specific values
- "Select all" / "Clear all" shortcuts
- Shows count of matching rows next to each option (if DataAdapter provides it)
- Selected values appear as pills above the dropdown

**Chip-select** (for low cardinality, < 10 values):
- All values rendered as horizontal chips
- Click to toggle, selected chips are filled, unselected are outlined
- No dropdown, all options visible at once
- Suitable for: status, region (small set), boolean-ish fields

**Date range**:
- Two date pickers (from / to)
- Preset shortcuts: Today, Yesterday, Last 7 days, Last 30 days,
  This month, Last month, This quarter, Last quarter, This year, Last year,
  Custom range
- Calendar visualization showing the selected range
- "Compare to" toggle: when enabled, adds a comparison period
  (same duration, immediately prior) and widgets show delta

**Numeric range**:
- Dual-thumb slider with min/max inputs
- Range populated from `getFieldStats()` (min/max of the field)
- Histogram sparkline above the slider showing value distribution
  (optional, from `dataAdapter.execute()` with bucketing)

**Search** (for high cardinality text fields):
- Text input with type-ahead suggestions from `getDistinctValues({ search })`
- Debounced at 200ms
- Shows "N results" as the user types
- Enter or click to apply the filter

**Tree-select** (for hierarchical dimensions like Region → Country → City):
- Expandable tree with checkboxes at each level
- Selecting a parent auto-selects all children
- Partially selected parent shows indeterminate state
- Search within the tree
- The hierarchy structure is derived from the data (the DataAdapter returns
  values with their parent relationships) or explicitly configured by the
  admin in the FilterDesigner

### 4.3 Active filter pills

Below the filter bar, show a row of pills summarizing all active filters:

```
[Region: Europe, Asia ×] [Quarter: Q3 2025 ×] [Revenue: > 50K ×]  Clear all
```

Each pill shows the field name, the applied value(s), and an × to remove.
"Clear all" removes all non-required filters and resets to the default
preset (if one exists) or to no filters.

Cross-filter pills are visually distinct (dashed border, different background):
```
[Region: Europe, Asia ×] [Quarter: Q3 2025 ×] ·  Chart: Product = Laptop ×
```

### 4.4 Filter state persistence

Filter state is NOT persisted in the dashboard config. The dashboard config
defines which filters are available and their defaults. The user's current
filter selections are transient and managed through:

1. **URL params**: Primary persistence mechanism. When a filter changes,
   update the URL. When the page loads, restore from URL. This means
   copying the URL shares the filtered view.

2. **Presets**: Named filter combinations saved as artifacts. Users can
   save "My View" as a preset and load it later.

3. **Session storage**: Browser sessionStorage as fallback for filter
   state that shouldn't appear in the URL (e.g. cross-filters). Lost
   on browser close, which is correct behavior.

The consumer is responsible for URL integration. phz-grid provides
`serializeFilterState()` and `deserializeFilterState()` functions. The
consumer calls them in their routing layer.

### 4.5 Filter performance

Filter operations must feel instantaneous. The conventions:

- **Dropdown population**: `getDistinctValues()` should return in < 200ms.
  If the DataAdapter is slow, cache the distinct values for the duration
  of the session. The filter bar component manages this cache internally.

- **Filter application**: When a filter changes, debounce 150ms before
  re-querying. Show a subtle loading indicator on affected widgets only
  (not the entire dashboard).

- **Targeted refresh**: The FilterContextManager tracks which filters
  affect which widgets (from `DashboardFilterDef.appliesTo`). When a
  filter changes, only re-query widgets that are affected. Widgets not
  referencing the filtered field keep their current data.

- **Cascading resolution**: When a parent filter changes, immediately
  disable the child filter UI, call `getDistinctValues()` for the child
  with the parent's new value as a filter, then re-enable. Show a
  "Updating..." message on the child while loading.

- **Cancel in-flight queries**: If a user changes a filter while a
  previous query is still running, cancel the previous query (via
  AbortController on the DataAdapter's fetch calls) and start the new one.

---

## Part 5: Interaction Between Explorer and Dashboards

### 5.1 Explorer as entry point for dashboards

The workspace shell should present a flow where exploration leads to
artifact creation:

1. User opens Explore, selects a data source
2. Drags fields, sees pivot table preview
3. Switches to Chart mode, sees a suggested visualization
4. Clicks "Add to Dashboard"
5. Picks a dashboard (or creates new one)
6. The widget is added with the explore query as its data binding
7. User repeats steps 2-6 for additional widgets
8. The dashboard accumulates widgets from multiple explore sessions

This means the explorer is not just a standalone tool — it's a widget
factory for dashboards.

### 5.2 Explorer filters become dashboard filters

When a user creates a dashboard from exploration:
- Filters used in the explore session are candidates for the dashboard
  filter bar
- The "Save as Dashboard" flow asks: "Which filters should appear in
  the dashboard filter bar?" with checkboxes for each explore filter
- Selected filters become `DashboardFilterDef` entries
- The filter types auto-select based on the same heuristics as the
  explore filter configurator

### 5.3 Drill-through to explorer

From a rendered dashboard, the user should be able to:
- Right-click a data point → "Explore this data"
- This opens the explorer pre-populated with:
  - The widget's data source
  - The widget's dimension/measure configuration in the drop zones
  - The dashboard filter context as explore filters
  - The clicked data point as an additional filter
- The user can then modify the exploration, add fields, change aggregations,
  and optionally save back as a new widget or report

This connects the consumer rendering experience to the authoring experience.
The consumer app needs to support navigation to the workspace for this to
work. If the consumer doesn't embed the workspace, this option is hidden.

---

## Part 6: Additional Phase 1 Research

### 6.1 Criteria package deep audit

During Phase 1.8 (filter and criteria system audit), additionally:

- List every filter UI component in `criteria` with its props
- Document how `CriteriaEngine` resolves filter values to query constraints
- Check whether `getDistinctValues()` equivalent exists anywhere in the
  codebase (it may be called differently)
- Check whether cascading filter dependency resolution exists
- Check whether filter state serialization to URL exists
- Check whether the existing `phz-selection-criteria` component can be
  repurposed as the dashboard filter bar or needs a separate component

### 6.2 Pivot engine audit

The `engine` package has a pivot engine (`packages/engine/src/pivot.ts`).
Document:
- What pivot operations it supports
- Whether it works with the DataAdapter or only with in-memory data
- Whether it can be used as the backend for the visual query explorer
- Whether it generates SQL or operates in JavaScript
- How it handles large datasets (does it push down to DuckDB?)

The pivot engine may already provide much of what the explorer needs.
If so, the explorer UI wraps the existing pivot engine. If not, the
explorer constructs DataQuery objects directly and the DataAdapter handles
pivot via SQL.

### 6.3 Cross-filter audit

Document the current cross-filter implementation in `packages/widgets/src/cross-filter.ts`:
- How does a widget emit a cross-filter event?
- How do other widgets receive and apply it?
- Does the cross-filter go through a central coordinator or direct widget-to-widget?
- Does the cross-filter integrate with the criteria/filter system or bypass it?

The answer determines whether cross-filter can be unified with the FilterContext
or needs a separate path.
