/**
 * @phozart/phz-duckdb — Hybrid Engine
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
export declare class HybridEngine {
    private threshold;
    private forceDuckDB;
    private forceJS;
    constructor(config?: HybridEngineConfig);
    shouldUseDuckDB(rowCount: number): boolean;
    getMode(rowCount: number): EngineMode;
    getThreshold(): number;
    setThreshold(threshold: number): void;
}
//# sourceMappingURL=hybrid-engine.d.ts.map