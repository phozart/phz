# phz-workspace Conventions — Companion Instructions

## Purpose

This document supplements WORKSPACE-CONSOLIDATION-INSTRUCTIONS.md with
system-level conventions that apply across all widgets, templates, admin
tools, and consumer rendering. These are not per-component specifications.
They are patterns that every component must follow for consistency.

Read this document after reading the main instruction set. Apply these
conventions during Phase 2 (types), Phase 3 (workspace shell), Phase 4
(admin tool integration), and Phase 6 (layout and rendering).

---

## Part 1: Widget Configuration Conventions

### 1.1 Universal widget config properties

Every widget config, regardless of type, must support these properties.
They live in a `common` block on the widget config, not mixed with
type-specific options:

```typescript
interface WidgetCommonConfig {
  // Identity
  title: string
  subtitle?: string
  description?: string            // tooltip on hover, screen reader label

  // Appearance
  colorOverride?: string          // override the theme accent for this widget
  hideHeader?: boolean            // render without title bar (for embedded use)
  padding?: 'none' | 'compact' | 'default'  // internal padding

  // Data display
  emptyStateMessage?: string      // shown when data query returns 0 rows
  loadingBehavior?: 'skeleton' | 'spinner' | 'previous'
  // 'skeleton' = gray placeholder shapes matching the chart type
  // 'spinner' = centered spinner overlay
  // 'previous' = keep showing last data while loading (default)

  // Interaction
  enableDrillThrough?: boolean    // default true if widget supports it
  enableCrossFilter?: boolean     // default true if widget supports it
  enableExport?: boolean          // CSV/PNG export from widget menu
  clickAction?: 'drill' | 'filter' | 'navigate' | 'none'

  // Sizing
  minHeight?: number              // px, overrides manifest default
  aspectRatio?: number            // width/height, used when height is auto

  // Accessibility
  ariaLabel?: string              // override auto-generated label
  highContrastMode?: 'auto' | 'force' | 'off'
}
```

The `common` block is separate from `typeConfig` (widget-specific options).
This means the workspace shell can render a universal "Widget Settings"
panel for any widget without knowing its type, plus a type-specific panel
generated from the `configSchema` on the WidgetManifest.

### 1.2 Widget-specific config conventions

During Phase 1 research (section 1.4), extract all existing `@property()`
declarations from each widget component. For each widget, produce a
`configSchema` (Zod schema) that captures its type-specific options.

Follow these conventions for type-specific config:

**Chart widgets** (bar, line, area, pie, scatter, heatmap, waterfall, funnel):
```typescript
interface ChartTypeConfig {
  // Data binding
  dimension: string               // field name for x-axis / categories
  measures: string[]              // field names for values
  groupBy?: string                // secondary dimension for series

  // Orientation (where applicable)
  orientation?: 'vertical' | 'horizontal'

  // Stacking (bar, area)
  stacking?: 'none' | 'stacked' | 'percent'

  // Labels
  showDataLabels?: boolean
  dataLabelFormat?: string        // format string, e.g. '#,##0.00'
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none'

  // Axes (cartesian charts only)
  xAxisLabel?: string
  yAxisLabel?: string
  yAxisMin?: number               // auto if not set
  yAxisMax?: number

  // Ranking (bar charts)
  rankOrder?: 'asc' | 'desc' | 'none'
  rankLimit?: number              // top-N / bottom-N

  // Trend (line, area)
  showTrendLine?: boolean
  showTarget?: boolean
  targetValue?: number
  showConfidenceBand?: boolean

  // Color
  colorPalette?: string[]         // override theme chart palette
  colorByField?: string           // color each bar/point by a field value
}
```

