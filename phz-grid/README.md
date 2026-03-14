# phozart

A modular data grid and BI system built on Web Components. Accessible by design. Composable by architecture.

19 packages. One signal path. Zero compromises on accessibility.

```
npm install @phozart/react
```

```tsx
import { PhzGrid } from '@phozart/react';

<PhzGrid
  data={salesData}
  columns={[
    { field: 'region', header: 'Region', type: 'string' },
    { field: 'revenue', header: 'Revenue', type: 'number' },
    { field: 'date', header: 'Date', type: 'date' },
  ]}
  selectionMode="multi"
  density="compact"
  theme="auto"
/>;
```

That's it. Sort, filter, edit, keyboard nav, screen reader support, virtual scroll, export -- all included. No enterprise license required.

---

## Why phozart

**Accessibility is not a feature. It's the engineering discipline.**

Existing data grids treat accessibility as an afterthought -- or worse, lock it behind enterprise pricing. phozart was built because screen reader users, keyboard-only users, and high contrast mode users deserve the same experience as everyone else. Every component is engineered for accessible interaction from the ground up.

See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for the full story.

**Modular by design.**

phozart is a system of composable packages, not a monolith. Use the grid alone (84 KB gzipped), add analytics and dashboards when you need them, or deploy a full BI platform. Each package does one thing deeply. The power is in how they compose.

See [docs/PATCH-BOOK.md](docs/PATCH-BOOK.md) for composition patterns.

---

## Modules

### Core Signal Path

| Package            | Description                                                           | Gzipped |
| ------------------ | --------------------------------------------------------------------- | ------- |
| `@phozart/core`    | Headless grid engine -- data model, state, events, row pipeline       | 11.5 KB |
| `@phozart/grid`    | Web Components rendering -- Lit, virtualization, a11y, theming        | 72.0 KB |
| `@phozart/engine`  | BI engine -- aggregation, pivots, KPIs, drill-through, expressions    | 44.0 KB |
| `@phozart/widgets` | Dashboard widgets -- bar chart, KPI card, trend line, scorecard       | 53.4 KB |
| `@phozart/shared`  | Shared infrastructure -- adapters, types, design tokens, coordination | 42.2 KB |

### Framework Adapters

| Package            | Description                                                     | Gzipped    |
| ------------------ | --------------------------------------------------------------- | ---------- |
| `@phozart/react`   | React wrapper with typed props, `forwardRef` for GridApi access | 245.8 KB\* |
| `@phozart/vue`     | Vue adapter (factory pattern)                                   | 2.1 KB     |
| `@phozart/angular` | Angular adapter (factory pattern)                               | 2.4 KB     |

_\*Includes Lit runtime and all grid dependencies._

### Data Sources

| Package             | Description                                                    | Gzipped |
| ------------------- | -------------------------------------------------------------- | ------- |
| `@phozart/duckdb`   | DuckDB-WASM -- SQL analytics in the browser, Parquet/Arrow/CSV | --      |
| `@phozart/criteria` | Selection criteria and filter UI components                    | 30.4 KB |

### Authoring and Viewing

| Package              | Description                                                         | Gzipped |
| -------------------- | ------------------------------------------------------------------- | ------- |
| `@phozart/workspace` | BI authoring environment -- reports, dashboards, templates, explore | 64.4 KB |
| `@phozart/viewer`    | Read-only consumption shell for analysts                            | 18.5 KB |
| `@phozart/editor`    | Authoring shell for content creators                                | 11.3 KB |

### Extended

| Package           | Description                                                   | Gzipped |
| ----------------- | ------------------------------------------------------------- | ------- |
| `@phozart/ai`     | AI toolkit -- schema inference, NL queries, anomaly detection | 7.6 KB  |
| `@phozart/collab` | Real-time collaboration -- Yjs CRDTs, presence, sync          | 3.3 KB  |
| `@phozart/local`  | Local server -- native DuckDB, filesystem persistence         | --      |
| `@phozart/python` | Python widget -- Jupyter, Panel, Streamlit via anywidget      | --      |

---

## Quick Start

### React

```bash
npm install @phozart/react
```

```tsx
import { PhzGrid } from '@phozart/react';
import type { GridApi, ColumnDefinition } from '@phozart/core';

const columns: ColumnDefinition[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name', type: 'string', sortable: true },
  { field: 'department', header: 'Department', type: 'string' },
  { field: 'salary', header: 'Salary', type: 'number', editable: true },
];

function EmployeeGrid({ employees }) {
  const gridRef = useRef<GridApi>(null);

  return (
    <PhzGrid
      ref={gridRef}
      data={employees}
      columns={columns}
      selectionMode="multi"
      density="compact"
      showToolbar
      showPagination
      onSortChange={(e) => console.log('Sorted:', e)}
      onSelectionChange={(e) => console.log('Selected:', e.selectedRows)}
    />
  );
}
```

