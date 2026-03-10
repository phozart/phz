# phz-grid Implementation Plan

**Date**: 2026-03-05
**Sources**: VALIDATED-REVIEW + DEEP-STRUCTURAL-ANALYSIS
**Total validated items**: 57 (review) + 38 (deep analysis) = ~80 unique findings (with overlap)

---

## Unified Priority Matrix

Items are merged from both documents, deduplicated, and organized into 6 sprints.

### Sprint 0: Immediate Fixes (1-2 hours)
*Zero-risk, zero-dependency fixes. Do these NOW.*

| # | Item | Source | File | Fix |
|---|------|--------|------|-----|
| 0.1 | Fix pivot.test.ts syntax error | QA | engine/__tests__/pivot.test.ts:132 | Remove extra `});` |
| 0.2 | Fix sideEffects: false | ARCH-5 | grid/package.json:17 | Change to `"sideEffects": ["**/*.ts"]` |
| 0.3 | XSS in LinkCellRenderer | SEC-4 | grid/src/renderers/built-in.ts:58-76 | Add `isSafeUrl()` to both renderers |
| 0.4 | Math.min/max stack overflow | BUG-11 | phz-grid.ts (3 methods), sparkline, criteria | Replace spread with `reduce()` at 8 sites |
| 0.5 | Default sort props never forwarded | BUG-1, C3 | phz-grid.ts:1604-1612 | Add to GridConfig in `initializeGrid()` |
| 0.6 | filterRows() rowsById leak | BUG-9 | core/row-model.ts:180 | `rowsById: buildRowMap(filteredRows)` |
| 0.7 | Toast dot always green | UX-9 | phz-grid.ts:1112 | Conditional class based on toast type |
| 0.8 | Filter buttons invisible on touch | UX-4 | phz-grid.ts CSS:716-723 | `@media (hover: none) { opacity: 0.4 }` |
| 0.9 | Red focus rings in admin/criteria | UX-3 | grid-admin + criteria shared-styles.ts | Replace `#EF4444` with `var(--phz-color-primary)` |
| 0.10 | Grid body no tabindex | UX-8 | phz-grid.ts render | Add `tabindex="0"` to container |

---

### Sprint 1: Security Hardening (Gate 1 — Release Blocker)
*All security items. Nothing ships until these are done.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 1.1 | executeSQL() allowlist | SEC-1a | S | Restrict to SELECT/WITH/EXPLAIN/VACUUM |
| 1.2 | buildLoadOptions() delimiter injection | SEC-1b | S | Sanitize to single safe character |
| 1.3 | AI executor: block semicolons + expand FORBIDDEN | SEC-2 | S | Add `;`, COPY, ATTACH, INSTALL, LOAD, CALL, PRAGMA |
| 1.4 | Prompt injection: sanitize all prompt methods | SEC-3 | S | Apply `sanitizeForPrompt()` + MAX_NL_QUERY_LENGTH to suggestFilters/explainQuery/suggestQueries |
| 1.5 | DuckDBBridge params dropped + system mismatch | SEC-5, SEC-11 | M | Pass params through AND reconcile positional `?` vs named `:key` |
| 1.6 | API keys client-side + Google URL param | SEC-6, SEC-8 | M | Document server-proxy requirement. Fix Google key from URL to header |
| 1.7 | AI data leakage: redactFields default | SEC-7 | M | Add `dataPrivacyMode: 'strict'` default, warn if redactFields empty |
| 1.8 | WebRTC sessionId path traversal | SEC-9 | S | Add `VALID_SESSION_ID` regex to WebSocket URL construction |
| 1.9 | getData() bypasses column masking | C7 (deep) | S | Return masked copy when maskFields configured |
| 1.10 | No export audit event | C8 (deep) | S | Emit `export:start`/`export:complete` events |
| 1.11 | Collab syncs unmasked data to peers | H9 (deep) | M | Apply maskFields in `syncGridToYjs()` |
| 1.12 | State serialization leaks PII in filter values | H8 (deep) | S | Redact sensitive filter values in `exportState()` |

**TDD requirement**: Write failing tests for each SEC item BEFORE implementing fixes.

---

