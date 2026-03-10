# Task Breakdown

> All implementation tasks derived from PHZ-GRID-ARCHITECTURE-SPEC.md v1.1.0.
> Tasks are organized by workstream with explicit dependencies.

---

## Task ID Convention

`[Workstream]-[Phase].[Sequence]` — e.g., `A-1.03` is Workstream A, Phase 1,
Task 3.

---

## Workstream A: Foundation

### Phase A-1: Package Extraction (Gate: A-1)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| A-1.01 | Create phz-shared package | package.json, tsconfig, build config, empty src/ | — | dev-foundation | 2h |
| A-1.02 | Extract adapter interfaces | Move DataAdapter, PersistenceAdapter, AlertChannelAdapter from workspace to shared. Add new interfaces: MeasureRegistryAdapter, HelpConfig, AttentionAdapter, UsageAnalyticsAdapter, SubscriptionAdapter | A-1.01 | dev-foundation | 4h |
| A-1.03 | Extract design system | Move DESIGN_TOKENS, generateTokenCSS, SHELL_LAYOUT, SECTION_HEADERS, responsive helpers, container queries, explorer visual helpers, component patterns, mobile interactions from workspace/styles to shared/design-system | A-1.01 | dev-foundation | 4h |
| A-1.04 | Extract artifact types | Move ArtifactVisibility, VisibilityMeta, DefaultPresentation, PersonalView, GridArtifact and all pure functions from workspace/navigation to shared/types | A-1.01 | dev-foundation | 3h |
| A-1.05 | Extract runtime coordination | Move DashboardDataPipeline, FilterContextManager, QueryCoordinator, InteractionBus, navigation event builders, loading state from workspace/coordination to shared/coordination | A-1.01 | dev-foundation | 4h |
| A-1.06 | Create ShareTarget union type | Replace sharedWith: string[] with ShareTarget union. Update isVisibleToViewer to check both role and user-list sharing | A-1.04 | dev-foundation | 2h |
| A-1.07 | Create FieldEnrichment type + merge | New types: FieldEnrichment, EnrichedFieldMetadata, mergeFieldMetadata() pure function in shared | A-1.02 | dev-foundation | 2h |
| A-1.08 | Create FilterPresetValue type | New type with selectedValues, includeNulls, includeOrphans, selectAll, inverted fields. Update FilterPreset to use Record<string, FilterPresetValue> | A-1.04 | dev-foundation | 2h |
| A-1.09 | Create FilterValueMatchRule type | New types: FilterValueMatchRule, match expression functions. Add to FilterDefinition | A-1.08 | dev-foundation | 3h |
| A-1.10 | Create FilterValueHandling type | New type with allow*/default* fields. Add to FilterDefinition | A-1.08 | dev-foundation | 2h |
| A-1.11 | Add PersistenceAdapter methods | Add saveLastAppliedFilters, loadLastAppliedFilters, savePersonalAlert, listPersonalAlerts, deletePersonalAlert | A-1.02 | dev-foundation | 2h |
| A-1.12 | Create PersonalAlert type | Full PersonalAlert interface with threshold and trend trigger modes, grace period config | A-1.02 | dev-foundation | 2h |
| A-1.13 | Create AlertGracePeriodConfig type | Org-wide default, min/max bounds, resetOnResolve | A-1.12 | dev-foundation | 1h |
| A-1.14 | Create AsyncReportRequest type | Full interface with status lifecycle, result URL, expiration | A-1.02 | dev-foundation | 1h |
| A-1.15 | Create ReportSubscription type | Full interface with schedule, delivery mode, filter values | A-1.02 | dev-foundation | 1h |
| A-1.16 | Create ErrorStateConfig type | Error scenario types, message pool config, auto-retry config | A-1.01 | dev-foundation | 1h |
| A-1.17 | Create EmptyStateConfig type | Empty scenario types, pool selection, custom content | A-1.01 | dev-foundation | 1h |
| A-1.18 | Create WidgetViewGroup type | View group with 2-3 views, data modes, switching config | A-1.04 | dev-foundation | 2h |
| A-1.19 | Create ExpandableWidgetConfig type | Expandable config with child widgets, trigger, height | A-1.04 | dev-foundation | 1h |
| A-1.20 | Create ContainerBoxConfig type | Container styling: bg, border, radius, shadow, padding | A-1.04 | dev-foundation | 1h |
| A-1.21 | Create DecisionTreeNode type | Node with conditions, thresholds, alert binding, drill link, children | A-1.04 | dev-foundation | 2h |
| A-1.22 | Create APISpecConfig + APIRoleAccess types | OpenAPI spec config, role access config | A-1.02 | dev-foundation | 1h |
| A-1.23 | Update workspace imports | Update all workspace files to import from @phozart/phz-shared instead of local paths. Verify build passes | A-1.02 through A-1.22 | dev-foundation | 4h |
| A-1.24 | Add deprecation warnings | Add ./internals subpath export for anything currently exported. Mark internal packages | A-1.23 | dev-foundation | 2h |
| A-1.25 | Unit tests for all new types | Test all pure functions, type guards, merge functions in phz-shared | A-1.02 through A-1.22 | test-unit | 8h |
| A-1.26 | QA: Verify spec compliance | Validate all types match PHZ-GRID-ARCHITECTURE-SPEC.md §1-3 | A-1.25 | qa-agent | 4h |

