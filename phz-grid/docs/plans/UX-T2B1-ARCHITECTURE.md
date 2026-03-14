# UX-T2B1 Architecture Spec — Major UX Upgrades Batch 1

**Batch**: T2-B1
**Items**: UX-007 through UX-011
**Status**: ACTIVE

---

## UX-007: Contextual Header Actions in Viewer

### Problem

When viewing a report, the only way to sort/filter/group is through the grid's right-click context menu. Users must discover this affordance on their own. Actions should be visually present and contextual.

### Existing Infrastructure

- Grid already has `ContextMenuController` with full right-click menu on headers
- Viewer uses headless state machines (`report-state.ts`)
- `ReportViewState` has `sortColumns[]`, filters, grouping

### Design

Add a headless state machine for computing context-aware header actions. When a column header is hovered, compute available actions based on column type and current state.

**New type**: `ColumnHeaderAction`

```typescript
export type HeaderActionType =
  | 'sort-asc'
  | 'sort-desc'
  | 'clear-sort'
  | 'filter'
  | 'group'
  | 'aggregate'
  | 'hide'
  | 'pin-left'
  | 'pin-right';

export interface ColumnHeaderAction {
  type: HeaderActionType;
  label: string;
  icon: string; // icon identifier for rendering
  enabled: boolean;
  active: boolean; // true if action is currently applied (e.g., column is sorted)
}
```

**New functions** in `viewer/src/screens/report-state.ts`:

```typescript
export function computeHeaderActions(
  state: ReportViewState,
  field: string,
  columnType: string,
): ColumnHeaderAction[];
export function setHoveredColumn(state: ReportViewState, field: string | null): ReportViewState;
```

### State Addition

```typescript
// Added to ReportViewState
hoveredColumn: string | null;
```

### Files

| File                                        | Change                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `viewer/src/screens/report-state.ts`        | Add `hoveredColumn`, `setHoveredColumn()`, `computeHeaderActions()` |
| `viewer/src/index.ts`                       | Export new types and functions                                      |
| `viewer/src/__tests__/report-state.test.ts` | Tests for header actions                                            |

### Test Plan (~20 tests)

- computeHeaderActions returns sort actions for all column types
- computeHeaderActions returns filter action
- computeHeaderActions returns group action for string/date columns
- computeHeaderActions returns aggregate for numeric columns
- sort-asc/sort-desc active when column is sorted
- clear-sort only enabled when column is sorted
- setHoveredColumn updates state
- setHoveredColumn(null) clears

---

## UX-008: Inline Column Pinning

### Problem

Column pinning is only configurable via the `frozen` property on column definitions at setup time. Users cannot pin/unpin columns at runtime from the UI.

### Existing Infrastructure

- `ColumnDefinition.frozen?: 'left' | 'right' | null`
- `splitPinnedColumns()`, `computePinnedOffsets()`, `getPinnedStyle()` utilities
- CSS classes: `.phz-*--pinned-left`, `.phz-*--pinned-right` with full theme support
- Context menu on header cells

### Design

Add a headless state machine for runtime column pinning that overrides the static `frozen` property. The grid component will render a pin icon on header hover and add pin/unpin to the context menu.

**New state** in `core/src/types/state.ts`:

```typescript
// Added to ColumnState
pinOverrides: Record<string, 'left' | 'right' | null>;
```

**New functions** in `core/src/state.ts`:

```typescript
export function pinColumn(state: GridState, field: string, side: 'left' | 'right'): GridState;
export function unpinColumn(state: GridState, field: string): GridState;
export function getEffectivePinState(
  state: GridState,
  col: ColumnDefinition,
): 'left' | 'right' | null;
```

`getEffectivePinState` checks `pinOverrides` first, falls back to `col.frozen`.

### Files

| File                                              | Change                                                       |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `core/src/types/state.ts`                         | Add `pinOverrides` to `ColumnState`                          |
| `core/src/state.ts`                               | Add `pinColumn()`, `unpinColumn()`, `getEffectivePinState()` |
| `core/src/index.ts`                               | Export new functions                                         |
| `core/src/__tests__/column-pinning-state.test.ts` | New test file                                                |

### Test Plan (~15 tests)

- pinColumn sets override for field
- unpinColumn removes override
- getEffectivePinState returns override when present
- getEffectivePinState falls back to col.frozen
- getEffectivePinState returns null when no frozen and no override
- pinColumn preserves other overrides
- unpinColumn on non-pinned field is safe
- Pin state included in serialization (exportState/importState)