### Sprint 2: Critical Bug Fixes + Core Performance (Gate 1-2)
*Bugs + performance items that affect correctness.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 2.1 | Context menu listener leak | BUG-5 | S | Cancel rAF on early removal, or set cleanup inside rAF |
| 2.2 | updateRows/deleteRows: N pipeline invalidations | BUG-6 | S | Batch: mutate all, single invalidatePipeline() + event |
| 2.3 | Collab state changes all "sort" | BUG-7 | M | Diff previousState vs newState for actual changed field |
| 2.4 | applyComputedColumns mutates caller data | BUG-8 | S | `.map(r => ({...r}))` before mutation |
| 2.5 | Cell edit writes NaN silently | BUG-10 | S | Validate Number(), reject NaN, keep editor open |
| 2.6 | updateComplete.then() after disconnect | BUG-12 | S | Guard `if (!this.isConnected) return` |
| 2.7 | DuckDB attachToGrid() no-op | BUG-4, H4 | M | Wire data bridge (push query results to grid) |
| 2.8 | DuckDBBridge calls non-existent methods | C4, C5 (deep) | S | Fix `this.grid.updateState()` → actual GridApi; fix `grouping:change` event name |
| 2.9 | fromArrowTable: native Arrow import | BUG-2 | S | Use `connection.insertArrowTable()` instead of batch SQL |
| 2.10 | Pre-build column lookup Map | PERF-1 | S | `Map<string, ColumnDefinition>` before filter/sort loops |
| 2.11 | Cache getGroupedRowModel() | PERF-2 | S | Add groupedModelCache + flattenedModelCache |
| 2.12 | Memoize filteredRows getter | PERF-3 | S | Replace getter with `@state()` updated on change |
| 2.13 | Batch StateManager notifications | PERF-4 | S | `queueMicrotask()` with dirty flag |
| 2.14 | Implement debounce | PERF-5 | S | Wire debounceMs to search/filter/resize handlers |
| 2.15 | Anomaly lookup O(1) Map | PERF-6 | S | Composite key `Map<\`${rowId}:${field}\`, AnomalyResult>` |

**TDD requirement**: Write failing tests for each BUG item BEFORE implementing fixes.

---

### Sprint 3: Accessibility + UX (Gate 2 — Beta Quality)
*Project principle #1: "Accessibility first." These are the gaps.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 3.1 | Filter popover keyboard accessibility | C1 (deep) | M | Add focus management, `role="dialog"`, `aria-modal`, focus trap, keyboard handlers for checkboxes |
| 3.2 | Roving tabindex broken | C2 (deep) | S | Reset previous cell to `tabindex="-1"` in `applyFocus()` |
| 3.3 | Screen reader: filter/pagination/group announcements | UX-11 | S | Add `announceChange()` calls (~6 lines) |
| 3.4 | Toast `role="alert"` for error type | UX-13 (new) | S | Add conditional ARIA role |
| 3.5 | No Shift-click range selection | UX-5 | S | Add shiftKey handling + lastClickedRowId anchor |
| 3.6 | Context-blind empty state | UX-6 | S | Distinguish no-data / filtered-empty / error states |
| 3.7 | No error UI for remote data | UX-10 | S | Add `@state() remoteError`, render error+retry |
| 3.8 | AccessibilityConfig.ariaLabels never consumed | M4 (deep) | S | Wire ariaLabels to AriaManager |
| 3.9 | Virtual scroll: no SR announcement on mode switch | Deep a11y | S | Announce "virtual scrolling enabled" |
| 3.10 | `aria-keyshortcuts` on interactive elements | UX-14 (new) | S | Add attributes for F2, Ctrl+C, Shift+F10 |

---

### Sprint 4: Testing Infrastructure (Gate 2-3)
*Foundation for safe iteration. Unblocks all future work.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 4.1 | Bug regression tests (TDD Red) | TEST-2 | M | ~55 failing tests for BUG-1 through BUG-12 + SEC items |
| 4.2 | Security regression tests | QA P4 | M | ~30 tests: SQL injection, prompt injection, XSS |
| 4.3 | row-model.ts pipeline tests | TEST-4 | M | ~35 tests: filter/sort/group/flatten/virtualize stages |
| 4.4 | EventEmitter + StateManager tests | TEST-5 | S | ~25 tests: on/off/once lifecycle, export/import round-trip |
| 4.5 | CI coverage enforcement | TEST-3 | S | Add `--coverage` to CI, 60% line threshold |
| 4.6 | DOM rendering setup (happy-dom) | TEST-1 | M | Per-package env override, first 10 rendering tests |
| 4.7 | Bundle size tracking in CI | M9 (deep) | S | Add `size-limit` to CI pipeline |

---

### Sprint 5: Platform Quality (Gate 3 — GA)
*Polish for general availability.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 5.1 | Dark mode | UX-1 | M | `:host([theme="dark"])` token overrides + `prefers-color-scheme` auto |
| 5.2 | Token consumption across packages | UX-2 | M | Replace hardcoded hex with `var(--phz-*)` in 4 shared-styles files |
| 5.3 | Grid → engine phantom dependency | ARCH-2 | M | Make engine optional peer dep, dynamic `import()` |
| 5.4 | Remote data cache eviction | ARCH-7 | S | maxCachedPages (default:100) + LRU |
| 5.5 | Performance quick wins | PERF-7,8,9,11 | S each | Skip empty filter Set, table-layout:fixed, contain:content, memoize filter values |
| 5.6 | filter() vs addFilter() naming confusion | M2 (deep) | S | Rename or document clearly, add deprecation warning |
| 5.7 | Admin panel: remove deprecated tabs | M3 (deep) | S | Remove 3 deprecated tabs from grid-admin |
| 5.8 | Performance monitoring hooks | H11 (deep) | M | Add `performance.mark()`/`measure()` at pipeline stages |
| 5.9 | Versioning strategy | H12 (deep) | M | Set up changesets, lockstep versioning, peerDependencies |
| 5.10 | SharedArrayBuffer fallback for DuckDB | H10 (deep) | M | Detect COOP/COEP headers, graceful degradation |
| 5.11 | Admin panel live preview | UX-12 | M | Side-by-side preview pane |
| 5.12 | Granular syncFromState() | PERF-10 | M | Selector-based subscriptions (requires ARCH-4 pattern) |

