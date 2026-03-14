/**
 * @phozart/duckdb — Hybrid Engine
 *
 * Auto-switches between JS row model pipeline (< threshold rows) and
 * DuckDB SQL push-down (>= threshold rows).
 */

export interface HybridEngineConfig {
  threshold?: number;
  forceDuckDB?: boolean;
  forceJS?: boolean;
}

export type EngineMode = 'js' | 'duckdb';

const DEFAULT_THRESHOLD = 10_000;

export class HybridEngine {
  private threshold: number;
  private forceDuckDB: boolean;
  private forceJS: boolean;

  constructor(config?: HybridEngineConfig) {
    this.threshold = config?.threshold ?? DEFAULT_THRESHOLD;
    this.forceDuckDB = config?.forceDuckDB ?? false;
    this.forceJS = config?.forceJS ?? false;
  }

  shouldUseDuckDB(rowCount: number): boolean {
    if (this.forceJS) return false;
    if (this.forceDuckDB) return true;
    return rowCount >= this.threshold;
  }

  getMode(rowCount: number): EngineMode {
    return this.shouldUseDuckDB(rowCount) ? 'duckdb' : 'js';
  }

  getThreshold(): number {
    return this.threshold;
  }

  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }
}
