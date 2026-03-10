# phz-workspace Runtime Contract — Claude Code Instructions

## Context

This document extends the Workspace Consolidation plan. That plan covers persistence,
adapter interfaces, and admin tooling. This document covers what it does not: the runtime
rendering contract between workspace-authored configs and consumer-side rendering.

The core problem: the more expressive the workspace authoring tools become, the more
the consumer renderer must function as a general-purpose interpreter rather than a set
of hardcoded templates. Without a formal rendering contract, configs authored in the
workspace will silently fail or require consumer-side code changes for every new widget
type, layout variation, or data binding pattern.

This is Phase 1 research scope. Produce findings as a section in
`WORKSPACE-CONSOLIDATION-ANALYSIS.md` or as a companion file
`WORKSPACE-RUNTIME-CONTRACT-ANALYSIS.md`.

---

## Phase 1 Additions: Research These Before Any Implementation

### 1.7 Map the widget resolution path

Trace what happens today when a consumer app loads a report config and renders it.
Specifically:

- How does a widget type string in the config (e.g. `"bar-chart"`, `"data-table"`)
  resolve to an actual rendered component?
- Is there an explicit registry, or is the mapping hardcoded in a switch/if-else?
- What happens if a config references a widget type the consumer doesn't have?
- Are widget configs self-describing (they carry enough info to render without
  external knowledge), or do they assume the renderer knows things about them?

Document the current resolution mechanism and classify it:
- **Closed registry**: fixed set of widget types, consumer must know all of them
- **Open registry**: consumer registers renderers, config references them by key
- **Implicit**: no formal registry, widget types are coupled to specific components

If it's closed or implicit, flag this as a flexibility risk and propose the open
registry pattern described in section 2.9.

### 1.8 Map the data query resolution path

A workspace-authored report config will contain data bindings: field references,
groupings, filters, sort orders, and calculated expressions. Trace how these currently
get resolved to actual data:

- Does the consumer app receive a query descriptor from the config and execute it?
- Does the config reference pre-computed data endpoints?
- Does `engine` contain query-building logic that runs at render time?
- Is there an implicit `DataAdapter` interface, or does each consumer hard-wire
  its own data fetching?

Document what the config expects from the consumer in terms of data resolution.
The key question: can a config authored in the workspace be rendered by a consumer
app that uses a completely different data backend, or does the config encode
assumptions about the data layer?

### 1.9 Map expression evaluation boundaries

The five-layer hierarchy (Fields → Parameters → Calculated Fields → Metrics → KPIs)
uses expression trees and dependency graphs. Determine:

- Which layers get evaluated at authoring time (workspace-side) vs. render time
  (consumer-side)?
- Does the consumer need the full expression evaluator from `engine` to render
  a dashboard, or can it work with pre-resolved values?
- If a user changes a filter at runtime, does the expression tree need to be
  re-walked? If yes, the consumer must ship the evaluator, which contradicts
  keeping consumer packages lightweight.
- Can expression evaluation be isolated into a standalone, tree-shakeable module
  that both sides import without pulling in authoring dependencies?

Document the current behavior and flag any cases where the consumer would need
to import workspace-side code to support interactivity.

### 1.10 Audit the config schema for layout portability

Look at how spatial arrangement is currently encoded in report and dashboard configs.
Classify the layout model:

- **Absolute**: explicit grid positions, row/col/span values tied to a specific
  grid system
