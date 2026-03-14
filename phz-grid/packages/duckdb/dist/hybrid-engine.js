/**
 * @phozart/duckdb — Hybrid Engine
 *
 * Auto-switches between JS row model pipeline (< threshold rows) and
 * DuckDB SQL push-down (>= threshold rows).
 */
const DEFAULT_THRESHOLD = 10_000;
export class HybridEngine {
    threshold;
    forceDuckDB;
    forceJS;
    constructor(config) {
        this.threshold = config?.threshold ?? DEFAULT_THRESHOLD;
        this.forceDuckDB = config?.forceDuckDB ?? false;
        this.forceJS = config?.forceJS ?? false;
    }
    shouldUseDuckDB(rowCount) {
        if (this.forceJS)
            return false;
        if (this.forceDuckDB)
            return true;
        return rowCount >= this.threshold;
    }
    getMode(rowCount) {
        return this.shouldUseDuckDB(rowCount) ? 'duckdb' : 'js';
    }
    getThreshold() {
        return this.threshold;
    }
    setThreshold(threshold) {
        this.threshold = threshold;
    }
}
//# sourceMappingURL=hybrid-engine.js.map