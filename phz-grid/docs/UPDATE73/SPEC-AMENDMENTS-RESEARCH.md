# phz-grid Specification Amendments — Design Research Integration

> **Date**: 2026-03-08 | **Status**: Proposed amendments
>
> Four additions derived from competitive design research against
> production implementations (Datadog, AG Grid, Grafana, Tableau, Metabase).
> Each amendment targets a gap where existing PHZ Grid architecture
> already provides the machinery but the UX/widget layer doesn't expose it.

---

## Amendment A: Alert-Aware KPI Cards (Severity-Weighted Visual Treatment)

### A.1 Problem

KPI cards currently display value, label, delta/trend, and context line.
Alert rule bindings exist on decision tree nodes but not on KPI cards.
When a KPI breaches a threshold, the attention system fires a notification,
but the KPI card itself remains visually unchanged. The viewer must notice
the notification separately and mentally correlate it to the card.

Datadog solves this by encoding urgency directly into KPI card background
color: red backgrounds for critical metrics, amber for warning, white for
neutral. The card itself becomes the alert surface.

### A.2 Changes to Widget System (Section 4)

Add `alertRuleBinding` and `alertVisualMode` to KPI card, gauge, scorecard,
and trend-line widget configs:

```typescript
interface SingleValueAlertConfig {
  alertRuleBinding?: string;          // alert rule ID (same as decision tree nodes)
  alertVisualMode: 'none' | 'indicator' | 'background' | 'border';
  alertAnimateTransition: boolean;    // smooth color transition on state change
}
```

**Visual modes:**

| Mode | Healthy | Warning | Critical |
|---|---|---|---|
| `none` | No change | No change | No change |
| `indicator` | Green dot | Amber dot | Red dot (+ pulse animation) |
| `background` | Default card bg | Amber-tinted bg (design token) | Red-tinted bg (design token) |
| `border` | Default border | Amber left border (4px) | Red left border (4px) |

Default: `indicator`. The `background` mode is the strongest visual weight
and should be used sparingly (admin decision, not automatic).

**Design tokens added to `design-tokens.ts`:**

```typescript
// Alert-aware widget tokens
'widget.alert.healthy.bg': string;       // default: transparent
'widget.alert.healthy.indicator': string; // default: semantic green
'widget.alert.warning.bg': string;       // default: amber @ 8% opacity
'widget.alert.warning.indicator': string; // default: semantic amber
'widget.alert.warning.border': string;   // default: semantic amber
'widget.alert.critical.bg': string;      // default: red @ 8% opacity
'widget.alert.critical.indicator': string;// default: semantic red
'widget.alert.critical.border': string;  // default: semantic red
'widget.alert.pulse.duration': string;   // default: '2s'
```

### A.3 Data Flow

The KPI card already receives data through `DashboardDataPipeline`. Alert
state flows through a parallel channel:

1. `AlertChannelAdapter.onAlertFired()` produces `AlertEvent` with
   `ruleId` and `status` ('warning' | 'critical')
2. The attention system already ingests these events (Section 11)
3. New: the widget rendering layer subscribes to alert state for its
   bound `alertRuleBinding` ID
4. Widget re-renders with the alert visual mode applied

**State resolution when multiple signals conflict:** Alert rule status
takes precedence over threshold-based visual logic. If an alert rule is
bound, the widget uses the alert rule's evaluated status. If no alert
rule is bound, the widget uses its own threshold config (existing behavior).

### A.4 Authoring UX (Admin, in widget config panel Data tab)

Add an "Alert Binding" section below the existing data configuration
for single-value widgets:

```
Alert Binding
  Alert rule: [None ▾]     ← dropdown of alert rules in current context
  Visual mode: [Indicator ▾]  ← none | indicator | background | border
  ☐ Animate state transitions

  Preview: [shows current alert state with selected visual mode]
```

The alert rule dropdown filters to rules whose monitored metric matches
the widget's bound KPI/metric when possible (auto-suggest), but allows
any rule (admin override).

### A.5 Container-Query Interaction

At `kpi--minimal` (container width <200px), alert visual modes degrade:

| Mode | Full | Compact | Minimal |
|---|---|---|---|
| `indicator` | Dot + label space | Dot only | Dot only (smaller) |
| `background` | Full card tint | Full card tint | Full card tint |
| `border` | Left border 4px | Left border 3px | Left border 2px |

Background mode scales best at small sizes because it doesn't require
additional space. This is intentional — the admin who chooses background
mode for a KPI card expects it to remain visible at any size.