**Gate A-1 criteria:** phz-shared package builds, all types exported, workspace builds with shared imports, 100% test coverage on pure functions, QA approved.

### Phase A-2: Explorer Move + Data Architecture (Gate: A-2)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| A-2.01 | Move explorer to engine | Move createDataExplorer, drop zone state, field palette, autoPlaceField, aggregation defaults, cardinality warning, suggestChartType, toQuery, undo/redo from workspace to engine | Gate A-1 | dev-foundation | 6h |
| A-2.02 | Move save functions to engine | Move exploreToReport, exploreToDashboardWidget, promoteFilterToDashboard to engine | A-2.01 | dev-foundation | 2h |
| A-2.03 | Update workspace explorer imports | Workspace imports explorer from engine, not local | A-2.02 | dev-foundation | 2h |
| A-2.04 | Multi-source DashboardDataConfig | Replace single preload/fullLoad with sources[] array, DashboardSourceConfig with dependsOn and priority | Gate A-1 | dev-foundation | 4h |
| A-2.05 | Loading orchestrator | Build multi-source loading orchestrator: parallel preloads, concurrent full-loads with dependency ordering, configurable concurrency limit | A-2.04 | dev-foundation | 8h |
| A-2.06 | Automatic execution engine selection | Implement the decision chain: <10K JS, 10K-100K DuckDB with Arrow IPC, >100K server fallback. Extend buildQueryPlan | A-2.04 | dev-foundation | 6h |
| A-2.07 | Server-side grid mode | Implement fallback grid behavior: filter/sort/page via DataAdapter on every interaction when no Arrow IPC | A-2.06 | dev-foundation | 6h |
| A-2.08 | Grid export config | Add GridExportConfig to grid widget, wire ExportController to config, toolbar buttons | A-2.07 | dev-foundation | 4h |
| A-2.09 | DataAdapter async methods | Add optional executeQueryAsync, getAsyncRequestStatus, listAsyncRequests, cancelAsyncRequest to DataAdapter interface | Gate A-1 | dev-foundation | 2h |
| A-2.10 | Filter state auto-save | Debounced (2s) auto-save of filter values to PersistenceAdapter.saveLastAppliedFilters on every change. Load precedence: last-applied > preset > admin default > definition default | Gate A-1 | dev-foundation | 4h |
| A-2.11 | Remove viewer from WorkspaceRole | Change WorkspaceRole to 'admin' \| 'author'. Update getShellConfig, getNavItemsForRole. Remove viewer handling from workspace | Gate A-1 | dev-foundation | 3h |
| A-2.12 | Update build order | Add phz-shared to build chain before engine. Update monorepo build config | A-2.01 | dev-foundation | 2h |
| A-2.13 | Unit tests for explorer in engine | Migrate existing explorer tests to engine package. Verify all pass | A-2.02 | test-unit | 4h |
| A-2.14 | Unit tests for data architecture | Test multi-source loading, execution engine selection, server-side fallback, filter auto-save | A-2.05 through A-2.10 | test-unit | 8h |
| A-2.15 | QA: Verify data architecture | Validate loading orchestrator matches spec §12, engine selection matches decision chain, filter precedence matches §17 | A-2.14 | qa-agent | 4h |

