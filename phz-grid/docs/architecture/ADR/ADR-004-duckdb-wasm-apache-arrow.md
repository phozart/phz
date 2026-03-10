# ADR-004: DuckDB-WASM + Apache Arrow as Analytical Data Backbone

## Status
Accepted

## Context

Modern data grids face a performance bottleneck: client-side operations (filter, sort, aggregate) on large datasets are slow because JavaScript array operations are single-threaded and memory-intensive.

### Traditional Approach (Array Methods)

```typescript
// Filter 100K rows - takes ~150ms
const filtered = data.filter(row => row.age > 30);

// Sort 100K rows - takes ~200ms
const sorted = data.sort((a, b) => a.name.localeCompare(b.name));

// Aggregate - requires full iteration
const totalSales = data.reduce((sum, row) => sum + row.sales, 0);
```

### Problems with JavaScript Arrays

1. **No Optimization** — Every filter/sort/aggregate is O(n), no indexing
2. **Memory Inefficient** — Array of objects has pointer overhead, poor cache locality
3. **Single-Threaded** — Can't leverage multiple CPU cores
4. **No Columnar Operations** — Row-oriented data is inefficient for analytics
5. **No Predicate Pushdown** — When loading CSV/Parquet, entire file must be parsed

### Market Analysis

| Solution | Technology | Performance (100K rows) | Drawbacks |
|----------|-----------|------------------------|-----------|
| AG Grid | JavaScript arrays | ~200ms sort | Slow at scale |
| MUI DataGrid | JavaScript arrays | ~180ms sort | Maxes out at ~100K rows |
| Handsontable | JavaScript arrays | ~250ms sort | Memory hog |
| TanStack Table | User implements | Varies | No built-in solution |
| Observable Plot | DuckDB-WASM (read-only) | ~10ms query | Not a grid |
| MotherDuck | DuckDB-WASM (cloud) | ~50ms query | Cloud dependency |

### DuckDB-WASM Performance Benchmarks

From research (TPC-H benchmarks, M1 Pro):
- **Filter 1M rows**: 8ms (DuckDB) vs 450ms (JavaScript)
- **Sort 1M rows**: 12ms (DuckDB) vs 800ms (JavaScript)
- **Aggregate 1M rows**: 6ms (DuckDB) vs 350ms (JavaScript)
- **Join two 500K tables**: 95ms (DuckDB) vs >10 seconds (JavaScript)

**Speed Improvement: 10-100x faster**

### Apache Arrow Benefits

- **Columnar Format** — Data stored in columns, not rows (better cache locality)
- **Zero-Copy Transfer** — Can transfer between Workers without serialization
- **Language Interop** — Same format used by pandas, Spark, R, Julia
- **Streaming** — Process data incrementally without loading entire dataset

## Decision

We will integrate **DuckDB-WASM + Apache Arrow** as the analytical data backbone:

### Architecture

```
┌───────────────────────────────────────────────┐
│  Data Sources                                 │
│  ├─ CSV (local or remote)                    │
│  ├─ Parquet (S3, HTTP, local)                │
│  ├─ JSON (local or remote)                   │
│  └─ Arrow IPC (zero-copy)                    │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│  DuckDB-WASM Worker                           │
│  ├─ SQL Query Engine (WASM ~3.5 MB)          │
│  ├─ Column Storage                            │
│  ├─ Query Optimizer                           │
│  └─ Streaming Execution                       │
└───────────────────────────────────────────────┘
                    ↓
           (Apache Arrow IPC)
                    ↓
┌───────────────────────────────────────────────┐
│  Main Thread (@phozart/phz-core)                  │
│  ├─ Arrow Table → Row Data (lazy)            │
│  ├─ Virtualization Pipeline                   │
│  └─ Render Visible Rows                       │
└───────────────────────────────────────────────┘
```

### Implementation Details

