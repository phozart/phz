# UX Improvement Project — phz-grid

**Version**: 1.0
**Created**: 2026-03-13
**Status**: Active
**Owner**: Peter H

---

## Project Goal

Improve end-user experience of the admin (workspace) and viewer panels by reducing friction, increasing discoverability, and minimizing clicks to accomplish tasks. All improvements must follow existing architecture patterns (headless core + Lit rendering, three-shell architecture, controller pattern, CSS custom properties).

---

## Tier 1: Quick Wins (High Impact, Low Effort)

| ID     | Item                                 | Package(s) | Status | Sprint |
| ------ | ------------------------------------ | ---------- | ------ | ------ |
| UX-001 | Command Palette (Cmd+K)              | viewer     | DONE   | T1-B1  |
| UX-002 | Recent Items & Favorites Persistence | viewer     | DONE   | T1-B1  |
| UX-003 | Summary/Totals Row in Report View    | grid       | DONE   | T1-B1  |
| UX-004 | Multi-Column Sort in Viewer          | viewer     | DONE   | T1-B1  |
| UX-005 | Cell Tooltip on Truncation           | grid       | DONE   | T1-B1  |
| UX-006 | Copy Feedback Toast                  | grid       | DONE   | T1-B2  |

## Tier 2: Major UX Upgrades (High Impact, Medium Effort)

| ID     | Item                                    | Package(s)   | Status | Sprint |
| ------ | --------------------------------------- | ------------ | ------ | ------ |
| UX-007 | Contextual Header Actions in Viewer     | viewer, grid | DONE   | T2-B1  |
| UX-008 | Inline Column Pinning                   | core         | DONE   | T2-B1  |
| UX-009 | Saved Views / Column Layouts            | viewer, core | DONE   | T2-B1  |
| UX-010 | Dashboard Builder vs Studio Unification | workspace    | DONE   | T2-B1  |
| UX-011 | Template Gallery                        | workspace    | DONE   | T2-B1  |
| UX-012 | Widget Preview Thumbnails               | workspace    | DONE   | T2-B2  |
| UX-013 | Data Freshness Indicator                | viewer       | DONE   | T2-B2  |

## Tier 3: Delighters (Medium Impact, Higher Effort)

| ID     | Item                            | Package(s) | Status | Sprint |
| ------ | ------------------------------- | ---------- | ------ | ------ |
| UX-014 | Expression Autocomplete         | workspace  | DONE   | T3-B1  |
| UX-015 | Visual Dependency Graph         | workspace  | DONE   | T3-B1  |
| UX-016 | Drag-Drop Data Model to Canvas  | workspace  | DONE   | T3-B1  |
| UX-017 | Live Preview Toggle in Builders | workspace  | DONE   | T3-B1  |
| UX-018 | Smart Filter Recommendations    | workspace  | DONE   | T3-B1  |
| UX-019 | Report Designer Shortcut Mode   | workspace  | DONE   | T3-B2  |
| UX-020 | Row Detail Expansion in Viewer  | viewer     | DONE   | T3-B2  |

## Tier 4: Polish & Consistency

| ID     | Item                               | Package(s) | Status | Sprint |
| ------ | ---------------------------------- | ---------- | ------ | ------ |
| UX-021 | Active Filter Visibility           | viewer     | DONE   | T4-B1  |
| UX-022 | Column Chooser Lightweight Mode    | grid       | DONE   | T4-B1  |
| UX-023 | Keyboard Shortcuts Help Panel      | viewer     | DONE   | T4-B1  |
| UX-024 | Cross-Filter Source Highlighting   | viewer     | DONE   | T4-B1  |
| UX-025 | Export Progress for Large Datasets | grid       | DONE   | T4-B1  |

---

## Work Process

### Per Batch (5 items)

1. **Architecture Review** — Verify each item fits existing patterns, identify affected files
2. **Documentation** — Write architecture spec for each item before implementation
3. **TDD Implementation** — Write failing tests first, then implement
4. **Code Review** — Automated review of each implementation
5. **QA Verification** — Run full test suite, verify architecture alignment
6. **User Validation** — Present completed batch for approval before next batch

### Quality Gates

