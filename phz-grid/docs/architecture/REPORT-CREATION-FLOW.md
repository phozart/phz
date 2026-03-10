# Report Creation Flow — Admin-in-Grid Design

> **Status**: PROPOSED
> **Author**: Architecture session
> **Date**: 2026-03-01
> **Packages affected**: `grid`, `grid-admin`, `engine`, `criteria`

## 1. Overview

An administrator creates a new report directly from within the grid view. Instead
of a separate wizard or modal, the report screen itself IS the creation surface.
The admin panel opens as a side panel alongside the live grid, and configuration
changes take effect immediately (WYSIWYG).

### User Flow

```
Admin clicks "New Report" (from a launcher page, dashboard, or toolbar)
  │
  ▼
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────┐ ┌──────────────┐ │
│  │  <phz-criteria-bar>              │ │              │ │
│  │  (empty — populates as filters   │ │  Grid Admin  │ │
│  │   are bound)                     │ │  Side Panel  │ │
│  ├──────────────────────────────────┤ │              │ │
│  │  <phz-grid>                      │ │  1. Report   │ │
│  │  (empty — populates when data    │ │  2. Source   │ │
│  │   source is selected)            │ │  3. Settings │ │
│  │                                  │ │  4. Columns  │ │
│  │                                  │ │  5. Format   │ │
│  │                                  │ │  6. Filters  │ │
│  │                                  │ │  7. Criteria │ │
│  │                                  │ │  8. Export   │ │
│  └──────────────────────────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────────┘
  │
  Admin closes panel → auto-save → report is ready to use
```

## 2. Entry Point — "Admin Settings" in Toolbar Options Menu

### 2.1 New Toolbar Menu Item

Add an **"Admin Settings"** item to `<phz-toolbar>`'s options dropdown menu,
gated by a new `showAdminSettings` property.

**File**: `packages/grid/src/components/phz-toolbar.ts`

```typescript
// New property
@property({ type: Boolean, attribute: 'show-admin-settings' })
showAdminSettings: boolean = false;

// New event dispatcher
private _openAdminSettings(): void {
  this._emit('toolbar-admin-settings', {});
  this.optionsMenuOpen = false;
}
```

**In the options dropdown render** (after the "Auto-size Columns" button):

```typescript
${this.showAdminSettings ? html`
  <div class="phz-divider"></div>
  <button class="phz-dropdown__btn" @click="${this._openAdminSettings}">
    Admin Settings...
  </button>
` : nothing}
```

### 2.2 Grid Wiring

**File**: `packages/grid/src/components/phz-grid.ts`

Add a new property and state:

```typescript
/** Show admin settings menu item in toolbar (admin users only). */
@property({ type: Boolean, attribute: 'show-admin-settings' })
showAdminSettings: boolean = false;

/** Controls admin panel visibility. */
@state() private adminPanelOpen: boolean = false;
```

The grid listens for the `toolbar-admin-settings` event and toggles `adminPanelOpen`.
When `adminPanelOpen` is true, the grid renders a `<phz-grid-admin>` in a side
panel slot (or adjacent layout div).

### 2.3 New Report Creation

For creating a **new** report, the host application calls:

```typescript
const grid = document.querySelector('phz-grid');

// Option A: Programmatic — host creates the report shell
grid.createNewReport();  // opens admin panel in "new report" mode

// Option B: Event-driven — grid emits, host handles
grid.addEventListener('create-report-request', (e) => {
  // Host creates ReportConfig shell, sets grid.reportConfig = ...
});
```

The grid (or a containing `<phz-report-view>` orchestrator — see Section 6)
handles the rest.

## 3. Grid Admin Panel — Extended Tabs

### 3.1 Current Tabs

| Tab | Component | Exists |
|-----|-----------|--------|
| Table Settings | `<phz-admin-table-settings>` | Yes |
| Columns | `<phz-admin-columns>` | Yes |
| Formatting | `<phz-admin-formatting>` | Yes |
| Filters | `<phz-admin-filters>` | Yes |
| Export | `<phz-admin-export>` | Yes |

### 3.2 New Tabs (to add)