**KPI widgets** (kpi-card, gauge, scorecard):
```typescript
interface KPITypeConfig {
  kpiId: string
  cardStyle: 'compact' | 'expanded' | 'mini'

  // Value display
  valueFormat?: string            // '#,##0', '0.0%', '$#,##0'
  showDelta?: boolean             // show change from previous period
  deltaFormat?: 'absolute' | 'percent' | 'both'
  showSparkline?: boolean         // inline trend in the card
  sparklinePeriods?: number       // how many periods to show

  // Status
  showStatusIndicator?: boolean   // colored dot/bar based on threshold
  statusPosition?: 'left' | 'top' | 'background'

  // Gauge-specific
  gaugeMin?: number
  gaugeMax?: number
  gaugeSegments?: number          // number of colored segments
}
```

**Table widgets** (data-table, status-table, bottom-n):
```typescript
interface TableTypeConfig {
  columns: TableColumnConfig[]
  showRowNumbers?: boolean
  showAggregationRow?: boolean    // sum/avg footer
  pageSize?: number               // 0 = no pagination
  sortable?: boolean
  filterable?: boolean
  density?: 'compact' | 'dense' | 'comfortable'
  highlightRules?: ConditionalFormat[]
  rowClickAction?: 'select' | 'drill' | 'expand' | 'none'
}

interface TableColumnConfig {
  field: string
  header?: string                 // display name, defaults to field name
  width?: number                  // px, auto if not set
  format?: string
  alignment?: 'left' | 'center' | 'right'
  visible?: boolean               // default true
  pinned?: 'left' | 'right' | false
}
```

### 1.3 Config schema auto-generation for the workspace

The workspace admin UI should auto-generate option panels from the
`configSchema` on each WidgetManifest. The convention:

- Zod `z.string()` → text input
- Zod `z.number()` → number input with optional min/max
- Zod `z.boolean()` → toggle switch
- Zod `z.enum([...])` → select dropdown
- Zod `z.array(z.string())` → multi-select or tag input
- Zod `z.object({...})` → collapsible section with nested fields
- Field descriptions from `.describe('...')` → tooltip on the label
- Field defaults from `.default(...)` → pre-filled values

Fields should be grouped by concern. Use the Zod schema structure itself
as the grouping: top-level keys become section headers. Put the most
commonly changed options first. Hide advanced options behind a "Show
advanced" toggle. The workspace should never show raw JSON editing for
widget config — the generated form is the interface.

### 1.4 Widget responsive behavior contract

Every widget must define how it behaves at three container width breakpoints.
This is declared on the WidgetManifest, not configured per-instance:

```typescript
interface WidgetResponsiveBehavior {
  // Below this width, switch to compact mode
  compactBelow: number            // px, e.g. 280

  // At compact mode, what changes?
  compactBehavior: {
    hideLegend?: boolean
    hideAxisLabels?: boolean
    hideDataLabels?: boolean
    simplifyToSingleValue?: boolean  // KPI cards: show just the number
    collapseToSummary?: boolean      // tables: show top 3 rows + "N more"
  }

  // Below this width, switch to minimal mode (icon + value only)
  minimalBelow?: number           // px, e.g. 160

  // Aspect ratio constraints
  minAspectRatio?: number         // e.g. 0.5 (tall)
  maxAspectRatio?: number         // e.g. 3.0 (wide)
}
```

This drives CSS Container Query breakpoints automatically. The layout
renderer reads these values from the manifest and generates appropriate
`@container` rules without widget authors writing CSS.

### 1.5 Widget interaction contract

Widgets communicate through the `InteractionBus` on `RenderContext`.
Standardize the event types every widget may emit or listen to:

```typescript
type WidgetEvent =
  | { type: 'drill-through'; sourceWidgetId: string; field: string; value: unknown }
  | { type: 'cross-filter'; sourceWidgetId: string; filters: FilterExpression[] }
  | { type: 'clear-cross-filter'; sourceWidgetId: string }
  | { type: 'selection-change'; sourceWidgetId: string; selectedRows: unknown[] }
  | { type: 'time-range-change'; sourceWidgetId: string; from: string; to: string }
  | { type: 'navigate'; targetArtifactId: string; filters?: FilterExpression[] }
  | { type: 'export-request'; sourceWidgetId: string; format: 'csv' | 'png' | 'pdf' }
```

