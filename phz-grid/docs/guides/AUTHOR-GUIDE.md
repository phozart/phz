# Author Guide — phz-grid Editor

This guide is written for dashboard authors who build and publish dashboards
and reports using the phz-grid Editor shell. It covers the Editor environment,
template selection, layout management, alert rules, filter configuration,
multi-source dashboards, and the save/publish workflow.

---

## 1. The Editor Shell

The **Editor** is the author's dedicated environment for creating and editing
dashboards, reports, and other artifacts. It is one of three shells in phz-grid
v15:

| Shell | Audience | Purpose |
|-------|----------|---------|
| **Workspace** | Admins | Full authoring, configuration, and governance |
| **Editor** | Authors | Constrained authoring with curated measures and sharing |
| **Viewer** | Analysts | Read-only consumption, dashboards, reports, explorer |

When you sign in as an **author**, the Editor shell opens with:

- **Catalog** with My Work / Shared / Published tabs.
- **Content sidebar** for navigating between artifacts you own or have access to.
- **Data sidebar** for browsing available data sources and measures.
- **Command palette** (Ctrl+K / Cmd+K) for quick navigation to any artifact or
  action.

Install the Editor package in your app:

```bash
npm install @phozart/editor
```

### 1.1 Measure Registry Palette

In the Editor, the field palette is replaced by the **Measure Registry Palette**.
Instead of showing raw database fields, it displays a curated list of measures
defined by your administrator. Each measure has:

- A **display name** (e.g., "Total Revenue" instead of `sum_revenue_usd`).
- A **description** explaining what it represents.
- A **format** (currency, percentage, integer, etc.) so the value displays
  correctly without manual configuration.
- A **category** grouping (e.g., "Financial", "Operational", "Customer").

This means you work with business-friendly names and never need to know the
underlying field names or aggregation formulas. Drag a measure from the palette
onto a widget to bind it.

### 1.2 Constrained Config Panel

The Editor's widget configuration panel is **constrained** by admin-defined
rules. Your administrator controls:

- Which widget types are available to you (e.g., you may see bar charts and KPI
  cards but not pivot tables).
- Which style options are exposed (e.g., color palettes may be limited to
  brand-approved choices).
- Which data sources you can connect to.
- Maximum number of widgets per dashboard.

If a configuration option is not visible in your config panel, it means your
administrator has restricted it. Contact them if you need access to additional
options.

### 1.3 Sharing Flow

The Editor includes a **Share** dialog for distributing your work to specific
users or roles:

1. Open any artifact you own (dashboard, report, or grid).
2. Click **Share** in the toolbar.
3. Choose who to share with:
   - **Specific users** — type their name or email.
   - **Roles** — share with everyone who has a specific role.
   - **Teams** — share with named team groups.
4. Set the permission level: **View only** or **Can edit** (if allowed by your
   admin).
5. Click **Share**. Recipients see the artifact in their **Shared** catalog tab.

Shared artifacts remain under your ownership. You can revoke sharing at any time
from the same dialog.

---

## 2. Template System

Templates give authors a pre-structured starting point that is automatically
matched to data. The template pipeline is: **analyze schema → match templates →
auto-bind fields → validate**.

### Schema Analysis

`analyzeSchema()` inspects a `DataSourceSchema` and produces a `FieldProfile`
describing the data's characteristics.

```typescript
import { analyzeSchema } from '@phozart/workspace';

const profile = analyzeSchema(schema);
// profile.numericFields       — all number-type field names
// profile.categoricalFields   — string fields with low/medium cardinality
// profile.dateFields          — all date-type field names
// profile.identifierFields    — fields flagged semanticHint: 'identifier'
// profile.suggestedMeasures   — numeric fields matching measure name patterns
// profile.suggestedDimensions — categorical/dimension fields
// profile.hasTimeSeries       — true if dateFields.length > 0
// profile.hasCategorical      — true if categoricalFields.length > 0
// profile.hasMultipleMeasures — true if suggestedMeasures.length > 1
```

`suggestedMeasures` uses semantic hints first (`measure`, `currency`,
`percentage`), then falls back to pattern matching against names like `revenue`,
`cost`, `amount`, `profit`, `sales`, `budget`, `spend`, `score`, `value`, etc.

`suggestedDimensions` uses semantic hints (`dimension`, `category`) or
low/medium-cardinality string fields.

### Template Matching

`matchTemplates()` scores each `TemplateDefinition` against a `FieldProfile`
and returns them sorted best-match first.

```typescript
import { matchTemplates } from '@phozart/workspace';
import { DEFAULT_TEMPLATES } from '@phozart/workspace';

const scored = matchTemplates(profile, DEFAULT_TEMPLATES);
// scored[0].template — best match
// scored[0].score    — 0.0–1.0 (fraction of total weight matched)
// scored[0].matchedRationales — human-readable match reasons
```

Each template has `matchRules` with `weight` values. The score is
`matchedWeight / totalWeight`. Rules require minimum field counts by type.

### Auto-Binding Fields

`autoBindFields()` maps template widget slots to data fields from the profile.