---

### Sprint 6: Architecture & Competitive Moat (Gate 4 — Post-GA)
*Long-term health and market differentiation.*

| # | Item | Source | Effort | Details |
|---|------|--------|--------|---------|
| 6.1 | Decompose phz-grid.ts God Object | ARCH-1, M1 | L | Extract to Lit Reactive Controllers: Sort, Filter, Selection, Edit, Export, Chart, Anomaly |
| 6.2 | Granular state subscriptions | ARCH-4 | M | `subscribe(selector, callback)` pattern |
| 6.3 | Lazy-import sub-components | ARCH-6 | M | Dynamic `import()` for context-menu, filter-popover, column-chooser, chart-popover, toolbar |
| 6.4 | Wire DuckDB SQL push-down | ARCH-3, A4 | L | DuckDB implements AsyncDataSource; grid uses RemoteDataManager |
| 6.5 | Unify configuration into DataView/GridPresentation | A1 (deep) | L | Single config contract for core, rendering, admin, engine |
| 6.6 | Split createGrid() into prepare + activate | A2 (deep) | M | Worker-safe prep phase + instant main-thread activation |
| 6.7 | Async pipeline with execution engine | A3 (deep) | L | Declarative query → decides: main thread, Worker, or DuckDB |
| 6.8 | Tiered attention for state changes | A5 (deep) | M | Immediate (scroll) / Deferred (filter) / Background (theme) |
| 6.9 | Four filter systems → unified filter algebra | H5 (deep) | L | Single filter interface, CriteriaEngine as config layer |
| 6.10 | Undo/Redo implementation | H7 (deep) | M | Shadow copy + changeset tracking, wire HistoryState |
| 6.11 | Column pinning rendering | H6 (deep) | M | Implement frozen column rendering (left/right pinning) |
| 6.12 | Market differentiators (DIFF-1–9) | Review Phase 6 | L | DuckDB moat, AI-native config, collaborative editing, etc. |

---

## Dependency Graph

```
Sprint 0 (immediate fixes)
    │
    ├── Sprint 1 (security) ──────┐
    │                              ├── Sprint 2 (bugs + perf)
    ├── Sprint 4.1 (TDD Red) ────┘        │
    │                                       │
    │                                  Sprint 3 (a11y + UX)
    │                                       │
    │                                  Sprint 4.2-4.6 (testing infra)
    │                                       │
    │                                  Sprint 5 (GA quality)
    │                                       │
    │                                  Sprint 6 (architecture)
    │
    └── Sprint 4.1 MUST precede Sprint 2 (TDD: tests before fixes)

Key dependencies within sprints:
  SEC-1/SEC-5 → BUG-4 → ARCH-3 → DIFF-1 (DuckDB chain)
  PERF-4 → PERF-10 → ARCH-4 (state batching chain)
  ARCH-1 → ARCH-6, TEST-1 (god object blocks lazy imports + DOM tests)
  TEST-1 (happy-dom) → Sprint 3 a11y tests
```

---

## Parallel Execution Strategy

Sprints 0-2 are sequential (security → bugs). Sprints 3-5 can partially overlap.

| Stream | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Sprint 6 |
|--------|----------|----------|----------|----------|----------|----------|----------|
| Security | 0.3 | ALL | — | — | 4.2 | — | — |
| Implementation | 0.1,0.2,0.4-0.6 | — | ALL bugs+perf | — | — | 5.3-5.12 | ALL |
| QA | — | TDD Red (4.1) | TDD Green (verify fixes) | — | 4.3-4.7 | — | — |
| UX/A11y | 0.7-0.10 | — | — | ALL | — | 5.1-5.2 | — |

---

## Effort Summary

| Sprint | Items | S-effort | M-effort | L-effort | Estimated Sessions |
|--------|-------|----------|----------|----------|-------------------|
| 0 | 10 | 10 | — | — | 1 |
| 1 | 12 | 7 | 5 | — | 2-3 |
| 2 | 15 | 12 | 3 | — | 2-3 |
| 3 | 10 | 8 | 2 | — | 1-2 |
| 4 | 7 | 2 | 5 | — | 3-4 |
| 5 | 12 | 5 | 7 | — | 3-4 |
| 6 | 12 | — | 5 | 7 | 8-12 |
| **Total** | **78** | **44** | **27** | **7** | **20-29 sessions** |

---

## Success Metrics

| Gate | Criteria |
|------|----------|
| Gate 1 (Release) | 0 critical/high security findings, 0 critical bugs, security regression tests passing |
| Gate 2 (Beta) | WCAG 2.1 AA keyboard accessibility, all documented bugs fixed, 60%+ test coverage |
| Gate 3 (GA) | Dark mode, token system unified, CI coverage enforced, bundle size tracked, performance monitored |
| Gate 4 (Post-GA) | phz-grid.ts < 1000 lines, DuckDB SQL push-down working, 80%+ test coverage |
