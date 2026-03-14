# The phozart Patch Book

A modular synthesizer is only as good as its patch book. The modules are the
potential; the patches are the music.

phozart is a modular data grid and BI system built from 19 composable packages.
Each package is a module. This document shows you how to patch them together --
from a single oscillator (a data grid) to a full orchestra (a complete BI
platform).

Read the patch that matches your use case. Each one is self-contained: install
commands, working code, bundle cost, and a clear signal path from data in to
rendered output.

---

## Patch 1: "Bass Line" -- Data Grid Only

**The foundation. One module, one output. Data goes in, a fully accessible,
sortable, filterable grid comes out.**

### Signal Path

```
Data Array --> @phozart/core --> @phozart/grid --> Rendered Table
```

### Install

```bash
# React (includes core + grid as dependencies)
npm install @phozart/react

# Vanilla Web Components
npm install @phozart/core @phozart/grid
```

### React Example

```tsx
'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ColumnDefinition } from '@phozart/core';

const PhzGrid = dynamic(() => import('@phozart/react/grid').then((m) => m.PhzGrid), { ssr: false });

const COLUMNS: ColumnDefinition[] = [
  { field: 'employeeId', header: 'ID', type: 'number', width: 80, sortable: true },
  {
    field: 'fullName',
    header: 'Name',
    type: 'string',
    width: 200,
    sortable: true,
    filterable: true,
  },
  {
    field: 'department',
    header: 'Department',
    type: 'string',
    width: 150,
    sortable: true,
    filterable: true,
  },
  { field: 'title', header: 'Title', type: 'string', width: 200, sortable: true },
  {
    field: 'salary',
    header: 'Salary',
    type: 'number',
    width: 120,
    sortable: true,
    valueFormatter: ({ value }) => (value != null ? `$${Number(value).toLocaleString()}` : ''),
  },
  { field: 'hireDate', header: 'Hire Date', type: 'date', width: 130, sortable: true },
  {
    field: 'region',
    header: 'Region',
    type: 'string',
    width: 120,
    sortable: true,
    filterable: true,
  },
];

const EMPLOYEES = [
  {
    employeeId: 1001,
    fullName: 'Maria Chen',
    department: 'Engineering',
    title: 'Staff Engineer',
    salary: 185000,
    hireDate: '2019-03-15',
    region: 'West',
  },
  {
    employeeId: 1002,
    fullName: 'James Okonkwo',
    department: 'Engineering',
    title: 'Senior Engineer',
    salary: 162000,
    hireDate: '2020-07-22',
    region: 'East',
  },
  {
    employeeId: 1003,
    fullName: 'Priya Sharma',
    department: 'Product',
    title: 'Product Manager',
    salary: 155000,
    hireDate: '2021-01-10',
    region: 'West',
  },
  {
    employeeId: 1004,
    fullName: 'Carlos Rivera',
    department: 'Sales',
    title: 'Account Executive',
    salary: 128000,
    hireDate: '2022-04-05',
    region: 'Central',
  },
  {
    employeeId: 1005,
    fullName: 'Elena Volkov',
    department: 'Finance',
    title: 'Financial Analyst',
    salary: 134000,
    hireDate: '2020-11-18',
    region: 'East',
  },
  {
    employeeId: 1006,
    fullName: 'David Kim',
    department: 'Engineering',
    title: 'Principal Engineer',
    salary: 210000,
    hireDate: '2018-06-01',
    region: 'West',
  },
  {
    employeeId: 1007,
    fullName: 'Aisha Patel',
    department: 'Marketing',
    title: 'Marketing Director',
    salary: 172000,
    hireDate: '2019-09-12',
    region: 'Central',
  },
  {
    employeeId: 1008,
    fullName: 'Thomas Andersson',
    department: 'Sales',
    title: 'Regional VP',
    salary: 195000,
    hireDate: '2017-02-28',
    region: 'East',
  },
  {
    employeeId: 1009,
    fullName: 'Fatima Al-Hassan',
    department: 'Product',
    title: 'Senior PM',
    salary: 168000,
    hireDate: '2021-08-14',
    region: 'West',
  },
  {
    employeeId: 1010,
    fullName: 'Robert Nakamura',
    department: 'Finance',
    title: 'Controller',
    salary: 188000,
    hireDate: '2016-11-03',
    region: 'Central',
  },
];

export default function EmployeeGrid() {
  const [selected, setSelected] = useState<number>(0);

  const handleSelectionChange = useCallback((e: { selectedRows?: any[] }) => {
    setSelected(e.selectedRows?.length ?? 0);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #333' }}>
        <h1>Employees</h1>
        {selected > 0 && <span>{selected} selected</span>}
      </header>

      <PhzGrid
        data={EMPLOYEES}
        columns={COLUMNS}
        height="calc(100vh - 80px)"
        theme="dark"
        density="compact"
        selectionMode="multi"
        showToolbar
        showPagination
        showSearch
        showCheckboxes
        allowSorting
        allowFiltering
        pageSize={25}
        gridLines="horizontal"
        rowBanding
        hoverHighlight
        gridTitle="Employee Directory"
        onSelectionChange={handleSelectionChange}
        onSort={(e) => console.log('Sort:', e.field, e.direction)}
      />
    </div>
  );
}
```

