# Review Fixes Tracker — 2026-03-05

## Batch Status

| Batch | Focus | Status |
|-------|-------|--------|
| 1 | Security (4 critical/high) | COMPLETE |
| 2 | Core bugs (3 fixes) | COMPLETE |
| 3 | Build system + naming + community | IN PROGRESS |
| 4 | A11y critical fixes | PENDING |
| 5 | Packaging (tree-shaking, deps) | MOSTLY COMPLETE |
| 6 | Doc contract cleanup | **COMPLETE** |
| 7 | TypeScript errors (was 122) | **COMPLETE — 0 errors** |

## Completed Fixes

### Batch 1 — Security
- [x] SEC-002: XSS annotation id escape (`widgets/annotations.ts`)
- [x] SEC-003: XSS data: URL in link cells (`grid/renderers/built-in.ts`)
- [x] SEC-004: Parquet URL injection (`duckdb/parquet-loader.ts`)
- [x] SEC-001: SQL injection computed fields — `sanitizeExpression()` added (`duckdb-compute-backend.ts`)

### Batch 2 — Core Bugs
- [x] `gridState.columnDefs` phantom property → `getAccessibleColumns()` (`grid-core.controller.ts`)
- [x] `gridApi.destroy()` never called → memory leak fixed (`grid-core.controller.ts`)
- [x] Empty `IN ()` SQL syntax error → guards added (`sql-builder.ts`)
- [x] Default case `1=1` → throws Error (`sql-builder.ts`)
- [x] DuckDB bridge `refresh()` unhandled async → `.catch()` added (`duckdb-bridge.ts`)

### Batch 3 — Build/Infrastructure
- [x] Community files: CONTRIBUTING.md, CODE_OF_CONDUCT.md, 2 package READMEs
- [x] Core types index: added `views.ts` and `grid-presentation.ts` exports
- [ ] ESLint config — AWAITING agent
- [ ] Coverage thresholds + vitest aliases — AWAITING agent
- [ ] Enterprise → ExtensionState rename — AWAITING agent
- [ ] CLAUDE.md update — AWAITING agent

### Batch 7 — TypeScript Errors (ALL FIXED)

**Sprint 7 Features Implemented:**
- [x] `StatePriority` type ('immediate' | 'deferred' | 'background')
- [x] `StateManager.setState()` — `{ priority }` option
- [x] `notifyImmediate()` — sync dispatch
- [x] `notifyBackground()` — `setTimeout(fn, 0)`
- [x] `getPendingPriorities()` — returns scheduled tiers
- [x] `destroy()` — clears background timer + pending priorities
- [x] `SavedView.presentation?: GridPresentation` field
- [x] `SaveViewOptions.presentation` field
- [x] `ViewsManager.saveView()` — stores presentation
- [x] `ViewsManager.loadView()` — returns `SavedView` (was `SerializedGridState`)
- [x] `ViewsManager.saveCurrentToView()` — accepts options with presentation
- [x] `ViewsManager.isViewDirty()` — accepts presentation param

**Type Fixes:**
- [x] `ColumnAccessConfig.mask` — now `string | ((value) => string)` (was function-only)
- [x] `AsyncDataSource` — added optional `serverFetch` and `capabilities`
- [x] `GridApi.getGroupedRowModel()` — returns `GroupedRowModel` (was `CoreRowModel`)
- [x] `create-grid.ts` — `loadView` uses `view.state`, cache typed as `GroupedRowModel`
- [x] `create-grid.ts` — mask handling checks string vs function
- [x] `cdn-all.ts` — fixed duplicate exports, removed non-existent re-exports
- [x] `cell-formatter.ts` — `renderCell` → `renderer`, date type handling
- [x] `collab-session.ts` — changedFields typed as `StateChange[]`
- [x] `virtual-scroll.controller.ts` — host type cast for `dispatchGridEvent`
- [x] `group.controller.ts` — uses `GroupedRowModel.groups` directly
- [x] `export.controller.ts` — gridLines type widened

