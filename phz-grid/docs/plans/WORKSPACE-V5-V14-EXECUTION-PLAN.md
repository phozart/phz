# Workspace v5–v14 Execution Plan

> Supplements the already-executing v1–v4 plan (Phases 1–4 of the consolidation
> instructions: Research, Foundation Types, Shell + Catalog, and Wire Existing Tools).
> This plan covers the remaining work items from the v5–v14 UPDATE73 documents.

## Current State Assessment

### Already Implemented (from Sprints A–P + Shell/Dashboard agents)

| Subsystem | Source dir | Tests | Status |
|-----------|-----------|-------|--------|
| Schema/VersionedConfig | `schema/` | versioned-config | DONE |
| DataAdapter SPI | `data-adapter.ts` | data-adapter | DONE |
| WidgetManifest + Registry | `registry/` | widget-registry, manifest-registry, default-manifests, widget-manifest, widget-common-config, variant-picker | DONE |
| LayoutNode + Renderer + Migration | `layout/` | layout-node, layout-renderer, layout-migration, layout-container | DONE |
| InteractionBus | `interaction-bus.ts` | interaction-bus | DONE |
| FilterContext + Manager | `filters/` | filter-types, filter-context, filter-bar, filter-preset-manager, cascading-resolver, url-filter-sync, filter-performance, date-filter-time-intel, multi-source-filter, filter-bar-config-builder | DONE |
| AlertEvaluator + Rule Designer + Subscriptions + Breach | `alerts/` | alert-types, alert-evaluator, alert-rule-designer, subscription-manager, risk-summary, breach-indicators, render-context-breaches, breach-store, breach-count, breach-highlight, catalog-breach-count | DONE |
| Templates + Schema Analyzer + Matcher | `templates/` | template-types, template-matcher, default-templates, template-gallery, suggestion-flow, template-bindings, template-validator, schema-analyzer | DONE |
| Explore + Field Palette + Chart Suggest | `explore/` | explore-types, chart-suggest, explore-to-artifact, field-palette, drop-zones, pivot-preview, data-explorer, explorer-dashboard-integration | DONE |
| Adapters (memory, fetch, compose, DuckDB) | `adapters/` | memory-adapter, fetch-adapter, compose-adapter, duckdb-data-adapter, memory-data-adapter | DONE |
| Connectors (remote URL/API) | `connectors/` | remote-connector-types, cors-handler, credential-store, refresh-scheduler, connection-editor | DONE (types + tests, no `src/connectors/` directory yet — files may be in other locations) |
| Shell UX | `shell/` | workspace-shell, responsive-preview, breadcrumb-nav, auto-save, keyboard-shortcuts, empty-states, validation-feedback, save-adapter-wiring, widget-picker-utils, preview-mode, field-mapping-admin, data-source-panel-utils, version-history-utils, preview-as-utils, rtl-layout | DONE |
| Coordination (QueryCoordinator) | `coordination/` | query-coordinator, query-coordinator-types | DONE |
| Format (formatValue) | format-value test | format-value | DONE |
| i18n | shell | i18n-provider | DONE |
| Catalog | `catalog/` | catalog-browser, catalog-search | DONE |
| Placements | `placements/` | placement, placement-manager | DONE |
| Config Schemas (Zod) | — | config-schemas, schema-form-generator | DONE |
| Quality Rendering | — | data-quality-info, quality-rendering | DONE |
| Responsive Rendering | — | responsive-rendering, loading-renderer, error-boundary | DONE |
| Integration test | — | integration | DONE |
| Local Server (Tier 2) | `packages/local/` | server-scaffold, fs-adapter, duckdb-native-adapter, file-watcher, cli | DONE |

### What v5–v14 Documents Specify That May Not Be Fully Implemented

After cross-referencing the document specifications against existing source files,
the following areas need completion or verification:

---

## Sprint S: Connectors Package Scaffold + OPFS Persistence

**Duration**: 1 sprint
**Dependencies**: Adapters (done), Shell (done)
**Source doc**: v13 CONSOLIDATION-INSTRUCTIONS §5.5–5.8

The test files exist but the `src/connectors/` directory does not exist as a
standalone folder. The connector logic may be inlined elsewhere or needs to be
extracted into the proper directory structure.

### Tasks

1. **S.1** — Verify or create `packages/workspace/src/connectors/` directory with:
   - `remote-data-connector.ts` — URL + API connection manager
   - `connection-editor.ts` — UI component for configuring connections
   - `cors-handler.ts` — CORS error detection + user-friendly resolution paths
   - `credential-store.ts` — OPFS-based credential storage (never sent to server)
   - `refresh-scheduler.ts` — Auto-refresh on workspace open
   - `index.ts` — sub-path export `./connectors`