```typescript
import { autoBindFields, resolveBindings } from '@phozart/workspace';

const bindings = autoBindFields(template.widgetSlots, profile);
// Returns TemplateBinding[]:
// [{ slotId: 'kpi-1', bindingKey: 'value', fieldName: 'revenue' }, ...]

// Merge auto-bindings with any manual overrides
const resolved = resolveBindings(template.widgetSlots, bindings);
// Returns Map<slotId, { bindingKey: fieldName }>
```

Auto-binding uses key name matching:
- Keys containing `value`, `measure`, `metric` → bound to `suggestedMeasures[]`
  (increments the measure index per binding)
- Keys containing `category`, `dimension`, `label`, `group` → bound to
  `suggestedDimensions[0]` (same dimension reused for all category-type slots)
- Keys containing `date`, `time`, `timestamp` → bound to `dateFields[0]`

### 9 Default Templates

| Template | Category | Best For |
|---|---|---|
| **KPI Overview** | overview | Scorecards with a supporting trend chart |
| **Comparison Board** | analytics | Side-by-side bar charts across measures |
| **Time Series Dashboard** | analytics | Line/area charts over time |
| **Tabular Report** | reports | Data table with summary KPI header |
| **Scorecard** | overview | Multiple KPIs with threshold indicators |
| **Executive Summary** | overview | Headlines + distribution pie + trend |
| **Detail Drill** | reports | Table with drill-link navigation |
| **Distribution Analysis** | analytics | Pie charts + bottom-N rankings |
| **Operational Monitor** | operations | Gauges + status table |

The full set is available as `DEFAULT_TEMPLATES` from `@phozart/workspace`.
Register custom templates alongside the defaults:

```typescript
import { DEFAULT_TEMPLATES } from '@phozart/workspace';

const allTemplates = [
  ...DEFAULT_TEMPLATES,
  myCustomTemplate,
];

const scored = matchTemplates(profile, allTemplates);
```

### Template Validation

`validateTemplate()` checks that a template is internally consistent before
saving or publishing:

```typescript
import { validateTemplate } from '@phozart/workspace';

const result = validateTemplate(template, registry);
// result.valid  — boolean
// result.errors — string[]
```

Validation checks:
- `name` is present
- `widgetSlots` is non-empty
- `matchRules` is non-empty
- `tags` is non-empty
- Every `slot.widgetType` exists in the `ManifestRegistry`
- Every `widgetId` referenced in the `layout` tree corresponds to a slot ID

---

## 3. Dashboard Builder

### LayoutNode Tree

Dashboards are described as a tree of `LayoutNode` discriminated unions:

```typescript
type LayoutNode = TabsLayout | SectionsLayout | AutoGridLayout | WidgetSlot;

// Tabbed layout
interface TabsLayout {
  kind: 'tabs';
  tabs: Array<{ label: string; icon?: string; children: LayoutNode[] }>;
}

// Named, collapsible sections
interface SectionsLayout {
  kind: 'sections';
  sections: Array<{ title: string; collapsed?: boolean; children: LayoutNode[] }>;
}

// CSS grid with responsive min-width
interface AutoGridLayout {
  kind: 'auto-grid';
  minItemWidth: number;  // px
  gap: number;           // px
  maxColumns?: number;
  children: LayoutNode[];
}

// A single widget slot
interface WidgetSlot {
  kind: 'widget';
  widgetId: string;
  weight?: number;    // column-span weight in auto-grid
  minHeight?: number; // px
}
```

Traverse a layout tree using `flattenLayoutWidgets()`:

```typescript
import { flattenLayoutWidgets } from '@phozart/workspace';

const widgetIds: string[] = flattenLayoutWidgets(dashboard.layout);
```

Convert legacy position-based placements to tree layout:

```typescript
import { convertLegacyLayout } from '@phozart/workspace';

const layout = convertLegacyLayout([
  { row: 0, col: 0, colSpan: 2, rowSpan: 1, widgetId: 'kpi-1' },
  { row: 0, col: 2, colSpan: 2, rowSpan: 1, widgetId: 'kpi-2' },
]);
```

### Widget Placement (Reorder & Move)

Widgets within an `AutoGridLayout.children` array are reordered using pure
immutable utilities:

```typescript
import {
  moveWidget,
  insertBefore,
  updateWeight,
} from '@phozart/workspace';

// Move by index
const reordered = moveWidget(widgets, fromIndex, toIndex);

// Insert before another widget (by ID)
const repositioned = insertBefore(widgets, 'widget-id', 'before-widget-id');

// Change column-span weight
const resized = updateWeight(widgets, 'widget-id', 3);
```

To move a widget between sections, remove it from `section[i].children` and
splice it into `section[j].children` — both are `LayoutNode[]` arrays.

### Widget Configuration

Every widget has two config layers:

**WidgetCommonConfig** — universal properties shared by all widget types:

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

Create with sensible defaults:

```typescript
import { defaultWidgetCommonConfig } from '@phozart/workspace';

const config = defaultWidgetCommonConfig({
  title: 'Monthly Revenue',
  loadingBehavior: 'skeleton',
  enableCrossFilter: true,
});
```

**typeConfig** — widget-specific configuration defined per widget type in its
`WidgetManifest.configSchema`.

### Variant Picker

Widget variants are declared in `WidgetManifest.variants`. Each variant has a
`presetConfig` that overrides the widget's `typeConfig` defaults. KPI cards, for
example, offer variants such as `simple`, `with-sparkline`, `with-target`, and
`rich`.

