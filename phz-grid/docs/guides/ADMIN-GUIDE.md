# phz-grid Workspace — Administrator & Author Guide

This guide is for **administrators and authors** who configure the phz-grid
workspace: building dashboards, defining filters, setting up navigation links,
managing artifact visibility, configuring security bindings, and establishing
the data architecture.

**Audience:** Technical configurators who know their data model and user base.
Not end-user instructions. Not developer API reference (see DEVELOPER-GUIDE.md).

---

## Contents

1. [Roles Overview](#1-roles-overview)
2. [Data Architecture Configuration](#2-data-architecture-configuration)
3. [Filter Administration](#3-filter-administration)
4. [Navigation and Drill-Through](#4-navigation-and-drill-through)
5. [Artifact Management](#5-artifact-management)
6. [Grid Definitions](#6-grid-definitions)
7. [Local Mode Administration](#7-local-mode-administration)
8. [Theming and Customization](#8-theming-and-customization)
9. [Common Configuration Patterns](#9-common-configuration-patterns)
10. [Authoring Workflows](#10-authoring-workflows)
11. [Alert Administration](#11-alert-administration)
12. [v15 Admin Features](#12-v15-admin-features)

---

## 1. Roles Overview

The workspace has three roles, each with a distinct experience.

### 1.1 Admin

The admin role has full access to all three sidebar sections:

| Section     | Nav Items                               |
|-------------|-----------------------------------------|
| **CONTENT** | Catalog, Explore, Dashboards, Reports   |
| **DATA**    | Data Sources, Connectors                |
| **GOVERN**  | Alerts, Permissions                     |

Admins can:
- Create, edit, delete, and **publish** any artifact
- Create and manage `FilterDefinition` catalog entries
- Create filter rules and bind them to dashboards
- Configure security bindings that restrict filter values per user
- Set alert rules and manage subscriptions

### 1.2 Author

Authors have access to **CONTENT** and **DATA** sections only — no GOVERN.
Authors can create and edit their own artifacts but **cannot publish** them and
cannot set alert rules. Filter administration is read-only for authors.

> **Note:** An author's artifacts remain in draft state until an admin publishes
> them. Authors cannot grant or revoke access to their work beyond their own
> personal copies.

### 1.3 Viewer

Viewers have no sidebar and see a card-based catalog showing only **published**
artifacts. Viewers can:
- Apply filters within admin-defined constraints
- Save personal filter presets
- Use "Explore data" for ad-hoc analysis

Viewers cannot create dashboards, reports, or modify filter definitions.

### Role-Shell Summary

```
Role      Shell       Sidebar    Publish    Set Alerts   Filter Mode   Catalog Mode
admin     workspace   full       yes        yes          full          full
author    editor      partial    no         no           limited       full
viewer    viewer      none       no         no           readonly      card
```

In v15, each role maps to a dedicated shell package:
- **Admin** uses `<phz-workspace>` (full admin with Content + Data + Govern)
- **Author** uses `<phz-editor-shell>` (authoring with catalog, dashboards, reports, sharing)
- **Viewer** uses `<phz-viewer-shell>` (read-only consumption with catalog, dashboards, reports, explore)

---

## 2. Data Architecture Configuration

### 2.1 DashboardDataConfig

Every dashboard has a `DashboardDataConfig` that controls how data loads. This
is the most performance-critical configuration an admin makes.

```
DashboardDataConfig
├── preload       — Fast initial query (limited rows)
├── fullLoad      — Complete dataset query
├── detailSources — On-demand drill-in sources (optional)
└── transition    — How the UI switches from preload to full data
```

#### PreloadConfig

| Field             | Type      | Purpose                                           |
|-------------------|-----------|---------------------------------------------------|
| `query`           | DataQuery | The query for the initial fast render             |
| `usePersonalView` | boolean   | Whether to apply the viewer's personal view filters |

The preload query should return just enough rows for the dashboard's summary
widgets (KPIs, headline charts) to render immediately. Target 50–500 rows
maximum. The full dataset loads in parallel while the user sees the preload.

**Example — Sales Dashboard Preload:**
Preload the current month's totals by region (6 rows). This lets all four KPI
cards render within the first server round-trip, while the full year's
transaction-level data loads in parallel for the detail table.

#### FullLoadConfig

| Field                 | Type      | Purpose                                          |
|-----------------------|-----------|--------------------------------------------------|
| `query`               | DataQuery | The complete dataset query                       |
| `applyCurrentFilters` | boolean   | Apply the dashboard's active filter state        |
| `maxRows`             | number    | Row cap to prevent unbounded loads (e.g. 50000)  |

Set `maxRows` on every production dashboard. Without it, removing a date filter
could attempt to load millions of rows.

#### Transition Modes

| Mode       | Behavior                                                |
|------------|---------------------------------------------------------|
| `seamless` | Full data silently replaces preload, no visual change   |
| `fade`     | Brief opacity fade during the swap                      |
| `replace`  | Instant replacement, may cause content shift            |

Default is `seamless`. Use `fade` if widgets change significantly between
preload and full data.

**Best Practices:**
- Preload row limit: 100–500 rows
- Full load `maxRows`: 10,000–100,000 depending on widget types
- Always set `applyCurrentFilters: true` on full load so server filters work
- Match the preload query's shape to the full load query so widgets do not re-layout

### 2.2 Detail Sources

Detail sources are **on-demand datasets** that load when a user drills into
data — clicking a chart segment, triggering a KPI breach notification, or
taking a specific action.

Each `DetailSourceConfig` has:

| Field           | Type                | Purpose                                              |
|-----------------|---------------------|------------------------------------------------------|
| `id`            | string              | Unique identifier for this detail source             |
| `name`          | string              | Display name shown to users                          |
| `dataSourceId`  | string              | Which data source to query                           |
| `filterMapping` | FieldMappingEntry[] | Maps dashboard filter/row fields to detail source fields |
| `baseQuery`     | DataQuery           | The primary detail query                             |
| `preloadQuery`  | DataQuery           | Optional fast summary for the detail panel header    |
| `maxRows`       | number              | Row cap for detail data                              |
| `trigger`       | DetailTrigger       | What user action loads this source                   |
| `renderMode`    | string              | How the detail displays: `panel`, `modal`, or `navigate` |

#### Trigger Types

| Trigger                                                        | When It Fires                                  |
|----------------------------------------------------------------|------------------------------------------------|
| `'user-action'`                                                | Any explicit user click on a drillable element |
| `{ type: 'drill-through', fromWidgetTypes?: string[] }`       | Drill from specific widget types               |
| `{ type: 'breach' }`                                           | When an alert rule breach is detected          |

Use `fromWidgetTypes` to restrict which widgets can open a given detail source.
For example, only allow the bar-chart to trigger the order detail panel, not
the KPI card.

#### Filter Mapping

`filterMapping` is an array of `{ sourceField, targetField }` entries. When
the detail source loads, it checks the dashboard's active filter values and the
clicked row's field values, then maps them to the detail query's filter fields.

**Example — Sales Dashboard to Order Detail:**

```
Dashboard filter: region = "West"
Clicked chart segment: product = "Widgets"

filterMapping:
  { sourceField: "region",  targetField: "order_region" }
  { sourceField: "product", targetField: "product_name" }

Detail query runs with: order_region = "West" AND product_name = "Widgets"
```

The mapping tries `currentFilters` first, then `clickedRow`. If neither has
the source field, that mapping is skipped.

#### Tiered Detail Pattern

For a dashboard with a summary chart and an order-level table:

1. Configure summary chart widget with `dataTier: 'preload'`
2. Configure order table widget with `dataTier: 'full'`
3. Add a detail source triggered by `{ type: 'drill-through', fromWidgetTypes: ['bar-chart'] }`
4. Set `renderMode: 'panel'` so the detail slides in without navigation

### 2.3 Query Strategy

Each `DataQuery` can carry a `QueryStrategy` that tells the data layer how to
execute it.

| Field           | Values                    | Purpose                                          |
|-----------------|---------------------------|--------------------------------------------------|
| `execution`     | `server`, `cache`, `auto` | Where to run the query                           |
| `cacheKey`      | string                    | Cache identifier for deduplication               |
| `cacheTTL`      | number (ms)               | How long cached results are valid                |
| `estimatedRows` | number                    | Hint for query layer resolution                  |

**When to use `server`:** Any query touching security-sensitive data, data with
row-level security, or datasets too large for client-side processing.

**When to use `cache`:** Reference data that changes rarely — product catalogs,
region lists, user lookup tables. Set `cacheTTL` to match your data refresh
cadence.

**When to use `auto`:** Let the system decide. The workspace uses a threshold
of **10,000 estimated rows** — below this it prefers client-side execution for
instant UX; above it routes to the server.

#### Arrow IPC

When the `DataAdapter` returns an `arrowBuffer` in its result, widgets can
ingest it via DuckDB-WASM for local queries without additional server
round-trips. This enables instant cross-filter and sorting after the initial
full load.

Configure your `DataAdapter` implementation to return an `arrowBuffer` for
full-load results. Avoid returning it for preload results since they are only
used for initial render.

### 2.4 Widget Data Tiers

Every widget on a dashboard declares its `dataTier`:

| Tier      | Receives                                       | Use For                              |
|-----------|------------------------------------------------|--------------------------------------|
| `preload` | Preload result only                            | KPI cards, headline numbers          |
| `full`    | Full load result only                          | Detail tables, complete charts       |
| `both`    | Full result if available, preload as fallback  | Summary charts that improve with more data |

> **Warning:** Do not assign all widgets to `full` tier. If the full load is
> slow, the user sees a blank dashboard for several seconds. Always give summary
> widgets the `preload` tier so they appear immediately.

---

## 3. Filter Administration

### 3.1 Creating Filter Definitions

A `FilterDefinition` is a reusable, catalog-level filter that can be bound to
multiple dashboards and reports. Create it once, bind it everywhere.

```
FilterDefinition
├── id              — Unique stable identifier (auto-generated or custom)
├── label           — Display name in the filter bar
├── description     — Admin notes (not shown to viewers)
├── filterType      — What kind of control to show
├── valueSource     — Where the list of valid values comes from
├── bindings        — Which data source fields this filter applies to
├── securityBinding — Optional user-attribute-based value restriction
├── dependsOn       — IDs of other filters this one depends on
├── defaultValue    — How to set the initial value
└── required        — Whether the user must choose a value
```

#### Filter Types

| `filterType`   | UI Control                              |
|----------------|-----------------------------------------|
| `select`       | Single-value dropdown                   |
| `multi-select` | Multi-value dropdown with chips         |
| `range`        | Numeric range with min/max inputs       |
| `date-range`   | Calendar date range picker              |
| `text`         | Free-text search input                  |
| `boolean`      | Toggle switch                           |

#### Value Sources

| `type`        | How Values Are Populated                              |
|---------------|-------------------------------------------------------|
| `data-source` | Live query against a data source field                |
| `lookup-table`| Static list of `{ value, label }` pairs you define    |
| `static`      | Plain string array (fastest, no runtime query)        |

For `data-source`, specify `dataSourceId` (the source to query) and `field`
(the field whose distinct values populate the dropdown). You can also set
`sort: 'asc' | 'desc'` and `limit` to cap the number of values returned.

For `lookup-table`, provide an `entries` array. This is ideal for small, stable
reference lists like status codes or region names that you do not want to query
from the database on every page view.

#### Binding to Multiple Data Sources

The `bindings` array lets one filter control multiple data sources. Each
`FilterBinding` entry has:

| Field          | Purpose                                                   |
|----------------|-----------------------------------------------------------|
| `dataSourceId` | The target data source                                    |
| `targetField`  | The field in that source the filter applies to            |
| `transform`    | Optional value transform before the filter is applied     |

**Example — Region Filter Spanning Two Sources:**

A "Region" filter definition with two bindings:
- Binding 1: `dataSourceId: "sales_db"`, `targetField: "region_code"`
- Binding 2: `dataSourceId: "hr_db"`, `targetField: "employee_region"`

A single "Region" dropdown now controls both the sales chart and the headcount
chart on the same dashboard.

#### Value Transforms

Bindings can carry a `FilterValueTransform` when the filter value needs
conversion before reaching the data source:

| Transform type      | Purpose                                                |
|---------------------|--------------------------------------------------------|
| `lookup`            | Translate a display value to a different internal key  |
| `expression`        | Apply a SQL/expression to the value                    |
| `granularity-shift` | Shift a date granularity (e.g., month to quarter)      |

**Example:** A "Month" filter stores values like `"2026-03"`. A data source
uses a quarterly field. Use `granularity-shift` with `from: 'month'` and
`to: 'quarter'` to automatically derive the correct quarter value.

#### Default Values

The `defaultValue` field sets the filter's initial state when a user first
opens a dashboard (before any interaction):

| `type`             | Resolves To                                              |
|--------------------|----------------------------------------------------------|
| `static`           | The literal `value` you provide                          |
| `relative-date`    | A computed date: `offset` days/weeks/months/years from now |
| `viewer-attribute` | The value of a user context attribute (e.g., their `region`) |
| `expression`       | A SQL expression evaluated by the data layer             |

For `relative-date`, negative offsets look backward in time. For example,
`{ offset: -30, unit: 'days' }` defaults to 30 days ago.

For `viewer-attribute`, the attribute must be present in the `ViewerContext`
your application passes to the workspace. This is how you automatically scope
a dashboard to the user's own region, team, or account when they first land.

### 3.2 Security Bindings

A `SecurityBinding` restricts which filter values a user can see and select,
based on an attribute from their `ViewerContext`.

```
securityBinding:
  viewerAttribute: "allowed_regions"
  restrictionType: "include-only"
```

| `restrictionType` | Effect                                                    |
|-------------------|-----------------------------------------------------------|
| `include-only`    | User sees only values that match their attribute          |
| `exclude`         | User sees all values except those in their attribute      |
| `max-value`       | For numeric filters: user cannot select values above their attribute |

**How ViewerContext attributes flow in:**
Your application passes a `ViewerContext` object to the workspace when
initializing a session:

```
ViewerContext
├── userId
├── roles        (array of role names)
└── attributes   (arbitrary key-value map)
```

The `attributes` map is where you put security-relevant values: `region`,
`department`, `account_id`, `max_spend_limit`, etc. The workspace never
modifies these — it only reads them.

**Example — Regional Manager Access Control:**

A "Sales Region" filter definition with:
```
securityBinding:
  viewerAttribute: "managed_regions"
  restrictionType: "include-only"
```

When a regional manager logs in with `attributes: { managed_regions: ["West", "Southwest"] }`,
their filter dropdown shows only West and Southwest, even though the data
source has eight regions.

> **Important:** The database must enforce its own row-level permissions. The
> security binding is a UI-level filter — it restricts what users can select,
> but it is not a substitute for database access controls.

### 3.3 Filter Rules (Conditional Business Logic)

Filter rules encode business logic that changes filter behavior dynamically
based on what the user has selected, or who they are.

Each `FilterRule` has:

| Field            | Purpose                                                  |
|------------------|----------------------------------------------------------|
| `id`             | Unique identifier                                        |
| `name`           | Descriptive name for admin reference                     |
| `priority`       | Lower number = higher priority; default 10               |
| `enabled`        | Toggle the rule on/off without deleting it               |
| `conditions`     | What must be true for this rule to fire                  |
| `conditionLogic` | `and` (all conditions must match) or `or` (any match)    |
| `actions`        | What happens when conditions are met                     |

#### Conditions

Three types of conditions:

**`field-value`** — Tests the current value of another filter:
```
type: "field-value"
filterDefinitionId: "fd_region"
operator: "eq"
value: "US"
```

Available operators: `eq`, `neq`, `in`, `not-in`, `gt`, `lt`

**`viewer-attribute`** — Tests the logged-in user's context:
```
type: "viewer-attribute"
attribute: "role"
operator: "eq"
value: "viewer"
```

**`compound`** — Nests conditions with AND or OR logic:
```
type: "compound"
logic: "or"
conditions: [ ...other conditions... ]
```

#### Actions

Four types of actions:

| `type`     | Effect                                                       | Example Use Case                          |
|------------|--------------------------------------------------------------|-------------------------------------------|
| `restrict` | Limits the filter to `allowedValues` only                    | US selected → State shows only US states  |
| `hide`     | Removes the filter from the filter bar entirely              | Hide "State" until "Country" is selected  |
| `disable`  | Greys out the filter with an optional explanatory message    | "Select a region first"                   |
| `force`    | Sets the filter to a specific value, overriding user choice  | Force date to current quarter for viewers |

#### Priority and Rule Intersection

Rules are evaluated in priority order (lowest number first). **All matching
rules fire simultaneously.** If two rules both restrict the same filter, the
system applies the intersection of their `allowedValues`.

Set explicit priorities when you have rules that could conflict. Using gaps in
priority numbers (10, 20, 30) makes it easier to insert new rules later.

> **Warning:** A rule with no conditions always matches. Use `enabled: false`
> to stage a rule without activating it, rather than leaving it conditionless.

### 3.4 ArtifactFilterContract — Binding Filters to Dashboards

Once you have `FilterDefinition` objects in the catalog, you bind them to a
specific dashboard via an `ArtifactFilterContract`. This is per-dashboard
configuration.

```
ArtifactFilterContract
├── acceptedFilters   — Array of DashboardFilterRef (which filters appear)
├── validation        — What to do with invalid filter values
└── transforms        — Per-filter value transforms for this dashboard
```

Each `DashboardFilterRef` in `acceptedFilters`:

| Field                    | Purpose                                                 |
|--------------------------|---------------------------------------------------------|
| `filterDefinitionId`     | References the catalog `FilterDefinition`               |
| `overrides.label`        | Override the filter's display name on this dashboard    |
| `overrides.required`     | Override whether this filter is required here           |
| `overrides.defaultValue` | Override the default for this dashboard                 |
| `queryLayer`             | Override: `server`, `client`, or `auto`                 |

**Example — Regional Sales Dashboard Contract:**

Three filters, each from the catalog:

1. `filterDefinitionId: "fd_date_range"` — no overrides, `queryLayer: 'server'`
2. `filterDefinitionId: "fd_region"` — override label to "Sales Region",
   override `required` to `true`, `queryLayer: 'server'`
3. `filterDefinitionId: "fd_product_category"` — `queryLayer: 'client'` (small
   lookup, instant UX without a server round-trip)

#### Validation Policies

The `validation.onInvalid` setting controls what happens when an incoming
filter value (e.g., from a URL bookmark or navigation event) is not allowed:

| Policy       | Effect                                                        |
|--------------|---------------------------------------------------------------|
| `prune`      | Remove the invalid value silently (default)                   |
| `clamp`      | Replace the invalid value with the first allowed value        |
| `invalidate` | Mark the load as invalid and surface an error                 |
| `ignore`     | Pass the value through without validation                     |

Use `prune` for most cases. Use `invalidate` on security-sensitive dashboards
where an unrecognized filter value should be treated as an error condition.

### 3.5 Filter Ownership Model

The ownership model determines who controls what:

```
Admin creates FilterDefinitions (catalog artifacts)
    ↓
Admin binds to dashboards via ArtifactFilterContract
    ↓
Users interact with admin-defined filters only
    ↓
Users may save personal presets (within admin constraints)
```

**What happens when you change a FilterDefinition after users have saved presets?**

The system runs preset pruning on load. A filter removed from `acceptedFilters`
has its saved value silently dropped from the user's preset. A `static` value
source with a value the preset contains that no longer exists is also pruned.

The `validation.onInvalid` policy governs how aggressively this pruning runs.
The default `prune` silently removes stale values. Users see their preset
applied but without the stale filters.

> **Best Practice:** When you remove a filter from a contract or change its
> allowed values, notify affected users that their presets may have changed.

> **Staleness**: There is no automatic staleness indicator for filter definitions.
> When underlying data source schemas change, filter definitions may reference
> fields or values that no longer exist. We recommend updating the `description`
> field when modifying filter definitions and reviewing catalog timestamps
> periodically to identify potentially stale definitions.

---

## 4. Navigation and Drill-Through

### 4.1 Configuring Navigation Links

A `NavigationLink` connects a source artifact to a target artifact with
optional filter passing.

```
NavigationLink
├── sourceArtifactId     — The dashboard/report the link starts from
├── targetArtifactId     — Where the user lands
├── targetArtifactType   — Type of the target artifact
├── label                — Text shown in context menus and drill UI
├── filterMappings       — How context values become target filters
└── openBehavior         — How the target opens
```

#### Open Behavior

| `openBehavior` | User Experience                                 |
|----------------|-------------------------------------------------|
| `same-panel`   | Target replaces current view (default)          |
| `slide-over`   | Target slides in from the right as a panel      |
| `modal`        | Target opens in an overlay dialog               |
| `new-tab`      | Target opens in a new browser tab               |

Use `slide-over` or `modal` for detail views the user expects to dismiss.
Use `same-panel` for full navigation. Use `new-tab` sparingly — it breaks the
user's back-button workflow.

#### Filter Mappings

Each `NavigationFilterMapping` maps a field from the source context to a
filter definition on the target:

| Field                        | Purpose                                              |
|------------------------------|------------------------------------------------------|
| `sourceField`                | Field name from the clicked row, widget, or filter   |
| `targetFilterDefinitionId`   | The `FilterDefinition` ID on the target artifact     |
| `transform`                  | `passthrough`, `lookup`, or `expression`             |
| `transformExpr`              | Expression string if transform is `expression`       |

**Example — Chart Segment to Filtered Report:**

A bar chart on a sales dashboard shows data by `product_category`. Clicking a
bar opens the "Product Detail Report" pre-filtered to that category.

```
sourceArtifactId: "dash_sales_overview"
targetArtifactId: "report_product_detail"
targetArtifactType: "report"
label: "View product details"
openBehavior: "slide-over"
filterMappings:
  - sourceField: "product_category"
    targetFilterDefinitionId: "fd_product_category"
    transform: "passthrough"
```

### 4.2 Auto-Mapping

When creating navigation links, the editor can auto-map filter connections by
comparing source field names against the `targetField` values in the target
artifact's filter bindings. The first matching filter definition wins.

Auto-mapping works well when your naming is consistent across data sources.
Always review auto-mapped connections before saving — the match is name-based,
not semantic.

### 4.3 Circular Navigation Detection

The workspace automatically detects circular navigation chains (A → B → A,
or A → B → C → A). When you save a navigation link that creates a cycle, the
workspace warns you and lists the artifact IDs in the cycle. Break the cycle
by removing one link or changing the open behavior to `modal` (modals do not
participate in navigation history the same way).

### 4.4 Best Practices

**Dashboard to Detail Report:**
Use `openBehavior: 'slide-over'` so the user can dismiss the detail without
losing their dashboard context. Map the key dimension fields from the chart
click to the report's required filters.

**KPI to Filtered Dashboard:**
When a KPI card's value exceeds a threshold, clicking it can navigate to a
breakdown dashboard. Use a detail source with `trigger: { type: 'breach' }`
for alert-driven navigation, or a navigation link with `openBehavior: 'same-panel'`
for voluntary drill-down.

**Multi-level drill chains:**
The navigation history tracks depth. Consider whether users realistically need
more than three drill levels. Beyond three levels, consolidate into a master
detail layout rather than sequential navigation.

---

## 5. Artifact Management

### 5.1 Visibility Lifecycle

Artifacts progress through three visibility states:

```
personal  →  shared  →  published
    ↑            ↓            ↓
    └────────────┴────────────┘
         (all transitions are valid)
```

| State       | Who Can See It                                       |
|-------------|------------------------------------------------------|
| `personal`  | Only the owner                                       |
| `shared`    | Owner plus users who have one of the `sharedWith` roles |
| `published` | Everyone, including viewers                          |

**Transitioning to Shared:**
When you transition an artifact to `shared`, specify one or more role names in
`sharedWith`. Only users whose `ViewerContext.roles` array includes one of
those roles will see the artifact.

**Transitioning to Published:**
Only admins can publish. Published artifacts appear in the viewer's card
catalog. Unpublishing immediately removes the artifact from viewer catalogs.

**Duplicating:**
Any user can duplicate a `shared` or `published` artifact they have access to.
The copy starts as `personal`, owned by the duplicating user. This is how
authors build on published templates without modifying the original.

### 5.2 Catalog Organization

The catalog organizes artifacts by type, each with a distinct color:

| Type            | Color  | Catalog Tab Appears In        |
|-----------------|--------|-------------------------------|
| Dashboard       | Blue   | My Work, Shared, Published    |
| Report          | Green  | My Work, Shared, Published    |
| Grid Definition | Violet | My Work, Shared, Published    |
| KPI             | Orange | My Work, Shared, Published    |
| Metric          | Indigo | My Work, Shared, Published    |
| Filter Preset   | Teal   | My Work                       |
| Alert Rule      | Red    | My Work (admin only)          |

Provide clear `name` and `description` on all published artifacts. The catalog
truncates descriptions at 120 characters in card view.

### 5.3 Default Presentation

Admins can set presentation defaults for artifacts with grid-like display:

| Field           | What It Controls                                   |
|-----------------|----------------------------------------------------|
| `density`       | Row height: `compact`, `dense`, or `comfortable`   |
| `theme`         | Color theme name                                   |
| `columnOrder`   | Ordered list of field names                        |
| `columnWidths`  | Per-column pixel widths                            |
| `hiddenColumns` | Fields hidden by default                           |
| `frozenColumns` | Number of columns frozen from the left             |
| `sortState`     | Default sort columns and directions                |

**Merge Precedence:**
```
Admin DefaultPresentation     (baseline)
    +
User PersonalView.presentation  (overrides admin per field)
    +
Session changes                 (overrides personal view, not saved automatically)
```

A user who changes column order during a session sees their session order.
When they return, they see their saved personal view order. An admin update to
`DefaultPresentation` propagates to all users who have not explicitly set a
personal view override for that field.

> **Warning:** Changing `columnOrder` or `hiddenColumns` in admin defaults does
> not override existing personal views — users who have already saved a personal
> view keep their saved settings for those fields.

#### How Personal Views Merge with Updates

The `mergePresentation()` function uses a spread-merge strategy where personal
overrides layer on top of admin defaults. Each field in the personal view's
`Partial<DefaultPresentation>` is checked independently:

- **New columns added by admin appear for ALL users**, including those with
  personal views. The personal view only overrides fields it explicitly sets
  (e.g., `columnOrder`, `hiddenColumns`). If a personal view does not set
  `columnOrder`, the admin's updated order (including new columns) takes effect.
- **Existing column order and visibility overrides in personal views persist.**
  A user who has saved a custom `columnOrder` continues to see their order.
  New columns added by the admin do not appear in that saved order — the user
  must reset to defaults or manually add the new column.
- **Personal views do NOT block new features.** Fields like `density`, `theme`,
  `frozenColumns`, and `sortState` follow the same rule: if the personal view
  sets it, the personal value wins; otherwise the admin default applies.
- **Column widths merge additively.** `mergePresentation()` spreads admin
  `columnWidths` first, then overlays personal widths. A new column's width
  from the admin default is preserved even when a user has personal widths
  for other columns.
- **Practical example:** If a user's personal view hides column X and the admin
  adds column Y, the user sees Y (from admin defaults) but not X (from their
  personal override). Column Y is visible because the personal view never
  mentioned it.

### 5.4 Artifact Visibility and Permissions

The workspace uses a programmatic visibility model to control who can see each
artifact. Every artifact carries a `VisibilityMeta` record:

| Field         | Type                                    | Purpose                                      |
|---------------|-----------------------------------------|----------------------------------------------|
| `id`          | string                                  | Artifact identifier                          |
| `type`        | ArtifactType                            | Dashboard, report, grid, KPI, etc.           |
| `name`        | string                                  | Display name                                 |
| `visibility`  | `personal` \| `shared` \| `published`   | Current visibility level                     |
| `ownerId`     | string                                  | User ID of the creator                       |
| `sharedWith`  | string[]                                | Role names (only relevant when `shared`)     |
| `description` | string                                  | Optional description                         |

#### Visibility Levels

- **`personal`** — Only the creator can see it. The workspace checks
  `meta.ownerId === viewer.userId`. If the viewer has no `userId`, personal
  artifacts are invisible.
- **`shared`** — Visible to the owner and to users whose `ViewerContext.roles`
  overlap with the artifact's `sharedWith` array. Role matching uses
  `sharedRoles.some(role => viewerRoles.includes(role))`.
- **`published`** — Visible to all users regardless of role, including viewers.

#### Transition Rules

All transitions between visibility levels are valid:

```
personal ↔ shared ↔ published
personal ↔ published
```

However, only **admins** should perform the transition to `published`. The
`transitionVisibility(meta, newVisibility, sharedWith?)` function validates
that the requested transition is allowed (same-state transitions are rejected)
and returns a new `VisibilityMeta` with the updated state. When transitioning
to `shared`, pass the `sharedWith` role list.

#### Programmatic Access Checks

Use `isVisibleToViewer(artifact, viewerContext)` to check whether a specific
user should see an artifact. This function encapsulates the full visibility
logic:

1. `published` — always returns `true`
2. `personal` — returns `true` only if `ownerId` matches `viewer.userId`
3. `shared` — returns `true` if the viewer is the owner OR has a role in
   `sharedWith`

#### Duplication

`duplicateWithVisibility(meta, newOwnerId)` creates a copy that starts as
`personal` with the new owner. The copy receives a new ID and a name suffixed
with "(Copy)". The original artifact is not modified.

> **Note**: The `<phz-permissions-panel>` component for visual permission management
> is planned but not yet implemented. Currently, visibility is managed programmatically
> through the WorkspaceAdapter or via the artifact's context menu (Share / Publish actions).

---

## 6. Grid Definitions

Grid definitions are first-class workspace artifacts — they live in the catalog
alongside dashboards and reports, appear with a violet icon, and participate in
the full visibility lifecycle (personal → shared → published).

### 6.1 GridArtifact Fields

| Field            | Purpose                                               |
|------------------|-------------------------------------------------------|
| `dataSourceId`   | The data source this grid queries                     |
| `columns`        | Ordered array of `GridColumnConfig` entries           |
| `defaultSort`    | Default sort field and direction                      |
| `defaultFilters` | Pre-applied filter values                             |
| `density`        | Initial row density mode                              |
| `enableGrouping` | Whether grouping controls are visible to users        |
| `enableExport`   | Whether CSV/Excel export is available to users        |

Each `GridColumnConfig` in `columns`:

| Field        | Purpose                                   |
|--------------|-------------------------------------------|
| `field`      | Data source field name (required)         |
| `header`     | Override column header text               |
| `width`      | Initial column width in pixels            |
| `visible`    | Whether the column is visible by default  |
| `sortable`   | Whether users can sort by this column     |
| `filterable` | Whether the column header filter is active |

### 6.2 Grid Creator Workflow

Authors use the Grid Creator wizard to build a new grid definition:

1. Select a data source
2. Choose columns and configure headers, widths, and visibility
3. Set default sort and optional default filters
4. Review and save

After creation, the grid definition lands in the author's personal catalog as
a draft. An admin can then review, adjust the `DefaultPresentation`, and publish
it for viewer access.

### 6.3 Grid Admin Panel

Admins have access to the full Grid Admin panel where they can:
- Reorganize column order and toggle column visibility
- Adjust column widths, formatters, and cell renderers
- Configure grouping, row selection, and export options
- Set the default density and theme

Changes made in Grid Admin update the `DefaultPresentation` for the artifact.
Users with saved personal views are not affected until they reset to defaults.

---

## 7. Local Mode Administration

### 7.1 Session Management

In local (browser-based) mode, data and configurations are persisted using
**OPFS** (Origin Private File System) — browser storage isolated to the origin
that survives page reloads and browser restarts.

Each session has:

| Field       | Purpose                                               |
|-------------|-------------------------------------------------------|
| `id`        | Auto-generated unique identifier                      |
| `name`      | User-provided session name                            |
| `tables`    | Array of registered table names and their row counts  |
| `createdAt` | Timestamp                                             |
| `updatedAt` | Auto-updated on every change                          |

**Auto-save:**
The workspace auto-saves every **30 seconds** by default
(`DEFAULT_AUTO_SAVE_CONFIG`: `intervalMs: 30000`, `enabled: true`).

**Resume Prompt:**
When a user returns to the workspace after a previous session, they are
presented with a resume prompt listing recent sessions sorted by most recently
updated.

### 7.2 Session Export and Import

Sessions can be exported to a ZIP bundle containing the manifest and table
data files.

The manifest (`ExportBundle`) includes:

| Field         | Contents                                               |
|---------------|--------------------------------------------------------|
| `version`     | Format version (currently 1)                           |
| `sessionName` | The session's display name                             |
| `tables`      | Table names, row counts, and source file references    |
| `exportedAt`  | Export timestamp                                       |
| `source`      | `'browser'` or `'phz-local'`                           |

> **Important:** Credentials are explicitly excluded from exports. Data source
> connection strings, API keys, and auth tokens are never serialized into
> session bundles.

**Importing a session:**
Before import, the workspace validates the bundle:
1. Checks `version` is present and numeric
2. Checks version is not newer than supported (`SESSION_FORMAT_VERSION = 1`)
3. Checks `sessionName` is present

If validation fails, the import is rejected with specific error messages.

### 7.3 Cross-Tier Compatibility

Sessions exported from the browser can be imported into **phz-local**
(`@phozart/phz-local`), and vice versa.

The `source` field in the bundle identifies the origin (`'browser'` vs
`'phz-local'`). The `serverConfig` field in local server bundles carries
server-specific configuration that the browser importer ignores.

**Tier 1 to Tier 2 migration:**
A user who built a complex analysis in the browser can export the session,
hand it to an administrator, and the administrator imports it into the
persistent local server for team-wide access.

### 7.4 Demo and Evaluation Sessions

For training and evaluation, pre-built sample datasets can be loaded without
any external data source configuration. This makes them suitable for onboarding
new authors or demonstrating the platform to stakeholders.

Demo sessions are identifiable by the `source: 'browser'` marker and a session
name prefixed with "Demo:".

---

## 8. Theming and Customization

### 8.1 Design Tokens

The workspace uses a warm-neutral console palette with CSS custom properties
that consumers can override. All public tokens are prefixed with `--phz-`.

**Core Color Tokens:**

| Token                   | Default   | Purpose                            |
|-------------------------|-----------|------------------------------------|
| `--phz-header-bg`       | `#1C1917` | Top navigation background          |
| `--phz-bg-base`         | `#FEFDFB` | Primary content background         |
| `--phz-bg-subtle`       | `#FAF9F7` | Cards, panels, inset areas         |
| `--phz-bg-muted`        | `#F5F5F4` | Hovered rows, disabled fields      |
| `--phz-text-primary`    | `#1C1917` | Primary text                       |
| `--phz-text-secondary`  | `#57534E` | Secondary/label text               |
| `--phz-text-muted`      | `#78716C` | Placeholder, hint text             |
| `--phz-header-accent`   | `#F59E0B` | Active state, highlights           |
| `--phz-primary-500`     | `#3B82F6` | Primary interactive elements       |
| `--phz-error-500`       | `#EF4444` | Error states, alert rule badges    |
| `--phz-warning-500`     | `#F59E0B` | Warning states                     |

**Shell Layout (constants, not overridable via CSS):**

| Constant           | Value   | Purpose                    |
|--------------------|---------|----------------------------|
| `headerHeight`     | 56px    | Top navigation bar height  |
| `sidebarWidth`     | 240px   | Left sidebar width         |
| `contentMaxWidth`  | 1440px  | Content area max width     |

**Overriding tokens:**
Set overrides on `:root` in your host application's CSS before the workspace
loads. All `--phz-*` tokens are public API:

```css
:root {
  --phz-header-bg: #0F172A;     /* Navy header */
  --phz-header-accent: #38BDF8; /* Cyan accent */
  --phz-bg-base: #F8FAFC;       /* Cool neutral background */
}
```

### 8.2 Responsive Widget Behavior

Widgets adapt their visual complexity based on container width using CSS
container queries. The workspace measures each widget's container and applies a
CSS class:

**KPI Cards:**

| Container Width | CSS Class      | Visible Elements                      |
|----------------|----------------|---------------------------------------|
| > 280px         | `kpi--full`    | Title, value, trend, sparkline        |
| 200–280px       | `kpi--compact` | Title and value only                  |
| < 200px         | `kpi--minimal` | Value only                            |

**Charts:**

| Container Width | CSS Class            | Visible Elements                  |
|-----------------|----------------------|-----------------------------------|
| > 400px         | `chart--full`        | Axis labels, legend, data labels  |
| 280–400px       | `chart--no-legend`   | Axis labels, no legend            |
| 160–280px       | `chart--no-labels`   | Chart body only                   |
| < 160px         | `chart--single-value`| Collapsed to single key metric    |

**Tables:**

| Container Width | CSS Class             | Behavior                            |
|-----------------|-----------------------|-------------------------------------|
| > 600px         | `table--all`          | All columns visible                 |
| 400–600px       | `table--hide-low`     | Low-priority columns hidden         |
| 300–400px       | `table--hide-medium`  | Only high-priority columns visible  |
| < 300px         | `table--card`         | Stacked card layout                 |

**Filter Bar:**

| Container Width | CSS Class               | Layout                          |
|-----------------|-------------------------|---------------------------------|
| > 600px         | `filter-bar--row`       | All filters in a single row     |
| 400–600px       | `filter-bar--two-col`   | Two-column grid                 |
| < 400px         | `filter-bar--vertical`  | Single-column stacked           |

**Column Priority:**
When configuring table columns, mark each column with a priority (`high`,
`medium`, `low`). At narrow container widths, only high-priority columns remain
visible. Set the most important identifier or key metric columns to `high` so
they survive on mobile-sized panels.

### 8.3 Spacing and Typography Tokens

The workspace uses a 4px grid for spacing. Available spacing tokens:
`--phz-space-1` (4px) through `--phz-space-16` (64px).

Typography scale: `--phz-text-xs` (11px) through `--phz-text-2xl` (24px).

Default body font: Inter with system-ui fallback.
Default monospace font: JetBrains Mono with Fira Code fallback.

To change the font:
```css
:root {
  --phz-font-sans: 'IBM Plex Sans', system-ui, sans-serif;
}
```

---

## 9. Common Configuration Patterns

### Pattern: Regional Access Control Dashboard

1. Create a `FilterDefinition` for "Region" with `filterType: 'multi-select'`
   and `valueSource: { type: 'data-source', dataSourceId: 'sales_db', field: 'region' }`
2. Add `securityBinding` with `viewerAttribute: 'managed_regions'` and
   `restrictionType: 'include-only'`
3. Set `defaultValue: { type: 'viewer-attribute', attribute: 'managed_regions' }`
   so the filter starts pre-applied to the user's regions
4. Bind to the dashboard with `required: true` and `queryLayer: 'server'`

### Pattern: Date-Scoped KPI Dashboard

1. Create a "Date Range" filter with `filterType: 'date-range'`
2. Add `defaultValue: { type: 'relative-date', offset: -30, unit: 'days' }`
   for a default of last 30 days
3. Set `queryLayer: 'server'` — date ranges always filter server-side
4. Create a filter rule: if viewer role is `viewer`, force the date to
   `this-quarter` so viewers always see the current quarter
5. Add a `restrict` action for viewers that limits them to predefined date
   presets rather than an open date picker

### Pattern: Cross-Report Drill-Through

1. Ensure both the source dashboard and the target report bind the same
   `FilterDefinition` (same `filterDefinitionId`) for the shared dimension
2. Create a `NavigationLink` from the source dashboard to the target report
3. Add a `filterMapping` with `sourceField` matching the chart's dimension
   field and `targetFilterDefinitionId` matching the shared filter definition
4. Set `openBehavior: 'slide-over'` so the target opens in a panel
5. Test with auto-mapping first; the editor suggests connections based on
   field name similarity in filter bindings

### Pattern: Cascading Country/State Filters

1. Create a "Country" `FilterDefinition` with `filterType: 'select'`
2. Create a "State/Province" `FilterDefinition` with `dependsOn: ['fd_country']`
3. Add filter rule "Hide State when no Country selected":
   - Condition: `country` is not in `["US", "CA"]`
   - Action: `hide` the `state` filter
   - Priority: 10
4. Add filter rule "Restrict State to US states":
   - Condition: `country` equals `"US"`
   - Action: `restrict` `state` to the 50 US state codes
   - Priority: 20
5. Add filter rule "Restrict State to Canadian provinces":
   - Condition: `country` equals `"CA"`
   - Action: `restrict` `state` to the 13 province/territory codes
   - Priority: 30

### Pattern: Fast Summary Dashboard with Drill-to-Detail

1. Configure the DashboardDataConfig preload query to return today's summary
   totals (10–50 rows)
2. Set `fullLoad.maxRows: 25000` and `fullLoad.applyCurrentFilters: true`
3. Assign KPI cards and the summary chart to `dataTier: 'preload'`
4. Assign the detail transaction table to `dataTier: 'full'`
5. Add a detail source with `trigger: { type: 'drill-through', fromWidgetTypes: ['bar-chart'] }`
   and `renderMode: 'panel'`
6. Map the chart's primary dimension field in `filterMapping` so the panel
   opens pre-filtered to the clicked bar's value
7. Set `transition: 'seamless'` so the dashboard does not flash when full
   data arrives and replaces the preload numbers

### Pattern: Publishing a Draft for Viewer Access

1. Author creates a dashboard (starts as `personal`)
2. Author transitions to `shared` with `sharedWith: ['admins']`
3. Admin reviews the dashboard in the Shared catalog tab
4. Admin adjusts `DefaultPresentation` if needed (column order, density)
5. Admin transitions the artifact to `published`
6. Artifact appears in the viewer's card catalog immediately

To unpublish, transition back to `shared` or `personal`. The artifact is
immediately removed from viewer catalogs.

---

## 10. Authoring Workflows

This section covers the end-to-end workflows for creating, configuring, and
publishing artifacts within the workspace.

### 10.1 Artifact Creation Flow

The workspace provides a unified creation wizard for reports and dashboards.
The wizard walks the user through three steps.

**Step 1 — Choose Type.** The wizard presents two cards: **Report** and
**Dashboard**. Selecting one determines the artifact type and the available
configuration options in subsequent steps.

**Step 2 — Choose Data Source.** The wizard lists all data sources available
through the consumer's `DataAdapter.listDataSources()` implementation. The
admin selects the data source that will back the new artifact.

**Step 3 — Choose Template.** For dashboards, the wizard offers a **Blank**
option alongside ranked template suggestions generated by the template
pipeline. Suggestions are ranked based on schema analysis of the selected data
source (field types, cardinalities, relationships). For reports, this step is
skipped entirely — reports are configured after creation through the grid
admin interface.

The creation flow is driven by pure state functions exposed from
`@phozart/phz-workspace/authoring`:

| Function | Effect |
|----------|--------|
| `selectType(state, 'report' \| 'dashboard')` | Advances to data source selection |
| `selectDataSource(state, sourceId)` | For dashboards, auto-runs schema analysis and template matching |
| `selectTemplate(state, templateId \| 'blank')` | Applies the selected template or creates a blank layout |
| `finishCreation(state)` | Returns the final creation descriptor: artifact type, data source, template, and name |

Once creation finishes, the workspace opens the new artifact in its
corresponding admin view (report admin or dashboard admin).

### 10.2 Publish Workflow

Artifacts follow a three-stage publish lifecycle: **Draft**, **Review**, and
**Published**. Each stage controls who can see and interact with the artifact.

The valid transitions are:

| Transition | Function | Who can perform it |
|------------|----------|--------------------|
| Draft to Review | `submitForReview(state)` | Authors and admins |
| Review to Published | `approve(state)` | Admins only |
| Review to Draft | `reject(state)` | Admins only |
| Published to Draft | `unpublish(state)` | Admins only |

Invalid transitions are rejected. For example, an artifact cannot move directly
from Draft to Published — it must pass through Review first.

Each transition records a history entry containing the previous stage, the new
stage, a timestamp, and optionally the user ID of the person who performed the
transition. This history provides a full audit trail of an artifact's lifecycle.

### 10.3 Catalog Management

The admin catalog (`<phz-artifact-catalog>`) is the central hub for managing
all workspace artifacts.

**Search and filtering.** The catalog supports full-text search across artifact
names and descriptions. Tags are extracted automatically from all artifacts and
presented as filter chips. A type filter bar offers tabs for **All**,
**Reports**, and **Dashboards**.

**Sorting.** The catalog can be sorted by:

- Recently updated (default)
- Oldest updated
- Name A-Z
- Name Z-A
- Newest created
- Oldest created

**Status badges.** Each artifact displays a status badge — **Draft**,
**Review**, or **Published** — so admins can see lifecycle state at a glance.

**Admin actions.** From the catalog, admins can:

- Create a new report or dashboard (launches the creation wizard)
- Open an existing artifact for editing in its admin view
- View artifact status, last update timestamp, and creation date

### 10.4 Report Configuration (Admin View)

Report authoring is performed through the grid admin interface and provides the
following capabilities.

**Column configuration.** Admins can add, remove, and reorder columns. Each
column supports a visibility toggle and can be pinned to the left or right edge
of the grid.

**Sorting.** Multi-column sort is supported with configurable direction
(ascending or descending) for each sort field.

**Grouping.** Admins can designate grouping fields to enable grouped row
display, collapsing data into hierarchical sections.

**Conditional formatting.** Rules can be defined to apply color and icon
treatments to cells based on value conditions (thresholds, ranges, text
matching).

**Density.** The report density can be set to compact, dense, or comfortable,
controlling row height, cell padding, and text overflow behavior.

**Context menu.** Right-clicking a column header provides quick access to Sort,
Group, Pin, Hide, Filter, and Formatting actions for that column.

All operations push labeled entries to the undo stack (for example, "Added
column 'Revenue'" or "Sorted by Date ascending"), providing a clear audit trail
and reliable undo/redo support.

### 10.5 Dashboard Configuration (Admin View)

Dashboard authoring is performed through the dashboard admin interface and
provides a rich set of layout and widget tools.

**Widget library.** The workspace ships 13 widget types organized into five
categories:

| Category | Widget types |
|----------|-------------|
| **Chart** | Bar chart, Line chart, Area chart, Pie chart |
| **Single-value** | KPI card, KPI scorecard, Gauge, Trend line |
| **Tabular** | Data table (grid) |
| **Text** | Rich text block |
| **Navigation** | Drill link, Export menu |

**Drag-and-drop.** The dashboard canvas supports three drag interactions:
fields from the data palette to the canvas, widgets between canvas slots, and
fields to the filter bar.

**Widget morphing.** Compatible widget types can be converted between each
other while preserving the existing data configuration. The supported morph
group is bar, line, area, and pie — converting between any of these retains
the bound dimensions and measures.

**Config panel.** Selecting a widget opens a three-tab configuration panel:

- **Data** — Assign dimensions and measures from the data source
- **Style** — Set title, legend visibility, label formatting, and colors
- **Filters** — Apply widget-level filters that scope data to this widget only

**Canvas layout.** The dashboard canvas uses a 12-column CSS grid. Widgets snap
to grid positions, and admins can resize widgets by dragging edges to span
multiple columns or rows.

**Context menu.** Right-clicking a widget provides actions for Configure, Morph
To (submenu of compatible types), Duplicate, View Data, View SQL, Add to Filter
Bar, Cross-Filter, Export, and Delete.

### 10.6 Auto-Save and Undo

The workspace provides automatic saving and full undo/redo support for all
authoring operations.

**Auto-save.** Changes are auto-saved with a 2000ms debounce by default. The
save status is displayed in the workspace header and cycles through four
states: **Saved**, **Saving...**, **Unsaved**, and **Error**. Admins always
know whether their latest changes have been persisted.

**Undo and Redo.** The toolbar includes undo and redo buttons. Keyboard
shortcuts are supported: Ctrl+Z (undo) and Ctrl+Shift+Z (redo) on Windows and
Linux, Cmd+Z and Cmd+Shift+Z on macOS.

All operations are labeled in the undo history for auditability. Each entry
describes what changed (for example, "Moved widget 'Revenue Chart' to row 2,
column 5" or "Changed density to compact"), so admins can review the undo stack
and understand exactly what each step will reverse.

---

## 11. Alert Administration

### 11.1 Overview

Alerts monitor metric (KPI) values against thresholds and notify users when
conditions are breached. Only **admins** can create, edit, and delete alert
rules. Viewers can subscribe to existing rules but cannot create them.

Alert administration is located in the **GOVERN** section of the workspace
sidebar, alongside Permissions. Authors do not have access to the GOVERN
section.

The alert system has three core concepts:

1. **Alert Rules** — define what to monitor and under what conditions
2. **Alert Subscriptions** — define who gets notified and through which channels
3. **Breach Records** — the audit trail of when conditions were triggered

### 11.2 Alert Rules

An `AlertRule` defines a single monitoring condition attached to a specific
artifact (typically a dashboard or report).

| Field         | Type                                  | Purpose                                          |
|---------------|---------------------------------------|--------------------------------------------------|
| `id`          | `AlertRuleId` (branded string)        | Unique identifier                                |
| `name`        | string                                | Descriptive name shown in the alert list         |
| `description` | string                                | Admin notes about the rule's purpose             |
| `artifactId`  | string                                | The dashboard or report this rule monitors       |
| `widgetId`    | string (optional)                     | Specific widget within the artifact              |
| `condition`   | `AlertCondition`                      | The threshold or compound condition              |
| `severity`    | `'info'` \| `'warning'` \| `'critical'` | How urgent the breach is                      |
| `cooldownMs`  | number                                | Minimum time between repeated breach notifications |
| `enabled`     | boolean                               | Toggle the rule on/off without deleting it       |
| `createdAt`   | number (timestamp)                    | When the rule was created                        |
| `updatedAt`   | number (timestamp)                    | When the rule was last modified                  |

#### Alert Conditions

Conditions come in two kinds, forming a discriminated union (`AlertCondition`):

**Simple Threshold (`kind: 'threshold'`):**

| Field        | Type   | Purpose                                              |
|--------------|--------|------------------------------------------------------|
| `metric`     | string | The metric name to evaluate (e.g., `"revenue"`)     |
| `operator`   | string | Comparison: `>`, `<`, `>=`, `<=`, `==`, `!=`        |
| `value`      | number | The threshold value                                  |
| `durationMs` | number (optional) | How long the condition must hold before triggering |

**Compound Condition (`kind: 'compound'`):**

| Field      | Type               | Purpose                                    |
|------------|--------------------|--------------------------------------------|
| `op`       | `'AND'` \| `'OR'` \| `'NOT'` | Logic operator                  |
| `children` | `AlertCondition[]` | Nested conditions (recursive)              |

Compound conditions allow complex monitoring rules. For example: "revenue < 10000
AND order_count < 50" triggers only when both conditions are true simultaneously.
The `NOT` operator inverts the first child condition.

#### Severity Levels

| Severity   | Intended Use                                                  |
|------------|---------------------------------------------------------------|
| `info`     | Informational — a metric crossed a threshold of interest      |
| `warning`  | Attention needed — a metric is trending toward a problem      |
| `critical` | Immediate action required — a key business metric is breached |

Severity drives how the breach appears in the workspace UI (badge color and
icon) and can be used by external notification channels to set alert priority.

### 11.3 Creating an Alert Rule

Alert rules are created using the `<phz-alert-rule-designer>` component,
accessible from the GOVERN > Alerts section of the workspace sidebar.

**Workflow:**

1. **Name and describe the rule.** Provide a clear name (e.g., "Revenue Below
   Target") and a description explaining what the rule monitors and why.

2. **Select the target artifact.** Choose the dashboard or report whose data
   this rule monitors. Optionally narrow to a specific widget within the
   artifact by setting `widgetId`.

3. **Define the condition.** Choose between simple threshold mode and compound
   mode:
   - **Simple:** Select a metric, a comparison operator, and a threshold value.
   - **Compound:** Build a tree of conditions connected by AND, OR, or NOT logic.

4. **Set severity.** Choose `info`, `warning`, or `critical` based on the
   business impact of a breach.

5. **Configure cooldown.** The `cooldownMs` field prevents notification storms.
   The default is 300,000ms (5 minutes). During the cooldown period after a
   breach, the same rule will not generate additional breach records even if the
   condition remains true.

6. **Enable and save.** Rules are enabled by default. Use `enabled: false` to
   stage a rule for review before activating it.

**Validation:** The designer validates rules before saving:
- Name must be non-empty
- Cooldown must be non-negative
- Threshold conditions must specify a metric name
- Compound conditions must have at least one child

Rules evaluate on each data refresh. When the workspace loads new data for an
artifact, all enabled alert rules bound to that artifact are evaluated against
the current metric values.

**Helper functions** for building conditions programmatically:

| Function                                         | Creates                         |
|--------------------------------------------------|---------------------------------|
| `buildThresholdCondition(metric, operator, value)` | A `SimpleThreshold` condition |
| `buildCompoundCondition(op, children)`           | A `CompoundCondition`           |
| `buildDefaultAlertRule(artifactId)`              | A pre-populated rule template   |

### 11.4 Alert Subscriptions

An `AlertSubscription` connects a user to an alert rule through a delivery
channel. When a rule's condition is breached, all active subscriptions for that
rule are triggered.

| Field          | Type                                 | Purpose                                        |
|----------------|--------------------------------------|-------------------------------------------------|
| `id`           | string                               | Unique subscription identifier                  |
| `ruleId`       | `AlertRuleId`                        | The alert rule this subscription is for         |
| `channelId`    | string                               | Delivery channel identifier                     |
| `recipientRef` | string                               | Recipient address (email, webhook URL, user ID) |
| `format`       | `'inline'` \| `'digest'` \| `'webhook'` | Notification format                         |
| `active`       | boolean                              | Whether this subscription is currently active   |

#### Notification Formats

| Format    | Behavior                                                        |
|-----------|-----------------------------------------------------------------|
| `inline`  | Immediate in-app notification when a breach occurs              |
| `digest`  | Batched summary delivered at intervals                          |
| `webhook` | HTTP POST to the `recipientRef` URL with the breach payload     |

#### Managing Subscriptions

The `<phz-subscription-manager>` component provides the UI for subscription
management. Admins can create and manage subscriptions for any user. Viewers
can self-subscribe to published alert rules but cannot modify the rules
themselves.

**Creating a subscription:**
Use `createSubscription(ruleId, channelId, recipientRef, format)` to create a
new subscription. The subscription starts as `active: true` by default.

**Toggling:** `toggleSubscription(sub)` flips the `active` state without
deleting the subscription. Use this for temporary muting.

**Validation:** Subscriptions require both `channelId` and `recipientRef` to
be non-empty.

#### Alert Channel Adapters

In-app notifications (`inline` format) are built into the workspace. For
external delivery channels (email, webhook, Slack, PagerDuty, etc.), consumers
must provide an `AlertChannelAdapter` implementation:

| Method          | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `send(breach, subscription)` | Deliver the breach notification through this channel |
| `test()`        | Verify the channel is reachable (returns `Promise<boolean>`) |
| `configSchema`  | Optional JSON Schema describing channel-specific settings  |

The workspace calls `send()` for each active subscription when a breach is
detected. If no adapter is registered for a channel, the subscription is
silently skipped.

### 11.5 Breach Records

A `BreachRecord` is created each time an alert rule's condition evaluates to
`true` (subject to cooldown).

| Field            | Type                                          | Purpose                                       |
|------------------|-----------------------------------------------|-----------------------------------------------|
| `id`             | `BreachId` (branded string)                   | Unique breach identifier                      |
| `ruleId`         | `AlertRuleId`                                 | The alert rule that was breached              |
| `artifactId`     | string                                        | The artifact being monitored                  |
| `widgetId`       | string (optional)                             | The specific widget, if scoped                |
| `status`         | `'active'` \| `'acknowledged'` \| `'resolved'` | Current breach lifecycle state              |
| `detectedAt`     | number (timestamp)                            | When the breach was first detected            |
| `acknowledgedAt` | number (optional)                             | When someone acknowledged the breach          |
| `resolvedAt`     | number (optional)                             | When the breach was resolved                  |
| `currentValue`   | number                                        | The metric value that triggered the breach    |
| `thresholdValue` | number                                        | The threshold value from the rule condition   |
| `severity`       | `'info'` \| `'warning'` \| `'critical'`       | Inherited from the alert rule                |
| `message`        | string                                        | Human-readable description of the breach      |

#### Breach Lifecycle

```
active  →  acknowledged  →  resolved
  │                            ↑
  └────────────────────────────┘
         (direct resolve)
```

- **Active:** The condition is currently breached. The workspace displays active
  breaches prominently in the alert dashboard.
- **Acknowledged:** A user has seen the breach and acknowledged it. This removes
  it from the "needs attention" list without resolving the underlying condition.
- **Resolved:** The breach is closed — either the condition is no longer met or
  an admin manually resolved it.

#### Batch Evaluation and Cooldown

The `evaluateRules()` function evaluates all enabled rules against the current
metric values in a single pass. It accepts an optional `existingBreaches` array
for cooldown enforcement: if a rule's most recent breach is within its
`cooldownMs` window, no new breach record is generated.

This batch evaluation runs automatically on each data refresh cycle. The
resulting breach records are stored and made available to the subscription
system for notification delivery.

#### Viewing Breach History

Breach records are viewable in the GOVERN > Alerts section of the workspace.
The alert dashboard shows:

- **Active breaches** — sorted by severity (critical first), then by detection
  time (most recent first)
- **Breach history** — a chronological log of all past breaches, filterable by
  rule, severity, and date range
- **Rule status** — each alert rule shows its current state (enabled/disabled),
  last evaluation time, and breach count

---

## 12. v15 Admin Features

v15 introduces several new admin capabilities in the workspace's GOVERN and
shell sections.

### 12.1 Command Palette (Ctrl+K)

The command palette provides quick keyboard-driven access to artifacts, actions,
and settings. Open it with **Ctrl+K** (or **Cmd+K** on macOS).

**Capabilities:**
- Full-text search across all artifacts (dashboards, reports, grids, KPIs)
- Quick actions organized by category: `navigate`, `create`, `configure`, `export`, `help`
- Recent items list (up to 10 items, persisted per session)
- Keyboard navigation: arrow keys to select, Enter to execute, Escape to close
- Fuzzy matching against action labels, descriptions, and keyword lists

**Registering custom actions:**

The command palette accepts `CommandAction` entries via `initialCommandPaletteState(actions)`.
Each action has an `id`, `label`, `category`, `keywords` array, optional `shortcut` display
string, and a `handler` callback.

### 12.2 Keyboard Shortcuts

The keyboard shortcuts system is context-aware: different shortcuts are active
depending on what the admin is currently doing.

**Contexts:** `global`, `catalog`, `report-editor`, `dashboard-editor`, `settings`, `command-palette`

**Default shortcuts include:**

| Context | Shortcut | Action |
|---------|----------|--------|
| Global | Ctrl+S | Save |
| Global | Ctrl+Z / Ctrl+Shift+Z | Undo / Redo |
| Global | Ctrl+K | Open command palette |
| Global | Shift+? | Show keyboard shortcuts help |
| Catalog | Ctrl+N | New artifact |
| Catalog | Delete | Delete selected |
| Report Editor | Ctrl++ / Ctrl+- | Add / Remove column |
| Report Editor | Ctrl+Shift+P | Preview report |
| Dashboard Editor | Delete | Delete selected widget |
| Dashboard Editor | Ctrl+D | Duplicate widget |

**Customization:** Shortcuts marked `customizable: true` can have their key
bindings overridden via the settings UI. The `KeyboardShortcutsState` tracks
active context, custom bindings, and conflict detection between shortcuts.

### 12.3 Publish Workflow

The publish workflow enforces a three-stage lifecycle with audit history:

```
Draft  →  Review  →  Published
  ↑         ↓
  └─────────┘  (reject)
```

| Transition | Function | Who |
|------------|----------|-----|
| Draft to Review | `submitForReview(state, userId)` | Authors and admins |
| Review to Published | `approve(state, userId)` | Admins only |
| Review to Draft | `reject(state, userId)` | Admins only |
| Published to Draft | `unpublish(state)` | Admins only |

Each transition records a history entry with `from`, `to`, `at` (timestamp),
and `by` (user ID). This provides a complete audit trail of every artifact's
publication lifecycle.

### 12.4 Filter Admin with Central Registry

v15 enhances filter administration with a centralized `FilterDefinition` catalog.
Admins manage filter definitions as first-class catalog artifacts, then bind
them to individual dashboards via `ArtifactFilterContract`.

**New in v15:**
- `FilterValueMatchRule` — complex matching with expression functions (`UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, etc.)
- `FilterValueHandling` — configures `FilterValueSource`, `FilterValueTransform`, and `FilterDefault` per binding
- `FilterPresetValue` — structured preset values with factory `createDefaultFilterPresetValue()`
- `FieldEnrichment` — overlay field metadata (semantic hints, units) without modifying the data source schema

### 12.5 Alert Admin with Compound Conditions

Alert administration now supports the full compound condition tree with
personal alert preferences:

**New in v15:**
- `PersonalAlertPreference` — per-user severity filters and grace period configuration
- `AlertGracePeriodConfig` — configurable grace periods with `isGracePeriodValid()` and `clampGracePeriod()` validation
- `AlertEvaluationContract` — SPI for plugging in custom alert evaluation (server-side, local polling, or hybrid)
- `SingleValueAlertConfig` — bind alert rules directly to KPI cards and gauges with visual modes (`indicator`, `background`, `border`)
- Alert design tokens for consistent severity coloring across all widgets

### 12.6 API Access Management

The new API Access panel (GOVERN section) provides API key management with
role-based scoping and rate limiting.

**API Keys** (`ApiKey`):
- Auto-generated with 8-character prefix for identification
- Configurable expiration date
- Scoped to specific API permissions
- Per-key rate limiting (`requestsPerMinute`, `requestsPerHour`, `burstLimit`)
- Status tracking: `active`, `revoked`, `expired`

**Built-in Scopes** (`API_SCOPES`):
`read:artifacts`, `write:artifacts`, `read:data`, `write:data`,
`admin:settings`, `admin:users`, `export:reports`, `execute:queries`

**Built-in Roles** (`BUILT_IN_ROLES`):
- **Viewer** — `read:artifacts`, `read:data`
- **Author** — read + write artifacts and data, export reports
- **Admin** — all scopes

The `generateOpenAPISpec()` function (from `@phozart/phz-engine`) produces a
complete OpenAPI 3.1.0 document from the `ApiSpec` type, suitable for developer
documentation and client SDK generation.

### 12.7 Settings (Theme, Branding, Feature Flags)

The Settings panel (GOVERN section) provides workspace-wide configuration.

**Theme and Branding** (`BrandingConfig`):
- `logoUrl` — custom header logo
- `primaryColor` / `accentColor` — brand colors
- `appName` — workspace title shown in the header
- `faviconUrl` — custom favicon
- Theme mode: `light`, `dark`, or `auto` (follows system preference)

**Default Settings** (`DefaultSettings`):
- `density` — default row density for all grids
- `pageSize` — default pagination size
- `defaultView` — `card` or `table` for catalog display
- `locale`, `timezone`, `dateFormat`, `numberFormat` — regional defaults

**Feature Flags** (`FeatureFlag`):
Built-in flags that admins can toggle:

| Flag ID | Default | Category | Purpose |
|---------|---------|----------|---------|
| `ai-assist` | off | ai | Enable AI-powered suggestions |
| `collab` | off | collaboration | Enable multi-user editing |
| `export-pdf` | on | export | Enable PDF export |
| `export-excel` | on | export | Enable Excel export |
| `dark-mode` | on | ui | Allow dark mode switching |
| `command-palette` | on | ui | Enable Ctrl+K command palette |
| `alerts` | off | monitoring | Enable alert rules and breach notifications |

### 12.8 Data Source Enrichment

Admins can overlay field metadata on existing data sources without modifying
the source schema. This is done via `FieldEnrichment` records:

- `SemanticHint` — annotate fields as `measure`, `dimension`, `identifier`, `timestamp`, `category`, `currency`, or `percentage`
- `UnitSpec` — attach units (currency, percent, duration, custom) to numeric fields
- `mergeFieldMetadata()` — merges enrichment overlays with the base `FieldMetadata` from `DataAdapter.getSchema()`
- `createFieldEnrichment()` — factory for new enrichment records

Enrichments are stored via the `WorkspaceAdapter` and applied transparently
to all consumers: filter dropdowns, chart axis labels, export headers, and
micro-widget cell renderers all benefit from enriched metadata.

### 12.9 Navigation Configuration

The navigation configuration panel provides a visual editor for drill-through
links with these v15 enhancements:

- **Auto-mapping**: Automatically suggests filter connections based on field name matching between source and target artifacts
- **Circular detection**: Warns when a new link would create a navigation cycle (A -> B -> A)
- **6 trigger types**: user-action, drill-through (with widget type filter), breach, chart-click, row-click, filter-change
- **4 open modes**: same-panel, slide-over, modal, new-tab
- **Filter mapping transforms**: passthrough, lookup, expression — with expression preview
- **NavigationFilterMapping** resolution: `resolveNavigationFilters()` maps source context values to target `FilterDefinition` IDs
