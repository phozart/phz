# phz-grid occupies an empty niche in the BI toolkit landscape

**The open-source BI market has a structural gap that phz-grid can fill.** Existing tools cluster at two extremes: full-stack BI platforms (Superset, Metabase, Grafana) that require dedicated infrastructure and impose their own rendering, and low-level libraries (TanStack Table, react-grid-layout) that require developers to build everything from scratch. No production-ready open-source toolkit today delivers embeddable, config-driven BI authoring as Web Components with consumer-provided data backends. The 17-package monorepo with framework adapters, headless grid engine, 5-layer expression DAG, and DuckDB-WASM adapter already has more depth than most competitors in the embeddable space — the strategic question is what to add, what to leave out, and how to position the workspace consolidation for maximum adoption.

This report synthesizes research across 30+ tools, libraries, and platforms to produce actionable recommendations for phz-grid's architecture and feature roadmap.

---

## The competitive landscape reveals five distinct product categories

The open-source BI market in 2026 breaks into clear tiers, each with structural strengths and gaps that inform phz-grid's positioning.

**Full-stack BI platforms** — Apache Superset (~65.8k GitHub stars), Metabase (~40k stars), and Grafana (~66k stars) — dominate adoption but require dedicated infrastructure. Superset's Flask/React/Celery/Redis stack demands DevOps expertise. Metabase achieves a remarkable "5 minutes to first dashboard" via single-JAR deployment, but its AGPL license and commercial feature gating (interactive embedding, SSO, row-level security require $85/mo+ plans) create friction for embedding. **Grafana's panel plugin system and dashboard JSON model represent the gold standard for config-driven extensibility**, but its optimization for time-series observability makes it awkward for general-purpose BI. All three tools rely primarily on iframe-based embedding — the single most complained-about limitation across developer forums, Reddit, and GitHub issues.

**Semantic layer tools** — Cube (~18k stars) and dbt Semantic Layer — address the data modeling gap but provide zero visualization. Cube's architecture is instructive: it defines metrics, dimensions, and pre-aggregations in YAML/JS and exposes them via REST, GraphQL, SQL, DAX, and MDX APIs. **Cube's clean separation of data definition from presentation is the pattern phz-grid should emulate** at the adapter interface level. Cube's pre-aggregation system (materialized rollups in Cube Store) delivers sub-second latency at scale, demonstrating that the semantic layer should own caching strategy, not the visualization layer.

**Code-first analytics frameworks** — Evidence.dev (~4.5k stars), Observable Framework (~3.4k stars), and Rill Data (~2k stars) — target developers exclusively. Evidence's Markdown+SQL approach and Observable's reactive programming model produce beautiful output but are completely inaccessible to non-developers. Rill Data's `curl | sh` installation achieves the fastest time-to-insight in the category but restricts users to an opinionated metrics-explorer dashboard with no layout customization. These tools validate that **DuckDB-powered local-first analytics is real and performant** but leave the no-code authoring gap wide open.

**Embeddable commercial SDKs** — GoodData.UI, Sisense Compose SDK, and Looker Embedded — offer the embedding patterns phz-grid should study. GoodData.UI provides the most sophisticated component model with three embedding tiers (iframe → Web Components → React SDK) and a formal `IAnalyticalBackend` SPI that consumers implement. **Sisense's code-first composable approach with typed data models generated from schema represents the best developer experience** for embedding. All three are proprietary and expensive, creating the market opening.

**Grid/table and layout libraries** form the foundation layer. AG Grid (~13k stars) demonstrates that **config-driven column definitions with pluggable cell renderers is a proven extensibility pattern** — its value pipeline (getter → formatter → renderer) is worth emulating. TanStack Table (~26k stars) proves the headless-core-plus-framework-adapters architecture is the most portable approach and keeps bundle size tiny (~15KB). For layout, react-grid-layout (~22k stars, 1.8M weekly npm downloads) dominates React dashboards but is framework-locked. **gridstack.js (~8.7k stars) is the better reference for phz-grid: framework-agnostic, nested grids, external drag-in, custom engine extensibility, zero dependencies, ~10KB gzipped.**

---

## Five architecture patterns phz-grid must adopt

Research across all competitive categories reveals five architectural patterns that consistently differentiate successful BI toolkits from failed ones.

### The Grafana-style widget contract is the proven standard

