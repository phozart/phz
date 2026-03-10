# phz-grid v14 API Reference

> **Package**: `@phozart/phz-workspace`
> **Sprints covered**: S (Visual Design System), T (Enterprise Data Architecture),
> U (Enterprise Filter Architecture), V (Navigation & Artifacts), W (Local Playground)
>
> **v15 additions**: See [API-REFERENCE-V15.md](./API-REFERENCE-V15.md) for
> new exports from `@phozart/phz-shared`, `@phozart/phz-viewer`,
> `@phozart/phz-editor`, and new engine subsystems.

---

## Table of Contents

1. [Visual Design System](#1-visual-design-system)
   - [1.1 Design Tokens](#11-design-tokens)
   - [1.2 Shell Layout Constants](#12-shell-layout-constants)
   - [1.3 Responsive Breakpoints](#13-responsive-breakpoints)
   - [1.4 Container Queries](#14-container-queries)
   - [1.5 Explorer Visual Helpers](#15-explorer-visual-helpers)
   - [1.6 Component Patterns](#16-component-patterns)
   - [1.7 Shell Roles](#17-shell-roles)
   - [1.8 Mobile Interactions](#18-mobile-interactions)
   - [1.9 Catalog Visual Helpers](#19-catalog-visual-helpers)
2. [Enterprise Data Architecture](#2-enterprise-data-architecture)
   - [2.1 DataAdapter Interface](#21-dataadapter-interface)
   - [2.2 DataQuery & DataResult](#22-dataquery--dataresult)
   - [2.3 QueryStrategy & Query Layer](#23-querystrategy--query-layer)
   - [2.4 DashboardDataConfig](#24-dashboarddataconfig)
   - [2.5 Arrow IPC Support](#25-arrow-ipc-support)
   - [2.6 Dashboard Data Pipeline](#26-dashboard-data-pipeline)
   - [2.7 Detail Source Loader](#27-detail-source-loader)
   - [2.8 Loading Indicator State](#28-loading-indicator-state)
   - [2.9 Time Intelligence](#29-time-intelligence)
   - [2.10 Field Mapping](#210-field-mapping)
   - [2.11 QueryCoordinator](#211-querycoordinator)
3. [Enterprise Filter Architecture](#3-enterprise-filter-architecture)
   - [3.1 FilterDefinition](#31-filterdefinition)
   - [3.2 FilterValueSource & FilterBinding](#32-filtervaluesource--filterbinding)
   - [3.3 SecurityBinding](#33-securitybinding)
   - [3.4 FilterRule Engine](#34-filterrule-engine)
   - [3.5 ArtifactFilterContract](#35-artifactfiltercontract)
   - [3.6 Filter Contract Resolver](#36-filter-contract-resolver)
   - [3.7 Filter Ownership Model](#37-filter-ownership-model)
   - [3.8 FilterRule Editor](#38-filterrule-editor)
4. [Navigation & Drill-Through](#4-navigation--drill-through)
   - [4.1 NavigationLink](#41-navigationlink)
   - [4.2 Navigation Mapper](#42-navigation-mapper)
   - [4.3 Navigation Validator](#43-navigation-validator)
   - [4.4 Navigation Editor](#44-navigation-editor)
   - [4.5 Navigation Events](#45-navigation-events)
5. [Artifact Management](#5-artifact-management)
   - [5.1 ArtifactVisibility](#51-artifactvisibility)
   - [5.2 DefaultPresentation](#52-defaultpresentation)
   - [5.3 Grid Artifacts](#53-grid-artifacts)
6. [Local Playground](#6-local-playground)
   - [6.1 LocalDataStore](#61-localdatastore)
   - [6.2 FileUploadManager](#62-fileuploadmanager)
   - [6.3 Upload Preview & Sheet Picker](#63-upload-preview--sheet-picker)
   - [6.4 Data Source Panel](#64-data-source-panel)
   - [6.5 Cross-Tier Compatibility](#65-cross-tier-compatibility)
   - [6.6 Demo Datasets](#66-demo-datasets)

---

## 1. Visual Design System

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/styles/`

All visual design helpers are pure functions with no DOM dependency. They are safe to call in Node, workers, and SSR environments.

---

### 1.1 Design Tokens

**Source**: `packages/workspace/src/styles/design-tokens.ts`

#### `DESIGN_TOKENS`

```ts
export const DESIGN_TOKENS: {
  // Colors
  headerBg: '#1C1917'; bgBase: '#FEFDFB'; bgSubtle: '#FAF9F7';
  bgMuted: '#F5F5F4'; bgEmphasis: '#292524';
  textPrimary: '#1C1917'; textSecondary: '#57534E';
  textMuted: '#78716C'; textFaint: '#A8A29E';
  borderDefault: '#E7E5E4'; borderEmphasis: '#D6D3D1';
  headerText: '#FAFAF9'; headerTextMuted: '#A8A29E';
  headerBorder: '#292524'; headerAccent: '#F59E0B';
  primary500: '#3B82F6'; info500: '#06B6D4';
  error500: '#EF4444'; warning500: '#F59E0B';
  // Spacing (4px grid)
  space1: '4px' … space16: '64px';
  // Typography
  fontSans: string; fontMono: string;
  textXs: '11px' … text2xl: '24px';
  // Radii
  radiusSm: '6px' … radiusFull: '9999px';
  // Shadows (warm multi-layer)
  shadowXs … shadow2xl: string;
}
```

A `const` object of all design token values. Use directly in JavaScript or generate CSS custom properties with `generateTokenCSS()`.

**Example**:
```ts
import { DESIGN_TOKENS } from '@phozart/phz-workspace';
console.log(DESIGN_TOKENS.primary500); // '#3B82F6'
```

#### `generateTokenCSS(): string`

**Pure** — Returns a `:root { ... }` CSS block that sets all `--phz-*` custom properties from `DESIGN_TOKENS`.

```ts
import { generateTokenCSS } from '@phozart/phz-workspace';
document.head.insertAdjacentHTML('beforeend', `<style>${generateTokenCSS()}</style>`);
```

Maps token keys to CSS variable names, e.g. `headerBg` → `--phz-header-bg`.

---

### 1.2 Shell Layout Constants

**Source**: `packages/workspace/src/styles/design-tokens.ts`

#### `SHELL_LAYOUT`

```ts
export const SHELL_LAYOUT: {
  headerHeight: 56;       // px
  sidebarWidth: 240;      // px
  contentMaxWidth: 1440;  // px
  headerZ: 50;            // z-index
}
```

Layout constants for shell component positioning and CSS calculations.

#### `SECTION_HEADERS`

```ts
export const SECTION_HEADERS: readonly ['CONTENT', 'DATA', 'GOVERN']
```

The three fixed sidebar section identifiers.

---

### 1.3 Responsive Breakpoints

**Source**: `packages/workspace/src/styles/responsive.ts`

#### `BREAKPOINT_VALUES`

```ts
export const BREAKPOINT_VALUES: {
  mobile: 768;   // px — below this is 'mobile'
  tablet: 1024;  // px — below this is 'tablet'
  laptop: 1280;  // px — below this is 'laptop'; above is 'desktop'
}
```

#### `ViewportBreakpoint`

```ts
export type ViewportBreakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';
```

#### `getViewportBreakpoint(width: number): ViewportBreakpoint`

**Pure** — Maps a pixel width to the named breakpoint tier.

```ts
getViewportBreakpoint(500);  // 'mobile'
getViewportBreakpoint(900);  // 'tablet'
getViewportBreakpoint(1100); // 'laptop'
getViewportBreakpoint(1500); // 'desktop'
```

#### `BreakpointClasses`

```ts
export interface BreakpointClasses {
  sidebar: string;
  header: string;
  content: string;
  hamburger?: string;   // present on 'tablet'
  bottomBar?: string;   // present on 'mobile'
}
```

#### `getBreakpointClasses(breakpoint: ViewportBreakpoint): BreakpointClasses`

**Pure** — Returns CSS class strings for each shell region at the given breakpoint.

| Breakpoint | `sidebar` | `hamburger` | `bottomBar` |
|------------|-----------|-------------|-------------|
| `desktop`  | `sidebar--full` | — | — |
| `laptop`   | `sidebar--icon-only` | — | — |
| `tablet`   | `sidebar--overlay` | `hamburger--visible` | — |
| `mobile`   | `sidebar--hidden` | — | `bottom-bar--visible` |

```ts
const classes = getBreakpointClasses('tablet');
// { sidebar: 'sidebar--overlay', header: 'header--full',
//   content: 'content--full', hamburger: 'hamburger--visible' }
```

#### `BottomTabItem`

```ts
export interface BottomTabItem {
  id: string;
  label: string;
  icon: string;
  section?: string;
}
```

#### `getBottomTabItems(role: WorkspaceRole): BottomTabItem[]`

**Pure** — Returns the mobile bottom-tab items visible to the given role. Admins get all 5 tabs; Authors get CONTENT + DATA tabs; Viewers get catalog and dashboards only.

See also: [1.7 Shell Roles](#17-shell-roles)

---

### 1.4 Container Queries

**Source**: `packages/workspace/src/styles/container-queries.ts`

Pure width-to-CSS-class mappers for widgets adapting to their container size.

#### `getKPICardClass(width: number): string`

| Width range | Class |
|-------------|-------|
| > 280px | `kpi--full` |
| 200–280px | `kpi--compact` |
| < 200px | `kpi--minimal` |

#### `getChartClass(width: number): string`

| Width range | Class |
|-------------|-------|
| > 400px | `chart--full` |
| 280–400px | `chart--no-legend` |
| 160–280px | `chart--no-labels` |
| < 160px | `chart--single-value` |

#### `getTableClass(width: number): string`

| Width range | Class |
|-------------|-------|
| > 600px | `table--all` |
| 400–600px | `table--hide-low` |
| 300–400px | `table--hide-medium` |
| < 300px | `table--card` |

#### `getFilterBarClass(width: number): string`

| Width range | Class |
|-------------|-------|
| > 600px | `filter-bar--row` |
| 400–600px | `filter-bar--two-col` |
| < 400px | `filter-bar--vertical` |

#### `ColumnPriority` / `PriorityColumn`

```ts
export type ColumnPriority = 'high' | 'medium' | 'low';

export interface PriorityColumn {
  name: string;
  priority: ColumnPriority;
}
```

#### `getVisibleColumns(columns: PriorityColumn[], width: number): string[]`

**Pure** — Filters column names by priority based on container width. Returns all columns above 600px, `high`+`medium` above 400px, `high`-only below 400px.

```ts
const cols = [
  { name: 'id', priority: 'high' },
  { name: 'name', priority: 'high' },
  { name: 'notes', priority: 'low' },
];
getVisibleColumns(cols, 350); // ['id', 'name']
```

---

### 1.5 Explorer Visual Helpers

**Source**: `packages/workspace/src/styles/explorer-visual.ts`

#### `EXPLORER_LAYOUT`

```ts
export const EXPLORER_LAYOUT: {
  fieldPaletteWidth: 260;   // px
  configPanelWidth: 360;    // px
  widgetPaletteWidth: 260;  // px
}
```

#### `getFieldTypeIcon(dataType: string): string`

**Pure** — Returns a single-character icon for a field data type.

| `dataType` | Icon |
|------------|------|
| `'string'` | `Aa` |
| `'number'` | `#` |
| `'date'` | `☰` |
| `'boolean'` | `✓` |
| other | `•` |

#### `getCardinalityBadgeClass(cardinality: string): string`

**Pure** — Returns `badge--cardinality-${cardinality}`.

#### `getDropZoneClass(zoneType: string, dragOver: boolean): string`

**Pure** — Returns `drop-zone drop-zone--${zoneType}` with `drop-zone--active` appended when `dragOver` is `true`.

#### `SQL_PREVIEW_THEME`

```ts
export const SQL_PREVIEW_THEME: {
  background: '#1C1917';
  textColor: '#E7E5E4';
  keywordColor: '#3B82F6';
  stringColor: '#10B981';
  commentColor: '#78716C';
  lineNumberColor: '#57534E';
}
```

---

### 1.6 Component Patterns

**Source**: `packages/workspace/src/styles/component-patterns.ts`

#### `getFormDensityClasses(density: 'compact' | 'default'): FormDensityClasses`

**Pure** — Returns CSS class strings for form elements at the given density.

```ts
export interface FormDensityClasses {
  label: string;  // 'form-label--compact' | 'form-label--default'
  input: string;  // 'form-input--compact' | 'form-input--default'
  toggle: string; // 'form-toggle--compact' | 'form-toggle--default'
}
```

#### `getModalClasses(options: { open: boolean }): ModalClasses`

**Pure** — Returns modal backdrop and container CSS class strings.

```ts
export interface ModalClasses {
  backdrop: string;   // 'modal-backdrop' or 'modal-backdrop modal-backdrop--visible'
  container: string;  // always 'modal-container'
}
```

#### `DRAWER_DEFAULTS`

```ts
export const DRAWER_DEFAULTS: { width: 400; maxWidth: 560 }
```

#### `getDrawerClasses(options: { open: boolean; position: 'left' | 'right' }): DrawerClasses`

**Pure** — Returns drawer CSS class string with open/position modifiers.

#### `getEmptyStateProps(stateType: string): EmptyStateProps`

**Pure** — Returns icon, title, description, and optional CTA for a named empty state.

```ts
export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
}
```

Built-in state types: `'no-data'`, `'no-results'`, `'no-selection'`, `'empty-dashboard'`. Unknown types return a generic fallback.

#### `getSkeletonClass(variant: 'text' | 'card' | 'chart' | 'table'): string`

**Pure** — Returns `skeleton skeleton--${variant}`.

#### `STATUS_BADGE_VARIANTS`

```ts
export const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant>
// Keys: 'published' | 'shared' | 'personal' | 'draft' | 'breach' | 'processing'

export interface BadgeVariant {
  bgColor: string;
  textColor: string;
  label: string;
}
```

#### `getOverflowClasses(): OverflowClasses`

**Pure** — Returns CSS class names for text truncation, min-width, and word-break helpers.

---

### 1.7 Shell Roles

**Source**: `packages/workspace/src/shell/shell-roles.ts`

#### `WorkspaceRole`

```ts
export type WorkspaceRole = 'admin' | 'author' | 'viewer';
```

#### `isValidRole(role: string): role is WorkspaceRole`

**Pure** — Type guard for `WorkspaceRole` membership.

#### `ShellConfig`

```ts
export interface ShellConfig {
  sidebarSections: SidebarSection[];  // 'CONTENT' | 'DATA' | 'GOVERN'
  showSidebar: boolean;
  canPublish: boolean;
  canSetAlert: boolean;
  filterMode: FilterMode;    // 'full' | 'limited' | 'readonly'
  catalogMode: CatalogMode;  // 'full' | 'card'
  presetOnly: boolean;
}
```

#### `getShellConfig(role: WorkspaceRole): ShellConfig`

**Pure** — Returns the complete shell configuration for a role.

| Role | `sidebarSections` | `canPublish` | `filterMode` | `catalogMode` |
|------|-------------------|--------------|--------------|---------------|
| `admin` | CONTENT, DATA, GOVERN | `true` | `full` | `full` |
| `author` | CONTENT, DATA | `false` | `limited` | `full` |
| `viewer` | _(empty)_ | `false` | `readonly` | `card` |

```ts
const config = getShellConfig('author');
config.canPublish; // false
config.filterMode; // 'limited'
```

#### `RoleNavItem`

```ts
export interface RoleNavItem {
  id: string;
  label: string;
  icon: string;
  section: SidebarSection;
}
```

#### `getNavItemsForRole(role: WorkspaceRole): RoleNavItem[]`

**Pure** — Returns the sidebar navigation items the role may see. Viewers get only `catalog` and `dashboards` regardless of section. Authors get CONTENT + DATA sections. Admins get all sections including GOVERN.

---

### 1.8 Mobile Interactions

**Source**: `packages/workspace/src/shell/mobile-interactions.ts`

#### `createBottomSheetConfig(overrides?: Partial<BottomSheetConfig>): BottomSheetConfig`

**Pure** — Creates a bottom sheet configuration with sensible defaults.

```ts
export interface BottomSheetConfig {
  maxHeight: string;          // default '90vh'
  dragHandle: boolean;        // default true
  overscrollContain: boolean; // default true
}
```

#### `getBottomSheetClasses(open: boolean): BottomSheetClasses`

**Pure** — Returns CSS class strings for a bottom sheet and its overlay.

```ts
export interface BottomSheetClasses {
  sheet: string;    // 'bottom-sheet' or 'bottom-sheet bottom-sheet--open'
  overlay: string;  // 'bottom-sheet-overlay' or '... bottom-sheet-overlay--visible'
  handle: string;   // always 'bottom-sheet-handle'
}
```

#### `detectSwipe(start: TouchPoint, end: TouchPoint, options?: SwipeOptions): SwipeDirection | null`

**Pure** — Detects swipe direction from two touch points. Returns `null` if the travel distance is below `minDistance` (default 50px).

```ts
export interface TouchPoint { x: number; y: number; time: number; }
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

detectSwipe({ x: 0, y: 0, time: 0 }, { x: 100, y: 10, time: 100 });
// 'right'
```

#### `getMobileDashboardLayout(): MobileDashboardLayout`

**Pure** — Returns the fixed single-column mobile dashboard layout config.

```ts
export interface MobileDashboardLayout {
  columns: 1;
  filterCollapsed: true;
  singleColumn: true;
}
```

#### `getFloatingActionBarClasses(selectedCount: number): string`

**Pure** — Returns `'fab fab--visible'` when items are selected, `'fab'` otherwise.

#### `getTapToPlaceConfig(): TapToPlaceConfig`

**Pure** — Returns the default tap-to-place configuration for mobile dashboard building (`mode: 'tap'`, `insertPosition: 'end'`).

---

### 1.9 Catalog Visual Helpers

**Source**: `packages/workspace/src/catalog/catalog-visual.ts`

#### `VISIBILITY_TABS`

```ts
export const VISIBILITY_TABS: VisibilityTab[]
// [{ id: 'my-work', label: 'My Work' },
//  { id: 'shared',  label: 'Shared' },
//  { id: 'published', label: 'Published' }]
```

#### `ARTIFACT_TYPE_COLORS`

```ts
export const ARTIFACT_TYPE_COLORS: Record<ArtifactType, string>
// 'dashboard' → '#3B82F6', 'report' → '#10B981', etc.
```

#### `getArtifactCardProps(artifact: ArtifactMeta): ArtifactCardProps`

**Pure** — Returns the display properties for an artifact card.

```ts
export interface ArtifactCardProps {
  typeIcon: string;
  typeColor: string;
  displayName: string;
  truncatedDescription?: string; // max 120 chars, suffixed '...'
}
```

#### `getStatusBadge(artifact: ArtifactMeta): StatusBadge`

**Pure** — Returns a `{ label, variant }` status badge. `published === true` → `'published'` variant; otherwise `'draft'`.

#### `filterByVisibility(artifacts: ArtifactMeta[], tabId: string): ArtifactMeta[]`

**Pure** — Filters artifacts by visibility tab. `'published'` → published only; `'my-work'` → unpublished only; `'shared'` → returns all (shared logic requires user context).

---

## 2. Enterprise Data Architecture

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/data-adapter.ts`, `packages/workspace/src/types.ts`, `packages/workspace/src/coordination/`, `packages/workspace/src/filters/query-layer.ts`

---

### 2.1 DataAdapter Interface

**Source**: `packages/workspace/src/data-adapter.ts`

The `DataAdapter` is the **consumer-provided** data backend SPI. The workspace never ships a data adapter — applications provide their own.

```ts
export interface DataAdapter {
  execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult>;

  getSchema(sourceId?: string): Promise<DataSourceSchema>;

  listDataSources(): Promise<DataSourceSummary[]>;

  getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }>;

  getFieldStats(
    sourceId: string,
    field: string,
    filters?: unknown,
  ): Promise<{
    min?: number; max?: number;
    distinctCount: number; nullCount: number; totalCount: number;
  }>;
}
```

**Methods**:

| Method | Pure/Stateful | Description |
|--------|--------------|-------------|
| `execute` | Stateful | Run a structured query; returns rows + metadata |
| `getSchema` | Stateful | Fetch field metadata for a data source |
| `listDataSources` | Stateful | List all available data sources |
| `getDistinctValues` | Stateful | Get unique values for a field (for filter dropdowns) |
| `getFieldStats` | Stateful | Get numeric stats for a field (for range filters) |

The `viewerContext` parameter passes user identity attributes to the adapter for row-level security. The `signal` parameter enables query cancellation.

**Minimal implementation**:
```ts
const adapter: DataAdapter = {
  async execute(query) {
    const res = await fetch('/api/query', { method: 'POST', body: JSON.stringify(query) });
    return res.json();
  },
  async getSchema() { return { id: 'main', name: 'Main', fields: [] }; },
  async listDataSources() { return []; },
  async getDistinctValues() { return { values: [], totalCount: 0, truncated: false }; },
  async getFieldStats() { return { distinctCount: 0, nullCount: 0, totalCount: 0 }; },
};
```

---

### 2.2 DataQuery & DataResult

#### `DataQuery`

```ts
export interface DataQuery {
  source: string;               // data source ID
  fields: string[];
  filters?: unknown;            // FilterExpression (opaque — passed to adapter)
  groupBy?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  aggregations?: AggregationSpec[];
  pivotBy?: FieldReference[];
  windows?: WindowSpec[];
  strategy?: QueryStrategy;     // see §2.3
}
```

#### `AggregationSpec`

```ts
export interface AggregationSpec {
  field: string;
  function: AggregationFunction; // 'sum'|'avg'|'count'|'countDistinct'|'min'|'max'|'median'|'stddev'|'variance'|'first'|'last'
  alias?: string;
}
```

#### `WindowSpec`

```ts
export interface WindowSpec {
  field: string;
  function: WindowFunction; // 'runningTotal'|'rank'|'denseRank'|'rowNumber'|'lag'|'lead'|'percentOfTotal'|'periodOverPeriod'
  partitionBy?: string[];
  orderBy?: string[];
  alias: string;
  offset?: number;        // for lag/lead
  periodField?: string;   // for periodOverPeriod
  periodGranularity?: string;
}
```

#### `DataResult`

```ts
export interface DataResult {
  columns: ColumnDescriptor[];  // [{ name: string; dataType: string }]
  rows: unknown[][];
  metadata: {
    totalRows: number;
    truncated: boolean;
    queryTimeMs: number;
    quality?: DataQualityInfo;
  };
  arrowBuffer?: ArrayBuffer;    // optional Arrow IPC payload — see §2.5
}
```

---

### 2.3 QueryStrategy & Query Layer

#### `QueryStrategy`

```ts
export interface QueryStrategy {
  execution: 'server' | 'cache' | 'auto';
  cacheKey?: string;
  cacheTTL?: number;        // milliseconds
  estimatedRows?: number;
}
```

Attach a `strategy` to any `DataQuery` to hint execution behaviour. The `DataAdapter` may use or ignore this hint.

**Source**: `packages/workspace/src/filters/query-layer.ts`

#### `resolveQueryLayer(queryLayer: 'server' | 'client' | 'auto' | undefined, hints?: { estimatedRows?: number }): 'server' | 'client'`

**Pure** — Resolves the abstract layer to a concrete execution decision.

| Input | Result |
|-------|--------|
| `'server'` | `'server'` |
| `'client'` | `'client'` |
| `'auto'` | `'server'` if `estimatedRows > 10000`, else `'client'` |
| `undefined` | `'server'` (safe default) |

```ts
resolveQueryLayer('auto', { estimatedRows: 5000 });  // 'client'
resolveQueryLayer('auto', { estimatedRows: 50000 }); // 'server'
resolveQueryLayer(undefined);                        // 'server'
```

#### `classifyFilterChange(filterDef: DashboardFilterDef): 'reload' | 'requery'`

**Pure** — Classifies a filter change for the pipeline: server-layer filters return `'reload'` (full data fetch needed); client-layer filters return `'requery'` (local filter only).

---

### 2.4 DashboardDataConfig

**Source**: `packages/workspace/src/types.ts`

Describes the two-phase loading strategy for a dashboard (preload for fast render + full load for complete data).

#### `DashboardDataConfig`

```ts
export interface DashboardDataConfig {
  preload: PreloadConfig;
  fullLoad: FullLoadConfig;
  detailSources?: DetailSourceConfig[];
  transition?: 'seamless' | 'fade' | 'replace';
}

export interface PreloadConfig {
  query: DataQuery;
  usePersonalView?: boolean;
}

export interface FullLoadConfig {
  query: DataQuery;
  applyCurrentFilters?: boolean;
  maxRows?: number;
}
```

The `transition` field controls the visual handoff from preload to full-load data. Defaults to `'seamless'`.

#### `DetailTrigger`

```ts
export type DetailTrigger =
  | 'user-action'
  | { type: 'drill-through'; fromWidgetTypes?: string[] }
  | { type: 'breach' };
```

#### `DetailSourceConfig`

```ts
export interface DetailSourceConfig {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  filterMapping: FieldMappingEntry[];   // [{ sourceField, targetField }]
  baseQuery: DataQuery;
  preloadQuery?: DataQuery;
  maxRows?: number;
  trigger: DetailTrigger;
  renderMode?: 'panel' | 'modal' | 'navigate';
}
```

#### `DashboardLoadingState`

```ts
export interface DashboardLoadingState {
  phase: 'idle' | 'preloading' | 'preload-complete' | 'full-loading' | 'full-complete' | 'error';
  message?: string;
  progress?: number;  // 0–100
  error?: string;
}
```

#### `isDashboardDataConfig(obj: unknown): obj is DashboardDataConfig`

**Pure** — Type guard. Validates presence of `preload.query` and `fullLoad.query`.

#### `validateDashboardDataConfig(config: DashboardDataConfig): boolean`

**Pure** — Validates the config: checks `isDashboardDataConfig`, optional `transition` value, non-negative `maxRows`, and all `detailSources` via `isDetailSourceConfig`.

```ts
const config: DashboardDataConfig = {
  preload: { query: { source: 'sales', fields: ['region', 'revenue'], limit: 100 } },
  fullLoad: { query: { source: 'sales', fields: ['region', 'revenue'] } },
  transition: 'seamless',
};
validateDashboardDataConfig(config); // true
```

---

### 2.5 Arrow IPC Support

**Source**: `packages/workspace/src/data-adapter.ts`

`DataResult.arrowBuffer` is an optional `ArrayBuffer` containing an Apache Arrow IPC serialized record batch. Widgets receive row data as `rows[][]`; the `arrowBuffer` enables local in-process query via DuckDB-WASM.

#### `hasArrowBuffer(result: DataResult): boolean`

**Pure** — Returns `true` when `result.arrowBuffer` is a non-empty `ArrayBuffer`.

```ts
if (hasArrowBuffer(result)) {
  // result.arrowBuffer is safe to pass to DuckDB-WASM
  await duckdb.insertArrowFromIPCStream(conn, result.arrowBuffer!);
}
```

---

### 2.6 Dashboard Data Pipeline

**Source**: `packages/workspace/src/coordination/dashboard-data-pipeline.ts`

Manages the two-phase parallel data load (preload + full load), state change notifications, and re-invalidation on server filter changes.

#### `DashboardDataPipeline`

```ts
export interface DashboardDataPipeline {
  readonly state: DashboardLoadingState;
  start(): Promise<void>;
  onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
  getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
  invalidate(): Promise<void>;
  destroy(): void;
}
```

| Method | Description |
|--------|-------------|
| `state` | Current `DashboardLoadingState` snapshot (getter, returns copy) |
| `start()` | Fires preload and full-load queries in parallel; resolves when both complete |
| `onStateChange(cb)` | Subscribe to state transitions. Returns unsubscribe function |
| `getWidgetData(id, tier)` | Returns `DataResult` for the tier. `'both'` prefers full, falls back to preload |
| `invalidate()` | Clears cached results and re-runs the full pipeline |
| `destroy()` | Clears listeners and cached results; stops all callbacks |

#### `createDashboardDataPipeline(config: DashboardDataConfig, dataAdapter: DataAdapter, filterContext: FilterContextManager): DashboardDataPipeline`

**Stateful** — Factory. The returned pipeline is ready to `start()`.

```ts
const pipeline = createDashboardDataPipeline(config, adapter, filterCtx);
pipeline.onStateChange(state => console.log(state.phase));
await pipeline.start();
const data = pipeline.getWidgetData('kpi-1', 'both');
```

---

### 2.7 Detail Source Loader

**Source**: `packages/workspace/src/coordination/detail-source-loader.ts`

Loads drill-through, breach, and user-action detail data by mapping current filter context to the detail source query.

#### `DetailSourceLoader`

```ts
export interface DetailSourceLoader {
  loadDetail(sourceId: string, context: DetailLoadContext): Promise<DataResult>;
  getAvailableSources(trigger: DetailTrigger): DetailSourceConfig[];
  destroy(): void;
}

export interface DetailLoadContext {
  currentFilters: Record<string, unknown>;
  clickedRow?: Record<string, unknown>;
  breachData?: unknown;
}
```

#### `createDetailSourceLoader(sources: DetailSourceConfig[], dataAdapter: DataAdapter): DetailSourceLoader`

**Stateful** — Factory. Sources are immutable after construction; `destroy()` is a no-op.

`loadDetail` applies `filterMapping` entries: each entry maps a `sourceField` from `currentFilters` or `clickedRow` to a `targetField` on the detail query. When `preloadQuery` is defined, both the preload and base queries fire in parallel; the base result is returned.

```ts
const loader = createDetailSourceLoader(detailSources, adapter);

// On row click:
const sources = loader.getAvailableSources({ type: 'drill-through', fromWidgetTypes: ['bar-chart'] });
const data = await loader.loadDetail(sources[0].id, {
  currentFilters: { region: 'North' },
  clickedRow: { region: 'North', product: 'Widget A' },
});
```

---

### 2.8 Loading Indicator State

**Source**: `packages/workspace/src/layout/phz-loading-indicator.ts`

Pure state machine for loading progress indicators. The Lit rendering component consumes this state separately.

#### `LoadingIndicatorState`

```ts
export interface LoadingIndicatorState {
  getPhase(): DashboardLoadingState['phase'];
  isVisible(): boolean;
  getMessage(): string | undefined;
  getProgress(): number;            // 0–100
  setPhase(phase, message?): void;
  setProgress(progress: number): void;
  subscribe(listener: () => void): () => void;  // returns unsubscribe
  destroy(): void;
}
```

#### `createLoadingIndicatorState(): LoadingIndicatorState`

**Stateful** — Creates a loading indicator state manager. The indicator auto-dismisses 3 seconds after `'full-complete'`. `destroy()` cancels any pending dismiss timer and clears listeners.

```ts
const indicator = createLoadingIndicatorState();
indicator.subscribe(() => {
  if (indicator.isVisible()) {
    progressBar.value = indicator.getProgress();
  }
});
indicator.setPhase('preloading');
indicator.setProgress(50);
indicator.setPhase('full-complete'); // auto-hides after 3s
```

---

### 2.9 Time Intelligence

**Source**: `packages/workspace/src/data-adapter.ts`

#### `TimeIntelligenceConfig`

```ts
export interface TimeIntelligenceConfig {
  primaryDateField: string;
  fiscalYearStartMonth: number;      // 1–12, default 1 (January)
  weekStartDay: 'sunday' | 'monday';
  granularities: TimeGranularity[];  // 'day'|'week'|'month'|'quarter'|'year'
  relativePeriods: RelativePeriod[];
}
```

#### `RelativePeriod`

```ts
export interface RelativePeriod {
  id: string;
  label: string;
  calculate: (referenceDate: Date, config: TimeIntelligenceConfig) => { from: Date; to: Date };
}
```

#### `DEFAULT_RELATIVE_PERIODS: RelativePeriod[]`

14 built-in periods: `'today'`, `'yesterday'`, `'this-week'`, `'last-week'`, `'this-month'`, `'last-month'`, `'this-quarter'`, `'last-quarter'`, `'this-year'`, `'last-year'`, `'last-7-days'`, `'last-30-days'`, `'last-90-days'`, `'last-365-days'`.

Fiscal periods (`this-quarter`, `last-quarter`, `this-year`, `last-year`) respect `fiscalYearStartMonth`.

#### `resolvePeriod(periodId: string, config: TimeIntelligenceConfig, referenceDate?: Date): { from: Date; to: Date }`

**Pure** — Calculates the absolute date range for a named relative period. Throws if `periodId` is not found in `config.relativePeriods`.

```ts
const config: TimeIntelligenceConfig = {
  primaryDateField: 'date', fiscalYearStartMonth: 4,
  weekStartDay: 'monday', granularities: ['day', 'month', 'year'],
  relativePeriods: DEFAULT_RELATIVE_PERIODS,
};
const { from, to } = resolvePeriod('last-30-days', config, new Date('2024-06-01'));
```

---

### 2.10 Field Mapping

**Source**: `packages/workspace/src/types.ts`

Enables canonical field names across multiple data sources.

#### `FieldMapping`

```ts
export interface FieldMapping {
  canonicalField: string;
  sources: Array<{ dataSourceId: string; field: string }>;
}
```

#### `resolveFieldForSource(canonicalField: string, dataSourceId: string, mappings: FieldMapping[]): string`

**Pure** — Returns the source-specific field name for a canonical field. Falls back to the canonical field name if no mapping exists.

#### `autoSuggestMappings(schemas: FieldMappingSchema[]): FieldMapping[]`

**Pure** — Finds fields that share the same name and data type across two or more schemas and returns them as `FieldMapping` suggestions. Only fields appearing in at least 2 sources are included.

```ts
const mappings = autoSuggestMappings([
  { dataSourceId: 'crm', fields: [{ name: 'region', dataType: 'string' }] },
  { dataSourceId: 'erp', fields: [{ name: 'region', dataType: 'string' }] },
]);
// [{ canonicalField: 'region', sources: [{ dataSourceId: 'crm', field: 'region' }, ...] }]
```

---

### 2.11 QueryCoordinator

**Source**: `packages/workspace/src/data-adapter.ts`

Batches concurrent widget data queries to avoid fan-out during dashboard load.

#### `QueryCoordinator`

```ts
export interface QueryCoordinator {
  submit(widgetId: string, query: CoordinatorQuery): Promise<CoordinatorResult>;
  flush(): Promise<void>;
  cancel(widgetId: string): void;
}

export interface QueryCoordinatorConfig {
  maxConcurrent: number;  // default 4
  batchWindowMs: number;  // default 50ms
}
```

#### `defaultQueryCoordinatorConfig(overrides?: Partial<QueryCoordinatorConfig>): QueryCoordinatorConfig`

**Pure** — Returns `{ maxConcurrent: 4, batchWindowMs: 50 }` merged with any overrides.

---

## 3. Enterprise Filter Architecture

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/filters/`

---

### 3.1 FilterDefinition

**Source**: `packages/workspace/src/filters/filter-definition.ts`

Centrally managed filter catalog artifacts. Each definition describes a reusable filter: its value source, data source bindings, security restrictions, dependencies, and default value.

#### `FilterDefinition`

```ts
export interface FilterDefinition {
  id: string;
  label: string;
  description?: string;
  filterType: 'select' | 'multi-select' | 'range' | 'date-range' | 'text' | 'boolean';
  valueSource: FilterValueSource;   // see §3.2
  bindings: FilterBinding[];        // see §3.2
  securityBinding?: SecurityBinding; // see §3.3
  dependsOn?: string[];             // IDs of parent FilterDefinitions
  defaultValue?: FilterDefault;     // see §3.2
  required?: boolean;               // default false
}
```

#### `createFilterDefinition(input: Omit<FilterDefinition, 'id'> & { id?: string }): FilterDefinition`

**Pure** — Factory. Auto-generates `id` if omitted; clones `bindings` and `dependsOn` arrays.

```ts
const fd = createFilterDefinition({
  label: 'Region',
  filterType: 'select',
  valueSource: { type: 'data-source', dataSourceId: 'sales', field: 'region' },
  bindings: [{ dataSourceId: 'sales', targetField: 'region' }],
});
```

#### `validateFilterDefinition(fd: FilterDefinition): ValidationResult`

**Pure** — Validates label, filterType, and valueSource configuration. Returns `{ valid: boolean; errors: string[] }`.

| Error condition | Message |
|-----------------|---------|
| Empty label | `'label is required'` |
| Unknown filterType | `'invalid filterType: ...'` |
| `data-source` without `field` | `'data-source valueSource requires a non-empty field'` |
| `lookup-table` with empty entries | `'lookup-table valueSource requires at least one entry'` |

#### `isFilterDefinition(obj: unknown): obj is FilterDefinition`

**Pure** — Type guard.

#### `resolveBindingsForSource(bindings: FilterBinding[], dataSourceId: string): FilterBinding[]`

**Pure** — Filters to bindings matching a specific data source.

#### `resolveFilterDefault(def: FilterDefault, viewer?: ViewerContext): unknown`

**Pure** — Resolves a `FilterDefault` to a concrete value.

| `def.type` | Resolution |
|------------|------------|
| `'static'` | Returns `def.value` |
| `'viewer-attribute'` | Returns `viewer.attributes[def.attribute]` |
| `'relative-date'` | Returns `new Date(now + offset * unit_ms)` |
| `'expression'` | Returns `def.expr` (string, for data-layer evaluation) |

#### `evaluateSecurityBinding(binding: SecurityBinding, viewer: ViewerContext | undefined, allValues: unknown[]): unknown[]`

**Pure** — Filters `allValues` by the viewer's attribute. See §3.3 for `restrictionType` semantics.

---

### 3.2 FilterValueSource & FilterBinding

**Source**: `packages/workspace/src/types.ts`

#### `FilterValueSource`

```ts
export type FilterValueSource =
  | { type: 'data-source'; dataSourceId: string; field: string; sort?: 'asc' | 'desc'; limit?: number }
  | { type: 'lookup-table'; entries: Array<{ value: string; label: string }> }
  | { type: 'static'; values: string[] };
```

#### `FilterValueTransform`

```ts
export type FilterValueTransform =
  | { type: 'lookup'; lookupSourceId: string; keyField: string; valueField: string }
  | { type: 'expression'; expr: string }
  | { type: 'granularity-shift'; from: string; to: string };
```

#### `FilterDefault`

```ts
export type FilterDefault =
  | { type: 'static'; value: unknown }
  | { type: 'relative-date'; offset: number; unit: 'days' | 'weeks' | 'months' | 'years' }
  | { type: 'viewer-attribute'; attribute: string }
  | { type: 'expression'; expr: string };
```

#### `FilterBinding`

```ts
export interface FilterBinding {
  dataSourceId: string;
  targetField: string;
  transform?: FilterValueTransform;
  lookupConfig?: { lookupSourceId: string; keyField: string; valueField: string };
}
```

---

### 3.3 SecurityBinding

**Source**: `packages/workspace/src/filters/filter-definition.ts`

Row-level security for filter values based on viewer attributes.

```ts
export interface SecurityBinding {
  viewerAttribute: string;
  restrictionType: 'include-only' | 'exclude' | 'max-value';
}
```

| `restrictionType` | Behaviour |
|-------------------|-----------|
| `'include-only'` | Keep only values in the viewer's attribute (whitelist) |
| `'exclude'` | Remove values in the viewer's attribute (blacklist) |
| `'max-value'` | Keep only numeric values ≤ the viewer's attribute |

Used via `evaluateSecurityBinding()` (see §3.1).

---

### 3.4 FilterRule Engine

**Source**: `packages/workspace/src/filters/filter-rule-engine.ts`

Evaluates conditional business rules against filter state and viewer context. Rules can restrict, hide, disable, or force filter values.

#### `FilterRule`

```ts
export interface FilterRule {
  id: string;
  name: string;
  description?: string;
  priority: number;             // lower number = higher priority
  conditions: FilterRuleCondition[];
  conditionLogic?: 'and' | 'or'; // default 'and'
  actions: FilterRuleAction[];
  enabled: boolean;
}
```

#### `FilterRuleCondition`

```ts
export type FilterRuleCondition =
  | { type: 'field-value'; filterDefinitionId: string; operator: 'eq'|'neq'|'in'|'not-in'|'gt'|'lt'; value: unknown }
  | { type: 'viewer-attribute'; attribute: string; operator: 'eq'|'neq'|'in'|'not-in'; value: unknown }
  | { type: 'compound'; logic: 'and'|'or'; conditions: FilterRuleCondition[] };
```

#### `FilterRuleAction`

```ts
export type FilterRuleAction =
  | { type: 'restrict'; filterDefinitionId: string; allowedValues: unknown[] }
  | { type: 'hide'; filterDefinitionId: string }
  | { type: 'disable'; filterDefinitionId: string; message?: string }
  | { type: 'force'; filterDefinitionId: string; value: unknown };
```

#### `evaluateCondition(condition: FilterRuleCondition, viewer: ViewerContext | undefined, filterState: Record<string, unknown>): boolean`

**Pure** — Evaluates a single condition (field-value, viewer-attribute, or compound). Missing state values evaluate to `false`.

#### `evaluateFilterRules(rules: FilterRule[], viewerContext: ViewerContext | undefined, currentFilterState: Record<string, unknown>): FilterRuleResult[]`

**Pure** — Evaluates all enabled rules sorted by priority. Returns one `FilterRuleResult` per rule. Non-matching rules return `actions: []`.

```ts
export interface FilterRuleResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: FilterRuleAction[];
}
```

```ts
const results = evaluateFilterRules(rules, viewer, { region: 'North' });
const activeActions = results.filter(r => r.matched).flatMap(r => r.actions);
```

---

### 3.5 ArtifactFilterContract

**Source**: `packages/workspace/src/types.ts`

Declares which `FilterDefinition`s a specific artifact accepts, with optional per-artifact overrides and validation behavior.

```ts
export interface ArtifactFilterContract {
  acceptedFilters: DashboardFilterRef[];
  validation?: { onInvalid: 'prune' | 'clamp' | 'invalidate' | 'ignore' };
  transforms?: Record<string, FilterValueTransform>;
  defaults?: Record<string, FilterDefault>;
}

export interface DashboardFilterRef {
  filterDefinitionId: string;
  overrides?: { label?: string; required?: boolean; defaultValue?: FilterDefault };
  queryLayer?: 'server' | 'client' | 'auto';
}
```

`onInvalid` controls validation behavior when filter values don't match the contract:
- `'prune'` (default) — removes invalid values silently
- `'clamp'` — replaces with first allowed value
- `'invalidate'` — marks the whole filter set invalid
- `'ignore'` — passes through values unchanged

---

### 3.6 Filter Contract Resolver

**Source**: `packages/workspace/src/filters/filter-contract-resolver.ts`

#### `ResolvedFilter`

```ts
export interface ResolvedFilter {
  definition: FilterDefinition;
  overrides: DashboardFilterRef['overrides'];
  queryLayer: 'server' | 'client' | 'auto';
  resolvedDefault?: unknown;
}

export interface ResolvedFilterContract {
  filters: ResolvedFilter[];
  warnings: string[];
}
```

#### `resolveFilterContract(contract: ArtifactFilterContract, definitions: FilterDefinition[], viewerContext?: ViewerContext): ResolvedFilterContract`

**Pure** — Resolves filter definition IDs in the contract against the provided catalog. Missing definitions produce warnings rather than errors. Override defaults take precedence over definition defaults; viewer context is used for `viewer-attribute` defaults.

```ts
const { filters, warnings } = resolveFilterContract(contract, allDefinitions, viewer);
filters.forEach(f => console.log(f.definition.label, f.resolvedDefault));
```

#### `validateFilterValues(contract: ArtifactFilterContract, values: Record<string, unknown>, definitions: FilterDefinition[]): FilterValuesValidation`

**Pure** — Validates a set of filter values against the contract. Filters not in the contract are always pruned. Values against `static` sources are validated according to `onInvalid`.

```ts
export interface FilterValuesValidation {
  valid: boolean;
  pruned: Record<string, unknown>;  // the safe subset of values to use
  warnings: string[];
}
```

```ts
const { pruned, warnings } = validateFilterValues(contract, userValues, definitions);
// Use 'pruned' to apply filters safely
```

See also: `resolveFiltersFromContract()` in §3.7 for a higher-level orchestration helper.

---

### 3.7 Filter Ownership Model

**Source**: `packages/workspace/src/filters/filter-ownership.ts`

Orchestrates the full filter lifecycle: contract resolution, default computation, preset application, security restrictions, and filter bar construction.

#### `resolveFiltersFromContract(contract, definitions, viewerContext?, presetValues?): ContractFilterResolution`

**Pure** — High-level orchestration. Resolves the contract, computes defaults, and merges preset values. Preset values take precedence over defaults.

```ts
export interface ContractFilterResolution {
  filters: Array<{
    definition: FilterDefinition;
    queryLayer: 'server' | 'client' | 'auto';
    label: string;
    required: boolean;
  }>;
  defaults: Record<string, unknown>;
  effectiveValues: Record<string, unknown>;  // preset ?? default
}
```

```ts
const { filters, effectiveValues } = resolveFiltersFromContract(
  contract, definitions, viewer, savedPreset
);
// effectiveValues is ready to use as the initial filter state
```

#### `prunePresetValues(presetValues, contract, definitions): PruneResult`

**Pure** — Removes preset values for filters no longer in the contract (e.g. after an admin removes a filter). Returns `{ pruned: Record<string, unknown>; removed: string[] }`.

#### `applySecurityRestrictions(definition, viewer, allValues): unknown[]`

**Pure** — Delegates to `evaluateSecurityBinding()`. Returns `allValues` unchanged if the definition has no `securityBinding`.

#### `buildFilterBarFromContract(contract, definitions): FilterBarEntry[]`

**Pure** — Builds a flat list of filter bar entries from the contract and definitions. Applies label/required overrides from the contract refs.

```ts
export interface FilterBarEntry {
  id: string;
  label: string;
  filterType: FilterDefinition['filterType'];
  required: boolean;
  defaultValue?: unknown;
  bindings: FilterBinding[];
}
```

---

### 3.8 FilterRule Editor

**Source**: `packages/workspace/src/filters/filter-rule-editor.ts`

Headless state management for authoring `FilterRule`s. All operations return new state objects (immutable update pattern).

#### `FilterRuleEditorState`

```ts
export interface FilterRuleEditorState {
  id?: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditionLogic: 'and' | 'or';
  conditions: FilterRuleCondition[];
  actions: FilterRuleAction[];
}
```

#### `createFilterRuleEditorState(rule?: FilterRule): FilterRuleEditorState`

**Pure** — Creates editor state from an existing rule, or returns a blank state for new rules.

#### `validateRuleState(state: FilterRuleEditorState): RuleValidationResult`

**Pure** — Validates that name, at least one condition, and at least one action are present.

#### Immutable update helpers (all **pure**)

| Function | Signature | Description |
|----------|-----------|-------------|
| `addCondition` | `(state, condition) → state` | Appends a condition |
| `removeCondition` | `(state, index) → state` | Removes condition at index |
| `updateCondition` | `(state, index, condition) → state` | Replaces condition at index |
| `addAction` | `(state, action) → state` | Appends an action |
| `removeAction` | `(state, index) → state` | Removes action at index |
| `updateAction` | `(state, index, action) → state` | Replaces action at index |

#### `getRuleFromState(state: FilterRuleEditorState): FilterRule`

**Pure** — Extracts a `FilterRule` from editor state. Auto-generates an `id` if one is not present.

---

## 4. Navigation & Drill-Through

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/navigation/`

---

### 4.1 NavigationLink

**Source**: `packages/workspace/src/navigation/navigation-link.ts`

Defines cross-artifact drill-through links. A link connects a source artifact to a target artifact and optionally maps source field values to the target's filter definitions.

#### `NavigationLink`

```ts
export interface NavigationLink {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  targetArtifactType: ArtifactType;
  label: string;
  description?: string;
  filterMappings: NavigationFilterMapping[];
  openBehavior?: NavigationOpenBehavior;  // default 'same-panel'
  icon?: string;
}

export type NavigationOpenBehavior = 'same-panel' | 'new-tab' | 'modal' | 'slide-over';

export interface NavigationFilterMapping {
  sourceField: string;
  targetFilterDefinitionId: string;
  transform: 'passthrough' | 'lookup' | 'expression';
  transformExpr?: string;
}
```

#### `createNavigationLink(input): NavigationLink`

**Pure** — Factory. Auto-generates `id` if omitted. `filterMappings` defaults to `[]`. `openBehavior` defaults to `'same-panel'`.

```ts
const link = createNavigationLink({
  sourceArtifactId: 'dashboard-1',
  targetArtifactId: 'report-99',
  targetArtifactType: 'report',
  label: 'View Detail',
  filterMappings: [{ sourceField: 'region', targetFilterDefinitionId: 'fd-region', transform: 'passthrough' }],
});
```

#### `isNavigationLink(obj: unknown): obj is NavigationLink`

**Pure** — Type guard.

#### `resolveNavigationFilters(mappings: NavigationFilterMapping[], sourceValues: Record<string, unknown>): Record<string, unknown>`

**Pure** — Maps source field values to target filter definition IDs using `passthrough` transform. `lookup` and `expression` transforms are resolved at the data layer.

#### `detectCircularLinks(links: NavigationLink[]): string[][]`

**Pure** — DFS cycle detection across the navigation graph. Returns an array of cycles, each cycle being an ordered list of artifact IDs. Returns `[]` if no cycles exist.

```ts
const cycles = detectCircularLinks(allLinks);
if (cycles.length > 0) {
  console.warn('Circular navigation detected:', cycles);
}
```

---

### 4.2 Navigation Mapper

**Source**: `packages/workspace/src/navigation/navigation-editor.ts`

#### `autoMapFilters(sourceFields: string[], targetFilterDefinitions: FilterDefinition[]): NavigationFilterMapping[]`

**Pure** — Automatically maps source fields to target filter definitions by comparing each source field name against `FilterBinding.targetField` values. First match wins per source field.

```ts
const mappings = autoMapFilters(['region', 'date'], targetFilterDefs);
// Returns mappings for fields that match a target filter binding
```

---

### 4.3 Navigation Validator

**Source**: `packages/workspace/src/navigation/navigation-editor.ts`

#### `validateNavigationEditorState(state: NavigationEditorState): NavigationValidationResult`

**Pure** — Validates that `targetArtifactId` and `label` are non-empty.

```ts
export interface NavigationValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

### 4.4 Navigation Editor

**Source**: `packages/workspace/src/navigation/navigation-editor.ts`

Headless state management for authoring `NavigationLink`s.

#### `NavigationEditorState`

```ts
export interface NavigationEditorState {
  id?: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  targetArtifactType: ArtifactType;
  label: string;
  description?: string;
  filterMappings: NavigationFilterMapping[];
  openBehavior: NavigationOpenBehavior;
}
```

#### `createNavigationEditorState(sourceArtifactId: string, existingLink?: NavigationLink): NavigationEditorState`

**Pure** — Creates editor state. If `existingLink` is provided, initializes from the existing link; otherwise creates blank state for a new link.

#### Immutable update helpers (all **pure**)

| Function | Signature | Description |
|----------|-----------|-------------|
| `setTarget` | `(state, targetId, targetType, label) → state` | Sets the target artifact |
| `addFilterMapping` | `(state, mapping) → state` | Appends a filter mapping |
| `removeFilterMapping` | `(state, index) → state` | Removes a filter mapping at index |
| `setOpenBehavior` | `(state, behavior) → state` | Sets the open behavior |

#### `getNavigationLink(state: NavigationEditorState): NavigationLink`

**Pure** — Extracts a `NavigationLink` from editor state. Auto-generates an `id` if not present.

---

### 4.5 Navigation Events

**Source**: `packages/workspace/src/navigation/navigation-event.ts`

#### `NavigationFilter`

```ts
export interface NavigationFilter {
  filterDefinitionId: string;
  value: unknown;
}
```

#### `buildNavigationEvent(link: NavigationLink, sourceValues: Record<string, unknown>): WidgetEvent & { filters: NavigationFilter[] }`

**Pure** — Builds a typed `navigate` `WidgetEvent` from a link and the current source field values. Resolves filter mappings via `resolveNavigationFilters()`.

```ts
const event = buildNavigationEvent(link, { region: 'North' });
// { type: 'navigate', targetArtifactId: '...', filters: [{ filterDefinitionId: 'fd-region', value: 'North' }] }
```

#### `emitNavigationEvent(bus: InteractionBus, link: NavigationLink, sourceValues: Record<string, unknown>): void`

**Stateful** — Builds the navigation event and emits it on the `InteractionBus`. Use this in widget click handlers.

```ts
// Inside a widget's click handler:
emitNavigationEvent(this.interactionBus, link, { region: clickedRegion });
```

---

## 5. Artifact Management

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/navigation/`

---

### 5.1 ArtifactVisibility

**Source**: `packages/workspace/src/navigation/artifact-visibility.ts`

Manages the personal/shared/published lifecycle for workspace artifacts.

#### `ArtifactVisibility`

```ts
export type ArtifactVisibility = 'personal' | 'shared' | 'published';
```

#### `VisibilityMeta`

```ts
export interface VisibilityMeta {
  id: string;
  type: ArtifactType;
  name: string;
  visibility: ArtifactVisibility;
  ownerId: string;
  sharedWith?: string[];  // role names
  description?: string;
}
```

#### `isVisibleToViewer(meta: VisibilityMeta, viewer: ViewerContext | undefined): boolean`

**Pure** — Determines if a viewer may see an artifact.

| Visibility | Visible when |
|------------|-------------|
| `'published'` | Always |
| `'personal'` | `viewer.userId === meta.ownerId` |
| `'shared'` | Owner, or viewer's roles overlap `meta.sharedWith` |

#### `groupByVisibility(artifacts: VisibilityMeta[]): VisibilityGroup`

**Pure** — Partitions artifacts into `{ personal, shared, published }` buckets.

#### `canTransition(from: ArtifactVisibility, to: ArtifactVisibility): boolean`

**Pure** — Returns `true` for all transitions except `from === to`. All three states can transition to each other.

#### `transitionVisibility(meta: VisibilityMeta, to: ArtifactVisibility, sharedWith?: string[]): VisibilityMeta`

**Pure** — Returns updated metadata with the new visibility. No-ops if the transition is invalid. When transitioning to `'shared'`, `sharedWith` sets the role list.

#### `duplicateWithVisibility(meta: VisibilityMeta, newOwnerId: string): VisibilityMeta`

**Pure** — Creates a copy of the artifact with a new ID, `"(Copy)"` suffix on the name, `'personal'` visibility, and the new owner. Clears `sharedWith`.

---

### 5.2 DefaultPresentation

**Source**: `packages/workspace/src/navigation/default-presentation.ts`

Admin-defined presentation defaults for grid artifacts. Viewers can create `PersonalView`s that override specific settings.

#### `DefaultPresentation`

```ts
export interface DefaultPresentation {
  density: 'compact' | 'dense' | 'comfortable';
  theme: string;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  hiddenColumns: string[];
  frozenColumns?: number;
  sortState?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}
```

#### `createDefaultPresentation(overrides: Partial<DefaultPresentation>): DefaultPresentation`

**Pure** — Creates a `DefaultPresentation` with sensible defaults (`comfortable` density, `light` theme, empty column config).

#### `mergePresentation(admin: DefaultPresentation, user: Partial<DefaultPresentation>): DefaultPresentation`

**Pure** — Merges admin defaults with user overrides. User values take precedence. `columnWidths` is merged (spread): admin widths are the base, user widths override per-column.

#### `PersonalView`

```ts
export interface PersonalView {
  id: string;
  userId: string;
  artifactId: string;
  presentation: Partial<DefaultPresentation>;
  filterValues: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
```

#### `createPersonalView(input): PersonalView`

**Pure** — Factory. Sets `createdAt` and `updatedAt` to `Date.now()`. Auto-generates ID.

#### `applyPersonalView(adminDefaults: DefaultPresentation, personalView: PersonalView | undefined): { presentation: DefaultPresentation; filterValues: Record<string, unknown> }`

**Pure** — Returns the merged presentation and filter values. When `personalView` is `undefined`, returns admin defaults and empty filter values.

```ts
const { presentation, filterValues } = applyPersonalView(adminDefaults, userView);
grid.density = presentation.density;
grid.theme = presentation.theme;
```

---

### 5.3 Grid Artifacts

**Source**: `packages/workspace/src/navigation/grid-artifact.ts`

Enables grid configurations to be saved, cataloged, and navigated to as first-class artifacts alongside reports and dashboards.

#### `GridArtifact`

```ts
export interface GridArtifact {
  id: string;
  type: 'grid-definition';
  name: string;
  description?: string;
  dataSourceId: string;
  columns: GridColumnConfig[];
  defaultSort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  defaultFilters?: Record<string, unknown>;
  density?: 'compact' | 'dense' | 'comfortable';
  enableGrouping?: boolean;
  enableExport?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GridColumnConfig {
  field: string;
  header?: string;
  width?: number;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}
```

#### `createGridArtifact(input): GridArtifact`

**Pure** — Factory. Sets `type` to `'grid-definition'`, generates `id`, and stamps `createdAt`/`updatedAt`.

#### `isGridArtifact(obj: unknown): obj is GridArtifact`

**Pure** — Type guard. Validates `id`, `type === 'grid-definition'`, `name`, `dataSourceId`, and `columns` array.

#### `gridArtifactToMeta(artifact: GridArtifact): ArtifactMeta`

**Pure** — Converts a `GridArtifact` to the lightweight `ArtifactMeta` shape used in the catalog browser.

```ts
const meta = gridArtifactToMeta(artifact);
// { id, type: 'grid-definition', name, description, createdAt, updatedAt }
```

---

## 6. Local Playground

**Import path**: `@phozart/phz-workspace`
**Source**: `packages/workspace/src/local/`

The Local Playground provides in-browser data analysis without a server. All modules are pure-function state helpers; OPFS and DuckDB-WASM operations are handled by the calling layer.

---

### 6.1 LocalDataStore

**Source**: `packages/workspace/src/local/local-data-store.ts`

Session management for local data analysis sessions.

#### `SessionMeta`

```ts
export interface SessionMeta {
  id: string;         // 'session-{timestamp}-{counter}'
  name: string;
  createdAt: number;
  updatedAt: number;
  tables: TableInfo[];
}

export interface TableInfo {
  tableName: string;
  rowCount: number;
  sourceFile: string;
}
```

#### `createSessionMeta(options: { name: string }): SessionMeta`

**Pure** — Creates a new session with a unique ID, empty tables, and current timestamp.

#### `registerTable(session: SessionMeta, table: TableInfo): SessionMeta`

**Pure** — Returns a new session with `table` appended and `updatedAt` refreshed.

#### `SessionList` operations (all **pure**)

| Function | Signature | Description |
|----------|-----------|-------------|
| `createSessionList` | `() → SessionList` | Empty list |
| `addSession` | `(list, session) → SessionList` | Append session |
| `removeSession` | `(list, sessionId) → SessionList` | Filter out by ID |
| `updateSession` | `(list, sessionId, updates) → SessionList` | Update `name`, refreshes `updatedAt` |

#### `getResumePrompt(list: SessionList): ResumePrompt`

**Pure** — Returns sessions sorted by `updatedAt` descending for the "resume a previous session" UI.

```ts
export interface ResumePrompt {
  hasRecent: boolean;
  sessions: SessionMeta[];  // sorted newest-first
}
```

#### `ExportManifest` / `validateImportManifest`

```ts
export interface ExportManifest {
  version: number;    // always 1
  sessionName: string;
  tables: TableInfo[];
  credentials?: undefined;  // intentionally excluded
}
```

`createExportManifest(session)` — **Pure** — Creates a manifest from session data.
`validateImportManifest(data)` — **Pure** — Validates manifest shape; returns `{ valid, errors? }`.

#### `DEFAULT_AUTO_SAVE_CONFIG`

```ts
export const DEFAULT_AUTO_SAVE_CONFIG: { intervalMs: 30000; enabled: true }
```

---

### 6.2 FileUploadManager

**Source**: `packages/workspace/src/local/file-upload-manager.ts`

File format detection, upload option defaults, filename sanitization, and file input configuration.

#### `FileFormat`

```ts
export type FileFormat = 'csv' | 'excel' | 'parquet' | 'json' | 'unknown';
export const SUPPORTED_FORMATS: FileFormat[] = ['csv', 'excel', 'parquet', 'json'];
```

#### `detectFileFormat(filename: string): FileFormat`

**Pure** — Detects format from file extension. Supports `.csv`, `.tsv`, `.xlsx`, `.xls`, `.parquet`, `.json`, `.jsonl`, `.ndjson`. Returns `'unknown'` for unrecognized extensions.

```ts
detectFileFormat('sales_2024.xlsx'); // 'excel'
detectFileFormat('data.parquet');    // 'parquet'
```

#### `createUploadOptions(format: FileFormat, overrides?: Partial<UploadOptions>): UploadOptions`

**Pure** — Returns default upload options for the format, merged with overrides.

```ts
export interface UploadOptions {
  hasHeader: boolean;    // always true by default
  delimiter?: string;    // CSV only, default ','
  encoding?: string;     // CSV only, default 'utf-8'
  sheetIndex?: number;   // Excel only, default 0
}
```

#### `validateFileName(filename: string): FileNameValidation`

**Pure** — Derives a SQL-safe table name from the file name. Lowercases, replaces non-alphanumeric chars with `_`, strips leading/trailing underscores.

```ts
export interface FileNameValidation {
  valid: boolean;
  tableName: string;    // e.g. 'sales_2024' from 'Sales 2024.csv'
  error?: string;
}
```

#### `getAcceptAttribute(): string`

**Pure** — Returns the `accept` string for HTML file inputs: `'.csv,.tsv,.xlsx,.xls,.parquet,.json,.jsonl,.ndjson'`.

---

### 6.3 Upload Preview & Sheet Picker

**Source**: `packages/workspace/src/local/upload-preview.ts`

#### `createPreviewState(): PreviewState`

**Pure** — Creates an empty preview state (20-row limit, no data).

```ts
export interface PreviewState {
  rows: string[][];
  columns: string[];
  columnTypes: ColumnTypeInfo[];
  maxPreviewRows: number;  // 20
  loading: boolean;
}
```

#### `inferColumnTypes(rows: string[][], columnNames: string[]): ColumnTypeInfo[]`

**Pure** — Infers column types from sample data using heuristics. Checks boolean (true/false/0/1/yes/no), number, date (ISO-like), then falls back to string.

```ts
export interface ColumnTypeInfo {
  name: string;
  inferredType: 'string' | 'number' | 'date' | 'boolean';
  overridden: boolean;  // true when user has manually set the type
}
```

#### `applyTypeOverride(types: ColumnTypeInfo[], columnName: string, newType: ColumnTypeInfo['inferredType']): ColumnTypeInfo[]`

**Pure** — Returns updated types array with the named column's type changed and `overridden: true` set.

#### Sheet picker helpers (all **pure**)

```ts
export interface SheetInfo { index: number; name: string; selected: boolean; }

createSheetList(sheetNames: string[]): SheetInfo[]   // first sheet pre-selected
selectSheet(sheets: SheetInfo[], sheetIndex: number): SheetInfo[]
```

---

### 6.4 Data Source Panel

**Source**: `packages/workspace/src/local/data-source-panel.ts`

#### `SOURCE_TYPE_ICONS`

```ts
export const SOURCE_TYPE_ICONS: Record<string, string>
// 'csv' → '☰', 'excel' → '☷', 'parquet' → '▦', 'json' → '{}', etc.
```

#### `getRefreshBadge(status: FreshnessStatus): RefreshBadge`

**Pure** — Returns label, variant, and color for a data freshness status badge.

```ts
export type FreshnessStatus = 'fresh' | 'stale' | 'unknown';

export interface RefreshBadge {
  label: string;
  variant: FreshnessStatus;
  bgColor: string;
  textColor: string;
}
```

#### `DATA_SOURCE_PICKER_OPTIONS`

```ts
export const DATA_SOURCE_PICKER_OPTIONS: DataSourcePickerOption[]
// Three options: 'upload', 'connect', 'sample'
```

#### `getSourceDisplayProps(source: SourceInfo): SourceDisplayProps`

**Pure** — Returns the display icon, formatted row count (`"1,234 rows"` or `"Unknown rows"`), and optional freshness badge for a data source.

```ts
export interface SourceInfo {
  id: string; name: string; sourceType: string;
  rowCount?: number; freshnessStatus?: FreshnessStatus;
}

export interface SourceDisplayProps {
  icon: string;
  displayName: string;
  formattedRowCount: string;
  badge?: RefreshBadge;
}
```

---

### 6.5 Cross-Tier Compatibility

**Source**: `packages/workspace/src/local/session-compat.ts`

Shared format for session export/import between the browser (OPFS) and `@phozart/phz-local` server tiers.

#### `SESSION_FORMAT_VERSION = 1`

Current format version. Import validation rejects bundles from future versions.

#### `ExportBundle`

```ts
export interface ExportBundle {
  version: number;
  sessionName: string;
  tables: TableInfo[];
  exportedAt: number;
  source?: 'browser' | 'phz-local';
  serverConfig?: Record<string, unknown>;
}
```

#### `createExportBundle(input: ExportBundleInput): ExportBundle`

**Pure** — Creates a versioned export bundle with the current timestamp.

#### `validateExportBundle(data: unknown): BundleValidation`

**Pure** — Validates bundle structure and version compatibility. Returns `{ valid, errors }`. Rejects bundles with a version greater than `SESSION_FORMAT_VERSION`.

#### `isLocalServerBundle(data: unknown): boolean`

**Pure** — Returns `true` if the bundle originated from `@phozart/phz-local`.

#### `convertBundleForImport(bundle: ExportBundle): ImportBundle`

**Pure** — Strips server-specific metadata (config, source tag) for safe import into either tier.

```ts
// Import flow:
const raw = JSON.parse(zipEntry);
const { valid, errors } = validateExportBundle(raw);
if (!valid) throw new Error(errors.join(', '));
const importData = convertBundleForImport(raw as ExportBundle);
```

---

### 6.6 Demo Datasets

**Source**: `packages/workspace/src/local/demo-datasets.ts`

#### `SAMPLE_DATASETS: SampleDataset[]`

Three built-in sample datasets:

| ID | Name | Description |
|----|------|-------------|
| `'sales'` | Sales Transactions | 7 columns: order_id, date, region, product, quantity, revenue, discount |
| `'inventory'` | Product Inventory | 7 columns: sku, product_name, category, quantity_on_hand, reorder_point, unit_cost, in_stock |
| `'employees'` | Employee Directory | 7 columns: employee_id, name, department, title, hire_date, salary, active |

```ts
export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  columns: DatasetColumn[];  // [{ name: string; type: 'string'|'number'|'date'|'boolean' }]
}
```

#### `generateSampleRows(dataset: SampleDataset, count: number): unknown[][]`

**Pure** — Generates deterministic sample rows for a dataset using seeded patterns. Safe to call in tests. Unknown dataset IDs return rows of `null` values.

```ts
const rows = generateSampleRows(SAMPLE_DATASETS[0], 100);
// 100 rows for 'sales' with seeded regions, products, and revenue values
```

---

*This document was generated from source on 2026-03-08.*