- All existing tests must pass (10,697+ tests)
- New tests required for every new feature
- No changes to existing public APIs without documentation
- Architecture alignment verified against ADRs and SYSTEM-ARCHITECTURE.md
- Build clean across all affected packages

---

## Progress Log

### T1-B1: Tier 1, Batch 1 (UX-001 through UX-005)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T1B1-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for all 5 items
- **Implementation**: DONE
- **Code Review**: DONE — 3 critical issues found and fixed
- **QA**: DONE — 10,699 tests pass (123 new), 0 regressions
- **Validation**: DONE

#### Code Review Fixes Applied

| #   | Issue                                                                          | Fix                                                |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 1   | Tooltip appended to shadow root — `position:fixed` broken by `contain:style`   | Changed to append to `document.body`               |
| 2   | `mouseout` fires on child traversal within cell — tooltip flickers             | Added `relatedTarget` check in `handleMouseOut`    |
| 3   | `date`/`datetime` columns included in `sum`/`avg` — produces timestamp numbers | Restricted summary to `col.type === 'number'` only |

#### Files Created

| File                                                 | Purpose                                | Tests    |
| ---------------------------------------------------- | -------------------------------------- | -------- |
| `viewer/src/screens/command-palette-state.ts`        | Command palette headless state machine | 34 tests |
| `grid/src/controllers/tooltip.controller.ts`         | Cell tooltip reactive controller       | 15 tests |
| `grid/src/__tests__/summary-row.test.ts`             | Summary row test suite                 | 12 tests |
| `grid/src/__tests__/tooltip-controller.test.ts`      | Tooltip controller test suite          | 15 tests |
| `viewer/src/__tests__/command-palette-state.test.ts` | Command palette test suite             | 34 tests |

#### Files Modified

| File                                             | Change                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `viewer/src/screens/catalog-state.ts`            | Added `recentItems`, `addRecentItem`, `getRecentArtifacts`, persistence helpers         |
| `viewer/src/screens/report-state.ts`             | Replaced `sort` with `sortColumns[]`, added multi-sort functions                        |
| `viewer/src/index.ts`                            | Exported all new state functions                                                        |
| `grid/src/controllers/aggregation.controller.ts` | Added `computeSummaryRow()`, `getSummaryLabel()`                                        |
| `grid/src/components/phz-grid.ts`                | Added `showSummary`, `summaryFunction`, `enableCellTooltips`, `tooltipDelay` properties |
| `grid/src/components/phz-grid.templates.ts`      | Added `renderSummaryRow()` template function                                            |
| `grid/src/components/phz-grid.styles.ts`         | Added summary row CSS                                                                   |
| `grid/src/controllers/index.ts`                  | Exported tooltip controller                                                             |

### T1-B2: Tier 1, Batch 2 (UX-006)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T1B2-ARCHITECTURE.md`
- **Documentation**: DONE
- **Implementation**: DONE
- **Code Review**: DONE — 2 issues found and fixed
- **QA**: DONE — 10,716 tests pass (17 new), 0 regressions, build clean
- **Validation**: AWAITING USER

#### Code Review Fixes Applied

| #   | Issue                                                                        | Fix                                               |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | `_toastIconPath()` typed as `string` instead of `ToastIcon`                  | Changed parameter type to `ToastIcon`             |
| 2   | `hostDisconnected` leaves stale toast — stuck on reconnect                   | Added `this.toast = null` in `hostDisconnected()` |
| 3   | Tooltip controller `addEventListener` TS overload error (pre-existing T1-B1) | Cast bound handlers to `EventListener`            |

#### Files Created

| File                                          | Purpose                    | Tests    |
| --------------------------------------------- | -------------------------- | -------- |
| `grid/src/__tests__/toast-controller.test.ts` | ToastController unit tests | 17 tests |

#### Files Modified

