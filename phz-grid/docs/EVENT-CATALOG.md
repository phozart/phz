# Event Catalog

All custom events dispatched by components in the phz-grid BI stack.
Events are grouped by package. All events use `bubbles: true, composed: true` unless noted.

---

## @phozart/phz-widgets

### Dashboard Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `dashboard-refresh` | `phz-dashboard` | `{}` | Auto-refresh interval fires | Yes |
| `dashboard-save` | `phz-dashboard` | `{ config: DashboardConfig \| EnhancedDashboardConfig }` | `save()` method called | Yes |
| `widget-click` | `phz-dashboard` | `{ widgetId: string, widgetType: string }` | User clicks a widget cell | Yes |
| `widget-retry` | `phz-dashboard`, `phz-kpi-card`, `phz-kpi-scorecard`, `phz-bar-chart`, `phz-trend-line`, `phz-bottom-n`, `phz-status-table`, `phz-widget`, `phz-pie-chart` | `{}` | User clicks "Retry" on error state | Yes |

### Chart Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `drill-through` | `phz-bar-chart`, `phz-trend-line`, `phz-bottom-n`, `phz-drill-link` | `{ source: string, xValue: string \| number, value: number }` | User clicks a data point, bar, or drill link | Yes |
| `bar-click` | `phz-bar-chart` | `{ source: 'bar-chart', xValue: string \| number, value: number }` or `{ source: 'bar-chart', xValue: string, series: string, value: number, total: number }` (stacked) | User clicks a bar | Yes |
| `slice-click` | `phz-pie-chart` | `{ label: string, value: number, percentage: number }` | User clicks a pie/donut slice | Yes |

### View Manager Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `view-load` | `phz-view-manager` | `{ viewId: string }` | User selects a view from dropdown | Yes |
| `view-save` | `phz-view-manager` | `{ sourceType: string, sourceId: string }` | User clicks "Save" | Yes |
| `view-delete` | `phz-view-manager` | `{ viewId: string }` | User clicks "Delete" on active view | Yes |
| `view-set-default` | `phz-view-manager` | `{ viewId: string }` | User clicks "Set Default" | Yes |

### Selection Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `selection-change` | `phz-selection-bar` | `SelectionContext` (key-value map) | User modifies a selection field | Yes |

---

## @phozart/phz-criteria

### Criteria Panel & Bar Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `criteria-change` | `phz-criteria-panel`, `phz-selection-criteria` | `{ context: SelectionContext }` | Any filter value changes | Yes |
| `criteria-apply` | `phz-criteria-panel`, `phz-selection-criteria` | `{ context: SelectionContext }` | User clicks "Apply Filters" or auto-apply triggers | Yes |
| `criteria-reset` | `phz-criteria-panel`, `phz-selection-criteria` | `{}` | User clicks "Reset" | Yes |
| `criteria-pin-change` | `phz-selection-criteria` | `{ pinned: boolean, width: number }` | User toggles drawer pin | Yes |

### Criteria Bar Events (Internal)

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `bar-open-drawer` | `phz-criteria-bar` | `{}` | User clicks to open the filter drawer | Yes |
| `bar-clear-all` | `phz-criteria-bar` | `{}` | User clicks "Clear All" | Yes |
| `bar-remove-filter` | `phz-criteria-bar` | `{ fieldId: string }` | User removes a filter pill | Yes |

### Filter Drawer Events (Internal)

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `drawer-close` | `phz-filter-drawer` | `{}` | User closes the drawer | Yes |
| `drawer-pin-toggle` | `phz-filter-drawer` | `{ pinned: boolean }` | User toggles pin | Yes |
| `drawer-resize` | `phz-filter-drawer` | `{ width: number }` | User drags drawer edge | Yes |

### Field Component Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `field-change` | `phz-criteria-field` | `{ fieldId: string, value: unknown }` | Field value changes | Yes |
| `chip-change` | `phz-chip-select` | `{ value: string[] }` | Chip selection changes | Yes |
| `tree-change` | `phz-tree-select` | `{ value: string[] }` | Tree selection changes | Yes |
| `tree-expand-request` | `phz-tree-select` | `{}` | User requests expanded modal for large tree | Yes |
| `date-range-change` | `phz-date-range-picker` | `{ value: string }` | Date range selection changes | Yes |
| `range-change` | `phz-numeric-range-input` | `{ value: string }` | Numeric range changes | Yes |
| `search-select` | `phz-searchable-dropdown` | `{ value: string }` | User selects from search dropdown | Yes |
| `match-filter-change` | `phz-match-filter-pill` | `{ value: string }` | Match filter pill value changes | Yes |
| `presence-change` | `phz-field-presence-filter` | `{ filters: Record<string, PresenceState> }` | Presence filter toggles change | Yes |
| `combobox-change` | `phz-combobox` | `{ value: string }` | Combobox value changes | Yes |
| `section-toggle` | `phz-filter-section` | `{ expanded: boolean }` | User expands/collapses a filter section | Yes |
| `modal-close` | `phz-expanded-modal` | `{}` | User closes the expanded modal | Yes |
| `summary-click` | `phz-criteria-summary` | `{ fieldId: string }` | User clicks a filter summary item | Yes |

