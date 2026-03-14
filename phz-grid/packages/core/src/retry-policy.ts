/**
 * @phozart/core — Retry Policy
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

export function createDataSourceError(
  code: DataSourceErrorCode,
  message: string,
  retryable: boolean,
  retryAfterMs?: number,
): DataSourceErrorInstance {
  const error = new Error(message) as DataSourceErrorInstance;
  error.code = code;
  error.retryable = retryable;
  error.retryAfterMs = retryAfterMs;
  return error;
}

function isDataSourceError(err: unknown): err is DataSourceErrorInstance {
  return err instanceof Error && 'code' in err && 'retryable' in err;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    let onAbort: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, ms);

    if (signal) {
      onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Never retry abort errors
      if (isAbortError(err) || signal?.aborted) {
        throw err;
      }

      // Never retry non-retryable DataSourceErrors
      if (isDataSourceError(err) && !err.retryable) {
        throw err;
      }

      // Exhausted retries
      if (attempt >= policy.maxRetries) {
        throw err;
      }

      // Calculate delay
      let delayMs = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt);
      delayMs = Math.min(delayMs, policy.maxDelayMs);

      // Respect retryAfterMs hint
      if (isDataSourceError(err) && err.retryAfterMs !== undefined) {
        delayMs = Math.max(delayMs, err.retryAfterMs);
      }

      await delay(delayMs, signal);
    }
  }

  throw lastError;
}