Every successful dashboard system converges on a similar widget contract. Grafana's `PanelProps` interface is the most mature implementation: panels receive `data` (DataFrames), `width`, `height`, `timeRange`, `options` (plugin-specific config), `fieldConfig` (per-field overrides with thresholds/units/colors), and `replaceVariables` (template interpolation). They emit events for time range changes, drill-downs, and filter updates. **phz-grid's existing widget resolver and chart projection already align with this pattern** — the key addition is formalizing the contract as a versioned TypeScript interface that third-party widgets implement.

The registration pattern should follow the **Open/Closed Principle**: a central `WidgetRegistry` maps string type keys to component factories. Superset uses a `ChartPlugin` class with `metadata` (name, thumbnail, tags), `controlPanel` (configuration UI definition), `buildQuery` (how to construct the data request), `transformProps` (adapt raw data to component props), and `loadChart` (lazy-load the renderer). This separation of query construction from rendering is critical — it means the same data pipeline serves both built-in and custom widgets. phz-grid's existing widget system should be refactored to expose these four concerns as distinct, overridable hooks.

**What phz-grid should specifically implement**: A `WidgetManifest` type that declares required data shape, supported interactions (drill-through, cross-filter, resize), configuration schema (for auto-generating option panels), and minimum/preferred dimensions. The workspace should use this manifest to constrain the authoring UI — if a consumer declares their app doesn't support drill-through, the workspace hides drill-through configuration for all widgets.

### Composable layout containers beat flat grid positioning

Grafana's 2025 V2 schema is the breakthrough reference. After years of flat `panels[]` with `gridPos: {x, y, w, h}` on a 24-column grid, Grafana now supports **four composable layout kinds**: `GridLayout` (manual positioning), `AutoGridLayout` (auto-sized based on constraints), `RowsLayout` (collapsible rows), and `TabsLayout` (tabbed sections). These nest arbitrarily — tabs can contain rows, rows can contain grids. This directly validates phz-grid's intent-based layout direction.

Home Assistant's 2024 layout research provides additional validation. Their team proved that **masonry layout + responsive design + drag-and-drop are fundamentally incompatible** — the unpredictability of masonry means users "pray and guess where cards will land." Their solution — sections with Z-grid flow (left-to-right, wrapping at row boundaries, internal card positions preserved across screen widths) — preserves spatial memory while enabling responsive reflow.

**phz-grid's intent-based layout should implement a three-level hierarchy**: semantic containers (tabs, collapsible sections with named purposes like "KPI Overview" or "Detail Charts") at the top level, flow-based grouping with weights at the middle level, and CSS Grid auto-placement within groups at the leaf level. This maps to: `TabsLayout → RowsLayout → AutoGridLayout` in Grafana's terminology. The key insight from CSS Container Queries research is that **widgets should adapt to their container size, not the viewport** — `container-type: inline-size` with `@container` rules means the same KPI card component renders differently at 200px vs 600px width without any JavaScript.

The serialization model should follow Grafana's Kubernetes-style `kind/spec` pattern with stable NanoID identifiers (not sequential database IDs), explicit schema versioning, and a tree structure rather than a flat array. This is more extensible and supports the layout migration functions phz-grid is planning.

### Progressive disclosure from config to code is the adoption multiplier

The most successful tools provide layered escape hatches rather than forcing a binary choice between config and code. **Retool's pattern is the gold standard**: every component property accepts `{{ javascript expressions }}`, meaning the transition from purely declarative config to custom logic is a single keystroke. Grafana follows the same principle with template variables (`${var_name}` interpolated into queries, panel titles, and row headers) and a transformations pipeline (config-driven post-query data manipulation: merge, filter, calculate, rename) before requiring plugin-level code.

For phz-grid's workspace, the layering should be:

- **Level 0 (zero code)**: Templates and presets — pick a dashboard template, select data source, customize labels
- **Level 1 (config)**: JSON/YAML workspace definition — all widget placement, filtering, metric selection expressed declaratively
- **Level 2 (expressions)**: The existing 5-layer expression DAG (Fields → Parameters → Calculated Fields → Metrics → KPIs) — users write formulas, not code
- **Level 3 (custom widgets)**: Register a custom renderer via the widget registry — requires TypeScript/framework code
- **Level 4 (custom data)**: Implement the DataAdapter interface for a proprietary data source — requires backend code

