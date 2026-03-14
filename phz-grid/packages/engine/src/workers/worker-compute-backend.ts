/**
 * @phozart/engine — Worker Compute Backend
 *
 * ComputeBackend implementation that proxies operations to a Web Worker.
 * Falls back to JSComputeBackend when Worker is unavailable (SSR, Node).
 */

import type { AggregationConfig, PivotConfig } from '@phozart/core';
import type { ComputeBackend, ComputeFilterInput, CalculatedFieldInput } from '../compute-backend.js';
import type { AggregationResult } from '../aggregation.js';
import type { PivotResult } from '../pivot.js';
import type { WorkerRequest, WorkerResponse } from './compute-worker-protocol.js';
import { JSComputeBackend } from '../compute-backend.js';

let idCounter = 0;
function nextId(): string {
  return `w_${++idCounter}`;
}

export class WorkerComputeBackend implements ComputeBackend {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private fallback: JSComputeBackend | null = null;

  constructor(workerUrl?: string | URL) {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = workerUrl
          ? new Worker(workerUrl, { type: 'module' })
          : null; // Consumer must provide a URL
        if (this.worker) {
          this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            this.handleResponse(e.data);
          };
          this.worker.onerror = (e) => {
            // Reject all pending requests on worker error
            for (const [, { reject }] of this.pending) {
              reject(new Error(`Worker error: ${e.message}`));
            }
            this.pending.clear();
          };
        }
      } catch {
        this.worker = null;
      }
    }

    if (!this.worker) {
      this.fallback = new JSComputeBackend();
    }
  }

  private handleResponse(res: WorkerResponse): void {
    const entry = this.pending.get(res.id);
    if (!entry) return;
    this.pending.delete(res.id);

    if (res.type === 'error') {
      entry.reject(new Error(res.error));
    } else {
      entry.resolve(res.data);
    }
  }

  private send<T>(req: WorkerRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }
      this.pending.set(req.id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.worker.postMessage(req);
    });
  }

  /** Send data to the worker (call when dataset changes) */
  setData(data: Record<string, unknown>[]): Promise<void> {
    if (this.fallback) return Promise.resolve();
    return this.send<null>({ type: 'setData', id: nextId(), data }).then(() => {});
  }

  async aggregate(data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult> {
    if (this.fallback) return this.fallback.aggregate(data, config);
    return this.send<AggregationResult>({ type: 'aggregate', id: nextId(), config });
  }

  async pivot(data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult> {
    if (this.fallback) return this.fallback.pivot(data, config);
    return this.send<PivotResult>({ type: 'pivot', id: nextId(), config });
  }

  async filter(data: Record<string, unknown>[], criteria: ComputeFilterInput[]): Promise<Record<string, unknown>[]> {
    if (this.fallback) return this.fallback.filter(data, criteria);
    return this.send<Record<string, unknown>[]>({ type: 'filter', id: nextId(), criteria });
  }

  async computeCalculatedFields(data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]> {
    if (this.fallback) return this.fallback.computeCalculatedFields(data, fields);
    return this.send<Record<string, unknown>[]>({ type: 'computeCalc', id: nextId(), fields });
  }

  /** Check if running in fallback (non-worker) mode */
  get isFallback(): boolean {
    return this.fallback !== null;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const [, { reject }] of this.pending) {
      reject(new Error('Worker terminated'));
    }
    this.pending.clear();
  }
}