```typescript
const manifest = registry.getManifest('kpi-card');
const variants: WidgetVariant[] = manifest.variants;
// [{ id: 'simple', name: 'Simple', presetConfig: {...} }, ...]
```

Apply a variant by merging its `presetConfig` into the widget's `typeConfig`.

---

## 4. Alert Rules

Alert rules are pure data structures evaluated by pure functions — no HTTP
calls, no DOM access.

### SimpleThreshold (single-metric)

```typescript
import type { AlertRule, SimpleThreshold } from '@phozart/workspace';
import { alertRuleId } from '@phozart/workspace';

const rule: AlertRule = {
  id: alertRuleId('rule-revenue-drop'),
  name: 'Revenue Drop',
  description: 'Alert when revenue falls below $10k',
  artifactId: 'dashboard-1',
  widgetId: 'kpi-revenue',
  condition: {
    kind: 'threshold',
    metric: 'revenue',
    operator: '<',
    value: 10000,
  } satisfies SimpleThreshold,
  severity: 'warning',
  cooldownMs: 3_600_000, // 1 hour
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

Supported operators: `>`, `<`, `>=`, `<=`, `==`, `!=`.

### CompoundCondition (AND / OR / NOT)

```typescript
import type { CompoundCondition } from '@phozart/workspace';

const condition: CompoundCondition = {
  kind: 'compound',
  op: 'AND',
  children: [
    { kind: 'threshold', metric: 'revenue', operator: '<', value: 10000 },
    { kind: 'threshold', metric: 'margin', operator: '<', value: 0.1 },
  ],
};
```

`NOT` takes a single child (`children[0]`).

### Evaluating Rules

```typescript
import { evaluateRule, evaluateRules, evaluateCondition } from '@phozart/workspace';

const values = new Map([
  ['revenue', 8500],
  ['margin', 0.08],
]);

// Evaluate a single rule
const result = evaluateRule(rule, values);
// result.triggered         — boolean
// result.breachedConditions — ConditionResult[]
// result.currentValue      — actual metric value
// result.thresholdValue    — threshold from the rule
// result.message           — human-readable description

// Evaluate a single condition
const condResult = evaluateCondition(condition, values);
// condResult.triggered — boolean

// Evaluate multiple rules (respects cooldown)
const breaches = evaluateRules(rules, values, existingBreaches);
// Returns BreachRecord[] for newly triggered rules only
// Skips rules still within their cooldownMs window
```

### Breach Records and Subscriptions

```typescript
interface BreachRecord {
  id: BreachId;
  ruleId: AlertRuleId;
  status: 'active' | 'acknowledged' | 'resolved';
  severity: 'info' | 'warning' | 'critical';
  currentValue: number;
  thresholdValue: number;
  detectedAt: number;
  message: string;
}

interface AlertSubscription {
  id: string;
  ruleId: AlertRuleId;
  channelId: string;
  recipientRef: string;
  format: 'inline' | 'digest' | 'webhook';
  active: boolean;
}
```

Delivery is handled by a consumer-provided `AlertChannelAdapter`:

```typescript
interface AlertChannelAdapter {
  send(breach: BreachRecord, subscription: AlertSubscription): Promise<void>;
  test(): Promise<boolean>;
  configSchema?: unknown;
}
```

---

## 5. Filter Configuration

### Building a Filter Bar

`buildFilterBarConfig()` generates a `DashboardFilterBarConfig` from an array
of `FieldMetadata`, automatically selecting the appropriate UI control per field.

```typescript
import { buildFilterBarConfig } from '@phozart/workspace';

const config = buildFilterBarConfig(schema.fields, {
  position: 'top',       // 'top' | 'left'
  collapsible: true,
  defaultCollapsed: false,
  showActiveFilterCount: true,
  showPresetPicker: true,
});
```

### Auto-Type Selection

| Field type | Cardinality | UI control |
|---|---|---|
| `string` | `low` | `chip-select` |
| `string` | `medium` (default) | `multi-select` |
| `string` | `high` | `search` |
| `number` | any | `numeric-range` |
| `date` | any | `date-range` |
| `boolean` | any | `boolean-toggle` |

Available `FilterUIType` values: `select`, `multi-select`, `chip-select`,
`tree-select`, `date-range`, `date-preset`, `numeric-range`, `search`,
`boolean-toggle`, `field-presence`.

### Cascading Dependencies

Filters can have parent-child dependencies — selecting a parent value constrains
the options available in child filters.

```typescript
import {
  buildDependencyGraph,
  resolveCascadingDependency,
} from '@phozart/workspace';
import type { FilterDependency } from '@phozart/workspace';

const dependencies: FilterDependency[] = [
  {
    parentFilterId: 'filter-country',
    childFilterId: 'filter-region',
    constraintType: 'data-driven',
  },
  {
    parentFilterId: 'filter-region',
    childFilterId: 'filter-city',
    constraintType: 'data-driven',
  },
];

// Build topologically sorted graph (throws on cycles)
const graph = buildDependencyGraph(dependencies);
// graph.order   — ['filter-country', 'filter-region', 'filter-city']
// graph.children — Map<parentId, childId[]>
// graph.parents  — Map<childId, parentId>

