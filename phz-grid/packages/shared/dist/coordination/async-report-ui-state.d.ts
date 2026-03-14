/**
 * @phozart/shared — Async Report UI State (C-2.01)
 *
 * State management for async report jobs: polling, progress tracking, download.
 * Pure functions only — no side effects, no DOM.
 */
import type { AsyncReportJob, AsyncReportStatus } from '../types/async-report.js';
export interface AsyncReportUIState {
    /** All tracked async report jobs. */
    jobs: AsyncReportJob[];
    /** ID of the currently active/focused job (may be null). */
    activeJobId: string | null;
    /** Polling interval in milliseconds. */
    pollingIntervalMs: number;
    /** Whether polling is currently active. */
    polling: boolean;
}
/**
 * Create a fresh AsyncReportUIState with sensible defaults.
 */
export declare function createAsyncReportUIState(overrides?: Partial<AsyncReportUIState>): AsyncReportUIState;
/**
 * Add a new job to the state. If a job with the same ID already exists,
 * it is replaced.
 */
export declare function addJob(state: AsyncReportUIState, job: AsyncReportJob): AsyncReportUIState;
/**
 * Update the status and optional progress of an existing job.
 * Returns the state unchanged if the job is not found.
 */
export declare function updateJobStatus(state: AsyncReportUIState, jobId: string, status: AsyncReportStatus, progress?: number): AsyncReportUIState;
/**
 * Remove a job by ID. If the removed job was the active job,
 * activeJobId is cleared.
 */
export declare function removeJob(state: AsyncReportUIState, jobId: string): AsyncReportUIState;
/**
 * Get all jobs in a terminal completed state.
 */
export declare function getCompletedJobs(state: AsyncReportUIState): AsyncReportJob[];
/**
 * Get all jobs that are still in progress (queued or running).
 */
export declare function getActiveJobs(state: AsyncReportUIState): AsyncReportJob[];
//# sourceMappingURL=async-report-ui-state.d.ts.map