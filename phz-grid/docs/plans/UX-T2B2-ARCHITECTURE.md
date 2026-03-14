# UX T2-B2 Architecture Spec

**Items**: UX-012 (Widget Preview Thumbnails), UX-013 (Data Freshness Indicator)
**Created**: 2026-03-13

---

## UX-012: Widget Preview Thumbnails

### Problem

Dashboard builder and widget palette currently display emoji icons or icon name strings for widgets. Users cannot visually distinguish between widget types at a glance, making widget selection slower and less intuitive.

### Solution

Create a headless state machine for widget thumbnail management. Provide default SVG thumbnail data for all 13 built-in widget types. The state machine manages thumbnail lookup, loading states (for async/custom thumbnails), and category-based queries.

### Architecture

**Pattern**: Headless state machine (pure functions, immutable state) — matches ADR-001.
**Package**: `@phozart/workspace` under `workspace/src/registry/`

#### State Shape

```typescript
interface WidgetThumbnailState {
  thumbnails: Record<string, ThumbnailEntry>; // keyed by widget type
  loading: ReadonlySet<string>; // types currently loading
  errors: Record<string, string>; // type → error message
}

interface ThumbnailEntry {
  type: string; // widget type
  svgPath: string; // SVG path data (d attribute) for icon-style thumbnail
  category: string; // 'charts' | 'kpis' | 'tables' | 'navigation'
  label: string; // display label
  variantThumbnails: Record<string, string>; // variantId → svgPath override
}
```

#### Functions

| Function                     | Signature                                    | Purpose                                |
| ---------------------------- | -------------------------------------------- | -------------------------------------- |
| `createWidgetThumbnailState` | `() => WidgetThumbnailState`                 | Factory with all 13 default thumbnails |
| `getThumbnail`               | `(state, type) => ThumbnailEntry \| null`    | Lookup by widget type                  |
| `getThumbnailsByCategory`    | `(state, category) => ThumbnailEntry[]`      | Filter by category                     |
| `getVariantThumbnail`        | `(state, type, variantId) => string \| null` | Get variant-specific SVG               |
| `setCustomThumbnail`         | `(state, type, svgPath) => state`            | Override default thumbnail             |
| `setThumbnailLoading`        | `(state, type) => state`                     | Mark type as loading                   |
| `setThumbnailLoaded`         | `(state, type, entry) => state`              | Resolve loaded thumbnail               |
| `setThumbnailError`          | `(state, type, error) => state`              | Record loading error                   |

#### Default Thumbnails

Simple SVG path data for each of the 13 built-in types:

- `kpi-card`, `kpi-scorecard` — single value indicators
- `bar-chart`, `line-chart`, `area-chart`, `pie-chart` — chart icons
- `trend-line`, `bottom-n`, `gauge` — specialized visuals
- `data-table`, `pivot-table`, `status-table` — table icons
- `drill-link` — navigation icon

SVG paths are stored as `d` attribute strings (compact, no external dependencies).

#### Affected Files

| File                                               | Change                                   |
| -------------------------------------------------- | ---------------------------------------- |
| `workspace/src/registry/widget-thumbnail-state.ts` | NEW — state machine + default thumbnails |
| `workspace/src/registry/index.ts`                  | Export new types/functions               |

---

## UX-013: Data Freshness Indicator

### Problem

Users have no visibility into when data was last refreshed. In the viewer, reports and dashboards show data that may be stale without any visual indication. Users must manually refresh to check for updates.

### Solution

Create a headless state machine for data freshness tracking. Computes freshness level (fresh/aging/stale/unknown) from `lastRefreshed` timestamp and configurable thresholds. Pure computation — the "now" time is passed as a parameter, keeping the state machine deterministic and testable.

### Architecture

**Pattern**: Headless state machine (pure functions, immutable state) — matches ADR-001.
**Package**: `@phozart/viewer` under `viewer/src/screens/`

#### State Shape

```typescript
type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

interface DataFreshnessState {
  lastRefreshed: number | null; // epoch ms
  freshThresholdMs: number; // below = fresh (default 60_000 = 1 min)
  staleThresholdMs: number; // above = stale (default 300_000 = 5 min)
  autoRefreshEnabled: boolean; // whether auto-refresh is on
  autoRefreshIntervalMs: number; // auto-refresh interval (default 60_000)
}
```

#### Functions

| Function                   | Signature                            | Purpose                                                    |
| -------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `createDataFreshnessState` | `(overrides?) => DataFreshnessState` | Factory with defaults                                      |
| `recordRefresh`            | `(state, timestamp?) => state`       | Mark data as just refreshed                                |
| `computeFreshnessLevel`    | `(state, now) => FreshnessLevel`     | Deterministic level computation                            |
| `getFreshnessAge`          | `(state, now) => number \| null`     | Elapsed ms since refresh                                   |
| `formatFreshnessLabel`     | `(state, now) => string`             | Human-readable label ("Just now", "2m ago", "Stale (5m+)") |
| `setFreshnessThresholds`   | `(state, fresh, stale) => state`     | Configure thresholds                                       |
| `enableAutoRefresh`        | `(state, intervalMs?) => state`      | Turn on auto-refresh                                       |
| `disableAutoRefresh`       | `(state) => state`                   | Turn off auto-refresh                                      |
| `isRefreshDue`             | `(state, now) => boolean`            | Check if auto-refresh should trigger                       |

#### Freshness Logic

```
now - lastRefreshed < freshThresholdMs  → 'fresh'
now - lastRefreshed < staleThresholdMs  → 'aging'
now - lastRefreshed >= staleThresholdMs → 'stale'
lastRefreshed === null                  → 'unknown'
```

#### Label Format

| Age    | Label             |
| ------ | ----------------- |
| < 10s  | "Just now"        |
| < 60s  | "Xs ago"          |
| < 60m  | "Xm ago"          |
| >= 60m | "Xh Ym ago"       |
| null   | "Never refreshed" |

#### Affected Files

| File                                         | Change                     |
| -------------------------------------------- | -------------------------- |
| `viewer/src/screens/data-freshness-state.ts` | NEW — state machine        |
| `viewer/src/index.ts`                        | Export new types/functions |

---

## Cross-Cutting

- Both state machines are pure functions with no DOM dependency
- Both use `environment: 'node'` Vitest tests
- No changes to existing public APIs
- No changes to existing state machines (report-state, dashboard-state already have `lastRefreshed`)