Self-service BI research consistently shows that **the governing semantic layer is what makes non-developer authoring succeed or fail**. When business users pick from pre-curated, governed metrics rather than raw database fields, report quality and trust increase dramatically. phz-grid's KPI/metric registries and criteria engine already provide this layer — the workspace should present these as the primary authoring surface, with raw field access available but not default.

### The consumer-provided data backend must be a clean SPI

GoodData.UI's `IAnalyticalBackend` Service Provider Interface is the most explicit reference implementation. The SDK defines `@gooddata/sdk-backend-spi` as a package of pure interface definitions, with `@gooddata/sdk-backend-tiger` as the GoodData Cloud implementation. Consumers implement the SPI, wrap it with `BackendProvider` for dependency injection, and all visualization components are backend-agnostic. FINOS Perspective 3.0 took a similar approach with its pluggable Data Model API, though the team discovered that **the UI feature set becomes implicitly coupled to what the backend supports** — replacing the backend doesn't add capabilities the UI doesn't know about.

phz-grid's `WorkspaceAdapter` (config persistence) and `DataAdapter` (runtime data resolution) split is architecturally correct. The research suggests three refinements:

- **Capability declaration**: The `DataAdapter` should expose a capabilities object declaring what it supports (aggregation push-down, window functions, SQL, specific filter types). The workspace should constrain authoring to capabilities the adapter declares — this is the "consumer capability declaration" pattern already in the project's plan and is validated by both GoodData and Perspective's experience.
- **Result format standardization**: Use a columnar DataFrame-like structure (matching Grafana's DataFrames and Apache Arrow's layout) rather than row-oriented JSON arrays. This aligns with DuckDB-WASM's native Arrow output and enables zero-copy data transfer between the compute layer and visualization layer.
- **Caching belongs in the adapter, not the widget**: Cube's architecture proves that caching (pre-aggregation, query deduplication) is a data-layer concern. The BI toolkit should provide caching utilities (like GoodData's `withCaching` wrapper) but not own the caching strategy.

### Schema versioning with migration functions is non-negotiable

Metabase uses YAML serialization with stable NanoID entity IDs and database references by name (not ID) for portability across instances. Grafana has navigated three schema generations (Classic → V1 Resource → V2 Resource) with backward compatibility — pre-existing dashboards open normally, saving auto-upgrades to the new schema. Superset stores layout as `position_json` with separate `json_metadata` for dashboard-level config.

**phz-grid's Zod validation layer is a significant advantage here** — no other open-source BI toolkit validates serialized config at the schema level with runtime type checking. The migration function approach (versioned schemas with explicit transforms) is the right pattern. The research suggests adding: a `schemaVersion` field on every persisted artifact, forward-only migrations (no downgrade paths — they add unbounded complexity), and validation-on-read that migrates lazily rather than requiring batch migration of all stored configs.

---

## What phz-grid should explicitly not build

The research identifies six categories of features that are commonly attempted but deliver poor ROI for an embeddable toolkit.

**A managed hosting/deployment layer.** Superset, Metabase, and Grafana all invested heavily in Kubernetes operators, Docker Compose configurations, and deployment guides. Their commercial arms (Preset, Metabase Inc., Grafana Labs) exist largely because self-hosting these platforms is painful. phz-grid's architecture — consumer provides the database adapter, config is persisted JSON loaded by ID — already eliminates the deployment problem by design. The workspace is a component in the consumer's app, not a separate service. Adding deployment infrastructure would pull the project into a category it shouldn't compete in.

**A full SQL IDE or ad-hoc query interface.** Superset's SQL Lab and Metabase's native query mode are their most used features for power users but also their most complex codepaths. For an embeddable toolkit, SQL access should be the consumer's responsibility. The expression DAG (Fields → Parameters → Calculated Fields → Metrics → KPIs) provides sufficient analytical expressiveness without exposing raw SQL to end users. If power users need SQL, they use it through the DataAdapter implementation, not through the BI authoring UI.

