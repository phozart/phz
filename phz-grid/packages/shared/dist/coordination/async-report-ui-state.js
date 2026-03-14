/**
 * @phozart/shared — Async Report UI State (C-2.01)
 *
 * State management for async report jobs: polling, progress tracking, download.
 * Pure functions only — no side effects, no DOM.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Create a fresh AsyncReportUIState with sensible defaults.
 */
export function createAsyncReportUIState(overrides) {
    return {
        jobs: [],
        activeJobId: null,
        pollingIntervalMs: 3000,
        polling: false,
        ...overrides,
    };
}
// ========================================================================
// State transitions
// ========================================================================
/**
 * Add a new job to the state. If a job with the same ID already exists,
 * it is replaced.
 */
export function addJob(state, job) {
    const filtered = state.jobs.filter(j => j.id !== job.id);
    return {
        ...state,
        jobs: [...filtered, job],
        activeJobId: state.activeJobId ?? job.id,
        polling: true,
    };
}
/**
 * Update the status and optional progress of an existing job.
 * Returns the state unchanged if the job is not found.
 */
export function updateJobStatus(state, jobId, status, progress) {
    let found = false;
    const jobs = state.jobs.map(j => {
        if (j.id !== jobId)
            return j;
        found = true;
        const updated = {
            ...j,
            status,
            progress: progress ?? j.progress,
        };
        // Set startedAt when transitioning to 'running'
        if (status === 'running' && j.startedAt == null) {
            updated.startedAt = Date.now();
        }
        // Set completedAt when transitioning to a terminal status
        if ((status === 'complete' || status === 'failed' || status === 'cancelled' || status === 'expired') &&
            j.completedAt == null) {
            updated.completedAt = Date.now();
        }
        return updated;
    });
    if (!found)
        return state;
    // Stop polling if no active jobs remain
    const hasActive = jobs.some(j => j.status === 'queued' || j.status === 'running');
    return {
        ...state,
        jobs,
        polling: hasActive,
    };
}
/**
 * Remove a job by ID. If the removed job was the active job,
 * activeJobId is cleared.
 */
export function removeJob(state, jobId) {
    const jobs = state.jobs.filter(j => j.id !== jobId);
    const activeJobId = state.activeJobId === jobId ? null : state.activeJobId;
    const hasActive = jobs.some(j => j.status === 'queued' || j.status === 'running');
    return {
        ...state,
        jobs,
        activeJobId,
        polling: hasActive,
    };
}
// ========================================================================
// Selectors
// ========================================================================
/**
 * Get all jobs in a terminal completed state.
 */
export function getCompletedJobs(state) {
    return state.jobs.filter(j => j.status === 'complete');
}
/**
 * Get all jobs that are still in progress (queued or running).
 */
export function getActiveJobs(state) {
    return state.jobs.filter(j => j.status === 'queued' || j.status === 'running');
}
//# sourceMappingURL=async-report-ui-state.js.map