// Fetch constrained options for a child filter
const result = await resolveCascadingDependency(
  adapter,
  cityFilterDef,
  dependencies[1],       // the dependency linking region → city
  selectedRegionValue,   // parent value
  { limit: 100, search: 'San' },
);
// result.values      — available city options
// result.totalCount  — total matches
// result.truncated   — true if limit was reached
```

The `buildDependencyGraph()` function uses Kahn's algorithm and throws an error
if a cycle is detected.

### Filter Presets and URL State

Named preset combinations are stored as artifacts (`type: 'filter-preset'`).
To restore from a URL on page load:

```typescript
import { deserializeFilterState, serializeFilterState } from '@phozart/workspace';

// On page load
const state = deserializeFilterState(new URL(location.href).searchParams.toString());
// state.source === 'url'

// Serialize to share
const qs = serializeFilterState(filterCtx.getState());
history.replaceState(null, '', '?' + qs);
```

---

## 6. Multi-Data-Source Dashboards

When widgets on a single dashboard draw from different data sources, field names
may differ. Use `FieldMapping` to define a canonical field name that maps to
per-source column names.

### FieldMapping

```typescript
interface FieldMapping {
  canonicalField: string;
  sources: Array<{ dataSourceId: string; field: string }>;
}
```

### autoSuggestMappings()

Automatically detects fields with the same name and type across multiple schemas:

```typescript
import { autoSuggestMappings } from '@phozart/workspace';

const mappings = autoSuggestMappings([
  { dataSourceId: 'sales', fields: [{ name: 'country', dataType: 'string' }] },
  { dataSourceId: 'hr',    fields: [{ name: 'country', dataType: 'string' }] },
]);
// => [{ canonicalField: 'country', sources: [{ dataSourceId: 'sales', field: 'country' }, ...] }]
```

Only fields present in 2 or more sources are included.

### resolveFieldForSource()

Translate a canonical field name to the source-specific column name before
passing filters to a data adapter:

```typescript
import { resolveFieldForSource } from '@phozart/workspace';

const actualField = resolveFieldForSource('country', 'hr', mappings);
// => 'country' (falls back to canonical if no mapping found)
```

The `FilterContextManager.resolveFiltersForSource()` applies this automatically
when `fieldMappings` are provided to `createFilterContext()`.

### buildMappingTable()

Builds a unified view of all fields across data sources for the field-mapping
admin UI:

```typescript
import { buildMappingTable } from '@phozart/workspace';

const rows = buildMappingTable(schemas, existingMappings);
// rows[i].canonicalField — the unified field name
// rows[i].dataType       — inferred data type
// rows[i].sources        — Map<dataSourceId, fieldName>
```

---

## 7. Preview and Save

### Preview Mode

Preview mode simulates how the dashboard looks at different viewport widths
without publishing.

```typescript
import {
  createPreviewState,
  togglePreview,
  setViewport,
  getViewportWidth,
  DEFAULT_VIEWPORT_PRESETS,
} from '@phozart/workspace';

let preview = createPreviewState();
// preview.active   — false
// preview.viewport — 'desktop'

preview = togglePreview(preview);  // activate
preview = setViewport(preview, 'tablet');

const widthPx = getViewportWidth(preview, DEFAULT_VIEWPORT_PRESETS);
// => 768

// DEFAULT_VIEWPORT_PRESETS:
// [{ name: 'desktop', width: 1280 }, { name: 'tablet', width: 768 }, { name: 'mobile', width: 375 }]
```

### "Preview As" (ViewerContext Simulation)

Preview the dashboard as a specific user or role to validate row-level security
and permission-based widget visibility:

```typescript
import {
  createPreviewAsState,
  setPreviewContext,
  clearPreviewContext,
} from '@phozart/workspace';
import type { ViewerContext } from '@phozart/workspace';

let previewAs = createPreviewAsState();

previewAs = setPreviewContext(previewAs, {
  userId: 'analyst-007',
  roles: ['analyst'],
  attributes: { region: 'EMEA' },
} satisfies ViewerContext);

// previewAs.active  — true
// previewAs.context — the ViewerContext
// previewAs.recentContexts — last 5 used contexts (deduplicated by userId)

previewAs = clearPreviewContext(previewAs);
// previewAs.active — false, context — undefined
```

Pass `previewAs.context` to `DataAdapter.execute()` as `context.viewerContext`
to simulate the access-controlled view.

### Auto-Save Drafts

Drafts auto-save after 30 seconds of inactivity (`AUTO_SAVE_DELAY_MS = 30000`).

```typescript
import {
  createAutoSaveState,
  markDirty,
  markSaved,
  shouldAutoSave,
  resumeDraft,
  discardDraft,
  markConflict,
  AUTO_SAVE_DELAY_MS,
} from '@phozart/workspace';

let saveState = createAutoSaveState();

// Called whenever the user edits the dashboard
saveState = markDirty(saveState, currentDashboardConfig);

// Poll to decide when to auto-save (call from a setInterval)
if (shouldAutoSave(saveState, Date.now())) {
  await persistDraft(saveState.draft!.data);
  saveState = markSaved(saveState);
}

// On page load: check for an existing draft
const draft = resumeDraft(saveState);
if (draft) {
  // offer to restore
}