2. **S.2** — Implement `LocalDataStore` for OPFS persistence:
   - `packages/workspace/src/local/local-data-store.ts`
   - `packages/workspace/src/local/session-manager.ts`
   - DuckDB `exportDatabase()` → OPFS on auto-save (30s inactivity)
   - IndexedDB fallback for browsers without OPFS
   - Session resume flow: "Resume session or start fresh?"

3. **S.3** — Implement `FileUploadManager`:
   - `packages/workspace/src/local/file-upload-manager.ts`
   - `packages/workspace/src/local/upload-preview.ts`
   - `packages/workspace/src/local/sheet-picker.ts` (Excel multi-sheet)
   - CSV/Excel/Parquet/JSON support via DuckDB-WASM
   - Pre-import preview with type inference display
   - Data replacement flow (re-upload without losing dashboards)

4. **S.4** — Unified Data Source Panel (`data-source-panel.ts`):
   - Renders all sources: uploaded, URL, API, server-provided
   - Icons by source type (clip, link, globe, database)
   - Actions: refresh, replace, rename, remove, edit connection
   - Entry point to explorer (click source → open in explorer)

---

## Sprint T: Filter Business Rules + Filter Catalog (v13 DATA-INTERACTION §1.0.4)

**Duration**: 1 sprint
**Dependencies**: FilterContext (done), Criteria admin (done)
**Source doc**: v13 DATA-INTERACTION §1.0–1.0.5

The filter type system and FilterContextManager are implemented. What may be
missing is the full **FilterRule** (conditional multi-filter business rules)
engine and the **central filter catalog** management UI.

### Tasks

1. **T.1** — Verify/complete `FilterRule` type implementation:
   - `ViewerCondition`, `FilterValueCondition`, `FilterPresenceCondition`
   - Actions: `restrict-values`, `set-value`, `hide`, `disable`, `force-value`, `show-warning`
   - Priority-based evaluation, intersection for conflicting restrict-values

2. **T.2** — Implement `filter-rule-engine.ts` in `filters/`:
   - Synchronous client-side evaluation (no server round-trip)
   - Integration with `FilterContextManager` pipeline:
     Rule eval → Contract check → Validation → Transform → Binding → Merge

3. **T.3** — Implement `filter-rule-editor.ts` in `filters/`:
   - Condition builder UI (viewer attribute / filter value / filter presence)
   - Action builder UI (restrict / set / hide / disable / force / warning)
   - Rule testing with simulated viewer context
   - Available in workspace Govern > Rules section

4. **T.4** — Verify/complete `ArtifactFilterContract` implementation:
   - `AcceptedFilter` with validation + value transforms
   - `FilterValueTransform`: direct, lookup, expression, granularity-shift
   - Filter resolution pipeline (5-stage) wired end-to-end
   - Compatibility matrix in dashboard builder (filter × widget → binding status)

5. **T.5** — Filter catalog management UI in Govern > Filters:
   - List all FilterDefinitions with binding count + dashboard usage count
   - Create/edit: name, type, value source, bindings, security, defaults
   - Reverse dependency view (which dashboards use this filter)
   - Auto-detect existing filter when dragging field into dashboard filter bar

---

## Sprint U: Navigation Links + Drill-Through (v13 CONSOLIDATION §4.4)

**Duration**: 1 sprint
**Dependencies**: Shell (done), InteractionBus (done)
**Source doc**: v13 CONSOLIDATION-INSTRUCTIONS §4.4

### Tasks

1. **U.1** — Implement `NavigationLink` type + configuration:
   - `NavigationSource` variants (widget-click, column-click, row-click, kpi-click, chart-segment, context-menu)
   - `NavigationFilterMapping` (source field → target field/filter)
   - `openMode`: replace, panel, modal, new-tab
   - Multiple links per widget (primary click + context menu)

2. **U.2** — Navigation Link Editor in dashboard builder:
   - Widget config panel → "Navigation" tab
   - Pick trigger → pick target artifact → map filters → pick open mode
   - Auto-mapping by field name match
   - Preview link in preview mode

3. **U.3** — Consumer-side rendering of navigation links:
   - `navigate` event emission from InteractionBus
   - Table columns: underline + pointer cursor for linked columns
   - Chart segments: hover highlight + pointer cursor
   - KPI cards: clickable with hover effect
   - Context menu rendering for additional links

4. **U.4** — Circular navigation detection on save (warning, not block)

5. **U.5** — Back navigation data (breadcrumb trail with filter context per hop)

---

## Sprint V: Dashboard Data Loading Architecture (v13 CONSOLIDATION §2.3 data config)

**Duration**: 1 sprint
**Dependencies**: DataAdapter (done), QueryCoordinator (done)
**Source doc**: v13 CONSOLIDATION-INSTRUCTIONS §2.3, v13 DATA-INTERACTION loading sections

### Tasks