### Vanilla Web Component Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Employee Grid</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui;
        background: #0a0a0a;
        color: #e5e5e5;
      }
      #grid-container {
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="grid-container">
      <phz-grid id="employee-grid"></phz-grid>
    </div>

    <script type="module">
      import '@phozart/grid';
      import { createGrid } from '@phozart/core';

      const columns = [
        { field: 'employeeId', header: 'ID', type: 'number', width: 80, sortable: true },
        {
          field: 'fullName',
          header: 'Name',
          type: 'string',
          width: 200,
          sortable: true,
          filterable: true,
        },
        {
          field: 'department',
          header: 'Department',
          type: 'string',
          width: 150,
          sortable: true,
          filterable: true,
        },
        { field: 'title', header: 'Title', type: 'string', width: 200, sortable: true },
        { field: 'salary', header: 'Salary', type: 'number', width: 120, sortable: true },
        { field: 'hireDate', header: 'Hire Date', type: 'date', width: 130, sortable: true },
        {
          field: 'region',
          header: 'Region',
          type: 'string',
          width: 120,
          sortable: true,
          filterable: true,
        },
      ];

      const data = [
        {
          employeeId: 1001,
          fullName: 'Maria Chen',
          department: 'Engineering',
          title: 'Staff Engineer',
          salary: 185000,
          hireDate: '2019-03-15',
          region: 'West',
        },
        {
          employeeId: 1002,
          fullName: 'James Okonkwo',
          department: 'Engineering',
          title: 'Senior Engineer',
          salary: 162000,
          hireDate: '2020-07-22',
          region: 'East',
        },
        {
          employeeId: 1003,
          fullName: 'Priya Sharma',
          department: 'Product',
          title: 'Product Manager',
          salary: 155000,
          hireDate: '2021-01-10',
          region: 'West',
        },
        {
          employeeId: 1004,
          fullName: 'Carlos Rivera',
          department: 'Sales',
          title: 'Account Executive',
          salary: 128000,
          hireDate: '2022-04-05',
          region: 'Central',
        },
        {
          employeeId: 1005,
          fullName: 'Elena Volkov',
          department: 'Finance',
          title: 'Financial Analyst',
          salary: 134000,
          hireDate: '2020-11-18',
          region: 'East',
        },
      ];

      // Option A: Use the Web Component directly
      const gridEl = document.getElementById('employee-grid');
      gridEl.data = data;
      gridEl.columns = columns;
      gridEl.theme = 'dark';
      gridEl.density = 'compact';
      gridEl.showToolbar = true;
      gridEl.showPagination = true;
      gridEl.allowSorting = true;
      gridEl.allowFiltering = true;
      gridEl.gridTitle = 'Employee Directory';

      // Option B: Use the headless API (no rendering)
      const headless = createGrid({ data, columns });
      headless.sort('salary', 'desc');
      console.log('Top earner:', headless.getData()[0].fullName);
      console.log('Filtered count:', headless.getFilteredRowModel().rows.length);

      // Listen for events
      headless.on('sort:change', ({ field, direction }) => {
        console.log(`Sorted by ${field} ${direction}`);
      });
    </script>
  </body>
</html>
```

### What You Get

- Sortable, filterable, paginated data grid
- Keyboard navigation and screen reader support (WCAG 2.1 AA)
- Inline cell editing with validation
- Multi-row selection with checkboxes
- Column resizing, reordering, and pinning
- CSV export
- Undo/redo
- 5 themes (light, dark, sand, midnight, high-contrast)
- 3 density modes (compact, dense, comfortable)
- Forced Colors Mode support

### Bundle Size

~84 KB gzipped (core + grid + Lit runtime)

### When to Use This

Use Patch 1 when you need a data grid and nothing more. If you find yourself
writing aggregation logic, building KPI cards by hand, or wishing you had pivot
tables -- move to Patch 2.

---

## Patch 2: "Full Lead" -- Grid + Analytics

**The grid gets a brain. Add the BI engine for aggregation, pivots, KPIs, and
chart projections. Add the widgets package for pre-built visualization
components. Now you have a dashboard.**

### Signal Path

```
Data Array --> @phozart/core --> @phozart/engine (aggregate, pivot, KPI) --> @phozart/widgets --> Rendered Dashboard
                                      |
                                      +--> @phozart/grid --> Rendered Table (detail view)
```

### Install

```bash
npm install @phozart/react @phozart/engine @phozart/widgets
```

### React Example: Sales Dashboard

```tsx
'use client';
import { useMemo, useEffect, useRef } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import type { ColumnDefinition } from '@phozart/core';
import {
  createBIEngine,
  computeAggregations,
  computeGroupAggregations,
  computePivot,
} from '@phozart/engine';