| File                                              | Change                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `grid/src/controllers/toast.controller.ts`        | Added `ToastOptions`, `ToastIcon`, extended `ToastInfo`, added `dismiss()` |
| `grid/src/controllers/clipboard.controller.ts`    | All toast calls pass `{ icon: 'copy' }` or `{ icon: 'error' }`             |
| `grid/src/controllers/export.controller.ts`       | All toast calls pass `{ icon: 'export' }`                                  |
| `grid/src/components/phz-grid.ts`                 | Toast template renders SVG icons, close button; added `_toastIconPath()`   |
| `grid/src/components/phz-grid.styles.ts`          | Added icon/close CSS, type colors, icon-pop animation, dark/reduced-motion |
| `grid/src/controllers/index.ts`                   | Exported `ToastOptions`, `ToastIcon`                                       |
| `grid/src/controllers/tooltip.controller.ts`      | Fixed TS overload error: cast handlers to `EventListener`                  |
| `grid/src/__tests__/clipboard-controller.test.ts` | Updated 5 assertions to include `{ icon }` option                          |

### T2-B1: Tier 2, Batch 1 (UX-007 through UX-011)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T2B1-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for all 5 items
- **Implementation**: DONE
- **Code Review**: DONE — 3 issues found and fixed + 1 build fix
- **QA**: DONE — 10,816 tests pass (100 new), 0 regressions, all packages build clean
- **Validation**: DONE

#### Code Review Fixes Applied

| #   | Issue                                                                           | Fix                                                                        |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `unpinColumn` deleted key — `getEffectivePinState` fell back to `col.frozen`    | Set `pinOverrides[field] = null` instead of delete (null takes precedence) |
| 2   | `isAdvancedFeatureUsed` returned true just for `mode === 'advanced'`            | Changed to check `globalFilters.length > 0 \|\| showDataModel`             |
| 3   | `startRename` with unknown ID returned new object (breaks referential equality) | Changed to `return state` for no-op                                        |
| 4   | `create-grid.ts` `resetColumns()` missing `pinOverrides` — TS2741 build error   | Added `pinOverrides: {}` to `resetColumns()`                               |

#### Files Created

| File                                                                  | Purpose                              | Tests    |
| --------------------------------------------------------------------- | ------------------------------------ | -------- |
| `viewer/src/__tests__/contextual-header-actions.test.ts`              | Contextual header actions test suite | 26 tests |
| `core/src/__tests__/column-pinning-state.test.ts`                     | Column pinning state test suite      | 15 tests |
| `viewer/src/__tests__/view-manager-state.test.ts`                     | View manager state test suite        | 18 tests |
| `workspace/src/engine-admin/__tests__/dashboard-editor-state.test.ts` | Dashboard editor state test suite    | 23 tests |
| `workspace/src/templates/__tests__/template-gallery-state.test.ts`    | Template gallery state test suite    | 18 tests |

#### Files Created (Source)

| File                                                   | Purpose                                      |
| ------------------------------------------------------ | -------------------------------------------- |
| `viewer/src/screens/view-manager-state.ts`             | View manager headless state machine (UX-009) |
| `workspace/src/engine-admin/dashboard-editor-state.ts` | Dashboard editor state machine (UX-010)      |
| `workspace/src/templates/template-gallery-state.ts`    | Template gallery state machine (UX-011)      |

#### Files Modified

| File                                  | Change                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `viewer/src/screens/report-state.ts`  | Added `hoveredColumn`, `HeaderActionType`, `ColumnHeaderAction`, `setHoveredColumn`, `computeHeaderActions` (UX-007) |
| `core/src/types/state.ts`             | Added `pinOverrides: Record<string, 'left' \| 'right' \| null>` to `ColumnState` (UX-008)                            |
| `core/src/state.ts`                   | Added `pinColumn`, `unpinColumn`, `getEffectivePinState` functions (UX-008)                                          |
| `core/src/create-grid.ts`             | Added `pinOverrides: {}` to `resetColumns()` (UX-008)                                                                |
| `core/src/index.ts`                   | Exported pinColumn, unpinColumn, getEffectivePinState                                                                |
| `viewer/src/index.ts`                 | Exported UX-007 and UX-009 types/functions                                                                           |
| `workspace/src/engine-admin/index.ts` | Exported UX-010 types/functions                                                                                      |
| `workspace/src/templates/index.ts`    | Exported UX-011 types/functions                                                                                      |