**Gate A-2 criteria:** Explorer works from engine, multi-source pipeline works, execution engine auto-selects correctly, filter auto-save works, workspace builds without viewer role, all tests pass, QA approved.

---

## Workstream B: Shells

### Phase B-1: Viewer Shell (Gate: B-1)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| B-1.01 | Create phz-viewer package | package.json, tsconfig, build config, depends on phz-shared + engine + widgets + criteria | Gate A-1 | dev-shells | 2h |
| B-1.02 | Viewer shell component | <phz-viewer> Lit component with full shell mode: optional header, internal routing, showHeader prop | B-1.01 | dev-shells | 6h |
| B-1.03 | Viewer individual components | <phz-dashboard-view>, <phz-report-view>, <phz-catalog-view>, <phz-explorer-view> as standalone mountable components | B-1.01 | dev-shells | 8h |
| B-1.04 | Catalog screen | Card layout, 4 tabs (Published, My Work, Exports, Subscriptions), search, card actions (duplicate, subscribe, create alert) | B-1.03 | dev-shells | 6h |
| B-1.05 | Dashboard view screen | Full-width rendering, filter bar with value handling toggles (⚙ gear), preset save/load, widget interactions (expand, drill, view switch) | B-1.03, Gate A-2 | dev-shells | 8h |
| B-1.06 | Report view screen | Full-width grid, filter bar, export buttons (admin-configured), "Run in Background" (feature-detected), pagination/virtual scroll | B-1.03, Gate A-2 | dev-shells | 6h |
| B-1.07 | Explorer screen (front door) | Mounted Lit component wiring createDataExplorer from engine. Field palette, drop zones, result rendering, save actions. Opens in new tab/view | B-1.03, A-2.02 | dev-shells | 8h |
| B-1.08 | Attention items dropdown | Header notification badge, dropdown panel, action links for alerts/exports/subscriptions | B-1.02 | dev-shells | 4h |
| B-1.09 | Filter bar value handling UI | Gear icon per filter, toggle panel for nulls/orphans/select-all/invert, admin allow/hide control | B-1.05 | dev-shells | 6h |
| B-1.10 | Local mode shell | File upload, DuckDB-WASM integration, same explorer UI with local data source | B-1.07 | dev-shells | 4h |
| B-1.11 | Mobile responsive | Bottom tab bar (<768px), vertical filter layout, widget stacking, bottom sheet for detail panels | B-1.05 | dev-shells | 6h |
| B-1.12 | Error states (viewer) | All error scenarios with rotating message pools, auto-retry, technical details panel, copy to clipboard | B-1.05 | dev-shells | 6h |
| B-1.13 | Empty states (viewer) | All empty scenarios with rotating message pools, configurable tone, custom content support | B-1.04 | dev-shells | 4h |
| B-1.14 | React wrapper for viewer | PhzViewer, PhzDashboardView, PhzReportView, PhzCatalogView, PhzExplorerView React components | B-1.03 | dev-shells | 4h |
| B-1.15 | Unit tests for viewer | Test all viewer state, routing, filter bar logic, preset handling | B-1.02 through B-1.13 | test-unit | 8h |
| B-1.16 | E2E tests for viewer | Playwright tests: catalog navigation, dashboard viewing, filter interaction, explorer flow, export, error states | B-1.02 through B-1.13 | test-e2e | 8h |
| B-1.17 | QA: Viewer spec compliance | Validate viewer matches spec §6 screen-by-screen, all interactions, mobile behavior | B-1.16 | qa-agent | 6h |

**Gate B-1 criteria:** Viewer shell renders in both modes, all 5 screens functional, filter bar with value handling works, explorer mounts from engine, error/empty states with message pools, mobile responsive, React wrapper works, all tests pass, QA approved.