const PhzGrid = dynamic(
  () => import('@phozart/react/grid').then(m => m.PhzGrid),
  { ssr: false }
);

// --- Sample data: quarterly sales ---

const SALES_DATA = [
  { orderId: 'ORD-4201', rep: 'Maria Chen',       region: 'West',    product: 'Enterprise',  amount: 84500,  quarter: 'Q1', closed: '2025-01-18' },
  { orderId: 'ORD-4202', rep: 'James Okonkwo',    region: 'East',    product: 'Professional', amount: 32000,  quarter: 'Q1', closed: '2025-02-03' },
  { orderId: 'ORD-4203', rep: 'Carlos Rivera',    region: 'Central', product: 'Enterprise',  amount: 91200,  quarter: 'Q1', closed: '2025-02-22' },
  { orderId: 'ORD-4204', rep: 'Priya Sharma',     region: 'West',    product: 'Starter',     amount: 12800,  quarter: 'Q1', closed: '2025-03-10' },
  { orderId: 'ORD-4205', rep: 'Thomas Andersson', region: 'East',    product: 'Enterprise',  amount: 78300,  quarter: 'Q2', closed: '2025-04-15' },
  { orderId: 'ORD-4206', rep: 'Maria Chen',       region: 'West',    product: 'Professional', amount: 45600,  quarter: 'Q2', closed: '2025-04-28' },
  { orderId: 'ORD-4207', rep: 'Aisha Patel',      region: 'Central', product: 'Enterprise',  amount: 103400, quarter: 'Q2', closed: '2025-05-19' },
  { orderId: 'ORD-4208', rep: 'Elena Volkov',     region: 'East',    product: 'Professional', amount: 38900,  quarter: 'Q2', closed: '2025-06-02' },
  { orderId: 'ORD-4209', rep: 'David Kim',        region: 'West',    product: 'Enterprise',  amount: 112000, quarter: 'Q3', closed: '2025-07-11' },
  { orderId: 'ORD-4210', rep: 'Carlos Rivera',    region: 'Central', product: 'Starter',     amount: 15400,  quarter: 'Q3', closed: '2025-08-05' },
  { orderId: 'ORD-4211', rep: 'James Okonkwo',    region: 'East',    product: 'Enterprise',  amount: 96700,  quarter: 'Q3', closed: '2025-09-14' },
  { orderId: 'ORD-4212', rep: 'Fatima Al-Hassan', region: 'West',    product: 'Professional', amount: 51200,  quarter: 'Q3', closed: '2025-09-28' },
];

// --- KPI computation ---

function useSalesKPIs(data: typeof SALES_DATA) {
  return useMemo(() => {
    const totals = computeAggregations(data, {
      fields: [
        { field: 'amount', functions: ['sum', 'avg', 'count', 'min', 'max'] },
      ],
    });

    const byRegion = computeGroupAggregations(data, {
      groupBy: ['region'],
      fields: [{ field: 'amount', functions: ['sum', 'count'] }],
    });

    const byProduct = computeGroupAggregations(data, {
      groupBy: ['product'],
      fields: [{ field: 'amount', functions: ['sum', 'count'] }],
    });

    return { totals, byRegion, byProduct };
  }, [data]);
}

// --- Widget wrappers ---

function widgetFactory(tag: string) {
  function Widget(props: Record<string, any>) {
    useEffect(() => { import('@phozart/widgets'); }, []);
    return React.createElement(tag, props);
  }
  Widget.displayName = tag;
  return Widget;
}

const KPICard  = dynamic(() => Promise.resolve(widgetFactory('phz-kpi-card')),  { ssr: false });
const BarChart = dynamic(() => Promise.resolve(widgetFactory('phz-bar-chart')), { ssr: false });

// --- Dashboard columns ---

const ORDER_COLUMNS: ColumnDefinition[] = [
  { field: 'orderId',  header: 'Order',   type: 'string',  width: 120, sortable: true },
  { field: 'rep',      header: 'Rep',     type: 'string',  width: 180, sortable: true, filterable: true },
  { field: 'region',   header: 'Region',  type: 'string',  width: 120, sortable: true, filterable: true },
  { field: 'product',  header: 'Product', type: 'string',  width: 140, sortable: true, filterable: true },
  { field: 'amount',   header: 'Amount',  type: 'number',  width: 130, sortable: true,
    valueFormatter: ({ value }) => value != null ? `$${Number(value).toLocaleString()}` : '' },
  { field: 'quarter',  header: 'Quarter', type: 'string',  width: 100, sortable: true, filterable: true },
  { field: 'closed',   header: 'Closed',  type: 'date',    width: 130, sortable: true },
];

// --- Dashboard component ---