- **Intent-based**: semantic grouping (e.g. "these widgets form a row with equal
  weight") that a layout engine interprets
- **Mixed**: some parts absolute, some parts semantic

If the layout model is absolute, it locks every consumer into the same grid engine.
Document what would need to change to make it intent-based, or whether a translation
layer between the two is feasible.

### 1.11 Identify config-to-renderer capability mismatches

Check whether any mechanism exists (or is implied) for the consumer to declare what
it supports. For example:

- Can a consumer declare which widget types it can render?
- Can a consumer declare supported interaction models (drill-down, cross-filtering,
  export)?
- What happens today if an admin authors a config using features the consumer can't
  handle?

If there is no capability negotiation, propose where it would live. The simplest
version: the consumer passes a capabilities manifest to `createWorkspaceClient()`,
and the workspace constrains authoring accordingly when operating in context-aware
mode.

### 1.12 Evaluate config schema evolution strategy

The plan mentions "versioned JSON config" but does not specify a migration path.
Research:

- Do current configs carry a schema version field?
- Are there any migration functions or compatibility shims in the codebase?
- What is the oldest config format still in use?

Propose one of:
- **Versioned migrations**: configs carry a version number, a chain of migration
  functions transforms old configs to current shape on load
- **Additive-only schema**: new fields are always optional with defaults, old
  renderers ignore unknown fields, no migration needed
- **Hybrid**: additive for minor changes, migrations for structural changes

Document the trade-offs of each for this specific codebase.

---

## Phase 2 Additions: Build These After Research Confirms the Approach

### 2.9 Implement the widget registry

If Phase 1 confirms no open registry exists, create one. The pattern:

```typescript
// In phz-types
interface WidgetRenderer<TConfig = unknown> {
  type: string
  render(config: TConfig, container: HTMLElement, context: RenderContext): void
  destroy?(): void
}

interface RenderContext {
  data: DataResolver
  theme: ThemeTokens
  interactions: InteractionBus
  locale: string
}

// In the consumer app
import { createWidgetRegistry } from '@phozart/phz-types'

const registry = createWidgetRegistry()
registry.register('bar-chart', MyBarChartRenderer)
registry.register('data-table', MyDataTableRenderer)

// At render time, the engine does:
const renderer = registry.get(widgetConfig.type)
if (!renderer) {
  renderFallback(widgetConfig, container) // graceful degradation
} else {
  renderer.render(widgetConfig, container, context)
}
```

The workspace ships default renderers. The consumer can override any of them or
add new ones. The config never references a specific component class, only a
type string.

### 2.10 Formalize the DataAdapter interface

Separate from the `WorkspaceAdapter` (which handles config persistence), define a
`DataAdapter` that the consumer implements for runtime data resolution:

```typescript
// In phz-types
interface DataQuery {
  fields: FieldReference[]
  groupBy?: FieldReference[]
  filters?: FilterExpression[]
  sortBy?: SortExpression[]
  limit?: number
}

interface DataAdapter {
  execute(query: DataQuery): Promise<DataResult>
  resolveField(ref: FieldReference): Promise<FieldMetadata>
  getAvailableFields(): Promise<FieldMetadata[]>
}

interface DataResult {
  columns: ColumnDescriptor[]
  rows: unknown[][]
  metadata: { totalRows: number; truncated: boolean }
}
```

The workspace builds `DataQuery` objects from the authored config. The consumer's
`DataAdapter` translates them into whatever its backend understands (SQL, REST,
GraphQL, in-memory). The workspace never knows or cares about the underlying
data technology.

### 2.11 Separate config layers

Split artifact configs into two distinct layers:

```typescript
// Data definition: what to compute
interface DataDefinition {
  id: string
  fields: FieldBinding[]
  calculations: CalculatedField[]
  filters: FilterDefinition[]
  parameters: ParameterDefinition[]
}

// Presentation definition: how to display it
interface PresentationDefinition {
  id: string
  dataDefinitionId: string
  layout: LayoutIntent
  widgets: WidgetPlacement[]
  theme?: ThemeOverrides
  responsive?: ResponsiveRules
}

// Layout uses intent, not absolute positions
interface LayoutIntent {
  type: 'flow' | 'grid' | 'tabs' | 'split'
  children: LayoutNode[]
}

interface LayoutNode {
  type: 'group' | 'widget-slot'
  direction?: 'row' | 'column'
  weight?: number          // relative sizing, not absolute pixels
  widgetId?: string        // for widget-slot nodes
  children?: LayoutNode[]  // for group nodes
}
```

This means the same data definition can have multiple presentations (table view,
chart view, mobile layout) without duplicating the data logic.

### 2.12 Add schema versioning

Every persisted config must carry a version field:

```typescript
interface VersionedConfig {
  $schema: 'phz-workspace'
  $version: number          // monotonically increasing integer
  // ... rest of config
}
```

Implement a migration registry:

```typescript
const migrations: Map<number, (config: unknown) => unknown> = new Map()

migrations.set(2, (config: V1Config): V2Config => {
  // transform v1 shape to v2
  return { ...config, $version: 2, newField: defaultValue }
})

function migrateConfig(config: VersionedConfig): CurrentConfig {
  let current = config
  while (current.$version < CURRENT_VERSION) {
    const migrate = migrations.get(current.$version + 1)
    if (!migrate) throw new Error(`No migration from v${current.$version}`)
    current = migrate(current) as VersionedConfig
  }
  return current as CurrentConfig
}
```

Run migrations on load, not on save. Stored configs keep their original version
until explicitly re-saved.

### 2.13 Add capability declaration

```typescript
interface ConsumerCapabilities {
  widgetTypes: string[]                    // which widget types can be rendered
  interactions: InteractionCapability[]    // drill-down, cross-filter, export, etc.
  maxNestingDepth: number                 // layout nesting limit
  supportedLayoutTypes: LayoutIntent['type'][]
}

// Consumer declares at init
const client = createWorkspaceClient({
  adapter: new FetchAdapter({ baseUrl: '/api/phz' }),
  capabilities: {
    widgetTypes: ['bar-chart', 'data-table', 'line-chart', 'kpi-card'],
    interactions: ['drill-down', 'export-csv'],
    maxNestingDepth: 3,
    supportedLayoutTypes: ['flow', 'grid']
  }
})
```

In the workspace, when `capabilities` are provided:
- The widget picker only shows types the consumer supports
- Layout options are constrained to supported types
- A validation pass flags configs that exceed the consumer's declared capabilities

When `capabilities` are not provided, the workspace operates unconstrained (backwards
compatible).

---

## Constraints

- The `DataAdapter` is a consumer-side concern. The workspace package must not ship
  any data-fetching implementation. It defines the query shape, not the execution.
- The widget registry must support lazy loading. A consumer should be able to register
  a widget type with an async import so that widget code is only loaded when a config
  actually uses that type.
- Layout intents must degrade gracefully. If a consumer doesn't support `tabs` layout,
  it should fall back to `flow` without crashing.
- Schema migrations must be pure functions with no side effects. They transform config
  shapes, they don't call APIs or touch the DOM.
- None of these additions should change the public API of existing consumer-side
  packages (`engine`, `widgets`, `criteria`, `core`). New contracts go in `phz-types`.
