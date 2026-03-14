# UX-T3B2 Architecture Spec

## UX-019: Report Designer Shortcut Mode (workspace)

### Problem

Report/dashboard authoring requires many mouse interactions: clicking tabs, opening panels, selecting options. Power users want keyboard-driven sequences to accelerate common workflows without memorizing complex modifier combinations.

### Solution

A "shortcut mode" state machine activated by a trigger key (e.g., Space or a dedicated key when no text input is focused). Once active, the user types short letter sequences that map to authoring actions. A visual HUD shows available sequences. The mode auto-exits after action execution or timeout.

### Existing Infrastructure

- `keyboard-shortcuts.ts`: Single-key + modifier matching (18 actions), platform-aware
- `report-editor-state.ts`: 15+ report authoring transitions (column ops, filter ops, tab navigation)
- `dashboard-editor-state.ts`: 20+ dashboard transitions (widget CRUD, mode switching)
- `enhanced-config-state.ts`: Config panel navigation (5 sections)
- `canvas-toolbar-state.ts`: Canvas actions (zoom, snap, mode)

### State Machine Design

```typescript
export type ShortcutCategory =
  | 'column'
  | 'filter'
  | 'sort'
  | 'format'
  | 'panel'
  | 'view'
  | 'widget'
  | 'canvas';

export interface ShortcutSequence {
  keys: string; // e.g., 'ac' for "add column"
  action: string; // action identifier
  label: string; // human-readable label
  category: ShortcutCategory;
  editorScope: 'report' | 'dashboard' | 'both';
}

export interface ShortcutModeState {
  active: boolean;
  inputBuffer: string; // keys typed so far
  matchedSequences: ShortcutSequence[]; // sequences matching current buffer
  executedAction: string | null; // last executed action (for feedback)
  timeoutMs: number; // auto-dismiss timeout (default 3000)
  editorScope: 'report' | 'dashboard';
}
```

### Sequence Catalog

Organized by category, short memorable sequences:

- **Column**: `ac` (add column), `rc` (remove column), `tc` (toggle column visibility), `pc` (pin column)
- **Filter**: `af` (add filter), `rf` (remove filter)
- **Sort**: `sa` (sort ascending), `sd` (sort descending)
- **Format**: `cf` (conditional format), `dc` (set density compact), `dd` (set density comfortable)
- **Panel**: `p1`–`p6` (switch config panel tab by index)
- **View**: `tp` (toggle preview), `cb` (cycle breakpoint)
- **Widget**: `aw` (add widget), `dw` (duplicate widget), `rw` (remove widget)
- **Canvas**: `zi` (zoom in), `zo` (zoom out), `zr` (zoom reset), `gs` (toggle grid snap)

### Transitions

- `createShortcutModeState(editorScope)` — factory
- `activateShortcutMode(state)` — enter mode
- `deactivateShortcutMode(state)` — exit mode (clear buffer)
- `processKey(state, key)` — append to buffer, filter matches, auto-execute if single match
- `executeSequence(state, sequence)` — mark action executed, deactivate
- `resetBuffer(state)` — clear buffer without deactivating (timeout)
- `getMatchingSequences(state)` — query: sequences matching current buffer
- `isExactMatch(state)` — query: is buffer an exact sequence?

### Behavior

1. Activate → show HUD with all sequences for current editor scope
2. Type key → filter sequences to those starting with buffer
3. If exactly one match and buffer === keys → auto-execute
4. If no matches → deactivate (invalid sequence)
5. Timeout (3s) → reset buffer, stay active
6. Escape → deactivate

### File: `packages/workspace/src/authoring/shortcut-mode-state.ts`

### Test: `packages/workspace/src/authoring/__tests__/shortcut-mode-state.test.ts`

---

## UX-020: Row Detail Expansion in Viewer (viewer)

### Problem

When grids have many columns, users must scroll horizontally to see all values for a row. This is tedious and loses context.

### Solution

A row detail expansion state machine that lets users expand a row to see all field/value pairs in a vertical detail panel. Supports toggling, keyboard navigation between rows, and field search within the detail view.

### Existing Infrastructure

- `report-state.ts`: Manages rows as `unknown[][]` with `ReportColumnView[]` for metadata
- `RowId` type (string | number) in core
- Group expansion pattern: `expandedGroups: Set<string>` in core state
- No existing row detail infrastructure

### State Machine Design

```typescript
export interface RowDetailField {
  field: string;
  label: string;
  value: unknown;
  type?: string; // column type for formatting hints
}

export interface RowDetailState {
  expandedRowIndex: number | null; // currently expanded row (by index in current page)
  fields: RowDetailField[]; // computed field/value pairs for expanded row
  searchQuery: string; // filter fields within detail view
  pinnedFields: ReadonlySet<string>; // fields pinned to top of detail
  scrollToField: string | null; // scroll-to hint for component
}
```

### Design Decision: Index vs ID

The viewer's `ReportViewState` stores rows as `unknown[][]` without explicit IDs. Using row index (within current page) is simpler and avoids needing to extract IDs. Pagination changes reset expansion (intentional — different page, different context).

### Transitions

- `createRowDetailState()` — factory (no row expanded)
- `expandRowDetail(state, rowIndex, row, columns)` — expand a row, compute fields
- `collapseRowDetail(state)` — close detail panel
- `toggleRowDetail(state, rowIndex, row, columns)` — toggle expand/collapse
- `navigateToNextRow(state, rows, columns, totalRows)` — expand next row
- `navigateToPrevRow(state, rows, columns)` — expand previous row
- `setDetailSearch(state, query)` — filter fields in detail view
- `togglePinnedField(state, field)` — pin/unpin field to top
- `clearPinnedFields(state)` — reset pinned fields

### Queries

- `getVisibleDetailFields(state)` — fields matching search, pinned fields first
- `isRowExpanded(state, rowIndex)` — check if specific row is expanded
- `getExpandedRowIndex(state)` — get currently expanded row index

### Helpers

- `rowToDetailFields(row: unknown[], columns: { field: string; label: string; type?: string }[])` — convert 2D array row to field/value pairs

### Behavior

1. Click expand icon or press Enter on row → `expandRowDetail()`
2. Detail panel shows all field/value pairs vertically
3. Search box filters fields by name/label
4. Pin important fields to always show at top
5. Arrow keys navigate between rows (next/prev)
6. Escape or click collapse → `collapseRowDetail()`
7. Page change → auto-collapse (handled by existing pagination transitions)

### File: `packages/viewer/src/screens/row-detail-state.ts`

### Test: `packages/viewer/src/__tests__/row-detail-state.test.ts`
