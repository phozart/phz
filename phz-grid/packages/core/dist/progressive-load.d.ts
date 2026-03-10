/**
 * @phozart/phz-core — Progressive Data Loading State Machine
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
export type ProgressivePhase = 'idle' | 'initial' | 'streaming' | 'complete' | 'refreshing';
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
export declare function createInitialProgressiveState(config?: ProgressiveLoadConfig): ProgressiveLoadState;
export declare function startProgressiveLoad(state: ProgressiveLoadState, queryId: number): ProgressiveLoadState;
export declare function onChunkReceived(state: ProgressiveLoadState, rowsInChunk: number, totalCount: number): ProgressiveLoadState;
export declare function onAllChunksComplete(state: ProgressiveLoadState): ProgressiveLoadState;
export declare function startRefresh(state: ProgressiveLoadState, queryId: number): ProgressiveLoadState;
export declare function shouldShowOverlay(state: ProgressiveLoadState): boolean;
export declare function shouldShowFooterIndicator(state: ProgressiveLoadState): boolean;
export declare function getProgressMessage(state: ProgressiveLoadState): string;
export declare function getNextOffset(state: ProgressiveLoadState): number | null;
//# sourceMappingURL=progressive-load.d.ts.map