# phz-grid AI Reference

Instructions for AI assistants building applications with @phozart/grid packages.

## CRITICAL RULES

1. **All Lit web components require `'use client'` + `dynamic(() => ..., { ssr: false })`** — Lit components crash on SSR.
2. **Use `React.createElement('phz-tag', props)`** for custom element wrappers — NOT JSX `<phz-tag>`.
3. **`transpilePackages`** must include ONLY `['lit', '@lit/reactive-element', 'lit-element', 'lit-html']` — never add @phozart packages.
4. **Column `type`** is `'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom'` — `'status'` does NOT exist.
5. **`statusColors`** type requires `dot: string` (required, not optional).
6. **`grid.getData().length`** for row count — `getRowCount()` does not exist.
7. **Event handlers** receive unwrapped detail objects, NOT CustomEvent.
8. **`<phz-grid-admin open>` renders NOTHING if `open` is falsy** — the entire component returns empty HTML when `open={false}` (the default). You MUST pass `open={true}` to see anything. This is silent — no error, no placeholder.
9. **Side-effect imports register custom elements** — `import '@phozart/workspace'` alone does NOT register any Lit components. You need sub-path imports: `import '@phozart/workspace/grid-admin'`, `import '@phozart/workspace/engine-admin'`, etc. The React wrappers handle this automatically.
10. **Shell components use slots for content** — `<phz-workspace-shell>`, `<phz-viewer-shell>`, `<phz-editor-shell>` render navigation chrome only. You MUST provide children with `slot="panelName"` attributes. Without slotted children, the content area is empty.
11. **Object props must be set imperatively** — React cannot pass JS objects as HTML attributes. Use refs or `useLayoutEffect` to set `adapter`, `engine`, `config`, `viewerContext`, etc.

## Package Imports

```typescript
// React components + hooks (subpath exports)
import { PhzGrid, useGridOrchestrator } from '@phozart/react/grid';
import { PhzSelectionCriteria } from '@phozart/react/criteria';
import { PhzGridAdmin } from '@phozart/react/admin';

// Types
import type { ColumnDefinition, CriteriaConfig } from '@phozart/core';

// Headless grid (no UI)
import { createGrid } from '@phozart/core';

// BI engine
import { createBIEngine, computeAggregation, computeAggregations } from '@phozart/engine';

// AI toolkit (no API key needed)
import { analyzeSchema, suggestWidgets, suggestLayout, generateDashboardConfig } from '@phozart/ai';

// Shared infrastructure (adapters, types, design system)
import type { DataAdapter, ViewerContext } from '@phozart/shared/adapters';
import type { SingleValueAlertConfig, CellRendererRegistry } from '@phozart/shared/types';
import { DESIGN_TOKENS } from '@phozart/shared/design-system';

// Viewer shell (read-only)
import { createViewerShellState, navigateTo } from '@phozart/viewer';

// Editor shell (authoring)
import { createEditorShellState, toggleEditMode } from '@phozart/editor';

// Web Components (side-effect imports to register custom elements)
import '@phozart/grid';
import '@phozart/widgets';
import '@phozart/criteria';
import '@phozart/grid-admin';
import '@phozart/viewer';
import '@phozart/editor';
```

## Next.js Config (next.config.ts)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['lit', '@lit/reactive-element', 'lit-element', 'lit-html'],
};
export default nextConfig;
```

For local monorepo development, add webpack aliases pointing to `dist/index.js` — see docs/INTEGRATION-GUIDE.md.

## React Grid — Minimal Example

```typescript
'use client';
import dynamic from 'next/dynamic';
const PhzGrid = dynamic(() => import('@phozart/react/grid').then(m => m.PhzGrid), { ssr: false });

