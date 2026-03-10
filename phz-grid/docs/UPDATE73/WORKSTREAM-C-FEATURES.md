# Workstream C: Features

> Detailed implementation guide for new widget types, async reports,
> personal alerts, subscriptions, analytics, API spec, and shared
> components.

## Objective

Build all new feature capabilities defined in the spec: 4 new widget types,
expandable widget support, widget view groups, async reports, personal
alerts, subscriptions, usage analytics, OpenAPI generator, expression
builder, preview context picker, attention system, and error/empty message
pools.

## Phase C-1: New Widget Types

### Decision Tree Widget (C-1.01, C-1.02)

**Rendering component:** `packages/widgets/src/decision-tree/phz-decision-tree.ts`

The decision tree renders a hierarchical status list. Each node has:
- Status indicator (colored dot: green = healthy, amber = warning, red = critical)
- Label text
- Current value (formatted via displayValue)
- Drill-through indicator (▸ arrow if drillLink configured)
- Expand/collapse for child nodes

The tree is collapsible — top-level nodes shown by default, children
expanded on click.

**Condition evaluation:**
Each node's condition is evaluated using the same expression engine as
filter rules. The node's status is determined by comparing the evaluated
value against thresholds:

```typescript
function evaluateNodeStatus(
  node: DecisionTreeNode,
  data: DataResult
): 'healthy' | 'warning' | 'critical' {
  const value = evaluateExpression(node.condition, data);
  if (node.thresholds.critical !== undefined && 
      meetsThreshold(value, node.thresholds.critical)) return 'critical';
  if (node.thresholds.warning !== undefined && 
      meetsThreshold(value, node.thresholds.warning)) return 'warning';
  return 'healthy';
}
```

If a node has an `alertRuleBinding`, the alert system can override the
status: when the bound alert fires, the node shows critical regardless
of its own threshold evaluation.

**Authoring (C-1.02):**
In the widget config panel Data tab (workspace only), a structured list
editor for decision tree nodes. Each node has: label input, condition
expression (structured builder), threshold inputs, optional alert binding
dropdown, optional drill link builder (reuse navigation link UI). Indent
to create children. Live preview shows computed status per node.

### Container Box Widget (C-1.03)

**Rendering:** `packages/widgets/src/container-box/phz-container-box.ts`

A styled div that contains child widgets. No data binding.

```typescript
@customElement('phz-container-box')
export class PhzContainerBox extends LitElement {
  @property() config!: ContainerBoxConfig;
  
  render() {
    const style = this.computeBoxStyle();
    return html`
      <div class="container-box" style=${style}>
        ${this.config.title ? html`
          <div class="container-title ${this.config.titlePosition}">
            ${this.config.title}
          </div>
        ` : nothing}
        <slot></slot>  <!-- child widgets rendered via slot -->
      </div>
    `;
  }
}
```

The dashboard canvas manages child positioning within the box. When the
box is dragged, children move with it. When the box resizes, children
reflow within new bounds.

No nesting: a container cannot contain another container. The canvas
validates this on drop.

### Expandable Widget Support (C-1.04)

**Enhancement to existing widget types:** KPI card, gauge, scorecard,
trend-line, and decision tree gain expansion capability.

The expansion is a wrapper around the existing widget:

```typescript
@customElement('phz-expandable-widget')
export class PhzExpandableWidget extends LitElement {
  @property() config!: ExpandableWidgetConfig;
  @property({ type: Boolean }) expanded = false;
  
  render() {
    return html`
      <div class="expandable-widget ${this.expanded ? 'expanded' : ''}">
        <div class="primary-content">
          <slot name="widget"></slot>
          ${this.config.expandable ? html`
            <button class="expand-trigger" @click=${this.toggle}>
              ${this.expanded ? '▾' : '▸'}
            </button>
          ` : nothing}
        </div>
        ${this.expanded ? html`
          <div class="expansion-panel" style="height: ${this.config.expandedHeight}px">
            ${this.config.childWidgets.map(w => this.renderChildWidget(w))}
          </div>
        ` : nothing}
      </div>
    `;
  }
}
```

