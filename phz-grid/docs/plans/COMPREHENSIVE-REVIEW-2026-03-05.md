# phz-grid Comprehensive Multi-Agent Review

**Date**: 2026-03-05
**Review Team**: 8 specialized AI agents (Innovator, Product Designer, Architect, Coder, Tester, End-User, Security Engineer, Performance Engineer)
**Scope**: Full codebase audit of all 15 packages

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 0: Security Hardening](#phase-0-security-hardening)
3. [Phase 1: Critical Bug Fixes](#phase-1-critical-bug-fixes)
4. [Phase 2: Performance Optimizations](#phase-2-performance-optimizations)
5. [Phase 3: UX/DX Improvements](#phase-3-uxdx-improvements)
6. [Phase 4: Architecture Improvements](#phase-4-architecture-improvements)
7. [Phase 5: Testing Infrastructure](#phase-5-testing-infrastructure)
8. [Phase 6: Market Differentiators](#phase-6-market-differentiators)
9. [Dead Code & Unused Exports](#dead-code--unused-exports)
10. [Anti-Patterns & Code Smell](#anti-patterns--code-smell)
11. [Lit Web Component Violations](#lit-web-component-violations)
12. [End-User Workflow Assessment](#end-user-workflow-assessment)
13. [Cross-Agent Consensus](#cross-agent-consensus)
14. [Execution Strategy](#execution-strategy)
15. [Key File Reference](#key-file-reference)

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | 7 | 3 | 5 | 15 |
| Bugs | 9 | 6 | 4 | 19 |
| Performance | 4 | 6 | 5 | 15 |
| UX/DX | 2 | 8 | 5 | 15 |
| Architecture | 2 | 4 | 3 | 9 |
| Testing | 3 | 4 | 3 | 10 |
| **Total** | **27** | **31** | **25** | **83** |

### What Works Well
- Token architecture (three-layer Brand/Semantic/Component) is a strong foundation
- Keyboard navigation (KeyboardNavigator) covers Arrow keys, Home/End, PageUp/Down, F2 edit, Shift+F10
- Forced Colors Mode (ForcedColorsAdapter) with reactive listener
- Reduced motion support across grid, admin, criteria, engine-admin
- Criteria component library is the most polished UI package
- CSV/Excel exporters have formula injection protection
- DuckDB runs in `:memory:` mode (no data persisted to disk)
- Expression evaluator uses safe AST tree-walk (no eval/new Function)
- `sql-builder.ts` has proper parameterization and identifier sanitization
- Copy engine has `excludeFields`, `maskFields`, `maxCopyRows`
- Virtual scrolling implementation is genuine DOM virtualization

---

## Phase 0: Security Hardening (MUST DO BEFORE RELEASE)

### SEC-1: SQL Injection — DuckDB Adapter [CRITICAL]
- **Files**: `packages/duckdb/src/duckdb-data-source.ts:184-191, 246-249, 351, 367-368`
- **Issue**: Fake parameterization via string interpolation (`:key` replacement); unrestricted `executeSQL()` accepts DROP/CREATE/INSTALL; `getQueryPlan()` concatenates raw SQL; `buildLoadOptions()` interpolates `delimiter` unsanitized
- **Attack Vector**: Any caller can execute: `executeSQL("DROP TABLE users")` — no validation. Parameter substitution: `:id` replacement uses `String(value)` for non-strings, allowing objects with custom `toString()` to inject SQL.
- **Fix**: Use `connection.prepare()` with native DuckDB parameterized execution throughout. Add SQL statement whitelist to `executeSQL()` (SELECT only, or explicit allowlist). Sanitize all interpolated identifiers via `sanitizeIdentifier()`.
- **Effort**: M
- **Agents**: Security, Coder

### SEC-2: SQL Injection — AI Executor Bypass [CRITICAL]
- **Files**: `packages/ai/src/ai-toolkit.ts:27-28`, `packages/duckdb/src/ai-executor.ts:11-12`
- **Issue**: Regex validation fails to block multi-statement attacks (`SELECT 1; DROP TABLE x`) and DuckDB-specific commands (COPY, ATTACH, INSTALL, LOAD)
- **Fix**: Block semicolons entirely. Whitelist only SELECT statements. Use DuckDB read-only connection mode.
- **Effort**: S
- **Agents**: Security

### SEC-3: Prompt Injection in NL Query [CRITICAL]
- **Files**: `packages/ai/src/ai-toolkit.ts:150-158, 383-385`
- **Issue**: User input placed in prompts with minimal sanitization inside double quotes. `suggestFilters()` and `explainQuery()` apply no length limit on input (unlike `executeNaturalLanguageQuery` which has `MAX_NL_QUERY_LENGTH=500`).
- **Fix**: Apply `MAX_NL_QUERY_LENGTH` to all prompt-building methods. Use structured prompt templates with clear delimiters and explicit instruction boundaries.
- **Effort**: S
- **Agents**: Security, Coder

### SEC-4: XSS via LinkCellRenderer [CRITICAL]
- **Files**: `packages/grid/src/renderers/built-in.ts:58-65, 73-76`
- **Issue**: `href="${href}"` rendered without URL protocol validation. `javascript:` URLs execute arbitrary code. `ImageCellRenderer` at line 73-76 has the same gap. The inline renderer in `phz-grid.ts` correctly calls `isSafeUrl()` — but the built-in renderers do not.
- **Fix**: Add `isSafeUrl()` check to both `LinkCellRenderer` and `ImageCellRenderer`. Reuse existing function.
- **Effort**: S
- **Agents**: Security

### SEC-5: DuckDBBridge Drops Parameterized Values [HIGH]
- **Files**: `packages/duckdb/src/duckdb-bridge.ts:73`
- **Issue**: `refresh()` calls `query(sql)` without passing the parameter values generated by `sql-builder.ts`, nullifying the parameterization that was correctly built.
- **Fix**: Pass params through: `query(sql, params)`.
- **Effort**: S
- **Agents**: Security

### SEC-6: API Keys Exposed Client-Side [HIGH]
- **Files**: `packages/ai/src/providers.ts:57, 169, 276, 319`
- **Issue**: AI provider API keys embedded in browser-accessible code.
- **Fix**: Require server-side proxy pattern. Document this clearly. Never ship API keys in client bundle.
- **Effort**: M
- **Agents**: Security

### SEC-7: AI Data Leakage [HIGH]
- **Files**: `packages/ai/src/ai-toolkit.ts`
- **Issue**: User data samples sent to third-party AI providers without comprehensive redaction. `redactFields` is opt-in and not applied to `suggestFilters()`.
- **Fix**: Apply redaction consistently across all AI methods. Document data flow clearly. Add opt-out for data sharing.
- **Effort**: M
- **Agents**: Security

---

## Phase 1: Critical Bug Fixes (Pre-Release Blockers)

### BUG-1: Default Sort Props Never Forwarded [CRITICAL]
- **File**: `packages/grid/src/components/phz-grid.ts:1604-1612`
- **Issue**: `defaultSortField` (line 272) and `defaultSortDirection` (line 276) are declared as `@property` but never passed to `createGrid()` config in `initializeGrid()`. Users who set these attributes via HTML or JS get a grid with no initial sort — silently wrong behavior with no runtime error.
- **Fix**: Add both fields to the GridConfig object:
  ```ts
  const config: GridConfig = {
    // ...existing fields
    defaultSortField: this.defaultSortField || undefined,
    defaultSortDirection: this.defaultSortDirection,
  };
  ```
- **Effort**: S
- **Agents**: Coder, End-User, Tester

### BUG-2: fromArrowTable() Row-by-Row INSERT [CRITICAL]
- **File**: `packages/duckdb/src/duckdb-data-source.ts:267-287`
- **Issue**: Converts Arrow table to JS array via `table.toArray()`, then fires individual `INSERT INTO` SQL call per row in a `for` loop. 10,000 rows = 10,000 sequential round-trips to DuckDB WASM worker. Effectively unusable for real data.
- **Fix**: Use `connection.insertArrowTable(table, { name: safeTable })` for native bulk import.
- **Effort**: S
- **Agents**: Coder, Performance, Tester

### BUG-3: Arrow/IPC Files Fall Back to CSV Reader [CRITICAL]
- **File**: `packages/duckdb/src/duckdb-data-source.ts:342`
- **Issue**: `case 'arrow': case 'ipc': return 'csv';` — passes `.arrow` and `.ipc` files to `read_csv()` in DuckDB. Produces parse errors or silently corrupt data. No warning emitted.
- **Fix**: Return `'arrow'` for native DuckDB Arrow reading, or throw a descriptive error.
- **Effort**: S
- **Agents**: Coder, Tester

### BUG-4: DuckDB attachToGrid() is a No-Op [CRITICAL]
- **File**: `packages/duckdb/src/duckdb-data-source.ts:302-308`
- **Issue**: Method stores `this.grid = grid` but `this.grid` is never read anywhere in the class. Grid always uses JS row model regardless of DuckDB being "attached." The DuckDB-to-grid integration is completely non-functional.
- **Fix**: Implement data bridge. After `query()` completes, push results into grid: `this.grid?.setData(result.data)`.
- **Effort**: M
- **Agents**: Coder, Architect, Innovator

### BUG-5: Context Menu Listener Leak [CRITICAL]
- **File**: `packages/grid/src/components/phz-context-menu.ts:199-218`
- **Issue**: Cleanup closure assigned synchronously, but listeners attached inside `requestAnimationFrame`. If `removeListeners()` called before next paint (rapid open/close), cleanup runs against nothing, then rAF fires and attaches permanent `mousedown` + `keydown` listeners to `document`. Every rapid open/close cycle leaks two global listeners.
- **Fix**: Add cancellation flag before rAF; set real cleanup inside rAF callback. Guard rAF with `if (cancelled) return;`.
- **Effort**: S
- **Agents**: Coder

### BUG-6: updateRows()/deleteRows() Invalidate Pipeline N Times [HIGH]
- **File**: `packages/core/src/create-grid.ts:239-265`
- **Issue**: Both methods delegate to single-item variants in a loop. `updateRow()` calls `invalidatePipeline()` and emits `row:update` on every iteration. 100-row batch update = 100 pipeline invalidations + up to 100 full re-renders.
- **Fix**: Implement bulk: mutate all rows first, call `invalidatePipeline()` once, emit single batched event.
- **Effort**: S
- **Agents**: Coder, Performance

### BUG-7: Collab State Changes All Reported as "sort" [HIGH]
- **File**: `packages/collab/src/collab-session.ts:209-221`
- **Issue**: Every grid state subscriber callback creates `LocalChange` with `field: 'sort'` and `oldValue: null` regardless of what actually changed. Change history is permanently incorrect. Conflict resolution uses wrong information.
- **Fix**: Retain `previousState` reference. Diff against new state to identify actual changed field. Build accurate `LocalChange` payload.
- **Effort**: M
- **Agents**: Coder

### BUG-8: applyComputedColumns() Mutates Caller's Data [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts:1502-1535`
- **Issue**: `row[cc.field] = evaluateRowExpression(...)` writes directly into consumer's row objects. If consumer retains references (standard in React/Vue), this breaks change detection and corrupts caller data.
- **Fix**: Shallow-copy rows before mutation:
  ```ts
  const workingData = (this.data as Record<string, unknown>[]).map(r => ({ ...r }));
  ```
- **Effort**: S
- **Agents**: Coder

### BUG-9: filterRows() Returns rowsById With Filtered-Out Rows [HIGH]
- **File**: `packages/core/src/row-model.ts:177-184`
- **Issue**: `FilteredRowModel.rowsById` is same reference as unfiltered model's map. Code using `getFilteredRowModel().rowsById` will find rows that are NOT in the visible set.
- **Fix**: `rowsById: buildRowMap(filteredRows)`
- **Effort**: S
- **Agents**: Coder

### BUG-10: Cell Edit Has No Validation [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts:3205-3213`
- **Issue**: `commitInlineEdit()` converts with `Number(rawValue)` for number columns. Typing "abc" produces `NaN`, which is silently written to data. Toast says "Cell updated" — no validation, no error border, no rejection.
- **Fix**: Type validation in `commitInlineEdit()`. Red border + error tooltip on invalid input. Reject the edit, keep editor open.
- **Effort**: S
- **Agents**: End-User

### BUG-11: Math.min/max Stack Overflow on Large Arrays [HIGH]
- **Files**: `packages/engine/src/aggregation.ts:46-48`, `packages/grid/src/components/phz-grid.ts:2032-2038`
- **Issue**: `Math.min(...nums)` / `Math.max(...nums)` — V8 argument limit ~65,535 elements. Column with 100K rows throws `RangeError: Maximum call stack size exceeded`.
- **Fix**: `nums.reduce((min, v) => v < min ? v : min, Infinity)`
- **Effort**: S
- **Agents**: Coder, Performance

### BUG-12: updateComplete.then() Fires After disconnectedCallback() [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:1644-1668`
- **Issue**: If component removed from DOM before first render (fast framework navigation), `disconnectedCallback()` runs, then `.then()` fires on next microtask — attaches listeners to detached element, dispatches `grid-ready` on destroyed grid.
- **Fix**: Add guard: `if (!this.isConnected || !this.gridApi) return;` or use `firstUpdated()`.
- **Effort**: S
- **Agents**: Coder

---

## Phase 2: Performance Optimizations

### PERF-1: Pre-build Column Lookup Map [CRITICAL]
- **File**: `packages/core/src/row-model.ts:161, 219`
- **Issue**: `columns.find(c => c.field === filter.field)` inside filter loop (O(N*F)) and sort comparator (O(N log N * S)). With 20 columns and 100K rows during sort = ~34 million unnecessary array scans.
- **Fix**: Build `Map<string, ColumnDefinition>` once before the row/sort loop:
  ```ts
  const colMap = new Map(columns.map(c => [c.field, c]));
  ```
- **Impact**: 30-50% sort speedup
- **Effort**: S
- **Agents**: Coder, Performance

### PERF-2: Cache getGroupedRowModel() [CRITICAL]
- **File**: `packages/core/src/create-grid.ts:171-174`
- **Issue**: Unlike core/filter/sort stages (which each have cache variables), group and flatten stages recompute from scratch on every call. `syncFromState()` calls `getGroupedRowModel()` on every state change — including selection, column resize, scroll. With 50K rows and 3 group levels, this is expensive tree-building done repeatedly for free.
- **Fix**: Add `groupedModelCache` and `flattenedModelCache` following the existing cache pattern.
- **Effort**: S
- **Agents**: Performance, Architect, Coder

### PERF-3: Memoize filteredRows Getter [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts:1911-1920`
- **Issue**: Getter runs full-text search across all visible rows. Accessed 14+ times per render cycle (header bar, pagination, virtual scroller setup, row count, footer, etc.).
- **Fix**: Replace getter with `@state()` property updated on `searchQuery`/`visibleRows` change only.
- **Effort**: S
- **Agents**: Performance

### PERF-4: Batch StateManager Notifications [HIGH]
- **File**: `packages/core/src/state.ts:127`
- **Issue**: `notify()` fires synchronously per `setState()`. Rapid state changes (typing, drag-resize, batch updateRows) trigger N separate `syncFromState()` calls.
- **Fix**: `queueMicrotask(() => this.notify())` with deduplication flag.
- **Effort**: S
- **Agents**: Performance

### PERF-5: Implement Debounce (Declared, Never Used) [HIGH]
- **File**: `packages/core/src/types/config.ts` (PerformanceConfig.debounceMs)
- **Issue**: `debounceMs` declared in config type but never implemented. Every keystroke triggers full pipeline recalculation.
- **Fix**: Add `setTimeout` debounce to search/filter handlers; `requestAnimationFrame` for resize handlers.
- **Effort**: S
- **Agents**: Performance, End-User, Coder

### PERF-6: Convert Anomaly Lookup to Map [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts:1993-1997`
- **Issue**: `isAnomalous()` does `anomalies.get(field)?.find(a => a.rowId === rowId)` for EVERY cell render. With 100 anomalies per column and 50 visible rows x 10 columns = 50,000 comparisons per render cycle.
- **Fix**: Build `Map<\`${rowId}:${field}\`, AnomalyResult>` when anomalies are computed. O(1) lookup per cell.
- **Effort**: S
- **Agents**: Performance

### PERF-7: Skip filteredRowIds Set When No Filters [MEDIUM]
- **File**: `packages/core/src/row-model.ts:150-151`
- **Issue**: `new Set(model.rows.map(r => r.__id))` creates 100K-entry Set even with zero active filters (~4MB wasted allocation).
- **Fix**: Return model directly when `filters.length === 0`.
- **Effort**: S
- **Agents**: Performance

### PERF-8: Switch to table-layout: fixed [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:679`
- **Issue**: `table-layout: auto` forces browser to measure all cell content for column widths — O(visible_rows * columns) layout work on every render.
- **Fix**: `table-layout: fixed` + ensure all columns have explicit widths (already stored in state).
- **Effort**: S
- **Agents**: Performance

### PERF-9: CSS contain: content Instead of contain: style [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:558`
- **Issue**: `contain: style` only prevents custom property/counter leakage. No layout/paint containment.
- **Fix**: Change to `contain: content` (implies layout + style + paint). Verify positioned children (toast, context menu) are `position: fixed` and won't be clipped.
- **Effort**: S
- **Agents**: Coder

### PERF-10: Granular syncFromState() [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:1810`
- **Issue**: Rebuilds everything on every state change including selection-only changes, column width changes. Full pipeline + 6+ `@state()` property assignments per notification.
- **Fix**: Check which state section changed. For selection-only, update only `selectedRowIds` without running sort/filter/group pipeline.
- **Effort**: M
- **Agents**: Performance

### PERF-11: openFilterPopover() Iterates All Rows Synchronously [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:4112-4125`
- **Issue**: Building value-count map for filter popover iterates all `visibleRows` synchronously on every filter button click. 50K rows = blocking main thread.
- **Fix**: Memoize value counts per-field (invalidate on data/filter change), or move to microtask with loading indicator.
- **Effort**: S
- **Agents**: Performance

---

## Phase 3: UX/DX Improvements

### UX-1: No Dark Mode [HIGH]
- **Files**: `packages/grid/src/tokens.ts`, all four `shared-styles.ts` files
- **Issue**: `theme` property typed and accepted but zero dark color scheme implemented. No `@media (prefers-color-scheme: dark)` rules or `:host([theme="dark"])` selectors anywhere.
- **Fix**: Add `:host([theme="dark"])` selectors with dark token overrides. Add `@media (prefers-color-scheme: dark)` auto-detection mode.
- **Effort**: M
- **Agents**: Designer

### UX-2: Shared Styles Hardcode Hex — Tokens Not Consumed [HIGH]
- **Files**: `packages/grid-admin/src/shared-styles.ts`, `packages/engine-admin/src/shared-styles.ts`, `packages/widgets/src/shared-styles.ts`, `packages/criteria/src/shared-styles.ts`
- **Issue**: All four files hardcode the same hex values instead of referencing `var(--phz-*)` CSS custom properties from `tokens.ts`. Theming the grid has zero effect on admin panels, widgets, or criteria UI.
- **Fix**: Replace hardcoded hex with `var(--phz-*)` token references. Long-term: extract to shared `@phozart/phz-admin-styles`.
- **Effort**: M
- **Agents**: Designer

### UX-3: Inconsistent Focus Ring Colors [HIGH]
- **Files**: `packages/grid-admin/src/shared-styles.ts:29`, `packages/criteria/src/shared-styles.ts:22`
- **Issue**: Grid/widgets use `#3B82F6` (blue) focus rings. Admin/criteria use `#EF4444` (red). Red looks like an error state to keyboard users.
- **Fix**: Unify to blue (`#3B82F6`) or use `var(--phz-focus-ring)` token.
- **Effort**: S
- **Agents**: Designer

### UX-4: Filter Buttons Invisible on Touch Devices [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts` CSS lines 718-723
- **Issue**: Filter icons on column headers have `opacity: 0` with `:hover` reveal. Touch devices cannot hover — buttons are completely inaccessible.
- **Fix**: Add `@media (hover: none) { .phz-filter-btn { opacity: 0.4; } }` to keep filter icons visible on touch.
- **Effort**: S
- **Agents**: End-User, Designer

### UX-5: No Shift-Click Row Range Selection [HIGH]
- **File**: `packages/grid/src/components/phz-grid.ts:3611-3634`
- **Issue**: `handleRowClick()` checks only `ctrlKey`/`metaKey`, never `shiftKey`. Excel/Sheets users expect Shift-click to select a range.
- **Fix**: Add `shiftKey` handling: select all rows between `lastClickedRowId` and current row when `selectionMode === 'multi'`.
- **Effort**: S
- **Agents**: End-User

### UX-6: Empty State Message Is Context-Blind [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:3551-3559`
- **Issue**: Same "No matching records found" message for: no data loaded, filters returned zero, network fetch error. Misleading.
- **Fix**: Distinguish states. Show "Clear all filters" button in filtered-empty state. Show error + retry in fetch-error state.
- **Effort**: S
- **Agents**: End-User, Designer

### UX-7: No ARIA Sort on Column Headers [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts` (renderHeaderCell)
- **Issue**: Screen readers cannot discover sort state — `aria-sort` attribute missing from `<th>`.
- **Fix**: Add `aria-sort="ascending|descending|none"` to `<th>` elements based on current sort state.
- **Effort**: S
- **Agents**: Designer

### UX-8: Grid Body Has No Initial Tabindex [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts` (render method)
- **Issue**: Keyboard users pressing Tab skip the entire grid — no focusable element in grid body.
- **Fix**: Add `tabindex="0"` to grid container element.
- **Effort**: S
- **Agents**: Designer

### UX-9: Toast Dot Always Green [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:1112`
- **Issue**: Toast notification dot ignores `type: 'error'` — always renders green.
- **Fix**: Map toast type to dot color (green=success, red=error, yellow=warning).
- **Effort**: S
- **Agents**: Designer

### UX-10: No Network Error UI for Remote Data [MEDIUM]
- **File**: `packages/grid/src/remote-data-manager.ts`
- **Issue**: Server failure shows infinite skeleton shimmer with no explanation, no retry. "Single fetch failure = broken grid today."
- **Fix**: Error state replacing shimmer with "Failed to load data. [Retry]" message. Wire `onError` callback.
- **Effort**: S
- **Agents**: End-User

### UX-11: Screen Reader Announcements Never Fire [MEDIUM]
- **File**: `packages/grid/src/a11y/aria-manager.ts`
- **Issue**: `announceChange()` exists but is never called from sort/filter/page change handlers. Screen reader users get no feedback when data changes.
- **Fix**: Call `announceChange()` after sort, filter, pagination, and grouping operations.
- **Effort**: S
- **Agents**: Designer

### UX-12: Admin Panel Has No Live Preview [MEDIUM]
- **File**: `packages/grid-admin/src/components/phz-grid-admin.ts`
- **Issue**: Must close admin modal to see effect of configuration changes.
- **Fix**: Add side-by-side preview that updates in real-time as settings change.
- **Effort**: M
- **Agents**: Designer

---

## Phase 4: Architecture Improvements

### ARCH-1: Decompose phz-grid.ts God Object [CRITICAL]
- **File**: `packages/grid/src/components/phz-grid.ts` (4,317 lines)
- **Issue**: Single class implements: sorting, filtering, grouping, pagination, virtual scroll, inline editing, cell-range selection, copy/paste, context menus, column resize, conditional formatting, anomaly detection, CSV/Excel export, drill-through, chart popover, column chooser, computed columns, DataSet bridging, remote data management. Directly conflicts with "Modular by default" principle. Nothing is tree-shakeable.
- **Fix**: Extract into Lit Reactive Controllers: `SortController`, `FilterController`, `SelectionController`, `EditController`, `ExportController`, `ChartController`, `AnomalyController`, etc. Each controller is independently testable and tree-shakeable.
- **Effort**: L
- **Agents**: Architect, Coder, Performance

### ARCH-2: Remove Grid -> Engine Phantom Dependency [HIGH]
- **Files**: `packages/grid/src/components/phz-grid.ts:50-51`, `packages/grid/package.json`
- **Issue**: Grid imports `@phozart/phz-engine` at runtime without declaring it in package.json. Inflates bundle. Breaks package boundary. Community bundle exceeds 50KB target.
- **Fix**: Make engine an optional peer dependency. Use dynamic `import()`. Extract duplicated aggregation logic into core.
- **Effort**: M
- **Agents**: Architect

### ARCH-3: Wire DuckDB SQL Push-Down [HIGH]
- **Files**: `packages/duckdb/src/duckdb-bridge.ts`, `packages/duckdb/src/hybrid-engine.ts`
- **Issue**: DuckDB infrastructure (bridge, hybrid engine, SQL builder, AI executor, data blending) exists across 8 source files but is completely disconnected from grid's data pipeline. Grid always falls back to JS row model even when DuckDB is loaded.
- **Fix**: `DuckDBBridge` subscribes to grid state changes (sort, filter, group), builds SQL via `SqlBuilder`, executes via Worker, pushes results to grid. `HybridEngine` auto-switches between JS and DuckDB at configurable row threshold (default: 50K).
- **Effort**: L
- **Agents**: Innovator, Architect, Performance

### ARCH-4: Granular State Subscriptions [MEDIUM]
- **File**: `packages/core/src/state.ts`
- **Issue**: All subscribers fire on every state change. No selector-based filtering. Selection change fires sort pipeline.
- **Fix**: Add `subscribe(selector, callback)` pattern — only fire callback when selected state slice changes.
- **Effort**: M
- **Agents**: Architect, Performance

### ARCH-5: sideEffects: false Is Wrong for Grid Package [MEDIUM]
- **File**: `packages/grid/package.json`
- **Issue**: Declares `"sideEffects": false` but registers 21 custom elements via `@customElement()` decorators — these ARE side effects. Tree-shaker may remove custom element registrations silently.
- **Fix**: Change to `"sideEffects": ["**/*.ts"]` or list specific registration files.
- **Effort**: S
- **Agents**: Architect

### ARCH-6: Lazy-Import Sub-Components [MEDIUM]
- **File**: `packages/grid/src/components/phz-grid.ts:59-63`
- **Issue**: 5 sub-components eagerly imported: `phz-context-menu`, `phz-filter-popover`, `phz-column-chooser`, `phz-chart-popover`, `phz-toolbar`. All loaded even when disabled.
- **Fix**: Replace static imports with dynamic `import()` inside methods that open each component.
- **Impact**: ~8-12KB gzip bundle reduction, faster initial parse.
- **Effort**: M
- **Agents**: Performance

### ARCH-7: Remote Data Cache Has No Eviction [MEDIUM]
- **File**: `packages/grid/src/remote-data-manager.ts:36`
- **Issue**: Page cache grows without bound. Heavy scrolling through remote data accumulates unbounded memory.
- **Fix**: Add `maxCachedPages` (default: 100) with LRU eviction and optional TTL.
- **Effort**: S
- **Agents**: Performance

---

## Phase 5: Testing Infrastructure

### TEST-1: Zero DOM/Rendering Tests [CRITICAL]
- **File**: `vitest.config.ts:26`
- **Issue**: `environment: 'node'` — entire Web Component rendering layer untested. No Playwright tests. KeyboardNavigator imported in grid.test.ts but never exercised. AriaManager imported but never exercised. ForcedColorsAdapter tests silently skip via `if (typeof document === 'undefined') return;`. Project states "accessibility first" as principle #1, yet zero automated accessibility tests.
- **Fix**: Switch grid package to `happy-dom` environment. Write first 10 rendering tests for `<phz-grid>`. Set up Playwright for e2e.
- **Effort**: M
- **Agents**: Tester

### TEST-2: Known Bugs Have Zero Test Coverage [CRITICAL]
- **Issue**: All 7+ documented broken features have no tests. Bugs can regress silently after "fixes."
- **Fix**: Write failing tests FIRST (strict TDD Red phase) for all documented bugs before implementing fixes. Creates regression protection. Estimated: ~3 hours.
- **Agents**: Tester

### TEST-3: No Coverage Enforcement [HIGH]
- **Files**: `vitest.config.ts:28-32`, `.github/workflows/ci.yml`
- **Issue**: V8 coverage configured but no thresholds set. CI runs `npx vitest run` without `--coverage`. Coverage can regress to zero with no signal.
- **Fix**: Set 60% line coverage threshold. Add `npx vitest run --coverage` to CI. Increase threshold quarterly.
- **Effort**: S
- **Agents**: Tester

### TEST-4: row-model.ts Has No Direct Tests [HIGH]
- **File**: `packages/core/src/row-model.ts`
- **Issue**: The entire data pipeline (filterRows, sortRows, groupRows, flattenRows, virtualizeRows) tested only indirectly through createGrid. Edge cases uncovered: `between` with non-array values, `lessThan` with string values, date filter operators with invalid dates, flattenRows with nested collapsed groups.
- **Fix**: Create `packages/core/src/__tests__/row-model.test.ts` with ~30 tests for pipeline stages.
- **Effort**: M
- **Agents**: Tester

### TEST-5: EventEmitter and StateManager Untested [HIGH]
- **Files**: `packages/core/src/event-emitter.ts`, `packages/core/src/state.ts`
- **Issue**: Foundation modules with zero dedicated tests. `removeAllListeners()`, `once()` lifecycle, `exportState()`/`importState()` round-trip, Set serialization for `selectedRows` and `expandedGroups` — all untested.
- **Fix**: Create unit tests for both modules. ~20 tests.
- **Effort**: S
- **Agents**: Tester

### Per-Package Test Health Ratings
| Package | Test Cases | Rating | Key Gap |
|---------|-----------|--------|---------|
| core | 256 across 16 files | B+ | row-model.ts, event-emitter.ts, state.ts have no direct tests |
| grid | 173 across 10 files | C | Zero DOM rendering; VirtualScroller and RemoteDataManager solid |
| engine | 688 across 35 files | A- | Best tested; pivot (5 tests) and chart (7 tests) thin |
| duckdb | 113 across 9 files | C+ | SQL builder excellent; actual DuckDB operations untested |
| ai | 19 across 1 file | D | Factory/type tests only; no AI operation tests |
| collab | 33 across 1 file | D+ | Session lifecycle only; no Yjs, no conflict resolution |
| react | 176 across 7 files | B | Hook logic solid; component wrappers thin |
| vue | 25 across 1 file | C- | Factory-level only |
| angular | 20 across 1 file | C- | Factory-level only |
| widgets | 25 across 9 files | D | Tests verify array slicing, not widget behavior |
| criteria | 239 across 7 files | B+ | Headless logic well covered |
| grid-admin | 72 across 11 files | C- | Most tests trivial object-spread assertions |
| engine-admin | 21 across 4 files | D+ | Type-checking only |
| python | 0 | F | No tests |

---

## Phase 6: Market Differentiators (Post-Stabilization)

### DIFF-1: DuckDB as Competitive Moat (Double Down Here)
- **What**: No grid vendor embeds an analytical database. AG Grid requires server backend (SSRM) for 100K+ rows. Wire DuckDB for 5M-row client-side sort/filter/pivot in <100ms with zero server infrastructure.
- **Why**: (a) Zero competitors, (b) architecture already designed across 8 files, (c) unlocks multiple downstream features (JOINs, window functions, Parquet, NL-to-SQL), (d) creates lock-in, (e) defensible (requires rare cross-domain expertise)
- **Agent**: Innovator

### DIFF-2: AI-Native Grid Configuration
- **What**: Developer provides only data. AI infers column types, applies formatters, detects anomalies, suggests filters. "Grid that configures itself." Infrastructure exists across `inferColumns()`, `inferSchema()`, `suggestDataTypes()`, `detectAnomalies()`, `suggestFilters()`.
- **Agent**: Innovator

### DIFF-3: Embeddable Analytics (Replace Looker Embedded)
- **What**: BI engine + widgets + DuckDB in a single `<phz-dashboard>` component. KPI cards, trend lines, bar charts, and data grid — all computed client-side. One npm package instead of $100K/year BI tool.
- **Agent**: Innovator

### DIFF-4: Collaborative Grid Editing via CRDTs
- **What**: Google Sheets is collaborative but not embeddable. No grid SDK has collaboration. `CollabSessionImpl` already maps rows/columns/state/presence to Yjs. Complete cursor rendering in grid layer.
- **Agent**: Innovator

### DIFF-5: "Notebook Mode" — Grid as Data Exploration
- **What**: Command bar with NL/SQL queries mutating the grid. "Jupyter for tabular data" in a Web Component. Pieces exist: `executeNaturalLanguageQuery()`, `DuckDBBridge.refresh()`, `ViewsManager.saveView()`.
- **Agent**: Innovator

### DIFF-6: "Drag-to-Blend" Multi-Source Grids
- **What**: `data-blending.ts` already builds JOIN queries. UX: drag second CSV/Parquet onto grid, visual join configurator, blended result — all client-side in DuckDB. Tableau Prep in a Web Component.
- **Agent**: Innovator

### DIFF-7: Time-Travel Grid Debugger
- **What**: Chrome DevTools panel showing live state tree, event timeline with replay, performance profiler, state diffs. No grid vendor has a dedicated DevTools extension.
- **Agent**: Innovator

### DIFF-8: Migration CLI
- **What**: `npx phz-grid migrate --from ag-grid` converting AG Grid column definitions, cellRendererFramework to Lit, ServerSideRowModel to AsyncDataSource. Eliminates largest adoption barrier.
- **Agent**: Innovator

### DIFF-9: Data Quality Dashboard
- **What**: Surface anomaly detection, missing values, duplicates, type consistency as built-in panel with completeness score, outlier count, health grade.
- **Agent**: Innovator

---

## Dead Code & Unused Exports

| Item | File | Details |
|------|------|---------|
| `renderRows()` | `phz-grid.ts:2911` | Private method declared but never called |
| `_dataSetSchema` | `phz-grid.ts:515` | `@state` field assigned but never read — triggers unnecessary re-renders |
| `resolveConflict()` | `collab-session.ts:186-198` | All branches are empty comments — stub shipped as production code |
| `buildRowMap` | `core/src/index.ts:23` | Exported publicly but only used internally in row-model.ts |
| Various DuckDB types | `duckdb/src/types.ts` | `ParquetMetadata`, other types declared but unused |

---

## Anti-Patterns & Code Smell

### `(col as any)` Casts Hide Missing Properties
- **File**: `phz-grid.ts:2891, 2991, 3072, 3176, 4224`
- Properties `align`, `linkTemplate`, `editorParams` used but absent from `ColumnDefinition`. `as any` bypasses TypeScript entirely.
- **Fix**: Add `GridColumnDefinition extends ColumnDefinition` with these properties.

### SQL Parameter Interpolation Unsafe for Non-Strings
- **File**: `duckdb-data-source.ts:184-190`
- `String(value)` for objects produces `[object Object]`. Dates produce locale-formatted strings. Arrays produce `1,2,3` with no quoting.
- **Fix**: Use `connection.prepare()` with native parameter binding.

### Silent Error Suppression Hides Bugs
- **File**: `phz-grid.ts:1852-1858`
- Bare `catch {}` on grouping errors — discards exceptions, renders empty state with no indication.
- **Fix**: `catch (e) { console.error('[phz-grid] grouping error:', e); this.groups = []; }`

### handleColumnSettingsChange() Mutates In-Place
- **File**: `phz-grid.ts:4215-4218`
- Mutates column objects then spreads array. Lit detects new array but same object references are mutated.
- **Fix**: `this.columns = this.columns.map(c => c.field === field ? { ...c, header } : c);`

### changeIdCounter is Module-Level Global
- **File**: `collab-session.ts:28`
- Shared across all CollabSession instances. IDs conceptually wrong in multi-room scenarios.
- **Fix**: Move to instance field: `private changeIdCounter = 0;`

### Duplicated Aggregation Logic
- **Files**: `engine/src/aggregation.ts:17-63` and `phz-grid.ts:2013-2080`
- Same sum/avg/min/max/count implemented twice. Bugs will diverge silently.
- **Fix**: Grid should import and use engine's `computeAggregation()`.

---

## Lit Web Component Violations

### Array/Object @property Fields Mutated In-Place
- Lit uses reference equality. `push()`, `col.header = x` don't trigger re-renders. Applies to: `columns`, `data`, `rowActions`, `conditionalFormattingRules`, `columnGroups`, `computedColumns`, `dateFormats`, `numberFormats`, `statusColors`, `columnFormatting`.
- **Fix**: Document immutability requirements. Audit internal mutation sites.

### `repeat()` Used Without Key Function
- **File**: `phz-grid.ts:2211-2214`
- Array produced by `.map()` with no key function. `repeat()` degrades to `.map()` behavior, losing diffing efficiency.
- **Fix**: Use `repeat(items, item => item.__id, itemTemplate)`.

---

## End-User Workflow Assessment

### Feature Status Matrix
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | View & scroll large datasets | Working | Virtual scrolling + pagination |
| 2 | Sort by column headers | Partial | Works on click. Default sort BROKEN |
| 3 | Filter data | Working | Excel-style popover, hierarchical dates |
| 4 | Group by columns | Working | Multi-level, expand/collapse, subtotals |
| 5 | Resize/reorder columns | Working | Drag resize, double-click auto-fit |
| 6 | Hide/show columns | Working | Column panel, chooser, context menu |
| 7 | Export Excel/CSV | Partial | CSV full, Excel approximate |
| 8 | Copy to clipboard | Working | Ctrl+C, TSV format, grouped copy |
| 9 | Paste from clipboard | **MISSING** | Zero paste handling |
| 10 | Inline edit cells | Working | Double-click, F2, Enter/Escape |
| 11 | Multi-row selection | Partial | Checkbox + Ctrl-click. **No Shift-click** |
| 12 | Print/PDF | **MISSING** | Zero print stylesheets |
| 13 | Save/restore views | Partial | API exists, no toolbar "Save View" button |
| 14 | Undo/redo | **BROKEN** | Types exist, zero implementation |
| 15 | Search within grid | Working | Toolbar search across all columns |
| 16 | Context menu | Working | Full header + body menus |
| 17 | Keyboard navigation | Working | WCAG 2.1.1 compliant |
| 18 | Footer aggregation | Working | Sum/avg/min/max/count, top/bottom/both |
| 19 | Pivot | Partial | Engine has it, not wired to grid UI |
| 20 | Charts from data | Partial | Single column via context menu only |

### Discoverability Problems (Features Exist But Invisible)
1. Multi-column sort (requires knowing Ctrl+click)
2. Cell range selection (no visual cue that drag works)
3. Column reorder via drag (no visible drag handle)
4. Double-click to auto-fit column width (invisible handle)
5. Saved Views (component exists, not in toolbar)
6. Keyboard shortcuts (no "?" help overlay)
7. Anomaly detection (only via context menu)
8. Computed columns (buried in Column Chooser dialog)
9. Admin settings (hidden behind userRole='admin')
10. Filter buttons (opacity: 0 by default)

---

## Cross-Agent Consensus (Issues Flagged by 3+ Agents)

| Issue | Agents | Priority |
|-------|--------|----------|
| DuckDB disconnected from grid | Innovator, Architect, Coder, Performance, Tester | CRITICAL |
| SQL injection in DuckDB adapter | Security, Coder, Architect | CRITICAL |
| phz-grid.ts God Object (4,317 lines) | Architect, Coder, Performance, Designer | CRITICAL |
| Column lookup O(n) in hot loops | Coder, Performance, Architect | CRITICAL |
| Default sort props never forwarded | Coder, End-User, Tester | HIGH |
| No dark mode implementation | Designer, End-User | HIGH |
| Group model never cached | Coder, Performance, Architect | HIGH |
| Zero DOM/rendering tests | Tester, Designer | CRITICAL |
| Missing paste from clipboard | End-User, Coder, Tester | HIGH |
| Token system not shared across packages | Designer, Architect | HIGH |
| Debounce declared but never implemented | Coder, Performance, End-User | HIGH |
| Math.min/max stack overflow | Coder, Performance | HIGH |

---

## Execution Strategy

### Priority Order
1. **Phase 0** (Security) — Must complete before any public release
2. **Phase 1** (Critical Bugs) — Pre-release blockers
3. **Phase 2** (Performance) — Most are Small effort with outsized impact
4. **Phase 5** (Testing) — Foundation for safe iteration
5. **Phase 3** (UX/DX) — User-facing quality
6. **Phase 4** (Architecture) — Long-term health
7. **Phase 6** (Differentiators) — Competitive advantage

### Quick Wins (Small effort, high impact — do first)
| Item | Fix | Effort |
|------|-----|--------|
| SEC-4 | Add `isSafeUrl()` to LinkCellRenderer | S |
| BUG-1 | Forward defaultSortField to createGrid config | S |
| BUG-3 | Change Arrow/IPC fallback from 'csv' to 'arrow' | S |
| BUG-11 | Replace Math.min/max spread with reduce | S |
| PERF-1 | Pre-build column Map before sort/filter loops | S |
| PERF-2 | Cache getGroupedRowModel() | S |
| PERF-5 | Implement debounce (already declared) | S |
| TEST-3 | Add coverage thresholds to CI | S |

### Methodology
- All implementation via strict TDD (Red-Green-Refactor) using `/tdd` skill
- Write failing tests FIRST for all known bugs (TEST-2)
- Parallel sessions on separate branches for independent phases

### Estimated New Tests: ~350+
| Phase | Test Count |
|-------|-----------|
| Security tests | ~30 |
| Bug regression tests | ~50 |
| Performance benchmarks | ~20 |
| UX behavior tests | ~30 |
| Architecture unit tests | ~40 |
| Existing gap filling | ~180+ |

---

## Key File Reference

| File | Issues |
|------|--------|
| `packages/grid/src/components/phz-grid.ts` | BUG-1,8,10,11,12; PERF-3,6,8,9,10,11; UX-4,5,6,7,8,9; ARCH-1,6 |
| `packages/duckdb/src/duckdb-data-source.ts` | SEC-1,4; BUG-2,3,4 |
| `packages/duckdb/src/duckdb-bridge.ts` | SEC-5; ARCH-3 |
| `packages/duckdb/src/ai-executor.ts` | SEC-2 |
| `packages/core/src/row-model.ts` | BUG-9; PERF-1,7; TEST-4 |
| `packages/core/src/create-grid.ts` | BUG-6; PERF-2 |
| `packages/core/src/state.ts` | PERF-4; ARCH-4; TEST-5 |
| `packages/core/src/event-emitter.ts` | TEST-5 |
| `packages/ai/src/ai-toolkit.ts` | SEC-2,3; SEC-6 |
| `packages/ai/src/providers.ts` | SEC-6 |
| `packages/collab/src/collab-session.ts` | BUG-7 |
| `packages/collab/src/sync-providers.ts` | SEC-7 |
| `packages/grid/src/components/phz-context-menu.ts` | BUG-5 |
| `packages/grid/src/renderers/built-in.ts` | SEC-4 |
| `packages/grid/src/virtual-scroller.ts` | PERF (fixed row height) |
| `packages/grid/src/remote-data-manager.ts` | UX-10; ARCH-7 |
| `packages/grid/src/a11y/aria-manager.ts` | UX-7,11 |
| `packages/grid/src/tokens.ts` | UX-1,2 |
| `packages/grid-admin/src/shared-styles.ts` | UX-2,3 |
| `packages/engine-admin/src/shared-styles.ts` | UX-2 |
| `packages/widgets/src/shared-styles.ts` | UX-2 |
| `packages/criteria/src/shared-styles.ts` | UX-2,3 |
| `packages/grid/package.json` | ARCH-2,5 |
| `vitest.config.ts` | TEST-1,3 |
| `.github/workflows/ci.yml` | TEST-3 |