| Tab | Component | Purpose |
|-----|-----------|---------|
| **Report** | `<phz-admin-report>` | Name, description, permissions |
| **Data Source** | `<phz-admin-data-source>` | Pick data product, see schema, preview |
| **Criteria** | `<phz-admin-criteria>` | Bind filter definitions to this report |

### 3.3 Updated Tab Order

```typescript
type AdminTab =
  | 'report'          // NEW — name, description, metadata
  | 'data-source'     // NEW — data product picker
  | 'table-settings'  // existing
  | 'columns'         // existing
  | 'formatting'      // existing
  | 'filters'         // existing
  | 'criteria'        // NEW — selection criteria binding
  | 'export';         // existing

private readonly tabs: { id: AdminTab; label: string }[] = [
  { id: 'report', label: 'Report' },
  { id: 'data-source', label: 'Data Source' },
  { id: 'table-settings', label: 'Table Settings' },
  { id: 'columns', label: 'Columns' },
  { id: 'formatting', label: 'Formatting' },
  { id: 'filters', label: 'Filters' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'export', label: 'Export' },
];
```

### 3.4 Mode Awareness

The grid-admin should know whether it's editing an **existing** report or
configuring a **new** one:

```typescript
@property({ type: String }) mode: 'create' | 'edit' = 'edit';
```

In `create` mode:
- The panel opens automatically to the "Report" tab
- The "Report" and "Data Source" tabs show validation hints (required fields)
- The Save button label is "Create Report" instead of "Save"

In `edit` mode:
- The panel opens to "Table Settings" (existing behavior)
- The Save button is "Save" (existing behavior)

## 4. New Components — Detailed Specs

### 4.1 `<phz-admin-report>` — Report Identity Tab

**File**: `packages/grid-admin/src/components/phz-admin-report.ts`

**Purpose**: Edit report name, description, and metadata.

**Properties**:

```typescript
@property({ type: String }) reportName: string = '';
@property({ type: String }) reportDescription: string = '';
@property({ type: String }) reportId: string = '';
@property({ type: String }) createdBy: string = '';
@property({ type: Number }) created: number = 0;
@property({ type: Number }) updated: number = 0;
@property({ type: Array }) permissions: string[] = [];
```

**Emits**:

```typescript
// On any field change:
'report-meta-change' → {
  key: 'name' | 'description' | 'permissions',
  value: string | string[]
}
```

**Render**: Simple form with:
- Text input for Report Name (required, validated)
- Textarea for Description
- Read-only display of ID, created date, last updated
- Multi-select for permissions/roles (optional)

### 4.2 `<phz-admin-data-source>` — Data Source Picker Tab

**File**: `packages/grid-admin/src/components/phz-admin-data-source.ts`

**Purpose**: Select which DataProduct powers this report. Once selected, the
schema is introspected and columns auto-populate.

**Properties**:

```typescript
/** The BIEngine instance (provides data product registry) */
@property({ attribute: false }) engine?: BIEngine;

/** Currently selected data product ID */
@property({ type: String }) selectedDataProductId: string = '';

/** Available data products (auto-populated from engine if available) */
@property({ attribute: false }) dataProducts: Array<{
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  fieldCount: number;
}> = [];
```

**Internal State**:

```typescript
@state() private searchQuery: string = '';
@state() private previewSchema: DataProductField[] = [];
```

**Emits**:

```typescript
// When user selects a data product:
'data-source-change' → {
  dataProductId: string;
  schema: DataProductField[];  // the full schema for downstream use
}
```

**Render**:
1. **Search/filter** bar to find data products by name/tag
2. **List** of available data products as selectable cards:
   ```
   ┌─────────────────────────────────┐
   │ 📊 Sales Transactions           │  ← name
   │ Daily sales data from POS       │  ← description
   │ 42 fields · sales, retail       │  ← field count + tags
   │ ○ Select                        │
   └─────────────────────────────────┘
   ```
3. **Schema preview** panel (when a product is selected):
   - Shows all fields with name, type, description
   - "Use this data source" confirmation button

**Behavior on selection**:
- Fires `data-source-change` event
- Parent (`<phz-grid-admin>`) receives schema → auto-creates column definitions
- Grid updates with the new columns (empty data until loaded)
- The Columns tab is now populated and editable

