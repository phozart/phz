/**
 * @phozart/workspace — Query Layer Resolution (T.2)
 *
 * Determines whether a filter change should trigger a server reload
 * or a client-side re-query based on the filter's queryLayer config.
 */
/** Threshold for auto-resolution: above this row count, prefer server. */
const AUTO_THRESHOLD_ROWS = 10000;
/**
 * Resolves a queryLayer value ('server' | 'client' | 'auto' | undefined)
 * to a concrete execution layer.
 *
 * - 'server' / 'client' → returned as-is.
 * - 'auto' → heuristic based on estimatedRows (> 10k → server, else client).
 * - undefined → defaults to 'server' (safe default).
 */
export function resolveQueryLayer(queryLayer, hints) {
    if (queryLayer === 'server')
        return 'server';
    if (queryLayer === 'client')
        return 'client';
    if (queryLayer === 'auto') {
        const rows = hints?.estimatedRows ?? AUTO_THRESHOLD_ROWS + 1;
        return rows > AUTO_THRESHOLD_ROWS ? 'server' : 'client';
    }
    // undefined → safe default
    return 'server';
}
/**
 * Classifies a filter change as 'reload' (server filter changed → need full data reload)
 * or 'requery' (client filter changed → can filter locally).
 */
export function classifyFilterChange(filterDef) {
    const layer = resolveQueryLayer(filterDef.queryLayer);
    return layer === 'server' ? 'reload' : 'requery';
}
//# sourceMappingURL=query-layer.js.map