Child widgets cannot be expandable (no recursive nesting). The wrapper
checks and prevents this.

Animation: CSS transition on height for smooth expansion. The dashboard
grid reflows when a widget expands (push down, not overlay).

**Grid/pivot expansion is different:** Row grouping uses the existing
GroupController. No changes needed — it already works. Just document
the distinction in the spec.

### Widget View Groups (C-1.05)

**Implementation:** A wrapper component that manages multiple views at
the same canvas position.

```typescript
@customElement('phz-widget-view-group')
export class PhzWidgetViewGroup extends LitElement {
  @property() config!: WidgetViewGroup;
  @state() private activeIndex = 0;
  @state() private loadedViews = new Set<number>();
  
  render() {
    const viewCount = this.config.views.length;
    return html`
      <div class="view-group">
        <div class="view-content">
          ${this.renderActiveView()}
        </div>
        <div class="view-switcher">
          ${viewCount === 2 ? this.renderToggleButtons() : this.renderArrowDots()}
        </div>
      </div>
    `;
  }
  
  private renderActiveView() {
    const view = this.config.views[this.activeIndex];
    // Lazy load: only render views that have been activated
    if (!this.loadedViews.has(this.activeIndex)) {
      this.loadedViews.add(this.activeIndex);
      // Trigger data fetch for independent mode
    }
    return this.renderWidget(view.widget);
  }
}
```

### Rich Text Widget (C-1.06)

Enhance the existing text-block widget with a WYSIWYG editor. Use a
lightweight rich text library (Tiptap or ProseMirror) that works within
Shadow DOM.

In authoring mode: full editor with toolbar (bold, italic, link, list,
image). In viewing mode: rendered HTML output.

### Morph Group Updates (C-1.07)

Add new entries to the morph registry:

```typescript
const MORPH_GROUPS = {
  'category-chart': ['bar-chart', 'line-chart', 'area-chart', 'pie-chart'],
  'single-value': ['kpi-card', 'gauge', 'scorecard', 'trend-line'],
  'tabular': ['grid', 'pivot-table'],
  'text': ['text-block', 'heading'],
  'navigation': ['drill-link'],
  'decision': ['decision-tree'],       // NEW
  'container': ['container-box'],      // NEW
};
```

## Phase C-2: Async, Subscriptions, Analytics, Shared Components

### Expression Builder (C-2.10 — build early, used everywhere)

This is the most reused component. Build it first in phz-shared.

```
packages/shared/src/components/expression-builder/
├── expression-builder.ts        # main component
├── structured-mode.ts           # dropdown-based condition builder
├── raw-mode.ts                  # text input with syntax validation
├── expression-types.ts          # condition, operator, value types
├── autocomplete.ts              # field name autocomplete
└── expression-builder.test.ts
```

**Structured mode:** Rows of [field dropdown] [operator dropdown] [value input].
Compound conditions with AND/OR grouping. Add/remove condition rows.
The assembled expression is visible as readable text below.

**Raw mode:** Monaco-style text input (or simpler) with syntax highlighting
and validation. Toggle between structured and raw preserves the expression.

**Complexity modes:** The builder supports three complexity levels:
- `full`: all operators, compound conditions, viewer attributes (admin alerts, filter rules)
- `simple`: threshold + trend only (personal alerts)
- `decision`: threshold + comparison operators (decision tree nodes)

### Preview-as-Viewer Context Picker (C-2.11)

Shared component used in dashboard preview and filter rule testing.

```typescript
@customElement('phz-context-picker')
export class PhzContextPicker extends LitElement {
  @property() roles: string[] = [];
  @state() private selectedRole?: string;
  @state() private userId?: string;
  
  render() {
    return html`
      <div class="context-picker">
        <select @change=${this.onRoleChange}>
          <option value="">Select role...</option>
          ${this.roles.map(r => html`<option value=${r}>${r}</option>`)}
        </select>
        <input type="text" placeholder="Or enter user ID..."
               @input=${this.onUserIdChange} />
      </div>
    `;
  }
  
  getSimulatedContext(): ViewerContext { ... }
}
```