### A.6 Impact on Existing Architecture

| Component | Change |
|---|---|
| `WidgetManifest` for single-value group | Add `alertRuleBinding` to configSchema |
| Widget render functions | Subscribe to alert state, apply visual mode |
| Design tokens | Add 10 alert-aware tokens |
| Dashboard editor config panel | Add Alert Binding section |
| Container-query responsive classes | Add alert degradation rules |
| Attention system | No change (already produces alert events) |

No new adapters. No new packages. The alert infrastructure exists; this
amendment wires it to the widget rendering layer.

---

## Amendment B: Micro-Widget Cell Renderers (Widget-at-Cell-Scale)

### B.1 Problem

The grid package renders cells as formatted text (numbers, dates, strings)
with conditional formatting (background color, font weight). The widget
package renders KPI cards, sparklines, gauges, and trend-lines as dashboard
widgets at dashboard scale (minimum 150px wide per container-query rules).

AG Grid's finance demo embeds sparkline bar charts, trend arrows, and
color-coded P&L indicators directly in table cells. These are separate
cell renderer implementations, not reuse of their dashboard components.

PHZ Grid already has container-query adaptation (US-008 through US-011)
that progressively simplifies widgets down to `kpi--minimal` at 150px.
The gap is that no adaptation exists below 150px, and the grid's cell
formatting system doesn't accept widget references.

### B.2 Micro-Widget Concept

A micro-widget is a widget rendered at cell scale (typically 60-200px wide,
24-40px tall). It is not a new widget type. It is an existing widget type
rendered through a cell-scale rendering path that strips all chrome (title,
subtitle, padding, legend) and renders only the data visualization core.

```typescript
interface MicroWidgetCellConfig {
  widgetType: 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard';
  dataBinding: {
    valueField: string;           // column that provides the primary value
    compareField?: string;        // column for delta calculation
    sparklineField?: string;      // column containing array of values for sparkline
  };
  displayMode: 'value-only' | 'sparkline' | 'delta' | 'gauge-arc';
  thresholds?: {
    warning?: number | Expression;
    critical?: number | Expression;
  };
}
```

**Display modes at cell scale:**

| Mode | Renders | Min cell width | Typical use |
|---|---|---|---|
| `value-only` | Formatted number + colored status dot | 60px | Status column |
| `sparkline` | Inline SVG line/bar chart, no axes | 80px | Trend column |
| `delta` | Value + arrow + percentage in color | 100px | Change column |
| `gauge-arc` | Semi-circle arc with fill | 60px | Utilization column |

### B.3 Grid Package Changes

Add a new cell renderer type to the grid's formatting system:

```typescript
// Existing cell renderer types (simplified)
type CellRenderer = 'text' | 'number' | 'date' | 'boolean' | 'badge';

// Extended with micro-widget
type CellRenderer = 'text' | 'number' | 'date' | 'boolean' | 'badge'
                  | { type: 'micro-widget'; config: MicroWidgetCellConfig };
```

The `ConditionalFormattingController` already evaluates expressions per
cell. Micro-widget thresholds reuse the same expression engine. The
status dot color in `value-only` mode uses the same semantic color tokens
as alert-aware KPI cards (Amendment A).

### B.4 Sparkline Data Binding

Sparklines require an array of values per row. Two binding strategies:

**Inline array field:** The data source provides a column containing an
array of numbers (e.g., `price_history: [120, 118, 125, 130, 128]`).
The `sparklineField` points to this column.

**Computed from grouped data:** When the grid has group-by applied, the
sparkline can aggregate the child rows' values into a visual summary at
the group header row. This reuses the existing `GroupController` and
aggregation pipeline.

```typescript
interface SparklineDataBinding {
  source: 'inline-array' | 'group-aggregate';
  field: string;
  aggregation?: AggregationFunction;  // for group-aggregate mode
  points?: number;                     // max data points to render (default 20)
}
```

### B.5 Rendering Architecture

Micro-widgets render as Lit elements within the grid's cell slot. They
use the same SVG rendering pipeline as the widgets package but with a
stripped template that removes all widget chrome.

The widget package exports a `renderMicroWidget(config, value, container)`
function that the grid's cell renderer calls. This keeps the dependency
direction correct: grid depends on widgets (already true in the build
chain), widgets don't depend on grid.

**Performance constraint:** Micro-widgets must render in <2ms per cell
to maintain virtual scroll performance at 60fps. The sparkline SVG is
generated once per value and cached. Re-render only on data change.

