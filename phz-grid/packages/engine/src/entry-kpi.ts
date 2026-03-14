/**
 * @phozart/engine/kpi — KPI-focused entry point
 *
 * KPI definitions, status computation, score providers, and scorecard utilities.
 */

// KPI Definitions & Registry
export { createKPIRegistry } from './kpi.js';
export type {
  KPIDefinition, KPIBreakdown, KPIDataSource, KPIAlertConfig,
  KPIScoreResponse, KPIBreakdownScore, KPIRegistry,
  KPIUnit, KPIDirection, KPIDeltaComparison, KPICardStyle, KPIColorScheme, KPIThresholds,
} from './kpi.js';

// Status Engine
export { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS, STATUS_ICONS, resolveThresholdValue, computeStatusFromBands } from './status.js';
export type { StatusResult, Delta, ClassifiedScore, ClassifiedBreakdown } from './status.js';

// Default Score Provider
export { createDefaultScoreProvider } from './score-provider.js';
export type { ScoreProviderConfig } from './score-provider.js';

// Widget Data Resolver (KPI score provider type)
export type { KPIScoreProvider } from './widget-resolver.js';
