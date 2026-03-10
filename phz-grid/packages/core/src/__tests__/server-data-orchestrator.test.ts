import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerDataOrchestrator } from '../server-data-orchestrator.js';
import type { ServerDataRequest, ServerDataResponse } from '../types/server.js';

function createMockFetch(delay = 0) {
  return vi.fn(
    async (request: ServerDataRequest): Promise<ServerDataResponse> => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (request.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      return {
        rows: [{ id: 1 }],
        pagination: { totalCountType: 'exact', totalCount: 1, hasMore: false },
      };
    },
  );
}

describe('WI 16: ServerDataOrchestrator — Debouncing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid state changes', async () => {
    const fetchFn = createMockFetch();
    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 300 });

    // Fire 5 rapid requests
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 20 } });
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 30 } });
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 40 } });
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 50 } });

    // Not yet called — still debouncing
    expect(fetchFn).not.toHaveBeenCalled();

    // Advance timer past debounce
    await vi.advanceTimersByTimeAsync(300);

    // Only the last request should fire
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0].pagination).toEqual(
      expect.objectContaining({ limit: 50 }),
    );

    orchestrator.destroy();
  });

  it('uses configurable debounce delay', async () => {
    const fetchFn = createMockFetch();
    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 100 });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });

    await vi.advanceTimersByTimeAsync(50);
    expect(fetchFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    orchestrator.destroy();
  });

  it('defaults to 300ms debounce', () => {
    const fetchFn = createMockFetch();
    const orchestrator = new ServerDataOrchestrator({ fetchFn });
    expect(orchestrator.getDebounceMs()).toBe(300);
    orchestrator.destroy();
  });
});

describe('WI 16: ServerDataOrchestrator — Abort on supersede', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels previous in-flight request when new one arrives', async () => {
    const capturedSignals: AbortSignal[] = [];
    const fetchFn = vi.fn(async (request: ServerDataRequest) => {
      capturedSignals.push(request.signal!);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (request.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      return {
        rows: [],
        pagination: { totalCountType: 'exact' as const, totalCount: 0, hasMore: false },
      };
    });

    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 0 });

    // First request
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Second request supersedes
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 20 } });
    await vi.advanceTimersByTimeAsync(0);

    // First signal should be aborted
    expect(capturedSignals[0].aborted).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    orchestrator.destroy();
  });

  it('passes AbortSignal to fetch function', async () => {
    const fetchFn = vi.fn(async (request: ServerDataRequest) => {
      expect(request.signal).toBeInstanceOf(AbortSignal);
      return {
        rows: [],
        pagination: { totalCountType: 'exact' as const, totalCount: 0, hasMore: false },
      };
    });

    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 0 });
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    orchestrator.destroy();
  });
});

describe('WI 16: ServerDataOrchestrator — Request ID', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates unique requestId for each request', async () => {
    const requestIds: string[] = [];
    const fetchFn = createMockFetch();
    const orchestrator = new ServerDataOrchestrator({
      fetchFn,
      debounceMs: 0,
      onRequest: (id) => requestIds.push(id),
    });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    orchestrator.requestData({ pagination: { type: 'offset', offset: 10, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    expect(requestIds).toHaveLength(2);
    expect(requestIds[0]).not.toBe(requestIds[1]);
    expect(requestIds[0]).toMatch(/^[0-9a-f-]+$/);

    orchestrator.destroy();
  });
});

describe('WI 16: ServerDataOrchestrator — Callbacks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onResponse with successful result', async () => {
    const fetchFn = createMockFetch();
    const onResponse = vi.fn();
    const orchestrator = new ServerDataOrchestrator({
      fetchFn,
      debounceMs: 0,
      onResponse,
    });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);
    // Wait for the promise to settle
    await vi.advanceTimersByTimeAsync(0);

    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [{ id: 1 }] }),
      expect.any(String),
    );

    orchestrator.destroy();
  });

  it('calls onError on fetch failure', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('Network failure');
    });
    const onError = vi.fn();
    const orchestrator = new ServerDataOrchestrator({
      fetchFn,
      debounceMs: 0,
      onError,
    });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(String));

    orchestrator.destroy();
  });

  it('does not call onError for abort errors', async () => {
    const fetchFn = vi.fn(async (request: ServerDataRequest) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (request.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      return {
        rows: [],
        pagination: { totalCountType: 'exact' as const, totalCount: 0, hasMore: false },
      };
    });
    const onError = vi.fn();
    const orchestrator = new ServerDataOrchestrator({
      fetchFn,
      debounceMs: 0,
      onError,
    });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);

    // Supersede with new request (aborts previous)
    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 20 } });
    await vi.advanceTimersByTimeAsync(0);

    // Let the aborted request settle
    await vi.advanceTimersByTimeAsync(100);

    // Abort errors should NOT trigger onError
    expect(onError).not.toHaveBeenCalled();

    orchestrator.destroy();
  });
});

describe('WI 16: ServerDataOrchestrator — Destroy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels pending debounce on destroy', async () => {
    const fetchFn = createMockFetch();
    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 300 });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    orchestrator.destroy();

    await vi.advanceTimersByTimeAsync(300);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('aborts in-flight request on destroy', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchFn = vi.fn(async (request: ServerDataRequest) => {
      capturedSignal = request.signal;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        rows: [],
        pagination: { totalCountType: 'exact' as const, totalCount: 0, hasMore: false },
      };
    });
    const orchestrator = new ServerDataOrchestrator({ fetchFn, debounceMs: 0 });

    orchestrator.requestData({ pagination: { type: 'offset', offset: 0, limit: 10 } });
    await vi.advanceTimersByTimeAsync(0);

    orchestrator.destroy();
    expect(capturedSignal!.aborted).toBe(true);
  });
});
