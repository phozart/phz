/**
 * @phozart/phz-engine — EngineMetrics Performance Monitor
 *
 * Records timing data for all major BIEngine operations.
 * Zero overhead when disabled (no instance created).
 */

export type OperationCategory =
  | 'aggregation'
  | 'pivot'
  | 'filter'
  | 'expression_eval'
  | 'expression_compile'
  | 'widget_resolve'
  | 'data_load'
  | 'render';

export interface OperationStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p95: number;
}

export type MetricsSnapshot = Partial<Record<OperationCategory, OperationStats>>;

export interface TimerHandle {
  readonly _id: number;
  readonly _operation: OperationCategory;
  readonly _start: number;
}

interface SlowOperationListener {
  threshold: number;
  callback: (operation: OperationCategory, duration: number) => void;
}

export class EngineMetrics {
  private durations = new Map<OperationCategory, number[]>();
  private nextId = 0;
  private activeTimers = new Map<number, TimerHandle>();
  private listeners: SlowOperationListener[] = [];

  startTimer(operation: OperationCategory): TimerHandle {
    const handle: TimerHandle = {
      _id: this.nextId++,
      _operation: operation,
      _start: performance.now(),
    };
    this.activeTimers.set(handle._id, handle);
    return handle;
  }

  stopTimer(handle: TimerHandle): void {
    if (!this.activeTimers.has(handle._id)) return;
    this.activeTimers.delete(handle._id);
    const duration = performance.now() - handle._start;
    this.recordInternal(handle._operation, duration);
  }

  record(operation: OperationCategory, duration: number): void {
    this.recordInternal(operation, duration);
  }

  private recordInternal(operation: OperationCategory, duration: number): void {
    let arr = this.durations.get(operation);
    if (!arr) {
      arr = [];
      this.durations.set(operation, arr);
    }
    arr.push(duration);
    this.notifyListeners(operation, duration);
  }

  private notifyListeners(operation: OperationCategory, duration: number): void {
    for (const listener of this.listeners) {
      if (duration > listener.threshold) {
        listener.callback(operation, duration);
      }
    }
  }

  getMetrics(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {};
    for (const [operation, values] of this.durations) {
      if (values.length === 0) continue;
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

  reset(): void {
    this.durations.clear();
    this.activeTimers.clear();
  }

  onSlowOperation(
    threshold: number,
    callback: (operation: OperationCategory, duration: number) => void,
  ): () => void {
    const listener: SlowOperationListener = { threshold, callback };
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }
}