### Preset Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `preset-load` | `phz-preset-manager` | `{ preset: SelectionPreset }` | User loads a preset | Yes |
| `preset-save` | `phz-preset-manager` | `{ name: string, values: SelectionContext }` | User saves current state as preset | Yes |
| `preset-delete` | `phz-preset-manager` | `{ name: string }` | User deletes a preset | Yes |
| `preset-set-default` | `phz-preset-manager` | `{ name: string }` | User sets a preset as default | Yes |
| `preset-select` | `phz-preset-sidebar` | `{ preset: SelectionPreset }` | User selects a preset in sidebar | Yes |

### Criteria Admin Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `criteria-config-change` | `phz-criteria-admin` | `{ config: CriteriaConfig }` | Admin modifies criteria configuration | Yes |
| `admin-resize` | `phz-criteria-admin` | `{ width: number }` | Admin panel resized | Yes |
| `binding-add` | `phz-criteria-admin`, `phz-filter-configurator` | `{ bindings: FilterBinding[] }` | Filter binding added | Yes |
| `binding-remove` | `phz-criteria-admin`, `phz-filter-configurator`, `phz-filter-definition-admin` | `{ filterDefinitionId: string, artefactId: string }` | Filter binding removed | Yes |
| `binding-update` | `phz-criteria-admin`, `phz-filter-configurator` | `{ filterDefinitionId: string, artefactId: string, patch: object }` | Filter binding updated | Yes |
| `binding-reorder` | `phz-criteria-admin` | `{ bindings: FilterBinding[] }` | Filter bindings reordered | Yes |
| `definition-create` | `phz-criteria-admin`, `phz-filter-definition-admin`, `phz-filter-designer` | `{ definition: FilterDefinition }` | New filter definition created | Yes |

### Filter Designer Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `definition-update` | `phz-filter-definition-admin`, `phz-filter-designer` | `{ id: string, patch: object }` | Filter definition updated | Yes |
| `definition-deprecate` | `phz-filter-definition-admin`, `phz-filter-designer` | `{ id: string }` | Filter definition deprecated | Yes |
| `definition-restore` | `phz-filter-designer` | `{ id: string }` | Deprecated filter definition restored | Yes |
| `open-designer` | `phz-filter-configurator` | `{}` | User clicks "New Definition" | Yes |

### Rule Admin Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `rule-add` | `phz-rule-admin`, `phz-filter-designer` | `{ rule: FilterRule }` | New rule created | Yes |
| `rule-update` | `phz-rule-admin`, `phz-filter-designer` | `{ ruleId: string, patch: object }` | Rule updated | Yes |
| `rule-remove` | `phz-rule-admin`, `phz-filter-designer` | `{ ruleId: string }` | Rule deleted | Yes |
| `rule-toggle` | `phz-rule-admin`, `phz-filter-designer` | `{ ruleId: string, enabled: boolean }` | Rule enabled/disabled | Yes |
| `rule-contextmenu` | `phz-rule-admin` | `{ ruleId: string, x: number, y: number }` | Right-click on rule | Yes |
| `rules-bg-contextmenu` | `phz-rule-admin` | `{ x: number, y: number }` | Right-click on rules background | Yes |

### Rule Editor Modal Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `rule-editor-save` | `phz-rule-editor-modal` | `{ rule: FilterRule, mode: RuleEditorMode }` | User saves rule in editor | Yes |
| `rule-editor-cancel` | `phz-rule-editor-modal` | `{}` | User cancels rule editing | Yes |
| `rule-editor-delete` | `phz-rule-editor-modal` | `{ ruleId: string }` | User deletes rule from editor | Yes |