### B.6 Authoring UX (Report Editor, Column Config)

In the report editor's column configuration panel, a new "Cell Display"
section appears when a numeric column is selected:

```
Cell Display
  Renderer: [Default ▾]   ← text | micro-widget
  
  When micro-widget selected:
  Widget type: [Sparkline ▾]
  Data source: [price_history ▾]   ← array fields in data source
  Display: [sparkline ▾]           ← value-only | sparkline | delta | gauge-arc
  
  Thresholds (optional):
  Warning: [___]
  Critical: [___]
  
  Preview: [renders a sample cell with current config]
```

For dashboard grid widgets, the same configuration appears in the
widget config panel's Data tab, per column.

### B.7 Container-Query Interaction

Micro-widgets are inherently cell-scale. They don't use the dashboard
container-query breakpoints. Instead, they respond to column width:

| Column width | Behavior |
|---|---|
| <60px | Falls back to plain text renderer |
| 60-79px | `value-only` or `gauge-arc` only |
| 80-99px | Adds `sparkline` option |
| 100px+ | All display modes available |

### B.8 Impact on Existing Architecture

| Component | Change |
|---|---|
| Grid `CellRenderer` type | Add `micro-widget` variant |
| Widgets package | Export `renderMicroWidget()` function |
| `ConditionalFormattingController` | Support micro-widget threshold evaluation |
| Report editor column config | Add Cell Display section |
| Dashboard grid widget config | Add per-column Cell Display |
| `WidgetManifest` | No change (micro-widgets aren't manifests; they're a rendering mode) |

New dependency: grid package gains a render-time dependency on widgets
package's `renderMicroWidget()`. This is acceptable since grid already
sits below widgets in the build chain, and `renderMicroWidget` is a
leaf function with no upward dependencies.

**Correction:** Grid currently sits *above* widgets in the dependency
chain (`core → ... → grid → criteria → widgets`). To avoid a circular
dependency, `renderMicroWidget()` must live in a shared location. Two
options:

1. Move it to `phz-shared` as a pure SVG rendering function
2. Use the grid's slot mechanism: the consumer app (or the workspace/viewer
   shell) registers micro-widget renderers at mount time via a renderer
   registry

Option 2 is cleaner. The grid defines a `CellRendererRegistry` interface.
The shell populates it with widget-package renderers at mount time. No
build-time dependency inversion needed.

```typescript
interface CellRendererRegistry {
  register(type: string, renderer: MicroWidgetRenderer): void;
  get(type: string): MicroWidgetRenderer | null;
}

interface MicroWidgetRenderer {
  render(config: MicroWidgetCellConfig, value: unknown, container: HTMLElement): void;
  update(config: MicroWidgetCellConfig, value: unknown): void;
  destroy(): void;
}
```

The grid checks the registry when it encounters a `micro-widget` cell
renderer config. If the renderer isn't registered (e.g., consumer app
didn't mount the widget package), it falls back to plain text.

---

## Amendment C: Impact Chain Widget (Causal Narrative Variant)

### C.1 Problem

The decision tree widget evaluates conditions hierarchically and renders
as a vertical tree with healthy/warning/critical status per node. It
answers "what's the current state of these conditions?"

It does not answer "what caused this problem and what did it affect?"
That's a different question with a different visual structure. Datadog's
investigation graphs render ROOT CAUSE → CRITICAL FAILURE → IMPACT as
a horizontal directed chain with typed edges and hypothesis states
(Validated/Inconclusive/Invalidated).

The decision tree's node structure (`condition`, `thresholds`,
`alertRuleBinding`, `drillLink`, `children`) already contains most of
the data model needed. The gap is the rendering and the semantic
relationship types between nodes.

### C.2 Impact Chain as a Decision Tree Variant

Rather than a new widget type, the impact chain is a rendering variant
of the decision tree widget, within the same `decision` morph group.
This means:

- Same `DecisionTreeNode` base structure
- Same expression engine for conditions
- Same alert rule binding
- Same drill-through links
- Different rendering (horizontal flow vs. vertical tree)
- Additional node metadata (relationship type, hypothesis state)

### C.3 Extended Node Structure

```typescript
interface ImpactChainNode extends DecisionTreeNode {
  // Additional fields for impact chain variant
  nodeRole?: 'root-cause' | 'failure' | 'impact' | 'hypothesis';
  hypothesisState?: 'validated' | 'inconclusive' | 'invalidated' | 'pending';
  impactMetrics?: {
    label: string;
    value: string;          // format string
    field: string;          // data field reference
  }[];
  edgeLabel?: string;        // label on the connecting edge ("causes", "triggers", "affects")
}
```

