# phz-workspace Architecture Gaps — Companion Instructions

## Purpose

This document covers cross-cutting architectural concerns that the other
three documents don't address. These are not features visible to end users.
They are plumbing that makes the visible features work correctly across
real-world deployment scenarios.

Read this last. Apply these patterns throughout all phases rather than as
a separate phase.

---

## Part 1: Multi-Data-Source Dashboards

### 1.1 The problem

A sales dashboard might combine CRM data, financial actuals from ERP,
and web traffic from analytics. Three data sources, one dashboard. The
current type system assumes a single `dataSourceId` per widget, which
works. But when a user applies a date filter, they expect it to affect
all widgets. The date column is called `created_at` in CRM, `fiscal_date`
in ERP, and `event_timestamp` in analytics.

### 1.2 Field mapping at the dashboard level

Add a `fieldMappings` section to the dashboard config:

```typescript
interface DashboardConfig {
  // ... existing fields ...

  // Cross-source field mappings
  fieldMappings?: FieldMapping[]
}

interface FieldMapping {
  // A canonical name used by dashboard-level filters
  canonicalField: string          // e.g. 'date', 'region', 'product'

  // How this field maps to each data source
  sources: {
    dataSourceId: string
    field: string                 // actual field name in this data source
  }[]
}
```

When a dashboard-level filter is applied on `canonicalField: 'date'`,
the `FilterContextManager.resolveFilters(widgetId)` looks up which data
source the widget uses, finds the corresponding actual field name from
`fieldMappings`, and substitutes it in the filter expression before
passing to the DataAdapter.

This is transparent to widgets. They receive a `DataQuery` with field
names already resolved to their data source's column names.

### 1.3 Admin authoring of field mappings

In the dashboard builder, when the admin adds widgets from multiple
data sources, the workspace detects unmapped fields:

- "This dashboard uses 3 data sources. Would you like to link common
  fields so filters work across all widgets?"
- Shows a mapping UI: a table with canonical field name, and a dropdown
  per data source to select the matching column
- Auto-suggests mappings by name similarity and type match
- Unmapped fields are fine — filters on them only affect widgets from
  the matching data source

### 1.4 Cross-source explorer limitations

The visual query explorer (WORKSPACE-DATA-INTERACTION.md Part 2) operates
on a single data source at a time. Cross-source joins are not supported
in the explorer. This is intentional: cross-source joins belong in the
consumer's ETL layer or semantic model, not in the BI rendering toolkit.

If a user needs to combine data from multiple sources in a single table
or chart, they should either:
- Create a unified data source in their backend (the recommended path)
- Upload a pre-joined CSV to the local playground
- Use separate widgets with field mappings for filtering

---

## Part 2: Time Intelligence

### 2.1 The problem

"Show me this quarter vs. same quarter last year" is the single most
common BI operation. The current system has date range filters and a
`periodOverPeriod` window function, but no specification for how comparison
periods are calculated, how fiscal calendars work, or how relative dates
resolve.

### 2.2 TimeIntelligence configuration

Add a `timeIntelligence` section to data source registration:

```typescript
interface DataSourceSchema {
  // ... existing fields ...

  timeIntelligence?: TimeIntelligenceConfig
}

interface TimeIntelligenceConfig {
  // Primary date/time field for this data source
  primaryDateField: string

  // Calendar configuration
  fiscalYearStartMonth: number    // 1-12, default 1 (January)
  weekStartDay: 'sunday' | 'monday'  // default monday

  // Available granularities
  granularities: TimeGranularity[]

  // Named relative periods
  relativePeriods: RelativePeriod[]
}

type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface RelativePeriod {
  id: string                      // 'ytd', 'qtd', 'trailing-12m', etc.
  label: string                   // 'Year to Date'
  calculate: (referenceDate: Date, config: TimeIntelligenceConfig) => {
    from: Date
    to: Date
  }
}
```

Ship a default set of relative periods:

