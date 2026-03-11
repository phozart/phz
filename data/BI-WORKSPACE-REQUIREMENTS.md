# BI Workspace Requirements: phz-grid Workbench

Requirements derived from hands-on analysis of Tableau Desktop, Power BI Desktop, MicroStrategy Workstation, Looker Explore, and Qlik Sense. Each section maps industry-standard patterns to implementation options within the phz-grid monorepo.

---

## 1. Workspace Layout Architecture

Every major BI tool structures its authoring workspace around a consistent spatial pattern. The details differ but the bones are the same.

### 1.1 What the Tools Do

**Tableau Desktop**
Left sidebar: Data pane (dimensions above gray divider, measures below, both color-coded blue/green). Analytics pane as alternate tab. Center: canvas with Rows and Columns shelves across the top. Right of data pane: Pages shelf, Filters shelf, Marks card (dropdown for mark type + encoding properties: Color, Size, Label, Detail, Tooltip, Shape, Angle). Show Me panel floats top-right with chart type recommendations. Status bar at bottom.

**Power BI Desktop**
Ribbon toolbar across top (Home, Insert, Modeling, View, Help tabs). Left rail: three view icons (Report, Data, Model). Center: report canvas with page tabs at bottom. Right side stacks three panes vertically: Filters pane (visual/page/report level), Visualizations pane (chart type grid + field wells/buckets), Fields pane (table/field tree). Format pane and Analytics pane replace Visualizations pane contextually via icons.

**MicroStrategy Workstation (Dossier Editor)**
Far-left Control Panel with icon strip. Datasets panel for drag source. Editor Panel (objects added to current visualization), Filter Panel (chapter-level filters), Format Panel (selected object styling), Layers Panel (z-order content list), Themes Panel. As of June 2025, Filter and Format panels are accessed through the Editor Panel icon. Panels can be stacked vertically and resized.

**Looker Explore**
Field picker on left, organized by view headings from LookML. Fields grouped: dimensions, dimension_groups, measures, filters, parameters. Tabs: All Fields, In Use, Custom Fields. Center: data table with Run button. Right: visualization panel when toggled. Filter bar above results. Gear icon per column for remove/pivot/sort.

**Qlik Sense (Sheet Editor)**
Assets panel on left (fields, master items, visualizations, sheets, bookmarks). Center: sheet canvas with smart grid for placement. Properties panel on right (visualization-specific settings). Toolbar at top. Drag a field onto canvas triggers chart type suggestion.

### 1.2 Universal Pattern

```
+------------------+------------------------+------------------+
|                  |    Shelves / Config    |                  |
|   Data / Field   |------------------------|   Properties /   |
|     Browser      |                        |     Format       |
|                  |   Canvas / Preview     |     Config       |
|   (dimensions,   |                        |                  |
|    measures,     |   (live data grid or   |   (visual type,  |
|    fields)       |    chart preview)      |    encoding,     |
|                  |                        |    style)        |
+------------------+------------------------+------------------+
|              Filter Bar / Criteria Bar                       |
+--------------------------------------------------------------+
```

Three-column layout is standard. Left panel is the data source; center is the live preview; right is configuration/formatting. A filter/criteria bar sits above or below the canvas.

### 1.3 Options for phz-grid

**Option A: Use existing `phz-report-editor`**
Already implements the three-column pattern: data source panel (260px) | preview grid | config panel (320px, tabs: Columns/Filters/Style). Currently swapped in on the workspace page. Limitation: config panel only has three tabs and no chart type selection.

**Option B: Use existing `phz-dashboard-studio`**
MicroStrategy-inspired layout with global filter bar + data model sidebar + canvas + advanced config panel. Richer than report-editor but more complex to wire. Properties: `engine`, `data`, `dashboardId`.

**Option C: Build a unified workbench shell**
A new component that renders different editor surfaces (report, dashboard, KPI, metric) inside a common three-column frame. The left panel switches between data browser, field picker, and widget palette depending on what you're editing. The right panel switches between column config, widget config, and format options. This is what Tableau, Power BI, and MicroStrategy actually do -- one workspace, multiple artifact types.

**Recommendation**: Option C long-term, Option A as immediate working state. The existing `phz-report-editor` and `phz-dashboard-editor` are already functional. A unified shell that switches between them (or future merged surface) can be built incrementally.

---

## 2. Data Source Management

### 2.1 What the Tools Do

**Connecting to Data**