`nodeRole` determines the visual treatment:

| Role | Visual | Color token |
|---|---|---|
| `root-cause` | Emphasized card with left accent | `chain.rootCause.accent` |
| `failure` | Standard card with status indicator | `chain.failure.accent` |
| `impact` | Card with quantified metrics | `chain.impact.accent` |
| `hypothesis` | Card with hypothesis state badge | State-dependent |

`hypothesisState` renders as a colored badge on the node:

| State | Badge color | Badge label |
|---|---|---|
| `validated` | Green | Validated |
| `inconclusive` | Gray | Inconclusive |
| `invalidated` | Red/strikethrough | Invalidated |
| `pending` | Amber/pulsing | Investigating |

### C.4 Rendering

Horizontal layout with directed edges (arrows). Nodes flow left-to-right
(or top-to-bottom on narrow containers).

```
┌────────────────────────────────────────────────────────────────┐
│  Service Health Impact Chain                                    │
│                                                                │
│  ┌──────────┐        ┌──────────────┐        ┌──────────────┐ │
│  │ROOT CAUSE│───────▸│   FAILURE    │───────▸│    IMPACT    │ │
│  │          │ causes │              │triggers│              │ │
│  │ Deploy   │        │ Query engine │        │ 4 services   │ │
│  │ v2.3.1   │        │ latency      │        │ 183 users    │ │
│  │          │        │ +340ms       │        │ 3 views      │ │
│  │[Validated]│        │ [Validated]  │        │              │ │
│  └──────────┘        └──────────────┘        └──────────────┘ │
│                              │                                 │
│                      ┌───────▾───────┐                         │
│                      │  HYPOTHESIS   │                         │
│                      │               │                         │
│                      │ DB CPU        │                         │
│                      │ overload      │                         │
│                      │               │                         │
│                      │[Invalidated]  │                         │
│                      └───────────────┘                         │
└────────────────────────────────────────────────────────────────┘
```

### C.5 Integration with Decision Tree

The widget type remains `decision-tree`. A new field on the widget config
selects the rendering variant:

```typescript
interface DecisionTreeWidgetConfig {
  // Existing fields...
  nodes: DecisionTreeNode[];
  
  // New field
  renderVariant: 'tree' | 'impact-chain';
  
  // Impact chain layout options (only when renderVariant = 'impact-chain')
  chainLayout?: {
    direction: 'horizontal' | 'vertical';   // default: horizontal
    showEdgeLabels: boolean;                 // default: true
    collapseInvalidated: boolean;            // default: false
    conclusionText?: string;                 // natural language summary at end
  };
}
```

**Morph behavior:** The decision tree widget stays in the `decision` morph
group. It cannot morph to other widget types. The variant switch
(`tree` ↔ `impact-chain`) is available in the Style tab, not as a morph
operation — because it changes the rendering, not the data semantics.

### C.6 Responsive Behavior

| Container width | Layout |
|---|---|
| >600px | Horizontal flow, full node cards |
| 400-600px | Vertical flow, full node cards |
| 200-400px | Vertical flow, compact cards (role badge + label + status only) |
| <200px | Summary only: "3 validated, 1 invalidated" with drill-through |

### C.7 Authoring UX

Same structured list editor as the decision tree (Section 9.6), with
additional fields visible when `renderVariant = 'impact-chain'`:

```
Render variant: [Impact Chain ▾]

Node 1: [Deploy v2.3.1]
  Role: [Root Cause ▾]
  Hypothesis state: [Validated ▾]
  Edge label to next: [causes]
  Impact metrics:
    + [Add metric]
  
Node 2: [Query engine latency]
  Role: [Failure ▾]
  ...

Chain conclusion text:
[_________________________________________________]
"A deployment of v2.3.1 caused query engine latency
 affecting 4 services and 183 users."
```

The conclusion text field supports template variables that resolve against
the data context: `{node.deploy.value}`, `{node.impact.services.count}`.

### C.8 Impact on Existing Architecture

| Component | Change |
|---|---|
| `DecisionTreeNode` interface | Extend with optional impact chain fields |
| Decision tree widget renderer | Add horizontal flow rendering path |
| Widget config schema | Add `renderVariant` and `chainLayout` |
| Dashboard editor config panel | Show variant picker + chain-specific fields |
| Design tokens | Add 6 chain-specific tokens |
| Container-query responsive | Add chain-specific breakpoints |

