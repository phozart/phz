# phz-grid Admin Console — Table Settings Configurator Specification

> Complete specification for the grid admin panel and table settings configurator.
> Each section is self-contained with data models, UI layout, interactions, and
> a Claude Code implementation prompt.

---

## Table of Contents

1. [Admin Panel Overview & Architecture](#1-admin-panel-overview--architecture)
2. [Tab 1: Report Identity](#2-tab-1-report-identity)
3. [Tab 2: Data Source](#3-tab-2-data-source)
4. [Tab 3: Table Settings Configurator](#4-tab-3-table-settings-configurator)
   - [3a. Layout Tab — Container Section](#4a-layout-tab--container-section)
   - [3b. Layout Tab — Title Bar Section](#4b-layout-tab--title-bar-section)
   - [3c. Layout Tab — Toolbar Section](#4c-layout-tab--toolbar-section)
   - [3d. Behaviour Tab — Grid Options Section](#4d-behaviour-tab--grid-options-section)
   - [3e. Behaviour Tab — Row Grouping Section](#4e-behaviour-tab--row-grouping-section)
   - [3f. Behaviour Tab — Aggregation Row Section](#4f-behaviour-tab--aggregation-row-section)
   - [3g. Behaviour Tab — Behaviour Section](#4g-behaviour-tab--behaviour-section)
   - [3h. Styling Tab — Grid Lines & Display Section](#4h-styling-tab--grid-lines--display-section)
   - [3i. Styling Tab — Default Typography Section](#4i-styling-tab--default-typography-section)
   - [3j. Styling Tab — Section Colors](#4j-styling-tab--section-colors)
5. [Tab 4: Column Configuration](#5-tab-4-column-configuration)
6. [Tab 5: Conditional Formatting](#6-tab-5-conditional-formatting)
7. [Tab 6: Filter Presets](#7-tab-6-filter-presets)
8. [Tab 7: Criteria Binding](#8-tab-7-criteria-binding)
9. [Tab 8: Export Settings](#9-tab-8-export-settings)
10. [Complete Type Reference](#10-complete-type-reference)
11. [Settings Flow & Live Preview Architecture](#11-settings-flow--live-preview-architecture)

---

## 1. Admin Panel Overview & Architecture

### What It Is

A tabbed modal dialog providing comprehensive configuration for a data grid
report. It controls everything from the grid title and toolbar to column
formatting, filters, and export settings. All changes live-sync to the grid
for instant visual preview.

### Modal Shell

```
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░ SEMI-TRANSPARENT BACKDROP ░░░░░░░░░░░░░░░░░░░░ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HEADER                                                  │ │
│ │  Grid Admin          [Save] [Reset] [Copy Settings] [X] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ TAB BAR (horizontal scroll)                             │ │
│ │  Report | Data Source | Table Settings | Columns |      │ │
│ │  Formatting | Filters | Criteria | Export               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ TAB CONTENT (scrollable body, flex: 1)                  │ │
│ │                                                         │ │
│ │  [Active tab component renders here]                    │ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Modal Dimensions & Behavior

| Property | Value |
|----------|-------|
| Width | 90vw, max 1100px |
| Height | 85vh, max 900px |
| Border radius | 16px |
| Shadow | Multi-layer (0 25px 50px rgba + 0 8px 16px rgba) |
| Backdrop | rgba dark overlay, z-index: 9999 |
| Animation | Slide-up 0.2s ease + fade-in 0.15s |
| Close triggers | X button, backdrop click, Escape key |
| Body scroll lock | `document.body.style.overflow = 'hidden'` when open |
| Mobile (< 768px) | 100% width, 95vh height, 12px radius |

### Tabs (8 Total)

| # | Tab ID | Label | Component | Default Tab |
|---|--------|-------|-----------|-------------|
| 1 | `report` | Report | `<phz-admin-report>` | create mode |
| 2 | `data-source` | Data Source | `<phz-admin-data-source>` | — |
| 3 | `table-settings` | Table Settings | `<phz-admin-table-settings>` | edit mode |
| 4 | `columns` | Columns | `<phz-admin-columns>` | — |
| 5 | `formatting` | Formatting | `<phz-admin-formatting>` | — |
| 6 | `filters` | Filters | `<phz-admin-filters>` | — |
| 7 | `criteria` | Criteria | `<phz-admin-criteria>` | — |
| 8 | `export` | Export | `<phz-admin-export>` | — |

### Tab bar styling

```css
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E7E5E4;
  padding: 0 28px;
  overflow-x: auto;
}
.tab {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #78716C;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.tab--active {
  color: #3B82F6;
  border-bottom-color: #3B82F6;
  font-weight: 600;
}
.tab:hover:not(.tab--active) {
  color: #44403C;
}
```

### Header Actions

| Button | Action | Event |
|--------|--------|-------|
| **Save** | Serialize all settings → emit | `settings-save` with `{ reportId, reportName, settings: ReportPresentation }` |
| **Reset** | Restore all defaults | `settings-reset` with `{ reportId }` |
| **Copy Settings** | Copy from another report | `copy-settings-request` with `{ targetReportId, availableReports }` |
| **X** (Close) | Close modal, auto-save | `admin-close` |

### Auto-Save

- 2-second debounce after any change
- Emits `settings-auto-save` event
- Save state indicator: "Saved ✓" fades in for 1.5s after save

### Access Control

- `isAdmin: boolean` property gates the admin button in the toolbar
- No per-tab or per-feature role gating inside the admin panel
- Host application is responsible for access control

### Data Model: ReportPresentation

```typescript
interface ReportPresentation {
  tableSettings?: Partial<TableSettings>;
  columnFormatting?: Record<string, ColumnFormatting>;
  numberFormats?: Record<string, NumberFormat>;
  filterPresets?: Record<string, { name: string; filters: FilterModel[] }>;
  exportSettings?: ExportSettings;
  columnTypes?: Record<string, string>;
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  dateFormats?: Record<string, string>;
  linkTemplates?: Record<string, string>;
}
```

### Claude Code Prompt — Admin Panel Shell

```
Implement a tabbed modal admin panel for a data grid.

MODAL:
1. Fixed-position modal with semi-transparent backdrop overlay (z-index 9999).
2. Dimensions: 90vw max 1100px width, 85vh max 900px height, 16px border-radius.
3. Slide-up animation (0.2s ease) on open.
4. Close on: X button, backdrop click, Escape key.
5. Lock body scroll when open.
6. Mobile responsive: 100% width, 95vh at < 768px.

HEADER:
7. Title "Grid Admin" with report name badge.
8. Action buttons: Save, Reset, Copy Settings, Close (X).
9. Save emits event with full ReportPresentation object.
10. Auto-save with 2-second debounce after any change.

TAB BAR:
11. 8 horizontal tabs with active underline indicator (2px blue #3B82F6).
12. Tab labels: Report, Data Source, Table Settings, Columns, Formatting, Filters, Criteria, Export.
13. Default to "Report" tab in create mode, "Table Settings" in edit mode.
14. Horizontal scroll on mobile.

CONTENT:
15. Scrollable body area rendering the active tab component.
16. Each tab is a separate component receiving props and emitting events.
17. Parent facade holds all state; child components are stateless (receive props, emit events).

ACCESSIBILITY:
18. role="dialog", aria-modal="true" on modal.
19. role="tablist" / role="tab" / aria-selected on tabs.
20. Focus-visible ring: 2px solid #EF4444.
```

---

## 2. Tab 1: Report Identity

### Purpose

Edit report name, description, and view read-only metadata.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Meta Row (only if reportId exists):                     │
│   ID: rpt_abc123 │ Created: 2024-01-15 │ By: admin     │
├─────────────────────────────────────────────────────────┤
│ Report Name *                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Monthly Sales Report                                │ │
│ └─────────────────────────────────────────────────────┘ │
│ ⚠ Required (shown in create mode if empty)             │
│                                                         │
│ Description                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Detailed breakdown of monthly sales by region...    │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Properties

| Property | Type | Notes |
|----------|------|-------|
| `reportName` | string | Required in create mode |
| `reportDescription` | string | Optional, textarea (min-height 80px) |
| `reportId` | string | Read-only display |
| `created` | number | Timestamp, formatted display |
| `updatedAt` | number | Timestamp, formatted display |
| `createdBy` | string | User attribution |
| `mode` | `'create' \| 'edit'` | Controls validation |

### Event

```typescript
// On any field change
{ type: 'report-meta-change', detail: { key: 'name' | 'description', value: string } }
```

### Claude Code Prompt

```
Implement a report identity editor tab for the admin panel.

1. Display read-only metadata row (ID, created date, updated date, creator) if reportId is set.
2. Report Name text input — required in create mode, show red error "Required" when empty.
3. Description textarea — optional, min-height 80px, resizable.
4. Emit "report-meta-change" event with { key: 'name'|'description', value } on input change.
5. Format timestamps as localized date strings.
```

---

## 3. Tab 2: Data Source

### Purpose

Select a data product and preview its schema.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ [🔍 Search data products...]                               │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 Sales Analytics                                   │   │
│ │ Revenue metrics across regions and products          │   │
│ │ 24 fields  [sales] [revenue] [analytics]             │   │
│ └──────────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 Customer Data ★ SELECTED                         │   │
│ │ Customer demographics and behavior                   │   │
│ │ 18 fields  [customers] [crm]                        │   │
│ └──────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│ Schema Preview (shown when product selected):              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Field          │ Type    │ Description               │   │
│ │ customer_id    │ string  │ Unique customer ID        │   │
│ │ name           │ string  │ Full name                 │   │
│ │ revenue        │ number  │ Lifetime revenue          │   │
│ │ signup_date    │ date    │ Registration date         │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Data Types

```typescript
interface DataProductListItem {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  fieldCount: number;
}

interface DataProductFieldInfo {
  name: string;
  type: string;
  description?: string;
}
```

### Event

```typescript
{ type: 'data-source-change', detail: { dataProductId: string } }
```

### Claude Code Prompt

```
Implement a data source selector tab for the admin panel.

1. Searchable list of data products — case-insensitive search across name, description, and tags.
2. Card-based UI: product name (bold), description (2-line clamp), field count, tag chips.
3. Click card to select — highlight with blue border + light blue background.
4. When selected, show schema preview table below: Field | Type | Description columns.
5. Type column shows type badge with styled pill.
6. Empty state when no products available.
7. Emit "data-source-change" with { dataProductId } on selection.
```

---

## 4. Tab 3: Table Settings Configurator

### Overview

The most complex tab. Contains 3 internal sub-tabs (Layout, Behaviour, Styling)
with 10 collapsible sections organizing **77 distinct settings**.

### Internal Tab Switcher

```css
.settings-tabs {
  display: flex;
  background: #F5F5F4;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 20px;
}
.settings-tab {
  flex: 1;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  border-radius: 7px;
  cursor: pointer;
  color: #78716C;
  transition: all 0.15s ease;
}
.settings-tab--active {
  background: white;
  color: #3B82F6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
```

### Collapsible Section Pattern

Each section uses `<details>/<summary>` with this structure:

```html
<details class="settings-section" open>
  <summary class="settings-section__header">
    <span class="settings-section__title">Section Name</span>
    <span class="settings-section__arrow">▸</span>
  </summary>
  <div class="settings-section__body">
    <!-- Setting rows -->
  </div>
</details>
```

```css
.settings-section {
  background: #FAFAF9;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.settings-section[open] {
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}
.settings-section__header {
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #57534E;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings-section__body {
  padding: 4px 16px 16px;
}
```

### Setting Row Pattern

Each individual setting follows this layout:

```html
<div class="setting-row">
  <label class="setting-label">Setting Name</label>
  <div class="setting-control">
    <!-- Control: toggle, select, input, color picker, button group -->
  </div>
</div>
```

```css
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F5F5F4;
}
.setting-row:last-child { border-bottom: none; }
.setting-label {
  font-size: 12px;
  font-weight: 500;
  color: #44403C;
  flex-shrink: 0;
}
```

### UI Control Components

**Toggle (boolean settings):**
```css
.toggle { width: 36px; height: 20px; border-radius: 10px; background: #D6D3D1; cursor: pointer; }
.toggle--on { background: #3B82F6; }
.toggle__thumb { width: 16px; height: 16px; border-radius: 50%; background: white; transition: transform 0.15s; }
.toggle--on .toggle__thumb { transform: translateX(16px); }
```

**Button Group (enum settings):**
```css
.btn-group { display: flex; gap: 2px; background: #F5F5F4; border-radius: 8px; padding: 2px; }
.btn-group__btn { padding: 5px 10px; font-size: 11px; border-radius: 6px; cursor: pointer; }
.btn-group__btn--active { background: #1C1917; color: white; }
```

**Select Dropdown:**
```css
select.setting-select {
  padding: 6px 10px; border: 1px solid #D6D3D1; border-radius: 8px;
  font-size: 12px; background: white; min-width: 120px;
}
```

**Number Input:**
```css
input[type="number"].setting-input {
  width: 64px; padding: 6px 10px; border: 1px solid #D6D3D1;
  border-radius: 8px; font-size: 12px; text-align: center;
}
```

**Color Picker (paired with hex input):**
```html
<div class="color-pair">
  <input type="color" value="#1C1917" />
  <input type="text" value="#1C1917" maxlength="7" class="color-hex" />
</div>
```

**Format Buttons (B/I/U):**
```css
.format-btn { width: 36px; height: 36px; border-radius: 8px; font-weight: 700; }
.format-btn--active { background: #1C1917; color: white; }
```

---

### 4a. Layout Tab — Container Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Shadow | `containerShadow` | `'none'\|'sm'\|'md'\|'lg'` | `'md'` | Button group (4 options) | Card shadow effect |
| Border Radius | `containerRadius` | number | 8 | Range slider (0–24) + number input | px unit |

---

### 4b. Layout Tab — Title Bar Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Show Title Bar | `showTitleBar` | boolean | true | Toggle | Master on/off |
| Title Text | `titleText` | string | `''` | Text input (max 255) | Grid heading |
| Subtitle Text | `subtitleText` | string | `''` | Text input | Below title |
| Title Font | `titleFontFamily` | string | `'inherit'` | Select (5 options) | System, Inter, Arial, Georgia, Courier |
| Title Size | `titleFontSize` | number | 14 | Number input (10–32) | px |
| Subtitle Size | `subtitleFontSize` | number | 13 | Number input (10–24) | px |
| Title Bar BG | `titleBarBg` | string | `'#1C1917'` | Color picker + hex | Background color |
| Title Bar Text | `titleBarText` | string | `'#FEFDFB'` | Color picker + hex | Text color |
| Title Icon | `titleIcon` | string | `''` | Text input | Emoji or single char |

**Conditional rendering:** All settings below "Show Title Bar" are disabled/grayed when `showTitleBar` is false.

---

### 4c. Layout Tab — Toolbar Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Show Toolbar | `showToolbar` | boolean | true | Toggle | Master on/off |
| Search | `showSearch` | boolean | true | Toggle | Disabled if toolbar off |
| Density Toggle | `showDensityToggle` | boolean | true | Toggle | Disabled if toolbar off |
| Column Editor | `showColumnEditor` | boolean | true | Toggle | Disabled if toolbar off |
| CSV Export | `showCsvExport` | boolean | true | Toggle | Disabled if toolbar off |
| Excel Export | `showExcelExport` | boolean | true | Toggle | Disabled if toolbar off |
| Generate Dashboard | `showGenerateDashboard` | boolean | false | Toggle | Disabled if toolbar off |

**Conditional rendering:** All sub-toggles are visually disabled and non-interactive when `showToolbar` is false.

---

### 4d. Behaviour Tab — Grid Options Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Density | `density` | `'comfortable'\|'compact'\|'dense'` | `'compact'` | Button group (3) | Row height: 52/42/34px |
| Loading Mode | `loadingMode` | `'paginate'\|'lazy'` | `'paginate'` | Button group (2) | |
| Page Size | `pageSize` | number | 25 | Select [10,20,25,50,100,250] | Hidden if loadingMode='lazy' |
| Header Wrapping | `headerWrapping` | boolean | false | Toggle | Allow header text wrap |
| Show Column Groups | `showColumnGroups` | boolean | false | Toggle | Enable group headers |
| Column Groups | `columnGroups` | array | `[]` | Visual editor (see below) | Hidden if showColumnGroups=false |
| Allow Filtering | `allowFiltering` | boolean | true | Toggle | Enable column filters |
| Allow Sorting | `allowSorting` | boolean | true | Toggle | Enable column sort |
| Auto-Size Columns | `autoSizeColumns` | boolean | false | Toggle | Fit columns to content |
| Default Sort Field | `defaultSortField` | string | `''` | Select (column fields) | Hidden if allowSorting=false |
| Default Sort Dir | `defaultSortDirection` | `'asc'\|'desc'` | `'asc'` | Select | Hidden if no defaultSortField |
| Row Banding | `rowBanding` | boolean | true | Toggle | Alternating row colors |
| Show Pagination | `showPagination` | boolean | true | Toggle | Page navigation |
| Show Checkboxes | `showCheckboxes` | boolean | false | Toggle | Row selection checkboxes |

**Column Group Editor** (shown when `showColumnGroups` is true):

```
┌─────────────────────────────────────────────────────────┐
│ Group: Personal Info                              [🗑]  │
│  [firstName ✕] [lastName ✕] [age ✕]  [+ Add Field ▼]  │
├─────────────────────────────────────────────────────────┤
│ Group: Contact                                    [🗑]  │
│  [email ✕] [phone ✕]                [+ Add Field ▼]    │
├─────────────────────────────────────────────────────────┤
│ [+ Add Group]                                           │
└─────────────────────────────────────────────────────────┘
```

Each group card has:
- Text input for group header name
- Chip list of child fields (click ✕ to remove)
- Dropdown to add available fields
- Delete button to remove entire group

---

### 4e. Behaviour Tab — Row Grouping Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Group By Fields | `groupByFields` | string[] | `[]` | Multi-select chips | Click to add/remove |
| Group By Levels | `groupByLevels` | string[][] | `[]` | Level badges on chips | Click badge cycles 1→2→3→1 |
| Group Totals | `groupTotals` | boolean | false | Toggle | Show summary per group |
| Totals Function | `groupTotalsFn` | enum | `'sum'` | Select | Hidden if groupTotals=false |
| Per-Field Overrides | `groupTotalsOverrides` | Record | `{}` | Per-field selects | Hidden if groupTotals=false |

**Group By Fields chips:**

```
[Region ①] [Product ②] [Category ①]  [+ Add Field ▼]
```

- Click field chip to remove from grouping
- Blue badge shows level number
- Click badge to cycle levels (1→2→3→1)
- Levels determine nesting depth

**Per-Field Override selects** (one per numeric column):

```
revenue:  [Default (sum) ▼]
quantity: [Average        ▼]
profit:   [None           ▼]
```

Options: default, none, sum, avg, count, min, max.

---

### 4f. Behaviour Tab — Aggregation Row Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Show Aggregation | `showAggregation` | boolean | false | Toggle | Enable summary row |
| Position | `aggregationPosition` | `'top'\|'bottom'\|'both'` | `'bottom'` | Button group (3) | Hidden if off |
| Function | `aggregationFn` | enum | `'sum'` | Select | Hidden if off |
| Per-Field Overrides | `aggregationOverrides` | Record | `{}` | Per-field selects | Hidden if off |

Same per-field override pattern as row grouping.

---

### 4g. Behaviour Tab — Behaviour Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Selection Mode | `selectionMode` | `'none'\|'single'\|'multi'\|'range'` | `'single'` | Select dropdown | |
| Edit Mode | `editMode` | `'none'\|'cell'\|'row'\|'dblclick'` | `'none'` | Select dropdown | |
| Scroll Mode | `scrollMode` | `'paginate'\|'virtual'` | `'paginate'` | Button group (2) | |
| Virtual Threshold | `virtualScrollThreshold` | number | 0 | Number input | Auto-switch at N rows, 0=disabled |
| Fetch Page Size | `fetchPageSize` | number | 100 | Select [50,100,200,500] | Hidden if paginate & threshold=0 |
| Prefetch Pages | `prefetchPages` | number | 2 | Number input (0–5) | Hidden if paginate & threshold=0 |
| Show Row Actions | `showRowActions` | boolean | false | Toggle | Per-row action menu |
| Show Selection Actions | `showSelectionActions` | boolean | true | Toggle | Bulk operation bar |
| Show Edit Actions | `showEditActions` | boolean | true | Toggle | Save/cancel buttons |
| Show Copy Actions | `showCopyActions` | boolean | true | Toggle | Copy-to-clipboard buttons |

---

### 4h. Styling Tab — Grid Lines & Display Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Grid Lines | `gridLines` | `'none'\|'horizontal'\|'vertical'\|'both'` | `'horizontal'` | Button group (4) | |
| Line Color | `gridLineColor` | string | `'#E7E5E4'` | Color picker + hex | |
| Line Width | `gridLineWidth` | `'thin'\|'medium'` | `'thin'` | Button group (2) | |
| Banding Color | `bandingColor` | string | `'#FAFAF9'` | Color picker + hex | Alternate row color |
| Hover Highlight | `hoverHighlight` | boolean | true | Toggle | Row hover effect |
| Text Overflow | `cellTextOverflow` | `'ellipsis'\|'clip'\|'wrap'` | `'wrap'` | Button group (3) | |
| Compact Numbers | `compactNumbers` | boolean | false | Toggle | 1234→1.2K, 1.5M, 2B |

---

### 4i. Styling Tab — Default Typography Section

| Setting | Key | Type | Default | Control | Notes |
|---------|-----|------|---------|---------|-------|
| Font Family | `fontFamily` | string | `'inherit'` | Select (5 options) | System, Inter, Arial, Georgia, Courier |
| Font Size | `fontSize` | number | 13 | Number input (10–20) | px |
| Bold | `fontBold` | boolean | false | Format button (B) | |
| Italic | `fontItalic` | boolean | false | Format button (I) | |
| Underline | `fontUnderline` | boolean | false | Format button (U) | |
| Header H-Align | `headerHAlign` | `'left'\|'center'\|'right'` | `'left'` | Button group (← ↔ →) | |
| Body H-Align | `hAlign` | `'left'\|'center'\|'right'` | `'left'` | Button group (← ↔ →) | |
| Body V-Align | `vAlign` | `'top'\|'middle'\|'bottom'` | `'middle'` | Button group (↑ ↕ ↓) | |

**By-Type Alignment subsection:**

| Setting | Key | Default | Notes |
|---------|-----|---------|-------|
| Numbers | `numberAlign` | `'right'` | Numbers right-aligned by default |
| Text | `textAlign` | `'left'` | |
| Dates | `dateAlign` | `'left'` | |
| Booleans | `booleanAlign` | `'center'` | |

**Font options:**
```typescript
const FONT_OPTIONS = [
  { value: 'inherit', label: 'System Default' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier' },
];
```

---

### 4j. Styling Tab — Section Colors

Four color pairs (background + text) for grid sections:

| Section | BG Key | BG Default | Text Key | Text Default |
|---------|--------|------------|----------|--------------|
| Title Bar | `titleBarBgColor` | `#1C1917` | `titleBarTextColor` | `#FEFDFB` |
| Header | `headerBg` | `#FAFAF9` | `headerText` | `#A8A29E` |
| Body | `bodyBg` | `#FFFFFF` | `bodyText` | `#1C1917` |
| Footer | `footerBg` | `#FAFAF9` | `footerText` | `#78716C` |

Each rendered as:

```
┌──────────────────────────────────────────┐
│ Header Row                               │
│  BG: [■ #FAFAF9] [#FAFAF9]             │
│  Text: [■ #A8A29E] [#A8A29E]           │
└──────────────────────────────────────────┘
```

### Event Emission Pattern

ALL table settings emit the same event structure:

```typescript
{
  type: 'table-settings-change',
  detail: {
    section: string,   // 'container'|'titleBar'|'toolbar'|'gridOptions'|'display'|'typography'|'colors'
    key: string,       // Setting key (e.g., 'density', 'fontSize')
    value: unknown     // New value
  }
}
```

### Claude Code Prompt — Table Settings Configurator

```
Implement the Table Settings Configurator tab for the admin panel. This is the most complex tab with 3 internal sub-tabs and 10 collapsible sections containing 77 settings total.

STRUCTURE:
1. Internal tab switcher with 3 tabs: Layout, Behaviour, Styling. Use pill-style tabs (rounded background, active = white with shadow).
2. Each section is a collapsible <details>/<summary> with section title, expand/collapse arrow, and rounded card styling (bg #FAFAF9, 12px radius).

LAYOUT TAB (3 sections):
3. Container: containerShadow (4-button group: None/S/M/L), containerRadius (range slider 0-24 + number input).
4. Title Bar: showTitleBar toggle (master), titleText + subtitleText inputs, titleFontFamily (5 font select), titleFontSize (10-32), subtitleFontSize (10-24), titleBarBg + titleBarText color pickers, titleIcon input. Disable children when master is off.
5. Toolbar: showToolbar toggle (master), 6 sub-toggles (search, density, columnEditor, csvExport, excelExport, generateDashboard). Disable children when master is off.

BEHAVIOUR TAB (4 sections):
6. Grid Options: density (3-button group), loadingMode (2-button), pageSize (select from [10,20,25,50,100,250] — hidden if lazy mode), headerWrapping toggle, showColumnGroups toggle, columnGroups editor (add/remove groups with name + field chips — hidden if groups off), allowFiltering + allowSorting toggles, defaultSortField (column select — hidden if sorting off), defaultSortDirection (select — hidden if no field), rowBanding + showPagination + showCheckboxes toggles.
7. Row Grouping: groupByFields (multi-chip select), level badges (click to cycle 1→2→3), groupTotals toggle, groupTotalsFn (select — hidden if off), per-field override selects.
8. Aggregation Row: showAggregation toggle, aggregationPosition (3-button: top/bottom/both — hidden if off), aggregationFn (select — hidden if off), per-field overrides.
9. Behaviour: selectionMode (4-option select), editMode (4-option select), scrollMode (2-button), virtualScrollThreshold (number input), fetchPageSize (select — hidden if paginate), prefetchPages (0-5 input — hidden if paginate), 4 action toggles.

STYLING TAB (3 sections):
10. Grid Lines: gridLines (4-button), gridLineColor (color picker), gridLineWidth (2-button), bandingColor (color picker), hoverHighlight toggle, cellTextOverflow (3-button), compactNumbers toggle.
11. Typography: fontFamily (5-option select), fontSize (10-20 input), fontBold/Italic/Underline (3 format buttons), headerHAlign + hAlign (3-button ← ↔ →), vAlign (3-button ↑ ↕ ↓), by-type alignment sub-section: numberAlign (default right), textAlign (left), dateAlign (left), booleanAlign (center).
12. Section Colors: 4 color pairs (titleBar, header, body, footer) each with BG + text color pickers.

EVENT:
13. ALL changes emit a single event type: "table-settings-change" with { section, key, value }.
14. Merge all settings with defaults: { ...DEFAULT_TABLE_SETTINGS, ...currentSettings }.
15. Conditional visibility: hide irrelevant controls when their parent toggle is off.
```

---

## 5. Tab 4: Column Configuration

### Purpose

Manage column order, visibility, type, and per-column formatting.

### Layout: Dual-List Picker

```
┌─────────────── Available ───────────────┬────────────── Selected ───────────────┐
│ [🔍 Search...]                         │ [🔍 Search...]                        │
│                                         │                                       │
│ ☐ customer_id                          │ ≡ ☑ name          [⚙]               │
│ ☐ internal_notes                       │ ≡ ☑ email         [⚙]               │
│ ☐ metadata                             │ ≡ ☑ revenue       [⚙]               │
│                                         │ ≡ ☑ status        [⚙]               │
│                                         │ ≡ ☑ signup_date   [⚙]               │
│                                         │                                       │
│ [Select All]                           │ [↑ Move Up] [↓ Move Down]            │
├─────────────────────────────────────────┴───────────────────────────────────────┤
│ Per-Column Settings (expanded for "revenue"):                                   │
│ Type: [Number ▼]  Decimals: [2] Prefix: [$] Suffix: []  Width: [120] px       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Features

- **Drag-to-reorder** in the Selected panel (HTML5 drag API)
- **Search** in both panels (case-insensitive)
- **Per-column gear icon** opens inline settings:
  - Column type: string, number, boolean, date, datetime, status, bar, link
  - Type-specific settings:
    - **number**: decimals, thousands separator, currency prefix/suffix, display mode
    - **date/datetime**: format preset dropdown (dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, etc.)
    - **status**: value → color mapping (bg, text, dot)
    - **bar**: threshold rules (min value → color)
    - **link**: URL template pattern
  - Width input (40–800px)
  - Font selection

### Column Types

```typescript
const COLUMN_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'status', label: 'Status' },
  { value: 'bar', label: 'Progress Bar' },
  { value: 'link', label: 'Link' },
];
```

### Date Format Presets

```typescript
const DATE_PRESETS = [
  'dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd',
  'dd/mm/yyyy hh24:mi', 'mm/dd/yyyy hh24:mi', 'yyyy-mm-dd hh24:mi',
  'dd Mon yyyy', 'Mon dd, yyyy',
];
```

### Status Color Mapping

For each unique value in a status column, define bg + text + dot color:

```
Active:   BG [■ #DCFCE7]  Text [■ #166534]  Dot [■ #22C55E]
Inactive: BG [■ #FEE2E2]  Text [■ #991B1B]  Dot [■ #EF4444]
Pending:  BG [■ #FEF3C7]  Text [■ #92400E]  Dot [■ #F59E0B]
```

### Bar Threshold Configuration

Array of rules evaluated top-to-bottom, first match wins:

```
Min: [0]    Color: [■ #EF4444]   (red for 0-49)
Min: [50]   Color: [■ #F59E0B]   (amber for 50-79)
Min: [80]   Color: [■ #22C55E]   (green for 80-100)
```

### Events

```typescript
// Column configuration change
{ type: 'column-config-change', detail: {
  field: string,
  type?: string,
  formatting?: ColumnFormatting,
  numberFormat?: NumberFormat,
  statusColors?: Record<string, { bg, color, dot }>,
  barThresholds?: Array<{ min, color }>,
  dateFormat?: string,
  linkTemplate?: string,
}}

// Bulk visibility change
{ type: 'columns-change', detail: {
  action: 'show-all' | 'hide-all',
  visibleFields: string[],
}}
```

### Claude Code Prompt

```
Implement a column configuration tab for the admin panel using a dual-list picker pattern.

DUAL-LIST LAYOUT:
1. Two side-by-side panels: "Available" (left) and "Selected" (right).
2. Both panels have search inputs that filter columns by name.
3. Click column in Available → moves to Selected. Click X in Selected → moves back.
4. Selected panel supports drag-to-reorder (HTML5 drag API) with visual feedback.
5. Move Up / Move Down buttons for keyboard reorder.
6. Select All / Deselect All bulk actions.

PER-COLUMN SETTINGS:
7. Each Selected column has a gear icon that expands an inline settings panel.
8. Type selector dropdown: Text, Number, Boolean, Date, Date & Time, Status, Bar, Link.
9. Type-specific settings:
   - Number: decimals (0-10), thousands separator toggle, prefix input ($, €), suffix input (%, units), display mode (number, currency, percent).
   - Date: format preset dropdown with 8+ presets (dd/mm/yyyy, mm/dd/yyyy, etc.).
   - Status: for each unique value, show BG color picker, text color picker, dot color picker.
   - Bar: ordered threshold list — each entry has min value input + color picker. Add/remove entries.
   - Link: URL template input with {value} and {field} placeholders.
10. Width input (40-800px range).
11. Font family select.

EVENTS:
12. Emit "column-config-change" with { field, type, formatting, numberFormat, statusColors, barThresholds, dateFormat, linkTemplate } on any per-column change.
13. Emit "columns-change" with { action, visibleFields } on bulk show/hide.
```

---

## 6. Tab 5: Conditional Formatting

### Purpose

Define rules that style entire rows based on cell values.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Rule 1:  [Aa]  revenue > 100000 → green bg            [▼]  │
├─────────────────────────────────────────────────────────────┤
│ (Expanded inline editor)                                    │
│ Field:    [revenue ▼]                                       │
│ Operator: [Greater Than ▼]                                  │
│ Value:    [100000        ]                                   │
│ Value 2:  [             ] (only for "between")              │
│                                                             │
│ Background: [■ #DCFCE7] [#DCFCE7]                          │
│ Text Color: [■ #166534] [#166534]                          │
│ Font Weight: [Normal ▼]                                     │
│                                                             │
│ Preview: [Aa] (rendered with applied styles)                │
│                                                   [Done]    │
├─────────────────────────────────────────────────────────────┤
│ Rule 2:  [Aa]  status == "Overdue" → red bg           [▼]  │
├─────────────────────────────────────────────────────────────┤
│ [+ Add Rule]                                                │
└─────────────────────────────────────────────────────────────┘
```

### Operators

```typescript
const FORMATTING_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'greaterThanOrEqual', label: 'Greater or Equal' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'lessThanOrEqual', label: 'Less or Equal' },
  { value: 'between', label: 'Between' },        // Shows Value 2 input
  { value: 'isEmpty', label: 'Is Empty' },        // Hides value inputs
  { value: 'isNotEmpty', label: 'Is Not Empty' }, // Hides value inputs
];
```

### Rule Data Model

```typescript
interface ConditionalFormattingRule {
  id: string;                    // Unique rule ID
  field: string;                 // Column field name
  operator: string;              // Operator from list above
  value: string;                 // Comparison value
  value2?: string;               // Second value (for "between")
  backgroundColor: string;       // Hex color
  color: string;                 // Text hex color
  fontWeight: 'normal' | 'bold';
}
```

### Event

```typescript
{ type: 'rules-change', detail: {
  action: 'add' | 'remove' | 'update',
  ruleId?: string,
  updates?: Partial<ConditionalFormattingRule>,
}}
```

### Claude Code Prompt

```
Implement a conditional formatting rule builder tab for the admin panel.

1. Rule list with card-style rows. Each collapsed row shows: preview swatch (Aa with applied styles), description (field + operator + value), expand/collapse button, remove button (red).
2. Expanded inline editor: field dropdown, operator dropdown (13 options), value input(s), background color picker + hex, text color picker + hex, font weight select (normal/bold).
3. "Between" operator shows two value inputs. "isEmpty"/"isNotEmpty" hide value inputs.
4. Live preview swatch updates as colors/weight change.
5. "+ Add Rule" button at bottom — auto-scrolls to new rule and opens editor.
6. Remove button with danger styling.
7. Emit "rules-change" event with { action: 'add'|'remove'|'update', ruleId, updates }.
8. Each rule has a unique auto-generated ID.
```

---

## 7. Tab 6: Filter Presets

### Purpose

Manage saved filter configurations.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ★ Q1 Sales Filters              3 filters              │ │
│ │                        [Apply] [Duplicate] [Delete]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │   Top Performers                 2 filters              │ │
│ │                        [Apply] [Duplicate] [Delete]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ New Preset]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Events

```typescript
{ type: 'preset-apply', detail: { name: string } }
{ type: 'presets-change', detail: { action: 'add' | 'duplicate' | 'delete', name?: string } }
```

### Claude Code Prompt

```
Implement a filter preset manager tab for the admin panel.

1. Card list of saved presets. Each card shows: preset name, filter count, action buttons.
2. Active preset highlighted with blue border and star icon.
3. Actions per preset: Apply (activates preset), Duplicate (copies with "Copy of" prefix), Delete (red, with confirmation).
4. "+ New Preset" button at bottom.
5. Emit "preset-apply" and "presets-change" events.
```

---

## 8. Tab 7: Criteria Binding

### Purpose

Bind reusable filter definitions to a report with per-binding overrides.

### Layout: Two-Panel

```
┌──────── Available Definitions ─────────┬────────── Bound to Report ─────────────┐
│ [🔍 Search definitions...]             │ Bound Filters (3)                      │
│ Unbound (5)                            │                                        │
│                                        │ ① Region            [↑] [↓] [👁] [⚙] [✕]│
│ ┌────────────────────────────────────┐ │ ② Product Category  [↑] [↓] [👁] [⚙] [✕]│
│ │ Date Range     [period_picker] [→] │ │ ③ Date Range        [↑] [↓] [👁] [⚙] [✕]│
│ │ Customer Tier  [single_select] [→] │ │                                        │
│ │ Status         [multi_select]  [→] │ │ (Expanded config for "Region"):        │
│ │ Amount Range   [numeric_range] [→] │ │   Label Override: [Sales Region    ]   │
│ │ Search         [search]        [→] │ │   Visible: [✓]                         │
│ └────────────────────────────────────┘ │                                        │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

### Data Types

```typescript
interface CriteriaDefinitionItem {
  id: string;
  label: string;
  type: string;            // 'single_select'|'multi_select'|'period_picker'|...
  dataField?: string;
}

interface CriteriaBindingItem {
  filterDefinitionId: string;
  label: string;
  type: string;
  visible: boolean;
  order: number;
  labelOverride?: string;
  defaultValueOverride?: string | string[] | null;
}
```

### Event

```typescript
{ type: 'criteria-binding-change', detail: { bindings: CriteriaBindingItem[] } }
```

### Claude Code Prompt

```
Implement a criteria binding tab for the admin panel using a two-panel layout.

LEFT PANEL (Available):
1. Searchable list of unbound filter definitions.
2. Each card shows: label, type badge, "→ Add" button.
3. Count header showing unbound count.
4. Search filters by label and type.

RIGHT PANEL (Bound):
5. Ordered list of bound filters with order number badges.
6. Per-binding actions: Move Up (↑), Move Down (↓), Toggle Visibility (👁), Configure (⚙), Remove (✕).
7. Inline config panel (expand on ⚙ click): label override text input, visibility checkbox.
8. Drag-to-reorder support.
9. Count header showing bound count.

10. Emit "criteria-binding-change" with full bindings array on any change (add, remove, reorder, edit).
```

---

## 9. Tab 8: Export Settings

### Purpose

Configure default CSV/Excel export options.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Format: [CSV] [Excel]                                       │
├─────────────────────────────────────────────────────────────┤
│ CSV Options (only if CSV selected):                         │
│   Separator: [Comma ▼]                                      │
├─────────────────────────────────────────────────────────────┤
│ Options:                                                    │
│   ☑ Include column headers                                  │
│   ☑ Include group headers                                   │
│   ☐ Include formatting                                      │
├─────────────────────────────────────────────────────────────┤
│ Columns:                                                    │
│   ☑ name                                                    │
│   ☑ email                                                   │
│   ☑ revenue                                                 │
│   ☐ internal_id                                             │
│   ☑ status                                                  │
├─────────────────────────────────────────────────────────────┤
│ [⬇ Download]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface ExportSettings {
  format: 'csv' | 'excel';
  includeHeaders: boolean;       // default: true
  includeFormatting: boolean;    // default: false
  includeGroupHeaders: boolean;  // default: true
  separator: string;             // default: ','
  selectedColumns: string[];
  fileName?: string;
}
```

### Separator Options

```typescript
const SEPARATORS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];
```

### Events

```typescript
// Settings changed
{ type: 'export-settings-change', detail: ExportSettings }

// Download triggered
{ type: 'export-download', detail: {
  format: 'csv' | 'excel',
  includeHeaders: boolean,
  includeFormatting: boolean,
  includeGroupHeaders: boolean,
  separator: string,
  selectedColumns: string[],
}}
```

### Claude Code Prompt

```
Implement an export settings tab for the admin panel.

1. Format selector: 2-button group (CSV / Excel).
2. CSV-specific: separator dropdown (comma, semicolon, tab, pipe) — only visible when CSV selected.
3. Options checkboxes: include headers (default on), include group headers (default on), include formatting (default off). Formatting label changes by format: CSV = "Include formatted values", Excel = "Include colors & styles".
4. Column selection: checkbox list of all available columns for export.
5. Download button (blue, full-width) that triggers the actual export.
6. Emit "export-settings-change" on any option change.
7. Emit "export-download" on download button click.
```

---

## 10. Complete Type Reference

```typescript
// ============================================================
// TABLE SETTINGS (77 properties)
// ============================================================
interface TableSettings {
  // Container (2)
  containerShadow: 'none' | 'sm' | 'md' | 'lg';
  containerRadius: number;

  // Title Bar (9)
  showTitleBar: boolean;
  titleText: string;
  subtitleText: string;
  titleFontFamily: string;
  titleFontSize: number;
  subtitleFontSize: number;
  titleBarBg: string;
  titleBarText: string;
  titleIcon: string;

  // Toolbar (7)
  showToolbar: boolean;
  showSearch: boolean;
  showDensityToggle: boolean;
  showColumnEditor: boolean;
  showCsvExport: boolean;
  showExcelExport: boolean;
  showGenerateDashboard: boolean;

  // Grid Options (14)
  density: 'comfortable' | 'compact' | 'dense';
  loadingMode: 'paginate' | 'lazy';
  pageSize: number;
  headerWrapping: boolean;
  showColumnGroups: boolean;
  columnGroups: Array<{ header: string; children: string[] }>;
  allowFiltering: boolean;
  allowSorting: boolean;
  autoSizeColumns: boolean;
  defaultSortField: string;
  defaultSortDirection: 'asc' | 'desc';
  rowBanding: boolean;
  showPagination: boolean;
  showCheckboxes: boolean;

  // Behaviour (12)
  virtualization: boolean;
  scrollMode: 'paginate' | 'virtual';
  virtualScrollThreshold: number;
  fetchPageSize: number;
  prefetchPages: number;
  editMode: 'none' | 'cell' | 'row' | 'dblclick';
  selectionMode: 'none' | 'single' | 'multi' | 'range';
  showRowActions: boolean;
  showSelectionActions: boolean;
  showEditActions: boolean;
  showCopyActions: boolean;

  // Typography (12)
  fontFamily: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  hAlign: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  headerHAlign: 'left' | 'center' | 'right';
  numberAlign: 'left' | 'center' | 'right';
  textAlign: 'left' | 'center' | 'right';
  dateAlign: 'left' | 'center' | 'right';
  booleanAlign: 'left' | 'center' | 'right';

  // Row Grouping (5)
  groupByFields: string[];
  groupByLevels: string[][];
  groupTotals: boolean;
  groupTotalsFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupTotalsOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;

  // Aggregation (4)
  showAggregation: boolean;
  aggregationPosition: 'top' | 'bottom' | 'both';
  aggregationFn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  aggregationOverrides: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none'>;

  // Grid Lines & Display (7)
  gridLines: 'none' | 'horizontal' | 'vertical' | 'both';
  gridLineColor: string;
  gridLineWidth: 'thin' | 'medium';
  bandingColor: string;
  hoverHighlight: boolean;
  cellTextOverflow: 'ellipsis' | 'clip' | 'wrap';
  compactNumbers: boolean;

  // Section Colors (8)
  titleBarBgColor: string;
  titleBarTextColor: string;
  headerBg: string;
  headerText: string;
  bodyBg: string;
  bodyText: string;
  footerBg: string;
  footerText: string;
}

// ============================================================
// COLUMN FORMATTING
// ============================================================
interface ColumnFormatting {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  hAlign?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'bottom';
  bgColor?: string;
  textColor?: string;
  colorThresholds?: ColumnColorThreshold[];
}

interface ColumnColorThreshold {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'contains';
  value: string;
  bgColor: string;
  textColor: string;
}

// ============================================================
// NUMBER FORMAT
// ============================================================
interface NumberFormat {
  decimals?: number;
  display?: 'number' | 'percent' | 'currency';
  prefix?: string;
  suffix?: string;
}

// ============================================================
// EXPORT SETTINGS
// ============================================================
interface ExportSettings {
  format: 'csv' | 'excel';
  includeHeaders: boolean;
  includeFormatting: boolean;
  includeGroupHeaders: boolean;
  separator: string;
  selectedColumns: string[];
  fileName?: string;
}

// ============================================================
// REPORT PRESENTATION (bundled)
// ============================================================
interface ReportPresentation {
  tableSettings?: Partial<TableSettings>;
  columnFormatting?: Record<string, ColumnFormatting>;
  numberFormats?: Record<string, NumberFormat>;
  filterPresets?: Record<string, { name: string; filters: FilterModel[] }>;
  exportSettings?: ExportSettings;
  columnTypes?: Record<string, string>;
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds?: Array<{ min: number; color: string }>;
  dateFormats?: Record<string, string>;
  linkTemplates?: Record<string, string>;
}

// ============================================================
// CONDITIONAL FORMATTING
// ============================================================
interface ConditionalFormattingRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  value2?: string;
  backgroundColor: string;
  color: string;
  fontWeight: 'normal' | 'bold';
}

// ============================================================
// CRITERIA BINDING
// ============================================================
interface CriteriaDefinitionItem {
  id: string;
  label: string;
  type: string;
  dataField?: string;
}

interface CriteriaBindingItem {
  filterDefinitionId: string;
  label: string;
  type: string;
  visible: boolean;
  order: number;
  labelOverride?: string;
  defaultValueOverride?: string | string[] | null;
}

// ============================================================
// DATA SOURCE
// ============================================================
interface DataProductListItem {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  fieldCount: number;
}

interface DataProductFieldInfo {
  name: string;
  type: string;
  description?: string;
}
```

---

## 11. Settings Flow & Live Preview Architecture

### Data Flow Diagram

```
┌──────────────────────────────────┐
│ Database / Backend               │
│ (ReportConfig + Presentation)    │
└────────────┬─────────────────────┘
             │ Load on open
             ▼
┌──────────────────────────────────┐
│ Host Application                 │
│ (React / Vue / Angular / Vanilla)│
└────────────┬─────────────────────┘
             │ Passes presentation prop
             ▼
┌──────────────────────────────────┐
│ <phz-report-view>                │
│  ├─ presentation: ReportPres.    │
│  ├─ _ts = merged TableSettings   │
│  │   (DEFAULT + presentation)    │
│  │                               │
│  ├─ <phz-grid                    │
│  │    .density=${_ts.density}    │
│  │    .gridLines=${_ts.gridLines}│
│  │    ...48+ props...>           │   ← Live-updated grid
│  │                               │
│  └─ <phz-grid-admin              │
│       .tableSettings=${...}      │
│       @table-settings-change>    │   ← Admin modal
└──────────────────────────────────┘
```

### Live-Sync Cycle

1. User changes setting in admin panel
2. Admin component emits `table-settings-change` with `{ section, key, value }`
3. `<phz-grid-admin>` catches event, updates internal `tableSettings` object
4. Event bubbles to `<phz-report-view>`
5. Report view merges: `{ ...DEFAULT_TABLE_SETTINGS, ...updated }`
6. Report view passes merged settings as properties to `<phz-grid>`
7. Grid re-renders immediately with new settings
8. Auto-save fires after 2s idle, emitting full `ReportPresentation` for persistence

### Settings Merge Strategy

```typescript
// Always merge with defaults to ensure no undefined values
const mergedSettings: TableSettings = {
  ...DEFAULT_TABLE_SETTINGS,
  ...presentation.tableSettings,
};
```

Only non-default values are persisted to the database. The `ReportPresentation`
object uses `Partial<TableSettings>` so only changed settings are stored.

### Admin Panel API

```typescript
// Populate admin from saved settings
admin.setSettings(presentation: ReportPresentation): void;

// Collect all settings for saving
admin.getSettings(): ReportPresentation;
```

`getSettings()` returns a clean bundle excluding empty objects:
```typescript
getSettings(): ReportPresentation {
  const result: ReportPresentation = {};
  if (Object.keys(this.tableSettings).length > 0) {
    result.tableSettings = { ...this.tableSettings };
  }
  if (Object.keys(this.columnFormatting).length > 0) {
    result.columnFormatting = { ...this.columnFormatting };
  }
  // ... same for numberFormats, statusColors, barThresholds, etc.
  return result;
}
```

### Design Tokens (CSS Custom Properties)

Settings map to a three-layer CSS token system:

**Layer 1 — Brand Primitives** (40+ tokens):
```css
--phz-color-primary: #3B82F6;
--phz-font-family-base: Inter, system-ui, sans-serif;
--phz-font-size-base: 13px;
--phz-spacing-md: 12px;
--phz-border-radius-md: 8px;
--phz-shadow-md: 0 4px 8px rgba(28,25,23,0.08);
```

**Layer 2 — Semantic Tokens** (18 tokens):
```css
--phz-header-bg → maps to tableSettings.headerBg
--phz-header-text → maps to tableSettings.headerText
--phz-row-bg → maps to tableSettings.bodyBg
--phz-row-bg-alt → maps to tableSettings.bandingColor
--phz-grid-border → maps to tableSettings.gridLineColor
--phz-focus-ring-color: #3B82F6
```

**Layer 3 — Component Tokens** (17 tokens):
```css
--phz-row-height-comfortable: 52px
--phz-row-height-compact: 42px
--phz-row-height-dense: 34px
--phz-cell-padding → varies by density
--phz-header-font-weight: 600
```

### Shared Admin Styles

All admin components inherit from `adminBaseStyles`:

```css
/* Colors */
--phz-admin-primary: #3B82F6;
--phz-admin-danger: #DC2626;
--phz-admin-text-dark: #1C1917;
--phz-admin-text-mid: #44403C;
--phz-admin-text-light: #78716C;
--phz-admin-border: #D6D3D1;
--phz-admin-bg-light: #F5F5F4;
--phz-admin-bg-white: #FAFAF9;

/* Typography */
font-family: Inter, system-ui, -apple-system, sans-serif;
font-size: 13px (body), 12px (labels/inputs);
font-weight: 500 (medium), 600 (semibold), 700 (bold);

/* Spacing */
gap: 8-16px;
padding: 12-28px;
border-radius: 8-16px;

/* Shadows */
--phz-admin-shadow-sm: 0 2px 4px rgba(28,25,23,0.06);
--phz-admin-shadow-md: 0 4px 8px rgba(28,25,23,0.08);
--phz-admin-shadow-lg: 0 8px 16px rgba(28,25,23,0.10);

/* Transitions */
transition: all 0.15s ease;
hover: translateY(-1px) + shadow lift;
```
