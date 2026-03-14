/**
 * @phozart/engine — MetricsController
 *
 * Lit reactive controller that exposes EngineMetrics data
 * to admin UI components with configurable auto-refresh.
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { EngineMetrics, MetricsSnapshot } from './engine-metrics.js';
export interface MetricsControllerConfig {
    engineMetrics: EngineMetrics;
    refreshIntervalMs?: number;
}
export declare class MetricsController implements ReactiveController {
    private host;
    private engineMetrics;
    private refreshIntervalMs;
    private intervalId;
    metrics: MetricsSnapshot;
    constructor(host: ReactiveControllerHost, config: MetricsControllerConfig);
    hostConnected(): void;
    hostDisconnected(): void;
    refresh(): void;
}
//# sourceMappingURL=metrics-controller.d.ts.map