A widget declares which events it emits and which it listens to via the
`supportedInteractions` field on WidgetManifest. The workspace uses this
to show connection wires between widgets in the dashboard builder (e.g.
"clicking this bar chart cross-filters that table").

---

## Part 2: Template Authoring and Instantiation

### 2.1 Template config structure

A template is not just a match pattern. It contains a complete dashboard
config with placeholder bindings instead of concrete field names:

```typescript
interface TemplateDefinition {
  // ... (existing fields from main instructions) ...

  // The actual config with placeholders
  config: DashboardConfig & {
    // Placeholders for fields that get bound on instantiation
    bindings: TemplateBinding[]
  }
}

interface TemplateBinding {
  id: string                      // unique within template, e.g. 'primary-measure'
  role: 'measure' | 'dimension' | 'date' | 'identifier' | 'filter'
  label: string                   // shown in UI: "Primary Measure"
  description?: string            // tooltip: "The main numeric value to track"
  required: boolean
  fieldType: 'string' | 'number' | 'date' | 'boolean'
  semanticHint?: string           // prefer fields matching this hint
  defaultField?: string           // auto-bound if a field matches by name
}
```

Inside the template's dashboard config, widget configs reference bindings
by ID instead of concrete field names:

```typescript
// In a template's widget config:
{
  type: 'bar-chart',
  typeConfig: {
    dimension: '{{dimension.primary-category}}',   // binding reference
    measures: ['{{measure.primary-measure}}'],
    groupBy: '{{dimension.secondary-category}}',
  }
}
```

### 2.2 Template instantiation flow

When a user selects a template, the instantiation flow:

1. **Show bindings form**: For each `TemplateBinding` in the template,
   show a field picker. The picker is filtered to fields of the correct
   type from the selected data source. Auto-bind where `defaultField`
   matches a field name in the schema.

2. **Auto-binding heuristic**: Before showing the form, run auto-binding:
   - Match binding `semanticHint` against field `semanticHint`
   - Match binding `id` or `label` against field names (fuzzy)
   - Match binding `role` against field classification from SchemaAnalyzer
   - If all required bindings are auto-satisfied, show a confirmation
     screen instead of the full form: "We mapped your fields like this.
     Look correct?"

3. **Resolve placeholders**: Replace all `{{role.bindingId}}` tokens in
   the template config with the selected field names.

4. **Assign new IDs**: Generate new IDs for the dashboard, all widgets,
   and any KPI/metric definitions embedded in the template.

5. **Open in builder**: Hand the resolved config to the DashboardBuilder.
   The user can customize from there.

### 2.3 Template categories and what each must contain

| Category | Required widgets | Required bindings | Notes |
|----------|-----------------|-------------------|-------|
| `overview` | 3+ KPI cards, 1 trend chart, 1 summary table | 1 date, 2+ measures, 1 dimension | The "executive" view. Top row KPIs, middle trend, bottom table. |
| `detail` | 1 data table, 1+ filter controls | 3+ fields of any type | Tabular detail view with rich filtering. |
| `comparison` | 2+ chart widgets (bar, pie, scatter) | 2+ measures, 1+ dimensions | Side-by-side or overlaid comparisons. |
| `kpi-board` | 4+ KPI cards, optional gauges | 4+ measures with thresholds | Dense KPI monitoring view. |
| `time-series` | 1+ trend/line charts, 1 date filter | 1 date, 1+ measures | Time-focused analysis with period controls. |
| `monitor` | 1 risk-summary, 2+ KPI cards with breach indicators, 1 status table | 3+ KPIs with thresholds | Operational monitoring with alert integration. |
| `custom` | No requirements | At least 1 binding | User-created templates. |

### 2.4 Template validation rules

Before saving a template, validate:

- Every widget config's field references resolve to a declared binding
- No binding is declared but never referenced by any widget
- All required bindings have a `fieldType` that makes sense for their `role`
  (e.g. a measure binding must be `fieldType: 'number'`)
