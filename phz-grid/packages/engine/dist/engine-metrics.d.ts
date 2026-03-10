/**
 * @phozart/phz-engine — EngineMetrics Performance Monitor
 *
 * Records timing data for all major BIEngine operations.
 * Zero overhead when disabled (no instance created).
 */
export type OperationCategory = 'aggregation' | 'pivot' | 'filter' | 'expression_eval' | 'expression_compile' | 'widget_resolve' | 'data_load' | 'render';
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
export declare class EngineMetrics {
    private durations;
    private nextId;
    private activeTimers;
    private listeners;
    startTimer(operation: OperationCategory): TimerHandle;
    stopTimer(handle: TimerHandle): void;
    record(operation: OperationCategory, duration: number): void;
    private recordInternal;
    private notifyListeners;
    getMetrics(): MetricsSnapshot;
    reset(): void;
    onSlowOperation(threshold: number, callback: (operation: OperationCategory, duration: number) => void): () => void;
}
//# sourceMappingURL=engine-metrics.d.ts.map