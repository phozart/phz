/**
 * @phozart/phz-engine/kpi — KPI-focused entry point
 *
 * KPI definitions, status computation, score providers, and scorecard utilities.
 */
export { createKPIRegistry } from './kpi.js';
export type { KPIDefinition, KPIBreakdown, KPIDataSource, KPIAlertConfig, KPIScoreResponse, KPIBreakdownScore, KPIRegistry, KPIUnit, KPIDirection, KPIDeltaComparison, KPICardStyle, KPIColorScheme, KPIThresholds, } from './kpi.js';
export { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS, STATUS_ICONS, resolveThresholdValue, computeStatusFromBands } from './status.js';
export type { StatusResult, Delta, ClassifiedScore, ClassifiedBreakdown } from './status.js';
export { createDefaultScoreProvider } from './score-provider.js';
export type { ScoreProviderConfig } from './score-provider.js';
export type { KPIScoreProvider } from './widget-resolver.js';
//# sourceMappingURL=entry-kpi.d.ts.map