### Phase B-2: Editor Shell (Gate: B-2)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| B-2.01 | Create phz-editor package | package.json, tsconfig, build config, depends on phz-shared + engine + widgets | Gate A-1 | dev-shells | 2h |
| B-2.02 | Editor shell component | <phz-editor> Lit component with full shell mode: optional header, slim sidebar (MY WORK, EXPLORE), showHeader prop | B-2.01 | dev-shells | 6h |
| B-2.03 | Editor individual components | <phz-editor-dashboard>, <phz-editor-catalog>, <phz-explorer-view> (shared with viewer) | B-2.01 | dev-shells | 4h |
| B-2.04 | Editor catalog screen | Published tab with "Duplicate" as primary action, My Work tab with Edit/Share/Delete, Exports tab, Subscriptions tab | B-2.03 | dev-shells | 6h |
| B-2.05 | Published dashboard view (read-only) | Same as viewer dashboard view + "Duplicate to My Work" button | B-2.03, Gate B-1 | dev-shells | 3h |
| B-2.06 | Editor dashboard editing screen | Measure registry palette (left), canvas (center), constrained config panel (Data from registry + Style, no Filters tab) | B-2.03, Gate A-2 | dev-shells | 10h |
| B-2.07 | Measure registry palette | Connect MeasureRegistryAdapter, show measures and KPIs grouped, search, drag to canvas | B-2.06 | dev-shells | 6h |
| B-2.08 | Constrained config panel | Data tab shows registry measures (not raw fields), Style tab full control, no Filters tab, no drill-through config | B-2.06 | dev-shells | 4h |
| B-2.09 | Editor report view screen | View published reports read-only, edit personal copies (inline column management), "Duplicate to My Work" | B-2.03 | dev-shells | 4h |
| B-2.10 | Editor explorer screen | Same as viewer explorer + "Add to Dashboard" action with dashboard picker | B-2.03, Gate B-1 | dev-shells | 3h |
| B-2.11 | Sharing flow | User picker (search by name/email), ShareTarget with type: 'users', visibility transition, revoke sharing | B-2.04 | dev-shells | 4h |
| B-2.12 | Personal alerts + subscriptions | Same as viewer: create from KPI widgets, manage in My Work, subscribe button on artifacts | B-2.04 | dev-shells | 3h |
| B-2.13 | Editor mobile behavior | Bottom tab bar, view-only canvas on phone, config panel as bottom sheet, full editing on tablet+ | B-2.06 | dev-shells | 4h |
| B-2.14 | Error/empty states (editor) | Reuse viewer error/empty state system with editor-specific scenarios | B-2.04 | dev-shells | 3h |
| B-2.15 | React wrapper for editor | PhzEditor, PhzEditorDashboard, PhzEditorCatalog React components | B-2.03 | dev-shells | 3h |
| B-2.16 | Unit tests for editor | Test all editor state, measure registry, constrained editing, sharing | B-2.02 through B-2.14 | test-unit | 6h |
| B-2.17 | E2E tests for editor | Playwright: duplicate flow, edit dashboard, add widget from registry, share with user, morph widget | B-2.02 through B-2.14 | test-e2e | 6h |
| B-2.18 | QA: Editor spec compliance | Validate editor matches spec §7 screen-by-screen, all constraints, mobile behavior | B-2.17 | qa-agent | 6h |

**Gate B-2 criteria:** Editor shell renders in both modes, all screens functional, measure registry palette works, constrained editing enforced, sharing flow works, all tests pass, QA approved.

