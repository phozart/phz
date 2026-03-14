# CLAUDE.md — phz-grid Orchestration Anchor

## Project Identity

- **Name**: phz-grid
- **Type**: Library (Web Components data grid SDK)
- **Description**: Next-generation universal data grid built on Web Components
  with framework adapters, DuckDB-WASM analytics, accessibility-first design,
  and an open-core monetization model.
- **Config**: `project.config.yaml`

## Behavioral Framing

This is a **monorepo library project** with multiple publishable packages under
`packages/`. All code is TypeScript. The grid core is headless and
framework-agnostic; the Web Components layer uses Lit v5. Framework adapters
(React, Vue, Angular) are thin wrappers.

### Key Principles

1. **Accessibility first** — every feature must work with screen readers,
   keyboard navigation, Forced Colors Mode, and motor impairment accommodations.
   Never ship a feature without a11y.
2. **Modular by default** — features are tree-shakeable modules. Core bundle
   target is <50 KB gzipped.
3. **Schema-as-contract** — the grid's state API generates a JSON Schema that
   drives AI integration, documentation, and type generation.
4. **Three-model extensibility** — hooks (before/after middleware), slots (named
   Web Component slots), headless core (functional composition).
5. **Open-core** — MIT community tier, commercial enterprise tier. Never put
   basic accessibility behind the paywall.

### Code Conventions

- TypeScript strict mode
- ESM-only (no CommonJS)
- Lit decorators for Web Components (`@customElement`, `@property`, `@state`)
- Vitest for unit/integration tests
- Playwright for browser/e2e tests
- Prettier for formatting, ESLint for linting
- CSS custom properties for theming (three-layer token system)

## Monorepo Structure

```
packages/
  shared/        — Shared infrastructure (adapters, types, design system, artifacts, coordination)
  core/          — Headless grid engine (data model, state, events)
  grid/          — Web Components grid (Lit rendering, virtualization, a11y)
  react/         — React wrapper
  vue/           — Vue wrapper
  angular/       — Angular wrapper
  duckdb/        — DuckDB-WASM data source adapter
  ai/            — AI toolkit (schema-as-contract, NL query)
  collab/        — Real-time collaboration (Yjs CRDTs, sync adapters)
  engine/        — BI engine (reports, dashboards, KPIs, filters, pivots)
  widgets/       — Dashboard widgets (bar-chart, KPI card, trend-line, etc.)
  criteria/      — Selection criteria & filter UI components
  workspace/     — Unified workspace: admin, authoring, BI authoring environment
  viewer/        — Read-only consumption shell for analysts
  editor/        — Authoring shell for authors
  definitions/   — Serializable grid blueprints, stores, converters, Zod validation
  local/         — Tier 2 local server (native DuckDB, filesystem persistence)
  python/        — Python package (pip install phz-grid) — Jupyter/Panel/Streamlit

archive/         — Archived shim packages (grid-admin, engine-admin, grid-creator)
                   These were one-line re-exports from workspace; kept for reference only.
```

### Workspace Architecture (`@phozart/workspace`)

The workspace package is the BI authoring environment with these subsystems:

| Subsystem        | Sub-path export  | Key modules                                                                                     |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **DataAdapter**  | (main)           | `data-adapter.ts` — consumer-provided data backend SPI                                          |
| **Registry**     | `./registry`     | `widget-registry.ts` — ManifestRegistry with variants                                           |
| **Templates**    | `./templates`    | Schema analyzer, template matcher, auto-binding                                                 |
| **Layout**       | `./layout`       | Composable LayoutNode tree → CSS Grid rendering                                                 |
| **Filters**      | `./filters`      | 4-level filter hierarchy, cascading, URL sync                                                   |
| **Alerts**       | `./alerts`       | Alert evaluator, compound conditions, breach detection                                          |
| **Explore**      | `./explore`      | Visual query explorer, chart suggest, artifact conversion                                       |
| **Connectors**   | `./connectors`   | Remote data connectors, CORS handling, credentials                                              |
| **Shell**        | (main)           | Navigation, breadcrumbs, auto-save, keyboard shortcuts                                          |
| **I18n**         | (main)           | I18nProvider with RTL support, zero-config English                                              |
| **Styles**       | `./styles`       | Design tokens (v14 Console mode), responsive breakpoints, container queries, component patterns |
| **Navigation**   | `./navigation`   | NavigationLink drill-through, artifact visibility, DefaultPresentation, grid artifacts          |
| **Local**        | `./local`        | LocalDataStore (OPFS), FileUploadManager, session export/import, demo datasets                  |
| **Coordination** | `./coordination` | DashboardDataPipeline (preload/full), DetailSourceLoader, loading progress                      |
| **FilterRules**  | `./filters`      | FilterDefinition catalog, FilterRuleEngine, ArtifactFilterContract, SecurityBinding             |

