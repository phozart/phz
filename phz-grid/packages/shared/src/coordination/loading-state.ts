/**
 * @phozart/phz-shared — Loading State (A-1.05)
 *
 * Multi-phase loading state model for dashboards, reports, and widgets.
 * Tracks progress through idle -> preloading -> preload-complete ->
 * full-loading -> full-complete or error.
 */

// ========================================================================
// LoadingPhase
// ========================================================================

export type LoadingPhase =
  | 'idle'
  | 'preloading'
  | 'preload-complete'
  | 'full-loading'
  | 'full-complete'
  | 'error';

// ========================================================================
// LoadingState
// ========================================================================

export interface LoadingState {
  phase: LoadingPhase;
  progress: number;
  message?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ========================================================================
// createInitialLoadingState
// ========================================================================

export function createInitialLoadingState(): LoadingState {
  return {
    phase: 'idle',
    progress: 0,
  };
}

// ========================================================================
// updateLoadingProgress
// ========================================================================

export function updateLoadingProgress(
  state: LoadingState,
  update: Partial<LoadingState>,
): LoadingState {
  const next: LoadingState = { ...state, ...update };

  // Auto-set timestamps
  if (update.phase === 'preloading' && !state.startedAt) {
    next.startedAt = Date.now();
  }

  if (update.phase === 'full-complete' || update.phase === 'error') {
    next.completedAt = Date.now();
  }

  // Clamp progress to [0, 100]
  next.progress = Math.max(0, Math.min(100, next.progress));

  return next;
}

// ========================================================================
// Helpers
// ========================================================================

export function isLoadingComplete(state: LoadingState): boolean {
  return state.phase === 'full-complete';
}

export function isLoadingError(state: LoadingState): boolean {
  return state.phase === 'error';
}

export function isLoading(state: LoadingState): boolean {
  return state.phase === 'preloading' || state.phase === 'full-loading';
}

export function getLoadingDurationMs(state: LoadingState): number | undefined {
  if (!state.startedAt) return undefined;
  const end = state.completedAt ?? Date.now();
  return end - state.startedAt;
}

// ========================================================================
// Multi-Source Loading Orchestrator (A-2.05)
// ========================================================================

/**
 * Aggregated loading state across multiple data sources.
 * Each source tracks its own phase/progress independently, and the
 * `overall` state is a computed aggregate.
 */
export interface MultiSourceLoadingState {
  /** Per-source loading state, keyed by source ID. */
  sources: Record<string, LoadingState>;
  /** Aggregated loading state across all sources. */
  overall: LoadingState;
}

// ========================================================================
// createMultiSourceLoadingState
// ========================================================================

/**
 * Initializes a multi-source loading state with all sources set to idle.
 *
 * @param sourceIds - The IDs of the data sources to track.
 */
export function createMultiSourceLoadingState(sourceIds: string[]): MultiSourceLoadingState {
  const sources: Record<string, LoadingState> = {};
  for (const id of sourceIds) {
    sources[id] = createInitialLoadingState();
  }
  return {
    sources,
    overall: createInitialLoadingState(),
  };
}

// ========================================================================
// updateSourceProgress
// ========================================================================

/**
 * Updates the loading state for a single source within the multi-source state,
 * then recomputes the overall aggregate.
 *
 * Returns a new `MultiSourceLoadingState` — the original is not mutated.
 *
 * @param state - The current multi-source loading state.
 * @param sourceId - The source to update.
 * @param phase - The new loading phase for the source.
 * @param progress - Optional progress value (0-100) for the source.
 */
export function updateSourceProgress(
  state: MultiSourceLoadingState,
  sourceId: string,
  phase: LoadingPhase,
  progress?: number,
): MultiSourceLoadingState {
  const currentSource = state.sources[sourceId] ?? createInitialLoadingState();
  const updatedSource = updateLoadingProgress(currentSource, {
    phase,
    ...(progress !== undefined ? { progress } : {}),
  });

  const newSources = { ...state.sources, [sourceId]: updatedSource };
  const overall = computeOverallProgress({ sources: newSources, overall: state.overall });

  return {
    sources: newSources,
    overall,
  };
}

// ========================================================================
// computeOverallProgress
// ========================================================================

/** Phase ordering for comparison. Higher index = further along. */
const PHASE_ORDER: Record<LoadingPhase, number> = {
  'idle': 0,
  'preloading': 1,
  'preload-complete': 2,
  'full-loading': 3,
  'full-complete': 4,
  'error': -1,
};

/**
 * Computes the aggregate loading state from all per-source states.
 *
 * Rules:
 * - If any source is in `error`, overall is `error`.
 * - If all sources are `full-complete`, overall is `full-complete`.
 * - If all sources are `idle`, overall is `idle`.
 * - Otherwise, overall phase is the minimum non-error phase across sources.
 * - Overall progress is the average of all source progress values.
 */
export function computeOverallProgress(state: MultiSourceLoadingState): LoadingState {
  const entries = Object.values(state.sources);
  if (entries.length === 0) {
    return createInitialLoadingState();
  }

  // Check for errors first
  const hasError = entries.some((s) => s.phase === 'error');
  if (hasError) {
    const errorSource = entries.find((s) => s.phase === 'error');
    return updateLoadingProgress(state.overall, {
      phase: 'error',
      error: errorSource?.error ?? 'One or more sources failed',
      progress: averageProgress(entries),
    });
  }

  // Check if all complete
  const allComplete = entries.every((s) => s.phase === 'full-complete');
  if (allComplete) {
    return updateLoadingProgress(state.overall, {
      phase: 'full-complete',
      progress: 100,
    });
  }

  // Check if all idle
  const allIdle = entries.every((s) => s.phase === 'idle');
  if (allIdle) {
    return createInitialLoadingState();
  }

  // Find the minimum non-idle phase (the slowest source)
  let minOrder = Infinity;
  let minPhase: LoadingPhase = 'full-complete';
  for (const entry of entries) {
    const order = PHASE_ORDER[entry.phase];
    if (order >= 0 && order < minOrder) {
      minOrder = order;
      minPhase = entry.phase;
    }
  }

  return updateLoadingProgress(state.overall, {
    phase: minPhase,
    progress: averageProgress(entries),
  });
}

/**
 * Computes the average progress across all loading states, rounded to
 * the nearest integer.
 */
function averageProgress(states: LoadingState[]): number {
  if (states.length === 0) return 0;
  const sum = states.reduce((acc, s) => acc + s.progress, 0);
  return Math.round(sum / states.length);
}

