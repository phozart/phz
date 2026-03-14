/**
 * Widget Thumbnail State Machine (UX-012)
 *
 * Headless state management for widget preview thumbnails.
 * Stores SVG path data for icon-style thumbnails of each widget type,
 * with support for custom overrides and variant-specific thumbnails.
 *
 * Pure functions — no DOM, no side effects — testable in Node.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single widget thumbnail entry. */
export interface ThumbnailEntry {
  /** Widget type identifier (e.g. 'bar-chart'). */
  type: string;
  /** SVG path data (d attribute) for icon-style thumbnail. */
  svgPath: string;
  /** Widget category: 'charts' | 'kpis' | 'tables' | 'navigation'. */
  category: string;
  /** Human-readable display label. */
  label: string;
  /** Variant-specific SVG path overrides, keyed by variant ID. */
  variantThumbnails: Record<string, string>;
}

/** Root state for the widget thumbnail registry. */
export interface WidgetThumbnailState {
  /** Thumbnail entries keyed by widget type. */
  thumbnails: Record<string, ThumbnailEntry>;
  /** Widget types currently loading a thumbnail. */
  loading: ReadonlySet<string>;
  /** Error messages keyed by widget type. */
  errors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Default SVG path data for all 13 built-in widget types
// ---------------------------------------------------------------------------

const DEFAULT_THUMBNAILS: ThumbnailEntry[] = [
  // KPIs
  {
    type: 'kpi-card',
    svgPath: 'M4 8 L4 2 L20 2 L20 8 L4 8 Z M8 4.5 L16 4.5 M8 6 L13 6',
    category: 'kpis',
    label: 'KPI Card',
    variantThumbnails: {},
  },
  {
    type: 'kpi-scorecard',
    svgPath: 'M2 2 L22 2 L22 14 L2 14 Z M5 5 L10 5 L10 8 L5 8 Z M13 5 L19 5 L19 8 L13 8 Z M5 10 L10 10 L10 12 L5 12 Z M13 10 L19 10 L19 12 L13 12 Z',
    category: 'kpis',
    label: 'KPI Scorecard',
    variantThumbnails: {},
  },

  // Charts
  {
    type: 'bar-chart',
    svgPath: 'M4 18 L4 10 L8 10 L8 18 Z M10 18 L10 4 L14 4 L14 18 Z M16 18 L16 8 L20 8 L20 18 Z M2 18 L22 18',
    category: 'charts',
    label: 'Bar Chart',
    variantThumbnails: {},
  },
  {
    type: 'line-chart',
    svgPath: 'M3 16 L7 8 L11 12 L15 4 L19 9 L23 6 M2 18 L22 18 M2 2 L2 18',
    category: 'charts',
    label: 'Line Chart',
    variantThumbnails: {},
  },
  {
    type: 'area-chart',
    svgPath: 'M2 18 L6 10 L10 13 L14 6 L18 9 L22 5 L22 18 Z M2 18 L22 18',
    category: 'charts',
    label: 'Area Chart',
    variantThumbnails: {},
  },
  {
    type: 'pie-chart',
    svgPath: 'M12 2 A10 10 0 0 1 20.66 7 L12 12 Z M20.66 7 A10 10 0 0 1 12 22 L12 12 Z M12 22 A10 10 0 0 1 3.34 7 L12 12 Z M3.34 7 A10 10 0 0 1 12 2 L12 12 Z',
    category: 'charts',
    label: 'Pie Chart',
    variantThumbnails: {},
  },
  {
    type: 'trend-line',
    svgPath: 'M2 16 L6 14 L10 12 L14 9 L18 6 L22 3 M19 3 L22 3 L22 6',
    category: 'charts',
    label: 'Trend Line',
    variantThumbnails: {},
  },
  {
    type: 'bottom-n',
    svgPath: 'M4 2 L20 2 L20 5 L4 5 Z M4 7 L16 7 L16 10 L4 10 Z M4 12 L12 12 L12 15 L4 15 Z M4 17 L8 17 L8 20 L4 20 Z',
    category: 'charts',
    label: 'Top/Bottom N',
    variantThumbnails: {},
  },
  {
    type: 'gauge',
    svgPath: 'M4 16 A8 8 0 0 1 20 16 M12 16 L12 9 M8 16 L16 16',
    category: 'charts',
    label: 'Gauge',
    variantThumbnails: {},
  },

  // Tables
  {
    type: 'data-table',
    svgPath: 'M2 2 L22 2 L22 18 L2 18 Z M2 6 L22 6 M2 10 L22 10 M2 14 L22 14 M9 2 L9 18 M16 2 L16 18',
    category: 'tables',
    label: 'Data Table',
    variantThumbnails: {},
  },
  {
    type: 'pivot-table',
    svgPath: 'M2 2 L22 2 L22 18 L2 18 Z M2 6 L22 6 M2 10 L22 10 M2 14 L22 14 M9 2 L9 18 M2 2 L9 6 Z',
    category: 'tables',
    label: 'Pivot Table',
    variantThumbnails: {},
  },
  {
    type: 'status-table',
    svgPath: 'M2 2 L22 2 L22 18 L2 18 Z M2 6 L22 6 M2 10 L22 10 M2 14 L22 14 M9 2 L9 18 M19 8 A1 1 0 1 1 19 8.01 M19 12 A1 1 0 1 1 19 12.01 M19 16 A1 1 0 1 1 19 16.01',
    category: 'tables',
    label: 'Status Table',
    variantThumbnails: {},
  },

  // Navigation
  {
    type: 'drill-link',
    svgPath: 'M5 12 L19 12 M14 7 L19 12 L14 17',
    category: 'navigation',
    label: 'Drill Link',
    variantThumbnails: {},
  },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the initial widget thumbnail state with all 13 default thumbnails
 * pre-populated.
 */
export function createWidgetThumbnailState(): WidgetThumbnailState {
  const thumbnails: Record<string, ThumbnailEntry> = {};
  for (const entry of DEFAULT_THUMBNAILS) {
    thumbnails[entry.type] = entry;
  }

  return {
    thumbnails,
    loading: new Set<string>(),
    errors: {},
  };
}

// ---------------------------------------------------------------------------
// Selectors (derived data)
// ---------------------------------------------------------------------------

/** Return the thumbnail entry for a given widget type, or null if not found. */
export function getThumbnail(
  state: WidgetThumbnailState,
  type: string,
): ThumbnailEntry | null {
  return state.thumbnails[type] ?? null;
}

/** Return all thumbnail entries matching the given category. */
export function getThumbnailsByCategory(
  state: WidgetThumbnailState,
  category: string,
): ThumbnailEntry[] {
  return Object.values(state.thumbnails).filter(e => e.category === category);
}

/**
 * Return the variant-specific SVG path for a widget type and variant ID,
 * or null if the type or variant does not exist.
 */
export function getVariantThumbnail(
  state: WidgetThumbnailState,
  type: string,
  variantId: string,
): string | null {
  const entry = state.thumbnails[type];
  if (!entry) return null;
  return entry.variantThumbnails[variantId] ?? null;
}

// ---------------------------------------------------------------------------
// Reducers (pure, immutable)
// ---------------------------------------------------------------------------

/**
 * Override the SVG path for an existing thumbnail type.
 * Returns the same state reference if the type is not found (no-op).
 */
export function setCustomThumbnail(
  state: WidgetThumbnailState,
  type: string,
  svgPath: string,
): WidgetThumbnailState {
  const existing = state.thumbnails[type];
  if (!existing) return state;

  return {
    ...state,
    thumbnails: {
      ...state.thumbnails,
      [type]: { ...existing, svgPath },
    },
  };
}

/** Add a type to the loading set. Returns new state. */
export function setThumbnailLoading(
  state: WidgetThumbnailState,
  type: string,
): WidgetThumbnailState {
  const loading = new Set(state.loading);
  loading.add(type);
  return { ...state, loading };
}

/**
 * Set a thumbnail entry as loaded. Removes the type from the loading set
 * and clears any error for that type.
 */
export function setThumbnailLoaded(
  state: WidgetThumbnailState,
  type: string,
  entry: ThumbnailEntry,
): WidgetThumbnailState {
  const loading = new Set(state.loading);
  loading.delete(type);

  const errors = { ...state.errors };
  delete errors[type];

  return {
    ...state,
    thumbnails: { ...state.thumbnails, [type]: entry },
    loading,
    errors,
  };
}

/**
 * Set an error for a thumbnail type. Removes the type from the loading set.
 */
export function setThumbnailError(
  state: WidgetThumbnailState,
  type: string,
  error: string,
): WidgetThumbnailState {
  const loading = new Set(state.loading);
  loading.delete(type);

  return {
    ...state,
    loading,
    errors: { ...state.errors, [type]: error },
  };
}
