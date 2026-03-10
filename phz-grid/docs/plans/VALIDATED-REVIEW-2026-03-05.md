# phz-grid Validated Review — Multi-Agent Consensus Report

**Date**: 2026-03-05
**Team**: Product Owner, Security Engineer, Implementation Engineer, QA Engineer, End-User Testing
**Input**: COMPREHENSIVE-REVIEW-2026-03-05.md (83 items)

---

## Review Corrections

The original review had **4 false positives** and **3 severity adjustments**:

| Item | Original Claim | Actual Finding | Agent |
|------|---------------|----------------|-------|
| BUG-3 | Arrow/IPC falls back to CSV | Returns `'arrow_ipc'` — already fixed | impl, security, QA |
| UX-7 | No aria-sort on column headers | aria-sort IS correctly implemented (line 2885) | ux |
| Lit repeat() | repeat() used without key function | Grid uses `.map()`, not `repeat()` directive | ux |
| SEC-1 getQueryPlan() | Raw SQL concatenation | Method does not exist in current code | security |
| BUG-2 | Row-by-row INSERT (10K round-trips) | Batched to 1000 rows per statement (still not native Arrow) | impl |
| SEC-2 | CRITICAL | HIGH — partial regex protection exists | product-owner, security |
| UX-11 | announceChange() never called | Called for sort; NOT called for filter/pagination/grouping | ux |

### New Issues Discovered (not in original review)

| ID | Finding | Severity | Agent |
|----|---------|----------|-------|
| SEC-8 | Google API key in URL query param (logged in cleartext everywhere) | Critical | security |
| SEC-9 | WebRTC sessionId allows path traversal in WebSocket URL | Medium | security |
| SEC-10 | sanitizeStringLiteral incomplete for DuckDB dollar-quoting | Low | security |
| SEC-11 | SEC-5 worse: positional `?` params vs named `:key` params are incompatible systems | High | security |
| BUG-11+ | Math.min/max spread in 3 phz-grid.ts locations (not 2) + sparkline + criteria | Wider scope | impl, product-owner |
| UX-13 | Toast has no `role="alert"` for error type | Medium | ux |
| UX-14 | No `aria-keyshortcuts` on interactive elements | Medium | ux |
| UX-15 | `onError` callback undocumented and opt-in for remote data | Medium | ux |

---

## Corrected Item Count

| Category | Original | After Validation | Change |
|----------|----------|-----------------|--------|
| Security | 7 | 11 (+4 new) | +4 |
| Bugs | 12 | 10 (-BUG-3 false positive, BUG-2 downgraded) | -2 |
| Performance | 11 | 11 | 0 |
| UX/DX | 12 | 13 (-UX-7 false positive, +3 new) | +1 |
| Architecture | 7 | 7 | 0 |
| Testing | 5 | 5 | 0 |
| **Total** | **54 line items** | **57 validated items** | +3 |

---

## Validated Gate Classification

### GATE 1: Release Blockers (must fix before ANY public release)

#### Security (7 items)
| ID | Issue | Effort | Fix |
|----|-------|--------|-----|
| SEC-4 | XSS via LinkCellRenderer/ImageCellRenderer (`javascript:` URLs) | S | Add `isSafeUrl()` to both renderers in `built-in.ts` |
| SEC-1a | `executeSQL()` accepts DROP/CREATE/INSTALL — zero validation | S | Add statement allowlist (SELECT/WITH/EXPLAIN only) |
| SEC-1b | `buildLoadOptions()` delimiter injection | S | Sanitize delimiter to single safe char |
| SEC-2 | AI executor: semicolons + COPY/ATTACH/INSTALL not blocked | S | Block `;` entirely, expand FORBIDDEN patterns |
| SEC-3 | `suggestFilters()`/`explainQuery()` no sanitization/length limit | S | Apply `sanitizeForPrompt()` + MAX_NL_QUERY_LENGTH |
| SEC-5+ | Bridge drops params AND param systems incompatible | M | Pass params through, reconcile `?` vs `:key` |
| SEC-6 | API keys client-side (Google key in URL is worst) | M | Document server-proxy requirement, fix Google URL |