export default function Page() {
  const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  const columns = [
    { field: 'id', header: 'ID', type: 'number' as const, sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
  ];
  return <div style={{ height: 400 }}><PhzGrid data={data} columns={columns} theme="dark" /></div>;
}
```

## React Grid — Full-Featured Example

```typescript
'use client';
import { useState } from 'react';
import { PhzGrid, useGridOrchestrator } from '@phozart/react/grid';
import { PhzSelectionCriteria } from '@phozart/react/criteria';
import { PhzGridAdmin } from '@phozart/react/admin';
import type { ColumnDefinition, CriteriaConfig } from '@phozart/core';

const COLUMNS: ColumnDefinition[] = [
  { field: 'id', header: 'ID', width: 60, type: 'number', sortable: true, filterable: true },
  { field: 'name', header: 'Name', width: 180, sortable: true, filterable: true, editable: true },
  { field: 'department', header: 'Dept', width: 130, sortable: true, filterable: true },
  { field: 'salary', header: 'Salary', width: 110, type: 'number', sortable: true },
  { field: 'status', header: 'Status', width: 100, type: 'string', sortable: true, filterable: true },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active:   { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  inactive: { bg: '#1c1917', color: '#78716c', dot: '#57534e' },
};

const CRITERIA: CriteriaConfig = {
  fields: [
    { id: 'department', label: 'Department', type: 'chip_group', dataField: 'department',
      options: ['Engineering', 'Marketing', 'Sales'].map(d => ({ value: d, label: d })) },
    { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All',
      options: ['active', 'inactive'].map(s => ({ value: s, label: s })) },
  ],
};

export default function FullPage({ data }: { data: any[] }) {
  const [adminOpen, setAdminOpen] = useState(false);
  const { gridRef, handleGridReady, handleCriteriaApply, handleCriteriaReset,
          handleSettingsSave, presentationProps } = useGridOrchestrator();

  return (
    <>
      <PhzSelectionCriteria config={CRITERIA} data={data}
        onCriteriaApply={(d: any) => handleCriteriaApply({ context: d.context ?? d })}
        onCriteriaReset={handleCriteriaReset} />

      <PhzGrid ref={gridRef} data={data} columns={COLUMNS} height="520px" theme="dark"
        density="compact" selectionMode="multi" editMode="dblclick"
        showToolbar showPagination showSearch showCheckboxes
        pageSize={10} pageSizeOptions={[5, 10, 20, 50]}
        statusColors={STATUS_COLORS} rowBanding hoverHighlight gridLines="horizontal"
        allowSorting allowFiltering gridTitle="Employees"
        onGridReady={handleGridReady}
        onSelectionChange={(e) => console.log(e.selectedRows?.length)}
        {...presentationProps} />

      <PhzGridAdmin open={adminOpen} gridRef={gridRef} columns={COLUMNS}
        reportName="Employees" statusColors={STATUS_COLORS}
        onClose={() => setAdminOpen(false)}
        onSettingsSave={(d) => { handleSettingsSave({ settings: d.settings }); setAdminOpen(false); }} />
    </>
  );
}
```

## Widget Wrappers for React

```typescript
// components/DynamicWidgets.tsx
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

const loading = () => <div>Loading...</div>;
export const DynamicKPICard  = dynamic(() => Promise.resolve(widgetFactory('phz-kpi-card')), { ssr: false, loading });
export const DynamicBarChart = dynamic(() => Promise.resolve(widgetFactory('phz-bar-chart')), { ssr: false, loading });
export const DynamicGauge    = dynamic(() => Promise.resolve(widgetFactory('phz-gauge')), { ssr: false, loading });
```

## Headless Grid API (createGrid)

```typescript
import { createGrid } from '@phozart/core';

const grid = createGrid({ data, columns });
grid.getData()                       // All rows (with __id)
grid.getData().length                // Row count
grid.sort('field', 'asc')           // Sort
grid.addFilter('field', 'equals', 'value')  // Filter
grid.getFilteredRowModel()           // { rows: [...] }
grid.select(rowId)                   // Select
grid.getSelection()                  // Selected rows
grid.addRow({ name: 'New' })        // Add row → returns id
grid.deleteRow(id)                   // Delete row
grid.exportCsv()                     // CSV string
grid.undo() / grid.redo()           // Undo/redo
grid.on('sort:change', handler)      // Event listener
```

## BI Engine — Aggregation

```typescript
import { computeAggregations } from '@phozart/engine';

const result = computeAggregations(data, {
  fields: [{ field: 'revenue', functions: ['sum', 'avg', 'min', 'max'] }],
});
result.fieldResults.revenue.sum   // Total
result.fieldResults.revenue.avg   // Average
```

## AI Toolkit — Schema Analysis

```typescript
import { analyzeSchema, suggestWidgets, suggestLayout, generateDashboardConfig } from '@phozart/ai';

const analysis = analyzeSchema([
  { name: 'salary', type: 'number' as const },
  { name: 'department', type: 'string' as const },
]);
// Returns: { measures, dimensions, temporal, categorical, identifiers }

const widgets = suggestWidgets(analysis);
const layout = suggestLayout(widgets);
const dashboard = generateDashboardConfig({
  fields: [{ name: 'salary', type: 'number' as const }],
  prompt: 'Show salary distribution',
  options: { name: 'HR Dashboard', maxWidgets: 8, columns: 2 },
});
```

## Shared Infrastructure (`@phozart/shared`)

Foundation package with adapter interfaces, design system, artifact types, and runtime coordination. No Lit or DOM dependencies.

```typescript
// Adapter SPI
import type { DataAdapter, DataQuery, DataResult, ViewerContext } from '@phozart/shared/adapters';

// Shared types (alerts, subscriptions, widgets, micro-widgets)
import type {
  SingleValueAlertConfig, AlertVisualState, WidgetAlertSeverity,
  MicroWidgetCellConfig, CellRendererRegistry, SparklineDataBinding,
  ImpactChainNode, ChainLayout, DecisionTreeVariantConfig,
  AttentionFacet, AttentionFilterState, FilterableAttentionItem,
  PersonalAlert, Subscription, MessagePool,
} from '@phozart/shared/types';

// Artifact metadata
import type { ArtifactVisibility, DefaultPresentation, GridArtifact } from '@phozart/shared/artifacts';

// Design tokens
import { DESIGN_TOKENS, ALERT_WIDGET_TOKENS, IMPACT_CHAIN_TOKENS } from '@phozart/shared/design-system';

// Runtime coordination
import { createFilterContext, createInteractionBus } from '@phozart/shared/coordination';
import type { FilterContextManager, InteractionBus, DashboardDataPipeline } from '@phozart/shared/coordination';

// CellRendererRegistry — register micro-widget renderers at mount time
import { createCellRendererRegistry } from '@phozart/shared/types';
const registry = createCellRendererRegistry();
registry.register('trend-line', mySparklineRenderer);
```

Sub-path imports (`@phozart/shared/adapters`, `./types`, `./artifacts`, `./design-system`, `./coordination`) are preferred for tree-shaking. The barrel `@phozart/shared` re-exports everything.

## Viewer Shell (`@phozart/viewer`)

Read-only consumption shell for analysts. Catalog, dashboards, reports, explorer, attention, filter bar.

```typescript
import {
  createViewerShellState, createViewerShellConfig,
  navigateTo, setViewerContext, setMobileLayout,
} from '@phozart/viewer';

// Screen state machines
import { createCatalogState, createDashboardViewState, createReportViewState } from '@phozart/viewer';

// Lit components (side-effect import registers custom elements)
import '@phozart/viewer';
// <phz-viewer-shell>, <phz-viewer-catalog>, <phz-viewer-dashboard>,
// <phz-viewer-report>, <phz-viewer-explorer>, <phz-attention-dropdown>,
// <phz-filter-bar>, <phz-viewer-error>, <phz-viewer-empty>
```

## Editor Shell (`@phozart/editor`)

Authoring shell for authors. Dashboard/report editing, explorer, measure palette, config panel, sharing, alerts.

```typescript
import {
  createEditorShellState, createEditorShellConfig,
  navigateTo, toggleEditMode, markUnsavedChanges, pushUndo, undo, redo,
} from '@phozart/editor';

// Screen and authoring state machines
import {
  createDashboardEditState, addWidget, removeWidget, moveWidget, resizeWidget,
  createReportEditState, addReportColumn,
  createExplorerState, addDimension, addMeasure,
  createMeasurePaletteState, createConfigPanelState,
  createSharingFlowState, createAlertSubscriptionState,
} from '@phozart/editor';

// Lit components
import '@phozart/editor';
// <phz-editor-shell>, <phz-editor-catalog>, <phz-editor-dashboard>,
// <phz-editor-report>, <phz-editor-explorer>, <phz-measure-palette>,
// <phz-config-panel>, <phz-sharing-flow>, <phz-alert-subscription>
```

## Engine v15 Additions

```typescript
// Personal alert evaluation
import { evaluateAlert, evaluateAlertBatch } from '@phozart/engine';
import { createInMemoryAlertContract } from '@phozart/engine';
import type { AlertEvaluationResult, AlertEvaluationContract } from '@phozart/engine';

// Subscription engine
import { createSubscriptionEngineState, getNextScheduledRun, isDueForExecution } from '@phozart/engine';

// Usage analytics
import { createUsageCollector, trackEvent, flush } from '@phozart/engine';

// OpenAPI generator
import { generateOpenAPISpec } from '@phozart/engine';

// Attention system
import { createAttentionSystemState, addItems, markRead, markAllRead } from '@phozart/engine';
```

## Three-Shell Deployment Patterns

| Pattern | Packages | Use Case |
|---------|----------|----------|
| Viewer-only | shared + viewer | Embedded analytics |
| Author + Viewer | shared + viewer + editor | Self-service BI |
| Full Admin | shared + workspace + viewer + editor | Platform admin |
| Headless | shared + engine + core | Server-side computation |

## CRITICAL: Shell Components Use Slots

All three shells (`<phz-workspace>`, `<phz-viewer-shell>`, `<phz-editor-shell>`) use **Web Component named slots** for content. The shell renders navigation chrome; the **consumer provides content as slotted children**.

### Pattern: Shell + Slotted Children in React

```typescript
// 1. Import to register custom elements
useEffect(() => { import('@phozart/workspace/all'); }, []);

// 2. Set complex props imperatively (React can't pass objects as attributes)
useLayoutEffect(() => {
  const el = hostRef.current;
  if (!el) return;
  (el as any).adapter = myAdapter;
  (el as any).dataAdapter = myDataAdapter;
}, []);

// 3. Provide slotted children with slot="panelId"
React.createElement('phz-workspace', { ref: hostRef },
  React.createElement('phz-grid-admin', { slot: 'grid-admin' }),
  React.createElement('phz-engine-admin', { slot: 'engine-admin' }),
  React.createElement('phz-dashboard-builder', { slot: 'dashboards' }),
);
```

### Workspace Slot Map

| Slot Name | Custom Element | Needs |
|-----------|---------------|-------|
| `dashboards` | `phz-dashboard-builder` | `adapter` |
| `reports` | `phz-report-designer` | `adapter` |
| `grid-admin` | `phz-grid-admin` | — |
| `engine-admin` | `phz-engine-admin` | `adapter` |
| `grid-creator` | `phz-grid-creator` | — |
| `connectors` | `phz-connection-editor` | — |
| `criteria-admin` | `phz-criteria-admin` | `adapter`, `dataAdapter` |

### Viewer Slot Map

| Slot Name | Custom Element | Needs |
|-----------|---------------|-------|
| `catalog` | `phz-viewer-catalog` | `config`, `viewerContext` |
| `dashboard` | `phz-viewer-dashboard` | `config`, `viewerContext` |
| `report` | `phz-viewer-report` | `config`, `viewerContext` |
| `explorer` | `phz-viewer-explorer` | `config`, `viewerContext` |

### Editor Slot Map

| Slot Name | Custom Element |
|-----------|---------------|
| `catalog` | `phz-editor-catalog` |
| `dashboard-edit` | `phz-editor-dashboard` |
| `report-edit` | `phz-editor-report` |
| `explorer` | `phz-editor-explorer` |
| `measures` | `phz-measure-palette` |
| `config` | `phz-config-panel` |

### Required Adapters

| Shell | Adapters Needed |
|-------|----------------|
| `<phz-workspace>` | `WorkspaceAdapter` (engine storage + definitions + placements), `DataAdapter` |
| `<phz-viewer-shell>` | `ViewerShellConfig` containing `DataAdapter` + `PersistenceAdapter` |
| `<phz-editor-shell>` | `theme`, `locale` (adapters passed to individual screen components) |

See INTEGRATION-GUIDE.md "Three-Shell Setup Guide" section for full working examples.

## Admin Panel Integration — Complete Examples

### Grid Admin (Settings Modal)

`<phz-grid-admin>` is a modal dialog for configuring a single grid's visual settings. It renders NOTHING unless `open={true}`.

```typescript
'use client';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const PhzGrid = dynamic(() => import('@phozart/react/grid').then(m => m.PhzGrid), { ssr: false });
const PhzGridAdmin = dynamic(() => import('@phozart/react/admin').then(m => m.PhzGridAdmin), { ssr: false });

const COLUMNS = [
  { field: 'id', header: 'ID', type: 'number' as const, width: 60, sortable: true },
  { field: 'name', header: 'Name', width: 180, sortable: true, filterable: true, editable: true },
  { field: 'status', header: 'Status', width: 100, sortable: true, filterable: true },
];

export default function GridWithAdmin({ data }: { data: any[] }) {
  const [adminOpen, setAdminOpen] = useState(false);
  const gridRef = useRef<any>(null);

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={() => setAdminOpen(true)}>Settings</button>

      <PhzGrid ref={gridRef} data={data} columns={COLUMNS} height="500px"
        theme="dark" density="compact" />

      {/* CRITICAL: open={adminOpen} controls visibility. false = renders nothing. */}
      <PhzGridAdmin
        open={adminOpen}
        gridRef={gridRef}
        columns={COLUMNS}
        fields={COLUMNS.map(c => c.field)}
        reportName="My Grid"
        onClose={() => setAdminOpen(false)}
        onSettingsSave={(detail: any) => {
          // detail.settings contains { columnOrder, columnWidths, sortField, ... }
          setAdminOpen(false);
        }}
      />
    </div>
  );
}
```

### Engine Admin (BI Designer Panel)

`<phz-engine-admin>` is an inline (non-modal) panel for KPI/Dashboard/Report design. Requires a `BIEngine` instance.

```typescript
'use client';
import React, { useRef, useLayoutEffect, useEffect } from 'react';

export default function EngineAdminPage() {
  const ref = useRef<HTMLElement>(null);

  // 1. Register custom elements via side-effect import
  useEffect(() => {
    import('@phozart/workspace/engine-admin');
  }, []);

  // 2. Set object prop imperatively (React can't pass objects as attributes)
  useLayoutEffect(() => {
    if (!ref.current) return;
    import('@phozart/engine').then(({ createBIEngine }) => {
      (ref.current as any).engine = createBIEngine();
    });
  }, []);

  return React.createElement('phz-engine-admin', { ref });
}
```

### Workspace Shell (Full Admin Environment)

`<phz-workspace-shell>` renders navigation only — consumer provides content via named slots.

```typescript
'use client';
import React, { useRef, useLayoutEffect, useEffect } from 'react';

export default function WorkspacePage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // MUST import sub-paths to register child custom elements
    import('@phozart/workspace/grid-admin');
    import('@phozart/workspace/engine-admin');
    import('@phozart/workspace/grid-creator');
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current as any;
    el.role = 'admin';  // 'admin' | 'author' — controls which nav sections show
    // el.adapter = myWorkspaceAdapter;  // Optional: enables data source panels
  }, []);

  return React.createElement('phz-workspace-shell', { ref },
    // Each child MUST have slot="panelId" matching the shell's navigation items
    React.createElement('phz-grid-admin', { slot: 'grid-admin', open: true }),
    React.createElement('phz-engine-admin', { slot: 'engine-admin' }),
    React.createElement('div', { slot: 'settings' }, 'Settings content here'),
  );
}
```

**Key: `slot` attribute values must match the shell's navigation panel IDs.** The shell renders a sidebar nav; clicking a nav item shows the `<slot name="panelId">` content.

### Common Mistakes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty admin panel | `open` is `false` or not set | Pass `open={true}` |
| Element renders as blank `<div>` | Custom element not registered | Import sub-path: `import '@phozart/workspace/grid-admin'` |
| Shell shows nav but no content | No slotted children provided | Add children with `slot="panelId"` attributes |
| Engine admin tabs work but content empty | No `BIEngine` instance | Set `.engine` prop imperatively via ref |
| Props ignored / no effect | React can't pass objects as attributes | Set object props via `useLayoutEffect` + ref |
| SSR crash | Lit needs browser DOM | Wrap in `dynamic(..., { ssr: false })` |

## useGridOrchestrator Return Values

| Property | Type | Connect To |
|----------|------|-----------|
| `gridRef` | `Ref` | `<PhzGrid ref={gridRef}>` |
| `gridApi` | `GridApi \| null` | Available after onGridReady |
| `handleGridReady` | `(e) => void` | `onGridReady={handleGridReady}` |
| `handleCriteriaApply` | `({ context }) => void` | `onCriteriaApply` |
| `handleCriteriaReset` | `() => void` | `onCriteriaReset` |
| `handleSettingsSave` | `({ settings }) => void` | `onSettingsSave` |
| `presentationProps` | `object` | `{...presentationProps}` on PhzGrid |
| `filters` | `Record` | Active filter state |