export default function SalesDashboard() {
  const { totals, byRegion, byProduct } = useSalesKPIs(SALES_DATA);

  const totalRevenue = totals.fieldResults.amount.sum ?? 0;
  const avgDeal     = totals.fieldResults.amount.avg ?? 0;
  const dealCount   = totals.fieldResults.amount.count ?? 0;
  const largestDeal = totals.fieldResults.amount.max ?? 0;

  // Prepare bar chart data: revenue by region
  const regionChartData = byRegion.groups.map(g => ({
    label: String(g.key.region),
    value: (g.results.amount.sum ?? 0) as number,
  }));

  return (
    <div style={{ padding: 24, background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5' }}>
      <h1>Sales Dashboard</h1>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`${dealCount} deals closed`}
          status="positive"
        />
        <KPICard
          label="Average Deal Size"
          value={`$${Math.round(avgDeal).toLocaleString()}`}
          status="neutral"
        />
        <KPICard
          label="Largest Deal"
          value={`$${largestDeal.toLocaleString()}`}
          status="positive"
        />
        <KPICard
          label="Deal Count"
          value={String(dealCount)}
          subtitle="YTD"
          status="neutral"
        />
      </div>

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <BarChart
          chart-title="Revenue by Region"
          .data={regionChartData}
          value-field="value"
          category-field="label"
          theme="dark"
          style={{ height: '320px' }}
        />
        <BarChart
          chart-title="Revenue by Product"
          .data={byProduct.groups.map(g => ({
            label: String(g.key.product),
            value: (g.results.amount.sum ?? 0) as number,
          }))}
          value-field="value"
          category-field="label"
          theme="dark"
          style={{ height: '320px' }}
        />
      </div>

      {/* Detail grid */}
      <PhzGrid
        data={SALES_DATA}
        columns={ORDER_COLUMNS}
        height="400px"
        theme="dark"
        density="compact"
        showToolbar
        showPagination
        showSearch
        allowSorting
        allowFiltering
        gridTitle="Order Detail"
        pageSize={10}
        gridLines="horizontal"
        rowBanding
      />
    </div>
  );
}
```

### Using the BI Engine Facade

For more advanced use cases -- reports, dashboards, KPI registries, drill-through,
expression evaluation -- use the `createBIEngine()` facade.

```typescript
import { createBIEngine } from '@phozart/engine';

const engine = createBIEngine({
  enableMetrics: true,
});

// Register a KPI
engine.kpis.register({
  id: 'revenue-total',
  name: 'Total Revenue',
  dataSource: { type: 'aggregation', field: 'amount', function: 'sum' },
  unit: 'currency',
  direction: 'up',
  thresholds: { warning: 500000, critical: 250000 },
});

// Aggregation
const result = engine.aggregate(salesData, {
  fields: [{ field: 'amount', functions: ['sum', 'avg', 'count'] }],
});
console.log('Revenue:', result.fieldResults.amount.sum);

// Pivot: revenue by region and quarter
const pivot = engine.pivot(salesData, {
  rowFields: ['region'],
  columnField: 'quarter',
  valueFields: [{ field: 'amount', function: 'sum' }],
});

// Chart projection
const chartSeries = engine.projectChart(salesData, {
  xField: 'closed',
  yField: 'amount',
  seriesField: 'region',
});

// Clean up
engine.destroy();
```

### What You Get (on top of Patch 1)

- Aggregation engine (sum, avg, count, min, max, median, stddev, variance, percentile)
- Group-by aggregations with multi-field grouping
- Pivot tables with subtotals and "show values as" transforms
- KPI scoring, status classification, and delta computation
- Chart data projection (bar, line, pie, scatter, area, waterfall, funnel)
- Pre-built Lit widget components (KPI cards, bar charts, trend lines, gauges, scorecards, heatmaps)
- Dashboard layout with responsive breakpoints and cross-filtering
- Drill-through resolution and hierarchy navigation
- Expression language with formula parser, compiler, and SQL transpiler
- Config layering (user overrides on top of shared configs)

### Bundle Size

~181 KB gzipped (core + engine + widgets + grid + Lit runtime)

### When to Use This

Use Patch 2 when you are building data-heavy applications that need dashboards,
KPIs, or charts alongside a grid. If your data lives in Parquet files, you need
SQL queries in the browser, or your dataset exceeds what fits comfortably in a
JavaScript array -- move to Patch 3.

---

## Patch 3: "Cosmic Exploration" -- Grid + DuckDB

**The module nobody else makes. Load Parquet files directly in the browser.
Query millions of rows with SQL. No server required.**

This is phozart's competitive moat. No other grid library ships with an
in-browser analytical database. DuckDB-WASM gives you columnar storage,
vectorized execution, and full SQL -- all running in a Web Worker.

### Signal Path

```
Parquet / CSV / Arrow IPC --> DuckDB-WASM --> @phozart/core --> @phozart/grid --> Rendered Table
         (in-browser)                              |
                                                   +--> SQL query results (direct access)
```

### Install

```bash
npm install @phozart/react @phozart/duckdb @duckdb/duckdb-wasm apache-arrow
```

Note: `@duckdb/duckdb-wasm` and `apache-arrow` are peer dependencies.

### React Example: Parquet File Explorer

```tsx
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ColumnDefinition } from '@phozart/core';
import { createDuckDBDataSource } from '@phozart/duckdb';
import type { DuckDBDataSource, TableSchema } from '@phozart/duckdb';