**A full NLP/AI-to-dashboard feature.** Research shows that while NL-to-SQL accuracy claims reach 95%+ in marketing, enterprise reality on production schemas with "duplicated names and nonsensical field names" is often **10-31% accuracy**. Metabase's MetaBot, Databricks' Genie, and Power BI Copilot are all backed by massive engineering teams and still produce inconsistent results. The practical AI value today is limited to SQL assistance, chart summarization, and metadata enrichment. phz-grid should expose well-documented config schemas that external AI tools can target (generate `GridDefinition` JSON from natural language) rather than building its own AI layer. The MCP (Model Context Protocol) pattern — where Superset and Rill Data expose context for external AI assistants — is the right lightweight integration point.

**A permissions/RBAC engine.** Row-level security, SSO/SAML, and audit logging are consistently the features that push tools from community to commercial tier (Metabase Enterprise, Grafana Enterprise, Cube Cloud). They are also the features most tightly coupled to the consumer's authentication infrastructure. phz-grid's `PlacementRecord` system with role-based access is the right abstraction — declare what roles can access what artifacts, and let the consumer's app enforce it. Building a full auth system would create integration friction, not reduce it.

**A charting library.** phz-grid's 20+ SVG-based widgets already exceed what most embeddable toolkits offer. But building toward Superset's 40+ chart types or Grafana's 50+ panel types is a trap — each additional chart type has maintenance cost proportional to the number of themes, density modes, and responsive breakpoints supported. The widget registry pattern (open, extensible) is the right escape valve. Ship the core 20-25 most-used chart types, optimize them thoroughly, and document the registry so consumers add domain-specific visualizations (Gantt charts, BPMN diagrams, geospatial maps) as custom widgets.

**100+ database connectors.** Superset supports 30+ databases via SQLAlchemy dialects. Metabase has dozens of drivers. Redash boasts 100+ query runners. Each connector requires testing, version management, and security review. phz-grid's DataAdapter interface delegates this entirely to the consumer — the right architectural decision. Ship reference implementations for DuckDB-WASM (already done), a generic REST/fetch adapter, and perhaps a Cube.js client adapter. Let the ecosystem build the rest.

---

## The unique positioning is "embeddable BI authoring, not embeddable BI viewing"

Most embedded analytics products (Metabase Embedded, Superset Embedded SDK, Looker Embedded, GoodData) focus on embedding **consumption** — viewing pre-built dashboards in a host app. The authoring always happens in the BI tool's own UI. phz-grid's workspace consolidation inverts this: **the authoring itself is an embeddable component**. The consumer's admin users configure reports, dashboards, KPIs, and filters inside the consumer's own application, using the consumer's own design system, with output persisted as versioned JSON that the consumer's app loads and renders.

This positioning maps to a real unmet need. Developer complaints about embedded BI consistently cite: inability to match the host app's design system ("Power BI dashboards always look like they were made on Power BI"), per-user pricing that makes embedded analytics at scale prohibitively expensive, and the requirement to maintain separate infrastructure for the BI tool. phz-grid's Web Components architecture (Lit-based with framework adapters) solves the first problem — Shadow DOM prevents style leakage while CSS custom properties allow theme inheritance. The zero-infrastructure model (consumer provides data adapter, config is JSON) solves the second and third.

**Three specific opportunities the research validates:**

First, **DuckDB-WASM as the zero-ops default**. The "distributed dashboarding" pattern — ship DuckDB-WASM + Parquet data as static assets, all queries execute client-side — eliminates server infrastructure for datasets up to hundreds of MBs. phz-grid already has the DuckDB-WASM adapter. The workspace should make this the default "getting started" path: load a CSV or Parquet file, build a dashboard in the workspace, export config JSON, render it with DuckDB-WASM in the browser. Time to first dashboard: under 5 minutes, matching Metabase's benchmark without requiring a server.

Second, **the config contract as the integration surface**. Rather than competing with Superset or Metabase on features, phz-grid should compete on the quality of its config contract. The `GridDefinition` schema + Zod validation + schema versioning + migration functions creates a formal, versioned API that AI tools, code generators, other BI tools, and custom scripts can target. This is the "headless BI authoring" category — analogous to how Cube created "headless semantic layer" and won because they focused on the API contract rather than the UI.

Third, **Web Components as the framework escape from the React monopoly**. Grafana, Superset, Metabase, react-grid-layout, and most embedded BI SDKs are React-only. GoodData offers Web Components as an alternative but wraps React internally. Lit-based Web Components with genuine framework adapters (React, Vue, Angular, Python) position phz-grid for the multi-framework enterprise reality. Research shows Web Components are experiencing a "2025-2026 resurgence" driven by framework fragmentation fatigue and standardization by Google (Material Web Components) and Salesforce (Lightning Web Components).