No new morph group. No new widget type registration. The `WidgetManifest`
for `decision-tree` gains a new variant entry:

```typescript
variants: [
  { id: 'tree', name: 'Status Tree', description: 'Vertical hierarchical status', presetConfig: { renderVariant: 'tree' } },
  { id: 'impact-chain', name: 'Impact Chain', description: 'Horizontal causal flow', presetConfig: { renderVariant: 'impact-chain' } },
]
```

---

## Amendment D: Faceted Attention Filtering

### D.1 Problem

The attention system (Section 11) aggregates signals from multiple sources:
alert breaches, pending reviews, stale dashboards, broken queries, external
events. The viewer sees these in a flat list sorted by priority then
timestamp (Section 6.7).

At low volume (<10 items), this works. At operational scale (50+ alerts
across multiple contexts, teams, and severity levels), a flat list becomes
the problem it was designed to solve. The viewer is overwhelmed by
notifications and can't find what matters.

Datadog's incident response panel solves this with faceted filters on the
left: Urgency (HIGH: 127, LOW: 234), Team, Service. Each filter narrows
the list progressively. This is decision architecture: reduce cognitive
load by eliminating irrelevant items before the user reads them.

PHZ Grid already has the criteria package — the same filter bar used on
dashboards. The attention system has structured `AttentionItem` objects
with `priority`, `source`, and `actionTarget`. The gap is that the
attention dropdown and sidebar view don't use the criteria package to
filter attention items.

### D.2 Attention View Levels

The attention system renders at three scales (already defined in
Section 11.1). This amendment changes the behavior at the sidebar and
widget scales:

| Scale | Current behavior | Amended behavior |
|---|---|---|
| Header badge + dropdown | Flat list, 5-10 items | Unchanged (too small for facets) |
| Sidebar nav item (CONTENT > Attention) | Same flat list, full height | Faceted filter panel + filtered list |
| Dashboard attention widget | Same flat list in widget | Mini-faceted summary with drill-through |

### D.3 Sidebar Attention View

```
┌──────────────────────────────────────────────────────────────┐
│  Attention                                         [Mark all]│
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│  Filters       │  ● Revenue threshold   2m ago              │
│                │    South region below $500K                 │
│  Priority      │    [Open Dashboard]                         │
│  ● Critical  3 │                                             │
│  ● Warning  12 │  ● Stale dashboard    1h ago               │
│  ○ Info      8 │    Ops Monitor: data 6h old                │
│                │    [Open Dashboard]                         │
│  Source        │                                             │
│  Alert      10 │  ● Pending review     3h ago               │
│  System      5 │    Q1 Report submitted by J. Chen          │
│  External    8 │    [Review]                                 │
│                │                                             │
│  Artifact      │  ○ Weekly snapshot     8h ago               │
│  Sales Dash  4 │    Revenue $4.2M, Margin 32%               │
│  Ops Monitor 6 │    [Open Dashboard]                         │
│  Q1 Report   2 │                                             │
│                │  [Load more...]                             │
│                │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

### D.4 Facet Definitions

Facets are computed from the `AttentionItem` collection, not admin-
configured. The system derives them automatically:

```typescript
interface AttentionFacet {
  field: keyof AttentionItem;
  label: string;
  values: { value: string; count: number; color?: string }[];
  multiSelect: boolean;
}

// Built-in facets (always present)
const ATTENTION_FACETS: AttentionFacet[] = [
  {
    field: 'priority',
    label: 'Priority',
    values: [], // computed from data
    multiSelect: true,
  },
  {
    field: 'source',
    label: 'Source',
    values: [], // computed: 'alert' | 'system' | 'external'
    multiSelect: true,
  },
];

// Dynamic facets (computed from data)
// Artifact facet: groups items by their actionTarget artifact name
// Context facet: groups items by the context they belong to (if multi-context)
```

**Priority facet** uses the existing priority values with semantic colors:
critical (red dot), warning (amber dot), info (gray dot). Counts shown
inline.

**Source facet** groups by `AttentionItem.source`. Workspace-generated
items break down into sub-types (alert, stale, review, broken-query).

**Artifact facet** groups items by the artifact they reference (via
`actionTarget`). Only shown when >3 distinct artifacts have attention
items.

### D.5 Filter Mechanics

Faceted filtering on attention items uses a simplified version of the
criteria engine. It does not use `FilterDefinition` or the full criteria
package — that would be overengineered. Instead, it uses a lightweight
in-memory filter:

```typescript
interface AttentionFilterState {
  priority?: ('critical' | 'warning' | 'info')[];
  source?: string[];
  artifactId?: string[];
  acknowledged?: boolean;          // default: false (hide acknowledged)
  dateRange?: { from: number; to: number };
}

