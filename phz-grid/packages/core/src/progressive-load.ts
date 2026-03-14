/**
 * @phozart/core — Progressive Data Loading State Machine
 *
 * Pure functions, no side effects. The grid core orchestrates actual I/O
 * calls; this module manages the loading lifecycle state.
 */

export interface ProgressiveLoadConfig {
  /** Rows per page request. Default 500 */
  chunkSize?: number;
  /** Auto-refresh interval in ms. 0 = disabled. Default 0 */
  refreshIntervalMs?: number;
}

export type ProgressivePhase =
  | 'idle'        // No load in progress
  | 'initial'     // First chunk in flight (show overlay only if zero rows)
  | 'streaming'   // Subsequent chunks in flight (data visible, footer indicator)
  | 'complete'    // All chunks received
  | 'refreshing'; // Auto-refresh in progress (data visible, subtle indicator)

export interface ProgressiveLoadState {
  phase: ProgressivePhase;
  loadedRowCount: number;
  estimatedTotalCount: number;
  currentOffset: number;
  chunkSize: number;
  refreshIntervalMs: number;
  queryId: number;
  lastRefreshAt: number;
}

const DEFAULT_CHUNK_SIZE = 500;

export function createInitialProgressiveState(
  config?: ProgressiveLoadConfig,
): ProgressiveLoadState {
  return {
    phase: 'idle',
    loadedRowCount: 0,
    estimatedTotalCount: 0,
    currentOffset: 0,
    chunkSize: config?.chunkSize ?? DEFAULT_CHUNK_SIZE,
    refreshIntervalMs: config?.refreshIntervalMs ?? 0,
    queryId: 0,
    lastRefreshAt: 0,
  };
}

export function startProgressiveLoad(
  state: ProgressiveLoadState,
  queryId: number,
): ProgressiveLoadState {
  return {
    ...state,
    phase: 'initial',
    loadedRowCount: 0,
    estimatedTotalCount: 0,
    currentOffset: 0,
    queryId,
  };
}

export function onChunkReceived(
  state: ProgressiveLoadState,
  rowsInChunk: number,
  totalCount: number,
): ProgressiveLoadState {
  const newLoadedCount = state.loadedRowCount + rowsInChunk;
  const newOffset = state.currentOffset + rowsInChunk;
  const isComplete = newOffset >= totalCount || rowsInChunk === 0;

  return {
    ...state,
    phase: isComplete ? 'complete' : 'streaming',
    loadedRowCount: newLoadedCount,
    estimatedTotalCount: totalCount,
    currentOffset: newOffset,
    lastRefreshAt: isComplete ? Date.now() : state.lastRefreshAt,
  };
}

export function onAllChunksComplete(
  state: ProgressiveLoadState,
): ProgressiveLoadState {
  return {
    ...state,
    phase: 'complete',
    lastRefreshAt: Date.now(),
  };
}

export function startRefresh(
  state: ProgressiveLoadState,
  queryId: number,
): ProgressiveLoadState {
  return {
    ...state,
    phase: 'refreshing',
    loadedRowCount: 0,
    currentOffset: 0,
    queryId,
  };
}

export function shouldShowOverlay(state: ProgressiveLoadState): boolean {
  return state.phase === 'initial' && state.loadedRowCount === 0;
}

export function shouldShowFooterIndicator(state: ProgressiveLoadState): boolean {
  return state.phase === 'streaming' || state.phase === 'refreshing';
}

export function getProgressMessage(state: ProgressiveLoadState): string {
  if (state.phase === 'initial' && state.loadedRowCount === 0) {
    return 'Loading...';
  }
  if (state.phase === 'streaming') {
    return `Showing ${state.loadedRowCount.toLocaleString()} of ~${state.estimatedTotalCount.toLocaleString()} rows (loading...)`;
  }
  if (state.phase === 'refreshing') {
    return `Refreshing ${state.estimatedTotalCount.toLocaleString()} rows...`;
  }
  if (state.phase === 'complete') {
    return `${state.loadedRowCount.toLocaleString()} rows loaded`;
  }
  return '';
}

export function getNextOffset(state: ProgressiveLoadState): number | null {
  if (state.estimatedTotalCount === 0 && state.phase === 'initial') {
    // First chunk hasn't arrived yet — offset 0 is next
    return 0;
  }
  if (state.currentOffset >= state.estimatedTotalCount) {
    return null;
  }
  return state.currentOffset;
}
