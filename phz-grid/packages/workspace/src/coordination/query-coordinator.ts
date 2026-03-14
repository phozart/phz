/**
 * @phozart/workspace — Query Coordinator (K.6)
 *
 * Batches concurrent widget data queries with concurrency control,
 * deduplication, and cancellation via AbortController.
 */

import type { DataAdapter, DataQuery, DataResult, CoordinatorResult, QueryCoordinatorConfig } from '../data-adapter.js';

export type { QueryCoordinatorConfig };

export interface QueryCoordinatorInstance {
  submit(widgetId: string, query: Omit<DataQuery, 'source'> & { source: string }): Promise<CoordinatorResult>;
  cancel(widgetId: string): void;
  flush(): Promise<void>;
}

interface PendingQuery {
  widgetId: string;
  query: DataQuery;
  resolve: (result: CoordinatorResult) => void;
  reject: (error: Error) => void;
  controller: AbortController;
}

export function createQueryCoordinator(
  adapter: DataAdapter,
  config?: Partial<QueryCoordinatorConfig>,
): QueryCoordinatorInstance {
  const maxConcurrent = config?.maxConcurrent ?? 4;
  const batchWindowMs = config?.batchWindowMs ?? 50;

  const pending = new Map<string, PendingQuery>();
  const active = new Set<string>();
  const queue: PendingQuery[] = [];

  function processQueue(): void {
    while (active.size < maxConcurrent && queue.length > 0) {
      const entry = queue.shift()!;
      if (entry.controller.signal.aborted) {
        entry.reject(new Error('Query cancelled'));
        continue;
      }
      active.add(entry.widgetId);
      executeQuery(entry);
    }
  }

  async function executeQuery(entry: PendingQuery): Promise<void> {
    try {
      const result = await adapter.execute(entry.query, {
        signal: entry.controller.signal,
      });
      if (entry.controller.signal.aborted) {
        entry.reject(new Error('Query cancelled'));
      } else {
        const rows = result.rows.map(row => {
          const obj: Record<string, unknown> = {};
          result.columns.forEach((col, i) => { obj[col.name] = row[i]; });
          return obj;
        });
        entry.resolve({ data: rows, meta: result.metadata as unknown as Record<string, unknown> });
      }
    } catch (err) {
      entry.reject(err instanceof Error ? err : new Error(String(err)));
    } finally {
      active.delete(entry.widgetId);
      pending.delete(entry.widgetId);
      processQueue();
    }
  }

  return {
    submit(widgetId, query) {
      // Cancel any existing query for this widget (deduplication)
      const existing = pending.get(widgetId);
      if (existing) {
        existing.controller.abort();
      }

      const controller = new AbortController();

      return new Promise<CoordinatorResult>((resolve, reject) => {
        const entry: PendingQuery = {
          widgetId,
          query: query as DataQuery,
          resolve,
          reject,
          controller,
        };

        pending.set(widgetId, entry);
        queue.push(entry);

        if (batchWindowMs > 0) {
          setTimeout(() => processQueue(), batchWindowMs);
        } else {
          processQueue();
        }
      });
    },

    cancel(widgetId) {
      const entry = pending.get(widgetId);
      if (entry) {
        entry.controller.abort();
        entry.reject(new Error('Query cancelled'));
        pending.delete(widgetId);
      }
    },

    async flush() {
      processQueue();
      // Wait for all active and pending to complete
      const promises: Promise<void>[] = [];
      for (const entry of pending.values()) {
        promises.push(
          new Promise<void>((resolve) => {
            const origResolve = entry.resolve;
            const origReject = entry.reject;
            entry.resolve = (result) => { origResolve(result); resolve(); };
            entry.reject = (err) => { origReject(err); resolve(); };
          }),
        );
      }
      await Promise.all(promises);
    },
  };
}