// If a concurrent save conflict is detected
saveState = markConflict(saveState, 'Another user saved while you were editing');
// shouldAutoSave() returns false when conflict is true
```

### Version History

```typescript
import {
  formatVersionSummary,
  computeChangeSummary,
} from '@phozart/workspace';

// Format a VersionSummary for display in the history panel
const display = formatVersionSummary(summary);
// display.version          — version number
// display.timeAgo          — 'just now' | '5 minutes ago' | '2 hours ago' | etc.
// display.savedBy          — user identifier
// display.changeDescription — author-provided note

// Diff two config objects to generate a change description
const changes = computeChangeSummary(previousConfig, currentConfig);
// => ['Modified layout', 'Added filters', 'Removed widget-3']
```

`generateChangeDescription()` is not a function in the source — use
`computeChangeSummary()` to produce the change list, then join it into a string
to store as `VersionSummary.changeDescription`.

---

## 8. Report Authoring API

Report authoring uses `ReportEditorState` — an immutable state object
manipulated through pure functions. Every function returns a new state; the
original is never mutated. Import everything from the `authoring` sub-path:

```typescript
import {
  type ReportEditorState,
  addColumn, removeColumn, reorderColumns, updateColumn,
  toggleColumnVisibility, pinColumn,
  addFilter, removeFilter,
  setSorting, setGrouping,
  addConditionalFormat, removeConditionalFormat,
  setDensity, toGridConfig,
} from '@phozart/workspace/authoring';
```

### Creating a Report and Adding Columns

```typescript
let state: ReportEditorState = {
  columns: [],
  filters: [],
  sorting: [],
  grouping: [],
  conditionalFormats: [],
  density: 'comfortable',
};

state = addColumn(state, {
  field: 'revenue',
  header: 'Revenue',
  width: 140,
  dataType: 'number',
  format: 'currency',
});

state = addColumn(state, {
  field: 'region',
  header: 'Region',
  width: 120,
  dataType: 'string',
});

state = addColumn(state, {
  field: 'quarter',
  header: 'Quarter',
  width: 100,
  dataType: 'string',
});
```

### Reordering Columns

`reorderColumns()` moves a column from one position to another. Both indices
are zero-based.

```typescript
// Move the column at index 2 to index 0 (make 'quarter' the first column)
state = reorderColumns(state, 2, 0);
// columns order is now: quarter, revenue, region
```

### Updating and Pinning Columns

```typescript
// Update a column's properties
state = updateColumn(state, 'revenue', { format: 'currency-compact', width: 160 });

// Pin a column to the left or right edge
state = pinColumn(state, 'region', 'left');

// Toggle visibility (hides from the rendered table but keeps the definition)
state = toggleColumnVisibility(state, 'quarter');
```

### Multi-Column Sorting

`setSorting()` replaces the entire sort specification. Each entry has a `field`
and a `direction`.

```typescript
state = setSorting(state, [
  { field: 'region', direction: 'asc' },
  { field: 'revenue', direction: 'desc' },
]);
```

Rows are sorted by region ascending first, then by revenue descending within
each region group.

### Grouping

```typescript
state = setGrouping(state, ['region', 'quarter']);
// Rows are grouped by region, then by quarter within each region
```

### Conditional Format Rules

Conditional formats apply cell-level styling based on data values:

```typescript
state = addConditionalFormat(state, {
  id: 'cf-revenue-high',
  field: 'revenue',
  operator: '>',
  value: 100000,
  style: { backgroundColor: '#e6f4ea', color: '#1e7e34', fontWeight: 'bold' },
});

state = addConditionalFormat(state, {
  id: 'cf-revenue-low',
  field: 'revenue',
  operator: '<',
  value: 10000,
  style: { backgroundColor: '#fce8e6', color: '#c62828' },
});

// Remove a rule by ID
state = removeConditionalFormat(state, 'cf-revenue-low');
```

### Density and Export

```typescript
// Set the row density
state = setDensity(state, 'compact');

// Convert the editor state to a GridConfig for rendering or persistence
const gridConfig = toGridConfig(state);
// gridConfig is a serializable object compatible with createGrid()
```

### Report Context Menus

Context menus are generated from the current editor state. They return arrays
of `ContextMenuItem` objects that your UI framework renders.

```typescript
import {
  getColumnHeaderMenu,
  getCellMenu,
} from '@phozart/workspace/authoring';

// Right-click on a column header
const headerItems = getColumnHeaderMenu(state, 'revenue');