---

## UX-009: Saved Views / Column Layouts

### Problem

Users cannot save and restore their preferred column layouts, sorts, and filters. Every session starts from scratch.

### Existing Infrastructure (COMPREHENSIVE)

- `ViewsManager` with full CRUD: save, load, delete, rename, setDefault, isViewDirty
- `SavedView` type with id, name, state, presentation, isDefault, timestamps
- `SerializedGridState` captures: columns (order, widths, visibility), sort, filter, grouping, selection
- `GridApi` exposes all view methods + events (view:save, view:load, view:delete)
- `exportViews()`/`importViews()` for persistence
- Full test coverage (250 lines)

### What's Missing: UI Layer

The core has everything; we need the headless state for a view management panel.

**New state machine**: `viewer/src/screens/view-manager-state.ts`

```typescript
export interface ViewManagerState {
  open: boolean;
  views: ViewSummary[];
  activeViewId: string | null;
  dirty: boolean;
  renamingViewId: string | null;
  renameValue: string;
}
```

**Functions**:

```typescript
export function createViewManagerState(): ViewManagerState;
export function openViewManager(state: ViewManagerState): ViewManagerState;
export function closeViewManager(state: ViewManagerState): ViewManagerState;
export function setViews(state: ViewManagerState, views: ViewSummary[]): ViewManagerState;
export function setActiveView(state: ViewManagerState, viewId: string | null): ViewManagerState;
export function setDirty(state: ViewManagerState, dirty: boolean): ViewManagerState;
export function startRename(state: ViewManagerState, viewId: string): ViewManagerState;
export function updateRenameName(state: ViewManagerState, name: string): ViewManagerState;
export function finishRename(state: ViewManagerState): {
  state: ViewManagerState;
  viewId: string;
  newName: string;
};
export function cancelRename(state: ViewManagerState): ViewManagerState;
```

### Files

| File                                              | Change                         |
| ------------------------------------------------- | ------------------------------ |
| `viewer/src/screens/view-manager-state.ts`        | New state machine              |
| `viewer/src/__tests__/view-manager-state.test.ts` | New test file                  |
| `viewer/src/index.ts`                             | Export new types and functions |

### Test Plan (~20 tests)

- createViewManagerState initializes correctly
- open/close toggles
- setViews populates list
- setActiveView updates active
- setDirty tracks dirty flag
- rename workflow: start → update → finish returns viewId + newName
- rename workflow: start → cancel resets
- finishRename with empty name is ignored

---

## UX-010: Dashboard Builder vs Studio Unification

### Problem

Two separate dashboard authoring tools (Builder: simple, Studio: advanced) with no discovery path between them. Users don't know Studio exists. Starting with Builder and needing advanced features requires manual migration.

### Existing Infrastructure

- `PhzDashboardBuilder`: 674 lines, simple 3-panel (catalog → canvas → config)
- `PhzDashboardStudio`: 1,316 lines, advanced (toolbar, data model sidebar, global filters, drag-drop, resize, modals)
- Both export `DashboardConfig`; Studio also uses `EnhancedDashboardConfig`

### Design

Create a unified headless state machine for dashboard editing with a `mode` property that enables progressive disclosure. The component starts simple and unlocks advanced features on demand.

**New state machine**: `workspace/src/engine-admin/dashboard-editor-state.ts`

```typescript
export type DashboardEditorMode = 'simple' | 'advanced';

export interface DashboardEditorState {
  mode: DashboardEditorMode;
  name: string;
  description: string;
  layoutColumns: number;
  widgets: WidgetPlacement[];
  selectedWidgetId: string | null;
  // Advanced mode (populated when mode === 'advanced')
  showDataModel: boolean;
  showToolbar: boolean;
  globalFilters: GlobalFilter[];
}
```

**Functions**:

```typescript
export function createDashboardEditorState(mode?: DashboardEditorMode): DashboardEditorState;
export function enableAdvancedMode(state: DashboardEditorState): DashboardEditorState;
export function toggleDataModel(state: DashboardEditorState): DashboardEditorState;
export function toggleToolbar(state: DashboardEditorState): DashboardEditorState;
export function addWidget(
  state: DashboardEditorState,
  widget: WidgetPlacement,
): DashboardEditorState;
export function removeWidget(state: DashboardEditorState, widgetId: string): DashboardEditorState;
export function selectWidget(
  state: DashboardEditorState,
  widgetId: string | null,
): DashboardEditorState;
export function updateWidgetConfig(
  state: DashboardEditorState,
  widgetId: string,
  config: Record<string, unknown>,
): DashboardEditorState;
export function setName(state: DashboardEditorState, name: string): DashboardEditorState;
export function setDescription(
  state: DashboardEditorState,
  description: string,
): DashboardEditorState;
export function isAdvancedFeatureUsed(state: DashboardEditorState): boolean;
```

