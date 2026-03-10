import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, createDataSourceError } from '../retry-policy.js';
import type { RetryPolicy, DataSourceError } from '../types/server.js';

describe('WI 17: withRetry — basic retry behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const promise = withRetry(fn, policy);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure up to maxRetries', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const promise = withRetry(fn, policy);

    // First retry after 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry after 200ms
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries', async () => {
    vi.useRealTimers();

    const fn = vi.fn().mockImplementation(async () => {
      throw new Error('persistent failure');
    });
    const policy: RetryPolicy = {
      maxRetries: 2,
      baseDelayMs: 1,
      backoffMultiplier: 1,
      maxDelayMs: 1,
    };

    await expect(withRetry(fn, policy)).rejects.toThrow('persistent failure');
    // 1 initial + 2 retries = 3 total
    expect(fn).toHaveBeenCalledTimes(3);

    vi.useFakeTimers();
  });
});

describe('WI 17: withRetry — exponential backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies exponential backoff: 100, 200, 400', async () => {
    const delays: number[] = [];
    const start = Date.now();

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValue('ok');

    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const promise = withRetry(fn, policy);

    // After first fail, wait 100ms
    await vi.advanceTimersByTimeAsync(100);
    delays.push(Date.now() - start);

    // After second fail, wait 200ms
    await vi.advanceTimersByTimeAsync(200);
    delays.push(Date.now() - start);

    // After third fail, wait 400ms
    await vi.advanceTimersByTimeAsync(400);
    delays.push(Date.now() - start);

    const result = await promise;
    expect(result).toBe('ok');
    expect(delays).toEqual([100, 300, 700]);
  });

  it('caps delay at maxDelayMs', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValue('ok');

    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 500,
      backoffMultiplier: 10,
      maxDelayMs: 1000,
    };

    const promise = withRetry(fn, policy);

    // First: 500ms
    await vi.advanceTimersByTimeAsync(500);
    // Second: min(5000, 1000) = 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    // Third: min(50000, 1000) = 1000ms
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe('ok');
  });
});

describe('WI 17: withRetry — non-retryable errors', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not retry non-retryable DataSourceError', async () => {
    const fn = vi.fn().mockImplementation(async () => {
      throw createDataSourceError('AUTH_ERROR', 'Unauthorized', false);
    });
    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    await expect(withRetry(fn, policy)).rejects.toThrow('Unauthorized');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries retryable DataSourceError', async () => {
    const error = createDataSourceError('NETWORK_ERROR', 'Connection reset', true);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('recovered');

    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const promise = withRetry(fn, policy);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('WI 17: withRetry — AbortSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not retry aborted requests', async () => {
    const fn = vi.fn().mockImplementation(async () => {
      throw new DOMException('Aborted', 'AbortError');
    });
    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };
    const controller = new AbortController();
    controller.abort();

    await expect(withRetry(fn, policy, controller.signal)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops retrying if signal is already aborted before retry starts', async () => {
    const controller = new AbortController();
    controller.abort();

    const fn = vi.fn().mockImplementation(async () => {
      throw new Error('fail');
    });

    const policy: RetryPolicy = {
      maxRetries: 5,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    // Signal already aborted — should fail immediately after first fn call
    await expect(withRetry(fn, policy, controller.signal)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('WI 17: withRetry — retryAfterMs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('respects retryAfterMs from DataSourceError', async () => {
    const error = createDataSourceError('RATE_LIMITED', 'Too many requests', true, 2000);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('ok');

    const policy: RetryPolicy = {
      maxRetries: 3,
      baseDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const promise = withRetry(fn, policy);

    // Normal backoff would be 100ms, but retryAfterMs says 2000
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1); // Still waiting

    await vi.advanceTimersByTimeAsync(1900);
    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('WI 17: createDataSourceError', () => {
  it('creates error with correct properties', () => {
    const err = createDataSourceError('SERVER_ERROR', 'Internal error', true);
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.message).toBe('Internal error');
    expect(err.retryable).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('includes retryAfterMs when provided', () => {
    const err = createDataSourceError('RATE_LIMITED', 'Slow down', true, 5000);
    expect(err.retryAfterMs).toBe(5000);
  });
});
