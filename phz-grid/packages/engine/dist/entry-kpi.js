/**
 * @phozart/engine/kpi — KPI-focused entry point
 *
 * KPI definitions, status computation, score providers, and scorecard utilities.
 */
// KPI Definitions & Registry
export { createKPIRegistry } from './kpi.js';
// Status Engine
export { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS, STATUS_ICONS, resolveThresholdValue, computeStatusFromBands } from './status.js';
// Default Score Provider
export { createDefaultScoreProvider } from './score-provider.js';
//# sourceMappingURL=entry-kpi.js.map