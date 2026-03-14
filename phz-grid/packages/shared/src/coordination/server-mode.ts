/**
 * @phozart/shared — Server-Side Grid Mode (A-2.07)
 *
 * Configuration for server-side data operations (sort, filter, group, page).
 * When enabled, the grid delegates these operations to the DataAdapter
 * instead of performing them in-browser.
 *
 * Pure types and functions only — no side effects.
 */

// ========================================================================
// ServerGridConfig
// ========================================================================

/**
 * Configuration for server-side grid mode. When `enabled` is true, the grid
 * delegates sorting, filtering, grouping, and pagination to the server via
 * the DataAdapter rather than processing data client-side.
 */
export interface ServerGridConfig {
  /** Whether server-side mode is active. */
  enabled: boolean;
  /** Number of rows per page in server-side pagination. */
  pageSize: number;
  /** Delegate sorting to the server. */
  serverSort: boolean;
  /** Delegate filtering to the server. */
  serverFilter: boolean;
  /** Delegate group-by aggregation to the server. */
  serverGroupBy: boolean;
  /** Total row count as reported by the server (for virtual scroll calculations). */
  totalRowCount?: number;
  /**
   * Number of pages to prefetch ahead of the current viewport.
   * Defaults to 1 for a single prefetch page.
   */
  prefetchPages?: number;
}

// ========================================================================
// createDefaultServerGridConfig
// ========================================================================

/**
 * Creates a default server grid configuration with server-side operations
 * disabled. Consumers opt in by setting `enabled: true` and toggling
 * individual server-side capabilities.
 */
export function createDefaultServerGridConfig(
  overrides?: Partial<ServerGridConfig>,
): ServerGridConfig {
  return {
    enabled: false,
    pageSize: 50,
    serverSort: false,
    serverFilter: false,
    serverGroupBy: false,
    prefetchPages: 1,
    ...overrides,
  };
}

// ========================================================================
// isServerMode
// ========================================================================

/**
 * Returns `true` when the given config enables server-side grid mode.
 * Returns `false` for `undefined` or `null` configs.
 */
export function isServerMode(config: ServerGridConfig | undefined | null): boolean {
  return config?.enabled === true;
}

// ========================================================================
// hasServerCapability
// ========================================================================

/**
 * Checks whether a specific server-side capability is enabled.
 */
export function hasServerCapability(
  config: ServerGridConfig | undefined | null,
  capability: 'sort' | 'filter' | 'groupBy',
): boolean {
  if (!config?.enabled) return false;
  switch (capability) {
    case 'sort':
      return config.serverSort;
    case 'filter':
      return config.serverFilter;
    case 'groupBy':
      return config.serverGroupBy;
  }
}
