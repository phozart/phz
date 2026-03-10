# React Components Requirements — PhzGrid & PhzGridAdmin

> Formal requirements for the `@phozart/phz-react` package React wrappers.
> Traced to the underlying `<phz-grid>` and `<phz-grid-admin>` Web Components.

---

## 1. PhzGrid React Component (REQ-GRID-*)

### REQ-GRID-001 — Component Shape
The `PhzGrid` component MUST be a `forwardRef` component exposing `GridApi` via ref.

### REQ-GRID-002 — Required Props
The component MUST accept `data: unknown[]` and `columns: ColumnDefinition[]` as required props.

### REQ-GRID-003 — Display Props
The component MUST accept all `<phz-grid>` display properties as optional props:
- `theme`, `locale`, `responsive`, `virtualization`, `selectionMode`, `editMode`
- `loading`, `height`, `width`, `density`, `gridTitle`, `gridSubtitle`
- `scrollMode`, `pageSize`, `pageSizeOptions`
- `showToolbar`, `showDensityToggle`, `showColumnEditor`, `showAdminSettings`
- `showPagination`, `showCheckboxes`, `showRowActions`, `showSelectionActions`
- `showEditActions`, `showCopyActions`, `rowBanding`
- `statusColors`, `barThresholds`, `dateFormats`, `numberFormats`, `columnStyles`
- `gridLines`, `gridLineColor`, `gridLineWidth`, `bandingColor`
- `hoverHighlight`, `cellTextOverflow`, `compactNumbers`, `autoSizeColumns`
- `aggregation`, `aggregationFn`, `aggregationPosition`
- `groupBy`, `groupByLevels`, `groupTotals`, `groupTotalsFn`
- `conditionalFormattingRules`, `columnGroups`, `userRole`
- `copyHeaders`, `copyFormatted`, `loadingMode`
- `virtualScrollThreshold`, `fetchPageSize`, `prefetchPages`

### REQ-GRID-004 — Extended Display Props
The component MUST additionally accept these props (mapped from `<phz-grid>` properties):
- `showSearch`, `showCsvExport`, `showExcelExport`, `showTitleBar`
- `titleIcon`, `titleBarBg`, `titleBarText`
- `headerBg`, `headerText`, `bodyBg`, `bodyText`, `footerBg`, `footerText`
- `headerWrapping`, `containerShadow`, `containerRadius`
- `fontFamily`, `fontSize`, `titleFontFamily`, `titleFontSize`, `subtitleFontSize`
- `maxCopyRows`, `excludeFieldsFromCopy`, `enableAnomalyDetection`
- `columnFormatting`, `computedColumns`, `columnProfiles`
- `rowActions`, `drillThroughConfig`, `generateDashboardConfig`
- `reportId`, `reportName`, `dataSet`
- `remoteDataSource`, `virtualRowHeight`, `groupTotalsOverrides`
- `allowFiltering`, `allowSorting`, `defaultSortField`, `defaultSortDirection`

### REQ-GRID-005 — Core Event Handlers
The component MUST accept and wire these event callbacks:
- `onGridReady` → `grid-ready`
- `onStateChange` → `state-change`
- `onCellClick` → `cell-click`
- `onCellDoubleClick` → `cell-dblclick`
- `onSelectionChange` → `selection-change`
- `onSortChange` → `sort-change`
- `onFilterChange` → `filter-change`
- `onEditStart` → `edit-start`
- `onEditCommit` → `edit-commit`
- `onEditCancel` → `edit-cancel`
- `onScroll` → `scroll`

### REQ-GRID-006 — Extended Event Handlers
The component MUST additionally accept these event callbacks:
- `onRowAction` → `row-action`
- `onDrillThrough` → `drill-through`
- `onCopy` → `copy`
- `onGenerateDashboard` → `generate-dashboard`
- `onVirtualScroll` → `virtual-scroll`
- `onRemoteDataLoad` → `remote-data-load`
- `onRemoteDataError` → `remote-data-error`
- `onAdminSettings` → `admin-settings`

### REQ-GRID-007 — Slot Props
The component MUST accept ReactNode slot props: `children`, `header`, `footer`, `emptyState`, `loadingIndicator`, `toolbar`.

### REQ-GRID-008 — Styling Props
The component MUST accept `className?: string` and `style?: React.CSSProperties`.

### REQ-GRID-009 — Property Sync
All props MUST be synced to the underlying `<phz-grid>` element via a `useEffect` that runs when any prop changes. Properties set as HTML attributes MUST use `setAttribute`; complex objects MUST be set directly on the element.

### REQ-GRID-010 — Event Cleanup
Event listeners MUST be cleaned up in the effect's return function to prevent memory leaks.

---

## 2. PhzGridAdmin React Component (REQ-ADMIN-*)

### REQ-ADMIN-001 — Component Shape
The `PhzGridAdmin` component MUST be a `forwardRef` component exposing `GridAdminApi` via ref.

### REQ-ADMIN-002 — GridAdminApi Interface
The imperative API MUST expose:
- `getSettings(): ReportPresentation`
- `setSettings(presentation: ReportPresentation): void`
- `open(): void`
- `close(): void`

### REQ-ADMIN-003 — Visibility Props
The component MUST accept:
- `open?: boolean`
- `mode?: 'create' | 'edit'`

### REQ-ADMIN-004 — Report Identity Props
The component MUST accept:
- `reportId`, `reportName`, `reportDescription`
- `reportCreated`, `reportUpdated`, `reportCreatedBy`
- `availableReports`