### Vanilla Web Components

```bash
npm install @phozart/core @phozart/grid
```

```html
<phz-grid id="grid" selection-mode="multi" density="compact"></phz-grid>

<script type="module">
  import '@phozart/grid';

  const grid = document.querySelector('#grid');
  grid.columns = [
    { field: 'id', header: 'ID', type: 'number' },
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'salary', header: 'Salary', type: 'number' },
  ];
  grid.data = [
    { id: 1, name: 'Alice Johnson', salary: 95000 },
    { id: 2, name: 'Bob Smith', salary: 72000 },
    { id: 3, name: 'Carol Williams', salary: 110000 },
  ];
</script>
```

### Headless (No UI)

```bash
npm install @phozart/core
```

```ts
import { createGrid } from '@phozart/core';

const grid = createGrid({
  data: employees,
  columns: [{ field: 'name' }, { field: 'salary', type: 'number' }],
});

grid.sort('salary', 'desc');
grid.filter('salary', 'gt', 80000);

const rows = grid.getData(); // sorted + filtered
const unsub = grid.on('sort:change', (e) => console.log(e));

grid.destroy();
```

### DuckDB (Browser SQL)

```bash
npm install @phozart/core @phozart/grid @phozart/duckdb
```

```ts
import { createDuckDBDataSource } from '@phozart/duckdb';

const ds = createDuckDBDataSource({ enableStreaming: true });
await ds.initialize();
await ds.connect();
await ds.loadFile('sales.parquet');

const result = await ds.query('SELECT region, SUM(revenue) FROM sales GROUP BY region');
ds.attachToGrid(gridApi);
```

No server. No backend. SQL analytics on millions of rows, entirely in the browser.

---

## Accessibility

phozart is built accessibility-first. This is not a marketing claim -- it's verified by automated tests running in real browsers.

- **Screen Readers**: ARIA grid role, live regions for state changes, semantic headers
- **Keyboard Navigation**: Full roving tabindex -- arrows, Home/End, PgUp/PgDn, F2 to edit, Escape to cancel
- **Forced Colors Mode**: Windows High Contrast support with system color keywords
- **Motor Impairment**: All features accessible without fine pointer control
- **WCAG 2.2 AA**: Automated axe-core audits in Playwright E2E tests

```bash
npm run test:e2e  # 21 browser tests including axe-core WCAG audit
```

AG Grid charges $1,650/dev/year for enterprise accessibility features. phozart includes full accessibility in the MIT core. Always.

See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) for details.

---

## Composition Patterns

phozart modules compose like synthesizer modules. Start with what you need, add more as your requirements grow.

| Tier                 | Packages                                   | Bundle        | Use Case                                    |
| -------------------- | ------------------------------------------ | ------------- | ------------------------------------------- |
| **Grid Only**        | `@phozart/react`                           | ~84 KB        | Data table with sort, filter, edit, export  |
| **Grid + Analytics** | + `@phozart/engine` + `@phozart/widgets`   | ~181 KB       | Dashboards, KPIs, charts alongside the grid |
| **Grid + DuckDB**    | + `@phozart/duckdb`                        | ~84 KB + WASM | Browser-side SQL on Parquet/Arrow files     |
| **Full BI**          | + `@phozart/workspace` + `@phozart/viewer` | ~300 KB       | Complete BI authoring and viewing platform  |

See [docs/PATCH-BOOK.md](docs/PATCH-BOOK.md) for complete examples of each tier.

---

## Theming

Three-layer CSS custom property system:

```css
/* Layer 1: Public API — consumers override these */
phz-grid {
  --phz-header-bg: #1a1a2e;
  --phz-header-text: #e0e0e0;
  --phz-row-hover-bg: #16213e;
  --phz-font-family: 'Inter', sans-serif;
}
```

Built-in themes: `light`, `dark`, `midnight`, `sand`, `high-contrast`. Auto dark mode via `prefers-color-scheme`.

Density modes: `compact` (28px rows), `dense` (36px), `comfortable` (48px).

---

## Development

```bash
npm install          # Install all workspace dependencies
npm run build        # Build all 16 packages (ordered)
npm test             # 11,464 unit tests
npm run test:e2e     # 21 browser tests (Playwright + axe-core)
npm run typecheck    # TypeScript strict mode check
npm run size         # Bundle size report
```

### Build Order

```
core → shared → engine → duckdb → grid → criteria → widgets →
workspace → ai → collab → viewer → editor → local → react → vue → angular
```

---

## License

MIT. All packages. No enterprise tier. No accessibility paywall.