## Phase Tracking

| Phase | Name                       | Status       | Gate |
| ----- | -------------------------- | ------------ | ---- |
| 0     | Innovation & Discovery     | **COMPLETE** | auto |
| 1     | Business Analysis          | **COMPLETE** | auto |
| 2     | Architecture & Data Design | **COMPLETE** | auto |
| 3     | UX/UI Design               | **COMPLETE** | auto |
| 4     | Requirements Engineering   | **COMPLETE** | auto |
| 5     | Contract Finalization      | **COMPLETE** | auto |
| 6     | Implementation             | **COMPLETE** | auto |
| 7     | Sprint Execution           | **COMPLETE** | auto |
| 8     | QA & Review                | **COMPLETE** | auto |
| 9     | Release                    | **CURRENT**  | auto |

### Optional Phases

- **Innovation**: ENABLED — design thinking, feasibility validation
- **Marketing**: ENABLED — market sizing, competitive positioning

## Dynamic State

```yaml
current_phase: 9
current_gate: gate_9
last_updated: 2026-03-14
blockers: []
decisions:
  - 'Phase 0: PERSEVERE — a11y gap validated, technology stack mature, market timing optimal'
  - 'Phase 1: 5 personas defined, 65 user stories across 13 epics, marketing strategy with GTM entry points'
  - 'Phase 2: 8 ADRs, full system architecture, data model (22 sections), API contracts (10 packages incl Python/pip)'
  - 'Phase 2: Added @phozart/python package for pip install via anywidget + Arrow IPC'
  - 'Phase 3: Design system (357 tokens), 20 component specs, accessibility spec (competitive moat), 16 interaction patterns'
  - 'Phase 4: 109 formal requirements (BRD), 127 traced requirements + 160 test cases (RTM), 100% coverage'
  - 'Phase 5: All contracts FINALIZED — TYPE-CONTRACTS (116+ types across 10 packages), validation PASSED (100% BRD coverage, 0 gaps), governance sealed with quality gates'
  - 'Phase 6: Implementation COMPLETE — 10 packages implemented, 140 tests passing (core:51, grid:21, duckdb:16, ai:19, collab:33), all TypeScript compiles clean'
  - 'Phase 7: Sprint Execution COMPLETE — all 5 sprints executed successfully'
  - 'Phase 8: QA COMPLETE — full build clean, 140/140 tests, TYPE-CONTRACTS compliance verified, cross-package consistency verified'
  - 'Post-QA: Expanded to 16 packages — added engine, widgets, criteria, grid-admin, engine-admin, definitions, grid-creator'
  - 'Post-QA: Filter-Report Integration (Option D — Pragmatic Hybrid) — resolve-criteria.ts, report-service.ts, FILTER-REPORT-INTEGRATION.md'
  - 'Post-QA: Project rename phozart-* → phz-* across all packages (Session 43) — 0 regressions'
  - 'Post-QA: Docs pruned for release — removed early-phase docs (discovery, innovation, requirements, design specs)'
  - 'Post-QA: Test suite expanded from 140 → 3508 tests across 224 files, all passing'
  - '2026-02-28: Reconciled ad-hoc work — rename, filter-report integration, 5 new packages, docs cleanup, test expansion'
  - '2026-03-05: Dependency audit — fixed 6 package.json files, removed enterprise tier distinction (all features MIT)'
  - '2026-03-07: Workspace consolidation — 7 admin packages into @phozart/workspace, BI authoring (Sprints H-R) COMPLETE'
  - '2026-03-08: v13/v14 Workspace Enhancement Phase 2 (Sprints S-X) — visual design system, enterprise data/filter architecture, navigation, local playground'
  - '2026-03-08: v15 Architecture refactoring — extracted @phozart/shared (adapters, types, design system, coordination), added @phozart/viewer (analyst shell), @phozart/editor (author shell), three-shell architecture, 4 Wave 7A spec amendments (alert-aware widgets, micro-widget cells, impact chain, faceted attention), 5 new engine subsystems (PersonalAlertEngine, SubscriptionEngine, UsageCollector, OpenAPIGenerator, AttentionSystem), 15 new workspace Wave 5 state machines, 22 packages total, 8638 tests / 480 files'
  - '2026-03-09: Archived 3 shim packages (grid-admin, engine-admin, grid-creator) to archive/ — all code lives in workspace, 19 active packages, 9605 tests / 526 files'
  - '2026-03-14: Package rename @phozart/phz-* → @phozart/* (drop phz- prefix). Custom element tags (phz-*) unchanged. 3,071 occurrences across 1,028 files. Build order fixed: core → shared (was shared → core). 11,464 tests passing, 0 regressions.'
  - '2026-03-14: Playwright E2E infrastructure — 21 browser tests (grid rendering, keyboard nav, axe-core WCAG 2.2 AA audit). Uses Vite dev server + Chromium.'
  - '2026-03-14: Grid→engine decoupling — DrillThroughConfig, GridRowDrillSource, GenerateDashboardConfig moved to @phozart/core. Engine is now optional peer dep of grid.'
  - '2026-03-14: React wrapper type safety — eliminated all 16 any types in PhzGridProps with proper types from core/grid.'
  - '2026-03-14: Product documentation — new README with Moog framing, Patch Book (composition guide), ACCESSIBILITY.md, shell READMEs (workspace/viewer/editor).'
artifacts:
  - project.config.yaml
  - docs/architecture/SYSTEM-ARCHITECTURE.md
  - docs/architecture/DATA-MODEL.md
  - docs/architecture/ADR/ADR-001 through ADR-008
  - docs/architecture/FILTER-REPORT-INTEGRATION.md
  - docs/contracts/API-CONTRACTS.md
  - docs/contracts/PYTHON-API-CONTRACTS.md
  - docs/contracts/TYPE-CONTRACTS.md
  - docs/contracts/CONTRACT-GOVERNANCE.md
  - .github/ (CI workflows)
  - packages/*/README.md (19 active package READMEs)
  - archive/ (3 archived shim packages: grid-admin, engine-admin, grid-creator)
```

