# UX-T4B1 Architecture Spec

## UX-021: Active Filter Visibility (viewer)

### Problem

Users can't see at a glance which filters are active and what values they're set to. They have to open each filter to check.

### Existing Infrastructure

- `filter-bar-state.ts`: `FilterBarState` with `currentValues: Record<string, FilterValue>`, `getActiveFilterCount()`, `hasFilterValue()`
- `FilterValue` type with `filterId`, `field`, `operator`, `value`, `label`

### State Machine Design

```typescript
export interface ActiveFilterChip {
  filterId: string;
  field: string;
  label: string;
  displayValue: string; // human-readable summary
  operator: string;
  removable: boolean;
}

export interface ActiveFilterVisibilityState {
  chips: ActiveFilterChip[];
  expandedChipId: string | null; // which chip shows full detail
  collapsed: boolean; // collapse to count-only mode
}
```

### Functions

- `createActiveFilterVisibilityState()` — factory
- `computeFilterChips(filters: Record<string, FilterValue>, definitions: FilterDefinitionInput[])` — derive chips from active filter values
- `expandChip(state, chipId)` — show detail for a chip
- `collapseChip(state)` — hide detail
- `toggleCollapsed(state)` — switch between chips view and count-only
- `removeChip(state, chipId)` — remove a chip (returns state with chip removed)
- `getChipCount(state)` — query
- `getExpandedChip(state)` — query

### File: `packages/viewer/src/screens/active-filter-state.ts`

### Test: `packages/viewer/src/__tests__/active-filter-state.test.ts`

---

## UX-022: Column Chooser Lightweight Mode (grid)

### Problem

The full column chooser is feature-rich (drag reorder, profiles, computed columns) but heavyweight for quickly toggling a few columns on/off.

### Existing Infrastructure

- `ColumnChooserController` with `open()`, `close()`, `hideColumn()`
- `ColumnState` with `visibility: Record<string, boolean>`, `order: string[]`
- `ColumnDefinition` with `field`, `header`, `hidden`, `priority`

### State Machine Design

```typescript
export interface QuickColumnEntry {
  field: string;
  label: string;
  visible: boolean;
  frozen?: 'left' | 'right' | null;
}

export interface ColumnQuickToggleState {
  open: boolean;
  columns: QuickColumnEntry[];
  searchQuery: string;
  lastToggledField: string | null; // for undo hint
}
```

### Functions

- `createColumnQuickToggleState(columns)` — factory from column definitions
- `openQuickToggle(state)` — open panel (no-op if already open)
- `closeQuickToggle(state)` — close panel (no-op if already closed)
- `toggleQuickToggle(state)` — toggle open/close
- `toggleColumnVisible(state, field)` — flip visibility
- `setQuickToggleSearch(state, query)` — filter columns
- `showAllColumns(state)` — set all visible
- `hideAllColumns(state)` — set all hidden
- `getFilteredColumns(state)` — columns matching search query
- `getVisibleCount(state)` — count of visible columns
- `getHiddenCount(state)` — count of hidden columns

### File: `packages/grid/src/controllers/column-quick-toggle-state.ts`

### Test: `packages/grid/src/__tests__/column-quick-toggle-state.test.ts`

---

## UX-023: Keyboard Shortcuts Help Panel (viewer)

### Problem

Users don't know what keyboard shortcuts are available. There's no discoverable way to learn them.

### Existing Infrastructure

- `keyboard-shortcuts.ts`: `ShortcutBinding[]` with `key`, modifiers, `action`, `label`
- `shortcut-mode-state.ts`: `ShortcutSequence[]` with `keys`, `action`, `label`, `category`
- `command-palette-state.ts`: overlay pattern with open/close, search, categories
- `keyboard-navigator.ts`: grid-specific keyboard handling

### State Machine Design

```typescript
export type HelpShortcutCategory = 'navigation' | 'editing' | 'selection' | 'clipboard' | 'general';

export interface HelpShortcutEntry {
  keys: string; // display string e.g. "Ctrl+C", "Arrow Up"
  label: string;
  category: HelpShortcutCategory;
  description?: string;
}

export interface KeyboardHelpState {
  open: boolean;
  searchQuery: string;
  activeCategory: HelpShortcutCategory | null; // null = show all
  shortcuts: HelpShortcutEntry[];
}
```

### Default Shortcuts Catalog