// Right-click on a data cell
const cellItems = getCellMenu(state, { field: 'revenue', rowIndex: 3 });
```

Each `ContextMenuItem` has the following shape:

```typescript
interface ContextMenuItem {
  id: string;             // unique action identifier (e.g. 'sort-asc', 'hide-column')
  label: string;          // display text
  icon?: string;          // icon name or SVG reference
  shortcut?: string;      // keyboard shortcut hint (e.g. 'Ctrl+C')
  disabled?: boolean;     // grayed-out when true
  separator?: boolean;    // renders a divider line before this item
  children?: ContextMenuItem[];  // sub-menu items
}
```

Typical header menu items include: Sort Ascending, Sort Descending, Pin Left,
Pin Right, Unpin, Hide Column, Group By, and conditional formatting shortcuts.
Typical cell menu items include: Copy, Copy Row, Filter By Value, and
drill-through links.

---

## 9. Dashboard Authoring API

Dashboard authoring manages the widget canvas — adding, removing, moving,
resizing, and morphing widgets. Like report authoring, all functions are pure
and return a new `DashboardEditorState`.

```typescript
import {
  type DashboardEditorState,
  addWidget, removeWidget, moveWidget, resizeWidget,
  morphWidget, duplicateWidget,
  selectWidget, deselectWidget,
  getMorphOptions, canMorph,
  type MorphGroup,
} from '@phozart/workspace/authoring';
```

### Adding Widgets

```typescript
let dashboard: DashboardEditorState = {
  widgets: [],
  selectedWidgetId: undefined,
  dragDrop: undefined,
};

dashboard = addWidget(dashboard, {
  widgetId: 'chart-1',
  widgetType: 'bar-chart',
  dataConfig: { dataSourceId: 'sales', measures: ['revenue'], dimensions: ['region'] },
  styleConfig: { colorPalette: 'default' },
  position: { row: 0, col: 0, colSpan: 2, rowSpan: 1 },
});

dashboard = addWidget(dashboard, {
  widgetId: 'kpi-1',
  widgetType: 'kpi-card',
  dataConfig: { dataSourceId: 'sales', measures: ['revenue'] },
  styleConfig: {},
  position: { row: 0, col: 2, colSpan: 1, rowSpan: 1 },
});
```

### Moving and Resizing

```typescript
// Move widget to a new grid position
dashboard = moveWidget(dashboard, 'chart-1', { row: 1, col: 0 });

// Resize widget span
dashboard = resizeWidget(dashboard, 'chart-1', { colSpan: 3, rowSpan: 2 });
```

### Selection

```typescript
dashboard = selectWidget(dashboard, 'chart-1');
// dashboard.selectedWidgetId === 'chart-1'

dashboard = deselectWidget(dashboard);
// dashboard.selectedWidgetId === undefined
```

### Widget Morphing

Morphing changes a widget's type while preserving its `dataConfig`. This lets
authors switch between visual representations without re-configuring data
bindings.

```typescript
// Check if a morph is possible
const allowed = canMorph('bar-chart', 'line-chart'); // true

// Get all available morph targets for a widget type
const options = getMorphOptions('bar-chart');
// => ['line-chart', 'area-chart', 'pie-chart']
// (all types in the same MorphGroup, excluding the source type)

// Perform the morph — dataConfig is preserved, styleConfig is reset to defaults
dashboard = morphWidget(dashboard, 'chart-1', 'line-chart');
```

### Morph Groups

Morphing is only allowed within the same group. The 5 morph groups are:

| Group | Widget Types |
|---|---|
| `category-chart` | `bar-chart`, `line-chart`, `area-chart`, `pie-chart` |
| `single-value` | `kpi-card`, `gauge`, `scorecard`, `trend-line` |
| `tabular` | `grid`, `pivot-table` |
| `text` | `text-block`, `heading` |
| `navigation` | `drill-link` |

Widgets in the `navigation` group have only one member, so they cannot be
morphed. Morphing across groups (e.g., `bar-chart` to `kpi-card`) returns the
state unchanged.

### Duplicating Widgets

```typescript
dashboard = duplicateWidget(dashboard, 'chart-1', {
  newWidgetId: 'chart-1-copy',
  positionOffset: { row: 0, col: 3 },
});
// Creates a deep copy of chart-1 with a new ID, placed at the offset position
```

### Drag-and-Drop State

Drag-and-drop is modeled as an explicit state machine with pure transition
functions:

```typescript
import {
  type DragSource, type DropTarget, type DragDropState,
  startDrag, hoverTarget, cancelDrag,
  computeValidTargets, executeDrop,
} from '@phozart/workspace/authoring';
```

**4 drag source types:**

| Source Type | Description |
|---|---|
| `existing-widget` | A widget already on the canvas being repositioned |
| `palette-widget` | A new widget dragged from the widget palette |
| `field` | A data field dragged from the field list onto a widget |
| `filter` | A filter dragged to reorder the filter bar |

**4 drop target types:**

| Target Type | Description |
|---|---|
| `canvas-cell` | An empty cell on the dashboard grid |
| `widget-zone` | A drop zone within an existing widget (e.g., "drop measure here") |
| `filter-bar` | The filter bar area |
| `trash` | The delete/remove zone |

The drag lifecycle is:

```typescript
// 1. User picks up a widget
let dnd: DragDropState = startDrag({
  type: 'existing-widget',
  widgetId: 'chart-1',
});

// 2. Compute which drop targets are valid for this source
const targets = computeValidTargets(dnd, dashboard);
// => DropTarget[] — highlight these in the UI

// 3. As the user drags, track the hover target
dnd = hoverTarget(dnd, { type: 'canvas-cell', row: 2, col: 0 });

// 4a. User drops — execute the operation
dashboard = executeDrop(dashboard, dnd);
// Moves chart-1 to row 2, col 0