1. **V.1** — Implement `DashboardDataConfig` type and rendering pipeline:
   - `PreloadConfig` + `FullLoadConfig` + `DetailSourceConfig`
   - Parallel preload + full load execution
   - `dataTier` per widget: 'preload' | 'full' | 'both'
   - Seamless transition when full data arrives

2. **V.2** — Loading progress indicator:
   - Thin bar below header (preload → full → done phases)
   - Phase icons, status messages, progress percentage
   - Auto-dismiss "Done" state after 3 seconds
   - Integration with QueryCoordinator aggregate progress

3. **V.3** — Personal preload (`usePersonalView`):
   - Detect user's personal FilterPreset for the dashboard
   - Modify preload query with user's saved filters
   - Dashboard opens into user's context immediately

4. **V.4** — Server vs. client filter classification:
   - `queryLayer: 'server' | 'client' | 'auto'` per filter
   - Server filter change → new full load, previous data at reduced opacity
   - Client filter change → instant, local DuckDB query
   - Cache strategy (`QueryStrategy` on DataQuery)

5. **V.5** — Detail source rendering:
   - Slide-out panel / modal / navigate-to-report modes
   - Filter context mapping from dashboard to detail source
   - Independent preload + full pattern per detail source
   - Multiple detail panels (tabbed within slide-out)

6. **V.6** — Arrow IPC support in DataResult:
   - `arrowBuffer: ArrayBuffer` alternative to `rows`
   - Pipeline: detect arrowBuffer → load into DuckDB-WASM → query locally
   - Transparent to widgets (they always receive rows)

---

## Sprint W: Time Intelligence + Number Formatting (v13 ARCHITECTURE-GAPS §2–3)

**Duration**: 1 sprint
**Dependencies**: Filter system (done), DataAdapter (done)
**Source doc**: v13 ARCHITECTURE-GAPS §2, §3

### Tasks

1. **W.1** — Implement `TimeIntelligenceConfig`:
   - Fiscal year start month, week start day
   - Available granularities
   - 14 built-in relative periods (today, last-7d, this-quarter, ytd, etc.)
   - Fiscal-aware label generation

2. **W.2** — Comparison periods:
   - `DateFilterValue.comparison` (previous-period, same-period-last-year, custom)
   - Dual-query execution (primary + comparison)
   - Widget support: trend lines (solid/dashed), KPI cards (delta display)

3. **W.3** — Date filter UI enhancements:
   - Relative period presets from TimeIntelligenceConfig
   - "Compare to" toggle with comparison period selector
   - Mini calendar with dual-range highlighting
   - Fiscal-aware labels ("This Year" → "Apr 2025 – Mar 2026")

4. **W.4** — `UnitSpec` type + `formatValue()` utility:
   - Currency (ISO 4217), percent, number, duration, custom suffix
   - `Intl.NumberFormat`-based, locale-aware
   - Abbreviation support (1.2M instead of 1,200,000)
   - Public export for consumer use

5. **W.5** — Aggregation validation warnings:
   - Sum on percentages → warning
   - Mixed currencies → error
   - Average on identifiers → warning
   - Override-able (warnings, not blocks)

---

## Sprint X: Viewer Context + Role-Based Workspace (v13 ARCHITECTURE-GAPS §8, CONVENTIONS §7)

**Duration**: 1 sprint
**Dependencies**: Shell (done), FilterContext (done)
**Source doc**: v13 ARCHITECTURE-GAPS §8, v13 CONVENTIONS §6–7

### Tasks

1. **X.1** — `ViewerContext` flow through entire system:
   - Passed to DataAdapter on every query
   - Passed to WorkspaceAdapter on every artifact operation
   - SecurityBinding enforcement in filter value population
   - Personal artifact visibility (personal/shared/published)

2. **X.2** — "Preview as..." for admins:
   - Dropdown in preview mode header
   - Enter simulated viewer attributes
   - Preview renders with those attributes passed to DataAdapter

3. **X.3** — Role-based workspace shell (`workspaceRole`):
   - Admin: all sections (Content, Data, Govern)
   - Author: Content + Data (read-only), no Govern
   - Viewer: simplified catalog only (no sidebar sections, flat list)
   - Artifact card actions vary by role

4. **X.4** — Viewer's lightweight workspace:
   - Published / Shared with me / My Work sections
   - Duplicate-to-My-Work flow
   - Filter presets: apply within admin constraints
   - Save personal view

5. **X.5** — Workspace Information Architecture (3-tier sidebar):
   - Content: Catalog, Explore, Create New, Templates
   - Data: Data Sources, Connections
   - Govern: Filters, Rules, Alerts, Publish
   - Cross-navigation shortcuts (builder → filter catalog, widget → alert)

---

## Sprint Y: Artifact Version History + Config Diff (v13 ARCHITECTURE-GAPS §6, CONVENTIONS §3)