- **navigation**: Arrow keys, Tab, Home/End, Page Up/Down
- **editing**: F2 (edit cell), Escape (cancel), Enter (confirm)
- **selection**: Ctrl+A (select all), Shift+Click (range), Ctrl+Click (multi)
- **clipboard**: Ctrl+C (copy), Ctrl+V (paste)
- **general**: Ctrl+Z (undo), Ctrl+S (save), ? (help), Ctrl+K (command palette)

### Functions

- `createKeyboardHelpState(shortcuts?)` — factory with defaults
- `openKeyboardHelp(state)` — open (no-op if open)
- `closeKeyboardHelp(state)` — close (no-op if closed)
- `toggleKeyboardHelp(state)` — toggle
- `setHelpSearch(state, query)` — filter shortcuts
- `setHelpCategory(state, category)` — filter by category (null = all)
- `getFilteredShortcuts(state)` — shortcuts matching search + category
- `getShortcutsByCategory(state)` — grouped record

### File: `packages/viewer/src/screens/keyboard-help-state.ts`

### Test: `packages/viewer/src/__tests__/keyboard-help-state.test.ts`

---

## UX-024: Cross-Filter Source Highlighting (viewer)

### Problem

When cross-filtering is active in a dashboard, users can't tell which widget is the source and which widgets are being affected.

### Existing Infrastructure

- `dashboard-state.ts`: `crossFilters: CrossFilterEntry[]` with `sourceWidgetId`, `field`, `value`
- `cross-filter-rule-state.ts`: `CrossFilterRule` with `sourceWidgetId`, `targetWidgetId`, `fieldMapping`
- `getCrossFilterMatrix(rules, widgetIds)` — adjacency list

### State Machine Design

```typescript
export type WidgetHighlightRole = 'source' | 'target' | 'none';

export interface CrossFilterHighlightState {
  active: boolean;
  sourceWidgetId: string | null;
  targetWidgetIds: ReadonlySet<string>;
  sourceField: string | null;
  hoverWidgetId: string | null; // which widget user is hovering for tooltip
}
```

### Functions

- `createCrossFilterHighlightState()` — factory (inactive)
- `activateHighlighting(state, sourceWidgetId, targetWidgetIds, sourceField)` — turn on highlighting
- `deactivateHighlighting(state)` — turn off (no-op if already off)
- `setHoverWidget(state, widgetId)` — track hover for tooltip
- `clearHoverWidget(state)` — clear hover
- `getWidgetRole(state, widgetId)` — returns 'source' | 'target' | 'none'
- `isHighlightActive(state)` — query
- `getHighlightedWidgetIds(state)` — all highlighted widget IDs (source + targets)

### File: `packages/viewer/src/screens/cross-filter-highlight-state.ts`

### Test: `packages/viewer/src/__tests__/cross-filter-highlight-state.test.ts`

---

## UX-025: Export Progress for Large Datasets (grid)

### Problem

Exporting large datasets (10k+ rows) takes time but provides no feedback — the user doesn't know if it's working.

### Existing Infrastructure

- `ExportController` with `exportCSV()`, `exportExcel()` — synchronous, no progress
- `ToastController` — shows completion message
- `ReportViewState.exporting: boolean` — simple flag

### State Machine Design

```typescript
export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'finalizing'
  | 'complete'
  | 'error'
  | 'cancelled';
export type ExportFormat = 'csv' | 'xlsx';

export interface ExportProgressState {
  status: ExportStatus;
  format: ExportFormat | null;
  totalRows: number;
  processedRows: number;
  startedAt: number | null; // timestamp
  error: string | null;
  fileName: string | null;
}
```

### Functions

- `createExportProgressState()` — factory (idle)
- `startExport(state, format, totalRows, fileName)` — begin export
- `updateExportProgress(state, processedRows)` — update row count
- `finalizeExport(state)` — mark as finalizing (writing file)
- `completeExport(state)` — mark complete
- `failExport(state, error)` — mark error
- `cancelExport(state)` — mark cancelled
- `resetExport(state)` — back to idle (no-op if already idle)
- `getExportProgress(state)` — percentage 0-100
- `getElapsedTime(state, now)` — elapsed ms since start
- `getEstimatedTimeRemaining(state, now)` — estimated ms remaining
- `isExporting(state)` — true if preparing/processing/finalizing

### File: `packages/grid/src/controllers/export-progress-state.ts`

### Test: `packages/grid/src/__tests__/export-progress-state.test.ts`
