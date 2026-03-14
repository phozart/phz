/**
 * @phozart/shared — Dashboard Bookmark Types
 *
 * Serializable bookmark types for persisting full dashboard interaction state.
 * All types are plain objects — no class instances, no functions, no Maps/Sets.
 */

// ========================================================================
// Types
// ========================================================================

/**
 * Serialized drill-down state for a single widget.
 * Mirrors DrillDownState from @phozart/engine but kept in shared
 * to avoid a circular dependency.
 */
export interface SerializedDrillBreadcrumb {
  level: number;
  label: string;
  field: string;
  value: unknown;
}

export interface SerializedDrillDownState {
  hierarchyId: string;
  currentLevel: number;
  breadcrumb: SerializedDrillBreadcrumb[];
  filterStack: Array<Record<string, unknown>>;
}

/**
 * Full snapshot of a dashboard's interactive state at a point in time.
 * Every field is JSON-serializable.
 */
export interface DashboardInteractionState {
  filterValues: Record<string, unknown>;
  expandedWidgets: string[];
  drillStates: Record<string, SerializedDrillDownState>;
  crossFilterSelections: Record<string, unknown>;
  viewGroupSelections: Record<string, string>;
  scrollPosition?: { x: number; y: number };
  visibilityOverrides?: Record<string, boolean>;
}

/**
 * A named, persisted bookmark that captures a dashboard's interaction state.
 */
export interface DashboardBookmark {
  id: string;
  name: string;
  description?: string;
  dashboardId: string;
  userId?: string;
  state: DashboardInteractionState;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

// ========================================================================
// Utilities
// ========================================================================

let bookmarkCounter = 0;

/**
 * Generate a unique bookmark ID. Uses timestamp + counter for uniqueness.
 */
export function createBookmarkId(): string {
  bookmarkCounter++;
  return `bk_${Date.now()}_${bookmarkCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Type guard: validates that an unknown value is a DashboardBookmark.
 */
export function isValidBookmark(value: unknown): value is DashboardBookmark {
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.dashboardId === 'string' &&
    typeof obj.isDefault === 'boolean' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number' &&
    obj.state !== null &&
    typeof obj.state === 'object'
  );
}

/**
 * Merge a partial overlay onto a base interaction state.
 * Overlay fields replace base fields entirely (no deep merge on Records).
 */
export function mergeInteractionState(
  base: DashboardInteractionState,
  overlay: Partial<DashboardInteractionState>,
): DashboardInteractionState {
  return { ...base, ...overlay };
}
