# Workstream B: Shells

> Detailed implementation guide for building viewer shell, editor shell,
> and updating workspace admin UX.

## Objective

Build the two new shells (viewer, editor) and update the existing workspace
shell to reflect all admin UX decisions from the spec.

## Phase B-1: Viewer Shell

### Component Architecture

The viewer exports two things: a full shell component and individual screen
components.

```
packages/viewer/src/
├── shell/
│   ├── phz-viewer.ts            # <phz-viewer> — full shell with routing
│   ├── viewer-router.ts         # internal route management
│   └── viewer-header.ts         # optional header component
├── components/
│   ├── phz-dashboard-view.ts    # standalone dashboard viewer
│   ├── phz-report-view.ts       # standalone report viewer
│   ├── phz-catalog-view.ts      # standalone catalog
│   └── phz-explorer-view.ts     # standalone explorer (shared with editor)
├── screens/
│   ├── catalog/
│   │   ├── catalog-screen.ts    # catalog layout + tabs
│   │   ├── catalog-card.ts      # individual artifact card
│   │   └── catalog-tabs.ts      # Published, My Work, Exports, Subscriptions
│   ├── dashboard/
│   │   ├── dashboard-screen.ts  # dashboard rendering orchestrator
│   │   ├── filter-bar.ts        # filter bar with value handling gear
│   │   ├── filter-value-handling.ts  # nulls/orphans/selectAll/invert panel
│   │   └── widget-container.ts  # widget mount point with error handling
│   ├── report/
│   │   ├── report-screen.ts     # report grid with toolbar
│   │   └── report-toolbar.ts    # export buttons, async, subscribe
│   ├── explorer/
│   │   ├── explorer-screen.ts   # wires createDataExplorer from engine
│   │   ├── field-palette.ts     # draggable field list
│   │   ├── drop-zones.ts        # rows/columns/values/filters drop targets
│   │   └── result-view.ts       # chart or table result rendering
│   └── attention/
│       ├── attention-dropdown.ts # header notification dropdown
│       └── attention-item.ts    # individual notification item
├── shared/
│   ├── error-state.ts           # reusable error state component
│   ├── empty-state.ts           # reusable empty state component
│   └── auto-retry.ts            # auto-retry logic with backoff
└── index.ts
```

### Full Shell Mode vs Component Mode

The `<phz-viewer>` shell wraps all screens with routing:

```typescript
@customElement('phz-viewer')
export class PhzViewer extends LitElement {
  @property() dataAdapter!: DataAdapter;
  @property() persistenceAdapter!: PersistenceAdapter;
  @property() viewerContext?: ViewerContext;
  @property({ type: Boolean }) showHeader = true;
  @property() initialRoute = 'catalog';
  // ... other adapter props

  render() {
    return html`
      ${this.showHeader ? html`<phz-viewer-header .../>` : nothing}
      <main>
        ${this.renderRoute()}
      </main>
    `;
  }
}
```

Individual components receive their own props and work independently:

```typescript
@customElement('phz-dashboard-view')
export class PhzDashboardView extends LitElement {
  @property() artifactId!: string;
  @property() dataAdapter!: DataAdapter;
  @property() persistenceAdapter!: PersistenceAdapter;
  @property() viewerContext?: ViewerContext;
  // No shell chrome, no routing, just the dashboard
}
```

### Filter Bar Implementation

The filter bar is a shared component used by viewer and editor. Build it
in phz-shared or in viewer and export it.

Key behaviors:
- Each filter renders as a dropdown with a ⚙ gear icon
- Gear opens the value handling panel (nulls, orphans, selectAll, invert)
- Value handling toggles respect admin allow/hide settings from FilterDefinition.valueHandling
- "Reset" clears last-applied state, loads admin defaults
- "Save Preset" captures current values + toggle states as FilterPresetValue
- Filter changes debounce (2s) and auto-save via PersistenceAdapter

### Error/Empty State Components

Build as reusable Lit components in shared or viewer:

```typescript
@customElement('phz-error-state')
export class PhzErrorState extends LitElement {
  @property() scenario!: ErrorScenario;
  @property() tone: 'default' | 'minimal' | 'playful' = 'default';
  @property({ type: Boolean }) compact = false;
  @property({ type: Boolean }) autoRetry = true;
  @property() technicalDetails?: ErrorDetails;
  @property() onRetry?: () => void;
  
  // Picks random message from pool, shows retry indicator, 
  // technical details collapsed
}
```

## Phase B-2: Editor Shell

### Differences from Viewer

The editor reuses many viewer components but with these differences:

| Component | Viewer | Editor |
|---|---|---|
| Catalog | "Open" primary action | "Duplicate" primary action on Published |
| Dashboard | View only | View published (read-only) + edit personal copies |
| Config panel | None | Data (from registry) + Style (no Filters) |
| Left palette | None | Measure registry (not raw fields) |
| Explorer | Save as report, export | + "Add to Dashboard" action |
| Sharing | None | User picker (name/email, not roles) |
| Sidebar | None | Slim sidebar (MY WORK, EXPLORE) |

### Measure Registry Palette

```typescript
@customElement('phz-measure-palette')
export class PhzMeasurePalette extends LitElement {
  @property() measureRegistry!: MeasureRegistryAdapter;
  @property() dataSourceId!: string;
  
  // Fetches measures and KPIs from registry
  // Groups into Measures section + KPIs section
  // Each item draggable to canvas
  // Search bar filters both sections
}
```

### Constrained Config Panel

The editor's config panel is a stripped-down version of workspace's:

```typescript
@customElement('phz-editor-config-panel')
export class PhzEditorConfigPanel extends LitElement {
  // Only renders Data tab (with registry measures) and Style tab
  // No Filters tab
  // Data tab shows measures from MeasureRegistryAdapter, not raw fields
  // Style tab is identical to workspace's
}
```

## Phase B-3: Workspace Updates

### Key Implementation Notes

**Catalog dense table (B-3.01):**
Use the existing `<phz-grid>` component to render the catalog as a table.
Add a view toggle button to switch between table and card layout. Table
columns: Name, Type, Status, Category, Last Updated, Created, Author.

**Creation wizard simplification (B-3.02):**
Reduce CreationFlowState from 5 steps to 2-3. Remove configure and done
steps. The "done" action is "open editor with initial state."

**Dashboard freeform grid (B-3.04):**
The canvas uses CSS Grid with configurable column count. Widgets snap to
grid cells on drag-end. Position stored as { col, row, colSpan, rowSpan }.
Column count stored in dashboard artifact config.

**Expression builder (built in Workstream C, used here):**
The expression builder is a shared component. Workspace uses it for filter
rules and alert conditions. The component is built in C-2.10 and imported.
If B-3 completes before C-2.10, use a placeholder text input and replace
when the component is ready.

**Preview-as-viewer (B-3.04):**
Toggle button in dashboard editor toolbar. When active:
- Hide field palette and config panel
- Apply filter constraints and security bindings
- Context picker: dropdown of roles (from PersistenceAdapter.listAvailableRoles)
  + text input for user ID
- DataAdapter receives the simulated ViewerContext