### Message Pools (C-2.13)

Create all pool files as TypeScript const arrays. Each file exports three
arrays (default, minimal, playful). Each array has 20-40 strings.

The message selection function:

```typescript
function pickMessage(
  pool: string[],
  seed?: number
): string {
  // Use a hash of the current session ID or timestamp
  // so messages are consistent within a session but
  // different between sessions
  const index = (seed ?? Date.now()) % pool.length;
  return pool[index];
}
```

### Usage Analytics (C-2.08)

Implementation strategy: a singleton tracker that wraps the UsageAnalyticsAdapter.

```typescript
class UsageTracker {
  private adapter?: UsageAnalyticsAdapter;
  private sessionId: string;
  private enabled: Record<string, boolean> = {};
  private buffer: UsageEvent[] = [];
  
  init(adapter: UsageAnalyticsAdapter, config: AnalyticsConfig) {
    this.adapter = adapter;
    this.enabled = config.categories;
    this.sessionId = crypto.randomUUID();
  }
  
  track(type: UsageEventType, metadata: Record<string, unknown>) {
    if (!this.adapter || !this.enabled[getCategoryForType(type)]) return;
    
    const event: UsageEvent = {
      type,
      userId: this.currentUserId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
    };
    
    this.adapter.trackEvent(event); // fire-and-forget
  }
  
  flush() {
    this.adapter?.flush?.();
  }
}
```

Wire `track()` calls into:
- Lit component lifecycle (connectedCallback for artifact-opened, disconnectedCallback for artifact-closed)
- Event handlers (filter-applied, widget-clicked, etc.)
- Adapter calls (export-triggered, async-report-requested)
- Error handlers (query-failed, load-timeout)

On page unload: call `flush()` via `navigator.sendBeacon` pattern.

### OpenAPI Generator (C-2.09)

Pure function, no side effects. Takes APISpecConfig, returns an OpenAPI 3.1
JSON object.

```typescript
function generateOpenAPISpec(config: APISpecConfig): object {
  const spec = {
    openapi: '3.1.0',
    info: { title: 'phz-grid Data API', version: config.apiVersion || '1.0.0' },
    servers: config.baseUrl ? [{ url: config.baseUrl }] : [],
    paths: {},
    components: { schemas: {}, securitySchemes: {} },
  };
  
  for (const source of config.dataSources) {
    const access = config.roleAccess.filter(r => r.dataSources.includes(source.id));
    if (access.length === 0) continue;
    
    // Generate /data/{sourceId}/query endpoint
    // Generate /data/{sourceId}/export endpoint
    // Generate /data/{sourceId}/schema endpoint
    // Add request/response schemas from DataQuery/DataResult types
    // Add role-based security annotations
  }
  
  // Generate /kpis/{kpiId} endpoints
  // Generate /metrics/{metricId} endpoints
  
  return spec;
}
```

Test by validating the output against the OpenAPI 3.1 JSON Schema.

### Attention System (C-2.12)

The attention system aggregates workspace-generated items and consumer items.

```typescript
class AttentionManager {
  private workspaceItems: AttentionItem[] = [];
  private externalItems: AttentionItem[] = [];
  
  // Workspace-generated items:
  addPendingReview(artifact: ArtifactMeta) { ... }
  addStaleDashboard(artifact: ArtifactMeta, freshness: FreshnessStatus) { ... }
  addBrokenQuery(source: string, error: string) { ... }
  addConflict(artifact: ArtifactMeta, otherUser: string) { ... }
  
  // Consumer items:
  async refreshExternal(adapter: AttentionAdapter, context?: ViewerContext) {
    this.externalItems = await adapter.getExternalItems(context);
  }
  
  // Combined, sorted by priority then timestamp
  getItems(): AttentionItem[] {
    return [...this.workspaceItems, ...this.externalItems]
      .filter(i => !i.acknowledged)
      .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)
                    || b.timestamp - a.timestamp);
  }
  
  getUnreadCount(): number {
    return this.getItems().filter(i => i.priority !== 'info').length;
  }
}
```
