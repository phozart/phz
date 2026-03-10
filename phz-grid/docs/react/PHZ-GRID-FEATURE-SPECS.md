# phz-grid Feature Implementation Specifications

> Detailed feature-by-feature specs extracted from the phz-grid codebase.
> Each section is self-contained with data models, interactions, CSS, and a
> Claude Code implementation prompt.

---

## Table of Contents

1. [Cell Selection](#1-cell-selection)
2. [Row Selection](#2-row-selection)
3. [Right-Click Context Menu & Copy Operations](#3-right-click-context-menu--copy-operations)
4. [Export to CSV & Excel](#4-export-to-csv--excel)
5. [Text Wrapping in Headers](#5-text-wrapping-in-headers)
6. [Multi-Row Column Headers (Column Groups)](#6-multi-row-column-headers-column-groups)
7. [Column Management (Reorder, Hide/Show, Chooser)](#7-column-management-reorder-hideshow-chooser)
8. [Multi-Column Sorting](#8-multi-column-sorting)
9. [Filters Per Type with Conditional Logic](#9-filters-per-type-with-conditional-logic)

---

## 1. Cell Selection

### Overview

Excel-like rectangular cell range selection. Users can click-drag across cells
to create a highlighted rectangular range. The selection must NOT interfere
with clickable links inside cell values.

### Data Model

```typescript
// Internal component state (NOT in the core data model — visual only)
interface CellRangeState {
  anchor: { rowIndex: number; colIndex: number } | null; // Starting cell
  end: { rowIndex: number; colIndex: number } | null;    // Current end cell
  isDragging: boolean;                                    // Mouse drag in progress
}

// Core state model (for API consumers)
interface SelectionState {
  mode: 'none' | 'single' | 'multi' | 'range';
  selectedRows: Set<string>;          // Row-level selections
  selectedCells: Set<string>;         // Cell-level selections as "rowId:field"
  anchorCell?: { rowId: string; field: string };
}
```

### Mouse Interactions

| Action | Behavior |
|--------|----------|
| **Click on cell** | Set anchor = end = clicked cell. Start new range (1x1). |
| **Click + drag** | Set anchor on mousedown. Update end on mousemove. Rectangle grows. |
| **Shift + Click** | Keep existing anchor. Set end = clicked cell. Extends range. |
| **Right-click** | Do NOT alter selection. Show context menu instead. |

### Keyboard Interactions

| Key | Behavior |
|-----|----------|
| **Arrow keys** | Move focus (roving tabindex). No selection change. |
| **Shift + Arrow** | Extend range from anchor in that direction. |
| **Ctrl+C / Cmd+C** | Copy current range to clipboard. |
| **Escape** | Clear range (anchor = end = null). |
| **Ctrl+A** | Select all rows (not cell range — switches to row selection). |

### Range Calculation

```typescript
function isCellInRange(
  rowIdx: number, colIdx: number,
  anchor: { rowIndex: number; colIndex: number },
  end: { rowIndex: number; colIndex: number },
): boolean {
  const minRow = Math.min(anchor.rowIndex, end.rowIndex);
  const maxRow = Math.max(anchor.rowIndex, end.rowIndex);
  const minCol = Math.min(anchor.colIndex, end.colIndex);
  const maxCol = Math.max(anchor.colIndex, end.colIndex);
  return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
}

function getCellRangeCount(anchor, end): number {
  const rows = Math.abs(end.rowIndex - anchor.rowIndex) + 1;
  const cols = Math.abs(end.colIndex - anchor.colIndex) + 1;
  return rows * cols;
}
```

### Avoiding Link Interference

Cells with `type: 'link'` render a native `<a href="..." target="_blank">` tag.
The link click is handled by the browser natively before the cell's mousedown
handler fires. Key design rules:

1. Render links as native `<a>` elements (not `<span>` with click handlers).
2. The cell `mousedown` handler only fires on the `<td>` itself, not on nested
   interactive elements.
3. Validate link safety: only allow `http:`, `https:`, `mailto:`, `tel:` protocols.
4. Unsafe URLs render as plain text (no `<a>` tag).

### CSS

```css
/* Cell in selection range */
.data-cell--in-range {
  background: rgba(59, 130, 246, 0.1) !important;
  outline: 1px solid rgba(59, 130, 246, 0.3);
  outline-offset: -1px;
}

/* Focused cell (keyboard) */
.data-cell:focus-visible {
  outline: 2px solid var(--focus-ring-color, #3B82F6);
  outline-offset: -2px;
}
```

### Event Handlers on `<td>`

```html
<td
  class="data-cell ${inRange ? 'data-cell--in-range' : ''}"
  @mousedown="${(e) => handleCellMouseDown(e, rowIdx, colIdx)}"
  @mousemove="${(e) => handleCellMouseMove(e, rowIdx, colIdx)}"
  @mouseup="${() => handleCellMouseUp()}"
>
```

### Events Emitted

```typescript
interface SelectionChangeEvent {
  type: 'selection:change';
  selectedRows: string[];
  selectedCells: { rowId: string; field: string }[];
  delta: {
    addedRows: string[];
    removedRows: string[];
    addedCells: { rowId: string; field: string }[];
    removedCells: { rowId: string; field: string }[];
  };
}
```

### Claude Code Prompt

```
Implement Excel-like cell range selection on the data grid.

Requirements:
1. Track selection state as anchor/end cell positions (rowIndex, colIndex).
2. On mousedown (left button only, not during edit mode): set anchor = end = clicked cell, set isDragging = true. If Shift is held and anchor exists, only update end.
3. On mousemove while isDragging: update end to hovered cell.
4. On mouseup: set isDragging = false.
5. Shift+Arrow keys extend the range from anchor.
6. Escape clears the range.
7. Apply CSS class "data-cell--in-range" to all cells where isCellInRange() returns true. Use rgba(59,130,246,0.1) background and 1px solid rgba(59,130,246,0.3) outline.
8. Link columns render as native <a> tags with target="_blank" and rel="noopener noreferrer". Only allow http/https/mailto/tel protocols. Unsafe URLs render as plain text.
9. The mousedown handler must check e.button !== 0 to ignore right-clicks.
10. Emit a "selection-change" custom event whenever the range changes, including delta of added/removed cells.
11. Show a floating selection action bar when cells are selected showing "N cells selected" with Copy and Clear buttons.
```

---

## 2. Row Selection

### Overview

Full-row selection with single-select, multi-select, and optional checkbox
column. Uses a `Set<RowId>` for O(1) lookups.

### Data Model

```typescript
type SelectionMode = 'none' | 'single' | 'multi' | 'range';
type RowId = string | number;

interface SelectionState {
  mode: SelectionMode;
  selectedRows: Set<RowId>;
  selectedCells: Set<string>;      // "rowId:field" format
  anchorCell?: CellPosition;
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selectionMode` | `'none' \| 'single' \| 'multi'` | `'single'` | Row selection mode |
| `showSelectionColumn` | `boolean` | `false` | Show checkbox column |
| `showSelectionActions` | `boolean` | `true` | Show floating action bar on selection |

### Mouse Interactions

**Single mode (`selectionMode === 'single'`):**

| Action | Behavior |
|--------|----------|
| Click row | If already selected → deselect. Otherwise → deselect all, select this row. |

**Multi mode (`selectionMode === 'multi'`):**

| Action | Behavior |
|--------|----------|
| Click row | Deselect all, select this row only. |
| Ctrl/Cmd + Click | Toggle this row (add to / remove from selection). |
| Checkbox click | Toggle this row (always additive, no deselect-all). |

### Keyboard Interactions

| Key | Behavior |
|-----|----------|
| Space | Toggle selection of the focused row |
| Ctrl+A / Cmd+A | Select all rows |
| Escape | Deselect all |

### Checkbox Column

When `showSelectionColumn` is true, render a leading column with:

**Header checkbox:**
- All selected → filled checkmark
- Some selected → minus/dash (indeterminate, `aria-checked="mixed"`)
- None selected → empty box
- Click: toggle between selectAll / deselectAll

**Row checkbox:**
- Selected → filled checkmark
- Not selected → empty box
- Click: toggle this row (stopPropagation to avoid row click handler)
- `role="checkbox"`, `aria-checked="${isSelected}"`

### CSS

```css
.data-row--selected {
  background: #EFF6FF !important;
}
.data-row--selected:hover {
  background: #EFF6FF !important;
}
```

### API Methods

```typescript
interface GridApi {
  select(rowIds: RowId | RowId[]): void;     // Add to selection
  deselect(rowIds: RowId | RowId[]): void;   // Remove from selection
  selectAll(): void;                          // Select all data rows
  deselectAll(): void;                        // Clear all row + cell selections
  getSelection(): { rows: RowId[]; cells: CellPosition[] };
  selectRange(start: CellPosition, end: CellPosition): void;  // Range by position
}
```

### Hooks

```typescript
// Before selection — can cancel by returning false
hooks.beforeSelect(rowIds: RowId[]): RowId[] | false;
hooks.afterSelect(selectedRows: RowId[]): void;
```

### Claude Code Prompt

```
Implement full-row selection on the data grid.

Requirements:
1. Accept a selectionMode prop: 'none' | 'single' | 'multi' (default: 'single').
2. Track selected rows in a Set<string> for O(1) lookups.
3. Single mode: click row deselects all then selects clicked row. Click again deselects.
4. Multi mode: plain click deselects all then selects row. Ctrl/Cmd+click toggles individual row without deselecting others.
5. Optional checkbox column (showSelectionColumn prop): render a leading <td> with a checkbox button. Header checkbox shows checkmark (all), dash (some), or empty (none). Row checkbox toggles individual row. Use role="checkbox" and aria-checked.
6. Apply CSS class "data-row--selected" with background #EFF6FF.
7. Space bar toggles focused row. Ctrl+A selects all. Escape deselects all.
8. Emit "selection-change" event with {selectedRows, delta: {addedRows, removedRows}}.
9. Expose API methods: select(), deselect(), selectAll(), deselectAll(), getSelection().
10. Support beforeSelect hook that can cancel selection by returning false.
11. Row selection and cell range selection are independent systems — clearing one does NOT clear the other, except deselectAll() clears both.
```

---

## 3. Right-Click Context Menu & Copy Operations

### Overview

Two context menus: one for column headers, one for data rows. Both use a
shared context menu component. Copy operations produce tab-separated values
(TSV) for pasting into Excel/Sheets.

### Context Menu Component

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon?: string;          // Unicode character or emoji
  shortcut?: string;      // Display text like "Ctrl+C"
  disabled?: boolean;
  separator?: boolean;    // Render as a divider line
  checked?: boolean;      // Show checkmark (toggle items)
  variant?: 'default' | 'danger';  // 'danger' = red text
}
```

**Component behavior:**
- Fixed positioning at (x, y) coordinates
- Smart viewport clamping (repositions if near edge)
- Arrow keys navigate up/down
- Enter/Space selects item
- Escape closes menu
- Click outside closes menu (use `composedPath()` for Shadow DOM)

### Body Context Menu Items (Right-Click on Data Cell)

Items are grouped with separators between sections:

```
── Copy ──────────────────────────────────
  Copy Cell Value              Ctrl+C
  Copy Row

── Copy Range (shown only if cell range active) ──
  Copy Selection (N cells)
  Copy Selection with Headers

── Copy Rows (shown only if rows selected) ──
  Copy Selected Rows (N)
  Copy Selected with Headers

── Selection ─────────────────────────────
  Select Row                   ✓
  Select All Rows              Ctrl+A

── Export ────────────────────────────────
  Export to CSV                ⬇
  Export to Excel              ⬇

── Row Actions (shown if custom actions configured) ──
  Edit
  Delete
  [Custom actions...]
```

### Header Context Menu Items (Right-Click on Column Header)

```
── Sort ──────────────────────────────────
  Sort Ascending               ↑  (checked if active)
  Sort Descending              ↓  (checked if active)
  Clear Sort                   ✕  (disabled if no sort)

── Filter ────────────────────────────────
  Filter...                    ⊽
  Clear Filter                 ✕  (disabled if no filter)

── Column ────────────────────────────────
  Hide Column                  ⊖
  Resize to Fit                ↔

── Grouping ──────────────────────────────
  Group by This Column         ≡
  Remove Grouping              ✕  (disabled if not grouped)

── Utilities ─────────────────────────────
  Column Chooser...            ⚙
  Export to CSV                ⬇
  Export to Excel              ⬇
```

### Copy Engine

```typescript
interface CopyOptions {
  includeHeaders: boolean;
  formatted: boolean;          // Apply type-specific formatting
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, {
    decimals?: number;
    display?: 'currency' | 'percent';
    prefix?: string;
    suffix?: string;
  }>;
  maxCopyRows?: number;        // 0 = unlimited
  excludeFields?: Set<string>;
  maskFields?: Map<string, (value: unknown) => string>;
}

// Output format: tab-separated values (TSV)
function buildCopyText(
  rows: RowData[],
  columns: ColumnDefinition[],
  options: CopyOptions,
): { text: string; rowCount: number; colCount: number }
```

**Cell value formatting for copy:**

| Column Type | Formatted | Unformatted |
|-------------|-----------|-------------|
| string | As-is | As-is |
| number | `toLocaleString()` | `String(value)` |
| boolean | "Yes" / "No" | "true" / "false" |
| date | `formatDate(value, pattern)` | `String(value)` |
| bar | "75%" (clamped 0-100) | `String(value)` |
| status | As-is | As-is |
| null/undefined | "" (empty) | "" |

**Clipboard write:**

```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: create textarea, execCommand('copy')
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}
```

### Copy Operations Logic

1. **Copy Cell Value**: Copy the single right-clicked cell's formatted value.
2. **Copy Row**: Copy all column values for the right-clicked row (tab-separated, one line).
3. **Copy Selection (N cells)**: Copy the cell range rectangle as TSV (no headers).
4. **Copy Selection with Headers**: Same as above but prepend a header row.
5. **Copy Selected Rows (N)**: Copy ALL columns for every selected row as TSV.
6. **Copy Selected with Headers**: Same as above but prepend a header row.

**Priority when Ctrl+C is pressed:**
1. If cell range active → copy cell range
2. Else if rows selected → copy selected rows
3. Else → copy single focused cell

### Selection Action Bar

A floating bar appears when rows or cells are selected:

```
┌──────────────────────────────────────────────────┐
│ 12 cells selected  [Copy Cells] [+ Headers] [Clear] │
│ — or —                                               │
│ 5 rows selected  [Copy Rows] [+ Headers] [Clear]     │
└──────────────────────────────────────────────────┘
```

### Claude Code Prompt

```
Implement a right-click context menu and clipboard copy system for the data grid.

Requirements:

CONTEXT MENU COMPONENT:
1. Create a reusable context menu component that accepts MenuItem[] with: id, label, icon (unicode), shortcut, disabled, separator, checked, variant ('default'|'danger').
2. Position at (x, y) with viewport clamping — adjust if menu would overflow screen edges.
3. Keyboard: ArrowUp/Down to navigate, Enter/Space to select, Escape to close.
4. Click outside closes (use composedPath() for shadow DOM compatibility).

BODY CONTEXT MENU (right-click on data cell):
5. Extract the clicked cell's field name from the closest <td> data attribute.
6. Show these grouped items with separators:
   - Group 1 "Copy": Copy Cell Value (Ctrl+C shortcut display), Copy Row
   - Group 2 "Copy Range" (only if cell range active): Copy Selection (N cells), Copy Selection with Headers
   - Group 3 "Copy Rows" (only if rows selected): Copy Selected Rows (N), Copy Selected with Headers
   - Group 4 "Selection": Select Row, Select All Rows (Ctrl+A)
   - Group 5 "Export": Export to CSV, Export to Excel

HEADER CONTEXT MENU (right-click on column header):
7. Show: Sort Ascending (checked if active), Sort Descending (checked if active), Clear Sort | Filter..., Clear Filter | Hide Column, Resize to Fit | Column Chooser, Export CSV, Export Excel.

COPY ENGINE:
8. Build TSV (tab-separated values) text from rows + columns.
9. Format cells by type: numbers via toLocaleString(), booleans as Yes/No, dates with format pattern, null as empty string.
10. Clipboard write: try navigator.clipboard.writeText() first, fallback to textarea + execCommand.
11. After copy, show a toast notification: "Copied N rows × M columns".
12. Ctrl+C keyboard shortcut: if cell range → copy range, else if rows selected → copy rows, else → copy focused cell.

SELECTION ACTION BAR:
13. Floating bar at bottom of grid when selection exists. Shows count, Copy buttons (with/without headers), and Clear button.
```

---

## 4. Export to CSV & Excel

### Overview

Export grid data as CSV or Excel (XLSX) files with optional formatting
preservation. No third-party libraries — Excel uses custom OpenXML builder.

### CSV Export

```typescript
interface CsvExportOptions {
  includeHeaders?: boolean;        // default: true
  separator?: string;              // default: ','
  filename?: string;               // default: 'export.csv'
  selectedOnly?: boolean;          // Export only selected rows
  columns?: string[];              // Whitelist of fields to include
  includeFormatting?: boolean;     // Apply number/date/boolean formatting
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, {
    decimals?: number;
    display?: 'currency' | 'percent';
    prefix?: string;
    suffix?: string;
  }>;
  columnGroups?: Array<{ header: string; children: string[] }>;
  compactNumbers?: boolean;        // 1234 → "1.2K", 1500000 → "1.5M"
  excludeFields?: Set<string>;     // Restricted columns
  maskFields?: Map<string, (v: unknown) => string>; // PII masking
}
```

**CSV escaping rules:**
1. If cell contains the separator, quotes, or newlines → wrap in double quotes.
2. Double quotes inside values → escape as `""`.
3. **Formula injection prevention**: if cell starts with `=`, `+`, `-`, `@`, tab, or CR → prepend a single quote `'`.
4. Add BOM (`\uFEFF`) at start for UTF-8 Excel compatibility.

**Compact number formatting:**
- < 1000: as-is
- 1000-999999: `N.NK` (e.g., 1234 → "1.2K")
- 1M-999M: `N.NM`
- 1B+: `N.NB`

### Excel Export

```typescript
interface ExcelExportOptions {
  sheetName?: string;              // default: 'Data'
  filename?: string;               // default: 'export.xlsx'
  includeHeaders?: boolean;        // default: true
  selectedOnly?: boolean;
  columns?: string[];
  includeFormatting?: boolean;     // Include colors, fonts, borders
  columnFormatting?: Record<string, CellFormatting>;
  colorThresholds?: Record<string, ThresholdRule[]>;
  statusColors?: Record<string, { bg: string; color: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  gridLines?: 'none' | 'horizontal' | 'vertical' | 'both';
  gridLineColor?: string;         // default: '#E7E5E4'
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, NumberFormatOptions>;
}

interface CellFormatting {
  bgColor?: string;    // Hex "#RRGGBB"
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
}

interface ThresholdRule {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains';
  value: unknown;
  bgColor?: string;
  textColor?: string;
  bold?: boolean;
}
```

**Excel format (XLSX = ZIP of XML files):**
- `[Content_Types].xml` — MIME type declarations
- `_rels/.rels` — relationship definitions
- `xl/workbook.xml` — workbook structure
- `xl/worksheets/sheet1.xml` — cell data with style references
- `xl/styles.xml` — font/fill/border/cell format definitions
- `xl/sharedStrings.xml` — (optional, we use inline strings)

**Style priority (highest wins):**
1. Color thresholds (conditional based on cell value)
2. Status colors (column type = status)
3. Bar thresholds (column type = bar)
4. Static column formatting
5. Grid line borders (fallback)

**Data type preservation:**
- Numbers → stored as numeric `<c t="n"><v>123</v></c>`
- Dates → Excel serial number (days since 1899-12-30)
- Text → inline string `<c t="inlineStr"><is><t>text</t></is></c>`

### Toolbar Integration

The export toolbar section shows:
- Checkbox: "Include formatting"
- Checkbox: "Include group headers" (default: checked)
- Button: "Download CSV"
- Button: "Download Excel"

### File Download Mechanism

```typescript
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// CSV: new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' })
// Excel: new Blob([xlsxBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
```

### Grid Properties

```typescript
showCsvExport: boolean = true;      // Show CSV button in toolbar
showExcelExport: boolean = true;    // Show Excel button in toolbar
```

### Grid API Methods

```typescript
exportCSV(options?: Partial<CsvExportOptions>): void;
exportExcel(options?: Partial<ExcelExportOptions>): void;
```

### Claude Code Prompt

```
Implement CSV and Excel export for the data grid.

CSV EXPORT:
1. Create exportToCSV(gridApi, columns, options) that returns a CSV string.
2. Use the sorted row model (respects current sort/filter).
3. CSV escaping: wrap cells with commas/quotes/newlines in double quotes. Escape internal quotes as "".
4. Formula injection prevention: prepend ' if cell starts with = + - @ tab CR.
5. Add UTF-8 BOM (\uFEFF) at start.
6. When includeFormatting is true: format numbers with decimals/prefix/suffix, booleans as Yes/No, dates with custom format.
7. Support compactNumbers: 1234 → "1.2K", 1500000 → "1.5M", 2000000000 → "2B".
8. Support excludeFields (Set) to skip restricted columns and maskFields (Map) for PII redaction.
9. If selectedOnly is true, only export rows in the current selection.
10. If columnGroups are provided, add a group header row above the column header row.

EXCEL EXPORT:
11. Create exportToExcel(gridApi, columns, options) that returns a Blob.
12. Build XLSX format from scratch using OpenXML (ZIP of XML files) — NO external libraries.
13. Use a StyleRegistry to deduplicate font/fill/border combinations.
14. Preserve formatting: numbers as numeric cells, dates as Excel serial numbers, text as inline strings.
15. Support conditional formatting via colorThresholds: evaluate cell value against threshold rules (gt, gte, lt, lte, eq) and apply bgColor/textColor/bold.
16. Support statusColors: map status values to bg+text color pairs.
17. Support barThresholds: array of {min, color} for progress bar columns.
18. Support gridLines: add borders based on 'none'|'horizontal'|'vertical'|'both'.
19. Static columnFormatting: per-column bgColor, textColor, bold, italic.
20. Auto-width columns at 15 units with bestFit.

DOWNLOAD:
21. triggerDownload: create Object URL, click hidden <a>, revoke URL.
22. CSV MIME: text/csv;charset=utf-8. Excel MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.

TOOLBAR:
23. Add export section to toolbar with checkboxes for "Include formatting" and "Include group headers", plus Download CSV / Download Excel buttons.
24. Show toast notification after export: "Exported N rows".
```

---

## 5. Text Wrapping in Headers

### Overview

Toggle text wrapping in column headers so long header text wraps instead of
being truncated or using ellipsis.

### Property

```typescript
headerWrapping: boolean = false;  // HTML attribute: header-wrapping
```

### CSS Implementation

```css
.header-cell {
  padding: var(--cell-padding);
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.4;
  vertical-align: bottom;
  white-space: var(--header-white-space, normal);
  user-select: none;
}
```

When `headerWrapping` changes:
- `true` → set CSS variable `--header-white-space: normal`
- `false` → set CSS variable `--header-white-space: nowrap`

The header row has NO fixed height — it grows to fit wrapped content. Density
settings affect padding but not max-height.

### Claude Code Prompt

```
Implement header text wrapping on the data grid.

Requirements:
1. Add a boolean property "headerWrapping" (default: false), reflected as HTML attribute "header-wrapping".
2. Header cells use CSS: white-space: var(--header-white-space, nowrap); line-height: 1.4; vertical-align: bottom.
3. When headerWrapping is true, set --header-white-space to "normal". When false, set to "nowrap".
4. The header <tr> must NOT have a fixed height — it should grow naturally when text wraps.
5. Density settings (comfortable/compact/dense) should affect header padding but not restrict height.
6. Ensure the toggle can be set via the admin panel as a checkbox under "Grid Options".
```

---

## 6. Multi-Row Column Headers (Column Groups)

### Overview

Display a group header row above the main column headers. Each group spans
multiple columns using `colspan`.

### Data Model

```typescript
interface ColumnGroup {
  header: string;           // Group display name
  children: string[];       // Array of column field names in this group
}

// Grid property
columnGroups: ColumnGroup[] = [];
```

### Rendering Logic

```
<thead>
  <!-- Group header row (only if columnGroups.length > 0) -->
  <tr class="thead-row thead-row--group">
    <!-- For each visible column, find its group and render with colspan -->
    <!-- Ungrouped columns get an empty <th> with colspan=1 -->
  </tr>

  <!-- Main header row -->
  <tr class="thead-row">
    <th>Name</th> <th>Age</th> <th>Email</th> <th>Phone</th>
  </tr>
</thead>
```

**Algorithm for building group cells:**

```typescript
function buildGroupHeaderCells(
  columnDefs: ColumnDefinition[],
  columnGroups: ColumnGroup[],
): Array<{ header: string; colspan: number }> {
  const visibleFields = new Set(columnDefs.map(c => c.field));
  const cells: Array<{ header: string; colspan: number }> = [];

  let i = 0;
  while (i < columnDefs.length) {
    const field = columnDefs[i].field;
    const group = columnGroups.find(g => g.children.includes(field));

    if (group) {
      // Count how many of this group's children are visible
      let span = 0;
      for (const child of group.children) {
        if (visibleFields.has(child)) span++;
      }
      cells.push({ header: group.header, colspan: Math.max(span, 1) });
      i += span;
    } else {
      // Ungrouped column — empty cell
      cells.push({ header: '', colspan: 1 });
      i++;
    }
  }

  return cells;
}
```

### CSS

```css
.thead-row--group .group-header-cell {
  padding: 6px 12px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #78716C;
  border-bottom: 2px solid #44403C;
  border-right: 1px solid #E7E5E4;
}
.thead-row--group .group-header-cell:last-child {
  border-right: none;
}
```

### Export Integration

When exporting CSV/Excel with column groups, add the group header as an
additional row above the column headers:

```
Personal,Personal,,Contact,Contact
Name,Age,City,Email,Phone
Alice,30,NYC,a@b.com,555-1234
```

### Claude Code Prompt

```
Implement multi-row column headers (column groups) on the data grid.

Requirements:
1. Accept a columnGroups prop: Array<{ header: string; children: string[] }>.
2. When columnGroups is non-empty, render an additional <tr> row in <thead> ABOVE the main header row.
3. Each group header cell uses colspan to span its visible child columns.
4. Columns NOT in any group get an empty <th> with colspan=1.
5. The algorithm must be visibility-aware: only count visible columns when calculating colspan.
6. If a checkbox selection column exists, add an empty <th> at the start.
7. Style group header cells: centered, 10px font, 700 weight, uppercase, 0.08em letter-spacing, #78716C text, 2px solid bottom border, 1px solid right border (except last).
8. When exporting CSV/Excel, include the group header as an additional row above column headers.
9. Colspan groups should re-render when columns are hidden/shown.
```

---

## 7. Column Management (Reorder, Hide/Show, Chooser)

### Overview

Users can reorder columns via drag-and-drop, hide/show columns, and use a
column chooser panel to manage all column settings.

### Column State

```typescript
interface ColumnState {
  order: string[];                      // Array of field names in display order
  widths: Record<string, number>;       // Per-column width overrides
  visibility: Record<string, boolean>;  // Per-column visibility (false = hidden)
}
```

### API Methods

```typescript
interface GridApi {
  setColumnOrder(fields: string[]): void;
  setColumnWidth(field: string, width: number): void;
  setColumnVisibility(field: string, visible: boolean): void;
  getColumnState(): ColumnState;
  resetColumns(): void;                  // Reset to original order/visibility
  exportState(): SerializedGridState;    // Includes ColumnState
  importState(state: SerializedGridState): void;
}
```

### Column Chooser Panel

A right-edge slide-out panel (320px wide) with:

```
┌──────────────────────────────────────┐
│ Columns (12/18 visible)        [X]  │ ← Sticky header
├──────────────────────────────────────┤
│ [🔍 Search columns...]              │ ← Sticky search
│ [Original ▼] [A-Z ▼]               │ ← Sort toggle
├──────────────────────────────────────┤
│ ☐ ≡ Name                           │ ← Drag handle + checkbox
│ ☑ ≡ Age                            │
│ ☑ ≡ City                           │
│ ☐ ≡ Email                          │
│ ... (scrollable)                     │
├──────────────────────────────────────┤
│ [Show All] [Reset] [Apply]          │ ← Sticky footer
└──────────────────────────────────────┘
```

**Drag-and-drop reordering:**
- Drag handle (`≡` icon) on each row
- Visual feedback: opacity change on dragged item, drop target highlight
- Reorder updates `localOrder` array
- Applied on "Apply" click

**Search/filter:**
- Text input filters column list by name or field
- Case-insensitive substring match

**Sort options:**
- Original: columns in dataset order
- A-Z: alphabetical by header text

**Column Profiles (save/restore layouts):**
```typescript
interface ColumnProfile {
  name: string;
  order: string[];
  visibility: Record<string, boolean>;
  widths: Record<string, number>;
}
```

### Column Resize

- Resize handle on right edge of each header cell
- Drag to resize
- Double-click to auto-fit (samples first 100 rows, calculates width from content length)
- Min width: 60px, Max width: 500px (configurable per column)

**Auto-fit algorithm:**
```typescript
function autoFitColumn(columnDefs, visibleRows, field): number {
  const col = columnDefs.find(c => c.field === field);
  let maxWidth = 60;
  for (const row of visibleRows.slice(0, 100)) {
    const val = row[col.field];
    if (val != null) {
      maxWidth = Math.max(maxWidth, String(val).length * 8 + 32);
    }
  }
  const headerMinWidth = Math.min((col.header ?? col.field).length * 5 + 40, 180);
  maxWidth = Math.max(maxWidth, headerMinWidth);
  return Math.min(Math.max(maxWidth, 60), 500);
}
```

### Claude Code Prompt

```
Implement column management features on the data grid: reorder, hide/show, and a column chooser panel.

COLUMN STATE:
1. Track ColumnState: { order: string[], widths: Record<string,number>, visibility: Record<string,boolean> }.
2. API methods: setColumnOrder(fields), setColumnWidth(field, width), setColumnVisibility(field, visible), getColumnState(), resetColumns().
3. Columns with visibility[field] === false are excluded from rendering.
4. Column order determines rendering order (not definition order).

COLUMN CHOOSER PANEL:
5. Right-edge slide-out panel, 320px wide, full viewport height.
6. Sticky header showing "Columns (N/M visible)" and close button.
7. Sticky search input that filters columns by name (case-insensitive).
8. Toggle between original order and alphabetical sort.
9. Each column row has: drag handle, checkbox (visibility toggle), column name.
10. Drag-and-drop reordering of rows (HTML5 drag API).
11. Sticky footer with: Show All button, Reset button, Apply button.
12. Changes are local until Apply is clicked.
13. Escape key closes the panel.

COLUMN RESIZE:
14. Resize handle (4px wide, cursor: col-resize) on right edge of header cells.
15. Mousedown on handle starts resize drag. Mousemove updates width. Mouseup commits.
16. Double-click on handle auto-fits: sample first 100 visible rows, calculate width as String(value).length * 8 + 32, clamp between 60 and 500.
17. Respect column minWidth (default 60) and maxWidth (default 800).

COLUMN PROFILES:
18. Allow saving named profiles: { name, order, visibility, widths }.
19. Load profile restores all three state aspects.
20. Emit events: "profile-save" and "profile-load" for application-level persistence.
```

---

## 8. Multi-Column Sorting

### Overview

Click column header to sort by single column. Ctrl/Cmd+click to add
secondary, tertiary sort columns. Three-state cycle:
none → ascending → descending → none.

### Data Model

```typescript
type SortDirection = 'asc' | 'desc';

interface SortState {
  columns: Array<{ field: string; direction: SortDirection }>;
}
```

### Interactions

| Action | Behavior |
|--------|----------|
| Click header | Replace all sorts with this column ascending. If already asc → desc. If desc → clear. |
| Ctrl/Cmd + Click | Add/cycle this column WITHOUT replacing others. Remove if cycling past desc. |

### Sort Cycle (Single Click)

```
No sort   → sort(field, 'asc')     → SortState: [{ field, direction: 'asc' }]
Ascending → sort(field, 'desc')    → SortState: [{ field, direction: 'desc' }]
Descending → sort(field, null)     → SortState: []
```

### Sort Cycle (Ctrl + Click)

```
Field not in sorts → append { field, direction: 'asc' }
Field is asc       → change to desc (keep position in array)
Field is desc      → remove from array
Array becomes empty → clearSort()
```

### Visual Indicators

SVG icon with two triangles (up arrow + down arrow):
- No sort: both arrows gray (#D6D3D1)
- Ascending: up arrow dark (#1C1917), down arrow gray
- Descending: down arrow dark (#1C1917), up arrow gray

For multi-sort, optionally show sort order number (1, 2, 3) next to the icon.

### Header ARIA

```html
<th role="columnheader" aria-sort="ascending|descending|none">
```

### Default Comparator

```typescript
function defaultComparator(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}
```

### Custom Comparator

```typescript
interface ColumnDefinition {
  sortComparator?: (a: unknown, b: unknown) => number;
}
```

Used in sort stage: `column.sortComparator ?? defaultComparator`.

### Sort Pipeline

```
Data → Filter → SORT → Group → Flatten → Virtualize
```

Sort happens AFTER filtering but BEFORE grouping. Cache is invalidated
when sort state changes.

### Multi-Column Sort Execution

```typescript
const sorted = [...rows].sort((rowA, rowB) => {
  for (const sortCol of sortState.columns) {
    const column = columns.find(c => c.field === sortCol.field);
    const comparator = column?.sortComparator ?? defaultComparator;
    const valueA = column?.valueGetter ? column.valueGetter(rowA) : rowA[sortCol.field];
    const valueB = column?.valueGetter ? column.valueGetter(rowB) : rowB[sortCol.field];
    const result = comparator(valueA, valueB);
    if (result !== 0) {
      return sortCol.direction === 'asc' ? result : -result;
    }
  }
  return 0;  // Stable: preserve original order for ties
});
```

### Server-Side Sort

```typescript
interface DataFetchRequest {
  offset: number;
  limit: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filter?: Array<{ field: string; operator: string; value: unknown }>;
}
```

When a remote data source is configured, sort state is passed to the server
instead of sorting client-side. Local cache is invalidated on sort change.

### Events

```typescript
// Core event (colon-separated)
interface SortChangeEvent {
  type: 'sort:change';
  sort: SortState;
}

// Clear event
interface SortClearEvent {
  type: 'sort:clear';
}
```

### Hooks

```typescript
hooks.beforeSort(sortState: SortState): SortState | false;  // Can cancel or modify
hooks.afterSort(sortState: SortState): void;
```

### API Methods

```typescript
interface GridApi {
  sort(field: string, direction: 'asc' | 'desc' | null): void;
  multiSort(sorts: Array<{ field: string; direction: 'asc' | 'desc' }>): void;
  clearSort(): void;
  getSortState(): SortState;
}
```

### Claude Code Prompt

```
Implement multi-column sorting on the data grid.

Requirements:

STATE:
1. SortState: { columns: Array<{ field: string; direction: 'asc' | 'desc' }> }.
2. API: sort(field, direction), multiSort(sorts), clearSort(), getSortState().

INTERACTIONS:
3. Click header: replace all sorts with single column. Cycle: none→asc→desc→none.
4. Ctrl/Cmd+click header: add this column to sorts (append). If already asc→desc. If desc→remove from array.
5. If after removal the sorts array is empty, call clearSort().

VISUAL:
6. SVG sort icon: two triangles (up + down). Active direction gets dark fill (#1C1917), inactive gets light (#D6D3D1).
7. For multi-sort, show small number badge (1, 2, 3) next to icon indicating sort priority.
8. aria-sort attribute on <th>: "ascending", "descending", or "none".

COMPARATOR:
9. Default comparator: nulls sort first, numbers by value, dates by getTime(), strings by localeCompare().
10. Support custom sortComparator on ColumnDefinition.
11. Multi-column: iterate sorts in order, first non-zero result wins. Ties preserve original order (stable sort).

PIPELINE:
12. Sort stage runs AFTER filter, BEFORE grouping.
13. Cache the sorted model. Invalidate on sort state change.
14. Always use getSortedRowModel() for display (never getCoreRowModel()).

SERVER-SIDE:
15. When remoteDataSource is set, pass sort array to fetch() request instead of sorting client-side.

EVENTS & HOOKS:
16. Emit 'sort:change' event with SortState payload after any sort operation.
17. Emit 'sort:clear' event when sort is cleared.
18. Support beforeSort hook that can cancel (return false) or modify sort state.
19. ARIA announcement: "Sorted by [field], ascending/descending" or "Sort cleared".
```

---

## 9. Filters Per Type with Conditional Logic

### Overview

Per-column filters with type-specific operators and UI. Supports conditional
filters (two conditions combined with AND/OR logic). Also includes a
criteria-based filtering system for page-level filters.

### Filter Operators by Column Type

**String (text) filters:**
| Operator | Description |
|----------|-------------|
| `contains` | Substring match (case-insensitive) |
| `notContains` | Does NOT contain substring |
| `equals` | Exact match |
| `notEquals` | Not equal |
| `startsWith` | Begins with |
| `endsWith` | Ends with |
| `isEmpty` | Null, undefined, or "" |
| `isNotEmpty` | Has a non-empty value |

**Number filters:**
| Operator | Description |
|----------|-------------|
| `equals` | Exact numeric match |
| `notEquals` | Not equal |
| `greaterThan` | > value |
| `greaterThanOrEqual` | >= value |
| `lessThan` | < value |
| `lessThanOrEqual` | <= value |
| `between` | >= value AND <= value2 |
| `in` | Value is in set |
| `notIn` | Value is not in set |
| `isNull` | Is null/undefined |
| `isNotNull` | Has a value |

**Date filters:**
| Operator | Description |
|----------|-------------|
| `equals` | Same date |
| `notEquals` | Different date |
| `greaterThan` | After date |
| `lessThan` | Before date |
| `between` | Within date range (start–end) |
| `dateDayOfWeek` | Specific day of week (0=Sun through 6=Sat) |
| `dateMonth` | Specific month (1-12) |
| `dateYear` | Specific year |
| `dateWeekNumber` | ISO week number |
| `isNull` / `isNotNull` | Has/missing date |

**Date presets (quick filters):**
- `today`, `yesterday`
- `last-7d`, `last-30d`, `last-90d`
- `last-3m`, `last-6m`, `last-12m`
- `wtd` (week-to-date), `mtd` (month-to-date), `qtd` (quarter-to-date), `ytd` (year-to-date)
- `prev-week`, `prev-month`, `prev-quarter`, `prev-year`

**Boolean filters:**
| Operator | Description |
|----------|-------------|
| `equals` | true or false |
| `isNull` | Null/undefined |
| `isNotNull` | Has a value |

### Filter State Model

```typescript
interface FilterState {
  filters: FilterModel[];
  presets: Record<string, FilterPreset>;
  activePreset?: string;
}

interface FilterModel {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

type FilterLogic = 'and' | 'or';
```

### Conditional Filters (AND/OR Between Two Conditions)

The filter popover supports two conditions on the same column, combined with
AND or OR logic:

```typescript
interface FilterApplyEvent {
  field: string;
  selectedValues: unknown[];        // Checkbox selection
  customFilter?: {
    operator: FilterOperator;       // First condition
    value: unknown;
    logic?: 'and' | 'or';          // Combiner
    operator2?: FilterOperator;     // Second condition
    value2?: unknown;
  };
}
```

**Example:** "Show rows where Amount > 100 AND Amount < 500"
```json
{
  "field": "amount",
  "customFilter": {
    "operator": "greaterThan",
    "value": 100,
    "logic": "and",
    "operator2": "lessThan",
    "value2": 500
  }
}
```

### Filter Popover UI (Per-Column)

Triggered by clicking the filter icon in the column header. Layout:

```
┌──────────────────────────────────────┐
│ Filter: [Column Name]          [X]   │
├──────────────────────────────────────┤
│ [🔍 Search values...]               │
│                                      │
│ ☑ (Select All)                       │
│ ☑ Value 1                            │
│ ☑ Value 2                            │
│ ☐ Value 3                            │
│ ☐ Value 4                            │
│ ... (scrollable checkbox list)       │
├──────────────────────────────────────┤
│ ── Custom Filter ──                  │
│ [Operator ▼] [Value         ]        │
│                                      │
│ ○ AND  ○ OR                          │
│                                      │
│ [Operator ▼] [Value         ]        │
├──────────────────────────────────────┤
│ [Clear]                    [Apply]   │
└──────────────────────────────────────┘
```

**For date columns, add date-part filters:**
```
── Filter by Date Parts ──
Day of Week:  [Monday ▼]
Month:        [Any ▼]
Year:         [2024 ▼]
```

### Filter Execution Logic

```typescript
function evaluateFilter(row: RowData, filter: FilterModel): boolean {
  const value = row[filter.field];

  switch (filter.operator) {
    case 'contains':
      return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'notContains':
      return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'equals':
      return value === filter.value;
    case 'notEquals':
      return value !== filter.value;
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
    case 'greaterThan':
      return Number(value) > Number(filter.value);
    case 'greaterThanOrEqual':
      return Number(value) >= Number(filter.value);
    case 'lessThan':
      return Number(value) < Number(filter.value);
    case 'lessThanOrEqual':
      return Number(value) <= Number(filter.value);
    case 'between':
      return Number(value) >= Number(filter.value) &&
             Number(value) <= Number((filter as any).value2);
    case 'in':
      return (filter.value as unknown[]).includes(value);
    case 'notIn':
      return !(filter.value as unknown[]).includes(value);
    case 'isEmpty':
      return value == null || value === '';
    case 'isNotEmpty':
      return value != null && value !== '';
    case 'isNull':
      return value == null;
    case 'isNotNull':
      return value != null;
    // Date-specific operators
    case 'dateDayOfWeek':
      return new Date(value as string).getDay() === Number(filter.value);
    case 'dateMonth':
      return new Date(value as string).getMonth() + 1 === Number(filter.value);
    case 'dateYear':
      return new Date(value as string).getFullYear() === Number(filter.value);
    case 'dateWeekNumber':
      return getISOWeekNumber(new Date(value as string)) === Number(filter.value);
    default:
      return true;
  }
}

// Apply all filters with AND logic between different columns
function filterRows(rows: RowData[], filters: FilterModel[]): RowData[] {
  return rows.filter(row => filters.every(f => evaluateFilter(row, f)));
}
```

### Active Filter Indicators

- Header filter icon changes color when filter is active on that column
- Filter badge/dot on the filter button: `class="filter-btn--active"`
- CSS: active filter icon color `#3B82F6` (blue), inactive `#A8A29E` (gray)

### API Methods

```typescript
interface GridApi {
  addFilter(field: string, operator: FilterOperator, value: unknown): void;
  removeFilter(field: string): void;
  clearFilters(): void;
  getFilterState(): FilterState;
  setFilterState(state: FilterState): void;
}
```

### Events

```typescript
interface FilterChangeEvent {
  type: 'filter:change';
  filters: FilterModel[];
}

interface FilterClearEvent {
  type: 'filter:clear';
}
```

### Hooks

```typescript
hooks.beforeFilter(filters: FilterModel[]): FilterModel[] | false;
hooks.afterFilter(filters: FilterModel[]): void;
```

### Server-Side Filters

When remote data source is configured, filter state is passed to the
`fetch()` request. Client-side filter evaluation is skipped.

```typescript
interface DataFetchRequest {
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filter?: Array<{ field: string; operator: string; value: unknown }>;
}
```

### Filter Presets (Saved Filters)

```typescript
interface FilterPreset {
  id: string;
  name: string;
  scope: 'personal' | 'shared';
  filters: FilterModel[];
  isDefault?: boolean;
  created: number;
  updated: number;
}
```

### Claude Code Prompt

```
Implement per-column filtering with type-specific operators and conditional logic on the data grid.

FILTER STATE:
1. FilterState: { filters: FilterModel[], presets: Record<string, FilterPreset>, activePreset?: string }.
2. FilterModel: { field, operator, value, value2? (for between) }.
3. API: addFilter(field, operator, value), removeFilter(field), clearFilters(), getFilterState().

OPERATORS BY TYPE:

String: contains, notContains, equals, notEquals, startsWith, endsWith, isEmpty, isNotEmpty.
Number: equals, notEquals, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, between (requires value2), in, notIn, isNull, isNotNull.
Date: equals, notEquals, greaterThan, lessThan, between, dateDayOfWeek, dateMonth, dateYear, dateWeekNumber, isNull, isNotNull.
Boolean: equals (true/false), isNull, isNotNull.

DATE PRESETS:
4. Quick date filters: today, yesterday, last-7d, last-30d, last-90d, last-3m, last-6m, last-12m, wtd, mtd, qtd, ytd, prev-week, prev-month, prev-quarter, prev-year.
5. Each preset resolves to a concrete date range at evaluation time.

CONDITIONAL FILTERS:
6. Support two conditions on the same column combined with AND or OR.
7. Data model: { operator, value, logic: 'and'|'or', operator2, value2 }.
8. UI: two operator+value rows with AND/OR radio buttons between them.

FILTER POPOVER UI:
9. Triggered by filter icon click in column header.
10. Top section: search input that filters the checkbox list.
11. Middle section: scrollable checkbox list of unique values with "(Select All)" toggle at top.
12. Bottom section: "Custom Filter" with two condition rows and AND/OR selector.
13. Footer: Clear button (left) and Apply button (right).
14. For date columns, add date-part filters (day of week, month, year dropdowns).

FILTER EXECUTION:
15. Implement evaluateFilter(row, filter) with all operators above.
16. String comparisons are case-insensitive.
17. Between operator checks value >= filter.value AND value <= filter.value2.
18. Date operators: parse dates properly (handle European dd/mm/yyyy format manually — new Date('15/03/2024') is Invalid Date in JS).
19. Multiple column filters use AND logic (all must pass).
20. Within a column's two conditions, use the specified AND/OR logic.

VISUAL:
21. Active filter indicator: filter icon in header changes to blue (#3B82F6) with "filter-btn--active" class.
22. Filter count badge on toolbar.

EVENTS & HOOKS:
23. Emit 'filter:change' after any filter operation.
24. Emit 'filter:clear' when all filters cleared.
25. beforeFilter hook can cancel (return false) or modify filters.

SERVER-SIDE:
26. When remoteDataSource is set, pass filters to fetch() request instead of client-side evaluation.

PRESETS:
27. Save/load named filter presets with scope (personal/shared).
28. Default preset auto-applies on grid load.
```

---

## Appendix: Complete Type Reference

```typescript
// === Core Types ===
type RowId = string | number;
type RowData = Record<string, unknown> & { __id: RowId };

type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'custom';
// Extended: 'status' | 'bar' | 'link' | 'image' | 'datetime'

interface ColumnDefinition {
  field: string;                         // Unique identifier (used as key)
  header?: string;                       // Display text (defaults to field)
  type?: ColumnType;
  width?: number;
  minWidth?: number;                     // Default: 60
  maxWidth?: number;                     // Default: 800
  sortable?: boolean;                    // Default: true
  filterable?: boolean;                  // Default: true
  editable?: boolean;                    // Default: false
  resizable?: boolean;                   // Default: true
  frozen?: 'left' | 'right' | null;
  sortComparator?: (a: unknown, b: unknown) => number;
  valueGetter?: (row: RowData) => unknown;
  headerRenderer?: (context: HeaderRenderContext) => unknown;
}

// === State Types ===
interface GridState {
  sort: SortState;
  filter: FilterState;
  selection: SelectionState;
  columns: ColumnState;
  edit: EditState;
}

interface SortState {
  columns: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

interface FilterState {
  filters: Array<{ field: string; operator: FilterOperator; value: unknown }>;
  presets: Record<string, FilterPreset>;
  activePreset?: string;
}

interface SelectionState {
  mode: 'none' | 'single' | 'multi' | 'range';
  selectedRows: Set<RowId>;
  selectedCells: Set<string>;          // "rowId:field"
  anchorCell?: { rowId: RowId; field: string };
}

interface ColumnState {
  order: string[];
  widths: Record<string, number>;
  visibility: Record<string, boolean>;
}

// === Event Types ===
interface SelectionChangeEvent {
  type: 'selection:change';
  selectedRows: RowId[];
  selectedCells: { rowId: string; field: string }[];
  delta: {
    addedRows: RowId[];
    removedRows: RowId[];
    addedCells: { rowId: string; field: string }[];
    removedCells: { rowId: string; field: string }[];
  };
}

interface SortChangeEvent {
  type: 'sort:change';
  sort: SortState;
}

interface FilterChangeEvent {
  type: 'filter:change';
  filters: FilterModel[];
}

type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'lessThan' | 'lessThanOrEqual'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'between' | 'in' | 'notIn'
  | 'isNull' | 'isNotNull'
  | 'isEmpty' | 'isNotEmpty'
  | 'dateDayOfWeek' | 'dateMonth'
  | 'dateYear' | 'dateWeekNumber';
```