| Tool | Entry Point | Multi-Source | Model Canvas |
|------|------------|-------------|-------------|
| Tableau | "Connect" pane: file, server, cloud categories. Drag table to canvas. | Relationships (logical), Joins (physical), Unions, Blending | Two-layer: logical (noodle diagrams) and physical (join editor) |
| Power BI | "Get Data" button in ribbon. 100+ connectors categorized. Power Query Editor for transforms. | Import + DirectQuery + Composite models. Relationships in Model view. | Diagram view with cardinality lines |
| MicroStrategy | Warehouse Catalog. Database instances. Freeform SQL Editor. | MultiSource Option license. Schema objects across databases. | Schema editor with attribute/fact relationships |
| Looker | Database connections in admin. LookML `view` per table. | Explores join multiple views. Derived tables (SQL subqueries). | LookML code defines joins; Explore UI resolves them |
| Qlik | Data Load Editor (script) or Data Manager (UI). | Associative model: common key fields auto-link tables. | Data Model Viewer with association lines |

**Common Workflow**
1. Browse available connections (databases, files, APIs)
2. Select tables or write custom SQL
3. Define relationships between tables (joins, associations, blends)
4. Preview data and field metadata
5. Transform/clean data if needed
6. Publish as reusable "data source" or "semantic model"

### 2.2 What phz-grid Already Has

- **DataProductRegistry** (`engine/data-product.ts`): Schema-based data entity definitions with field types. Supports `register()`, `list()`, `getSchema(id)`.
- **DataAdapter SPI** (`shared/adapters/data-adapter.ts`): `query(config)`, `subscribe(listener)`. Pluggable implementations.
- **phz-data-connector** (`workspace/engine-admin/components/phz-data-connector.ts`): Data source connectivity configuration UI.
- **phz-data-browser** (`workspace/engine-admin/components/phz-data-browser.ts`): Data product and field browser.
- **phz-data-model-sidebar** and **phz-data-model-modal**: Dashboard-level data model field management.
- **phz-admin-data-source** (`workspace/grid-admin/`): Data source binding and connection for grids.
- **phz-connection-editor** (`workspace/`): Connection editor panel for the workspace.
- **data-source-detector** (`workspace/controllers/`): Automatic data source type detection.

### 2.3 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Browse connections | Categorized connector gallery | `phz-data-connector` exists | Needs richer connector UI with categories and icons |
| Table/view browser | Tree of schemas/tables/columns with type icons | `phz-data-browser` exists | Needs schema-level browsing (not just data products) |
| Visual join editor | Drag-and-drop join canvas (Tableau logical layer) | Not built | **Major gap**: no visual join/relationship editor |
| Data preview | Sample rows while configuring source | DataAdapter can query | Needs integrated preview panel in connection flow |
| Transform layer | Power Query / Data Load Editor | Not built | **Major gap**: no ETL/transform step |
| Multi-source model | Composite models, blending, associations | DataProductRegistry is single-source | **Gap**: no multi-table data model definition |
| Publish as reusable source | Certified data sources shared across team | Persistence adapter exists | Needs "publish" workflow with metadata |
| Custom SQL | Freeform SQL editor | Not built | **Gap**: would require SQL editor component |

### 2.4 Prioritized Options

**P0 (Must Have for Workbench)**
- Enhance `phz-data-browser` to show available data sources with field lists and type icons
- Integrate data preview (sample rows) into the data source selection flow
- Allow selecting a data source when creating a new report or dashboard

**P1 (Needed for Real Use)**
- Visual relationship editor for multi-table data models
- Data source "publish and certify" workflow
- Schema browser (database/schema/table/column hierarchy)

**P2 (Advanced)**
- Transform layer (column renames, type casts, calculated columns at the source level)
- Custom SQL editor
- Connector gallery with categorized adapters

---

## 3. Semantic Model: Dimensions, Measures, Hierarchies

### 3.1 What the Tools Do

Every BI tool separates raw fields into semantic categories. The terminology varies but the concepts are identical.

| Concept | Tableau | Power BI | MicroStrategy | Looker | Qlik |
|---------|---------|----------|---------------|--------|------|
| Descriptive field | Dimension (blue) | Column | Attribute | Dimension | Dimension |
| Numeric aggregation | Measure (green) | Measure (DAX) | Metric (fact-based) | Measure | Measure |
| Date hierarchy | Date hierarchy (auto) | Date table hierarchy | Date attribute | dimension_group | Date field |
| Calculated field | Calculated Field | Calculated Column / Measure | Calculated Metric | Table Calculation / Custom Field | Expression in script |
| Reusable definition | Published Data Source | Semantic Model | Schema Object | LookML view | Master Item |
| Parameter | Parameter control | What-if parameter | Prompt | Parameter | Variable |

**Key Pattern**: The field browser in ALL tools marks fields with their semantic role (dimension vs measure, with type icons for string/number/date/boolean/geo). This classification drives auto-chart-type selection (e.g., "one dimension + one measure = bar chart").

### 3.2 What phz-grid Already Has

