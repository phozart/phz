# phz-workspace UI Specification — Claude Code Instructions

## Design Foundation

The workspace operates in **Console mode** from the phozart-ui design
system. The physical design reference is **precision instrument** (Leica,
Braun): information density without clutter, numerical data as first-class
design element, strict typographic hierarchy that makes dense displays
readable, professional confidence.

Read `/mnt/skills/user/phozart-ui/SKILL.md` for the full token system.
This document specifies how those tokens apply to the workspace's specific
components, layout, and interaction patterns.

Every component in this specification uses:
- The phozart-ui token system (colors, spacing, type, shadows, motion)
- Console mode specifics (dark header frame, monospace data, status indicators)
- Phosphor Icons (Regular for chrome, Bold for CTAs)
- shadcn/ui + Radix primitives as the component foundation
- The 8px spacing grid strictly
- Multi-layer warm shadows (never single-layer, never harsh)
- 12-16px border radius (never sharp 2-4px corners)

---

## 1. Shell Architecture

### 1.1 Visual structure

The workspace shell has three visual zones: header frame, sidebar, and
content area. The header is the Console mode dark frame. The sidebar is
a warm surface. The content area is the workspace.

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER (dark: --header-bg #1C1917)                              │
│  ┌─────┬──────────────────────────────────────────┬───────────┐  │
│  │ PHZ │  Breadcrumb / Context                     │ User │ ⋯ │  │
│  └─────┴──────────────────────────────────────────┴───────────┘  │
├──────────┬───────────────────────────────────────────────────────┤
│ SIDEBAR  │  CONTENT AREA                                         │
│ (warm    │  (--bg-base #FEFDFB)                                  │
│  surface)│                                                       │
│          │  ┌─────────────────────────────────────────────────┐  │
│ CONTENT  │  │                                                 │  │
│ ──────── │  │   Active panel / designer / viewer              │  │
│ Catalog  │  │                                                 │  │
│ Explore  │  │                                                 │  │
│ Create   │  │                                                 │  │
│ Templates│  │                                                 │  │
│          │  │                                                 │  │
│ DATA     │  │                                                 │  │
│ ──────── │  │                                                 │  │
│ Sources  │  │                                                 │  │
│ Connect  │  │                                                 │  │
│          │  │                                                 │  │
│ GOVERN   │  │                                                 │  │
│ ──────── │  │                                                 │  │
│ Filters  │  └─────────────────────────────────────────────────┘  │
│ Rules    │                                                       │
│ Alerts   │                                                       │
│ Publish  │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

### 1.2 Header frame

The header uses Console mode dark frame. Fixed height: 56px. Full width.

```css
.workspace-header {
  background: var(--header-bg);          /* #1C1917 */
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--header-border);  /* #292524 */
  position: sticky;
  top: 0;
  z-index: 50;
}
```

Left zone: product mark + workspace name. The mark is a compact logo or
monogram (not a full logo). Text in `--header-text` (#FAFAF9), font-weight
600, text-sm. A vertical divider `|` in `--header-text-muted` separates
the mark from the current context/section name.

Center zone: breadcrumb trail. Shows the navigation path:
`Catalog > Dashboard: Sales Ops > Widget: Revenue Chart`. Each segment
clickable. Active segment in `--header-text`, parent segments in
`--header-text-muted`, separators in `--header-text-muted` at 50% opacity.
Font: text-sm, font-weight 400.

Right zone: contextual actions + user. These are icon buttons on the dark
background: `p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10
transition-colors`.

Actions that appear contextually:
- When in a designer: Save status indicator (dot: green = saved, amber =
  unsaved changes, animated pulse = saving), Preview toggle (Phosphor Eye),
  Undo/Redo (Phosphor ArrowCounterClockwise/ArrowClockwise)
- Always: global search (Phosphor MagnifyingGlass), keyboard shortcuts
  (Phosphor Keyboard, shows overlay on click), user menu (avatar circle
  or Phosphor UserCircle)

The loading progress strip (from DashboardDataConfig) renders below the
header as a 3px bar at the header's bottom edge, using `--header-accent`
(#3B82F6) as the progress color, `--header-border` as the track.

### 1.3 Sidebar

Width: 240px collapsed labels, expandable to 280px with descriptions.
Background: `--bg-subtle` (#FAF9F7). Right border: `--border-default`.

```css
.workspace-sidebar {
  width: 240px;
  background: var(--bg-subtle);
  border-right: 1px solid var(--border-default);
  height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
  overflow-y: auto;
  padding: var(--space-4) 0;
}
```

Section headers (CONTENT, DATA, GOVERN) are styled as:
```css
.sidebar-section-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);          /* 12px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);           /* #A8A29E */
  padding: var(--space-3) var(--space-5) var(--space-2);
  margin-top: var(--space-4);
}
```

First section (CONTENT) has no top margin.

Navigation items:
```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-sm);          /* 14px */
  font-weight: 400;
  color: var(--text-secondary);       /* #57534E */
  border-radius: 0;                   /* full-width items, no radius */
  cursor: pointer;
  transition: background 150ms ease-out, color 150ms ease-out;
}

.sidebar-item:hover {
  background: var(--bg-muted);        /* #F5F4F2 */
  color: var(--text-primary);         /* #1C1917 */
}

.sidebar-item.active {
  background: var(--bg-emphasis);     /* #EFEEE9 */
  color: var(--text-primary);
  font-weight: 500;
  /* Left accent bar */
  box-shadow: inset 3px 0 0 0 var(--primary-500);  /* #EF4444 */
}
```

Icons: Phosphor Regular, 20px, in `--text-muted` for inactive,
`--text-primary` for active. The icon + label alignment must be precise:
icons center-aligned with the text baseline.

Section visibility by role:
- `admin`: all three sections visible
- `author`: CONTENT visible, DATA visible (items may be read-only),
  GOVERN hidden entirely
- `viewer`: simplified view (no sidebar sections, flat list of available
  artifacts)

When `workspaceRole === 'viewer'`, the sidebar simplifies to a single
flat list without section headers. See section 5 below.

### 1.4 Content area

The content area fills the remaining space. Background: `--bg-base`
(#FEFDFB). It renders the active panel based on the current sidebar
selection.

```css
.workspace-content {
  flex: 1;
  background: var(--bg-base);
  min-height: calc(100vh - 56px);
  overflow-y: auto;
  padding: var(--space-6);
}
```

Content area has a max-width constraint for readability on wide screens:
`max-width: 1440px; margin: 0 auto;` for list views (catalog, filter
list, alert list). Designers (dashboard builder, report designer) use
full width for the canvas.

### 1.5 Responsive behavior — viewport level

Four breakpoints, each with specific layout changes:

```
Desktop:   > 1280px  — sidebar + content + preview panels
Laptop:    1024-1280  — sidebar collapses to icon-only (56px)
Tablet:    768-1023   — sidebar as overlay drawer
Mobile:    < 768px    — full-width, bottom navigation
```

**Desktop (> 1280px):**
Full three-column layout as specified above. All panels visible.
Content area max-width 1440px on list views.

**Laptop (1024-1280px):**
Sidebar collapses to icon-only mode (56px wide). Section labels hidden.
Navigation items show only the Phosphor icon, centered. Tooltip on hover
shows the label. Active item still has the red left accent.
A toggle button at the bottom of the sidebar expands/collapses.
Content area and preview panels fill the remaining width.
Dashboard builder: widget palette collapses to icon grid, configuration
panel becomes a drawer instead of a persistent panel.

**Tablet (768-1023px):**
Sidebar becomes an overlay drawer triggered by a hamburger (Phosphor List)
in the header. Content area is full width.
Catalog: preview panel moves below the list (stacked) instead of beside it.
Dashboard builder: widget palette and config panel are both drawers.
The canvas is full-width. Only one panel visible at a time.
Explorer: field palette collapses into a horizontal scrollable chip row
above the drop zones instead of a side panel.

**Mobile (< 768px):**
Complete layout restructure. No sidebar. The header compresses to 48px:
left = back button (when nested) or hamburger, center = context title
(truncated with ellipsis), right = search + user (icons only, 40px tap targets).

Bottom tab bar replaces the sidebar:
```css
.mobile-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-base);
  border-top: 1px solid var(--border-default);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom); /* iPhone notch */
  z-index: 50;
}

.mobile-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-1);
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  min-width: 64px;
}

.mobile-tab.active {
  color: var(--info-500);
}
```

Tabs shown (based on role):
- Admin: Catalog, Explore, Govern, More (opens full nav)
- Author: Catalog, Explore, Sources, More
- Viewer: Catalog, Explore, My Views

Content area gets `padding-bottom: 72px` to clear the tab bar.

All views are full-width single-column on mobile:
- Catalog: single-column card list, no preview panel (tap card to open)
- Explorer: drop zones stack vertically, field palette is a horizontal
  scrollable strip at top, preview below
- Dashboard builder: canvas only (full screen), widget palette and config
  accessed via bottom sheet drawers
- Designers/wizards: single-step-at-a-time, full-width, large touch targets

### 1.6 Responsive behavior — component level (overflow prevention)

This is the more critical layer. Every component must adapt to its
container size, not the viewport. This uses CSS Container Queries
(already specified in WORKSPACE-CONSOLIDATION-INSTRUCTIONS.md Phase 6.1).

**The core rule: no content may overflow its container.** Text truncates
with ellipsis. Numbers abbreviate. Layouts reflow. Nothing goes off-screen.

**Typography scaling within containers:**

Every text element that might overflow must have one of these strategies:

```css
/* Strategy 1: Truncate with ellipsis (single line) */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Strategy 2: Line clamp (multi-line) */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Strategy 3: Responsive font size (container-query driven) */
.value-display {
  font-size: var(--text-2xl);    /* default for wide containers */
}
@container widget (max-width: 200px) {
  .value-display {
    font-size: var(--text-lg);   /* smaller in narrow containers */
  }
}
@container widget (max-width: 140px) {
  .value-display {
    font-size: var(--text-base); /* smallest */
  }
}

/* Strategy 4: Number abbreviation (JS, not CSS) */
/* 1,234,567 → 1.2M when container is narrow */
/* Driven by formatValue() with compact option */
```

**Component-specific overflow rules:**

Every component specification below includes its overflow behavior.
These are not optional. They are part of the component contract.

**KPI cards:**
```css
.kpi-card {
  container: kpi-card / inline-size;
}

/* Wide (> 280px): full layout */
.kpi-value { font-size: var(--text-2xl); }
.kpi-label { font-size: var(--text-sm); }
.kpi-delta { font-size: var(--text-sm); display: inline-flex; }
.kpi-sparkline { display: block; }

/* Medium (200-280px): compact layout */
@container kpi-card (max-width: 280px) {
  .kpi-value { font-size: var(--text-xl); }
  .kpi-label { font-size: var(--text-xs); }
  .kpi-delta { font-size: var(--text-xs); }
  .kpi-sparkline { display: none; }
}

/* Narrow (< 200px): minimal layout */
@container kpi-card (max-width: 200px) {
  .kpi-value { font-size: var(--text-lg); }
  .kpi-label {
    font-size: var(--text-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kpi-delta { display: none; }
  .kpi-icon { display: none; }
}
```

KPI values MUST use `formatValue()` with `compact: true` when container
width < 200px. "$1,234,567" becomes "$1.2M". "1,234,567 items" becomes
"1.2M". This is not a CSS concern — the widget reads its container width
and passes the compact flag to the formatter.

**Chart widgets:**
```css
.chart-widget {
  container: chart / inline-size;
}

/* Wide (> 400px): full chart with legend, axis labels, data labels */
.chart-legend { display: flex; }
.chart-axis-label { display: block; }
.chart-data-labels { display: block; }

/* Medium (280-400px): chart without legend, smaller axis labels */
@container chart (max-width: 400px) {
  .chart-legend { display: none; }
  .chart-axis-label { font-size: var(--text-xs); }
  .chart-data-labels { display: none; }
}

/* Narrow (< 280px): chart only, no labels */
@container chart (max-width: 280px) {
  .chart-axis-label { display: none; }
  .chart-axis-ticks { display: none; }
  /* Chart area fills entire container */
}

/* Very narrow (< 160px): replace chart with single value */
@container chart (max-width: 160px) {
  .chart-canvas { display: none; }
  .chart-fallback-value {
    display: flex;
    /* Shows the primary metric value only */
  }
}
```

**Table widgets:**
```css
.table-widget {
  container: table / inline-size;
}

/* Wide (> 600px): full table with all columns */
/* Medium (400-600px): hide low-priority columns */
@container table (max-width: 600px) {
  [data-priority="low"] { display: none; }
}

/* Narrow (300-400px): hide medium-priority columns too */
@container table (max-width: 400px) {
  [data-priority="medium"] { display: none; }
  td, th { padding: var(--space-1) var(--space-2); font-size: var(--text-xs); }
}

/* Very narrow (< 300px): switch to card layout */
@container table (max-width: 300px) {
  /* Table transforms to stacked cards: each row becomes a card
     with label:value pairs vertically stacked */
  thead { display: none; }
  tr {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    border-bottom: 1px solid var(--border-default);
  }
  td {
    display: flex;
    justify-content: space-between;
    padding: var(--space-1) 0;
  }
  td::before {
    content: attr(data-label);
    font-weight: 500;
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
}
```

Table columns MUST carry a `data-priority` attribute: `high` (always shown),
`medium` (hidden below 400px), `low` (hidden below 600px). The admin sets
column priority in the grid definition editor. Default: first 3 columns
are high, next 3 medium, rest low.

**Sidebar navigation items:**
On icon-only mode (laptop breakpoint), labels are hidden, icons centered.
On full mode, labels truncate with ellipsis if the sidebar width can't
fit them (edge case with very long section names in i18n).

**Filter bar:**
```css
.filter-bar {
  container: filter-bar / inline-size;
}

/* Wide: filters in a horizontal row */
.filter-bar-inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Narrow (< 600px): filters stack, 2 per row */
@container filter-bar (max-width: 600px) {
  .filter-item {
    flex: 1 1 calc(50% - var(--space-2));
    min-width: 0;  /* prevent overflow */
  }
}

/* Very narrow (< 400px): filters stack vertically */
@container filter-bar (max-width: 400px) {
  .filter-item {
    flex: 1 1 100%;
  }
  .filter-bar-inner {
    flex-direction: column;
  }
}
```

Filter value display in chips must truncate. A chip showing
"Europe, Asia, North America, South America" truncates to
"Europe, Asia +2" at narrow widths.

**Catalog artifact cards:**
Name: `truncate` (ellipsis). Always single line.
Description: `line-clamp-2`. Two lines max, then ellipsis.
Metadata: `truncate`. "Updated 2h ago" never wraps.
The entire card has `min-width: 0` and `overflow: hidden` to prevent
any child from pushing the card wider than its container.

**Breadcrumbs:**
On narrow containers, intermediate breadcrumb segments collapse to "...":
`Catalog > ... > Widget: Revenue Chart`. Only the first and last
segment are always visible. The collapsed "..." expands on click to show
the full path as a dropdown.

**Dashboard canvas widget slots:**
Each slot uses container queries. The widget inside adapts to the slot's
actual pixel width, not the viewport. A KPI card in a 2-column slot at
200px wide renders in compact mode. The same KPI card in a 6-column slot
at 600px renders in full mode. This is the same card component, the same
code. Container queries handle the adaptation.

### 1.7 Mobile-specific interaction patterns

**Touch targets:** Every interactive element is minimum 44x44px on mobile
(already in phozart-ui accessibility constraints). On desktop, buttons can
be smaller (32px height) because pointer precision is higher.

**Swipe gestures:**
- Swipe left on an artifact card: reveal action buttons (Delete, Share)
  as a slide-out panel, iOS-style
- Swipe right on a filter chip: clear that filter
- Swipe down on a modal/drawer: dismiss
- Swipe between tabs in the bottom tab bar: switch sections

**Bottom sheets:** On mobile, all panels that are side-drawers on desktop
become bottom sheets. They slide up from the bottom, cover 60-90% of the
screen, and have a drag handle at the top for resize/dismiss.

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: var(--bg-base);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-2xl);
  padding: var(--space-4);
  z-index: 60;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.bottom-sheet-handle {
  width: 32px;
  height: 4px;
  background: var(--border-emphasis);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-4);
}
```

**Mobile dashboard viewing:**
- Filter bar collapses to a single row showing active filter count:
  "3 filters active [Edit]". Tapping opens the full filter bar as a
  bottom sheet.
- Widgets stack vertically (single column). The LayoutIntent auto-grid
  with `minItemWidth` naturally collapses to one column.
- KPI cards switch to mini/compact mode via container queries.
- Charts maintain aspect ratio but use the full screen width.
- Tables switch to card layout below 300px (container query above).
- Cross-filtering: tap a chart segment to see a bottom sheet with
  filter options rather than immediately applying (avoids accidental
  taps on touch).

**Mobile explorer:**
- Field palette becomes a horizontal scrollable strip at the top
  (chips with field names and type icons).
- Drop zones stack vertically with clear zone labels.
- Preview shows table by default (charts are less useful at narrow widths).
- The save toolbar moves to the bottom of the screen, fixed, clearing
  the bottom tab bar.

**Mobile dashboard builder (admin/author):**
- The canvas is full-screen. No side panels.
- Tap a widget to select it. A floating action bar appears at the bottom
  with Configure, Duplicate, Delete.
- "Configure" opens the config panel as a bottom sheet.
- Adding widgets: tap "+" button → bottom sheet shows widget palette as
  a scrollable grid.
- Drag-and-drop is replaced by tap-to-select-then-tap-to-place: tap a
  widget type in the palette, then tap a drop zone in the canvas.

### 1.8 Global overflow prevention rules

These CSS rules apply to the workspace root and cascade to all children.
They are the safety net that prevents any text from going off-screen.

```css
/* Applied to the workspace shell root */
.phz-workspace {
  overflow-x: hidden;  /* never horizontal scroll on the workspace */
}

/* All text containers default to truncation */
.phz-workspace h1, .phz-workspace h2, .phz-workspace h3,
.phz-workspace h4, .phz-workspace h5, .phz-workspace h6 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Body text uses word-break for long content */
.phz-workspace p, .phz-workspace li, .phz-workspace td {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Numeric values in mono never wrap */
.phz-workspace [data-value], .phz-workspace .mono-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Flex children must not push parents wider */
.phz-workspace [class*="flex"] > * {
  min-width: 0;
}

/* Grid children must not push parents wider */
.phz-workspace [class*="grid"] > * {
  min-width: 0;
  overflow: hidden;
}
```

The `min-width: 0` rule on flex and grid children is the single most
important overflow prevention. Without it, flex/grid items have an
implicit `min-width: auto` that prevents them from shrinking below
their content width, which is what causes values to extend beyond
card boundaries.

On mobile, the content area gets:
```css
@media (max-width: 768px) {
  .workspace-content {
    padding: var(--space-3);  /* tighter padding */
  }

  /* All cards get consistent mobile sizing */
  .artifact-card, .widget-slot, .filter-item, .field-chip {
    max-width: 100%;
  }
}
```

---

## 2. Catalog Browser

The catalog is the primary landing view. It uses the SPLIT-PANEL archetype
from phozart-ui: left side is the artifact list (70%), right side is a
preview panel (30%) that shows details of the selected artifact.

### 2.1 Catalog list

Three visibility tabs at the top of the list:

```css
.catalog-tabs {
  display: flex;
  gap: var(--space-1);
  padding: 0 0 var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

.catalog-tab {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.catalog-tab.active {
  color: var(--text-primary);
  background: var(--bg-emphasis);
}

.catalog-tab .count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: var(--space-2);
}
```

Tabs: "My Work (12)", "Shared (5)", "Published (23)".
Below tabs: search bar + type filter chips.

Search bar: full-width input with Phosphor MagnifyingGlass icon inline.
Rounded (radius-lg), subtle border, placeholder "Search dashboards,
reports, KPIs..."

Type filter chips: horizontal row of toggleable chips for artifact types.
`Dashboard`, `Report`, `Grid`, `KPI`. All active by default. Clicking
toggles visibility. Active chips: `--bg-emphasis` background.

### 2.2 Artifact cards

Each artifact renders as a card in a vertical list (not a grid, cards
are information-dense, not visual thumbnails).

```css
.artifact-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 150ms ease-out;
}

.artifact-card:hover {
  background: var(--bg-muted);
}

.artifact-card.selected {
  background: var(--bg-emphasis);
  box-shadow: inset 3px 0 0 0 var(--info-500);  /* #3B82F6 */
}
```

Card content (left to right):
1. Type icon (Phosphor): ChartBar for dashboard, Table for report,
   GridFour for grid, Target for KPI, Gauge for metric. Color: `--text-muted`.
   Selected: `--info-500`.
2. Name + description. Name: text-sm, font-weight 500, `--text-primary`.
   Description: text-xs, `--text-muted`, single line truncated.
3. Status badges (right-aligned):
   - Visibility: Phosphor Eye (published), Users (shared), Lock (personal).
     Icon only, 16px, `--text-muted`.
   - Breach indicator: small red dot if active critical breaches exist.
   - Draft indicator: text-xs chip "Draft" in `--warning-500` bg if unsaved
     draft changes exist.
4. Metadata: `Updated 2h ago` in text-xs, font-mono, `--text-faint`.

### 2.3 Preview panel

Right panel shows details of the selected artifact. Sticky-positioned,
scrolls independently.

Header: artifact name (text-xl, font-weight 600), type badge, visibility
badge, owner name (text-xs, `--text-muted`).

Body:
- Thumbnail/preview image if available (dashboard screenshot or chart preview)
- Description (full text, not truncated)
- Metadata table: created date, last modified, data source(s), widget count
  (for dashboards), column count (for grids), alert count. All metadata in
  compact rows with label (text-xs, `--text-muted`, font-weight 500) and
  value (text-sm, font-mono for dates and counts).
- Published routes (if any): list of `PlacementRecord` routes with role badges.
- Active breaches section (if any): breach severity, rule name, target KPI,
  time since transition. Uses Console mode status indicators.

Actions (bottom of preview panel):
- Primary: "Open" button (full-width, `--info-500` bg, white text, radius-lg,
  font-weight 600)
- Secondary row: "Duplicate", "Export", "Delete" as text buttons with icons.
  Delete in `--error-500`. Others in `--text-secondary`.

When no artifact is selected, the preview panel shows an empty state:
centered Phosphor Cube icon (48px, `--text-faint`), "Select an artifact
to see details" in text-sm, `--text-muted`.

---

## 3. Data Explorer

The explorer uses a custom layout: field palette (left), drop zones +
preview (center/right). This is a workspace-specific composition, not a
standard archetype.

### 3.1 Field palette

Left panel, 260px wide. Background: `--bg-subtle`. Scrollable.

Data source selector at top: dropdown styled as a compact select with
the data source name and a Phosphor Database icon.

Below: field list grouped by type (Numbers, Categories, Dates, Other).
Group headers: text-xs, uppercase, `--text-muted`, font-weight 600.

Each field item:
```css
.field-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: background 150ms ease-out;
}

.field-item:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}
```

Type icons: Phosphor Hash (number), Phosphor TextAa (string), Phosphor
Calendar (date), Phosphor ToggleRight (boolean). 16px, `--text-muted`.

Cardinality badge: text-xs, font-mono, `--text-faint`, right-aligned.
"42 vals" for low-card, "10K+" for high-card.

Dragging: field becomes a floating chip with the field name, slight
rotation (2deg), elevated shadow (`--shadow-lg`), 80% opacity on the
source position.

### 3.2 Drop zones

Four horizontal drop zones above the preview area. Each zone is a
distinct target.

```css
.drop-zone {
  min-height: 48px;
  padding: var(--space-2) var(--space-3);
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  transition: border-color 200ms ease-out, background 200ms ease-out;
}

.drop-zone.drag-over {
  border-color: var(--info-500);
  background: rgba(59, 130, 246, 0.04);
}

.drop-zone.has-items {
  border-style: solid;
  border-color: var(--border-emphasis);
  background: var(--bg-subtle);
}
```

Zone labels: text-xs, font-weight 500, `--text-muted`, positioned as
a floating label above the top-left corner of the zone. Labels: "Rows",
"Columns", "Values", "Filters".

Dropped fields render as chips:
```css
.field-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
  background: var(--bg-base);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
  cursor: grab;
}

.field-chip .remove {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  transition: all 150ms;
}

.field-chip .remove:hover {
  background: var(--error-500);
  color: white;
}
```

Value chips show the aggregation function as a dropdown trigger:
"Revenue (SUM)" where "(SUM)" is clickable, text-xs, `--info-500`,
opens the aggregation picker inline.

### 3.3 Preview area

Below the drop zones. Takes the remaining vertical space.

Three mode tabs at the top-right of the preview:
"Table", "Chart", "SQL". Same tab style as catalog tabs.

**Table preview**: Uses Console mode dense data table styling.
Headers: text-xs, uppercase, tracking-wider, `--text-muted`, font-weight
600. Data cells: font-mono for numbers, font-sans for text. Alternating
row backgrounds: `--bg-base` / `--bg-subtle`. Row hover: `--bg-muted`.

Conditional heat-map coloring on numeric cells: gradient from
`--bg-subtle` (low) to a light tint of `--info-500` (high) at 8% opacity.
The gradient is relative to the column's min/max.

**Chart preview**: renders the auto-suggested chart type using the
dashboard widget components. Wrapped in a card with `--shadow-md`, padding
`--space-6`, `--radius-lg`.

**SQL preview**: monospace code block with syntax highlighting.
Background: `--header-bg` (#1C1917). Text: `--header-text`. Keywords
highlighted in `--info-500`. A "Copy" button (Phosphor Copy, icon-only)
in the top-right corner.

### 3.4 Save toolbar

Fixed at the bottom of the explorer, above any content.
```css
.explorer-save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-base);
  border-top: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
}
```

Left: "Showing 1,000 of 42,500 rows" in text-xs, font-mono, `--text-muted`.
Right: "Save as Report" button (primary, `--info-500` bg), "Add to Dashboard"
button (secondary, outline). Both radius-lg, font-weight 600.

---

## 4. Dashboard Builder

The dashboard builder uses a custom three-panel layout: widget palette
(left), canvas (center), configuration panel (right, contextual).

### 4.1 Widget palette

Left panel, same width and style as the explorer field palette (260px,
`--bg-subtle`). Shows available widget types from the registry, grouped
by category.

Categories: "Charts", "KPI & Status", "Tables", "Layout", "Custom".
Group headers same style as field palette groups.

Each widget type item:
```css
.widget-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all 200ms ease-out;
  text-align: center;
}