### Phase B-3: Workspace Updates (Gate: B-3)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| B-3.01 | Catalog UX update | Dense table view (default), switchable to card, search, sort, "Create New" dropdown, context scoping | Gate A-2 | dev-shells | 6h |
| B-3.02 | Creation wizard simplification | 3 steps for dashboards (type, source, template), 2 for reports (type, source), straight to editor | B-3.01 | dev-shells | 4h |
| B-3.03 | Report editor 30+ columns | Search in column list, bulk visibility, column grouping by type, conditional formatting as subsection | Gate A-2 | dev-shells | 6h |
| B-3.04 | Dashboard editor updates | Freeform snap-to-grid, configurable column count per dashboard, preview-as-viewer mode with role+user picker | Gate A-2 | dev-shells | 8h |
| B-3.05 | Dashboard data config panel | Admin UI for multi-source config: per-source preload/fullLoad, dependencies, priority, force-server-side, computed status readout | A-2.05 | dev-shells | 6h |
| B-3.06 | Filter admin UX | Central registry (GOVERN > Filters) + dashboard editor binding, structured expression builder + raw escape hatch, test with preview-as-viewer | Gate A-2 | dev-shells | 8h |
| B-3.07 | Filter value handling admin UI | Value Handling section in FilterDefinition editor: allow/default toggles for nulls/orphans/selectAll/invert, value match rule builder for dependent filters | A-1.09, A-1.10 | dev-shells | 6h |
| B-3.08 | Alert admin UX | GOVERN > Alerts: threshold + expression modes, grace period config, subscription management, AlertChannelAdapter event firing | Gate A-2 | dev-shells | 6h |
| B-3.09 | Data source enrichment UI | DATA > Data Sources: field metadata editor (label, description, semantic hint, group, format), data preview panel | A-1.07 | dev-shells | 6h |
| B-3.10 | GOVERN > Settings | Global settings: async report activation, usage analytics opt-in per category, alert grace period bounds, empty state tone, error state config | Gate A-2 | dev-shells | 4h |
| B-3.11 | Command palette (Ctrl+K) | Search overlay: artifacts, nav items, actions. Keyboard-first | B-3.01 | dev-shells | 4h |
| B-3.12 | Keyboard shortcuts | Full shortcut set: global, catalog, dashboard editor, report editor per spec §5.4 | B-3.01 | dev-shells | 4h |
| B-3.13 | Publish workflow UX | Publish from editor toolbar + catalog, review as catalog filter, publish history timeline | Gate A-2 | dev-shells | 4h |
| B-3.14 | Navigation config in dashboard editor | Per-widget drill-through link builder: target picker, auto-suggest filter mappings, open behavior per link | B-3.04 | dev-shells | 6h |
| B-3.15 | GOVERN > API Access | Role-based API access config, generate OpenAPI spec, download JSON, inline doc viewer | Gate A-2 | dev-shells | 6h |
| B-3.16 | Unit tests for workspace updates | Test all new admin UX state machines, expression builder, data config | B-3.01 through B-3.15 | test-unit | 8h |
| B-3.17 | E2E tests for workspace updates | Playwright: creation wizard, report editing, dashboard editing, filter admin, alert admin, publish flow | B-3.01 through B-3.15 | test-e2e | 8h |
| B-3.18 | QA: Workspace spec compliance | Validate workspace matches spec §5 section-by-section | B-3.17 | qa-agent | 6h |

**Gate B-3 criteria:** All workspace admin UX sections implemented, expression builder works, data config panel shows computed status, keyboard shortcuts work, all tests pass, QA approved.

---

## Workstream C: Features

### Phase C-1: New Widget Types (Gate: C-1)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| C-1.01 | Decision tree widget | New widget type: node rendering, status indicators (healthy/warning/critical), collapsible branches, drill-through on nodes, expression evaluation for conditions | Gate A-1 | dev-features | 10h |
| C-1.02 | Decision tree authoring | Widget config panel Data tab: structured list node editor, condition expression builder, threshold inputs, alert rule binding, drill link config, live preview | C-1.01, Gate B-3 | dev-features | 8h |
| C-1.03 | Container box widget | New widget type: visual grouping, styled boundary (bg, border, radius, shadow, padding), title, child widget containment, sub-grid layout | Gate A-1 | dev-features | 6h |
| C-1.04 | Expandable widget support | Detail panel expansion for KPI, gauge, scorecard, trend-line, decision-tree: admin-configured child widgets, inline growth animation, no recursive nesting | Gate A-1 | dev-features | 8h |
| C-1.05 | Widget view groups | 2-3 views per position, toggle buttons (2 views) / arrows+dots (3 views), shared vs independent data modes, lazy loading of non-active views | Gate A-1 | dev-features | 8h |
| C-1.06 | Rich text widget | WYSIWYG editor for text-block widget: bold, italic, links, bullet lists, images. Output as formatted HTML | Gate A-1 | dev-features | 6h |
| C-1.07 | Update morph groups | Add decision-tree (decision group), container-box (container group) to morph registry. 15 widget types, 7 groups | C-1.01, C-1.03 | dev-features | 2h |
| C-1.08 | Container query updates | Decision tree and container box responsive behavior at narrow widths | C-1.01, C-1.03 | dev-features | 3h |
| C-1.09 | Unit tests for new widgets | Test decision tree evaluation, container box layout, expansion state, view group switching, morph groups | C-1.01 through C-1.07 | test-unit | 8h |
| C-1.10 | E2E tests for new widgets | Playwright: place decision tree, expand KPI, switch views, drag into container, morph widgets | C-1.01 through C-1.07 | test-e2e | 6h |
| C-1.11 | QA: Widget spec compliance | Validate widgets match spec §4, §9, §10, §13 | C-1.10 | qa-agent | 4h |

