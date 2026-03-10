# phz-grid Refactoring Plan — Consumer-Facing Quality Pass

**Date**: 2026-03-06
**Goal**: Make the grid, admin, and criteria packages work correctly as an integrated consumer experience in React/Next.js (and later Vue/Angular).

---

## Problem Statement

The engine internals are solid (3,500+ tests, clean TS build, correct npm packaging). But the **consumer-facing surface** — what a React developer experiences — has real integration bugs, disconnected components, and fragile patterns. This refactoring fixes the "last mile."

---

## Work Packages

### WP-1: Install @lit/react and rewrite React wrappers
**Priority**: CRITICAL | **Effort**: Medium | **Risk**: Low

**Why**: The hand-rolled React wrappers have event name mismatches, 70-prop useEffect arrays, and direct access to private Lit fields. `@lit/react`'s `createComponent()` eliminates all of this automatically.

**Tasks**:
1. `npm install @lit/react` in packages/react
2. Rewrite `PhzGrid` using `createComponent()` from @lit/react
   - Map all public events (grid-ready, cell-click, sort-change, etc.)
   - Let @lit/react handle property discovery automatically
   - Keep `useImperativeHandle` for GridApi exposure via `grid-ready` event
3. Rewrite `PhzGridAdmin` using `createComponent()`
4. Rewrite `PhzSelectionCriteria` using `createComponent()`
5. Rewrite `PhzFilterDesigner` using `createComponent()`
6. Rewrite `PhzFilterConfigurator` using `createComponent()`
7. Rewrite `PhzPresetAdmin` using `createComponent()`
8. Update PhzGridProps type to match @lit/react's generated types
9. Keep `settingsToGridProps()` utility — it's good
10. Keep all hooks — they add convenience value on top of the wrapped component

**Acceptance**: All React wrappers use @lit/react. No manual addEventListener. No private field access.

**Files**:
- packages/react/package.json (add @lit/react dep)
- packages/react/src/phz-grid.ts (rewrite)
- packages/react/src/phz-grid-admin.ts (rewrite)
- packages/react/src/phz-selection-criteria.ts (rewrite)
- packages/react/src/phz-filter-designer.ts (rewrite)
- packages/react/src/phz-filter-configurator.ts (rewrite)
- packages/react/src/phz-preset-admin.ts (rewrite)

---

### WP-2: Add public API methods to Web Components
**Priority**: CRITICAL | **Effort**: Small | **Risk**: Low

**Why**: The React wrappers need stable public methods, not private `_field` access.

**Tasks**:
1. `<phz-grid>`: Add `getGridApi(): GridApi | null` public method
2. `<phz-selection-criteria>`: Add public methods:
   - `getContext(): SelectionContext`
   - `setContext(ctx: SelectionContext): void`
   - `apply(): void`
   - `reset(): void`
   - `openDrawer(): void`
   - `closeDrawer(): void`
3. Verify `<phz-grid-admin>` already has `getSettings()` and `setSettings()` (confirmed working)
4. `<phz-filter-designer>`: Add `getDefinition()`, `setDefinition()` if missing
5. Add tests for all new public methods

**Acceptance**: Every method the React wrapper calls is a documented public method, not a private field.

**Files**:
- packages/grid/src/components/phz-grid.ts
- packages/criteria/src/components/phz-selection-criteria.ts
- packages/criteria/src/components/phz-filter-designer.ts

---

### WP-3: Add side-effect-free subpath exports
**Priority**: HIGH | **Effort**: Small | **Risk**: Low

**Why**: Importing `@phozart/phz-grid` pulls in Lit custom element registrations, breaking Next.js SSR. Consumers need to import utilities (themes, tokens, types) without triggering registration.

**Tasks**:
1. Create `packages/grid/src/themes-only.ts` — re-exports from themes.ts without importing any components
2. Create `packages/grid/src/tokens-only.ts` — re-exports token constants only
3. Add subpath exports to packages/grid/package.json:
   ```json
   "./themes": { "types": "./dist/themes-only.d.ts", "import": "./dist/themes-only.js" },
   "./tokens": { "types": "./dist/tokens-only.d.ts", "import": "./dist/tokens-only.js" }
   ```
4. Update test app to use `import { applyGridTheme } from '@phozart/phz-grid/themes'`
5. Document the SSR-safe imports in README

**Acceptance**: `import { applyGridTheme } from '@phozart/phz-grid/themes'` works in SSR without triggering Lit.

**Files**:
- packages/grid/src/themes-only.ts (new)
- packages/grid/src/tokens-only.ts (new)
- packages/grid/package.json (add exports)

---

### WP-4: Fix sideEffects declarations
**Priority**: HIGH | **Effort**: Tiny | **Risk**: Low

**Why**: 5 packages with Lit @customElement decorators declare `"sideEffects": false`, which lets tree-shakers drop custom element registrations.

**Tasks**:
1. Audit each package for @customElement usage
2. Update package.json sideEffects for:
   - `@phozart/phz-widgets` — add `"sideEffects": ["dist/**/*.js"]` or specific component paths
   - `@phozart/phz-criteria` — same
   - `@phozart/phz-grid-admin` — same
   - `@phozart/phz-engine-admin` — same
   - `@phozart/phz-grid-creator` — check and fix if needed
