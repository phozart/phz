# @phozart/duckdb

DuckDB-WASM data source adapter for phz-grid. Enables large-scale in-browser analytics with SQL queries, Apache Arrow integration, and Parquet file support.

## Installation

```bash
npm install @phozart/duckdb @phozart/core
```

**Peer dependencies:** `@duckdb/duckdb-wasm ^1.0.0`, `apache-arrow ^16.0.0`

## Quick Start

```ts
import { createDuckDBDataSource } from '@phozart/duckdb';
import { createGrid } from '@phozart/core';

// Initialize DuckDB-WASM data source
const dataSource = await createDuckDBDataSource({
  tableName: 'sales',
  query: 'SELECT * FROM sales ORDER BY date DESC',
  // Optional: load from file
  loadFile: {
    url: '/data/sales.parquet',
    tableName: 'sales',
  },
});

// Use with headless grid
const grid = createGrid({
  columns: dataSource.columns,
  data: dataSource.data,
});
```

## API

### `createDuckDBDataSource(config): Promise<DuckDBDataSource>`

Creates a DuckDB-WASM-backed data source.

#### Config

```ts
interface DuckDBConfig {
  tableName: string;           // Target table name
  query?: string;              // SQL query to execute
  loadFile?: LoadFileOptions;  // Load data from URL/file
  connection?: AsyncDuckDBConnection; // Existing connection
}
```

#### DuckDBDataSource

The returned data source provides:

```ts
interface DuckDBDataSource {
  data: RowData[];              // Query results as row data
  columns: ColumnDefinition[];  // Inferred column definitions
  schema: TableSchema;          // Table schema information
  totalRows: number;            // Total row count
  query(sql: string): Promise<QueryResult>;  // Execute SQL
  close(): Promise<void>;       // Close connection
}
```

### `getQueryPlan(connection, sql): Promise<QueryPlan>`

Returns the query execution plan for a SQL statement, useful for optimization and debugging.

```ts
const plan = await getQueryPlan(connection, 'SELECT * FROM sales WHERE amount > 1000');
console.log(plan.nodes); // Execution plan tree
```

## Types

```ts
import type {
  DuckDBConfig,
  DuckDBDataSource,
  AsyncDuckDB,
  AsyncDuckDBConnection,
  ArrowTable,
  ArrowSchema,
  TableSchema,
  ColumnSchema,
  QueryResult,
  QueryPlan,
  ParquetMetadata,
} from '@phozart/duckdb';
```

## Re-exports

This package re-exports all types from `@phozart/core` for convenience.

## License

MIT