// 4b. Or user cancels
dnd = cancelDrag(dnd);
// dnd is reset; no state change to dashboard
```

---

## 10. Widget Config Panel & Filter Authoring API

### Widget Config Panel

The widget config panel provides a tabbed editing experience for individual
widget settings. It is modeled as `WidgetConfigPanelState` with pure transition
functions:

```typescript
import {
  createConfigForWidget,
  setActiveTab,
  updateDataConfig,
  updateStyleConfig,
  addWidgetFilter,
  removeWidgetFilter,
  applyConfigToWidget,
} from '@phozart/workspace/authoring';
```

```typescript
// Open the config panel for a widget
let panel = createConfigForWidget(dashboard, 'chart-1');
// panel.widgetId     — 'chart-1'
// panel.activeTab    — 'data' (default tab)
// panel.dataConfig   — current data bindings
// panel.styleConfig  — current style overrides
// panel.filters      — widget-level filters

// Switch tabs
panel = setActiveTab(panel, 'style');

// Update data configuration (measures, dimensions, data source)
panel = updateDataConfig(panel, {
  measures: ['revenue', 'cost'],
  dimensions: ['region'],
});

// Update style configuration
panel = updateStyleConfig(panel, {
  colorPalette: 'categorical-8',
  showLegend: true,
  legendPosition: 'bottom',
});

// Add a widget-level filter (scoped to this widget only)
panel = addWidgetFilter(panel, {
  field: 'status',
  operator: 'in',
  value: ['active', 'pending'],
});

// Remove a widget-level filter by field
panel = removeWidgetFilter(panel, 'status');

// Apply the panel state back to the dashboard
dashboard = applyConfigToWidget(dashboard, panel);
```

### Filter Authoring API

Filter authoring provides a structured workflow for creating filter definitions.
There are 5 entry points — each representing a different way an author starts
creating a filter:

```typescript
import {
  type FilterEntryPoint,
  inferFilterDefaults,
  createFilterFromEntry,
  finalizeFilter,
  createDashboardFilterDef,
} from '@phozart/workspace/authoring';
```

The 5 `FilterEntryPoint` types:

| Entry Point | Description |
|---|---|
| `field-list` | Author drags a field from the schema browser |
| `column-header` | Author right-clicks a grid column header |
| `widget-interaction` | Author clicks "filter by" from a widget context menu |
| `filter-bar-add` | Author clicks the "+" button on the filter bar |
| `programmatic` | Created via the API without user interaction |

```typescript
// Create a filter from a field-list entry point
const entry: FilterEntryPoint = {
  type: 'field-list',
  field: 'region',
  dataType: 'string',
  cardinality: 12,
  dataSourceId: 'sales',
};

// Infer sensible defaults based on data type and cardinality
const defaults = inferFilterDefaults(entry);
// defaults.operator — 'in' (because string + low cardinality)
// defaults.uiType   — 'multi-select'
// defaults.label    — 'Region' (title-cased from field name)
```

### Type Inference Table

`inferFilterDefaults()` selects the operator and UI control based on these
rules:

| Data Type | Cardinality | Operator | UI Type |
|---|---|---|---|
| `string` | low (< 20) | `in` | `multi-select` |
| `string` | high (>= 20) | `contains` | `search` |
| `number` | -- | `between` | `numeric-range` |
| `date` | -- | `between` | `date-range` |
| `boolean` | -- | `equals` | `boolean-toggle` |

### Creating and Finalizing Filters

```typescript
// Create a draft filter definition from the entry point
let filterDef = createFilterFromEntry(entry);
// filterDef.field      — 'region'
// filterDef.operator   — 'in'
// filterDef.uiType     — 'multi-select'
// filterDef.label      — 'Region'
// filterDef.required   — false
// filterDef.defaultValue — undefined

// Override any inferred defaults before finalizing
filterDef = { ...filterDef, label: 'Sales Region', required: true };

// Finalize: validates the definition and assigns an ID
const result = finalizeFilter(filterDef);
// result.valid — boolean
// result.filter — the finalized FilterDefinition (if valid)
// result.errors — string[] (if invalid)
```

### Dashboard-Level Filter Definitions

`createDashboardFilterDef()` produces a `FilterDefinition` suitable for adding
to a dashboard's filter bar:

```typescript
const dashFilter = createDashboardFilterDef({
  field: 'year',
  dataType: 'number',
  operator: 'in',
  uiType: 'multi-select',
  label: 'Fiscal Year',
  defaultValue: [2025, 2026],
  position: 0,                // order in the filter bar
  dataSourceId: 'finance',
  cascadeParent: undefined,   // no parent dependency
});

