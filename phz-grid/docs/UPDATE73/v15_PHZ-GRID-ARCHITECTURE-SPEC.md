# phz-grid Architecture & UX Specification

> **Version**: 1.1.0 | **Date**: 2026-03-08 | **Status**: Complete specification
>
> This document consolidates all architecture decisions, package boundaries,
> capability matrices, and UX definitions for the phz-grid workspace ecosystem.
> It supersedes the previous conversation summary and serves as the single
> source of truth for implementation.

---

## Table of Contents

1. [Package Architecture](#1-package-architecture)
2. [Capability Matrix](#2-capability-matrix)
3. [Adapter Interfaces](#3-adapter-interfaces)
4. [Widget System](#4-widget-system)
5. [Workspace Shell UX (Admin & Author)](#5-workspace-shell-ux-admin--author)
6. [Viewer Shell UX](#6-viewer-shell-ux)
7. [Editor Shell UX](#7-editor-shell-ux)
8. [Context Scoping](#8-context-scoping)
9. [Decision Tree Widget](#9-decision-tree-widget)
10. [Expandable Widgets & Smart Boxes](#10-expandable-widgets--smart-boxes)
11. [Attention & Notification System](#11-attention--notification-system)
12. [Data Architecture & Execution Engine](#12-data-architecture--execution-engine)
13. [Widget View Switching](#13-widget-view-switching)
14. [Async Report Generation](#14-async-report-generation)
15. [API Specification & Data Access](#15-api-specification--data-access)
16. [Usage Analytics & Telemetry](#16-usage-analytics--telemetry)
17. [Filter State Persistence](#17-filter-state-persistence)
18. [Filter Value Handling & Match Rules](#18-filter-value-handling--match-rules)
19. [Personal Alerts](#19-personal-alerts)
20. [Report & Dashboard Subscriptions](#20-report--dashboard-subscriptions)
21. [Error States & Empty States](#21-error-states--empty-states)
22. [Versioning & Migration](#22-versioning--migration)
23. [Deferred Features](#23-deferred-features)
24. [Existing Infrastructure Reference](#24-existing-infrastructure-reference)

---

## 1. Package Architecture

### 1.1 Package Hierarchy

```
                    ┌──────────────────────────┐
                    │  phz-workspace           │
                    │  (admin + author shell)   │
                    └────────┬─────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────┐  ┌───────▼────────┐         │
│  phz-viewer    │  │  phz-editor    │         │
│  (consumption) │  │  (future)      │         │
└─────────┬──────┘  └───────┬────────┘         │
          │                 │                  │
          └────────┬────────┘                  │
                   │                           │
            ┌──────▼──────┐                    │
            │  phz-shared │◄───────────────────┘
            └──────┬──────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
┌────▼───┐   ┌────▼────┐   ┌─────▼─────┐
│ engine │   │ widgets │   │ criteria  │
│+explorer│  │         │   │           │
└────┬───┘   └────┬────┘   └─────┬─────┘
     │            │              │
     └─────────┬──┴──────────────┘
               │
        ┌──────▼──────┐    ┌──────────────┐
        │ definitions │    │    core      │
        └──────┬──────┘    └──────┬───────┘
               └──────────────────┘
```

Key dependency rule: Workspace does not depend on viewer or editor. Viewer
does not depend on workspace. Editor does not depend on workspace. All three
shells depend on phz-shared.

### 1.2 Package Scope Definitions

#### `@phozart/phz-shared` (new package)

Everything that workspace, viewer, and editor all need.

**Contracts & Interfaces:**
- DataAdapter
- PersistenceAdapter
- AlertChannelAdapter
- MeasureRegistryAdapter
- HelpConfig
- AttentionAdapter
- UsageAnalyticsAdapter
- SubscriptionAdapter
- ViewerContext
- ManifestRegistry (extension point type)
- ShareTarget union type

**Design System:**
- DESIGN_TOKENS, generateTokenCSS()
- SHELL_LAYOUT, SECTION_HEADERS
- Responsive breakpoints (getViewportBreakpoint, getBreakpointClasses)
- Container queries (getKPICardClass, getChartClass, getTableClass,
  getFilterBarClass, getVisibleColumns)
- Explorer visual helpers (EXPLORER_LAYOUT, getFieldTypeIcon, etc.)
- Component patterns (skeleton classes, status badge variants, overflow helpers)
- Mobile interactions (bottom sheet config)
- Preview-as-viewer context picker component

**Artifact Metadata Types:**
- ArtifactVisibility, VisibilityMeta
- isVisibleToViewer, groupByVisibility, canTransition, transitionVisibility,
  duplicateWithVisibility
- DefaultPresentation, PersonalView, createPersonalView, applyPersonalView,
  mergePresentation
- GridArtifact, createGridArtifact, gridArtifactToMeta

**Runtime Coordination:**
- FilterContextManager (applies filters at runtime, distinct from admin UI)
- DashboardDataPipeline
- QueryCoordinator
- InteractionBus
- Navigation event building (buildNavigationEvent, resolveNavigationFilters)
- Loading indicator state

**Field Metadata:**
- FieldEnrichment type
- mergeFieldMetadata() pure function
- EnrichedFieldMetadata type

**Shell Building Blocks:**
- Generalized ShellConfig type (each shell extends it)
- getBottomBarClasses(breakpoint) for styling
- Each shell defines its own tab items (no shared getBottomTabItems)

#### `@phozart/phz-workspace` (admin + author shell)

Admin and author authoring UI only. No viewer role.

- WorkspaceRole type: `'admin' | 'author'` (drops `'viewer'`)
- getShellConfig() handles admin and author only
- Report editor state, dashboard editor state
- Creation wizard state machine
- Publish workflow state machine
- Filter definition management (admin UI)
- Alert rule management (admin UI)
- Navigation link editor
- Auto-save, undo/redo in authoring context
- Data source metadata enrichment UI
- Decision tree widget authoring
- Expandable widget child configuration
- Container box authoring
- Preview-as-viewer mode

#### `@phozart/phz-viewer` (consumption shell)

- Card catalog of published artifacts
- Dashboard/report/grid viewing
- Filter interaction within admin-defined constraints
- Filter preset save/load
- Personal view save/load
- Detail panels and drill-through
- Explorer mounted component (front door for createDataExplorer)
- Local mode shell (file upload, DuckDB in-browser)
- Alert subscription self-service
- Attention items display

#### `@phozart/phz-editor` (future, constrained personalisation)

- Duplicate published artifacts to personal
- Constrained dashboard editing (add/remove/rearrange widgets, measures
  from MeasureRegistryAdapter only)
- Widget morph and style editing
- Share with explicit user list
- Explorer with save-to-personal
- Alert subscription self-service
- No creation wizard, no publish workflow, no filter definition, no governance

#### Engine (gains explorer)

The explorer headless infrastructure moves from workspace to engine:

- createDataExplorer(), drop zone state management
- Field palette (createFieldPalette, groupFieldsByType, searchFields)
- autoPlaceField heuristics, aggregation defaults
- Cardinality warning
- suggestChartType()
- toQuery(), undo/redo for explorer state
- exploreToReport(), exploreToDashboardWidget(), promoteFilterToDashboard()

These are pure query orchestration functions. The calling shell decides what
to do with the result (workspace routes through publish workflow, viewer/editor
saves as personal).

### 1.3 ShareTarget Type Change

The current `sharedWith: string[]` (role names) is replaced with a union type
to support both workspace role-based sharing and editor user-based sharing.

```typescript
type ShareTarget =
  | { type: 'role'; roles: string[] }
  | { type: 'users'; userIds: string[] };
```

Workspace uses `{ type: 'role' }`. Editor uses `{ type: 'users' }`.
`isVisibleToViewer()` checks both: roles against `viewerContext.roles`,
userIds against `viewerContext.userId`.

### 1.4 Backward Compatibility

- v0.1.0 with no known external consumers wiring internals
- Deprecate internal exports with warnings, don't remove
- Add `./internals` subpath export for anything currently exported
- Primary `index.ts` exports only shell components, adapters, types,
  design tokens, and extension points

---

## 2. Capability Matrix

### 2.1 Artifact Lifecycle

| Capability | Workspace (admin) | Workspace (author) | Editor | Viewer |
|---|---|---|---|---|
| Create from blank canvas | Yes | Yes | No | No |
| Create from template | Yes | Yes | No | No |
| Duplicate published/shared to personal | Yes | Yes | Yes | Yes |
| Edit own artifacts | Yes | Yes | Yes (constrained) | No |
| Edit others' artifacts | Yes (all) | No | No | No |
| Delete own artifacts | Yes | Yes | Yes | No (presets only) |
| Delete others' artifacts | Yes | No | No | No |

### 2.2 Publish & Visibility

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Draft to Review | Yes | Yes | No | No |
| Review to Published | Yes | No | No | No |
| Published to Unpublish | Yes | No | No | No |
| Share with roles | Yes | Yes (own artifacts) | No | No |
| Share with individual users | Yes | Yes | Yes | No |
| Visibility: personal | Yes | Yes | Yes | Yes (presets, views) |
| Visibility: shared | Yes | Yes | Yes (user-list) | No |
| Visibility: published | Yes (transition) | No (request only) | No | No (consume) |

### 2.3 Data & KPIs

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Define new KPIs/metrics | Yes | Yes | No | No |
| Create views on existing KPIs | Yes | Yes | Yes | No |
| Configure data sources | Yes | Yes | No | No |
| Enrich field metadata | Yes | Yes | No | No |
| Explorer (ad-hoc query) | Yes | Yes | Yes | Yes |
| Save exploration as report | Yes | Yes | Yes (personal) | Yes (personal) |
| Add exploration to dashboard | Yes | Yes | Yes (personal) | No |
| Export CSV/Excel | Yes | Yes | Yes | Yes |

### 2.4 Filters

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Create FilterDefinitions | Yes | No | No | No |
| Edit FilterDefinitions | Yes | No | No | No |
| Create filter rules | Yes | No | No | No |
| Configure security bindings | Yes | No | No | No |
| Apply filters (interact) | Yes | Yes | Yes | Yes |
| Save filter presets (value snapshots) | Yes | Yes | Yes | Yes |
| Load filter presets | Yes | Yes | Yes | Yes |
| Configure filter value handling (nulls, orphans, invert) | Yes | No | No | No |
| Configure filter value match rules | Yes | No | No | No |

### 2.5 Dashboard Editing

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Add widgets | Yes | Yes | Yes (from measure registry) | No |
| Remove widgets | Yes | Yes | Yes (from personal copy) | No |
| Rearrange widgets | Yes | Yes | Yes | No |
| Configure widget data bindings | Yes | Yes | Limited (pick measures) | No |
| Configure widget style | Yes | Yes | Yes | No |
| Widget morph | Yes | Yes | Yes | No |
| Widget-level filters | Yes | Yes | No | No |
| Dashboard-level filter bar | Yes (define) | Yes (define) | No (use only) | Use only |
| Configure expandable widgets | Yes | Yes | No | No |
| Place container boxes | Yes | Yes | Yes | No |
| Configure decision tree nodes | Yes | Yes | No | No |
| Configure widget view groups | Yes | Yes | No | No |
| Configure grid export formats | Yes | Yes | No | No |
| Switch widget views (viewer) | Yes | Yes | Yes | Yes |
| Run report in background | Yes | Yes | Yes | Yes |
| View async export history | Yes | Yes | Yes | Yes |
| Configure API access per role | Yes | No | No | No |
| Generate OpenAPI spec | Yes | No | No | No |

### 2.6 Alerts & Governance

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Create alert rules | Yes | No | No | No |
| Edit alert rules | Yes | No | No | No |
| Subscribe to alerts (push) | Yes | Yes | No | No |
| Self-subscribe to alerts | Yes | Yes | Yes | Yes |
| Create personal alerts | Yes | Yes | Yes | Yes |
| Configure permissions | Yes | No | No | No |
| Configure alert grace period bounds | Yes | No | No | No |

### 2.7 Navigation & Views

| Capability | Admin | Author | Editor | Viewer |
|---|---|---|---|---|
| Configure drill-through links | Yes | Yes | No | No |
| Navigate via drill-through | Yes | Yes | Yes | Yes |
| Save personal view | Yes | Yes | Yes | Yes |
| Set default presentation | Yes | No | No | No |
| Detail panel interaction | Yes | Yes | Yes | Yes |
| Preview as viewer | Yes | No | No | N/A |
| Auto-save filter state | Yes | Yes | Yes | Yes |
| Subscribe to dashboard/report | Yes | Yes | Yes | Yes |
| Manage subscriptions | Yes | Yes | Yes | Yes |

---

## 3. Adapter Interfaces

### 3.1 DataAdapter

Existing interface, unchanged. Implemented by the consumer app to provide
data from any backend. All queries go through this adapter.

```typescript
interface DataAdapter {
  executeQuery(query: DataQuery, context?: ViewerContext): Promise<DataResult>;
  getAvailableSources(context?: ViewerContext): Promise<DataSourceMeta[]>;
  getFieldMetadata(dataSourceId: string): Promise<FieldMetadata[]>;
  getPreviewData?(dataSourceId: string, limit?: number): Promise<DataResult>;

  // Async report execution (optional — feature-detected at mount time)
  executeQueryAsync?(
    query: DataQuery,
    format: ExportFormat,
    context?: ViewerContext
  ): Promise<AsyncReportRequest>;
  getAsyncRequestStatus?(requestId: string): Promise<AsyncReportRequest>;
  listAsyncRequests?(userId: string): Promise<AsyncReportRequest[]>;
  cancelAsyncRequest?(requestId: string): Promise<void>;
}
```

### 3.2 PersistenceAdapter

Handles saving and loading all workspace artifacts, user preferences, and
metadata enrichments. Implemented by the consumer app.

```typescript
interface PersistenceAdapter {
  // Artifacts
  saveArtifact(artifact: ArtifactPayload): Promise<SaveResult>;
  loadArtifact(id: string): Promise<ArtifactPayload | null>;
  listArtifacts(filter: ArtifactFilter, context?: ViewerContext): Promise<ArtifactList>;
  deleteArtifact(id: string): Promise<void>;

  // Personal views & presets
  savePersonalView(view: PersonalView): Promise<void>;
  loadPersonalView(artifactId: string, userId: string): Promise<PersonalView | null>;
  saveFilterPreset(preset: FilterPreset): Promise<void>;
  listFilterPresets(userId: string): Promise<FilterPreset[]>;

  // User preferences
  saveUserPreference(userId: string, key: string, value: unknown): Promise<void>;
  loadUserPreference(userId: string, key: string): Promise<unknown | null>;

  // Field enrichment
  saveFieldEnrichment(dataSourceId: string, field: string, enrichment: FieldEnrichment): Promise<void>;
  loadFieldEnrichments(dataSourceId: string): Promise<Record<string, FieldEnrichment>>;

  // Last-applied filter state (auto-saved, per artifact per user)
  saveLastAppliedFilters(artifactId: string, userId: string, filterValues: Record<string, unknown>): Promise<void>;
  loadLastAppliedFilters(artifactId: string, userId: string): Promise<Record<string, unknown> | null>;

  // Personal alerts
  savePersonalAlert(alert: PersonalAlert): Promise<void>;
  listPersonalAlerts(userId: string): Promise<PersonalAlert[]>;
  deletePersonalAlert(alertId: string): Promise<void>;

  // Roles (for preview-as-viewer)
  listAvailableRoles(): Promise<string[]>;

  // Conflict detection
  getArtifactVersion?(id: string): Promise<number>;
}
```

### 3.3 MeasureRegistryAdapter

Editor-only. Provides the curated list of admin-defined KPIs and metrics
available to editor users. Not needed by workspace (has direct access) or
viewer (no editing).

```typescript
interface MeasureRegistryAdapter {
  getAvailableMeasures(dataSourceId: string): Promise<MeasureDefinition[]>;
  getAvailableKPIs(dataSourceId: string): Promise<KPIDefinition[]>;
}
```

### 3.4 AlertChannelAdapter

Optional. Receives alert events when conditions are met. The consumer app
implements delivery (email, Slack, push notification). The workspace
evaluates conditions and fires events only.

```typescript
interface AlertChannelAdapter {
  onAlertFired(event: AlertEvent): void;
}

interface AlertEvent {
  ruleId: string;
  ruleName: string;
  condition: string;
  currentValue: unknown;
  threshold: unknown;
  status: 'warning' | 'critical';
  subscribers: AlertSubscriber[];
  timestamp: number;
}
```

### 3.5 HelpConfig

Configurable help system. The consumer app provides content for contextual
help. The workspace provides hook points (contextId per screen/panel).

```typescript
interface HelpConfig {
  getHelpContent(contextId: string): Promise<HelpEntry | null>;
  helpBaseUrl?: string;
  supportUrl?: string;
}

interface HelpEntry {
  title: string;
  body: string;       // HTML or markdown
  links?: { label: string; url: string }[];
}
```

### 3.6 AttentionAdapter

Consumer app provides external attention items that merge with
workspace-generated items.

```typescript
interface AttentionAdapter {
  getExternalItems(context?: ViewerContext): Promise<AttentionItem[]>;
  acknowledgeItem?(itemId: string): Promise<void>;
}

interface AttentionItem {
  id: string;
  source: 'workspace' | 'external';
  priority: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
  actionLabel?: string;
  actionTarget?: string;     // artifact ID or URL
  timestamp: number;
  acknowledged: boolean;
}
```

### 3.7 UsageAnalyticsAdapter

Optional. Receives usage telemetry events when analytics is enabled by the
admin. The consumer app implements storage and can expose the stored data
as a data source for admin dashboards. See Section 16 for full event
catalog and activation details.

```typescript
interface UsageAnalyticsAdapter {
  trackEvent(event: UsageEvent): void;    // fire-and-forget, never blocks UI
  flush?(): Promise<void>;                // force-send buffered events
}

interface UsageEvent {
  type: UsageEventType;
  userId: string;
  timestamp: number;
  sessionId: string;
  artifactId?: string;
  artifactType?: string;
  metadata: Record<string, unknown>;
}
```

### 3.8 SubscriptionAdapter

Optional. Manages scheduled report/dashboard subscriptions. The consumer
app implements the actual scheduler and delivery. The workspace defines
what should happen and when. See Section 20 for subscription model details.

```typescript
interface SubscriptionAdapter {
  createSubscription(sub: ReportSubscription): Promise<ReportSubscription>;
  updateSubscription(sub: ReportSubscription): Promise<ReportSubscription>;
  deleteSubscription(id: string): Promise<void>;
  listSubscriptions(userId: string): Promise<ReportSubscription[]>;
  pauseSubscription(id: string): Promise<void>;
  resumeSubscription(id: string): Promise<void>;
}

interface ReportSubscription {
  id: string;
  userId: string;
  artifactId: string;
  artifactName: string;
  filterPresetId?: string;
  filterValues?: Record<string, unknown>;
  schedule: SubscriptionSchedule;
  deliveryMode: 'status-snapshot' | 'pre-run-report' | 'both';
  enabled: boolean;
}

interface SubscriptionSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;              // 0-6 for weekly
  dayOfMonth?: number;             // 1-28 for monthly
  timeOfDay: string;               // '08:00'
  timezone: string;
}
```

---

## 4. Widget System

### 4.1 Widget Type Inventory

| Widget Type | Morph Group | Expandable | Can Contain Children | Notes |
|---|---|---|---|---|
| bar-chart | category-chart | No | No | |
| line-chart | category-chart | No | No | |
| area-chart | category-chart | No | No | |
| pie-chart | category-chart | No | No | |
| kpi-card | single-value | Yes | No (expansion panel) | |
| gauge | single-value | Yes | No (expansion panel) | |
| scorecard | single-value | Yes | No (expansion panel) | |
| trend-line | single-value | Yes | No (expansion panel) | |
| grid | tabular | Yes | No | Row group expand/collapse |
| pivot-table | tabular | Yes | No | Row group expand/collapse |
| text-block | text | No | No | Rich text WYSIWYG editor |
| heading | text | No | No | Title only, larger font |
| drill-link | navigation | No | No | |
| decision-tree | decision | Yes | No (expansion panel) | New widget type |
| container-box | container | No | Yes (visual grouping) | New widget type |

15 widget types. 7 morph groups. Morphing only within the same group.

### 4.2 Morph Groups

| Group | Widget Types | Members |
|---|---|---|
| category-chart | bar-chart, line-chart, area-chart, pie-chart | 4 |
| single-value | kpi-card, gauge, scorecard, trend-line | 4 |
| tabular | grid, pivot-table | 2 |
| text | text-block, heading | 2 |
| navigation | drill-link | 1 (cannot morph) |
| decision | decision-tree | 1 (cannot morph) |
| container | container-box | 1 (cannot morph) |

### 4.3 Expansion Types

Two distinct expansion mechanisms exist:

**Detail panel expansion (single-value + decision-tree widgets):**
The widget grows inline, pushing dashboard content down. Below the original
content, admin-configured child widgets render. Child widgets inherit the
parent's data context (filters, data source). Child widgets cannot themselves
be expandable (no recursive nesting). The admin configures child widgets at
design time in the widget config panel's "Expansion Panel" section.

```typescript
interface ExpandableWidgetConfig {
  expandable: boolean;
  expandedHeight?: number;         // grid rows the expanded area occupies
  childWidgets: DashboardWidget[]; // configured like regular widgets
  inheritParentFilters: boolean;   // default true
  expandTrigger: 'click' | 'chevron-button';
}
```

**Row group expansion (tabular widgets):**
Grid and pivot-table widgets expand/collapse grouped rows. When column grouping
is applied, group header rows are collapsible. This uses the existing
GroupController in the grid package. The visual behavior is the same (inline
expansion, push down) but the mechanism is row-level, not widget-level.

---

## 5. Workspace Shell UX (Admin & Author)

### 5.1 Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [≡ collapse] Logo | Command palette (Ctrl+K)       │
│          Search...                    Save indicator | User  │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Sidebar   │  Main content area                              │
│  (240px    │                                                 │
│  or 56px   │  Content changes based on nav selection:        │
│  collapsed)│  - Catalog (default)                            │
│            │  - Report editor                                │
│  CONTENT   │  - Dashboard editor                             │
│  - Catalog │  - Explorer                                     │
│  - Explore │  - Data source detail                           │
│  - Dashb.  │  - Filter registry                              │
│  - Reports │  - Alert management                             │
│            │                                                 │
│  DATA      │                                                 │
│  - Sources │                                                 │
│  - Connect.│                                                 │
│            │                                                 │
│  GOVERN    │                                                 │
│  (admin)   │                                                 │
│  - Alerts  │                                                 │
│  - Permiss.│                                                 │
│  - Filters │                                                 │
│  - API     │                                                 │
│            │                                                 │
│  [◀ ▶]     │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

**Sidebar behavior:** Collapsible to icon-only (56px). Toggle via bottom
button or `Ctrl+\`. Collapsed state shows section icons and nav item icons.
Hover reveals label as tooltip. Click navigates directly without expanding.
Collapse preference persisted per admin via PersistenceAdapter user preference.

Author role sees CONTENT and DATA sections only — no GOVERN.

**Responsive breakpoints (existing infrastructure):**
- Desktop (>1280px): sidebar full width
- Laptop (1024-1280px): sidebar icon-only by default
- Tablet (768-1024px): sidebar overlay with hamburger toggle
- Mobile (<768px): sidebar hidden, bottom tab bar

### 5.2 Header Bar

- Left: sidebar collapse toggle, application logo/name
- Center: command palette trigger (Ctrl+K) or search input
- Right: save indicator, notification badge (attention items), user menu

**Save indicator states:**
- "Saved" — green dot, steady state
- "Saving..." — animated indicator during auto-save round-trip
- "Unsaved changes" — amber dot, appears when state becomes dirty

**Error handling:** Save failures surface as toast notifications with error
message and "Retry" action. Persistent indicator shows "Unsaved changes"
while toast provides detail.

**Conflict handling:** If two admins edit the same artifact, second save
surfaces a conflict toast: "This artifact was modified by [admin] at [time].
Reload to see their changes, or force save to overwrite." This is a
PersistenceAdapter concern — it returns a conflict signal.

### 5.3 Command Palette (Ctrl+K)

A search overlay that searches across artifacts (by name), navigation items
(sidebar destinations), and actions (create, publish, etc.). Keyboard-first
admins can jump directly to any artifact or section without using the mouse.

Typing filters results in real time. Enter opens the selected result.
Escape closes the palette.

### 5.4 Keyboard Shortcuts

**Global:**

| Shortcut | Action |
|---|---|
| Ctrl+S / Cmd+S | Force save |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z / Cmd+Shift+Z | Redo |
| Ctrl+K / Cmd+K | Open command palette |
| Ctrl+\ / Cmd+\ | Toggle sidebar collapse |
| Escape | Close current panel / modal |

**Catalog:**

| Shortcut | Action |
|---|---|
| / | Focus search input |
| Enter | Open selected artifact |
| Delete | Delete selected artifact (with confirmation) |
| Ctrl+D / Cmd+D | Duplicate selected artifact |

**Dashboard editor:**

| Shortcut | Action |
|---|---|
| Ctrl+Shift+P | Toggle preview-as-viewer mode |
| Delete / Backspace | Remove selected widget |
| Ctrl+D / Cmd+D | Duplicate selected widget |
| Arrow keys | Nudge selected widget on grid |

**Report editor:**

| Shortcut | Action |
|---|---|
| Ctrl+Shift+P | Toggle preview mode |
| [ / ] | Toggle config panel open/closed |

### 5.5 Catalog UX

**Layout:** Dense table view by default, switchable to card view via toggle.

**Table columns:** Name, Type (icon + label), Status (draft/review/published),
Category (admin-assigned), Last Updated, Created, Author.

**Toolbar:** Search input (real-time filter by name and description), sort
dropdown (updated date / created date / name / type / status), view toggle
(table/card), "Create New" dropdown button.

**"Create New" dropdown:** Lists artifact types — Dashboard, Report, Grid,
KPI, Metric. Selecting a type enters the creation wizard.

**Context scoping:** The catalog shows only artifacts belonging to the current
context. Categories within the catalog are admin-assigned tags for secondary
grouping within a context.

**No bulk actions.** One-at-a-time operations via right-click or action menu
per row.

**Catalog tabs:** My Work, Shared, Published. Same as existing but rendered
as table rows, not cards.

**Review queue:** Not a separate view. Admin filters catalog by status =
"Review" to see artifacts awaiting review.

### 5.6 Creation Wizard

Simplified from 5 steps. Triggered by "Create New" dropdown on catalog toolbar.

**Dashboard creation (3 steps):**
1. Type (already selected from dropdown)
2. Choose data source (context-scoped list from DataAdapter)
3. Choose template (5-15 template cards with preview thumbnails, or "Blank")

Then straight into the dashboard editor. No configure step, no review step.

**Report creation (2 steps):**
1. Type (already selected from dropdown)
2. Choose data source (context-scoped)

Reports skip the template step. Straight into the report editor.

**Other types (Grid, KPI, Metric):** Type selected, data source selected,
straight into the relevant editor.

The CreationFlowState state machine simplifies: type -> source -> template
(dashboards only) -> editor.

### 5.7 Report Editor UX

```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar: ← Back | Undo Redo | Save indicator | Publish     │
├──────────────────────────────────┬───────────────────────────┤
│                                  │  Config Panel [×]         │
│  Live grid preview               │  ┌───────────────────────┐│
│  (full width when panel closed)  │  │ Columns│Filters│Style ││
│                                  │  ├───────────────────────┤│
│                                  │  │ [Search columns]      ││
│                                  │  │ [Show all] [Hide all] ││
│                                  │  │ ☐ Column 1         ⋮  ││
│                                  │  │ ☐ Column 2         ⋮  ││
│                                  │  │ ...30+ items          ││
│                                  │  │                       ││
│                                  │  │ ▸ Conditional Format  ││
│                                  │  │   (per selected col)  ││
│                                  │  └───────────────────────┘│
└──────────────────────────────────┴───────────────────────────┘
```

**Config panel:** Toggle via button, starts open. Close gives full-width
grid preview.

**Columns tab (30+ column support):**
- Search/filter within column list (type to find by name)
- Bulk visibility toggles (show all / hide all, then selectively toggle)
- Column grouping within list (by data type or source entity)
- Drag reorder plus "move to position" option for large lists
- Conditional formatting as a subsection that expands when a column is selected

**Right-click column header:** Sort, Group, Pin, Hide, Filter, Conditional
Formatting. Same right-click on cells: Copy, Filter by value, Exclude.

### 5.8 Dashboard Editor UX

```
┌──────────────────────────────────────────────────────────────────┐
│  Toolbar: ← Back | Undo Redo | Save | Publish | [Preview as ▾] │
├────────────┬─────────────────────────────────┬───────────────────┤
│ Field      │  Canvas (freeform, snap-to-grid) │  Config Panel [×] │
│ Palette    │                                 │  Data│Style       │
│            │  ┌─────┬─────┬─────┐            │                   │
│ [Search]   │  │ KPI │ KPI │chart│            │  (appears when    │
│ ▸ Numbers  │  ├─────┴─────┤     │            │   widget selected)│
│ ▸ Dates    │  │  table    │     │            │                   │
│ ▸ Text     │  │           ├─────┤            │                   │
│            │  │           │gauge│            │                   │
│ Widget     │  └───────────┴─────┘            │                   │
│ Palette    │  (scrolls vertically)           │                   │
└────────────┴─────────────────────────────────┴───────────────────┘
```

**Canvas grid:**
- Freeform positioning with snap-to-grid
- Column count configurable per dashboard (default 12, admin can change)
- Unlimited rows — dashboard scrolls vertically
- Widget positions stored as `{ col, row, colSpan, rowSpan }`
- Virtualization for 20+ widgets (off-screen widgets show placeholders)

**Field palette (left):** Shows enriched fields from data source, grouped by
admin-defined field groups (or by data type as fallback). Drag onto canvas to
create a widget. Fields use admin-provided labels and descriptions.

**Widget palette (left, below field palette):** Palette of widget types to
drag onto canvas.

**Config panel (right):** Appears when a widget is selected. Two tabs: Data
and Style. Widget-level filters available for admin/author (not editor).

**Navigation links:** Configured as a subsection at the bottom of the Data
tab when a widget is selected. "Add drill-through link" opens the navigation
link builder:
1. Target picker (browse artifacts in context)
2. Filter mapping with auto-suggest based on shared FilterDefinitions
3. Open behavior picker (slide-over / same-panel / new-tab, per link)
4. Label input

**Dashboard settings:** Accessible via a settings icon in the toolbar. Includes
grid column count configuration.

**Preview-as-viewer mode:** Toggle in toolbar. Hides palettes and config panel.
Applies filter constraints and security bindings. Context picker dropdown:
pick from list of known roles + enter specific user ID. The DataAdapter is
called with the simulated viewer context.

### 5.9 Filter Administration UX

**Two surfaces for filter management:**

**Central filter registry (GOVERN > Filters):**

Table/list of all FilterDefinition entries in the current context.

List columns: Name, Filter Type (select/multi-select/date-range/numeric-range),
Data Source, Bound to (dashboard count), Has Security Binding, Rules (count).

Actions per row: Edit, Duplicate, Delete (warning if bound to dashboards).

**Dashboard editor filter binding (from dashboard editor toolbar):**

Shows which FilterDefinitions are bound to this dashboard. Admin can:
- Bind existing definitions from the central registry
- Create new inline (pre-fills data source from dashboard, saves to registry
  and binds simultaneously)
- Configure per-dashboard binding: required vs optional, query layer
  (server/client), position in filter bar

Binding list is orderable (drag to set filter bar display order).

**FilterDefinition editor (same component, two mount points):**

- Name, description
- Filter type picker
- Value source configuration (static list, data source field, dependent filter)
- Default value (static, relative date, viewer attribute)
- Security binding (viewer attribute, restriction type)
- Filter rules (expression editor)

**Expression editor:**

Primary mode: structured expression builder. Admin builds expressions from
dropdowns and inputs. Each segment (field, operator, value) is a dropdown or
input. The assembled expression is visible as text.

Escape hatch: raw text mode for complex expressions. Toggle between structured
and raw. Syntax validation and autocomplete in raw mode.

**Filter rule testing:** Uses the same preview-as-viewer context picker.
Admin selects a role or enters a user ID, and the filter rule engine resolves
the rules against that context, showing the resulting filter state.

**Security binding:** Editable from both the central registry and the
dashboard editor. Same component in both locations.

### 5.10 Alert Administration UX

Admin-only (GOVERN > Alerts).

**Alert list:** Table of all alert rules in current context. Columns: Name,
Trigger Type (threshold/expression), KPI/Metric, Status (active/paused),
Subscribers (count), Last Fired.

**Create/edit alert rule — two modes:**

**Simple threshold mode:**
Pick KPI or metric → set operator (above/below/equals/change-by-%) → set
threshold value → set evaluation frequency (every refresh / hourly / daily).

**Advanced expression mode:**
Same structured expression builder as filter rules, with alert-specific
variables (current value, previous value, % change, rolling average). Raw
text escape hatch.

**Subscription management (within alert rule editor):**
- Admin-pushed subscribers: pick users or roles
- Self-subscribe flag: toggle whether alert appears in viewer/editor catalog
  for user opt-in
- Current subscribers list showing source (admin-pushed vs self-subscribed)

**Event delivery:**
Alert fires an event through AlertChannelAdapter. Event includes: rule ID,
trigger condition, current value, threshold/expression result, subscriber
list, timestamp. Consumer app handles transport.

### 5.11 Publish Workflow UX

**Review is optional.** Admin can publish directly from draft or route through
review. Configurable per context.

**Publish from editor toolbar:**
- If review not configured: "Publish" button, goes straight to published
- If review configured: "Submit for Review" button for authors/admins,
  separate "Publish" for reviewing admin

**Publish from catalog:**
Right-click or action menu on artifact row. Same options: Publish, Submit
for Review, Approve/Reject (if status is review), Unpublish.

**Publish history:**
`PublishState` machine tracks from/to/at/by. Surfaces as a timeline in the
artifact detail panel. Accessible for audit, not prominent.

### 5.12 Data Source Configuration UX

Hybrid model: DataAdapter provides available sources, workspace adds metadata.

**Data source list (DATA > Data Sources):**

Table of all data sources in current context (from DataAdapter).
Columns: Name, Description (admin-editable), Field Count, Used By (artifact
count), Last Refreshed.

Admin cannot add/remove sources (consumer app's job). Admin can enrich.

**Data source detail view:**

Two-panel layout:
- Left: Field metadata list with search. Each field shows raw name, admin
  label, data type, semantic hint, group assignment.
- Right: Data preview (sample table, 50-100 rows from
  DataAdapter.getPreviewData()).

**Field metadata editor (per field):**

| Setting | Description |
|---|---|
| Label | Human-readable name ("Revenue" for raw `rev_amt`) |
| Description | Business meaning of the field |
| Semantic hint | measure / dimension / currency / percentage / identifier / date-time / boolean |
| Field group | Admin-defined group name ("Financial", "Customer", "Product") |
| Format hint | Number format, date format, currency symbol |

Field enrichments are persisted via PersistenceAdapter.saveFieldEnrichment().
When other components need field metadata, they merge raw FieldMetadata from
DataAdapter with admin enrichments using mergeFieldMetadata().

---

## 6. Viewer Shell UX

### 6.1 Two Modes

The viewer package exports both a full shell and individual components.

**Full shell mode:** `<phz-viewer>` mounts as a complete application shell
with optional header, catalog, dashboard viewer, explorer — all internally
routed.

```typescript
<phz-viewer
  dataAdapter={adapter}
  persistenceAdapter={persistence}
  viewerContext={context}
  showHeader={true}           // optional header
  initialRoute="catalog"      // or "artifact:dashboard-123"
/>
```

**Component mode:** The consumer app mounts individual viewer components
wherever it wants. Each component is self-contained.

```typescript
<phz-dashboard-view artifactId="dash-123" dataAdapter={adapter} ... />
<phz-report-view artifactId="rpt-456" dataAdapter={adapter} ... />
<phz-catalog-view dataAdapter={adapter} persistenceAdapter={persistence} ... />
<phz-explorer-view dataSourceId="sales" dataAdapter={adapter} ... />
```

In component mode, the consumer app handles routing, navigation, layout,
favorites, and landing page. The workspace components render content only.

The consumer app owns the first view (landing page), favorites/pinning, and
top-level navigation. These are consumer-app concerns, not workspace concerns.

### 6.2 Viewer Header (Optional)

When `showHeader={true}` in full shell mode:

```
┌──────────────────────────────────────────────────────────────┐
│  Logo | Search...                    Notifications | User    │
└──────────────────────────────────────────────────────────────┘
```

Search: real-time artifact search. Notifications: attention item badge +
dropdown (personal alerts, async reports, subscription snapshots).
User: menu with personal settings.

In component mode, no header — consumer app provides its own.

### 6.3 Catalog Screen

Full shell mode or `<phz-catalog-view>`:

```
┌──────────────────────────────────────────────────────────────┐
│  Published    My Work    Exports    Subscriptions             │
│  ─────────                                                   │
│  [Search artifacts...]                                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Sales    │  │ Revenue  │  │ Ops      │  │ Q1       │    │
│  │ Overview │  │ Trends   │  │ Monitor  │  │ Report   │    │
│  │ 2h ago   │  │ 1d ago   │  │ 5m ago   │  │ 3d ago   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**Tabs:**
- Published: cards of published artifacts
- My Work: personal copies, personal views, filter presets, personal alerts
- Exports: async report history (Section 14)
- Subscriptions: active subscriptions with schedule and status (Section 20)

**Card actions:** Click to open. Right-click/long-press: Duplicate, Subscribe,
Create Personal Alert (on KPI artifacts).

### 6.4 Dashboard View Screen

`<phz-dashboard-view>`:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Dashboard: Sales Overview                         │
│                                    [Subscribe] [Export]       │
├──────────────────────────────────────────────────────────────┤
│  Filter bar:                                                 │
│  Region [North ▾ ⚙]  Date [Last 30 days ▾ ⚙]  Status [▾ ⚙] │
│  [Reset]  [Load Preset ▾]  [Save Preset]                    │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┐                  │
│  │ Revenue │ Margin  │ Orders  │ Churn   │  expandable KPIs │
│  │ $4.2M   │ 32%     │ 12,400  │ 4.8%    │                  │
│  └─────────┴─────────┴─────────┴─────────┘                  │
│  ┌────────────────────┐  ┌────────────────────┐              │
│  │ Revenue by Region  │  │ Decision Tree  ●   │              │
│  │ [bar chart]        │  │ ● Revenue     ▸    │              │
│  │ [Explore ▸]        │  │ ○ Customers        │              │
│  └────────────────────┘  └────────────────────┘              │
│  ┌─────────────────────────────────────┐                     │
│  │ Transaction Detail     [CSV] [XLSX] │                     │
│  │ [sortable grid]        [Explore ▸]  │                     │
│  └─────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

**Data access:** The viewer has access to all fields, metrics, and KPIs in
the dataset — not just what the admin chose to display in this dashboard.
Personal views can reference any available field. The explorer exposes the
full dataset. The dashboard layout is one view; the user's access is broader.

**Filter bar elements:**
- Each filter has a ⚙ gear icon opening value handling options (nulls,
  orphans, select-all, invert — per admin's allow settings)
- Reset button: clears last-applied state, loads admin defaults
- Load Preset dropdown: saved presets
- Save Preset: saves current values + value handling toggle states

**Widget interactions:**
- KPI cards: click to expand (child widgets configured by admin)
- Charts: click data points for drill-through
- Decision tree: click nodes to drill, expand/collapse branches
- Grids: sort, filter columns, "Explore" to open explorer in new tab
- View groups: toggle/arrow buttons to switch between views
- Container boxes: visual grouping, no interaction

### 6.5 Report View Screen

`<phz-report-view>`:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Report: Q1 Sales Detail                           │
│  [Subscribe] [Run in Background] [CSV] [XLSX] [PDF]          │
├──────────────────────────────────────────────────────────────┤
│  Filter bar: [same as dashboard]                             │
├──────────────────────────────────────────────────────────────┤
│  [Full-width grid with sortable columns]                     │
│  Right-click headers: Sort, Group, Filter, Hide              │
│                                                              │
│  Showing 1-50 of 24,832 rows     [Explore this data ▸]      │
└──────────────────────────────────────────────────────────────┘
```

"Run in Background" visible only if async enabled (Section 14).
Export buttons: admin-configured formats (Section 12.7).
Pagination for server-side mode, virtual scroll for client-side.

### 6.6 Explorer Screen

`<phz-explorer-view>` — opens in a new tab/view within the shell:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Explorer: sales_transactions                      │
│                                     [Save as Report] [Export]│
├──────────┬───────────────────────────────────────────────────┤
│ Field    │  Rows:    [region] [product]                      │
│ Palette  │  Columns: [quarter]                               │
│          │  Values:  [revenue (sum)] [cost (avg)]            │
│ [Search] │  Filters: [year = 2026]                           │
│ ▸ Numbers│  ─────────────────────────────────────────────    │
│ ▸ Text   │  Result: [bar chart / table based on              │
│ ▸ Dates  │           suggestChartType()]                     │
│          │                                                   │
│ [Undo]   │  Suggestion: bar chart                           │
│ [Redo]   │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

Drag fields, build queries, see results. Save as personal report or export.
If viewer has editor role: also add as widget to personal dashboard.

### 6.7 Attention Items Dropdown

Header notification badge → dropdown panel:

```
┌──────────────────────────────────────┐
│  Notifications                    ✕  │
│  ● Revenue below threshold   2m ago  │
│    South revenue below $500K         │
│    [Open Dashboard]                  │
│  ● Report ready              1h ago  │
│    Q1 Sales Detail (Excel)           │
│    [Download]                        │
│  ○ Weekly snapshot           8h ago   │
│    Sales Overview: Revenue $4.2M     │
│    [Open Dashboard]                  │
│  [View all] [Mark all read]          │
└──────────────────────────────────────┘
```

### 6.8 Local Mode

When `localModeEnabled = true`, viewer can upload local files (CSV, Excel)
and explore in-browser via DuckDB-WASM. Uses existing LocalDataStore,
FileUploadManager infrastructure. Same explorer UI, local data source.

### 6.9 Mobile Behavior

On mobile (<768px): bottom tab bar. In full shell mode, tabs are Catalog
and Dashboards. In component mode, consumer app owns mobile navigation.

Dashboard view on mobile: filter bar collapses to vertical layout, widgets
stack vertically, container queries apply compact/minimal classes, bottom
sheet for detail panels.

---

## 7. Editor Shell UX

### 7.1 What the Editor Is

The editor is a powered-up viewer. It is structurally closer to the viewer
than to the workspace. It can: duplicate published dashboards, edit personal
copies with constraints, share with named users, and use the explorer.

It cannot: create from blank, define KPIs, define filters, define data
sources, publish, configure drill-through, or touch governance.

### 7.2 Two Modes (Same as Viewer)

Like the viewer, the editor supports both full shell mode and component mode.

**Full shell mode:** `<phz-editor>` mounts as a complete application shell
with optional header, sidebar, catalog, editor views — all internally routed.

```typescript
<phz-editor
  dataAdapter={adapter}
  persistenceAdapter={persistence}
  measureRegistry={registry}
  viewerContext={context}       // required
  showHeader={true}
  initialRoute="catalog"
/>
```

**Component mode:** Consumer app mounts individual editor components.

```typescript
<phz-editor-dashboard artifactId="dash-123" ... />
<phz-editor-catalog ... />
<phz-explorer-view dataSourceId="sales" ... />
```

In component mode, the consumer app handles routing, navigation, and layout.
The editor components render content only.

### 7.3 Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Optional header: Search...        Notifications | User]    │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│  Slim    │  Main content area                                │
│  sidebar │                                                   │
│  (two    │  Content changes based on nav selection            │
│  sections│                                                   │
│  only)   │                                                   │
│          │                                                   │
│  MY WORK │                                                   │
│  EXPLORE │                                                   │
│          │                                                   │
│  [◀ ▶]   │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

**Sidebar:** Two nav items only. No DATA, no GOVERN. Collapsible to
icon-only (same mechanism as workspace sidebar). On mobile, collapses to
bottom tab bar with My Work and Explore tabs.

**Header (optional):** Same as viewer header — search, notification badge,
user menu. Consumer app can provide its own header instead.

### 7.4 Props

```typescript
interface PhzEditorProps {
  dataAdapter: DataAdapter;
  persistenceAdapter: PersistenceAdapter;
  measureRegistry: MeasureRegistryAdapter;  // required, editor-specific
  viewerContext: ViewerContext;              // required (not optional)
  attentionAdapter?: AttentionAdapter;
  usageAnalyticsAdapter?: UsageAnalyticsAdapter;
  subscriptionAdapter?: SubscriptionAdapter;
  helpConfig?: HelpConfig;
  theme?: string;
  localModeEnabled?: boolean;
  showHeader?: boolean;                     // default true in shell mode
}
```

`viewerContext` is required because the editor needs user identity for
sharing, catalog filtering, and personal alert scoping.

### 7.5 Catalog Screen

```
┌──────────────────────────────────────────────────────────────┐
│  Published    My Work    Exports    Subscriptions             │
│  ─────────                                                   │
│  [Search artifacts...]                                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Sales    │  │ Revenue  │  │ Ops      │  │ Q1       │    │
│  │ Overview │  │ Trends   │  │ Monitor  │  │ Report   │    │
│  │ [Duplicate]│ [Duplicate]│ [Duplicate]│ [Open]     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**Tabs:**
- Published: published artifacts with "Duplicate" as primary action (not
  "Open" — the editor's relationship with published artifacts is to copy
  and customize, not just view)
- My Work: personal copies, shared-with-me artifacts, filter presets,
  personal alerts
- Exports: async report history (same as viewer)
- Subscriptions: active subscriptions (same as viewer)

No "Shared" tab. Artifacts shared with the editor user via user-list
sharing appear in My Work.

**Actions on published cards:**
- Click to view (read-only, same as viewer)
- "Duplicate" button on card (prominent — this is the editor's primary action)
- Right-click: Duplicate, Subscribe, Create Personal Alert

**Actions on My Work cards:**
- Click to open (enters edit mode for personal copies)
- Right-click: Edit, Share, Delete, Subscribe

### 7.6 Dashboard View / Edit Screen

When the editor opens a published dashboard, they see the viewer experience
(read-only). When they open a personal copy from My Work, they see the
constrained editor.

**Viewing a published dashboard (read-only):**

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Dashboard: Sales Overview (Published)             │
│                               [Duplicate to My Work] [Subscribe]│
├──────────────────────────────────────────────────────────────┤
│  Filter bar: [same as viewer — interact, save presets]       │
├──────────────────────────────────────────────────────────────┤
│  [Dashboard renders identically to viewer]                   │
│  All viewer interactions available (drill, expand, filter)   │
│  No editing controls                                         │
└──────────────────────────────────────────────────────────────┘
```

"Duplicate to My Work" is the bridge from viewing to editing. Creates a
personal copy and opens it in edit mode.

**Editing a personal copy:**

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back  | Undo Redo | Save indicator | [Share] [Subscribe]     │
├────────────┬─────────────────────────────────┬───────────────────┤
│ Measure    │  Canvas (same freeform grid     │  Config Panel [×] │
│ Registry   │  as workspace editor)           │  Data│Style       │
│            │                                 │                   │
│ [Search]   │  ┌─────┬─────┬─────┐           │  (appears when    │
│            │  │ KPI │ KPI │chart│           │   widget selected)│
│ Measures   │  ├─────┴─────┤     │           │                   │
│ ├ Revenue  │  │  table    │     │           │  Data tab shows   │
│ ├ Cost     │  │           ├─────┤           │  measures from    │
│ ├ Margin   │  │           │gauge│           │  registry, not    │
│ └ Units    │  └───────────┴─────┘           │  raw fields       │
│            │                                 │                   │
│ KPIs       │  (scrolls vertically)          │  Style tab: full  │
│ ├ Rev Grwth│                                 │  styling control  │
│ ├ CAC      │                                 │                   │
│ └ NPS      │                                 │                   │
│            │                                 │                   │
│ Widget     │                                 │                   │
│ Palette    │                                 │                   │
└────────────┴─────────────────────────────────┴───────────────────┘
```

**Left palette — Measure Registry (not raw fields):**

The editor's field palette is replaced by the MeasureRegistryAdapter output.
Two sections: Measures (admin-defined measures like Revenue, Cost, Margin)
and KPIs (admin-defined computed metrics like Revenue Growth QoQ, CAC, NPS).
The editor user drags from these lists. The admin has already translated raw
fields into business concepts.

A search bar at the top filters the measure/KPI list. Measures and KPIs
show their descriptions (from admin enrichment) on hover.

**Config panel — two tabs only:**

**Data tab:** When a widget is selected, the Data tab shows the widget's
current measure/KPI bindings. The editor picks from the registry, not from
raw data source fields. Dimensions (categories for grouping) are also
drawn from the registry — the admin defines which fields are available as
dimensions.

**Style tab:** Full styling control — colors, legend position, label
formatting, density, title, subtitle. Same as workspace style tab.

**No Filters tab:** Widget-level filters are admin/author only. The editor
works with dashboard-level filters (apply and save presets) but cannot add
per-widget filter conditions.

**Allowed editing actions:**
- Add widgets from measure registry (drag from palette)
- Remove widgets from personal copy (Delete key or right-click)
- Rearrange widgets on canvas (drag to reposition)
- Resize widgets (drag edges)
- Morph widgets (right-click → Morph To, same group rules)
- Change widget style (full Style tab)
- Place container boxes (visual grouping)
- Switch widget views (if view groups exist on duplicated widgets)
- Undo/redo all changes

**Not allowed:**
- Widget-level filters
- Drill-through link configuration
- Decision tree node editing (can expand/view, not reconfigure conditions)
- Expandable widget child configuration (can expand, not change children)
- Data source configuration
- Dashboard data config (preload/fullLoad/sources)
- Grid column count changes

### 7.7 Report View Screen

The editor can view reports but has limited editing compared to workspace.

**Viewing a published report:**

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Report: Q1 Sales Detail (Published)               │
│                    [Duplicate to My Work] [Subscribe] [Export]│
├──────────────────────────────────────────────────────────────┤
│  Filter bar: [same as viewer]                                │
├──────────────────────────────────────────────────────────────┤
│  [Full-width grid, read-only interaction]                    │
│  Sort, filter columns, personal view save — all viewer       │
│  capabilities                                                │
│                                                              │
│  Showing 1-50 of 24,832 rows     [Explore this data ▸]      │
└──────────────────────────────────────────────────────────────┘
```

**Editing a personal copy of a report:**

The editor can adjust column visibility, order, and widths on their
personal copy. They can add columns from the dataset (the full dataset,
not just what the admin displayed — consistent with Section 22.1). They
cannot add conditional formatting rules or configure grouping.

The editing is inline — no separate config panel. The editor right-clicks
column headers to show/hide columns, drag-reorders headers directly, and
resizes by dragging column borders. Changes auto-save as a personal view.

### 7.8 Explorer Screen

Same as viewer explorer (Section 6.6) with one additional capability:
the editor can save an exploration as a widget on a personal dashboard
via `exploreToDashboardWidget()`.

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    Explorer: sales_transactions                      │
│            [Save as Report] [Add to Dashboard] [Export]       │
├──────────┬───────────────────────────────────────────────────┤
│ Field    │  [Same explorer layout as viewer]                 │
│ Palette  │                                                   │
│          │  Drag fields, build queries, see results          │
└──────────┴───────────────────────────────────────────────────┘
```

"Add to Dashboard" opens a picker listing the editor's personal dashboards.
Selecting one adds the current exploration as a new widget on that dashboard.

### 7.9 Sharing Flow

```
┌──────────────────────────────────────┐
│  Share: Sales Overview (My Copy)      │
│                                      │
│  Share with:                         │
│  [Search users by name or email...]  │
│                                      │
│  ☑ Alice Chen (alice@company.com)    │
│  ☑ Bob Park (bob@company.com)        │
│                                      │
│  [Share]  [Cancel]                   │
└──────────────────────────────────────┘
```

User picker searches by name or email. No role selection — the editor
shares with specific individuals only. Selected users are stored as
`{ type: 'users', userIds: string[] }`. Visibility transitions from
personal to shared. Receiving users see the artifact in their My Work tab.

The editor can revoke sharing by opening the share panel again and
removing users. The artifact remains in the editor's My Work regardless.

### 7.10 Personal Alerts & Subscriptions

Same as viewer. The editor creates personal alerts from KPI widgets
(right-click → Create Alert) or from My Work. Subscriptions via the
Subscribe button on dashboards and reports. All viewer-facing features
from Sections 19 and 20 apply identically.

### 7.11 Attention Items

Same dropdown as viewer (Section 6.7). Personal alerts, async report
completions, subscription snapshots, admin-pushed items. Each with action
link.

### 7.12 State Machine Reuse

**AuthoringState:** Reused. `startCreation` is never called. Mode union
for editor: `'home' | 'viewing' | 'editing-dashboard' | 'editing-report'`.
No `'creating'` mode.

**DashboardEditorState:** Reused with constrained field palette (measure
registry picker replaces raw field list). Widget-level filter operations
are disabled.

**CatalogState:** Reused with `catalogMode: 'editor'` — Published tab
shows "Duplicate" as primary action.

**PublishState:** Not used. Editor artifacts stay personal or
shared-with-users.

**CreationFlowState:** Not used. No wizard. Entry to editing is always
through duplication.

### 7.13 Mobile Behavior

On mobile (<768px): sidebar collapses to bottom tab bar (My Work, Explore).
Dashboard editing on mobile is limited — the canvas is view-only on phone
screens. The config panel opens as a bottom sheet. Widget rearrangement
requires tablet or larger.

On tablet (768-1024px): sidebar becomes an overlay. Dashboard editing works
with the measure palette as a collapsible panel. Config panel slides from
right.

---

## 8. Context Scoping

### 8.1 What a Context Is

The consumer app defines contexts — business domains, departments, product
lines, or any organizational structure. When an admin works in a context,
they see only data sources, KPIs, metrics, and artifacts belonging to that
context.

The workspace does not define what a context is. It receives context
information through `viewerContext` and passes it to adapters. The adapters
(DataAdapter, PersistenceAdapter) use it to scope their results.

### 8.2 Architectural Pattern

`viewerContext` is already an opaque `unknown` type, passed through to
adapters. In the new model, it becomes load-bearing for:

- Catalog scoping (PersistenceAdapter.listArtifacts filters by context)
- Data source availability (DataAdapter.getAvailableSources filters by context)
- KPI/metric visibility (MeasureRegistryAdapter filters by context)
- Filter definition scoping (PersistenceAdapter returns context-scoped filters)
- Alert rule scoping

The workspace does not inspect viewerContext. It passes it through. The
consumer app's adapter implementations use it to scope results.

### 8.3 Context Switching

Context selection happens before the workspace renders, or via a context
switcher in the consumer app's UI (above/outside the workspace shell).
The workspace receives the current context as part of `viewerContext`.

If the consumer app needs a context switcher inside the workspace header,
it can use the workspace's slot/extension point mechanism to inject a
component into the header region.

---

## 9. Decision Tree Widget

### 9.1 Overview

A dashboard widget type that evaluates a set of data conditions in a
hierarchical structure and renders them as a status tree. Each node shows
healthy/warning/critical based on live data. Nodes can have drill-through
links to other dashboards, reports, or detail panels.

### 9.2 Node Structure

```typescript
interface DecisionTreeNode {
  id: string;
  label: string;
  condition: Expression;          // same expression engine as filter rules
  thresholds: {
    warning?: number | Expression;
    critical?: number | Expression;
  };
  alertRuleBinding?: string;      // optional: bind to an alert rule ID
  drillLink?: NavigationLink;     // optional: drill-through on click
  children?: DecisionTreeNode[];  // nested nodes
  displayValue?: string;          // format string for the current value
}
```

### 9.3 Rendering

```
┌─────────────────────────────────────┐
│  Operations Status                  │
│                                     │
│  ● Revenue          $4.2M  ▸       │
│    ○ North           ↑ 8%          │
│    ● South           ↓ 12%  ▸      │
│    ○ East            ↑ 3%          │
│                                     │
│  ○ Customer Health   NPS 72        │
│                                     │
│  ● Inventory         3 alerts  ▸   │
│    ● Low Stock       12 SKUs  ▸    │
│    ○ Overstock       2 SKUs        │
└─────────────────────────────────────┘

● = critical/warning    ○ = healthy    ▸ = has drill-through
```

Collapsible branches. Compact by default, viewer expands branches.

### 9.4 Expansion Support

The decision tree widget supports the detail panel expansion mechanism.
When expanded, admin-configured child widgets render below the tree, showing
detail relevant to the selected node. Expansion inherits the tree's data
context.

### 9.5 Integration

- Conditions use the expression engine from filter rules/alerts
- Drill links are NavigationLinks with filter mappings
- Alert breaches can feed node status (bind alert rule ID to node)
- Data flows through DashboardDataPipeline
- Responsive: at narrow widths, tree flattens to critical/warning nodes only

### 9.6 Authoring (Admin, in widget config panel Data tab)

Structured list editor:
1. "Add root node" button
2. Per node: label, condition expression (structured builder + raw escape),
   thresholds (warning/critical values), optional alert rule binding,
   optional drill link (target picker + filter mapping)
3. Indent to create children (drag to nest/unnest)
4. Live preview of current status per node

---

## 10. Expandable Widgets & Smart Boxes

### 10.1 Expandable Widgets

**Supported types:** kpi-card, gauge, scorecard, trend-line, decision-tree
(detail panel expansion), grid, pivot-table (row group expansion).

**Detail panel expansion behavior:**
- Widget grows inline, pushes dashboard content down
- Admin-configured child widgets render in expanded area
- Child widgets inherit parent's data context
- No recursive nesting (children cannot be expandable)
- Smooth height transition animation, grid reflow animated
- Expand trigger: click or chevron button (configurable)

**Row group expansion (grid, pivot-table):**
- Grouped rows collapse/expand at group header
- Uses existing GroupController
- Same visual behavior (inline, push down)
- Not admin-configured at widget level — driven by grouping config

### 10.2 Container Box (Smart Box)

**Purpose:** Visual grouping element. Wraps other widgets with a styled
boundary. No data binding.

**Configuration (Style tab only):**

```typescript
interface ContainerBoxConfig {
  title?: string;
  titlePosition: 'top-left' | 'top-center' | 'top-right' | 'none';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;            // px
  borderRadius: number;           // px
  shadow: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding: number;                // 4px grid spacing scale
  opacity?: number;
}
```

**Behavior:**
- Renders as styled div behind children
- Children positioned relative to box bounds
- Box moves, children move with it
- Expandable widgets inside a box cause the box to grow
- No nesting (box cannot contain another box)
- Box occupies grid cells; children use a sub-grid within the box

### 10.3 Rich Text Widget

The text-block widget type gains a WYSIWYG rich text editor. Admin uses
it to add context, instructions, or annotations on dashboards.

Supports: bold, italic, links, bullet lists, images. Output renders as
formatted HTML within widget bounds. The heading widget is a simplified
variant (title only, larger font). Morphing between text-block and heading
is supported.

---

## 11. Attention & Notification System

### 11.1 Overview

A pervasive layer that aggregates signals (alerts, metric changes, pending
reviews, stale artifacts) and presents a prioritized view of what needs
attention. Accessible from three locations:

1. **Header badge:** Notification count in header bar, dropdown panel on click
2. **Sidebar nav item:** CONTENT > Attention (in workspace)
3. **Dashboard widget:** Placeable as an attention summary widget on dashboards

### 11.2 Attention Sources

**Workspace-generated items (automatic):**
- Alert rule breaches (from AlertChannelAdapter events)
- Artifacts pending review (from publish workflow state)
- Stale dashboards (data freshness from computeFreshnessStatus)
- Broken queries (DataAdapter errors)
- Conflict notifications (concurrent edit detection)

**Consumer-provided items (via AttentionAdapter):**
- External business events
- System health notifications
- Custom operational alerts
- Any domain-specific attention items the consumer app generates

### 11.3 Priority & Display

Items have priority: info / warning / critical. Header badge shows count
of unacknowledged warning + critical items. The dropdown panel lists items
sorted by priority then timestamp.

Each item shows: priority indicator, title, description, timestamp, action
button (navigates to relevant artifact or URL).

Items can be acknowledged (dismissed from the active list) or snoozed.
Acknowledged items move to a history view.

### 11.4 Role-Based Visibility

Configurable by admin. The admin defines rules for which attention items
are visible to which roles. A viewer might see only alert breaches relevant
to their dashboards. An admin sees everything. The rules use the same
expression engine as filter rules.

Decision tree widgets on dashboards provide the structured decision-path
view of attention items. The attention system provides the raw signal; the
decision tree provides the guided analysis path.

---

## 12. Data Architecture & Execution Engine

### 12.1 Multi-Source Dashboard Data Config

The previous `DashboardDataConfig` (single preload + single fullLoad) is
replaced with a richer structure supporting multiple named data sources per
dashboard, explicit dependency ordering, and automatic execution engine
selection.

```typescript
interface DashboardDataConfig {
  sources: DashboardSourceConfig[];
  detailSources?: DetailSourceConfig[];  // existing, unchanged
  transition?: 'seamless' | 'fade' | 'replace';
  fullLoadConcurrency?: number;          // default 2
}

interface DashboardSourceConfig {
  id: string;                    // e.g. 'summary', 'transactions', 'reference'
  name: string;                  // admin-facing label
  dataSourceId: string;          // which DataAdapter source
  preload?: PreloadConfig;       // optional — not every source needs preload
  fullLoad: FullLoadConfig;      // required
  dependsOn?: string[];          // IDs of sources that must complete first
  forceServerSide?: boolean;     // override: never send data to client
  priority: number;              // lower = loads first (among non-dependent)
}
```

A dashboard that needs a KPI summary, a transaction table, and reference
data for filter dropdowns configures three source entries:

```
sources: [
  { id: 'reference',     dataSourceId: 'products',   priority: 1 },
  { id: 'summary',       dataSourceId: 'sales_agg',  priority: 2 },
  { id: 'transactions',  dataSourceId: 'sales_raw',  priority: 3,
    dependsOn: ['summary'] }
]
```

`dependsOn` creates a sequencing graph. The orchestrator loads sources in
priority order, respecting dependency constraints. A source with
`dependsOn: ['summary']` waits for the summary source to complete before
starting its own load. This supports parameterized queries where the detail
source uses values from the summary result.

### 12.2 Loading Orchestration

**Phase 1 — Preloads (parallel):**
All sources that have a `preload` config fire their preload queries
simultaneously. Preloads are small (50-500 rows), no browser freeze risk.
Widgets assigned to `dataTier: 'preload'` render as soon as their source's
preload completes.

**Phase 2 — Full loads (parallel with concurrency limit):**
Full-load queries fire in parallel, limited by `fullLoadConcurrency` (default
2). The orchestrator respects `dependsOn` ordering within the parallelism:
sources without dependencies start first (by priority), dependent sources
wait. When a full-load completes and returns an `arrowBuffer`, DuckDB-WASM
ingestion happens on the next microtask.

**Phase 3 — Detail sources (on-demand):**
`DetailSourceConfig` entries (existing, unchanged) load only when triggered
by user action (drill-through click, alert breach). Not part of initial load.

```
Time →
────────────────────────────────────────────────────

Phase 1: Preloads (parallel)
  reference.preload ──────┐
  summary.preload ────────┤  all fire simultaneously
  transactions.preload ───┘

Phase 2: Full loads (concurrency = 2, with dependencies)
  reference.fullLoad ─────────┐  (no deps, priority 1)
  summary.fullLoad ───────────┤  (no deps, priority 2)
                              │
  transactions.fullLoad ──────┘  (dependsOn: ['summary'], waits)

Phase 3: Detail sources (on-demand)
  order_lines                    (fires when viewer drills in)
```

### 12.3 Automatic Execution Engine Selection

The system selects the execution engine automatically based on the data
characteristics. The admin does not choose between server/client/DuckDB.
The system makes the decision and shows the admin what it chose and why.

**Decision chain per data source:**

```
Query result arrives from DataAdapter
│
├── Row count < 10,000?
│   └── JS compute in-memory. Filtering, sorting, grouping all local.
│       No DuckDB overhead needed at this scale.
│
├── Row count 10,000 - 100,000?
│   ├── Arrow IPC buffer present in DataResult?
│   │   └── DuckDB-WASM. Ingest Arrow buffer, all operations local.
│   │       Cross-filter and sorting are instant after ingestion.
│   └── No Arrow IPC?
│       └── JS compute. Admin data config panel shows warning:
│           "Large dataset without Arrow IPC — consider enabling
│            Arrow IPC in your DataAdapter for better performance."
│
├── Row count > 100,000?
│   ├── Arrow IPC buffer present?
│   │   └── DuckDB-WASM. Only viable client-side option at scale.
│   └── No Arrow IPC?
│       └── Server-side fallback. Grid switches to server mode:
│           every filter/sort/page sends query to DataAdapter.
│           Admin sees: "Dataset too large for client-side without
│            Arrow IPC. Grid operates in server mode."
│
└── DataAdapter returns error or timeout?
    └── Server-side fallback with pagination.
```

The thresholds (10K and 100K) are defaults stored in dashboard-level config.
Admins can adjust them per dashboard in an advanced settings section, but
most admins never touch them.

The existing `buildQueryPlan(capabilities)` and `resolveQueryLayer()` already
implement per-stage engine selection. This extends that logic to make the full
chain automatic with explicit fallback paths.

**One admin override:** `forceServerSide: true` per source. For
security-sensitive data where the full dataset must not reach the browser
(financial data, PII), even if the dataset is small enough for client-side.
This is a checkbox in the data source config: "Keep data server-side (do not
send to browser for local processing)."

### 12.4 Arrow IPC Requirement for DuckDB

DuckDB-WASM requires Arrow IPC buffers for performant data ingestion.
Without Arrow IPC, DuckDB must convert row data to columnar format, which
itself can freeze the browser for large datasets. The rule is absolute:

**If a data source should use DuckDB-WASM for client-side operations, the
DataAdapter must return an `arrowBuffer` in its `DataResult` for that
source's queries.**

Without `arrowBuffer`, DuckDB-WASM is not used regardless of dataset size.
The system falls back to JS compute (under 100K rows) or server-side (over
100K rows).

The `hasArrowBuffer(result)` check (existing pure function) gates all
DuckDB ingestion paths.

Guidance for DataAdapter implementors:
- Return `arrowBuffer` for all full-load queries where client-side
  performance matters
- Do not return `arrowBuffer` for preload queries (preloads are small and
  used only for initial render; the overhead of Arrow serialization is not
  worth it)
- Do not return `arrowBuffer` for detail source queries unless the detail
  dataset is large enough to benefit from DuckDB queries

### 12.5 Server-Side Grid Mode

When the execution engine falls back to server-side (dataset > 100K without
Arrow IPC, or `forceServerSide: true`), grids operate differently:

- Every filter change sends the current filter state to
  `DataAdapter.executeQuery()` with the filters in the query
- Every sort change sends the sort state
- Pagination sends `offset` + `limit`
- The grid shows a loading indicator on each interaction
- Cross-filter with other widgets requires a server round-trip
- No local DuckDB or JS compute

The grid widget detects server-side mode automatically from the execution
engine decision. No admin configuration needed — it follows from the data
characteristics.

When a server-layer filter changes (one marked `queryLayer: 'server'` in its
FilterDefinition), the pipeline invalidates and refetches. Client-layer
filter changes on a server-side grid are not possible — all filtering is
server-side in this mode.

### 12.6 Admin Data Config UI

**Location:** Dashboard editor toolbar → "Data Config" button. Opens a panel
showing all data sources for this dashboard.

**Per source, the admin sees:**

```
Source: sales_transactions
  Data Source: [dropdown — context-scoped sources from DataAdapter]
  Priority: [number input]
  Depends on: [multi-select of other source IDs]
  Force server-side: [checkbox]

  Preload:
    Query fields: [field picker]
    Row limit: [number, default 100]
    Apply personal view: [checkbox]

  Full Load:
    Query fields: [field picker]
    Max rows: [number, required — no unbounded loads]
    Apply current filters: [checkbox, default true]

  Status (read-only, computed):
    Estimated rows: ~45,000
    Arrow IPC: ✓ Provided by adapter
    Engine: DuckDB-WASM (automatic)
    Client-side filtering: ✓ Enabled
    Client-side sorting: ✓ Enabled
```

The status section updates when the admin changes configuration. It shows
the system's automatic engine decision and any warnings about missing
Arrow IPC or datasets that will fall back to server mode.

**Dashboard-level settings in the same panel:**

```
Transition mode: [seamless / fade / replace]
Max concurrent full loads: [number, default 2]
Performance thresholds (advanced):
  Client-side limit: [number, default 10000]
  DuckDB threshold: [number, default 100000]
```

**Widget tier assignment:** Not in this panel. Each widget's Data tab in
the config panel has a "Data tier" dropdown: preload / full / both. The data
config panel shows a summary count: "4 widgets on preload, 6 on full, 2 on
both."

### 12.7 Grid Export Configuration

**Viewer experience:** Grid toolbar buttons for each enabled export format
(CSV, Excel, PDF). The ExportController (existing) handles the actual
export.

**Admin configuration (per grid widget, Data tab in config panel):**

```typescript
interface GridExportConfig {
  enabled: boolean;                // master toggle
  formats: ExportFormat[];         // csv, excel, pdf
  maxExportRows?: number;          // cap (may differ from display maxRows)
  includeFilters?: boolean;        // export with current filters or all data
  includeHiddenColumns?: boolean;  // include columns hidden by personal view
}

type ExportFormat = 'csv' | 'excel' | 'pdf';
```

Default: export enabled, CSV and Excel available.

**Server-side export:** When a grid is in server-side mode, export triggers
a server-side export query via DataAdapter — the grid has no complete local
dataset. The export request includes the current filter/sort state and the
`maxExportRows` cap. The admin should be aware: "Export in server mode
requires a server round-trip and is limited by maxExportRows."

### 12.8 Fallback Chain Summary

The complete fallback chain, from most preferred to least preferred:

```
1. DuckDB-WASM + Arrow IPC    (best: instant local queries)
   Requires: arrowBuffer in DataResult, dataset under threshold
   
2. JS compute in-memory        (good: works for smaller datasets)
   Requires: dataset under 100K rows
   When: no Arrow IPC provided, or dataset under 10K (overhead not worth it)
   
3. Server-side round-trip      (functional: works for any size)
   When: dataset > 100K without Arrow IPC, or forceServerSide = true
   Cost: network latency on every filter/sort/page interaction
   
4. Error state                 (fallback of last resort)
   When: DataAdapter fails, network error, timeout
   Shows: error message with retry action
```

Each transition down the chain is automatic and transparent to the viewer.
The admin sees which engine was selected in the data config panel status.

---

## 13. Widget View Switching

### 13.1 Overview

A widget view group allows the admin to configure 2-3 alternative
visualizations for the same dashboard position. The viewer switches
between them at runtime. A KPI card can have a table view behind it, or
a chart view. Same position, different perspectives on the data.

### 13.2 Data Model

```typescript
interface WidgetViewGroup {
  id: string;
  position: WidgetPosition;          // shared canvas position
  activeViewId: string;              // default view on load
  views: WidgetView[];               // 2-3 views maximum
  dataMode: 'shared' | 'independent';
  sharedSourceId?: string;           // when dataMode is 'shared'
}

interface WidgetView {
  id: string;
  label: string;                     // "KPI" / "Table" / "Chart"
  icon?: string;                     // optional icon for button/dot
  widget: DashboardWidget;           // full widget config
}
```

### 13.3 Switching Mechanism

The switching mechanism is inferred from the number of views:

**2 views:** Toggle buttons on the widget chrome (top-right corner). Each
button shows the view's icon or short label. Active view is visually
highlighted. Click to switch.

**3 views:** Left/right arrows on the widget chrome with a dot indicator
showing which view is active (position 1/2/3). Arrows cycle through views.
Clicking dots jumps directly to a view.

Switching is animated with a brief crossfade transition within the widget
bounds. The widget's canvas position and size do not change during a switch.

### 13.4 Data Modes

**Shared data mode (`dataMode: 'shared'`):**
All views pull from the same `DashboardSourceConfig` entry. Each view has
its own data bindings (which fields, which aggregations, which widget type)
but they query the same source. Switching between views is instant because
the data is already loaded.

Use case: KPI card showing revenue total → table showing revenue by region
→ bar chart showing revenue by month. Same source, three visualizations.

**Independent data mode (`dataMode: 'independent'`):**
Each view's widget has its own `dataSourceId` and query config. Switching
to a view that hasn't been activated yet triggers a data load. The widget
shows a loading indicator within its bounds during the load. Once loaded,
switching back to that view is instant (data is cached for the session).

Use case: KPI card showing revenue (from summary source) → detail table
showing individual orders (from transactions source). Different sources,
different data granularity.

### 13.5 Lazy Loading

Non-active views do not render or fetch data until the viewer switches to
them. On dashboard load, only the `activeViewId` view renders and fetches
its data tier. This prevents unnecessary queries for views the viewer may
never look at.

When the viewer switches to a previously unvisited view:
- Shared mode: instant render (data already available from shared source)
- Independent mode: data fetch with loading indicator, then render

Once a view has been activated and its data loaded, it stays cached for the
session. Subsequent switches back to that view are instant.

### 13.6 Admin Configuration

In the dashboard editor, when the admin selects a widget and wants to add
alternative views:

1. Click "Add View" in the config panel header
2. A second view tab appears in the config panel. The admin configures it
   independently (widget type, data bindings, style)
3. Optionally add a third view (maximum 3)
4. Set the data mode: shared source or independent per view
5. Set which view is the default (shown on initial dashboard load)
6. Provide a label and optional icon for each view

The admin can preview each view by clicking the view tabs in the config
panel. The canvas shows the selected view's rendering.

### 13.7 Interaction with Other Widget Features

**Expandable widgets:** A view within a view group can be expandable (if its
widget type supports it). The expansion operates within the current view
only. Switching views collapses any expanded state.

**Container boxes:** A view group can be placed inside a container box. The
box wraps the view group as a single unit. Switching views does not affect
the box layout.

**Drill-through:** Each view can have its own navigation links. Drill-through
from view A uses view A's navigation config. Switching to view B presents
view B's drill options.

**Filters:** All views in a group receive the same dashboard-level filter
context. Widget-level filters (admin/author only) are per view.

---

## 14. Async Report Generation

### 14.1 Overview

Reports and exports can be run asynchronously. Instead of blocking the UI
while a large dataset loads, the user clicks "Run in Background" and
continues working. The system processes the request and notifies the user
when the result is ready for download or viewing.

### 14.2 UX

Every report run and export action presents two buttons:

```
[Run Now]  [Run in Background]
```

Always available, regardless of dataset size. No threshold calculation, no
prompt asking whether the user wants async. For small datasets, "Run in
Background" completes almost immediately and the notification appears within
seconds. The UX is predictable — the option is always there.

**"Run Now":** Standard synchronous execution with progress indicator. The
report UI is occupied but the user can navigate away (auto-save preserves
state, the query continues, the user returns to see the result).

**"Run in Background":** Calls `DataAdapter.executeQueryAsync()`. Returns
an `AsyncReportRequest` with status `'pending'`. The workspace creates an
attention item. The user continues working. When the report is ready, a
notification appears in the attention system.

### 14.3 Activation

Async execution is not enabled by default. Two conditions must be met:

1. The consumer app's DataAdapter implements `executeQueryAsync` (feature-detected
   at mount time by checking whether the method exists on the adapter instance)
2. The admin enables background execution in GOVERN > Settings

If either condition is missing, the "Run in Background" button never appears.

**Global toggle (GOVERN > Settings):** "Enable background report execution"
checkbox. When disabled, async is off everywhere regardless of DataAdapter
support.

**Per-artifact override (in dashboard/report data config panel):**
"Allow background execution: Yes / No / Use global setting." The admin can
enable async selectively for reports that benefit from it and leave it off
for reports that are always fast.

### 14.4 Data Model

```typescript
interface AsyncReportRequest {
  id: string;
  query: DataQuery;
  format: 'csv' | 'excel' | 'pdf' | 'arrow';
  requestedBy: string;           // user ID
  requestedAt: number;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'expired';
  resultUrl?: string;            // download URL when ready
  resultExpiresAt?: number;      // TTL on the result
  error?: string;                // error message when failed
  estimatedRows?: number;
  artifactId?: string;           // the report/dashboard that spawned this
  artifactName?: string;         // display name for notifications
}
```

### 14.5 DataAdapter Extension

```typescript
interface DataAdapter {
  // existing methods unchanged...

  // async execution (optional — feature-detected)
  executeQueryAsync?(
    query: DataQuery,
    format: ExportFormat,
    context?: ViewerContext
  ): Promise<AsyncReportRequest>;

  getAsyncRequestStatus?(requestId: string): Promise<AsyncReportRequest>;
  listAsyncRequests?(userId: string): Promise<AsyncReportRequest[]>;
  cancelAsyncRequest?(requestId: string): Promise<void>;
}
```

### 14.6 Notification Integration

When the consumer app completes an async report, it fires an attention item
through the AttentionAdapter:

```typescript
{
  id: 'async-report-xyz',
  source: 'external',
  priority: 'info',
  title: 'Report ready: Q1 Sales Detail',
  description: '247,832 rows • Excel • Expires in 24 hours',
  actionLabel: 'Download',
  actionTarget: 'async-request:xyz',
  timestamp: Date.now(),
  acknowledged: false
}
```

The workspace intercepts `actionTarget` values prefixed with
`async-request:` and routes them to the async request handler, which calls
`getAsyncRequestStatus()` to get the download URL and initiates the download.

### 14.7 Exports Tab in My Work

The My Work tab (all shells) gains an "Exports" section showing past async
requests.

```
Name                    Format   Status       When           Actions
Q1 Sales Detail         Excel    Ready        2 hours ago    [Download] [Re-run]
Revenue by Region       CSV      Expired      3 days ago     [Re-run]
Inventory Audit         PDF      Failed       Yesterday      [Retry]
Customer Churn          Excel    Processing...               [Cancel]
```

**Actions:**
- Download: available when status is `'ready'`
- Re-run: creates a new async request with the same query parameters
- Retry: re-submits a failed request
- Cancel: calls `cancelAsyncRequest()`

Expiration is consumer-app-controlled via `resultExpiresAt`. When expired,
the download button is hidden and "Re-run" is offered instead.

The `listAsyncRequests()` method on DataAdapter provides this list. The
workspace renders it and manages the UI state.

---

## 15. API Specification & Data Access

### 15.1 Overview

The workspace generates an OpenAPI 3.1 specification from the dataset
definitions (data sources, field enrichments, KPIs, metrics, filter
definitions). The consumer app takes this spec and implements the actual
API endpoints, authentication, and rate limiting.

The workspace owns the contract. The consumer app owns the infrastructure.
The workspace never touches credentials, tokens, or authentication.

### 15.2 Specification Generator

A pure function that takes the current dataset configuration and produces
an OpenAPI 3.1 document:

```typescript
interface APISpecConfig {
  dataSources: DataSourceMeta[];
  fieldEnrichments: Record<string, Record<string, FieldEnrichment>>;
  filterDefinitions: FilterDefinition[];
  kpiDefinitions: KPIDefinition[];
  metricDefinitions: MetricDefinition[];
  roleAccess: APIRoleAccess[];
  baseUrl?: string;
  apiVersion?: string;
}

function generateOpenAPISpec(config: APISpecConfig): OpenAPIDocument;
```

**Generated endpoints per accessible data source:**

| Endpoint | Method | Purpose |
|---|---|---|
| `/data/{sourceId}/query` | POST | Execute a DataQuery, returns DataResult |
| `/data/{sourceId}/export` | POST | Trigger async export (maps to executeQueryAsync) |
| `/data/{sourceId}/schema` | GET | Field metadata with enrichments |
| `/kpis/{kpiId}` | GET | Current KPI value |
| `/metrics/{metricId}` | GET | Current metric value |
| `/kpis/{kpiId}/subscribe` | POST | Subscribe to KPI breach notifications (webhook) |

**Schema derivation:**
- Request body schemas derive from DataQuery + Zod validation schemas
- Response schemas derive from DataResult + ColumnDescriptor types
- Query parameter schemas derive from FilterDefinition catalog
- Field descriptions use admin-provided enrichments (labels, descriptions,
  semantic hints)

The security scheme section references bearer token authentication but
does not define how tokens are issued — that is the consumer app's concern.
The spec annotates which endpoints require authentication and which
role-access rules apply.

### 15.3 Role-Based API Access

The admin configures which roles can access which data sources via API
and with what constraints.

```typescript
interface APIRoleAccess {
  role: string;
  dataSources: string[];             // source IDs this role can access
  allowedOperations: ('query' | 'export' | 'subscribe')[];
  maxRows?: number;                   // per-request row cap for this role
  rateLimitHint?: number;            // requests/minute (consumer enforces)
}
```

These constraints are encoded into the OpenAPI spec as:
- Per-endpoint security requirements referencing role scopes
- `x-rate-limit` extensions with the hint values
- `x-max-rows` extensions on query endpoints
- Endpoint visibility: roles that cannot access a source do not see its
  endpoints in their version of the spec

### 15.4 Admin UI (GOVERN > API Access)

A configuration screen where the admin manages role-based API access:

```
API Access Configuration

Role: Sales Viewers
  Data Sources: [✓] sales_summary  [✓] sales_detail  [ ] audit_log
  Operations:   [✓] Query  [✓] Export  [ ] Subscribe
  Max rows per request: 50,000
  Rate limit hint: 60/min

Role: Analysts
  Data Sources: [✓] sales_summary  [✓] sales_detail  [✓] audit_log
  Operations:   [✓] Query  [✓] Export  [✓] Subscribe
  Max rows per request: 200,000
  Rate limit hint: 120/min

[Generate API Spec]  [Download OpenAPI JSON]  [View Documentation]
```

**"Generate API Spec":** Calls `generateOpenAPISpec()` with current config,
shows a preview of the generated spec.

**"Download OpenAPI JSON":** Exports the OpenAPI 3.1 JSON file. The consumer
app uses this to configure their API gateway, generate client SDKs, or
host documentation.

**"View Documentation":** Renders the generated OpenAPI spec as readable
API documentation inline within the workspace. The admin can review
exactly what endpoints, request/response schemas, and access rules will
be available.

### 15.5 Subscribe Operation

The `subscribe` operation in the API maps to the alert/notification system.
An API consumer can subscribe to KPI breach notifications or data change
events via webhook. The workspace defines the subscription model (what
events, what payloads). The consumer app implements webhook delivery.

This connects to the existing AlertChannelAdapter — API subscriptions are
another delivery channel alongside in-app notifications.

### 15.6 Consumer App Responsibilities

The consumer app takes the OpenAPI spec and:

1. Implements the endpoints (routing DataQuery through their server-side
   DataAdapter implementation)
2. Adds authentication (bearer tokens, API keys, OAuth — their choice)
3. Enforces rate limits and row caps from the spec annotations
4. Applies security bindings (the same SecurityBinding rules that apply in
   the workspace UI apply to API queries)
5. Manages token issuance and revocation
6. Hosts the API documentation
7. Implements webhook delivery for subscriptions

The workspace's `generateOpenAPISpec()` is a pure function with no side
effects. It can be called at build time for a static spec, or at runtime
for a live spec reflecting current configuration.

### 15.7 Connection to Schema-as-Contract

The existing `ai` package already uses a schema-as-contract pattern for
NL query translation. The API spec generator extends this principle: the
same schema definitions that drive the workspace UI, the AI query
translation, and the Zod validation also drive the external API contract.
One source of truth for the data model, multiple consumers.

---

## 16. Usage Analytics & Telemetry

### 16.1 Overview

The workspace observes user behavior: which dashboards are opened, which
filters are applied, how long users spend on each view, which widgets they
interact with, which exports they run. This behavioral data is valuable to
admins for understanding how the BI investment is actually being used.

The workspace collects events and feeds them to the consumer app through a
`UsageAnalyticsAdapter`. The consumer app stores them. Then — and this is the
key design decision — the consumer app registers the stored usage data as a
data source in the DataAdapter, making it queryable through the same
dashboard and report tools as any business data.

No built-in analytics dashboard. No special reporting UI. The admin builds
their own usage analytics dashboards using the same workspace tools they
use for everything else. The workspace eats its own output.

### 16.2 Opt-In Activation

Usage analytics is opt-in. The admin enables it in GOVERN > Settings with
granular control over which event categories are collected:

```
Usage Analytics
  ☐ Enable usage analytics collection

  When enabled:
  ☐ Track artifact views and durations
  ☐ Track widget interactions
  ☐ Track filter usage
  ☐ Track explorer usage
  ☐ Track exports and async reports
  ☐ Track errors and performance

  Note: Usage data is sent to your application's analytics
  adapter. No data is sent to third parties. Build dashboards
  on usage data by adding it as a data source.
```

When analytics is disabled, the workspace does not instantiate any tracking
code. Zero overhead. When enabled, event collection is fire-and-forget with
negligible performance impact.

### 16.3 UsageAnalyticsAdapter

Dedicated adapter. Separate from PersistenceAdapter (which handles artifacts,
not event streams) and InteractionBus (which handles widget-to-widget
communication within a session, not cross-session telemetry).

```typescript
interface UsageAnalyticsAdapter {
  trackEvent(event: UsageEvent): void;    // fire-and-forget, never blocks UI
  flush?(): Promise<void>;                // optional: force-send buffered events
}

interface UsageEvent {
  type: UsageEventType;
  userId: string;
  timestamp: number;
  sessionId: string;
  artifactId?: string;
  artifactType?: string;
  metadata: Record<string, unknown>;     // event-specific payload
}
```

`trackEvent` is fire-and-forget. It never returns a promise, never blocks
the UI, never throws. If the adapter implementation buffers events and sends
them in batches (recommended for performance), `flush()` forces a send. The
workspace calls `flush()` on page unload via `navigator.sendBeacon` pattern.

### 16.4 Event Types

All observable events, grouped by category. Each category corresponds to
an opt-in checkbox in admin settings.

**Artifact lifecycle (Track artifact views and durations):**

| Event | Metadata |
|---|---|
| `artifact-opened` | artifactType, entryPoint (catalog/search/drill/link) |
| `artifact-closed` | durationMs (computed from open/close pair) |
| `artifact-created` | artifactType, fromTemplate, dataSourceId |
| `artifact-duplicated` | sourceArtifactId |
| `artifact-published` | reviewDurationMs (if review was used) |
| `artifact-shared` | shareTargetType (role/users), recipientCount |

**Widget interaction (Track widget interactions):**

| Event | Metadata |
|---|---|
| `widget-clicked` | widgetType, widgetId, clickTarget |
| `drill-through-navigated` | sourceWidgetId, targetArtifactId, filterValues |
| `widget-expanded` | widgetType, expanded (true/false) |
| `widget-view-switched` | viewGroupId, fromViewId, toViewId |
| `widget-morphed` | fromType, toType |

**Filter interaction (Track filter usage):**

| Event | Metadata |
|---|---|
| `filter-applied` | filterDefinitionId, filterType, artifactId |
| `filter-preset-saved` | presetName, filterCount |
| `filter-preset-loaded` | presetId, artifactId |

**Explorer (Track explorer usage):**

| Event | Metadata |
|---|---|
| `explorer-opened` | dataSourceId, entryPoint |
| `explorer-query-built` | fieldCount, zoneDistribution, chartSuggested |
| `explorer-result-saved` | savedAs (report/widget), artifactId |
| `explorer-exported` | format, rowCount |

**Export & async (Track exports and async reports):**

| Event | Metadata |
|---|---|
| `export-triggered` | format, rowCount, syncOrAsync |
| `async-report-requested` | format, estimatedRows |
| `async-report-downloaded` | requestId, timeToDownloadMs |

**Errors & performance (Track errors and performance):**

| Event | Metadata |
|---|---|
| `query-failed` | dataSourceId, errorType, queryDetails |
| `load-timeout` | dataSourceId, phase, durationMs |
| `adapter-error` | adapterName, methodName, errorMessage |
| `dashboard-load-time` | preloadDurationMs, fullLoadDurationMs, widgetRenderMs |
| `query-execution-time` | dataSourceId, rowCount, engineUsed (js/duckdb/server) |

### 16.5 Usage Data as a Data Source

The consumer app's `UsageAnalyticsAdapter` receives events and stores them
in whatever storage the consumer app uses (database table, data warehouse,
event store). A simple schema works:

```sql
CREATE TABLE workspace_usage_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR,
  user_id VARCHAR,
  session_id VARCHAR,
  timestamp TIMESTAMP,
  artifact_id VARCHAR,
  artifact_type VARCHAR,
  metadata JSONB
);
```

The consumer app then registers this table (or views and aggregations on it)
as a data source in their DataAdapter implementation. It appears alongside
business data sources in the workspace.

The admin builds dashboards on it using the same tools: "Most viewed
dashboards this month", "Filter usage heatmap", "Explorer adoption rate",
"Average dashboard load time by data source", "Error frequency trend."

The field enrichment system applies: the admin can label `event_type` as
"Event", add descriptions, set semantic hints, and group the fields for
the field palette. The usage data source is treated identically to any
other data source.

### 16.6 Privacy Considerations

Usage events contain user IDs and behavioral data. The admin should be
aware of privacy implications. The opt-in UI includes a note about data
staying within the consumer app's infrastructure.

The workspace never sends usage data to Anthropic or any third party. Events
flow only to the consumer app's UsageAnalyticsAdapter implementation. Data
retention, anonymization, and privacy compliance are the consumer app's
responsibility.

The admin can disable individual event categories to limit what is collected.
For example, enabling artifact views but not widget interactions gives
high-level usage patterns without granular behavioral tracking.

---

## 17. Filter State Persistence

### 17.1 Two Persistence Modes

**Session state:** The filter values currently applied during the active
session. Survives page refresh within the same session. Managed in-memory
by FilterContextManager. The workspace package owns this entirely — no
adapter call needed.

**Profile state:** The filter values persisted to the user's profile so
they survive across sessions. When the user opens Dashboard X next week,
it loads the filters they had applied last time. Persisted via
PersistenceAdapter on every filter change (debounced).

### 17.2 Auto-Save Behavior

Filter state auto-saves to the user's profile on every filter change. No
explicit "save" action required. The save is debounced (2-second delay after
the last filter change) to avoid excessive persistence calls during rapid
filter adjustments.

```typescript
// PersistenceAdapter methods (added to existing interface)
saveLastAppliedFilters(
  artifactId: string,
  userId: string,
  filterValues: Record<string, unknown>
): Promise<void>;

loadLastAppliedFilters(
  artifactId: string,
  userId: string
): Promise<Record<string, unknown> | null>;
```

### 17.3 Filter Load Precedence

When a user opens a dashboard, filters resolve in this order (highest
priority first):

```
1. Last-applied filter state from profile    (always wins)
2. User's saved personal view filters
3. Admin's default presentation filters
4. Admin's filter definition defaults         (lowest priority)
```

If the user has never visited the dashboard, layer 1 is null and the system
falls through to layer 2 (saved preset), then layer 3 (admin defaults),
then layer 4 (filter definition defaults).

**Reset to defaults:** A "Reset filters" action in the filter bar clears
the user's last-applied state for that artifact, and the dashboard reloads
with admin defaults. The cleared state is persisted (null) so the next visit
also starts from defaults until the user applies new filters.

### 17.4 Interaction with Subscriptions

When a report subscription fires (Section 20), it applies the subscription's
filter preset — not the user's last-applied state. The subscription has its
own filter configuration independent of what the user last did interactively.

When the user clicks the link in a subscription notification and opens the
dashboard, the subscription's filters are applied and become the new
last-applied state.

---

## 18. Filter Value Handling & Match Rules

### 18.1 Overview

Filters that use reference data (lookup tables, dimension tables) face a
data quality gap: the transactional data may contain values that don't
exist in the reference data (orphans), null values, or values that
arrive after the reference data was last updated. The filter system must
handle these explicitly rather than silently dropping records.

All value handling options are visible to the viewer by default. The admin
can hide specific options per FilterDefinition. Viewers toggle the visible
options in the filter bar and save their selections as part of filter presets.

### 18.2 Value Handling Options (Admin-Configured)

The FilterDefinition gains a `valueHandling` configuration:

```typescript
interface FilterDefinition {
  // ... existing fields ...

  valueHandling?: {
    allowIncludeNulls: boolean;       // default true (viewer can toggle)
    allowIncludeOrphans: boolean;     // default true (viewer can toggle)
    allowSelectAll: boolean;          // default true (viewer can toggle)
    allowInvert: boolean;             // default true (viewer can toggle)
    defaultIncludeNulls: boolean;     // default false (initial state)
    defaultIncludeOrphans: boolean;   // default false (initial state)
  };
}
```

**Include nulls (`includeNulls: true`):**
The filter dropdown shows a "(Blank)" or "(No value)" option alongside
the reference values. The viewer can select it like any other value.
When selected, records where this field is null are included in results.
When not enabled, null-valued records are excluded by default.

Use case: A region filter where some transactions have no region assigned.
The admin enables includeNulls so viewers can explicitly choose to see
unassigned transactions.

**Include orphans (`includeOrphans: true`):**
Values found in the transactional data but missing from the reference
data appear in the filter dropdown. These orphan values are visually
distinguished (e.g. an indicator icon, a different section in the
dropdown labeled "Unmatched values"). The viewer can select or deselect
them like any other value.

Use case: A product category filter backed by a product reference table.
A transaction arrives with `category = "MISC"` which isn't in the
reference table. With includeOrphans enabled, "MISC" appears in the
dropdown so viewers can filter on it.

The system identifies orphans by comparing the distinct values in the
transactional data against the values from the filter's `valueSource`.
This comparison runs during the full-load phase and the results are
cached for the session.

**Allow select all (`allowSelectAll: true`):**
A "Select All" option appears at the top of the filter dropdown. When
activated, the filter passes all values including values that don't yet
exist in the reference data. This is distinct from manually selecting
every visible option — "Select All" means "don't filter on this field
at all," so newly added values are automatically included.

Default: true (most filters benefit from a select-all option).

**Allow invert (`allowInvert: true`):**
An "Invert" toggle appears in the filter dropdown. When activated, the
selection logic flips: everything except the selected values is included.
Useful when it's easier to exclude 2 values than to select 48.

Default: false (inversion is a power-user feature, admin enables it
where appropriate).

### 18.3 Admin Configuration UX

In the FilterDefinition editor (either in the central registry or inline
from the dashboard editor), a "Value Handling" section:

```
Value Handling (viewer sees these options unless hidden)
  ☑ Allow "Include null values" toggle      Default: off
  ☑ Allow "Include unmatched values" toggle Default: off
  ☑ Allow "Select All" option               Default: on
  ☑ Allow "Invert Selection" option         Default: off
```

Each option has inline help text explaining what it does and when to
enable it. These settings apply everywhere the filter is used — they're
properties of the FilterDefinition, not per-dashboard.

### 18.4 Filter Value Match Rules (Admin-Configured)

For hierarchical/dependent filters, the existing `dependsOn` mechanism
defines which filters cascade. But `dependsOn` alone doesn't define
how child values relate to parent values. Currently the system relies
on the data source query to return the right child values when filtered
by the parent.

Value match rules handle the case where the relationship between parent
and child filter values isn't a simple foreign key lookup — it's a
pattern-based relationship in the values themselves.

**Example:** Product Category codes are "EL", "FU", "AP". Product
Subcategory codes are "EL-TV", "EL-AU", "FU-CH", "FU-TA", "AP-SH".
The relationship is: subcategory belongs to category when its first 2
characters match the category code.

```typescript
interface FilterValueMatchRule {
  parentFilterId: string;
  matchType: 'exact' | 'expression';
  expression?: {
    parentExpr: string;       // e.g. "value"
    childExpr: string;        // e.g. "SUBSTRING(value, 1, 2)"
    operator: 'equals' | 'starts-with' | 'contains';
  };
}
```

**Match types:**

**Exact (`matchType: 'exact'`):** Child value must equal parent value.
This is the default foreign-key behavior. No expression needed.

**Expression (`matchType: 'expression'`):** A transformation is applied
to both parent and child values before comparison. The `parentExpr` and
`childExpr` define the transformation. The `operator` defines the
comparison.

The expressions use a simple function syntax:
- `value` — the raw value
- `SUBSTRING(value, start, length)` — extract substring
- `UPPER(value)` / `LOWER(value)` — case conversion
- `TRIM(value)` — whitespace removal
- `LEFT(value, n)` / `RIGHT(value, n)` — left/right extraction
- `REPLACE(value, find, replace)` — string replacement

### 18.5 Admin Configuration UX for Match Rules

In the FilterDefinition editor, when a filter has `dependsOn` set, a
"Value Matching" section appears:

```
Depends on: Product Category

Value Matching:
  ○ Exact match (child value equals parent value)
  ○ Expression match:
     Parent value: [value ▾]                    → "EL"
     must [equal ▾]
     Child value:  [LEFT(value, 2) ▾]           → "EL" (from "EL-TV")
     
     Preview: Category "EL" matches: EL-TV, EL-AU
              Category "FU" matches: FU-CH, FU-TA
```

The preview shows a live test of the match rule against the actual
reference data so the admin can verify the rule works before saving.

### 18.6 Scope: Reference Data Filters Only

Value handling options and match rules apply only to filters backed by
reference data (`valueSource: 'lookup-table'` or `valueSource: 'data-source'`
pointing to a reference/dimension table).

Filters on live transactional data (`valueSource: 'data-source'` pointing
to a fact table) don't have a reference-vs-actual gap — the values are
the actual data. Orphan detection, null handling as a separate option,
and match rules don't apply.

The admin's filter definition editor should indicate which data source
type the filter draws from, and show value handling options only when
the source is reference data.

### 18.7 Filter Presets (Viewer Side)

A preset is a snapshot of selected values plus value handling settings.

```typescript
interface FilterPreset {
  id: string;
  name: string;
  userId: string;
  artifactId: string;
  values: Record<string, FilterPresetValue>;
  createdAt: number;
  updatedAt: number;
}

interface FilterPresetValue {
  selectedValues?: unknown[];
  includeNulls: boolean;         // viewer's toggle state
  includeOrphans: boolean;       // viewer's toggle state
  selectAll: boolean;            // viewer's toggle state
  inverted: boolean;             // viewer's toggle state
}
```

The viewer picks values, toggles the value handling options (for options
the admin hasn't hidden), and saves that complete state as a named preset.
Loading a preset restores all selections and toggle states.

Loading a preset restores those exact selections. If a saved value no
longer exists in the reference data (e.g. a product was discontinued),
the preset validation policy (`onInvalid` from the ArtifactFilterContract)
determines behavior: prune the invalid value, clamp to nearest valid, or
surface an error.

### 18.8 Filter Binding Specificity

The importance of correct filter binding per report is elevated by these
features. A filter's `bindings` array maps the filter to specific fields
in specific data sources. When a dashboard uses multiple data sources
(Section 12.1), each binding must point to the correct field in the
correct source.

Incorrect bindings cause silent data issues: a Region filter bound to
the wrong field returns wrong results, orphan detection compares against
the wrong reference set, and match rules evaluate against mismatched
hierarchies.

The dashboard editor's filter binding UI (Section 5.9) should validate
bindings: check that the target field exists in the target data source,
that the field's data type is compatible with the filter type, and that
hierarchical match rules reference valid parent-child relationships.

---

## 19. Personal Alerts

### 19.1 Overview

Any user (viewer, editor, author, admin) can create personal alerts on
KPIs and metrics visible to them. Personal alerts are scoped to the
individual user and evaluate within their security bindings. They are
distinct from admin alerts (Section 5.10) which are organizational.

### 19.2 Trigger Modes

**Threshold:** Value above or below a static number.
"Alert me when Revenue drops below $500,000."

**Trend:** Value changed by a percentage compared to the previous period.
"Alert me when Customer Churn increases by more than 10% compared to last
month."

Both modes require a grace period.

### 19.3 Grace Period

A cooldown that prevents alert flooding. Once an alert fires, it does not
fire again for the same condition until the grace period expires.

```typescript
interface AlertGracePeriodConfig {
  orgDefault: number;              // minutes, e.g. 1440 (24 hours)
  minAllowed: number;              // minutes, e.g. 60 (1 hour minimum)
  maxAllowed: number;              // minutes, e.g. 10080 (7 days maximum)
  resetOnResolve: boolean;         // org default for reset behavior
}
```

**Admin sets org-wide defaults and bounds** in GOVERN > Settings:

```
Alert Grace Period
  Default grace period: [24] hours
  Minimum allowed: [1] hour
  Maximum allowed: [7] days
  ☐ Reset grace period when condition resolves (default)
```

**Users override within bounds** when creating personal alerts. A user sees:
"Grace period: [24] hours (minimum 1 hour, maximum 7 days)."

**Reset on resolve:** When true, if the condition resolves (revenue goes
back above threshold) and re-triggers within the grace period, the alert
fires again immediately because resolution reset the cooldown. When false,
the grace period is absolute — no re-fire until it expires regardless.

**Applies to all alert types:** Both admin alerts (GOVERN > Alerts) and
personal alerts use the same grace period mechanism. Admin alerts default
to the org config but the admin can override their own bounds when creating
org-level alerts.

### 19.4 Personal Alert Data Model

```typescript
interface PersonalAlert {
  id: string;
  userId: string;
  kpiId?: string;
  metricId?: string;
  name: string;
  triggerMode: 'threshold' | 'trend';
  threshold?: {
    operator: 'above' | 'below' | 'equals';
    value: number;
  };
  trend?: {
    direction: 'increases' | 'decreases' | 'changes';
    percentage: number;
    comparedTo: 'previous-day' | 'previous-week' | 'previous-month' |
                'previous-quarter' | 'same-period-last-year';
  };
  gracePeriod: {
    durationMinutes: number;
    resetOnResolve: boolean;
  };
  filterContext?: Record<string, unknown>;  // scoped to user's current filters
  enabled: boolean;
  lastFiredAt?: number;
  createdAt: number;
}
```

### 19.5 Creation UX

Personal alerts are created from two entry points:

**From a KPI/metric widget:** Right-click or action menu on a KPI card,
gauge, or scorecard widget → "Create Alert." Pre-fills the KPI/metric
from the widget.

**From My Work:** "Create Personal Alert" button in the alerts section.
User picks the KPI/metric from a list of visible ones.

The creation form:

```
Create Personal Alert

Name: [auto-filled: "Revenue below $500K"]

KPI/Metric: [Revenue ▾]

Trigger:
  ○ Value  [drops below ▾] [___500000___]
  ○ Change [increases by more than ▾] [___10___] %
           compared to [last month ▾]

Grace period: [24] hours  (min 1h, max 7 days)
  ☐ Reset when condition resolves

Apply my current filters: [✓]
  Region: North (will only alert for North region data)

[Create Alert]
```

"Apply my current filters" captures the user's active filter state at
creation time and scopes the alert evaluation to that context. If the user
has Region = "North" filtered, the alert only fires based on North region
data.

### 19.6 Evaluation and Delivery

Personal alerts are evaluated by the consumer app (the workspace is
client-side and can't run background evaluations). The consumer app's
AlertChannelAdapter implementation handles evaluation on a schedule
(every data refresh, hourly, etc.) and delivers notifications through
the attention system.

The workspace stores personal alerts via PersistenceAdapter. The consumer
app reads them and evaluates. This is the same pattern as admin alerts —
the workspace defines the rule, the consumer app executes it.

### 19.7 Visibility

Personal alerts are visible only to their creator. They appear in:
- My Work > Alerts section (manage, edit, delete, pause/resume)
- Attention items when fired (notification badge + dropdown)

Admins cannot see individual personal alerts. If usage analytics is enabled,
aggregate stats are available: "42 personal alerts active" as a usage metric.

---

## 20. Report & Dashboard Subscriptions

### 19.1 Overview

Users subscribe to dashboards or reports to receive periodic updates.
A subscription combines an artifact, a filter preset, a schedule, and a
delivery mode. The consumer app handles scheduling and delivery. The
workspace defines the subscription model and provides the configuration UI.

### 20.2 Subscription Model

```typescript
interface ReportSubscription {
  id: string;
  userId: string;
  artifactId: string;
  artifactName: string;
  filterPresetId?: string;
  filterValues?: Record<string, unknown>;
  schedule: SubscriptionSchedule;
  deliveryMode: 'status-snapshot' | 'pre-run-report' | 'both';
  enabled: boolean;
  createdAt: number;
  lastDeliveredAt?: number;
}

interface SubscriptionSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;              // 0-6 for weekly
  dayOfMonth?: number;             // 1-28 for monthly
  timeOfDay: string;               // '08:00'
  timezone: string;
}
```

### 20.3 Delivery Modes

**Status snapshot (`'status-snapshot'`):**
The consumer app evaluates the dashboard's KPI values with the
subscription's filters applied and delivers a summary notification
containing: headline KPI values, alert statuses (any breaches), decision
tree node statuses (if present), and a direct link to open the dashboard
in the workspace with the subscription's filters pre-applied.

The snapshot tells the user "here's the headline — something may need
your attention" without requiring them to open the tool.

**Pre-run report (`'pre-run-report'`):**
The consumer app calls `executeQueryAsync` with the subscription's query
and filters on the schedule. The result is cached. When the user opens
the tool, the pre-computed result is already available — the dashboard
loads instantly from the cached result instead of running fresh queries.
The user receives a notification: "Your Monday report is ready to view"
with a link.

**Both (`'both'`):**
Sends the status snapshot notification and pre-runs the full report.
The user gets the headline numbers immediately and can open the tool
to see the full pre-loaded data.

### 20.4 Subscribe UX

**Entry point:** "Subscribe" button in the dashboard/report toolbar.
Available to all roles (viewer, editor, author, admin).

**Subscription configuration panel:**

```
Subscribe to: Sales Overview Dashboard

Filters to apply:
  ○ Use my current filters (Region: North, Date: Last 30 days)
  ○ Use saved preset: [Q1 Regional View ▾]
  ○ Use dashboard defaults

Schedule:
  Frequency: [Weekly ▾]
  Day: [Monday ▾]
  Time: [08:00 ▾]
  Timezone: [America/New_York ▾]

Delivery:
  ○ Status snapshot (headline KPIs + alert status + link)
  ○ Pre-run report (data ready when I open the tool)
  ○ Both

[Subscribe]
```

### 20.5 Subscription Management

Subscriptions are managed in My Work > Subscriptions section:

```
Dashboard/Report       Frequency   Next Delivery    Status     Actions
Sales Overview         Weekly Mon  Mar 10, 08:00    Active     [Edit] [Pause] [Delete]
Revenue Detail         Daily       Mar 9, 07:00     Active     [Edit] [Pause] [Delete]
Quarterly Review       Monthly 1st Apr 1, 09:00     Paused     [Edit] [Resume] [Delete]
```

The user can edit the schedule, change filters, switch delivery mode,
pause/resume, or delete from this list.

### 20.6 Consumer App Responsibilities

The workspace calls `SubscriptionAdapter.createSubscription()` with the
subscription config. The consumer app's implementation:

1. Registers the schedule in their scheduler (cron, task queue, cloud
   scheduler)
2. When the schedule fires:
   - For status snapshot: queries KPI values via DataAdapter with the
     subscription's filters and user's security context, assembles the
     summary, generates the deep link, delivers notification (email,
     push, in-app attention item)
   - For pre-run report: calls `executeQueryAsync` with the subscription's
     query and filters, stores the result, notifies the user
3. Updates `lastDeliveredAt` on the subscription record
4. Handles delivery failures (retry logic, error notifications)

### 20.7 Deep Link Format

The notification includes a link that opens the artifact with the
subscription's filters pre-applied. The link format is consumer-app-defined
(the workspace doesn't own URL routing), but the workspace provides a
helper to generate the filter parameters:

```typescript
function buildSubscriptionDeepLink(
  baseUrl: string,
  subscription: ReportSubscription
): string;
```

When the user clicks the link, the workspace opens the artifact and applies
the subscription's filter values. These become the user's last-applied
filter state for that artifact (per Section 17).

### 20.8 Feature Detection

The Subscribe button appears only when the consumer app provides a
`SubscriptionAdapter`. If the adapter is not provided, subscriptions are
not available. This is consistent with how async reports work — the
workspace feature-detects the capability.

---

## 21. Error States & Empty States

### 21.1 Design Principles

Errors should feel like a minor inconvenience, not a system failure. Every
error state uses: friendly human-readable message (rotated from a pool of
20-40 per scenario), auto-retry in background with animated indicator,
manual retry available, no technical jargon visible by default.

Each scenario type has its own message pool. Messages rotate on each
encounter so the experience doesn't feel stale or robotic. The system
picks a random message from the pool each time.

Every error state includes a small "Details" link (collapsed by default)
that expands to show technical information: error code, error message from
the adapter, timestamp, affected data source, query details. This gives
the user something concrete to share with a helpdesk or admin without
cluttering the primary UX.

### 21.2 Error Message Pools

Each error scenario has 20-40 messages per tone variant (default, minimal,
playful). The system ships all three variants. The admin selects the tone
in GOVERN > Settings. Consumer app can also provide custom message pools.

**Dashboard load failure (20-40 messages per tone):**

Default tone examples:
- "We're having trouble loading this dashboard. Trying again..."
- "The dashboard data isn't cooperating right now. Give us a moment."
- "Something went sideways while loading. Retrying automatically."
- "Couldn't reach the data just now. We're on it."
- "The dashboard is taking longer than expected. Trying again..."
- "Having a little trouble connecting. We'll keep trying."

Playful tone examples:
- "The data took a coffee break. We're calling it back."
- "Looks like the bits got tangled. Untangling..."
- "The dashboard is playing hide and seek. Seeking..."
- "Our data hamsters are on strike. Negotiating..."

Minimal tone examples:
- "Loading failed. Retrying."
- "Connection issue. Retrying."
- "Temporarily unavailable."

After all retries exhausted (20-40 messages for the final state):
- "Still no luck. The data source may be temporarily unavailable."
- "We've tried a few times but couldn't get through."
- "Looks like this will take a while. You can try again or come back later."

**Widget load failure (20-40 messages per tone):**

These are shorter — they fit inside a widget's compact bounds.

Default tone examples:
- "No data right now"
- "Couldn't load this one"
- "Data unavailable"
- "Taking a breather"
- "Temporarily offline"
- "Working on it..."

**Filter load failure (20-40 messages):**
- "Couldn't load filter options"
- "Filter values unavailable"
- "Having trouble loading choices"

**Export failure (20-40 messages for toast):**
- "Export didn't go through. Try again?"
- "Something went wrong with the export."
- "The export hit a snag. Give it another shot."

**Explorer query failure (20-40 messages):**
- "The query didn't return results this time."
- "Something went wrong running your exploration."
- "Couldn't execute that query. Check your fields and try again."

**Data source removed / field removed (20-40 messages):**
- "[Field name] was removed from the dataset by an admin. Contact your admin for more information."
- "Some data elements are no longer available. An admin made changes to the data source."
- "A column you were using has been removed. Your view was adjusted automatically."

### 21.3 Technical Details Panel

Every error message includes a collapsed "Show details" link. When expanded:

```
┌──────────────────────────────────────────────────────────────┐
│  "Couldn't reach the data just now. Retrying..."             │
│                                                              │
│  [Retry Now]  ● ● ○                                         │
│                                                              │
│  ▸ Show details                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Error: CONNECTION_TIMEOUT                               │  │
│  │ Message: Request timed out after 30000ms                │  │
│  │ Data source: sales_transactions                        │  │
│  │ Timestamp: 2026-03-08T14:32:15Z                        │  │
│  │ Request ID: req_abc123                                  │  │
│  │                                                        │  │
│  │ [Copy to clipboard]                                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

"Copy to clipboard" formats the technical details as a single block the
user can paste into a support ticket or chat message to their admin. The
format includes: error code, message, data source, timestamp, request ID,
and the user's artifact context (which dashboard, which widget).

### 21.4 Error Behavior Matrix

| Scenario | Display | Auto-retry | Manual retry | Message pool |
|---|---|---|---|---|
| Dashboard load failure | Inline, full content area | 4 attempts (3s, 6s, 12s, 30s) | Yes | 20-40 messages |
| Widget load failure | Compact, within widget bounds | 4 attempts | Yes | 20-40 messages |
| Data refresh failure | Error replaces stale data | 4 attempts | Yes | 20-40 messages |
| Filter value load failure | Inline in filter dropdown | 2 attempts | Click filter | 20-40 messages |
| Export failure | Toast notification | No | "Try again" in toast | 20-40 messages |
| Async report failure | "Failed" status in Exports tab | No | "Retry" button | 20-40 messages |
| Explorer query failure | Inline in result area | No | "Run again" button | 20-40 messages |
| Data source unavailable | Dashboard-level error | 4 attempts | Yes | 20-40 messages |
| Field removed by admin | Attention notification | No | N/A | 20-40 messages |

### 21.5 Error Configuration

```typescript
interface ErrorStateConfig {
  messagePool: 'default' | 'minimal' | 'playful' | 'custom';
  customMessages?: Record<ErrorScenario, string[]>;  // consumer overrides
  showAutoRetryIndicator: boolean;     // default true
  maxAutoRetries: number;              // default 4
  autoRetryBackoff: number[];          // default [3000, 6000, 12000, 30000]
  showTechnicalDetails: boolean;       // default true (collapsed by default)
  customIcon?: string;                 // override default illustration
  customErrorIllustrations?: Record<ErrorScenario, string>;  // per-scenario
}

type ErrorScenario = 
  | 'dashboard-load' | 'widget-load' | 'data-refresh'
  | 'filter-load' | 'export' | 'async-report'
  | 'explorer-query' | 'data-source-unavailable'
  | 'field-removed' | 'retries-exhausted';
```

### 21.6 Empty States

Empty states use the same rotating message pool approach. Each empty state
scenario has 20-40 messages that rotate on each visit. Each message can
optionally have a paired icon or illustration.

```typescript
interface EmptyStateConfig {
  mode: 'auto' | 'custom';
  autoConfig?: {
    pool: 'default' | 'minimal' | 'playful';
    showIcon: boolean;              // default true
    customIcon?: string;            // global override icon
  };
  customContent?: Record<EmptyScenario, {
    messages: string[];             // consumer's message pool
    icon?: string;
    actionLabel?: string;
    actionTarget?: string;
  }>;
}

type EmptyScenario =
  | 'catalog-empty' | 'my-work-empty' | 'exports-empty'
  | 'subscriptions-empty' | 'search-no-results'
  | 'dashboard-no-widgets' | 'explorer-no-source'
  | 'alerts-empty' | 'filter-no-values';
```

**Per-scenario message pools (20-40 per scenario, default tone examples):**

**Empty catalog:**
- "Nothing here yet. Published dashboards and reports will appear here."
- "Your workspace is a blank canvas. Content will show up once published."
- "No artifacts to show. Check back soon or ask your admin."
- "The catalog is empty. Your admin will publish dashboards and reports here."
- "Fresh start. Published content will appear in this space."

**Empty My Work:**
- "You haven't created or duplicated any artifacts yet."
- "Your personal workspace is empty. Duplicate a published dashboard to get started."
- "Nothing in My Work yet. Browse Published to find something to customize."
- "Your corner of the workspace. Duplicate and personalize published content."

**Empty Exports:**
- "No exports yet. Run a report in the background to see it here."
- "Your export history is empty. Try 'Run in Background' on any report."
- "Nothing exported yet. Background reports will appear here when ready."

**Empty Subscriptions:**
- "No subscriptions yet. Subscribe to a dashboard for periodic updates."
- "You're not subscribed to anything. Hit Subscribe on any dashboard."
- "Your subscription list is empty. Stay on top of key dashboards."

**No search results:**
- "No matches found. Try different search terms."
- "Nothing turned up. Try a broader search."
- "No results for that query. Adjust your search and try again."

**Dashboard with no widgets:**
- "This dashboard is being built. Check back soon."
- "Nothing to display yet. The dashboard is under construction."
- "No widgets here yet. This dashboard is a work in progress."

**Explorer with no data source:**
- "Select a data source to start exploring."
- "Pick a data source from the list to begin."
- "Ready to explore. Choose a data source."

**Empty alerts (My Work > Alerts):**
- "No personal alerts set. Create one on any KPI to stay informed."
- "You haven't set any alerts yet. Right-click a KPI to create one."
- "Your alert list is empty. Monitor what matters to you."

**Filter with no values:**
- "No filter values available."
- "This filter has no values to show."
- "No options available for this filter."

The admin configures the global tone in GOVERN > Settings. Consumer app
can override with fully custom message pools and icons per scenario.

---

## 22. Versioning & Migration

### 22.1 Fundamental Principle: Users Access the Dataset

A dashboard or report is one view of the data. The user has access to all
fields, metrics, and KPIs available in the dataset — not just what the admin
chose to display in a particular layout. Personal views, presets, alerts,
and subscriptions operate at the dataset level, not the dashboard layout
level.

This means: **removing a column from a dashboard layout has no impact on
personal views.** The column still exists in the dataset. The user can still
reference it. Only removing a field from the data source itself (the
dataset) is a breaking change.

### 22.2 Migration Rules

1. **Layout changes are non-breaking** — changing what a dashboard displays
   does not affect personal views, presets, or alerts
2. **Renames are transparent** — auto-update all references
3. **Dataset field removal is the real breaking change** — notify the user,
   prune the reference, suggest contacting admin
4. **Subscriptions stay active** — prune invalid filters silently, continue
   delivering
5. **Personal alerts stay active** — evaluate against available data, go
   dormant if no data exists to evaluate

### 22.3 Migration Matrix

| Admin Change | Affected Downstream | Action | Notification |
|---|---|---|---|
| Column removed from dashboard layout | Nothing | No impact — column still in dataset | None |
| Column added to dashboard layout | Nothing | No impact — users already have access | None |
| Field removed from data source | Personal views, reports, dashboards | Remove field from all artifacts referencing it | Attention item: "[Column] was removed from the dataset by an admin. Contact admin for more information." |
| Field renamed in data source | Personal views, reports, alerts | Auto-update all references | None |
| Filter definition removed | Presets, subscriptions, last-applied state | Prune from presets and state. Subscriptions continue with remaining valid filters | None (silent prune) |
| Filter definition modified | Presets, last-applied state | Prune incompatible values | None (silent prune) |
| KPI/metric removed | Personal alerts | Alert stays active, evaluates against available data. Goes dormant if nothing to evaluate | None |
| KPI/metric renamed | Personal alerts, subscriptions | Auto-update reference | None |
| Dashboard unpublished | Subscriptions | Subscriptions pause (no artifact to deliver) | Attention item |
| Dashboard deleted | Subscriptions, personal views, state | Delete all downstream | Attention item |
| Data source removed | All using it | Dashboards/reports show error state. Subscriptions continue delivering error status. Alerts go dormant | Attention item: "Data source [name] is no longer available. Contact admin." |
| Data source returns after outage | All using it | Dashboards/reports auto-recover. Alerts resume evaluation. Subscriptions resume delivery | None |
| Field enrichment changed | Nothing | Transparent (display-only metadata) | None |

### 22.4 Dataset Field Removal (the Breaking Change)

When an admin removes a field from the data source, the system:

1. Identifies all artifacts referencing that field (personal views, saved
   presets, report column configs, dashboard widget bindings, personal
   alerts using it, subscriptions with filter presets referencing it)
2. Removes the field reference from each artifact
3. Notifies each affected user via the attention system: "[Column name]
   was removed from the dataset by an admin. Your personal view has been
   updated. Contact your admin for more information."
4. Logs the impact in usage analytics if enabled

The notification directs the user to their admin rather than trying to
explain the technical reason. The admin made a deliberate choice to remove
the field and should be the point of contact.

### 22.5 Subscription Continuity

Subscriptions are resilient. When a filter definition used by a subscription
is removed or modified:

- Invalid filter values are silently pruned from the subscription
- The subscription continues delivering with whatever filters remain valid
- If all filters are pruned, the subscription runs unfiltered (showing
  everything within the user's security context)
- No pause, no disruption, no notification for filter changes

Subscriptions only pause when the underlying artifact is unpublished or
deleted — there's nothing to deliver.

### 22.6 Personal Alert Resilience

Personal alerts stay active when their KPI or metric is removed or
reorganized. The evaluation runs against whatever data is available:

- If the underlying data exists but the KPI definition was reorganized,
  the alert may still fire based on the data
- If the KPI ID no longer resolves to any data, the evaluation returns
  no result and the alert is dormant — it never fires, but it's not
  deleted or disabled
- If the data source returns or a new KPI is created with the same ID,
  the alert resumes evaluation automatically

The user can always see their personal alerts in My Work and manually
delete or reassign them.

### 22.7 Preset Validation on Load

When a user loads a saved filter preset, the system validates each value
against the current filter definitions. Values that no longer exist (e.g.
a discontinued product, a renamed region code) are handled by the
ArtifactFilterContract's `onInvalid` policy:

| Policy | Behavior |
|---|---|
| `prune` (default) | Remove invalid values, keep valid ones |
| `clamp` | Replace invalid value with first allowed value |
| `invalidate` | Mark the preset load as failed, show error |
| `ignore` | Pass values through (for non-validated filters) |

---

## 23. Deferred Features

### 23.1 Collab Package (@phozart/collab)

Real-time collaboration via Yjs CRDTs. Left out of this refactor.
Documented as a gap with design intent. Wire in when the API is stable
enough to commit to publicly.

### 23.2 Scheduled Delivery (Partially Superseded)

Report/dashboard subscriptions (Section 20) now cover the user-facing
scheduled delivery use case: periodic status snapshots and pre-run reports.

What remains deferred: automated delivery of formatted artifacts (PDF
snapshots, CSV exports, widget images) to external channels (email
attachments, shared drives, SFTP). The subscription model handles
notification and in-tool pre-caching; external file delivery is a separate
concern for a future `ScheduledDelivery` artifact type.

Design doc: SCHEDULED-DELIVERY.md (already drafted).

### 23.3 Editor Package

Architecture must support it from day one. Build it later. All shared
infrastructure moves to phz-shared and engine so the editor has clean
dependencies when built.

### 23.4 Bundle Optimization

Editor package: get it working first, optimize later. Workspace and viewer
are separate bundles from day one (separate packages).

---

## 24. Existing Infrastructure Reference

These already exist and are complete. Wire them, do not rebuild.

| What | Where | Status |
|---|---|---|
| getShellConfig(role) | packages/workspace/src/shell/shell-roles.ts | Complete (needs viewer removal) |
| WorkspaceRole type | Same | Complete (needs viewer removal) |
| getNavItemsForRole(role) | Same | Complete (needs viewer removal) |
| DataAdapter interface | packages/workspace/src/data-adapter.ts | Complete (moves to phz-shared) |
| DashboardDataPipeline | packages/workspace/src/coordination/ | Complete (moves to phz-shared) |
| FilterContextManager | packages/workspace/src/filters/ | Complete (moves to phz-shared) |
| createDataExplorer() | @phozart/phz-workspace | Complete (moves to engine) |
| exploreToReport() | Same | Complete (moves to engine) |
| exploreToDashboardWidget() | Same | Complete (moves to engine) |
| promoteFilterToDashboard() | Same | Complete (moves to engine) |
| suggestChartType() | Same | Complete (moves to engine) |
| Drop zone state mgmt | Same | Complete (moves to engine) |
| Field palette helpers | Same | Complete (moves to engine) |
| Authoring state machines | packages/workspace/src/authoring/ | Complete |
| PublishState machine | packages/workspace/src/authoring/publish-workflow.ts | Complete |
| AutoSave | packages/workspace/src/authoring/auto-save.ts | Complete |
| UndoManager | packages/workspace/src/authoring/ | Complete |
| Design tokens | packages/workspace/src/styles/design-tokens.ts | Complete (moves to phz-shared) |
| Responsive helpers | packages/workspace/src/styles/responsive.ts | Complete (moves to phz-shared) |
| Container queries | packages/workspace/src/styles/container-queries.ts | Complete (moves to phz-shared) |
| ArtifactVisibility | packages/workspace/src/navigation/ | Complete (moves to phz-shared) |
| DefaultPresentation / PersonalView | Same | Complete (moves to phz-shared) |
| GridArtifact | packages/workspace/src/navigation/grid-artifact.ts | Complete (moves to phz-shared) |
| NavigationLink model | packages/workspace/src/navigation/ | Complete |
| NavigationMapper | Same | Complete |
| NavigationValidator | Same | Complete |
| NavigationEditorState | Same | Complete |
| Local mode (OPFS, sessions) | packages/workspace/src/local/ | Complete |
| TimeIntelligenceConfig | @phozart/phz-workspace | Complete |
| computeFreshnessStatus() | Same | Complete |
| Report editor state | packages/workspace/src/authoring/report-editor-state.ts | Complete |
| Dashboard editor state | packages/workspace/src/authoring/ | Complete |
| CreationFlowState | packages/workspace/src/authoring/creation-flow.ts | Complete (simplify) |
| CatalogState | packages/workspace/src/authoring/catalog-state.ts | Complete |
| Drag-drop state machine | packages/workspace/src/authoring/ | Complete |
| Widget config panel state | packages/workspace/src/authoring/ | Complete |
| Morph groups | packages/workspace/src/authoring/ | Complete (add new types) |
| Context menu builder | packages/workspace/src/authoring/ | Complete |
| Keyboard shortcut handler | packages/workspace/src/authoring/ | Complete |

### 24.1 Test Infrastructure

- Tests: 4,045-5,023 passing (verify exact count)
- Test framework: Vitest (Node, no DOM for pure functions), Playwright for e2e
- Two test apps: test_app/ (Next.js 15), test/ (Next.js 16 Turbopack)
- Build order: definitions -> core -> duckdb -> engine -> grid -> criteria ->
  widgets -> grid-admin -> engine-admin -> grid-creator -> ai -> collab ->
  react/vue/angular

### 24.2 Framework Adapters

React first (wrap phz-workspace, phz-viewer, and eventually phz-editor).
Vue and Angular later. Do not block on them.

---

## Appendix A: Component Props Summary

### `<phz-workspace>` Props

```typescript
interface PhzWorkspaceProps {
  role: 'admin' | 'author';
  dataAdapter: DataAdapter;
  persistenceAdapter: PersistenceAdapter;
  viewerContext?: ViewerContext;
  alertAdapter?: AlertChannelAdapter;
  attentionAdapter?: AttentionAdapter;
  usageAnalyticsAdapter?: UsageAnalyticsAdapter;
  subscriptionAdapter?: SubscriptionAdapter;
  helpConfig?: HelpConfig;
  theme?: string;
  manifestRegistry?: ManifestRegistry;
}
```

### `<phz-viewer>` Props

```typescript
interface PhzViewerProps {
  dataAdapter: DataAdapter;
  persistenceAdapter: PersistenceAdapter;
  viewerContext?: ViewerContext;
  attentionAdapter?: AttentionAdapter;
  usageAnalyticsAdapter?: UsageAnalyticsAdapter;
  subscriptionAdapter?: SubscriptionAdapter;
  helpConfig?: HelpConfig;
  theme?: string;
  localModeEnabled?: boolean;
}
```

### `<phz-editor>` Props

```typescript
interface PhzEditorProps {
  dataAdapter: DataAdapter;
  persistenceAdapter: PersistenceAdapter;
  measureRegistry: MeasureRegistryAdapter;
  viewerContext: ViewerContext;            // required
  attentionAdapter?: AttentionAdapter;
  usageAnalyticsAdapter?: UsageAnalyticsAdapter;
  subscriptionAdapter?: SubscriptionAdapter;
  helpConfig?: HelpConfig;
  theme?: string;
  localModeEnabled?: boolean;
}
```

---

## Appendix B: New Items to Build

| Item | Package | Priority | Dependencies |
|---|---|---|---|
| phz-shared package | New | P0 | Extract from workspace |
| Explorer move to engine | Engine | P0 | Extract from workspace |
| ShareTarget union type | phz-shared | P0 | Replaces sharedWith: string[] |
| Multi-source DashboardDataConfig | phz-shared | P0 | Replaces single preload/fullLoad |
| Automatic execution engine selection | engine | P0 | Extends buildQueryPlan |
| FieldEnrichment + merge | phz-shared | P1 | New type + pure function |
| MeasureRegistryAdapter | phz-shared | P1 | New interface |
| HelpConfig | phz-shared | P2 | New interface |
| AttentionAdapter | phz-shared | P2 | New interface |
| PersistenceAdapter expansion | phz-shared | P1 | Add enrichment + preference methods |
| Viewer shell (phz-viewer) | New | P0 | Depends on phz-shared |
| Explorer mounted component | phz-viewer | P1 | Lit component, wires createDataExplorer |
| Decision tree widget | widgets | P1 | New widget type |
| Container box widget | widgets | P1 | New widget type |
| Expandable widget support | widgets | P1 | Enhancement to existing types |
| Widget view group support | widgets | P1 | New widget composition model |
| Rich text editor for text-block | widgets | P2 | Enhancement |
| Grid export config | widgets | P1 | Enhancement to ExportController |
| Dashboard data config admin UI | workspace | P1 | New admin panel |
| Command palette | workspace | P2 | New shell component |
| Preview-as-viewer context picker | phz-shared | P1 | Shared component |
| Attention system | phz-shared + workspace | P2 | New subsystem |
| Data source enrichment UI | workspace | P1 | New admin screen |
| Expression builder component | phz-shared | P1 | Shared by filters, alerts, decision tree |
| Loading orchestrator (multi-source) | phz-shared | P0 | Replaces current DashboardDataPipeline |
| Server-side grid mode | widgets/grid | P1 | Fallback when no DuckDB/Arrow |
| Async report execution support | phz-shared | P1 | UI + DataAdapter optional methods |
| Exports tab in My Work | all shells | P1 | Depends on DataAdapter async methods |
| OpenAPI spec generator | engine | P2 | Pure function, schema-as-contract |
| API access admin UI (GOVERN) | workspace | P2 | Role-based API config + spec preview |
| UsageAnalyticsAdapter interface | phz-shared | P2 | New interface |
| Usage event collection | all shells | P2 | Fire-and-forget event tracking |
| GOVERN > Settings admin UI | workspace | P1 | Async activation + analytics opt-in + grace period |
| Filter state auto-save (debounced) | phz-shared | P1 | PersistenceAdapter + FilterContextManager |
| FilterDefinition valueHandling config | definitions | P1 | Extends FilterDefinition type |
| Filter value match rules | definitions + engine | P1 | Expression evaluation for dependent filters |
| Orphan value detection | engine | P1 | Compare data vs reference values |
| Filter binding validation | workspace | P2 | Validate bindings in dashboard editor |
| Personal alerts system | phz-shared + all shells | P1 | Data model, creation UI, PersistenceAdapter methods |
| SubscriptionAdapter interface | phz-shared | P1 | New interface |
| Subscription UI (Subscribe button) | all shells | P1 | Config panel + My Work management |
| Alert grace period config | workspace | P1 | GOVERN > Settings + per-alert override |
| Editor shell (phz-editor) | New | P3 (future) | Depends on phz-shared |