---

## CSS Container Queries transform the responsive widget story

The single most impactful CSS feature for phz-grid's intent-based layout is **Container Queries** (Baseline 2023, supported in Chrome 105+, Firefox 110+, Safari 16+). Traditional responsive design uses `@media` queries tied to viewport width — useless when the same KPI card renders at 200px inside a sidebar widget and 600px as a main content widget. Container Queries let each widget respond to its own container dimensions.

The implementation pattern is straightforward. Mark each widget wrapper with `container: widget / inline-size`. Inside the widget's styles, use `@container widget (min-width: 420px)` to switch between compact and expanded layouts. Container query length units (`cqw`, `cqh`, `cqi`) enable proportional sizing — `font-size: clamp(1rem, 4cqw, 2.5rem)` scales typography to container width. This aligns perfectly with phz-grid's 3-layer CSS token system: public API tokens define the design language, internal computed tokens handle container-responsive calculations, and component styles use container queries for layout adaptation.

**CSS Subgrid** (also Baseline 2023) solves the nested alignment problem. When a section contains multiple KPI cards, subgrid ensures their internal elements (label, value, trend indicator) align across siblings without JavaScript measurement. The pattern: dashboard uses `display: grid; grid-template-columns: repeat(12, 1fr)`, widget groups span multiple columns with `display: grid; grid-template-columns: subgrid` to inherit the parent's track sizing. Combined with `@layer` cascade layers for theming (`@layer base, layout, widgets, theme`), this creates a CSS architecture where theme layers predictably override widget styles without specificity wars.

For the intent-based layout specifically, CSS Grid's `auto-fill` with `minmax()` — `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` — creates responsive columns that adapt to available space without breakpoints. This is the CSS-native implementation of "semantic grouping with weights": the weight translates to `minmax()` constraints, and the browser's grid algorithm handles placement. Named grid areas (`grid-template-areas: "kpi kpi chart" "table table chart"`) provide human-readable layout definitions that map directly to the intent-based layout concept.

---

## The open-core playbook and adoption path

Research on successful open-source BI projects reveals a consistent pattern: **developer-facing features stay MIT/Apache-licensed, governance/enterprise features go commercial**. Cube (MIT/Apache core, Cube Cloud commercial), Grafana (AGPLv3 core, Grafana Cloud commercial), and Metabase (AGPL core, Enterprise commercial) all follow this model. The commercial features that consistently justify paid tiers are SSO/SAML integration, row-level security, audit logging, advanced RBAC, scheduled report delivery, and managed hosting. Notably, moving previously-free features to paid tiers is identified as the most trust-destroying anti-pattern — Percona's co-founder estimates no more than 10% of production users should be paying customers "if the Community version is actually useful."

**For phz-grid's adoption trajectory, four factors matter most:**

Time to first dashboard is the critical metric. Metabase's "5 minutes" and Rill Data's "3 minutes" set the benchmark. phz-grid's monorepo architecture with 17 packages could make initial setup daunting. The workspace consolidation into `@phozart/phz-workspace` is the right move — a single package import that renders the full authoring environment. The getting-started story should be: `npm install @phozart/phz-workspace`, drop `<phz-workspace>` into your app, pass a DuckDB-WASM adapter and a CSV file, see the authoring UI. No backend server, no configuration files, no Docker.

Interactive demos and sandboxes dramatically reduce evaluation friction. Every successful BI tool maintains a public demo instance or embedded playground. phz-grid should ship a standalone demo app (deployable to Netlify/Vercel/GitHub Pages as a static site) that demonstrates the full workspace with sample datasets. Because DuckDB-WASM runs in the browser, this demo requires zero backend infrastructure.

Documentation should be persona-segmented. Three audiences need different entry points: **consumers** embedding pre-built dashboards (5 minutes: install, load config, render), **authors** building reports in the workspace (30 minutes: connect data, create widgets, save config), and **developers** extending with custom widgets and data adapters (2 hours: implement WidgetManifest, register renderer, implement DataAdapter). AG Grid's documentation — with live examples, code sandboxes, and API reference — is the quality benchmark for component libraries.