## Key References

- **Integration guide**: `docs/INTEGRATION-GUIDE.md` — complete consumer reference with verified working examples
- **AI reference**: `docs/PHZ-GRID-AI-REFERENCE.md` — condensed reference for AI assistants building with phz-grid
- Project config: `project.config.yaml`
- System architecture: `docs/architecture/SYSTEM-ARCHITECTURE.md`
- Data model: `docs/architecture/DATA-MODEL.md`
- ADRs: `docs/architecture/ADR/ADR-001` through `ADR-008`
- Filter-report integration: `docs/architecture/FILTER-REPORT-INTEGRATION.md`
- API contracts (JS): `docs/contracts/API-CONTRACTS.md`
- API contracts (Python): `docs/contracts/PYTHON-API-CONTRACTS.md`
- Type contracts: `docs/contracts/TYPE-CONTRACTS.md`
- Contract governance: `docs/contracts/CONTRACT-GOVERNANCE.md`

## Quality Standards

Don't be lazy, follow instructions and be critical over your own analysis
and findings.

### Non-Negotiable Rules

1. **Verify before claiming fixed.** If you can't visually confirm a fix, say
   so. Don't mark something PASS without evidence.
2. **Build after every change.** Run `npm run build --workspace=packages/<pkg>`
   after modifying any package source. Check for TypeScript errors.
3. **Test the actual rendered output.** Lit Web Components render inside Shadow
   DOM. Checking source code is necessary but not sufficient — the browser is
   the source of truth.
4. **Never assume a prop name.** Cross-check the component's `@property()`
   declarations against what the template passes. Mismatched prop names (e.g.
   `.columnDefs` vs `.columns`) are silent failures in Lit.
5. **Check all overlay components have `.open` bound.** Any component using
   `@property({ type: Boolean, reflect: true }) open` with CSS
   `:host([open])` visibility MUST have `.open=${...}` in the parent template.
   This class of bug was found in filter popover, context menu, column chooser,
   and chart popover.

### Known Bug Patterns

These patterns have caused real bugs. Watch for them:

- **Missing `.open` binding on overlay components** — The component is
  conditionally rendered in the template but never made visible because the
  `.open` property isn't bound. The component exists in the DOM but CSS
  `:host([open])` never triggers.
- **Prop name mismatch between parent and child** — Parent passes
  `.columnDefs` but child expects `.columns`. Lit silently ignores unknown
  properties.
- **Event handler targeting wrong element** — `dblclick` handler on `<tr>`
  used `visibleCols[0]` instead of reading `data-field` from the clicked
  `<td>`. Always derive context from the event target.
- **React wrapper passing `undefined` props** — When React wrapper passes
  `undefined` for an optional prop, Lit interprets it as an explicit value
  and overrides the component's default. The React wrapper must strip
  `undefined` values before forwarding to the Web Component.
