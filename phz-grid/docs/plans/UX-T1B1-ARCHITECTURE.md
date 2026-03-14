# T1-B1 Architecture Specification

**Batch**: Tier 1, Batch 1 (UX-001 through UX-005)
**Date**: 2026-03-13
**Status**: APPROVED

---

## UX-001: Command Palette (Cmd+K)

### Overview

Global search/command palette accessible via Cmd+K (Mac) / Ctrl+K (Windows) in both viewer and workspace shells. Allows users to search artifacts, navigate screens, and execute actions without knowing menu locations.

### Architecture

**Pattern**: Headless state machine + Lit component (follows ADR-001)

**New Files**:

- `packages/viewer/src/screens/command-palette-state.ts` — Headless state machine
- `packages/viewer/src/__tests__/command-palette-state.test.ts` — State tests

**Modified Files**:

- `packages/viewer/src/components/phz-viewer-shell.ts` — Add keyboard listener + command palette rendering
- `packages/viewer/src/index.ts` — Export new state machine

### State Machine

```typescript
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'artifact' | 'action';
  icon?: string;
  keywords?: string[];
}

interface CommandPaletteState {
  open: boolean;
  query: string;
  items: CommandItem[];
  filteredItems: CommandItem[];
  selectedIndex: number;
}
```

### Keyboard Handling

- `Cmd+K` / `Ctrl+K`: Toggle palette open/close
- `Escape`: Close palette
- `ArrowUp/Down`: Navigate items
- `Enter`: Execute selected item
- Keyboard listener attached in shell `connectedCallback()`, removed in `disconnectedCallback()`

### Rendering

- Overlay rendered in shell shadow DOM
- Position: centered, top third of viewport (like VS Code)
- z-index: 1000 (above all other overlays)
- Search input auto-focused when opened
- Items grouped by category with section headers

### Accessibility

- `role="combobox"` on search input
- `role="listbox"` on results list
- `aria-activedescendant` for keyboard navigation
- `aria-expanded` tracks open state

---

## UX-002: Recent Items & Favorites Persistence

### Overview

Track recently viewed artifacts and persist favorites across sessions using PersistenceAdapter or localStorage fallback.

### Architecture

**Pattern**: Extend existing catalog state machine (immutable state + pure functions)

**Modified Files**:

- `packages/viewer/src/screens/catalog-state.ts` — Add recentItems field + reducers
- `packages/viewer/src/__tests__/catalog-state.test.ts` — Add tests for recent items
- `packages/viewer/src/components/phz-viewer-catalog.ts` — Render "Recent" section

### State Extension

```typescript
interface CatalogState {
  // ... existing fields ...
  recentItems: Array<{ id: string; timestamp: number }>; // NEW — max 10, ordered by recency
}
```

### New Functions

```typescript
function addRecentItem(state: CatalogState, artifactId: string): CatalogState;
function getRecentArtifacts(state: CatalogState): VisibilityMeta[];
function loadPersistedFavorites(state: CatalogState, ids: string[]): CatalogState;
function loadPersistedRecents(
  state: CatalogState,
  items: Array<{ id: string; timestamp: number }>,
): CatalogState;
```

### Persistence Strategy

- On `addRecentItem`: emit event `catalog-recents-changed` with data for parent to persist
- On `toggleFavorite`: emit event `catalog-favorites-changed` with data for parent to persist
- Storage: consumer's PersistenceAdapter (optional), or localStorage key `phz-viewer-recents` / `phz-viewer-favorites`

---

## UX-003: Summary/Totals Row

### Overview

Optional footer row showing aggregated values (sum/avg/count) per numeric column in the grid component.

### Architecture

**Pattern**: New property on PhzGrid component + AggregationController extension

**New Files**:

- `packages/grid/src/__tests__/summary-row.test.ts` — Tests for summary row computation and rendering

**Modified Files**:

- `packages/grid/src/controllers/aggregation.controller.ts` — Add `computeSummaryRow()` method
- `packages/grid/src/components/phz-grid.ts` — Add `showSummary` property, render summary `<tfoot>`
- `packages/grid/src/components/phz-grid.styles.ts` — Add summary row CSS
- `packages/grid/src/components/phz-grid.templates.ts` — Add `renderSummaryRow()` template function

### Properties

```typescript
// On PhzGrid component:
@property({ type: Boolean, attribute: 'show-summary' })
showSummary = false;

@property({ type: String, attribute: 'summary-function' })
summaryFunction: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum';
```

### Summary Row Computation

- Reuse `AggregationController.computeColumnAgg()` for each visible numeric column
- Non-numeric columns show empty cell or count
- Computed on `filteredRows` (respects active filters)
- Recalculated on data change, filter change, or function change

### CSS Tokens

```css
--phz-summary-bg: var(--phz-bg-surface);
--phz-summary-text: var(--phz-text-primary);
--phz-summary-font-weight: 600;
--phz-summary-border-top: 2px solid var(--phz-border-default);
```

### Rendering

