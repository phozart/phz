# phz-grid BI Stack: Comprehensive Multi-Lens Review

## Context

Deep review of the BI/visualization stack across 4 packages (`engine`, `widgets`, `criteria`, `engine-admin`) from 9 perspectives: Innovation Strategist, Product Designer, Marketing Strategist, Software Architect, Data Engineer, Performance Engineer, QA/Tester, Developer (SDK consumer), and End-User (business analyst). The review covered 100+ source files, 60+ test files, and cross-package integration patterns.

---

## Executive Summary

The BI stack has **excellent architectural bones** (5-layer DAG, branded IDs, expression system, criteria engine) but is **not production-ready** due to 5 critical gaps: disconnected filters, no persistence, synthetic KPI data, incomplete admin forms, and missing chart types. The expression builder is a genuine competitive differentiator. The criteria package is enterprise-grade. The widget set is minimal but accessible.

---

## SECTION 1: WHAT'S GENUINELY GOOD

### Architecture (Architect lens)

- **BIEngine facade** (`engine/src/engine.ts`) -- clean factory composition of 11 subsystems, lazy loading, proper DI
- **Branded ID types** (`engine/src/types.ts`) -- `KPIId`, `MetricId`, `ReportId` prevent cross-contamination at compile time
- **5-layer computation DAG** (`engine/src/dependency-graph.ts`) -- Fields > Parameters > Calculated > Metrics > KPIs with topological sort + cycle detection (Kahn's algorithm)
- **Criteria Engine** (`criteria/src/`) -- 6-layer state resolution: rule > preset > persisted > binding > definition > all_selected
- **Pragmatic Hybrid** filter reconciliation (`engine/src/resolve-criteria.ts`) -- elegantly handles 4 cases with divergence detection
- **Config merge** (`engine/src/config-merge.ts`) -- 3-layer system > admin > user precedence

### Expression System (Innovation + Developer lens)

- **Dual-mode expression builder** -- formula text AND block visual editing on the same AST. Better than Metabase, Looker, and Power BI's DAX editor
- **Full AST pipeline** -- tokenizer > parser > evaluator > validator with 4 sigil types (`[field]`, `$param`, `@metric`, `~calc`)
- **15 built-in functions** -- math (`ABS`, `ROUND`, `FLOOR`, `CEIL`), string (`UPPER`, `LOWER`, `LEN`), date (`YEAR`, `MONTH`, `DAY`), utility (`COALESCE`, `IF`, `CLAMP`)
- **SQL-style null propagation** -- correct semantics in arithmetic, short-circuit AND/OR

### Criteria Package (End-User + QA lens)

- **32 components, 8 field types** -- date range, numeric range, tree select, combobox, chip select, searchable dropdown, field presence, match filter pill
- **WAI-ARIA combobox** -- full keyboard nav, `aria-expanded`, `aria-activedescendant`, `aria-selected`
- **Fiscal calendar support** -- fiscal quarters, configurable fiscal year start
- **16 date presets** -- relative, rolling, to-date, previous-complete with comparison periods (YoY)
- **Forced Colors media query** support in combobox and date picker

### Accessibility (Product + Marketing lens)

- ARIA roles on all widget components (`region`, `list`, `listitem`)
- Keyboard navigation with focus rings (2px solid)
- Screen reader labels on KPI cards
- Color not sole indicator (status badges have text + dots)
- **Competitive moat** -- no embeddable BI SDK claims WCAG 2.2 AA compliance

---

## SECTION 2: CRITICAL BUGS & BREAKAGES

### P0 -- Must Fix Immediately

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Math.min/max stack overflow** on arrays >65K | `engine/src/aggregation.ts:47-52` | Crash -- `RangeError: Maximum call stack size exceeded` |
| 2 | **`.arrow/.ipc` falls back to CSV** | `duckdb/src/duckdb-data-source.ts:342` | Silent data corruption -- wrong format parsed |
| 3 | **`fromArrowTable()` row-by-row INSERT** | `duckdb/src/duckdb-data-source.ts:267-287` | 100x slower than bulk load, loses type info |
| 4 | **String param interpolation** (SQL injection risk) | `duckdb/src/duckdb-data-source.ts:184-189` | Security vulnerability -- regex replacement on SQL |
| 5 | **Composite metrics return `null`** | `engine/src/metric.ts:163` | Silent failure -- `case 'composite': return null` |
| 6 | **Score provider uses synthetic data** | `engine/src/score-provider.ts:25-35` | Fake KPIs -- `previousValue = value * 0.95`, trend is algorithmic noise |
| 7 | **`destroy()` is empty** (memory leak) | `engine/src/engine.ts:188-190` | Leak in SPA -- subscriptions, Maps, listeners never cleaned up |

### P1 -- Broken Core Features

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 8 | **THREE disconnected filter systems** | `CriteriaConfig`, `CriteriaEngine`, `GlobalFilter` | Filters are decorative -- values never reach widgets |
| 9 | **Pivot single-measure only** | `engine/src/pivot.ts:68` -- `config.valueFields[0]` | Multi-measure silently truncated |
| 10 | **Pivot grand totals re-scan** | `engine/src/pivot.ts:74-81` | O(rows * cols) -- filters full dataset per column key |
| 11 | **Report designer step 4 empty** | `engine-admin/src/components/phz-report-designer.ts:214-217` | Dead end -- aggregation step is placeholder |
| 12 | **Engine-admin events-only** | All admin components | No state sync to BIEngine -- save events fire into void |
| 13 | **ArtefactId/DashboardId mismatch** | `engine/src/types.ts` vs filter bindings | Filter bindings silently fail -- ID prefix missing |

---

## SECTION 3: MISSING FEATURES BY CATEGORY

### Charts & Visualization (Product + End-User lens)

**Current widget set (10 types):** `kpi-card`, `kpi-scorecard`, `bar-chart`, `trend-line`, `bottom-n`, `status-table`, `drill-link`, `pivot-table`, `data-table`, `custom`

**Missing chart types (vs Tableau/Power BI/Looker):**

- Pie / donut chart
- Line chart (proper time series, not repurposed trend)
- Area / stacked area chart
- Stacked / grouped bar chart
- Scatter / bubble chart
- Heatmap
- Gauge / speedometer
- Waterfall chart
- Funnel chart
- Treemap
- Sankey / alluvial diagram
- Map / choropleth
- Bullet chart

**Missing chart features:**

- No tooltips on hover
- No legends for multi-series
- No axis labels / gridlines
- No animation / transitions
- No cross-filtering (click bar > filter all widgets)
- No zoom / pan on trend lines
- No responsive chart sizing

### Data Operations (Data Engineer lens)

**Current aggregations:** `sum`, `avg`, `min`, `max`, `count`, `first`, `last`

**Missing:**

- `count_distinct` -- cardinality analysis
- `median` / `percentile(p)` -- statistical distribution
- `stddev` / `variance` -- spread analysis
- Window functions: `runningSum`, `movingAverage`, `rank`, `lag/lead`
- Period-over-period: actual YoY/MoM/WoW computation from data
- Running totals, cumulative sums

### Dashboard Builder (End-User + Product lens)

- No drag-and-drop widget repositioning
- No responsive breakpoints (static 12-col grid)
- No undo/redo in any designer
- No save confirmation UI
- No widget duplication
- No loading / error / empty states in widgets
- No cross-filtering between widgets
- Dashboard Studio data model forms incomplete

### Self-Service Analytics (End-User lens)

- No ad-hoc querying or data exploration
- No "Get Data" / data source connection
- No export from individual widgets
- No sharing / embed codes
- No annotations on data points
- No alerting when KPI thresholds breached
- No drill-down in charts (event emits but nothing handles it)

### Developer Experience (Developer lens)

- No getting-started guide or example app
- No Storybook / playground
- 233-line barrel export with 150+ symbols -- no focused entry points
- 39+ custom event types across admin components -- none documented
- No TypeScript event maps for typed `addEventListener`
- No persistence adapter (localStorage, IndexedDB, REST)
- Estimated time to first dashboard: 2-4 hours (vs 15 min for Metabase embed)

---

## SECTION 4: PERFORMANCE CONCERNS

| Bottleneck | Location | Severity | Fix |
|------------|----------|----------|-----|
| `computeCalculatedFields()` O(n*m) with object spread per row | `dashboard-data-model.ts:183-199` | High -- unusable at 100K+ rows | Column-oriented compute, compiled expressions |
| Tree-walk interpreter per row per node | `expression-evaluator.ts` | Medium -- ~500ms for 1M rows with 10-node expr | Compile AST to closure function (5-10x speedup) |
| Pivot grand totals re-scan | `pivot.ts:74-81` | Medium -- O(rows*cols) | Reuse intersection groups |
| Dashboard re-resolves ALL widgets on any change | `phz-dashboard.ts:116-121` | Medium -- 12 widgets * full data scan | Dirty tracking, debounce, memoize |
| `Math.min(...nums)` / `Math.max(...)` spread | `aggregation.ts:47-52` | Critical -- crash >65K elements | Use loop |
| DuckDB row-by-row INSERT | `duckdb-data-source.ts:267-287` | Critical -- 100K round-trips | Use Arrow IPC bulk load |
| No caching anywhere | All computation | Medium -- redundant recompute every render | 3-tier cache: aggregation, computed fields, widget resolution |

**Recommended architecture additions:**

- `ComputeBackend` strategy: `JSComputeBackend` (current) vs `DuckDBComputeBackend` (SQL pushdown)
- Expression compiler: AST > JS closure for per-row evaluation
- Web Worker offload for calculated fields on large datasets
- Performance monitor: `EngineMetrics` with timing for all major operations

---

## SECTION 5: ARCHITECTURAL RECOMMENDATIONS

### 5.1 Unified Filter Architecture

Create `FilterAdapter` interface that all 3 systems implement. Deprecate `applyCriteriaToData()` in `selection-criteria.ts`. Make `GlobalFilter` a thin wrapper creating `CriteriaEngine` bindings. Wire `CriteriaEngine.buildCriteria()` output to `PhzDashboard` widget resolution.

### 5.2 Persistence Adapter

```typescript
interface EngineStorageAdapter {
  saveReport(report: Report): Promise<void>;
  loadReports(): Promise<Report[]>;
  saveDashboard(dashboard: Dashboard): Promise<void>;
  loadDashboards(): Promise<Dashboard[]>;
  saveKPI(kpi: KPI): Promise<void>;
  loadKPIs(): Promise<KPI[]>;
  saveMetric(metric: Metric): Promise<void>;
  loadMetrics(): Promise<Metric[]>;
}

// Implementations:
// - MemoryStorage (current behavior)
// - LocalStorageAdapter
// - IndexedDBAdapter
// - RemoteAPIAdapter
```

`FilterStateManager` already has `StateStorageAdapter` pattern -- extend to all stores.

### 5.3 DuckDB Integration

Create `ComputeBackend` strategy interface with `aggregate()`, `pivot()`, `filter()`, `computeCalculatedFields()`. Wire `HybridEngine` threshold logic into BIEngine via this strategy. Fix the 3 DuckDB bugs (row-by-row INSERT, arrow/ipc CSV fallback, string interpolation).

### 5.4 Engine-Admin State Sync

Introduce `BIEngineController` (Lit reactive controller) that wraps BIEngine with observable state. Admin components read from AND write to engine stores. Add subscription hooks to all stores.

### 5.5 API Surface Reduction

Split `engine/src/index.ts` (233 lines) into focused entry points:

- `@phozart/phz-engine` -- `createBIEngine`, `BIEngine`, config types
- `@phozart/phz-engine/kpi` -- KPI types and utilities
- `@phozart/phz-engine/dashboard` -- dashboard types and utilities
- `@phozart/phz-engine/criteria` -- filter engine and bindings
- Move internal functions out of public exports

---

## SECTION 6: COMPETITIVE POSITIONING (Marketing lens)

### Recommended positioning

**"The embedded BI engine for developers who refuse to compromise on accessibility."**

NOT a standalone BI tool (lose to Metabase/Looker/Power BI). WIN as an SDK because:

- Web Components embed in ANY framework (React, Vue, Angular, vanilla)
- No iframe -- native component embedding (vs Metabase/Superset iframe-only)
- Accessibility-first -- WCAG 2.2 AA compliance (vs poor a11y in all competitors)
- DuckDB-WASM -- offline-capable, no backend required (vs Superset needing Python+Redis+Postgres)

### Killer features to market

1. **Expression builder** (dual formula+block mode) -- demonstrably better than all competitors
2. **Accessibility moat** -- "only WCAG 2.2 AA embeddable analytics SDK"
3. **Zero-dependency Web Components** -- no iframe, no SDK server
4. **DuckDB-WASM OLAP** -- millions of rows in-browser, offline

### Open-core pricing split

- **MIT Community**: All widgets, dashboard renderer, core engine (aggregation, pivot, chart projection, metrics, KPIs, status), basic criteria, DuckDB bridge. ALL accessibility features (per CLAUDE.md principle).
- **Enterprise**: Admin components (builders, designers, expression builder), advanced criteria (rule engine, presets, admin), config governance, AI toolkit, collaboration, DuckDB advanced, multi-tenant.

### Target segments (priority order)

1. SaaS platforms adding analytics to their product
2. Regulated industry software (healthcare, gov, finance, education) -- WCAG mandatory
3. Internal tool builders (Retool/Appsmith alternative)
4. Data-heavy offline apps (logistics, IoT, trading) -- DuckDB-WASM

---

## SECTION 7: PRIORITIZED RELEASE PLAN

### Release 1 -- Foundation Fix (credibility gate)

| # | Item | Key Files | Depends On |
|---|------|-----------|------------|
| 1.1 | Fix `Math.min/max` stack overflow (use loop) | `engine/src/aggregation.ts:47-52` | -- |
| 1.2 | Fix DuckDB `.arrow/.ipc` CSV fallback | `duckdb/src/duckdb-data-source.ts:342` | -- |
| 1.3 | Fix DuckDB `fromArrowTable()` row-by-row INSERT | `duckdb/src/duckdb-data-source.ts:267-287` | -- |
| 1.4 | Fix DuckDB string param interpolation (SQL injection) | `duckdb/src/duckdb-data-source.ts:184-189` | -- |
| 1.5 | Implement composite metric computation | `engine/src/metric.ts:163` | -- |
| 1.6 | Replace synthetic score provider with real data computation | `engine/src/score-provider.ts:25-35` | 1.5 |
| 1.7 | Implement `destroy()` cleanup | `engine/src/engine.ts:188-190` | -- |
| 1.8 | Unify filter pipeline: CriteriaEngine > Dashboard > Widgets | `criteria/`, `widgets/src/components/phz-dashboard.ts`, `engine/src/widget-resolver.ts` | -- |
| 1.9 | Add persistence adapter (localStorage + pluggable interface) | New: `engine/src/storage-adapter.ts` | -- |
| 1.10 | Add tooltips to all chart widgets | `widgets/src/components/phz-bar-chart.ts`, `phz-trend-line.ts` | -- |
| 1.11 | Add loading/error/empty states to all widgets | All `widgets/src/components/` | -- |
| 1.12 | Multi-measure pivot | `engine/src/pivot.ts:68` | -- |
| 1.13 | Fix ArtefactId/DashboardId type bridge | `engine/src/types.ts` | -- |

### Release 2 -- Chart Expansion + DX

| # | Item | Key Files | Depends On |
|---|------|-----------|------------|
| 2.1 | Pie/donut chart widget | New: `widgets/src/components/phz-pie-chart.ts` | -- |
| 2.2 | Line chart (proper time series) | New: `widgets/src/components/phz-line-chart.ts` | -- |
| 2.3 | Stacked/grouped bar chart | `widgets/src/components/phz-bar-chart.ts` | -- |
| 2.4 | Area chart | New: `widgets/src/components/phz-area-chart.ts` | -- |
| 2.5 | Gauge/speedometer | New: `widgets/src/components/phz-gauge.ts` | -- |
| 2.6 | DuckDB-WASM as computation backend (`ComputeBackend` strategy) | New: `engine/src/compute-backend.ts`, `duckdb/src/duckdb-compute-backend.ts` | R1 DuckDB fixes |
| 2.7 | Create `examples/` directory | New: `examples/hello-dashboard.html`, `examples/react-dashboard.tsx` | -- |
| 2.8 | Event catalog documentation | New: `docs/EVENT-CATALOG.md` | -- |
| 2.9 | Storybook for all widget components | New: `.storybook/`, `widgets/src/stories/` | -- |
| 2.10 | API surface reduction (focused entry points) | `engine/src/index.ts` | -- |

### Release 3 -- Builder Experience

| # | Item | Key Files | Depends On |
|---|------|-----------|------------|
| 3.1 | Drag-and-drop in dashboard builder | `engine-admin/src/components/phz-dashboard-builder.ts` | -- |
| 3.2 | Undo/redo in all designers | New: `engine-admin/src/undo-manager.ts` | -- |
| 3.3 | Report designer step 4 (aggregation configuration) | `engine-admin/src/components/phz-report-designer.ts:214-217` | -- |
| 3.4 | Complete data model forms (parameters, calculated fields) | `engine-admin/src/components/phz-dashboard-studio.ts` | -- |
| 3.5 | Responsive breakpoints for dashboard layout | `widgets/src/components/phz-dashboard.ts` | -- |
| 3.6 | Cross-filtering between widgets | `widgets/src/components/phz-dashboard.ts`, `engine/src/widget-resolver.ts` | R1.8 |
| 3.7 | Expression preview with sample data evaluation | `engine-admin/src/components/phz-expression-builder.ts` | -- |
| 3.8 | Save confirmation UI | All admin components | R1.9 |

### Release 4 -- Intelligence Layer

| # | Item | Key Files | Depends On |
|---|------|-----------|------------|
| 4.1 | AI dashboard generation from data + prompt | `ai/src/` | R2 charts |
| 4.2 | Anomaly detection integration with KPI alerting | New: `engine/src/anomaly-detector.ts` | R1.6 |
| 4.3 | Natural language KPI creation | `ai/src/` | R1.5 |
| 4.4 | Collaborative dashboard editing via Yjs | `collab/src/` | R3.1 |
| 4.5 | Window functions (`runningSum`, `movingAverage`, `rank`, `lag/lead`) | `engine/src/aggregation.ts` | -- |
| 4.6 | Compiled expression evaluator (5-10x speedup) | `engine/src/expression-evaluator.ts` | -- |
| 4.7 | Widget resolution caching/memoization | `engine/src/widget-resolver.ts` | -- |
| 4.8 | Performance monitor (`EngineMetrics`) | New: `engine/src/engine-metrics.ts` | -- |

### Release 5 -- Self-Service Analytics

| # | Item | Key Files | Depends On |
|---|------|-----------|------------|
| 5.1 | Embedded query builder widget | New: `widgets/src/components/phz-query-builder.ts` | R2.6 |
| 5.2 | Data source connection UI ("Get Data") | New: `engine-admin/src/components/phz-data-connector.ts` | -- |
| 5.3 | Widget-level export (CSV, image) | All `widgets/src/components/` | -- |
| 5.4 | Dashboard sharing / embed codes | New: `engine/src/embed-manager.ts` | R1.9 |
| 5.5 | Alert notifications on KPI threshold breach | New: `engine/src/kpi-alerting.ts` | R4.2 |
| 5.6 | Scatter, heatmap, waterfall, funnel charts | New widget components | R2 chart infrastructure |
| 5.7 | Dashboard themes (dark mode, high contrast) | `widgets/src/styles/` | -- |
| 5.8 | Annotations on data points | All chart widgets | R2 charts |

---

## SECTION 8: INNOVATION OPPORTUNITIES

### Blue Ocean (what no BI tool does well)

1. **AI-native analytics SDK** -- fuse `phz-ai` with BI engine: AI-recommended KPIs, NL dashboard creation, anomaly explanation
2. **Collaborative BI editing** -- apply `phz-collab` Yjs CRDTs to dashboard authoring (design-time collab, not just view-time)
3. **DuckDB-WASM embedded OLAP** -- offline-capable, million-row analytics in-browser with columnar processing
4. **Accessibility-first BI** -- chart descriptions, KPI announcements (`aria-live`), keyboard-navigable dashboards, forced-colors chart rendering

### Table Stakes (must have, not differentiating)

- Auto-refresh, CSV export, basic aggregations, color palettes
- KPI cards, bar charts, trend lines -- standard BI widgets
- Date range filters, presets -- standard filter patterns

---

## Key Files Referenced

| File | Why It Matters |
|------|---------------|
| `engine/src/engine.ts` | BIEngine facade -- needs persistence, ComputeBackend, destroy() |
| `engine/src/aggregation.ts` | Math.min/max crash bug, needs median/stddev/distinct_count |
| `engine/src/score-provider.ts` | Synthetic data -- must compute from real data |
| `engine/src/pivot.ts` | Single-measure limitation, grand total re-scan |
| `engine/src/metric.ts:163` | Composite metrics return null |
| `engine/src/expression-evaluator.ts` | Tree-walk interpreter -- needs compilation path |
| `engine/src/dashboard-data-model.ts:183-199` | O(n*m) calculated fields bottleneck |
| `engine/src/criteria/criteria-engine.ts` | Filter unification linchpin |
| `engine/src/widget-resolver.ts` | Where filter values must integrate |
| `engine/src/index.ts` | 233-line barrel export -- needs restructuring |
| `widgets/src/components/phz-dashboard.ts` | Dashboard renderer -- filter pipeline convergence point |
| `duckdb/src/duckdb-data-source.ts` | 3 bugs: row-by-row INSERT, arrow/ipc fallback, SQL injection |
| `engine-admin/src/components/phz-expression-builder.ts` | Competitive differentiator -- needs preview panel |
| `engine-admin/src/components/phz-dashboard-builder.ts` | Needs drag-drop, undo/redo, save confirmation |