### Preset Admin Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `preset-create` | `phz-preset-admin`, `phz-filter-designer` | `{ scope: string }` or `{ duplicateFrom: string }` | New preset created | Yes |
| `preset-update` | `phz-preset-admin`, `phz-filter-designer` | `{ presetId: string, patch?: object }` | Preset updated | Yes |
| `preset-delete` | `phz-preset-admin`, `phz-filter-designer` | `{ presetId: string }` | Preset deleted | Yes |
| `preset-contextmenu` | `phz-preset-admin` | `{ presetId: string, x: number, y: number }` | Right-click on preset | Yes |
| `presets-bg-contextmenu` | `phz-preset-admin` | `{ x: number, y: number }` | Right-click on presets background | Yes |
| `filter-preset-create` | `phz-preset-admin` | `{ filterDefId: string, values: object }` | Filter-scoped preset created | Yes |
| `filter-preset-update` | `phz-preset-admin`, `phz-filter-designer` | `{ presetId: string, patch: object }` | Filter-scoped preset updated | Yes |
| `filter-preset-delete` | `phz-preset-admin`, `phz-filter-designer` | `{ presetId: string }` | Filter-scoped preset deleted | Yes |
| `filter-preset-copy` | `phz-preset-admin` | `{ presetId: string }` | Filter-scoped preset duplicated | Yes |
| `filter-preset-contextmenu` | `phz-preset-admin` | `{ presetId: string, x: number, y: number }` | Right-click on filter preset | Yes |

---

## @phozart/phz-grid-admin

### Grid Admin Panel Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `settings-save` | `phz-grid-admin` | `{ reportId: string, presentation: ReportPresentation }` | User clicks "Save" | Yes |
| `settings-auto-save` | `phz-grid-admin` | `{ reportId: string, presentation: ReportPresentation }` | Auto-save after debounce | Yes |
| `settings-reset` | `phz-grid-admin` | `{ reportId: string }` | User clicks "Reset" | Yes |
| `admin-close` | `phz-grid-admin` | `{}` | User closes the admin panel | Yes |
| `copy-settings-request` | `phz-grid-admin` | `{ targetReportId: string, presentation: ReportPresentation }` | User requests copying settings | Yes |

### Column Configuration Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `columns-change` | `phz-admin-columns` | `{ action: 'update', visibleFields: string[] }` or `{ action: 'show-all' }` or `{ action: 'hide-all' }` | Column visibility changes | Yes |
| `column-config-change` | `phz-admin-columns` | `{ field: string, key: string, value: unknown }` | Individual column config changes | Yes |

### Table & Report Settings Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `table-settings-change` | `phz-admin-table-settings` | `{ section: string, key: string, value: unknown }` | Table setting changes | Yes |
| `report-meta-change` | `phz-admin-report` | `{ key: string, value: unknown }` | Report metadata changes (name, description) | Yes |
| `options-change` | `phz-admin-options` | `{ key: string, value: unknown }` | Grid option changes | Yes |

### Theme Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `theme-change` | `phz-admin-theme` | `{ property: string, value: string }` or `{ property: 'token', token: string, value: string }` | Theme setting changes | Yes |

### Export Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `export-settings-change` | `phz-admin-export` | `ExportSettings` (partial) | Export settings updated | Yes |
| `export-download` | `phz-admin-export` | `{ format: string, settings: ExportSettings }` | User clicks "Export" | Yes |

### Formatting Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `rules-change` | `phz-admin-formatting` | `{ action: 'add' \| 'remove' \| 'update', ruleId: string, updates?: object }` | Conditional formatting rule changes | Yes |

### Filter & View Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `criteria-binding-change` | `phz-admin-criteria` | `{ bindings: FilterBinding[] }` | Criteria bindings modified | Yes |
| `data-source-change` | `phz-admin-data-source` | `{ dataProductId: string }` | Data source selection changes | Yes |
| `preset-apply` | `phz-admin-filters` | `{ name: string }` | User applies a filter preset | Yes |
| `presets-change` | `phz-admin-filters` | `{ action: 'add' \| 'delete' \| 'duplicate', name?: string }` | Filter preset list modified | Yes |
| `view-rename` | `phz-admin-views` | `{ viewId: string, name: string }` | User renames a view | Yes |
| `view-set-default` | `phz-admin-views` | `{ viewId: string \| null }` | User sets/unsets default view | Yes |
| `view-delete` | `phz-admin-views` | `{ viewId: string }` | User deletes a view | Yes |

---

## @phozart/phz-engine-admin

### Engine Admin Navigation

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `navigate` | `phz-engine-admin` | `{ tab: string }` | User clicks a tab | Yes |

### KPI Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `kpi-save` | `phz-kpi-form`, `phz-kpi-designer`, `phz-dashboard-studio`, `phz-data-model-modal` | `{ kpi: KPIDefinition, isEdit?: boolean }` | User saves a KPI | Yes |
| `kpi-cancel` | `phz-kpi-form`, `phz-kpi-designer` | `{}` | User cancels KPI editing | Yes |