- The template renders without errors when all bindings are replaced with
  synthetic field names (dry-run instantiation)
- The layout uses `LayoutIntent` types, not legacy absolute positioning
  (templates must be responsive)
- Every widget in the template has an entry in the widget registry
  (no orphaned type references)

### 2.5 Template versioning

Templates are versioned artifacts like everything else. When a template
references widget types that get new config options in a future version,
the template should still instantiate correctly because new options have
defaults. The migration system handles structural changes.

Templates created by users should be exportable as JSON and importable
into other phz-workspace installations. The export format includes the
template definition, all referenced widget manifests (metadata only, not
renderer code), and a compatibility manifest listing minimum versions
of each widget type.

---

## Part 3: Admin UX Conventions

### 3.1 Preview mode

Every artifact designer (ReportDesigner, DashboardBuilder, KPIDesigner)
must support a "Preview" mode that shows the artifact as the consumer
would render it. The toggle sits in the designer header.

- Preview mode renders the artifact using the consumer's widget registry
  and the actual DataAdapter (live data, not sample data)
- Preview mode respects ConsumerCapabilities — if the consumer doesn't
  support a widget type, preview shows the fallback renderer
- Preview mode is read-only (no editing)
- Preview mode supports viewport simulation: desktop / tablet / mobile
  width presets, showing how the intent-based layout responds
- Preview mode shows breach indicators if alert rules exist for the
  dashboard's KPIs

### 3.2 Validation feedback

Validation must be continuous, not gate-based. Don't wait for the user
to click "Save" to show errors. The convention:

- **Inline validation**: Fields in the admin form show validation state
  as the user types. Red border + message below the field for errors.
  Orange for warnings (valid but suboptimal, e.g. "This KPI has no
  threshold defined — status will always be 'unknown'").

- **Panel-level validation**: Each step/panel in a wizard shows a
  status icon: green check (valid), orange warning (has warnings),
  red circle (has errors). The user can navigate freely between steps
  even with errors, but cannot save until all errors are resolved.

- **Cross-reference validation**: When a dashboard references a KPI
  that has been deleted, show an inline warning on the affected widget:
  "KPI 'Total Revenue' no longer exists. This widget will not render."
  Allow the user to rebind or remove the widget.

- **Config diff on save**: Before saving, show a summary of what changed
  since last save. For dashboards: added/removed/repositioned widgets.
  For reports: changed columns, filters, sort. This prevents accidental
  overwrites and helps admins review their own changes.

### 3.3 Undo/redo scope

The existing `UndoController` should be scoped per artifact editing session.
The convention:

- Undo stack is created when an artifact is opened in a designer
- Every discrete user action pushes a state snapshot
- Ctrl+Z / Cmd+Z undoes the last action
- Ctrl+Shift+Z / Cmd+Shift+Z redoes
- The undo stack is discarded when the artifact is closed
- Undo/redo buttons are visible in the designer header with tooltips
  showing what will be undone ("Undo: Remove widget 'Revenue Chart'")

Do not attempt cross-artifact undo. If a user edits a KPI and then edits
a dashboard that references it, those are separate undo stacks.

### 3.4 Auto-save and draft state

The convention for save behavior:

- **Auto-save drafts**: Every 30 seconds of inactivity after a change,
  auto-save to the adapter with a `draft: true` flag on the config.
  This prevents data loss from browser crashes.

- **Explicit publish**: The "Save" button saves the artifact as the
  current version. If the artifact has placements, this is what
  consumers see. A "Save as Draft" option saves without updating the
  published version.

- **Draft indicator**: The catalog shows "(Draft)" next to artifacts
  that have unsaved draft changes. Opening a draft shows a banner:
  "You have unsaved changes from [timestamp]. Resume editing or
  discard?"

- **Conflict detection**: If two users edit the same artifact, the
  second save shows a conflict warning: "This artifact was modified
  by someone else since you started editing. Overwrite or merge?"
  For v1, "merge" is not required — overwrite or discard is sufficient.
  The `collab` package (Yjs CRDTs) can provide real-time co-editing
  in a future version.

### 3.5 Keyboard shortcuts

Consistent across all admin tools:

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save artifact |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + P | Toggle preview mode |
| Ctrl/Cmd + D | Duplicate selected widget (dashboard builder) |
| Delete / Backspace | Remove selected widget (with confirmation) |
| Escape | Close modal / exit current mode |
| Ctrl/Cmd + F | Focus search in catalog |
| Tab / Shift+Tab | Navigate between form fields |
| Arrow keys | Navigate between widgets in dashboard builder |

Keyboard shortcuts are registered at the workspace shell level and
delegated to the active tool. Show a shortcut reference panel via
Ctrl/Cmd + / or a "?" button in the workspace header.

### 3.6 Drag-and-drop in the dashboard builder

The dashboard builder must support drag-and-drop for widget placement.
The convention:

- **Widget palette**: Left sidebar shows available widget types from the
  registry (filtered by consumer capabilities). Drag a widget from the
  palette onto the canvas.

- **Canvas behavior**: The canvas renders the current LayoutIntent tree.
  Drop zones highlight as the user drags. For AutoGridLayout, drop zones
  appear between existing widgets and at the end. For SectionsLayout,
  drop zones appear between sections.

- **Resize handles**: Widgets in the canvas show resize handles on
  right and bottom edges. Dragging changes the `weight` or
  `preferredHeight` on the WidgetSlot, not absolute pixel values.

- **Reorder**: Drag within the canvas to reorder widgets in their
  container. This changes the order in the `children` array of
  the parent LayoutNode.

- **Section management**: Drag widgets between sections. Drag sections
  to reorder them. Double-click a section header to rename.

- **Snap feedback**: Show alignment guides when the user drags near
  another widget's edge. This is visual feedback only, not grid snapping
  (intent-based layout handles actual alignment).

- **Touch support**: All drag-and-drop must work on touch devices with
  long-press to initiate drag.

### 3.7 Contextual actions in the dashboard builder

When a widget is selected in the dashboard builder canvas:

- **Floating toolbar**: Appears above/below the widget with actions:
  Configure (opens type-specific option panel), Duplicate, Delete,
  Set Alert (opens alert rule designer pre-populated with this widget's
  KPIs), View Data (shows the raw data query result in a table)

- **Quick config**: Double-click a widget to open its configuration
  panel inline (slide-out from the right side, not a modal)

- **Data binding indicator**: Show which data source fields the widget
  is bound to. A small "fx" icon on fields that use expressions.
  Click to edit the expression inline.

### 3.8 Empty states

Every list, catalog, and browser must have a well-designed empty state:

| Context | Empty state content |
|---------|-------------------|
| Catalog (no artifacts) | "No reports or dashboards yet. Create your first one." + primary CTA button |
| Template gallery (no custom templates) | "Using default templates. Create a custom template from any dashboard." |
| Alert rules (none defined) | "No alert rules yet. Set alerts on your KPIs to get notified when things change." |
| Active breaches (none) | "All clear. No active alerts." with a green check |
| Widget picker (no matching widgets) | "No widgets match the current filter." + clear filter link |
| Search results (no matches) | "No results for '[query]'. Try a different search term." |
| Dashboard canvas (no widgets) | "Drag widgets from the panel on the left, or pick a template to get started." |

Empty states should always include a primary action that moves the user
toward creating content. Never show a blank screen.

---

## Part 4: Consumer Rendering Conventions

### 4.1 Loading states

When a consumer app loads a dashboard config and fetches data, the
rendering pipeline goes through states. The convention:

```
Loading config → Loading data → Rendering → Interactive
```

At each stage, the consumer should see appropriate feedback:

- **Config loading**: Show the layout skeleton. The LayoutIntent tree
  can render empty widget slots (gray placeholder cards in the correct
  grid positions) before data arrives. This gives instant visual
  structure.

- **Data loading**: Each widget shows its own loading state based on
  `loadingBehavior` in the common config. Default is `'previous'`
  (keep showing last data with a subtle loading indicator). First
  load uses `'skeleton'`.

- **Progressive rendering**: Widgets should render independently as
  their data arrives. A KPI card that resolves in 100ms should render
  immediately, not wait for a chart that takes 2 seconds. The layout
  renderer must not block on all widgets resolving.

- **Stale data indicator**: If a widget's data is older than a
  configurable threshold, show a small "Updated 5m ago" label.
  The DataAdapter's `DataResult.metadata` should include a timestamp.

### 4.2 Error boundaries

Widget rendering errors must not cascade. The convention:

- Each widget slot has an error boundary. If a widget throws during
  render, the boundary catches it and shows a fallback:
  "This widget encountered an error. [Retry] [Show details]"

- "Show details" expands to show the error message and stack trace
  (development mode) or a generic message (production mode).

- The dashboard layout continues rendering. Other widgets are unaffected.

- Error state is reported via a `widget-error` event on the dashboard
  element, so the consumer app can log it.

- Network errors from the DataAdapter show a different fallback:
  "Unable to load data. [Retry]" with the HTTP status or error message.

### 4.3 Responsive rendering

The consumer's rendered dashboard must work across screen sizes.
The LayoutIntent system handles most of this, but the convention
clarifies edge cases:

- **Minimum dashboard width**: 320px. Below this, horizontal scroll
  is acceptable.

- **Widget minimum width**: Defined on WidgetManifest. The AutoGridLayout
  `minItemWidth` cannot go below the largest `minSize.cols * column-width`
  in its children.

- **Breakpoint behavior**: The layout renderer uses CSS Container Queries
  on the dashboard container, not viewport media queries. This means the
  dashboard responds to its actual container width, supporting sidebar
  layouts, split views, and modals without special handling.

- **Mobile collapse**: On narrow containers (< 480px), the layout
  renderer should:
  - Collapse TabsLayout to an accordion (stacked, one open at a time)
  - Stack all widgets in a single column
  - Switch KPI cards to `cardStyle: 'mini'`
  - Hide chart legends (replaced by tap-to-identify on data points)

- **Print layout**: When the dashboard is printed (or exported to PDF),
  override the layout to a single-column flow with all sections expanded,
  all tabs rendered sequentially, and charts at full width. Add page
  break hints between sections.

### 4.4 Accessibility in rendered dashboards

Every rendered dashboard must meet WCAG 2.1 AA. The convention:

- **Focus management**: Tab moves focus between widgets. Within a widget,
  arrow keys navigate data points. Enter/Space activates (drill-through,
  cross-filter). Escape returns focus to the widget container.

- **Screen reader announcements**: Each widget has an `aria-label` from
  the common config (or auto-generated: "Bar chart: Revenue by Region").
  Data changes trigger `aria-live="polite"` announcements for KPI value
  updates and breach state changes.

- **Color independence**: All status indicators (OK/warning/critical)
  must use shape + color, not color alone. A green circle for OK,
  orange triangle for warning, red diamond for critical. Charts must
  use pattern fills in addition to colors when `highContrastMode` is
  'force' or when `prefers-contrast: more` is detected.

- **Keyboard-accessible charts**: Every data point in a chart must be
  reachable via arrow keys with a tooltip showing the value. This
  matches the existing `phz-grid` core accessibility model.

- **Forced Colors Mode**: Already supported by the existing token
  system. Verify that breach indicators, alert badges, and the
  risk summary widget render correctly with system colors.

### 4.5 Export and sharing

The consumer rendering layer should support these export flows:

- **Widget-level export**: Each widget with `enableExport: true` shows
  an export menu (three-dot icon or right-click) with: Export as CSV
  (data only), Export as PNG (screenshot), Copy to clipboard.

- **Dashboard-level export**: The dashboard header offers: Export all
  data as CSV (one sheet per widget), Export as PDF (print layout),
  Share link (if the consumer's routing supports it).

- **Export event**: The rendering layer emits `export-request` events.
  The consumer's app handles actual file creation and download.
  phz-grid provides utility functions (`exportToCSV`, `exportToPNG`)
  but the consumer decides when and how to call them.

- **Scheduled export**: This is a consumer-side concern. phz-grid
  provides the rendering and export utilities. The consumer builds
  the scheduler. Do not add cron or email-report-delivery features.

### 4.6 Data refresh behavior

Dashboards showing live data need a refresh strategy. The convention:

- **Manual refresh**: A refresh button in the dashboard header calls
  `dataAdapter.execute()` for all widgets on the dashboard. Each widget
  re-renders independently as its data arrives.

- **Polling interval**: The dashboard config can specify
  `refreshIntervalSeconds: number`. The rendering layer sets up a
  `setInterval` that triggers refresh. The interval is paused when
  the dashboard is not visible (Page Visibility API).

- **Streaming**: If the consumer's DataAdapter supports streaming,
  individual widgets can opt in via a `StreamAdapter` extension.
  The rendering layer passes stream events to the widget's `update()`
  method. Do not build full streaming infrastructure — expose the
  hook for consumers who need it.

- **Cache invalidation**: When a filter changes, only widgets affected
  by that filter's field need to re-query. The rendering layer tracks
  which widgets reference which fields and issues targeted refreshes.
  This prevents re-querying the entire dashboard when one filter changes.

### 4.7 Consumer theming integration

The consumer must be able to theme the rendered dashboard to match
their application. The convention:

- **CSS custom properties are the API**: The consumer overrides
  `--phz-*` tokens on the dashboard container element. This works
  with any CSS-in-JS or design system.

- **Theme presets**: The 5 existing themes (light, dark, sand, midnight,
  high-contrast) are available as presets. The consumer can also provide
  a custom theme object:

```typescript
const myTheme: ThemeTokens = {
  surface: '#ffffff',
  text: '#1a1a2e',
  border: '#e0e0e0',
  accent: '#0066cc',
  success: '#198754',
  warning: '#fd7e14',
  critical: '#dc3545',
  chartPalette: ['#0066cc', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#20c997']
}

renderDashboard(config, { theme: myTheme })
```

- **No style leakage**: Shadow DOM on all Lit components prevents
  the consumer's styles from affecting widget internals, and widget
  styles from leaking out. CSS custom properties pierce Shadow DOM
  by design, providing the theming mechanism.

- **Font inheritance**: Widgets inherit `font-family` from the
  consumer's app by default. The `--phz-font` token overrides this
  for the dashboard specifically.

---

## Part 5: Discovery Instructions for Phase 1

During Phase 1 research, additionally document:

### 5.1 Widget props audit

For each of the 20+ existing widget components, extract:
- All `@property()` declarations and their types
- All `@state()` declarations that affect rendering
- All emitted events (`@event`)
- The component's current responsive behavior (does it adapt to container size?)
- Whether it handles empty data, loading, and error states

Produce a table with columns: widget type, props count, has loading state,
has empty state, has error state, emits cross-filter, emits drill-through.
This reveals which widgets need the most work to meet the conventions above.

### 5.2 Interaction audit

Document how widgets currently communicate:
- Is there a central event bus or do widgets communicate via DOM events?
- Does cross-filtering work through the BIEngine or through direct
  widget-to-widget events?
- How does drill-through currently navigate to the target report?

This determines how much of the `InteractionBus` on `RenderContext`
needs to be built from scratch vs. formalized from existing patterns.

### 5.3 Accessibility audit

Check each widget for:
- Keyboard navigation within the chart/table
- ARIA labels and roles
- Screen reader announcements for data updates
- Forced Colors Mode rendering
- Focus management (can you tab into and out of the widget?)

Produce a pass/fail table. This is a significant body of work if
many widgets fail, so it's critical to scope it during Phase 1.