| ID | Label | Definition |
|----|-------|------------|
| `today` | Today | Current day |
| `yesterday` | Yesterday | Previous day |
| `last-7d` | Last 7 Days | 7 days ending yesterday |
| `last-30d` | Last 30 Days | 30 days ending yesterday |
| `this-week` | This Week | Monday (or Sunday) to today |
| `last-week` | Last Week | Previous complete week |
| `this-month` | This Month | 1st of month to today |
| `last-month` | Last Month | Previous complete month |
| `this-quarter` | This Quarter | Quarter start to today (fiscal-aware) |
| `last-quarter` | Last Quarter | Previous complete quarter (fiscal-aware) |
| `this-year` | This Year | Jan 1 (or fiscal start) to today |
| `last-year` | Last Year | Previous complete year (fiscal-aware) |
| `ytd` | Year to Date | Same as this-year |
| `qtd` | Quarter to Date | Same as this-quarter |
| `trailing-12m` | Trailing 12 Months | 12 months ending today |

### 2.3 Comparison periods

When a date filter includes a comparison, the system automatically
calculates the comparison period:

```typescript
interface DateFilterValue extends FilterValue {
  comparison?: {
    type: 'previous-period' | 'same-period-last-year' | 'custom'
    // For 'custom':
    from?: Date
    to?: Date
  }
}
```

When comparison is active:
- The DataAdapter receives two queries: one for the primary period,
  one for the comparison period
- Widgets that support comparison render both datasets (e.g. a trend
  line shows current period in solid, comparison in dashed)
- KPI cards show the delta between current and comparison values
- Widgets that don't support comparison ignore the comparison data

### 2.4 Date filter UI enhancements

The date-range filter type (from WORKSPACE-DATA-INTERACTION.md Part 4.2)
should integrate time intelligence:

- Relative period presets are generated from `TimeIntelligenceConfig.relativePeriods`
- Fiscal-aware labels: if fiscal year starts in April, "This Year" shows
  "Apr 2025 - Mar 2026" not "Jan 2025 - Dec 2025"
- "Compare to" toggle adds comparison period selector:
  - Previous period (same duration, immediately prior)
  - Same period last year
  - Custom range
- A mini calendar highlights the selected range and comparison range
  in different colors

---

## Part 3: Number Formatting and Semantic Units

### 3.1 The problem

Revenue is currency. Headcount is count. Percentage is ratio. The format
string approach (`'#,##0.00'`) doesn't carry semantic meaning. You can't
automatically format "$1.2M" vs. "1,234,567 kg" without knowing the unit.
And you can't validate aggregations without units: summing percentages is
usually wrong, averaging them may require weighting.

### 3.2 Unit system

Add `unit` to `FieldMetadata`:

```typescript
interface FieldMetadata {
  // ... existing fields ...

  unit?: UnitSpec
}

interface UnitSpec {
  type: 'currency' | 'percent' | 'number' | 'duration' | 'custom'

  // For currency
  currencyCode?: string           // ISO 4217: 'USD', 'EUR', 'GBP'

  // For duration
  durationUnit?: 'seconds' | 'minutes' | 'hours' | 'days'

  // For custom
  suffix?: string                 // e.g. 'kg', 'km', 'items'

  // Formatting
  decimalPlaces?: number          // default: 2 for currency, 1 for percent, 0 for number
  abbreviate?: boolean            // true: 1.2M instead of 1,200,000 (default: auto based on magnitude)
  showSign?: boolean              // +5% instead of 5%
}
```

### 3.3 formatValue utility

All widgets must use a shared `formatValue()` function instead of
implementing their own formatting:

```typescript
function formatValue(
  value: number | null,
  unit: UnitSpec | undefined,
  locale: string,
  options?: { compact?: boolean }
): string
```

The function uses `Intl.NumberFormat` internally:
- Currency: `new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })`
- Percent: `new Intl.NumberFormat(locale, { style: 'percent' })`
- Number with abbreviation: `new Intl.NumberFormat(locale, { notation: 'compact' })`
- Custom suffix: format the number, append the suffix

Provide `formatValue` as a public export from `phz-types` so consumers
can use the same formatting in their own code.

### 3.4 Aggregation validation

When the explorer or a widget config specifies an aggregation, validate
it against the field's unit:

- `percent` type + `sum` aggregation → warning: "Summing percentages
  is usually incorrect. Did you mean average?"
- `currency` type with mixed `currencyCode` → error: "Cannot aggregate
  values in different currencies"
- Any type + `avg` on an identifier field → warning: "Averaging an
  identifier field is unlikely to be meaningful"

These are warnings, not hard blocks. The user can override.

---