### Metric Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `metric-save` | `phz-metric-form`, `phz-metric-builder`, `phz-dashboard-studio`, `phz-data-model-modal` | `{ metric: MetricDef, isEdit?: boolean }` or `{ name: string, formula: string, ... }` | User saves a metric | Yes |
| `metric-cancel` | `phz-metric-form`, `phz-metric-builder` | `{}` | User cancels metric editing | Yes |

### Parameter Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `parameter-save` | `phz-parameter-form`, `phz-data-model-modal` | `{ parameter: ParameterDef, isEdit: boolean }` | User saves a parameter | Yes |
| `parameter-cancel` | `phz-parameter-form` | `{}` | User cancels parameter editing | Yes |

### Calculated Field Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `calculated-field-save` | `phz-calculated-field-form`, `phz-data-model-modal` | `{ calculatedField: CalculatedFieldDef, isEdit: boolean }` | User saves a calculated field | Yes |
| `calculated-field-cancel` | `phz-calculated-field-form` | `{}` | User cancels calculated field editing | Yes |

### Report Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `report-save` | `phz-report-designer` | `{ name: string, columns: ReportColumnConfig[], ... }` | User saves a report | Yes |
| `report-cancel` | `phz-report-designer` | `{}` | User cancels report editing | Yes |

### Dashboard Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `dashboard-save` | `phz-dashboard-builder`, `phz-dashboard-studio` | `{ config: DashboardConfig \| EnhancedDashboardConfig }` | User saves a dashboard | Yes |

### Pivot Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `pivot-save` | `phz-pivot-designer` | `{ name: string, config: PivotConfig }` | User saves a pivot configuration | Yes |
| `pivot-preview` | `phz-pivot-designer` | `{ config: PivotConfig }` | User requests pivot preview | Yes |
| `pivot-cancel` | `phz-pivot-designer` | `{}` | User cancels pivot editing | Yes |

### Expression Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `expression-change` | `phz-expression-builder` | `{ expression: string, ast: ExpressionNode \| null, errors: ExpressionError[] }` | Expression text changes | Yes |

### Widget Config Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `widget-config-change` | `phz-widget-config-panel` | `{ config: EnhancedWidgetConfig }` | Widget configuration changes | Yes |

### Filter Studio Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `filter-studio-save` | `phz-filter-studio` | `{ definition: FilterDefinition }` | User saves from filter studio | Yes |
| `filter-studio-cancel` | `phz-filter-studio` | `{}` | User cancels filter studio | Yes |

### Filter Picker Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `binding-add` | `phz-filter-picker` | `{ bindings: FilterBinding[] }` | Filter binding added | Yes |
| `binding-remove` | `phz-filter-picker` | `{ filterDefinitionId: string, artefactId: string }` | Filter binding removed | Yes |
| `binding-update` | `phz-filter-picker` | `{ filterDefinitionId: string, artefactId: string, patch: object }` | Filter binding updated | Yes |
| `binding-reorder` | `phz-filter-picker` | `{ bindings: FilterBinding[] }` | Filter bindings reordered | Yes |

### Data Model Events

| Event | Source | Detail | Trigger | Bubbles |
|-------|--------|--------|---------|---------|
| `sidebar-action` | `phz-data-model-sidebar` | `{ action: string, entityType: string, id?: string }` | User clicks create/edit/menu | Yes |
| `sidebar-contextmenu` | `phz-data-model-sidebar` | `{ entityType: string, id: string, name: string, canAdd: boolean, x: number, y: number }` | Right-click on sidebar item | Yes |
| `modal-close` | `phz-data-model-modal` | `{}` | User closes the data model modal | Yes |
| `modal-select` | `phz-data-model-modal` | `{ entityType: string, id: string }` | User selects an entity in modal | Yes |
| `product-select` | `phz-data-browser` | `{ productId: string }` | User selects a data product | Yes |
| `fields-change` | `phz-selection-field-manager` | `{ fields: SelectionFieldDef[] }` | Selection fields modified | Yes |
| `filter-change` | `phz-global-filter-bar` | `{ filters: GlobalFilter[], values: Record<string, unknown> }` | Global filter selection changes | Yes |
| `slide-close` | `phz-slide-over` | `{}` | User closes the slide-over panel | Yes |

---

## TypeScript Event Maps

Use these types for strongly-typed `addEventListener` calls:

