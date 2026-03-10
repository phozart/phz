/**
 * @phozart/phz-core — Progressive Data Loading State Machine
 *
 * Pure functions, no side effects. The grid core orchestrates actual I/O
 * calls; this module manages the loading lifecycle state.
 */
const DEFAULT_CHUNK_SIZE = 500;
export function createInitialProgressiveState(config) {
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
export function startProgressiveLoad(state, queryId) {
    return {
        ...state,
        phase: 'initial',
        loadedRowCount: 0,
        estimatedTotalCount: 0,
        currentOffset: 0,
        queryId,
    };
}
export function onChunkReceived(state, rowsInChunk, totalCount) {
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
export function onAllChunksComplete(state) {
    return {
        ...state,
        phase: 'complete',
        lastRefreshAt: Date.now(),
    };
}
export function startRefresh(state, queryId) {
    return {
        ...state,
        phase: 'refreshing',
        loadedRowCount: 0,
        currentOffset: 0,
        queryId,
    };
}
export function shouldShowOverlay(state) {
    return state.phase === 'initial' && state.loadedRowCount === 0;
}
export function shouldShowFooterIndicator(state) {
    return state.phase === 'streaming' || state.phase === 'refreshing';
}
export function getProgressMessage(state) {
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
export function getNextOffset(state) {
    if (state.estimatedTotalCount === 0 && state.phase === 'initial') {
        // First chunk hasn't arrived yet — offset 0 is next
        return 0;
    }
    if (state.currentOffset >= state.estimatedTotalCount) {
        return null;
    }
    return state.currentOffset;
}
//# sourceMappingURL=progressive-load.js.map