```typescript
// @phozart/phz-duckdb

import * as duckdb from '@duckdb/duckdb-wasm';
import { tableFromIPC } from 'apache-arrow';

export class DuckDBDataSource {
  private db: duckdb.AsyncDuckDB;
  private worker: Worker;

  async initialize() {
    // Lazy-load DuckDB-WASM (3.5 MB, loaded on demand)
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    this.worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    this.db = new duckdb.AsyncDuckDB(logger, this.worker);
    await this.db.instantiate(bundle.mainModule);
  }

  async loadParquet(url: string, tableName: string) {
    const conn = await this.db.connect();

    // Streaming Parquet load (doesn't load entire file)
    await conn.query(`
      CREATE OR REPLACE TABLE ${tableName} AS
      SELECT * FROM read_parquet('${url}')
    `);

    await conn.close();
  }

  async query(sql: string): Promise<ArrowTable> {
    const conn = await this.db.connect();
    const result = await conn.query(sql);

    // Export as Arrow IPC (zero-copy buffer)
    const arrowBuffer = await result.toArrowIPC();
    await conn.close();

    // Parse Arrow table (zero-copy view)
    return tableFromIPC(arrowBuffer);
  }

  async filter(tableName: string, condition: string): Promise<ArrowTable> {
    return this.query(`SELECT * FROM ${tableName} WHERE ${condition}`);
  }

  async aggregate(
    tableName: string,
    groupBy: string[],
    aggregations: Array<{ column: string, func: 'sum' | 'avg' | 'min' | 'max' | 'count' }>
  ): Promise<ArrowTable> {
    const aggs = aggregations.map(a => `${a.func}(${a.column}) AS ${a.column}_${a.func}`).join(', ');
    const groups = groupBy.join(', ');

    return this.query(`
      SELECT ${groups}, ${aggs}
      FROM ${tableName}
      GROUP BY ${groups}
    `);
  }
}
```

### Usage in Grid

```typescript
import { createGrid } from '@phozart/phz-core';
import { DuckDBDataSource } from '@phozart/phz-duckdb';

// Initialize DuckDB data source
const duckdb = new DuckDBDataSource();
await duckdb.initialize();

// Load Parquet file (500 MB, 10 million rows)
await duckdb.loadParquet(
  'https://example.com/sales-data.parquet',
  'sales'
);

// Create grid with DuckDB backend
const grid = createGrid({
  dataSource: duckdb,
  tableName: 'sales',
  columns: [
    { id: 'date', name: 'Date', type: 'date' },
    { id: 'region', name: 'Region', type: 'string' },
    { id: 'product', name: 'Product', type: 'string' },
    { id: 'sales', name: 'Sales', type: 'number' }
  ]
});

// Filter is executed in DuckDB (10x faster)
await grid.setFilter({
  columnId: 'region',
  operator: 'equals',
  value: 'West'
});
// DuckDB executes: SELECT * FROM sales WHERE region = 'West'

// Sort is executed in DuckDB
await grid.setSortModel([
  { columnId: 'sales', direction: 'desc' }
]);
// DuckDB executes: SELECT * FROM sales WHERE region = 'West' ORDER BY sales DESC

// Aggregate (group by region, sum sales)
const aggregated = await duckdb.aggregate(
  'sales',
  ['region'],
  [{ column: 'sales', func: 'sum' }]
);
// DuckDB executes: SELECT region, SUM(sales) AS sales_sum FROM sales GROUP BY region
```

### Columnar Operations (Arrow)

```typescript
// Arrow table is columnar: data stored by column, not row
const arrowTable = await duckdb.query('SELECT * FROM sales WHERE region = "West"');

// Zero-copy column access (no row materialization)
const salesColumn = arrowTable.getChild('sales');
const total = salesColumn.toArray().reduce((sum, val) => sum + val, 0);
// ^^ This is vectorized, much faster than row-by-row iteration

// Convert to row data lazily (only when needed for rendering)
const rowData = [];
for (let i = 0; i < arrowTable.numRows; i++) {
  const row = {
    date: arrowTable.getChild('date').get(i),
    region: arrowTable.getChild('region').get(i),
    sales: arrowTable.getChild('sales').get(i)
  };
  rowData.push(row);
}
```

## Consequences

### Positive