- **DataProductRegistry**: Fields have `name` and `type` (string, number, date, boolean). No explicit dimension/measure classification.
- **MetricCatalog** (`engine/metric.ts`): Full metric definitions with SimpleMetricFormula (field + aggregation), ConditionalMetricFormula, CompositeMetricFormula, ExpressionMetricFormula. Formatting support.
- **KPIRegistry** (`engine/kpi.ts`): KPI definitions with targets, thresholds, breakdowns, delta comparison, alerts.
- **Expression Evaluator**: AST-based evaluator with field_ref, param_ref, metric_ref, conditionals, built-in functions.
- **Formula Parser**: DSL parser for formula strings.
- **phz-expression-builder**: Formula editor UI.
- **phz-metric-form** and **phz-metric-builder**: Metric creation/editing UI.
- **phz-calculated-field-form**: Computed column expression editor.
- **phz-parameter-form**: Parameter definition for expressions.
- **Master Items concept**: Qlik-equivalent exists partially via metric and KPI registries.

### 3.3 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Dimension/Measure classification | Automatic based on type + manual override | Field types exist, no semantic role | **Gap**: fields need `role: 'dimension' | 'measure'` |
| Semantic type icons | Color-coded (Tableau blue/green), type icons | Not in field browser | Needs visual treatment in data panel |
| Hierarchies | Auto-create date hierarchies, manual custom | Not built | **Gap**: no hierarchy definition or drill path |
| Calculated fields (row-level) | Formula editor creates new columns | `phz-calculated-field-form` exists | Functional, needs integration into workbench flow |
| Calculated measures (aggregate) | DAX measures, LookML measures | `MetricCatalog` with formula types | Functional, strong |
| Parameters (user inputs) | Slicer-like controls that feed into expressions | `phz-parameter-form` exists | Needs binding to filter bar / selector UI |
| Auto chart type | "Show Me" panel / Insight Advisor | Not built | **Gap**: no auto-recommendation engine |
| Certified/published definitions | Endorsed, promoted, certified badges | Not built | **Gap**: no governance metadata on fields/metrics |

### 3.4 Prioritized Options

**P0**
- Add `semanticRole` (dimension | measure | identifier | timestamp) to DataProduct field schema
- Display fields in the data panel grouped by role (dimensions above, measures below) with type icons
- Wire existing metric/KPI forms into the workbench so users can create them inline

**P1**
- Hierarchy definitions (date auto-hierarchy, custom hierarchies for drill paths)
- "Show Me" panel: given selected dimensions/measures, recommend chart types
- Parameter binding to filter bar selectors

**P2**
- Certification workflow for fields and metrics
- Smart field classification (auto-detect dimension vs measure from data type + cardinality)

---

## 4. Report Authoring

### 4.1 What the Tools Do

**Tableau Worksheet**
Drag dimensions to Rows/Columns shelves. Drag measures to Marks card (Color, Size, Label, Detail, Tooltip). Select chart type from Show Me or Marks dropdown. Filters shelf for data filtering. Pages shelf for animation. Canvas updates live with every drag.

**Power BI Report Canvas**
Drag fields from Fields pane into field wells (Axis, Values, Legend, Tooltips, etc.) of the selected visualization. Click visualization type in Visualizations pane to switch. Format pane (paint brush icon) for styling. Analytics pane for reference lines, trend lines, forecasts. Multiple visuals per page.

**MicroStrategy Report Editor**
Grid view for tabular data. Graph view for charts. Subtotals, thresholds, conditional formatting, page-by axis. Drill maps for navigation paths. Reports are single-visualization artifacts.

**Looker Explore**
Pick dimensions and measures from field picker. Run query. Results appear as data table. Toggle visualization tab for chart. Pivot dimensions to columns. Add table calculations. Save as Look.

**Qlik Sense**
Drag from assets panel onto sheet. Smart chart suggestions based on selected fields. Properties panel on right for visualization-specific settings. Alternate states for comparative analysis. Bookmarks for saved selections.

### 4.2 Universal Report Authoring Workflow