- **CSS overflow in table layout** — `height` on `<tr>` is a minimum, not a
  maximum. If cells have `white-space: normal` and `overflow: visible`,
  content wrapping inflates row height beyond the intended density. Use
  density-aware CSS custom properties (`--_cell-overflow`, `--_cell-white-space`)
  that switch between `hidden`/`nowrap` (compact/dense) and `visible`/`normal`
  (comfortable).
- **Defensive nullish access** — Every array/object property accessed in
  templates, event handlers, or computed methods must use `?.` or `?? []`
  fallbacks. Lit components can render before all properties are set.

### Workbench Implementation Protocol

1. Every task references a spec section — read it before coding
2. Log every issue found in `docs/plans/ISSUE-LOG.md` (format: WB-NNN)
3. Log every change in `docs/plans/CHANGE-LOG.md` (format: task ID + files + tests)
4. TDD: write failing test → implement → verify green → commit
5. After each task: run `npm test -w packages/<pkg>` — must pass
6. After each phase: run full `npm test` — 8816+ tests must still pass
7. Never create new types without checking `docs/architecture/v15_PHZ-GRID-ARCHITECTURE-SPEC.md` first
8. Never refactor existing patterns — wire what exists
9. Comprehensive wiring reference: `docs/plans/WIRING-REFERENCE.md`
10. Progress tracker: `docs/plans/WORKBENCH-PROGRESS.md`

### Development Workflow

```bash
# Build a single package
npm run build --workspace=packages/grid

# Build all packages
npm run build

# Run tests
npm test

# Type-check without emitting
npm run typecheck

# Start test app (run from test_app/ directory)
npx next dev -p 3001
```

### Test App Notes

- The `test_app/` directory contains a Next.js 15 app for integration testing
- The `test/` directory contains a Next.js 16 (Turbopack) app
- Both use `resolveAlias` in next.config.ts to point `@phozart/*` imports at
  the local `packages/*/dist/` directories
- After rebuilding a package, restart the dev server to pick up changes
- If the browser shows "Internal Server Error" after switching Next.js versions,
  clear browser site data for localhost (stale RSC `Next-Router-State-Tree`
  header causes parse failures across versions)

### Package Dependency Order

Build in this order to satisfy inter-package dependencies:

1. `core` (no internal deps — headless grid engine)
2. `shared` (depends on core — adapters, types, design system, coordination)
3. `definitions` (no internal deps)
4. `duckdb` (depends on core)
5. `engine` (depends on core, shared, definitions)
6. `grid` (depends on core)
7. `criteria` (depends on core)
8. `widgets` (depends on engine)
9. `workspace` (depends on core, engine, shared, criteria, definitions)
10. `viewer` (depends on shared)
11. `editor` (depends on shared)
12. `ai` (depends on core)
13. `collab` (depends on core)
14. `react`, `vue`, `angular` (depend on grid, criteria, workspace)
15. `local` (independent — native DuckDB, filesystem persistence)

### CSS Architecture

The grid uses a three-layer CSS custom property system:

1. **Public API tokens** (`--phz-*`) — Consumers override these
2. **Internal computed tokens** (`--_*`) — Derived from public tokens per
   density/theme, set on `:host` and density selectors
3. **Component styles** — Reference `--_*` tokens with fallbacks

Density modes (`compact`, `dense`, `comfortable`) are set via the `density`
attribute on `<phz-grid>` and cascade through `--_row-height`,
`--_cell-padding`, `--_cell-overflow`, `--_cell-white-space`, etc.

Themes (`light`, `dark`, `sand`, `midnight`, `high-contrast`) are set via
the `theme` attribute. A `prefers-color-scheme: dark` media query provides
automatic dark mode when no theme is explicitly set.

## Orchestration Commands

Use `/project-orchestrator` to advance through phases. Each phase produces
artifacts in the `docs/` directory and updates this file's Dynamic State section.

### Available Skills (by phase)

- **Phase 0**: `/innovation-strategist`, `/product-intake`
- **Phase 1**: `/business-analyst`, `/marketing-strategist`, `/project-tracker`
- **Phase 2**: `/solution-architect`, `/api-designer`, `/data-engineer`
- **Phase 3**: `/designer`, `/ux-researcher`
- **Phase 4**: `/reqeng`, `/business-analyst`
- **Phase 5**: `/solution-architect` (contract finalization)
- **Phase 6**: `/fullstack-developer`, `/platform-engineer`
- **Phase 7**: `/fullstack-developer` (sprint execution)
- **Phase 8**: `/qa-engineer`, `/security-engineer`, `/implementation-verifier`
- **Phase 9**: `/release-manager`, `/project-chronicler`
