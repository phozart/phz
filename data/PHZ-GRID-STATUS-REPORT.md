# phz-grid Monorepo — Status Report

**Date:** March 7, 2026
**Scope:** Full package audit, visual testing, and systematic bug fixes

---

## What Was Done

### 1. Package Documentation

All 16 packages in the monorepo were explored and documented:

**Core Runtime** — `core` (headless data engine), `grid` (Lit Web Component renderer), `engine` (BI/analytics engine with DuckDB), `duckdb` (WASM adapter)

**Filter System** — `criteria` (selection criteria UI), `definitions` (filter serialization/schema)

**Admin & Config** — `grid-admin` (grid configuration panel), `engine-admin` (BI dashboard builder), `grid-creator` (setup wizard)

**Framework Adapters** — `react`, `vue`, `angular` (wrapper components via @lit/react, @lit/vue, etc.)

**Extras** — `widgets` (charts, gauges, KPIs), `collab` (Yjs real-time collaboration), `ai` (LLM integration), `python` (Jupyter widget)

### 2. Visual Testing (localhost:3001)

Tested the Next.js integration app through browser automation:

| Feature | Result |
|---|---|
| Grid rendering (10 rows, 6 columns) | Working |
| Column sorting (ascending/descending indicators) | Working |
| Row selection (highlight, count badge, action buttons) | Working |
| Criteria panel (drawer, chip groups) | Working |
| Filter apply/reset | Working |
| Admin panel — Table Settings tab | Working |
| Admin panel — Columns tab | Working |
| Admin panel — Formatting tab | Working (after fix) |
| Admin panel — Filters tab | Working (after fix) |
| Admin panel — Export tab | Working (after fix) |
| Theme switching (Dark, Light, Sand, Midnight, Forest) | Working |

### 3. Critical Bug Class Found & Fixed

**The Problem:** Lit Web Components declare array/object properties with defaults via `@property() myArray = []`. When React consumers don't pass a prop, the `@lit/react` `createComponent` wrapper passes `undefined`, which *overwrites* the Lit default. Any subsequent `.map()`, `.length`, `.filter()` call on that property crashes with `TypeError: Cannot read properties of undefined`.

This is a systematic interop issue between Lit's property system and React's prop-passing model. It affects every optional array or object property on every component.

**The Fix (two layers):**

Layer 1 — **Lit components**: Nullish coalescing on every array/object access: `(this.items ?? []).map(...)` instead of `this.items.map(...)`. This is defense-in-depth regardless of which framework consumes the component.

Layer 2 — **React wrappers**: Strip undefined keys before passing to `createElement`, so Lit's `@property()` defaults remain intact:
```typescript
for (const key of Object.keys(litProps)) {
  if (litProps[key] === undefined) delete litProps[key];
}
```

### 4. Fix Counts by Package

| Package | Files Modified | Fixes Applied |
|---|---|---|
| grid-admin | 9 files | 63 |
| criteria | 17 files | 112 |
| engine-admin | 11 files | 61 |
| widgets | 6 files | 18 |
| react | 7 files | 11 |
| **Total** | **50 files** | **265** |

### 5. Additional Cleanup

- Removed 4 stale `@ts-expect-error` directives from React wrappers (criteria package `.d.ts` files now exist, making the suppressions unnecessary)
- All 5 fixed packages pass `npx tsc --noEmit` with zero errors

---

## Package Architecture (for reference)

```
phz-grid/packages/
├── core/          Headless data engine (sorting, filtering, selection, pagination)
├── grid/          Lit Web Component <phz-grid> — renders the actual table
├── engine/        BI analytics engine (measures, dimensions, pivots)
├── duckdb/        DuckDB WASM adapter for in-browser SQL
├── criteria/      <phz-selection-criteria> filter bar + drawer UI
├── definitions/   Filter definition schema, serialization, rule engine
├── grid-admin/    <phz-grid-admin> config panel (columns, formatting, export, etc.)
├── engine-admin/  <phz-engine-admin> BI dashboard builder
├── grid-creator/  Setup wizard for new grid instances
├── react/         React wrappers via @lit/react createComponent
├── vue/           Vue wrappers
├── angular/       Angular wrappers
├── widgets/       Charts, gauges, KPI scorecards, dashboards
├── collab/        Yjs-based real-time collaboration
├── ai/            LLM integration for natural-language queries
└── python/        Jupyter notebook widget
```

---

## What's Still Needed

**Before Publishing as npm Packages:**

1. **Rebuild dist files** for criteria, widgets, and engine-admin (source is fixed, dist needs regeneration with whatever build tool each package uses — likely `tsc` or Rollup)

2. **API consistency audit** — Review prop naming, event naming, and imperative API patterns across all packages for consistency. Some patterns observed that could be tightened:
   - Event naming: some use `detail-verb` (e.g., `definition-create`), others use `verb-noun`. Should be uniform.
   - Prop typing: Many props are typed as `any` or `any[]`. Stronger types would improve DX and catch bugs at compile time.
   - The React wrappers all use `wrapDetail()` to unwrap CustomEvent detail — this is good and consistent.

3. **Vue and Angular wrapper audit** — The same undefined-override bug likely exists in the Vue and Angular wrappers. They weren't audited yet because the test apps only use React.

4. **Test coverage** — The test files that exist (`*.test.ts`) should be run to verify nothing regressed. Some test files also got `?? []` fixes (they had the same patterns in test setup code).

5. **Documentation** — Each package needs a README with props table, events table, and usage examples. The current code is well-structured but lacks consumer-facing docs.