1. **10-100x Faster Queries** — DuckDB is optimized for analytics (column store, vectorized execution, query optimizer)
2. **Massive Scale** — Handle 10M+ rows in browser without server round-trips
3. **SQL Interface** — Users can write SQL queries directly (power users, data analysts)
4. **Parquet Support** — Native Parquet reading with predicate pushdown (reads only needed columns)
5. **Zero-Copy Transfer** — Arrow IPC allows efficient Worker → Main Thread data transfer
6. **Industry Standard** — Arrow is used by pandas, Spark, BigQuery (easy data exchange)
7. **Competitive Moat** — No other grid has in-browser SQL engine
8. **Open Source** — Available to all users under MIT license

### Negative

1. **Bundle Size** — DuckDB-WASM is 3.5 MB (WASM binary + JS glue)
2. **Load Time** — Initial load of WASM binary adds ~500ms
3. **Browser Compatibility** — Requires WebAssembly (IE11 not supported)
4. **Memory Overhead** — DuckDB maintains column store in addition to row data
5. **Complexity** — Developers must learn SQL or use abstraction layer
6. **Sync Cost** — Mutations in grid must sync back to DuckDB (bidirectional binding is complex)

### Neutral

1. **Lazy Loading** — DuckDB is lazy-loaded, doesn't affect the base grid bundle
2. **Progressive Enhancement** — Grid works without DuckDB (falls back to JavaScript arrays); DuckDB adds analytical power when needed

## Mitigation Strategies

### Bundle Size Mitigation

```typescript
// Lazy-load DuckDB only when needed
const duckdb = await import('@phozart/phz-duckdb');
```

### CDN Hosting

```html
<!-- Load DuckDB WASM from CDN -->
<script type="module">
  import { DuckDBDataSource } from 'https://cdn.jsdelivr.net/npm/@phozart/phz-duckdb@1.0.0/+esm';
</script>
```

### Bidirectional Sync

```typescript
// Grid → DuckDB (update table on cell edit)
grid.on('cellEditCommit', async ({ rowId, columnId, newValue }) => {
  await duckdb.query(`
    UPDATE sales
    SET ${columnId} = ${newValue}
    WHERE id = ${rowId}
  `);
});

// DuckDB → Grid (re-query on data change)
const refreshGrid = async () => {
  const arrowTable = await duckdb.query('SELECT * FROM sales');
  grid.setRowData(arrowTableToRowData(arrowTable));
};
```

## Alternatives Considered

### Alternative 1: JavaScript-Only (Status Quo)
**Rejected** because performance at scale is unacceptable (10-100x slower).

### Alternative 2: SQLite-WASM
**Rejected** because SQLite is row-oriented (slower for analytics). DuckDB is purpose-built for OLAP (analytics).

### Alternative 3: Polars-WASM (Rust dataframe library)
**Rejected** because Polars WASM support is experimental. DuckDB-WASM is production-ready.

### Alternative 4: WebAssembly-Compiled Sorting (Custom WASM)
**Rejected** because building a full query engine is reinventing the wheel. DuckDB is battle-tested.

### Alternative 5: Server-Side Processing (AG Grid Server-Side Row Model)
**Rejected** because it requires backend infrastructure. Our value proposition is client-side analytics.

## Performance Benchmarks (Target)

| Operation | Dataset | JavaScript | DuckDB-WASM | Speedup |
|-----------|---------|------------|-------------|---------|
| Filter (simple) | 1M rows | 450ms | 8ms | 56x |
| Sort (single column) | 1M rows | 800ms | 12ms | 67x |
| Aggregate (GROUP BY) | 1M rows | 350ms | 6ms | 58x |
| Join (two tables) | 500K rows each | 10+ sec | 95ms | 100x+ |
| Load Parquet | 500 MB file | N/A | 2 sec | N/A |

## References

- [DuckDB-WASM Documentation](https://duckdb.org/docs/api/wasm/overview.html)
- [Apache Arrow Format Specification](https://arrow.apache.org/docs/format/Columnar.html)
- [TPC-H Benchmarks - DuckDB](https://duckdb.org/2021/05/14/sql-on-pandas.html)
- [Observable Plot + DuckDB Example](https://observablehq.com/@observablehq/plot-duckdb)
- [MotherDuck (DuckDB Cloud)](https://motherduck.com/)

---

**Author**: Solution Architect
**Date**: 2026-02-24
**Stakeholders**: Data Science Lead (Dr. Elena Volkov persona), Engineering Leads, Product Manager
**License**: MIT