### T2-B2: Tier 2, Batch 2 (UX-012, UX-013)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T2B2-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for both items
- **Implementation**: DONE
- **Code Review**: DONE — 1 issue found and fixed
- **QA**: DONE — 10,884 tests pass (68 new), 0 regressions, both packages build clean
- **Validation**: DONE

#### Code Review Fixes Applied

| #   | Issue                                                                           | Fix                                                            |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `enableAutoRefresh()` without interval resets to 60_000, losing custom interval | Changed default from `60_000` to `state.autoRefreshIntervalMs` |

#### Files Created

| File                                                              | Purpose                           | Tests    |
| ----------------------------------------------------------------- | --------------------------------- | -------- |
| `workspace/src/registry/__tests__/widget-thumbnail-state.test.ts` | Widget thumbnail state test suite | 32 tests |
| `viewer/src/__tests__/data-freshness-state.test.ts`               | Data freshness state test suite   | 36 tests |

#### Files Created (Source)

| File                                               | Purpose                                 |
| -------------------------------------------------- | --------------------------------------- |
| `workspace/src/registry/widget-thumbnail-state.ts` | Widget thumbnail state machine (UX-012) |
| `viewer/src/screens/data-freshness-state.ts`       | Data freshness state machine (UX-013)   |

#### Files Modified

| File                              | Change                          |
| --------------------------------- | ------------------------------- |
| `workspace/src/registry/index.ts` | Exported UX-012 types/functions |
| `viewer/src/index.ts`             | Exported UX-013 types/functions |

### T3-B1: Tier 3, Batch 1 (UX-014 through UX-018)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T3B1-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for all 5 items
- **Implementation**: DONE
- **Code Review**: DONE — 1 build issue found and fixed
- **QA**: DONE — 11,073 tests pass (189 new), 0 regressions, workspace builds clean
- **Validation**: DONE

#### Code Review Fixes Applied

| #   | Issue                                                                                            | Fix                                                   |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | `PreviewRole` and `setPreviewRole` name collision with `dashboard-editor-state.ts` barrel export | Renamed to `LivePreviewRole` and `setLivePreviewRole` |

#### Files Created

| File                                                                         | Purpose                            | Tests    |
| ---------------------------------------------------------------------------- | ---------------------------------- | -------- |
| `workspace/src/engine-admin/__tests__/expression-autocomplete-state.test.ts` | Expression autocomplete test suite | 41 tests |
| `workspace/src/engine-admin/__tests__/dependency-graph-view-state.test.ts`   | Dependency graph view test suite   | 43 tests |
| `workspace/src/authoring/__tests__/field-drop-inference-state.test.ts`       | Field drop inference test suite    | 38 tests |
| `workspace/src/authoring/__tests__/live-preview-state.test.ts`               | Live preview state test suite      | 41 tests |
| `workspace/src/filters/__tests__/filter-recommendation-state.test.ts`        | Filter recommendation test suite   | 26 tests |

#### Files Created (Source)

| File                                                          | Purpose                                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `workspace/src/engine-admin/expression-autocomplete-state.ts` | Expression autocomplete state machine (UX-014)     |
| `workspace/src/engine-admin/dependency-graph-view-state.ts`   | Dependency graph view state machine (UX-015)       |
| `workspace/src/authoring/field-drop-inference-state.ts`       | Field drop inference state machine (UX-016)        |
| `workspace/src/authoring/live-preview-state.ts`               | Live preview toggle state machine (UX-017)         |
| `workspace/src/filters/filter-recommendation-state.ts`        | Smart filter recommendation state machine (UX-018) |

#### Files Modified

| File                                  | Change                                     |
| ------------------------------------- | ------------------------------------------ |
| `workspace/src/engine-admin/index.ts` | Exported UX-014 and UX-015 types/functions |
| `workspace/src/authoring/index.ts`    | Exported UX-016 and UX-017 types/functions |
| `workspace/src/filters/index.ts`      | Exported UX-018 types/functions            |

### T3-B2: Tier 3, Batch 2 (UX-019, UX-020)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T3B2-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for both items
- **Implementation**: DONE
- **Code Review**: DONE — 2 issues found and fixed
- **QA**: DONE — 11,193 tests pass (120 new), 0 regressions, both packages build clean
- **Validation**: AWAITING USER

