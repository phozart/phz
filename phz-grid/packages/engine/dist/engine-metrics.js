/**
 * @phozart/phz-engine — EngineMetrics Performance Monitor
 *
 * Records timing data for all major BIEngine operations.
 * Zero overhead when disabled (no instance created).
 */
export class EngineMetrics {
    durations = new Map();
    nextId = 0;
    activeTimers = new Map();
    listeners = [];
    startTimer(operation) {
        const handle = {
            _id: this.nextId++,
            _operation: operation,
            _start: performance.now(),
        };
        this.activeTimers.set(handle._id, handle);
        return handle;
    }
    stopTimer(handle) {
        if (!this.activeTimers.has(handle._id))
            return;
        this.activeTimers.delete(handle._id);
        const duration = performance.now() - handle._start;
        this.recordInternal(handle._operation, duration);
    }
    record(operation, duration) {
        this.recordInternal(operation, duration);
    }
    recordInternal(operation, duration) {
        let arr = this.durations.get(operation);
        if (!arr) {
            arr = [];
            this.durations.set(operation, arr);
        }
        arr.push(duration);
        this.notifyListeners(operation, duration);
    }
    notifyListeners(operation, duration) {
        for (const listener of this.listeners) {
            if (duration > listener.threshold) {
                listener.callback(operation, duration);
            }
        }
    }
    getMetrics() {
        const snapshot = {};
        for (const [operation, values] of this.durations) {
            if (values.length === 0)
                continue;
            const sorted = [...values].sort((a, b) => a - b);
            const count = sorted.length;
            const min = sorted[0];
            const max = sorted[count - 1];
            const sum = sorted.reduce((s, v) => s + v, 0);
            const avg = sum / count;
            const p95Index = Math.ceil(0.95 * count) - 1;
            const p95 = sorted[Math.max(0, p95Index)];
            snapshot[operation] = { count, min, max, avg, p95 };
        }
        return snapshot;
    }
    reset() {
        this.durations.clear();
        this.activeTimers.clear();
    }
    onSlowOperation(threshold, callback) {
        const listener = { threshold, callback };
        this.listeners.push(listener);
        return () => {
            const idx = this.listeners.indexOf(listener);
            if (idx >= 0)
                this.listeners.splice(idx, 1);
        };
    }
}
//# sourceMappingURL=engine-metrics.js.map