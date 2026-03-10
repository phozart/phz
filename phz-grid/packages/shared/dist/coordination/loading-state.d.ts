/**
 * @phozart/phz-shared — Loading State (A-1.05)
 *
 * Multi-phase loading state model for dashboards, reports, and widgets.
 * Tracks progress through idle -> preloading -> preload-complete ->
 * full-loading -> full-complete or error.
 */
export type LoadingPhase = 'idle' | 'preloading' | 'preload-complete' | 'full-loading' | 'full-complete' | 'error';
export interface LoadingState {
    phase: LoadingPhase;
    progress: number;
    message?: string;
    error?: string;
    startedAt?: number;
    completedAt?: number;
}
export declare function createInitialLoadingState(): LoadingState;
export declare function updateLoadingProgress(state: LoadingState, update: Partial<LoadingState>): LoadingState;
export declare function isLoadingComplete(state: LoadingState): boolean;
export declare function isLoadingError(state: LoadingState): boolean;
export declare function isLoading(state: LoadingState): boolean;
export declare function getLoadingDurationMs(state: LoadingState): number | undefined;
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
/**
 * Initializes a multi-source loading state with all sources set to idle.
 *
 * @param sourceIds - The IDs of the data sources to track.
 */
export declare function createMultiSourceLoadingState(sourceIds: string[]): MultiSourceLoadingState;
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
export declare function updateSourceProgress(state: MultiSourceLoadingState, sourceId: string, phase: LoadingPhase, progress?: number): MultiSourceLoadingState;
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
export declare function computeOverallProgress(state: MultiSourceLoadingState): LoadingState;
//# sourceMappingURL=loading-state.d.ts.map