1. **Select data source** (or it's inherited from the workspace context)
2. **Pick fields**: drag dimensions and measures from the data panel
3. **See live preview**: data table or chart updates immediately
4. **Refine visualization**: choose chart type, configure encoding (axes, colors, sizes)
5. **Add filters**: drag fields to filter shelf or use filter panel
6. **Configure details**: sorting, conditional formatting, totals, thresholds
7. **Save**: persist the artifact with name and metadata

### 4.3 What phz-grid Already Has

- **phz-report-editor** (`workspace/authoring/`): Three-column layout. Data panel | live grid preview | config panel (Columns, Filters, Style tabs). Dispatches `save-report` and `state-changed` events. Has undo/redo.
- **phz-grid**: Full-featured data grid with sort, filter, group, virtual scroll, computed columns, conditional formatting, export, selection, edit, views.
- **phz-report-designer** (`workspace/engine-admin/`): 6-step wizard (Data Product, Columns, Filters/Sort, Aggregation, Drill-Through, Review). More configuration options but not workbench-style.
- **ReportConfigStore** (`engine/report.ts`): Columns, sort, filter, aggregation, grouping, pivot, pagination, drill-through, conditional formatting, selection fields.
- **Aggregation engine**: count, sum, avg, min, max, first, last.
- **Pivot engine**: Multi-level rows/columns, grand totals, multi-measure.
- **Chart widgets**: Bar, line, area, pie, scatter, heatmap, funnel, waterfall, gauge.
- **Cross-filter**: Widget-to-widget filter propagation.

### 4.4 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Drag field to see data | Immediate preview on drag | `phz-report-editor` updates preview | Functional |
| Chart type selection | Show Me / visualization palette | Not in report editor | **Gap**: report editor only shows grid, no chart toggle |
| Marks/encoding card | Map fields to Color, Size, Label, Shape | Not built | **Gap**: no encoding editor for chart visualizations |
| Multiple visuals per report | Power BI pages have many visuals | Reports are single-grid | By design (dashboards handle multi-visual) |
| Subtotals | Automatic group subtotals | Aggregation controller exists | Needs exposure in report editor UI |
| Conditional formatting | Color rules on cells | Grid supports it, phz-admin-formatting exists | Needs wiring into report editor config |
| Drill-through | Click row to navigate to detail | DrillThroughConfig exists, phz-drill-link exists | Needs wiring into report editor config |
| Page-by / pagination | MicroStrategy page-by axis | Pagination exists | Report editor needs pagination controls |

### 4.5 Prioritized Options

**P0 (Workbench Essentials)**
- Current `phz-report-editor` with grid preview is functional. Keep it.
- Add chart type toggle to report editor: switch preview between grid and chart widget
- Expose conditional formatting tab in the config panel
- Expose drill-through configuration in the config panel

**P1**
- Encoding card (when chart preview is selected): map fields to chart axes, color, size
- Subtotal configuration in the Columns tab
- Sorting UI improvements (multi-column sort with drag-to-reorder)

**P2**
- "Show Me" recommendation panel
- Report templates (start from a pre-built layout)
- Pivot mode toggle in the grid preview

---

## 5. Dashboard Authoring

### 5.1 What the Tools Do

**Tableau Dashboard**
Canvas with tiled or floating layout modes. Drag worksheets (pre-built visualizations) from a Sheets pane. Add objects: text, image, web page, blank, navigation buttons, extensions. Device layouts for phone/tablet. Actions: filter, highlight, URL, show/hide. Size and scrolling configuration.

**Power BI Dashboard**
Dashboards exist only in Service (not Desktop). Pin tiles from reports. Pin entire live pages. Q&A natural language tile. Custom tiles (text, image, video, streaming). Tile management: rename, resize, reposition, add hyperlinks.

Note: Power BI "reports" are multi-page, multi-visual canvases (closer to what other tools call dashboards). The Power BI "dashboard" is a pinboard of individual tiles.

**MicroStrategy Dossier**
Panel-based with freeform or auto layout. Visualization library. Selectors for interactivity. Filter panels. Information windows and hypercards. Panel stacks for tabbed views. Contextual linking. Parameters for dynamic adjustment.

**Looker Dashboard**
Tile-based from saved Looks or Explores. Dashboard filters with field mapping to tiles. Cross-filtering between supported visuals. LookML dashboards (code-defined, version-controlled) vs user-defined dashboards (UI-built). Folder-based organization with permissions.

**Qlik Sense**
Sheets as dashboard pages. Drag visualizations or fields from assets panel. Smart grid placement. Alternate states for side-by-side comparison with different selections. Set analysis for complex calculations. Bookmarks for saved states. Stories for data-driven presentations with snapshots and slides.

### 5.2 Universal Dashboard Authoring Workflow

1. **Create dashboard** with name and layout settings
2. **Add widgets**: drag from a widget palette (charts, KPIs, tables, text)
3. **Configure each widget**: bind to data source, pick fields, set chart type
4. **Arrange layout**: resize, reposition, optionally define responsive breakpoints
5. **Add global filters**: filter bar that controls all widgets
6. **Define interactions**: cross-filter rules (click widget A filters widget B)
7. **Add non-data elements**: titles, text, images, navigation
8. **Preview**: switch between edit and view mode
9. **Save and publish**

### 5.3 What phz-grid Already Has

- **phz-dashboard-editor** (`workspace/authoring/`): Three-column layout. Field palette (260px) | CSS Grid canvas | config panel (360px). Properties: name, dataSourceId, schema, initialState, adapter. Events: `save-dashboard`, `state-changed`.
- **phz-dashboard-studio** (`workspace/engine-admin/`): MicroStrategy-inspired. Global filter bar + data model sidebar + canvas + advanced config panel.
- **phz-dashboard** widget container (`widgets/`): Responsive grid layout, widget placement, cross-filter coordination, auto-refresh.
- **Widget library**: KPI card, scorecard, bar/line/area/pie/scatter/heatmap/funnel/waterfall/gauge charts, status table, bottom-N table, drill link, rich text, container box, alert panel, query builder, decision tree, impact chain.
- **Cross-filter** (`widgets/cross-filter.ts`): Source widget selection, target widget filter application, field mapping.
- **Widget resolver** (`engine/widget-resolver.ts`): Maps config + data to resolved widget props.
- **phz-widget-config-panel**: Widget-specific configuration.
- **Drag-and-drop** (`workspace/controllers/drag-drop.ts`): Drag orchestration.
- **Responsive layout** (`widgets/responsive-layout.ts`): Container query responsive design.

### 5.4 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Widget palette | Visual widget gallery with drag | phz-dashboard-editor has field palette | Needs widget type palette (not just fields) |
| Canvas placement | Free-form or grid-based positioning | CSS Grid canvas in dashboard-editor | Functional |
| Widget config | Right-panel per-widget settings | phz-widget-config-panel exists | Needs richer integration |
| Global filters | Filter bar above dashboard | phz-global-filter-bar exists in studio | Needs wiring in dashboard-editor |
| Cross-filter | Click to filter other widgets | Cross-filter engine exists | Needs visual cross-filter rule editor |
| Text/image objects | Non-data decorative elements | phz-rich-text widget exists | Functional |
| Device layouts | Responsive breakpoints | Responsive layout exists | Functional |
| Preview mode | Toggle edit/view | Not in dashboard-editor | **Gap**: no preview toggle |
| Actions (URL, navigate) | Tableau actions, MicroStrategy linking | phz-drill-link exists | Needs more action types |

### 5.5 Prioritized Options

**P0**
- Wire `phz-dashboard-editor` into the workspace (done)
- Add widget type palette to the left panel (alongside or replacing the field palette)
- Connect `phz-global-filter-bar` to the dashboard editor canvas

**P1**
- Visual cross-filter rule editor (define which widgets filter which)
- Edit/preview mode toggle
- Widget resize handles and drag reposition on canvas

**P2**
- Device layout editor (phone, tablet, desktop breakpoints)
- Dashboard templates
- Panel stacks (MicroStrategy tabbed panels)
- Stories/presentation mode (Qlik-style)

---

## 6. Metrics and KPI Management

### 6.1 What the Tools Do

**Tableau Pulse**
Define a metric with: name, data source (single published source), measure field, time dimension, adjustable dimensions (breakdowns). Followers get AI-generated insights. Metrics live in the Metrics layer, separate from workbooks.

**Power BI Metrics Hub**
Scorecards contain goals/metrics. Each metric: name, owner, manual or connected value (linked to report visual). Quick check-in for manual updates. Status tracking. Metric following for notifications. Integration with Teams.

**MicroStrategy**
Facts (raw numeric) defined in schema. Metrics calculated from facts with aggregation. KPIs track metric values against targets with threshold bands. KPI designer for creation. Breakdowns by attribute.

**Looker**
LookML `measure` definitions: sum, count, average, derived. Table calculations for post-query formulas. Custom fields for ad-hoc measures without LookML changes.

**Qlik Sense**
Master Measures: reusable, governed measure definitions used across all sheets. Master Dimensions: reusable dimension definitions. Created in the Assets panel. Insight Advisor uses master items for AI interpretation.

### 6.2 Universal Metric/KPI Workflow

1. **Define the metric**: name, formula (which field, which aggregation, which conditions)
2. **Set the target**: static value, dynamic from another metric, or trend-based
3. **Define thresholds**: bands for status classification (good/warning/critical)
4. **Add breakdowns**: which dimensions to slice the metric by
5. **Configure trend**: time dimension, comparison period (YoY, MoM, QoQ)
6. **Set alerts**: threshold breach notifications
7. **Assign ownership**: who maintains this metric
8. **Publish**: make available for dashboards and reports

### 6.3 What phz-grid Already Has

This is one of phz-grid's strongest areas:

- **KPIRegistry**: Full lifecycle with id, name, category, target, units (percent/count/duration/currency/custom), direction (higher/lower_is_better), threshold bands (custom colors), delta comparison (previous_period/same_period_last_year/target), breakdowns with per-breakdown overrides, data source endpoints (score/trend/breakdown/detail), sparkline, drill-down linking, alerts.
- **MetricCatalog**: Simple, conditional, composite, expression-based formulas. Formatting.
- **phz-kpi-designer**: KPI definition management UI.
- **phz-kpi-form**: KPI creation/editing with threshold bands and metric linking.
- **phz-metric-form**: Metric formula editor (4 formula types).
- **phz-metric-builder**: Metric catalog browser and builder.
- **KPI alerting** (`engine/kpi-alerting.ts`): Threshold breach detection.
- **Status computation** (`engine/status.ts`): `computeStatus()`, `computeDelta()`, `classifyKPIScore()`.
- **KPI widgets**: `phz-kpi-card` (single), `phz-kpi-scorecard` (multi), `phz-gauge`.

### 6.4 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Metric definition | Formula-based with aggregation | MetricCatalog with 4 formula types | Strong, complete |
| KPI with targets | Target + threshold bands | KPIRegistry with full band support | Strong, complete |
| Breakdowns | Dimensional slicing | KPI breakdowns with per-breakdown overrides | Strong, complete |
| Trend comparison | Period-over-period delta | Delta comparison with 4 modes | Strong, complete |
| Alerts | Threshold breach notifications | kpi-alerting exists | Needs delivery channel (email, webhook) |
| Metric lineage | Where is this metric used? | Not built | **Gap**: no dependency tracking UI |
| Metric certification | Endorsed/promoted badges | Not built | **Gap**: no governance metadata |
| Quick check-in | Manual value entry for metrics | Not built | **Gap**: Power BI-style manual metric updates |
| AI insights | Tableau Pulse auto-insights | Not built | **Future**: anomaly detector partially covers this |

### 6.5 Prioritized Options

**P0**
- Wire existing KPI and metric forms into the workbench (make them accessible from workspace sidebar)
- Display metrics and KPIs in the data panel alongside dimensions and measures

**P1**
- Metric lineage view: "used in these dashboards/reports"
- Alert delivery channels (email, webhook, in-app notification)
- Metric certification/endorsement badges

**P2**
- Manual check-in for metrics (Power BI Scorecard style)
- AI-generated metric insights (leveraging anomaly detector)
- Metric catalog browsing interface

---

## 7. Filtering and Criteria

### 7.1 What the Tools Do

All tools provide multiple filter levels:
- **Visual-level**: affects one chart/visual
- **Page/sheet-level**: affects all visuals on the page
- **Report/workbook-level**: affects all pages
- **Dashboard-level**: global filter bar above all widgets

Filter types across tools: list select, dropdown, slider/range, date picker, wildcard/text search, relative date (last N days), top N, conditional.

Cross-filtering (click a bar to filter everything else) is universal. Power BI enables it by default. Tableau requires explicit filter actions. Qlik's associative model makes it automatic.

### 7.2 What phz-grid Already Has

This is another strong area:

- **CriteriaEngine** (`engine/criteria/`): FilterRegistry, FilterBindingStore, FilterStateManager, FilterRuleEngine, CriteriaOutputManager, FilterAdminService.
- **Filter components** (`criteria/`): `phz-criteria-bar` (horizontal bar), `phz-criteria-panel` (full panel), `phz-criteria-field`, `phz-criteria-summary`, `phz-expanded-modal`.
- **Field inputs**: combobox, searchable dropdown, date range picker, numeric range, chip select, field presence filter, tree select.
- **Filter designer**: Layout designer for filter UI placement.
- **Filter presets**: Save/load named filter combinations.
- **Filter rules**: Conditional visibility, dependencies between filters.
- **phz-global-filter-bar**: Dashboard-level filter bar.
- **Cross-filter**: Widget-to-widget filter propagation with field mapping.
- **Grid-level filtering**: FilterOperator set (equals, contains, startsWith, between, in, date operations).

### 7.3 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Filter bar | Horizontal bar with quick selections | phz-criteria-bar, phz-global-filter-bar | Strong, complete |
| Filter types | List, dropdown, slider, date, search, top-N | 7 field input types | Strong. Missing: top-N, relative date |
| Filter levels | Visual, page, report, dashboard | Binding store supports artifact-level | Needs UI to configure filter scope |
| Filter dependencies | Show filter B only when filter A has value | FilterRuleEngine with visibility rules | Strong, complete |
| Presets | Saved filter combinations | phz-preset-admin, phz-preset-manager | Strong, complete |
| Cross-filter | Click to filter others | Cross-filter engine exists | Needs visual rule editor |
| Relative date | "Last 7 days", "This quarter" | Not built | **Gap**: needs relative date expressions |

### 7.4 Prioritized Options

**P0**
- Wire `phz-criteria-bar` or `phz-global-filter-bar` into the workspace report/dashboard editors
- Expose filter designer in the workbench config panel

**P1**
- Relative date filter type ("Last N days", "This quarter", "YTD")
- Top-N filter type
- Visual filter scope editor (which filters apply to which widgets)

**P2**
- Associative filtering (Qlik-style: selecting a value greys out non-associated values everywhere)

---

## 8. Drill-Through and Navigation

### 8.1 What the Tools Do

**Tableau**: Drill maps define valid paths (Year -> Quarter -> Month). Right-click to drill. Filter actions pass context to target sheets. URL actions for external links.

**Power BI**: Drillthrough pages: drag a field into "Drillthrough filters" well. Right-click data point, select "Drill through". Cross-report drillthrough between separate .pbix files. Back button auto-added.

**MicroStrategy**: Drill maps configured per attribute. Page-by axis for multi-page navigation. Compound metric drilling. Threshold preservation during drill.

**Looker**: Link parameter on dimensions opens detail views. Dashboard-to-dashboard navigation with filter context. Linked Looks.

### 8.2 What phz-grid Already Has

- **DrillThroughConfig** (`engine/drill-through.ts`): Trigger (click/dblclick), mode (filtered/full), field mapping, multiple sources (pivot, chart, KPI, scorecard, grid row), DrillThroughAction.
- **phz-drill-link** widget: Standalone drill-through button.
- **Selection criteria**: Cross-filter context for drill state.
- **ReportConfig**: `drillThrough` configuration field.

### 8.3 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Row-click drill | Click row to see detail | DrillThroughConfig exists | Needs wiring in grid preview |
| Drill hierarchy | Year -> Quarter -> Month | Not built | **Gap**: needs hierarchy-based drill paths |
| Cross-report drill | Navigate between reports with filter context | DrillThroughAction with target report | Functional via config |
| Back navigation | "Back" button after drilling | Not built | **Gap**: needs drill breadcrumb / back stack |
| URL actions | Open external URL with parameters | Not built | **Gap**: needs URL action type |

### 8.4 Prioritized Options

**P0**
- Wire drill-through config into report editor
- Add drill breadcrumb bar (back navigation after drilling)

**P1**
- Hierarchy-based drill paths (Year -> Quarter -> Month auto-generated from date hierarchy)
- URL action type for external links

**P2**
- Cross-report drillthrough UI for defining target reports and field mappings

---

## 9. Admin and Governance

### 9.1 What the Tools Do

| Capability | Tableau | Power BI | MicroStrategy | Looker | Qlik |
|-----------|---------|----------|---------------|--------|------|
| Permissions | View/Explore/Publish/Administer | Admin/Member/Contributor/Viewer | ACL per object with privileges | RBAC + folder permissions | Space roles (Owner/Manage/Publish/View) |
| Certification | Data Source Certification badge | Promoted/Certified endorsement | N/A (implicit via schema) | Content certification | N/A |
| Lineage | Tableau Catalog: column-level tracking | Lineage view: source -> model -> report -> dashboard | Object dependencies | LookML project structure | Data Model Viewer associations |
| Impact analysis | Content downstream of data source | What breaks if I change X? | Object dependency tree | Content validation scans | N/A |
| Usage tracking | View counts, access logs | Workspace usage analytics | Audit trail | API usage, feature adoption | Admin analytics |
| Scheduling | Scheduled extracts, subscriptions | Scheduled refresh, email subscriptions | Job scheduling with caching | PDT regeneration schedules, scheduled Looks delivery | Reload tasks, subscriptions |

### 9.2 What phz-grid Already Has

- **Artifact visibility** (`shared/artifacts/artifact-visibility.ts`): Access control metadata.
- **Usage analytics adapter** (`shared/adapters/usage-analytics-adapter.ts`): Usage tracking integration.
- **Subscription adapter** (`shared/adapters/subscription-adapter.ts`): Email/notification subscription management.
- **Alert channel adapter** (`shared/adapters/alert-channel-adapter.ts`): Alert delivery channels.
- **Filter admin service** (`engine/criteria/filter-admin.ts`): CRUD with admin permissions.
- **Dependency graph** (`engine/dependency-graph.ts`): Expression and filter dependency tracking.
- **phz-alert-panel** widget: Alert notification center.
- **Config merge** (`engine/config-merge.ts`): Layer-based config override (template -> user -> session).
- **Embed manager** (`engine/embed-manager.ts`): Multi-instance isolation.

### 9.3 Gap Analysis

| Capability | Industry Standard | phz-grid Status | Gap |
|-----------|------------------|----------------|-----|
| Role-based access | Admin/Editor/Viewer roles | Artifact visibility exists | Needs role enforcement in shells |
| Certification badges | Visual badge on certified content | Not built | **Gap**: needs endorsement metadata + UI |
| Lineage view | Visual graph of data flow | Dependency graph engine exists | **Gap**: needs lineage visualization UI |
| Impact analysis | "What breaks if I change X?" | Dependency graph can compute this | Needs UI surface |
| Usage tracking | View counts, last accessed | Adapter interface exists | Needs implementation + UI |
| Scheduling | Refresh and delivery schedules | Subscription adapter exists | Needs scheduling UI + job runner |

### 9.4 Prioritized Options

**P0**
- Surface existing artifact visibility controls in the workspace UI
- Add "owner" and "description" fields to all artifact creation forms

**P1**
- Certification/endorsement badges on catalog cards
- Lineage visualization (render dependency graph as visual diagram)
- Usage stats on catalog items (view count, last accessed)

**P2**
- Full RBAC enforcement across shells
- Scheduled refresh and email delivery
- Impact analysis UI ("what depends on this data source?")

---

## 10. Emerging Patterns

### 10.1 AI-Assisted Authoring

**What the industry does**: Tableau Pulse, Power BI Copilot, Qlik Insight Advisor, Looker + Gemini. Natural language to chart/report. Automatic anomaly narratives. Smart chart type suggestions.

**phz-grid status**: Anomaly detector exists. Expression evaluator and formula parser exist. No NL interface.

**Options**: This is a P3 capability. The semantic model (dimension/measure classification) and chart widget library provide the foundation. An AI layer could map "show me sales by region over time" to a line chart config.

### 10.2 Metric Layer / Semantic Layer

**What the industry does**: Centralized metric definitions consumed by all tools and AI agents. dbt MetricFlow, Cube Core, Looker LookML, Databricks AI/BI.

**phz-grid status**: MetricCatalog + KPIRegistry already serve this role. The gap is making them accessible outside the workspace (API exposure, cross-tool consumption).

**Options**: P2 priority. Expose metric definitions via API for external consumption. This positions phz-grid as a semantic layer, not just a visualization tool.

### 10.3 Headless BI / API-First

**What the industry does**: Decouple semantic layer from UI. Expose APIs and SDKs. Enable embedding in custom apps. Cube Core, Sisense Compose SDK, Looker API.

**phz-grid status**: Architecture already supports this. Web components are embeddable. DataAdapter SPI is pluggable. Widget resolver is pure function (no DOM dependency). Embed manager handles multi-instance isolation.

**Options**: Already architecturally positioned. Document the embedding API surface.

---

## Summary: Priority Matrix

| Priority | Category | Item |
|----------|----------|------|
| **P0** | Layout | Use `phz-report-editor` and `phz-dashboard-editor` in workspace (done) |
| **P0** | Data | Enhance data panel to show sources with field lists and type icons |
| **P0** | Data | Integrate data preview into source selection |
| **P0** | Semantic | Add dimension/measure role to field schema |
| **P0** | Semantic | Group fields by role in data panel (dimensions above, measures below) |
| **P0** | Semantic | Wire metric/KPI forms into workbench sidebar |
| **P0** | Reports | Add chart type toggle to report editor (grid + chart preview) |
| **P0** | Reports | Expose conditional formatting in report config panel |
| **P0** | Filters | Wire criteria bar into workspace editors |
| **P0** | Drill | Wire drill-through config into report editor |
| **P0** | Drill | Add drill breadcrumb/back navigation |
| **P0** | Admin | Surface artifact visibility controls |
| **P1** | Data | Visual relationship editor for multi-table models |
| **P1** | Data | Schema browser (db/schema/table/column) |
| **P1** | Semantic | Hierarchy definitions and date auto-hierarchy |
| **P1** | Semantic | "Show Me" chart recommendation panel |
| **P1** | Reports | Encoding card for chart field mapping |
| **P1** | Reports | Subtotal configuration |
| **P1** | Dashboard | Widget type palette in left panel |
| **P1** | Dashboard | Visual cross-filter rule editor |
| **P1** | Dashboard | Edit/preview mode toggle |
| **P1** | Filters | Relative date filter type |
| **P1** | Drill | Hierarchy-based drill paths |
| **P1** | Admin | Certification badges on catalog cards |
| **P1** | Admin | Lineage visualization |
| **P1** | Admin | Usage stats on catalog items |
| **P2** | Data | Transform layer |
| **P2** | Data | Custom SQL editor |
| **P2** | Semantic | Smart field classification |
| **P2** | Dashboard | Device layout editor |
| **P2** | Dashboard | Stories/presentation mode |
| **P2** | Filters | Associative filtering |
| **P2** | Admin | Full RBAC enforcement |
| **P2** | Admin | Scheduled refresh and delivery |
| **P3** | AI | Natural language to chart |
| **P3** | AI | Auto-generated metric insights |
| **P3** | API | Headless BI API surface documentation |