function filterAttentionItems(
  items: AttentionItem[],
  filters: AttentionFilterState
): AttentionItem[] {
  // Pure function, no side effects
  // AND across facets, OR within a facet
}
```

This is a pure function in `phz-shared`, not a criteria engine dependency.
The criteria package is for data queries with server-side execution,
complex filter types, and admin configuration. Attention filtering is
client-side only, always in-memory, and auto-configured.

### D.6 Dashboard Attention Widget

When the attention summary widget (Section 11.1) is placed on a dashboard,
it renders a compact faceted view:

```
┌──────────────────────────────────┐
│  Attention Summary               │
│                                  │
│  ●3 Critical  ●12 Warning  ○8   │
│  ──────────────────────────────  │
│  Top items:                      │
│  ● Revenue threshold    2m  ▸   │
│  ● Stale: Ops Monitor   1h  ▸   │
│  ● Pending review        3h  ▸   │
│                                  │
│  [View all (23) →]               │
└──────────────────────────────────┘
```

"View all" navigates to the sidebar attention view (full shell mode)
or fires a navigation event (component mode) for the consumer app to
handle.

### D.7 Container-Query Behavior

| Container width | Widget renders |
|---|---|
| >280px | Priority summary bar + top 3 items + "View all" |
| 200-280px | Priority counts only + "View all" |
| <200px | Badge count only (same as header badge) |

### D.8 Impact on Existing Architecture

| Component | Change |
|---|---|
| `phz-shared` | Add `filterAttentionItems()` pure function |
| Viewer sidebar | Add attention view with facet panel |
| Workspace sidebar (CONTENT > Attention) | Same faceted view |
| Attention summary widget | Add compact faceted rendering |
| `AttentionItem` interface | No change (existing fields suffice for facets) |
| `AttentionAdapter` | No change |
| Criteria package | No dependency (attention filtering is standalone) |
| Design tokens | Add 3 tokens for facet panel styling |

The key architectural decision here is to **not** use the criteria package.
Attention filtering is a simpler problem: small data set (<1000 items),
always in-memory, auto-derived facets, no admin configuration, no
server-side execution. Building a dependency on the criteria package
would couple two concerns that evolve at different speeds.

---

## Cross-Amendment Dependencies

```
Amendment A (Alert-Aware KPI Cards)
    │
    └── Alert visual tokens used by Amendment B (micro-widget status dots)

Amendment B (Micro-Widget Cell Renderers)
    │
    └── CellRendererRegistry pattern used at shell mount time
    
Amendment C (Impact Chain Widget)
    │
    └── Standalone (extends decision tree, no dependency on A or B)

Amendment D (Faceted Attention)
    │
    └── Standalone (no dependency on A, B, or C)
```

Amendments A and B share design tokens for status colors. Amendments C
and D are fully independent and can be implemented in any order.

**Recommended implementation sequence:**

1. **Amendment A** first — smallest surface area, highest visual impact,
   validates the alert-to-widget-rendering pipeline
2. **Amendment D** next — improves operational UX immediately, no widget
   system changes needed
3. **Amendment B** third — largest implementation scope, requires the
   CellRendererRegistry pattern to be designed correctly
4. **Amendment C** last — extends an existing widget type, benefits from
   lessons learned in A's alert binding integration

---

## BRD Impact Summary

| Amendment | New User Stories (est.) | Priority distribution |
|---|---|---|
| A: Alert-Aware KPI Cards | 4-6 | 2 Must, 2 Should, 1-2 Could |
| B: Micro-Widget Cell Renderers | 8-10 | 3 Must, 3 Should, 2-4 Could |
| C: Impact Chain Widget | 5-7 | 2 Must, 2 Should, 1-3 Could |
| D: Faceted Attention | 4-5 | 2 Must, 1 Should, 1-2 Could |

Total estimated addition: 21-28 user stories across 4 amendments.
Current BRD has 144 user stories across 16 epics. These amendments
would fall under existing epics (Epic 7: Dashboard Widgets for A/B/C,
Epic 13: Alerts for A, Epic 11: Navigation & Shell for D) rather than
creating new epics.