#### Code Review Fixes Applied

| #   | Issue                                                                  | Fix                                                     |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | `setDetailSearch` missing same-value no-op guard (spurious re-renders) | Added `if (state.searchQuery === query) return state`   |
| 2   | `scrollToDetailField` missing same-value no-op guard                   | Added `if (state.scrollToField === field) return state` |
| 3   | Factory vs deactivated state inconsistency for `matchedSequences`      | Changed factory to start with `matchedSequences: []`    |

#### Files Created

| File                                                            | Purpose                        | Tests    |
| --------------------------------------------------------------- | ------------------------------ | -------- |
| `workspace/src/authoring/__tests__/shortcut-mode-state.test.ts` | Shortcut mode state test suite | 62 tests |
| `viewer/src/__tests__/row-detail-state.test.ts`                 | Row detail state test suite    | 58 tests |

#### Files Created (Source)

| File                                             | Purpose                                     |
| ------------------------------------------------ | ------------------------------------------- |
| `workspace/src/authoring/shortcut-mode-state.ts` | Shortcut mode state machine (UX-019)        |
| `viewer/src/screens/row-detail-state.ts`         | Row detail expansion state machine (UX-020) |

#### Files Modified

| File                               | Change                          |
| ---------------------------------- | ------------------------------- |
| `workspace/src/authoring/index.ts` | Exported UX-019 types/functions |
| `viewer/src/index.ts`              | Exported UX-020 types/functions |

### T4-B1: Tier 4, Batch 1 (UX-021 through UX-025)

- **Started**: 2026-03-13
- **Architecture Review**: DONE — see `docs/plans/UX-T4B1-ARCHITECTURE.md`
- **Documentation**: DONE — architecture specs written for all 5 items
- **Implementation**: DONE
- **Code Review**: DONE — 3 issues found and fixed
- **QA**: DONE — 11,446 tests pass (253 new), 0 regressions, viewer and grid build clean
- **Validation**: AWAITING USER

#### Code Review Fixes Applied

| #   | Issue                                                            | Fix                     |
| --- | ---------------------------------------------------------------- | ----------------------- |
| 1   | Dead variable `col` in `toggleColumnVisible` (UX-022)            | Removed unused variable |
| 2   | Empty test body with contradictory title (UX-025)                | Removed hollow test     |
| 3   | Unused `ALL_CATEGORIES` constant in keyboard-help-state (UX-023) | Removed dead constant   |

#### Files Created

| File                                                        | Purpose                             | Tests    |
| ----------------------------------------------------------- | ----------------------------------- | -------- |
| `viewer/src/__tests__/active-filter-state.test.ts`          | Active filter visibility test suite | 50 tests |
| `grid/src/__tests__/column-quick-toggle-state.test.ts`      | Column quick toggle test suite      | 58 tests |
| `viewer/src/__tests__/keyboard-help-state.test.ts`          | Keyboard help state test suite      | 53 tests |
| `viewer/src/__tests__/cross-filter-highlight-state.test.ts` | Cross-filter highlight test suite   | 26 tests |
| `grid/src/__tests__/export-progress-state.test.ts`          | Export progress state test suite    | 66 tests |

#### Files Created (Source)

| File                                                 | Purpose                                         |
| ---------------------------------------------------- | ----------------------------------------------- |
| `viewer/src/screens/active-filter-state.ts`          | Active filter visibility state machine (UX-021) |
| `grid/src/controllers/column-quick-toggle-state.ts`  | Column quick toggle state machine (UX-022)      |
| `viewer/src/screens/keyboard-help-state.ts`          | Keyboard shortcuts help state machine (UX-023)  |
| `viewer/src/screens/cross-filter-highlight-state.ts` | Cross-filter highlight state machine (UX-024)   |
| `grid/src/controllers/export-progress-state.ts`      | Export progress state machine (UX-025)          |

#### Files Modified

| File                            | Change                                          |
| ------------------------------- | ----------------------------------------------- |
| `viewer/src/index.ts`           | Exported UX-021, UX-023, UX-024 types/functions |
| `grid/src/controllers/index.ts` | Exported UX-022 and UX-025 types/functions      |