const PhzGrid = dynamic(() => import('@phozart/react/grid').then((m) => m.PhzGrid), { ssr: false });

export default function ParquetExplorer() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [status, setStatus] = useState<string>('Drop a .parquet or .csv file to begin');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<string>('');
  const dsRef = useRef<DuckDBDataSource | null>(null);

  // Initialize DuckDB on mount
  useEffect(() => {
    const ds = createDuckDBDataSource({
      enableStreaming: true,
      threads: navigator.hardwareConcurrency ?? 4,
    });
    dsRef.current = ds;

    ds.initialize().then(() => {
      setStatus('DuckDB initialized. Drop a file to load data.');
    });

    return () => {
      ds.disconnect();
    };
  }, []);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const ds = dsRef.current;
    if (!ds) return;

    setStatus(`Loading ${file.name}...`);

    try {
      // Load the file into DuckDB (auto-detects format by extension)
      const tableName = await ds.loadFile(file);

      // Get schema to build column definitions
      const schema: TableSchema = await ds.getSchema(tableName);
      const cols: ColumnDefinition[] = schema.columns.map((col) => ({
        field: col.name,
        header: col.name,
        type: inferColumnType(col.type),
        width: 150,
        sortable: true,
        filterable: true,
      }));
      setColumns(cols);

      // Query first 1000 rows for the grid
      const result = await ds.query(`SELECT * FROM "${tableName}" LIMIT 1000`);
      setData(result.rows);
      setSqlQuery(`SELECT * FROM "${tableName}" LIMIT 1000`);
      setStatus(
        `Loaded ${file.name}: ${schema.rowCount.toLocaleString()} rows, ${schema.columns.length} columns`,
      );
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    }
  }, []);

  // Run a custom SQL query
  const handleRunSQL = useCallback(async () => {
    const ds = dsRef.current;
    if (!ds || !sqlQuery.trim()) return;

    try {
      const start = performance.now();
      const result = await ds.query(sqlQuery);
      const elapsed = (performance.now() - start).toFixed(1);
      setData(result.rows);
      setSqlResult(`${result.rows.length} rows in ${elapsed}ms`);

      // Rebuild columns from result shape
      if (result.rows.length > 0) {
        const cols: ColumnDefinition[] = Object.keys(result.rows[0]).map((key) => ({
          field: key,
          header: key,
          type: typeof result.rows[0][key] === 'number' ? ('number' as const) : ('string' as const),
          width: 150,
          sortable: true,
        }));
        setColumns(cols);
      }
    } catch (err) {
      setSqlResult(`Error: ${(err as Error).message}`);
    }
  }, [sqlQuery]);

  return (
    <div
      style={{ padding: 24, background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h1>Parquet Explorer</h1>
      <p>{status}</p>

      {/* SQL editor */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="SELECT region, SUM(amount) as total FROM sales GROUP BY region ORDER BY total DESC"
          style={{
            width: '100%',
            height: 80,
            fontFamily: 'monospace',
            fontSize: 14,
            background: '#1a1a1a',
            color: '#e5e5e5',
            border: '1px solid #333',
            borderRadius: 4,
            padding: 12,
          }}
        />
        <button
          onClick={handleRunSQL}
          style={{
            marginTop: 8,
            padding: '8px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Run Query
        </button>
        {sqlResult && <span style={{ marginLeft: 16, color: '#9ca3af' }}>{sqlResult}</span>}
      </div>

      {/* Results grid */}
      {columns.length > 0 && (
        <PhzGrid
          data={data}
          columns={columns}
          height="calc(100vh - 300px)"
          theme="dark"
          density="compact"
          showToolbar
          showPagination
          showSearch
          allowSorting
          allowFiltering
          gridTitle="Query Results"
          pageSize={50}
          gridLines="horizontal"
          rowBanding
        />
      )}
    </div>
  );
}

function inferColumnType(duckdbType: string): 'string' | 'number' | 'date' | 'boolean' {
  const t = duckdbType.toUpperCase();
  if (
    [
      'INTEGER',
      'BIGINT',
      'DOUBLE',
      'FLOAT',
      'DECIMAL',
      'REAL',
      'SMALLINT',
      'TINYINT',
      'HUGEINT',
    ].some((n) => t.includes(n))
  )
    return 'number';
  if (['DATE', 'TIMESTAMP', 'TIME'].some((n) => t.includes(n))) return 'date';
  if (t === 'BOOLEAN') return 'boolean';
  return 'string';
}
```

### DuckDB + BI Engine: SQL-Powered Aggregation

The DuckDB compute backend can replace the JavaScript aggregation engine for
large datasets. The engine pushes aggregation, filtering, and pivot queries
down to DuckDB's vectorized executor.

```typescript
import { createDuckDBDataSource, createDuckDBComputeBackend } from '@phozart/duckdb';
import { createBIEngine } from '@phozart/engine';

// 1. Initialize DuckDB and load data
const ds = createDuckDBDataSource({ threads: 4 });
await ds.initialize();
await ds.loadFile('/data/sales-2025.parquet');

// 2. Create a DuckDB-backed compute backend
const computeBackend = createDuckDBComputeBackend({
  execute: (sql) => ds.query(sql).then((r) => r.rows),
});

// 3. Plug it into the BI engine
const engine = createBIEngine({ computeBackend });

// Now all engine operations (aggregate, pivot, etc.) are executed
// as SQL queries inside DuckDB -- not in the main thread.
const pivot = engine.pivot([], {
  rowFields: ['region'],
  columnField: 'quarter',
  valueFields: [{ field: 'amount', function: 'sum' }],
});
```

### What You Get (on top of Patch 1)

- Load Parquet, CSV, JSON, and Arrow IPC files directly in the browser
- Full SQL query engine (DuckDB-WASM) running in a Web Worker
- Multi-threaded execution when `SharedArrayBuffer` is available
- Streaming query results for large result sets
- Schema inspection (column types, row counts, statistics)
- SQL builder utilities (`buildGridQuery`, `buildCountQuery`, `buildPivotQuery`)
- Hybrid engine that routes queries to DuckDB or JavaScript based on data size
- Data blending (JOIN across multiple loaded files)
- Query plan inspection (`getQueryPlan`)
- Parquet predicate pushdown for efficient column/row filtering

### Bundle Size

~84 KB gzipped (phozart packages) + DuckDB-WASM runtime (~3.5 MB, loaded async)

The DuckDB-WASM binary is loaded asynchronously on first use. It does not
block initial page load.

### When to Use This

Use Patch 3 when your data lives in Parquet or Arrow files, when your dataset
is too large for a JavaScript array (100K+ rows), or when you need SQL queries
in the browser. This is particularly valuable for analytics engineers and data
scientists who want to explore data without a server.

If you need a complete BI platform with dashboards, reports, authoring tools,
and multi-user deployment -- move to Patch 4.

---

## Patch 4: "Full Orchestra" -- Complete BI Platform

**Every module patched together. Three shells, three audiences. Author creates
in the workspace. Analyst explores in the viewer. Admin governs in the editor.
This is a self-hosted Metabase/Looker alternative -- on an MIT license.**

### Signal Path

```
                     +--> @phozart/viewer    (analyst: read-only dashboards, reports, catalog)
                     |
Data --> Engine ------+--> @phozart/editor    (author: build/edit dashboards and reports)
  |       |          |
  |       |          +--> @phozart/workspace (admin: system config, connectors, templates)
  |       |
  |       +--> @phozart/widgets (charts, KPIs, gauges, scorecards)
  |       +--> @phozart/criteria (filters, selection criteria)
  |
  +--> @phozart/duckdb (optional: in-browser SQL for local data)
  +--> @phozart/shared (adapters, types, design system, coordination)
```

### Install

```bash
# Full platform
npm install @phozart/workspace @phozart/viewer @phozart/editor \
            @phozart/engine @phozart/widgets @phozart/criteria \
            @phozart/react @phozart/shared

# Optional: DuckDB for local/offline analytics
npm install @phozart/duckdb @duckdb/duckdb-wasm apache-arrow
```

### Three-Shell Architecture

The platform is split into three shells. Each shell is a Lit Web Component that
renders navigation chrome and accepts content via named slots.

| Shell         | Package              | Audience                      | Purpose                                                           |
| ------------- | -------------------- | ----------------------------- | ----------------------------------------------------------------- |
| **Viewer**    | `@phozart/viewer`    | Analysts, executives          | Consume dashboards, reports, explore data                         |
| **Editor**    | `@phozart/editor`    | Report authors, BI developers | Build and edit dashboards and reports                             |
| **Workspace** | `@phozart/workspace` | Platform admins               | System configuration, data connectors, templates, user management |

### React Example: Viewer Shell (Analyst Experience)

```tsx
'use client';
import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createViewerShellState, createViewerShellConfig, navigateTo } from '@phozart/viewer';

function ViewerShellInner() {
  const shellRef = useRef<HTMLElement>(null);
  const [shellState] = useState(() => createViewerShellState());

  // Register Lit custom elements
  useEffect(() => {
    import('@phozart/viewer');
  }, []);

  // Set object props imperatively (React cannot pass objects as attributes)
  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const config = createViewerShellConfig({
      branding: {
        appName: 'Acme Analytics',
        logoUrl: '/logo.svg',
      },
      features: {
        catalog: true,
        dashboards: true,
        reports: true,
        explorer: true,
        attention: true,
        commandPalette: true,
        filterBar: true,
      },
    });

    (el as any).config = config;
    (el as any).viewerContext = {
      userId: 'user-123',
      role: 'analyst',
      theme: 'dark',
    };
  }, []);

  return React.createElement(
    'phz-viewer-shell',
    { ref: shellRef },
    React.createElement('phz-viewer-catalog', { slot: 'catalog' }),
    React.createElement('phz-viewer-dashboard', { slot: 'dashboard' }),
    React.createElement('phz-viewer-report', { slot: 'report' }),
    React.createElement('phz-viewer-explorer', { slot: 'explorer' }),
    React.createElement('phz-filter-bar', { slot: 'filter-bar' }),
    React.createElement('phz-attention-dropdown', { slot: 'attention' }),
  );
}

export default dynamic(() => Promise.resolve(ViewerShellInner), { ssr: false });
```

### React Example: Editor Shell (Author Experience)

```tsx
'use client';
import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createEditorShellState, toggleEditMode } from '@phozart/editor';