### Files

| File                                                                  | Change                         |
| --------------------------------------------------------------------- | ------------------------------ |
| `workspace/src/engine-admin/dashboard-editor-state.ts`                | New state machine              |
| `workspace/src/engine-admin/__tests__/dashboard-editor-state.test.ts` | New test file                  |
| `workspace/src/engine-admin/index.ts`                                 | Export new types and functions |

### Test Plan (~22 tests)

- createDashboardEditorState defaults to simple mode
- enableAdvancedMode switches to advanced, shows toolbar
- toggleDataModel only works in advanced mode
- addWidget/removeWidget/selectWidget CRUD
- updateWidgetConfig merges config
- setName/setDescription update metadata
- isAdvancedFeatureUsed returns true when globalFilters non-empty
- Simple mode state serializes to DashboardConfig
- Advanced mode state serializes to EnhancedDashboardConfig

---

## UX-011: Template Gallery

### Problem

Template gallery exists as a component but needs better discoverability (search, filtering, category grouping) and management UI (save dashboard as template, delete custom templates).

### Existing Infrastructure (COMPREHENSIVE)

- 9 default templates in `default-templates.ts`
- `<phz-template-gallery>` Lit component with `filterTemplates()`, `groupTemplatesByCategory()`
- Schema analyzer, template matcher, auto-binding pipeline
- Creation flow state machine (5-step wizard)
- `WorkspaceAdapter.saveTemplate()`, `loadTemplates()`, `deleteTemplate()`

### What's Missing: Headless State for Gallery Interactions

The component exists but needs richer state management for search, category filtering, and favorites.

**New state machine**: `workspace/src/templates/template-gallery-state.ts`

```typescript
export interface TemplateGalleryState {
  templates: TemplateDefinition[];
  searchQuery: string;
  selectedCategory: string | null; // null = all
  categories: string[];
  selectedTemplateId: string | null;
  favoriteIds: Set<string>;
}
```

**Functions**:

```typescript
export function createTemplateGalleryState(templates: TemplateDefinition[]): TemplateGalleryState;
export function setSearchQuery(state: TemplateGalleryState, query: string): TemplateGalleryState;
export function selectCategory(
  state: TemplateGalleryState,
  category: string | null,
): TemplateGalleryState;
export function selectTemplate(
  state: TemplateGalleryState,
  templateId: string | null,
): TemplateGalleryState;
export function toggleFavorite(
  state: TemplateGalleryState,
  templateId: string,
): TemplateGalleryState;
export function getFilteredTemplates(state: TemplateGalleryState): TemplateDefinition[];
export function getGroupedTemplates(state: TemplateGalleryState): Map<string, TemplateDefinition[]>;
```

### Files

| File                                                               | Change                         |
| ------------------------------------------------------------------ | ------------------------------ |
| `workspace/src/templates/template-gallery-state.ts`                | New state machine              |
| `workspace/src/templates/__tests__/template-gallery-state.test.ts` | New test file                  |
| `workspace/src/templates/index.ts` (or workspace index)            | Export new types and functions |

### Test Plan (~18 tests)

- createTemplateGalleryState extracts categories from templates
- setSearchQuery filters by name and tags
- selectCategory filters by category
- combined search + category filtering
- selectTemplate sets selected ID
- toggleFavorite adds/removes from favorites set
- getFilteredTemplates applies all filters
- getGroupedTemplates groups by category
- Empty search returns all templates
- Case-insensitive search

---

## Implementation Order

1. **UX-007** — Contextual Header Actions (viewer state machine additions)
2. **UX-008** — Inline Column Pinning (core state + grid utility integration)
3. **UX-009** — Saved Views UI (viewer state machine, builds on existing core)
4. **UX-010** — Dashboard Editor Unification (workspace state machine)
5. **UX-011** — Template Gallery Enhancement (workspace state machine)

Each follows: Tests (red) → Implementation (green) → Code Review → QA
