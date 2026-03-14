# ADR-001: Headless Core + Lit Rendering Layer Separation

## Status
Accepted

## Context

Data grid libraries traditionally bundle state management with rendering, creating tight coupling that prevents:
1. Framework-agnostic usage (AG Grid has separate React/Vue/Angular packages with duplicated logic)
2. Custom rendering (requires forking the library or fighting abstractions)
3. Server-side usage (grids crash when imported in Node.js due to DOM dependencies)
4. Web Worker offloading (can't move computation to workers if state depends on DOM)

TanStack Table pioneered the "headless UI" pattern successfully, proving developers want full control over rendering. However, most teams still need a default rendering implementation to avoid rebuilding the wheel.

The challenge: How do we provide both flexibility (headless) and convenience (batteries-included rendering)?

## Decision

We will architect phz-grid as TWO separate layers:

1. **`@phozart/core`** — Headless grid engine
   - Zero dependencies (except TypeScript)
   - Zero DOM access (runs in Node.js, Web Workers, or browser)
   - Pure state management: data model, sorting, filtering, selection, virtualization calculations
   - Typed event system for state changes
   - Hook registry for extensibility
   - Published as separate npm package

2. **`@phozart/grid`** — Lit Web Components rendering layer
   - Depends on `@phozart/core` and `lit@^5`
   - Provides default DOM rendering with virtualization
   - Implements accessibility features (ARIA, keyboard nav, semantic shadow)
   - Exports `<phz-grid>` custom element
   - Published as separate npm package

### API Boundaries

```typescript
// @phozart/core - Pure logic, no DOM
export interface GridApi {
  // State accessors
  getState(): GridState;
  getRowData(): RowData[];
  getColumns(): ColumnDef[];

  // State mutations (pure functions, return new state)
  setRowData(data: RowData[]): void;
  setSortModel(sort: SortModel): void;
  setFilterModel(filter: FilterModel): void;

  // Event subscription
  on<K extends keyof GridEvents>(event: K, handler: (payload: GridEvents[K]) => void): () => void;

  // Hook registration
  registerHook(hookName: string, handler: Function): string;
  unregisterHook(hookId: string): void;
}

// @phozart/grid - Rendering implementation
export class PhzGrid extends LitElement {
  @property() api: GridApi;

  render() {
    return html`
      <div class="grid-container">
        ${this.renderHeaders()}
        ${this.renderVirtualizedRows()}
      </div>
    `;
  }
}
```

### Usage Patterns Enabled

**Pattern 1: Default Rendering (90% of users)**
```typescript
import { PhzGrid } from '@phozart/grid';

<phz-grid .data=${data} .columns=${columns}></phz-grid>
```

**Pattern 2: Headless (Advanced users)**
```typescript
import { createGrid } from '@phozart/core';
import { useGridState } from '@phozart/react';

function MyCustomGrid() {
  const grid = useGridState(createGrid({ data, columns }));

  return (
    <MyCustomRenderer rows={grid.visibleRows} />
  );
}
```

**Pattern 3: Hybrid (Custom components, default virtualization)**
```typescript
import { PhzGrid } from '@phozart/grid';

<phz-grid .data=${data} .columns=${columns}>
  <template slot="cell-renderer-status">
    <custom-status-badge .value=${value}></custom-status-badge>
  </template>
</phz-grid>
```

## Consequences

### Positive

1. **Framework Agnostic** — Core engine works in React, Vue, Angular, Svelte, vanilla JS
2. **Testable** — Core logic tested without DOM (faster unit tests, no JSDOM)
3. **Server-Safe** — Core can be imported in Next.js/Nuxt SSR without crashing
4. **Worker-Ready** — State management can move to Web Workers for background processing
5. **Bundle Size** — Headless users pay zero cost for Lit rendering
6. **Flexibility** — TanStack-style full control for advanced users
7. **Convention over Configuration** — Default rendering for quick starts
8. **Upgrade Path** — Users can start with `@phozart/grid`, drop down to `@phozart/core` later

### Negative

1. **API Surface Complexity** — Two packages means two APIs to document
2. **Versioning Coordination** — Core and grid must stay in sync (mitigated by monorepo)
3. **Learning Curve** — Developers must understand headless pattern
4. **Potential Duplication** — Framework adapters (React/Vue) might duplicate some core logic if not careful

### Neutral

1. **Bundle Size Trade-off** — Users who want default rendering pay for Lit (~7 KB), but this is still 10x smaller than AG Grid
2. **Migration from AG Grid** — Two-package architecture is different from AG Grid's monolithic approach, but framework adapters bridge the gap

## Alternatives Considered

### Alternative 1: Monolithic Library (AG Grid-style)
**Rejected** because it forces rendering opinions on all users and prevents framework-agnostic usage.

### Alternative 2: Pure Headless (TanStack Table-style)
**Rejected** because 90% of users don't want to implement virtualization from scratch.

### Alternative 3: Render Props Pattern (React-specific)
**Rejected** because it locks us into React ecosystem.

## References

- [TanStack Table v8 Headless Architecture](https://tanstack.com/table/v8/docs/guide/introduction)
- [Lit Web Components Framework](https://lit.dev/)
- [AG Grid React/Vue/Angular packages duplication problem](https://www.ag-grid.com/react-data-grid/)
- [Headless UI Movement - Kent C. Dodds](https://kentcdodds.com/blog/headless-user-interface-components)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Engineering Leads, Product Manager