### 4.3 `<phz-admin-criteria>` — Selection Criteria Binding Tab

**File**: `packages/grid-admin/src/components/phz-admin-criteria.ts`

**Purpose**: Bind filter definitions from the registry to this report, configure
visibility, order, and overrides.

**Properties**:

```typescript
/** The BIEngine or criteria engine instance */
@property({ attribute: false }) engine?: BIEngine;

/** The ArtefactId for this report (used for binding) */
@property({ type: String }) artefactId: string = '';

/** Current bindings for this report */
@property({ attribute: false }) bindings: FilterBinding[] = [];

/** All available filter definitions from the registry */
@property({ attribute: false }) availableDefinitions: FilterDefinition[] = [];
```

**Internal State**:

```typescript
@state() private searchQuery: string = '';
@state() private selectedDefinitionId: string | null = null;
@state() private editingBinding: FilterBinding | null = null;
```

**Emits**:

```typescript
// When bindings change:
'criteria-binding-change' → {
  bindings: FilterBinding[];
}

// When a definition is added:
'criteria-add' → {
  filterDefinitionId: string;
  order: number;
}

// When a binding is removed:
'criteria-remove' → {
  filterDefinitionId: string;
}

// When binding order changes:
'criteria-reorder' → {
  bindings: Array<{ filterDefinitionId: string; order: number }>;
}
```

**Render**:

Two-panel layout:

```
┌─────────────────────┬──────────────────────┐
│  Available Filters  │  Bound to Report     │
│                     │                      │
│  🔍 Search...       │  (drag to reorder)   │
│                     │                      │
│  ☐ Region           │  1. Region     ✕ ⚙  │
│  ☐ Date Range       │  2. Date Range ✕ ⚙  │
│  ☐ Product Cat.     │                      │
│  ☐ Status           │                      │
│                     │                      │
│  [+ Add Selected]   │                      │
└─────────────────────┴──────────────────────┘
```

Left panel: Searchable list of all FilterDefinitions from the registry.
Right panel: Bound filters with drag-to-reorder, remove (✕), and configure (⚙).

Clicking the ⚙ gear opens an inline configurator for the binding:
- Label override
- Default value override
- Visibility toggle
- Selection mode override
- Bar config (pinned, default open, etc.)

## 5. Configuration Flow — Data Model

### 5.1 Report Config Shape (existing, no changes needed)

The existing `ReportConfig` in `packages/engine/src/report.ts` already has
everything we need:

```typescript
interface ReportConfig {
  id: ReportId;
  name: string;                    // ← "Report" tab
  description?: string;            // ← "Report" tab
  dataProductId: DataProductId;    // ← "Data Source" tab
  columns: ReportColumnConfig[];   // ← "Columns" tab (auto-populated from schema)
  sort?: SortState;                // ← "Table Settings" tab
  filter?: FilterState;            // ← "Filters" tab
  aggregation?: AggregationConfig; // ← "Table Settings" tab
  grouping?: string[];             // ← "Table Settings" tab
  conditionalFormatting?: ...;     // ← "Formatting" tab
  presentation?: ReportPresentation; // ← all visual settings
  criteriaConfig?: CriteriaConfig; // ← "Criteria" tab
  // ...timestamps, permissions, drill-through
}
```

### 5.2 New Report Factory

**File**: `packages/engine/src/report.ts` — add to `ReportConfigStore`

```typescript
/** Creates a blank ReportConfig shell with a generated ID. */
createBlank(name?: string): ReportConfig {
  const id = reportId(`rpt-${crypto.randomUUID()}`);
  const now = Date.now();
  return {
    id,
    name: name ?? 'Untitled Report',
    dataProductId: dataProductId(''),  // empty — must be set
    columns: [],
    created: now,
    updated: now,
  };
}
```

### 5.3 Auto-Save Behavior

When the admin panel closes (`admin-close` event), the grid-admin facade
dispatches a `settings-save` event with the full ReportConfig. The host
application (or orchestrator component) persists it.

```
Admin closes panel
  → <phz-grid-admin> fires 'settings-save' with full config
  → Host calls reportStore.save(config)
  → Done. Report is usable.
```

