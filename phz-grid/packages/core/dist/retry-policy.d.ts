/**
 * @phozart/phz-core — Retry Policy
 *
 * Exponential backoff retry wrapper for server data fetching.
 * Respects AbortSignal, retryable flags, and retryAfterMs hints.
 */
import type { RetryPolicy, DataSourceErrorCode } from './types/server.js';
export interface DataSourceErrorInstance extends Error {
    code: DataSourceErrorCode;
    retryable: boolean;
    retryAfterMs?: number;
}
export declare function createDataSourceError(code: DataSourceErrorCode, message: string, retryable: boolean, retryAfterMs?: number): DataSourceErrorInstance;
export declare function withRetry<T>(fn: () => Promise<T>, policy: RetryPolicy, signal?: AbortSignal): Promise<T>;
//# sourceMappingURL=retry-policy.d.ts.map