#### Critical Bugs (5 items)
| ID | Issue | Effort | Fix |
|----|-------|--------|-----|
| BUG-1 | defaultSortField/Direction never forwarded to createGrid | S | 2 lines in `initializeGrid()` config |
| BUG-4 | DuckDB `attachToGrid()` is a complete no-op | M | Wire data bridge: push query results to grid |
| BUG-5 | Context menu listener leak via rAF timing gap | S | Cancel rAF or set cleanup inside rAF callback |
| BUG-9 | `filterRows()` rowsById contains unfiltered rows | S | `rowsById: buildRowMap(filteredRows)` |
| BUG-11 | Math.min/max stack overflow (6 sites in phz-grid + sparkline + criteria) | S | Replace spread with `reduce()` at all 8 sites |

### GATE 2: Beta Quality (19 items)

| ID | Issue | Effort |
|----|-------|--------|
| BUG-6 | updateRows/deleteRows: N pipeline invalidations | S |
| BUG-7 | Collab state changes all reported as "sort" | M |
| BUG-8 | applyComputedColumns() mutates caller's data | S |
| BUG-10 | Cell edit writes NaN silently, shows success toast | S |
| BUG-12 | updateComplete.then() fires after disconnectedCallback() | S |
| PERF-1 | O(n) column lookup in filter/sort hot loops | S |
| PERF-2 | getGroupedRowModel() never cached | S |
| PERF-3 | filteredRows getter re-runs on every access | S |
| PERF-4 | StateManager notify() synchronous, no batching | S |
| PERF-5 | debounceMs declared, never implemented | S |
| PERF-6 | Anomaly lookup O(n) per cell render | S |
| UX-4 | Filter buttons invisible on touch (opacity:0, hover-only) | S |
| UX-5 | No Shift-click range selection | S |
| UX-11 | Screen reader: filter/pagination/group announcements missing | S |
| UX-3 | Red focus rings in admin/criteria (looks like error) | S |
| UX-9 | Toast dot always green regardless of type | S |
| UX-10 | No error UI for remote data failures | S |
| TEST-2 | Write failing tests FIRST for all Gate 1 bugs (TDD Red) | M |
| TEST-3 | Add coverage thresholds to CI | S |

### GATE 3: GA Quality (17 items)

| ID | Issue | Effort |
|----|-------|--------|
| BUG-2 | fromArrowTable: native Arrow import (batching exists but lossy) | S |
| PERF-7 | Skip filteredRowIds Set when no filters | S |
| PERF-8 | table-layout: fixed | S |
| PERF-9 | CSS contain: content | S |
| PERF-10 | Granular syncFromState() (depends on ARCH-4) | M |
| PERF-11 | openFilterPopover() blocks main thread | S |
| UX-1 | No dark mode | M |
| UX-2 | Shared styles hardcode hex, don't consume tokens | M |
| UX-6 | Context-blind empty state message | S |
| UX-8 | Grid body has no initial tabindex | S |
| UX-12 | Admin panel has no live preview | M |
| SEC-7 | AI data leakage (redactFields opt-in, no default protection) | M |
| SEC-9 | WebRTC sessionId path traversal | S |
| ARCH-2 | Grid imports engine without declaring dependency | M |
| ARCH-5 | sideEffects: false wrong for grid package | S |
| ARCH-7 | Remote data cache has no eviction | S |
| TEST-1 | Zero DOM/rendering tests (switch to happy-dom) | M |
| TEST-4 | row-model.ts has no direct tests | M |
| TEST-5 | EventEmitter and StateManager untested | S |

### GATE 4: Post-GA (Differentiators + Architecture)

| ID | Issue | Effort |
|----|-------|--------|
| ARCH-1 | Decompose phz-grid.ts God Object (4,317 lines) | L |
| ARCH-3 | Wire DuckDB SQL push-down | L |
| ARCH-4 | Granular state subscriptions (selector pattern) | M |
| ARCH-6 | Lazy-import sub-components | M |
| DIFF-1–9 | Market differentiators | L |
| Dead code | renderRows(), _dataSetSchema, resolveConflict() stub | S |
| Anti-patterns | (col as any) casts, silent catch{}, module-level counter | S |