```typescript
// Widget events
interface PhzWidgetEventMap {
  'drill-through': CustomEvent<{ source: string; xValue: string | number; value: number }>;
  'widget-retry': CustomEvent<{}>;
  'widget-click': CustomEvent<{ widgetId: string; widgetType: string }>;
  'bar-click': CustomEvent<{ source: 'bar-chart'; xValue: string | number; value: number }>;
  'slice-click': CustomEvent<{ label: string; value: number; percentage: number }>;
  'dashboard-refresh': CustomEvent<{}>;
  'dashboard-save': CustomEvent<{ config: DashboardConfig | EnhancedDashboardConfig }>;
  'selection-change': CustomEvent<SelectionContext>;
  'view-load': CustomEvent<{ viewId: string }>;
  'view-save': CustomEvent<{ sourceType: string; sourceId: string }>;
  'view-delete': CustomEvent<{ viewId: string }>;
  'view-set-default': CustomEvent<{ viewId: string }>;
}

// Criteria events
interface PhzCriteriaEventMap {
  'criteria-change': CustomEvent<{ context: SelectionContext }>;
  'criteria-apply': CustomEvent<{ context: SelectionContext }>;
  'criteria-reset': CustomEvent<{}>;
  'criteria-pin-change': CustomEvent<{ pinned: boolean; width: number }>;
  'chip-change': CustomEvent<{ value: string[] }>;
  'tree-change': CustomEvent<{ value: string[] }>;
  'date-range-change': CustomEvent<{ value: string }>;
  'range-change': CustomEvent<{ value: string }>;
  'search-select': CustomEvent<{ value: string }>;
  'combobox-change': CustomEvent<{ value: string }>;
  'presence-change': CustomEvent<{ filters: Record<string, PresenceState> }>;
}

// Grid admin events
interface PhzGridAdminEventMap {
  'settings-save': CustomEvent<{ reportId: string; presentation: ReportPresentation }>;
  'settings-auto-save': CustomEvent<{ reportId: string; presentation: ReportPresentation }>;
  'settings-reset': CustomEvent<{ reportId: string }>;
  'admin-close': CustomEvent<{}>;
  'columns-change': CustomEvent<{ action: string; visibleFields?: string[] }>;
  'column-config-change': CustomEvent<{ field: string; key: string; value: unknown }>;
  'table-settings-change': CustomEvent<{ section: string; key: string; value: unknown }>;
  'theme-change': CustomEvent<{ property: string; value: string; token?: string }>;
  'export-download': CustomEvent<{ format: string; settings: ExportSettings }>;
  'rules-change': CustomEvent<{ action: string; ruleId: string; updates?: object }>;
}

// Engine admin events
interface PhzEngineAdminEventMap {
  'navigate': CustomEvent<{ tab: string }>;
  'kpi-save': CustomEvent<{ kpi: KPIDefinition; isEdit?: boolean }>;
  'metric-save': CustomEvent<{ metric: MetricDef; isEdit?: boolean }>;
  'parameter-save': CustomEvent<{ parameter: ParameterDef; isEdit: boolean }>;
  'calculated-field-save': CustomEvent<{ calculatedField: CalculatedFieldDef; isEdit: boolean }>;
  'report-save': CustomEvent<{ name: string; columns: ReportColumnConfig[] }>;
  'dashboard-save': CustomEvent<{ config: DashboardConfig | EnhancedDashboardConfig }>;
  'pivot-save': CustomEvent<{ name: string; config: PivotConfig }>;
  'expression-change': CustomEvent<{ expression: string; ast: ExpressionNode | null; errors: ExpressionError[] }>;
  'widget-config-change': CustomEvent<{ config: EnhancedWidgetConfig }>;
  'filter-studio-save': CustomEvent<{ definition: FilterDefinition }>;
}
```

### Example: Listening for Events

```typescript
// Listen for drill-through on any widget
document.addEventListener('drill-through', (e: CustomEvent) => {
  const { source, xValue, value } = e.detail;
  console.log(`Drill from ${source}: ${xValue} = ${value}`);
});

// Listen for criteria changes
const criteriaPanel = document.querySelector('phz-selection-criteria');
criteriaPanel?.addEventListener('criteria-apply', (e: CustomEvent) => {
  const { context } = e.detail;
  // Apply filters to your data source
  refreshData(context);
});

// Listen for admin save
const gridAdmin = document.querySelector('phz-grid-admin');
gridAdmin?.addEventListener('settings-save', (e: CustomEvent) => {
  const { reportId, presentation } = e.detail;
  saveToServer(reportId, presentation);
});
```
