# phz-grid

Next-generation universal data grid built on Web Components. Accessible, fast, and extensible.

## Features

- **Accessibility First** -- WCAG 2.2 AA compliant. Screen reader support, keyboard navigation, and Forced Colors Mode from day one.
- **Framework Agnostic** -- Works with React, Vue, Angular, or vanilla JS. One grid, every framework.
- **DuckDB Analytics** -- Query millions of rows in-browser with DuckDB-WASM and Apache Arrow.
- **AI Powered** -- Schema inference, natural language queries, anomaly detection, and data insights.
- **Real-time Collaboration** -- Yjs CRDTs for multi-user editing with presence and conflict resolution.
- **Tiny Core** -- Under 50 KB gzipped. Tree-shakeable modules for what you need.
- **Python Support** -- `pip install phz-grid` for Jupyter, Panel, and Streamlit.

## Packages

| Package | Description |
|---------|-------------|
| `@phozart/phz-core` | Headless grid engine (zero DOM deps) |
| `@phozart/phz-grid` | Web Components rendering (Lit) |
| `@phozart/phz-react` | React wrapper + hooks |
| `@phozart/phz-vue` | Vue adapter (factory pattern) |
| `@phozart/phz-angular` | Angular adapter (factory pattern) |
| `@phozart/phz-duckdb` | DuckDB-WASM data source |
| `@phozart/phz-ai` | AI toolkit (schema, NL queries) |
| `@phozart/phz-collab` | Real-time collaboration (Yjs) |
| `@phozart/phz-engine` | BI engine (reports, dashboards, KPIs, pivots) |
| `@phozart/phz-widgets` | Dashboard widgets (bar-chart, KPI card, trend-line) |
| `@phozart/phz-criteria` | Selection criteria & filter UI components |
| `@phozart/phz-grid-admin` | Grid admin panel (columns, formatting, export) |
| `@phozart/phz-engine-admin` | Engine admin panel (report/dashboard designers) |
| `@phozart/phz-definitions` | Serializable grid blueprints, Zod validation |
| `@phozart/phz-grid-creator` | Stepped wizard for creating new grids/reports |
| `phz-grid` (PyPI) | Python widget (anywidget) |

## Quick Start

### Vanilla JS / Web Components

```bash
npm install @phozart/phz-core @phozart/phz-grid
```

```html
<phz-grid
  selection-mode="multi"
  edit-mode="dblclick"
  theme="auto"
></phz-grid>

<script type="module">
  import '@phozart/phz-grid';

  const grid = document.querySelector('phz-grid');
  grid.data = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 },
  ];
  grid.columns = [
    { field: 'id', header: 'ID', type: 'number', width: 80 },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'age', header: 'Age', type: 'number', editable: true },
  ];
</script>
```

### React

```bash
npm install @phozart/phz-react
```

```tsx
import { useRef } from 'react';
import { PhzGrid, useGridState, useGridSelection } from '@phozart/phz-react';
import type { GridApi } from '@phozart/phz-react';

function App() {
  const gridRef = useRef<GridApi>(null);
  const { state } = useGridState(gridRef);
  const { selectedRows, selectAll } = useGridSelection(gridRef);

  return (
    <PhzGrid
      ref={gridRef}
      data={data}
      columns={columns}
      selectionMode="multi"
      onGridReady={() => console.log('Grid ready!')}
    />
  );
}
```

### Vue

```bash
npm install @phozart/phz-vue
```

```js
import { ref, onMounted, h } from 'vue';
import { createPhzGridComponent, createUseGrid } from '@phozart/phz-vue';

const PhzGrid = createPhzGridComponent({ h, ref, onMounted, watch: () => {} });
const useGrid = createUseGrid({ ref, onMounted, watch: () => {} });
```

### Angular

```bash
npm install @phozart/phz-angular
```

```ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { createPhzGridComponent } from '@phozart/phz-angular';

const PhzGridComponent = createPhzGridComponent({
  Component, Input, Output, EventEmitter
});
```

### Python / Jupyter

```bash
pip install phz-grid
```

```python
import pandas as pd
from phz_grid import Grid, Column

df = pd.read_csv('data.csv')
grid = Grid(
    data=df,
    columns=[
        Column(field='name', header='Name', sortable=True),
        Column(field='age', header='Age', type='number', editable=True),
    ],
    height='400px',
    selection_mode='multi',
)
grid  # displays in Jupyter
```

### DuckDB Analytics

```bash
npm install @phozart/phz-duckdb
```

```ts
import { createDuckDBDataSource } from '@phozart/phz-duckdb';

const ds = createDuckDBDataSource({ enableStreaming: true });
await ds.initialize();
await ds.connect();
await ds.loadFile('data.parquet');
const result = await ds.query('SELECT * FROM data WHERE age > 30');

ds.attachToGrid(gridApi);
```

### AI Toolkit

```bash
npm install @phozart/phz-ai
```

```ts
import { createAIToolkit, OpenAIProvider } from '@phozart/phz-ai';

const ai = createAIToolkit({
  provider: new OpenAIProvider({ apiKey: 'sk-...' }),
});

ai.attachToGrid(gridApi);

const schema = ai.getStructuredSchema();
const result = await ai.executeNaturalLanguageQuery('Show users older than 30');
const anomalies = await ai.detectAnomalies('price');
const insights = await ai.generateInsights();
```

### Real-time Collaboration

```bash
npm install @phozart/phz-collab
```

```ts
import { createCollabSession, WebSocketSyncProvider } from '@phozart/phz-collab';

const session = createCollabSession({
  userId: 'user-1',
  userName: 'Alice',
  enablePresence: true,
  enableHistory: true,
});

await session.connect(new WebSocketSyncProvider({ url: 'wss://sync.example.com' }));
session.attachToGrid(gridApi);

session.onPresenceChange((users) => {
  console.log('Online users:', users.size);
});
```

## Architecture

```
@phozart/phz-core (Headless Engine)
    |
    +-- @phozart/phz-grid (Web Components / Lit)
    |       |
    |       +-- @phozart/phz-react (React wrapper + hooks)
    |       +-- @phozart/phz-vue (Vue adapter)
    |       +-- @phozart/phz-angular (Angular adapter)
    |
    +-- @phozart/phz-engine (BI engine)
    |       |
    |       +-- @phozart/phz-widgets (Dashboard widgets)
    |       +-- @phozart/phz-criteria (Filter UI)
    |       +-- @phozart/phz-engine-admin (Engine admin)
    |
    +-- @phozart/phz-grid-admin (Grid admin panel)
    +-- @phozart/phz-definitions (Grid blueprints + validation)
    +-- @phozart/phz-grid-creator (Creation wizard)
    +-- @phozart/phz-duckdb (DuckDB-WASM + Arrow)
    +-- @phozart/phz-ai (AI toolkit)
    +-- @phozart/phz-collab (Yjs CRDTs)

phz-grid (PyPI) -- bundles core + grid for Jupyter
```

## Accessibility

phz-grid is built accessibility-first:

- **Screen Readers**: ARIA grid role, live regions for state changes, semantic column/row headers
- **Keyboard Navigation**: Full roving tabindex — arrow keys, Home/End, PgUp/PgDn, F2 to edit, Esc to cancel, Enter to commit, Space to select
- **Forced Colors Mode**: Windows High Contrast support using system color keywords
- **Motor Impairment**: All features accessible without fine pointer control
- **WCAG 2.2 AA**: Contrast ratios, focus indicators, and skip navigation

## Development

```bash
# Install dependencies
npm install

# Type check all packages
npm run typecheck

# Run tests
npm test

# Build all packages
npm run build

# Watch mode
npm run test:watch
```

## License

MIT — all packages are open source.