function EditorShellInner() {
  const shellRef = useRef<HTMLElement>(null);
  const [editorState] = useState(() => createEditorShellState());

  useEffect(() => {
    import('@phozart/editor');
    import('@phozart/widgets');
  }, []);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    (el as any).theme = 'dark';
    (el as any).locale = 'en-US';
  }, []);

  return React.createElement(
    'phz-editor-shell',
    { ref: shellRef },
    React.createElement('phz-editor-catalog', { slot: 'catalog' }),
    React.createElement('phz-editor-dashboard', { slot: 'dashboard-edit' }),
    React.createElement('phz-editor-report', { slot: 'report-edit' }),
    React.createElement('phz-editor-explorer', { slot: 'explorer' }),
    React.createElement('phz-measure-palette', { slot: 'measures' }),
    React.createElement('phz-config-panel', { slot: 'config' }),
  );
}

export default dynamic(() => Promise.resolve(EditorShellInner), { ssr: false });
```

### React Example: Workspace Shell (Admin Experience)

```tsx
'use client';
import React, { useRef, useLayoutEffect, useEffect } from 'react';
import dynamic from 'next/dynamic';

function WorkspaceShellInner() {
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Import sub-paths to register each custom element
    import('@phozart/workspace/authoring');
    import('@phozart/workspace/engine-admin');
    import('@phozart/workspace/registry');
    import('@phozart/workspace/filters');
    import('@phozart/workspace/templates');
    import('@phozart/workspace/explore');
  }, []);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    (el as any).role = 'admin';
  }, []);

  return React.createElement(
    'phz-workspace-shell',
    { ref: shellRef },
    React.createElement('phz-dashboard-builder', { slot: 'dashboards' }),
    React.createElement('phz-grid-admin', { slot: 'grid-admin', open: true }),
    React.createElement('phz-engine-admin', { slot: 'engine-admin' }),
  );
}

