/**
 * @phozart/phz-shared — AsyncReportRequest / AsyncReportStatus (A-1.14)
 *
 * Types for asynchronous report generation and retrieval.
 * Long-running queries are submitted via executeQueryAsync() and
 * polled via getAsyncRequestStatus().
 */
// ========================================================================
// Factory
// ========================================================================
export function createAsyncReportJob(reportId) {
    return {
        id: `arj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        reportId,
        status: 'queued',
        progress: 0,
        createdAt: Date.now(),
    };
}
// ========================================================================
// Status helpers
// ========================================================================
/**
 * Returns true if the status represents a terminal state
 * (no further transitions expected).
 */
export function isTerminalStatus(status) {
    return (status === 'complete' ||
        status === 'failed' ||
        status === 'cancelled' ||
        status === 'expired');
}
/**
 * Returns true if the async report job has expired based on its
 * expiresAt timestamp. If expiresAt is not set, the job is
 * considered non-expiring (returns false).
 *
 * @param job - The async report job to check.
 * @param now - Optional current timestamp in epoch ms (defaults to Date.now()).
 */
export function isAsyncReportExpired(job, now) {
    if (job.expiresAt == null)
        return false;
    return (now ?? Date.now()) >= job.expiresAt;
}
/**
 * Check whether a DataAdapter implementation supports async queries.
 * Accepts any object and returns true if it has the executeQueryAsync
 * method.
 */
export function hasAsyncSupport(adapter) {
    return typeof adapter?.executeQueryAsync === 'function';
}
//# sourceMappingURL=async-report.js.map