## Part 4: Query Coordination

### 4.1 The problem

A dashboard with 12 widgets hitting the same data source with the same
filter context generates 12 separate `dataAdapter.execute()` calls. Many
queries share the same GROUP BY and filters, requesting different measures.

### 4.2 QueryCoordinator

Add a `QueryCoordinator` to the rendering pipeline that sits between
widgets and the DataAdapter:

```typescript
interface QueryCoordinator {
  // Submit a query request (does not execute immediately)
  submit(widgetId: string, query: DataQuery): Promise<DataResult>

  // Flush: execute all pending queries (called by the rendering pipeline
  // after all widgets have submitted their queries in this render cycle)
  flush(): Promise<void>

  // Cancel pending queries for a widget (on filter change, unmount)
  cancel(widgetId: string): void
}
```

The coordinator operates in batched cycles:
1. The rendering pipeline begins a render cycle
2. Each widget calls `coordinator.submit(widgetId, query)` which returns
   a Promise but does not execute yet
3. After all widgets have submitted (end of microtask), the coordinator
   calls `flush()`
4. Flush merges compatible queries:
   - Same `dataSourceId` + same `groupBy` + same `filters` → merge
     `aggregations` into one query
   - Identical queries → deduplicate, share the result
5. Merged queries are executed via `dataAdapter.execute()`
6. Results are split back to the requesting widgets and their Promises resolve

The coordinator is transparent to widgets and the DataAdapter. Neither
knows it exists. It only exists in the rendering pipeline.

### 4.3 Concurrency control

The coordinator limits concurrent DataAdapter calls:
- Default: 4 concurrent queries
- Configurable via `createWorkspaceClient({ maxConcurrency: 6 })`
- Queries beyond the limit are queued
- Priority: queries for visible widgets first, off-screen widgets last

### 4.4 Cancellation

When a filter changes mid-flight:
- The coordinator cancels all pending queries via `AbortController`
- The DataAdapter's `execute()` should accept an `AbortSignal`
- New queries are submitted for the updated filter state
- Widgets show their loading state during the transition

Add `signal` to the DataAdapter interface:

```typescript
interface DataAdapter {
  execute(query: DataQuery, signal?: AbortSignal): Promise<DataResult>
  // ... rest unchanged
}
```

---

## Part 5: Data Quality Signaling

### 5.1 Quality metadata on DataResult

```typescript
interface DataResult {
  columns: ColumnDescriptor[]
  rows: unknown[][]
  metadata: {
    totalRows: number
    truncated: boolean
    queryTimeMs: number
    // Quality signals (optional, DataAdapter provides if available)
    quality?: DataQualityInfo
  }
}

interface DataQualityInfo {
  lastRefreshed?: string          // ISO timestamp of last data refresh
  freshnessStatus?: 'fresh' | 'stale' | 'unknown'
  freshnessThresholdMinutes?: number  // what counts as stale
  completeness?: number           // 0.0 to 1.0, fraction of non-null values
  issues?: DataQualityIssue[]
}

interface DataQualityIssue {
  severity: 'info' | 'warning' | 'error'
  message: string                 // "ETL pipeline failed at 03:00 UTC"
  field?: string                  // which field is affected (if specific)
}
```

### 5.2 Quality indicators in rendering

The rendering pipeline uses quality metadata to show indicators:

- **Freshness badge**: Small timestamp below the dashboard title or in
  the filter bar: "Data updated 15 minutes ago" (green), "Data updated
  3 days ago" (orange), "Data update failed" (red).

- **Per-widget quality**: If a specific field has quality issues, the
  widget referencing that field shows a small warning icon with tooltip.

- **Staleness styling**: When data is stale, widgets can optionally dim
  slightly (reduce opacity to 0.85) to signal that the numbers may not
  reflect current reality. This is a theme-level convention, not a
  per-widget behavior.

Quality indicators are entirely opt-in. If the DataAdapter doesn't provide
`quality` on the result, no indicators render.

---

## Part 6: Artifact Version History

### 6.1 History extension on WorkspaceAdapter