**Duration**: 1 sprint
**Dependencies**: WorkspaceAdapter (done)
**Source doc**: v13 ARCHITECTURE-GAPS §6, v13 CONVENTIONS §3.2–3.4

### Tasks

1. **Y.1** — `ArtifactHistoryExtension` on WorkspaceAdapter:
   - `getArtifactHistory()`, `getArtifactVersion()`, `restoreArtifactVersion()`
   - Optional — hide History button if not implemented

2. **Y.2** — Auto-generated change descriptions:
   - JSON structure diff (not string diff)
   - Domain-language descriptions ("Added widget 'Revenue Chart'")

3. **Y.3** — Version history UI:
   - History panel in designer header
   - Version list with timestamps, authors, change descriptions
   - Side-by-side diff view
   - Restore creates new version (no destructive rollback)

4. **Y.4** — Config diff on save:
   - Summary of changes since last save
   - Added/removed/repositioned widgets for dashboards
   - Changed columns, filters, sort for reports

5. **Y.5** — Conflict detection:
   - Second-save warning if artifact modified by another user
   - Overwrite or discard (merge deferred to collab package)

---

## Sprint Z: UI Specification Implementation (v14 WORKSPACE-UI-SPEC)

**Duration**: 2 sprints
**Dependencies**: All previous sprints
**Source doc**: v14 WORKSPACE-UI-SPEC

This is the visual polish sprint. The v14 document specifies exact CSS values,
colors, spacing, and component styling for the phozart-ui Console mode design
system. This can be implemented incrementally.

### Tasks (Sprint Z1)

1. **Z1.1** — Shell header: dark frame (#1C1917), 56px height, breadcrumbs, save indicator
2. **Z1.2** — Sidebar: 240px warm surface (#FAF9F7), section headers, active state with accent bar
3. **Z1.3** — Content area: #FEFDFB background, proper spacing
4. **Z1.4** — Phosphor Icons integration (Regular for chrome, Bold for CTAs)
5. **Z1.5** — Loading progress strip (3px bar, #3B82F6 accent)

### Tasks (Sprint Z2)

6. **Z2.1** — Catalog cards with phozart-ui styling
7. **Z2.2** — Designer panels (slide-out, modal) with proper shadows and radius
8. **Z2.3** — Filter bar styling per Console mode
9. **Z2.4** — Explorer/pivot styling
10. **Z2.5** — Alert/breach indicators with status tokens
11. **Z2.6** — Dark mode / high-contrast verification

---

## Sprint Dependency Graph

```
Already done (v1-4 executing):
  Phase 1 (Research) → Phase 2 (Types) → Phase 3 (Shell+Catalog) → Phase 4 (Wire Tools)

This plan (v5-v14):

  S (Connectors + OPFS) ──────────────────┐
  T (Filter Rules + Catalog) ─────────────┤
  U (Navigation + Drill-Through) ─────────┤
  W (Time Intelligence + Units) ──────────┤
                                          ├──→ Y (Version History)
  V (Data Loading Architecture) ──────────┤        │
  X (Viewer Context + Roles) ─────────────┘        │
                                                   ▼
                                             Z (UI Spec)
```

**Sprints S, T, U, V, W, X** can run in parallel (independent concerns).
**Sprint Y** depends on WorkspaceAdapter being stable (can start after S).
**Sprint Z** is the final polish pass and should run last.

---

## Estimated Total

| Sprint | Items | Complexity |
|--------|-------|-----------|
| S — Connectors + OPFS | 4 tasks | Medium |
| T — Filter Rules + Catalog | 5 tasks | High (enterprise filter logic) |
| U — Navigation + Drill-Through | 5 tasks | Medium |
| V — Data Loading Architecture | 6 tasks | High (preload/full/detail pipeline) |
| W — Time Intelligence + Units | 5 tasks | Medium |
| X — Viewer Context + Roles | 5 tasks | Medium |
| Y — Version History + Diff | 5 tasks | Medium |
| Z — UI Spec | 11 tasks (2 sprints) | Medium (CSS/styling) |

**Total**: 46 tasks across 9 sprints (Z counts as 2).

---

## Verification Strategy

For each sprint, verify:
1. `tsc --build` clean (0 errors)
2. All new tests pass (`npm test`)
3. Existing tests do not regress
4. Sub-path exports updated in `packages/workspace/package.json`
5. Index files re-export new modules
6. Memory updated with sprint completion status

---

## Key Risk: Overlap with v1–4 Agents

The currently-executing agents (Sprint L Shell UX, Sprint L Dashboard,
Sprint M Integration) may have already implemented some of the items listed
here. Before starting each sprint:

1. Re-read the workspace source to check for existing implementations
2. Check test files — if a test already passes, the feature may exist
3. If overlap is found, verify completeness against the v13/v14 spec and
   only implement the delta