For auto-save during editing (not just on close), the grid-admin can
debounce changes and emit `settings-auto-save` periodically:

```typescript
// In PhzGridAdmin:
private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

private scheduleAutoSave(): void {
  if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
  this._autoSaveTimer = setTimeout(() => {
    this.dispatchEvent(new CustomEvent('settings-auto-save', {
      bubbles: true, composed: true,
      detail: {
        reportId: this.reportId,
        settings: this.getSettings(),
      },
    }));
  }, 2000);  // 2 second debounce
}
```

## 6. Orchestrator Component — `<phz-report-view>` (Optional)

To simplify the host application's wiring, an optional orchestrator component
bundles the criteria bar + grid + admin panel into one cohesive view.

**File**: `packages/grid/src/components/phz-report-view.ts`

```typescript
@customElement('phz-report-view')
export class PhzReportView extends LitElement {
  /** The report configuration */
  @property({ attribute: false }) reportConfig?: ReportConfig;

  /** The BI engine instance */
  @property({ attribute: false }) engine?: BIEngine;

  /** Data to display */
  @property({ attribute: false }) data: unknown[] = [];

  /** Whether the current user is an admin */
  @property({ type: Boolean }) isAdmin: boolean = false;

  /** Whether admin panel is open */
  @state() private adminOpen: boolean = false;

  render() {
    return html`
      <div class="report-view ${this.adminOpen ? 'report-view--admin-open' : ''}">
        <div class="report-view__main">
          <!-- Criteria bar (populated from report's criteria bindings) -->
          <phz-criteria-bar
            .fields=${this._resolvedFields}
            .values=${this._filterValues}
            @criteria-change=${this._handleCriteriaChange}>
          </phz-criteria-bar>

          <!-- The grid -->
          <phz-grid
            .data=${this.data}
            .columns=${this._resolvedColumns}
            grid-title=${this.reportConfig?.name ?? ''}
            show-admin-settings=${this.isAdmin}
            @toolbar-admin-settings=${this._toggleAdmin}>
          </phz-grid>
        </div>

        ${this.adminOpen ? html`
          <div class="report-view__admin">
            <phz-grid-admin
              open
              mode=${this._isNewReport ? 'create' : 'edit'}
              .reportId=${this.reportConfig?.id ?? ''}
              .reportName=${this.reportConfig?.name ?? ''}
              .engine=${this.engine}
              .columns=${this._resolvedColumns}
              @admin-close=${this._closeAdmin}
              @settings-save=${this._handleSave}
              @data-source-change=${this._handleDataSourceChange}>
            </phz-grid-admin>
          </div>
        ` : nothing}
      </div>
    `;
  }
}
```

**Layout CSS**:
```css
.report-view {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%;
}
.report-view--admin-open {
  grid-template-columns: 1fr 420px;
}
.report-view__main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.report-view__admin {
  border-left: 1px solid #E7E5E4;
  overflow-y: auto;
}
```

## 7. Implementation Plan — Step by Step

### Phase 1: Engine — Report Factory (packages/engine)

| # | Task | File | Details |
|---|------|------|---------|
| 1.1 | Add `createBlank()` to `ReportConfigStore` | `report.ts` | Returns a shell `ReportConfig` with generated ID, empty columns, empty `dataProductId` |
| 1.2 | Add test for `createBlank()` | `__tests__/engine.test.ts` | Verify generated ID format, default values, timestamps |

### Phase 2: Grid-Admin — New Components (packages/grid-admin)

| # | Task | File | Details |
|---|------|------|---------|
| 2.1 | Create `<phz-admin-report>` | `components/phz-admin-report.ts` | Form: name input (required), description textarea, read-only ID/dates, permissions multi-select. Emits `report-meta-change`. |
| 2.2 | Create `<phz-admin-data-source>` | `components/phz-admin-data-source.ts` | Searchable data product list (cards), schema preview panel, emits `data-source-change` with `{ dataProductId, schema }`. Takes `engine` or `dataProducts` array as input. |
| 2.3 | Create `<phz-admin-criteria>` | `components/phz-admin-criteria.ts` | Two-panel: available FilterDefinitions (left) ↔ bound filters (right). Drag-reorder, add/remove, per-binding config overlay (⚙). Emits `criteria-binding-change`. Takes `engine` or `{ availableDefinitions, bindings }`. |
| 2.4 | Extend `<phz-grid-admin>` tab list | `components/phz-grid-admin.ts` | Add 3 new tabs (report, data-source, criteria) to `AdminTab` union and `tabs` array. Import new components. Add `mode` property. Wire `renderTabContent()` for new tabs. |
| 2.5 | Add `mode` and `engine` properties | `components/phz-grid-admin.ts` | `mode: 'create' \| 'edit'` — controls initial tab, save button label, validation. `engine?: BIEngine` — passed through to data-source and criteria tabs. |
| 2.6 | Add auto-save logic | `components/phz-grid-admin.ts` | Debounced `settings-auto-save` event on any child change. 2-second debounce timer. |
| 2.7 | Update exports | `index.ts` | Export new components and types. |
| 2.8 | Write tests | `__tests__/admin-report.test.ts`, `__tests__/admin-data-source.test.ts`, `__tests__/admin-criteria.test.ts` | See Section 8 for test specs. |

### Phase 3: Toolbar — Admin Entry Point (packages/grid)

| # | Task | File | Details |
|---|------|------|---------|
| 3.1 | Add `showAdminSettings` property | `components/phz-toolbar.ts` | Boolean, defaults false. |
| 3.2 | Add "Admin Settings" menu item | `components/phz-toolbar.ts` | In options dropdown after "Auto-size Columns", gated by `showAdminSettings`. Fires `toolbar-admin-settings`. |
| 3.3 | Add admin panel toggle to `<phz-grid>` | `components/phz-grid.ts` | Property `showAdminSettings`, state `adminPanelOpen`. Listen for `toolbar-admin-settings` → toggle panel. Emit `admin-panel-toggle` event for host. |
| 3.4 | Wire toolbar property | `components/phz-grid.ts` | Pass `show-admin-settings` to `<phz-toolbar>` in render. |
| 3.5 | Write tests | `__tests__/toolbar.test.ts` | Menu item visibility, event emission. |

### Phase 4: Report View Orchestrator (packages/grid)

| # | Task | File | Details |
|---|------|------|---------|
| 4.1 | Create `<phz-report-view>` | `components/phz-report-view.ts` | Orchestrator: criteria-bar + grid + admin panel layout. Properties: `reportConfig`, `engine`, `data`, `isAdmin`. Handles data-source-change → column auto-population, criteria-change → grid filtering, settings-save → persistence dispatch. |
| 4.2 | Export from index | `index.ts` | Add PhzReportView export. |
| 4.3 | Add to CDN bundles | `cdn.ts`, `cdn-all.ts` | Import `./components/phz-report-view.js`. |
| 4.4 | Write tests | `__tests__/report-view.test.ts` | See Section 8 for test specs. |

### Phase 5: Integration & Polish

| # | Task | File | Details |
|---|------|------|---------|
| 5.1 | Add admin-simulator example | `examples/report-admin.html` | Demo page: creates an engine with sample data products, renders `<phz-report-view>` with `isAdmin=true`, demonstrates full create-and-configure flow. |
| 5.2 | Update package.json peer deps | `grid-admin/package.json` | Add `@phozart/phz-engine` if not already a peer. |
| 5.3 | Update package READMEs | `grid-admin/README.md`, `grid/README.md` | Document new components and props. |

## 8. Test Specifications

### 8.1 `admin-report.test.ts`

```
describe('PhzAdminReport')
  ✓ renders name input with current reportName value
  ✓ renders description textarea
  ✓ emits report-meta-change with key='name' on name input
  ✓ emits report-meta-change with key='description' on description change
  ✓ shows validation error when name is empty and mode=create
  ✓ displays read-only report ID
  ✓ displays formatted created/updated dates
```

### 8.2 `admin-data-source.test.ts`

```
describe('PhzAdminDataSource')
  ✓ renders list of available data products
  ✓ filters data products by search query
  ✓ shows field count and tags for each product
  ✓ selecting a product shows schema preview
  ✓ schema preview shows field name, type, description
  ✓ emits data-source-change with dataProductId and schema on confirm
  ✓ highlights currently selected data product
  ✓ shows empty state when no data products available
```

### 8.3 `admin-criteria.test.ts`

```
describe('PhzAdminCriteria')
  ✓ renders available filter definitions in left panel
  ✓ renders bound filters in right panel
  ✓ filters available definitions by search query
  ✓ clicking add moves definition to bound list
  ✓ clicking remove (✕) moves definition back to available
  ✓ emits criteria-binding-change on add
  ✓ emits criteria-binding-change on remove
  ✓ emits criteria-reorder on drag-drop reorder
  ✓ clicking ⚙ opens binding configuration overlay
  ✓ binding config allows label override
  ✓ binding config allows default value override
  ✓ binding config allows visibility toggle
  ✓ shows empty state when no definitions are registered
```

### 8.4 `report-view.test.ts`

```
describe('PhzReportView')
  ✓ renders criteria bar and grid
  ✓ admin panel is hidden when isAdmin=false
  ✓ admin panel toggle works when isAdmin=true
  ✓ toolbar shows "Admin Settings" menu only for admin
  ✓ data-source-change event auto-populates grid columns
  ✓ criteria-change event updates grid filter state
  ✓ settings-save event is dispatched on admin panel close
  ✓ new report opens admin panel automatically in create mode
  ✓ layout switches to two-column when admin panel opens
```

### 8.5 `toolbar.test.ts` (extend existing)

```
describe('PhzToolbar — Admin Settings')
  ✓ does not render Admin Settings when showAdminSettings=false
  ✓ renders Admin Settings button when showAdminSettings=true
  ✓ emits toolbar-admin-settings event on click
  ✓ closes options menu after clicking Admin Settings
```

### 8.6 `report-factory.test.ts` (extend engine tests)

```
describe('ReportConfigStore.createBlank')
  ✓ returns a ReportConfig with generated ID matching rpt-* pattern
  ✓ sets name to "Untitled Report" when no name given
  ✓ sets name to provided value when given
  ✓ sets empty dataProductId
  ✓ sets empty columns array
  ✓ sets created and updated to current timestamp
```

## 9. Event Flow Diagram

```
                          HOST APPLICATION
                               │
                    ┌──────────┴──────────┐
                    │  <phz-report-view>   │
                    │  (orchestrator)      │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼────────────────────┐
            │                  │                    │
   ┌────────┴────────┐  ┌─────┴──────┐   ┌────────┴────────┐
   │ <phz-criteria-  │  │ <phz-grid> │   │ <phz-grid-      │
   │  bar>           │  │            │   │  admin>          │
   │                 │  │            │   │                  │
   │ criteria-change─┼──┤→ filters   │   │  ┌─ report tab  │
   │                 │  │            │   │  ├─ data-source  │
   └─────────────────┘  │ toolbar-   │   │  ├─ settings    │
                        │ admin-     │   │  ├─ columns     │
                        │ settings ──┼───┤→ ├─ formatting  │
                        │            │   │  ├─ filters     │
                        └────────────┘   │  ├─ criteria    │
                                         │  └─ export      │
                                         │                  │
                                         │ settings-save ───┤→ persist
                                         │ data-source-     │
                                         │  change ─────────┤→ column
                                         │ criteria-binding- │   auto-pop
                                         │  change ─────────┤→ bar update
                                         └──────────────────┘
```

## 10. Data Source Selection → Column Auto-Population

When the admin selects a DataProduct in the "Data Source" tab:

1. `<phz-admin-data-source>` fires `data-source-change` with the schema
2. `<phz-grid-admin>` (or `<phz-report-view>`) receives the event
3. Schema fields are converted to `ReportColumnConfig[]`:

```typescript
function schemaToColumns(schema: DataProductSchema): ReportColumnConfig[] {
  return schema.fields.map(field => ({
    field: field.name,
    header: field.description || field.name,
    visible: true,
  }));
}
```

4. These populate:
   - `ReportConfig.columns` (persisted)
   - `<phz-grid>.columns` (live update — grid re-renders with headers)
   - `<phz-admin-columns>` columns list (admin can now reorder/hide/format)

5. If there's a DataSource (local/async/duckdb) registered for this DataProduct,
   the grid also loads the data. Otherwise the grid remains empty until data
   is provided.

## 11. Criteria Binding → Criteria Bar Population

When the admin binds filter definitions in the "Criteria" tab:

1. `<phz-admin-criteria>` fires `criteria-binding-change` with updated bindings
2. The orchestrator resolves bindings to `SelectionFieldDef[]` using the engine:

```typescript
function bindingsToFields(
  bindings: FilterBinding[],
  engine: BIEngine,
): SelectionFieldDef[] {
  return bindings
    .filter(b => b.visible)
    .sort((a, b) => a.order - b.order)
    .map(binding => {
      const def = engine.criteria.getDefinition(binding.filterDefinitionId);
      if (!def) return null;
      return {
        id: def.id as string,
        label: binding.labelOverride ?? def.label,
        type: def.type,
        dataField: binding.dataFieldOverride ?? def.dataField,
        options: def.options,
        defaultValue: binding.defaultValueOverride ?? def.defaultValue,
        required: binding.requiredOverride ?? def.required ?? false,
        // ... other overrides
      } satisfies SelectionFieldDef;
    })
    .filter(Boolean) as SelectionFieldDef[];
}
```

3. The resolved fields are passed to `<phz-criteria-bar>`, which updates live
4. The report's `criteriaConfig` is also updated and persisted

## 12. Access Control

The admin settings entry point is controlled by a simple boolean property. The
host application sets it based on the user's role:

```html
<!-- Only admins see the settings option -->
<phz-report-view
  .reportConfig=${config}
  .engine=${engine}
  .data=${data}
  .isAdmin=${user.role === 'admin'}>
</phz-report-view>

<!-- Or directly on the grid -->
<phz-grid
  .data=${data}
  .columns=${columns}
  show-admin-settings=${user.role === 'admin'}>
</phz-grid>
```

No role checking happens inside the components — the host application decides
who is an admin. The components just respect the boolean flag.

## 13. File Inventory — All New/Modified Files

### New Files

| File | Package | Type |
|------|---------|------|
| `packages/grid-admin/src/components/phz-admin-report.ts` | grid-admin | Component |
| `packages/grid-admin/src/components/phz-admin-data-source.ts` | grid-admin | Component |
| `packages/grid-admin/src/components/phz-admin-criteria.ts` | grid-admin | Component |
| `packages/grid/src/components/phz-report-view.ts` | grid | Component |
| `packages/grid-admin/src/__tests__/admin-report.test.ts` | grid-admin | Test |
| `packages/grid-admin/src/__tests__/admin-data-source.test.ts` | grid-admin | Test |
| `packages/grid-admin/src/__tests__/admin-criteria.test.ts` | grid-admin | Test |
| `packages/grid/src/__tests__/report-view.test.ts` | grid | Test |
| `packages/grid/examples/report-admin.html` | grid | Example |

### Modified Files

| File | Package | Change |
|------|---------|--------|
| `packages/grid-admin/src/components/phz-grid-admin.ts` | grid-admin | Add 3 tabs, `mode` prop, `engine` prop, auto-save |
| `packages/grid-admin/src/index.ts` | grid-admin | Export new components |
| `packages/grid/src/components/phz-toolbar.ts` | grid | Add `showAdminSettings`, "Admin Settings" menu item |
| `packages/grid/src/components/phz-grid.ts` | grid | Add `showAdminSettings`, `adminPanelOpen` state, event wiring |
| `packages/grid/src/index.ts` | grid | Export PhzReportView |
| `packages/grid/src/cdn.ts` | grid | Import report-view |
| `packages/grid/src/cdn-all.ts` | grid | Import report-view |
| `packages/engine/src/report.ts` | engine | Add `createBlank()` to store |
| `packages/grid/src/__tests__/toolbar.test.ts` | grid | Extend with admin settings tests |

## 14. Dependencies Between Tasks

```
1.1 (createBlank) ─┐
                    ├─→ 2.4 (extend grid-admin) ─→ 4.1 (report-view)
2.1 (report tab)  ──┤                                    │
2.2 (data-source) ──┤                                    ▼
2.3 (criteria)    ──┘                              4.3 (CDN bundles)
                                                         │
3.1-3.4 (toolbar) ─────────────────────────────────→ 5.1 (example)
```

Phases 1 and 2 can run in parallel. Phase 3 is independent. Phase 4 depends
on 1+2. Phase 5 depends on everything.

---

## 15. v15 Report Creation Extensions

### 15.1 Async Report Generation

v15 added asynchronous report generation for long-running queries. Types are
defined in `@phozart/phz-shared/types`:

```typescript
interface AsyncReportRequest {
  reportId: string;
  query: {
    source: string;
    fields: string[];
    filters?: unknown;
    groupBy?: string[];
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
  };
  outputFormat?: 'csv' | 'xlsx' | 'json' | 'parquet' | 'pdf';
  callbackUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  resultTTLMs?: number;
}

interface AsyncReportJob {
  id: string;
  reportId: string;
  status: AsyncReportStatus; // 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' | 'expired'
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  expiresAt?: number;
  error?: string;
  resultUrl?: string;
}
```

The UI state is managed by `AsyncReportUIState` in
`@phozart/phz-shared/coordination`:

```typescript
interface AsyncReportUIState {
  jobs: AsyncReportJob[];
  activeJobId: string | null;
}
```

State transitions: `createAsyncReportUIState()`, `addJob()`,
`updateJobStatus()`, `removeJob()`, `getCompletedJobs()`, `getActiveJobs()`.

### 15.2 Wide Report Editing

The editor's `ReportEditState` (from `@phozart/phz-editor`) supports wide
reports with 30+ columns through:

- Column groups and reordering: `reorderReportColumns(state, fromIndex, toIndex)`
- Per-column configuration: `updateReportColumn(state, index, updates)`
- Preview with live data: `toggleReportPreview(state)`, `setReportPreviewData(state, data)`
- Frozen columns: Supported via column config `frozen: 'left' | 'right' | null`
- Data source binding: `setReportDataSource(state, dataSourceId)`

### 15.3 Micro-Widget Cell Renderers in Report Columns

v15 allows report columns to render micro-widget visualizations (sparklines,
gauges, deltas, status indicators) instead of plain text. This is configured via
`MicroWidgetCellConfig` on individual column definitions.

The rendering flow:
1. Column config includes `microWidgetConfig?: MicroWidgetCellConfig`
2. Grid's cell formatting pipeline calls `resolveCellRenderer(config, value, columnWidth, rowHeight, registry)`
3. If a registered renderer can render at the given column width, it produces an SVG/HTML string
4. If not, `getMicroWidgetFallbackText(config, value)` produces a plain text fallback

Four built-in renderers are available:
- **value-only**: Formatted number with colored status dot
- **sparkline**: SVG polyline from array data
- **delta**: Value + arrow + percentage change
- **gauge-arc**: SVG semi-circle arc with fill

### 15.4 Export Tab State

The exports tab tracks generated report files. Managed by `ExportsTabState` in
`@phozart/phz-shared/coordination`:

```typescript
interface ExportEntry {
  id: string;
  reportId: string;
  format: string;
  status: 'pending' | 'complete' | 'failed';
  url?: string;
  createdAt: number;
  size?: number;
}

interface ExportsTabState {
  exports: ExportEntry[];
  sort: { field: ExportSortField; direction: 'asc' | 'desc' };
  filterStatus: string | null;
}
```

State transitions: `createExportsTabState()`, `addExport()`, `updateExport()`,
`removeExport()`, `setSort()`, `setFilterStatus()`, `getVisibleExports()`.

### 15.5 Creation Wizard Simplification

The editor's creation wizard (accessible from the catalog screen) was simplified
in v15 to a 3-step flow:

1. **Choose type**: Select artifact type (dashboard, report, or explorer query)
2. **Configure**: Set title, description, data source. For dashboards: add
   initial widgets. For reports: select columns and configure sort/filter.
3. **Review**: Summary of configuration before creation

This replaces the previous 6-step wizard. The admin-in-grid panel (Section 3-4
above) provides the detailed configuration after initial creation. The
`openCreateDialog()` and `closeCreateDialog()` transitions in
`@phozart/phz-editor/screens/catalog-state` control the wizard visibility.
