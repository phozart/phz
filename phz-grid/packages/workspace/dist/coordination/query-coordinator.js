/**
 * @phozart/workspace — Query Coordinator (K.6)
 *
 * Batches concurrent widget data queries with concurrency control,
 * deduplication, and cancellation via AbortController.
 */
export function createQueryCoordinator(adapter, config) {
    const maxConcurrent = config?.maxConcurrent ?? 4;
    const batchWindowMs = config?.batchWindowMs ?? 50;
    const pending = new Map();
    const active = new Set();
    const queue = [];
    function processQueue() {
        while (active.size < maxConcurrent && queue.length > 0) {
            const entry = queue.shift();
            if (entry.controller.signal.aborted) {
                entry.reject(new Error('Query cancelled'));
                continue;
            }
            active.add(entry.widgetId);
            executeQuery(entry);
        }
    }
    async function executeQuery(entry) {
        try {
            const result = await adapter.execute(entry.query, {
                signal: entry.controller.signal,
            });
            if (entry.controller.signal.aborted) {
                entry.reject(new Error('Query cancelled'));
            }
            else {
                const rows = result.rows.map(row => {
                    const obj = {};
                    result.columns.forEach((col, i) => { obj[col.name] = row[i]; });
                    return obj;
                });
                entry.resolve({ data: rows, meta: result.metadata });
            }
        }
        catch (err) {
            entry.reject(err instanceof Error ? err : new Error(String(err)));
        }
        finally {
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
            return new Promise((resolve, reject) => {
                const entry = {
                    widgetId,
                    query: query,
                    resolve,
                    reject,
                    controller,
                };
                pending.set(widgetId, entry);
                queue.push(entry);
                if (batchWindowMs > 0) {
                    setTimeout(() => processQueue(), batchWindowMs);
                }
                else {
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
            const promises = [];
            for (const entry of pending.values()) {
                promises.push(new Promise((resolve) => {
                    const origResolve = entry.resolve;
                    const origReject = entry.reject;
                    entry.resolve = (result) => { origResolve(result); resolve(); };
                    entry.reject = (err) => { origReject(err); resolve(); };
                }));
            }
            await Promise.all(promises);
        },
    };
}
//# sourceMappingURL=query-coordinator.js.map