/**
 * @phozart/phz-shared — AsyncReportRequest / AsyncReportStatus (A-1.14)
 *
 * Types for asynchronous report generation and retrieval.
 * Long-running queries are submitted via executeQueryAsync() and
 * polled via getAsyncRequestStatus().
 */

// ========================================================================
// AsyncReportStatus — lifecycle states for async jobs
// ========================================================================

export type AsyncReportStatus =
  | 'queued'
  | 'running'
  | 'complete'
  | 'failed'
  | 'cancelled'
  | 'expired';

// ========================================================================
// AsyncReportRequest — input for submitting an async report
// ========================================================================

export interface AsyncReportRequest {
  /** ID of the report artifact to generate. */
  reportId: string;
  /** The query to execute asynchronously. */
  query: {
    source: string;
    fields: string[];
    filters?: unknown;
    groupBy?: string[];
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
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

// ========================================================================
// AsyncReportJob — server-side tracking record
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createAsyncReportJob(reportId: string): AsyncReportJob {
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
export function isTerminalStatus(status: AsyncReportStatus): boolean {
  return (
    status === 'complete' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'expired'
  );
}

/**
 * Returns true if the async report job has expired based on its
 * expiresAt timestamp. If expiresAt is not set, the job is
 * considered non-expiring (returns false).
 *
 * @param job - The async report job to check.
 * @param now - Optional current timestamp in epoch ms (defaults to Date.now()).
 */
export function isAsyncReportExpired(
  job: AsyncReportJob,
  now?: number,
): boolean {
  if (job.expiresAt == null) return false;
  return (now ?? Date.now()) >= job.expiresAt;
}

/**
 * Check whether a DataAdapter implementation supports async queries.
 * Accepts any object and returns true if it has the executeQueryAsync
 * method.
 */
export function hasAsyncSupport(
  adapter: Record<string, unknown>,
): boolean {
  return typeof adapter?.executeQueryAsync === 'function';
}