### REQ-ADMIN-005 — Column Config Props
The component MUST accept:
- `columns`, `fields`, `columnTypes`, `columnFormatting`
- `numberFormats`, `statusColors`, `barThresholds`
- `dateFormats`, `linkTemplates`

### REQ-ADMIN-006 — Settings Props
The component MUST accept:
- `tableSettings`, `formattingRules`, `filterPresets`, `themeTokens`

### REQ-ADMIN-007 — Data Source Props
The component MUST accept:
- `selectedDataProductId`, `dataProducts`, `schemaFields`

### REQ-ADMIN-008 — Criteria Props
The component MUST accept:
- `criteriaDefinitions`, `criteriaBindings`

### REQ-ADMIN-009 — Shared Ref Pattern
The component MUST accept `gridRef?: React.RefObject<GridApi | null>`. When provided, the admin component SHOULD read `columns` and `fields` from the grid API to auto-populate its column configuration.

### REQ-ADMIN-010 — Event Callbacks
The component MUST accept and wire these event callbacks:
- `onSettingsSave` → `settings-save`
- `onSettingsAutoSave` → `settings-auto-save`
- `onSettingsReset` → `settings-reset`
- `onClose` → `admin-close`
- `onCopySettingsRequest` → `copy-settings-request`
- `onExportDownload` → `export-download`

### REQ-ADMIN-011 — Dynamic Import
The component MUST dynamically import `@phozart/phz-grid-admin` on first mount to register the custom element.

### REQ-ADMIN-012 — Styling Props
The component MUST accept `className?: string` and `style?: React.CSSProperties`.

---

## 3. useGridAdmin Hook (REQ-HOOK-*)

### REQ-HOOK-001 — Signature
```typescript
function useGridAdmin(adminRef: RefObject<GridAdminApi | null>): GridAdminHookResult
```

### REQ-HOOK-002 — Return Shape
The hook MUST return:
- `settings: ReportPresentation | null` — current admin settings (updated on save/auto-save)
- `isOpen: boolean` — whether the admin panel is open
- `getSettings(): ReportPresentation | null` — imperative getter
- `setSettings(p: ReportPresentation): void` — imperative setter
- `open(): void` — open the admin panel
- `close(): void` — close the admin panel

### REQ-HOOK-003 — Null Safety
All actions MUST be safe when `adminRef.current` is null (no-op).

---

## 4. Bridge Utilities (REQ-BRIDGE-*)

### REQ-BRIDGE-001 — settingsToGridProps
```typescript
function settingsToGridProps(settings: ReportPresentation): Partial<PhzGridProps>
```
MUST map `ReportPresentation.tableSettings.*` fields to corresponding `PhzGridProps` fields.

### REQ-BRIDGE-002 — Mapping Coverage
The mapping MUST include:
- Container: `containerShadow`, `containerRadius`
- Title bar: `showTitleBar`, `gridTitle`, `gridSubtitle`, `titleFontFamily`, `titleFontSize`, `subtitleFontSize`, `titleBarBg`, `titleBarText`, `titleIcon`
- Toolbar: `showToolbar`, `showSearch`, `showDensityToggle`, `showColumnEditor`, `showCsvExport`, `showExcelExport`
- Grid options: `density`, `loadingMode`, `pageSize`, `headerWrapping`, `columnGroups`, `autoSizeColumns`, `rowBanding`, `showPagination`, `showCheckboxes`, `scrollMode`, `showRowActions`, `showSelectionActions`, `showEditActions`, `showCopyActions`
- Typography: `fontFamily`, `fontSize`
- Grouping: `groupBy` (from `groupByFields`), `groupByLevels`, `groupTotals`, `groupTotalsFn`, `groupTotalsOverrides`
- Aggregation: `aggregation` (from `showAggregation`), `aggregationPosition`, `aggregationFn`
- Display: `gridLines`, `gridLineColor`, `gridLineWidth`, `bandingColor`, `hoverHighlight`, `cellTextOverflow`, `compactNumbers`
- Section colors: `headerBg`, `headerText`, `bodyBg`, `bodyText`, `footerBg`, `footerText`
- Top-level presentation: `columnFormatting`, `numberFormats`, `statusColors`, `barThresholds`, `dateFormats`

### REQ-BRIDGE-003 — Undefined Safety
If `settings` or `settings.tableSettings` is undefined/null, the function MUST return `{}`.

---

## 5. Traceability

| Requirement | Source WC Property/Event | React Prop |
|-------------|-------------------------|------------|
| REQ-GRID-004 | `<phz-grid>.showSearch` | `showSearch` |
| REQ-GRID-004 | `<phz-grid>.showCsvExport` | `showCsvExport` |
| REQ-GRID-004 | `<phz-grid>.titleBarBg` | `titleBarBg` |
| REQ-GRID-006 | `row-action` event | `onRowAction` |
| REQ-GRID-006 | `drill-through` event | `onDrillThrough` |
| REQ-GRID-006 | `copy` event | `onCopy` |
| REQ-GRID-006 | `generate-dashboard` event | `onGenerateDashboard` |
| REQ-ADMIN-010 | `settings-save` event | `onSettingsSave` |
| REQ-ADMIN-010 | `settings-auto-save` event | `onSettingsAutoSave` |
| REQ-ADMIN-010 | `admin-close` event | `onClose` |