// Add to the dashboard's filter bar config
config.filters = [...config.filters, dashFilter];
```

Combine with the cascading dependency graph from Section 5 to build complex
multi-level filter hierarchies. Dashboard-level filters flow down to all
widgets via the `FilterContextManager`; widget-level filters (added through
the config panel above) are scoped to a single widget only.

---

## 11. Personal Alerts and Subscriptions

As an author, you can create and manage personal alerts and subscriptions in
addition to the alerts defined by administrators.

### Personal Alert Rules

Personal alerts let you monitor metrics that matter to your specific workflow:

1. Open a dashboard or KPI card you want to monitor.
2. Click the **Alert** bell icon on the widget.
3. Define your condition:
   - Select a **metric** (e.g., Revenue).
   - Choose an **operator** (`>`, `<`, `>=`, `<=`, `==`, `!=`).
   - Set a **threshold value**.
   - Choose a **severity** (info, warning, critical).
4. Optionally create a **compound condition** using AND / OR to combine
   multiple threshold checks.
5. Set a **cooldown period** to avoid repeated alerts for the same breach.
6. Click **Save Alert**.

Personal alerts appear in your attention sidebar and can be subscribed to by
other users if you share them.

### Subscriptions

Subscribe to any alert rule (yours or admin-defined) to receive notifications:

- **Inline** — real-time in-app notification.
- **Digest** — aggregated summary at a scheduled interval.
- **Webhook** — JSON payload to an external endpoint.

Manage all subscriptions from the **Subscriptions** panel (envelope icon).

---

## 12. Dashboard Editing with Freeform Grid Layout

v15 dashboards use a **freeform grid layout** that gives authors precise
control over widget placement:

- **Drag to position**: Drag widgets anywhere on the canvas grid. Widgets snap
  to grid cells for alignment.
- **Resize handles**: Drag the edges or corners of a widget to resize it. The
  widget respects its minimum and maximum size bounds (defined in the widget
  manifest).
- **Overlap prevention**: The layout engine automatically shifts widgets to
  prevent overlaps when you drop a widget on an occupied cell.
- **Responsive breakpoints**: The layout automatically reflows to a single
  column on tablet and mobile. You can preview each breakpoint using the
  viewport picker in the toolbar.

### Layout Types

Authors can choose from three layout strategies:

| Layout | Description |
|--------|------------|
| **Auto Grid** | Widgets flow left-to-right with a configurable minimum width per widget. Best for uniform widget sizes. |
| **Sections** | Named, collapsible groups of widgets. Each section has its own grid. Useful for organizing KPIs, charts, and tables into logical blocks. |
| **Tabs** | Multiple tab pages within a single dashboard. Each tab contains its own layout of widgets. |

Combine layout types by nesting them — for example, a Tabs layout where each
tab contains Sections.

---

## 13. Report Editing with 30+ Column Support

v15 reports support **30+ columns** with performance optimizations for wide
tables:

- **Virtual scrolling**: Only the visible columns are rendered. Scroll
  horizontally to see additional columns without performance degradation.
- **Pinned columns**: Pin key columns to the left or right edge so they remain
  visible while scrolling.
- **Column groups**: Group related columns under a shared header (e.g., "Q1"
  spanning Jan/Feb/Mar sub-columns).
- **Micro-widget columns**: Configure specific columns to render sparklines,
  gauges, or delta indicators instead of plain text (see Section 13.1).

### 13.1 Configuring Micro-Widget Cell Renderers

To add a micro-widget to a report column:

1. Open the report in the editor.
2. Click the column you want to enhance in the Columns tab of the config panel.
3. Under **Cell Renderer**, choose from:
   - **Sparkline** — requires a field that contains an array of numbers (time
     series data).
   - **Gauge** — requires a numeric field and a target value.
   - **Delta** — requires a numeric field; displays the change as an arrow with
     percentage.
4. Configure the renderer options (color thresholds, target value, etc.).
5. The preview updates in real time.

---

## 14. Alert Binding on Widgets

Alert binding connects alert rules to specific widgets so the widget displays
health status visually.

### Binding an Alert to a KPI Card

1. Select a KPI card on the dashboard canvas.
2. In the config panel, switch to the **Alerts** tab.
3. Click **Bind Alert Rule** and select an existing rule (or create a new one
   inline).
4. Choose the **visual mode**:
   - **Indicator** — a small colored dot next to the KPI value.
   - **Background** — the card background tints to reflect health.
   - **Border** — a colored left border stripe.
5. The KPI card now reflects the alert state in real time.

You can bind multiple alert rules to the same widget. When multiple rules are
active, the highest severity wins (critical > warning > info).

---

## 15. Impact Chain Authoring

The **Impact Chain** widget displays a horizontal causal flow for root cause
analysis. Authors configure the chain by defining nodes and connections.

### Creating an Impact Chain

1. Add an **Impact Chain** widget to your dashboard from the widget palette.
2. In the config panel, add **nodes**. Each node represents a metric or event:
   - **Label** — the display name.
   - **Data binding** — the measure or KPI that drives the node's value.
   - **Role** — `root-cause`, `intermediate`, or `outcome`.
3. Connect nodes by defining **edges** — directional links from cause to effect.

### Variant Picker

The Impact Chain supports multiple visual variants:

| Variant | Description |
|---------|------------|
| **Standard** | Horizontal left-to-right flow with rounded node boxes |
| **Compact** | Smaller nodes with abbreviated labels, for complex chains |
| **Annotated** | Nodes include hypothesis state labels (confirmed / suspected / ruled-out) |

Select a variant from the **Variant** dropdown in the config panel.

### Hypothesis States

In the **Annotated** variant, each node can carry a hypothesis state:

- **Confirmed** (green check) — this factor has been verified as a cause.
- **Suspected** (amber question) — this factor is under investigation.
- **Ruled out** (grey X) — this factor has been eliminated.

Set hypothesis states by clicking a node in the editor and choosing from the
state dropdown. These annotations help teams collaborate on root cause analysis.

---

*phz-grid Author Guide — updated 2026-03-08*