```typescript
interface ArtifactHistoryExtension {
  getArtifactHistory(id: ArtifactId, options?: {
    limit?: number                // default 20
    before?: string               // pagination cursor (ISO timestamp)
  }): Promise<VersionSummary[]>

  getArtifactVersion(id: ArtifactId, version: number): Promise<VersionedConfig>

  restoreArtifactVersion(id: ArtifactId, version: number): Promise<void>
}

interface VersionSummary {
  version: number
  savedAt: string
  savedBy?: string                // opaque, consumer provides identity
  changeDescription?: string      // auto-generated: "Added 2 widgets, changed filters"
  sizeBytes: number
}
```

### 6.2 Auto-generated change descriptions

When saving an artifact, the workspace compares the new config to the
previous version and generates a human-readable diff summary:

- "Added widget 'Revenue Chart'"
- "Removed filter 'Region'"
- "Changed layout from 2 columns to 3 columns"
- "Modified KPI 'Total Revenue' threshold from 80 to 75"

The diff is computed on the JSON structure, not on string comparison.
Added/removed keys, changed values, and array modifications are detected
and described in domain language (not "changed property widgets[3].config.
thresholds.warning from 80 to 75").

### 6.3 Version history UI in the workspace

When editing an artifact, a "History" button in the designer header
opens a panel showing:
- List of versions with timestamps, authors, and change descriptions
- Click a version to see a side-by-side diff (current vs. selected)
- "Restore this version" button with confirmation
- Restore creates a new version (does not delete intermediate versions)

This is optional. If the consumer's WorkspaceAdapter does not implement
`ArtifactHistoryExtension`, the History button is hidden.

---

## Part 7: Internationalization

### 7.1 i18n architecture

All user-facing strings in workspace components must go through a
translation function:

```typescript
interface I18nProvider {
  t(key: string, params?: Record<string, string | number>): string
  locale: string
  direction: 'ltr' | 'rtl'
}
```

The workspace ships English strings as the default. Consumers override
by providing their own `I18nProvider`:

```typescript
const workspace = createWorkspace({
  adapter: myAdapter,
  dataAdapter: myDataAdapter,
  i18n: {
    locale: 'nl-BE',
    direction: 'ltr',
    t: (key, params) => myTranslations[key] ?? defaultEnglish[key]
  }
})
```

### 7.2 What gets translated

- All workspace shell UI: nav labels, buttons, menu items, empty states
- All filter UI: labels, presets, operators ("is equal to", "contains")
- All explorer UI: zone labels, aggregation names, chart type names
- All admin UI: wizard step titles, validation messages, tooltips
- Widget system strings: "No data available", "Loading...", "Error"
- Alert system: severity labels, status labels, notification templates

What does NOT get translated by phz-grid:
- Dashboard titles, widget titles, field names (these are content, not UI)
- Data values
- Consumer-provided labels

### 7.3 Number and date formatting

All number and date formatting must use the `Intl` APIs with the
provided `locale`:

```typescript
// Numbers
new Intl.NumberFormat(locale, options).format(value)

// Dates
new Intl.DateTimeFormat(locale, options).format(date)

// Relative time ("3 days ago")
new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-3, 'day')
```

Never hardcode format patterns. Never assume MM/DD vs DD/MM ordering.
Never assume `.` vs `,` as decimal separator. The `Intl` APIs handle
all of this correctly for all locales.

### 7.4 RTL support

When `direction: 'rtl'`:
- The workspace shell layout mirrors (sidebar on the right)
- The filter bar flows right-to-left
- The explorer field palette is on the right
- Chart axes flip (y-axis on right for RTL languages)
- Use CSS `logical properties`: `margin-inline-start` instead of
  `margin-left`, `padding-inline-end` instead of `padding-right`

RTL support applies to the workspace UI and rendering chrome, not to
chart data visualization (a bar chart's bars don't reverse direction).

---

## Part 8: Viewer Context

### 8.1 The problem

The `PlacementRecord` controls which roles can access which artifacts.
But within an artifact, all viewers see the same data. A regional
manager should only see their region's data on the "Sales Dashboard."

This is not RBAC (which phz-grid correctly does not build). It's implicit
filtering based on the viewer's identity.

### 8.2 ViewerContext type

```typescript
interface ViewerContext {
  userId?: string                 // opaque, consumer defines identity
  roles?: string[]                // for PlacementRecord matching
  attributes?: Record<string, unknown>  // arbitrary viewer attributes
  // e.g. { region: 'Europe', department: 'Sales', accessLevel: 3 }
}
```

The consumer provides this when creating the workspace client:

```typescript
const client = createWorkspaceClient({
  adapter: myAdapter,
  dataAdapter: myDataAdapter,
  viewerContext: {
    userId: 'user-123',
    roles: ['regional-manager'],
    attributes: { region: 'Europe' }
  }
})
```

### 8.3 How ViewerContext flows through the system

phz-grid passes `ViewerContext` to the DataAdapter on every query:

```typescript
interface DataAdapter {
  execute(query: DataQuery, signal?: AbortSignal, viewer?: ViewerContext): Promise<DataResult>
  // ... other methods also receive viewer context
}
```

The DataAdapter implementation decides what to do with it. Typical pattern:
the adapter adds implicit WHERE clauses based on viewer attributes.
phz-grid does not enforce this. It passes the context through.

This means:
- Two users viewing the same dashboard see different data
- The dashboard config is identical (no per-user copies)
- The data filtering happens at the adapter layer
- Widgets, filters, and the explorer all work normally — they don't know
  about viewer context

### 8.4 ViewerContext in the workspace

When an admin is authoring in the workspace, they should be able to
preview as a specific viewer:

- "Preview as..." dropdown in the preview mode header
- Admin enters viewer attributes to simulate
- The preview renders with those attributes passed to the DataAdapter
- This lets admins verify that row-level filtering works correctly
  without logging in as a different user

This is the "View as" / "impersonate" feature common in BI tools.
It only works in preview mode within the workspace, not in the
consumer rendering pipeline.

### 8.5 ViewerContext enables personal server-side storage

ViewerContext.userId is also what connects a user to their personal
artifacts. When VersionedConfig.visibility is 'personal' and
VersionedConfig.ownerId matches ViewerContext.userId, only that user
sees the artifact. This means:

- End users can save personal dashboards, reports, filter presets,
  and explore sessions on the server — not in their browser, not on
  their machine, but on the organization's infrastructure
- They can access their personal work from any browser, any device,
  within the org's network
- Their personal data configurations (remote URL connections, API
  endpoints) stay private — other users cannot see them
- An end user's personal workspace is a safe experimentation space:
  they can duplicate a published dashboard, modify it, break it, fix
  it, and only share it when they're satisfied
- If a user leaves the org, their personal artifacts are still in the
  system for the consumer's admin to reassign or archive

phz-grid stores the visibility and ownerId fields on the artifact.
The consumer's WorkspaceAdapter implementation filters list/get results
based on the ViewerContext passed in. phz-grid does not enforce this
filtering — the consumer's backend is the authority.

---

## Part 9: Constraints for These Gaps

- Multi-source field mappings are dashboard-level config, not a global
  concept. Each dashboard defines its own mappings.
- Time intelligence config is optional. If not provided, date filters
  work as plain date ranges without fiscal awareness or presets.
- The `formatValue()` function is the single source of truth for number
  display. Widgets that implement their own formatting are non-compliant.
- The QueryCoordinator is an internal optimization, not a public API.
  Widgets and DataAdapters should not depend on its existence.
- Data quality signals are opt-in from the DataAdapter. If not provided,
  no quality indicators render. Never show "unknown quality" warnings —
  absence of data is not a quality issue.
- Artifact version history is an optional adapter extension. The workspace
  must work fully without it.
- The i18n system must not affect the consumer's ability to use phz-grid
  in English-only deployments. Default English requires zero configuration.
- ViewerContext is passed through, never enforced by phz-grid. The consumer's
  DataAdapter is solely responsible for data-level access control.
- Artifact visibility (personal/shared/published) is a scoping field, not
  security enforcement. phz-grid trusts the consumer's WorkspaceAdapter to
  filter results correctly. A malicious adapter that ignores visibility will
  expose personal artifacts — that is the consumer's bug, not phz-grid's.
- Do not build import/export for other BI tool formats (Grafana JSON,
  Metabase MBQL). This is better as a community-contributed converter.
- Do not build offline/disconnected mode. OPFS local persistence handles
  the "come back to my work" case. True offline with sync is a product.
- Do not build audit trail. This is a governance concern for the consumer.
- Do not build real-time collaboration beyond what exists in the `collab`
  package. Wiring Yjs into every widget is a separate initiative.
