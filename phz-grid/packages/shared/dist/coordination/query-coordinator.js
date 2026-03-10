/**
 * @phozart/phz-shared — QueryCoordinator types (A-1.05)
 *
 * Batches concurrent widget data queries with concurrency control,
 * deduplication, and cancellation.
 *
 * Pure types only — the implementation lives in workspace.
 *
 * Extracted from workspace/coordination/query-coordinator.ts + workspace/data-adapter.ts.
 */
export function defaultQueryCoordinatorConfig(overrides) {
    return {
        maxConcurrent: 4,
        batchWindowMs: 50,
        ...overrides,
    };
}
// ========================================================================
// Type guard
// ========================================================================
export function isQueryCoordinatorConfig(obj) {
    if (obj == null || typeof obj !== 'object')
        return false;
    const o = obj;
    return (typeof o.maxConcurrent === 'number' &&
        typeof o.batchWindowMs === 'number');
}
//# sourceMappingURL=query-coordinator.js.map