- `<tfoot>` element after `<tbody>` (not `<thead>`)
- Sticky at bottom if virtual scrolling enabled
- First cell shows function label ("Sum", "Average", etc.)
- Formatted using same column formatters as data cells

---

## UX-004: Multi-Column Sort in Viewer

### Overview

Expose multi-column sort in the viewer report view. The grid core already supports this — the viewer just needs to wire it up.

### Architecture

**Pattern**: Extend report state machine with sort array

**Modified Files**:

- `packages/viewer/src/screens/report-state.ts` — Replace `sort: ReportSort | null` with `sortColumns: ReportSort[]`
- `packages/viewer/src/__tests__/report-state.test.ts` — Update sort tests
- `packages/viewer/src/components/phz-viewer-report.ts` — Update sort UI rendering
- `packages/viewer/src/index.ts` — Export new functions

### State Change

```typescript
// BEFORE:
sort: ReportSort | null;

// AFTER:
sortColumns: ReportSort[];
```

### New/Modified Functions

```typescript
// Replace toggleReportSort with multi-sort aware version:
function toggleReportSort(
  state: ReportViewState,
  field: string,
  addToMulti?: boolean,
): ReportViewState;
// addToMulti=true: Ctrl+click behavior (add/toggle in array)
// addToMulti=false (default): replace entire sort with single column

// New functions:
function addSortColumn(
  state: ReportViewState,
  field: string,
  direction: 'asc' | 'desc',
): ReportViewState;
function removeSortColumn(state: ReportViewState, field: string): ReportViewState;
function clearAllSorts(state: ReportViewState): ReportViewState;
function getSortIndex(state: ReportViewState, field: string): number; // -1 if not sorted
```

### Backward Compatibility

- `setReportSort()` still works (sets single sort, clears others)
- `toggleReportSort(state, field)` without `addToMulti` works as before (single sort)
- New `addToMulti` parameter is opt-in

### UI Indicators

- Sorted columns show direction arrow + priority number badge (1, 2, 3...)
- Badge is small superscript next to arrow: "↑¹", "↓²"
- Rendered via `data-sort-index` attribute on `<th>`

---

## UX-005: Cell Tooltip on Truncation

### Overview

Show tooltip with full cell content when hovering over a truncated cell.

### Architecture

**Pattern**: New ReactiveController (follows toast.controller.ts, context-menu.controller.ts patterns)

**New Files**:

- `packages/grid/src/controllers/tooltip.controller.ts` — ReactiveController for cell tooltips
- `packages/grid/src/__tests__/tooltip-controller.test.ts` — Tests

**Modified Files**:

- `packages/grid/src/components/phz-grid.ts` — Add controller + properties
- `packages/grid/src/components/phz-grid.styles.ts` — Add tooltip CSS

### Controller Design

```typescript
interface TooltipHost extends ReactiveControllerHost {
  enableCellTooltips: boolean;
  tooltipDelay: number;
  renderRoot: ShadowRoot;
}

class TooltipController implements ReactiveController {
  private host: TooltipHost;
  private showTimer: number | null;
  private tooltipEl: HTMLDivElement | null;

  hostConnected(): void; // attach mouseenter/mouseleave on renderRoot
  hostDisconnected(): void; // cleanup

  private handleMouseEnter(e: MouseEvent): void;
  private handleMouseLeave(): void;
  private showTooltip(cell: HTMLElement): void;
  private hideTooltip(): void;
  private isTruncated(el: HTMLElement): boolean; // scrollWidth > offsetWidth
  private positionTooltip(target: HTMLElement): void;
}
```

### Properties

```typescript
@property({ type: Boolean, attribute: 'enable-cell-tooltips' })
enableCellTooltips = true;

@property({ type: Number, attribute: 'tooltip-delay' })
tooltipDelay = 300;
```

### Truncation Detection

```typescript
private isTruncated(el: HTMLElement): boolean {
  return el.scrollWidth > el.offsetWidth || el.scrollHeight > el.offsetHeight;
}
```

### Tooltip Element

- Created dynamically as `<div>` in shadow root
- Positioned via `position: fixed` with viewport-aware placement
- Max width: 400px, max height: 200px
- Uses grid's CSS tokens for colors

### CSS

```css
.phz-cell-tooltip {
  position: fixed;
  z-index: var(--phz-tooltip-z-index, 100);
  background: var(--phz-tooltip-bg, #1f2937);
  color: var(--phz-tooltip-text, #ffffff);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 400px;
  word-wrap: break-word;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

### Event Handling

- `mouseenter` on `.phz-data-cell` elements (delegated from shadow root)
- `mouseleave` hides after 50ms delay
- `scroll` on grid container hides immediately
- No tooltip if cell is being edited

---

## Build Order

1. `packages/grid` — UX-003 (summary row), UX-005 (tooltip)
2. `packages/viewer` — UX-001 (command palette), UX-002 (recents), UX-004 (multi-sort)
3. Full test suite verification

## Test Strategy

Each item has dedicated test file(s):

- State machine tests: pure function testing (no DOM required)
- Controller tests: mock host, verify behavior
- All tests use Vitest with `environment: 'node'`
