# phz-grid — User Guide

> **Audience**: Business analysts, report consumers, and viewers who interact
> with phz-grid to explore dashboards, apply filters, navigate between
> reports, and manage their personal preferences.
>
> No technical knowledge required.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [The Three Environments](#2-the-three-environments)
3. [Browsing the Catalog](#3-browsing-the-catalog)
4. [Working with Dashboards](#4-working-with-dashboards)
5. [Using Filters](#5-using-filters)
6. [Navigating Between Artifacts (Drill-Through)](#6-navigating-between-artifacts-drill-through)
7. [Personalizing Your View](#7-personalizing-your-view)
8. [Viewing on Mobile](#8-viewing-on-mobile)
9. [Working with Your Own Data (Local Mode)](#9-working-with-your-own-data-local-mode)
10. [Detail Panels](#10-detail-panels)
11. [Understanding Error and Empty States](#11-understanding-error-and-empty-states)
12. [Alert Subscriptions](#12-alert-subscriptions)
13. [Common Features Across Shells](#13-common-features-across-shells)
14. [Tips & Keyboard Shortcuts](#14-tips--keyboard-shortcuts)
15. [Creating and Editing (Author Role)](#15-creating-and-editing-author-role)
16. [Glossary](#glossary)

---

## 1. Getting Started

### Opening phz-grid

Your organization will provide you with a link. Open it in your browser — no
installation needed. Sign in with the credentials your administrator set up
for you.

[Screenshot placeholder: sign-in screen]

### Which Environment Will I See?

When you sign in, phz-grid opens the environment that matches your role
automatically. You do not need to choose — the system routes you to the right
place. See Section 2 for details on each environment.

### The Screen Layout

Once you sign in, you'll see three main areas:

- **Header (top bar)**: Your account icon, the workspace name, a search
  field, and the attention bell icon. On smaller screens this bar is compact
  and search moves into a pop-up.
- **Sidebar (left panel)**: Navigation between Catalog, Dashboards, and
  Explore (or a bottom tab bar on mobile). If you don't see a sidebar, your
  role may not require one — you'll navigate through the Catalog instead.
- **Content area (main section)**: This is where dashboards, reports, grids,
  and KPI cards are displayed.

[Screenshot placeholder: annotated layout with header/sidebar/content labels]

### Your Role: What You Can See and Do

phz-grid has three roles. Your administrator assigns your role when they
set up your account.

| Role | Environment | What you can do |
|------|-------------|----------------|
| **Viewer** | Viewer shell | Browse the catalog, open dashboards and reports, apply filter presets, view KPIs, subscribe to alerts |
| **Author** | Editor shell | Everything Viewers can do, plus create and edit your own dashboards, reports, filters, and personal alerts |
| **Admin** | Workspace shell | Everything Authors can do, plus publish artifacts, manage permissions, configure alerts, and govern the system |

As a **Viewer**, you'll see a card-style catalog and can open any published
artifact. You can apply saved filter presets and subscribe to alerts but cannot
create new filter definitions.

As an **Author**, you see the full sidebar with Content and Data sections,
a curated measure palette, and can create and save your own work.

As an **Admin**, you have full access to all configuration, governance, and
publishing tools.

---

## 2. The Three Environments

phz-grid v15 introduces a **three-shell architecture**. Each shell is a
complete environment tailored to a specific role:

### Workspace (Admin Shell)

The Workspace is the full administration environment. Admins use it to:

- Define and publish data sources, dashboards, reports, and alert rules.
- Manage user permissions and row-level security.
- Configure the measure registry (curated business metrics).
- Set up filter definitions and cascading dependencies.
- Review and approve artifacts submitted for publishing.
- Monitor usage analytics and system health.

### Editor (Author Shell)

The Editor is a constrained authoring environment. Authors use it to:

- Create and edit dashboards with a freeform grid layout.
- Build reports with up to 30+ columns, conditional formatting, and micro-widget
  cell renderers (sparklines, gauges, deltas).
- Work with curated measures from the measure registry palette (instead of raw
  database fields).
- Set up personal alert rules and manage subscriptions.
- Share artifacts with specific users, roles, or teams.
- Submit artifacts for publishing (admin approval required).

### Viewer (Analyst Shell)

The Viewer is a read-only consumption environment. Analysts use it to:

- Browse and open published dashboards, reports, and grids.
- Apply filters and save personal filter presets.
- Use the Visual Query Explorer for ad-hoc analysis.
- Subscribe to alert rules and receive breach notifications.
- View alert-aware widgets (KPI cards showing health status).
- Explore impact chains for root cause analysis.

### Switching Between Environments

Most users work in a single environment based on their role. If your account
has multiple roles, you can switch environments from the account menu in the
header. Your work and preferences persist across switches.

---

## 3. Browsing the Catalog

### The Catalog

The Catalog is your starting point. It shows everything available to you:
dashboards, reports, grids, KPI sets, and filter presets.

[Screenshot placeholder: catalog with three tabs — My Work / Shared / Published]

### My Work, Shared, and Published Tabs

The Catalog has three tabs:

- **My Work**: Drafts and artifacts you created yourself. Only you can see
  these unless you share them.
- **Shared**: Artifacts that colleagues have shared with your role or team.
- **Published**: Finalized artifacts that your organization has made available
  to everyone with access.

### Artifact Cards: Icons and Colors

Each item in the Catalog appears as a card with a color-coded icon that tells
you what type of artifact it is:

| Color | Type | What it is |
|-------|------|-----------|
| Blue | Dashboard | A page of widgets — KPI cards, charts, and tables |
| Emerald (green) | Report | A tabular data report with sorting and filtering |
| Violet | Grid | A detailed data grid for exploring rows |
| Orange | KPI | A single key metric with target and trend |
| Red | Alert Rule | An automated condition that fires when a metric breaches a threshold |

Each card also shows a **status badge**:
- **Published** — available to everyone with access
- **Draft** — not yet published; only visible to you (or the author)

### Searching and Filtering the Catalog

Type in the search box at the top of the Catalog to find artifacts by name or
description. The list filters in real time as you type.

[Screenshot placeholder: catalog search in progress]

### Preview Panel

When you click on a card without opening it (hover or single-click depending
on your workspace configuration), a **preview panel** slides in on the right.
It shows the artifact's description, last updated date, and a quick summary.

Click **Open** in the preview panel to open the artifact in full.

### Duplicating a Shared Artifact to My Work

If you want to customize a shared artifact for your own use without affecting
the original:

1. Open the artifact's preview panel (or right-click the card).
2. Click **Duplicate**.
3. A copy appears in your **My Work** tab with "(Copy)" added to the name.
4. Open your copy and edit it freely — changes don't affect the original.

---

## 4. Working with Dashboards

### Opening a Dashboard

Click any dashboard card in the Catalog to open it. The workspace navigates to
the dashboard and begins loading data immediately.

[Screenshot placeholder: dashboard loading with skeleton placeholders]

### The Loading Indicator

When a dashboard opens, you'll notice it appears quickly with approximate or
summary numbers first, then updates to full detail within a few seconds. This
is intentional:

- **Fast initial view** (preload): The workspace fetches a lightweight version
  of the data immediately so you aren't staring at a blank screen. KPI cards
  and chart shapes appear right away.
- **Full data** (loads in parallel): At the same time, the workspace fetches
  the complete dataset in the background. When this finishes, the widgets
  update automatically with precise numbers.

You'll see a subtle progress indicator in the header while the full load is
in progress. Once it disappears, all data is final.

> This two-step approach is by design — it means you can start reading the
> dashboard in seconds even when the underlying query takes longer.

### Dashboard Widgets

A dashboard can contain:

- **KPI Cards**: A single number (e.g., Total Revenue) with a comparison to
  a previous period and a small trend sparkline.
- **Charts**: Bar charts, line charts, pie charts, and area charts that
  visualize aggregated data.
- **Tables / Grids**: Rows of detailed data, sortable and scrollable.
- **Trend Lines**: Time-series charts showing direction over a date range.
- **Gauges**: Circular indicators showing a value relative to a target.

[Screenshot placeholder: example dashboard with KPI cards on top, bar chart below]

Each widget adapts to its available space — a chart in a narrow column will
hide its legend and simplify to show fewer labels. On very small panels, a
chart may reduce to a single summary number.

---

## 5. Using Filters

### The Filter Bar

Most dashboards and reports have a **filter bar** near the top of the content
area. It shows available filters such as a region picker, a date range, or a
category selector.

[Screenshot placeholder: filter bar with three active filters]

### Filter Types

You may encounter these filter controls:

| Control | What it looks like | How to use it |
|---------|-------------------|---------------|
| **Select** | A single-item dropdown | Click and choose one option |
| **Multi-select** | A dropdown with checkboxes | Click and check multiple options |
| **Date range** | Two date pickers or a calendar | Pick a start date and end date, or choose a quick preset (This Month, Last 90 Days, etc.) |
| **Text search** | A free-text input box | Type any value to filter by it |
| **Number range** | A slider or two number fields | Drag the slider or type min/max values |
| **Toggle** | A yes/no switch | Flip to include or exclude a boolean field |

### Applying Filters

1. Click the filter control you want to change.
2. Choose your value(s).
3. The content updates automatically when you close the control (or, for some
   filters, as you select).

Some filters are marked with an asterisk (**\***) — these are **required**
and must have a value before the data loads. If you see a prompt asking you to
select a value before you can view the dashboard, set those required filters
first.

### Server Filters vs. Client Filters

You may notice that some filter changes cause a brief reload while others
update instantly:

- **Server filters** (reload): The value is sent to the data source and the
  query is re-executed. This happens for complex filters over large datasets.
  You'll see the loading indicator briefly.
- **Client filters** (instant): The workspace already has the data and applies
  the filter locally in your browser. No reload needed.

Both types look identical in the filter bar — the difference is just in
response time.

### Restricted Filters

Some filter options may be **greyed out or hidden** based on your account. For
example, if your access is limited to a specific region, you won't be able to
select other regions. This is a security feature — your administrator
configures which data values are available to you. It is not a bug.

### Saving Filter Presets

If you frequently use the same combination of filters, you can save them as a
**preset**:

1. Set the filters to the combination you want.
2. Click **Save Preset** (or the bookmark icon, depending on your workspace
   configuration).
3. Give the preset a name (e.g., "Q4 North America").
4. Next time, select your preset from the **Presets** dropdown to restore all
   filter values at once.

[Screenshot placeholder: filter preset save dialog]

Presets you save in **My Work** are personal — only you see them. If your role
allows sharing, you can set a preset to **Shared** so teammates can use it too.

> **Note**: If a data source changes (fields removed or values deprecated), your
> saved preset may silently drop the affected filter values. The preset still
> applies, but without the removed filters. If a preset seems to return more
> data than expected, check whether any of its filter values are still valid in
> the current data source.

### Resetting Filters to Defaults

Click the **Reset** button (or the circular arrow icon) in the filter bar to
clear all your changes and return to the dashboard's default filter values.

### Cross-Filtering Between Widgets

Cross-filtering lets you click on a chart element to filter all other widgets
on the same dashboard.

**How it works:**

1. Click a bar in a bar chart, a slice in a pie chart, or a data point in a
   line chart.
2. All other widgets on the dashboard automatically filter to show only data
   matching your selection.
3. The selected element is highlighted; other elements dim.

**Clearing cross-filters:**

- Click the same element again to remove the cross-filter.
- Or click the **Reset** button in the filter bar.
- Cross-filters are temporary — they are NOT saved to filter presets.

**Example:** On a sales dashboard, clicking "Electronics" in a category bar
chart filters the revenue KPI, trend line, and data grid to show only
Electronics data.

---

## 6. Navigating Between Artifacts (Drill-Through)

### Clicking Linked Elements

Some values in reports, charts, and grids are clickable — they have an
underline or change color when you hover over them. Clicking these triggers
**drill-through navigation**: the workspace opens a related artifact (such as
a detail report) pre-filtered to the value you clicked.

For example:
- Click a region name in a bar chart → opens a regional detail report filtered
  to that region.
- Click a product row in a grid → opens a product-level KPI page.
- Click a cell in a table → opens a slide-out panel with more detail rows.

[Screenshot placeholder: table with a clickable underlined cell value]

### How Filter Context Travels With You

When you drill through, your current filter values travel to the destination
artifact. If you were viewing Q4 data and you drill into a region, the
destination opens showing Q4 data for that region.

Some filter values may not transfer if the destination artifact doesn't have a
matching filter — in that case, the destination opens with its default filters.

### Navigation Modes

Depending on how the workspace is configured, clicking a linked element can
open the destination in different ways:

| Mode | What happens |
|------|-------------|
| **Replace view** | The current artifact is replaced by the destination |
| **Side panel** | A panel slides in from the right, keeping the current dashboard visible behind it |
| **Modal** | A full-screen overlay opens on top of the current view |
| **New tab** | The destination opens in a new browser tab |

### Going Back

- If the destination opened in a **side panel or modal**, click the **X** or
  press **Escape** to close it and return to the original view.
- If the destination **replaced the current view**, use the breadcrumb trail
  at the top of the page to navigate back (e.g., "Sales Ops > Regional Detail").
- If it opened in a **new tab**, simply close that tab.

---

## 7. Personalizing Your View

### What You Can Personalize

For reports and grids, you can change how data is presented without affecting
what other users see:

- **Sort order**: Click a column header to sort ascending or descending.
- **Grouping**: If enabled, drag a column header to the group-by area to group
  rows by that field.
- **Column order**: Drag column headers left or right to reorder them.
- **Density**: Switch between **Compact** (more rows visible, tighter spacing),
  **Dense** (medium), and **Comfortable** (spacious, larger text).
- **Column visibility**: Right-click a column header or use the column chooser
  icon to hide or show columns.

[Screenshot placeholder: column chooser panel]

### Saving as a Personal Preset

After you adjust the view to your liking:

1. Click **Save View** or the bookmark icon.
2. Give it a name (e.g., "My Revenue View — Sorted by Region").

Your saved view appears in the **Views** dropdown. Selecting it restores your
exact sort, grouping, column order, and density settings.

Your personal views are layered **on top of** the admin defaults — if an admin
updates the underlying artifact, your view keeps your customizations but picks
up any new columns or data changes the admin made.

### Switching Themes

If your workspace supports theme switching, look for a **Theme** option in the
settings menu (gear icon). Available themes typically include:

- Light (default)
- Dark
- Sand (warm neutral)
- Midnight (deep dark)
- High Contrast (accessibility mode with maximum contrast)

### Exporting Data

Two export formats are available: **CSV** and **Excel (.xlsx)**. Exports
reflect the current filter state — only visible, filtered data is exported.

- Grid exports include all visible columns in their current sort order.
- Widget exports include the underlying data for the chart or KPI.
- Grouped data exports include group headers and aggregation rows.
- `enableExport` must be enabled in widget configuration (enabled by default
  for grids).

**How to export:**

1. Apply any filters you want reflected in the export.
2. Click the **Export** button (down-arrow icon) in the toolbar or widget
   header.
3. Choose **CSV** or **Excel** format.
4. The file downloads automatically.

**Tips:**

- Large datasets may take a moment to generate.
- Column formatting (dates, numbers, status colors) is preserved in Excel
  exports.
- Hidden columns are NOT included in the export.
- If the grid is grouped, group headers and summary rows are included in the
  export file.

---

## 8. Viewing on Mobile

### Layout Changes on Small Screens

When you open the workspace on a phone or small tablet:

- The **sidebar disappears** and is replaced by a **bottom tab bar** with
  icons for Catalog, Dashboards, and (if your role allows) Explore.
- The **header** becomes compact — showing only the workspace name and an
  account icon.
- Dashboard widgets stack in a **single column** instead of a multi-column
  grid.

[Screenshot placeholder: mobile bottom tab bar with Catalog/Dashboards tabs]

### Collapsed Filter Bar

On mobile, the filter bar collapses to save space. You'll see a compact
summary like **"3 filters active [Edit]"**. Tap **Edit** to open the filter
panel as a **bottom sheet** — a panel that slides up from the bottom of the
screen.

To dismiss the filter panel, swipe down from the drag handle at the top of
the sheet, or tap outside it.

### Swipe Gestures

- **Swipe left** on a catalog card to reveal quick actions (Open, Duplicate).
- **Swipe down** on a bottom sheet to dismiss it.
- **Swipe left/right** on a tabbed panel (e.g., in a dashboard detail view) to
  switch between tabs.

### Widgets in Compact Mode

On mobile, widgets adapt to the narrow screen:

- **KPI cards** show the headline number and trend direction but may hide the
  sparkline on very narrow screens.
- **Charts** hide the legend and axis labels when space is tight; on the
  smallest screens, a chart may simplify to a single summary number.
- **Tables** switch to a **card layout** on very narrow screens — each row
  becomes a stacked card showing the most important columns, with secondary
  columns accessible by expanding the card.

---

## 9. Working with Your Own Data (Local Mode)

Some deployments of the workspace include a **Local Mode** for personal data
exploration. This lets you bring your own files and explore them with the same
dashboards and filters — without needing an IT team to load them.

> If you don't see a "Local" or "Upload" option in your workspace, Local Mode
> is not enabled for your organization.

### Uploading Files

Supported file types: **CSV, TSV, Excel (.xlsx/.xls), Parquet, JSON, JSONL**

To upload a file:

1. Navigate to the **Local** section in the sidebar or Catalog.
2. Click **Upload File** or drag a file onto the upload area.
3. The workspace detects the file format automatically.

[Screenshot placeholder: file upload drop zone]

### Previewing Before Import

After selecting a file, the workspace shows a **preview** of the first 20 rows
before importing:

- Column names and their detected types (text, number, date, true/false) are
  shown in the preview header.
- If a column type was detected incorrectly, click the type label to override
  it (for example, change a column from "text" to "date").

Click **Import** to load the file, or **Cancel** to discard it.

[Screenshot placeholder: upload preview with column type indicators]

### Selecting Excel Sheets

When you upload an Excel file with multiple sheets, the workspace shows a
**sheet selector**. Click the sheet you want to import. You can import
multiple sheets from the same file by repeating the upload.

### Large Files

Large files may take a moment to process. A progress indicator shows while
the file is being parsed. The workspace uses efficient in-browser processing,
but very large files (tens of millions of rows) may be slow depending on your
device.

### Sample Datasets for Exploration

Not sure where to start? The workspace includes three built-in sample datasets
you can load without uploading any file:

| Dataset | What it contains |
|---------|----------------|
| **Sales Transactions** | Retail order data with regions, products, revenue, and dates |
| **Product Inventory** | Warehouse stock levels with SKUs, categories, and reorder points |
| **Employee Directory** | HR data with departments, job titles, hire dates, and salaries |

Click **Load Sample Data** and choose a dataset to add it to your current
session.

### Saving Your Session

The workspace automatically saves your session every 30 seconds (auto-save).
You can also save manually by clicking **Save Session** in the Local toolbar.

A session stores:
- All data you've uploaded or loaded from samples
- Your current filter settings
- Your layout and view preferences

Sessions are saved in your browser and persist between visits (even if you
close the tab).

### Resuming a Previous Session

When you return to the workspace, if a previous session exists, you'll see a
**Resume Session** prompt listing your recent sessions sorted by most recently
updated. Click a session name to restore it.

### Exporting and Importing Sessions (ZIP)

To share a session or back it up:

1. Click **Export Session** — the workspace downloads a ZIP file containing
   your session data.
2. To restore it on another device (or share it with a colleague), click
   **Import Session** and upload the ZIP file.

Session ZIP files do not contain credentials or personal account data.

---

## 10. Detail Panels

### What Triggers a Detail View

A **detail panel** (slide-out from the right side) opens when you:

- Click **View Details** on a KPI card or dashboard widget
- Drill through from a chart or table (if configured to open as a side panel)
- Click a row in a grid when row-level drill-through is enabled
- Receive an alert breach notification and click it to investigate

[Screenshot placeholder: detail panel open beside a dashboard]

### Inside the Detail Panel

The detail panel shows a focused view of the item you clicked:

- **Header**: The name and type of the artifact, plus a breadcrumb back to
  where you drilled from.
- **Data**: A grid, chart, or KPI breakdown scoped to the specific value you
  selected. For example, drilling from a "North" bar in a chart shows only
  North region data.
- **Filters**: The detail panel can have its own filter bar. Changes here
  affect only the panel's content, not the main dashboard behind it.

### Closing the Panel

Click the **X** button in the panel header, or press **Escape**, to close it
and return to the main view.

---

## 11. Understanding Error and Empty States

### Empty States (No Data Shown)

You may occasionally see a screen or widget with no data. Here are the most
common empty states and what to do about them:

- **"No results found"** — your active filters or search terms exclude all
  rows. Try broadening your filter criteria, clearing the search box, or
  resetting filters.
- **"Empty dashboard"** — no widgets have been added to this dashboard yet.
  Contact your admin if you expected to see content.
- **"No artifacts yet"** — the catalog section has no published items. If you
  are an Author, click **Create New** to get started.
- **"All clear" (alerts)** — no active alert breaches detected. Your metrics
  are within expected ranges.

### Error States

When something goes wrong, the workspace shows a user-friendly message instead
of a technical error. Possible error states include:

- **Network error** — the application could not reach the data source. The
  message reads: *"Unable to load data. Please check your connection and try
  again."* Check your internet connection and try refreshing.
- **Permission error** — you do not have access to the requested data. The
  message reads: *"You do not have permission to view this data."* Contact
  your administrator.
- **Widget error** — an individual widget encountered a problem. Other widgets
  on the same dashboard continue to work normally. The message reads:
  *"Something went wrong while loading this widget. Please try again."*

### What to Do

1. Try refreshing the page.
2. Reset all filters to see if the issue is filter-related.
3. If the error appears on only one widget, the rest of the dashboard is
   still usable — you do not need to reload.
4. If the error persists, note the error message and contact your
   administrator.

---

## 12. Alert Subscriptions

Admins can set up alert rules that monitor KPI values against thresholds. As a
viewer, you can subscribe to these rules to receive notifications when values
cross important boundaries.

### What You Can Do

- **Subscribe** to existing alert rules to receive notifications when
  thresholds are breached.
- **Choose notification channels**: in-app notifications are always available;
  email and webhook notifications depend on your organization's setup.
- **Pause or resume** a subscription at any time without losing it — toggle
  the subscription on or off as needed.
- **View breach history**: see when alerts were triggered and the values that
  caused them by opening the Alerts section.

### To Subscribe to an Alert

1. Open the **Alerts** section (bell icon in the sidebar or header).
2. Browse available alert rules — each rule shows what metric it monitors and
   what threshold triggers it.
3. Click **Subscribe** on the rules you want to monitor.
4. Choose your preferred notification channel.

Your subscription is active immediately. When the monitored metric breaches its
threshold, you receive a notification through the channel you selected.

> **Note**: Only admins can create or modify alert rules. If you need a new
> alert, contact your administrator.

---

## 13. Common Features Across Shells

Regardless of which environment you use (Workspace, Editor, or Viewer), the
following features are available to everyone:

### Attention System

The **attention bell** (bell icon in the header) is your notification hub. It
aggregates alerts, data-quality warnings, and system messages into a single
sidebar. In v15, it supports **faceted filtering**:

- **By priority**: Show only Critical, Warning, or Info notifications.
- **By source**: Filter by Alerts, Data Quality, or System messages.
- **By artifact**: Show notifications for a specific dashboard or report only.

Click a notification to navigate directly to the affected artifact. The unread
count on the bell icon updates in real time.

### Filter Bar

The filter bar appears at the top of every dashboard and report. It is
consistent across all three shells:

- Apply filters by clicking controls and selecting values.
- Save combinations as **presets** for quick recall.
- Share filter state via URL (the filter values encode into the URL
  automatically).
- Reset all filters with a single click.
- See the active filter count badge.

### Navigation

All shells share the same navigation patterns:

- **Breadcrumbs** at the top of the content area show your navigation path.
  Click any breadcrumb to jump back.
- **Drill-through links** in charts, tables, and KPI cards navigate to related
  artifacts with filter context preserved.
- **Command palette** (Ctrl+K / Cmd+K) provides instant search across all
  artifacts, filters, and actions. Type a few characters and press Enter to
  navigate.
- **Browser back/forward** buttons work as expected — the workspace preserves
  your navigation history.

### Keyboard Shortcuts

Core keyboard shortcuts are available in all shells and can be customized from
the Settings menu. See Section 14 for the full list.

---

## 14. Tips & Keyboard Shortcuts

### Keyboard Navigation

phz-grid is fully keyboard accessible:

| Key | Action |
|-----|--------|
| `Ctrl+K` (`Cmd+K` on Mac) | Open the command palette for quick navigation |
| `Tab` | Move focus to the next interactive element |
| `Shift+Tab` | Move focus to the previous element |
| `Enter` or `Space` | Activate a button, open a dropdown, or select an item |
| `Escape` | Close a dropdown, modal, detail panel, or command palette |
| `Arrow keys` | Navigate within a dropdown list or grid cells |

Keyboard shortcuts can be customized from the **Settings** menu (gear icon).
Open Settings, go to **Keyboard Shortcuts**, and click any shortcut to rebind
it.

### Quick Filter Reset

Press **Escape** while focus is in the filter bar to close the active filter
control without applying changes. Click **Reset** (or the circular arrow) to
clear all filters at once.

### Switching Between Artifacts

Use the breadcrumb trail at the top of the content area to jump back to a
parent view. You can also use the browser's Back button — the workspace
preserves your history.

### Refreshing Data

If you need to see the most current data (e.g., a live sales dashboard), click
the **Refresh** icon in the toolbar. This re-runs all queries on the current
view.

---

## 15. Creating and Editing (Author Role)

If your account has the **Author** role, you can create your own reports and
dashboards from scratch and edit them using the built-in authoring tools. This
section walks you through the full authoring experience.

### 15.1 Creating a New Report or Dashboard

You can create new artifacts directly from the Catalog:

1. Click **New Report** or **New Dashboard** in the top-right corner of the
   Catalog.
2. A creation wizard walks you through three steps:
   - **Step 1 — Choose a type**: Pick whether you want to create a Report or a
     Dashboard. You'll see two large cards — just click the one you want.
   - **Step 2 — Choose your data source**: The wizard shows all available data
     sources from your organization. Select the one that contains the data you
     want to work with.
   - **Step 3 — Choose a template** (Dashboard only): The wizard suggests
     starting templates ranked by how well they match your selected data source.
     Pick one to get a head start, or choose **Blank** to start from scratch.
3. Give your artifact a name and click **Create**.

[Screenshot placeholder: creation wizard step 2 — data source selection]

Your new artifact opens immediately in the editor so you can start building.

### 15.2 Editing Reports

When you open a report for editing, you'll see three areas:

- A **toolbar** at the top with Undo, Redo, Save, and Publish buttons.
- A **preview** of your report in the center — this is a live grid view that
  updates as you make changes.
- A **configuration panel** on the right with three tabs:
  - **Columns**: Add, remove, reorder, pin, and format your columns. Drag
    columns up or down to change their order.
  - **Filters**: Add and manage filter conditions on your report data.
  - **Style**: Set density (compact, dense, or comfortable) and other visual
    options for how your report looks.

**Right-click menus**: Right-click any column header to quickly Sort, Group,
Pin, Hide, add a Filter, or open Conditional Formatting. Right-click a cell
to Copy, Filter by that value, or Exclude it.

### 15.3 Editing Dashboards

The dashboard editor has a three-panel layout:

- **Field Palette** (left side): Shows all available fields from your data
  source, grouped by type (text, number, date, etc.). Drag a field onto the
  canvas to create a widget automatically.
- **Canvas** (center): A grid where your widgets are placed. Click any widget
  to select it. Drag widgets to rearrange them on the canvas.
- **Config Panel** (right side): Appears when you select a widget. It has three
  tabs:
  - **Data**: Which fields power this widget — your dimensions (categories)
    and measures (numbers).
  - **Style**: Title, subtitle, legend position, label formatting, and other
    visual options.
  - **Filters**: Widget-level filters that scope just this widget's data
    (independent of the dashboard's global filters).

**Widget Types**: You can add bar charts, line charts, area charts, pie charts,
KPI cards, gauges, scorecards, trend lines, grids, pivot tables, text blocks,
headings, and drill links.

**Morphing**: If you change your mind about a widget's type, right-click it
and choose **Morph To** to convert it. For example, you can turn a bar chart
into a line chart — your data configuration stays exactly the same. Only
compatible types are shown in the list (e.g., you can morph between bar, line,
area, and pie because they share the same data structure).

[Screenshot placeholder: dashboard editor with field palette, canvas, and config panel]

### 15.4 Saving and Publishing

- **Auto-save**: The workspace automatically saves your work every few seconds.
  Look for the save indicator in the header bar — it shows **Saved**,
  **Saving...**, or **Unsaved changes** so you always know where you stand.
- **Manual save**: Click **Save** or press Ctrl+S (Cmd+S on Mac) at any time.
- **Undo / Redo**: Click the undo and redo buttons in the toolbar, or use
  Ctrl+Z and Ctrl+Shift+Z (Cmd+Z and Cmd+Shift+Z on Mac). Every action has a
  label (e.g., "Added column Revenue") so you know exactly what you're undoing.
- **Publishing**: When your artifact is ready for others to see, click
  **Publish**. In v15, publishing follows a multi-phase workflow:
  1. **Pre-publish checks** — the system validates your artifact (required
     fields, data source connectivity, layout integrity).
  2. **Submit for review** — your artifact is submitted for admin approval.
  3. **Version tracking** — each published version is recorded with a version
     number and change summary.
  4. **Rollback** — if an issue is found after publishing, admins can roll back
     to a previous version.
  Until approval, your artifact stays in your **My Work** tab.

### 15.5 Keyboard Shortcuts for Authors

These shortcuts are available while you're in the editor:

| Shortcut | Action |
|----------|--------|
| Ctrl+Z (Cmd+Z on Mac) | Undo |
| Ctrl+Shift+Z (Cmd+Shift+Z on Mac) | Redo |
| Ctrl+S (Cmd+S on Mac) | Save |
| Ctrl+D (Cmd+D on Mac) | Duplicate selected widget |
| Delete / Backspace | Delete selected widget |
| Escape | Deselect current widget or close the config panel |

---

## Glossary

| Term | What it means |
|------|--------------|
| **Artifact** | Any item in phz-grid: a dashboard, report, grid, KPI, filter preset, or alert |
| **Attention Sidebar** | The notification panel (bell icon) that aggregates alerts, data-quality warnings, and system messages with faceted filtering |
| **Catalog** | The main library of all artifacts available to you |
| **Command Palette** | A quick-search overlay (Ctrl+K / Cmd+K) for navigating to any artifact or action |
| **Config Panel** | The right-side panel in the dashboard editor with Data, Style, and Filters tabs for configuring a selected widget |
| **Creation Wizard** | The 3-step flow for creating new reports and dashboards — choose a type, pick a data source, and select a template |
| **Dashboard** | A page combining multiple widgets (KPI cards, charts, tables) on one screen |
| **Density** | How tightly rows are spaced in a grid: compact (tight), dense (medium), comfortable (spacious) |
| **Detail Panel** | A slide-out side panel showing focused information after a drill-through click |
| **Drill-Through** | Clicking a value to navigate to a related, more-detailed artifact |
| **Editor** | The authoring environment (shell) for users with the Author role |
| **Field Palette** | The left-side panel in the dashboard editor showing all available data fields, grouped by type, that you can drag onto the canvas |
| **Filter Preset** | A saved combination of filter values you can re-apply with one click |
| **Grid** | A data table with sortable, filterable rows — similar to a spreadsheet view |
| **Impact Chain** | A horizontal causal-flow widget showing how metrics influence each other, used for root cause analysis |
| **KPI** | Key Performance Indicator — a metric with a target value and green/yellow/red status |
| **Measure Registry** | A curated catalog of business metrics defined by admins, used in the Editor instead of raw database fields |
| **Micro-Widget** | A small inline visualization (sparkline, gauge, delta) rendered inside a table cell |
| **Morph** | Converting a widget from one type to another (e.g., bar chart to line chart) while keeping the same data configuration |
| **Personal View** | Your saved customizations (sort, columns, density) layered over the admin defaults |
| **Published** | An artifact made available to all users with access |
| **Report** | A structured data view with aggregation, formatting, and optional drill-through |
| **Session** (Local Mode) | Your active workspace with uploaded data, filters, and preferences saved in your browser |
| **Shared** | An artifact visible to specific roles or team members, but not the full organization |
| **Shell** | One of the three environments in phz-grid: Workspace (admin), Editor (author), or Viewer (analyst) |
| **Viewer** | The read-only consumption environment (shell) for users with the Viewer or Analyst role |
| **Widget** | A single visual component on a dashboard (e.g., a bar chart, a KPI card, a trend line) |
| **Workspace** | The full administration environment (shell) for users with the Admin role |

---

*phz-grid User Guide — updated 2026-03-08*