.widget-type-item:hover {
  background: var(--bg-muted);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
```

Each item shows: Phosphor icon (24px, `--text-secondary`), label below
(text-xs, `--text-muted`). Items arranged in a 2-column grid within the
palette.

Greyed-out items: widget types not in `ConsumerCapabilities.widgetTypes`
are shown with 40% opacity and a tooltip: "Not supported in this deployment."

### 4.2 Canvas

Center area. Renders the LayoutIntent tree as a live preview of the
dashboard. Background: `--bg-muted` (simulating the consumer's background
to show shadow contrast).

Widget slots on the canvas:
```css
.canvas-widget-slot {
  background: var(--bg-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  min-height: 120px;
  transition: box-shadow 200ms, outline 200ms;
}

.canvas-widget-slot:hover {
  box-shadow: var(--shadow-lg);
}

.canvas-widget-slot.selected {
  outline: 2px solid var(--info-500);
  outline-offset: 2px;
}

.canvas-widget-slot.drop-target {
  outline: 2px dashed var(--info-500);
  outline-offset: 2px;
  background: rgba(59, 130, 246, 0.02);
}
```

Each widget slot shows a miniature preview of the widget content when
data is available, or a placeholder when not:

Placeholder (no data bound):
```css
.widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  color: var(--text-faint);
  gap: var(--space-2);
}
/* Icon: Phosphor type-appropriate icon, 32px */
/* Label: text-sm, "Click to configure" */
```

Floating widget toolbar: appears on hover/selection, positioned above the
widget. Contains: Configure (Phosphor GearSix), Duplicate (Phosphor Copy),
Delete (Phosphor Trash), Set Alert (Phosphor Bell), View Data (Phosphor Table).
Uses the Console mode floating contextual toolbar pattern from phozart-ui.

Drop zones between widgets: 8px tall transparent strips that expand to
24px on drag-over, with a horizontal line indicator in `--info-500`.

### 4.3 Configuration panel (right)

Right panel, 360px wide. Slides in when a widget is selected. Background:
`--bg-base`. Left border: `--border-default`.

Panel header: widget type icon + name, close button (Phosphor X).

Tab bar for config sections: "Data", "Appearance", "Interactions",
"Navigation". Tabs use the same style as catalog tabs.

**Data tab**: data source selector, field pickers for dimension/measures
(same drag-drop field chips as explorer), aggregation pickers, filter
configuration.

**Appearance tab**: auto-generated from WidgetManifest.configSchema using
the Zod-to-form convention from WORKSPACE-CONVENTIONS.md Part 1.3. Each
Zod field type maps to the appropriate input component.

Form fields follow Console mode density (compact: 8px vertical padding
between fields). Labels: text-xs, font-weight 500, `--text-muted`, above
the input. Inputs: `--bg-subtle` background, `--border-default` border,
radius-md, text-sm. Focus: `--info-500` border, `--shadow-xs` ring.

**Interactions tab**: drill-through links, cross-filter configuration,
click action picker.

**Navigation tab**: navigation link editor from section 4.4 of the main
instructions. Target artifact picker, filter mapping, open mode selector.

### 4.4 Filter bar editor

When the admin clicks "Configure Filters" in the dashboard builder header,
a horizontal panel slides down between the header and the canvas showing
the filter bar configuration.

This panel is full-width, background `--bg-subtle`, padding `--space-4`,
border-bottom `--border-default`. It shows the current `DashboardFilterRef`
entries as cards in a horizontal scrollable row. Each card shows: filter
name, type icon, query layer badge (server/client), and a configure button.

Drag fields from the data source schema (available via a small field palette
that appears in this panel) onto the filter bar to add filters. The workspace
checks for existing FilterDefinitions and prompts accordingly (section
1.0.2 of WORKSPACE-DATA-INTERACTION.md).

### 4.5 Preview mode

Toggled via the Phosphor Eye button in the header. When active:
- The widget palette and configuration panel hide
- The canvas expands to full width
- A device-size selector appears in the header: Desktop (1440px),
  Tablet (768px), Mobile (375px). The canvas constrains to the selected
  width, centered, with `--bg-muted` gutters.
- The filter bar renders at the top (interactive, as the end user would see it)
- Widgets render with live data from the DataAdapter
- "Preview as..." dropdown (admin only): enter viewer attributes to simulate
  data-level filtering

Preview mode header bar changes to a distinct color (`--info-500` at 10%
opacity background) to clearly distinguish edit mode from preview mode.

---

## 5. Role-Specific Shell Variants

### 5.1 Admin shell (full)

All three sidebar sections visible. Full toolbar in header. All designer
tools accessible. This is the default specification above.

### 5.2 Author shell

Same layout as admin, but:
- GOVERN section hidden from sidebar
- In designers: "Filters" tab shows read-only view of which filters
  are configured (cannot modify filter contracts, validation, or transforms)
- No "Publish" action on artifact cards
- "Set Alert" shortcut hidden from widget toolbar
- "Preview as..." not available (no viewer simulation)

### 5.3 Viewer shell

Different layout entirely. No sidebar. No designers.

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER (same dark frame, simpler)                               │
│  ┌──────────────────────────────────────────┬─────────────────┐  │
│  │ PHZ   Search...                          │ Presets ▾ │ User│  │
│  └──────────────────────────────────────────┴─────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Published ────────────────────────────────────────────────┐  │
│  │  [Dashboard Card]  [Dashboard Card]  [Report Card]         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Shared with me ──────────────────────────────────────────┐  │
│  │  [Dashboard Card]                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ My Work ─────────────────────────────────────────────────┐  │
│  │  [Dashboard Card]  [Report Card]                           │  │
│  │                                    [+ Explore data]        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Artifact cards in viewer mode are visual, not list items. They use the
Surface mode card pattern (shadow-defined, lift on hover, radius-lg).
Each card shows: artifact name (text-lg, font-weight 600), type icon,
a mini thumbnail if available, and "Updated 2h ago" timestamp.

Clicking a card opens the artifact full-screen (replaces the card view)
with the filter bar at top and a back button in the header.

The "Presets" dropdown in the header shows the viewer's personal presets
and any published/shared presets for the currently open artifact.

"Explore data" link at the bottom of "My Work" opens the visual query
explorer. This is the viewer's path to creating personal content.

---

## 6. Component Patterns

### 6.1 Artifact type colors

Each artifact type has a consistent accent color used for icons, badges,
and subtle backgrounds:

```
Dashboard: --info-500    (#3B82F6)   blue
Report:    --color-emerald (#10B981) emerald
Grid:      --color-violet  (#8B5CF6) violet
KPI:       --color-coral   (#F97316) coral/orange
Metric:    --color-amber   (#F59E0B) amber
Template:  --color-cyan    (#06B6D4) cyan
Filter:    --color-lime    (#84CC16) lime
Alert:     --primary-500   (#EF4444) red
```

These colors appear as: sidebar icon tint when active, artifact card left
border or icon color, badge backgrounds at 8% opacity, designer header
accent.

### 6.2 Status badges

Reuse Console mode status indicators from phozart-ui:
```
Published:  bg-[#F0FDF4] text-[#16A34A]  (success tint)
Shared:     bg-[#EFF6FF] text-[#2563EB]  (info tint)
Personal:   bg-[#F5F4F2] text-[#A8A29E]  (neutral tint)
Draft:      bg-[#FFFBEB] text-[#D97706]  (warning tint)
Breach:     bg-[#FEF2F2] text-[#DC2626]  (error tint)
Processing: bg-[#F5F3FF] text-[#7C3AED]  (violet tint)
```

Font: text-xs, font-weight 500, padding `2px 8px`, radius-full.

### 6.3 Form patterns

All forms in the workspace follow Console mode compact density.

Label: text-xs, font-weight 500, `--text-muted`, margin-bottom 4px.
Input: height 36px, padding 8px 12px, `--bg-subtle` background,
`--border-default` border, radius-md, text-sm.
Focus: border-color `--info-500`, ring `0 0 0 2px rgba(59, 130, 246, 0.1)`.
Error: border-color `--error-500`, error message text-xs `--error-500` below.

Select dropdowns: same styling as inputs. Phosphor CaretDown icon right-aligned.
Toggles: 40px wide, 24px tall, `--bg-muted` off, `--info-500` on, radius-full.
Checkboxes: 18px, radius-sm, `--info-500` checked.

### 6.4 Modal and drawer patterns

Modals: centered, max-width 560px for forms, 800px for previews.
Background overlay: `rgba(28, 25, 23, 0.5)`, backdrop-filter `blur(4px)`.
Modal surface: `--bg-base`, radius-xl, `--shadow-2xl`, padding `--space-6`.
Header: title + close button (Phosphor X). Footer: action buttons right-aligned.
Entry animation: opacity 0→1, translateY(8px)→0, 200ms ease-out.

Drawers: slide from right, 400-560px wide. Same surface styling as modal.
Full-height, with internal scrolling. Used for: configuration panels,
detail source views, filter editors opened from context.

### 6.5 Empty states

Follow phozart-ui Console mode empty states: geometric shapes only (no
illustrations), centered, specific actionable messaging, primary CTA button.

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  color: var(--text-faint);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 360px;
  margin-bottom: var(--space-6);
}
```

Specific empty states per context (from WORKSPACE-CONVENTIONS.md Part 3.8):
Each has a Phosphor icon, a title, a description, and a primary action button.

### 6.6 Loading patterns

Skeleton screens match content shape. Use `--bg-muted` for skeleton blocks
with a shimmer animation:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-muted) 25%,
    var(--bg-emphasis) 50%,
    var(--bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

Dashboard loading skeleton: shows the layout structure with skeleton blocks
in widget slot positions. The layout renders from the LayoutIntent tree
before data arrives, so the user sees the spatial structure immediately.

---

## 7. Verification Checklist for the Workspace

Before presenting any workspace UI component, verify against phozart-ui
Section 3:

**Spatial composition**: figure-ground clarity between sidebar, content,
and panels. Visual flow from header through sidebar to content.

**Console mode compliance**: dark header frame present, monospace for
data values, compact density in forms and tables, status indicators
use the dot+label pattern.

**Token compliance**: all colors from the phozart-ui palette, all spacing
on 8px grid, all radii 12-16px (never sharp), all shadows multi-layer.

**Distinctiveness**: the workspace should not look like a generic admin
panel. The warm neutral palette, the floating shadow-defined surfaces,
the precision-instrument density, and the red accent on the active
sidebar item collectively produce a recognizable character.

**Anti-patterns avoided**: no thin 1px card borders (shadows define
surfaces), no sharp corners, no Font Awesome icons, no single-layer
shadows, no modals where drawers work better, no generic spinners
(skeleton screens always), no decorative elements without function.

**Overflow prevention**: no text overflows its container on any screen
size. Test by resizing the browser from 1440px to 320px width. At no
point should horizontal scrollbars appear on the workspace or any
text/number extend beyond a card or cell boundary. Verify: `min-width: 0`
on all flex/grid children, `overflow: hidden` + `text-overflow: ellipsis`
on all single-line text, `word-break: break-word` on all multi-line text.

**Container query compliance**: every widget renders correctly at 160px,
280px, 400px, and 600px container width. Test by placing the same widget
in different layout slot sizes. The widget must not break, overflow, or
become unreadable at any size. Content hides progressively (sparkline
first, then delta, then labels abbreviate, then chart replaces with
single value).

**Mobile verification**: test the full flow on a 375px viewport (iPhone SE).
Verify: bottom tab bar clears safe-area-inset, all tap targets are 44px+,
bottom sheets dismiss on swipe-down, filter bar collapses to count+edit,
tables switch to card layout, KPI cards switch to compact mode, no
horizontal scroll anywhere.