export default dynamic(() => Promise.resolve(WorkspaceShellInner), { ssr: false });
```

### Deployment Patterns

You do not have to deploy all three shells. Choose the pattern that fits your
use case.

| Pattern             | Packages                                    | Audience           | Example                              |
| ------------------- | ------------------------------------------- | ------------------ | ------------------------------------ |
| **Viewer-only**     | shared + viewer + widgets                   | Analysts           | Embedded analytics in a SaaS product |
| **Author + Viewer** | shared + viewer + editor + engine + widgets | Authors + analysts | Self-service BI for a data team      |
| **Full admin**      | All packages                                | Platform team      | Internal Metabase/Looker replacement |
| **Headless**        | shared + engine + core                      | Backend services   | Server-side report generation, API   |

### What You Get (on top of Patches 1-3)

- **Viewer shell**: Artifact catalog, dashboard viewer, report viewer, data explorer, attention/notification system, command palette, filter bar, keyboard shortcuts help, data freshness indicators
- **Editor shell**: Dashboard drag-and-drop builder, report column editor, visual query explorer, measure palette, widget config panel, undo/redo, auto-save, publishing workflow
- **Workspace shell**: Widget registry with variants, template gallery with auto-binding, filter hierarchy management (4 levels: global, dashboard, widget, ad-hoc), data connector admin, expression editor with autocomplete
- **Cross-cutting**: 4-level filter cascade, URL-synced filter state, cross-filter highlighting, personal alert engine, subscription engine, usage analytics, responsive layout with container queries
- **Criteria system**: Filter definition catalog, rule engine, artifact-to-filter binding, security-aware filter resolution, presets (date ranges, fiscal quarters)

### Bundle Size

Full platform: ~350 KB gzipped (all phozart packages + Lit runtime, excluding DuckDB-WASM)

Individual shells can be code-split. The viewer shell alone is ~120 KB gzipped.

### When to Use This

Use Patch 4 when you are building a complete BI platform. This is the right
choice when you need multi-user dashboards, report authoring, a data catalog,
and administrative tooling. You are building something that would otherwise
require Metabase, Superset, or Looker -- except you own the code, it runs on
MIT, and every component is a composable Web Component.

---

## Module I/O Reference

Every package has defined inputs and outputs. This table shows what each module
consumes and produces, so you can trace the signal path through any patch.

| Package                | Input                                                                                | Output                                                                  | Key Factory / Entry Point                                                   |
| ---------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `@phozart/core`        | `data: Record<string, unknown>[]`, `columns: ColumnDefinition[]`                     | `GridApi` (sort, filter, select, edit, export, events)                  | `createGrid({ data, columns })`                                             |
| `@phozart/grid`        | `GridApi` or direct props (`data`, `columns`, `theme`, `density`)                    | Rendered `<phz-grid>` Web Component                                     | `<phz-grid>` custom element                                                 |
| `@phozart/react`       | Same as `@phozart/grid` via React props                                              | React-wrapped `<PhzGrid>`                                               | `import { PhzGrid } from '@phozart/react/grid'`                             |
| `@phozart/engine`      | `data: Record<string, unknown>[]`, `AggregationConfig`, `PivotConfig`, `ChartConfig` | `AggregationResult`, `PivotResult`, `ChartDataSeries[]`, `BIEngine`     | `createBIEngine(config?)`                                                   |
| `@phozart/widgets`     | Widget-specific props (value, data, label, series)                                   | Rendered Lit Web Components (`<phz-kpi-card>`, `<phz-bar-chart>`, etc.) | Individual component imports                                                |
| `@phozart/duckdb`      | `DuckDBConfig`, then files (Parquet/CSV/Arrow/JSON) or SQL strings                   | `DuckDBDataSource` (query, schema, stream)                              | `createDuckDBDataSource(config)`                                            |
| `@phozart/criteria`    | `CriteriaConfig`, `data`                                                             | Rendered filter UI, `CriteriaApplyEvent`                                | `<phz-selection-criteria>`                                                  |
| `@phozart/shared`      | Adapter interfaces (`DataAdapter`, `ViewerContext`)                                  | Design tokens, type definitions, coordination primitives                | Sub-path imports (`/adapters`, `/types`, `/design-system`, `/coordination`) |
| `@phozart/viewer`      | `ViewerShellConfig`, `ViewerContext`                                                 | Rendered viewer shell with catalog, dashboards, reports                 | `createViewerShellState()`, `<phz-viewer-shell>`                            |
| `@phozart/editor`      | Theme, locale, adapter references                                                    | Rendered editor shell with authoring tools                              | `createEditorShellState()`, `<phz-editor-shell>`                            |
| `@phozart/workspace`   | `WorkspaceAdapter`, role (`'admin'` or `'author'`)                                   | Rendered workspace shell with admin panels                              | `<phz-workspace-shell>`                                                     |
| `@phozart/ai`          | `SchemaField[]`, optional prompt string                                              | `SchemaAnalysis`, `WidgetSuggestion[]`, `DashboardConfig`               | `analyzeSchema(fields)`, `generateDashboardConfig(opts)`                    |
| `@phozart/collab`      | `CollabConfig` (Yjs doc, sync adapter)                                               | Real-time collaboration state, awareness cursors                        | `createCollabProvider(config)`                                              |
| `@phozart/definitions` | Serialized grid/dashboard/report JSON                                                | Validated, typed config objects                                         | Zod schemas + converters                                                    |

### Column Type Reference

The `type` field on `ColumnDefinition` accepts these values:

| Type         | Description                                | Sort Behavior | Filter Operators                       |
| ------------ | ------------------------------------------ | ------------- | -------------------------------------- |
| `'string'`   | Text values (default)                      | Lexicographic | equals, contains, startsWith, endsWith |
| `'number'`   | Numeric values                             | Numeric       | equals, gt, gte, lt, lte, between      |
| `'date'`     | Date values (ISO 8601 string)              | Chronological | equals, before, after, between         |
| `'datetime'` | Date + time values                         | Chronological | equals, before, after, between         |
| `'boolean'`  | True/false values                          | false < true  | equals                                 |
| `'custom'`   | Custom type with user-provided sort/render | User-defined  | User-defined                           |

### Event Reference (Grid)

```typescript
const grid = createGrid({ data, columns });

grid.on('sort:change', (e) => {
  /* { field, direction } */
});
grid.on('filter:change', (e) => {
  /* { field, operator, value } */
});
grid.on('selection:change', (e) => {
  /* { selectedRows, selectedIds } */
});
grid.on('cell:edit', (e) => {
  /* { rowId, field, oldValue, newValue } */
});
grid.on('row:click', (e) => {
  /* { row, rowIndex } */
});
grid.on('row:dblclick', (e) => {
  /* { row, rowIndex } */
});
grid.on('column:resize', (e) => {
  /* { field, width } */
});
grid.on('page:change', (e) => {
  /* { page, pageSize } */
});
```

---

## Next Steps

- **Integration Guide**: `docs/INTEGRATION-GUIDE.md` -- complete reference with
  Next.js setup, admin panels, shell configuration, and common pitfalls.
- **AI Reference**: `docs/PHZ-GRID-AI-REFERENCE.md` -- condensed reference for
  AI assistants building with phozart.
- **Architecture Spec**: `docs/architecture/SYSTEM-ARCHITECTURE.md` -- full
  system architecture and package dependency graph.
- **Type Contracts**: `docs/contracts/TYPE-CONTRACTS.md` -- complete type
  definitions for all 116+ exported types.
