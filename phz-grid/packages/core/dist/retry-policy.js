/**
 * @phozart/phz-core — Retry Policy
 *
 * Exponential backoff retry wrapper for server data fetching.
 * Respects AbortSignal, retryable flags, and retryAfterMs hints.
 */
export function createDataSourceError(code, message, retryable, retryAfterMs) {
    const error = new Error(message);
    error.code = code;
    error.retryable = retryable;
    error.retryAfterMs = retryAfterMs;
    return error;
}
function isDataSourceError(err) {
    return err instanceof Error && 'code' in err && 'retryable' in err;
}
function isAbortError(err) {
    return err instanceof DOMException && err.name === 'AbortError';
}
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        let onAbort;
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
export async function withRetry(fn, policy, signal) {
    let lastError;
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
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
//# sourceMappingURL=retry-policy.js.map