The schema-driven configuration UIs should follow a **hybrid approach**. Research on RJSF (react-jsonschema-form) shows that schema-generated forms work well for the 80% case (simple properties, selects, toggles) but create an "uncanny valley" for domain-specific experiences. phz-grid should use schema-driven generation for widget option panels (auto-generated from the WidgetManifest's configuration schema) and purpose-built wizard UIs for high-touch authoring flows (the existing 6-step ReportDesigner, KPIDesigner). Grafana does exactly this — panel options use a builder pattern but allow custom editor components for complex cases.

---

## Emerging patterns to watch and selectively adopt

**DuckDB-WASM enables "local-first analytics" as a genuine architectural category**, not marketing hype. Performance benchmarks show 10-100x faster query execution than JavaScript alternatives (Arquero, Lovefield) across TPC-H queries. Practical limits are clear: works well for datasets up to hundreds of MBs, struggles with multi-GB data in browser sandboxes (typically 1-4GB memory). The hybrid pattern — DuckDB-WASM for cached hot data, server push-down for cold/historical queries — outperforms both approaches alone by **2.2x** per FlexPushdownDB research. phz-grid's compute backend abstraction (JS in-memory, DuckDB-WASM, server) already supports this hybrid model.

**Real-time dashboards require WebSocket infrastructure with careful UX engineering.** Grafana Live demonstrates the pattern: Pub/Sub over WebSocket, all subscriptions multiplexed in a single connection (~50KB memory per connection, ~20K connections per 1GB RAM). The critical UX patterns are: buffer/batch updates (don't re-render on every message — 100ms batches), trim old data (keep only last N points visible), skip animations for streaming data, use `requestAnimationFrame` for paint-cycle-aligned updates, and offload calculations to Web Workers. phz-grid should expose a `StreamAdapter` interface that widgets can optionally implement, but building a full streaming infrastructure would be overkill.

**Cross-filtering architecture should follow Mosaic/vgplot's declarative model** rather than imperative event buses. In Mosaic, components publish data needs as declarative queries, and a central Coordinator automatically optimizes, consolidates, and cross-filters across views. The selection abstraction generalizes Vega-Lite's model to handle linked brushing, click-to-filter, and shared ranges without explicit event wiring between widgets. phz-grid's existing cross-filtering can be enhanced by moving from widget-to-widget events to a coordinator pattern where filter state is managed centrally and widgets subscribe to relevant filter dimensions.

**The data mesh trend means dashboards become consumers of governed data products**, not direct database queries. This validates phz-grid's architecture where the DataAdapter is consumer-provided — the consumer's domain team owns the data product, and phz-grid renders it. The workspace's metric/KPI registry maps naturally to the data product's metric catalog. The key implication: phz-grid should expose metadata about data freshness, lineage, and ownership if the DataAdapter provides it, but should not own data governance.

---

## Conclusion: a roadmap hierarchy of what matters most

The research converges on a clear priority ordering for the workspace consolidation. **The highest-impact work is formalizing the three contracts**: `WidgetManifest` (what a widget declares about itself), `DataAdapter` (how consumers provide data), and the layout schema (how intent-based layout is serialized). These contracts are what make phz-grid composable and extensible without being opinionated — they define the boundaries while leaving implementation to the ecosystem.

The second priority is the **getting-started experience**: single-package import, DuckDB-WASM default adapter, interactive demo deployable as a static site, persona-segmented documentation. Metabase proves that time-to-first-dashboard determines adoption more than feature count.

The third priority is **layout modernization**: adopt CSS Container Queries for widget-responsive design, implement composable layout containers (tabs → sections → auto-grid), and use CSS Grid auto-placement with `minmax()` constraints as the native expression of "intent-based layout with weights." This positions phz-grid ahead of Grafana's V2 schema (which still uses absolute grid positioning within containers) and eliminates the responsive layout pain that makes react-grid-layout layouts break on mobile.

What phz-grid should **not** pursue: managed hosting, full SQL IDE, AI-to-dashboard features, comprehensive permissions engine, 100+ database connectors, or a charting library beyond the core 20-25 types. These features either belong to the consumer's infrastructure, have poor ROI for an embeddable toolkit, or are better left to the open widget registry. The unique competitive advantage is being the only open-source tool that embeds BI *authoring* — not just BI *viewing* — as a framework-agnostic Web Component with consumer-provided data backends and formally versioned config output.