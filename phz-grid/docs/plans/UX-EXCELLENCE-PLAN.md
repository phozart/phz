# UX Excellence Plan — "Data to Dashboard in 60 Seconds"

## Vision

Transform phz-workspace from a collection of functional components into a **cohesive authoring experience** where creating dashboards, reports, and grids feels as natural as Tableau's drag-and-drop meets AG Grid's power. Every interaction should be self-explanatory. Every action should take the minimum possible clicks.

**Target benchmark**: A first-time user uploads a CSV and has a publishable dashboard in under 60 seconds, without reading documentation.

---

## Multi-Hat Analysis

### Product Designer Hat
**Current state**: Components exist in isolation. Navigation works. Types are solid. But the *flow* between components is broken — there's no guided path from "I have data" to "I have a dashboard."

**Key principle**: **Progressive disclosure** — show the simplest path first, reveal power features on demand. Don't make users understand the type system to create a chart.

**Friction audit:**
1. Creating a dashboard requires knowing which panel to navigate to (BAD)
2. Adding a widget requires understanding widget types and field bindings (BAD)
3. Configuring a chart requires opening a separate config panel (BAD)
4. No preview of what you're building until you're done (BAD)
5. No undo at the dashboard level (BAD — explorer has it, dashboard doesn't)

### Innovator Hat (2026 differentiators)
1. **Schema-aware auto-suggestion** — already built (`analyzeSchema` + `matchTemplates`), just not wired to the UI
2. **AI-assisted field binding** — `suggestedMeasures` and `suggestedDimensions` from schema-analyzer
3. **Live morph** — change chart type and data bindings update automatically
4. **Natural language query** — "show me revenue by region" → auto-builds explore query (AI package exists)
5. **Adaptive layout** — container queries resize widgets intelligently (built, not connected)
6. **One-click template hydration** — pick template, auto-bind fields, done

### Business Analyst Hat
**User stories (must-have):**
- As a data analyst, I want to drag a field onto the canvas and see an appropriate chart appear instantly
- As a report author, I want to change a bar chart to a line chart without reconfiguring the data
- As a dashboard viewer, I want to click any data point and drill through to the detail
- As an admin, I want to right-click any artifact and see all available actions
- As a first-time user, I want the system to suggest what to build based on my data
- As a power user, I want keyboard shortcuts for everything (Cmd+Z undo, Cmd+S save, Cmd+D duplicate)

**Acceptance criteria:**
- Zero-click: opening a data source shows suggested dashboards immediately
- One-click: adding a widget from the "+" button with smart defaults
- Two-click: changing any widget's chart type
- Right-click: every element has a contextual action menu
- Drag: any field can be dragged to any widget or the canvas
- Undo: every action is undoable (Cmd+Z), including widget add/remove/move/resize

### Architect Hat
**What's already built and can be wired:**

| System | File | Status |
|--------|------|--------|
| Schema Analyzer | `templates/schema-analyzer.ts` | Built — profiles fields as measures/dimensions |
| Template Matcher | `templates/template-matcher.ts` | Built — scores 9 templates against schema |
| Chart Suggest | `explore/chart-suggest.ts` | Built — recommends chart type from dims/measures |
| Explore → Artifact | `explore/explore-to-artifact.ts` | Built — converts queries to reports/widgets |
| Dashboard Integration | `explore/explorer-dashboard-integration.ts` | Built — filter promotion, drill pre-population |
| Interaction Bus | `interaction-bus.ts` | Built — cross-filter, drill-through, navigate events |
| Layout Renderer | `layout/layout-renderer.ts` | Built — CSS Grid from LayoutNode tree |
| Reorder Utils | `layout/reorder-utils.ts` | Built — immutable widget move/reorder |
| Drag-Drop Utils | `engine-admin/drag-drop.ts` | Built — widget swap/move/recalculate |
| Undo Manager | `engine-admin/undo-manager.ts` | Built — generic undo/redo stack |
| Widget Registry | `registry/manifest-registry.ts` | Built — lazy-loadable manifests with config schemas |
| Filter Context | `filters/filter-context.ts` | Built — 4-level filter hierarchy |
| Auto-Save | `shell/auto-save-controller.ts` | Built — debounced save with dirty tracking |
| Keyboard Shortcuts | `shell/keyboard-shortcuts.ts` | Built — shortcut registry |
| SVG Icons | `styles/icons.ts` | Built — 65+ monochrome icons |

**What needs to be CREATED:**

| System | Purpose |
|--------|---------|
| Canvas Controller | Orchestrates dashboard canvas: widget CRUD, DnD, resize, selection |
| Context Menu System | Right-click menus for widgets, fields, artifacts, canvas |
| Widget Morph Engine | Change chart type while preserving data bindings |
| Quick Add Flow | "+" button → smart widget suggestion → one-click add |
| Template Hydrator | Apply template to real data: resolve `measure_1` → actual field names |
| Inline Editor | Click-to-edit for widget titles, axis labels, KPI targets |
| Field Drop Handler | Drag field from palette → drop on canvas → auto-create widget |
| Selection Manager | Multi-select widgets (shift+click), bulk actions |
| Resize Handler | Drag widget edges to resize, snap-to-grid |
| Dashboard Undo | Dashboard-level undo/redo wrapping all canvas operations |

### End User Hat
"I just uploaded my sales data. Now what?"

**Ideal flow:**
1. I see my data fields listed on the left
2. I see 3 suggested dashboard templates — one says "Time Series" with a preview thumbnail
3. I click it → a full dashboard appears with my actual data: 2 KPI cards (Revenue, Orders), a line chart (Revenue over time), a bar chart (Revenue by Region)
4. I don't like the bar chart. I right-click → "Change to Pie Chart". Done.
5. I want another KPI. I click "+", it suggests "Average Order Value" because that field isn't used yet. I click it → appears.
6. I drag the pie chart to the top. It moves with a smooth animation. Other widgets reflow.
7. I click the dashboard title "Untitled Dashboard" → it becomes editable → I type "Q1 Sales Overview"
8. Cmd+S → saved. It appears in the catalog.

### Data Analyst Hat
**Power features needed:**
- **Cross-filter click**: Click a bar segment → all other widgets filter to that value
- **Drill-through**: Click a data point → slide-out detail panel with filtered data
- **Calculated fields**: Right-click field palette → "Add Calculated Field" → expression builder
- **Pivot mode**: Switch any table widget to pivot view
- **Export**: Right-click widget → Export as CSV/PNG/PDF
- **SQL preview**: For DuckDB sources, show the generated SQL

### BI Expert / Looker Expert Hat
**Missing enterprise features:**
- **Explore-first workflow**: Start in explorer, build a query, then "Save as Dashboard Widget" — this bridge exists (`explore-to-artifact.ts`) but isn't exposed in the UI
- **Reusable metrics**: Define a metric once (e.g., "Revenue = SUM(amount)"), use it across dashboards — the engine has `MetricDefinition` but no UI to manage
- **Filter inheritance**: Global filters auto-apply to all widgets unless explicitly excluded — built in FilterContext but not wired to canvas
- **Parameterized views**: Viewer opens dashboard, picks a date range from header filter bar, all widgets update — built but not connected
- **Scheduled refresh**: Set a dashboard to auto-refresh every N minutes — `RefreshScheduler` exists

---

## Implementation Sprints

### Sprint Y — Canvas Controller & Core Interactions

**Goal**: The dashboard canvas becomes a real interactive surface where you can select, move, resize, and manage widgets.

#### Y.1 — Canvas Controller (core state machine)
**Create**: `packages/workspace/src/canvas/canvas-controller.ts`
- `CanvasController` class wrapping UndoManager for dashboard state
- State: `{ widgets: CanvasWidget[], selectedIds: Set<string>, hoveredId: string | null, gridColumns: number, clipboard: CanvasWidget[] }`
- `CanvasWidget`: extends DashboardWidgetArtifact with `{ isNew, isDirty, isSelected }`
- Methods: `addWidget()`, `removeWidget()`, `moveWidget()`, `resizeWidget()`, `duplicateWidget()`, `selectWidget()`, `selectAll()`, `clearSelection()`
- Every mutation pushes to UndoManager
- `subscribe()` for reactive updates
- Keyboard integration: Delete → remove selected, Cmd+D → duplicate, Cmd+A → select all, Cmd+Z/Y → undo/redo, Cmd+C/V → copy/paste
**Test**: `canvas-controller.test.ts` — all CRUD, selection, undo/redo, keyboard

#### Y.2 — Context Menu System
**Create**: `packages/workspace/src/canvas/context-menu.ts`
- `ContextMenuConfig`: `{ items: ContextMenuItem[], position: { x, y } }`
- `ContextMenuItem`: `{ id, label, icon: IconName, shortcut?, divider?, disabled?, submenu? }`
- `getWidgetContextMenu(widget)`: Change Type (submenu), Configure, Duplicate, Delete, ----, Export (submenu: CSV, PNG, PDF), Add Filter, Drill Through
- `getFieldContextMenu(field)`: Add to Dashboard (auto-create), Add to Filter Bar, View Distribution, Create Calculated Field
- `getCanvasContextMenu()`: Add Widget, Paste, Select All, ----, Undo, Redo
- `getArtifactContextMenu(artifact)`: Open, Duplicate, Rename, Share, ----, Export, Delete
- Pure functions returning menu configs — rendering is in the component layer
**Test**: `context-menu.test.ts` — menu generation for each context, submenu nesting, disabled state

#### Y.3 — Widget Morph Engine
**Create**: `packages/workspace/src/canvas/widget-morph.ts`
- `morphWidget(widget, newType)`: Change chart type while preserving compatible data bindings
- `getMorphOptions(currentType)`: Returns compatible types (bar→line→area→pie for category charts, kpi→gauge→scorecard for single-value)
- `MORPH_GROUPS`: `{ 'category-chart': ['bar-chart', 'line-chart', 'area-chart', 'pie-chart'], 'single-value': ['kpi-card', 'gauge', 'kpi-scorecard'], 'tabular': ['data-table', 'pivot-table'] }`
- `resolveBindings(oldType, newType, currentBindings)`: Maps old binding keys to new (e.g., bar's `category` → pie's `category`, bar's `value` → pie's `value`)
**Test**: `widget-morph.test.ts` — morph within group, cross-group rejection, binding preservation

#### Y.4 — Selection Manager
**Create**: `packages/workspace/src/canvas/selection-manager.ts`
- Single select (click), multi-select (Shift+click, Cmd+click)
- Rubber-band selection (click+drag on empty canvas area)
- `SelectionState`: `{ selected: string[], anchor: string | null, lastAction: 'single' | 'add' | 'remove' | 'range' }`
- Bulk actions on selection: Delete All, Align (horizontal/vertical), Distribute Evenly, Group
- Accessibility: Tab to navigate widgets, Space to toggle selection
**Test**: `selection-manager.test.ts` — single, multi, rubber-band, bulk operations

#### Y.5 — Resize Handler
**Create**: `packages/workspace/src/canvas/resize-handler.ts`
- `computeResize(widgetId, handle, delta, gridColumns, allWidgets)`: Returns new colSpan/rowSpan
- 8 resize handles: N, NE, E, SE, S, SW, W, NW
- Snap to grid (column boundaries)
- Minimum size constraints from widget manifest (`minWidth`, `minHeight`)
- Collision detection: prevent overlap with other widgets
- `ResizePreview`: `{ widgetId, newPosition, isValid, conflicts: string[] }`
**Test**: `resize-handler.test.ts` — snap-to-grid, min size, collision detection

### Sprint Z — Smart Flows (Data to Dashboard)

**Goal**: The "60-second dashboard" flow — from data source to published dashboard with minimum clicks.

#### Z.1 — Template Hydrator
**Create**: `packages/workspace/src/canvas/template-hydrator.ts`
- `hydrateTemplate(template, profile, schema)`: Takes a ScoredTemplate + FieldProfile, resolves abstract bindings to real field names
- Binding resolution: `measure_1` → `profile.suggestedMeasures[0]`, `date_field` → `profile.dateFields[0]`, `dimension_1` → `profile.suggestedDimensions[0]`
- Produces ready-to-render `CanvasWidget[]` with real data bindings
- Handles fallback: if template needs 3 measures but schema has 2, gracefully remove the 3rd widget
- Returns `HydrationResult`: `{ widgets, warnings, unmappedSlots }`
**Test**: `template-hydrator.test.ts` — full hydration, partial hydration, fallback

#### Z.2 — Quick Add Flow
**Create**: `packages/workspace/src/canvas/quick-add.ts`
- `suggestNextWidget(existingWidgets, profile, schema)`: Analyzes which fields are NOT yet used on the dashboard, suggests the best next widget
- Suggestion types: "Add KPI for [unused measure]", "Add chart showing [unused dimension] vs [measure]", "Add time trend for [date field]"
- Returns `QuickAddSuggestion[]`: `{ widgetType, label, description, icon, bindings, priority }`
- Max 5 suggestions, sorted by relevance
- "Add blank [type]" always available at bottom
**Test**: `quick-add.test.ts` — suggestions exclude used fields, priority ordering, blank fallback

#### Z.3 — Field Drop Handler
**Create**: `packages/workspace/src/canvas/field-drop-handler.ts`
- `handleFieldDrop(field, dropTarget, existingWidgets, gridColumns)`: Determines what to create when a field is dropped
- Drop on empty canvas → create appropriate widget (number → KPI, date+number → line, category → bar)
- Drop on existing widget → add field to widget's data bindings (e.g., drop second measure → dual-axis)
- Drop on "add zone" (dashed border area) → create widget at that position
- Uses `suggestChartType` from explore/chart-suggest for auto-detection
- Returns `FieldDropResult`: `{ action: 'create' | 'augment', widget, position }`
**Test**: `field-drop-handler.test.ts` — drop types, auto-widget-type, augment existing

#### Z.4 — Inline Editor
**Create**: `packages/workspace/src/canvas/inline-editor.ts`
- `InlineEditTarget`: `{ type: 'title' | 'subtitle' | 'axis-label' | 'kpi-target' | 'metric-name', widgetId, currentValue }`
- `resolveEditableFields(widget)`: Returns all inline-editable fields for a widget type
- KPI: title, value field, target value, comparison label
- Chart: title, x-axis label, y-axis label
- Table: title, column headers (rename)
- `applyInlineEdit(widget, target, newValue)`: Returns new widget config with edit applied
**Test**: `inline-editor.test.ts` — editable fields per widget type, value application

#### Z.5 — Dashboard Onboarding Flow
**Create**: `packages/workspace/src/canvas/onboarding-flow.ts`
- `getOnboardingStep(state)`: Determines what the user should see based on current dashboard state
- Step 1 (no data source): "Connect your data" — show data source picker
- Step 2 (data source, no widgets): "Pick a template or start blank" — show template cards with live previews
- Step 3 (has widgets, never saved): Floating "Save" prompt
- Step 4 (saved, not shared): "Share" prompt in header
- `OnboardingStep`: `{ id, title, description, action, dismissible }`
- Dismissible — once a step is completed or dismissed, it doesn't come back
**Test**: `onboarding-flow.test.ts` — step progression, dismissal, state transitions

### Sprint AA — Artifact Lifecycle & Polish

**Goal**: Complete the artifact lifecycle (create → edit → save → share → manage) and add polish interactions.

#### AA.1 — Artifact Create Flow
**Create**: `packages/workspace/src/canvas/artifact-create.ts`
- Unified creation for all artifact types: Dashboard, Report, Grid, KPI
- `createArtifactConfig(type, dataSourceId, profile?)`: Returns initial config with smart defaults
- Dashboard: auto-select template based on schema, create with 1-click
- Report: auto-populate columns from schema, suggest grouping
- Grid: auto-infer columns with types, set reasonable defaults
- KPI: auto-pick the most likely measure, suggest threshold
- Returns `CreateResult`: `{ artifact, suggestedName, warnings }`
**Test**: `artifact-create.test.ts` — creation for each type, smart defaults, name suggestion

#### AA.2 — Drag-and-Drop Canvas Component Logic
**Create**: `packages/workspace/src/canvas/canvas-dnd.ts`
- `CanvasDndState`: `{ dragSource, dragTarget, dragPreview, isOverCanvas }`
- `computeDropPosition(clientX, clientY, canvasRect, gridColumns, gridRows)`: Converts pixel position to grid cell
- `computeInsertionPoint(widgets, dropPosition)`: Finds the best insertion point (between, before, after)
- `computeDragPreview(widget, position)`: Returns preview dimensions and snap position
- `validateDrop(source, target, widgets)`: Checks if drop is valid (no self-drop, no overlap)
- `applyDrop(widgets, source, target)`: Returns new widget array with applied drop
**Test**: `canvas-dnd.test.ts` — position computation, insertion point, snap, validation

#### AA.3 — Dashboard Save & Publish
**Create**: `packages/workspace/src/canvas/save-publish.ts`
- `prepareSavePayload(canvasState, metadata)`: Converts canvas state to a DashboardConfig for persistence
- `validateBeforePublish(dashboard)`: Checks: has title, has at least 1 widget, all widgets have data, no orphaned filters
- `PublishValidation`: `{ isValid, errors, warnings }`
- Warnings: "Widget 'KPI 3' has no data binding", "Filter 'Region' is not connected to any widget"
- Auto-name suggestion from data source + template type
**Test**: `save-publish.test.ts` — payload generation, validation rules, auto-name

#### AA.4 — Global Keyboard Shortcuts
**Modify**: `packages/workspace/src/shell/keyboard-shortcuts.ts`
- Add dashboard-context shortcuts:
  - `Cmd+N`: New dashboard
  - `Cmd+S`: Save
  - `Cmd+Z`: Undo
  - `Cmd+Shift+Z` / `Cmd+Y`: Redo
  - `Cmd+D`: Duplicate selected widget(s)
  - `Cmd+A`: Select all widgets
  - `Delete` / `Backspace`: Remove selected
  - `Cmd+C` / `Cmd+V`: Copy/paste widgets
  - `Escape`: Deselect all / close panel
  - `Tab`: Navigate between widgets
  - `Enter`: Open widget config
  - `F2`: Inline rename
  - `/`: Open command palette (future)
**Test**: `keyboard-dashboard.test.ts` — shortcut mapping, context awareness

#### AA.5 — Cross-Filter & Drill-Through UX
**Create**: `packages/workspace/src/canvas/cross-filter-ux.ts`
- `applyCrossFilter(sourceWidget, clickedValue, allWidgets)`: Computes which widgets should filter and how
- Visual feedback: filtered widgets get subtle blue border, source widget shows "filtering" badge
- Click same value again → clear filter
- Click different value → replace filter
- "Clear all filters" button appears when any cross-filter is active
- `CrossFilterState`: `{ sourceWidgetId, field, value, affectedWidgets: string[] }`
**Test**: `cross-filter-ux.test.ts` — apply, clear, replace, affected widget computation

#### AA.6 — Catalog Artifact Actions
**Modify**: `packages/workspace/src/catalog/catalog-actions.ts`
- `getCatalogActions(artifact, role)`: Returns available actions based on artifact type and user role
- Admin: Open, Edit, Duplicate, Rename, Share, Publish, Set Alert, Export, Delete
- Author: Open, Edit, Duplicate, Rename, Export
- Viewer: Open, Duplicate to My Work, Export
- Each action: `{ id, label, icon, shortcut?, danger?, handler }`
**Test**: `catalog-actions.test.ts` — role-based filtering, danger flags

---

## Interaction Patterns Summary

| Interaction | Target | Result |
|------------|--------|--------|
| **Click** field in palette | Canvas | Auto-create appropriate widget |
| **Drag** field to canvas | Canvas | Create widget at drop position |
| **Drag** field to widget | Widget | Add field to widget bindings |
| **Right-click** widget | Context menu | Change Type, Configure, Duplicate, Delete, Export |
| **Right-click** canvas | Context menu | Add Widget, Paste, Select All, Undo/Redo |
| **Right-click** artifact | Context menu | Open, Rename, Share, Publish, Export, Delete |
| **Double-click** widget title | Inline edit | Title becomes editable |
| **Click** chart segment | Cross-filter | All widgets filter to that value |
| **Shift+click** widgets | Multi-select | Add to selection |
| **Drag** widget edge | Resize | Snap-to-grid resize |
| **Drag** widget body | Move | Reorder with animation |
| **Cmd+Z** | Undo | Revert last canvas action |
| **Delete** | Remove | Delete selected widget(s) |
| **Cmd+D** | Duplicate | Clone selected widget(s) |
| **Cmd+S** | Save | Save dashboard |
| **Cmd+N** | New | Create new dashboard |
| **Tab** | Navigate | Move focus between widgets |
| **F2** | Rename | Inline rename of focused element |
| **+** button | Quick Add | Smart widget suggestions |

---

## File Summary

**New files**: ~16 source + ~16 test = ~32 files
**Modified files**: ~5 existing files (keyboard-shortcuts, catalog actions)
**All in**: `packages/workspace/src/canvas/` (new directory) + modifications

## Sprint Dependencies

```
Sprint Y (Canvas Controller + Core Interactions) ──┐
                                                     ├── Sprint AA (Lifecycle + Polish)
Sprint Z (Smart Flows — Data to Dashboard) ─────────┘
```

- Y and Z are **independent** — can run in parallel
- AA depends on both Y and Z (it wires them together)

## Success Metrics

1. **60-second test**: Upload CSV → published dashboard in < 60 seconds
2. **Click count**: Creating a basic dashboard ≤ 5 clicks
3. **Discoverability**: Every action available via right-click OR keyboard shortcut
4. **Undo coverage**: 100% of canvas operations are undoable
5. **Zero documentation**: First-time user can create a dashboard without docs
6. **Cross-filter**: Click any data point → all widgets respond within 100ms
7. **Morph**: Change chart type without losing data bindings
8. **Mobile**: All core interactions work on tablet (tap = click, long-press = right-click)
