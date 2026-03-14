/**
 * @phozart/engine — MetricsController
 *
 * Lit reactive controller that exposes EngineMetrics data
 * to admin UI components with configurable auto-refresh.
 */
export class MetricsController {
    host;
    engineMetrics;
    refreshIntervalMs;
    intervalId;
    metrics = {};
    constructor(host, config) {
        this.host = host;
        this.engineMetrics = config.engineMetrics;
        this.refreshIntervalMs = config.refreshIntervalMs ?? 2000;
        host.addController(this);
    }
    hostConnected() {
        this.refresh();
        if (this.refreshIntervalMs > 0) {
            this.intervalId = setInterval(() => this.refresh(), this.refreshIntervalMs);
        }
    }
    hostDisconnected() {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    refresh() {
        this.metrics = this.engineMetrics.getMetrics();
        this.host.requestUpdate();
    }
}
//# sourceMappingURL=metrics-controller.js.map