**Test Fixes:**
- [x] `views.test.ts` — adapted `loadView()` returning `SavedView`
- [x] `event-emitter.test.ts` — `SortChangeEvent` shape aligned (agent)
- [x] `row-model.test.ts` — removed `globalSearch`, added missing VirtualizationState fields (agent)
- [x] `state-manager.test.ts` — `UserRole[]` cast for `requiredRoles`
- [x] `cf-controller.test.ts` — anomaly mock aligned with `AnomalyResult` type
- [x] `group-controller.test.ts` — `groupRows` → `groupBy`/`getGroupedRowModel`
- [x] `grid-core-controller.test.ts` — added `resetColumns` to mock
- [x] `clipboard-controller.test.ts` — `buildCopyText` returns `{ text }`, `formatCellForCopy` args
- [x] `ai-executor.test.ts` — mock function signature with `error?` and options param

## Test Results
- **Before fixes**: 3493 tests, 0 failures
- **After all fixes**: 3508 tests, 0 failures
- **TypeScript build**: 0 errors (`tsc --build` clean)

## Remaining Issues (by priority)

### P1 — A11y Critical (Batch 4 — PENDING)
- [ ] `KeyboardNavigator.attach()` never called (keyboard nav non-functional)
- [ ] `announceSortChange()` doesn't exist on AriaManager
- [ ] Group rows: no `aria-expanded`, `aria-level`
- [ ] Column chooser checkboxes not keyboard-operable
- [ ] Filter popover values not keyboard-focusable
- [ ] Row action buttons invisible to keyboard
- [ ] Cell editor input has no accessible label
- [ ] Color contrast failures (header text ~2.5:1)

### P2 — Packaging (Batch 5 — MOSTLY COMPLETE)
- [x] `export * from '@phozart/phz-core'` in 7 packages (kills tree-shaking) — removed by packaging agent
- [ ] `sideEffects: ["**/*.ts", "**/*.js"]` in grid (disables tree-shaking)
- [x] Grid undeclared dep on `@phozart/phz-engine` — added to dependencies
- [x] React adapter bloated hard deps → peer deps — engine restored as dep, grid-admin/criteria as optional peers
- [ ] 6 packages with custom elements marked `sideEffects: false`
- [x] Dependency audit: fixed 6 package.json files (grid, ai, engine, definitions, grid-creator, react)

### P3 — Doc Contract Cleanup (Batch 6 — COMPLETE)
- [x] Enterprise labels in API-CONTRACTS.md
- [x] Enterprise labels in TYPE-CONTRACTS.md
- [x] Enterprise labels in SYSTEM-ARCHITECTURE.md
- [x] Enterprise labels in DATA-MODEL.md
- [x] Enterprise labels in CONTRACT-GOVERNANCE.md
- [x] Enterprise labels in ADR-002, ADR-004, ADR-005, ADR-007
- [x] Enterprise labels in FEATURE-ROADMAP.md
- [ ] Enterprise labels in filter-guide.html example
- [x] Python contracts: `phz-grid-enterprise` pip reference — renamed to `phz-grid-extras`

### P4 — Medium Priority (Future)
- [ ] `clearSort(field)` wrong signature
- [ ] `isDirty()` semantics don't match contract
- [ ] `RowModel` vs `CoreRowModel` naming
- [ ] `FilterOperator` contract divergence
- [ ] `Function()` constructor in metric.ts (CSP)
- [ ] CSS injection via conditional formatting
- [ ] Credential in DOM event
- [ ] Prompt injection via column names in AI
- [ ] Weak `Math.random()` for collab session IDs
- [ ] ReDoS risk in regex patterns
- [ ] FilterExpression AST → SQL translation missing
- [ ] QueryPlanner not wired in
- [ ] `JSON.stringify` overuse for comparisons
- [ ] No Playwright/E2E test infrastructure
