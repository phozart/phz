/**
 * @phozart/shared — AsyncReportRequest / AsyncReportStatus (A-1.14)
 *
 * Types for asynchronous report generation and retrieval.
 * Long-running queries are submitted via executeQueryAsync() and
 * polled via getAsyncRequestStatus().
 */
export type AsyncReportStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' | 'expired';
export interface AsyncReportRequest {
    /** ID of the report artifact to generate. */
    reportId: string;
    /** The query to execute asynchronously. */
    query: {
        source: string;
        fields: string[];
        filters?: unknown;
        groupBy?: string[];
        sort?: Array<{
            field: string;
            direction: 'asc' | 'desc';
        }>;
        limit?: number;
    };
    /** Desired output format. */
    outputFormat?: 'csv' | 'xlsx' | 'json' | 'parquet' | 'pdf';
    /** Optional webhook URL to POST when the job completes. */
    callbackUrl?: string;
    /** Queue priority. */
    priority?: 'low' | 'normal' | 'high';
    /** TTL in milliseconds after which the result expires. Default: 1 hour. */
    resultTTLMs?: number;
}
export interface AsyncReportJob {
    id: string;
    reportId: string;
    status: AsyncReportStatus;
    progress: number;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    /** Epoch ms after which the result is no longer available. */
    expiresAt?: number;
    error?: string;
    resultUrl?: string;
}
export declare function createAsyncReportJob(reportId: string): AsyncReportJob;
/**
 * Returns true if the status represents a terminal state
 * (no further transitions expected).
 */
export declare function isTerminalStatus(status: AsyncReportStatus): boolean;
/**
 * Returns true if the async report job has expired based on its
 * expiresAt timestamp. If expiresAt is not set, the job is
 * considered non-expiring (returns false).
 *
 * @param job - The async report job to check.
 * @param now - Optional current timestamp in epoch ms (defaults to Date.now()).
 */
export declare function isAsyncReportExpired(job: AsyncReportJob, now?: number): boolean;
/**
 * Check whether a DataAdapter implementation supports async queries.
 * Accepts any object and returns true if it has the executeQueryAsync
 * method.
 */
export declare function hasAsyncSupport(adapter: Record<string, unknown>): boolean;
//# sourceMappingURL=async-report.d.ts.map