---

## Dependency Map

```
SEC-1, SEC-5 ──> BUG-4 ──> ARCH-3 ──> DIFF-1, DIFF-5, DIFF-6
                                        (DuckDB as competitive moat)

ARCH-4 ──> PERF-10 (granular sync requires selector subscriptions)

TEST-2 (failing tests) ──> All BUG fixes (strict TDD red-green-refactor)

ARCH-1 (God Object) ──> ARCH-6 (lazy imports), TEST-1 (per-controller DOM tests)

pivot.test.ts syntax fix ──> clean CI (currently 2 tests failing)
```

---

## Quick Wins: 22 Items (all S effort, do first)

| # | Item | One-liner Fix |
|---|------|---------------|
| 1 | SEC-4 | Add `isSafeUrl()` to LinkCellRenderer + ImageCellRenderer |
| 2 | SEC-2 | Block semicolons + add COPY/ATTACH/INSTALL to FORBIDDEN |
| 3 | SEC-3 | Apply MAX_NL_QUERY_LENGTH to suggestFilters/explainQuery |
| 4 | SEC-1a | Add SELECT-only allowlist to executeSQL() |
| 5 | SEC-1b | Sanitize delimiter in buildLoadOptions() |
| 6 | BUG-1 | Add defaultSortField/Direction to initializeGrid config |
| 7 | BUG-5 | Cancel rAF or set cleanup inside callback |
| 8 | BUG-9 | `rowsById: buildRowMap(filteredRows)` |
| 9 | BUG-11 | Replace Math.min/max spread with reduce (8 sites) |
| 10 | BUG-6 | Batch: mutate all rows, single invalidatePipeline() |
| 11 | BUG-8 | `.map(r => ({...r}))` before computed column mutation |
| 12 | BUG-10 | Validate Number(), reject NaN, keep editor open |
| 13 | BUG-12 | Guard `if (!this.isConnected) return` in .then() |
| 14 | PERF-1 | Pre-build `Map<string, ColumnDefinition>` |
| 15 | PERF-2 | Add groupedModelCache + flattenedModelCache |
| 16 | PERF-5 | Wire debounceMs to search/filter handlers |
| 17 | PERF-7 | Early return when filters.length === 0 |
| 18 | ARCH-5 | Fix sideEffects in package.json |
| 19 | UX-4 | `@media (hover: none) { opacity: 0.4 }` |
| 20 | UX-3 | Replace #EF4444 with var(--phz-color-primary) (4 sites) |
| 21 | UX-9 | Conditional toast dot color based on type |
| 22 | TEST-3 | Add coverage thresholds to vitest.config.ts + CI |

---

## Test Plan Summary

| Phase | Tests | Priority |
|-------|-------|----------|
| Bug regression (TDD Red) | ~55 | P0 — before any fixes |
| Security regression | ~30 | P0 — before any fixes |
| row-model.ts pipeline | ~35 | P1 |
| EventEmitter + StateManager | ~25 | P2 |
| DOM rendering setup + tests | ~30 | P3 |
| Gap filling (AI, Collab, etc.) | ~200 | P4 |
| **Total** | **~375** | |

**Current state**: 2039 tests passing, 2 failing (pivot.test.ts syntax error — 2-minute fix).

**Immediate fix**: `pivot.test.ts:132` has extra `});` causing esbuild parse failure.

---

## Recommended Execution Order

1. Fix pivot.test.ts syntax error (2 minutes, unblocks clean CI)
2. Write failing tests for Gate 1 items (TDD Red phase) — ~40 tests
3. Implement Gate 1 security fixes (SEC-1a/b, SEC-2, SEC-3, SEC-4, SEC-5)
4. Implement Gate 1 bug fixes (BUG-1, BUG-5, BUG-9, BUG-11)
5. BUG-4 + SEC-5 reconciliation (DuckDB no-op + param system mismatch)
6. Gate 2 quick wins (all S effort) — can parallelize
7. TEST-3 (CI coverage thresholds)
8. Gate 3 items (dark mode, tokens, DOM tests)
9. Gate 4 (architecture refactoring, differentiators)
