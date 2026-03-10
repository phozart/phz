/**
 * @phozart/phz-engine — MetricsController
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

export class MetricsController implements ReactiveController {
  private host: ReactiveControllerHost;
  private engineMetrics: EngineMetrics;
  private refreshIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | undefined;

  metrics: MetricsSnapshot = {};

  constructor(host: ReactiveControllerHost, config: MetricsControllerConfig) {
    this.host = host;
    this.engineMetrics = config.engineMetrics;
    this.refreshIntervalMs = config.refreshIntervalMs ?? 2000;
    host.addController(this);
  }

  hostConnected(): void {
    this.refresh();
    if (this.refreshIntervalMs > 0) {
      this.intervalId = setInterval(() => this.refresh(), this.refreshIntervalMs);
    }
  }

  hostDisconnected(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  refresh(): void {
    this.metrics = this.engineMetrics.getMetrics();
    this.host.requestUpdate();
  }
}