3. Verify `@phozart/phz-grid` existing sideEffects paths match actual dist structure

**Acceptance**: `npm pack` + tree-shaker simulation doesn't drop any component registrations.

**Files**:
- packages/widgets/package.json
- packages/criteria/package.json
- packages/grid-admin/package.json
- packages/engine-admin/package.json
- packages/grid-creator/package.json
- packages/grid/package.json (verify)

---

### WP-5: Build grid orchestration layer
**Priority**: HIGH | **Effort**: Medium | **Risk**: Medium

**Why**: Grid, Admin, Criteria are disconnected islands. A React developer has to manually wire events. We need a compound component or hook that ties them together.

**Tasks**:
1. Create `useGridOrchestrator()` hook in packages/react:
   ```typescript
   const { gridProps, criteriaProps, adminProps, gridApi } = useGridOrchestrator({
     data, columns, theme, ...baseConfig
   });
   // Then: <PhzGrid {...gridProps} />, <PhzSelectionCriteria {...criteriaProps} />
   ```
   - Manages shared state between grid, criteria, admin
   - When criteria applies filters → automatically applies to grid
   - When admin changes settings → automatically converts to grid props
   - Provides a single `gridApi` ref
2. Create `<PhzGridSuite>` compound component as optional convenience:
   ```tsx
   <PhzGridSuite data={data} columns={columns}>
     {/* Auto-renders grid + toolbar + optional criteria + optional admin */}
   </PhzGridSuite>
   ```
3. Document the wiring in JSDoc + README examples

**Acceptance**: A React developer can get grid + criteria + admin working with <10 lines of code.

**Files**:
- packages/react/src/hooks/use-grid-orchestrator.ts (new)
- packages/react/src/phz-grid-suite.ts (new)
- packages/react/src/index.ts (add exports)

---

### WP-6: Fix toolbar-grid event wiring
**Priority**: HIGH | **Effort**: Tiny | **Risk**: Low

**Why**: Already partially fixed (added `.grid=${this}`), but the event name mismatches between toolbar and grid are still present and confusing for maintainability.

**Tasks**:
1. Verify the `.grid=${this}` fix from this session is working
2. Clean up dead event listeners in `_renderToolbar()` that will never fire (the ones with wrong names that we already replaced with correct `toolbar-*` names)
3. Add a test verifying toolbar density toggle changes grid density
4. Add a test verifying toolbar search propagates to grid

**Acceptance**: All toolbar actions work through both the direct `.grid` path and the event path.

**Files**:
- packages/grid/src/components/phz-grid.ts (already edited, verify)
- packages/grid/src/__tests__/toolbar-integration.test.ts (new)

---

### WP-7: Playwright e2e test setup
**Priority**: MEDIUM | **Effort**: Medium | **Risk**: Low

**Why**: 3,500 unit tests but zero browser tests. The density bug proves unit tests don't catch integration failures in Web Components.

**Tasks**:
1. Set up Playwright in the test app (Next.js)
2. Write 5 core e2e tests:
   - Grid renders with data
   - Theme switching works (dark → light → midnight)
   - Density toggle changes row spacing
   - Sorting a column reorders rows
   - Selecting rows shows selection count
3. Add to CI workflow

**Acceptance**: `npx playwright test` passes 5 core scenarios.

**Files**:
- test/playwright.config.ts (new)
- test/e2e/grid-basic.spec.ts (new)
- test/package.json (add playwright dep)

---

### WP-8: Clean up Python package
**Priority**: LOW | **Effort**: Tiny | **Risk**: None

**Why**: `packages/python/` is a 191-byte stub in the npm workspace. If it's meant to be a pip package, it doesn't belong here.

**Tasks**:
1. Move packages/python/ to a separate top-level directory (e.g., `python/`) outside the npm workspace
2. Or mark it as excluded from workspaces if it needs to stay
3. Update root package.json workspaces glob if needed

**Acceptance**: `npm pack` on root doesn't include python stub. npm workspace is clean.

**Files**:
- package.json (root, workspace config)
- packages/python/ → python/ (move)

---

## Execution Order

```
Phase 1 (parallel — no dependencies):
  ├── WP-2: Public API methods on Web Components
  ├── WP-3: Subpath exports for SSR
  ├── WP-4: Fix sideEffects declarations
  ├── WP-6: Toolbar-grid event wiring verification
  └── WP-8: Python package cleanup

Phase 2 (depends on WP-2):
  └── WP-1: @lit/react React wrapper rewrite

Phase 3 (depends on WP-1):
  └── WP-5: Grid orchestration layer

Phase 4 (depends on WP-1 + WP-5):
  └── WP-7: Playwright e2e tests
```

---

## Quality Gates

After each phase:
1. `tsc --build` — 0 errors
2. `npm test` — all 3,500+ tests pass
3. `npm pack` from each changed package — verify contents
4. Test app (`npm run dev` in /test) — renders, theme switching works, density works

---

## Risk Assessment

| WP | Risk | Mitigation |
|----|------|-----------|
| WP-1 (@lit/react) | Medium — biggest code change | Keep old wrappers as fallback branch. @lit/react is stable (graduated from labs). |
| WP-5 (orchestration) | Medium — new abstraction | Start with hook only, compound component optional. Don't over-engineer. |
| All others | Low | Small, isolated changes with clear tests. |
