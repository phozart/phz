/**
 * @phozart/phz-core — ServerDataOrchestrator
 *
 * Debounces rapid state changes and cancels superseded in-flight requests
 * via AbortController. Generates unique requestIds for deduplication.
 */

import type { ServerDataRequest, ServerDataResponse } from './types/server.js';

export interface ServerDataOrchestratorOptions {
  fetchFn: (request: ServerDataRequest) => Promise<ServerDataResponse>;
  debounceMs?: number;
  onRequest?: (requestId: string) => void;
  onResponse?: (response: ServerDataResponse, requestId: string) => void;
  onError?: (error: Error, requestId: string) => void;
}

export class ServerDataOrchestrator {
  private fetchFn: (request: ServerDataRequest) => Promise<ServerDataResponse>;
  private debounceMs: number;
  private onRequest?: (requestId: string) => void;
  private onResponseCb?: (response: ServerDataResponse, requestId: string) => void;
  private onErrorCb?: (error: Error, requestId: string) => void;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentController: AbortController | null = null;
  private destroyed = false;

  constructor(options: ServerDataOrchestratorOptions) {
    this.fetchFn = options.fetchFn;
    this.debounceMs = options.debounceMs ?? 300;
    this.onRequest = options.onRequest;
    this.onResponseCb = options.onResponse;
    this.onErrorCb = options.onError;
  }

  getDebounceMs(): number {
    return this.debounceMs;
  }

  requestData(request: ServerDataRequest): void {
    if (this.destroyed) return;

    // Clear any pending debounce
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.executeRequest(request);
    }, this.debounceMs);
  }

  destroy(): void {
    this.destroyed = true;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }

  private async executeRequest(request: ServerDataRequest): Promise<void> {
    if (this.destroyed) return;

    // Abort any previous in-flight request
    if (this.currentController) {
      this.currentController.abort();
    }

    const controller = new AbortController();
    this.currentController = controller;

    const requestId = crypto.randomUUID();
    this.onRequest?.(requestId);

    // Merge our signal into the request
    const requestWithSignal: ServerDataRequest = {
      ...request,
      signal: controller.signal,
    };

    try {
      const response = await this.fetchFn(requestWithSignal);
      if (!this.destroyed && !controller.signal.aborted) {
        this.onResponseCb?.(response, requestId);
      }
    } catch (err) {
      if (this.destroyed) return;
      // Don't report abort errors
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (controller.signal.aborted) return;
      this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)), requestId);
    }
  }
}
