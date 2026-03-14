# Filter System, Report Admin & Integration Architecture

> **Status**: ACCEPTED — implementing Option D with refinements D1-D6
> **Date**: 2026-02-27
> **Scope**: Filter Definitions, Filter Bindings, Report Configuration, Dashboard Configuration, Admin UI, Runtime Resolution

---

## Table of Contents

1. [Current State Map](#1-current-state-map)
2. [How the Pieces Currently Connect](#2-how-the-pieces-currently-connect)
3. [Identified Gaps & Disconnections](#3-identified-gaps--disconnections)
4. [Architecture Analysis: Industry Patterns](#4-architecture-analysis-industry-patterns)
5. [Proposed Options](#5-proposed-options)
6. [Recommendation](#6-recommendation)
7. [Detailed Design for Recommended Option](#7-detailed-design-for-recommended-option)
8. [Migration Strategy](#8-migration-strategy)
9. [Decision Log](#9-decision-log)

---

## 1. Current State Map

### 1.1 Three Parallel Filter Systems

The codebase currently has **three separate systems** that handle filtering, each designed at a different time with different goals:

#### System A: Legacy Inline Criteria (`CriteriaConfig`)

**Location**: `packages/core/src/types/selection-context.ts` (lines 221-226)

```
CriteriaConfig
  ├── fields: SelectionFieldDef[]     ← filter definitions inline
  ├── dependencies?: CriterionDependency[]
  ├── presets?: SelectionPreset[]
  └── behavior?: CriteriaBehavior
```

**Used by**:
- `ReportConfig.criteriaConfig` (report.ts:52)
- `DashboardConfig.criteriaConfig` (dashboard.ts:53)
- `selection-criteria.ts` — full logic (validation, defaults, dependencies, URL serialization, data filtering)
- All criteria UI components (`<phz-criteria-bar>`, `<phz-criteria-panel>`, etc.)

**Characteristics**:
- Filters defined **inline** per report/dashboard — no reuse across artefacts
- Full feature set: validation, dependency resolution, dynamic date presets, URL serialization, data-binding, export metadata
- Mature, battle-tested codebase (~950 lines of pure logic)

#### System B: Filter Definition Registry (`CriteriaEngine`)

**Location**: `packages/engine/src/criteria-engine.ts` + supporting modules

```
CriteriaEngine (facade)
  ├── registry: FilterRegistry          ← reusable definitions
  ├── bindings: FilterBindingStore       ← N:M definition ↔ artefact
  ├── stateManager: FilterStateManager   ← 6-level resolution
  ├── ruleEngine: FilterRuleEngine       ← programmatic constraints
  ├── output: CriteriaOutputManager      ← SQL criteria generation
  └── admin: FilterAdminService          ← permissions + audit
```

**Used by**:
- `<phz-filter-studio>` (create/edit definitions)
- `<phz-filter-picker>` (bind definitions to artefacts)
- Test suites

**Characteristics**:
- Centralized, reusable filter definitions
- Binding layer allows per-artefact overrides (label, required, default, visibility, bar config)
- 6-level state resolution chain (rule > preset > persisted > binding default > definition default > all)
- Admin features: permissions, audit trail, immutability enforcement
- BUT: no URL serialization, no direct data-filtering, no dynamic date preset resolution
- Missing connective tissue to System A

#### System C: Enhanced Dashboard Global Filters

**Location**: `packages/engine/src/dashboard-enhanced.ts` (lines 16-26)

```
GlobalFilter
  ├── id: string
  ├── label: string
  ├── fieldKey: string
  ├── filterType: GlobalFilterType       ← 5 types (simplified)
  ├── defaultValue?: unknown
  └── targetWidgetIds?: WidgetId[]       ← optional widget scoping
```

**Used by**:
- `EnhancedDashboardConfig.globalFilters` (dashboard-enhanced.ts:73)
- Dashboard builder/studio components

**Characteristics**:
- Simplified filter model (only 5 types vs 10 in System A/B)
- Widget-scoped targeting (can filter specific widgets)
- No connection to System A or B
- No registry, no binding, no state resolution

### 1.2 Artefact Configuration

#### ReportConfig (report.ts)

```typescript
interface ReportConfig {
  id: ReportId;                          // branded type
  // ... columns, sort, aggregation, etc.
  selectionFields?: string[];            // ⚠ field names, not IDs
  criteriaConfig?: CriteriaConfig;       // ⚠ System A (legacy inline)
  // NO artefactId field
  // NO reference to System B (FilterBinding)
}
```

#### DashboardConfig (dashboard.ts)

```typescript
interface DashboardConfig {
  id: DashboardId;                       // branded type
  selectionFields?: string[];            // ⚠ same issue
  criteriaConfig?: CriteriaConfig;       // ⚠ System A (legacy inline)
}
```

#### EnhancedDashboardConfig (dashboard-enhanced.ts)

```typescript
interface EnhancedDashboardConfig {
  id: DashboardId;
  globalFilters: GlobalFilter[];         // ⚠ System C (separate system)
  // NO criteriaConfig
  // NO reference to System B
}
```

### 1.3 ID Type Mismatch

```
ReportId      = string & { __brand: 'ReportId' }       ← engine/src/types.ts
DashboardId   = string & { __brand: 'DashboardId' }    ← engine/src/types.ts
ArtefactId    = string & { __brand: 'ArtefactId' }     ← core/src/types/selection-context.ts
```

System B uses `ArtefactId` as the generic link target. ReportConfig uses `ReportId`. DashboardConfig uses `DashboardId`. These are **incompatible branded types** — you cannot pass a `ReportId` where `ArtefactId` is expected without an explicit cast.

**No converter function exists.**

### 1.4 BIEngine Facade (engine.ts)

The top-level `BIEngine` facade integrates:
- `reports: ReportConfigStore`
- `dashboards: DashboardConfigStore`
- KPIs, metrics, aggregation, pivot, chart projection, drill-through

**Missing from BIEngine**:
- No `criteria: CriteriaEngine` — the criteria engine is not integrated
- No bridge between report/dashboard stores and filter binding store
- No lifecycle that wires artefact IDs to filter bindings

### 1.5 UI Components

| Component | Package | What it does | What it connects to |
|-----------|---------|--------------|---------------------|
| `<phz-report-designer>` | engine-admin | 6-step report wizard | BIEngine (data products, reports) |
| `<phz-filter-studio>` | engine-admin | Filter definition editor | Nothing (emits events) |
| `<phz-filter-picker>` | engine-admin | Bind definitions to artefact | Nothing (emits events) |
| `<phz-dashboard-builder>` | engine-admin | Dashboard layout editor | BIEngine |
| `<phz-criteria-bar>` | criteria | Runtime filter bar | CriteriaConfig (System A) |
| `<phz-selection-criteria>` | criteria | Full criteria panel | CriteriaConfig (System A) |
| `<phz-global-filter-bar>` | engine-admin | Dashboard filter bar | GlobalFilter (System C) |

---

## 2. How the Pieces Currently Connect

### 2.1 Intended Data Flow (System B — Never Fully Wired)

```
                    ADMIN TIME                              RUNTIME
                    ─────────                              ───────
  ┌───────────────┐     ┌───────────────┐     ┌──────────────────┐
  │ Filter Studio │────▶│  FilterRegistry │    │ resolveArtefact  │
  │ (create def)  │     │  (store defs)   │───▶│   Fields()       │
  └───────────────┘     └───────────────┘     │ (merge def+bind) │
                              │                └────────┬─────────┘
                              │                         │
  ┌───────────────┐     ┌─────▼─────────┐     ┌────────▼─────────┐
  │ Filter Picker │────▶│ BindingStore   │    │ SelectionFieldDef[]│
  │ (bind to art) │     │ (N:M links)    │───▶│  (runtime shape)  │
  └───────────────┘     └───────────────┘     └────────┬─────────┘
                                                        │
                                                ┌───────▼────────┐
                                                │ Criteria UI    │
                                                │ (bar/panel)    │
                                                └───────┬────────┘
                                                        │
                        ┌───────────────┐      ┌───────▼────────┐
                        │ FilterRules   │─────▶│ State Manager  │
                        │ (constraints) │      │ (6-level)      │
                        └───────────────┘      └───────┬────────┘
                                                        │
                                               ┌───────▼────────┐
                                               │CriteriaOutput  │
                                               │(SQL operators)  │
                                               └───────┬────────┘
                                                        │
                                               ┌───────▼────────┐
                                               │ Filtered Data  │
                                               └────────────────┘
```

### 2.2 What Actually Happens Today

```
  ┌───────────────┐          ┌───────────────────┐
  │ Report Designer│─ save ──▶│ReportConfig        │
  │ (6 steps)     │          │ .criteriaConfig? ──▶ System A (inline)
  │ NO filter     │          │ .selectionFields?──▶ string[] (unused)
  │ binding step  │          │ NO artefactId      │
  └───────────────┘          └───────────────────┘
                                       │
                                       ▼
                             ┌───────────────────┐
                             │ <phz-criteria-bar> │
                             │ reads CriteriaConfig│
                             │ (System A only)    │
                             └───────────────────┘

  ┌───────────────┐     ┌───────────────┐
  │ Filter Studio │     │ FilterRegistry │     ← These exist but are
  └───────────────┘     └───────────────┘       NOT wired to anything
                                                above
  ┌───────────────┐     ┌───────────────┐
  │ Filter Picker │     │ BindingStore   │     ← Same — disconnected
  └───────────────┘     └───────────────┘
```

### 2.3 The Gap Summary

The registry-based system (System B) was designed but never connected to:
1. The report/dashboard configuration stores
2. The BIEngine facade
3. The report designer wizard
4. The runtime criteria UI components

---

## 3. Identified Gaps & Disconnections

### Gap 1: Report Designer Has No Filter Binding Step

`<phz-report-designer>` has 6 steps: Data Product → Columns → Filters & Sort → Aggregation → Drill-Through → Review.

Step 3 ("Filters & Sort") only handles **pre-load filters** — simple `{ field, operator, value }` triples applied before data loads. It does NOT:
- Bind filter definitions from the registry
- Configure user-facing selection criteria
- Embed `<phz-filter-picker>`
- Allow creating new filter definitions inline

The save event emits `preFilters` but nothing about criteria configuration or filter bindings.

### Gap 2: Type Mismatch — ReportId vs ArtefactId

`FilterBinding.artefactId` is `ArtefactId` (branded). `ReportConfig.id` is `ReportId` (branded). These are incompatible. No converter function exists. The assumption is `artefactId(reportId as string)` but this is fragile and undocumented.

### Gap 3: ReportConfig.selectionFields is `string[]`

`selectionFields?: string[]` stores field names, not `FilterDefinitionId[]`. This cannot link to the registry. It's also unused — nothing reads this field at runtime.

### Gap 4: Legacy CriteriaConfig Coexists with Registry

Both `ReportConfig.criteriaConfig` (System A) and the registry binding system (System B) can describe filters for the same artefact. There is:
- No flag indicating which system is active
- No runtime resolution that checks both
- No warning if both are configured
- A migration helper `migrateCriteriaConfig()` exists but is never called automatically

### Gap 5: BIEngine Does Not Include CriteriaEngine

`createBIEngine()` creates report and dashboard stores but does NOT create or expose a `CriteriaEngine`. The criteria system is a completely separate instantiation path.

### Gap 6: Three Filter Systems, No Unification

Systems A, B, and C each define filters differently:
- System A: `SelectionFieldDef` with 10 types
- System B: `FilterDefinition` with 10 types (superset of A)
- System C: `GlobalFilter` with 5 types

The criteria UI components only understand System A. There is no adapter from B→A or C→A.

### Gap 7: No Shared Options/Value Resolution

System A has `resolveFieldOptions()` (static options → optionsSource → derive from data). System B has `FilterDefinition.valueSource` (static/dataset/async). These are parallel implementations that don't share code.

### Gap 8: Missing Runtime Glue

Even if an admin correctly configures filter definitions and bindings using the registry, there is no code path that:
1. Loads a report by ID
2. Looks up its ArtefactId
3. Calls `resolveArtefactFields()` to get the runtime fields
4. Passes those fields to `<phz-criteria-bar>`

---

## 4. Architecture Analysis: Industry Patterns

### 4.1 Pattern: Centralized Definition + Binding (Current System B)

**Used by**: Tableau (data sources + worksheets), Power BI (slicers + visual interactions), Looker (dimensions + explores)

```
Definition (reusable)  ──┐
                         ├── Binding (per artefact, with overrides)
Definition (reusable)  ──┘
                              ↓
                         Runtime Resolution
                              ↓
                         UI Component
```

**Pros**:
- Single source of truth for filter metadata
- Change a definition, all bound artefacts update
- Central audit trail and governance
- Supports complex scenarios: cross-dashboard filters, shared presets

**Cons**:
- More complex admin workflow (create → bind → configure overrides)
- Requires artefact ID coordination
- Overkill for simple single-report scenarios

**Verdict**: This is the right pattern for an enterprise SDK. The problem is it's half-built.

### 4.2 Pattern: Inline Configuration (Current System A)

**Used by**: Simple grids (AG Grid, Handsontable), most React table libraries

```
ArtefactConfig
  └── filters: FilterConfig[]    ← everything inline
```

**Pros**:
- Simple to understand
- Self-contained — one config = one artefact
- Easy to serialize/deserialize
- Good for simple use cases

**Cons**:
- No reuse across artefacts
- Changes must be made everywhere
- No governance or audit
- Scales poorly in enterprise scenarios

**Verdict**: Good for developer-facing API (quick setup), but should be a convenience layer over the registry, not a parallel system.

### 4.3 Pattern: Unified Artefact Model

**Used by**: Metabase, Redash, Superset

```
Artefact (abstract)
  ├── Report extends Artefact
  ├── Dashboard extends Artefact
  └── Widget extends Artefact
      ↓
  ArtefactFilterBinding
  ArtefactStateResolution
```

Every displayable entity is an "artefact" with a uniform filter binding interface.

**Pros**:
- One ID system
- One binding mechanism
- Consistent admin experience
- Cross-artefact filter propagation is natural

**Cons**:
- Requires shared base type
- More upfront design effort

### 4.4 Pattern: Filter Context Provider

**Used by**: React Context pattern, Angular DI, Lit Context protocol

```
FilterContext (created at page/layout level)
  ├── definitions: FilterDefinition[]
  ├── bindings: FilterBinding[]
  ├── state: SelectionContext
  ├── onChange(field, value)
  └── subscribe(callback)
      ↓
  Consumed by: Grid, Dashboard, Widgets, Criteria Bar
```

A context object is created once and shared with all consumers on the page. This decouples filter state from individual components.

**Pros**:
- Clean separation of concerns
- Multiple components can share filter state
- Easy to test (inject mock context)
- Natural fit for Web Components (Lit Context)

**Cons**:
- Requires establishing context at the right level
- Page-level coordination needed

---

## 5. Proposed Options

### Option A: Evolve System B Into the Single System

**Summary**: Complete the registry-based system. Make it the canonical path. System A becomes a convenience initializer that creates registry entries + bindings under the hood.

**Changes Required**:

1. **ArtefactId unification**: Add `toArtefactId()` converter for `ReportId` and `DashboardId`
2. **ReportConfig update**: Replace `selectionFields: string[]` and `criteriaConfig?: CriteriaConfig` with `filterBindingMode: 'inline' | 'registry'` + `criteriaConfig` retained for inline mode
3. **BIEngine integration**: Add `criteria: CriteriaEngine` to BIEngine facade
4. **Report Designer**: Add step for filter binding (embed `<phz-filter-picker>`)
5. **Auto-migration**: When runtime encounters `criteriaConfig` (inline), auto-create registry entries via `migrateFromCriteriaConfig()` — consumer doesn't need to change
6. **Criteria UI adapter**: `resolveArtefactFields()` output is already `SelectionFieldDef[]` — criteria bar can consume it directly
7. **Retire System C**: Convert `GlobalFilter` to use registry + bindings with widget-scoped targeting as a binding property

**Scope**: Medium-high. Touches engine, engine-admin, criteria runtime.

**Risk**: Breaking change for consumers using `criteriaConfig` directly (mitigated by auto-migration).

### Option B: Keep System A as Primary, Backfill Registry as Optional

**Summary**: System A (inline CriteriaConfig) remains the default. System B becomes an optional advanced feature for users who need cross-artefact reuse.

**Changes Required**:

1. **Document both paths** clearly
2. **ReportConfig**: Keep `criteriaConfig` as primary, add optional `filterRegistryMode?: boolean`
3. **BIEngine**: Optionally include CriteriaEngine
4. **Report Designer**: Step 3 becomes a richer CriteriaConfig builder (not registry-based)
5. **Adapter**: When `filterRegistryMode` is true, ignore `criteriaConfig` and use `resolveArtefactFields()` instead
6. **Keep System C**: GlobalFilter is fine for its limited scope

**Scope**: Low-medium. Mostly documentation + Report Designer enhancement.

**Risk**: Two systems persist indefinitely. Maintenance burden doubles. Feature parity is hard to maintain.

### Option C: Unified Artefact Model with Filter Context

**Summary**: Introduce an `Artefact` base concept. Reports, dashboards, and widgets all implement it. Filter binding and state management work uniformly through a `FilterContext` that is created per page/view.

**Changes Required**:

1. **New `Artefact` base interface**:
   ```typescript
   interface Artefact {
     artefactId: ArtefactId;
     artefactType: 'report' | 'dashboard' | 'widget';
   }
   ```
2. **ReportConfig extends Artefact**: `artefactId` derived from `id`
3. **DashboardConfig extends Artefact**: same
4. **FilterContext**: New runtime object that holds registry, bindings, state, rules for a given view
5. **Web Component context**: Use Lit's `@lit/context` to provide FilterContext to descendant components
6. **Single admin workflow**: Filter Studio → Registry → FilterPicker per artefact → FilterContext at runtime
7. **Retire Systems A and C**: Fully replaced by registry + context

**Scope**: High. New abstraction layer, touches all packages.

**Risk**: Over-engineering. Requires consumers to understand context model. Biggest migration effort.

### Option D: Pragmatic Hybrid — Registry as Source of Truth, Inline as Sugar

**Summary**: Registry (System B) is the source of truth, but consumers can still pass inline `CriteriaConfig` which is transparently converted to registry entries at initialization time. No separate "modes" — just one system with two entry points.

**Changes Required**:

1. **ArtefactId bridge**: Simple helper `reportArtefactId(id: ReportId): ArtefactId`
2. **BIEngine integration**: Add `criteria: CriteriaEngine` to `BIEngine`
3. **Auto-hydration**: When `BIEngine` loads a report with `criteriaConfig`, auto-call `migrateFromCriteriaConfig()` to populate registry + bindings. The inline config is treated as a "bootstrap" — once loaded, the registry is authoritative.
4. **Report Designer**: Add a filter binding step (Step 3.5 or merged into Step 3)
5. **Criteria UI**: Accept both `CriteriaConfig` (auto-migrated) and `ArtefactId` (resolved from registry). Priority: if artefactId is provided and has bindings, use registry. Otherwise fall back to CriteriaConfig.
6. **GlobalFilter → Registry**: Map the 5 GlobalFilter types to the 10 SelectionFieldTypes. Enhanced dashboard creates registry entries for its global filters.
7. **No breaking changes**: `criteriaConfig` still works. New registry path is additive.

**Scope**: Medium. Focused changes, backward compatible.

**Risk**: Low. Existing code continues to work. New features unlock via registry.

---

## 6. Recommendation

### Recommended: Option D — Pragmatic Hybrid

**Rationale**:

1. **Zero breaking changes** — existing `criteriaConfig` consumers keep working
2. **One source of truth at runtime** — registry is always authoritative once initialized
3. **Two entry points, one system** — inline config is sugar that auto-populates the registry
4. **Incremental adoption** — teams can start with inline config and later move to registry-managed definitions
5. **Admin workflow is clean** — Filter Studio → Registry → FilterPicker → Report
6. **Matches industry pattern** — Tableau/Power BI use central definitions with per-artefact customization
7. **Smallest scope** — achievable without architectural overhaul

### What Makes This Different From Option A

Option A retires the inline path and introduces a `filterBindingMode` flag. Option D keeps inline config as a **transparent initialization mechanism** — no flag, no mode selection, no breaking change. The consumer never needs to know about the registry if they don't want to.

### What This Means in Practice

**Simple use case** (developer sets up grid with filters):
```typescript
const report: ReportConfig = {
  id: reportId('sales'),
  criteriaConfig: {
    fields: [
      { id: 'region', label: 'Region', type: 'multi_select', options: [...] },
      { id: 'date', label: 'Date', type: 'date_range' },
    ]
  }
};
// Works exactly as today. Under the hood, BIEngine auto-creates
// registry entries and bindings. Developer never sees this.
```

**Advanced use case** (admin manages filters across reports):
```typescript
const engine = createBIEngine();
const criteria = engine.criteria;

// Create reusable filter definition
criteria.admin.createDefinition({
  id: filterDefinitionId('region'),
  label: 'Region',
  type: 'multi_select',
  sessionBehavior: 'persist',
  options: [...],
}, 'admin-user');

// Bind to multiple reports with overrides
criteria.admin.bindToArtefact({
  filterDefinitionId: filterDefinitionId('region'),
  artefactId: reportArtefactId(reportId('sales')),
  visible: true,
  order: 0,
  labelOverride: 'Sales Region',
}, 'admin-user');

criteria.admin.bindToArtefact({
  filterDefinitionId: filterDefinitionId('region'),
  artefactId: reportArtefactId(reportId('inventory')),
  visible: true,
  order: 1,
}, 'admin-user');
```

---

## 7. Detailed Design for Recommended Option

### 7.1 ArtefactId Bridge

**File**: `packages/engine/src/types.ts`

```typescript
// New helper functions
export function reportArtefactId(id: ReportId): ArtefactId {
  return artefactId(`report:${id}`);
}

export function dashboardArtefactId(id: DashboardId): ArtefactId {
  return artefactId(`dashboard:${id}`);
}

export function widgetArtefactId(id: WidgetId): ArtefactId {
  return artefactId(`widget:${id}`);
}

// Parse back
export function parseArtefactId(id: ArtefactId): {
  type: 'report' | 'dashboard' | 'widget' | 'unknown';
  rawId: string;
} {
  const str = id as string;
  const [prefix, ...rest] = str.split(':');
  const rawId = rest.join(':');
  if (prefix === 'report' || prefix === 'dashboard' || prefix === 'widget') {
    return { type: prefix, rawId };
  }
  return { type: 'unknown', rawId: str };
}
```

**Why prefix?** Prevents collisions. A report and dashboard could share the same string ID. Prefixing ensures `report:sales` and `dashboard:sales` are distinct ArtefactIds.

### 7.2 BIEngine Integration

**File**: `packages/engine/src/engine.ts`

```typescript
interface BIEngine {
  // Existing...
  reports: ReportConfigStore;
  dashboards: DashboardConfigStore;

  // New
  criteria: CriteriaEngine;

  // New convenience methods
  getReportFilters(reportId: ReportId): SelectionFieldDef[];
  getDashboardFilters(dashboardId: DashboardId): SelectionFieldDef[];
}
```

**Auto-hydration**: When a report is loaded/resolved and has `criteriaConfig` but no registry bindings, auto-migrate to registry. Key behavior:
- Check if bindings already exist for this artefact — if so, use registry (authoritative)
- If no bindings exist, call `migrateFromCriteriaConfig()` to populate
- **Divergence detection** (Decision D4): On subsequent saves, if both inline config and registry bindings exist and differ, emit a `criteria:divergence-detected` event — don't silently ignore, don't strip inline config (breaks serialization)

### 7.3 Report Designer Enhancement

**Current steps**: Data Product → Columns → Filters & Sort → Aggregation → Drill-Through → Review

**Proposed steps**: Data Product → Columns → Selection Criteria → Filters & Sort → Aggregation → Drill-Through → Review

New Step 3 — "Selection Criteria":
- Embeds `<phz-filter-picker>` to select which filter definitions to bind
- "Create New" button opens `<phz-filter-studio>` in a modal/slide-over
- Bound filters shown with override controls (label, required, order)
- Preview of how the criteria bar will look

Existing Step 3 (now Step 4) — "Filters & Sort":
- Pre-load filters remain as server-side/query-time filters
- Clear label: "These filters are applied before data loads. For user-facing selection criteria, use Step 3."

### 7.4 ReportConfig Updates

> **Decision D1**: No `filterSource` flag. Resolution is always automatic.
> The original proposal introduced a mode flag, which contradicts the
> "no modes, one system" principle. Auto-resolution handles all cases:
> registry bindings exist → use them. Otherwise → hydrate from inline.

```typescript
interface ReportConfig {
  id: ReportId;
  // ... existing fields ...

  // Retained — works as auto-hydration source
  criteriaConfig?: CriteriaConfig;

  // DEPRECATED — replaced by registry bindings
  // selectionFields?: string[];

  // NO filterSource flag — resolution is always automatic
}
```

### 7.5 Criteria UI Adapter

The criteria bar and panel currently accept `CriteriaConfig`. Two options:

**Option A — Adapter function** (minimal change):
```typescript
// New function in engine
function resolveReportCriteria(
  engine: BIEngine,
  reportId: ReportId,
): CriteriaConfig {
  const artId = reportArtefactId(reportId);
  const fields = engine.criteria.resolveFields(artId);

  if (fields.length > 0) {
    // Registry has bindings — convert to CriteriaConfig shape
    return {
      fields,
      behavior: engine.criteria.resolveBarBehavior(artId),
    };
  }

  // Fall back to inline config
  const report = engine.reports.get(reportId);
  return report?.criteriaConfig ?? { fields: [] };
}
```

**Option B — Direct artefactId prop** (better long-term):
```typescript
// Criteria bar accepts either config or artefactId
@property({ type: Object }) config?: CriteriaConfig;
@property({ type: String }) artefactId?: string;
@property({ type: Object }) criteriaEngine?: CriteriaEngine;
```

**Recommended**: Adapter function (Option A) is internal to `ReportService` (Decision D3). The service answers "who owns state?" and "how do changes propagate?". The adapter just answers "what config?". Consumers interact with the service, not the adapter directly.

**ReportService** (new — Decision D3): Per-route runtime orchestrator that:
- Wraps `resolveReportCriteria()` internally
- Owns filter state (Map of field ID → current value)
- Provides `subscribe()/notify()` for reactive updates
- Outputs `gridFilterParams` for grid consumption
- Handles lifecycle (create on mount, GC on navigation)

### 7.6 GlobalFilter Convergence

Enhanced dashboard's `GlobalFilter` maps to registry types as follows:

| GlobalFilterType | SelectionFieldType |
|------------------|--------------------|
| `select` | `single_select` |
| `multi-select` | `multi_select` |
| `date-range` | `date_range` |
| `text-search` | `search` |
| `number-range` | `numeric_range` |

**Migration**: When `EnhancedDashboardConfig` is loaded, auto-create FilterDefinitions from its `globalFilters[]` array, just like inline CriteriaConfig auto-migration.

**Widget targeting** (Decision D2): `GlobalFilter.targetWidgetIds` maps to a single `FilterBinding` with `targetScope: WidgetId[]` — NOT per-widget bindings. One filter targeting 3/7 widgets is semantically "scoped propagation", not three separate bindings. If `targetWidgetIds` is empty, the binding targets the entire dashboard (all widgets).

### 7.7 State Resolution at Runtime

```
Page loads report
    ↓
engine.getReportFilters(reportId)
    ↓
resolveReportCriteria(engine, reportId) → CriteriaConfig
    ↓
<phz-criteria-bar .config=${criteriaConfig}>
    ↓
User changes selection → SelectionContext
    ↓
engine.criteria.buildCriteria(artefactId, values) → ArtefactCriteria
    ↓
ArtefactCriteria.filters → SQL where clauses / client-side filtering
```

### 7.8 Shared Options Resolution

System A's `resolveFieldOptions()` and System B's `FilterDefinition.valueSource` should share a single resolution path:

```typescript
function resolveOptions(
  definition: FilterDefinition,
  dataSources?: Record<string, DataSet>,
  currentData?: Record<string, unknown>[],
): SelectionFieldOption[] {
  // Priority 1: valueSource (registry-specific)
  if (definition.valueSource?.type === 'dataset' && definition.valueSource.optionsSource && dataSources) {
    return resolveOptionsSource(definition.valueSource.optionsSource, dataSources);
  }

  // Priority 2: static options on definition
  if (definition.options?.length) {
    return definition.options;
  }

  // Priority 3: derive from data via dataField
  if (currentData && definition.dataField) {
    return deriveOptionsFromData(currentData, definition.dataField);
  }

  return [];
}
```

This reuses the existing `resolveOptionsSource` and `deriveOptionsFromData` functions from `selection-criteria.ts`.

---

## 8. Implementation Strategy

> **Decision D5**: Phases 1-3 from the original proposal are collapsed into a
> single deliverable. Shipping the resolver without hydration creates a broken
> adoption window where `getReportFilters()` returns empty for inline configs.

### Phase 1: Core Integration (Single Deliverable)

All foundation + hydration + service work ships together:

1. Add `reportArtefactId()`, `dashboardArtefactId()`, `widgetArtefactId()` to `engine/src/types.ts`
2. Add `targetScope?: string[]` to `FilterBinding` in core types
3. Add `criteria: CriteriaEngine` to `BIEngine` interface and `createBIEngine()`
4. Create `resolveReportCriteria()` with auto-hydration and divergence detection
5. Create `ReportService` runtime orchestrator
6. Add `getReportFilters()` and `getDashboardFilters()` convenience methods
7. Update `engine/src/index.ts` exports
8. Full test coverage for all new code
9. Run existing 982 tests — zero regressions

**Impact**: Zero breaking changes. New functionality is additive. Resolver + hydration + service all available from day one.

### Phase 2: Report Designer Enhancement

1. Add "Selection Criteria" step to `<phz-report-designer>`
2. Embed `<phz-filter-picker>` in the new step
3. Add "Create New Definition" button that opens `<phz-filter-studio>` in a modal
4. Wire events: on save, report save event includes both `criteriaConfig` (for backward compat) AND filter binding data
5. Update Review step to show bound filter summary

**Impact**: UI enhancement only. Existing report designer API unchanged.

### Phase 3: Documentation & Examples

1. Create developer guide: "Working with Filters" (simple → advanced path)
2. Create admin guide: "Managing Filter Definitions"
3. Create example: `filter-admin-workflow.html`
4. Update API reference docs

### Phase 4: Future — Direct ArtefactId on Criteria UI

1. Add `artefactId` prop to criteria bar/panel components
2. Components can resolve their own fields from CriteriaEngine
3. Deprecate passing `CriteriaConfig` directly (emit console warning)

---

## 9. Decision Log

| # | Decision | Status | Notes |
|---|----------|--------|-------|
| 1 | Choose between Options A-D | **ACCEPTED: D** | Pragmatic hybrid — registry as truth, inline as sugar |
| 2 | ArtefactId prefix scheme (`report:X` vs `X`) | **ACCEPTED** | Prefix for collision safety |
| 3 | Report Designer step order | **ACCEPTED** | Criteria before Filters & Sort |
| 4 | GlobalFilter convergence | **ACCEPTED** | `targetScope: WidgetId[]` on FilterBinding |
| 5 | Criteria UI adapter approach | **ACCEPTED** | Adapter internal to ReportService (D3) |
| D1 | Drop filterSource flag | **ACCEPTED** | Auto-resolution always. No mode flags. |
| D2 | Widget targeting on binding | **ACCEPTED** | `targetScope: WidgetId[]` — single binding, not per-widget |
| D3 | ReportService wraps adapter | **ACCEPTED** | Service owns state. Adapter is internal detail. |
| D4 | Divergence detection | **ACCEPTED** | Detect on save, emit event. Don't strip inline, don't ignore. |
| D5 | Collapse Phases 1-3 | **ACCEPTED** | Ship resolver + hydration + service together. No broken window. |
| D6 | Engine re-exports core types | **ACCEPTED** | Convenience for consumers. |

---

## Appendix A: File Reference

| File | Role | Lines |
|------|------|-------|
| `core/src/types/selection-context.ts` | System A types + System B types | 562 |
| `engine/src/types.ts` | Branded IDs (ReportId, etc.) | 44 |
| `engine/src/report.ts` | ReportConfig + ReportConfigStore | 125 |
| `engine/src/dashboard.ts` | DashboardConfig + DashboardConfigStore | 149 |
| `engine/src/dashboard-enhanced.ts` | System C: GlobalFilter + EnhancedDashboard | 157 |
| `engine/src/filter-registry.ts` | FilterRegistry + cycle detection + topo sort | 160 |
| `engine/src/filter-bindings.ts` | FilterBindingStore + resolveArtefactFields + migration | 176 |
| `engine/src/filter-state.ts` | 6-level state resolution + persistence | 175 |
| `engine/src/filter-rules.ts` | 5 rule types + evaluation + preview | 268 |
| `engine/src/filter-admin.ts` | Admin service + permissions + audit | 141 |
| `engine/src/criteria-output.ts` | Operator inference + ArtefactCriteria + tree output | 184 |
| `engine/src/criteria-engine.ts` | Unified facade + migration from CriteriaConfig | 182 |
| `engine/src/selection-criteria.ts` | System A logic (validation, dates, filtering) | 952 |
| `engine/src/engine.ts` | BIEngine facade | 167 |
| `engine-admin/components/phz-report-designer.ts` | Report wizard (6 steps) | 343 |
| `engine-admin/components/phz-filter-studio.ts` | Filter definition editor | ~1383 |
| `engine-admin/components/phz-filter-picker.ts` | Binding selector | ~562 |

## Appendix B: Type Compatibility Matrix

| Source Type | Target Type | Compatible? | Conversion |
|-------------|-------------|-------------|------------|
| `ReportId` | `ArtefactId` | No | `reportArtefactId()` needed |
| `DashboardId` | `ArtefactId` | No | `dashboardArtefactId()` needed |
| `FilterDefinition` → `SelectionFieldDef` | Yes | `resolveArtefactFields()` |
| `CriteriaConfig` → Registry + Bindings | Yes | `migrateFromCriteriaConfig()` |
| `GlobalFilter` → `FilterDefinition` | Partial | 5 of 10 types map directly |
| `SelectionFieldDef` → `FilterDefinition` | Yes | Add `sessionBehavior`, `createdAt`, `updatedAt` |

## 10. v15 Filter Architecture Extensions

### 10.1 Filter Admin State Machine

v15 introduced the **filter admin state machine** as part of the workspace's 15
headless state machines. The filter admin state machine (`filter-admin`) manages
the central filter registry and dashboard binding workflow within the admin UI.

Key features:
- CRUD operations on `FilterDefinition` catalog entries
- Dashboard-level binding: which filters are active for a given dashboard
- Per-dashboard filter ordering, visibility, and label overrides
- Validation that bound filters have valid `FilterValueSource` configurations
- Integration with the existing `FilterRuleEngine` for conditional business rules

### 10.2 Filter Value Admin (`FilterValueSource` Configuration)

The `filter-value-admin` state machine manages how filter options are sourced.
`FilterValueSource` (from `@phozart/shared/types`) specifies:

```typescript
export interface FilterValueSource {
  type: 'data-source' | 'lookup-table' | 'static';
  // data-source: derives options from a query against a named data source
  // lookup-table: references a shared lookup table artifact
  // static: hardcoded list of options
}

export interface FilterValueTransform {
  // Optional post-processing: sort, deduplicate, limit, format
}

export interface FilterDefault {
  // Default value selection strategy
}

export interface FilterValueHandling {
  source: FilterValueSource;
  transform?: FilterValueTransform;
  default?: FilterDefault;
}
```

The admin state machine provides:
- Data source selection for dynamic option lists
- Lookup table binding for shared reference data
- Static option list editing with drag-to-reorder
- Preview of resolved options before saving
- Validation against the `FilterBinding` contract

### 10.3 Faceted Attention Filtering

v15 added faceted filtering for the attention system. This is **separate from
the criteria engine** — it is a lightweight in-memory faceted filter designed
for attention items (alerts, notifications, stale data warnings, review requests).

The faceted attention filter uses types from `@phozart/shared/types`:
- `AttentionFilterState` — active filter selections across facets
- `FilterableAttentionItem` — normalized items suitable for faceted filtering
- `filterAttentionItems()` — AND across facets, OR within a facet
- `computeAttentionFacets()` — cross-facet counting for accurate facet counts

State management lives in `@phozart/shared/coordination`:
- `AttentionFacetedState` — complete faceted filter state with pagination
- `toggleFacetValue()`, `clearFacet()`, `clearAllFilters()` — filter transitions
- `acknowledgeItem()`, `acknowledgeAllVisible()` — mark items as handled
- `getVisibleItems()` — compute the filtered, sorted, paginated result

The viewer shell integrates this via `AttentionDropdownState` (from
`@phozart/viewer/screens/attention-state`), which wraps the faceted state
with UI-specific concerns (dropdown open/close, type filter tabs).

### 10.4 Alert Rules Binding to Widgets via SingleValueAlertConfig

v15's Spec Amendment A introduced `SingleValueAlertConfig` which binds alert
rules to individual widget instances. The binding flow:

```
AlertRule (engine)
    │
    ├── alertRuleId stored in SingleValueAlertConfig.alertRuleBinding
    │
    ▼
Widget Config (dashboard)
    │
    ├── SingleValueAlertConfig stored as part of widget config
    │
    ▼
Runtime Resolution
    │
    ├── resolveAlertVisualState(config, alertEvents) → AlertVisualState
    │   - Looks up the bound alert rule ID in the current alert events map
    │   - Returns severity ('healthy' | 'warning' | 'critical')
    │
    ├── getAlertTokens(severity, mode) → AlertTokenSet
    │   - Maps severity + visual mode to design token names
    │   - Tokens reference the ALERT_WIDGET_TOKENS constant
    │
    └── degradeAlertMode(mode, containerSize) → DegradedAlertParams
        - Adjusts indicator size, border width based on container
        - full (>400px), compact (200-400px), minimal (<200px)
```

This differs from the filter-based alert system: filters constrain what data
the user sees, while `SingleValueAlertConfig` controls how widget-level alert
state is visualized. The two systems are complementary — an alert rule fires
based on threshold breach, and the widget config controls whether the user sees
a dot, a tinted background, or a colored border.

---

## Appendix C: Test Impact Assessment

Current test counts (relevant packages):
- `engine/` — filter-registry, filter-bindings, filter-state, filter-rules, filter-admin, criteria-engine, criteria-output, selection-criteria, report, dashboard
- `engine-admin/` — dashboard-builder, kpi-designer, pivot-designer, report-designer

**Expected test additions**:
- ArtefactId bridge helpers: ~10 tests
- BIEngine criteria integration: ~15 tests
- Auto-hydration (inline → registry): ~20 tests
- resolveReportCriteria adapter: ~10 tests
- Report Designer new step: ~15 tests (component tests)
- GlobalFilter convergence: ~10 tests

**No existing tests should break** — all changes are additive.