**Gate C-1 criteria:** All 15 widget types render, morph groups correct, expansion works, view switching works, container box groups widgets, decision tree evaluates conditions, all tests pass, QA approved.

### Phase C-2: Async, Subscriptions, Analytics (Gate: C-2)

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| C-2.01 | Async report UI | "Run in Background" button (feature-detected + admin-activated), progress tracking via attention system | A-2.09, Gate B-1 | dev-features | 6h |
| C-2.02 | Exports tab | My Work > Exports: list async requests, status badges, download/re-run/retry/cancel actions | C-2.01 | dev-features | 4h |
| C-2.03 | Personal alerts system | Create from KPI widgets or My Work, threshold + trend triggers, grace period with admin bounds, store via PersistenceAdapter | A-1.12, A-1.13, Gate B-1 | dev-features | 8h |
| C-2.04 | Personal alert evaluation contract | Define how consumer app evaluates personal alerts: read from PersistenceAdapter, evaluate conditions, fire through AttentionAdapter | C-2.03 | dev-features | 4h |
| C-2.05 | Subscription system | Subscribe button on artifact toolbar, schedule config panel (frequency, day, time, timezone), delivery mode selection | A-1.15, Gate B-1 | dev-features | 8h |
| C-2.06 | Subscriptions tab | My Work > Subscriptions: list with schedule, next delivery, status, edit/pause/resume/delete | C-2.05 | dev-features | 4h |
| C-2.07 | Subscription deep link helper | buildSubscriptionDeepLink() pure function, filter preset application on link click | C-2.05 | dev-features | 2h |
| C-2.08 | Usage analytics collection | Implement event tracking: all event types from spec §16.4, fire-and-forget through UsageAnalyticsAdapter, debounced flush, opt-in per category | Gate A-1, Gate B-1 | dev-features | 8h |
| C-2.09 | OpenAPI spec generator | generateOpenAPISpec() pure function: take dataset config, produce OpenAPI 3.1 document with endpoints, schemas, role access annotations | A-1.22, Gate A-2 | dev-features | 8h |
| C-2.10 | Expression builder component | Shared structured expression builder: dropdowns + inputs composing expressions, raw text escape hatch. Used by filter rules, alert rules, decision tree conditions | Gate A-1 | dev-features | 8h |
| C-2.11 | Preview-as-viewer context picker | Shared component: role list dropdown + user ID input. Used in dashboard preview and filter rule testing | Gate A-1 | dev-features | 4h |
| C-2.12 | Attention system | Workspace-generated items (pending reviews, stale dashboards, broken queries) + consumer items via AttentionAdapter. Priority sorting, acknowledge/snooze | Gate A-1, Gate B-1 | dev-features | 6h |
| C-2.13 | Error message pools | Create all message pools: 20-40 messages per scenario, 3 tone variants (default/minimal/playful), per error and empty state type | Gate B-1 | dev-features | 6h |
| C-2.14 | Unit tests for features | Test async flow, personal alerts, subscriptions, analytics events, OpenAPI generator, expression builder | C-2.01 through C-2.13 | test-unit | 10h |
| C-2.15 | E2E tests for features | Playwright: run in background, create personal alert, subscribe to dashboard, expression builder interaction | C-2.01 through C-2.13 | test-e2e | 8h |
| C-2.16 | QA: Features spec compliance | Validate features match spec §14-16, §19-21 | C-2.15 | qa-agent | 6h |

