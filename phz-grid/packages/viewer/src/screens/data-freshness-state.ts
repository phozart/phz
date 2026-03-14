/**
 * @phozart/viewer — Data Freshness Indicator (UX-013)
 *
 * Headless state machine for tracking data freshness. Manages refresh
 * timestamps, freshness level computation (fresh/aging/stale/unknown),
 * human-readable age labels, and auto-refresh configuration.
 */

// ========================================================================
// Types
// ========================================================================

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface DataFreshnessState {
  /** Epoch ms of last data refresh (null = never refreshed). */
  lastRefreshed: number | null;
  /** Below this elapsed ms = fresh (default 60_000 = 1 min). */
  freshThresholdMs: number;
  /** Above this elapsed ms = stale (default 300_000 = 5 min). */
  staleThresholdMs: number;
  /** Whether auto-refresh is enabled. */
  autoRefreshEnabled: boolean;
  /** Auto-refresh interval in ms (default 60_000). */
  autoRefreshIntervalMs: number;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create the initial data freshness state with sensible defaults.
 */
export function createDataFreshnessState(
  overrides?: Partial<DataFreshnessState>,
): DataFreshnessState {
  return {
    lastRefreshed: overrides?.lastRefreshed ?? null,
    freshThresholdMs: overrides?.freshThresholdMs ?? 60_000,
    staleThresholdMs: overrides?.staleThresholdMs ?? 300_000,
    autoRefreshEnabled: overrides?.autoRefreshEnabled ?? false,
    autoRefreshIntervalMs: overrides?.autoRefreshIntervalMs ?? 60_000,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Record that data was refreshed at the given timestamp.
 */
export function recordRefresh(
  state: DataFreshnessState,
  timestamp: number,
): DataFreshnessState {
  return { ...state, lastRefreshed: timestamp };
}

// ========================================================================
// Computed queries (deterministic — `now` parameter, no Date.now())
// ========================================================================

/**
 * Compute the current freshness level based on elapsed time.
 *
 * - `lastRefreshed === null` -> `'unknown'`
 * - `now - lastRefreshed < freshThresholdMs` -> `'fresh'`
 * - `now - lastRefreshed < staleThresholdMs` -> `'aging'`
 * - `now - lastRefreshed >= staleThresholdMs` -> `'stale'`
 */
export function computeFreshnessLevel(
  state: DataFreshnessState,
  now: number,
): FreshnessLevel {
  if (state.lastRefreshed === null) {
    return 'unknown';
  }

  const elapsed = now - state.lastRefreshed;

  if (elapsed < state.freshThresholdMs) {
    return 'fresh';
  }
  if (elapsed < state.staleThresholdMs) {
    return 'aging';
  }
  return 'stale';
}

/**
 * Get the age of the data in milliseconds.
 * Returns `null` when data has never been refreshed.
 */
export function getFreshnessAge(
  state: DataFreshnessState,
  now: number,
): number | null {
  if (state.lastRefreshed === null) {
    return null;
  }
  return now - state.lastRefreshed;
}

/**
 * Format a human-readable freshness label.
 *
 * - `null` -> `"Never refreshed"`
 * - `< 10s` -> `"Just now"`
 * - `< 60s` -> `"Xs ago"` (e.g., "45s ago")
 * - `< 60min` -> `"Xm ago"` (e.g., "3m ago")
 * - `>= 60min` -> `"Xh Ym ago"` (e.g., "1h 30m ago")
 */
export function formatFreshnessLabel(
  state: DataFreshnessState,
  now: number,
): string {
  if (state.lastRefreshed === null) {
    return 'Never refreshed';
  }

  const elapsedMs = now - state.lastRefreshed;
  const elapsedSeconds = Math.floor(elapsedMs / 1_000);

  if (elapsedSeconds < 10) {
    return 'Just now';
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${minutes}m ago`;
}

// ========================================================================
// Configuration
// ========================================================================

/**
 * Set fresh and stale thresholds. Returns a new state.
 */
export function setFreshnessThresholds(
  state: DataFreshnessState,
  freshMs: number,
  staleMs: number,
): DataFreshnessState {
  return { ...state, freshThresholdMs: freshMs, staleThresholdMs: staleMs };
}

/**
 * Enable auto-refresh with an optional custom interval.
 * Default interval is 60_000 ms (1 minute).
 */
export function enableAutoRefresh(
  state: DataFreshnessState,
  intervalMs?: number,
): DataFreshnessState {
  return {
    ...state,
    autoRefreshEnabled: true,
    autoRefreshIntervalMs: intervalMs ?? state.autoRefreshIntervalMs,
  };
}

/**
 * Disable auto-refresh. Preserves the interval setting.
 */
export function disableAutoRefresh(
  state: DataFreshnessState,
): DataFreshnessState {
  return { ...state, autoRefreshEnabled: false };
}

/**
 * Check whether a refresh is due based on auto-refresh configuration.
 *
 * Returns `true` when auto-refresh is enabled AND either:
 * - Data has never been refreshed (`lastRefreshed === null`), or
 * - Enough time has elapsed since the last refresh.
 */
export function isRefreshDue(
  state: DataFreshnessState,
  now: number,
): boolean {
  if (!state.autoRefreshEnabled) {
    return false;
  }

  if (state.lastRefreshed === null) {
    return true;
  }

  return (now - state.lastRefreshed) >= state.autoRefreshIntervalMs;
}
