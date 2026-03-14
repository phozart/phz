# phz-grid Integration Guide

Complete reference for integrating @phozart packages into your application.
Every example in this guide is extracted from production test apps and verified working.

## Table of Contents

- [Package Overview](#package-overview)
- [Installation](#installation)
- [Next.js Setup](#nextjs-setup)
- [React: Basic Grid](#react-basic-grid)
- [React: Full-Featured Grid](#react-full-featured-grid)
- [React: Selection Criteria](#react-selection-criteria)
- [React: Grid Admin Panel](#react-grid-admin-panel)
- [React: Dashboard Widgets](#react-dashboard-widgets)
- [Headless Grid (No UI)](#headless-grid-no-ui)
- [BI Engine](#bi-engine)
- [AI Toolkit](#ai-toolkit)
- [Grid Definitions](#grid-definitions)
- [Shared Infrastructure](#shared-infrastructure-phozartphz-shared)
- [Viewer Shell](#viewer-shell-phozartphz-viewer)
- [Editor Shell](#editor-shell-phozartphz-editor)
- [Three-Shell Deployment Patterns](#three-shell-deployment-patterns)
- [API Quick Reference](#api-quick-reference)
- [Common Pitfalls](#common-pitfalls)

---

## Package Overview

| Package | Purpose | Use When |
|---------|---------|----------|
| `@phozart/core` | Headless grid engine | You need data operations without UI |
| `@phozart/react` | React components + hooks | Building a React/Next.js app |
| `@phozart/grid` | Lit Web Component grid | Using vanilla JS or non-React frameworks |
| `@phozart/criteria` | Filter/criteria UI components | Adding page-level filters |
| `@phozart/grid-admin` | Admin configuration panel | Letting users customize the grid |
| `@phozart/widgets` | Dashboard widgets (charts, KPIs) | Building dashboards |
| `@phozart/engine` | BI computation engine | KPIs, aggregation, pivots, reports |
| `@phozart/definitions` | Serializable grid blueprints | Saving/loading grid configurations |
| `@phozart/grid-creator` | Grid creation wizard | Guided grid setup flow |
| `@phozart/ai` | AI toolkit | Schema analysis, widget suggestions, KPI generation |
| `@phozart/duckdb` | DuckDB-WASM adapter | Large-scale analytics in the browser |
| `@phozart/collab` | Real-time collaboration | Multi-user editing with CRDTs |
| `@phozart/shared` | Shared infrastructure (adapters, types, design system) | Foundation for all shells |
| `@phozart/viewer` | Read-only consumption shell | Embedded analytics, analyst dashboards |
| `@phozart/editor` | Authoring shell | Self-service BI, dashboard/report creation |

### Dependency Graph

```
shared (foundation — adapters, types, design system, coordination)
shared ← core ← grid ← grid-admin ← grid-creator
shared ← core ← react (wraps grid, criteria, grid-admin)
shared ← core ← engine ← widgets
shared ← core ← engine ← engine-admin
shared ← core ← criteria
shared ← core ← definitions
shared ← core ← ai
shared ← core ← duckdb
shared ← core ← collab
shared ← viewer (read-only shell)
shared ← editor (authoring shell)
```

---

## Installation

### For a React/Next.js App (most common)

```bash
npm install @phozart/core @phozart/react @phozart/grid @phozart/criteria @phozart/grid-admin
```

### Add dashboard widgets

```bash
npm install @phozart/widgets @phozart/engine
```

### Add AI features

```bash
npm install @phozart/ai
```

---

## Next.js Setup

### next.config.ts

Lit web components require transpilation. **Do NOT add @phozart packages to `transpilePackages`** — only Lit itself.

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    'lit',
    '@lit/reactive-element',
    'lit-element',
    'lit-html',
  ],
};

export default nextConfig;
```

### For local development with symlinked packages

If you're developing against the monorepo source (not published npm packages), add webpack aliases pointing to compiled `dist/` output:

```typescript
import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgs = path.resolve(__dirname, '../phz-grid/packages');

const packageAliases: Record<string, string> = {
  '@phozart/core':           path.resolve(pkgs, 'core/dist/index.js'),
  '@phozart/engine':         path.resolve(pkgs, 'engine/dist/index.js'),
  '@phozart/grid':           path.resolve(pkgs, 'grid/dist/index.js'),
  '@phozart/react/grid':     path.resolve(pkgs, 'react/dist/grid.js'),
  '@phozart/react/criteria': path.resolve(pkgs, 'react/dist/criteria.js'),
  '@phozart/react/admin':    path.resolve(pkgs, 'react/dist/admin.js'),
  '@phozart/react':          path.resolve(pkgs, 'react/dist/index.js'),
  '@phozart/widgets':        path.resolve(pkgs, 'widgets/dist/index.js'),
  '@phozart/criteria':       path.resolve(pkgs, 'criteria/dist/index.js'),
  '@phozart/grid-admin':     path.resolve(pkgs, 'grid-admin/dist/index.js'),
  '@phozart/definitions':    path.resolve(pkgs, 'definitions/dist/index.js'),
  '@phozart/ai':             path.resolve(pkgs, 'ai/dist/index.js'),
};

const nextConfig: NextConfig = {
  transpilePackages: ['lit', '@lit/reactive-element', 'lit-element', 'lit-html'],
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, ...packageAliases };
    return config;
  },
};

export default nextConfig;
```

**Important**: Turbopack (Next.js 16 default) has a known bug with absolute path aliases. Use `next build --webpack` or `next dev --webpack` until this is fixed.

---

## React: Basic Grid

Every phz component must be client-side rendered (Lit web components don't support SSR).

### Step 1: Create a dynamic wrapper

```typescript
// components/PhzGridWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

export const PhzGridDynamic = dynamic(
  () => import('@phozart/react/grid').then((mod) => mod.PhzGrid),
  { ssr: false, loading: () => <div>Loading grid...</div> },
);
```

### Step 2: Use it in your page

```typescript
// app/page.tsx
'use client';

import { PhzGridDynamic } from '../components/PhzGridWrapper';
import type { ColumnDefinition } from '@phozart/core';

const data = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 120000 },
  { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 95000 },
  { id: 3, name: 'Carol Davis', department: 'Sales', salary: 87000 },
];

const columns: ColumnDefinition[] = [
  { field: 'id', header: 'ID', width: 60, type: 'number', sortable: true },
  { field: 'name', header: 'Name', width: 200, sortable: true, filterable: true },
  { field: 'department', header: 'Department', width: 140, sortable: true, filterable: true },
  { field: 'salary', header: 'Salary', width: 120, type: 'number', sortable: true },
];

export default function Page() {
  return (
    <div style={{ height: 400 }}>
      <PhzGridDynamic data={data} columns={columns} theme="dark" />
    </div>
  );
}
```

---

## React: Full-Featured Grid

The `useGridOrchestrator` hook manages grid state and coordinates with criteria and admin panels.

```typescript
'use client';

import { useState, useCallback } from 'react';
import { PhzGrid, useGridOrchestrator } from '@phozart/react/grid';
import type { ColumnDefinition } from '@phozart/core';

const COLUMNS: ColumnDefinition[] = [
  { field: 'id', header: 'ID', width: 60, type: 'number', sortable: true, filterable: true },
  { field: 'name', header: 'Name', width: 180, sortable: true, filterable: true, editable: true },
  { field: 'email', header: 'Email', width: 220, sortable: true, filterable: true },
  { field: 'department', header: 'Department', width: 130, sortable: true, filterable: true },
  { field: 'salary', header: 'Salary', width: 110, type: 'number', sortable: true, filterable: true },
  { field: 'startDate', header: 'Start Date', width: 120, type: 'date', sortable: true },
  { field: 'status', header: 'Status', width: 100, type: 'string', sortable: true, filterable: true },
];

// STATUS_COLORS: `dot` must be a required string, not optional
const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active:   { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  inactive: { bg: '#1c1917', color: '#78716c', dot: '#57534e' },
};

const ROW_ACTIONS = [
  { id: 'view', label: 'View', icon: '👁' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'delete', label: 'Delete', icon: '🗑', variant: 'danger' as const },
];

export default function FullGrid({ data }: { data: any[] }) {
  const [selectedCount, setSelectedCount] = useState(0);

  const {
    gridRef,
    gridApi,
    handleGridReady,
    handleCriteriaApply,
    handleCriteriaReset,
    handleSettingsSave,
    presentationProps,
    filters,
  } = useGridOrchestrator();

  return (
    <PhzGrid
      ref={gridRef}
      data={data}
      columns={COLUMNS}
      height="520px"
      theme="dark"
      density="compact"
      selectionMode="multi"
      editMode="dblclick"
      // Toolbar features
      showToolbar={true}
      showSearch={true}
      showDensityToggle={true}
      showColumnEditor={true}
      showCsvExport={true}
      showExcelExport={true}
      // Pagination
      showPagination={true}
      pageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
      // Row features
      showCheckboxes={true}
      showRowActions={true}
      rowActions={ROW_ACTIONS}
      rowBanding={true}
      hoverHighlight={true}
      gridLines="horizontal"
      // Display
      statusColors={STATUS_COLORS}
      compactNumbers={true}
      gridTitle="Employee Directory"
      gridSubtitle={`${data.length} employees`}
      allowSorting={true}
      allowFiltering={true}
      // Events — handlers receive unwrapped detail, NOT CustomEvent
      onGridReady={handleGridReady}
      onSelectionChange={(e) => setSelectedCount(e.selectedRows?.length ?? 0)}
      onSortChange={(e: any) => console.log('sort', e.field, e.direction)}
      onEditCommit={(e: any) => console.log('edit', e.field, '=', e.value)}
      onRowAction={(e: any) => console.log('action', e.actionId, e.rowData?.id)}
      // Spread presentation props from orchestrator (criteria filters, admin settings)
      {...presentationProps}
    />
  );
}
```

### Available PhzGrid Props

**Core data**: `data`, `columns`, `height`, `width`
**Theme**: `theme` (`'light'|'dark'|'midnight'|'sand'|'high-contrast'`), `density` (`'compact'|'comfortable'|'dense'`)
**Interaction**: `selectionMode` (`'none'|'single'|'multi'|'range'`), `editMode` (`'none'|'click'|'dblclick'`)
**Toolbar**: `showToolbar`, `showSearch`, `showDensityToggle`, `showColumnEditor`, `showCsvExport`, `showExcelExport`
**Pagination**: `showPagination`, `pageSize`, `pageSizeOptions`, `paginationAlign`
**Row features**: `showCheckboxes`, `showRowActions`, `rowActions`, `rowBanding`, `hoverHighlight`
**Display**: `gridLines`, `gridTitle`, `gridSubtitle`, `statusColors`, `compactNumbers`, `autoSizeColumns`
**Data**: `allowSorting`, `allowFiltering`, `groupBy`, `aggregation`, `conditionalFormattingRules`

### Available Events

| Event | Detail Shape |
|-------|-------------|
| `onGridReady` | `gridInstance: GridApi` |
| `onSelectionChange` | `{ selectedRows, selectedIds }` |
| `onSortChange` | `{ field, direction }` |
| `onFilterChange` | `{ filters }` |
| `onCellClick` | `{ field, rowData, value }` |
| `onCellDoubleClick` | `{ field, rowData, value }` |
| `onEditStart` | `{ field, rowData }` |
| `onEditCommit` | `{ field, value, oldValue, rowData }` |
| `onEditCancel` | `{ field, rowData }` |
| `onRowAction` | `{ actionId, rowData }` |
| `onCopy` | `{ rowCount }` |

---

## React: Selection Criteria

Filter bars that connect to the grid via `useGridOrchestrator`.

```typescript
'use client';

import { PhzSelectionCriteria } from '@phozart/react/criteria';
import type { CriteriaConfig } from '@phozart/core';

const CRITERIA_CONFIG: CriteriaConfig = {
  fields: [
    {
      id: 'department',
      label: 'Department',
      type: 'chip_group',
      dataField: 'department',
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Sales', label: 'Sales' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'single_select',
      dataField: 'status',
      placeholder: 'All',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      id: 'location',
      label: 'Location',
      type: 'multi_select',
      dataField: 'location',
      options: [
        { value: 'New York', label: 'New York' },
        { value: 'San Francisco', label: 'San Francisco' },
      ],
    },
    {
      id: 'salary',
      label: 'Salary Range',
      type: 'numeric_range',
      dataField: 'salary',
      numericRangeConfig: {
        min: 70000, max: 170000, step: 5000,
        unit: '$', showSlider: true,
      },
    },
  ],
};

// Use with useGridOrchestrator:
<PhzSelectionCriteria
  config={CRITERIA_CONFIG}
  data={data}
  onCriteriaApply={(detail: any) => {
    handleCriteriaApply({ context: detail.context ?? detail });
  }}
  onCriteriaReset={() => handleCriteriaReset()}
/>
```

### Criteria Field Types

| Type | Description | Required Config |
|------|-------------|-----------------|
| `chip_group` | Clickable chip buttons | `options` |
| `single_select` | Dropdown, one value | `options`, `placeholder` |
| `multi_select` | Dropdown, multiple values | `options` |
| `numeric_range` | Min/max slider | `numericRangeConfig` |
| `search` | Free-text search | — |

---

## React: Grid Admin Panel

Tabbed configuration panel for grid appearance and behavior.

```typescript
'use client';

import { PhzGridAdmin } from '@phozart/react/admin';

<PhzGridAdmin
  open={isAdminOpen}
  gridRef={gridRef}
  columns={COLUMNS}
  reportName="Employee Directory"
  statusColors={STATUS_COLORS}
  onClose={() => setAdminOpen(false)}
  onSettingsSave={(detail) => {
    handleSettingsSave({ settings: detail.settings });
    setAdminOpen(false);
  }}
/>
```

---

## React: Dashboard Widgets

Widgets are Lit web components. In React/Next.js, use `React.createElement` (not JSX) and dynamic imports.

### Widget wrapper factory

```typescript
// components/wrappers/DynamicWidgets.tsx
'use client';

import React, { useEffect, type FC } from 'react';
import dynamic from 'next/dynamic';

function widgetFactory(tag: string): FC<Record<string, any>> {
  function Widget(props: Record<string, any>) {
    useEffect(() => { import('@phozart/widgets'); }, []);
    return React.createElement(tag, props);
  }
  Widget.displayName = tag;
  return Widget;
}

const loading = () => <div>Loading widget...</div>;

export const DynamicPhzKPICard   = dynamic(() => Promise.resolve(widgetFactory('phz-kpi-card')), { ssr: false, loading });
export const DynamicPhzBarChart  = dynamic(() => Promise.resolve(widgetFactory('phz-bar-chart')), { ssr: false, loading });
export const DynamicPhzLineChart = dynamic(() => Promise.resolve(widgetFactory('phz-line-chart')), { ssr: false, loading });
export const DynamicPhzPieChart  = dynamic(() => Promise.resolve(widgetFactory('phz-pie-chart')), { ssr: false, loading });
export const DynamicPhzGauge     = dynamic(() => Promise.resolve(widgetFactory('phz-gauge')), { ssr: false, loading });
export const DynamicPhzTrendLine = dynamic(() => Promise.resolve(widgetFactory('phz-trend-line')), { ssr: false, loading });
```

### Usage

```typescript
<DynamicPhzKPICard label="Total Revenue" value="$2.4M" trend="+12%" />

<DynamicPhzGauge value={72} max={100} label="Win Rate" />

<DynamicPhzBarChart
  data={JSON.stringify([
    { label: 'Q1', value: 450 },
    { label: 'Q2', value: 620 },
    { label: 'Q3', value: 580 },
    { label: 'Q4', value: 710 },
  ])}
/>
```

---

## Headless Grid (No UI)

Use `@phozart/core` directly for data operations without any rendering.

```typescript
import { createGrid } from '@phozart/core';

const grid = createGrid({
  data: [
    { id: 1, name: 'Alice', age: 30, city: 'NYC' },
    { id: 2, name: 'Bob', age: 25, city: 'LA' },
    { id: 3, name: 'Carol', age: 35, city: 'NYC' },
  ],
  columns: [
    { field: 'id', type: 'number' },
    { field: 'name' },
    { field: 'age', type: 'number' },
    { field: 'city' },
  ],
});

// Read data
grid.getData();                          // All rows (with __id added)
grid.getData().length;                   // Row count

// Sort
grid.sort('age', 'asc');
grid.getSortedRowModel();                // { rows: [...sorted] }

// Filter
grid.addFilter('city', 'equals', 'NYC');
grid.getFilteredRowModel();              // { rows: [...filtered] }

// Select
grid.select(rowId);
grid.getSelection();                     // Selected rows
grid.deselectAll();

// CRUD
const newId = grid.addRow({ name: 'Diana', age: 28, city: 'Chicago' });
grid.deleteRow(rowId);

// Export
grid.exportCsv();                        // CSV string

// Undo/Redo
grid.undo();
grid.redo();

// Events
grid.on('sort:change', (e) => console.log('sorted:', e));
grid.on('filter:change', (e) => console.log('filtered:', e));
grid.on('selection:change', (e) => console.log('selected:', e));

// State
const state = grid.getState();           // Full grid state object
```

### Column Types

Valid `type` values: `'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom'`

Do **NOT** use `'status'` — it doesn't exist in `ColumnType`. Use `'string'` instead.

---

## BI Engine

Aggregation, KPIs, pivots, reports, and dashboards.

```typescript
import {
  createBIEngine,
  computeAggregation,
  computeAggregations,
  createDataProductRegistry,
  createKPIRegistry,
  createMetricCatalog,
  createReportService,
  createDashboardService,
  createCriteriaEngine,
  computeStatus,
} from '@phozart/engine';

// Facade: creates engine with all sub-systems
const engine = createBIEngine();

// Single-field aggregation
const total = computeAggregation(data, 'salary', 'sum');   // number
const avg   = computeAggregation(data, 'salary', 'avg');

// Multi-field aggregation
const result = computeAggregations(data, {
  fields: [
    { field: 'salary', functions: ['sum', 'avg', 'min', 'max'] },
    { field: 'projects', functions: ['sum', 'count'] },
  ],
});
// result.fieldResults.salary.sum → 450000
// result.fieldResults.salary.avg → 90000

// Factory functions for sub-systems
const registry   = createDataProductRegistry();
const kpiReg     = createKPIRegistry();
const catalog    = createMetricCatalog();
const reports    = createReportService();
const dashboards = createDashboardService();
const criteria   = createCriteriaEngine();
```

---

## AI Toolkit

Schema analysis, widget suggestions, and KPI generation — all local, no API key needed.

```typescript
import {
  analyzeSchema,
  suggestWidgets,
  suggestLayout,
  generateDashboardConfig,
  generateKPIConfig,
  parseKPIDescription,
} from '@phozart/ai';
import type { SchemaAnalysis, WidgetSuggestion } from '@phozart/ai';

// Step 1: Analyze your data schema
const analysis = analyzeSchema([
  { name: 'salary', type: 'number' as const, cardinality: 100 },
  { name: 'department', type: 'string' as const, cardinality: 8 },
  { name: 'hire_date', type: 'date' as const },
  { name: 'name', type: 'string' as const },
]);
// Returns: { measures, dimensions, temporal, categorical, identifiers }

// Step 2: Get widget suggestions
const suggestions = suggestWidgets(analysis);
// Returns: WidgetSuggestion[] with { widgetType, title, fields, priority }

// Step 3: Get layout suggestion
const layout = suggestLayout(suggestions);
// Returns: { columns: number, placements: LayoutPlacement[] }

// Step 4: Generate full dashboard config
const dashboard = generateDashboardConfig({
  fields: [
    { name: 'salary', type: 'number' as const },
    { name: 'department', type: 'string' as const },
  ],
  prompt: 'Build an HR dashboard showing salary distribution and department breakdown',
  options: { name: 'HR Dashboard', maxWidgets: 8, columns: 2 },
});

// KPI from natural language
const parsed = parseKPIDescription('Average salary, target $100K, higher is better');
const kpiConfig = generateKPIConfig(
  'Average salary, target $100K, higher is better',
  [{ name: 'salary', type: 'number' }],
);
```

---

## Grid Definitions

Save and load grid configurations with Zod validation.

```typescript
import {
  GridDefinitionSchema,
  createInMemoryStore,
  exportDefinition,
  importDefinition,
  validateDefinition,
  migrateDefinition,
} from '@phozart/definitions';

// Validate a grid definition
const result = GridDefinitionSchema.safeParse({
  id: 'my-grid-1',
  version: 1,
  name: 'Employee Grid',
  columns: [{ field: 'id', header: 'ID' }],
  settings: {},
});

if (result.success) {
  console.log('Valid definition:', result.data);
} else {
  console.error('Validation errors:', result.error);
}

// Store for CRUD operations
const store = createInMemoryStore();
```

---

## API Quick Reference

### createGrid API

| Method | Returns | Description |
|--------|---------|-------------|
| `getData()` | `any[]` | All rows with `__id` |
| `getSortedRowModel()` | `{ rows }` | Sorted rows |
| `getFilteredRowModel()` | `{ rows }` | Filtered rows |
| `getSelection()` | `any[]` | Selected rows |
| `getState()` | `GridState` | Full state object |
| `sort(field, direction)` | `void` | Sort by field |
| `addFilter(field, op, value)` | `void` | Add filter |
| `select(id)` | `void` | Select row |
| `deselectAll()` | `void` | Clear selection |
| `addRow(data)` | `string` | Add row, returns id |
| `deleteRow(id)` | `void` | Delete row |
| `exportCsv()` | `string` | CSV export |
| `undo()` / `redo()` | `void` | Undo/redo |
| `on(event, handler)` | `Unsubscribe` | Listen to events |

### useGridOrchestrator Hook

| Return | Type | Description |
|--------|------|-------------|
| `gridRef` | `React.Ref` | Pass to `<PhzGrid ref={gridRef}>` |
| `gridApi` | `GridApi \| null` | Grid instance after ready |
| `handleGridReady` | `(e) => void` | Pass to `onGridReady` |
| `handleCriteriaApply` | `({ context }) => void` | Connect criteria |
| `handleCriteriaReset` | `() => void` | Reset criteria |
| `handleSettingsSave` | `({ settings }) => void` | Connect admin |
| `presentationProps` | `object` | Spread on `<PhzGrid>` |
| `filters` | `Record<string, any>` | Active filter state |

### computeAggregations Config

```typescript
computeAggregations(data, {
  fields: [
    { field: 'revenue', functions: ['sum', 'avg', 'min', 'max', 'count'] },
  ],
});
```

---

## Shared Infrastructure (`@phozart/shared`)

The shared package provides adapter interfaces, design system tokens, artifact metadata types, and runtime coordination state machines. All three shells (workspace, viewer, editor) depend on it.

### Importing shared types

```typescript
// Adapter SPI — implement these in your app
import type { DataAdapter, DataQuery, DataResult, ViewerContext } from '@phozart/shared/adapters';

// Types — alert, subscription, widget types
import type {
  PersonalAlert,
  Subscription,
  SingleValueAlertConfig,
  MicroWidgetCellConfig,
  CellRendererRegistry,
} from '@phozart/shared/types';

// Artifact metadata
import type { ArtifactVisibility, DefaultPresentation, GridArtifact } from '@phozart/shared/artifacts';

// Design tokens
import { DESIGN_TOKENS, ALERT_WIDGET_TOKENS, IMPACT_CHAIN_TOKENS } from '@phozart/shared/design-system';

// Runtime coordination
import { createFilterContext, createInteractionBus } from '@phozart/shared/coordination';
```

### CellRendererRegistry setup

Micro-widget renderers (sparklines, gauges, deltas inside grid cells) are registered at mount time to avoid circular build-time dependencies between grid and widgets.

```typescript
import { createCellRendererRegistry } from '@phozart/shared/types';
import type { MicroWidgetRenderer, MicroWidgetCellConfig } from '@phozart/shared/types';

// Create the registry once
const registry = createCellRendererRegistry();

// Register a custom sparkline renderer
const sparklineRenderer: MicroWidgetRenderer = {
  render(config, value, width, height) {
    // Return { html: '<svg>...</svg>', width, height }
    const points = Array.isArray(value) ? value : [];
    const svg = `<svg width="${width}" height="${height}">...</svg>`;
    return { html: svg, width, height };
  },
  canRender(config, columnWidth) {
    return columnWidth >= 80; // Need at least 80px for sparklines
  },
};

registry.register('trend-line', sparklineRenderer);

// Check registration
registry.has('trend-line');          // true
registry.getRegisteredTypes();       // ['trend-line']
```

### Alert-aware widget configuration

Single-value widgets (KPI card, gauge, scorecard, trend-line) can display alert state visually. Configure alert binding on the widget, then resolve visual state from live alert events.

```typescript
import {
  createDefaultAlertConfig,
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
} from '@phozart/shared/types';
import type { SingleValueAlertConfig, WidgetAlertSeverity } from '@phozart/shared/types';

// 1. Configure alert binding on the widget
const alertConfig: SingleValueAlertConfig = {
  ...createDefaultAlertConfig(),
  alertRuleBinding: 'alert-revenue-drop',
  alertVisualMode: 'border',
};

// 2. At render time, resolve visual state from live alert events
const alertEvents = new Map<string, WidgetAlertSeverity>();
alertEvents.set('alert-revenue-drop', 'warning');

const visualState = resolveAlertVisualState(alertConfig, alertEvents);
// { severity: 'warning', ruleId: 'alert-revenue-drop', lastTransition: <timestamp> }

// 3. Get design tokens for the resolved state
const tokens = getAlertTokens(visualState.severity, alertConfig.alertVisualMode);
// { border: 'widget.alert.warning.border', indicator: 'widget.alert.warning.indicator' }

// 4. Degrade rendering in small containers
const params = degradeAlertMode(alertConfig.alertVisualMode, 'compact');
// { showIndicator: true, indicatorSize: 8, borderWidth: 3, showBackground: false }
```

---

## Viewer Shell (`@phozart/viewer`)

The viewer shell provides a read-only consumption experience for the analyst persona. It includes catalog browsing, dashboard viewing, report viewing, data exploration, attention notifications, and global filter bar.

### Installation

```bash
npm install @phozart/shared @phozart/viewer
```

### Basic setup

```typescript
'use client';

import {
  createViewerShellState,
  createViewerShellConfig,
  navigateTo,
  setViewerContext,
} from '@phozart/viewer';
import type { ViewerShellState } from '@phozart/viewer';

// Initialize state
let state = createViewerShellState();

// Set viewer context (user identity for RLS)
state = setViewerContext(state, {
  userId: 'analyst-1',
  roles: ['analyst'],
  attributes: {},
});

// Navigate to a dashboard
state = navigateTo(state, 'dashboard', 'dashboard-sales-overview');
```

### Lit components

The viewer ships 9 Lit web components. Register them by importing the package, then use in HTML or a framework.

```typescript
import '@phozart/viewer';

// In HTML:
// <phz-viewer-shell></phz-viewer-shell>
// <phz-viewer-catalog></phz-viewer-catalog>
// <phz-viewer-dashboard></phz-viewer-dashboard>
// <phz-viewer-report></phz-viewer-report>
// <phz-viewer-explorer></phz-viewer-explorer>
// <phz-attention-dropdown></phz-attention-dropdown>
// <phz-filter-bar></phz-filter-bar>
```

---

## Editor Shell (`@phozart/editor`)

The editor shell provides a BI authoring environment for the author persona. It supports creating and editing dashboards, reports, and explorer queries, with widget configuration, measure palette, sharing, and alert/subscription management.

### Installation

```bash
npm install @phozart/shared @phozart/editor
```

### Basic setup

```typescript
'use client';

import {
  createEditorShellState,
  createEditorShellConfig,
  navigateTo,
  toggleEditMode,
  markUnsavedChanges,
  markSaved,
} from '@phozart/editor';

// Initialize state
let state = createEditorShellState();

// Navigate to a dashboard in edit mode
state = navigateTo(state, 'dashboard-edit', 'dashboard-sales-overview');
state = toggleEditMode(state);

// Track unsaved changes
state = markUnsavedChanges(state);

// After save
state = markSaved(state);
```

### Lit components

The editor ships 9 Lit web components.

```typescript
import '@phozart/editor';

// <phz-editor-shell></phz-editor-shell>
// <phz-editor-catalog></phz-editor-catalog>
// <phz-editor-dashboard></phz-editor-dashboard>
// <phz-editor-report></phz-editor-report>
// <phz-editor-explorer></phz-editor-explorer>
// <phz-measure-palette></phz-measure-palette>
// <phz-config-panel></phz-config-panel>
// <phz-sharing-flow></phz-sharing-flow>
// <phz-alert-subscription></phz-alert-subscription>
```

---

## Three-Shell Deployment Patterns

### Viewer-only (embedded analytics)

Deploy only the viewer shell for read-only consumption. Smallest bundle, no authoring UI.

```bash
npm install @phozart/shared @phozart/viewer
```

### Author + Viewer (self-service BI)

Deploy viewer for analysts and editor for authors. Authors create dashboards and reports; analysts consume them.

```bash
npm install @phozart/shared @phozart/viewer @phozart/editor
```

### Full Admin (platform administrators)

Deploy all three shells. Workspace for admin operations (data sources, filter architecture, governance), editor for authoring, viewer for consumption.

```bash
npm install @phozart/shared @phozart/workspace @phozart/viewer @phozart/editor
```

### Headless (server-side computation)

Use the engine and core packages without any UI shells.

```bash
npm install @phozart/shared @phozart/core @phozart/engine
```

---

## Three-Shell Setup Guide (React / Next.js)

All three shell components (`<phz-workspace>`, `<phz-viewer-shell>`, `<phz-editor-shell>`) use **Web Component slots** for their content areas. The shell provides the navigation chrome (header, sidebar, tabs), and the **consumer** provides the actual panel/screen content as slotted children. This is the standard Web Components composition pattern.

### Key Architecture Concepts

1. **Shells are navigation containers** — they render sidebar/tab navigation and route to named slots.
2. **Content is provided via named slots** — e.g., `<phz-grid-admin slot="grid-admin">` gets projected into the workspace's `grid-admin` panel.
3. **Complex properties must be set imperatively** — React can't pass JavaScript objects as HTML attributes. Use `useLayoutEffect` + ref to set properties like `adapter`, `config`, `dataAdapter`.
4. **Custom element registration is via side-effect imports** — importing a module registers its `@customElement`-decorated classes with the browser's `customElements` registry.

### Step 1: Implement the Adapters (SPI)

Each shell requires consumer-provided adapters. These are interfaces (SPI) that you implement to connect to your backend.

#### DataAdapter (required by all shells)

```typescript
// lib/my-data-adapter.ts
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema, DataSourceSummary } from '@phozart/shared/adapters';

export class MyDataAdapter implements DataAdapter {
  async execute(query: DataQuery, context?: { signal?: AbortSignal }): Promise<DataResult> {
    const res = await fetch(`/api/data/${query.source}?limit=${query.limit ?? 1000}&offset=${query.offset ?? 0}`, {
      signal: context?.signal,
    });
    const body = await res.json();
    // Transform your API response to { columns: [{name, dataType}], rows: unknown[][], metadata: {...} }
    return { columns: body.columns, rows: body.rows, metadata: { totalRows: body.total, truncated: false, queryTimeMs: 0 } };
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    const res = await fetch(`/api/schema/${sourceId}`);
    return res.json();
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    const res = await fetch('/api/data-sources');
    return res.json();
  }

  async getDistinctValues(sourceId: string, field: string, options?: { search?: string; limit?: number }) {
    const res = await fetch(`/api/data/${sourceId}/distinct/${field}?search=${options?.search ?? ''}`);
    return res.json(); // { values: unknown[], totalCount: number, truncated: boolean }
  }

  async getFieldStats(sourceId: string, field: string) {
    const res = await fetch(`/api/data/${sourceId}/stats/${field}`);
    return res.json(); // { min?, max?, distinctCount, nullCount, totalCount }
  }
}
```

#### PersistenceAdapter (required by viewer and editor shells)

```typescript
// lib/my-persistence-adapter.ts
import type { PersistenceAdapter, ArtifactPayload, SaveResult, ArtifactFilter, ArtifactList } from '@phozart/shared/adapters';

export class MyPersistenceAdapter implements PersistenceAdapter {
  async save(payload: ArtifactPayload): Promise<SaveResult> {
    const res = await fetch(`/api/artifacts/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return res.json();
  }
  async load<T>(id: string): Promise<ArtifactPayload<T> | null> {
    const res = await fetch(`/api/artifacts/${id}`);
    return res.ok ? res.json() : null;
  }
  async delete(id: string) {
    await fetch(`/api/artifacts/${id}`, { method: 'DELETE' });
    return { success: true };
  }
  async list(filter?: ArtifactFilter): Promise<ArtifactList> {
    const params = new URLSearchParams();
    if (filter?.type) params.set('type', filter.type);
    if (filter?.search) params.set('search', filter.search);
    const res = await fetch(`/api/artifacts?${params}`);
    return res.json();
  }
  // ... saveFilterPreset, listFilterPresets, savePersonalView, etc.
  // See PersistenceAdapter interface in @phozart/shared/adapters for full list.
}
```

#### WorkspaceAdapter (required by workspace shell only)

```typescript
// lib/my-workspace-adapter.ts — extends EngineStorageAdapter + AsyncDefinitionStore
// See @phozart/workspace WorkspaceAdapter interface for full signature.
// Requires: savePlacement, loadPlacements, deletePlacement, listArtifacts, initialize, clear,
// plus all EngineStorageAdapter methods (saveReport, loadReports, etc.)
// and AsyncDefinitionStore methods (save, load, list, delete, duplicate, clear for grid definitions).
```

### Step 2: Slotted Panel Helper

React cannot natively set complex JavaScript object properties on custom elements — it serializes them as HTML attributes. Use this helper component to imperatively set properties via ref:

```typescript
// components/SlottedPanel.tsx
'use client';

import React, { useRef, useLayoutEffect } from 'react';

/**
 * Creates a custom element with a named slot and imperatively sets
 * complex object properties (adapters, configs, etc.) on it.
 */
export function SlottedPanel({ tag, slotName, ...props }: {
  tag: string;
  slotName: string;
  [key: string]: any;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const [key, value] of Object.entries(props)) {
      if (key === 'tag' || key === 'slotName') continue;
      (el as any)[key] = value;
    }
  });

  return React.createElement(tag, {
    ref,
    slot: slotName,
    style: { display: 'block', width: '100%' },
  });
}
```

### Step 3: Workspace Shell (Admin)

```typescript
// app/workspace/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { SlottedPanel } from '@/components/SlottedPanel';
import { MyDataAdapter } from '@/lib/my-data-adapter';
import { MyWorkspaceAdapter } from '@/lib/my-workspace-adapter';

function WorkspaceHost({ adapter, dataAdapter }: { adapter: any; dataAdapter: any }) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Import registers <phz-workspace> + all sub-components (grid-admin, engine-admin, etc.)
  useEffect(() => {
    import('@phozart/workspace/all').then(() => setLoaded(true));
  }, []);

  // Set complex properties imperatively
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).adapter = adapter;
    (el as any).dataAdapter = dataAdapter;
    (el as any).role = 'admin';
    (el as any).title = 'My Workspace';
  }, [adapter, dataAdapter]);

  if (!loaded) return <div>Loading workspace...</div>;

  // The <phz-workspace> renders sidebar navigation.
  // Each panel ID maps to a named slot. Provide slotted children:
  return React.createElement(
    'phz-workspace',
    { ref: hostRef, style: { display: 'block', width: '100%', height: '100%' } },

    // CONTENT panels
    React.createElement(SlottedPanel, { tag: 'phz-dashboard-builder', slotName: 'dashboards', adapter }),
    React.createElement(SlottedPanel, { tag: 'phz-report-designer', slotName: 'reports', adapter }),

    // DATA panels
    React.createElement(SlottedPanel, { tag: 'phz-connection-editor', slotName: 'connectors' }),

    // GOVERN panels
    React.createElement(SlottedPanel, { tag: 'phz-grid-admin', slotName: 'grid-admin' }),
    React.createElement(SlottedPanel, { tag: 'phz-engine-admin', slotName: 'engine-admin', adapter }),
    React.createElement(SlottedPanel, { tag: 'phz-grid-creator', slotName: 'grid-creator' }),
    React.createElement(SlottedPanel, { tag: 'phz-criteria-admin', slotName: 'criteria-admin', adapter, dataAdapter }),
  );
}

// CRITICAL: ssr: false — Lit components crash on server-side rendering
const DynamicWorkspace = dynamic(() => Promise.resolve(WorkspaceHost), { ssr: false });

export default function WorkspacePage() {
  const adapter = useMemo(() => new MyWorkspaceAdapter(), []);
  const dataAdapter = useMemo(() => new MyDataAdapter(), []);

  useEffect(() => { adapter.initialize(); }, [adapter]);

  return (
    <div style={{ height: '100vh' }}>
      <DynamicWorkspace adapter={adapter} dataAdapter={dataAdapter} />
    </div>
  );
}
```

#### Workspace Panel → Slot Mapping

| Panel ID | Custom Element Tag | Slot Name | Registered By |
|----------|-------------------|-----------|---------------|
| `dashboards` | `phz-dashboard-builder` | `dashboards` | `@phozart/workspace/all` (engine-admin) |
| `reports` | `phz-report-designer` | `reports` | `@phozart/workspace/all` (engine-admin) |
| `grid-admin` | `phz-grid-admin` | `grid-admin` | `@phozart/workspace/all` (grid-admin) |
| `engine-admin` | `phz-engine-admin` | `engine-admin` | `@phozart/workspace/all` (engine-admin) |
| `grid-creator` | `phz-grid-creator` | `grid-creator` | `@phozart/workspace/all` (grid-creator) |
| `connectors` | `phz-connection-editor` | `connectors` | `@phozart/workspace/all` (adapters) |
| `criteria-admin` | `phz-criteria-admin` | `criteria-admin` | `@phozart/workspace/all` (criteria-admin) |
| `catalog` | `phz-catalog-browser` | `catalog` | Needs separate import: `import '@phozart/workspace/catalog'` |
| `explore` | `phz-data-explorer` | `explore` | Not yet a Lit component (use headless APIs) |
| `data-sources` | `phz-data-source-panel` | `data-sources` | Not yet a Lit component |
| `alerts` | `phz-alert-rule-designer` | `alerts` | Not yet a Lit component |
| `permissions` | `phz-permissions-panel` | `permissions` | Not yet a Lit component |

Panels without registered custom elements show a descriptive empty state automatically.

### Step 4: Viewer Shell (Read-Only)

```typescript
// app/viewer/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { SlottedPanel } from '@/components/SlottedPanel';
import { MyDataAdapter } from '@/lib/my-data-adapter';
import { MyPersistenceAdapter } from '@/lib/my-persistence-adapter';

function ViewerHost({ config, viewerContext }: { config: any; viewerContext: any }) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Import registers all 9 viewer components
  useEffect(() => {
    import('@phozart/viewer').then(() => setLoaded(true));
  }, []);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).config = config;
    (el as any).viewerContext = viewerContext;
  }, [config, viewerContext]);

  if (!loaded) return <div>Loading viewer...</div>;

  // <phz-viewer-shell> has tab navigation: Catalog, Dashboard, Report, Explorer.
  // Each tab routes to a named slot matching the screen name.
  return React.createElement(
    'phz-viewer-shell',
    { ref: hostRef, style: { display: 'block', width: '100%', height: '100%' } },
    React.createElement(SlottedPanel, { tag: 'phz-viewer-catalog', slotName: 'catalog', config, viewerContext }),
    React.createElement(SlottedPanel, { tag: 'phz-viewer-dashboard', slotName: 'dashboard', config, viewerContext }),
    React.createElement(SlottedPanel, { tag: 'phz-viewer-report', slotName: 'report', config, viewerContext }),
    React.createElement(SlottedPanel, { tag: 'phz-viewer-explorer', slotName: 'explorer', config, viewerContext }),
  );
}

const DynamicViewer = dynamic(() => Promise.resolve(ViewerHost), { ssr: false });

export default function ViewerPage() {
  const config = useMemo(() => ({
    dataAdapter: new MyDataAdapter(),
    persistenceAdapter: new MyPersistenceAdapter(),
    features: {
      explorer: true,
      attentionItems: true,
      filterBar: true,
      keyboardShortcuts: true,
      mobileResponsive: true,
      urlRouting: false,
    },
    branding: { title: 'Analytics Viewer', theme: 'light', locale: 'en' },
    initialScreen: 'catalog',
  }), []);

  const viewerContext = useMemo(() => ({
    userId: 'analyst-1',
    roles: ['analyst'],
    attributes: {},
  }), []);

  return (
    <div style={{ height: '100vh' }}>
      <DynamicViewer config={config} viewerContext={viewerContext} />
    </div>
  );
}
```

#### Viewer Screen → Slot Mapping

| Screen | Custom Element Tag | Slot Name | Config Property Needed |
|--------|-------------------|-----------|----------------------|
| `catalog` | `phz-viewer-catalog` | `catalog` | `config`, `viewerContext` |
| `dashboard` | `phz-viewer-dashboard` | `dashboard` | `config`, `viewerContext` |
| `report` | `phz-viewer-report` | `report` | `config`, `viewerContext` |
| `explorer` | `phz-viewer-explorer` | `explorer` | `config`, `viewerContext` |

#### ViewerShellConfig shape

```typescript
interface ViewerShellConfig {
  dataAdapter: DataAdapter;          // Required — query execution
  persistenceAdapter: PersistenceAdapter; // Required — artifact CRUD
  attentionAdapter?: AttentionAdapter;    // Optional — notifications
  viewerContext?: ViewerContext;          // Optional — user identity for RLS
  features: {
    explorer: boolean;       // Show explorer tab
    attentionItems: boolean; // Show notification bell
    filterBar: boolean;      // Show global filter bar
    keyboardShortcuts: boolean;
    mobileResponsive: boolean;
    urlRouting: boolean;     // Sync screen to URL
  };
  branding: {
    title?: string;   // Nav bar title
    logo?: string;    // Logo URL
    theme?: string;   // 'light' | 'dark' | 'auto'
    locale?: string;  // 'en', 'fr', etc.
  };
  initialScreen?: 'catalog' | 'dashboard' | 'report' | 'explorer';
  initialArtifactId?: string;
  initialArtifactType?: string;
}
```

### Step 5: Editor Shell (Authoring)

```typescript
// app/author/page.tsx
'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { SlottedPanel } from '@/components/SlottedPanel';

function EditorHost({ theme }: { theme: string }) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Import registers all 9 editor components
  useEffect(() => {
    import('@phozart/editor').then(() => setLoaded(true));
  }, []);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).theme = theme;
    (el as any).locale = 'en';
  }, [theme]);

  if (!loaded) return <div>Loading editor...</div>;

  // <phz-editor-shell> has navigation: Catalog, Dashboard (edit), Report (edit), Explorer.
  return React.createElement(
    'phz-editor-shell',
    { ref: hostRef, style: { display: 'block', width: '100%', height: '100%' } },
    React.createElement(SlottedPanel, { tag: 'phz-editor-catalog', slotName: 'catalog' }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-dashboard', slotName: 'dashboard-edit' }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-report', slotName: 'report-edit' }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-explorer', slotName: 'explorer' }),
    React.createElement(SlottedPanel, { tag: 'phz-measure-palette', slotName: 'measures' }),
    React.createElement(SlottedPanel, { tag: 'phz-config-panel', slotName: 'config' }),
  );
}

const DynamicEditor = dynamic(() => Promise.resolve(EditorHost), { ssr: false });

export default function AuthorPage() {
  return (
    <div style={{ height: '100vh' }}>
      <DynamicEditor theme="dark" />
    </div>
  );
}
```

#### Editor Screen → Slot Mapping

| Screen | Custom Element Tag | Slot Name |
|--------|-------------------|-----------|
| `catalog` | `phz-editor-catalog` | `catalog` |
| `dashboard-edit` | `phz-editor-dashboard` | `dashboard-edit` |
| `report-edit` | `phz-editor-report` | `report-edit` |
| `explorer` | `phz-editor-explorer` | `explorer` |
| `measures` | `phz-measure-palette` | `measures` |
| `config` | `phz-config-panel` | `config` |

### webpack aliases for local development

When developing against the monorepo, add aliases for the three shell packages and shared infrastructure:

```typescript
// next.config.ts
const packageAliases: Record<string, string> = {
  // ... existing core/grid/react/engine aliases ...

  // Shared infrastructure
  '@phozart/shared/adapters':      path.resolve(pkgs, 'shared/dist/adapters/index.js'),
  '@phozart/shared/types':         path.resolve(pkgs, 'shared/dist/types/index.js'),
  '@phozart/shared/artifacts':     path.resolve(pkgs, 'shared/dist/artifacts/index.js'),
  '@phozart/shared/design-system': path.resolve(pkgs, 'shared/dist/design-system/index.js'),
  '@phozart/shared/coordination':  path.resolve(pkgs, 'shared/dist/coordination/index.js'),
  '@phozart/shared':               path.resolve(pkgs, 'shared/dist/index.js'),

  // Viewer shell
  '@phozart/viewer':               path.resolve(pkgs, 'viewer/dist/index.js'),

  // Editor shell
  '@phozart/editor':               path.resolve(pkgs, 'editor/dist/index.js'),

  // Workspace (main + all + sub-paths)
  '@phozart/workspace/all':        path.resolve(pkgs, 'workspace/dist/all.js'),
  '@phozart/workspace/shell':      path.resolve(pkgs, 'workspace/dist/shell/index.js'),
  // ... existing workspace sub-path aliases ...
  '@phozart/workspace':            path.resolve(pkgs, 'workspace/dist/index.js'),
};
```

### TypeScript paths

Add corresponding paths to `tsconfig.json` for type checking:

```json
{
  "compilerOptions": {
    "paths": {
      "@phozart/shared/*": ["../phz-grid/packages/shared/dist/*"],
      "@phozart/shared": ["../phz-grid/packages/shared/dist/index.d.ts"],
      "@phozart/viewer": ["../phz-grid/packages/viewer/dist/index.d.ts"],
      "@phozart/editor": ["../phz-grid/packages/editor/dist/index.d.ts"],
      "@phozart/workspace/*": ["../phz-grid/packages/workspace/dist/*"],
      "@phozart/workspace": ["../phz-grid/packages/workspace/dist/index.d.ts"]
    }
  }
}
```

---

## Common Pitfalls

### 1. SSR crashes with Lit components

**Problem**: `ReferenceError: HTMLElement is not defined`
**Fix**: Always use `'use client'` + `dynamic(() => ..., { ssr: false })`

### 2. `type: 'status'` is not a valid ColumnType

**Problem**: `Type '"status"' is not assignable to type 'ColumnType'`
**Fix**: Use `type: 'string'` instead. Status rendering is controlled by `statusColors` prop.

### 3. `dot` must be required in STATUS_COLORS

**Problem**: `Type 'dot?: string' is not assignable to 'dot: string'`
**Fix**: Define as `Record<string, { bg: string; color: string; dot: string }>` (no `?`).

### 4. `grid.getRowCount()` doesn't exist

**Problem**: `Property 'getRowCount' does not exist on type 'GridApi'`
**Fix**: Use `grid.getData().length`.

### 5. JSX `<phz-tag>` causes type errors in React

**Problem**: `Property 'phz-dashboard' does not exist on type 'JSX.IntrinsicElements'`
**Fix**: Use `React.createElement('phz-dashboard', props)` instead of JSX syntax.

### 6. `readonly` array not assignable to mutable

**Problem**: `readonly ColumnDefinition[]` not assignable to `ColumnDefinition[]`
**Fix**: Already fixed in `PhzGridProps` — both `data` and `columns` accept `readonly` arrays.

### 7. EventEmitter typed to GridEventMap

**Problem**: `Argument of type '"test"' is not assignable to parameter of type 'keyof GridEventMap'`
**Fix**: Use `grid.on('sort:change', ...)` with valid event names, not arbitrary strings.

### 8. StateManager needs valid GridState

**Problem**: `new StateManager({ count: 0 })` — wrong constructor argument
**Fix**: Use `createInitialState(columns)` to generate a valid initial state.

### 9. Turbopack absolute path aliases broken

**Problem**: Turbopack treats absolute paths as server-relative (`./Users/...`)
**Fix**: Use `next build --webpack` or `next dev --webpack` with Next.js 16.

### 10. Stale tsc --build cache after clean

**Problem**: `npm run clean` then `npm run build` produces empty dist/
**Fix**: Clean must also remove `tsconfig.tsbuildinfo` files.