**Gate C-2 criteria:** Async reports work end-to-end, personal alerts create and display, subscriptions configure and persist, analytics events fire correctly, OpenAPI generates valid spec, expression builder works in all contexts, message pools rotate, all tests pass, QA approved.

---

## Documentation Phase

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| D-1.01 | Update DEVELOPER-GUIDE.md | New package architecture, phz-shared reference, updated build order, new adapter interfaces, explorer in engine, multi-source data config | Gate A-2 | docs-agent | 8h |
| D-1.02 | Update ADMIN-GUIDE.md | All admin UX sections: catalog, creation wizard, dashboard editor, filter admin with value handling + match rules, alert admin with grace period, data source enrichment, GOVERN > Settings, API Access | Gate B-3 | docs-agent | 10h |
| D-1.03 | Update USER-GUIDE.md | Filter bar value handling toggles, personal alerts, subscriptions, async exports, attention items, error states, explorer front door | Gate B-1, Gate C-2 | docs-agent | 8h |
| D-1.04 | Update AUTHOR-GUIDE.md | Dashboard editor updates (freeform grid, expandable widgets, view groups, container boxes, decision tree authoring), report editor updates | Gate B-3, Gate C-1 | docs-agent | 6h |
| D-1.05 | Update ANALYST-GUIDE.md | Explorer accessed from viewer, save actions, mounted component documentation | Gate B-1 | docs-agent | 4h |
| D-1.06 | Create EDITOR-GUIDE.md | New guide: editor shell overview, catalog (duplicate to customize), constrained dashboard editing, measure registry, sharing flow, personal alerts, subscriptions | Gate B-2 | docs-agent | 8h |
| D-1.07 | Create API-REFERENCE-V15.md | New API reference version covering all new types, interfaces, pure functions, components | All gates | docs-agent | 12h |
| D-1.08 | QA: Documentation review | Validate all docs match implementation, no stale references, all new features documented | D-1.01 through D-1.07 | qa-agent | 8h |
| D-1.09 | PO: Documentation acceptance | Product owner reviews user-facing docs (USER-GUIDE, EDITOR-GUIDE, ADMIN-GUIDE) for clarity and completeness | D-1.08 | po-agent | 4h |

---

## Product Owner Reviews

| ID | Task | Description | Depends On | Agent | Est |
|---|---|---|---|---|---|
| PO-1 | Gate B-1 acceptance | Review viewer shell: all 5 screens, filter bar UX, error/empty states, mobile responsive | Gate B-1 | po-agent | 4h |
| PO-2 | Gate B-2 acceptance | Review editor shell: duplicate flow, constrained editing, sharing, measure registry UX | Gate B-2 | po-agent | 4h |
| PO-3 | Gate B-3 acceptance | Review workspace updates: admin UX, creation wizard, dashboard editor, filter admin | Gate B-3 | po-agent | 4h |
| PO-4 | Gate C-1 acceptance | Review new widgets: decision tree, container box, expandable widgets, view switching | Gate C-1 | po-agent | 3h |
| PO-5 | Gate C-2 acceptance | Review features: async reports, personal alerts, subscriptions, expression builder | Gate C-2 | po-agent | 3h |
| PO-6 | Final acceptance | Full end-to-end review, all shells, all features, all docs | All gates + D-1.09 | po-agent | 8h |

---

## Total Estimates

| Category | Hours |
|---|---|
| Foundation development (Workstream A) | ~86h |
| Shell development (Workstream B) | ~189h |
| Feature development (Workstream C) | ~131h |
| Unit testing | ~70h |
| E2E testing | ~44h |
| QA validation | ~44h |
| Documentation | ~56h |
| Product owner reviews | ~26h |
| **Total** | **~646h** |
